"""
PCAP Analyzer - Python interface for offline pcap analysis
"""

import os
import sys
import struct
import socket
import threading
import queue
import time
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Callable, Any
from collections import defaultdict, Counter

from .protocol_description import ProtocolDescription


@dataclass
class PacketInfo:
    packet_id: int
    timestamp: float
    captured_length: int
    original_length: int
    data: bytes
    src_ip: str = ""
    dst_ip: str = ""
    src_port: int = 0
    dst_port: int = 0
    protocol: int = 0
    seq: int = 0
    ack: int = 0
    flags: int = 0
    stream_id: str = ""
    is_fragmented: bool = False
    is_retransmit: bool = False


@dataclass
class FieldValue:
    field_name: str
    value: Any
    offset: int
    length: int
    is_valid: bool


@dataclass
class ParsedPacket:
    info: PacketInfo
    protocol_name: str
    fields: List[FieldValue]
    warnings: List[str]
    errors: List[str]
    is_handshake: bool
    is_complete: bool


@dataclass
class SessionInfo:
    session_id: str
    protocol_name: str
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    packet_count: int
    byte_count: int
    start_time: float
    end_time: float
    is_complete: bool
    reassembly_timeout_count: int
    retransmit_count: int
    field_values: Dict[str, List[int]]
    anomalies: List[str]


@dataclass
class ProtocolStats:
    protocol_name: str
    total_packets: int
    total_bytes: int
    total_sessions: int
    field_distribution: Dict[str, Dict[int, int]]
    top_field_values: Dict[str, int]
    anomalies: List[str]
    warnings: List[str]


@dataclass
class AnalysisReport:
    analysis_start_time: float
    analysis_end_time: float
    total_packets_processed: int
    total_bytes_processed: int
    total_sessions: int
    protocol_stats: Dict[str, ProtocolStats]
    global_anomalies: List[str]
    filename: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "analysis_start_time": self.analysis_start_time,
            "analysis_end_time": self.analysis_end_time,
            "total_packets_processed": self.total_packets_processed,
            "total_bytes_processed": self.total_bytes_processed,
            "total_sessions": self.total_sessions,
            "filename": self.filename,
            "global_anomalies": self.global_anomalies,
            "protocol_stats": {
                name: {
                    "protocol_name": ps.protocol_name,
                    "total_packets": ps.total_packets,
                    "total_bytes": ps.total_bytes,
                    "total_sessions": ps.total_sessions,
                    "anomalies": ps.anomalies,
                    "warnings": ps.warnings,
                    "top_field_values": ps.top_field_values,
                }
                for name, ps in self.protocol_stats.items()
            }
        }


