# 拼车回家 - 大学拼车系统

一个基于 Vue3 + Java Spring Boot + MySQL + Redis 的大学放假拼车回家系统。

## 功能特性

### 1. 用户认证
- 用户注册、登录
- JWT Token 认证
- 用户信息存储

### 2. 行程发布
- 发布拼车行程（出发时间、起点、终点、可带人数、人均费用）
- 行程状态管理（招募中、已满员、已完成、已取消）

### 3. 行程搜索与匹配
- 搜索相似行程（同一终点城市 + 出发时间相差±1小时）
- 系统推荐匹配列表
- 热门城市行程展示（Redis缓存）

### 4. 拼车申请与小组
- 发起拼车申请
- 车主同意后自动生成拼车小组
- 小组内成员聊天

### 5. 守信指数系统
- 完成拼车守信指数+5
- 爽约取消守信指数-10
- 展示在用户信息和行程卡片上

## 技术栈

### 前端
- **框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **UI框架**: Element Plus
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **HTTP客户端**: Axios
- **时间处理**: Day.js

### 后端
- **框架**: Spring Boot 3.2
- **持久层**: Spring Data JPA
- **安全认证**: Spring Security + JWT
- **缓存**: Spring Data Redis
- **数据库**: MySQL 8.0
- **开发工具**: Lombok

### 数据库
- **关系型**: MySQL 8.0
- **缓存**: Redis 6.0+

## 项目结构

```
.
├── carpool-backend/          # 后端 Spring Boot 项目
│   ├── src/main/java/com/carpool/
│   │   ├── CarpoolApplication.java
│   │   ├── config/          # 配置类（Redis, Security）
│   │   ├── controller/      # 控制器层
│   │   ├── dto/             # 数据传输对象
│   │   ├── entity/          # 实体类
│   │   ├── repository/      # 数据访问层
│   │   ├── security/        # 安全相关（JWT）
│   │   └── service/         # 业务逻辑层
│   ├── src/main/resources/
│   │   └── application.yml  # 应用配置
│   └── pom.xml
│
├── carpool-frontend/        # 前端 Vue3 项目
│   ├── src/
│   │   ├── api/             # API 接口
│   │   ├── components/      # 公共组件
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── utils/           # 工具函数
│   │   ├── views/           # 页面组件
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   └── init.sql             # 数据库初始化脚本
│
└── README.md
```

## 快速开始

### 环境要求
- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Maven 3.8+

### 1. 数据库准备

```bash
# 创建数据库并执行初始化脚本
mysql -u root -p < database/init.sql
```

### 2. 启动 Redis

```bash
# Windows
redis-server

# 或使用 Docker
docker run -p 6379:6379 redis
```

### 3. 后端启动

```bash
cd carpool-backend

# 修改 application.yml 中的数据库连接信息
# spring.datasource.username 和 password

# 启动应用
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### 4. 前端启动

```bash
cd carpool-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 `http://localhost:5173` 启动

## API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 行程接口
- `POST /api/trips` - 发布行程
- `POST /api/trips/search` - 搜索匹配行程
- `GET /api/trips/hot` - 获取热门城市行程（Redis缓存）
- `GET /api/trips/recent` - 获取最新行程
- `GET /api/trips/mine` - 获取我的行程
- `GET /api/trips/{id}` - 获取行程详情

### 申请接口
- `POST /api/requests/trip/{tripId}` - 发起拼车申请
- `GET /api/requests/mine` - 获取我发起的申请
- `GET /api/requests/received` - 获取我收到的申请
- `POST /api/requests/{id}/respond` - 响应申请（同意/拒绝）

### 小组接口
- `GET /api/groups` - 获取我的拼车小组
- `GET /api/groups/{id}` - 获取小组详情
- `GET /api/groups/{id}/messages` - 获取小组消息
- `POST /api/groups/{id}/messages` - 发送消息
- `POST /api/groups/{id}/complete` - 完成行程
- `POST /api/groups/{id}/cancel/{userId}` - 取消行程

## 数据库表设计

### users 用户表
- id, username, password, real_name, phone
- credit_score (守信指数，默认100)
- completed_rides, canceled_rides

### trips 行程表
- id, publisher_id, departure_city, destination_city
- departure_time, total_seats, available_seats
- cost_per_person, description, status

### carpool_requests 拼车申请表
- id, trip_id, requester_id, seats_requested
- message, status (PENDING/ACCEPTED/REJECTED)

### carpool_groups 拼车小组表
- id, trip_id, leader_id, status

### group_members 小组成员关联表
- group_id, user_id

### messages 消息表
- id, group_id, sender_id, content, created_at

### hot_cities 热门城市统计
- city_name, search_count, trip_count

## Redis 缓存策略

### 缓存键设计
- `carpool:hot_cities:all` - 热门城市行程列表
- `carpool:hot_cities:search:{city}` - 城市搜索计数

### 缓存机制
1. 热门城市行程数据缓存30分钟
2. 用户搜索时更新城市搜索计数
3. 行程发布/更新时自动清除缓存

## 时间匹配算法

搜索时使用±1小时时间窗口：
```
开始时间 = 目标时间 - 1小时
结束时间 = 目标时间 + 1小时
```

查询条件：目的地相同 + 时间在窗口内 + 状态为OPEN + 有剩余座位

## 守信指数规则

| 行为 | 指数变化 |
|------|----------|
| 新用户 | +100（初始） |
| 完成拼车 | +5 |
| 取消行程（爽约） | -10 |
| 最低值 | 0 |

## 许可证

MIT License
