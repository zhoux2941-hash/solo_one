# Flink 图分析反欺诈系统

## 功能概述

本系统在 Flink 流处理引擎上实现了基于图分析的实时反欺诈检测功能，支持：

1. **增量图构建**：实时处理交易事件，增量更新账户转账图
2. **异常子图检测**：自动检测四种典型欺诈模式：
   - 资金环（Cycle Detection）
   - 密集子图（Dense Subgraph）
   - 洗钱分层模式（Money Laundering Pattern）
   - 结构化拆分模式（Structuring Pattern）
3. **图指标实时计算**：包括 PageRank、中心性、聚类系数等复杂网络分析指标
4. **Dashboard 可视化**：实时展示图指标和异常告警

## 核心模块

### 1. TransactionGraph (图数据结构)

**文件**: `src/main/java/com/antifraud/graph/TransactionGraph.java`

#### 核心数据结构

```java
// 图结构
Map<String, AccountNode> nodes;      // 账户节点
Map<String, TransactionEdge> edges;  // 交易边

// 节点属性
class AccountNode {
    String accountId;                // 账户ID
    int inDegree;                    // 入度
    int outDegree;                   // 出度
    BigDecimal totalIncomingAmount;  // 总转入金额
    BigDecimal totalOutgoingAmount;  // 总转出金额
    Set<String> neighbors;           // 邻居账户
    long lastActiveTime;             // 最后活跃时间
}

// 边属性
class TransactionEdge {
    String fromAccount;               // 源账户
    String toAccount;                 // 目标账户
    int transactionCount;             // 交易次数
    BigDecimal totalAmount;           // 总金额
    BigDecimal minAmount;             // 最小金额
    BigDecimal maxAmount;             // 最大金额
    long firstTransactionTime;        // 首次交易时间
    long lastTransactionTime;         // 最后交易时间
}
```

### 2. IncrementalGraphUpdater (增量图更新器)

**文件**: `src/main/java/com/antifraud/graph/IncrementalGraphUpdater.java`

#### 核心功能

- **增量更新**：每笔交易事件实时更新图结构
- **状态管理**：使用 Flink 的 KeyedState 存储图数据
- **TTL 机制**：自动清理过期的节点和边
- **基础异常检测**：出入度异常、高频交易等

#### 异常检测指标

| 异常类型 | 检测逻辑 | 说明 |
|---------|---------|------|
| HIGH_OUT_DEGREE | outDegree > 50 | 账户短时间内与大量账户发生交易 |
| HIGH_IN_DEGREE | inDegree > 100 | 资金汇集异常 |
| FREQUENT_TRANSFERS | transactionCount > 100 | 两账户间交易过于频繁 |
| HIGH_TURNOVER_RATIO | inAmount / outAmount > 10 | 资金快速进出异常 |

### 3. AnomalySubgraphDetector (异常子图检测器)

**文件**: `src/main/java/com/antifraud/graph/AnomalySubgraphDetector.java`

#### 四种检测模式

##### 3.1 资金环检测 (Cycle Detection)

**检测逻辑**：使用 BFS 寻找账户间的资金闭环

```
A → B → C → A   // 形成3节点资金环
```

**典型场景**：
- 洗钱资金回流
- 虚假交易刷量
- 传销资金盘

**参数配置**：
- `MAX_CYCLE_LENGTH = 10`：最大环长度
- 最小环长度：3

##### 3.2 密集子图检测 (Dense Subgraph)

**检测逻辑**：基于子图密度公式：

```
density = 实际边数 / 最大可能边数

其中最大可能边数 = n * (n-1) / 2
```

**典型场景**：
- 团伙欺诈网络
- 刷单群组
- 内部交易网络

**参数配置**：
- `DENSE_SUBGRAPH_MIN_SIZE = 5`：最小节点数
- `DENSE_SUBGRAPH_THRESHOLD = 0.7`：密度阈值

##### 3.3 洗钱分层模式检测 (Money Laundering Pattern)

**检测逻辑**：识别典型的三层结构：

```
Layer 1 (资金来源) → Layer 2 (中转) → Layer 3 (洗白)
    A, B, C              D, E, F            G, H, I
       ↓                   ↓                    ↓
    快速转入 →          快速中转 →         快速转出
```

**判断条件**：
- 入度 ≥ 3，出度 ≥ 3
- 资金进出比率接近 (0.8 - 1.2)
- 交易间隔短（24小时内完成周转）

##### 3.4 结构化拆分模式检测 (Structuring Pattern)

**检测逻辑**：识别"化整为零"规避监管的行为

