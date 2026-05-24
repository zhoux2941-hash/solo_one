from ryu.lib import hub


class TrafficEngine:
    def __init__(self, logger, controller):
        self.logger = logger
        self.controller = controller
        self.port_stats = {}
        self.link_utilization = {}
        self.monitor_thread = None
        self.link_capacity = 1000000000
        self.load_threshold = 0.7
        self.path_cache = {}
        self.cache_version = 0
        self.cache_timeout = 2.0

    def start_monitoring(self):
        self.monitor_thread = hub.spawn(self._monitor_loop)
        self.logger.info("Traffic engineering monitoring started")

    def _monitor_loop(self):
        while True:
            self._request_port_stats()
            hub.sleep(2)
            if self._is_utilization_changed():
                self.cache_version += 1
                self.path_cache.clear()

    def _request_port_stats(self):
        for dpid, datapath in self.controller.datapaths.items():
            ofproto = datapath.ofproto
            parser = datapath.ofproto_parser
            req = parser.OFPPortStatsRequest(datapath, 0, ofproto.OFPP_ANY)
            datapath.send_msg(req)

    def _is_utilization_changed(self):
        return len(self.link_utilization) > 0

    def update_port_stats(self, dpid, stats):
        if dpid not in self.port_stats:
            self.port_stats[dpid] = {}

        changed = False
        for stat in stats:
            port_no = stat.port_no
            if port_no > 0xfff0:
                continue

            if port_no in self.port_stats[dpid]:
                prev = self.port_stats[dpid][port_no]
                tx_bytes_diff = stat.tx_bytes - prev['tx_bytes']
                rx_bytes_diff = stat.rx_bytes - prev['rx_bytes']

                utilization = (tx_bytes_diff + rx_bytes_diff) * 8 / (self.link_capacity * 2)
                utilization = min(utilization, 1.0)

                if abs(utilization - prev['utilization']) > 0.05:
                    changed = True

                self.port_stats[dpid][port_no] = {
                    'tx_bytes': stat.tx_bytes,
                    'rx_bytes': stat.rx_bytes,
                    'utilization': utilization
                }
            else:
                self.port_stats[dpid][port_no] = {
                    'tx_bytes': stat.tx_bytes,
                    'rx_bytes': stat.rx_bytes,
                    'utilization': 0.0
                }

        if changed:
            self._update_link_utilization()
            self.cache_version += 1
            self.path_cache.clear()

    def _update_link_utilization(self):
        topology = self.controller.topology_manager
        for link in topology.links.values():
            src_dpid = link['src_dpid']
            src_port = link['src_port']
            dst_dpid = link['dst_dpid']
            dst_port = link['dst_port']

            util = 0.0
            if src_dpid in self.port_stats and src_port in self.port_stats[src_dpid]:
                util = max(util, self.port_stats[src_dpid][src_port]['utilization'])
            if dst_dpid in self.port_stats and dst_port in self.port_stats[dst_dpid]:
                util = max(util, self.port_stats[dst_dpid][dst_port]['utilization'])

            link_key = (src_dpid, dst_dpid)
            self.link_utilization[link_key] = util
            topology.update_link_utilization(src_dpid, dst_dpid, util)

    def get_best_path(self, src_dpid, dst_dpid, topology):
        cache_key = (src_dpid, dst_dpid, self.cache_version)
        if cache_key in self.path_cache:
            return self.path_cache[cache_key]

        paths = self.controller.routing_engine.get_k_shortest_paths(
            src_dpid, dst_dpid, k=3
        )

        if not paths:
            path = self.controller.routing_engine.dijkstra_shortest_path(
                src_dpid, dst_dpid
            )
            self.path_cache[cache_key] = path
            return path

        best_path = None
        min_score = float('inf')

        for path in paths:
            score = self._calculate_path_score(path)
            if score < min_score:
                min_score = score
                best_path = path

        self.path_cache[cache_key] = best_path
        return best_path

    def _calculate_path_score(self, path):
        if not path or len(path) < 2:
            return float('inf')

        score = 0
        max_util = 0

        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            link_key = (u, v)
            reverse_key = (v, u)
            util = self.link_utilization.get(link_key, 0)
            util = max(util, self.link_utilization.get(reverse_key, 0))
            max_util = max(max_util, util)
            score += (1 + util * 2)

        if max_util > self.load_threshold:
            score *= 1.5

        return score

    def get_congested_links(self):
        congested = []
        for link_key, util in self.link_utilization.items():
            if util > self.load_threshold:
                congested.append({
                    'src_dpid': link_key[0],
                    'dst_dpid': link_key[1],
                    'utilization': util
                })
        return congested

    def get_port_stats_json(self):
        result = {}
        for dpid, ports in self.port_stats.items():
            result[dpid] = []
            for port_no, stats in ports.items():
                result[dpid].append({
                    'port_no': port_no,
                    'tx_bytes': stats['tx_bytes'],
                    'rx_bytes': stats['rx_bytes'],
                    'utilization': stats['utilization']
                })
        return result
