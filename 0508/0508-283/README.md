# 分布式图数据库算法库

基于BSP（Bulk Synchronous Parallel）模型的分布式图算法库，使用RocksDB作为存储引擎，支持内存/外存混合计算。

## 功能特性

### 核心存储
- **KV存储引擎**: 基于RocksDB的高性能持久化存储
- **图数据模型**: 支持顶点（Vertex）和边（Edge）的存储与管理
- **属性图**: 支持顶点和边的属性存储

### 图算法
1. **PageRank**: 基于BSP模型的并行PageRank计算
2. **增量PageRank**: 图结构变化时仅重新计算受影响区域，误差<1e-6
3. **Louvain社区发现**: 基于模块度优化的社区检测算法
4. **BFS最短路径**: 支持无权和有权图的最短路径计算
5. **K-core分解**: 图的核心分解算法

### 分布式计算
- **BSP模型**: 超级步计算、消息传递、屏障同步
- **并行执行**: 基于线程池的并行顶点计算
- **内存/外存混合**: 超过内存容量的数据自动溢出到磁盘

### API接口
- **RESTful API**: 基于Spring Boot的HTTP接口
- **gRPC API**: 高性能的RPC接口

## 技术栈

- Java 11
- Spring Boot 3.2.0
- RocksDB 8.11.3
- gRPC 1.60.0
- Protocol Buffers 3.25.1
- Lombok 1.18.30

## 项目结构

```
src/
├── main/
│   ├── java/com/graphdb/
│   │   ├── algorithm/          # 图算法实现
│   │   ├── bsp/               # BSP计算框架
│   │   ├── config/            # 配置类
│   │   ├── controller/        # REST API控制器
│   │   ├── dto/               # 数据传输对象
│   │   ├── grpc/              # gRPC服务实现
│   │   ├── memory/            # 内存管理和溢出机制
│   │   ├── model/             # 图数据模型
│   │   └── storage/           # 存储层实现
│   ├── proto/                 # gRPC协议定义
│   └── resources/             # 配置文件
└── test/                      # 测试代码
```

## 快速开始

### 构建项目

```bash
mvn clean package
```

### 运行应用

```bash
java -jar target/distributed-graph-algorithms-1.0.0.jar
```

或者使用Spring Boot Maven插件：

```bash
mvn spring-boot:run
```

## API使用说明

### RESTful API

#### 图操作

```bash
# 添加顶点
POST /api/graph/vertices
Content-Type: application/json

{
  "label": "Person",
  "properties": {
    "name": "Alice",
    "age": 30
  }
}

# 获取顶点
GET /api/graph/vertices/{id}

# 添加边
POST /api/graph/edges
Content-Type: application/json

{
  "fromVertexId": 1,
  "toVertexId": 2,
  "label": "knows",
  "weight": 1.0
}

# 获取图统计信息
GET /api/graph/stats
```

#### 算法接口

```bash
# PageRank计算
POST /api/algorithms/pagerank
Content-Type: application/json

{
  "dampingFactor": 0.85,
  "convergenceThreshold": 1e-6,
  "maxIterations": 100
}

# 社区检测
POST /api/algorithms/communities
Content-Type: application/json

{
  "resolution": 1.0,
  "maxIterations": 10
}

# 最短路径
POST /api/algorithms/shortest-path
Content-Type: application/json

{
  "sourceVertexId": 1
}

# K-core分解
POST /api/algorithms/kcore
Content-Type: application/json

{
  "k": 2
}
```

### gRPC API

gRPC服务运行在端口9090，支持以下方法：

- `AddVertex` - 添加顶点
- `GetVertex` - 获取顶点
- `AddEdge` - 添加边
- `ComputePageRank` - 计算PageRank
- `DetectCommunities` - 社区检测
- `ComputeShortestPath` - 最短路径计算
- `ComputeKCore` - K-core分解
- `GetGraphStats` - 获取图统计信息

## 配置说明

主要配置项在`application.yml`中：

```yaml
graphdb:
  storage:
    path: ./data/rocksdb       # RocksDB存储路径
    enable-wal: true           # 启用WAL日志
  bsp:
    max-supersteps: 100        # 最大超级步数
    message-timeout: 300000    # 消息超时时间(ms)
    barrier-timeout: 600000    # 屏障超时时间(ms)
  memory:
    max-heap-percent: 70       # 最大堆内存百分比
    spill-threshold-percent: 80 # 溢出阈值百分比
    spill-path: ./data/spill    # 溢出数据存储路径
  algorithm:
    pagerank:
      damping-factor: 0.85
      convergence-threshold: 1e-6
      max-iterations: 100
    louvain:
      resolution: 1.0
      max-iterations: 10
    kcore:
      min-k: 1
```

## 算法原理

### BSP计算模型

BSP（Bulk Synchronous Parallel）模型将计算过程划分为一系列超级步（Superstep）：

1. **本地计算**: 每个顶点独立执行计算
2. **消息传递**: 顶点向其他顶点发送消息
3. **屏障同步**: 等待所有顶点完成计算和消息传递

### PageRank算法

PageRank通过迭代计算每个顶点的重要性：

```
PR(v) = (1-d)/N + d * Σ(PR(u)/out_degree(u))
```

其中：
- d = 阻尼因子（通常0.85）
- N = 顶点总数
- out_degree(u) = 顶点u的出度

### Louvain算法

Louvain算法通过两阶段迭代优化模块度：

1. **局部移动**: 将顶点移动到能最大化模块度增益的社区
2. **社区聚合**: 将每个社区聚合为超级顶点，构建新图

### K-core分解

K-core是最大的子图，其中每个顶点至少有k个邻居在子图中，通过逐层剥离低度顶点实现。

## 扩展性

该架构支持以下扩展：

1. **分布式部署**: 可扩展为多节点分布式计算
2. **新算法**: 基于BSP框架易于添加新的图算法
3. **存储后端**: 可替换为其他KV存储引擎
4. **监控集成**: 支持Prometheus等监控系统

## 许可证

MIT License