class TcpStream:
    """Single TCP stream with receive-window-based reassembly"""

    def __init__(self, stream_id: str, timeout_ms: int = 5000):
        self.stream_id = stream_id
        self.timeout_ms = timeout_ms
        self.expected_seq: int = 0
        self.has_syn: bool = False
        self.has_fin: bool = False
        self.last_activity: float = 0.0
        self.timeout_count: int = 0
        self.retransmit_count: int = 0
        self.out_of_order_count: int = 0
        self.total_bytes_received: int = 0
        self.total_bytes_reassembled: int = 0
        self.buffer_ready: bytearray = bytearray()
        self.receive_window: Dict[int, Dict] = {}
        self.lock = threading.Lock()

    def add_segment(self, packet: PacketInfo) -> None:
        with self.lock:
            seq = packet.seq
            seg_len = len(packet.data)
            is_fin = (packet.flags & 0x01) != 0
            is_syn = (packet.flags & 0x02) != 0
            is_rst = (packet.flags & 0x04) != 0

            if is_rst:
                self.has_fin = True
                self.last_activity = packet.timestamp
                return

            if is_syn and not self.has_syn:
                self.expected_seq = seq + 1
                self.has_syn = True
                self.last_activity = packet.timestamp
                return

            if is_fin:
                self.has_fin = True

            self.last_activity = packet.timestamp

            if seg_len == 0:
                return

            self.total_bytes_received += seg_len

            if self._is_duplicate(seq, seg_len):
                self.retransmit_count += 1
                return

            if seq == self.expected_seq:
                self.buffer_ready.extend(packet.data)
                self.expected_seq += seg_len
                self._try_chain_buffered_segments()
            elif seq > self.expected_seq:
                if seq in self.receive_window:
                    existing = self.receive_window[seq]
                    if seg_len > existing['len']:
                        self.receive_window[seq] = {
                            'seq': seq,
                            'len': seg_len,
                            'data': packet.data,
                            'timestamp': packet.timestamp,
                        }
                    else:
                        self.retransmit_count += 1
                        return
                else:
                    self.receive_window[seq] = {
                        'seq': seq,
                        'len': seg_len,
                        'data': packet.data,
                        'timestamp': packet.timestamp,
                    }
                    self.out_of_order_count += 1
            else:
                overlap = self.expected_seq - seq
                if overlap < seg_len:
                    new_bytes = seg_len - overlap
                    self.buffer_ready.extend(packet.data[overlap:])
                    self.expected_seq += new_bytes
                    self._try_chain_buffered_segments()
                else:
                    self.retransmit_count += 1

    def get_reassembled_data(self, current_time: float) -> bytes:
        with self.lock:
            self._check_timeouts(current_time)

            if not self.buffer_ready:
                return b''

            result = bytes(self.buffer_ready)
            self.total_bytes_reassembled += len(result)
            self.buffer_ready = bytearray()
            return result

    def has_ready_data(self) -> bool:
        with self.lock:
            return len(self.buffer_ready) > 0

    def gap_size(self) -> int:
        with self.lock:
            if not self.receive_window:
                return 0
            min_seq = min(self.receive_window.keys())
            if min_seq > self.expected_seq:
                return min_seq - self.expected_seq
            return 0

    def _is_duplicate(self, seq: int, seg_len: int) -> bool:
        if seq + seg_len <= self.expected_seq:
            return True
        if seq in self.receive_window and self.receive_window[seq]['len'] >= seg_len:
            return True
        return False

    def _try_chain_buffered_segments(self) -> None:
        while self.receive_window:
            if self.expected_seq in self.receive_window:
                seg = self.receive_window.pop(self.expected_seq)
                self.buffer_ready.extend(seg['data'])
                self.expected_seq += seg['len']
                continue

            min_seq = min(self.receive_window.keys())
            if min_seq < self.expected_seq:
                seg = self.receive_window.pop(min_seq)
                overlap = self.expected_seq - seg['seq']
                if overlap < seg['len']:
                    new_bytes = seg['len'] - overlap
                    self.buffer_ready.extend(seg['data'][overlap:])
                    self.expected_seq += new_bytes
                continue

            break

    def _check_timeouts(self, current_time: float) -> None:
        if not self.receive_window:
            return

        time_since_activity = (current_time - self.last_activity) * 1000
        if time_since_activity > self.timeout_ms:
            self.timeout_count += 1
            if self.receive_window:
                lowest_seq = min(self.receive_window.keys())
                self.expected_seq = lowest_seq
                self._try_chain_buffered_segments()


class TcpReassembler:
    """TCP stream reassembly manager"""

    def __init__(self, timeout_ms: int = 5000):
        self.timeout_ms = timeout_ms
        self.streams: Dict[str, TcpStream] = {}
        self.lock = threading.Lock()

    def process_packet(self, packet: PacketInfo) -> None:
        if packet.protocol != 6:
            return

        stream_id = self._get_stream_id(packet)
        with self.lock:
            if stream_id not in self.streams:
                self.streams[stream_id] = TcpStream(stream_id, self.timeout_ms)

        self.streams[stream_id].add_segment(packet)

    def get_reassembled_data(self, stream_id: str, current_time: float) -> bytes:
        with self.lock:
            stream = self.streams.get(stream_id)
            if stream is None:
                return b''

        return stream.get_reassembled_data(current_time)

    def stream_has_ready_data(self, stream_id: str) -> bool:
        with self.lock:
            stream = self.streams.get(stream_id)
            if stream is None:
                return False
            return stream.has_ready_data()

    def cleanup_stale_streams(self, current_time: float) -> None:
        timeout_sec = self.timeout_ms * 2 / 1000.0
        with self.lock:
            to_remove = [
                sid for sid, stream in self.streams.items()
                if (current_time - stream.last_activity) > timeout_sec
            ]
            for sid in to_remove:
                del self.streams[sid]

    def _get_stream_id(self, packet: PacketInfo) -> str:
        key1 = f"{packet.src_ip}:{packet.src_port}-{packet.dst_ip}:{packet.dst_port}"
        key2 = f"{packet.dst_ip}:{packet.dst_port}-{packet.src_ip}:{packet.src_port}"
        return min(key1, key2)

    def get_stream(self, stream_id: str) -> Optional[TcpStream]:
        with self.lock:
            return self.streams.get(stream_id)


