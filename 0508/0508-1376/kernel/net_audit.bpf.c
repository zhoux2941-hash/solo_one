#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>
#include <bpf/bpf_tracing.h>
#include <bpf/bpf_core_read.h>
#include "../include/net_audit.h"

char LICENSE[] SEC("license") = "Dual BSD/GPL";

struct {
    __uint(type, BPF_MAP_TYPE_PERF_EVENT_ARRAY);
    __uint(key_size, sizeof(__u32));
    __uint(value_size, sizeof(__u32));
    __uint(max_entries, 1024);
} conn_events SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_PERF_EVENT_ARRAY);
    __uint(key_size, sizeof(__u32));
    __uint(value_size, sizeof(__u32));
    __uint(max_entries, 1024);
} block_events SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_PERF_EVENT_ARRAY);
    __uint(key_size, sizeof(__u32));
    __uint(value_size, sizeof(__u32));
    __uint(max_entries, 1024);
} sample_events SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_LPM_TRIE);
    __uint(key_size, sizeof(struct lpm_ip_key));
    __uint(value_size, sizeof(struct lpm_ip_value));
    __uint(max_entries, MAX_RULES);
    __uint(map_flags, BPF_F_NO_PREALLOC);
} ip_block_rules SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_LPM_TRIE);
    __uint(key_size, sizeof(struct lpm_ip_key));
    __uint(value_size, sizeof(struct lpm_ip_value));
    __uint(max_entries, 1024);
    __uint(map_flags, BPF_F_NO_PREALLOC);
} domain_block_ips SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(key_size, sizeof(struct port_rule_key));
    __uint(value_size, sizeof(struct port_rule_value));
    __uint(max_entries, MAX_RULES);
} port_block_rules SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __uint(key_size, sizeof(struct sock_pid_key));
    __uint(value_size, sizeof(struct sock_pid_value));
    __uint(max_entries, 65536);
} sock_pid_map SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(key_size, sizeof(__u32));
    __uint(value_size, sizeof(struct sample_config));
    __uint(max_entries, 1);
} sample_cfg SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __uint(key_size, sizeof(__u64));
    __uint(value_size, sizeof(__u32));
    __uint(max_entries, 65536);
} conn_tracking SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(key_size, sizeof(__u32));
    __uint(value_size, sizeof(__u64));
    __uint(max_entries, 1);
} prng_state SEC(".maps");

static __always_inline __u64 xorshift64(__u64 *state)
{
    __u64 x = *state;
    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    *state = x;
    return x;
}

static __always_inline int comm_match(const char *pkt_comm,
                                      const char *rule_comm)
{
    if (rule_comm[0] == 0)
        return 1;
    for (int i = 0; i < TASK_COMM_LEN; i++) {
        if (rule_comm[i] == 0)
            return 1;
        if (pkt_comm[i] != rule_comm[i])
            return 0;
    }
    return 1;
}

static __always_inline int check_ip_rules(struct net_packet_meta *meta,
                                          const char *comm)
{
    struct lpm_ip_key ip_key = {};
    struct lpm_ip_value *val;

    ip_key.prefixlen = 32;
    ip_key.data = meta->daddr;

    val = bpf_map_lookup_elem(&ip_block_rules, &ip_key);
    if (val && val->enabled && val->action == ACTION_DENY) {
        if (comm_match(comm, val->comm)) {
            return -1;
        }
    }

    val = bpf_map_lookup_elem(&domain_block_ips, &ip_key);
    if (val && val->enabled && val->action == ACTION_DENY) {
        return -2;
    }

    return 0;
}

static __always_inline int check_port_rules(struct net_packet_meta *meta,
                                            const char *comm)
{
    struct port_rule_key key = {};
    struct port_rule_value *val;

    key.port = meta->dport;
    key.protocol = meta->protocol;

    val = bpf_map_lookup_elem(&port_block_rules, &key);
    if (val && val->enabled && val->action == ACTION_DENY) {
        if (comm_match(comm, val->comm)) {
            return -1;
        }
    }

    return 0;
}

