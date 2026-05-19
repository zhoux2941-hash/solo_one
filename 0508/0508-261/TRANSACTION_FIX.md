# Seata 分布式事务修复说明

## 问题描述

在高并发场景下，出现订单创建成功但库存未扣减的脏数据问题。根本原因：

1. **缺少 Seata 数据源代理** - Seata AT 模式需要代理数据源才能拦截 SQL 并生成回滚日志
2. **库存扣减存在竞态条件** - 查询库存和扣减库存之间存在时间窗口
3. **Seata 配置不完整** - 缺少必要的配置项

## 修复内容

### 1. 添加 Seata 数据源代理配置

**文件**: `src/main/java/com/fulfillment/order/config/SeataDataSourceConfig.java`

- 手动配置 DataSourceProxy，确保 Seata 能够拦截 SQL
- 优雅降级：Seata 初始化失败时自动使用原生数据源
- 使用 @Primary 注解确保 MyBatis 使用代理数据源

### 2. 重构库存扣减逻辑，使用数据库原子操作

**文件**: `src/main/resources/mapper/ProductMapper.xml`

新增 `deductStockAtomic` 方法：
```xml
<update id="deductStockAtomic">
    UPDATE t_product
    SET stock = stock - #{quantity}, version = version + 1
    WHERE id = #{id} AND stock >= #{quantity}
</update>
```

**优点**:
- 数据库层面原子操作，避免竞态条件
- 直接在 WHERE 条件中检查库存，消除查询和更新之间的时间差

### 3. 改进事务传播和监控

**文件**: `src/main/java/com/fulfillment/order/service/InventoryService.java`

- `deductStock` 方法使用 `Propagation.MANDATORY`，确保必须在事务中调用
- 详细的扣减前后库存日志
- 失败时输出详细错误信息

### 4. 添加事务监控切面

**文件**: `src/main/java/com/fulfillment/order/aspect/TransactionMonitorAspect.java`

功能：
- 监控订单创建方法的执行
- 检查 Seata XID 是否存在
- 事务提交后验证库存扣减
- 记录事务提交/回滚状态

### 5. 完善 Seata 配置

**文件**: `src/main/resources/application.yml`

关键配置：
```yaml
seata:
  enable-auto-data-source-proxy: false  # 关闭自动代理，使用手动配置
  disable-global-transaction: false
  client:
    rm:
      report-success-enable: true
    tm:
      default-global-transaction-timeout: 60000
```

### 6. 添加 Seata 配置文件

- `src/main/resources/file.conf` - Seata 服务配置
- `src/main/resources/registry.conf` - 注册中心配置

## 事务保证机制

### 本地事务保证（即使 Seata 不可用）

1. Spring `@Transactional` 确保订单和库存操作在同一事务中
2. 库存扣减使用数据库原子 UPDATE，避免竞态条件
3. 任何异常都会触发事务回滚

### Seata 分布式事务保证

1. DataSourceProxy 拦截所有 SQL
2. 生成 undo_log 用于回滚
3. 两阶段提交保证数据一致性

## 高并发场景验证

### 测试场景

1. 100并发请求创建同一商品订单
2. 初始库存：50
3. 每个订单购买：1件

### 预期结果

- 成功订单数：≤ 50
- 最终库存：≥ 0
- 订单数量 + 剩余库存 = 初始库存
- 无超卖现象
- 无订单存在但库存未扣减的情况

## 日志监控关键点

启动时：
```
初始化 Seata 数据源代理
Seata 数据源代理初始化成功
```

订单创建时：
```
开始创建订单, XID: 192.168.1.1:8091:123456, orderNo: ORDxxx, userId: 1
准备扣减库存, productId: 1, productName: iPhone, 当前库存: 100, 扣减数量: 1
扣减库存成功, productId: 1, quantity: 1, 扣减后库存: 99
```

事务提交后：
```
事务提交成功, orderNo: ORDxxx
开始校验订单库存扣减, orderNo: ORDxxx, 商品数: 1
商品: productId=1, name=iPhone, 购买数量=1, 当前库存=99
```

## 启动说明

### 方式一：使用 Seata Server（推荐用于生产）

1. 启动 Seata Server
2. 确保配置中的 `grouplist` 指向正确的 Seata 地址
3. 启动 Spring Boot 应用

### 方式二：不使用 Seata Server（开发/测试环境）

系统会自动降级使用 Spring 本地事务，仍能保证单节点的数据一致性：

1. 不启动 Seata Server
2. 系统会警告 "Seata 全局事务未生效！"
3. 但 Spring 本地事务仍正常工作
4. 库存扣减使用原子 UPDATE，仍能避免超卖

## 新增文件清单

1. `src/main/java/com/fulfillment/order/config/SeataDataSourceConfig.java`
2. `src/main/java/com/fulfillment/order/config/MyBatisConfig.java`
3. `src/main/java/com/fulfillment/order/aspect/TransactionMonitorAspect.java`
4. `src/main/resources/file.conf`
5. `src/main/resources/registry.conf`

## 修改文件清单

1. `src/main/java/com/fulfillment/order/service/OrderService.java`
2. `src/main/java/com/fulfillment/order/service/InventoryService.java`
3. `src/main/java/com/fulfillment/order/mapper/ProductMapper.java`
4. `src/main/resources/mapper/ProductMapper.xml`
5. `src/main/resources/application.yml`
