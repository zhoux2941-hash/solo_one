# 社区生鲜团购系统

基于 Java SpringBoot + SQLite + Vue 的社区生鲜团购系统。

## 功能特性

- **团长端**：
  - 创建团购活动
  - 查看按商品聚合的分拣清单
  - 分拣完成后更新状态
  - 查看佣金结算明细

- **团员端**：
  - 浏览进行中的团购活动
  - 下单购买（模拟支付）
  - 查看订单状态
  - 确认收货

## 技术栈

- 后端：SpringBoot 2.7.18 + JPA + SQLite
- 前端：Vue 2.7 + Element UI + Vue Router
- 数据库：SQLite（嵌入式，无需额外安装）

## 快速开始

### 环境要求
- JDK 11+
- Node.js 14+
- Maven 3.6+

### 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

### 启动前端

```bash
cd frontend
npm install
npm run serve
```

前端服务将在 http://localhost:8081 启动

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 团长 | leader | 123456 |
| 团员 | member1 | 123456 |
| 团员 | member2 | 123456 |

## 业务流程

1. **团长创建团购活动**：选择商品、设置团购价格、佣金比例、最小起团数量
2. **团员下单支付**：浏览活动、选择数量、提交订单、模拟支付
3. **团长查看分拣清单**：系统自动按商品聚合总数量，生成分拣清单
4. **团长完成分拣**：更新分拣数量，标记分拣完成
5. **团员确认收货**：收到商品后确认收货
6. **系统自动结算佣金**：确认收货后，团长佣金自动结算

## API 接口

### 用户接口
- `POST /api/user/login` - 登录
- `POST /api/user/register` - 注册
- `GET /api/user/{id}` - 获取用户信息
- `PUT /api/user` - 更新用户信息

### 商品接口
- `GET /api/product` - 获取所有商品
- `GET /api/product/{id}` - 获取商品详情
- `POST /api/product` - 新增商品

### 团购活动接口
- `POST /api/activity` - 创建活动
- `GET /api/activity/leader/{leaderId}` - 获取团长的活动列表
- `GET /api/activity/active` - 获取进行中的活动
- `GET /api/activity/{id}` - 获取活动详情
- `POST /api/activity/{id}/end` - 结束活动

### 订单接口
- `POST /api/order` - 创建订单
- `POST /api/order/{id}/pay` - 支付订单
- `POST /api/order/{id}/receive` - 确认收货
- `GET /api/order/member/{memberId}` - 获取团员订单列表
- `GET /api/order/activity/{activityId}` - 获取活动订单列表

### 分拣接口
- `GET /api/sorting/activity/{activityId}` - 获取分拣清单
- `GET /api/sorting/activity/{activityId}/detail` - 获取分拣明细
- `POST /api/sorting/{id}/quantity` - 更新分拣数量
- `POST /api/sorting/activity/{activityId}/complete` - 一键完成分拣
- `POST /api/sorting/activity/{activityId}/generate` - 生成分拣清单

### 佣金接口
- `GET /api/commission/leader/{leaderId}` - 获取团长佣金列表
- `GET /api/commission/leader/{leaderId}/summary` - 获取佣金汇总
- `GET /api/commission/leader/{leaderId}/status/{status}` - 按状态筛选佣金
