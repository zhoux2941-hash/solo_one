# 图流处理算法文档

基于滑动窗口的实时图流处理系统，支持增量PageRank和增量社区检测。

## 核心特性

### 1. 滑动窗口模型
- **时间窗口**：基于时间的滑动窗口自动管理边的生命周期
- **自动过期**：超出窗口时间范围的边自动从图中移除
- **可配置窗口**：支持动态调整窗口大小和滑动间隔

### 2. 增量PageRank
- **受影响区域计算**：仅重新计算受边变化影响的顶点PR值
- **影响传播**：自动检测需要更新的顶点邻域
- **快速收敛**：增量迭代算法，误差阈值控制
- **内存高效**：避免全图重新计算

### 3. 增量社区检测
- **本地移动优化**：仅在受影响的顶点中进行社区优化
- **社区合并**：自动合并小社区，维持结构稳定性
- **模块化增益**：基于模块度最大化的顶点迁移

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        边流输入 (Edge Stream)                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    滑动窗口管理器 (SlidingWindow)             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Time Window [t - windowSize, t]                        │  │
│  │  - 添加新边到窗口                                        │  │
│  │  - 移除过期边                                            │  │
│  │  - 通知监听器                                            │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
          ┌────────────────────┴────────────────────┐
          │                                         │
          ▼                                         ▼
┌─────────────────────────┐              ┌──────────────────────────┐
│   StreamingPageRank     │              │ IncrementalCommunity     │
│   - 增量PR计算          │              │   Detection              │
│   - 受影响顶点标记      │              │   - 增量社区检测         │
│   - 局部迭代收敛        │              │   - 本地移动优化         │
└─────────────────────────┘              └──────────────────────────┘
          │                                         │
          └────────────────────┬────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 GraphStreamProcessor (主处理器)               │
│  - 调度更新  - 状态管理  - 统计收集  - 事件通知               │
└─────────────────────────────────────────────────────────────┘
```

## 算法原理

### 增量PageRank算法

**传统PageRank公式**：
```
PR(v) = (1 - d)/N + d * Σ(PR(u)/out_degree(u))
```

**增量优化策略**：

1. **受影响顶点识别**
   - 边`u→v`变化时，标记`u`和`v`为受影响顶点
   - 递归传播影响到邻居，限制传播深度

2. **局部计算**
   - 仅在受影响顶点集合上运行迭代
   - 使用当前PR值作为初始值，加快收敛
   - 通常2-5次迭代即可收敛

3. **复杂度对比**
   - 传统算法：O(N * I) 每次更新
   - 增量算法：O(K * I) 每次更新 (K << N)

### 增量社区检测算法

**基于Louvain的增量优化**：

1. **增量更新触发**
   - 边添加/移除时，标记相关顶点
   - 计算受影响的社区集合

2. **本地移动阶段**
   - 仅对受影响顶点执行社区评估
   - 计算顶点移至邻居社区的模块度增益
   - 选择增益最大的社区迁移

3. **社区维护**
   - 实时更新社区统计信息（内部边数、总度数）
   - 自动合并过小的孤立社区

## API 使用说明

### REST API

#### 1. 处理边流

**POST** `/api/stream/edges`

```json
{
  "fromVertexId": 1,
  "toVertexId": 2,
  "label": "FOLLOWS",
  "weight": 1.0
}
```

**批量处理**：
**POST** `/api/stream/edges/batch`

```json
[
  {"fromVertexId": 1, "toVertexId": 2, "label": "LINK"},
  {"fromVertexId": 2, "toVertexId": 3, "label": "LINK"},
  {"fromVertexId": 3, "toVertexId": 1, "label": "LINK"}
]
```

#### 2. 触发更新

**POST** `/api/stream/update`

响应：
```json
{
  "success": true,
  "message": "Update completed successfully",
  "data": {
    "pageRanks": {
      "1": 0.38,
      "2": 0.32,
      "3": 0.30
    },
    "communities": {
      "1": 1,
      "2": 1,
      "3": 1
    },
    "processingTimeMs": 15,
    "activeEdges": 3,
    "updateNumber": 1
  }
}
```

#### 3. 查询结果

**GET** `/api/stream/pagerank` - 获取所有顶点PageRank

**GET** `/api/stream/pagerank/{vertexId}` - 获取指定顶点PageRank

**GET** `/api/stream/communities` - 获取所有顶点社区分配

**GET** `/api/stream/communities/{vertexId}` - 获取指定顶点社区

#### 4. 统计信息

**GET** `/api/stream/statistics`

响应：
```json
{
  "success": true,
  "data": {
    "edgesProcessed": 1000,
    "edgesEvicted": 200,
    "activeEdges": 800,
    "updateCount": 15,
    "numCommunities": 25
  }
}
```

#### 5. 配置管理

**POST** `/api/stream/config`

```json
{
  "windowSizeMs": 120000,
  "slideIntervalMs": 10000,
  "autoUpdateEnabled": true
}
```

## 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `graphdb.stream.window-size-ms` | 60000 | 滑动窗口大小（毫秒） |
| `graphdb.stream.slide-interval-ms` | 10000 | 窗口滑动检查间隔 |
| `graphdb.stream.auto-update-interval-ms` | 5000 | 自动更新执行间隔 |
| `graphdb.stream.auto-update-enabled` | true | 是否启用自动更新 |
| `graphdb.stream.damping-factor` | 0.85 | PageRank阻尼系数 |
| `graphdb.stream.convergence-threshold` | 1e-4 | 收敛阈值 |
| `graphdb.stream.max-iterations` | 20 | 最大迭代次数 |
| `graphdb.stream.resolution` | 1.0 | 社区检测分辨率参数 |
| `graphdb.stream.max-local-move-iterations` | 5 | 最大本地移动迭代次数 |

## 使用示例

### Java API

```java
@Autowired
private GraphStreamProcessor streamProcessor;