static __always_inline int check_access_rules(struct __sk_buff *skb,
                                              struct net_packet_meta *meta)
{
    struct sock_pid_key sp_key = {};
    struct sock_pid_value *sp_val;
    const char *comm = "";
    __u64 cookie;
    int ret;

    cookie = bpf_get_socket_cookie(skb);
    if (cookie > 0) {
        sp_key.cookie = cookie;
        sp_val = bpf_map_lookup_elem(&sock_pid_map, &sp_key);
        if (sp_val) {
            meta->pid = sp_val->pid;
            meta->uid = sp_val->uid;
            __builtin_memcpy(meta->comm, sp_val->comm, TASK_COMM_LEN);
            comm = (const char *)sp_val->comm;
        }
    }

    ret = check_ip_rules(meta, comm);
    if (ret < 0)
        return ret;

    ret = check_port_rules(meta, comm);
    if (ret < 0)
        return ret;

    return 0;
}

static __always_inline int do_sample(struct __sk_buff *skb,
                                     struct net_packet_meta *meta,
                                     void *data, void *data_end)
{
    __u32 key = 0;
    struct sample_config *cfg;
    struct sample_event se = {};
    __u16 payload_len;
    __u64 *state;
    __u64 rand_val;
    __u32 rand_key = 0;

    cfg = bpf_map_lookup_elem(&sample_cfg, &key);
    if (!cfg || !cfg->enabled)
        return 0;

    if (cfg->exclude_port_count > 0) {
        __u16 dport = bpf_ntohs(meta->dport);
        __u16 sport = bpf_ntohs(meta->sport);
        for (int i = 0; i < cfg->exclude_port_count && i < 16; i++) {
            if (dport == cfg->exclude_ports[i] || sport == cfg->exclude_ports[i]) {
                return 0;
            }
        }
    }

    if (cfg->sample_threshold == 0)
        return 0;

    state = bpf_map_lookup_elem(&prng_state, &rand_key);
    if (!state) {
        __u64 init = bpf_ktime_get_ns() ^ skb->hash;
        bpf_map_update_elem(&prng_state, &rand_key, &init, BPF_NOEXIST);
        rand_val = xorshift64(&init);
    } else {
        rand_val = xorshift64(state);
    }

    if ((rand_val & 0xFFFFFFFF) >= cfg->sample_threshold)
        return 0;

    payload_len = (__u8 *)data_end - (__u8 *)data;
    payload_len = payload_len > MAX_PAYLOAD_SIZE ? MAX_PAYLOAD_SIZE : payload_len;

    se.meta = *meta;
    se.payload_len = payload_len;
    __builtin_memcpy(se.payload, data, payload_len);

    bpf_perf_event_output(skb, &sample_events, BPF_F_CURRENT_CPU,
                          &se, sizeof(se));

    return 0;
}

