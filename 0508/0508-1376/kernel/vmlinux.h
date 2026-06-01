#ifndef __VMLINUX_H__
#define __VMLINUX_H__

typedef unsigned char __u8;
typedef unsigned short __u16;
typedef unsigned int __u32;
typedef unsigned long long __u64;
typedef signed char __s8;
typedef signed short __s16;
typedef signed int __s32;
typedef signed long long __s64;

typedef __u8 __uint8_t;
typedef __u16 __uint16_t;
typedef __u32 __uint32_t;
typedef __u64 __uint64_t;
typedef __s8 __int8_t;
typedef __s16 __int16_t;
typedef __s32 __int32_t;
typedef __s64 __int64_t;

typedef __u32 __be32;
typedef __u16 __be16;
typedef __u32 __le32;
typedef __u16 __le16;

typedef __u16 __kernel_uid_t;
typedef __u16 __kernel_gid_t;
typedef __u32 __kernel_pid_t;

#define ETH_P_IP	0x0800
#define ETH_P_ARP	0x0806
#define ETH_P_IPV6	0x86DD

#define IPPROTO_IP	0
#define IPPROTO_ICMP	1
#define IPPROTO_TCP	6
#define IPPROTO_UDP	17

struct ethhdr {
	unsigned char h_dest[6];
	unsigned char h_source[6];
	__be16 h_proto;
} __attribute__((packed));

struct iphdr {
	__u8 ihl:4;
	__u8 version:4;
	__u8 tos;
	__be16 tot_len;
	__be16 id;
	__be16 frag_off;
	__u8 ttl;
	__u8 protocol;
	__sum16 check;
	__be32 saddr;
	__be32 daddr;
} __attribute__((packed));

struct tcphdr {
	__be16 source;
	__be16 dest;
	__be32 seq;
	__be32 ack_seq;
	__u16 res1:4;
	__u16 doff:4;
	__u8 fin:1;
	__u8 syn:1;
	__u8 rst:1;
	__u8 psh:1;
	__u8 ack:1;
	__u8 urg:1;
	__u8 ece:1;
	__u8 cwr:1;
	__be16 window;
	__sum16 check;
	__be16 urg_ptr;
} __attribute__((packed));

struct udphdr {
	__be16 source;
	__be16 dest;
	__be16 len;
	__sum16 check;
} __attribute__((packed));

struct dnshdr {
	__be16 id;
	__u8 rd:1;
	__u8 tc:1;
	__u8 aa:1;
	__u8 opcode:4;
	__u8 qr:1;
	__u8 rcode:4;
	__u8 z:3;
	__u8 ra:1;
	__be16 qdcount;
	__be16 ancount;
	__be16 nscount;
	__be16 arcount;
} __attribute__((packed));

struct __sk_buff {
	__u32 len;
	__u32 pkt_type;
	__u32 mark;
	__u32 queue_mapping;
	__u32 protocol;
	__u32 vlan_present;
	__u32 vlan_tci;
	__u32 vlan_proto;
	__u32 priority;
	__u32 ingress_ifindex;
	__u32 ifindex;
	__u32 tc_index;
	__u32 cb[5];
	__u32 hash;
	__u32 tc_classid;
	__u32 data;
	__u32 data_end;
	__u32 napi_id;
	__u32 family;
	__u32 remote_ip4;
	__u32 local_ip4;
	__u32 remote_ip6[4];
	__u32 local_ip6[4];
	__u32 remote_port;
	__u32 local_port;
	__u32 data_meta;
	__u64 tstamp;
	__u32 wire_len;
	__u32 gso_segs;
	__u32 gso_type;
};

#define TC_ACT_OK		0
#define TC_ACT_RECLASSIFY	1
#define TC_ACT_SHOT		2
#define TC_ACT_PIPE		3
#define TC_ACT_STOLEN		4
#define TC_ACT_QUEUED		5
#define TC_ACT_REPEAT		6
#define TC_ACT_REDIRECT		7

#define BPF_ANY		0
#define BPF_NOEXIST	1
#define BPF_EXIST	2
#define BPF_F_NO_PREALLOC	(1U << 0)
#define BPF_F_NO_COMMON_LRU	(1U << 1)
#define BPF_F_NUMA_NODE		(1U << 2)
#define BPF_F_RDONLY		(1U << 3)
#define BPF_F_WRONLY		(1U << 4)
#define BPF_F_STACK_BUILD_ID	(1U << 5)
#define BPF_F_ZERO_SEED		(1U << 6)
#define BPF_F_RDONLY_PROG	(1U << 7)
#define BPF_F_WRONLY_PROG	(1U << 8)
#define BPF_F_CLONE		(1U << 9)
#define BPF_F_MMAPABLE		(1U << 10)
#define BPF_F_PRESERVE_ELEMS	(1U << 11)
#define BPF_F_INNER_MAP		(1U << 12)
#define BPF_F_KPROBE_MULTI_RETURN	(1U << 13)
#define BPF_F_ID		(1U << 14)
#define BPF_F_BTF_ID_VAR	(1U << 15)

#define BPF_MAP_TYPE_UNSPEC		0
#define BPF_MAP_TYPE_HASH		1
#define BPF_MAP_TYPE_ARRAY		2
#define BPF_MAP_TYPE_PROG_ARRAY		3
#define BPF_MAP_TYPE_PERF_EVENT_ARRAY	4
#define BPF_MAP_TYPE_PERCPU_HASH	5
#define BPF_MAP_TYPE_PERCPU_ARRAY	6
#define BPF_MAP_TYPE_STACK_TRACE	7
#define BPF_MAP_TYPE_CGROUP_ARRAY	8
#define BPF_MAP_TYPE_LRU_HASH		9
#define BPF_MAP_TYPE_LRU_PERCPU_HASH	10
#define BPF_MAP_TYPE_LPM_TRIE		11
#define BPF_MAP_TYPE_ARRAY_OF_MAPS	12
#define BPF_MAP_TYPE_HASH_OF_MAPS	13
#define BPF_MAP_TYPE_DEVMAP		14
#define BPF_MAP_TYPE_SOCKMAP		15
#define BPF_MAP_TYPE_CPUMAP		16
#define BPF_MAP_TYPE_XSKMAP		17
#define BPF_MAP_TYPE_SOCKHASH		18
#define BPF_MAP_TYPE_CGROUP_STORAGE	19
#define BPF_MAP_TYPE_REUSEPORT_SOCKARRAY	20
#define BPF_MAP_TYPE_PERCPU_CGROUP_STORAGE	21
#define BPF_MAP_TYPE_QUEUE		22
#define BPF_MAP_TYPE_STACK		23
#define BPF_MAP_TYPE_SK_STORAGE		24
#define BPF_MAP_TYPE_DEVMAP_HASH	25
#define BPF_MAP_TYPE_STRUCT_OPS		26
#define BPF_MAP_TYPE_RINGBUF		27
#define BPF_MAP_TYPE_INODE_STORAGE	28
#define BPF_MAP_TYPE_TASK_STORAGE	29
#define BPF_MAP_TYPE_BLOOM_FILTER	30

#define BPF_F_CURRENT_CPU	0xFFFFFFFFULL

typedef __u64 __sum16;

#endif
