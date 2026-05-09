# 物流追踪系统

一个完整的物流追踪系统，模拟快递包裹从发货到签收的全流程，包含前端可视化和后端数据管理。

## 项目概述

### 功能特性

1. **包裹管理**
   - 包裹列表展示
   - 包裹单号搜索
   - 包裹详情查看

2. **轨迹追踪**
   - Leaflet 地图展示运输路线
   - 路径动画播放
   - 节点停留时长显示
   - 轨迹时间线

3. **时效分析看板**
   - 日平均时效趋势折线图
   - 不同线路时效对比柱状图
   - 统计概览卡片

4. **滞留热力图**
   - 地图展示各转运中心滞留包裹
   - 颜色深浅表示滞留严重程度
   - 滞留详情列表

5. **包裹路径桑基图**
   - 城市间包裹流向分析
   - 热门线路统计
   - 边宽表示包裹数量

### 技术栈

**后端**
- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- Spring Data Redis
- MySQL 8.0
- Redis
- Lombok

**前端**
- Vue 3
- Vue Router 4
- Vite 5
- Element Plus
- ECharts 5
- Leaflet 1.9
- Axios

## 项目结构

```
logistics-track-system/
├── backend/                    # 后端 Spring Boot 项目
│   ├── src/main/java/com/logistics/track/
│   │   ├── TrackSystemApplication.java      # 主应用类
│   │   ├── config/                          # 配置类
│   │   │   ├── RedisConfig.java
│   │   │   └── WebConfig.java
│   │   ├── controller/                      # 控制器
│   │   │   ├── PackageController.java
│   │   │   ├── TrackController.java
│   │   │   └── StatisticsController.java
│   │   ├── service/                         # 业务服务
│   │   │   ├── PackageService.java
│   │   │   ├── TrackService.java
│   │   │   └── StatisticsService.java
│   │   ├── repository/                      # 数据访问
│   │   │   ├── PackageRepository.java
│   │   │   └── TrackRepository.java
│   │   ├── entity/                          # 实体类
│   │   │   ├── Package.java
│   │   │   ├── Track.java
│   │   │   └── TrackStatus.java
│   │   ├── dto/                             # 数据传输对象
│   │   ├── data/                            # 数据配置
│   │   │   ├── CityCenterConfig.java
│   │   │   └── MockDataGenerator.java
│   │   └── scheduler/                       # 定时任务
│   │       └── StuckCenterScheduler.java
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── schema.sql
│   └── pom.xml
│
└── frontend/                   # 前端 Vue 3 项目
    ├── src/
    │   ├── main.js                        # 入口文件
    │   ├── App.vue                        # 根组件
    │   ├── style.css                      # 全局样式
    │   ├── api/index.js                   # API 服务
    │   └── views/                         # 页面组件
    │       ├── PackageList.vue            # 包裹列表
    │       ├── PackageTrack.vue           # 轨迹详情
    │       ├── Dashboard.vue              # 时效看板
    │       ├── StuckHeatmap.vue           # 滞留热力图
    │       └── SankeyFlow.vue             # 桑基图
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 快速开始

### 环境要求

- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Maven 3.8+

### 数据库配置

1. 创建数据库

```sql
CREATE DATABASE logistics_track CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 或者直接执行 schema.sql

```bash
mysql -u root -p < backend/src/main/resources/schema.sql
```

3. 修改 application.yml 中的数据库连接信息

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/logistics_track
    username: your_username
    password: your_password
```

### Redis 配置

修改 application.yml 中的 Redis 连接信息

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: your_password
```

### 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端将在 `http://localhost:8080` 启动

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将在 `http://localhost:3000` 启动

## API 接口

### 包裹管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/packages` | 获取所有包裹列表 |
| GET | `/api/packages/{id}` | 根据ID获取包裹 |
| GET | `/api/packages/no/{packageNo}` | 根据单号获取包裹 |
| POST | `/api/packages` | 创建新包裹 |

### 轨迹管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/tracks/package/{packageId}` | 获取包裹所有轨迹 |
| GET | `/api/tracks/package/{packageId}/page` | 分页获取轨迹 |
| POST | `/api/tracks/package/{packageId}` | 添加新轨迹 |

