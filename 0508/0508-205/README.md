# 滑雪场雪道状态与魔毯排队实时系统

## 项目简介

这是一个滑雪场运营管理系统，提供雪道状态管理、魔毯/缆车排队监控、以及客流量统计和报表分析功能。

## 技术栈

### 后端
- Java 11
- Spring Boot 2.7.x
- Spring Data JPA
- WebSocket (STOMP)
- H2 内存数据库

### 前端
- 原生 HTML5
- 原生 JavaScript (ES6+)
- CSS3 (响应式设计)
- SVG 地图展示

## 功能特性

### 1. 雪道地图展示
- SVG 可视化滑雪场地图
- 不同颜色标识雪道难度（初级/中级/高级）
- 实时显示雪道状态（开放/关闭/压雪中）
- 缆车/魔毯位置和排队等待时间标注

### 2. 雪道管理
- 查看所有雪道的详细信息
- 实时更新雪道状态（开放/关闭/压雪中）
- 统计各雪道今日客流量

### 3. 排队管理
- 监控所有魔毯/缆车的排队人数
- 自动计算预计等待时间
- 员工手动录入排队人数
- 支持启动/停止缆车运营

### 4. 报表统计
- 每日客流量统计报表
- 每小时客流量分布图
- 各雪道客流量对比
- 缆车排队高峰时段分析
- 平均/最长等待时间统计

## 项目结构

```
ski-resort-monitor/
├── pom.xml
├── README.md
└── src/
    └── main/
        ├── java/com/skiresort/
        │   ├── SkiResortApplication.java
        │   ├── config/
        │   │   ├── DataInitializer.java
        │   │   └── WebSocketConfig.java
        │   ├── controller/
        │   │   ├── SlopeController.java
        │   │   ├── LiftController.java
        │   │   └── ReportController.java
        │   ├── model/
        │   │   ├── Slope.java
        │   │   ├── Lift.java
        │   │   ├── QueueRecord.java
        │   │   └── VisitorRecord.java
        │   ├── repository/
        │   │   ├── SlopeRepository.java
        │   │   ├── LiftRepository.java
        │   │   ├── QueueRecordRepository.java
        │   │   └── VisitorRecordRepository.java
        │   └── service/
        │       ├── SlopeService.java
        │       ├── LiftService.java
        │       └── ReportService.java
        └── resources/
            ├── application.properties
            └── static/
                ├── index.html
                ├── css/
                │   └── style.css
                └── js/
                    ├── api.js
                    ├── map.js
                    ├── app.js
                    └── reports.js
```

## 快速开始

### 前置要求

- JDK 11 或更高版本
- Maven 3.6 或更高版本

### 运行步骤

1. **克隆或下载项目**
   ```bash
   cd 0508-205
   ```

2. **编译项目**
   ```bash
   mvn clean compile
   ```

3. **运行应用**
   ```bash
   mvn spring-boot:run
   ```

4. **访问应用**
   
   打开浏览器访问：http://localhost:8080

### H2 数据库控制台

访问：http://localhost:8080/h2-console

- JDBC URL: `jdbc:h2:mem:skiresort`
- 用户名: `sa`
- 密码: (空)

## API 接口文档

### 雪道管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/slopes` | 获取所有雪道列表 |
| GET | `/api/slopes/{id}` | 获取单个雪道信息 |
| POST | `/api/slopes` | 创建新雪道 |
| PUT | `/api/slopes/{id}/status` | 更新雪道状态 |
| POST | `/api/slopes/{id}/visitors` | 增加客流量 |
| GET | `/api/slopes/status/{status}` | 按状态筛选雪道 |
| GET | `/api/slopes/difficulty/{difficulty}` | 按难度筛选雪道 |

### 缆车管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/lifts` | 获取所有缆车列表 |
| GET | `/api/lifts/active` | 获取运行中缆车 |
| GET | `/api/lifts/{id}` | 获取单个缆车信息 |
| PUT | `/api/lifts/{id}/queue` | 更新排队人数 |
| POST | `/api/lifts/{id}/toggle` | 切换缆车运行状态 |
| GET | `/api/lifts/type/{type}` | 按类型筛选缆车 |

### 报表统计 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/reports/visitors/daily` | 获取每日客流量报表 |
| GET | `/api/reports/queue` | 获取排队分析报表 |

## 初始化数据

系统启动时会自动初始化以下示例数据：

### 雪道
- 初级雪道1号（开放）
- 初级雪道2号（开放）
- 中级雪道1号（开放）
- 中级雪道2号（压雪中）
- 高级雪道1号（开放）
- 高级雪道2号（关闭）

### 缆车/魔毯
- 魔毯A站（运行中）
- 魔毯B站（运行中）
- 1号缆车（运行中）
- 2号缆车（运行中）
- 高级道缆车（运行中）

## 使用说明

### 雪道地图页面
1. 查看滑雪场整体布局
2. 鼠标悬停查看雪道/缆车详情
3. 右侧面板实时显示各缆车排队状态

### 雪道管理页面
1. 查看所有雪道的状态和客流量
2. 点击"开放"/"关闭"/"压雪"按钮切换雪道状态
3. 点击"+1客流"按钮增加该雪道客流量

### 排队管理页面
1. 查看所有缆车的排队情况和预计等待时间
2. 点击"更新排队"按钮录入最新排队人数
3. 点击"启动"/"停止"按钮切换缆车运行状态

### 报表统计页面
1. 选择日期查看当日客流量统计
2. 查看每小时客流量分布图
3. 对比各雪道客流量
4. 分析缆车排队高峰时段

## 特色功能

### 实时更新
- 前端每30秒自动刷新数据
- 支持 WebSocket 实时推送（预留接口）

### 智能等待时间计算
- 根据缆车运力和排队人数自动计算等待时间
- 超过10分钟显示黄色警告
- 超过15分钟显示红色警告

### 响应式设计
- 支持桌面端和移动端访问
- 自适应屏幕尺寸

## 未来扩展

- WebSocket 实时数据推送
- 微信小程序/APP 接口
- 更多数据分析图表
- 员工权限管理系统
- 历史数据导出功能
