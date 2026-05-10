# 🎣 路亚钓鱼记录系统

一个基于 Vue3 + Java + MySQL + Redis 的路亚钓鱼记录系统，支持钓鱼记录、拟饵推荐、鱼种热力图和钓点分享功能。

## 功能特性

### 1. 钓鱼记录管理
- 记录每次钓鱼的天气信息（气温、水温、气压）
- 记录钓获鱼种和数量
- 记录使用的拟饵（型号/颜色）
- 支持天气状况和水体能见度记录

### 2. 拟饵推荐系统
- 基于当前水温和气温条件
- 统计历史数据中相似条件的拟饵成功率
- 推荐成功率最高的前3名拟饵
- 支持按目标鱼种筛选推荐

### 3. 季节性鱼种热力图
- 展示各月份不同鱼种的出现频率
- 使用 ECharts 可视化热力图
- 直观了解季节性鱼种活动规律

### 4. 钓点分享系统
- 用户可标记自己的钓点
- 查看附近钓友推荐的钓点
- 支持获取当前GPS位置
- 一键打开地图导航

## 技术栈

### 后端
- **框架**: Spring Boot 3.2.0
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **ORM**: Spring Data JPA
- **API**: RESTful API

### 前端
- **框架**: Vue 3 + Composition API
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **UI框架**: Element Plus
- **数据可视化**: ECharts
- **HTTP客户端**: Axios
- **构建工具**: Vite

## 项目结构

```
fishing-log/
├── backend/                    # 后端项目
│   ├── pom.xml
│   ├── src/main/
│   │   ├── java/com/fishing/
│   │   │   ├── FishingLogApplication.java
│   │   │   ├── config/        # 配置类
│   │   │   ├── controller/    # 控制器
│   │   │   ├── service/       # 服务层
│   │   │   ├── repository/    # 数据访问层
│   │   │   ├── entity/        # 实体类
│   │   │   ├── dto/           # 数据传输对象
│   │   │   └── common/        # 通用类
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/schema.sql  # 数据库初始化脚本
│   └── ...
├── frontend/                   # 前端项目
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── router/index.js    # 路由配置
│       ├── views/             # 页面组件
│       │   ├── Home.vue
│       │   ├── FishingRecord.vue
│       │   ├── LureRecommend.vue
│       │   ├── Heatmap.vue
│       │   └── FishingSpots.vue
│       ├── api/fishing.js     # API接口
│       ├── utils/request.js   # Axios封装
│       └── style.css
└── README.md
```

## 数据库设计

### 主要数据表

1. **users** - 用户表
2. **fish_species** - 鱼种表（预置6种常见路亚目标鱼）
3. **lures** - 拟饵表（预置10种常见拟饵）
4. **fishing_spots** - 钓点表
5. **fishing_records** - 钓鱼记录表

## 快速开始

### 环境要求
- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+

### 1. 数据库配置

```bash
# 登录MySQL
mysql -u root -p

# 执行初始化脚本
source /path/to/fishing-log/backend/src/main/resources/db/schema.sql
```

或者手动创建数据库并配置 `application.yml` 中的数据库连接信息。

### 2. 启动Redis

确保Redis服务已启动在默认端口 `6379`。

### 3. 启动后端

```bash
cd backend

# Maven构建
mvn clean install

# 运行项目
mvn spring-boot:run
```

后端服务将运行在 `http://localhost:8080`

### 4. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 开发模式运行
npm run dev
```

前端服务将运行在 `http://localhost:3000`

### 5. 访问系统

打开浏览器访问 `http://localhost:3000`

## API接口

### 钓鱼记录接口

- `POST /api/records` - 创建钓鱼记录
- `GET /api/records/user/{userId}` - 获取用户钓鱼记录
- `GET /api/records/recommendations` - 获取拟饵推荐
- `GET /api/records/heatmap` - 获取热力图数据
- `GET /api/records/species` - 获取所有鱼种
- `GET /api/records/lures` - 获取所有拟饵

### 钓点接口

- `POST /api/spots` - 创建钓点
- `GET /api/spots/user/{userId}` - 获取用户钓点
- `GET /api/spots/nearby` - 获取附近钓点

## 核心功能说明

### 拟饵推荐算法

系统采用简单但实用的频率统计推荐算法：

1. 输入条件：当前水温和气温
2. 筛选范围：历史数据中水温±2°C、气温±2°C范围内的记录
3. 统计维度：按拟饵分组，统计使用次数和总钓获数
4. 排序规则：按成功率（钓获数/使用次数）降序排列
5. 输出结果：推荐前3名拟饵

### Redis缓存策略

- 拟饵推荐结果缓存1小时
- 热力图数据缓存30分钟
- 附近钓点查询缓存5分钟
- 创建新记录时自动清除相关缓存

## 使用说明

1. **首页**：查看统计概览和最近记录
2. **记录钓鱼**：填写钓鱼信息并保存
3. **拟饵推荐**：输入当前水温和气温，获取推荐拟饵
4. **鱼种热力图**：查看各月份鱼种出现情况
5. **钓点地图**：添加钓点和查看附近钓友推荐

## 预置数据

### 鱼种
鲈鱼、鳜鱼、翘嘴、黑鱼、罗非、鲶鱼

### 拟饵
美夏银刀（红头白身、红头、夜光）、EWE妖刀（金色、银色、红头白身）、领峰V8（绿色、黑色）、钓之屋诡道（彩色、金色）

## 扩展建议

1. **用户系统**：添加完整的用户注册登录功能
2. **图片上传**：支持上传鱼获照片
3. **天气预报集成**：对接天气API自动获取天气数据
4. **钓点地图**：集成真实地图组件（如高德、百度地图）
5. **数据分析**：添加更多统计图表和分析报告
6. **社交功能**：用户关注、评论、点赞等

## 许可证

MIT License
