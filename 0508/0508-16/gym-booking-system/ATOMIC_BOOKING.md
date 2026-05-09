# 原子预约方案设计文档

## 问题分析

### 原有方案的问题

在高并发场景下，原有的预约流程存在以下问题：

```
1. 用户A点击预约
2. Redis: DECR course:capacity:1 (剩余名额从5变为4) ✓
3. MySQL: 插入预约记录 ✗ (失败，比如网络抖动)
4. 结果：Redis名额已扣减，但MySQL没有记录，名额丢失！

或者：

1. 用户A和用户B同时点击预约（课程容量为1）
2. Redis: DECR course:capacity:1 (剩余名额从1变为0) ✓
3. Redis: DECR course:capacity:1 (剩余名额从0变为-1) ✗ (如果只使用DECR不检查)
4. MySQL: 两条预约记录都插入成功
5. 结果：超卖，课程容量1人实际预约了2人！
```

### 核心问题

1. **非原子操作**：Redis扣减和MySQL插入是两个独立操作，不是事务的
2. **缺乏补偿机制**：Redis扣减成功但MySQL失败时，名额无法自动恢复
3. **并发安全**：多用户同时预约可能导致超卖

---

## 解决方案

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户请求预约                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: 前置检查 (数据库查询)                                   │
│  - 检查用户是否已预约                                            │
│  - 检查课程是否存在、是否已开始                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: Lua脚本原子操作 (Redis)                                │
│  - 检查缓存是否存在，不存在则从数据库初始化                       │
│  - 检查剩余名额是否 > 0                                          │
│  - 原子扣减名额 (DECR)                                          │
│  - 返回扣减后的剩余名额                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: 发送消息到队列 (Redis List)                            │
│  - 消息包含：userId, courseId, capacity, messageId             │
│  - 使用Set去重，防止消息重复发送                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: 异步消费消息 (后台线程)                                │
│  - 从队列获取消息                                                │
│  - 幂等性检查（防止重复处理）                                    │
│  - 插入MySQL预约记录                                            │
│  - 失败则重试（最多3次）                                        │
│  - 重试失败进入补偿流程                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─ 成功 ──▶ 完成
                              │
                              ▼ 失败
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: 补偿机制                                               │
│  - Lua脚本原子恢复名额 (INCR)                                   │
│  - 记录补偿日志                                                  │
│  - 极端情况进入死信队列                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 核心组件

### 1. Lua脚本 (原子性保障)

#### decrease_capacity.lua - 原子扣减名额

```lua
-- 功能：原子性检查并扣减课程剩余名额
-- 返回值：
--   >= 0: 扣减成功，返回扣减后的剩余名额
--   -1: 剩余名额不足，扣减失败
--   -2: 课程不存在或缓存初始化失败

local capacityKey = KEYS[1]
local defaultCapacity = tonumber(ARGV[1])
local expireHours = tonumber(ARGV[2])

-- 1. 检查key是否存在
local exists = redis.call('EXISTS', capacityKey)
local remaining = 0

-- 2. 如果不存在，使用默认值初始化
if exists == 1 then
    remaining = tonumber(redis.call('GET', capacityKey))
else
    if defaultCapacity and defaultCapacity > 0 then
        redis.call('SET', capacityKey, defaultCapacity)
        redis.call('EXPIRE', capacityKey, expireHours * 3600)
        remaining = defaultCapacity
    else
        return -2
    end
end

-- 3. 检查剩余名额
if remaining <= 0 then
    return -1
end

-- 4. 原子扣减
local newRemaining = redis.call('DECR', capacityKey)

-- 5. 双重检查（安全冗余）
if newRemaining < 0 then
    redis.call('INCR', capacityKey)
    return -1
end

return newRemaining
```

**为什么这样设计？**

