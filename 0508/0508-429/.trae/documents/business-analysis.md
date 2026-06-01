# 微服务依赖关系可视化与故障根因分析系统 — 业务场景与流程分析

## 1. 系统定位与用户画像

### 1.1 系统定位

本系统是一套面向云原生微服务架构的**可观测性 + 智能诊断平台**，解决的核心痛点是：

- 微服务调用链路复杂，故障发生时难以快速判断"哪个服务是根因"
- 传统监控仪表盘只能看到单个服务的指标，缺乏**全局拓扑视角**和**跨服务关联分析**
- SRE 排障时需要手动翻阅多个系统（K8s 控制台、Prometheus、ArgoCD、日志平台），效率低下

### 1.2 用户画像

| 角色 | 核心诉求 | 典型操作路径 |
|------|---------|-------------|
| **SRE 工程师** | 故障发生时快速定位根因，缩短 MTTR | 拓扑图发现红色节点 → 触发根因分析 → 查看结论和建议 |
| **DevOps 运维** | 监控服务健康状态，跟踪版本发布影响 | 拓扑总览页查看全局健康度 → 时间轴对比发布前后指标变化 |
| **后端开发** | 了解自己服务的上下游依赖和性能表现 | 点击服务节点查看详情抽屉 → 跳转到时间轴对比多服务指标 |

---

## 2. 业务场景全景

### 2.1 场景矩阵

```
┌──────────────────────────────────────────────────────────────────┐
│                      系统业务场景全景                              │
├──────────────┬───────────────────────────────────────────────────┤
│  场景一      │  服务依赖发现与拓扑构建                              │
│  (核心基础)   │  K8s/Consul → 服务列表 → Prometheus → 拓扑图渲染    │
├──────────────┼───────────────────────────────────────────────────┤
│  场景二      │  实时健康监控与告警感知                              │
│  (日常使用)   │  10s轮询 → 节点/边状态变化 → 健康面板更新           │
├──────────────┼───────────────────────────────────────────────────┤
│  场景三      │  上下游链路追踪与影响面评估                          │
│  (排障辅助)   │  点击节点 → BFS高亮上下游 → 定位影响范围            │
├──────────────┼───────────────────────────────────────────────────┤
│  场景四      │  故障根因智能分析                                    │
│  (核心价值)   │  异常检测 → Pearson相关性 → 事件关联 → 结论生成     │
├──────────────┼───────────────────────────────────────────────────┤
│  场景五      │  CD事件关联与变更追溯                                │
│  (排障辅助)   │  ArgoCD/FluxCD事件 → 时间线展示 → 与异常时间对齐    │
├──────────────┼───────────────────────────────────────────────────┤
│  场景六      │  多服务指标对比与时间轴联动                           │
│  (深度分析)   │  多服务选中 → brush框选 → 全图表联动缩放            │
├──────────────┼───────────────────────────────────────────────────┤
│  场景七      │  分析历史回溯与知识积累                               │
│  (持续改进)   │  分析结果存LH2 → 分页查询 → 历史对比               │
└──────────────┴───────────────────────────────────────────────────┘
```

### 2.2 端到端业务流程

