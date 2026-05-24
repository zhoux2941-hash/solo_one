from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import CONFIG_DISPATCHER, MAIN_DISPATCHER
from ryu.controller.handler import set_ev_cls
from ryu.ofproto import ofproto_v1_3
from ryu.lib.packet import packet
from ryu.lib.packet import ethernet
from ryu.lib.packet import lldp
from ryu.lib import hub
import time

from topology_manager import TopologyManager
from routing import RoutingEngine
from flow_manager import FlowManager
from traffic_engineering import TrafficEngine
from rest_api import RESTAPI
from int_telemetry import INTManager


class SDNController(app_manager.RyuApp):
    OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]

    def __init__(self, *args, **kwargs):
        super(SDNController, self).__init__(*args, **kwargs)
        self.topology_manager = TopologyManager(self.logger)
        self.routing_engine = RoutingEngine(self.logger)
        self.flow_manager = FlowManager(self.logger)
        self.traffic_engine = TrafficEngine(self.logger, self)
        self.rest_api = RESTAPI(self)
        self.int_manager = INTManager(self.logger, self)
        self.datapaths = {}
        self.lldp_thread = None
        self.topology_check_thread = None
        self.active_flows = {}
        self.lldp_interval = 0.5
        self.lldp_ttl = 2
        self.int_metadata = {}

    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        datapath = ev.msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        self.datapaths[datapath.id] = datapath
        self.logger.info(f"Switch connected: dpid={datapath.id}")

        match = parser.OFPMatch()
        actions = [parser.OFPActionOutput(ofproto.OFPP_CONTROLLER,
                                          ofproto.OFPCML_NO_BUFFER)]
        self.flow_manager.add_flow(datapath, 0, match, actions, idle_timeout=0, hard_timeout=0)

        self._request_port_desc(datapath)
        self.topology_manager.add_switch(datapath.id)
        self.int_manager.install_int_flows(datapath)

    def _request_port_desc(self, datapath):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        req = parser.OFPPortDescStatsRequest(datapath, 0)
        datapath.send_msg(req)

    @set_ev_cls(ofp_event.EventOFPPortDescStatsReply, MAIN_DISPATCHER)
    def port_desc_stats_reply_handler(self, ev):
        dpid = ev.msg.datapath.id
        for port in ev.msg.body:
            if port.port_no <= 0xfff0:
                self.topology_manager.add_port(dpid, port.port_no, str(port.hw_addr))

    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def _packet_in_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        in_port = msg.match['in_port']

        pkt = packet.Packet(msg.data)
        eth = pkt.get_protocol(ethernet.ethernet)

        if eth.ethertype == ethernet.ETH_TYPE_LLDP:
            self._handle_lldp(pkt, datapath.id, in_port)
            return

        self._handle_data_packet(pkt, datapath, in_port, msg.data)

    def _handle_lldp(self, pkt, dpid, in_port):
        lldp_pkt = pkt.get_protocol(lldp.lldp)
        if lldp_pkt:
            src_dpid = int(lldp_pkt.tlvs[0].id.replace('dpid:', ''))
            src_port = int(lldp_pkt.tlvs[1].id.replace('port:', ''))
            self.topology_manager.add_link(src_dpid, src_port, dpid, in_port)
            if self.topology_manager.is_topology_changed():
                self.routing_engine.update_topology(self.topology_manager.get_topology())
                self._trigger_reroute_for_failed_edge((src_dpid, dpid))

    def _handle_data_packet(self, pkt, datapath, in_port, data):
        eth = pkt.get_protocol(ethernet.ethernet)
        dst = eth.dst
        src = eth.src
        flow_key = (src, dst)

        self.topology_manager.add_host(src, datapath.id, in_port)
        self._collect_int_metadata(flow_key, datapath.id, in_port, data)

        if dst in self.topology_manager.hosts:
            path = self.traffic_engine.get_best_path(
                datapath.id,
                self.topology_manager.hosts[dst]['dpid'],
                self.topology_manager.get_topology()
            )
            if path:
                self._install_path_flow(path, src, dst, datapath, in_port, data)
                self._record_flow_telemetry(flow_key, datapath.id, 
                                           self.topology_manager.hosts[dst]['dpid'], path)
        else:
            self._flood_packet(datapath, in_port, data)

    def _collect_int_metadata(self, flow_key, dpid, in_port, data):
        if flow_key not in self.int_metadata:
            self.int_metadata[flow_key] = []
        queue_depth, latency = self.int_manager._get_port_queue_info(dpid, in_port)
        metadata = {
            'switch_id': dpid,
            'port_no': in_port,
            'queue_depth': queue_depth,
            'latency_us': int(latency * 1000000),
            'timestamp': time.time()
        }
        self.int_metadata[flow_key].append(metadata)
        if len(self.int_metadata[flow_key]) > 50:
            self.int_metadata[flow_key] = self.int_metadata[flow_key][-50:]

    def _record_flow_telemetry(self, flow_key, src_dpid, dst_dpid, path):
        if flow_key in self.int_metadata:
            path_metadata = []
            seen_switches = set()
            for meta in reversed(self.int_metadata[flow_key]):
                if meta['switch_id'] in path and meta['switch_id'] not in seen_switches:
                    path_metadata.append(meta)
                    seen_switches.add(meta['switch_id'])
                    if len(seen_switches) >= len(path):
                        break
            if path_metadata:
                self.int_manager.record_flow_telemetry(flow_key, src_dpid, dst_dpid, path_metadata)
            self.int_metadata[flow_key] = []

    def _install_path_flow(self, path, src_mac, dst_mac, ingress_dp, in_port, data):
        flow_key = (src_mac, dst_mac)
        self.active_flows[flow_key] = {
            'path': path,
            'src_dpid': ingress_dp.id,
            'dst_dpid': self.topology_manager.hosts[dst_mac]['dpid']
        }
        for i, dpid in enumerate(path):
            if dpid not in self.datapaths:
                continue
            datapath = self.datapaths[dpid]
            parser = datapath.ofproto_parser

            if i < len(path) - 1:
                next_dpid = path[i + 1]
                out_port = self.topology_manager.get_link_port(dpid, next_dpid)
            else:
                out_port = self.topology_manager.hosts[dst_mac]['port']

            if out_port is None:
                continue

            match = parser.OFPMatch(
                eth_src=src_mac,
                eth_dst=dst_mac
            )
            actions = [parser.OFPActionOutput(out_port)]
            self.flow_manager.add_flow(datapath, 10, match, actions, idle_timeout=300)

            if dpid == ingress_dp.id:
                self._send_packet_out(datapath, in_port, out_port, data)

    def _trigger_reroute_for_failed_edge(self, failed_edge):
        if not failed_edge:
            return
        flows_to_reroute = []
        for flow_key, flow_info in self.active_flows.items():
            path = flow_info['path']
            if self.routing_engine._path_contains_edge(path, failed_edge):
                flows_to_reroute.append(flow_key)
        for flow_key in flows_to_reroute:
            src_mac, dst_mac = flow_key
            flow_info = self.active_flows[flow_key]
            new_path = self.routing_engine.get_backup_path(
                flow_info['src_dpid'],
                flow_info['dst_dpid'],
                failed_edge
            )
            if new_path:
                self.logger.info(f"Fast reroute: {src_mac}->{dst_mac} via new path")
                self._reinstall_flow_path(new_path, src_mac, dst_mac)
            else:
                self.logger.warning(f"No backup path for {src_mac}->{dst_mac}")
                del self.active_flows[flow_key]

    def _reinstall_flow_path(self, path, src_mac, dst_mac):
        flow_key = (src_mac, dst_mac)
        if flow_key in self.active_flows:
            self.active_flows[flow_key]['path'] = path
        for i, dpid in enumerate(path):
            if dpid not in self.datapaths:
                continue
            datapath = self.datapaths[dpid]
            parser = datapath.ofproto_parser

            if i < len(path) - 1:
                next_dpid = path[i + 1]
                out_port = self.topology_manager.get_link_port(dpid, next_dpid)
            else:
                if dst_mac in self.topology_manager.hosts:
                    out_port = self.topology_manager.hosts[dst_mac]['port']
                else:
                    continue

            if out_port is None:
                continue

            match = parser.OFPMatch(
                eth_src=src_mac,
                eth_dst=dst_mac
            )
            actions = [parser.OFPActionOutput(out_port)]
            self.flow_manager.add_flow(datapath, 10, match, actions, idle_timeout=300)

    def _flood_packet(self, datapath, in_port, data):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        actions = [parser.OFPActionOutput(ofproto.OFPP_FLOOD)]
        out = parser.OFPPacketOut(
            datapath=datapath,
            buffer_id=ofproto.OFP_NO_BUFFER,
            in_port=in_port,
            actions=actions,
            data=data
        )
        datapath.send_msg(out)

    def _send_packet_out(self, datapath, in_port, out_port, data):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        actions = [parser.OFPActionOutput(out_port)]
        out = parser.OFPPacketOut(
            datapath=datapath,
            buffer_id=ofproto.OFP_NO_BUFFER,
            in_port=in_port,
            actions=actions,
            data=data
        )
        datapath.send_msg(out)

    def start(self):
        super(SDNController, self).start()
        self.lldp_thread = hub.spawn(self._send_lldp_loop)
        self.topology_check_thread = hub.spawn(self._topology_check_loop)
        self.traffic_engine.start_monitoring()
        self.rest_api.start()
        self.int_manager.start()

    def _topology_check_loop(self):
        while True:
            failed_edges = self.topology_manager.check_aged_out_links()
            if failed_edges:
                self.routing_engine.update_topology(self.topology_manager.get_topology())
                for edge in failed_edges:
                    self._trigger_reroute_for_failed_edge(edge)
            self.topology_manager.check_aged_out_switches()
            hub.sleep(1.0)

    def _send_lldp_loop(self):
        while True:
            self._send_lldp_packets()
            hub.sleep(self.lldp_interval)

    def _send_lldp_packets(self):
        for dpid, datapath in self.datapaths.items():
            ports = self.topology_manager.get_switch_ports(dpid)
            for port_no in ports:
                self._send_lldp(datapath, port_no)

    def _send_lldp(self, datapath, port_no):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        pkt = packet.Packet()
        pkt.add_protocol(ethernet.ethernet(
            ethertype=ethernet.ETH_TYPE_LLDP,
            dst=lldp.LLDP_MULTICAST,
            src=f"00:00:00:00:00:{datapath.id:02x}"
        ))

        tlvs = [
            lldp.ChassisID(subtype=lldp.ChassisID.SUB_LOCALLY_ASSIGNED,
                           id=f"dpid:{datapath.id}"),
            lldp.PortID(subtype=lldp.PortID.SUB_LOCALLY_ASSIGNED,
                        id=f"port:{port_no}"),
            lldp.TTL(ttl=self.lldp_ttl),
            lldp.End()
        ]
        pkt.add_protocol(lldp.lldp(tlvs))
        pkt.serialize()

        actions = [parser.OFPActionOutput(port_no)]
        out = parser.OFPPacketOut(
            datapath=datapath,
            buffer_id=ofproto.OFP_NO_BUFFER,
            in_port=ofproto.OFPP_CONTROLLER,
            actions=actions,
            data=pkt.data
        )
        datapath.send_msg(out)

    @set_ev_cls(ofp_event.EventOFPFlowStatsReply, MAIN_DISPATCHER)
    def flow_stats_reply_handler(self, ev):
        dpid = ev.msg.datapath.id
        self.flow_manager.update_flow_stats(dpid, ev.msg.body)

    @set_ev_cls(ofp_event.EventOFPPortStatsReply, MAIN_DISPATCHER)
    def port_stats_reply_handler(self, ev):
        dpid = ev.msg.datapath.id
        self.traffic_engine.update_port_stats(dpid, ev.msg.body)

    @set_ev_cls(ofp_event.EventOFPQueueStatsReply, MAIN_DISPATCHER)
    def queue_stats_reply_handler(self, ev):
        self.int_manager.handle_queue_stats_reply(ev.msg)

    @set_ev_cls(ofp_event.EventOFPPortStatus, MAIN_DISPATCHER)
    def port_status_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto

        if msg.reason == ofproto.OFPPR_DELETE:
            self.logger.info(f"Port {msg.desc.port_no} deleted on switch {datapath.id}")

    @set_ev_cls(ofp_event.EventOFPStateChange,
                [CONFIG_DISPATCHER, MAIN_DISPATCHER])
    def state_change_handler(self, ev):
        datapath = ev.datapath
        if ev.state == CONFIG_DISPATCHER:
            self.logger.info(f"Switch connected: dpid={datapath.id}")
        elif ev.state == MAIN_DISPATCHER:
            self.logger.info(f"Switch ready: dpid={datapath.id}")

    def close(self):
        for dpid in list(self.datapaths.keys()):
            self.topology_manager.remove_switch(dpid)
        super(SDNController, self).close()
