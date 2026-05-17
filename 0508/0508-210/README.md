# 地铁隧道通风与粉尘浓度预警系统

## 系统简介

本系统是一个地铁隧道粉尘浓度实时监测与通风控制预警系统，用于实时监测隧道内的PM2.5和PM10浓度，当浓度超标时自动触发预警并启动加强通风设备。

## 技术栈

- **后端**: Java 8 + Spring Boot 2.7.x + Spring Data JPA
- **数据库**: H2 内存数据库
- **实时通信**: WebSocket (STOMP)
- **前端**: 原生 HTML + JavaScript + Chart.js

## 核心功能

### 1. 粉尘浓度监测
- 支持传感器数据上报（PM2.5、PM10）
- 实时数据存储与查询
- 阈值判断与自动预警

### 2. 预警系统
- PM2.5 > 75μg/m³ 触发预警
- PM10 > 150μg/m³ 触发预警
- 预警记录管理与状态追踪

### 3. 通风控制
- 预警后自动开启加强通风
- 支持手动开启/停止通风
- 通风时长统计与效果记录

### 4. 报表统计
- 各区间粉尘浓度趋势图
- 通风设备运行时长统计
- 实时数据仪表盘

## 项目结构

```
ventilation-dust-warning/
├── src/
│   └── main/
│       ├── java/com/metro/
│       │   ├── MetroVentilationApplication.java    # 主启动类
│       │   ├── config/
│       │   │   └── DataInitializer.java            # 数据初始化
│       │   ├── entity/
│       │   │   ├── TunnelSection.java              # 隧道区间实体
│       │   │   ├── DustSensorData.java             # 粉尘传感器数据
│       │   │   ├── WarningRecord.java              # 预警记录
│       │   │   └── VentilationRecord.java          # 通风记录
│       │   ├── repository/                          # 数据访问层
│       │   ├── service/                             # 业务逻辑层
│       │   ├── controller/                          # 控制器层
│       │   └── websocket/                           # WebSocket配置
│       └── resources/
│           ├── application.properties              # 配置文件
│           └── static/
│               ├── index.html                       # 前端页面
│               └── app.js                           # 前端脚本
├── pom.xml                                          # Maven配置
└── README.md
```

## 快速开始

### 环境要求
- JDK 1.8+
- Maven 3.6+

### 启动步骤

1. **编译项目**
   ```bash
   mvn clean package
   ```

2. **运行应用**
   ```bash
   mvn spring-boot:run
   ```

3. **访问系统**
   - 前端页面: http://localhost:8080
   - H2控制台: http://localhost:8080/h2-console
     - JDBC URL: `jdbc:h2:mem:metrodbb`
     - 用户名: `sa`
     - 密码: (空)

## API接口文档

### 1. 粉尘数据上报
```
POST /api/dust/report
Content-Type: application/json

{
    "sectionId": "S001",
    "pm25": 85.5,
    "pm10": 160.2
}
```

### 2. 通风控制
```
POST /api/ventilation/start
{
    "sectionId": "S001",
    "reason": "手动开启"
}

POST /api/ventilation/stop
{
    "sectionId": "S001"
}
```

### 3. 数据查询
```
GET /api/dust/latest?limit=10
GET /api/dust/section/{sectionId}
GET /api/warnings/active
GET /api/warnings/all
GET /api/sections
```

### 4. 报表接口
```
GET /api/report/dashboard
GET /api/report/dust-trend?sectionId=&startTime=&endTime=
GET /api/report/ventilation-duration?startTime=&endTime=
GET /api/report/ventilation-records?sectionId=
```

## 前端功能说明

### 实时监控页面
- **数据模拟面板**: 支持手动/自动模拟传感器数据上报
- **统计仪表盘**: 显示总区间数、正在通风数、活跃预警数、正常运行数
- **区间状态卡片**: 实时显示各隧道区间的粉尘浓度和通风状态

### 预警管理页面
- 显示所有预警记录列表
- 预警类型、浓度数值、发生时间
- 预警状态（已解除/未解除）

### 报表统计页面
- **粉尘浓度趋势图**: 可选择时间范围和区间，展示PM2.5/PM10变化曲线
- **通风时长统计表**: 各区间通风设备运行时长统计

## 系统配置

配置文件: `src/main/resources/application.properties`

```properties
# 粉尘浓度阈值
dust.threshold.pm25=75
dust.threshold.pm10=150

# 服务器端口
server.port=8080
```

## 初始化数据

系统启动时自动创建5个隧道区间:
- S001: 1号区间-东站至西站
- S002: 2号区间-南站至北站
- S003: 3号区间-市中心环线
- S004: 4号区间-机场快线
- S005: 5号区间-开发区专线

## 注意事项

1. H2数据库为内存数据库，重启后数据会丢失
2. WebSocket连接失败时会自动重连
3. 自动模拟功能每10秒上报一次数据
4. 通风停止时自动解除相关预警

## 开发说明

- 所有数据模型使用JPA注解
- Service层处理核心业务逻辑
- Controller提供RESTful API
- WebSocket用于实时数据推送
- 前端使用原生JS，无需额外构建工具
