# 电商订单履约中台

基于 Spring Boot 3 + Vue 3 + H2 数据库构建的全栈订单履约系统，支持订单创建、支付、物流流转、分布式事务和异常补偿。

## 技术栈

### 后端
- **Spring Boot 3.2.0**: 核心框架
- **MyBatis**: ORM 框架
- **H2 Database**: 内存/文件数据库
- **Seata**: 分布式事务（AT 模式）
- **Lombok**: 代码简化

### 前端
- **Vue 3**: 前端框架
- **Vite**: 构建工具
- **Element Plus**: UI 组件库
- **Vue Router**: 路由管理
- **Axios**: HTTP 客户端

## 核心功能

### 1. 订单全生命周期管理
- 订单创建（支持多商品）
- 订单支付
- 订单发货
- 订单签收
- 订单取消

### 2. 分布式事务保证
- 使用 Seata AT 模式保证订单创建与库存扣减的强一致性
- 乐观锁防止并发扣减冲突
- 异常时自动回滚

### 3. 异常订单自动补偿
- 定时任务扫描超时未支付订单（默认30分钟）
- 自动取消订单并回滚库存
- 记录补偿操作日志

### 4. 履约日志持久化
- 记录所有订单状态变更
- 支持按订单号、用户ID查询
- 完整的操作追溯

### 5. 前端功能
- 订单列表（多条件筛选、分页）
- 订单详情（商品明细、状态流转、履约日志）
- 创建订单
- 状态流转操作

## 数据库设计

### t_product - 商品表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| product_name | VARCHAR | 商品名称 |
| price | DECIMAL | 商品价格 |
| stock | INT | 库存数量 |
| version | INT | 乐观锁版本号 |

### t_order - 订单表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| order_no | VARCHAR | 订单号（唯一） |
| user_id | BIGINT | 用户ID |
| total_amount | DECIMAL | 订单总金额 |
| status | VARCHAR | 订单状态 |
| receiver_name | VARCHAR | 收货人姓名 |
| receiver_phone | VARCHAR | 收货人电话 |
| receiver_address | VARCHAR | 收货地址 |
| payment_time | TIMESTAMP | 支付时间 |
| ship_time | TIMESTAMP | 发货时间 |
| delivery_time | TIMESTAMP | 签收时间 |
| cancel_time | TIMESTAMP | 取消时间 |
| cancel_reason | VARCHAR | 取消原因 |

### t_order_item - 订单明细表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| order_id | BIGINT | 订单ID |
| order_no | VARCHAR | 订单号 |
| product_id | BIGINT | 商品ID |
| product_name | VARCHAR | 商品名称 |
| price | DECIMAL | 商品单价 |
| quantity | INT | 购买数量 |
| total_price | DECIMAL | 小计金额 |

### t_fulfillment_log - 履约日志表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| order_no | VARCHAR | 订单号 |
| user_id | BIGINT | 用户ID |
| operation_type | VARCHAR | 操作类型 |
| operation_desc | VARCHAR | 操作描述 |
| operator | VARCHAR | 操作人 |
| before_status | VARCHAR | 操作前状态 |
| after_status | VARCHAR | 操作后状态 |
| created_at | TIMESTAMP | 创建时间 |

### 订单状态流转
```
CREATED (待支付) → PAID (已支付) → SHIPPED (已发货) → DELIVERED (已签收)
    ↓
CANCELLED (已取消)
```

## 快速开始

### 后端启动

1. 进入后端目录
```bash
cd backend
```

2. 使用 Maven 编译并启动
```bash
mvn clean package
mvn spring-boot:run
```

3. 后端服务默认端口: `8080`

4. H2 控制台访问: `http://localhost:8080/h2-console`
   - JDBC URL: `jdbc:h2:file:./data/fulfillment`
   - 用户名: `sa`
   - 密码: 空

### 前端启动

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 前端访问地址: `http://localhost:3000`

## API 接口文档

### 订单相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/orders | 创建订单 |
| GET | /api/orders/{orderNo} | 查询订单详情 |
| GET | /api/orders | 分页查询订单列表 |
| POST | /api/orders/{orderNo}/pay | 订单支付 |
| POST | /api/orders/{orderNo}/ship | 订单发货 |
| POST | /api/orders/{orderNo}/deliver | 订单签收 |
| POST | /api/orders/{orderNo}/cancel | 取消订单 |

### 履约日志相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/orders/{orderNo}/logs | 查询订单履约日志 |
| GET | /api/orders/logs/user/{userId} | 查询用户履约日志 |

### 商品相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/orders/products/{productId} | 查询商品详情 |

## 项目结构

```
order-fulfillment-center/
├── backend/                          # 后端项目
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/fulfillment/order/
│   │   │   │   ├── controller/      # 控制器层
│   │   │   │   ├── service/         # 服务层
│   │   │   │   ├── mapper/          # 数据访问层
│   │   │   │   ├── entity/          # 实体类
│   │   │   │   ├── dto/             # 数据传输对象
│   │   │   │   ├── enums/           # 枚举类
│   │   │   │   ├── common/          # 公共类
│   │   │   │   └── task/            # 定时任务
│   │   │   └── resources/
│   │   │       ├── mapper/          # MyBatis XML
│   │   │       ├── db/              # 数据库脚本
│   │   │       └── application.yml  # 配置文件
│   └── pom.xml
│
└── frontend/                         # 前端项目
    ├── src/
    │   ├── views/                    # 页面组件
    │   ├── router/                   # 路由配置
    │   ├── api/                      # API 接口
    │   ├── utils/                    # 工具函数
    │   ├── App.vue                   # 根组件
    │   └── main.js                   # 入口文件
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 分布式事务说明

本项目使用 Seata AT 模式实现分布式事务，确保订单创建和库存扣减的原子性。

### 工作流程
1. 开启全局事务 `@GlobalTransactional`
2. 扣减库存（带乐观锁）
3. 创建订单主记录
4. 创建订单明细记录
5. 事务提交

### 异常回滚
- 库存不足 → 抛出异常，事务回滚
- 并发冲突 → 抛出异常，事务回滚
- 任何异常 → 自动回滚已扣减库存

## 异常补偿机制

### 定时任务
- 执行频率: 每分钟一次
- 超时时间: 30分钟（可配置）
- 补偿操作: 取消订单 + 回滚库存 + 记录日志

### 补偿流程
1. 查询所有 CREATED 状态且创建时间超过30分钟的订单
2. 逐个执行补偿:
   - 更新订单状态为 CANCELLED
   - 回滚每个商品的库存
   - 记录履约日志（COMPENSATE 类型）

## 注意事项

1. **Seata 服务**: 本项目配置了 Seata，但实际运行需要独立启动 Seata Server。如果不需要分布式事务，可以移除相关依赖和注解。

2. **H2 数据库**: 开发环境使用文件模式，数据会持久化在 `backend/data` 目录下。

3. **超时时间**: 异常订单补偿的超时时间可在 `OrderCompensationTask.java` 中修改。

4. **测试数据**: 系统启动时会自动初始化5个测试商品（ID: 1-5）。

## 测试场景建议

1. **正常流程**: 创建订单 → 支付 → 发货 → 签收
2. **取消订单**: 创建订单 → 取消订单（验证库存回滚）
3. **并发扣减**: 模拟高并发下单（需要压测工具）
4. **超时补偿**: 创建订单后等待30分钟，观察自动取消
5. **日志追溯**: 查看订单详情中的履约时间线

## 许可证

MIT License