SEC("tc")
int tc_ingress_handler(struct __sk_buff *skb)
{
    void *data_end = (void *)(__u64)skb->data_end;
    void *data = (void *)(__u64)skb->data;
    struct ethhdr *eth;
    struct iphdr *ip;
    struct tcphdr *tcp;
    struct udphdr *udp;
    struct net_packet_meta meta = {};
    struct connection_event ce = {};
    struct block_event be = {};
    __u64 conn_id;
    __u32 *conn_exists;
    int rule_ret;

    if (data + sizeof(struct ethhdr) > data_end)
        return TC_ACT_OK;

    eth = data;
    if (eth->h_proto != bpf_htons(ETH_P_IP))
        return TC_ACT_OK;

    if (data + sizeof(struct ethhdr) + sizeof(struct iphdr) > data_end)
        return TC_ACT_OK;

    ip = data + sizeof(struct ethhdr);

    meta.timestamp = bpf_ktime_get_ns();
    meta.saddr = ip->saddr;
    meta.daddr = ip->daddr;
    meta.protocol = ip->protocol;
    meta.pkt_size = bpf_ntohs(ip->tot_len);
    meta.tcp_flags = 0;

    if (ip->protocol == IPPROTO_TCP) {
        if (data + sizeof(struct ethhdr) + sizeof(struct iphdr) + sizeof(struct tcphdr) > data_end)
            return TC_ACT_OK;
        tcp = data + sizeof(struct ethhdr) + sizeof(struct iphdr);
        meta.sport = tcp->source;
        meta.dport = tcp->dest;
        meta.tcp_flags = *((__u8 *)tcp + 13);
        meta.seq = tcp->seq;
        meta.ack = tcp->ack_seq;
    } else if (ip->protocol == IPPROTO_UDP) {
        if (data + sizeof(struct ethhdr) + sizeof(struct iphdr) + sizeof(struct udphdr) > data_end)
            return TC_ACT_OK;
        udp = data + sizeof(struct ethhdr) + sizeof(struct iphdr);
        meta.sport = udp->source;
        meta.dport = udp->dest;
    } else {
        meta.sport = 0;
        meta.dport = 0;
    }

    rule_ret = check_access_rules(skb, &meta);

    conn_id = ((__u64)meta.saddr << 32) | ((__u64)meta.daddr ^ (__u64)meta.sport ^ (__u64)meta.dport);
    conn_exists = bpf_map_lookup_elem(&conn_tracking, &conn_id);
    if (!conn_exists) {
        __u32 val = 1;
        bpf_map_update_elem(&conn_tracking, &conn_id, &val, BPF_ANY);

        ce.meta = meta;
        ce.direction = 0;
        ce.event_type = EVENT_NEW_CONNECTION;
        bpf_perf_event_output(skb, &conn_events, BPF_F_CURRENT_CPU,
                              &ce, sizeof(ce));
    }

    if (rule_ret < 0) {
        be.meta = meta;
        be.rule_type = (rule_ret == -2) ? RULE_DOMAIN_BLOCK : RULE_IP_BLOCK;
        be.rule_id = 0;
        __builtin_memcpy(be.reason, "Access denied by policy", 23);
        bpf_perf_event_output(skb, &block_events, BPF_F_CURRENT_CPU,
                              &be, sizeof(be));
        return TC_ACT_SHOT;
    }

    do_sample(skb, &meta, data, data_end);

    return TC_ACT_OK;
}

SEC("tc")
int tc_egress_handler(struct __sk_buff *skb)
{
    void *data_end = (void *)(__u64)skb->data_end;
    void *data = (void *)(__u64)skb->data;
    struct ethhdr *eth;
    struct iphdr *ip;
    struct tcphdr *tcp;
    struct udphdr *udp;
    struct net_packet_meta meta = {};
    struct connection_event ce = {};
    struct block_event be = {};
    __u64 conn_id;
    __u32 *conn_exists;
    int rule_ret;

    if (data + sizeof(struct ethhdr) > data_end)
        return TC_ACT_OK;

    eth = data;
    if (eth->h_proto != bpf_htons(ETH_P_IP))
        return TC_ACT_OK;

    if (data + sizeof(struct ethhdr) + sizeof(struct iphdr) > data_end)
        return TC_ACT_OK;

    ip = data + sizeof(struct ethhdr);

    meta.timestamp = bpf_ktime_get_ns();
    meta.saddr = ip->saddr;
    meta.daddr = ip->daddr;
    meta.protocol = ip->protocol;
    meta.pkt_size = bpf_ntohs(ip->tot_len);
    meta.tcp_flags = 0;

    if (ip->protocol == IPPROTO_TCP) {
        if (data + sizeof(struct ethhdr) + sizeof(struct iphdr) + sizeof(struct tcphdr) > data_end)
            return TC_ACT_OK;
        tcp = data + sizeof(struct ethhdr) + sizeof(struct iphdr);
        meta.sport = tcp->source;
        meta.dport = tcp->dest;
        meta.tcp_flags = *((__u8 *)tcp + 13);
        meta.seq = tcp->seq;
        meta.ack = tcp->ack_seq;
    } else if (ip->protocol == IPPROTO_UDP) {
        if (data + sizeof(struct ethhdr) + sizeof(struct iphdr) + sizeof(struct udphdr) > data_end)
            return TC_ACT_OK;
        udp = data + sizeof(struct ethhdr) + sizeof(struct iphdr);
        meta.sport = udp->source;
        meta.dport = udp->dest;
    } else {
        meta.sport = 0;
        meta.dport = 0;
    }

    rule_ret = check_access_rules(skb, &meta);

    conn_id = ((__u64)meta.saddr << 32) | ((__u64)meta.daddr ^ (__u64)meta.sport ^ (__u64)meta.dport);
    conn_exists = bpf_map_lookup_elem(&conn_tracking, &conn_id);
    if (!conn_exists) {
        __u32 val = 1;
        bpf_map_update_elem(&conn_tracking, &conn_id, &val, BPF_ANY);

        ce.meta = meta;
        ce.direction = 1;
        ce.event_type = EVENT_NEW_CONNECTION;
        bpf_perf_event_output(skb, &conn_events, BPF_F_CURRENT_CPU,
                              &ce, sizeof(ce));
    }

    if (rule_ret < 0) {
        be.meta = meta;
        be.rule_type = (rule_ret == -2) ? RULE_DOMAIN_BLOCK : RULE_IP_BLOCK;
        be.rule_id = 0;
        __builtin_memcpy(be.reason, "Access denied by policy", 23);
        bpf_perf_event_output(skb, &block_events, BPF_F_CURRENT_CPU,
                              &be, sizeof(be));
        return TC_ACT_SHOT;
    }

    do_sample(skb, &meta, data, data_end);

    return TC_ACT_OK;
}

