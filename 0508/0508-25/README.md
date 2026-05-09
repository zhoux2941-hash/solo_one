# 宠物寄养预约系统

## 项目概述

一个完整的宠物寄养预约管理系统，支持宠物主人为宠物（狗/猫）预约寄养时段，提供智能匹配推荐和数据分析功能。

## 技术栈

### 后端
- **框架**: Spring Boot 3.2
- **数据库**: MySQL 8.0
- **缓存**: Redis（位图存储占用情况）
- **ORM**: Spring Data JPA
- **安全**: Spring Security
- **构建工具**: Maven

### 前端
- **框架**: Vue 3
- **构建工具**: Vite
- **UI组件**: Element Plus
- **图表库**: ECharts
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios

## 功能模块

### 1. 宠物管理
- 宠物信息CRUD
- 支持狗/猫两种类型
- 体型分类（小型/中型/大型）
- 特殊需求记录

### 2. 寄养中心管理
- 寄养中心信息展示
- 多种房型管理
  - 小型犬房
  - 中型犬房
  - 大型犬房
  - 猫咪城堡
  - 猫咪阁楼
  - 小型宠物套房
  - 豪华猫房
- 房间容量、价格配置

### 3. 预约管理
- 创建预约
- 确认/取消/拒绝预约
- 日期冲突检测
- 实时可用性检查

### 4. 可预约日历
- 可视化展示房间占用情况
- 快速预约
- 按月查看

### 5. 智能匹配推荐
- 基于宠物特殊需求的智能匹配
- 匹配度评分（0-100分）
- 匹配理由展示
- 支持一键预约

### 6. 数据分析
- **入住率热力图**: 按月份和房型展示入住率
- **宠物类型偏好**: 猫vs狗各房型占比分布
- **冲突分析**: 高峰日期/时段冲突分析

## 系统架构

### 数据库设计

```
pet_owner (宠物主人表)
├── owner_id (主键)
├── name, phone, email, address
└── 时间戳字段

pet (宠物表)
├── pet_id (主键)
├── owner_id (外键)
├── name, type(DOG/CAT), size(SMALL/MEDIUM/LARGE)
├── breed, age
└── special_needs (特殊需求)

boarding_center (寄养中心表)
├── center_id (主键)
├── name, address, phone
├── description, facilities
└── 时间戳字段

room (房间表)
├── room_id (主键)
├── center_id (外键)
├── room_type, name, capacity
├── price_per_day (每日价格)
├── suitable_for_pet_type (适合宠物类型)
├── max_size (最大体型)
├── special_features (特色设施)
└── 时间戳字段

booking (预约表)
├── booking_id (主键)
├── pet_id, room_id, owner_id (外键)
├── start_date, end_date
├── status (PENDING/CONFIRMED/CANCELLED/REJECTED/COMPLETED)
├── total_price
└── special_requirements
```

### Redis位图缓存策略

**Key格式**: `occupancy:{roomId}:{year}-{month}`

**设计说明**:
- 每个房间每月一个Key
- 每一天用1位表示（0=空闲，1=占用）
- 高效的位运算支持可用性查询
- 支持快速统计入住率

## 快速开始

### 环境要求
- JDK 17+
- Node.js 18+
- MySQL 8.0
- Redis 6.0+
- Maven 3.6+

### 后端启动

1. 初始化数据库
```bash
mysql -u root -p < backend/sql/init.sql
```

2. 配置数据库和Redis连接
```bash
# 编辑 backend/src/main/resources/application.yml
# 修改数据库用户名密码
# 修改Redis连接信息
```

3. 启动后端服务
```bash
cd backend
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

### 前端启动

1. 安装依赖
```bash
cd frontend
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

前端服务将在 http://localhost:5173 启动

## API接口

### 宠物管理
- `GET /api/pets` - 获取所有宠物
- `GET /api/pets/{petId}` - 获取宠物详情
- `GET /api/pets/owner/{ownerId}` - 获取用户的宠物列表
- `POST /api/pets` - 创建宠物
- `PUT /api/pets/{petId}` - 更新宠物
- `DELETE /api/pets/{petId}` - 删除宠物

### 寄养中心
- `GET /api/centers` - 获取所有寄养中心
- `GET /api/centers/with-rooms` - 获取所有中心及房间
- `GET /api/centers/{centerId}/rooms` - 获取中心的房间列表
- `GET /api/centers/rooms/{roomId}/occupancy/{year}/{month}` - 获取房间月占用情况
- `GET /api/centers/rooms/{roomId}/available` - 检查房间可用性

### 预约管理
- `GET /api/bookings` - 获取预约列表
- `POST /api/bookings` - 创建预约
- `POST /api/bookings/{bookingId}/confirm` - 确认预约
- `POST /api/bookings/{bookingId}/cancel` - 取消预约
- `POST /api/bookings/{bookingId}/reject` - 拒绝预约

### 智能匹配
- `GET /api/matching/recommend?petId=xxx&startDate=xxx&endDate=xxx` - 获取匹配推荐

### 数据分析
- `GET /api/analytics/occupancy-heatmap?year=xxx` - 入住率热力图
- `GET /api/analytics/pet-type-preference` - 宠物类型偏好
- `GET /api/analytics/conflict-analysis?year=xxx&month=xxx` - 冲突分析

## 匹配度算法

匹配度评分基于以下因素：

1. **基础匹配** (40分)
   - 宠物类型兼容性
   - 宠物体型兼容性

2. **特殊需求匹配** (40分)
   - 大空间需求
   - 怕猫/怕狗
   - 需要空调
   - 需要泳池
   - 需要安静环境

3. **附加加分** (20分)
   - 配备空调
   - 监控设施
   - 专人照料
   - 玩具/猫爬架等

## 项目结构

```
pet-boarding-system/
├── backend/                    # Spring Boot 后端
│   ├── sql/                    # 数据库脚本
│   │   └── init.sql
│   ├── src/main/java/com/petboarding/
│   │   ├── PetBoardingApplication.java
│   │   ├── config/             # 配置类
│   │   ├── controller/         # REST控制器
│   │   ├── entity/             # 实体类
│   │   ├── repository/         # 数据访问层
│   │   └── service/            # 业务逻辑层
│   └── src/main/resources/
│       └── application.yml     # 应用配置
├── frontend/                   # Vue 3 前端
│   ├── src/
│   │   ├── api/                # API调用
│   │   ├── router/             # 路由配置
│   │   ├── stores/             # Pinia状态管理
│   │   ├── styles/             # 全局样式
│   │   ├── views/              # 页面组件
│   │   │   ├── Dashboard.vue   # 数据分析仪表盘
│   │   │   ├── Pets.vue        # 宠物管理
│   │   │   ├── Booking.vue     # 预约管理
│   │   │   ├── Calendar.vue    # 预约日历
│   │   │   ├── Matching.vue    # 智能匹配
│   │   │   └── Centers.vue     # 寄养中心
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 特色功能

### 1. Redis位图缓存
- 高效存储房间占用状态
- 支持快速可用性检查
- 支持入住率统计

### 2. 智能匹配算法
- 基于宠物特殊需求的精准匹配
- 评分和理由可视化
- 支持一键预约

### 3. 数据分析
- 入住率热力图可视化
- 宠物类型偏好分析
- 冲突高峰预警

### 4. 用户体验
- Element Plus 精美UI
- ECharts 数据可视化
- 响应式布局