1. **单脚本执行**：整个检查+扣减逻辑在一个Lua脚本中执行，Redis保证Lua脚本的原子性
2. **初始化缓存**：如果缓存不存在，从数据库获取默认值初始化
3. **前置检查**：在扣减前检查剩余名额
4. **后置检查**：扣减后再次检查，防止极端情况
5. **返回值编码**：不同的错误码便于上层处理

#### increase_capacity.lua - 原子恢复名额

```lua
-- 功能：原子性恢复课程剩余名额（补偿机制）
-- 返回值：
--   >= 0: 恢复成功，返回恢复后的剩余名额
--   -1: 已达到最大容量，无需恢复
--   -2: 课程缓存不存在

local capacityKey = KEYS[1]
local maxCapacity = tonumber(ARGV[1])

-- 1. 检查key是否存在
local exists = redis.call('EXISTS', capacityKey)
if exists == 0 then
    return -2
end

-- 2. 获取当前值
local current = tonumber(redis.call('GET', capacityKey))

-- 3. 检查是否已经达到或超过最大容量
if current >= maxCapacity then
    return -1
end

-- 4. 原子增加
local newRemaining = redis.call('INCR', capacityKey)

return newRemaining
```

**为什么这样设计？**

1. **防超恢复**：检查当前值是否已达到最大容量，防止恢复过多
2. **缓存检查**：如果缓存不存在，说明可能课程已被删除或缓存过期
3. **原子操作**：使用INCR保证并发安全

---

### 2. 消息队列 (异步解耦)

#### 队列结构

```
Redis Key设计：

1. queue:booking:pending (List)
   - 待处理队列，等待消费的预约消息
   - 生产者：BookingService.bookCourseAtomically()
   - 消费者：BookingMessageConsumer.consumeLoop()

2. queue:booking:processing (List)
   - 处理中队列，正在处理的消息
   - 用于故障恢复，如果服务崩溃，可以从这里重新处理

3. queue:booking:dlq (List)
   - 死信队列，处理失败且重试次数用尽的消息
   - 需要人工干预或定时补偿

4. set:booking:messages (Set)
   - 去重集合，防止消息重复发送
   - TTL: 1小时
```

#### 消息结构 (BookingMessage)

```java
@Data
@Builder
public class BookingMessage {
    private String messageId;      // UUID，消息唯一标识
    private Long userId;           // 用户ID
    private String userName;       // 用户姓名
    private Long courseId;         // 课程ID
    private Integer capacity;      // 课程最大容量（用于补偿）
    private LocalDateTime bookTime;    // 预约时间
    private LocalDateTime expireTime;  // 消息过期时间
    private Integer retryCount;    // 重试次数
    
    // 辅助方法
    public void incrementRetryCount() { ... }  // 增加重试次数
    public boolean shouldRetry() { ... }       // 是否应该重试（<3次）
    public boolean isExpired() { ... }         // 是否已过期
}
```

#### 消息流转

```
用户预约
    │
    ▼
┌─────────────────┐
│ 发送到 pending  │ ──────▶ 消费者获取消息
└─────────────────┘           │
                              ▼
                    ┌─────────────────┐
                    │ 发送到 processing│
                    └─────────────────┘
                              │
                              ├─ 成功 ──▶ 从processing移除，完成
                              │
                              ├─ 失败 ──▶ 重试<3次？
                              │             │
                              │             ├─ 是 ──▶ 发送回pending，retryCount++
                              │             │
                              │             └─ 否 ──▶ 补偿 + 发送到DLQ
                              │
                              └─ 崩溃 ──▶ 服务重启后从processing恢复
```

---

### 3. 消息消费者 (异步处理)

#### BookingMessageConsumer