SEC("cgroup/connect4")
int cgroup_connect4(struct bpf_sock_addr *ctx)
{
    struct sock_pid_value val = {};
    struct lpm_ip_key ip_key = {};
    struct lpm_ip_value *ip_val;
    struct port_rule_key port_key = {};
    struct port_rule_value *port_val;
    __u64 pid_tgid = bpf_get_current_pid_tgid();
    __u64 uid_gid = bpf_get_current_uid_gid();
    __u32 dst_ip;

    val.pid = pid_tgid >> 32;
    val.uid = uid_gid & 0xFFFFFFFF;
    bpf_get_current_comm(&val.comm, sizeof(val.comm));

    dst_ip = ctx->user_ip4;

    ip_key.prefixlen = 32;
    ip_key.data = dst_ip;

    ip_val = bpf_map_lookup_elem(&ip_block_rules, &ip_key);
    if (ip_val && ip_val->enabled && ip_val->action == ACTION_DENY) {
        if (comm_match(val.comm, ip_val->comm)) {
            return 0;
        }
    }

    ip_val = bpf_map_lookup_elem(&domain_block_ips, &ip_key);
    if (ip_val && ip_val->enabled && ip_val->action == ACTION_DENY) {
        return 0;
    }

    port_key.port = (__u16)(ctx->user_port >> 16);
    port_key.protocol = ctx->protocol;

    port_val = bpf_map_lookup_elem(&port_block_rules, &port_key);
    if (port_val && port_val->enabled && port_val->action == ACTION_DENY) {
        if (comm_match(val.comm, port_val->comm)) {
            return 0;
        }
    }

    return 1;
}

SEC("tracepoint/sock/inet_sock_set_state")
int trace_sock_state(struct trace_event_raw_inet_sock_set_state *ctx)
{
    struct sock_pid_key key = {};
    struct sock_pid_value val = {};

    if (ctx->protocol != IPPROTO_TCP)
        return 0;
    if (ctx->newstate != 1)
        return 0;

    __u64 pid_tgid = bpf_get_current_pid_tgid();
    __u64 uid_gid = bpf_get_current_uid_gid();

    val.pid = pid_tgid >> 32;
    val.uid = uid_gid & 0xFFFFFFFF;
    bpf_get_current_comm(&val.comm, sizeof(val.comm));

    __u64 cookie = bpf_get_socket_cookie((struct sock *)ctx->skaddr);
    if (cookie == 0)
        return 0;

    key.cookie = cookie;
    bpf_map_update_elem(&sock_pid_map, &key, &val, BPF_ANY);

    return 0;
}
