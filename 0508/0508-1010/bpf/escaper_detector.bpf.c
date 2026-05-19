// SPDX-License-Identifier: GPL-2.0-only
#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>
#include <bpf/bpf_core_read.h>

#define TASK_COMM_LEN 16
#define PATH_MAX 256
#define EVENT_MAX 1024
#define MAX_FDS_PER_PROC 1024
#define MAGIC_NUMBER 0x44455445  // "DETE"
#define HEARTBEAT_INTERVAL_NS 1000000000ULL  // 1秒

// 事件类型
enum event_type {
    EVENT_SYSCALL = 0,
    EVENT_MOUNT,
    EVENT_CGROUP,
    EVENT_UNSHARE,
    EVENT_PRIVILEGED,
    EVENT_CVE_2022_0492,
    EVENT_RENAME,
    EVENT_EXECVE,
    EVENT_PATH_BYPASS_ATTEMPT,
    EVENT_SYMLINK,
    EVENT_SELF_PROTECTION,   // 自我保护事件
    EVENT_HEARTBEAT,         // 心跳事件
};

// 系统调用编号 (x86_64)
#define SYS_mount 165
#define SYS_umount 166
#define SYS_unshare 272
#define SYS_setns 308
#define SYS_openat 257
#define SYS_open 2
#define SYS_write 1
#define SYS_chmod 90
#define SYS_chown 92
#define SYS_rename 82
#define SYS_renameat 264
#define SYS_renameat2 316
#define SYS_execve 59
#define SYS_execveat 322
#define SYS_symlink 83
#define SYS_symlinkat 266
#define SYS_readlink 89
#define SYS_readlinkat 267
#define SYS_link 86
#define SYS_linkat 265
#define SYS_faccessat 269
#define SYS_fchmodat 268
#define SYS_fchownat 262
#define SYS_bpf 321
#define SYS_ptrace 101
#define SYS_kill 62
#define SYS_tgkill 234

// 事件数据结构
struct event {
    __u32 pid;
    __u32 tgid;
    __u32 uid;
    __u32 gid;
    __u64 timestamp;
    __u32 event_type;
    __s32 syscall_nr;
    char comm[TASK_COMM_LEN];
    char container_id[64];
    __u64 arg1;
    __u64 arg2;
    __u64 arg3;
    __u64 arg4;
    char path1[PATH_MAX];
    char path2[PATH_MAX];
    char path_resolved[PATH_MAX];
    __s32 retval;
    __u8 is_suspicious;
    __u32 magic;  // 魔法数字用于完整性校验
};

// 文件描述符跟踪
struct fd_entry {
    __u64 timestamp;
    char path[PATH_MAX];
    char path_resolved[PATH_MAX];
};

// 心跳数据结构
struct heartbeat {
    __u64 timestamp;
    __u32 magic;
    __u32 checksum;
};

// BPF ring buffer
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 24);
} events SEC(".maps");

// 进程容器ID映射
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 65536);
    __type(key, __u32);
    __type(value, char[64]);
} pid_container_map SEC(".maps");

// 特权进程标记
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 65536);
    __type(key, __u32);
    __type(value, __u8);
} privileged_pids SEC(".maps");

// 系统调用参数临时存储 (sys_enter -> sys_exit)
struct syscall_args {
    __u64 args[6];
    char path1[PATH_MAX];
    char path2[PATH_MAX];
};

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 65536);
    __type(key, __u32);
    __type(value, struct syscall_args);
} syscall_args_map SEC(".maps");

// 文件描述符映射: pid_fd -> path
struct fd_key {
    __u32 pid;
    __s32 fd;
};

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 65536);
    __type(key, struct fd_key);
    __type(value, struct fd_entry);
} fd_path_map SEC(".maps");

// 重命名跟踪: pid -> (old_path, new_path)
struct rename_entry {
    char old_path[PATH_MAX];
    char new_path[PATH_MAX];
    __u64 timestamp;
};

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 65536);
    __type(key, __u32);
    __type(value, struct rename_entry);
} rename_tracker SEC(".maps");

// 保护的进程PID（检测器自身）
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 128);
    __type(key, __u32);
    __type(value, __u32);
} protected_pids SEC(".maps");

// 心跳映射 - 用户态定期更新
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1);
    __type(key, __u32);
    __type(value, struct heartbeat);
} heartbeat_map SEC(".maps");

