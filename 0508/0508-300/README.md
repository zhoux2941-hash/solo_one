# Flink 实时反欺诈系统

基于 Apache Flink + CEP（复杂事件处理）实现的实时反欺诈系统。

## 功能特性

### 核心检测能力
- **复杂欺诈模式检测**：检测 `多IP登录 -> 大额转账 -> 新账户转账` 模式
- **10秒时间窗口**：支持滑动窗口和会话窗口
- **低延迟**：目标检测延迟 < 500ms

### 数据源
- **Kafka**：实时消费登录日志和交易日志
  - Topic: `login-events` - 登录事件
  - Topic: `transaction-events` - 交易事件

### 数据输出
- **Elasticsearch**：存储告警日志，支持历史查询
- **Redis**：
  - 实时黑名单更新（Key: `blacklist:{accountId}`）
  - 风控规则命中率统计（Hash: `alert_stats`）

### 动态规则管理
- **gRPC 服务**：端口 50051
  - UpdateRule - 更新规则
  - GetRule - 获取规则
  - ListRules - 列出所有规则
  - EnableRule/DisableRule - 启用/禁用规则

### 监控 Dashboard
- **Web 界面**：端口 8080
  - 实时告警展示
  - 告警级别统计
  - 风控规则命中率
  - WebSocket 实时推送

## 技术栈

| 组件 | 版本 | 用途 |
|------|------|------|
| Apache Flink | 1.18.0 | 流处理引擎 |
| Flink CEP | 1.18.0 | 复杂事件处理 |
| Apache Kafka | 3.6.0 | 消息队列 |
| Elasticsearch | 7.x | 告警存储 |
| Redis | 6.x+ | 黑名单/统计 |
| gRPC | 1.59.0 | 规则管理 |
| Spark Java | 2.9.4 | Dashboard Web服务 |
| Lombok | 1.18.30 | 代码简化 |

## 数据模型

### LoginEvent（登录事件）
```java
{
  "accountId": "string",
  "ipAddress": "string",
  "timestamp": 1234567890,
  "deviceId": "string",
  "location": "string",
  "success": boolean
}
```

### TransactionEvent（交易事件）
```java
{
  "transactionId": "string",
  "fromAccountId": "string",
  "toAccountId": "string",
  "amount": 10000.00,
  "timestamp": 1234567890,
  "currency": "CNY",
  "transactionType": "TRANSFER",
  "merchant": "string",
  "location": "string"
}
```

### AlertEvent（告警事件）
```java
{
  "alertId": "string",
  "accountId": "string",
  "alertType": "COMPLEX_FRAUD_PATTERN",
  "alertLevel": "CRITICAL",
  "timestamp": 1234567890,
  "description": "string",
  "ipAddresses": ["ip1", "ip2"],
  "transactionAmount": 50000.00,
  "toAccountId": "string",
  "ruleId": "string",
  "ruleName": "string",
  "detectionTimeMs": 10
}
```

## 快速开始

### 1. 环境要求
- JDK 11+
- Maven 3.6+
- Docker（可选，用于启动依赖服务）

### 2. 启动依赖服务

使用 Docker Compose：
```yaml
version: '3'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  elasticsearch:
    image: elasticsearch:7.17.15
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"
```

### 3. 创建 Kafka Topic
```bash
kafka-topics --create --topic login-events --bootstrap-server localhost:9092
kafka-topics --create --topic transaction-events --bootstrap-server localhost:9092
```

### 4. 编译项目
```bash
mvn clean package -DskipTests
```

### 5. 运行反欺诈系统
```bash
java -jar target/flink-real-time-antifraud-1.0.0.jar
```

### 6. 生成测试数据
```bash
java -cp target/flink-real-time-antifraud-1.0.0.jar com.antifraud.TestDataGenerator
```

### 7. 访问 Dashboard
打开浏览器访问：http://localhost:8080

## gRPC 规则管理

### 编译 gRPC 代码
```bash
mvn protobuf:compile protobuf:compile-custom
```