class ProtocolParser:
    """Parses packets according to protocol description"""

    def __init__(self, descriptor: ProtocolDescription):
        self.descriptor = descriptor

    def parse_packet(self, packet: PacketInfo, reassembled_data: bytes = b'') -> ParsedPacket:
        result = ParsedPacket(
            info=packet,
            protocol_name=self.descriptor.name,
            fields=[],
            warnings=[],
            errors=[],
            is_handshake=False,
            is_complete=True
        )

        data = reassembled_data if (self.descriptor.requires_reassembly and reassembled_data) else packet.data
        parsed_ints: Dict[str, int] = {}
        parsed_strings: Dict[str, str] = {}
        offset = 0

        for field in self.descriptor.fields:
            if field.depends_on_field:
                if not self._check_dependency(field, parsed_ints, parsed_strings):
                    continue

            try:
                actual_offset = field.offset if field.offset >= 0 else offset

                actual_length = field.length
                if field.is_variable_length and field.length_field:
                    if field.length_field in parsed_ints:
                        actual_length = parsed_ints[field.length_field]

                fv = FieldValue(
                    field_name=field.name,
                    value=None,
                    offset=actual_offset,
                    length=actual_length,
                    is_valid=True
                )

                if actual_offset + actual_length > len(data):
                    raise ValueError(f"Not enough data for field {field.name}")

                raw_data = data[actual_offset:actual_offset + actual_length]

                fv.value = self._parse_field_value(field, raw_data)

                if isinstance(fv.value, int):
                    parsed_ints[field.name] = fv.value
                elif isinstance(fv.value, str):
                    parsed_strings[field.name] = fv.value

                if field.valid_values and isinstance(fv.value, int):
                    if fv.value not in field.valid_values:
                        fv.is_valid = False
                        result.warnings.append(
                            f"Field {field.name} has unexpected value: {fv.value}"
                        )

                if field.fixed_value:
                    if not self._check_fixed_value(field, fv.value):
                        fv.is_valid = False
                        result.warnings.append(
                            f"Field {field.name} does not match expected fixed value"
                        )

                result.fields.append(fv)

                if field.name in self.descriptor.handshake_fields:
                    result.is_handshake = True

                if field.offset < 0:
                    offset = actual_offset + actual_length

            except Exception as e:
                result.errors.append(f"Error parsing field {field.name}: {str(e)}")
                result.is_complete = False
                break

        return result

    def _parse_field_value(self, field, raw_data: bytes) -> Any:
        import struct

        type_str = field.type.value if hasattr(field.type, 'value') else str(field.type)
        byte_order = '>' if field.byte_order.value in ['big_endian', 'network', 'be'] else '<'

        if type_str == 'uint8':
            return struct.unpack('>B', raw_data)[0]
        elif type_str == 'uint16':
            return struct.unpack(f'{byte_order}H', raw_data)[0]
        elif type_str == 'uint32':
            return struct.unpack(f'{byte_order}I', raw_data)[0]
        elif type_str == 'uint64':
            return struct.unpack(f'{byte_order}Q', raw_data)[0]
        elif type_str == 'int8':
            return struct.unpack('>b', raw_data)[0]
        elif type_str == 'int16':
            return struct.unpack(f'{byte_order}h', raw_data)[0]
        elif type_str == 'int32':
            return struct.unpack(f'{byte_order}i', raw_data)[0]
        elif type_str == 'int64':
            return struct.unpack(f'{byte_order}q', raw_data)[0]
        elif type_str == 'string':
            try:
                return raw_data.rstrip(b'\x00').decode('utf-8', errors='replace')
            except:
                return raw_data.hex()
        elif type_str == 'ipv4':
            return socket.inet_ntop(socket.AF_INET, raw_data)
        elif type_str == 'ipv6':
            return socket.inet_ntop(socket.AF_INET6, raw_data)
        elif type_str == 'mac':
            return ':'.join(f'{b:02x}' for b in raw_data)
        else:
            return raw_data

    def _check_fixed_value(self, field, value) -> bool:
        if not field.fixed_value:
            return True

        expected = bytes(field.fixed_value)
        if isinstance(value, int):
            actual = value.to_bytes(len(field.fixed_value), byteorder='big')
            return actual == expected
        elif isinstance(value, bytes):
            return value == expected
        return False

    def _check_dependency(self, field, parsed_ints: Dict[str, int], parsed_strings: Dict[str, str]) -> bool:
        if not field.depends_on_condition:
            return True

        dep_val = parsed_ints.get(field.depends_on_field)
        if dep_val is None:
            return False

        import re

        match = re.search(r'==\s*(\d+)', field.depends_on_condition)
        if match:
            return dep_val == int(match.group(1))

        match = re.search(r'!=\s*(\d+)', field.depends_on_condition)
        if match:
            return dep_val != int(match.group(1))

        match = re.search(r'>\s*(\d+)', field.depends_on_condition)
        if match:
            return dep_val > int(match.group(1))

        match = re.search(r'<\s*(\d+)', field.depends_on_condition)
        if match:
            return dep_val < int(match.group(1))

        match = re.search(r'>=\s*(\d+)', field.depends_on_condition)
        if match:
            return dep_val >= int(match.group(1))

        match = re.search(r'<=\s*(\d+)', field.depends_on_condition)
        if match:
            return dep_val <= int(match.group(1))

        return True


