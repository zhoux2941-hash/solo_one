# 农场谷物筒仓温度监控系统

一个基于 Vue 3 + Spring Boot + Redis + MySQL 的实时温度分层热力图监控系统，支持异常高温报警功能。

## 项目结构

```
0508-33/
├── backend/          # Java Spring Boot 后端
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/farm/silo/
│           │   ├── SiloMonitorApplication.java
│           │   ├── config/
│           │   │   ├── RedisConfig.java
│           │   │   └── WebConfig.java
│           │   ├── controller/
│           │   │   ├── TemperatureController.java
│           │   │   └── AlarmController.java
│           │   ├── model/
│           │   │   ├── TemperatureData.java
│           │   │   └── AlarmHistory.java
│           │   ├── repository/
│           │   │   └── AlarmHistoryRepository.java
│           │   └── service/
│           │       ├── TemperatureService.java
│           │       └── AlarmService.java
│           └── resources/
│               └── application.yml
└── frontend/         # Vue 3 前端
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js
        ├── App.vue
        ├── style.css
        ├── api/
        │   └── temperature.js
        └── components/
            ├── TemperatureHeatmap.vue
            └── AlarmHistory.vue
```

## 功能特性

### 核心功能
- ✅ 4个筒仓（A~D）x 5层（底层~顶层）的温度矩阵展示
- ✅ 热力图可视化（颜色表示温度高低）
- ✅ 模拟传感器每30秒自动更新数据
- ✅ Redis 缓存温度数据
- ✅ 实时刷新按钮
- ✅ 后端健康状态监控
- ✅ 响应式设计，支持移动端
- ✅ 温度图例说明

### 新增高温报警功能
- 🔥 温度超过 30℃ 自动触发高温报警
- 📊 报警格子显示红色向上箭头（⬆️）动画
- 🔔 报警横幅实时显示当前报警数量
- 📋 历史报警记录表格（MySQL存储）
- 🔍 支持按筒仓筛选报警记录
- ✅ 报警确认功能（单条/全部确认）
- 📈 报警统计（总报警数/未确认数）

## 温度数据特性

- **底层**: 温度最低（约16℃）
- **第2层**: 温度略高（约19℃）
- **第3层**: 温度中等（约22℃）
- **第4层**: 温度较高（约25℃）
- **顶层**: 温度最高（约28℃）

每个温度点会有 ±1℃ 的随机波动。顶层有 30% 概率触发高温报警（>30℃）。

## 环境要求

### 后端
- JDK 17+
- Maven 3.6+
- Redis 6.0+
- MySQL 8.0+

### 前端
- Node.js 16+
- npm 8+

## 快速启动

### 前置准备

#### 1. 创建 MySQL 数据库

```sql
CREATE DATABASE farm_silo 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

数据库连接配置（默认）：
- 地址: `localhost:3306`
- 数据库: `farm_silo`
- 用户名: `root`
- 密码: `root`

如需修改，请编辑 `backend/src/main/resources/application.yml`

#### 2. 启动 Redis

确保 Redis 服务已在 `localhost:6379` 运行。

### Windows 一键启动

双击运行 `start.bat` 文件。

### 手动启动

#### 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端将在 `http://localhost:8080` 启动。

#### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将在 `http://localhost:5173` 启动。

## API 接口

### 温度接口

#### 获取当前温度数据

```
GET /api/temperature/current
```

响应示例：
```json
{
  "timestamp": "2024-05-09T10:30:00",
  "temperatureMatrix": [
    [28.5, 25.2, 22.1, 19.3, 16.8],
    [27.9, 24.8, 21.9, 18.7, 15.9],
    [28.2, 25.5, 22.3, 19.1, 16.5],
    [27.8, 24.9, 21.7, 18.9, 16.2]
  ],
  "siloNames": ["A", "B", "C", "D"],
  "layerNames": ["顶层", "第4层", "第3层", "第2层", "底层"]
}
```

#### 健康检查

```
GET /api/temperature/health
```

响应：`OK`

### 报警接口

