#!/usr/bin/env python3
"""Tests for TCP reassembly with receive-window-based logic"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from python.analyzer import TcpStream, TcpReassembler, PacketInfo


def make_packet(seq, data, flags=0, timestamp=1.0, src_ip="10.0.0.1", dst_ip="10.0.0.2",
                src_port=1234, dst_port=80):
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
        flags=flags,
        stream_id="",
        is_fragmented=False,
        is_retransmit=False,
    )


class TestTcpStreamInOrder:
    """Test in-order segment delivery"""

    def test_sequential_segments(self):
        """Packets arrive in order: should reassemble directly"""
        stream = TcpStream("test", timeout_ms=5000)
        syn = make_packet(1000, b'', flags=0x02)
        stream.add_segment(syn)

        stream.add_segment(make_packet(1001, b'HELLO'))
        stream.add_segment(make_packet(1006, b'WORLD'))

        data = stream.get_reassembled_data(2.0)
        assert data == b'HELLOWORLD', f"Expected HELLOWORLD, got {data}"

    def test_empty_data_ignored(self):
        """Packets with empty payload (ACK-only) should be ignored"""
        stream = TcpStream("test", timeout_ms=5000)
        stream.add_segment(make_packet(1000, b'', flags=0x02))
        stream.add_segment(make_packet(1001, b'DATA'))
        stream.add_segment(make_packet(1005, b'', flags=0x10))

        data = stream.get_reassembled_data(2.0)
        assert data == b'DATA'


class TestTcpStreamOutOfOrder:
    """Test out-of-order segment handling - the core fix"""

    def test_simple_reorder(self):
        """Segments arrive out of order: 2nd then 1st - should buffer and release when gap filled"""
        stream = TcpStream("test", timeout_ms=5000)
        stream.add_segment(make_packet(1000, b'', flags=0x02))

        stream.add_segment(make_packet(1006, b'WORLD'))

        assert not stream.has_ready_data(), "No data should be ready before gap is filled"

        stream.add_segment(make_packet(1001, b'HELLO'))

        data = stream.get_reassembled_data(2.0)
        assert data == b'HELLOWORLD', f"Expected HELLOWORLD, got {data}"

    def test_three_segment_reorder(self):
        """Three segments arrive completely reversed: 3rd, 2nd, 1st"""
        stream = TcpStream("test", timeout_ms=5000)
        stream.add_segment(make_packet(1000, b'', flags=0x02))

        stream.add_segment(make_packet(1011, b'!!!'))
        assert not stream.has_ready_data()

        stream.add_segment(make_packet(1006, b'WORLD'))
        assert not stream.has_ready_data()

        stream.add_segment(make_packet(1001, b'HELLO'))

        data = stream.get_reassembled_data(2.0)
        assert data == b'HELLOWORLD!!!', f"Expected HELLOWORLD!!!, got {data}"

    def test_gap_in_middle(self):
        """Segments 1 and 3 arrive, 2 is missing - only segment 1 should be available"""
        stream = TcpStream("test", timeout_ms=5000)
        stream.add_segment(make_packet(1000, b'', flags=0x02))

        stream.add_segment(make_packet(1001, b'AAA'))
        stream.add_segment(make_packet(1007, b'CCC'))

        data = stream.get_reassembled_data(2.0)
        assert data == b'AAA', f"Expected AAA, got {data}"

        assert stream.gap_size() > 0, "There should be a gap"

    def test_gap_filled_later(self):
        """Missing middle segment arrives later - all data becomes available"""
        stream = TcpStream("test", timeout_ms=5000)
        stream.add_segment(make_packet(1000, b'', flags=0x02))

        stream.add_segment(make_packet(1001, b'AAA'))
        stream.add_segment(make_packet(1007, b'CCC'))

        data1 = stream.get_reassembled_data(2.0)
        assert data1 == b'AAA'

        stream.add_segment(make_packet(1004, b'BBB'))

        data2 = stream.get_reassembled_data(2.0)
        assert data2 == b'BBBCCC', f"Expected BBBCCC, got {data2}"

    def test_late_arrival_fills_multiple_gaps(self):
        """One segment fills the gap, causing chain release of multiple buffered segments"""
        stream = TcpStream("test", timeout_ms=5000)
        stream.add_segment(make_packet(1000, b'', flags=0x02))

        stream.add_segment(make_packet(1004, b'BBB'))
        stream.add_segment(make_packet(1007, b'CCC'))
        stream.add_segment(make_packet(1010, b'DDD'))

        assert not stream.has_ready_data()

        stream.add_segment(make_packet(1001, b'AAA'))

        data = stream.get_reassembled_data(2.0)
        assert data == b'AAABBBCCCDDD', f"Expected AAABBBCCCDDD, got {data}"


class TestTcpStreamOverlap:
    """Test overlapping segment handling (retransmissions with partial overlap)"""

    def test_partial_overlap(self):
        """Retransmitted segment partially overlaps with already-received data"""
        stream = TcpStream("test", timeout_ms=5000)
        stream.add_segment(make_packet(1000, b'', flags=0x02))

        stream.add_segment(make_packet(1001, b'HELLO'))

        stream.add_segment(make_packet(1004, b'LOWORLD'))

        data = stream.get_reassembled_data(2.0)
        assert data == b'HELLOWORLD', f"Expected HELLOWORLD, got {data}"

    def test_complete_duplicate(self):
        """Exact duplicate segment should be detected as retransmit"""
        stream = TcpStream("test", timeout_ms=5000)
        stream.add_segment(make_packet(1000, b'', flags=0x02))

        stream.add_segment(make_packet(1001, b'HELLO'))
        stream.add_segment(make_packet(1001, b'HELLO'))

        assert stream.retransmit_count == 1

        data = stream.get_reassembled_data(2.0)
        assert data == b'HELLO'


class TestTcpStreamRstFin:
    """Test RST and FIN handling"""

    def test_rst_closes_stream(self):
        """RST packet should close the stream"""
        stream = TcpStream("test", timeout_ms=5000)
        stream.add_segment(make_packet(1000, b'', flags=0x02))
        stream.add_segment(make_packet(1001, b'DATA'))
        stream.add_segment(make_packet(1005, b'', flags=0x04))

        assert stream.has_fin is True

    def test_fin_marks_close(self):
        """FIN packet should mark stream as closing"""
        stream = TcpStream("test", timeout_ms=5000)
        stream.add_segment(make_packet(1000, b'', flags=0x02))
        stream.add_segment(make_packet(1001, b'DATA', flags=0x01))

        assert stream.has_fin is True


class TestTcpReassembler:
    """Test the TcpReassembler manager"""

    def test_multiple_streams(self):
        """Multiple concurrent streams should be tracked independently"""
        reasm = TcpReassembler(timeout_ms=5000)

        pkt_syn_a = make_packet(1000, b'', flags=0x02, src_ip="10.0.0.1", src_port=1001)
        pkt_syn_b = make_packet(2000, b'', flags=0x02, src_ip="10.0.0.2", src_port=1002)

        reasm.process_packet(pkt_syn_a)
        reasm.process_packet(pkt_syn_b)

        reasm.process_packet(make_packet(1001, b'AAA', src_ip="10.0.0.1", src_port=1001))
        reasm.process_packet(make_packet(2001, b'BBB', src_ip="10.0.0.2", src_port=1002))

        stream_a_id = reasm._get_stream_id(pkt_syn_a)
        stream_b_id = reasm._get_stream_id(pkt_syn_b)

        data_a = reasm.get_reassembled_data(stream_a_id, 2.0)
        data_b = reasm.get_reassembled_data(stream_b_id, 2.0)

        assert data_a == b'AAA', f"Stream A: expected AAA, got {data_a}"
        assert data_b == b'BBB', f"Stream B: expected BBB, got {data_b}"

    def test_stream_has_ready_data(self):
        """stream_has_ready_data should correctly report buffered data availability"""
        reasm = TcpReassembler(timeout_ms=5000)

        syn = make_packet(1000, b'', flags=0x02)
        reasm.process_packet(syn)

        stream_id = reasm._get_stream_id(syn)

        assert not reasm.stream_has_ready_data(stream_id)

        reasm.process_packet(make_packet(1005, b'LATE'))
        assert not reasm.stream_has_ready_data(stream_id)

        reasm.process_packet(make_packet(1001, b'FIRST'))
        assert reasm.stream_has_ready_data(stream_id)


class TestTcpStreamTimeout:
    """Test timeout handling for missing segments"""

    def test_timeout_skips_gap(self):
        """When a gap times out, the reassembler should skip to the next available segment"""
        stream = TcpStream("test", timeout_ms=1000)
        stream.add_segment(make_packet(1000, b'', flags=0x02, timestamp=1.0))

        stream.add_segment(make_packet(1005, b'LATE', timestamp=1.1))

        assert not stream.has_ready_data()

        data = stream.get_reassembled_data(3.0)
        assert data == b'LATE', f"After timeout, expected LATE, got {data}"
        assert stream.timeout_count == 1


if __name__ == "__main__":
    import traceback

    test_classes = [
        TestTcpStreamInOrder,
        TestTcpStreamOutOfOrder,
        TestTcpStreamOverlap,
        TestTcpStreamRstFin,
        TestTcpReassembler,
        TestTcpStreamTimeout,
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
                traceback.print_exc()
                failed += 1

    print(f"\nResults: {passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)