```
用户打开系统
    │
    ▼
┌─────────────────────────────────────────┐
│ 场景一：服务依赖发现与拓扑构建              │
│                                         │
│  K8s API ──┐                            │
│             ├─→ ServiceDiscovery         │
│  Consul ───┘     │                      │
│                  ▼                      │
│           discover_all() ──→ [Service]  │
│                  │                      │
│                  ▼                      │
│           PrometheusClient ──→ Metrics  │
│                  │                      │
│                  ▼                      │
│           TopologyBuilder ──→ Topology  │
│                  │                      │
│                  ▼                      │
│           G6 渲染拓扑图                    │
└─────────────────┬───────────────────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
┌──────────────┐  ┌───────────────────────┐
│ 场景二：      │  │ 场景三：                │
│ 实时健康监控  │  │ 上下游链路追踪          │
│              │  │                       │
│ 10s轮询刷新  │  │ 点击节点 → BFS遍历     │
│     │        │  │     │                 │
│     ▼        │  │     ▼                 │
│ 节点/边状态  │  │ 高亮上下游链路         │
│ 变化检测     │  │ 其余节点变暗           │
│     │        │  │     │                 │
│     ▼        │  │     ▼                 │
│ HealthPanel  │  │ ServiceDrawer         │
│ 告警更新     │  │ 展示服务详情           │
└──────────────┘  └───────────┬───────────┘
                              │
                    发现异常（红色节点）
                              │
                              ▼
                ┌───────────────────────────────┐
                │ 场景四：故障根因智能分析           │
                │                               │
                │  1. 错误率相关性分析             │
                │     Pearson相关系数 ≥ 0.6      │
                │          │                    │
                │  2. 异常事件检测                 │
                │     错误率突增 > 基线3倍         │
                │          │                    │
                │  3. CD变更事件关联（场景五）      │
                │     ArgoCD/FluxCD → 时间对齐    │
                │          │                    │
                │  4. 去重排序 & 链路构建          │
                │          │                    │
                │  5. 结论生成（中文文字链）        │
                │          │                    │
                │  6. 存储到 LH2（场景七）         │
                └───────────────────────────────┘
                              │
                              ▼
                ┌───────────────────────────────┐
                │ 场景六：多服务指标对比             │
                │                               │
                │  选中多个服务                    │
                │      │                        │
                │      ▼                        │
                │  ECharts 折线图渲染             │
                │      │                        │
                │      ▼                        │
                │  Brush框选 → dataZoom联动      │
                │  所有图表同步缩放                │
                └───────────────────────────────┘
```

---

## 3. 重点场景深度分析

### 3.1 场景一：服务依赖发现与拓扑构建（核心基础）

这是整个系统的数据基础层，决定了"系统知道哪些服务存在、谁调用了谁"。

#### 3.1.1 双源服务发现

系统同时支持 **Kubernetes** 和 **Consul** 两种服务发现来源，覆盖了云原生架构中最常见的两种服务注册模式：