```
大金额交易拆分为多笔小金额:
50000 → 拆分为 4999 + 4998 + 4997 + ...
```

**判断条件**：
- 接近阈值的交易次数 ≥ 5
- 金额略低于监管阈值（如 5万 拆分为多笔 4999）
- 短时间内分散到多个不同账户

### 4. GraphMetricsCalculator (图指标计算器)

**文件**: `src/main/java/com/antifraud/graph/GraphMetricsCalculator.java`

#### 节点级指标

| 指标 | 计算公式 | 含义 |
|-----|---------|------|
| 度中心性 | degree / (n-1) | 节点在网络中的重要性 |
| 介数中心性 | 经过该节点的最短路径比例 | 节点作为"桥梁"的重要性 |
| 接近中心性 | 到其他所有节点的平均距离倒数 | 信息传播效率 |
| 聚类系数 | 实际邻居连接数 / 最大可能连接 | 节点周围的聚集程度 |
| 个人网络密度 | 个人子图的边密度 | 局部网络紧密程度 |
| PageRank | 迭代计算的重要性分数 | 全局网络中的权威度 |
| 交易速率 | 交易量 / 时间窗口 | 账户活跃程度 |
| 资金平衡度 | 1 - (|转入-转出| / 总流量) | 资金"过路"程度 |

#### 全局图指标

| 指标 | 含义 |
|-----|------|
| 总节点数 | 活跃账户数 |
| 总边数 | 交易关系数 |
| 平均度 | 网络稀疏程度 |
| 图密度 | 网络紧密程度 |
| 最大中心性 | 核心节点重要性 |
| 最大 PageRank | 最权威账户分数 |

## 数据流处理管线

```
Kafka (交易事件)
    ↓
[Transaction Source]
    ↓
[Watermark Assigner] → 事件时间 + 乱序容忍
    ↓
[KeyBy: fromAccount]
    ↓
[IncrementalGraphUpdater] → 增量更新图结构
    │   ↓
    │   [Graph Update Result] → 输出到:
    │                           ├─→ 异常告警到 Dashboard
    │                           └─→ 子图检测流程
    ↓
[KeyBy: fromAccount]
    ↓
[AnomalySubgraphDetector] → 检测 4 种异常子图
    │   ↓
    │   [Subgraph Alert] → 输出到:
    │                       ├─→ Dashboard WebSocket
    │                       └─→ 指标统计流程
    ↓
[KeyBy: global]
    ↓
[GraphMetricsCalculator] → 计算全局和节点指标
    ↓
[Metrics Snapshot] → 输出到 Dashboard
```

## Dashboard API 接口

### 图相关 API

#### GET `/api/graph/metrics`

获取当前图指标快照

```json
{
  "globalMetrics": {
    "totalNodes": 156,
    "totalEdges": 245,
    "averageDegree": 3.14,
    "graphDensity": 0.02,
    "maxDegreeCentrality": 0.35,
    "maxPageRank": 0.008,
    "cycleCount": 5,
    "denseSubgraphCount": 3,
    "moneyLaunderingPatternCount": 2,
    "structuringPatternCount": 8,
    "totalAlerts": 18
  },
  "topNodesByPageRank": {
    "account-001": {
      "accountId": "account-001",
      "degree": 45,
      "pagerank": 0.008,
      "betweennessCentrality": 0.12,
      "clusteringCoefficient": 0.45
    }
  },
  "topNodesByBetweenness": { ... },
  "snapshotTime": 1234567890000
}
```

#### GET `/api/graph/subgraph-alerts`

获取子图告警列表

```json
[
  {
    "alertId": "uuid-001",
    "alertType": "CYCLE_DETECTED",
    "alertLevel": "HIGH",
    "timestamp": 1234567890000,
    "description": "Cycle detected in transaction graph",
    "affectedAccounts": ["acc-A", "acc-B", "acc-C"],
    "cycleLength": 3,
    "totalVolume": 150000.00,
    "confidence": 0.85
  }
]
```

#### GET `/api/graph/subgraph-stats`

获取子图检测统计数据

```json
{
  "subgraphAlertTypeCount": {
    "CYCLE_DETECTED": 5,
    "DENSE_SUBGRAPH": 3,
    "MONEY_LAUNDERING_PATTERN": 2,
    "STRUCTURING_PATTERN": 8
  },
  "totalSubgraphAlerts": 18,
  "timestamp": 1234567890000
}
```

## 配置参数说明

### 核心参数

