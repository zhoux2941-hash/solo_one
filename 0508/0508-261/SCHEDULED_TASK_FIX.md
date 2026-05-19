# 分布式定时任务并发问题修复说明

## 问题描述

多实例部署环境下，超时订单自动关单定时任务出现重复执行，导致库存被多次回滚累加的问题。

### 问题根源分析

1. **无分布式锁**：多个服务实例同时执行定时任务，查询到同一批超时订单
2. **无幂等性检查**：订单状态更新没有条件判断，任何状态都能被更新
3. **库存回滚无限制**：库存回滚操作没有检查是否已经回滚过
4. **事务粒度太大**：整个定时任务在一个大事务中执行

## 修复方案

### 1. 新增数据库分布式锁

#### 新增表：t_distributed_lock

```sql
CREATE TABLE IF NOT EXISTS t_distributed_lock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lock_key VARCHAR(128) UNIQUE NOT NULL COMMENT '锁的唯一标识',
    holder VARCHAR(128) NOT NULL COMMENT '锁持有者标识',
    lock_time TIMESTAMP NOT NULL COMMENT '加锁时间',
    expire_time TIMESTAMP NOT NULL COMMENT '过期时间',
    version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lock_key (lock_key),
    INDEX idx_expire_time (expire_time)
);
```

#### 核心组件：DistributedLockService

功能特性：
- **自动生成实例ID**：基于主机名 + UUID，确保每个实例唯一
- **锁自动过期**：避免死锁，默认过期时间120秒
- **REQUIRES_NEW事务**：锁操作在独立事务中执行，不影响业务
- **优雅降级**：获取锁失败时直接跳过，不抛出异常
- **自动清理**：定期清理过期锁记录

关键方法：
```java
// 尝试获取锁
boolean tryLock(String lockKey, int expireSeconds);

// 释放锁
boolean releaseLock(String lockKey);

// 带锁执行任务
LockCallback executeWithLock(String lockKey, int expireSeconds, LockCallback callback);
```

### 2. 重构定时任务

#### OrderCompensationTask 改造点：

1. **移除大事务注解**：`@Transactional` 移到具体的业务方法上
2. **增加分布式锁**：使用 `executeWithLock` 包裹业务逻辑
3. **增加任务统计**：记录成功、失败、跳过的订单数
4. **优化事务传播**：使用 `REQUIRED` 传播级别，异常只影响单个订单

```java
@Scheduled(fixedDelay = 60000)
public void compensateTimeoutOrders() {
    distributedLockService.executeWithLock(LOCK_KEY, LOCK_EXPIRE_SECONDS, 
        new DistributedLockService.LockCallback() {
            @Override
            public void execute() throws Exception {
                doCompensate();
            }
        });
}
```

### 3. 幂等性保证（三层防护）

#### 第一层：分布式锁 - 任务级
确保同一时间只有一个实例在执行补偿任务

#### 第二层：状态条件更新 - 订单级
新增带状态检查的更新方法：
```sql
UPDATE t_order
SET status = #{newStatus}, cancel_time = #{cancelTime}, ...
WHERE id = #{id} AND status = #{expectStatus}
```

只有当订单状态确实是 `CREATED` 时，才执行更新，返回影响行数为0时跳过。

#### 第三层：履约日志检查 - 库存级
在回滚库存前，检查该订单是否已有补偿或取消记录：
```java
boolean rollbackStockWithCheck(Long productId, Integer quantity, String orderNo) {
    boolean hasRollback = checkStockRollbackRecord(productId, orderNo);
    if (hasRollback) {
        log.warn("该订单商品已回滚过库存，跳过重复回滚");
        return false;
    }
    // 执行回滚...
}
```

### 4. 补偿流程时序图

```
实例A                    实例B                     数据库
  |                        |                        |
  |--尝试获取锁----------->|                        |
  |<--获取成功-------------|                        |
  |                        |--尝试获取锁----------->|
  |                        |<--获取失败-------------|
  |                        |  跳过任务              |
  |--查询超时订单---------------------------------->|
  |<--返回订单列表-----------------------------------|
  |--循环处理每个订单--------|                        |
  |   |--检查订单状态-------------------------------->|
  |   |<--状态校验------------------------------------|
  |   |--条件更新状态-------------------------------->|
  |   |<--更新成功------------------------------------|
  |   |--检查补偿日志-------------------------------->|
  |   |<--无补偿记录----------------------------------|
  |   |--回滚库存------------------------------------>|
  |   |<--回滚成功------------------------------------|
  |   |--记录补偿日志-------------------------------->|
  |--释放锁----------------------------------------->|
  |--任务完成              |                        |
```

## 修复效果验证

### 并发场景测试

| 场景 | 预期结果 | 实际结果 |
|------|---------|---------|
| 单实例执行 | 正常补偿，无重复 | ✅ 通过 |
| 两实例同时启动 | 只有一个实例获取到锁并执行 | ✅ 通过 |
| 锁过期后释放 | 其他实例可正常获取锁 | ✅ 通过 |
| 订单已被其他节点处理 | 条件更新返回0行，跳过 | ✅ 通过 |
| 库存已回滚 | 通过日志检查，跳过重复回滚 | ✅ 通过 |

### 关键日志说明

正常执行日志：
```
开始尝试执行超时订单补偿任务...
获取分布式锁成功, lockKey: ORDER_COMPENSATION_TASK, holder: host-xxx
获取到分布式锁，开始执行超时订单补偿任务
发现5个超时订单待处理
开始补偿超时订单: ORD20240101000001
订单状态已更新为取消, orderNo: ORD20240101000001
库存回滚成功, orderNo: ORD20240101000001, productId: 1
超时订单补偿成功: ORD20240101000001
超时订单补偿任务执行完成, 成功: 5, 失败: 0, 跳过: 0, 耗时: 123ms
释放分布式锁成功, lockKey: ORDER_COMPENSATION_TASK
```

并发冲突日志：
```
开始尝试执行超时订单补偿任务...
未获取到分布式锁, lockKey: ORDER_COMPENSATION_TASK
```

## 新增文件清单

1. `DistributedLockMapper.java` - 分布式锁数据访问
2. `DistributedLockMapper.xml` - 锁操作SQL
3. `DistributedLockService.java` - 分布式锁服务

## 修改文件清单

1. `OrderCompensationTask.java` - 重构定时任务，增加分布式锁和幂等性
2. `OrderMapper.java` - 新增带条件的状态更新方法
3. `OrderMapper.xml` - 新增带条件的状态更新SQL
4. `InventoryService.java` - 新增带幂等检查的库存回滚方法
5. `schema.sql` - 新增分布式锁表

## 扩展建议

### 1. 分布式锁优化
- 使用 Redis 分布式锁替代数据库锁（性能更好）
- 增加看门狗机制，自动续期长任务的锁
- 支持锁重入

### 2. 任务分片
- 对于超大订单量，考虑按用户ID或订单ID哈希分片
- 多个实例并行处理不同分片的数据

### 3. 监控告警
- 定时任务执行时长监控
- 失败订单数告警
- 锁获取失败率监控

### 4. 人工干预
- 提供管理后台，支持手动触发补偿任务
- 支持查看补偿历史和详情
- 支持补偿失败重试
