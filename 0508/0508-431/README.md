# Redis 多活代理网关

基于 Java + Netty 实现的 Redis 强一致性跨地域多活代理网关。

## 功能特性

### 核心功能
- ✅ **多集群统一接入**：对客户端暴露统一 Redis 地址，后端对接多个地域集群
- ✅ **强一致性写**：写请求同步复制到所有配置集群，全部成功才返回成功
- ✅ **读偏好策略**：支持本地优先、随机、一致性校验三种读策略
- ✅ **业务隔离**：按 Key 前缀路由到不同集群组，实现业务级隔离
- ✅ **故障转移**：集群故障时自动降级，恢复后自动断点续传
- ✅ **断点续传**：基于 WAL 日志实现增量数据恢复，无需全量同步

### 运维管理
- ✅ **管理 API**：HTTP 接口查询集群状态、同步延迟、Key 元数据
- ✅ **配置热加载**：动态更新业务规则，无需重启网关
- ✅ **健康检查**：自动检测集群健康状态
- ✅ **监控指标**：Micrometer 集成，支持 Prometheus 等监控系统

## 架构设计

```
┌─────────────────┐
│  Redis Client   │
└────────┬────────┘
         │ Redis Protocol
         ▼
┌─────────────────────────────────────────┐
│         Netty Gateway Server            │
│  ┌──────────┐  ┌────────────────────┐  │
│  │  Decoder │  │  Command Processor │  │
│  └──────────┘  └─────────┬──────────┘  │
│                           │             │
│  ┌──────────┐  ┌─────────▼──────────┐  │
│  │  Encoder │  │  Cluster Manager   │  │
│  └──────────┘  └─────────┬──────────┘  │
└───────────────────────────┼─────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  北京集群    │   │  上海集群    │   │  深圳集群    │
└──────────────┘   └──────────────┘   └──────────────┘
```

## 快速开始

### 环境要求
- JDK 11+
- Maven 3.6+
- Redis 5.0+

### 编译项目
```bash
mvn clean package -DskipTests
```

### 配置说明

编辑 `gateway-config.json`：

```json
{
  "gateway": {
    "port": 6379,
    "managementPort": 8080,
    "bossThreads": 2,
    "workerThreads": 16,
    "localRegion": "beijing"
  },
  "clusters": [
    {
      "id": "beijing",
      "name": "北京集群",
      "region": "beijing",
      "nodes": ["redis-bj:6379"],
      "maxPoolSize": 100
    }
  ],
  "businessGroups": [
    {
      "name": "user",
      "prefixes": ["user:*"],
      "clusters": ["beijing", "shanghai"],
      "readPreference": "LOCAL_FIRST",
      "writeConsistency": "ALL"
    }
  ]
}
```

#### 读偏好策略
- `LOCAL_FIRST`：优先读取本地地域集群，失败则降级到其他集群
- `RANDOM`：随机选择健康集群读取
- `CONSISTENCY_CHECK`：读取所有集群进行一致性校验

#### 写一致性级别
- `ALL`：所有集群写入成功才返回（强一致性）
- `MAJORITY`：多数集群写入成功即返回

### 启动网关
```bash
java -jar target/redis-multi-live-gateway-1.0.0.jar
```

指定配置文件路径：
```bash
java -jar target/redis-multi-live-gateway-1.0.0.jar /path/to/config.json
```

## 管理 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 网关健康检查 |
| `/api/clusters` | GET | 所有集群状态 |
| `/api/stats` | GET | 网关统计信息 |
| `/api/key/{key}` | GET | 查询 Key 元数据 |
| `/api/replication/lag` | GET | 各集群同步延迟 |
| `/api/business-groups` | GET | 业务组配置 |
| `/api/recovery/status` | GET | 数据恢复状态 |
| `/api/config/reload` | POST | 触发配置热加载 |

### API 示例

查询集群状态：
```bash
curl http://localhost:8080/api/clusters
```

查询 Key 信息：
```bash
curl http://localhost:8080/api/key/user:123
```

## 性能指标

### 目标性能
- **QPS**：单实例支持 5万+ QPS
- **写延迟**：P99 延迟增加 ≤ 10ms（相比单集群）
- **并发连接**：支持 1万+ 并发连接

### 性能优化
1. Netty 事件循环组隔离（Boss/Worker）
2. 后端连接池复用，避免频繁建连
3. 写操作并行执行，减少总耗时
4. 零拷贝协议编解码
5. WAL 日志异步刷盘

## 数据一致性保障

### 写流程
1. 接收客户端写请求
2. 按业务组确定目标集群列表
3. 写入 WAL 日志（保证持久化）
4. 并行发送到所有健康集群
5. 等待所有集群返回成功（可配置为多数派）
6. 更新各集群同步偏移量
7. 返回响应给客户端

### 故障恢复流程
1. 健康检测发现集群恢复
2. 自动触发数据恢复任务
3. 从 WAL 读取该集群上次同步偏移量之后的记录
4. 按业务组过滤需要同步的操作
5. 批量重放写入到恢复的集群
6. 更新同步偏移量，断点续传

## 项目结构

```
src/main/java/com/redis/gateway/
├── RedisGatewayBootstrap.java    # 启动入口
├── api/
│   └── ManagementApiServer.java  # 管理 API 服务
├── cluster/
│   ├── ClusterManager.java       # 集群管理器
│   └── RedisClusterClient.java   # 集群客户端
├── config/
│   ├── ConfigManager.java        # 配置管理器
│   └── GatewayConfig.java        # 配置模型
├── core/
│   └── CommandProcessor.java     # 命令处理器
├── netty/
│   ├── RedisGatewayHandler.java  # Netty 请求处理器
│   ├── RedisGatewayServer.java   # Netty 服务端
├── protocol/
│   ├── RedisCommand.java         # Redis 命令模型
│   ├── RedisDecoder.java         # RESP 协议解码器
│   ├── RedisEncoder.java         # RESP 协议编码器
│   └── RedisResponse.java        # Redis 响应模型
└── replication/
    ├── RecoveryManager.java      # 数据恢复管理器
    └── WriteAheadLog.java        # 预写日志（WAL）
```

## 部署建议

### 高可用部署
- 网关层部署多个实例，前端挂载负载均衡
- 每个地域部署独立网关实例，实现就近接入
- WAL 目录使用持久化存储，避免数据丢失

### 监控告警
关注以下关键指标：
- 各集群健康状态
- 同步延迟（WAL 偏移量差）
- 读写 QPS 和错误率
- 网关连接数和线程池状态

## 许可证

MIT License