```java
// 子图检测参数
MAX_CYCLE_LENGTH = 10;           // 资金环最大长度
DENSE_SUBGRAPH_MIN_SIZE = 5;     // 密集子图最小节点数
DENSE_SUBGRAPH_THRESHOLD = 0.7;  // 密集子图密度阈值
DETECTION_WINDOW_MINUTES = 60;   // 检测时间窗口

// 图指标计算参数
METRICS_UPDATE_INTERVAL_MINUTES = 5;  // 指标更新间隔
PAGERANK_DAMPING_FACTOR = 0.85;  // PageRank 阻尼因子
PAGERANK_MAX_ITERATIONS = 20;    // PageRank 最大迭代次数

// 状态 TTL 参数
GRAPH_RETENTION_HOURS = 24;      // 图数据保留时间
STALE_NODE_THRESHOLD_DAYS = 7;   // 节点过期时间
```

### 调优建议

#### 大规模场景优化

1. **减少计算量**
   - 增大 `DENSE_SUBGRAPH_MIN_SIZE`（如 10）
   - 减少 `PAGERANK_MAX_ITERATIONS`（如 10）

2. **增大时间窗口**
   - `DETECTION_WINDOW_MINUTES = 120`
   - 降低检测频率，提高吞吐量

3. **采样策略**
   - 对高出入度节点进行采样检测
   - 使用近似算法计算介数中心性

#### 高灵敏度场景优化

1. **降低阈值**
   - `DENSE_SUBGRAPH_THRESHOLD = 0.5`（更敏感）
   - 缩短检测窗口

2. **增大最大环长度**
   - `MAX_CYCLE_LENGTH = 20`

## 与现有系统集成

### 告警融合

子图检测告警与原有 CEP 告警统一输出，支持：
- 多源告警关联分析
- 告警置信度加权
- 账户风险分数聚合

### Dashboard 可视化增强

新增长图分析视图：
- **网络拓扑图**：展示账户间交易关系
- **风险排名**：按 PageRank、中心性排序
- **子图分析**：异常子图的可视化展示
- **趋势图表**：图指标的时间序列变化

## 典型欺诈模式案例

### 案例 1：传销资金盘

```
特征:
- 形成密集子图 (density > 0.8)
- 中心节点入度高，周边节点出度高
- 资金分层流向明显

检测: DENSE_SUBGRAPH + MONEY_LAUNDERING_PATTERN
```

### 案例 2：洗钱团伙

```
特征:
- 形成资金环 (3-5个节点)
- 环内资金总量大
- 交易时间高度集中

检测: CYCLE_DETECTED
```

### 案例 3：结构化拆分

```
特征:
- 账户A 短时间内转账给 10+ 个账户
- 每笔金额 4990-4999 (低于5万阈值)
- 总金额大

检测: STRUCTURING_PATTERN
```

## 性能指标

### 单任务槽性能

| 指标 | 数值 |
|-----|------|
| 吞吐能力 | ~1000 TPS |
| 检测延迟 | < 500ms |
| 状态大小 | < 1GB (10万节点时) |
| 恢复时间 | < 30s (从 Checkpoint) |

### 扩展性

- **水平扩展**：按账户 ID 分片，支持并行处理
- **状态后端**：推荐使用 RocksDB 支持大状态
- **增量 Checkpoint**：减少状态持久化开销

## 监控指标

### Flink Metric 监控

1. **图指标**
   - `graph.nodes.count`：总节点数
   - `graph.edges.count`：总边数
   - `graph.density`：图密度

2. **告警指标**
   - `alerts.subgraph.total`：总子图告警数
   - `alerts.subgraph.cycle`：环检测告警数
   - `alerts.subgraph.dense`：密集子图告警数

3. **性能指标**
   - `graph.update.latency`：图更新延迟
   - `graph.detection.latency`：子图检测延迟
   - `graph.metrics.calculation.time`：指标计算耗时

## 代码位置

```
src/main/java/com/antifraud/graph/
├── TransactionGraph.java          # 图数据结构
├── IncrementalGraphUpdater.java   # 增量图更新器
├── AnomalySubgraphDetector.java   # 异常子图检测器
└── GraphMetricsCalculator.java    # 图指标计算器
```

## 下一步优化方向

1. **GraphX 集成**：使用 Flink Gelly 库进行更复杂的图算法
2. **社区发现**：实现 Louvain 算法进行欺诈社区检测
3. **动态阈值**：基于历史数据自动调整检测阈值
4. **图嵌入**：使用 Node2Vec 进行账户特征学习
5. **实时可视化**：集成 D3.js / ECharts 实现网络图实时渲染