// BPF程序状态
struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(max_entries, 16);
    __type(key, __u32);
    __type(value, __u64);
} program_state SEC(".maps");

// 工具函数：获取当前进程的命名空间
static __always_inline bool is_in_container() {
    struct task_struct *task = (struct task_struct *)bpf_get_current_task();
    unsigned int flags = 0;
    
    if (bpf_core_field_exists(task->flags)) {
        flags = BPF_CORE_READ(task, flags);
    }
    
    return (flags & 0x40000000) ? true : false;
}

// 检测是否为特权进程
static __always_inline bool is_privileged() {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    __u8 *priv = bpf_map_lookup_elem(&privileged_pids, &pid);
    if (priv && *priv) {
        return true;
    }
    
    struct cred *cred = (struct cred *)bpf_get_current_cred();
    if (cred) {
        kuid_t uid = BPF_CORE_READ(cred, euid);
        if (uid.val == 0) {
            return true;
        }
    }
    return false;
}

// 检查是否为受保护的进程
static __always_inline bool is_protected_process(__u32 pid) {
    __u32 *protected = bpf_map_lookup_elem(&protected_pids, &pid);
    return protected != NULL;
}

// 检查是否为对受保护进程的攻击
static __always_inline bool is_attack_on_protected(__u32 target_pid, long syscall_nr) {
    if (!is_protected_process(target_pid)) {
        return false;
    }
    
    switch (syscall_nr) {
        case SYS_kill:
        case SYS_tgkill:
        case SYS_ptrace:
            return true;
    }
    return false;
}

// 检查是否为BPF系统调用（可能用于卸载程序）
static __always_inline bool is_bpf_operation(long syscall_nr, __u64 cmd) {
    if (syscall_nr != SYS_bpf) {
        return false;
    }
    
    // BPF命令：BPF_PROG_DETACH, BPF_PROG_UNLOAD等
    // 这些命令可能被用于卸载我们的eBPF程序
    return (cmd == 8 || cmd == 11 || cmd == 17 || cmd == 18 || cmd == 22);
}

// 检查路径是否包含宿主机挂载特征
static __always_inline bool is_host_mount_path(const char *path) {
    char host_signatures[][32] = {
        "/proc/self/mountinfo",
        "/proc/1/root",
        "/host",
        "/var/run/docker.sock",
        "/run/containerd",
        "/sys/fs/cgroup",
        "/proc/self/exe",
        "/proc/self/fd",
        "/.dockerenv",
        "/sys/fs/bpf",
    };
    
    for (int i = 0; i < sizeof(host_signatures) / sizeof(host_signatures[0]); i++) {
        int len = __builtin_strlen(host_signatures[i]);
        if (__builtin_memcmp(path, host_signatures[i], len) == 0) {
            return true;
        }
    }
    return false;
}

// 检查是否为cgroup路径
static __always_inline bool is_cgroup_path(const char *path) {
    char cgroup_signatures[][32] = {
        "/sys/fs/cgroup",
        "/proc/self/cgroup",
        "release_agent",
        "notify_on_release",
        "cgroup.procs",
        "tasks",
    };
    
    for (int i = 0; i < sizeof(cgroup_signatures) / sizeof(cgroup_signatures[0]); i++) {
        if (__builtin_strstr(path, cgroup_signatures[i]) != NULL) {
            return true;
        }
    }
    return false;
}

// 检查unshare flags是否包含危险的命名空间隔离
static __always_inline bool is_dangerous_unshare(unsigned long flags) {
    unsigned long dangerous = 0x00020000 |  // CLONE_NEWUSER
                               0x20000000 |  // CLONE_NEWNET
                               0x10000000 |  // CLONE_NEWNS
                               0x02000000 |  // CLONE_NEWPID
                               0x01000000;   // CLONE_NEWUTS
    return (flags & dangerous) != 0;
}

// 检测路径混淆
static __always_inline bool is_path_obfuscated(const char *path) {
    int dotdot_count = 0;
    int slash_count = 0;
    int len = __builtin_strnlen(path, PATH_MAX);
    
    for (int i = 0; i < len - 1 && i < PATH_MAX - 1; i++) {
        if (path[i] == '.' && path[i+1] == '.') {
            dotdot_count++;
            if (dotdot_count > 3) return true;
        }
        if (path[i] == '/') slash_count++;
    }
    
    if (dotdot_count > 1) return true;
    if (len > 200) return true;
    
    return false;
}