### 统计分析

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/statistics/daily-time?days=7` | 获取日时效分析 |
| GET | `/api/statistics/route-time` | 获取线路时效分析 |
| GET | `/api/statistics/stuck-centers` | 获取滞留中心数据 |
| GET | `/api/statistics/stuck-centers/refresh` | 刷新滞留中心数据 |
| GET | `/api/statistics/sankey` | 获取桑基图数据 |

## 核心功能说明

### 1. Redis 缓存

- 每个包裹的最近20条轨迹缓存在 Redis 中
- 缓存键格式: `track:package:{packageId}`
- 缓存有效期: 1小时
- 新增轨迹时自动更新缓存

### 2. 定时任务

- 每小时执行一次: `0 0 * * * ?`
- 计算各转运中心滞留包裹数
- 超过24小时未离开的包裹视为滞留
- 结果缓存到 Redis

### 3. 数据模拟

- 首次启动时自动生成50个模拟包裹
- 每个包裹包含完整的运输轨迹
- 包含揽收、运输中、派送、签收四个状态
- 随机选择10个城市作为转运中心

### 4. 转运中心

系统预设10个主要城市转运中心：

| 城市 | 中心名称 | 坐标 |
|------|---------|------|
| 北京 | 北京转运中心 | 39.9042, 116.4074 |
| 上海 | 上海转运中心 | 31.2304, 121.4737 |
| 广州 | 广州转运中心 | 23.1291, 113.2644 |
| 深圳 | 深圳转运中心 | 22.5431, 114.0579 |
| 成都 | 成都转运中心 | 30.5728, 104.0668 |
| 杭州 | 杭州转运中心 | 30.2741, 120.1551 |
| 武汉 | 武汉转运中心 | 30.5928, 114.3055 |
| 西安 | 西安转运中心 | 34.3416, 108.9398 |
| 南京 | 南京转运中心 | 32.0603, 118.7969 |
| 重庆 | 重庆转运中心 | 29.4316, 106.9123 |

## 数据库设计

### 包裹表 (packages)

| 字段 | 类型 | 描述 |
|------|------|------|
| package_id | BIGINT | 主键 |
| package_no | VARCHAR(50) | 包裹单号（唯一） |
| sender | VARCHAR(100) | 发件人 |
| sender_city | VARCHAR(50) | 发件城市 |
| receiver | VARCHAR(100) | 收件人 |
| receiver_city | VARCHAR(50) | 收件城市 |
| created_at | DATETIME | 创建时间 |
| current_status | VARCHAR(20) | 当前状态 |

### 轨迹表 (tracks)

| 字段 | 类型 | 描述 |
|------|------|------|
| track_id | BIGINT | 主键 |
| package_id | BIGINT | 包裹ID（外键） |
| location | VARCHAR(100) | 位置/转运中心 |
| status | VARCHAR(20) | 状态 |
| timestamp | DATETIME | 时间戳 |
| latitude | DOUBLE | 纬度 |
| longitude | DOUBLE | 经度 |
| remark | VARCHAR(255) | 备注 |

### 状态枚举 (TrackStatus)

| 状态 | 描述 |
|------|------|
| PICKUP | 揽收 |
| IN_TRANSIT | 运输中 |
| DISPATCH | 派送 |
| SIGNED | 签收 |

## 前端页面说明

### 1. 包裹列表页
- 展示所有包裹的基本信息
- 支持按包裹单号搜索
- 点击"轨迹"可查看详细运输路径

### 2. 轨迹详情页
- 展示包裹完整信息
- Leaflet 地图可视化运输路线
- 可播放/暂停路径动画
- 轨迹时间线展示每个节点停留时长

### 3. 时效分析看板
- 统计概览：总包裹数、平均/最短/最长时效
- 日时效趋势折线图
- 线路时效对比柱状图
- 支持7天/14天/30天数据切换

### 4. 滞留热力图
- 地图展示各转运中心滞留情况
- 圆圈大小和颜色表示滞留严重程度
- 详情列表展示各中心滞留数据

### 5. 桑基图
- 可视化城市间包裹流向
- 边宽表示包裹数量
- 热门线路排名

## 常见问题

### 1. 数据库连接失败
- 检查 MySQL 服务是否启动
- 确认数据库已创建
- 检查 application.yml 中的用户名和密码

### 2. Redis 连接失败
- 检查 Redis 服务是否启动
- 检查 Redis 端口 (默认 6379)
- 如果有密码，在 application.yml 中配置

### 3. 前端 API 调用失败
- 检查后端是否正常运行 (8080端口)
- 确认 Vite 代理配置正确
- 检查浏览器控制台的错误信息

### 4. 数据生成失败
- 检查数据库表是否自动创建
- 查看后端日志获取详细错误
- 确认 JPA ddl-auto 配置为 update

## 扩展建议

1. **用户管理**
   - 添加用户认证和授权
   - 区分管理员和普通用户权限

2. **实时追踪**
   - 使用 WebSocket 实现实时推送
   - 集成真实物流 API

3. **报表导出**
   - 添加 Excel/PDF 导出功能
   - 定时生成报表邮件

4. **报警系统**
   - 滞留包裹超过阈值自动报警
   - 异常时效预警

5. **移动端适配**
   - 响应式设计优化
   - 开发微信小程序/APP

## License

MIT License
