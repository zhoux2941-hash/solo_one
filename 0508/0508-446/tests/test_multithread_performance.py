#!/usr/bin/env python3
"""Performance and correctness tests for optimized multi-threaded PcapAnalyzer"""

import sys
import os
import time
import random
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from python.analyzer import (
    StreamThreadPoolPcapAnalyzer, 
    PacketInfo,
    TcpStream,
    TcpReassembler
)
from python.protocol_description import ProtocolDescription, FieldDescription, FieldType, ByteOrder


def make_tcp_packet(stream_id: str, seq: int, data: bytes, timestamp: float,
                    src_ip: str, dst_ip: str, src_port: int, dst_port: int):
    return PacketInfo(
        packet_id=0,
        timestamp=timestamp,
        captured_length=len(data),
        original_length=len(data),
        data=data,
        src_ip=src_ip,
        dst_ip=dst_ip,
        src_port=src_port,
        dst_port=dst_port,
        protocol=6,
        seq=seq,
        ack=0,
        flags=0,
        stream_id=stream_id,
        is_fragmented=False,
        is_retransmit=False,
    )


class TestStreamAffinity:
    """Test that stream affinity routing works correctly"""

    def test_stream_affinity_basic(self):
        """Same stream should always route to same worker"""
        analyzer = StreamThreadPoolPcapAnalyzer(num_threads=8)

        stream_id = "192.168.1.1:1234-192.168.1.2:80"

        worker1 = analyzer._get_worker_for_stream(stream_id)
        worker2 = analyzer._get_worker_for_stream(stream_id)
        worker3 = analyzer._get_worker_for_stream(stream_id)

        assert worker1 == worker2 == worker3, "Same stream must route to same worker"
        assert 0 <= worker1 < 8, "Worker index out of bounds"

    def test_different_streams_may_route_differently(self):
        """Different streams should distribute across workers"""
        analyzer = StreamThreadPoolPcapAnalyzer(num_threads=4)

        workers = set()
        for i in range(100):
            stream_id = f"10.0.0.{i}:{1000+i}-10.0.1.1:80"
            workers.add(analyzer._get_worker_for_stream(stream_id))

        assert len(workers) > 1, "Streams should distribute across multiple workers"

    def test_worker_index_in_range(self):
        """Worker indices should always be within valid range"""
        analyzer = StreamThreadPoolPcapAnalyzer(num_threads=4)

        for i in range(1000):
            stream_id = f"stream-{i}-{i*7}-{i*13}"
            worker = analyzer._get_worker_for_stream(stream_id)
            assert 0 <= worker < 4, f"Worker {worker} out of range [0,4)"


class TestWorkerContext:
    """Test per-worker state isolation"""

    def test_worker_isolation(self):
        """Each worker should have its own reassembler and stats engine"""
        from python.analyzer import WorkerContext, ProtocolParser
        from python.protocol_description import ProtocolDescription

        proto = ProtocolDescription(
            name="test",
            display_name="Test",
            short_name="test",
            default_port_tcp=1234,
            fields=[]
        )
        protocols = {"test": (proto, ProtocolParser(proto))}
        port_map = {1234: "test"}

        w1 = WorkerContext(0, protocols, port_map)
        w2 = WorkerContext(1, protocols, port_map)

        assert w1.reassembler is not w2.reassembler
        assert w1.stats_engine is not w2.stats_engine
        assert w1.packet_queue is not w2.packet_queue


class TestBatchDispatch:
    """Test batch packet dispatching"""

    def test_batch_dispatch_worker_routing(self):
        """Packets in a batch should be routed to correct workers"""
        analyzer = StreamThreadPoolPcapAnalyzer(num_threads=2, batch_size=10)

        packets = []
        for i in range(5):
            stream_id = f"10.0.0.{i}:{1000+i}-10.0.1.1:80"
            pkt = PacketInfo(
                packet_id=i,
                timestamp=1.0,
                captured_length=10,
                original_length=10,
                data=b'X'*10,
                src_ip=f"10.0.0.{i}",
                dst_ip="10.0.1.1",
                src_port=1000+i,
                dst_port=80,
                protocol=6,
                seq=0,
                ack=0,
                flags=0,
                stream_id=stream_id,
            )
            packets.append(pkt)

        for pkt in packets:
            expected_worker = analyzer._get_worker_for_stream(pkt.stream_id)
            assert 0 <= expected_worker < 2


class TestReportMerging:
    """Test merging worker reports"""

    def test_merge_basic(self):
        """Basic report merging should accumulate counts"""
        analyzer = StreamThreadPoolPcapAnalyzer(num_threads=2)
        analyzer.workers = []

        from python.analyzer import WorkerContext, StatisticsEngine, ProtocolStats
        from collections import defaultdict

        class FakeWorker:
            def __init__(self):
                self.stats_engine = StatisticsEngine()

        w1 = FakeWorker()
        w2 = FakeWorker()
        analyzer.workers = [w1, w2]

        for w in [w1, w2]:
            w.stats_engine.total_packets = 100
            w.stats_engine.total_bytes = 1000

        analyzer._total_packets = 200
        analyzer._total_bytes = 2000

        report = analyzer._merge_worker_reports("test.pcap")

        assert report.total_packets_processed == 200
        assert report.total_bytes_processed == 2000


