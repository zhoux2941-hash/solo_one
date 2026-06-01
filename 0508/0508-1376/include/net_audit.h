#ifndef __NET_AUDIT_H__
#define __NET_AUDIT_H__

#include <linux/types.h>
#include <linux/in.h>

#define TASK_COMM_LEN 16
#define MAX_DOMAIN_LEN 128
#define MAX_PAYLOAD_SIZE 128
#define MAX_RULES 1024
#define MAX_PROCESS_RULES 256

enum event_type {
    EVENT_NEW_CONNECTION = 0,
    EVENT_PACKET = 1,
    EVENT_BLOCKED = 2,
    EVENT_SAMPLE = 3
};

enum rule_type {
    RULE_PROCESS_IP_BLOCK = 0,
    RULE_PROCESS_PORT_ALLOW = 1,
    RULE_DOMAIN_BLOCK = 2,
    RULE_IP_BLOCK = 3,
    RULE_PORT_BLOCK = 4
};

enum rule_action {
    ACTION_ALLOW = 0,
    ACTION_DENY = 1
};

struct net_packet_meta {
    __u64 timestamp;
    __u32 pid;
    __u32 uid;
    char comm[TASK_COMM_LEN];
    __u32 saddr;
    __u32 daddr;
    __u16 sport;
    __u16 dport;
    __u8 protocol;
    __u8 tcp_flags;
    __u16 pkt_size;
    __u32 seq;
    __u32 ack;
};

struct connection_event {
    struct net_packet_meta meta;
    __u8 direction;
    __u8 event_type;
};

struct block_event {
    struct net_packet_meta meta;
    __u8 rule_type;
    __u32 rule_id;
    char reason[64];
};

struct sample_event {
    struct net_packet_meta meta;
    __u16 payload_len;
    __u8 payload[MAX_PAYLOAD_SIZE];
};

struct lpm_ip_key {
    __u32 prefixlen;
    __u32 data;
};

struct lpm_ip_value {
    __u32 id;
    __u8 action;
    __u8 enabled;
    __u8 rule_type;
    char comm[TASK_COMM_LEN];
};

struct port_rule_key {
    __u16 port;
    __u8 protocol;
    __u8 pad;
};

struct port_rule_value {
    __u32 id;
    __u8 action;
    __u8 enabled;
    char comm[TASK_COMM_LEN];
};

struct sock_pid_key {
    __u64 cookie;
};

struct sock_pid_value {
    __u32 pid;
    __u32 uid;
    char comm[TASK_COMM_LEN];
};

struct rule_key {
    __u8 type;
    __u32 pid;
    __u32 ip;
    __u32 mask;
    __u16 port;
    __u8 protocol;
};

struct rule_value {
    __u32 id;
    __u8 action;
    __u8 enabled;
    char comm[TASK_COMM_LEN];
    char domain[MAX_DOMAIN_LEN];
};

struct sample_config {
    __u32 sample_rate;
    __u32 sample_threshold;
    __u16 exclude_ports[16];
    __u8 exclude_port_count;
    __u8 enabled;
};

struct bpf_map_def {
    unsigned int type;
    unsigned int key_size;
    unsigned int value_size;
    unsigned int max_entries;
    unsigned int map_flags;
};

#endif
