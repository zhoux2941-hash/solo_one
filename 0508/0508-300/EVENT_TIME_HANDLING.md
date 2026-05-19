# 事件时间与迟到数据处理方案

## 问题背景

在实时反欺诈系统中，事件可能由于网络延迟、消息队列乱序等原因迟到。如果使用处理时间（Processing Time），会导致：

1. **漏报**：迟到的登录事件无法关联到后续的转账事件
2. **误报**：事件顺序错乱导致规则误触发
3. **统计不准确**：基于处理时间的窗口结果不真实

## 解决方案

### 1. 基于事件时间（Event Time）的Watermark

**核心类**：`EventTimeAssigner.java`

#### 配置参数
```
- 最大乱序时间：30秒
- Watermark更新间隔：100毫秒
- 空闲超时：10秒（防止无数据时Watermark不前进）
```

#### 实现原理
```java
WatermarkStrategy.<BaseEvent>forBoundedOutOfOrderness(Duration.ofSeconds(30))
    .withIdleness(Duration.ofSeconds(10))
    .withTimestampAssigner((event, recordTimestamp) -> {
        // 从事件中提取实际发生时间
        return event.getTimestamp();
    });
```

### 2. 迟到数据侧输出流（Side Output）

**核心类**：`LateDataHandler.java`

#### 侧输出标签
```java
// 迟到事件流
public static final OutputTag<BaseEvent> LATE_EVENT_TAG = 
    new OutputTag<BaseEvent>("late-events") {};

// 迟到检测产生的告警
public static final OutputTag<AlertEvent> LATE_DETECTED_ALERT_TAG = 
    new OutputTag<AlertEvent>("late-detected-alerts") {};
```

#### 迟到阈值
- **超过30秒**的事件被判定为迟到
- **交易事件**如果先于登录事件到达，会被"持有"最多2分钟等待登录

### 3. 迟到登录事件的重新关联处理

#### 核心逻辑
```java
public static class LateEventReplayFunction extends KeyedCoProcessFunction {
    
    // 持有等待登录的交易
    private ListState<TransactionEvent> pendingTransactionEvents;
    
    // 已处理的登录事件
    private ListState<LoginEvent> pendingLoginEvents;
    
    @Override
    public void processElement2(BaseEvent value, Context ctx, Collector<BaseEvent> out) {
        // 交易事件到达但没有对应的登录
        // 将交易放入pending状态，等待后续登录
        // 注册定时器，超时后释放
    }
    
    @Override
    public void onTimer(long timestamp, OnTimerContext ctx, Collector<BaseEvent> out) {
        // 定时器触发，释放持有时间超过2分钟的交易
    }
}
```

#### 重新检测流程
1. **交易先到**：当交易事件到达但没有对应的登录记录时，将交易放入等待队列
2. **等待登录**：注册2分钟的定时器，等待登录事件
3. **迟到登录到达**：如果在2分钟内登录事件到达，将两者一起重新发送到CEP进行模式匹配
4. **超时释放**：如果2分钟内没有登录到达，释放交易并按正常流程处理

### 4. CEP事件时间模式匹配

**核心类**：`EventTimeFraudPatternDetector.java`

#### 事件时间CEP配置
```java
PatternStream<BaseEvent> patternStream = CEP.pattern(keyedStream, pattern)
    .inEventTime();  // 启用事件时间模式
```

#### 模式匹配逻辑
在事件时间模式下，CEP：
- 只考虑事件发生时间，不考虑处理时间
- 通过`within()`定义时间窗口时使用事件时间
- 迟到但在窗口内的事件仍能参与匹配

### 5. 迟到数据统计与监控

**核心类**：`LateDataStatistics.java`

#### 统计维度
1. **迟到事件计数**
   - 迟到登录事件数
   - 迟到交易事件数

2. **迟到告警计数**
   - 迟到重放后产生的告警数
   - 按账户统计

3. **迟到分布统计**
   ```
   0-1秒:  xxx
   1-5秒:  xxx
   5-10秒: xxx
   10-30秒:xxx
   >30秒:  xxx
   ```

## 数据流向图