// 检查最近是否有重命名操作可能用于绕过
static __always_inline bool check_recent_rename_attempt(const char *path) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    struct rename_entry *entry = bpf_map_lookup_elem(&rename_tracker, &pid);
    
    if (entry) {
        __u64 now = bpf_ktime_get_ns();
        if (now - entry->timestamp < 1000000000ULL) {
            if (__builtin_strstr(path, entry->new_path) != NULL) {
                return true;
            }
            if (__builtin_strstr(entry->old_path, "/proc") != NULL ||
                __builtin_strstr(entry->old_path, "/sys") != NULL ||
                __builtin_strstr(entry->old_path, "docker.sock") != NULL) {
                return true;
            }
        }
    }
    return false;
}

// 填充事件基本信息
static __always_inline void fill_event(struct event *e, struct trace_event_raw_sys_enter *ctx, long syscall_nr) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    __u32 tgid = bpf_get_current_pid_tgid() & 0xFFFFFFFF;
    
    __builtin_memset(e, 0, sizeof(*e));
    e->pid = pid;
    e->tgid = tgid;
    e->uid = bpf_get_current_uid_gid() & 0xFFFFFFFF;
    e->gid = bpf_get_current_uid_gid() >> 32;
    e->timestamp = bpf_ktime_get_ns();
    e->event_type = EVENT_SYSCALL;
    e->syscall_nr = syscall_nr;
    e->magic = MAGIC_NUMBER;
    bpf_get_current_comm(&e->comm, sizeof(e->comm));
    
    char *cid = bpf_map_lookup_elem(&pid_container_map, &tgid);
    if (cid) {
        __builtin_memcpy(e->container_id, cid, sizeof(e->container_id));
    }
    
    if (ctx) {
        e->arg1 = ctx->args[0];
        e->arg2 = ctx->args[1];
        e->arg3 = ctx->args[2];
        e->arg4 = ctx->args[3];
    }
}

// 保存系统调用参数以便在sys_exit时验证
static __always_inline void save_syscall_args(long syscall_nr, struct trace_event_raw_sys_enter *ctx) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    struct syscall_args args = {};
    
    args.args[0] = ctx->args[0];
    args.args[1] = ctx->args[1];
    args.args[2] = ctx->args[2];
    args.args[3] = ctx->args[3];
    args.args[4] = ctx->args[4];
    args.args[5] = ctx->args[5];
    
    switch (syscall_nr) {
        case SYS_openat:
            bpf_probe_read_user_str(&args.path1, sizeof(args.path1), (void *)ctx->args[1]);
            break;
        case SYS_open:
            bpf_probe_read_user_str(&args.path1, sizeof(args.path1), (void *)ctx->args[0]);
            break;
        case SYS_renameat:
        case SYS_renameat2:
            bpf_probe_read_user_str(&args.path1, sizeof(args.path1), (void *)ctx->args[1]);
            bpf_probe_read_user_str(&args.path2, sizeof(args.path2), (void *)ctx->args[3]);
            break;
        case SYS_execve:
            bpf_probe_read_user_str(&args.path1, sizeof(args.path1), (void *)ctx->args[0]);
            break;
        case SYS_execveat:
            bpf_probe_read_user_str(&args.path1, sizeof(args.path1), (void *)ctx->args[1]);
            break;
        case SYS_symlink:
        case SYS_symlinkat:
            bpf_probe_read_user_str(&args.path1, sizeof(args.path1), (void *)ctx->args[0]);
            bpf_probe_read_user_str(&args.path2, sizeof(args.path2), (void *)ctx->args[1]);
            break;
        case SYS_mount:
            bpf_probe_read_user_str(&args.path1, sizeof(args.path1), (void *)ctx->args[0]);
            bpf_probe_read_user_str(&args.path2, sizeof(args.path2), (void *)ctx->args[1]);
            break;
    }
    
    bpf_map_update_elem(&syscall_args_map, &pid, &args, BPF_ANY);
}

// 跟踪文件描述符到路径的映射
static __always_inline void track_fd(__s32 fd, const char *path) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    struct fd_key key = {.pid = pid, .fd = fd};
    struct fd_entry entry = {};
    
    entry.timestamp = bpf_ktime_get_ns();
    __builtin_memcpy(&entry.path, path, sizeof(entry.path));
    
    bpf_map_update_elem(&fd_path_map, &key, &entry, BPF_ANY);
}