### gRPC 客户端示例
```java
ManagedChannel channel = ManagedChannelBuilder.forAddress("localhost", 50051)
    .usePlaintext()
    .build();

RuleServiceBlockingStub stub = RuleServiceGrpc.newBlockingStub(channel);

// 更新规则
UpdateRuleResponse response = stub.updateRule(UpdateRuleRequest.newBuilder()
    .setRule(FraudRule.newBuilder()
        .setRuleId("rule-001")
        .setRuleName("Updated Rule")
        .setEnabled(true)
        .setRuleType("COMPLEX_PATTERN")
        .setConfig(RuleConfig.newBuilder()
            .setTimeWindowSeconds(15)
            .setLargeTransactionThreshold(20000)
            .build())
        .build())
    .build());
```

## 项目结构

```
src/main/java/com/antifraud/
├── AntiFraudJob.java              # Flink 主程序
├── TestDataGenerator.java         # 测试数据生成器
├── cep/
│   └── FraudPatternDetector.java  # CEP 模式检测器
├── model/
│   ├── LoginEvent.java           # 登录事件模型
│   ├── TransactionEvent.java     # 交易事件模型
│   ├── AlertEvent.java           # 告警事件模型
│   ├── FraudRule.java            # 风控规则模型
│   └── BaseEvent.java            # 统一事件基类
├── source/
│   └── KafkaDeserializationSchema.java  # Kafka 反序列化器
├── sink/
│   ├── ElasticsearchSink.java    # Elasticsearch 输出
│   └── RedisSink.java            # Redis 输出
├── grpc/
│   ├── RuleService.proto         # gRPC 服务定义
│   ├── RuleServiceImpl.java      # gRPC 服务实现
│   └── RuleGrpcServer.java       # gRPC 服务器
└── dashboard/
    ├── DashboardServer.java      # Dashboard Web服务器
    └── AlertWebSocketHandler.java # WebSocket 处理器

src/main/resources/
├── dashboard/
│   └── index.html                # Dashboard 前端页面
└── log4j.properties              # 日志配置
```

## 核心配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 时间窗口 | 10秒 | 欺诈模式检测时间窗口 |
| 大额交易阈值 | 10,000元 | 触发大额交易告警的金额 |
| 最小IP数量 | 2个 | 多IP登录检测所需IP数 |
| 窗口类型 | SLIDING | 滑动窗口 |
| Checkpoint间隔 | 5秒 | Flink Checkpoint |
| Watermark延迟 | 500ms | 事件时间乱序容忍 |

## 性能优化建议

1. **Kafka 分区**：根据账号ID进行分区，确保同一账号事件进入同一Flink子任务
2. **Flink 并行度**：根据Kafka分区数设置合适的并行度
3. **状态后端**：生产环境推荐使用 RocksDBStateBackend
4. **网络缓冲**：调整 Flink 网络缓冲以降低延迟
5. **CEP 优化**：
   - 合理设置 within() 时间
   - 尽早过滤不相关事件
   - 使用迭代条件代替多个简单条件

## 监控与运维

### Flink Dashboard
- 访问 Flink Web UI: http://localhost:8081
- 监控 Checkpoint、吞吐量、延迟等指标

### 系统监控
- Dashboard: http://localhost:8080
- 健康检查: http://localhost:8080/api/health
- 统计API: http://localhost:8080/api/stats

### 日志
- 应用日志: 标准输出（可配置文件输出）
- Flink 日志: Flink 安装目录下的 log 文件夹

## 扩展功能建议

1. **更多欺诈模式**：
   - 短时间密集交易
   - 地域异常（登录和交易地点不一致）
   - 设备指纹异常
   - 转账金额符合特定模式

2. **机器学习集成**：
   - 实时特征工程
   - 模型在线评分
   - 模型热更新

3. **白名单机制**：
   - 可信IP/设备/账户
   - 降低误报率

4. **告警升级**：
   - 多级告警阈值
   - 告警聚合
   - 通知渠道（短信/邮件/企业微信）

## License

MIT License