```java
@Slf4j
@Service
public class BookingMessageConsumer {
    
    private ExecutorService executorService;
    private final AtomicBoolean running = new AtomicBoolean(true);
    
    @PostConstruct
    public void init() {
        executorService = Executors.newFixedThreadPool(2);
        startConsumer();
    }
    
    private void startConsumer() {
        executorService.submit(this::consumeLoop);
    }
    
    private void consumeLoop() {
        while (running.get()) {
            try {
                // 阻塞获取消息（5秒超时）
                BookingMessage message = messageQueueService.pollFromPendingQueue();
                
                if (message == null) {
                    continue;
                }
                
                // 异步处理消息
                processMessage(message);
                
            } catch (Exception e) {
                log.error("消息消费循环发生异常", e);
                Thread.sleep(1000);  // 避免异常时CPU空转
            }
        }
    }
    
    @Async
    @Transactional(rollbackFor = Exception.class)
    public void processMessage(BookingMessage message) {
        // 1. 检查消息是否过期
        if (message.isExpired()) {
            handleCompensation(message, "消息已过期");
            return;
        }
        
        try {
            // 2. 标记为处理中
            messageQueueService.sendToProcessingQueue(message);
            
            // 3. 幂等性检查
            Optional<Booking> existingBooking = bookingRepository
                .findByUserIdAndCourseId(message.getUserId(), message.getCourseId());
            
            if (existingBooking.isPresent()) {
                // 消息已处理过，直接返回
                messageQueueService.removeFromProcessingQueue(message);
                messageQueueService.removeFromMessageSet(message.getMessageId());
                return;
            }
            
            // 4. 检查课程是否存在
            Optional<Course> courseOpt = courseRepository.findById(message.getCourseId());
            if (!courseOpt.isPresent()) {
                handleCompensation(message, "课程不存在");
                return;
            }
            
            // 5. 创建预约记录
            Booking booking = new Booking();
            booking.setUserId(message.getUserId());
            booking.setUserName(message.getUserName());
            booking.setCourseId(message.getCourseId());
            booking.setBookTime(message.getBookTime());
            booking.setStatus(BookingStatus.BOOKED);
            
            bookingRepository.save(booking);
            
            // 6. 处理成功，清理队列
            messageQueueService.removeFromProcessingQueue(message);
            messageQueueService.removeFromMessageSet(message.getMessageId());
            
        } catch (Exception e) {
            // 7. 处理失败，判断是否重试
            if (message.shouldRetry()) {
                message.incrementRetryCount();
                messageQueueService.removeFromProcessingQueue(message);
                messageQueueService.sendToPendingQueue(message);
            } else {
                // 8. 重试次数用尽，进入补偿流程
                handleCompensation(message, "重试次数用尽");
            }
        }
    }
}
```

#### 设计要点

1. **独立线程池**：使用ExecutorService创建独立的消费线程，不占用主线程
2. **循环消费**：使用while循环持续消费队列中的消息
3. **阻塞获取**：使用BLPOP（带超时）阻塞获取消息，避免轮询CPU空转
4. **异常保护**：外层try-catch捕获所有异常，防止消费者线程崩溃
5. **事务处理**：processMessage方法使用@Transactional，保证数据库操作的原子性
6. **幂等性检查**：在处理前检查是否已存在预约记录，防止重复创建
7. **重试机制**：最多重试3次，超过则进入补偿流程

---

### 4. 补偿机制 (可靠性保障)

#### CompensationService

