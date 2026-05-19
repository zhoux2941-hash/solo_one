#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>
#include <bpf/bpf_core_read.h>

char LICENSE[] SEC("license") = "GPL";

#define MAX_PAYLOAD 256
#define TASK_COMM_LEN 16
#define DEFAULT_SAMPLE_RATE 100
#define AGGREGATION_INTERVAL_NS 1000000000ULL

// 自适应采样配置
#define LOW_QPS_THRESHOLD 1000      // 低于此 QPS 时全采样
#define MEDIUM_QPS_THRESHOLD 10000  // 低于此 QPS 时 10% 采样
#define HIGH_ERROR_THRESHOLD 5      // 错误率 > 5% 增加采样
#define HIGH_LATENCY_THRESHOLD_NS 1000000000ULL  // 1s 以上延迟视为异常
#define LATENCY_P95_THRESHOLD_NS 500000000ULL    // P95 > 500ms 视为问题

enum event_type {
    EVENT_HTTP_AGG,
    EVENT_TCP_AGG,
    EVENT_SYSCALL_AGG,
    EVENT_MEMORY_AGG,
    EVENT_CONN_SAMPLE,
    EVENT_SAMPLING_UPDATE
};

struct conn_tuple {
    __u32 saddr;
    __u32 daddr;
    __u16 sport;
    __u16 dport;
};

struct http_key {
    __u32 tgid;
    __u16 status_code;
    char method[16];
    char host[64];
    char path[128];
};

struct http_value {
    __u64 count;
    __u64 latency_sum;
    __u64 latency_sq_sum;
    __u64 min_latency;
    __u64 max_latency;
    __u64 error_count;
};

struct tcp_key {
    __u32 saddr;
    __u32 daddr;
    __u16 sport;
    __u16 dport;
};

struct tcp_value {
    __u64 retransmits;
    __u64 drops;
};

struct syscall_key {
    __u32 tgid;
    __s32 syscall_nr;
};

struct syscall_value {
    __u64 count;
    __u64 latency_sum;
};

struct memory_key {
    __u32 tgid;
};

struct memory_value {
    __u64 alloc_count;
    __u64 alloc_bytes;
};

// 自适应采样状态
struct adaptive_state {
    __u64 window_start;           // 当前统计窗口开始时间
    __u64 total_requests;         // 窗口内总请求数
    __u64 total_errors;           // 窗口内错误数
    __u64 latency_sum;            // 延迟总和
    __u64 high_latency_count;     // 高延迟请求数
    __u32 current_sample_rate;    // 当前采样率
    __u32 sample_rate_target;     // 目标采样率
};

struct sampling_update {
    __u64 qps;
    __u64 error_rate_pct;
    __u64 p95_latency_us;
    __u32 old_sample_rate;
    __u32 new_sample_rate;
    char reason[64];
};

struct event {
    enum event_type type;
    __u64 timestamp;
    union {
        struct {
            __u32 tgid;
            char comm[TASK_COMM_LEN];
            struct http_key key;
            struct http_value val;
        } http;
        struct {
            struct tcp_key key;
            struct tcp_value val;
        } tcp;
        struct {
            __u32 tgid;
            char comm[TASK_COMM_LEN];
            struct syscall_key key;
            struct syscall_value val;
        } syscall;
        struct {
            __u32 tgid;
            char comm[TASK_COMM_LEN];
            struct memory_key key;
            struct memory_value val;
        } memory;
        struct {
            __u32 saddr;
            __u32 daddr;
            __u16 sport;
            __u16 dport;
            __u32 tgid;
        } conn;
        struct sampling_update sampling;
    } data;
};

struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 22);
} events SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 8192);
    __type(key, __u64);
    __type(value, __u64);
} http_start_times SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __uint(max_entries, 4096);
    __type(key, struct http_key);
    __type(value, struct http_value);
} http_stats SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __uint(max_entries, 1024);
    __type(key, struct tcp_key);
    __type(value, struct tcp_value);
} tcp_stats SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __uint(max_entries, 2048);
    __type(key, struct syscall_key);
    __type(value, struct syscall_value);
} syscall_stats SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __uint(max_entries, 512);
    __type(key, struct memory_key);
    __type(value, struct memory_value);
} memory_stats SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(max_entries, 1);
    __type(key, __u32);
    __type(value, __u64);
} config SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(max_entries, 1);
    __type(key, __u32);
    __type(value, __u64);
} last_flush_time SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 1);
    __type(key, __u32);
    __type(value, struct adaptive_state);
} adaptive_state SEC(".maps");

static __always_inline __u64 get_sample_rate() {
    __u32 key = 0;
    struct adaptive_state *state = bpf_map_lookup_elem(&adaptive_state, &key);
    if (state && state->current_sample_rate > 0) {
        return state->current_sample_rate;
    }
    return DEFAULT_SAMPLE_RATE;
}

static __always_inline bool should_sample(__u64 latency, __u16 status_code) {
    // 异常事件强制采样：错误响应 或 高延迟
    if (status_code >= 400 || latency > HIGH_LATENCY_THRESHOLD_NS) {
        return true;
    }
    
    __u64 rate = get_sample_rate();
    if (rate == 0) return false;
    if (rate == 1) return true;
    
    __u64 rand = bpf_get_prandom_u32();
    return (rand % rate) == 0;
}

static __always_inline void update_adaptive_state(__u64 latency, __u16 status_code) {
    __u32 key = 0;
    struct adaptive_state *state = bpf_map_lookup_elem(&adaptive_state, &key);
    if (!state) {
        return;
    }
    
    __u64 now = bpf_ktime_get_ns();
    
    // 检查是否需要滚动窗口（每秒重置一次统计）
    if (state->window_start == 0 || (now - state->window_start) > 1000000000ULL) {
        if (state->window_start != 0) {
            // 计算前一秒的统计并调整采样率
            __u64 qps = state->total_requests;
            __u64 error_rate_pct = 0;
            if (state->total_requests > 0) {
                error_rate_pct = (state->total_errors * 100) / state->total_requests;
            }
            
            __u32 new_rate = state->current_sample_rate;
            char reason[64] = {0};
            
            // 低流量全采样
            if (qps < LOW_QPS_THRESHOLD) {
                if (new_rate != 1) {
                    new_rate = 1;
                    __builtin_memcpy(reason, "low_qps_full_sample", 20);
                }
            }
            // 中等流量 10% 采样
            else if (qps < MEDIUM_QPS_THRESHOLD) {
                if (new_rate != 10) {
                    new_rate = 10;
                    __builtin_memcpy(reason, "medium_qps_10pct_sample", 24);
                }
            }
            // 高流量检查错误率
            else {
                if (error_rate_pct > HIGH_ERROR_THRESHOLD) {
                    // 高错误率增加采样密度
                    if (new_rate > 10) {
                        new_rate = 10;
                        __builtin_memcpy(reason, "high_error_rate_increase_sampling", 34);
                    }
                } else {
                    // 正常高流量使用 1% 采样
                    if (new_rate != 100) {
                        new_rate = 100;
                        __builtin_memcpy(reason, "high_qps_1pct_sample", 20);
                    }
                }
            }
            
            // 高延迟也增加采样
            if (state->high_latency_count * 100 > state->total_requests * 5) {
                if (new_rate > 10) {
                    new_rate = 10;
                    __builtin_memcpy(reason, "high_latency_increase_sampling", 30);
                }
            }
            
            // 发送采样率更新事件
            if (new_rate != state->current_sample_rate && reason[0] != 0) {
                struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
                if (e) {
                    e->type = EVENT_SAMPLING_UPDATE;
                    e->timestamp = now;
                    e->data.sampling.qps = qps;
                    e->data.sampling.error_rate_pct = error_rate_pct;
                    e->data.sampling.old_sample_rate = state->current_sample_rate;
                    e->data.sampling.new_sample_rate = new_rate;
                    __builtin_memcpy(e->data.sampling.reason, reason, sizeof(reason));
                    bpf_ringbuf_submit(e, 0);
                }
            }
            
            state->sample_rate_target = new_rate;
        }
        
        // 重置窗口
        state->window_start = now;
        state->total_requests = 0;
        state->total_errors = 0;
        state->latency_sum = 0;
        state->high_latency_count = 0;
        if (state->current_sample_rate == 0) {
            state->current_sample_rate = DEFAULT_SAMPLE_RATE;
        }
        // 平滑过渡到目标采样率
        state->current_sample_rate = state->sample_rate_target;
    }
    
    // 更新当前窗口统计
    __sync_fetch_and_add(&state->total_requests, 1);
    __sync_fetch_and_add(&state->latency_sum, latency);
    if (status_code >= 400) {
        __sync_fetch_and_add(&state->total_errors, 1);
    }
    if (latency > HIGH_LATENCY_THRESHOLD_NS) {
        __sync_fetch_and_add(&state->high_latency_count, 1);
    }
}

