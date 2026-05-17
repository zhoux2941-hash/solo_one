# 海洋文化遗产保护系统

## 系统概述

本系统是一个基于电子围栏技术的海洋文化遗产保护监控系统，用于实时监控船舶航行状态，防止船只进入保护区。

## 功能特性

### 1. 保护区电子围栏管理
- 支持多边形电子围栏定义
- 灵活的保护区坐标配置
- 保护区启用/禁用控制

### 2. 船舶AIS信号监控
- 每30秒自动上报船舶位置
- 模拟5艘船舶的航行轨迹
- 实时显示船舶航速、航向

### 3. 越界检测与告警
- 实时计算船舶与围栏的距离
- 船舶进入保护区自动触发告警
- 告警证据链记录（位置、时间、速度等）

### 4. 数据报表功能
- 越界船舶统计排行
- 高频越界区域热力图
- 告警历史记录查询

## 技术架构

### 后端
- **框架**: Spring Boot 2.7.x
- **语言**: Java 11+
- **数据库**: H2（内存数据库）
- **空间计算**: JTS Topology Suite
- **实时推送**: WebSocket
- **构建工具**: Maven

### 前端
- **地图**: Leaflet.js
- **语言**: 原生 HTML/JavaScript
- **热力图**: Leaflet.heat

## 项目结构

```
marine-protection-system/
├── backend/                 # 后端项目
│   ├── src/
│   │   └── main/
│   │       ├── java/com/oceanheritage/
│   │       │   ├── entity/          # 数据实体
│   │       │   ├── repository/      # 数据访问层
│   │       │   ├── service/         # 业务逻辑层
│   │       │   ├── controller/      # 控制器
│   │       │   ├── config/          # 配置类
│   │       │   ├── simulator/       # AIS模拟器
│   │       │   └── MarineProtectionApplication.java
│   │       └── resources/
│   │           └── application.properties
│   └── pom.xml
├── frontend/                # 前端项目
│   ├── index.html
│   └── app.js
└── README.md
```

## 快速开始

### 环境要求
- JDK 11 或更高版本
- Maven 3.6+
- 现代浏览器（Chrome、Firefox等）

### 启动后端

```bash
cd backend
mvn clean package
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动。

### 启动前端

直接在浏览器中打开 `frontend/index.html` 文件即可。

### H2数据库控制台

访问 `http://localhost:8080/h2-console` 可以查看数据库内容：
- JDBC URL: `jdbc:h2:mem:marine_db`
- 用户名: `admin`
- 密码: `admin`

## API接口文档

### 保护区管理
- `GET /api/areas` - 获取所有保护区
- `GET /api/areas/{id}` - 获取单个保护区
- `POST /api/areas` - 创建保护区
- `PUT /api/areas/{id}` - 更新保护区
- `DELETE /api/areas/{id}` - 删除保护区

### 船舶管理
- `GET /api/ships` - 获取所有船舶
- `GET /api/ships/{mmsi}` - 获取单艘船舶
- `POST /api/ships/report` - 上报AIS数据
- `POST /api/ships` - 创建船舶
- `DELETE /api/ships/{id}` - 删除船舶

### 报表与告警
- `GET /api/reports/violations` - 获取所有越界记录
- `GET /api/reports/ship-statistics` - 船舶越界统计
- `GET /api/reports/heatmap` - 热力图数据
- `GET /api/reports/alerts` - 获取活跃告警
- `PUT /api/reports/alerts/{id}/acknowledge` - 确认告警

### WebSocket
- `ws://localhost:8080/ws` - 实时数据推送

## 核心算法说明

### 点在多边形内检测
使用射线法（Ray Casting Algorithm）判断船舶位置是否在保护区多边形内。

### 距离计算
基于经纬度坐标，使用Haversine公式计算船舶到保护区边界的最短距离，并转换为米单位。

## 预置数据

系统启动时自动创建两个保护区：
- **东海文化遗产保护区A区** - 古代沉船遗址
- **东海文化遗产保护区B区** - 水下考古重点区域

同时模拟5艘船舶的航行数据，每30秒更新一次位置。

## 注意事项

1. 本系统使用H2内存数据库，重启后数据会丢失
2. AIS信号为模拟数据，实际使用时需要对接真实AIS数据源
3. 生产环境建议使用MySQL或PostgreSQL等持久化数据库
4. 建议配置HTTPS以确保数据传输安全

## 许可证

MIT License