#### 获取报警历史（支持分页和筛选）

```
GET /api/alarms/history?siloName=all&page=0&size=20
```

参数：
- `siloName`: 筒仓筛选（all/A/B/C/D）
- `page`: 页码（从0开始）
- `size`: 每页数量

响应示例：
```json
{
  "content": [
    {
      "id": 1,
      "alarmTime": "2024-05-09T10:30:00",
      "siloName": "A",
      "layerName": "顶层",
      "temperature": 31.5,
      "threshold": 30.0,
      "acknowledged": false
    }
  ],
  "totalElements": 5,
  "totalPages": 1,
  "currentPage": 0
}
```

#### 获取未确认报警

```
GET /api/alarms/unacknowledged
```

#### 获取报警统计

```
GET /api/alarms/stats
```

响应：
```json
{
  "totalAlarms": 10,
  "unacknowledgedCount": 3,
  "availableSilos": ["A", "B"]
}
```

#### 获取阈值

```
GET /api/alarms/threshold
```

响应：
```json
{
  "highTemperatureThreshold": 30.0
}
```

#### 确认单条报警

```
POST /api/alarms/{id}/acknowledge
```

#### 确认所有报警

```
POST /api/alarms/acknowledge-all
```

## 热力图颜色规则

| 温度范围 (℃) | 颜色 | 说明 |
|-------------|------|------|
| < 17 | 蓝色 | 低温 |
| 17-20 | 绿色 | 较低 |
| 20-23 | 黄色 | 适中 |
| 23-26 | 橙色 | 较高 |
| 26-29 | 深橙色 | 高温 |
| > 29 | 红色 | 过热 |
| > 30 | 红色 + ⬆️ | 高温报警 |

## 技术栈

### 后端
- Spring Boot 3.2
- Spring Data Redis
- Spring Data JPA
- MySQL Connector
- Jackson JSON
- 定时任务 @Scheduled

### 前端
- Vue 3 (Composition API)
- Vite 5
- Axios
- CSS3 Grid/Flexbox
- CSS 动画

## 架构说明

### 缓存策略
- 温度数据每 30 秒自动刷新
- 使用 Redis 缓存，TTL 35秒
- 定时任务主动更新缓存数据
- JSON 字符串序列化存储

### 报警策略
- 高温阈值: 30℃
- 顶层有 30% 概率触发报警（用于演示）
- 报警记录持久化到 MySQL
- 支持按筒仓分页查询
- 报警确认机制

## 数据库表结构

系统启动时自动创建 `alarm_history` 表：

```sql
CREATE TABLE alarm_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  alarm_time DATETIME NOT NULL,
  silo_name VARCHAR(10) NOT NULL,
  layer_name VARCHAR(20) NOT NULL,
  layer_index INT NOT NULL,
  silo_index INT NOT NULL,
  temperature DOUBLE NOT NULL,
  threshold DOUBLE NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at DATETIME,
  INDEX idx_alarm_time (alarm_time),
  INDEX idx_silo_name (silo_name)
);
```

## 开发说明

### 后端开发

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 前端开发

```bash
cd frontend
npm run dev
```

## 故障排查

### 后端连接不上 Redis
- 检查 Redis 是否启动：`redis-cli ping`
- 检查端口 6379 是否被占用
- 修改 `application.yml` 中的 Redis 配置

### 后端连接不上 MySQL
- 检查 MySQL 服务是否运行
- 检查数据库 `farm_silo` 是否已创建
- 检查用户名/密码配置是否正确
- 查看控制台错误信息

### 前端无法访问后端
- 检查后端是否在 8080 端口运行
- 检查浏览器控制台是否有 CORS 错误
- 前端已配置 Vite 代理，应该能正常访问

### 依赖安装失败
- 检查网络连接
- 尝试使用国内镜像源
- 清理 npm/maven 缓存后重试

### 没有报警记录
- 报警阈值为 30℃，需要顶层温度超过此值
- 顶层有 30% 概率触发报警
- 等待定时任务执行（30秒/次）或手动刷新