class StatisticsEngine:
    """Collects and analyzes statistics"""

    def __init__(self):
        self.total_packets = 0
        self.total_bytes = 0
        self.start_time = 0
        self.end_time = 0
        self.protocol_stats: Dict[str, ProtocolStats] = {}
        self.sessions: Dict[str, SessionInfo] = {}
        self.lock = threading.Lock()

    def process_packet(self, parsed: ParsedPacket, descriptor: ProtocolDescription) -> None:
        with self.lock:
            self.total_packets += 1
            self.total_bytes += len(parsed.info.data)

            if self.end_time < parsed.info.timestamp:
                self.end_time = parsed.info.timestamp
            if self.start_time == 0 or self.start_time > parsed.info.timestamp:
                self.start_time = parsed.info.timestamp

            if parsed.protocol_name not in self.protocol_stats:
                self.protocol_stats[parsed.protocol_name] = ProtocolStats(
                    protocol_name=parsed.protocol_name,
                    total_packets=0,
                    total_bytes=0,
                    total_sessions=0,
                    field_distribution=defaultdict(lambda: defaultdict(int)),
                    top_field_values={},
                    anomalies=[],
                    warnings=[]
                )

            ps = self.protocol_stats[parsed.protocol_name]
            ps.total_packets += 1
            ps.total_bytes += len(parsed.info.data)

            session_id = self._get_session_id(parsed.info)
            if session_id not in self.sessions:
                self.sessions[session_id] = SessionInfo(
                    session_id=session_id,
                    protocol_name=parsed.protocol_name,
                    src_ip=parsed.info.src_ip,
                    dst_ip=parsed.info.dst_ip,
                    src_port=parsed.info.src_port,
                    dst_port=parsed.info.dst_port,
                    packet_count=0,
                    byte_count=0,
                    start_time=parsed.info.timestamp,
                    end_time=parsed.info.timestamp,
                    is_complete=False,
                    reassembly_timeout_count=0,
                    retransmit_count=0,
                    field_values=defaultdict(list),
                    anomalies=[]
                )

            session = self.sessions[session_id]
            session.packet_count += 1
            session.byte_count += len(parsed.info.data)
            session.end_time = parsed.info.timestamp

            if parsed.info.flags & 0x01:
                session.is_complete = True

            for field in parsed.fields:
                if isinstance(field.value, int):
                    ps.field_distribution[field.field_name][field.value] += 1
                    session.field_values[field.field_name].append(field.value)

            for warning in parsed.warnings:
                if 'unexpected value' in warning:
                    session.anomalies.append(warning)

            if not parsed.is_complete:
                session.anomalies.append(
                    f"Packet {parsed.info.packet_id} has incomplete parse"
                )

    def process_session(self, session: SessionInfo) -> None:
        with self.lock:
            if session.protocol_name in self.protocol_stats:
                ps = self.protocol_stats[session.protocol_name]
                ps.total_sessions += 1
                ps.anomalies.extend(session.anomalies)

                if session.reassembly_timeout_count > 5:
                    ps.anomalies.append(
                        f"Session {session.session_id} has {session.reassembly_timeout_count} reassembly timeouts"
                    )

                if not session.is_complete:
                    ps.warnings.append(
                        f"Session {session.session_id} did not complete gracefully"
                    )

    def get_report(self, filename: str = "") -> AnalysisReport:
        with self.lock:
            report = AnalysisReport(
                analysis_start_time=self.start_time,
                analysis_end_time=self.end_time,
                total_packets_processed=self.total_packets,
                total_bytes_processed=self.total_bytes,
                total_sessions=0,
                protocol_stats={},
                global_anomalies=[],
                filename=filename
            )

            for proto_name, ps in self.protocol_stats.items():
                self._calculate_top_fields(ps)
                self._detect_protocol_anomalies(ps)
                report.protocol_stats[proto_name] = ps
                report.total_sessions += ps.total_sessions

            self._detect_global_anomalies(report)
            return report

    def _get_session_id(self, info: PacketInfo) -> str:
        key1 = f"{info.src_ip}:{info.src_port}-{info.dst_ip}:{info.dst_port}"
        key2 = f"{info.dst_ip}:{info.dst_port}-{info.src_ip}:{info.src_port}"
        return min(key1, key2)

    def _calculate_top_fields(self, ps: ProtocolStats) -> None:
        for field_name, dist in ps.field_distribution.items():
            sorted_items = sorted(dist.items(), key=lambda x: x[1], reverse=True)
            for i, (value, count) in enumerate(sorted_items[:10]):
                key = f"{field_name}:{value}"
                ps.top_field_values[key] = count

    def _detect_protocol_anomalies(self, ps: ProtocolStats) -> None:
        if ps.total_packets == 0:
            return

        if ps.total_sessions > 0:
            avg = ps.total_packets / ps.total_sessions
            if avg < 2:
                ps.anomalies.append(f"Abnormally low average packets per session: {avg:.2f}")

        anomaly_rate = len(ps.anomalies) / ps.total_packets
        if anomaly_rate > 0.1:
            ps.anomalies.append(f"High anomaly rate: {anomaly_rate*100:.1f}%")

    def _detect_global_anomalies(self, report: AnalysisReport) -> None:
        total_sessions = 0
        incomplete = 0

        for ps in report.protocol_stats.values():
            total_sessions += ps.total_sessions
            for a in ps.anomalies:
                if 'did not complete' in a:
                    incomplete += 1

        if total_sessions > 0:
            rate = incomplete / total_sessions
            if rate > 0.3:
                report.global_anomalies.append(
                    f"High rate of incomplete sessions: {rate*100:.1f}%"
                )

        duration = report.analysis_end_time - report.analysis_start_time
        if duration > 0:
            pps = report.total_packets_processed / duration
            if pps > 100000:
                report.global_anomalies.append(
                    f"High packet rate: {pps:.0f} packets/sec"
                )