static __always_inline bool need_flush() {
    __u32 key = 0;
    __u64 *last = bpf_map_lookup_elem(&last_flush_time, &key);
    __u64 now = bpf_ktime_get_ns();
    
    if (!last || (now - *last) > AGGREGATION_INTERVAL_NS) {
        bpf_map_update_elem(&last_flush_time, &key, &now, BPF_ANY);
        return true;
    }
    return false;
}

static __always_inline void fill_comm(char *comm) {
    struct task_struct *task = (void *)bpf_get_current_task();
    bpf_probe_read_kernel(comm, TASK_COMM_LEN, BPF_CORE_READ(task, comm));
}

static __always_inline int parse_http_request(const char *buf, size_t buf_len,
                                               char *method, size_t method_len,
                                               char *path, size_t path_len,
                                               char *host, size_t host_len) {
    if (buf_len < 16) return -1;
    
    const char *p = buf;
    int i = 0;
    
    while (i < method_len - 1 && i < buf_len && *p != ' ' && *p != '\r' && *p != '\n') {
        method[i++] = *p++;
    }
    method[i] = '\0';
    
    if (i == buf_len || *p++ != ' ') return -1;
    
    if (method[0] != 'G' && method[0] != 'P' && method[0] != 'D' && 
        method[0] != 'H' && method[0] != 'O') {
        return -1;
    }
    
    i = 0;
    while (i < path_len - 1 && i < buf_len && *p != ' ' && *p != '\r' && *p != '\n') {
        path[i++] = *p++;
    }
    path[i] = '\0';
    
    while (i < buf_len - 4 && i < 256) {
        if (p[0] == 'H' && p[1] == 'o' && p[2] == 's' && p[3] == 't' && p[4] == ':') {
            p += 5;
            while (*p == ' ') p++;
            i = 0;
            while (i < host_len - 1 && i < 64 && *p != '\r' && *p != '\n') {
                host[i++] = *p++;
            }
            host[i] = '\0';
            break;
        }
        p++;
        i++;
    }
    
    return 0;
}

SEC("tracepoint/syscalls/sys_enter_write")
int tracepoint_sys_enter_write(struct trace_event_raw_sys_enter *ctx) {
    // 注意：这里我们先不采样，而是记录所有请求的开始时间
    // 实际采样决策在 sys_exit 中做出，那时我们知道延迟和状态码
    
    int fd = (int)ctx->args[0];
    const char *buf = (const char *)ctx->args[1];
    
    if (fd < 3) return 0;
    
    char http_buf[256];
    long ret = bpf_probe_read_user(http_buf, sizeof(http_buf), buf);
    if (ret != 0) return 0;
    
    char method[16] = {0};
    char path[128] = {0};
    char host[64] = {0};
    
    if (parse_http_request(http_buf, sizeof(http_buf), method, sizeof(method), 
                           path, sizeof(path), host, sizeof(host)) == 0) {
        __u64 cookie = bpf_get_current_pid_tgid();
        __u64 start_time = bpf_ktime_get_ns();
        bpf_map_update_elem(&http_start_times, &cookie, &start_time, BPF_ANY);
    }
    
    return 0;
}

