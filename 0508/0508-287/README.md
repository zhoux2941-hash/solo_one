# eBPF 微服务监控系统

零侵扰的微服务监控系统，基于 eBPF 技术，无需修改应用代码即可实现全方位监控。

## 功能特性

### 应用层监控
- **HTTP/gRPC 请求延迟** - P50/P95/P99 延迟分位数
- **请求吞吐量** - QPS 实时统计
- **错误率统计** - HTTP 4xx/5xx 错误计数

### 网络层监控
- **TCP 重传率** - 实时检测网络拥塞
- **TCP 丢包统计** - 网络质量分析
- **连接拓扑发现** - 自动绘制服务调用图

### 系统层监控
- **系统调用耗时** - 内核函数执行延迟
- **内存分配频率** - kmalloc/vmalloc 统计
- **进程/容器关联** - 自动关联容器元数据

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                     User Space (Go)                          │
├──────────────────┬──────────────────┬───────────────────────┤
│   Metrics Exporter │  Topology Manager │  Container Manager    │
│  (Prometheus)     │ (Service Graph)  │ (Docker/K8s)          │
└────────┬─────────┴────────┬─────────┴───────────┬───────────┘
         │                  │                     │
         └──────────────────┼─────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Ring Buffer   │
                    └───────┬────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                     Kernel Space (eBPF)                        │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│  Tracepoints │   Kprobes    │  uprobes     │   Perf Events   │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬────────┘
       │              │              │                │
  sys_enter    tcp_retransmit  tcp_connect     kmalloc/vmalloc
  sys_exit     tcp_drop       tcp_rcv         (memory tracing)
```

## 系统要求

- **Linux Kernel**: 5.8+ (支持 BPF CO-RE)
- **Go**: 1.21+
- **Clang/LLVM**: 14+
- **Docker**: 20.10+ (可选，用于 Prometheus/Grafana)

## 快速开始

### 1. 安装依赖

```bash
make deps
```

### 2. 编译 eBPF 程序

```bash
make build
```

### 3. 启动监控系统

```bash
# 启动 Prometheus 和 Grafana
make docker-up

# 启动 eBPF 监控器（需要 root 权限）
sudo make run
```

### 4. 访问 Grafana

- 打开浏览器访问: http://localhost:3000
- 默认用户名: `admin`
- 默认密码: `admin`
- 选择 "eBPF Microservice Monitoring" 仪表板

## Prometheus 指标

| 指标名称 | 类型 | 说明 |
|---------|------|------|
| `http_request_latency_seconds` | Histogram | HTTP 请求延迟分布 |
| `http_requests_total` | Counter | HTTP 请求总数 |
| `http_errors_total` | Counter | HTTP 错误总数 |
| `tcp_retransmits_total` | Counter | TCP 重传总数 |
| `tcp_drops_total` | Counter | TCP 丢包总数 |
| `syscall_latency_seconds` | Histogram | 系统调用延迟分布 |
| `memory_allocations_bytes_total` | Counter | 内存分配总字节数 |

## API 接口

### 服务拓扑 API

```bash
curl http://localhost:9090/api/topology
```

返回服务节点和连接边的 JSON 结构，用于可视化服务调用图。

## 容器环境支持

### Docker 容器
- 自动检测容器 IP 和 Cgroup ID
- 关联 Docker Compose 服务名

### Kubernetes Pod
- 自动解析 Pod 名称和命名空间
- 关联容器标签和元数据
- 支持 CRI-O 和 containerd

## 目录结构

```
.
├── bpf/                    # eBPF C 代码
│   └── monitor.bpf.c       # 主监控程序
├── cmd/
│   └── main.go             # Go 主程序入口
├── pkg/
│   ├── metrics/            # 指标收集和导出
│   ├── topology/           # 服务拓扑管理
│   └── container/          # 容器元数据管理
├── deploy/
│   ├── docker-compose.yml  # 部署配置
│   └── config/
│       └── prometheus.yml  # Prometheus 配置
├── grafana/
│   ├── dashboard.json      # Grafana 仪表板
│   └── provisioning/       # 自动配置
└── Makefile
```

## 技术细节

### eBPF 挂载点

| 类型 | 内核函数 | 用途 |
|------|---------|------|
| Tracepoint | `sys_enter_write` | 捕获 HTTP 请求 |
| Tracepoint | `sys_enter/sys_exit` | 系统调用耗时 |
| Kprobe | `tcp_v4_connect` | 连接建立追踪 |
| Kprobe | `tcp_retransmit_skb` | TCP 重传检测 |
| Kprobe | `tcp_drop` | TCP 丢包检测 |
| Kprobe | `kmalloc` | 内存分配追踪 |
| Kprobe | `__vmalloc_node_range` | vmalloc 追踪 |

### 数据传输

- 使用 **Ring Buffer** (BPF_MAP_TYPE_RINGBUF) 高效传递内核数据到用户空间
- 无锁设计，高吞吐量，低延迟
- 支持可变大小事件

## 故障排查

### 1. "Operation not permitted"
确保以 root 权限运行，并且内核支持 BPF：
```bash
sudo cat /proc/config.gz | gunzip | grep CONFIG_BPF
```

### 2. 容器元数据无法关联
检查 Docker API 是否可访问：
```bash
docker ps
curl --unix-socket /var/run/docker.sock http://localhost/version
```

### 3. Grafana 无数据
检查 Prometheus 目标状态：
```bash
curl http://localhost:9091/api/v1/targets
```

## 许可证

GPL v2 (由于 eBPF 代码要求)

## 贡献

欢迎提交 Issue 和 Pull Request！