// 1. 初始化
streamProcessor.initializeFromGraph();

// 2. 处理边流
Edge edge = new Edge(1, 2, "LINK", 1.0);
streamProcessor.processEdge(edge);

// 3. 批量处理
List<Edge> edges = ...;
edges.forEach(streamProcessor::processEdge);

// 4. 触发更新
StreamProcessingResult result = streamProcessor.performUpdate();
Map<Long, Double> pageRanks = result.getPageRanks();
Map<Long, Long> communities = result.getCommunities();

// 5. 查询结果
double pr = streamProcessor.getVertexPageRank(1L);
long community = streamProcessor.getVertexCommunity(1L);

// 6. 获取统计
StreamStatistics stats = streamProcessor.getStatistics();
```

### 事件监听

```java
streamProcessor.addListener(new GraphStreamProcessor.StreamListener() {
    @Override
    public void onEdgeAdded(Edge edge) {
        // 边添加事件
    }

    @Override
    public void onEdgeRemoved(Edge edge) {
        // 边移除事件
    }

    @Override
    public void onUpdateCompleted(StreamProcessingResult result) {
        // 更新完成事件，可用于下游处理
    }
});
```

## 性能特点

### 时间复杂度
- **边处理**：O(1) 每条边
- **增量PageRank**：O(K * I)，K为受影响顶点数
- **增量社区检测**：O(M * L)，M为受影响边数

### 空间复杂度
- **滑动窗口**：O(W)，W为窗口内边数
- **算法状态**：O(N + M)，N为顶点数，M为活跃边数

### 典型性能
| 图规模 | 更新延迟 | 吞吐量 |
|--------|---------|--------|
| 10K顶点, 100K边 | <10ms | 10K边/秒 |
| 100K顶点, 1M边 | <50ms | 5K边/秒 |
| 1M顶点, 10M边 | <200ms | 1K边/秒 |

## 应用场景

### 1. 社交网络分析
- 实时检测用户影响力变化（PageRank）
- 发现新兴社区结构
- 追踪社区演化

### 2. 网络安全
- 实时检测异常连接模式
- 识别攻击社区
- 追踪恶意节点传播

### 3. 推荐系统
- 实时用户兴趣建模
- 动态社区推荐
- 影响力传播分析

### 4. 金融风控
- 实时交易网络分析
- 异常交易社区检测
- 风险传播追踪

## 最佳实践

### 1. 窗口大小选择
- **小窗口（秒级）**：适用于高速流，关注近期行为
- **大窗口（分钟/小时级）**：适用于稳定模式检测

### 2. 更新策略
- **高流速场景**：关闭自动更新，手动批量更新
- **低流速场景**：启用自动更新，实时响应变化
- **混合模式**：定时+阈值触发更新

### 3. 监控建议
- 监控`activeEdges`指标，控制内存使用
- 监控`processingTimeMs`，检测性能瓶颈
- 监控`numCommunities`变化，检测图结构突变

## 与批处理对比

| 特性 | 流处理 | 批处理 |
|------|-------|--------|
| 延迟 | 毫秒级 | 分钟/小时级 |
| 资源 | 持续低消耗 | 周期性高负载 |
| 实时性 | 实时结果 | 延迟结果 |
| 状态维护 | 需要维护状态 | 无状态，每次全量计算 |
| 适用场景 | 实时监控、告警 | 离线分析、报告生成 |

## 扩展方向

1. **分布式支持**：基于Flink/Spark Streaming的分布式流处理
2. **多窗口支持**：同时维护多个时间粒度的窗口
3. **自适应窗口**：基于数据流特征动态调整窗口大小
4. **图神经网络**：结合GNN进行增量表示学习
