class FlowManager:
    def __init__(self, logger):
        self.logger = logger
        self.flow_stats = {}

    def add_flow(self, datapath, priority, match, actions, buffer_id=None,
                 idle_timeout=30, hard_timeout=0, table_id=0):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS,
                                             actions)]

        if buffer_id:
            mod = parser.OFPFlowMod(
                datapath=datapath,
                buffer_id=buffer_id,
                priority=priority,
                match=match,
                instructions=inst,
                idle_timeout=idle_timeout,
                hard_timeout=hard_timeout,
                table_id=table_id
            )
        else:
            mod = parser.OFPFlowMod(
                datapath=datapath,
                priority=priority,
                match=match,
                instructions=inst,
                idle_timeout=idle_timeout,
                hard_timeout=hard_timeout,
                table_id=table_id
            )

        datapath.send_msg(mod)
        self.logger.debug(f"Flow added: dpid={datapath.id}, priority={priority}, match={match}")

    def delete_flow(self, datapath, match=None, priority=None, table_id=0):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        mod = parser.OFPFlowMod(
            datapath=datapath,
            command=ofproto.OFPFC_DELETE,
            out_port=ofproto.OFPP_ANY,
            out_group=ofproto.OFPG_ANY,
            match=match if match else parser.OFPMatch(),
            priority=priority if priority else 0,
            table_id=table_id
        )
        datapath.send_msg(mod)
        self.logger.info(f"Flow deleted: dpid={datapath.id}")

    def add_flow_l2(self, datapath, priority, eth_src=None, eth_dst=None,
                    in_port=None, actions=None, idle_timeout=30):
        parser = datapath.ofproto_parser
        match_fields = {}

        if eth_src:
            match_fields['eth_src'] = eth_src
        if eth_dst:
            match_fields['eth_dst'] = eth_dst
        if in_port:
            match_fields['in_port'] = in_port

        match = parser.OFPMatch(**match_fields)
        self.add_flow(datapath, priority, match, actions, idle_timeout=idle_timeout)

    def add_flow_l3(self, datapath, priority, eth_src=None, eth_dst=None,
                    ipv4_src=None, ipv4_dst=None, ip_proto=None,
                    in_port=None, actions=None, idle_timeout=30):
        parser = datapath.ofproto_parser
        match_fields = {}
        match_fields['eth_type'] = 0x0800

        if eth_src:
            match_fields['eth_src'] = eth_src
        if eth_dst:
            match_fields['eth_dst'] = eth_dst
        if ipv4_src:
            match_fields['ipv4_src'] = ipv4_src
        if ipv4_dst:
            match_fields['ipv4_dst'] = ipv4_dst
        if ip_proto:
            match_fields['ip_proto'] = ip_proto
        if in_port:
            match_fields['in_port'] = in_port

        match = parser.OFPMatch(**match_fields)
        self.add_flow(datapath, priority, match, actions, idle_timeout=idle_timeout)

    def add_flow_tcp(self, datapath, priority, eth_src=None, eth_dst=None,
                     ipv4_src=None, ipv4_dst=None, tcp_src=None, tcp_dst=None,
                     in_port=None, actions=None, idle_timeout=30):
        parser = datapath.ofproto_parser
        match_fields = {}
        match_fields['eth_type'] = 0x0800
        match_fields['ip_proto'] = 6

        if eth_src:
            match_fields['eth_src'] = eth_src
        if eth_dst:
            match_fields['eth_dst'] = eth_dst
        if ipv4_src:
            match_fields['ipv4_src'] = ipv4_src
        if ipv4_dst:
            match_fields['ipv4_dst'] = ipv4_dst
        if tcp_src:
            match_fields['tcp_src'] = tcp_src
        if tcp_dst:
            match_fields['tcp_dst'] = tcp_dst
        if in_port:
            match_fields['in_port'] = in_port

        match = parser.OFPMatch(**match_fields)
        self.add_flow(datapath, priority, match, actions, idle_timeout=idle_timeout)

    def add_flow_udp(self, datapath, priority, eth_src=None, eth_dst=None,
                     ipv4_src=None, ipv4_dst=None, udp_src=None, udp_dst=None,
                     in_port=None, actions=None, idle_timeout=30):
        parser = datapath.ofproto_parser
        match_fields = {}
        match_fields['eth_type'] = 0x0800
        match_fields['ip_proto'] = 17

        if eth_src:
            match_fields['eth_src'] = eth_src
        if eth_dst:
            match_fields['eth_dst'] = eth_dst
        if ipv4_src:
            match_fields['ipv4_src'] = ipv4_src
        if ipv4_dst:
            match_fields['ipv4_dst'] = ipv4_dst
        if udp_src:
            match_fields['udp_src'] = udp_src
        if udp_dst:
            match_fields['udp_dst'] = udp_dst
        if in_port:
            match_fields['in_port'] = in_port

        match = parser.OFPMatch(**match_fields)
        self.add_flow(datapath, priority, match, actions, idle_timeout=idle_timeout)

    def update_flow_stats(self, dpid, stats):
        self.flow_stats[dpid] = []
        for stat in stats:
            self.flow_stats[dpid].append({
                'table_id': stat.table_id,
                'priority': stat.priority,
                'match': str(stat.match),
                'packet_count': stat.packet_count,
                'byte_count': stat.byte_count,
                'idle_timeout': stat.idle_timeout,
                'hard_timeout': stat.hard_timeout
            })

    def get_flow_stats(self, dpid=None):
        if dpid:
            return self.flow_stats.get(dpid, [])
        return self.flow_stats
