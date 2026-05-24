from flask import Flask, jsonify, request
from ryu.lib import hub
import threading


class RESTAPI:
    def __init__(self, controller):
        self.controller = controller
        self.app = Flask(__name__)
        self._setup_routes()

    def _setup_routes(self):
        @self.app.route('/topology', methods=['GET'])
        def get_topology():
            return jsonify(self.controller.topology_manager.get_topology_json())

        @self.app.route('/flows', methods=['GET'])
        def get_flows():
            dpid = request.args.get('dpid', type=int)
            flows = self.controller.flow_manager.get_flow_stats(dpid)
            return jsonify(flows)

        @self.app.route('/flows', methods=['POST'])
        def add_flow():
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            dpid = data.get('dpid')
            if not dpid or dpid not in self.controller.datapaths:
                return jsonify({'error': 'Invalid switch dpid'}), 400

            datapath = self.controller.datapaths[dpid]
            parser = datapath.ofproto_parser

            priority = data.get('priority', 10)
            match_fields = data.get('match', {})
            actions_data = data.get('actions', [])

            match = parser.OFPMatch(**match_fields)

            actions = []
            for action in actions_data:
                action_type = action.get('type')
                if action_type == 'output':
                    actions.append(parser.OFPActionOutput(action.get('port')))

            idle_timeout = data.get('idle_timeout', 30)
            hard_timeout = data.get('hard_timeout', 0)

            self.controller.flow_manager.add_flow(
                datapath, priority, match, actions,
                idle_timeout=idle_timeout, hard_timeout=hard_timeout
            )

            return jsonify({'status': 'success', 'message': 'Flow added'})

        @self.app.route('/flows', methods=['DELETE'])
        def delete_flow():
            data = request.json
            dpid = data.get('dpid')

            if not dpid or dpid not in self.controller.datapaths:
                return jsonify({'error': 'Invalid switch dpid'}), 400

            datapath = self.controller.datapaths[dpid]
            self.controller.flow_manager.delete_flow(datapath)

            return jsonify({'status': 'success', 'message': 'Flows deleted'})

        @self.app.route('/stats/ports', methods=['GET'])
        def get_port_stats():
            return jsonify(self.controller.traffic_engine.get_port_stats_json())

        @self.app.route('/stats/congested', methods=['GET'])
        def get_congested_links():
            return jsonify(self.controller.traffic_engine.get_congested_links())

        @self.app.route('/routing/path', methods=['GET'])
        def get_path():
            src = request.args.get('src', type=int)
            dst = request.args.get('dst', type=int)

            if not src or not dst:
                return jsonify({'error': 'src and dst are required'}), 400

            path = self.controller.routing_engine.dijkstra_shortest_path(src, dst)
            paths = self.controller.routing_engine.get_k_shortest_paths(src, dst, k=3)

            return jsonify({
                'shortest_path': path,
                'alternative_paths': paths
            })

        @self.app.route('/switches', methods=['GET'])
        def get_switches():
            switches = []
            for dpid in self.controller.datapaths.keys():
                switches.append({
                    'dpid': dpid,
                    'ports': self.controller.topology_manager.get_switch_ports(dpid)
                })
            return jsonify(switches)

        @self.app.route('/hosts', methods=['GET'])
        def get_hosts():
            hosts = []
            for mac, info in self.controller.topology_manager.hosts.items():
                hosts.append({
                    'mac': mac,
                    'dpid': info['dpid'],
                    'port': info['port']
                })
            return jsonify(hosts)

        @self.app.route('/health', methods=['GET'])
        def health_check():
            return jsonify({
                'status': 'ok',
                'switches_connected': len(self.controller.datapaths)
            })

        @self.app.route('/int/telemetry', methods=['GET'])
        def get_int_telemetry():
            limit = request.args.get('limit', default=100, type=int)
            flow_key = request.args.get('flow_key')
            if flow_key:
                flow_key_tuple = tuple(flow_key.split(',')) if ',' in flow_key else flow_key
                data = self.controller.int_manager.get_flow_telemetry(flow_key_tuple)
            else:
                data = self.controller.int_manager.get_latest_telemetry(limit)
            return jsonify(data)

        @self.app.route('/int/latency', methods=['GET'])
        def get_int_latency():
            flow_key = request.args.get('flow_key')
            if flow_key:
                flow_key_tuple = tuple(flow_key.split(',')) if ',' in flow_key else flow_key
                data = self.controller.int_manager.get_flow_latency_stats(flow_key_tuple)
            else:
                data = self.controller.int_manager.get_flow_latency_stats()
            return jsonify(data)

        @self.app.route('/int/queues', methods=['GET'])
        def get_int_queues():
            dpid = request.args.get('dpid', type=int)
            data = self.controller.int_manager.get_switch_queue_stats(dpid)
            return jsonify(data)

        @self.app.route('/int/congested', methods=['GET'])
        def get_int_congested():
            data = self.controller.int_manager.get_congested_ports()
            return jsonify(data)

        @self.app.route('/int/thresholds', methods=['POST'])
        def set_int_thresholds():
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            max_queue_depth = data.get('max_queue_depth')
            latency_threshold_ms = data.get('latency_threshold_ms')
            self.controller.int_manager.set_thresholds(
                max_queue_depth=max_queue_depth,
                latency_threshold_ms=latency_threshold_ms
            )
            return jsonify({
                'status': 'success',
                'max_queue_depth': self.controller.int_manager.max_queue_depth_threshold,
                'latency_threshold_ms': self.controller.int_manager.latency_threshold_ms
            })

        @self.app.route('/int/toggle', methods=['POST'])
        def toggle_int():
            data = request.json
            enabled = data.get('enabled', True) if data else True
            self.controller.int_manager.toggle_int(enabled)
            return jsonify({
                'status': 'success',
                'int_enabled': self.controller.int_manager.int_enabled
            })

    def start(self):
        def run_server():
            self.app.run(host='0.0.0.0', port=8080, debug=False, use_reloader=False)

        thread = threading.Thread(target=run_server)
        thread.daemon = True
        thread.start()
        self.controller.logger.info("REST API server started on port 8080")
