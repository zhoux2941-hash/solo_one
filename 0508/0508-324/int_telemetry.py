import time
import threading
from collections import defaultdict, deque
import json


class INTManager:
    def __init__(self, logger, controller):
        self.logger = logger
        self.controller = controller
        self.telemetry_data = defaultdict(lambda: deque(maxlen=1000))
        self.switch_queue_stats = {}
        self.flow_latency_stats = {}
        self.int_enabled = True
        self.max_queue_depth_threshold = 50
        self.latency_threshold_ms = 50
        self.stat_lock = threading.Lock()
        self.stats_thread = None
        self.collect_interval = 1.0

    def start(self):
        self.stats_thread = threading.Thread(target=self._stats_collection_loop)
        self.stats_thread.daemon = True
        self.stats_thread.start()
        self.logger.info("INT Telemetry Manager started")

    def _stats_collection_loop(self):
        while True:
            if self.int_enabled:
                self._request_queue_stats()
            time.sleep(self.collect_interval)

    def _request_queue_stats(self):
        for dpid, datapath in self.controller.datapaths.items():
            ofproto = datapath.ofproto
            parser = datapath.ofproto_parser
            req = parser.OFPQueueStatsRequest(datapath, 0, ofproto.OFPP_ANY)
            datapath.send_msg(req)

    def handle_queue_stats_reply(self, msg):
        dpid = msg.datapath.id
        with self.stat_lock:
            if dpid not in self.switch_queue_stats:
                self.switch_queue_stats[dpid] = {}
            for stat in msg.body:
                port_no = stat.port_no
                queue_id = stat.queue_id
                self.switch_queue_stats[dpid][(port_no, queue_id)] = {
                    'tx_bytes': stat.tx_bytes,
                    'tx_packets': stat.tx_packets,
                    'tx_errors': stat.tx_errors,
                    'timestamp': time.time()
                }

    def insert_int_metadata(self, datapath, port_no, packet_data):
        if not self.int_enabled:
            return packet_data
        parser = datapath.ofproto_parser
        dpid = datapath.id
        queue_depth, latency = self._get_port_queue_info(dpid, port_no)
        int_metadata = self._build_int_metadata(dpid, port_no, queue_depth, latency)
        return packet_data + int_metadata

    def _get_port_queue_info(self, dpid, port_no):
        with self.stat_lock:
            if dpid not in self.switch_queue_stats:
                return 0, 0.0
            queue_data = self.switch_queue_stats[dpid]
            max_depth = 0
            for (p, q), stats in queue_data.items():
                if p == port_no:
                    max_depth = max(max_depth, stats.get('tx_packets', 0) % 100)
            latency = max_depth * 0.01
            return max_depth, latency

    def _build_int_metadata(self, dpid, port_no, queue_depth, latency):
        metadata = {
            'switch_id': dpid,
            'port_no': port_no,
            'queue_depth': queue_depth,
            'latency_us': int(latency * 1000000),
            'timestamp': time.time()
        }
        return json.dumps(metadata).encode('utf-8')

    def extract_int_metadata(self, pkt_data):
        try:
            idx = pkt_data.find(b'{')
            if idx != -1:
                metadata_json = pkt_data[idx:]
                metadata = json.loads(metadata_json.decode('utf-8'))
                return metadata
        except:
            pass
        return None

    def record_flow_telemetry(self, flow_key, src_dpid, dst_dpid, int_data_list):
        if not int_data_list:
            return
        total_latency = sum(d.get('latency_us', 0) for d in int_data_list)
        max_queue_depth = max(d.get('queue_depth', 0) for d in int_data_list)
        hop_count = len(int_data_list)
        record = {
            'flow_key': str(flow_key),
            'src_dpid': src_dpid,
            'dst_dpid': dst_dpid,
            'total_latency_us': total_latency,
            'max_queue_depth': max_queue_depth,
            'hop_count': hop_count,
            'path': [d.get('switch_id') for d in int_data_list],
            'timestamp': time.time()
        }
        with self.stat_lock:
            self.telemetry_data[flow_key].append(record)
            if flow_key not in self.flow_latency_stats:
                self.flow_latency_stats[flow_key] = {
                    'min_latency': total_latency,
                    'max_latency': total_latency,
                    'avg_latency': total_latency,
                    'count': 1
                }
            else:
                stats = self.flow_latency_stats[flow_key]
                stats['min_latency'] = min(stats['min_latency'], total_latency)
                stats['max_latency'] = max(stats['max_latency'], total_latency)
                stats['avg_latency'] = (stats['avg_latency'] * stats['count'] + total_latency) / (stats['count'] + 1)
                stats['count'] += 1
        self._check_alerts(flow_key, record)

    def _check_alerts(self, flow_key, record):
        alerts = []
        latency_ms = record['total_latency_us'] / 1000.0
        if latency_ms > self.latency_threshold_ms:
            alerts.append({
                'type': 'HIGH_LATENCY',
                'flow_key': str(flow_key),
                'latency_ms': latency_ms,
                'threshold_ms': self.latency_threshold_ms,
                'timestamp': record['timestamp']
            })
        if record['max_queue_depth'] > self.max_queue_depth_threshold:
            alerts.append({
                'type': 'HIGH_QUEUE_DEPTH',
                'flow_key': str(flow_key),
                'queue_depth': record['max_queue_depth'],
                'threshold': self.max_queue_depth_threshold,
                'timestamp': record['timestamp']
            })
        for alert in alerts:
            self.logger.warning(f"INT ALERT: {alert}")

    def get_flow_telemetry(self, flow_key=None):
        with self.stat_lock:
            if flow_key:
                return list(self.telemetry_data.get(flow_key, []))
            result = {}
            for k, v in self.telemetry_data.items():
                result[str(k)] = list(v)
            return result

    def get_flow_latency_stats(self, flow_key=None):
        with self.stat_lock:
            if flow_key:
                return self.flow_latency_stats.get(flow_key, {})
            return {str(k): v for k, v in self.flow_latency_stats.items()}

    def get_switch_queue_stats(self, dpid=None):
        with self.stat_lock:
            if dpid:
                return self.switch_queue_stats.get(dpid, {})
            return self.switch_queue_stats

    def get_latest_telemetry(self, limit=100):
        all_records = []
        with self.stat_lock:
            for records in self.telemetry_data.values():
                all_records.extend(records)
        all_records.sort(key=lambda x: x['timestamp'], reverse=True)
        return all_records[:limit]

    def get_congested_ports(self):
        congested = []
        with self.stat_lock:
            for dpid, port_stats in self.switch_queue_stats.items():
                for (port_no, queue_id), stats in port_stats.items():
                    depth = stats.get('tx_packets', 0) % 100
                    if depth > self.max_queue_depth_threshold * 0.7:
                        congested.append({
                            'dpid': dpid,
                            'port_no': port_no,
                            'queue_id': queue_id,
                            'queue_depth': depth,
                            'threshold': self.max_queue_depth_threshold
                        })
        return congested

    def install_int_flows(self, datapath):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        match = parser.OFPMatch()
        actions = [
            parser.OFPActionOutput(ofproto.OFPP_CONTROLLER, 65535)
        ]
        self.controller.flow_manager.add_flow(
            datapath, 5, match, actions, idle_timeout=0, hard_timeout=0
        )
        self.logger.info(f"INT monitoring flows installed on switch {datapath.id}")

    def set_thresholds(self, max_queue_depth=None, latency_threshold_ms=None):
        if max_queue_depth is not None:
            self.max_queue_depth_threshold = max_queue_depth
        if latency_threshold_ms is not None:
            self.latency_threshold_ms = latency_threshold_ms
        self.logger.info(f"INT thresholds updated: queue_depth={self.max_queue_depth_threshold}, "
                        f"latency={self.latency_threshold_ms}ms")

    def toggle_int(self, enabled):
        self.int_enabled = enabled
        self.logger.info(f"INT telemetry {'enabled' if enabled else 'disabled'}")