class WorkerContext:
    """Per-worker thread context - no shared state, zero lock contention for stream processing"""

    def __init__(self, worker_id: int, protocols: Dict[str, Tuple[ProtocolDescription, ProtocolParser]],
                 port_map: Dict[int, str], queue_size: int = 5000):
        self.worker_id = worker_id
        self.protocols = protocols
        self.port_map = port_map
        self.reassembler = TcpReassembler()
        self.stats_engine = StatisticsEngine()
        self.packet_queue: queue.Queue = queue.Queue(maxsize=queue_size)
        self.packets_processed = 0
        self.bytes_processed = 0
        self.streams_handled = set()
        self.stop_flag = False


class StreamThreadPoolPcapAnalyzer:
    """
    Optimized multi-threaded PCAP analyzer with stream-affinity scheduling.
    
    Key optimizations:
    1. Stream Affinity: Each stream is routed to a fixed worker thread (hash-based)
    2. Per-worker queues: No global queue contention
    3. Per-worker state: TcpReassembler and StatisticsEngine are thread-local
    4. Zero lock contention for stream processing (each stream handled by exactly one worker)
    5. Batch packet dispatch for reduced scheduling overhead
    """

    def __init__(self, num_threads: Optional[int] = None, batch_size: int = 64, queue_size: int = 5000):
        self.num_threads = num_threads or max(1, os.cpu_count() or 4)
        self.batch_size = batch_size
        self.queue_size = queue_size
        self.protocols: Dict[str, Tuple[ProtocolDescription, ProtocolParser]] = {}
        self.port_map: Dict[int, str] = {}
        self.workers: List[WorkerContext] = []
        self._stop_event = threading.Event()
        self._total_packets = 0
        self._total_bytes = 0

    def register_protocol(self, descriptor: ProtocolDescription) -> None:
        parser = ProtocolParser(descriptor)
        self.protocols[descriptor.name] = (descriptor, parser)
        if descriptor.default_port_tcp:
            self.port_map[descriptor.default_port_tcp] = descriptor.name
        if descriptor.default_port_udp:
            self.port_map[descriptor.default_port_udp] = descriptor.name

    def _get_worker_for_stream(self, stream_id: str) -> int:
        """Hash-based stream routing - guarantees stream affinity"""
        return hash(stream_id) % self.num_threads

    def analyze_file(
        self,
        pcap_file: str,
        progress_callback: Optional[Callable[[int, int, float], None]] = None,
        use_heuristic: bool = False
    ) -> AnalysisReport:
        if not os.path.exists(pcap_file):
            raise FileNotFoundError(f"PCAP file not found: {pcap_file}")

        self._stop_event.clear()
        self.workers = []
        for i in range(self.num_threads):
            worker = WorkerContext(i, self.protocols, self.port_map, self.queue_size)
            self.workers.append(worker)

        file_size = os.path.getsize(pcap_file)

        reader_thread = threading.Thread(
            target=self._reader_worker,
            args=(pcap_file, progress_callback, file_size)
        )

        worker_threads = []
        for i in range(self.num_threads):
            t = threading.Thread(target=self._analysis_worker, args=(i,))
            worker_threads.append(t)

        start_wall_time = time.time()

        reader_thread.start()
        for t in worker_threads:
            t.start()

        reader_thread.join()
        for t in worker_threads:
            t.join()

        final_report = self._merge_worker_reports(pcap_file)
        final_report.analysis_end_time = time.time()
        final_report.analysis_start_time = start_wall_time
        return final_report

    def _reader_worker(self, pcap_file: str, 
                       progress_callback: Optional[Callable], 
                       file_size: int) -> None:
        """
        Reader thread: reads packets from pcap, routes them to workers by stream hash.
        Uses batch dispatching for better throughput.
        """
        batch: List[List[PacketInfo]] = [[] for _ in range(self.num_threads)]
        batch_count = 0
        total_packets = 0
        total_bytes = 0

        try:
            for packet in self._iter_packets(pcap_file):
                if self._stop_event.is_set():
                    break

                total_packets += 1
                total_bytes += len(packet.data)

                worker_idx = self._get_worker_for_stream(packet.stream_id)
                batch[worker_idx].append(packet)
                batch_count += 1

                if batch_count >= self.batch_size:
                    self._dispatch_batch(batch)
                    batch = [[] for _ in range(self.num_threads)]
                    batch_count = 0

                if progress_callback and total_packets % 10000 == 0:
                    progress_callback(total_packets, total_bytes, 
                                    min(100.0, (total_bytes / file_size) * 100 if file_size > 0 else 0))

            if batch_count > 0:
                self._dispatch_batch(batch)

        finally:
            for worker in self.workers:
                worker.stop_flag = True
                try:
                    worker.packet_queue.put_nowait(None)
                except queue.Full:
                    pass

        self._total_packets = total_packets
        self._total_bytes = total_bytes

    def _dispatch_batch(self, batch: List[List[PacketInfo]]) -> None:
        """Dispatch a batch of packets to worker queues"""
        for i in range(self.num_threads):
            packets = batch[i]
            if not packets:
                continue
            try:
                self.workers[i].packet_queue.put(packets, timeout=0.1)
            except queue.Full:
                if self._stop_event.is_set():
                    return
                try:
                    self.workers[i].packet_queue.put(packets, timeout=1)
                except queue.Full:
                    pass

    def _analysis_worker(self, worker_idx: int) -> None:
        """
        Worker thread: processes packets assigned to this worker.
        No locks needed for stream processing because of stream affinity.
        """
        worker = self.workers[worker_idx]
        max_timestamp = 0.0

        while True:
            try:
                item = worker.packet_queue.get(timeout=0.2)
            except queue.Empty:
                if worker.stop_flag and worker.packet_queue.empty():
                    break
                if self._stop_event.is_set():
                    break
                continue

            if item is None:
                break

            packets: List[PacketInfo] = item

            for packet in packets:
                self._process_single_packet(worker, packet)
                if packet.timestamp > max_timestamp:
                    max_timestamp = packet.timestamp

                if worker.packets_processed % 50000 == 0:
                    worker.reassembler.cleanup_stale_streams(max_timestamp)

            worker.packet_queue.task_done()

    def _process_single_packet(self, worker: WorkerContext, packet: PacketInfo) -> None:
        """Process a single packet - no locks needed due to stream affinity"""
        worker.packets_processed += 1
        worker.bytes_processed += len(packet.data)
        worker.streams_handled.add(packet.stream_id)

        if packet.protocol == 6:
            worker.reassembler.process_packet(packet)

        protocol_name = self._identify_protocol(packet, worker.port_map)
        if not protocol_name:
            return

        descriptor, parser = worker.protocols.get(protocol_name, (None, None))
        if not parser:
            return

        reassembled_data = b''
        if descriptor.requires_reassembly and packet.protocol == 6:
            reassembled_data = worker.reassembler.get_reassembled_data(
                packet.stream_id, packet.timestamp
            )

        parsed = parser.parse_packet(packet, reassembled_data)
        parsed.protocol_name = protocol_name

        worker.stats_engine.process_packet(parsed, descriptor)

    def _identify_protocol(self, packet: PacketInfo, port_map: Dict[int, str]) -> str:
        if packet.dst_port in port_map:
            return port_map[packet.dst_port]
        if packet.src_port in port_map:
            return port_map[packet.src_port]
        return ""

    def _merge_worker_reports(self, filename: str) -> AnalysisReport:
        """Merge statistics from all worker threads into a single report"""
        merged_engine = StatisticsEngine()

        for worker in self.workers:
            for proto_name, proto_stats in worker.stats_engine.protocol_stats.items():
                if proto_name not in merged_engine.protocol_stats:
                    merged_engine.protocol_stats[proto_name] = ProtocolStats(
                        protocol_name=proto_name,
                        total_packets=0,
                        total_bytes=0,
                        total_sessions=0,
                        field_distribution=defaultdict(lambda: defaultdict(int)),
                        top_field_values={},
                        anomalies=[],
                        warnings=[]
                    )

                merged = merged_engine.protocol_stats[proto_name]
                merged.total_packets += proto_stats.total_packets
                merged.total_bytes += proto_stats.total_bytes
                merged.total_sessions += proto_stats.total_sessions
                merged.anomalies.extend(proto_stats.anomalies)
                merged.warnings.extend(proto_stats.warnings)

                for field_name, dist in proto_stats.field_distribution.items():
                    for val, count in dist.items():
                        merged.field_distribution[field_name][val] += count

            merged_engine.total_packets += worker.stats_engine.total_packets
            merged_engine.total_bytes += worker.stats_engine.total_bytes

            for sess_id, session in worker.stats_engine.sessions.items():
                if sess_id in merged_engine.sessions:
                    existing = merged_engine.sessions[sess_id]
                    existing.packet_count += session.packet_count
                    existing.byte_count += session.byte_count
                    existing.end_time = max(existing.end_time, session.end_time)
                    existing.anomalies.extend(session.anomalies)
                else:
                    merged_engine.sessions[sess_id] = session

        report = merged_engine.get_report(filename)
        report.total_packets_processed = self._total_packets
        report.total_bytes_processed = self._total_bytes
        return report

    def _iter_packets(self, pcap_file: str):
        with open(pcap_file, 'rb') as f:
            header = f.read(24)
            if len(header) < 24:
                return

            magic = struct.unpack('<I', header[:4])[0]
            if magic in (0xa1b2c3d4, 0xd4c3b2a1):
                byte_swap = (magic == 0xd4c3b2a1)
            else:
                return

            packet_id = 0
            while True:
                pkt_header = f.read(16)
                if len(pkt_header) < 16:
                    break

                ts_sec, ts_usec, incl_len, orig_len = struct.unpack('<IIII', pkt_header)
                if byte_swap:
                    ts_sec = self._swap32(ts_sec)
                    ts_usec = self._swap32(ts_usec)
                    incl_len = self._swap32(incl_len)
                    orig_len = self._swap32(orig_len)

                data = f.read(incl_len)
                if len(data) < incl_len:
                    break

                packet = self._parse_packet(packet_id, ts_sec, ts_usec, incl_len, orig_len, data)
                if packet:
                    yield packet

                packet_id += 1

    def _parse_packet(self, packet_id, ts_sec, ts_usec, incl_len, orig_len, data):
        if len(data) < 14:
            return None

        ethertype = struct.unpack('>H', data[12:14])[0]
        offset = 14

        if ethertype == 0x8100 and len(data) >= 18:
            offset += 4
            ethertype = struct.unpack('>H', data[16:18])[0]

        src_ip = dst_ip = ""
        src_port = dst_port = 0
        protocol = 0
        seq = ack = 0
        flags = 0
        payload = b''

        if ethertype == 0x0800 and len(data) >= offset + 20:
            version_ihl = data[offset]
            ihl = (version_ihl & 0x0F) * 4
            protocol = data[offset + 9]

            src_ip = socket.inet_ntop(socket.AF_INET, data[offset+12:offset+16])
            dst_ip = socket.inet_ntop(socket.AF_INET, data[offset+16:offset+20])

            offset += ihl

            if protocol == 6 and len(data) >= offset + 20:
                src_port, dst_port = struct.unpack('>HH', data[offset:offset+4])
                seq = struct.unpack('>I', data[offset+4:offset+8])[0]
                ack = struct.unpack('>I', data[offset+8:offset+12])[0]
                data_offset = (data[offset+12] >> 4) * 4
                flags = data[offset+13]
                payload = data[offset+data_offset:]

            elif protocol == 17 and len(data) >= offset + 8:
                src_port, dst_port, length, checksum = struct.unpack('>HHHH', data[offset:offset+8])
                payload = data[offset+8:offset+8+length-8] if length > 8 else b''

        stream_id = f"{src_ip}:{src_port}-{dst_ip}:{dst_port}"

        return PacketInfo(
            packet_id=packet_id,
            timestamp=ts_sec + ts_usec / 1000000.0,
            captured_length=incl_len,
            original_length=orig_len,
            data=payload,
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=src_port,
            dst_port=dst_port,
            protocol=protocol,
            seq=seq,
            ack=ack,
            flags=flags,
            stream_id=stream_id,
            is_fragmented=False,
            is_retransmit=False
        )

    def _swap32(self, val: int) -> int:
        return ((val & 0xFF) << 24) | ((val & 0xFF00) << 8) | \
               ((val & 0xFF0000) >> 8) | ((val & 0xFF000000) >> 24)

    def stop(self) -> None:
        self._stop_event.set()


PcapAnalyzer = StreamThreadPoolPcapAnalyzer