**Kubernetes 发现流程**（[discovery.py](file:///e:/trae-project/0508-429/api/app/services/discovery.py#L121-L152)）：

```
K8s API Server
    │
    │  GET /api/v1/pods
    ▼
Pod 列表
    │
    │  遍历每个 Pod
    ▼
提取 metadata.labels["app"]  ─── 服务名
提取 metadata.labels["version"] ── 版本号
提取 status.podIP  ──────────── 地址
提取 status.phase  ──────────── 运行状态
提取 containerStatuses[].restartCount ── 重启次数
    │
    │  按 app label 分组
    ▼
Service(name, instances[], source="kubernetes", version)
```

关键设计点：
- **标签匹配策略**：优先 `app` 标签，其次 `app.kubernetes.io/name`，兼容两种 K8s 应用命名规范
- **Pod 状态映射**：`status.phase`（Running/Pending/CrashLoopBackOff）直接映射到 `ServiceInstance.status`
- **重启次数汇总**：遍历 `containerStatuses` 数组累加 `restartCount`，这对后续根因分析中的 Pod 重启维度至关重要

**Consul 发现流程**（[discovery.py](file:///e:/trae-project/0508-429/api/app/services/discovery.py#L154-L181)）：

```
Consul Agent
    │
    │  GET /v1/catalog/services  ─── 获取服务名列表
    ▼
服务名列表
    │
    │  对每个服务名:
    │  GET /v1/catalog/service/{name}
    ▼
服务实例列表
    │
    │  提取 ServiceID  ──── 实例名
    │  提取 ServiceAddress ── 地址
    │  提取 ServicePort  ──── 端口
    │  提取 ServiceMeta  ──── 元数据(含version)
    ▼
Service(name, instances[], source="consul", version)
```

关键设计点：
- Consul 的健康状态用 `"passing"` 表示（与 K8s 的 `"Running"` 不同），在前端展示时需注意语义统一
- 版本号从 `ServiceMeta.version` 获取，这是 Consul 的约定字段

**双源合并策略**（[discovery.py](file:///e:/trae-project/0508-429/api/app/services/discovery.py#L183-L192)）：

```python
merged: dict[str, Service] = {}
for svc in k8s_services + consul_services:
    if svc.name in merged:
        merged[svc.name].instances.extend(svc.instances)  # 同名服务合并实例
    else:
        merged[svc.name] = svc.model_copy(deep=True)
```

- **同名合并**：如果 K8s 和 Consul 都注册了同名服务，将实例合并到同一个 Service 对象下
- **深拷贝**：使用 `model_copy(deep=True)` 避免修改原始 Mock 数据

**降级策略**：两个数据源都使用 try/except 包裹，API 不可达时自动降级到 `MOCK_SERVICES`（32 个预定义服务），确保系统始终有数据可展示。

#### 3.1.2 调用关系发现与拓扑构建

服务发现只能得到"有哪些服务"，而"谁调用了谁"需要从 Prometheus 指标中推导。

**边的发现机制**（[topology.py](file:///e:/trae-project/0508-429/api/app/services/topology.py#L32-L65)）：

```
MOCK_EDGE_METRICS (预定义的调用关系字典)
    │
    │  key: (source, target) 元组
    │  value: {call_count, error_rate, avg_latency}
    ▼
过滤: source ∈ service_names AND target ∈ service_names
    │
    │  对每条边:
    │  prometheus.get_call_metrics(source, target, start, end)
    ▼
TopologyEdge(source, target, call_count, error_rate, avg_latency, health)
```

关键设计点：
- **边来源**：当前版本边的关系定义在 `MOCK_EDGE_METRICS` 中（69 条），生产环境应从 Prometheus 的 `source`/`target` 标签动态查询
- **健康度判定**（[config.py](file:///e:/trae-project/0508-429/api/app/config.py#L10-L13)）：
  - 节点：`error_rate ≥ 5%` 或 `p99_latency ≥ 1000ms` → `error`；`≥ 1%` 或 `≥ 500ms` → `warning`
  - 边：`error_rate ≥ 5%` → `error`；`≥ 1%` → `warning`

**节点状态判定**（[topology.py](file:///e:/trae-project/0508-429/api/app/services/topology.py#L12-L17)）：

```
服务指标
    │
    ├── error_rate ≥ 5%  ──→ error (红色)
    ├── p99 ≥ 1000ms    ──→ error (红色)
    ├── error_rate ≥ 1% ──→ warning (黄色)
    ├── p99 ≥ 500ms     ──→ warning (黄色)
    └── 其余            ──→ healthy (绿色)
```

#### 3.1.3 拓扑图前端渲染

**数据流**：`TopologyPage` → `fetchTopology()` → Store → `TopologyGraph` 组件 → G6 渲染

**渲染优化策略**（[TopologyGraph.tsx](file:///e:/trae-project/0508-429/src/components/TopologyGraph.tsx)）：

| 优化项 | 方案 | 原因 |
|--------|------|------|
| shadowBlur | 完全移除 | Canvas 高斯模糊每帧重绘，30+节点时卡顿 |
| 样式回调 | 预计算写入 style 对象 | 避免每帧执行 `(d) => ...` 函数 |
| animation | 关闭 | 消除持续动画帧计算 |
| 力导向布局 | 3秒后自动 stopLayout | d3-force O(n²)，稳定后无需继续计算 |
| 拖拽元素 | 节点>20时禁用 | 减少交互重绘开销 |
| ResizeObserver | 200ms 防抖 | 防止窗口变化时频繁 resize |
| 边 ID | `${source}->${target}` | 稳定 ID 使 G6 可增量更新而非销毁重建 |

---

### 3.2 场景四：故障根因智能分析（核心价值）

这是系统最核心的业务场景，目标是从"某个服务异常"出发，自动推导出"最可能的根因是什么"。

#### 3.2.1 分析维度

```
异常服务
    │
    ├── 维度1：自身错误率变化曲线
    │   └── _detect_anomaly_events()
    │       基线 = 前1/4时间窗口的均值
    │       触发条件 = 当前值 > 基线 × 3 且 > 1%
    │
    ├── 维度2：上游服务的调用量变化
    │   └── _analyze_error_rate_correlation()
    │       Pearson相关系数 ≥ 0.6 → 强相关
    │
    ├── 维度3：配置变更事件（ArgoCD/FluxCD）
    │   └── CDIntegration.get_change_events()
    │       部署、回滚、配置变更
    │
    ├── 维度4：版本发布记录
    │   └── 同上，event_type = "deployment"
    │
    └── 维度5：Pod重启次数
        └── ServiceInstance.restart_count
            来自K8s containerStatuses
```

#### 3.2.2 Pearson 相关系数计算

这是根因分析的数学核心（[root_cause.py](file:///e:/trae-project/0508-429/api/app/services/root_cause.py#L100-L113)）：

```
服务A错误率时序: [a1, a2, a3, ..., an]
服务B错误率时序: [b1, b2, b3, ..., bn]

协方差: Cov(A,B) = Σ(ai - ā)(bi - b̄) / n
标准差: σA = √(Σ(ai - ā)² / n)
        σB = √(Σ(bi - b̄)² / n)

相关系数: r = Cov(A,B) / (σA × σB)

判定:
  |r| ≥ 0.8  → 强相关（高置信度根因）
  |r| ≥ 0.6  → 中等相关（需结合其他维度确认）
  |r| < 0.6  → 弱相关/不相关
```

实际使用中，系统会计算目标服务与其所有上游服务的错误率相关系数，取 |r| ≥ 0.6 的作为候选根因。

#### 3.2.3 分析结果去重与排序

```python
all_events = root_causes + anomaly_events  # 两个维度合并
seen: set[str] = set()
deduped = []
for rc in sorted(all_events, key=lambda x: x.correlation_score, reverse=True):
    if rc.service_name not in seen:  # 同一服务只保留最高分数的条目
        seen.add(rc.service_name)
        deduped.append(rc)
```

- 按 `correlation_score` 降序排列，最可能的根因排在最前
- 同一服务只保留一条记录（分数最高的），避免信息冗余

#### 3.2.4 结论生成（中文文字链）

系统根据主根因的 `event_type` 选择不同的结论模板（[root_cause.py](file:///e:/trae-project/0508-429/api/app/services/root_cause.py#L251-L288)）：

| event_type | 结论模板 |
|------------|---------|
| `deployment` | "上游服务 {name} 在 {time} 发布新版本后错误率上升，与 {target} 的异常相关性达 {score}。" |
| `error_spike` | "服务 {name} 在 {time} 检测到错误率突增，相关性分数 {score}。" |
| `error_correlation` | "服务 {name} 的错误率与 {target} 存在强相关性（相关系数 {score}）。" |

然后追加：
- 受影响下游服务列表
- 故障传播链路（`A(影响) → B(影响) → C(影响)`）
- 建议操作

**示例输出**：

> 上游服务 order-api 在 14:23 发布新版本后错误率上升，与 payment-service 的异常相关性达 87%。受影响下游服务：inventory-service、notification-service。故障传播链路：order-api(新版本引入支付回调逻辑缺陷) → payment-service(支付请求超时，错误率达 6.2%) → inventory-service(库存扣减请求失败率升至 4.5%)。建议操作：建议回滚至 v2.3.0 版本，并修复支付回调处理逻辑后重新发布

---

### 3.3 场景五：CD 事件关联与变更追溯

当根因分析指向某个服务的"版本发布"或"配置变更"时，需要从 CD 系统获取详细信息。

**ArgoCD 事件获取**（[cd_integration.py](file:///e:/trae-project/0508-429/api/app/services/cd_integration.py#L56-L86)）：

```
ArgoCD API
    │
    │  GET /api/v1/applications
    ▼
Application 列表
    │
    │  过滤: metadata.labels.app == service_name
    ▼
目标 Application
    │
    │  遍历 status.history[]
    │  过滤: deployedAt 在 [start, end] 范围内
    ▼
ChangeEvent(service_name, event_type="deployment", source="argocd",
            details={image, revision})
```

**FluxCD 事件获取**（[cd_integration.py](file:///e:/trae-project/0508-429/api/app/services/cd_integration.py#L88-L113)）：

```
FluxCD API
    │
    │  GET /api/v1/namespaces/{ns}/revisions
    ▼
Revision 列表
    │
    │  过滤: metadata.labels.app == service_name
    │  过滤: creationTimestamp 在 [start, end] 范围内
    ▼
ChangeEvent(service_name, event_type, source="fluxcd", details)
```

**合并策略**：ArgoCD + FluxCD 事件合并后按 `timestamp` 升序排列。

---

### 3.4 场景六：多服务指标对比与时间轴联动

**数据流**：`TimelinePage` → `fetchTimeSeries()` → Prometheus `get_timeseries()` → ECharts 渲染

**PromQL 查询映射**（[prometheus_client.py](file:///e:/trae-project/0508-429/api/app/services/prometheus_client.py#L247-L251)）：

| metric_type | PromQL |
|-------------|--------|
| `request_count` | `sum(rate(http_requests_total{service="X"}[5m]))` |
| `error_rate` | `sum(rate(http_requests_total{service="X",code=~"5.."}[5m])) / sum(rate(http_requests_total{service="X"}[5m]))` |
| `p99_latency` | `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service="X"}[5m])) by (le))` |

**Mock 时序数据生成**（[prometheus_client.py](file:///e:/trae-project/0508-429/api/app/services/prometheus_client.py#L125-L145)）：

```
基础值 + 高斯噪声
    │
    │  如果是异常服务(order-api, payment-service)
    │  且时间在时间窗口的 60%~85% 区间
    ▼
错误率 × 6倍 | 延迟 × 3倍 | 请求量 × 1.5倍
    │
    ▼
模拟出"故障前正常 → 故障时突增 → 故障后恢复"的曲线形态
```

**Brush 框选联动**：用户在 ECharts 图表上用鼠标框选一个时间范围，触发 `onBrushSelect` 回调，更新 Store 中的 `timeRange`，所有图表同步缩放到选中的时间范围。

---

## 4. 数据模型关系

```
Service ──1:N──→ ServiceInstance        (一个服务有多个实例)
Service ──1:N──→ TopologyNode           (服务映射为拓扑节点)
TopologyEdge ──→ Service (source)       (边关联两个服务)
TopologyEdge ──→ Service (target)
RootCauseAnalysis ──1:N──→ RootCauseEntry  (一次分析包含多个根因)
RootCauseAnalysis ──1:N──→ EventChainItem  (一次分析包含事件链)
AnalysisHistoryRecord ──1:N──→ RootCauseEntry  (历史记录包含根因详情)
ChangeEvent ──→ Service                  (变更事件关联服务)
MetricSeries ──→ Service                (指标序列关联服务)
```

---

## 5. API 调用链路

### 5.1 拓扑总览页

```
页面加载/10s刷新
    │
    ├── GET /api/topology?start=...&end=...
    │       │
    │       ├── ServiceDiscovery.discover_all()
    │       │       ├── discover_from_kubernetes()
    │       │       └── discover_from_consul()
    │       │
    │       └── TopologyBuilder.build_topology()
    │               ├── PrometheusClient.get_service_request_count() × N
    │               ├── PrometheusClient.get_service_error_rate() × N
    │               ├── PrometheusClient.get_service_p99_latency() × N
    │               └── PrometheusClient.get_call_metrics() × E
    │
    └── 点击节点 → 更新 selectedService
            │
            └── ServiceDrawer 展示
                    ├── GET /api/services/{name}/detail
                    └── GET /api/metrics/timeseries?services=name&metric_type=...
```

### 5.2 根因分析页

```
选择服务 + 时间范围 + 点击"分析"
    │
    ├── POST /api/analysis/root-cause
    │       │
    │       ├── RootCauseAnalyzer.analyze()
    │       │       ├── _analyze_error_rate_correlation()
    │       │       │       ├── get_timeseries([target], "error_rate")
    │       │       │       └── get_timeseries([dep], "error_rate") × N
    │       │       │       └── _calculate_correlation() (Pearson)
    │       │       │
    │       │       ├── _detect_anomaly_events()
    │       │       │       └── get_timeseries([target], "error_rate")
    │       │       │
    │       │       ├── _build_event_chain()
    │       │       └── _format_conclusion()
    │       │
    │       └── HistoryStore.save_analysis()  ──→ LH2 / 内存
    │
    ├── GET /api/events/changes?service_name=...&start=...&end=...
    │       │
    │       └── CDIntegration.get_change_events()
    │               ├── get_argocd_events()
    │               └── get_fluxcd_events()
    │
    └── GET /api/analysis/history?limit=5&offset=0
            │
            └── HistoryStore.get_history()  ──→ LH2 / 内存
                    返回 { total, records }  (按 created_at 倒序)
```

### 5.3 时间轴对比页

```
选择多个服务 + 指标类型 + 时间范围
    │
    └── GET /api/metrics/timeseries?services=a,b,c&metric_type=error_rate&start=...&end=...
            │
            └── PrometheusClient.get_timeseries()
                    ├── 连接 Prometheus → range_query
                    └── 不可达 → _generate_mock_timeseries()
```

---

## 6. 降级与容错策略

| 外部依赖 | 检测方式 | 降级方案 | 代码位置 |
|---------|---------|---------|---------|
| Kubernetes API | httpx 请求 try/except | 返回 `MOCK_SERVICES` 中 `source="kubernetes"` 的部分 | [discovery.py](file:///e:/trae-project/0508-429/api/app/services/discovery.py#L150-L152) |
| Consul API | httpx 请求 try/except | 返回 `MOCK_SERVICES` 中 `source="consul"` 的部分 | [discovery.py](file:///e:/trae-project/0508-429/api/app/services/discovery.py#L179-L181) |
| Prometheus | 首次请求检查 `/api/v1/status/config`，缓存可用性 | 所有 `get_*` 方法直接返回 Mock 值 | [prometheus_client.py](file:///e:/trae-project/0508-429/api/app/services/prometheus_client.py#L153-L162) |
| ArgoCD | httpx 请求 try/except | 返回 `MOCK_ARGOCD_EVENTS` 过滤结果 | [cd_integration.py](file:///e:/trae-project/0508-429/api/app/services/cd_integration.py#L84-L86) |
| FluxCD | httpx 请求 try/except | 返回 `MOCK_FLUXCD_EVENTS` 过滤结果 | [cd_integration.py](file:///e:/trae-project/0508-429/api/app/services/cd_integration.py#L112-L113) |
| LH2 | 首次请求检查 `/health`，缓存可用性 | `_in_memory_store` 内存列表，支持分页和倒序 | [history.py](file:///e:/trae-project/0508-429/api/app/services/history.py#L131-L140) |

---

## 7. Mock 场景：order-api 级联故障

系统内置了一个完整的级联故障 Mock 场景，用于演示和测试：

```
时间线：
14:23  order-api 发布 v2.3.1（ArgoCD 事件）
       └── 新版本引入支付回调处理逻辑缺陷
14:24  order-api 内部 500 错误增多
14:25  payment-service 支付请求超时增加
       └── 错误率从 0.5% 飙升至 6.2%
14:26  inventory-service 库存扣减请求失败
       └── 错误率升至 4.5%
14:27  gateway P99 延迟升高
       └── 用户请求排队
14:28  notification-service 上游消息堆积
15:10  order-api 回滚至 v2.3.0（ArgoCD 回滚事件）

指标表现：
┌──────────────────┬──────────────┬───────────┬─────────────┐
│ 服务              │ 请求量/min   │ 错误率     │ P99延迟(ms)  │
├──────────────────┼──────────────┼───────────┼─────────────┤
│ order-api        │ 15,820       │ 8.3% 🔴   │ 1,240 🔴    │
│ payment-service  │ 9,540        │ 6.2% 🔴   │ 890 🔴      │
│ inventory-service│ 6,100        │ 4.5% 🟡   │ 680 🟡      │
│ gateway          │ 42,100       │ 3.5% 🟡   │ 520 🟡      │
│ payment-gateway  │ 8,100        │ 1.2% 🟡   │ 280         │
│ cache-service    │ 18,500       │ 0.1% 🟢   │ 12 🟢       │
│ health-check     │ 15,000       │ 0.0% 🟢   │ 5 🟢        │
└──────────────────┴──────────────┴───────────┴─────────────┘

调用链路（拓扑边）：
gateway → order-api         (12,800次, 错误率7.8% 🔴)
order-api → payment-service  (8,900次, 错误率6.5% 🔴)
order-api → inventory-service(7,600次, 错误率5.2% 🔴)
payment-service → payment-gateway (7,800次, 错误率1.2% 🟡)
payment-service → fraud-detection  (7,400次, 错误率0.5%)
```

---

## 8. 配置阈值参考

定义在 [config.py](file:///e:/trae-project/0508-429/api/app/config.py#L10-L13)：

| 阈值 | 值 | 用途 |
|------|---|------|
| `ERROR_RATE_WARNING` | 1% | 节点/边进入 warning 状态的错误率阈值 |
| `ERROR_RATE_ERROR` | 5% | 节点/边进入 error 状态的错误率阈值 |
| `LATENCY_WARNING_MS` | 500ms | 节点进入 warning 状态的延迟阈值 |
| `LATENCY_ERROR_MS` | 1000ms | 节点进入 error 状态的延迟阈值 |

可通过环境变量覆盖所有外部服务 URL 和阈值。