// 检测对自身的攻击
static __always_inline bool check_self_attack(long syscall_nr, struct trace_event_raw_sys_enter *ctx, struct event *e) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    
    if (is_protected_process(pid)) {
        return false;
    }
    
    switch (syscall_nr) {
        case SYS_kill:
        case SYS_tgkill: {
            __u32 target_pid = (__u32)ctx->args[0];
            if (syscall_nr == SYS_tgkill) {
                target_pid = (__u32)ctx->args[1];
            }
            if (is_protected_process(target_pid)) {
                e->event_type = EVENT_SELF_PROTECTION;
                e->is_suspicious = 1;
                bpf_probe_read_user_str(&e->path1, sizeof(e->path1), "kill_protected_process");
                return true;
            }
            break;
        }
        case SYS_ptrace: {
            __u32 target_pid = (__u32)ctx->args[1];
            if (is_protected_process(target_pid)) {
                e->event_type = EVENT_SELF_PROTECTION;
                e->is_suspicious = 1;
                bpf_probe_read_user_str(&e->path1, sizeof(e->path1), "ptrace_protected_process");
                return true;
            }
            break;
        }
        case SYS_bpf: {
            if (is_bpf_operation(syscall_nr, ctx->args[0])) {
                e->event_type = EVENT_SELF_PROTECTION;
                e->is_suspicious = 1;
                bpf_probe_read_user_str(&e->path1, sizeof(e->path1), "bpf_unload_attempt");
                return true;
            }
            break;
        }
    }
    
    return false;
}

