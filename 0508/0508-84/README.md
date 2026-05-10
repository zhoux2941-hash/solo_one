# 社区志愿者时数存储系统

## 项目简介

社区志愿者时数存储系统，支持志愿者签到签退、时数转换时间币、物品兑换商城、时数排行榜等功能。

## 技术栈

- **前端**: Vue3 + Vite + Element Plus + Pinia + Axios
- **后端**: Spring Boot 2.7 + Spring Data JPA + Spring Security
- **数据库**: MySQL 8.0
- **缓存**: Redis

## 项目结构

```
.
├── backend/                    # 后端项目
│   ├── src/
│   │   └── main/
│   │       ├── java/com/volunteer/
│   │       │   ├── entity/     # 实体类
│   │       │   ├── repository/ # 数据访问层
│   │       │   ├── service/    # 业务逻辑层
│   │       │   ├── controller/ # 控制器
│   │       │   └── config/     # 配置类
│   │       └── resources/
│   │           └── application.yml
│   └── pom.xml
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── views/              # 页面组件
│   │   ├── api/                # API接口
│   │   ├── store/              # 状态管理
│   │   ├── router/             # 路由配置
│   │   └── utils/              # 工具函数
│   └── package.json
└── sql/
    └── init.sql                # 数据库初始化脚本
```

## 功能模块

### 1. 志愿者签到签退
- 志愿者选择活动名称进行签到
- 系统记录签到时间
- 完成服务后点击签退，计算服务时长（分钟）

### 2. 时数审核与时间币转换
- 管理员审核签到记录
- 审核通过后，时数自动转换为时间币
- **转换规则**: 1小时 = 10时间币（按整小时计算）

### 3. 兑换商城
- 管理员上架物品（名称、所需币数、库存、是否热门）
- 热门物品库存使用Redis缓存
- 志愿者使用时间币兑换物品

### 4. 订单管理
- 志愿者下单兑换
- 管理员线下发放物品后点击"发放"
- 确认发放后点击"核销"完成订单

### 5. 社区时数排行榜
- 展示所有志愿者累计服务时长排名
- 显示累计小时数和可获得的时间币

## 数据库表设计

- `user`: 用户表（志愿者/管理员）
- `activity`: 活动表
- `attendance`: 签到记录表
- `goods`: 物品表
- `exchange_order`: 兑换订单表
- `time_coin_record`: 时间币记录表

## 快速开始

### 环境要求

- JDK 1.8+
- Node.js 16+
- MySQL 8.0+
- Redis 6.0+

### 1. 初始化数据库

```bash
mysql -u root -p < sql/init.sql
```

### 2. 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端服务地址: http://localhost:8080

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端访问地址: http://localhost:5173

### 默认账号

- **管理员**: admin / 123456
- **志愿者**: volunteer1 / 123456
- **志愿者**: volunteer2 / 123456 (已有50时间币)
- **志愿者**: volunteer3 / 123456 (已有100时间币)

## API接口列表

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/user/{id}` - 获取用户信息

### 活动
- `GET /api/activities` - 获取进行中活动
- `GET /api/activities/all` - 获取所有活动
- `POST /api/activities` - 创建活动
- `PUT /api/activities/{id}` - 更新活动
- `DELETE /api/activities/{id}` - 删除活动

### 签到
- `POST /api/attendance/checkin` - 签到
- `POST /api/attendance/checkout` - 签退
- `GET /api/attendance/user/{userId}` - 获取我的签到记录
- `GET /api/attendance/pending` - 获取待审核记录
- `POST /api/attendance/approve/{id}` - 审核通过
- `POST /api/attendance/reject/{id}` - 审核拒绝

### 物品
- `GET /api/goods` - 获取上架物品
- `GET /api/goods/hot` - 获取热门物品
- `POST /api/goods` - 上架物品
- `PUT /api/goods/{id}` - 更新物品
- `DELETE /api/goods/{id}` - 下架物品

### 订单
- `POST /api/orders` - 创建订单
- `GET /api/orders/user/{userId}` - 获取我的订单
- `GET /api/orders/pending` - 获取待发放订单
- `POST /api/orders/deliver/{id}` - 发放物品
- `POST /api/orders/complete/{id}` - 核销订单
- `POST /api/orders/cancel/{id}` - 取消订单

### 排行榜
- `GET /api/ranking` - 获取时数排行榜

## Redis缓存策略

- **热门物品列表**: `hot_goods:list`，缓存5分钟
- **热门物品库存**: `hot_goods:stock:{id}`，缓存10分钟
- **定时同步**: 每5分钟自动同步热门物品数据到缓存

## 许可证

MIT License