SEC("kprobe/tcp_v4_connect")
int BPF_KPROBE(tcp_v4_connect, struct sock *sk) {
    // TCP 连接事件使用当前采样率
    __u64 rate = get_sample_rate();
    if (rate > 1) {
        __u64 rand = bpf_get_prandom_u32();
        if ((rand % rate) != 0) return 0;
    }
    
    struct inet_sock *inet = (struct inet_sock *)sk;
    __u32 saddr = BPF_CORE_READ(inet, inet_saddr);
    __u32 daddr = BPF_CORE_READ(inet, inet_daddr);
    __u16 sport = BPF_CORE_READ(inet, inet_sport);
    __u16 dport = BPF_CORE_READ(inet, inet_dport);
    
    struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e) return 0;
    
    e->type = EVENT_CONN_SAMPLE;
    e->timestamp = bpf_ktime_get_ns();
    e->data.conn.saddr = saddr;
    e->data.conn.daddr = daddr;
    e->data.conn.sport = sport;
    e->data.conn.dport = dport;
    e->data.conn.tgid = bpf_get_current_pid_tgid() >> 32;
    
    bpf_ringbuf_submit(e, 0);
    return 0;
}

SEC("kprobe/tcp_retransmit_skb")
int BPF_KPROBE(tcp_retransmit_skb, struct sock *sk, struct sk_buff *skb) {
    struct inet_sock *inet = (struct inet_sock *)sk;
    struct tcp_key key = {
        .saddr = BPF_CORE_READ(inet, inet_saddr),
        .daddr = BPF_CORE_READ(inet, inet_daddr),
        .sport = BPF_CORE_READ(inet, inet_sport),
        .dport = BPF_CORE_READ(inet, inet_dport),
    };
    
    struct tcp_value *val = bpf_map_lookup_elem(&tcp_stats, &key);
    if (val) {
        __sync_fetch_and_add(&val->retransmits, 1);
    } else {
        struct tcp_value new_val = { .retransmits = 1, .drops = 0 };
        bpf_map_update_elem(&tcp_stats, &key, &new_val, BPF_NOEXIST);
    }
    
    return 0;
}

SEC("kprobe/tcp_drop")
int BPF_KPROBE(tcp_drop, struct sock *sk, struct sk_buff *skb, void *reason) {
    struct inet_sock *inet = (struct inet_sock *)sk;
    struct tcp_key key = {
        .saddr = BPF_CORE_READ(inet, inet_saddr),
        .daddr = BPF_CORE_READ(inet, inet_daddr),
        .sport = BPF_CORE_READ(inet, inet_sport),
        .dport = BPF_CORE_READ(inet, inet_dport),
    };
    
    struct tcp_value *val = bpf_map_lookup_elem(&tcp_stats, &key);
    if (val) {
        __sync_fetch_and_add(&val->drops, 1);
    } else {
        struct tcp_value new_val = { .retransmits = 0, .drops = 1 };
        bpf_map_update_elem(&tcp_stats, &key, &new_val, BPF_NOEXIST);
    }
    
    return 0;
}