```
                    ┌──────────────────┐
                    │  Kafka数据源    │
                    │ (Login/Trans)   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ EventTimeAssigner│
                    │  提取事件时间   │
                    │  生成Watermark  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ LateDataHandler  │
                    │  迟到事件检测    │
                    │  交易持有等待    │
                    └────┬───────┬────┘
                         │       │
               ┌─────────┘       └──────────┐
               │                              │
               ▼                              ▼
    ┌──────────────────┐          ┌──────────────────┐
    │   正常事件流     │          │   迟到事件流     │
    │   (Main Output)  │          │  (Side Output)   │
    └────────┬─────────┘          └────────┬─────────┘
             │                              │
             ▼                              ▼
    ┌──────────────────┐          ┌──────────────────┐
    │ EventTime CEP    │          │ Late ReProcessor  │
    │  模式检测        │          │  重新关联检测    │
    └────────┬─────────┘          └────────┬─────────┘
             │                              │
             └──────────────┬───────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │   告警合并流     │
                    │  (Alert Union)   │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ Elasticsearch│  │    Redis    │  │  Dashboard  │
    │   持久化     │  │   黑名单    │  │  实时展示   │
    └─────────────┘  └─────────────┘  └─────────────┘
```

## 测试场景

### 场景1：正常顺序事件
```
事件顺序：Login1 → Login2 → LargeTx → NewTx
预期：正常检测到欺诈模式
```

### 场景2：乱序事件（登录乱序）
```
事件顺序：Login2 → LargeTx → Login1 → NewTx
实际时间：t   → t+1s → t-1s → t+2s
预期：CEP使用事件时间正确检测到模式
```

### 场景3：交易先到，登录迟到
```
事件顺序：LargeTx → NewTx → (5s后) → Login1 → Login2
预期：
  1. 交易先到时被持有等待
  2. 迟到登录到达后触发重新关联
  3. 关联成功产生告警
  4. 统计中记录迟到事件
```

### 场景4：登录严重迟到（超过2分钟）
```
事件顺序：LargeTx → NewTx → (2分钟后) → Login1 → Login2
预期：
  1. 交易持有2分钟后超时释放
  2. 迟到登录到达时已无匹配交易
  3. 侧输出记录迟到登录
```

## 关键配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 最大乱序时间 | 30秒 | Watermark允许的事件迟到时间 |
| 交易持有时间 | 2分钟 | 等待登录事件的最大时间 |
| Watermark更新间隔 | 100毫秒 | Watermark前进频率 |
| 空闲超时 | 10秒 | 无数据时Watermark前进时间 |
| 统计输出间隔 | 60秒 | 迟到统计日志输出间隔 |

## 监控指标

通过日志可以观察以下指标：

```
Late Event Stats: {lateLogins: N, lateTransactions: M, correlations: K, alerts: X}
Lateness Distribution: {accountId: xxx, eventType: xxx, latenessMs: 5000, bucket: 1-5s}
```

## Dashboard增强

Dashboard中新增以下展示：

1. **迟到事件总数**
   - 迟到登录数
   - 迟到交易数

2. **迟到告警标识**
   - 告警卡片显示 `[迟到重放]` 标签

3. **延迟分布统计**
   - 按延迟时间桶展示统计图表

## 调优建议

### 1. 根据业务延迟分布调整
- 如果95%的事件延迟<5秒，可将最大乱序时间设为10秒
- 如果网络不稳定，可适当增大最大乱序时间

### 2. 状态大小控制
- 交易持有状态会占用内存，需监控State大小
- 过长的持有时间会导致状态膨胀
- 建议持有时间不超过5分钟

### 3. 性能影响
- 事件时间模式比处理时间模式性能略低（约5-10%）
- 迟到重处理会增加额外开销
- 可通过调整迟到阈值平衡性能和准确性

## 代码文件清单

```
src/main/java/com/antifraud/
├── watermark/
│   └── EventTimeAssigner.java      # 事件时间与Watermark分配器
├── late/
│   ├── LateDataHandler.java        # 迟到数据处理与重关联逻辑
│   └── LateDataStatistics.java     # 迟到数据统计与监控
└── cep/
    └── EventTimeFraudPatternDetector.java  # 事件时间CEP检测器
```