// tracepoint: sys_enter
SEC("tracepoint/syscalls/sys_enter")
int tracepoint_sys_enter(struct trace_event_raw_sys_enter *ctx) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    long syscall_nr = ctx->id;
    
    struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e) {
        return 0;
    }
    
    fill_event(e, ctx, syscall_nr);
    
    if (check_self_attack(syscall_nr, ctx, e)) {
        bpf_ringbuf_submit(e, 0);
        return 0;
    }
    
    if (!is_in_container() && !is_protected_process(pid)) {
        bpf_ringbuf_discard(e, 0);
        return 0;
    }
    
    save_syscall_args(syscall_nr, ctx);
    
    switch (syscall_nr) {
        case SYS_mount:
            e->event_type = EVENT_MOUNT;
            bpf_probe_read_user_str(&e->path1, sizeof(e->path1), (void *)ctx->args[0]);
            bpf_probe_read_user_str(&e->path2, sizeof(e->path2), (void *)ctx->args[1]);
            
            if (is_host_mount_path(e->path2)) {
                e->event_type = EVENT_PRIVILEGED;
                e->is_suspicious = 1;
            }
            if (is_path_obfuscated(e->path1) || is_path_obfuscated(e->path2)) {
                e->event_type = EVENT_PATH_BYPASS_ATTEMPT;
                e->is_suspicious = 1;
            }
            break;
            
        case SYS_rename:
        case SYS_renameat:
        case SYS_renameat2:
            e->event_type = EVENT_RENAME;
            if (syscall_nr == SYS_rename) {
                bpf_probe_read_user_str(&e->path1, sizeof(e->path1), (void *)ctx->args[0]);
                bpf_probe_read_user_str(&e->path2, sizeof(e->path2), (void *)ctx->args[1]);
            } else {
                bpf_probe_read_user_str(&e->path1, sizeof(e->path1), (void *)ctx->args[1]);
                bpf_probe_read_user_str(&e->path2, sizeof(e->path2), (void *)ctx->args[3]);
            }
            
            if (is_host_mount_path(e->path1) || is_host_mount_path(e->path2) ||
                is_cgroup_path(e->path1) || is_cgroup_path(e->path2)) {
                struct rename_entry rentry = {};
                __builtin_memcpy(rentry.old_path, e->path1, sizeof(rentry.old_path));
                __builtin_memcpy(rentry.new_path, e->path2, sizeof(rentry.new_path));
                rentry.timestamp = e->timestamp;
                bpf_map_update_elem(&rename_tracker, &pid, &rentry, BPF_ANY);
                
                e->event_type = EVENT_PATH_BYPASS_ATTEMPT;
                e->is_suspicious = 1;
            }
            if (is_path_obfuscated(e->path1) || is_path_obfuscated(e->path2)) {
                e->event_type = EVENT_PATH_BYPASS_ATTEMPT;
                e->is_suspicious = 1;
            }
            break;
            
        case SYS_symlink:
        case SYS_symlinkat:
            e->event_type = EVENT_SYMLINK;
            if (syscall_nr == SYS_symlink) {
                bpf_probe_read_user_str(&e->path1, sizeof(e->path1), (void *)ctx->args[0]);
                bpf_probe_read_user_str(&e->path2, sizeof(e->path2), (void *)ctx->args[1]);
            } else {
                bpf_probe_read_user_str(&e->path1, sizeof(e->path1), (void *)ctx->args[0]);
                bpf_probe_read_user_str(&e->path2, sizeof(e->path2), (void *)ctx->args[2]);
            }
            
            if (is_host_mount_path(e->path1) || is_host_mount_path(e->path2)) {
                e->event_type = EVENT_PATH_BYPASS_ATTEMPT;
                e->is_suspicious = 1;
            }
            break;
            
        case SYS_unshare:
            e->event_type = EVENT_UNSHARE;
            if (is_dangerous_unshare(ctx->args[0])) {
                e->event_type = EVENT_PRIVILEGED;
                e->is_suspicious = 1;
            }
            break;
            
        case SYS_openat:
        case SYS_open: {
            char *path = (syscall_nr == SYS_openat) ? (void *)ctx->args[1] : (void *)ctx->args[0];
            bpf_probe_read_user_str(&e->path1, sizeof(e->path1), path);
            
            if (is_host_mount_path(e->path1)) {
                e->event_type = EVENT_MOUNT;
                e->is_suspicious = 1;
            }
            if (is_cgroup_path(e->path1)) {
                e->event_type = EVENT_CGROUP;
                e->is_suspicious = 1;
            }
            if (__builtin_memcmp(e->path1, "/proc/self/exe", 14) == 0) {
                e->event_type = EVENT_CVE_2022_0492;
                e->is_suspicious = 1;
            }
            if (is_path_obfuscated(e->path1)) {
                e->event_type = EVENT_PATH_BYPASS_ATTEMPT;
                e->is_suspicious = 1;
            }
            
            if (check_recent_rename_attempt(e->path1)) {
                e->event_type = EVENT_PATH_BYPASS_ATTEMPT;
                e->is_suspicious = 1;
            }
            break;
        }
        
        case SYS_execve:
        case SYS_execveat:
            e->event_type = EVENT_EXECVE;
            if (syscall_nr == SYS_execve) {
                bpf_probe_read_user_str(&e->path1, sizeof(e->path1), (void *)ctx->args[0]);
            } else {
                bpf_probe_read_user_str(&e->path1, sizeof(e->path1), (void *)ctx->args[1]);
            }
            
            if (is_host_mount_path(e->path1)) {
                e->event_type = EVENT_PRIVILEGED;
                e->is_suspicious = 1;
            }
            if (check_recent_rename_attempt(e->path1)) {
                e->event_type = EVENT_PATH_BYPASS_ATTEMPT;
                e->is_suspicious = 1;
            }
            break;
            
        case SYS_write: {
            if (is_privileged()) {
                e->event_type = EVENT_PRIVILEGED;
            }
            break;
        }
    }
    
    bpf_ringbuf_submit(e, 0);
    return 0;
}

