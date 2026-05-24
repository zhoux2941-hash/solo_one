import networkx as nx
import time


class TopologyManager:
    def __init__(self, logger):
        self.logger = logger
        self.switches = {}
        self.links = {}
        self.hosts = {}
        self.graph = nx.Graph()
        self.link_last_seen = {}
        self.switch_last_seen = {}
        self.link_ageout = 3.0
        self.topology_changed = False

    def add_switch(self, dpid):
        if dpid not in self.switches:
            self.switches[dpid] = {'ports': {}}
            self.graph.add_node(dpid, type='switch')
            self.topology_changed = True
            self.logger.info(f"Added switch: dpid={dpid}")
        self.switch_last_seen[dpid] = time.time()

    def remove_switch(self, dpid):
        if dpid in self.switches:
            del self.switches[dpid]
            self.switch_last_seen.pop(dpid, None)
            links_to_remove = []
            for link_key, link in self.links.items():
                if link['src_dpid'] == dpid or link['dst_dpid'] == dpid:
                    links_to_remove.append(link_key)
            for link_key in links_to_remove:
                self._remove_link_internal(link_key)
            if dpid in self.graph:
                self.graph.remove_node(dpid)
            hosts_to_remove = []
            for mac, info in self.hosts.items():
                if info['dpid'] == dpid:
                    hosts_to_remove.append(mac)
            for mac in hosts_to_remove:
                del self.hosts[mac]
                if mac in self.graph:
                    self.graph.remove_node(mac)
            self.topology_changed = True
            self.logger.info(f"Removed switch: dpid={dpid}")

    def add_port(self, dpid, port_no, hw_addr):
        if dpid in self.switches:
            self.switches[dpid]['ports'][port_no] = hw_addr

    def get_switch_ports(self, dpid):
        if dpid in self.switches:
            return list(self.switches[dpid]['ports'].keys())
        return []

    def add_link(self, src_dpid, src_port, dst_dpid, dst_port):
        link_key = tuple(sorted([(src_dpid, src_port), (dst_dpid, dst_port)]))
        self.link_last_seen[link_key] = time.time()
        if link_key not in self.links:
            self.links[link_key] = {
                'src_dpid': src_dpid,
                'src_port': src_port,
                'dst_dpid': dst_dpid,
                'dst_port': dst_port,
                'utilization': 0.0
            }
            self.graph.add_edge(src_dpid, dst_dpid, weight=1)
            self.topology_changed = True
            self.logger.info(f"Link added: {src_dpid}:{src_port} <-> {dst_dpid}:{dst_port}")

    def _remove_link_internal(self, link_key):
        if link_key in self.links:
            link = self.links[link_key]
            if self.graph.has_edge(link['src_dpid'], link['dst_dpid']):
                self.graph.remove_edge(link['src_dpid'], link['dst_dpid'])
            del self.links[link_key]
            self.link_last_seen.pop(link_key, None)
            self.topology_changed = True

    def remove_link(self, src_dpid, src_port, dst_dpid, dst_port):
        link_key = tuple(sorted([(src_dpid, src_port), (dst_dpid, dst_port)]))
        if link_key in self.links:
            link = self.links[link_key]
            self._remove_link_internal(link_key)
            self.logger.info(f"Link removed: {src_dpid}:{src_port} <-> {dst_dpid}:{dst_port}")
            return (link['src_dpid'], link['dst_dpid'])
        return None

    def check_aged_out_links(self):
        current_time = time.time()
        aged_links = []
        failed_edges = []
        for link_key, last_seen in list(self.link_last_seen.items()):
            if current_time - last_seen > self.link_ageout:
                if link_key in self.links:
                    link = self.links[link_key]
                    aged_links.append(link_key)
                    failed_edges.append((link['src_dpid'], link['dst_dpid']))
        for link_key in aged_links:
            self._remove_link_internal(link_key)
            (src, src_port), (dst, dst_port) = link_key
            self.logger.info(f"Link aged out: {src}:{src_port} <-> {dst}:{dst_port}")
        return failed_edges

    def check_aged_out_switches(self, max_age=10.0):
        current_time = time.time()
        aged_switches = []
        for dpid, last_seen in list(self.switch_last_seen.items()):
            if current_time - last_seen > max_age:
                aged_switches.append(dpid)
        for dpid in aged_switches:
            self.remove_switch(dpid)
        return aged_switches

    def is_topology_changed(self):
        changed = self.topology_changed
        self.topology_changed = False
        return changed

    def add_host(self, mac, dpid, port):
        if mac not in self.hosts:
            self.hosts[mac] = {'dpid': dpid, 'port': port}
            self.graph.add_node(mac, type='host')
            self.graph.add_edge(mac, dpid, weight=1)
            self.topology_changed = True
            self.logger.info(f"Host added: {mac} at {dpid}:{port}")

    def get_link_port(self, src_dpid, dst_dpid):
        for link_key, link in self.links.items():
            if link['src_dpid'] == src_dpid and link['dst_dpid'] == dst_dpid:
                return link['src_port']
            if link['dst_dpid'] == src_dpid and link['src_dpid'] == dst_dpid:
                return link['dst_port']
        return None

    def get_topology(self):
        return {
            'switches': list(self.switches.keys()),
            'links': list(self.links.values()),
            'hosts': self.hosts,
            'graph': self.graph
        }

    def get_topology_json(self):
        return {
            'switches': [{'dpid': dpid} for dpid in self.switches.keys()],
            'links': [
                {
                    'src_dpid': link['src_dpid'],
                    'src_port': link['src_port'],
                    'dst_dpid': link['dst_dpid'],
                    'dst_port': link['dst_port'],
                    'utilization': link.get('utilization', 0.0)
                }
                for link in self.links.values()
            ],
            'hosts': [
                {
                    'mac': mac,
                    'dpid': info['dpid'],
                    'port': info['port']
                }
                for mac, info in self.hosts.items()
            ]
        }

    def update_link_utilization(self, src_dpid, dst_dpid, utilization):
        for link_key, link in self.links.items():
            if (link['src_dpid'] == src_dpid and link['dst_dpid'] == dst_dpid) or \
               (link['dst_dpid'] == src_dpid and link['src_dpid'] == dst_dpid):
                link['utilization'] = utilization
                break