```java
@Slf4j
@Service
public class CompensationService {
    
    @Autowired
    private RedisCacheService redisCacheService;
    
    private final Map<String, CompensationRecord> compensationRecords = 
        new ConcurrentHashMap<>();
    
    public void compensateBooking(BookingMessage message, String reason) {
        log.info("开始执行补偿操作: messageId={}, courseId={}, reason={}", 
            message.getMessageId(), message.getCourseId(), reason);
        
        // 记录补偿操作
        CompensationRecord record = new CompensationRecord(
            message.getMessageId(),
            message.getCourseId(),
            message.getCapacity(),
            reason
        );
        compensationRecords.put(message.getMessageId(), record);
        
        try {
            // 使用Lua脚本原子恢复名额
            int result = redisCacheService.increaseCapacityAtomically(
                message.getCourseId(), 
                message.getCapacity()
            );
            
            if (result >= 0) {
                record.setSuccess(true);
                log.info("补偿成功: messageId={}, 恢复后剩余名额={}", 
                    message.getMessageId(), result);
            } else if (result == -1) {
                record.setSuccess(true);
                log.warn("补偿跳过（已达最大容量）: messageId={}", 
                    message.getMessageId());
            } else {
                record.setSuccess(false);
                log.error("补偿失败（缓存不存在）: messageId={}", 
                    message.getMessageId());
                throw new RuntimeException("补偿失败：课程缓存不存在");
            }
            
        } catch (Exception e) {
            record.setSuccess(false);
            log.error("补偿操作异常: messageId={}", message.getMessageId(), e);
            throw e;  // 抛出异常，让上层决定是否发送到死信队列
        }
    }
    
    // 补偿记录
    public static class CompensationRecord {
        private String messageId;
        private Long courseId;
        private Integer capacity;
        private String reason;
        private LocalDateTime compensateTime;
        private boolean success;
    }
}
```

#### 补偿触发场景

| 场景 | 触发条件 | 处理方式 |
|------|----------|----------|
| 消息过期 | 消息超过30分钟未处理 | 补偿 + 记录日志 |
| 课程不存在 | 数据库中找不到课程 | 补偿 + 记录日志 |
| 数据库异常 | 插入预约记录失败 | 重试3次后补偿 |
| 服务崩溃 | 处理过程中服务重启 | 从processing队列恢复 |
| 补偿失败 | Redis异常导致恢复失败 | 发送到死信队列 |

---

## 完整预约流程

### 时序图

```
用户          BookingService        Redis          消息队列      消费者         MySQL
 │                │                 │                │            │             │
 │  点击预约        │                 │                │            │             │
 │───────────────▶│                 │                │            │             │
 │                │                 │                │            │             │
 │                │  检查重复预约    │                │            │             │
 │                │─────────────────────────────────────────────▶│             │
 │                │                 │                │            │────────────▶│
 │                │                 │                │            │             │
 │                │  检查课程状态    │                │            │             │
 │                │─────────────────────────────────────────────▶│             │
 │                │                 │                │            │────────────▶│
 │                │                 │                │            │             │
 │                │  Lua脚本原子扣减 │                │            │             │
 │                │────────────────▶│                │            │             │
 │                │                 │  EXISTS key?   │            │             │
 │                │                 │  GET key       │            │             │
 │                │                 │  检查>0？       │            │             │
 │                │                 │  DECR key      │            │             │
 │                │◀────────────────│                │            │             │
 │                │  返回剩余名额    │                │            │             │
 │                │                 │                │            │             │
 │                │  发送消息       │                │            │             │
 │                │────────────────────────────────▶│            │             │
 │                │                 │  RPUSH pending │            │             │
 │                │                 │  SADD messages │            │             │
 │                │                 │                │            │             │
 │◀───────────────│                 │                │            │             │
 │  返回成功       │                 │                │            │             │
 │  (messageId)    │                 │                │            │             │
 │                │                 │                │            │             │
 │                │                 │                │  消费消息    │             │
 │                │                 │                │◀───────────│             │
 │                │                 │                │  BLPOP      │             │
 │                │                 │                │            │             │
 │                │                 │                │  幂等检查    │             │
 │                │                 │                │            │────────────▶│
 │                │                 │                │            │◀────────────│
 │                │                 │                │            │             │
 │                │                 │                │  插入预约    │             │
 │                │                 │                │            │────────────▶│
 │                │                 │                │            │  INSERT     │
 │                │                 │                │            │◀────────────│
 │                │                 │                │            │             │
 │                │                 │                │  清理队列    │             │
 │                │                 │                │◀───────────│             │
 │                │                 │                │  REMOVE     │             │
 │                │                 │                │             │             │
 │                │                 │                │  （失败时）  │             │
 │                │                 │                │◀───────────│             │
 │                │                 │  补偿（INCR）   │            │             │
 │                │                 │◀───────────────│            │             │
 │                │                 │                │            │             │
 │                │                 │                │  发送DLQ    │             │
 │                │                 │                │◀───────────│             │
```