// tracepoint: sys_exit - 在系统调用完成后再次验证
SEC("tracepoint/syscalls/sys_exit")
int tracepoint_sys_exit(struct trace_event_raw_sys_exit *ctx) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    __s32 ret = ctx->ret;
    
    if (is_protected_process(pid)) {
        bpf_map_delete_elem(&syscall_args_map, &pid);
        return 0;
    }
    
    if (!is_in_container()) {
        bpf_map_delete_elem(&syscall_args_map, &pid);
        return 0;
    }
    
    struct syscall_args *args = bpf_map_lookup_elem(&syscall_args_map, &pid);
    if (!args) {
        return 0;
    }
    
    if (ret >= 0) {
        struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
        if (!e) {
            bpf_map_delete_elem(&syscall_args_map, &pid);
            return 0;
        }
        
        fill_event(e, NULL, ctx->id);
        e->retval = ret;
        __builtin_memcpy(&e->path1, &args->path1, sizeof(e->path1));
        __builtin_memcpy(&e->path2, &args->path2, sizeof(e->path2));
        
        switch (ctx->id) {
            case SYS_openat:
            case SYS_open:
                track_fd(ret, args->path1);
                
                if (is_host_mount_path(args->path1)) {
                    e->event_type = EVENT_MOUNT;
                    e->is_suspicious = 1;
                }
                if (is_cgroup_path(args->path1)) {
                    e->event_type = EVENT_CGROUP;
                    e->is_suspicious = 1;
                }
                break;
                
            case SYS_rename:
            case SYS_renameat:
            case SYS_renameat2:
                if (is_host_mount_path(args->path1) || is_host_mount_path(args->path2)) {
                    e->event_type = EVENT_PATH_BYPASS_ATTEMPT;
                    e->is_suspicious = 1;
                }
                break;
                
            case SYS_execve:
            case SYS_execveat:
                if (is_host_mount_path(args->path1)) {
                    e->event_type = EVENT_PRIVILEGED;
                    e->is_suspicious = 1;
                }
                break;
                
            case SYS_mount:
                if (is_host_mount_path(args->path2)) {
                    e->event_type = EVENT_PRIVILEGED;
                    e->is_suspicious = 1;
                }
                break;
        }
        
        if (e->is_suspicious) {
            bpf_ringbuf_submit(e, 0);
        } else {
            bpf_ringbuf_discard(e, 0);
        }
    }
    
    bpf_map_delete_elem(&syscall_args_map, &pid);
    return 0;
}

// kprobe: cgroup_mkdir - 检测cgroup修改
SEC("kprobe/cgroup_mkdir")
int BPF_KPROBE(kprobe_cgroup_mkdir, struct kernfs_node *parent, const char *name, umode_t mode) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    
    if (!is_in_container()) {
        return 0;
    }
    
    struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e) {
        return 0;
    }
    
    fill_event(e, NULL, -1);
    e->event_type = EVENT_CGROUP;
    bpf_probe_read_kernel_str(&e->path1, sizeof(e->path1), name);
    
    if (is_cgroup_path(e->path1)) {
        e->is_suspicious = 1;
    }
    
    bpf_ringbuf_submit(e, 0);
    return 0;
}

// kprobe: attach_pid_cgroup - 检测进程加入cgroup
SEC("kprobe/attach_pid_cgroup")
int BPF_KPROBE(kprobe_attach_pid_cgroup, void *cgrp, void *ctx, int threadgroup) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    
    if (!is_in_container()) {
        return 0;
    }
    
    struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e) {
        return 0;
    }
    
    fill_event(e, NULL, -1);
    e->event_type = EVENT_CGROUP;
    e->is_suspicious = 1;
    
    bpf_ringbuf_submit(e, 0);
    return 0;
}

// kprobe: do_mount - 检测挂载操作（内核态验证）
SEC("kprobe/do_mount")
int BPF_KPROBE(kprobe_do_mount, char *dev_name, char *dir_name, char *type, unsigned long flags, void *data) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    
    if (!is_in_container()) {
        return 0;
    }
    
    struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e) {
        return 0;
    }
    
    fill_event(e, NULL, SYS_mount);
    e->event_type = EVENT_MOUNT;
    
    bpf_probe_read_user_str(&e->path1, sizeof(e->path1), dev_name);
    bpf_probe_read_user_str(&e->path2, sizeof(e->path2), dir_name);
    
    if (is_host_mount_path(e->path2)) {
        e->event_type = EVENT_PRIVILEGED;
        e->is_suspicious = 1;
    }
    
    bpf_ringbuf_submit(e, 0);
    return 0;
}