class TestStreamLevelReassembly:
    """Test that TCP reassembly works correctly with stream affinity"""

    def test_single_stream_reassembly_correctness(self):
        """TCP reassembly should work correctly when stream is handled by single worker"""
        stream = TcpStream("test", timeout_ms=5000)

        syn = PacketInfo(
            packet_id=0, timestamp=1.0, captured_length=0, original_length=0,
            data=b'', src_ip="1.1.1.1", dst_ip="2.2.2.2",
            src_port=1234, dst_port=80, protocol=6,
            seq=1000, ack=0, flags=0x02, stream_id="test"
        )
        stream.add_segment(syn)

        out_of_order = PacketInfo(
            packet_id=1, timestamp=1.1, captured_length=5, original_length=5,
            data=b'WORLD', src_ip="1.1.1.1", dst_ip="2.2.2.2",
            src_port=1234, dst_port=80, protocol=6,
            seq=1006, ack=0, flags=0, stream_id="test"
        )
        stream.add_segment(out_of_order)

        assert not stream.has_ready_data(), "Should not have ready data with gap"

        in_order = PacketInfo(
            packet_id=2, timestamp=1.2, captured_length=5, original_length=5,
            data=b'HELLO', src_ip="1.1.1.1", dst_ip="2.2.2.2",
            src_port=1234, dst_port=80, protocol=6,
            seq=1001, ack=0, flags=0, stream_id="test"
        )
        stream.add_segment(in_order)

        data = stream.get_reassembled_data(2.0)
        assert data == b'HELLOWORLD', f"Expected HELLOWORLD, got {data}"


class TestMultiStreamCorrectness:
    """Test that multiple concurrent streams are handled correctly"""

    def test_multiple_streams_independent(self):
        """Multiple streams should be reassembled independently"""
        reasm = TcpReassembler(timeout_ms=5000)

        stream1_id = "10.0.0.1:1001-10.0.0.2:80"
        stream2_id = "10.0.0.3:1002-10.0.0.4:80"

        for i, (stream_id, base_seq) in enumerate([(stream1_id, 1000), (stream2_id, 2000)]):
            syn = PacketInfo(
                packet_id=i*10, timestamp=1.0, captured_length=0, original_length=0,
                data=b'', src_ip=f"10.0.0.{i*2+1}", dst_ip=f"10.0.0.{i*2+2}",
                src_port=1001+i, dst_port=80, protocol=6,
                seq=base_seq, ack=0, flags=0x02, stream_id=stream_id
            )
            reasm.process_packet(syn)

        data1_ooo = PacketInfo(
            packet_id=100, timestamp=1.1, captured_length=5, original_length=5,
            data=b'WORLD', src_ip="10.0.0.1", dst_ip="10.0.0.2",
            src_port=1001, dst_port=80, protocol=6,
            seq=1006, ack=0, flags=0, stream_id=stream1_id
        )
        reasm.process_packet(data1_ooo)

        data2_ooo = PacketInfo(
            packet_id=101, timestamp=1.1, captured_length=5, original_length=5,
            data=b'FOOBA', src_ip="10.0.0.3", dst_ip="10.0.0.4",
            src_port=1002, dst_port=80, protocol=6,
            seq=2006, ack=0, flags=0, stream_id=stream2_id
        )
        reasm.process_packet(data2_ooo)

        data1_in = PacketInfo(
            packet_id=102, timestamp=1.2, captured_length=5, original_length=5,
            data=b'HELLO', src_ip="10.0.0.1", dst_ip="10.0.0.2",
            src_port=1001, dst_port=80, protocol=6,
            seq=1001, ack=0, flags=0, stream_id=stream1_id
        )
        reasm.process_packet(data1_in)

        data1 = reasm.get_reassembled_data(stream1_id, 2.0)
        data2 = reasm.get_reassembled_data(stream2_id, 2.0)

        assert data1 == b'HELLOWORLD', f"Stream1: expected HELLOWORLD, got {data1}"
        assert data2 == b'', f"Stream2: expected empty (still has gap), got {data2}"


def benchmark_stream_routing():
    """Simple benchmark for stream routing performance"""
    analyzer = StreamThreadPoolPcapAnalyzer(num_threads=8)
    
    num_streams = 10000
    start = time.time()
    
    for i in range(num_streams):
        stream_id = f"192.168.{i//256}.{i%256}:{10000+i}-10.0.0.1:443"
        _ = analyzer._get_worker_for_stream(stream_id)
    
    elapsed = time.time() - start
    print(f"Stream routing benchmark: {num_streams} streams in {elapsed*1000:.2f}ms")
    print(f"  Throughput: {num_streams/elapsed:.0f} streams/sec")
    return elapsed


def run_tests():
    test_classes = [
        TestStreamAffinity,
        TestWorkerContext,
        TestBatchDispatch,
        TestReportMerging,
        TestStreamLevelReassembly,
        TestMultiStreamCorrectness,
    ]

    passed = 0
    failed = 0

    for cls in test_classes:
        instance = cls()
        methods = [m for m in dir(instance) if m.startswith('test_')]
        for method_name in methods:
            try:
                getattr(instance, method_name)()
                print(f"  PASS  {cls.__name__}.{method_name}")
                passed += 1
            except Exception as e:
                print(f"  FAIL  {cls.__name__}.{method_name}: {e}")
                import traceback
                traceback.print_exc()
                failed += 1

    print(f"\nUnit Tests: {passed} passed, {failed} failed")

    print("\n--- Benchmarks ---")
    benchmark_stream_routing()

    return failed == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