---

## 故障处理

### 场景1：Redis正常，MySQL异常

```
时间线：
1. 用户A预约课程，Lua脚本执行成功，Redis名额从10变为9
2. 发送消息到pending队列成功
3. 消费者获取消息，尝试插入MySQL
4. MySQL宕机，插入失败
5. 重试3次后仍然失败
6. 执行补偿：Lua脚本INCR，Redis名额从9恢复到10
7. 消息发送到死信队列
8. 管理员收到告警，手动处理

结果：名额恢复，数据一致
```

### 场景2：服务崩溃，正在处理消息

```
时间线：
1. 消费者从pending获取消息，发送到processing
2. 服务崩溃，消息还在processing队列
3. 服务重启，消费者重新启动
4. 检查processing队列中的消息
5. 重新处理这些消息（幂等性检查保证不会重复创建）

结果：消息不会丢失，最终会被处理
```

### 场景3：高并发抢购

```
场景：课程容量为1，100个用户同时点击预约

时间线：
1. 用户A-Lua脚本执行：检查剩余名额=1>0，DECR后=0，返回成功
2. 用户B-Lua脚本执行：检查剩余名额=0，返回-1（名额不足）
3. 用户C-Lua脚本执行：检查剩余名额=0，返回-1（名额不足）
...
99. 用户Z-Lua脚本执行：检查剩余名额=0，返回-1（名额不足）

结果：只有用户A预约成功，其他人显示"名额已满"
     不会出现超卖！
```

### 场景4：补偿失败

```
时间线：
1. 用户预约成功，Redis名额扣减
2. MySQL插入失败，重试3次
3. 执行补偿时，Redis也异常（网络分区）
4. 补偿失败，消息发送到死信队列
5. 定时任务扫描死信队列
6. Redis恢复后，手动补偿或自动补偿
7. 名额恢复

结果：极端情况下也能最终恢复
```

---

## 新增文件清单

| 文件 | 功能 |
|------|------|
| `dto/BookingMessage.java` | 预约消息实体 |
| `service/MessageQueueService.java` | 消息队列服务 |
| `service/BookingMessageConsumer.java` | 消息消费者 |
| `service/CompensationService.java` | 补偿服务 |
| `lua/decrease_capacity.lua` | 原子扣减脚本 |
| `lua/increase_capacity.lua` | 原子恢复脚本 |

## 修改文件清单

| 文件 | 修改内容 |
|------|----------|
| `service/RedisCacheService.java` | 添加Lua脚本支持和原子操作方法 |
| `service/BookingService.java` | 重写bookCourse为原子预约流程 |
| `controller/BookingController.java` | 更新API响应，添加队列状态接口 |
| `views/CourseList.vue` | 更新前端预约逻辑 |

---

## 监控指标

建议添加以下监控：

```
1. 队列深度
   - queue:booking:pending 长度（待处理）
   - queue:booking:processing 长度（处理中）
   - queue:booking:dlq 长度（死信）

2. 处理成功率
   - 成功次数 / 总次数
   - 平均处理时间

3. 补偿次数
   - 补偿成功次数
   - 补偿失败次数
   - 死信队列累计消息数

4. Lua脚本执行
   - 执行成功率
   - 平均执行时间
```

---

## 扩展建议

1. **消息队列替换**：可以将Redis List替换为专业的MQ（RabbitMQ、Kafka、RocketMQ）
2. **分布式事务**：如果需要强一致性，可以考虑使用Seata
3. **延迟队列**：使用Redis Sorted Set实现延迟队列，处理定时任务
4. **告警系统**：死信队列有消息时自动告警
5. **限流保护**：对预约接口添加限流，防止恶意请求