SEC("tracepoint/syscalls/sys_exit")
int tracepoint_sys_exit(struct trace_event_raw_sys_exit *ctx) {
    __u64 key = bpf_get_current_pid_tgid();
    __u64 *start_time = bpf_map_lookup_elem(&http_start_times, &key);
    
    if (start_time) {
        __u64 now = bpf_ktime_get_ns();
        __u64 latency = now - *start_time;
        __u32 tgid = key >> 32;
        __u16 status_code = (ctx->ret >= 0) ? 200 : 500;
        
        // 更新自适应采样状态（所有请求都参与统计，不管是否采样）
        update_adaptive_state(latency, status_code);
        
        // 根据延迟和状态码决定是否采样
        if (should_sample(latency, status_code)) {
            struct http_key hkey = { .tgid = tgid, .status_code = status_code };
            
            struct http_value *val = bpf_map_lookup_elem(&http_stats, &hkey);
            if (val) {
                __sync_fetch_and_add(&val->count, 1);
                __sync_fetch_and_add(&val->latency_sum, latency);
                if (latency < val->min_latency) val->min_latency = latency;
                if (latency > val->max_latency) val->max_latency = latency;
                if (status_code >= 400) {
                    __sync_fetch_and_add(&val->error_count, 1);
                }
            } else {
                struct http_value new_val = {
                    .count = 1,
                    .latency_sum = latency,
                    .min_latency = latency,
                    .max_latency = latency,
                    .error_count = (status_code >= 400) ? 1 : 0,
                };
                bpf_map_update_elem(&http_stats, &hkey, &new_val, BPF_NOEXIST);
            }
        }
        
        bpf_map_delete_elem(&http_start_times, &key);
    }
    
    // 系统调用统计使用基础采样率
    __u64 rate = get_sample_rate();
    if (rate == 0 || (rate > 1 && bpf_get_prandom_u32() % rate != 0)) {
        return 0;
    }
    
    struct syscall_key skey = {
        .tgid = bpf_get_current_pid_tgid() >> 32,
        .syscall_nr = ctx->id,
    };
    
    struct syscall_value *sval = bpf_map_lookup_elem(&syscall_stats, &skey);
    if (sval) {
        __sync_fetch_and_add(&sval->count, 1);
    } else {
        struct syscall_value new_val = { .count = 1, .latency_sum = 0 };
        bpf_map_update_elem(&syscall_stats, &skey, &new_val, BPF_NOEXIST);
    }
    
    return 0;
}

SEC("kprobe/kmalloc")
int BPF_KPROBE(kmalloc, size_t size, gfp_t flags) {
    // 内存分配使用低频采样
    __u64 rate = get_sample_rate();
    if (rate > 10 && bpf_get_prandom_u32() % 10 != 0) {
        return 0;
    }
    
    struct memory_key key = { .tgid = bpf_get_current_pid_tgid() >> 32 };
    
    struct memory_value *val = bpf_map_lookup_elem(&memory_stats, &key);
    if (val) {
        __sync_fetch_and_add(&val->alloc_count, 1);
        __sync_fetch_and_add(&val->alloc_bytes, size);
    } else {
        struct memory_value new_val = { .alloc_count = 1, .alloc_bytes = size };
        bpf_map_update_elem(&memory_stats, &key, &new_val, BPF_NOEXIST);
    }
    
    return 0;
}

SEC("kprobe/__vmalloc_node_range")
int BPF_KPROBE(vmalloc_node_range, unsigned long size) {
    __u64 rate = get_sample_rate();
    if (rate > 10 && bpf_get_prandom_u32() % 10 != 0) {
        return 0;
    }
    
    struct memory_key key = { .tgid = bpf_get_current_pid_tgid() >> 32 };
    
    struct memory_value *val = bpf_map_lookup_elem(&memory_stats, &key);
    if (val) {
        __sync_fetch_and_add(&val->alloc_count, 1);
        __sync_fetch_and_add(&val->alloc_bytes, size);
    } else {
        struct memory_value new_val = { .alloc_count = 1, .alloc_bytes = size };
        bpf_map_update_elem(&memory_stats, &key, &new_val, BPF_NOEXIST);
    }
    
    return 0;
}