// kprobe: vfs_rename - 在内核态检测重命名（无法被用户态绕过）
SEC("kprobe/vfs_rename")
int BPF_KPROBE(kprobe_vfs_rename, struct dentry *old_dentry, struct dentry *new_dentry) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    
    if (!is_in_container() && !is_protected_process(pid)) {
        return 0;
    }
    
    struct qstr old_name = BPF_CORE_READ(old_dentry, d_name);
    struct qstr new_name = BPF_CORE_READ(new_dentry, d_name);
    
    const char *old_str = BPF_CORE_READ(old_name, name);
    const char *new_str = BPF_CORE_READ(new_name, name);
    
    if (!old_str || !new_str) {
        return 0;
    }
    
    char old_buf[64], new_buf[64];
    bpf_probe_read_kernel_str(&old_buf, sizeof(old_buf), old_str);
    bpf_probe_read_kernel_str(&new_buf, sizeof(new_buf), new_str);
    
    if (is_host_mount_path(old_buf) || is_host_mount_path(new_buf) ||
        is_cgroup_path(old_buf) || is_cgroup_path(new_buf)) {
        
        struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
        if (!e) {
            return 0;
        }
        
        fill_event(e, NULL, -1);
        e->event_type = EVENT_PATH_BYPASS_ATTEMPT;
        e->is_suspicious = 1;
        __builtin_memcpy(&e->path1, &old_buf, sizeof(e->path1));
        __builtin_memcpy(&e->path2, &new_buf, sizeof(e->path2));
        
        bpf_ringbuf_submit(e, 0);
    }
    
    return 0;
}

// kprobe: security_bprm_check - 检测CVE-2022-0492漏洞利用
SEC("kprobe/security_bprm_check")
int BPF_KPROBE(kprobe_security_bprm_check, void *bprm) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    
    if (!is_in_container()) {
        return 0;
    }
    
    struct task_struct *task = (struct task_struct *)bpf_get_current_task();
    unsigned int no_new_privs = 0;
    
    if (bpf_core_field_exists(task->no_new_privs)) {
        no_new_privs = BPF_CORE_READ(task, no_new_privs);
    }
    
    if (is_privileged() && !no_new_privs) {
        struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
        if (!e) {
            return 0;
        }
        
        fill_event(e, NULL, -1);
        e->event_type = EVENT_CVE_2022_0492;
        e->is_suspicious = 1;
        
        bpf_ringbuf_submit(e, 0);
    }
    
    return 0;
}

// kprobe: unshare_process - 检测unshare操作
SEC("kprobe/unshare_process")
int BPF_KPROBE(kprobe_unshare_process, unsigned long unshare_flags) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    
    if (!is_in_container()) {
        return 0;
    }
    
    struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e) {
        return 0;
    }
    
    fill_event(e, NULL, -1);
    e->event_type = EVENT_UNSHARE;
    e->arg1 = unshare_flags;
    
    if (is_dangerous_unshare(unshare_flags)) {
        e->event_type = EVENT_PRIVILEGED;
        e->is_suspicious = 1;
    }
    
    bpf_ringbuf_submit(e, 0);
    return 0;
}

// kprobe: security_path_link - 检测硬链接创建
SEC("kprobe/security_path_link")
int BPF_KPROBE(kprobe_security_path_link, void *old_dentry, void *new_dir, void *new_dentry) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    
    if (!is_in_container()) {
        return 0;
    }
    
    struct qstr old_name = BPF_CORE_READ(old_dentry, d_name);
    const char *old_str = BPF_CORE_READ(old_name, name);
    
    if (old_str) {
        char buf[64];
        bpf_probe_read_kernel_str(&buf, sizeof(buf), old_str);
        
        if (is_host_mount_path(buf) || is_cgroup_path(buf)) {
            struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
            if (!e) {
                return 0;
            }
            
            fill_event(e, NULL, -1);
            e->event_type = EVENT_PATH_BYPASS_ATTEMPT;
            e->is_suspicious = 1;
            __builtin_memcpy(&e->path1, &buf, sizeof(e->path1));
            
            bpf_ringbuf_submit(e, 0);
        }
    }
    
    return 0;
}

// kprobe: bpf_prog_put - 检测BPF程序卸载尝试
SEC("kprobe/bpf_prog_put")
int BPF_KPROBE(kprobe_bpf_prog_put, void *prog) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    
    if (is_protected_process(pid)) {
        return 0;
    }
    
    struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e) {
        return 0;
    }
    
    fill_event(e, NULL, -1);
    e->event_type = EVENT_SELF_PROTECTION;
    e->is_suspicious = 1;
    bpf_probe_read_kernel_str(&e->path1, sizeof(e->path1), "bpf_prog_unload_attempt");
    
    bpf_ringbuf_submit(e, 0);
    return 0;
}

char _license[] SEC("license") = "GPL";
