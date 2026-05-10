# 共享电单车电池衰减模拟器

基于 Vue 3 + Spring Boot 的电池衰减模拟器，支持多块电池的放电模拟。

## 项目结构

```
.
├── backend/          # Spring Boot 后端
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/battery/
│           │   ├── Application.java
│           │   ├── config/
│           │   │   ├── RedisConfig.java
│           │   │   └── CorsConfig.java
│           │   ├── controller/
│           │   │   └── BatteryController.java
│           │   ├── dto/
│           │   │   ├── BatteryResult.java
│           │   │   ├── SimulationRequest.java
│           │   │   └── SimulationResponse.java
│           │   ├── entity/
│           │   │   └── SimulationLog.java
│           │   ├── repository/
│           │   │   └── SimulationLogRepository.java
│           │   └── service/
│           │       ├── BatterySimulationService.java
│           │       └── SimulationHistoryService.java
│           └── resources/
│               └── application.properties
└── frontend/         # Vue 3 前端
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js
        ├── App.vue
        ├── style.css
        ├── api/
        │   └── battery.js
        └── components/
            ├── BatteryGauge.vue
            └── BatteryChart.vue
```

## 功能特性

- **4块电池模拟**：B1~B4，各有不同的个体差异化系数
- **放电模型**：
  - 基础放电率：每分钟 0.5%
  - 温度系数：温度低于 25℃ 时，每降低 10℃ 放电率增加 15%
  - 个体差异：B1(0.85)、B2(1.0)、B3(1.15)、B4(1.3)
- **可视化展示**：
  - 仪表盘（Gauge）展示每块电池剩余电量
  - 柱状图对比模拟前后电量
- **数据存储**：
  - Redis：存储最近 10 次模拟（24小时过期）
  - MySQL：记录所有模拟日志（可选）

## 环境要求

- JDK 8+
- Maven 3.6+
- Node.js 16+
- Redis 5+
- MySQL 5.7+（可选）

## 启动步骤

### 1. 启动 Redis

```bash
# Windows
redis-server

# 或使用 Docker
docker run -d -p 6379:6379 --name redis redis
```

### 2. 启动 MySQL（可选）

如果不需要 MySQL 日志功能，可以跳过此步。

```sql
CREATE DATABASE battery_sim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

修改 `backend/src/main/resources/application.properties` 中的数据库连接信息。

### 3. 启动后端

```bash
cd backend

# 打包
mvn clean package -DskipTests

# 运行
java -jar target/battery-simulator-1.0.0.jar

# 或直接使用 Maven 运行
mvn spring-boot:run
```

后端端口：http://localhost:8080

### 4. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端端口：http://localhost:3000

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/battery/simulate | 执行电池模拟 |
| GET | /api/battery/history | 获取最近10次模拟历史 |
| DELETE | /api/battery/history | 清空模拟历史 |
| GET | /api/battery/logs | 获取 MySQL 日志（前50条） |

### 模拟接口请求示例

```json
POST /api/battery/simulate

{
  "rideTime": 30,
  "temperature": 15
}
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "simulationId": "abc123...",
    "timestamp": 1234567890,
    "rideTime": 30,
    "temperature": 15,
    "batteryResults": [
      {
        "batteryId": "B1",
        "initialBattery": 100,
        "remainingBattery": 86,
        "dischargeRate": 0.4675,
        "differentialCoefficient": 0.85
      },
      ...
    ]
  }
}
```

## 技术栈

**后端**：
- Spring Boot 2.7
- Spring Data Redis
- Spring Data JPA
- MySQL 8.0
- Lombok

**前端**：
- Vue 3 (Composition API)
- Vite 4
- ECharts 5
- Axios

## 注意事项

1. 如果 Redis 未启动，后端可以正常运行，但历史记录功能将不可用
2. 如果 MySQL 未配置，日志记录功能将跳过（不会报错）
3. 首次访问页面时，4块电池都显示 100% 电量
4. 历史记录最多保存 10 条，超过后自动淘汰最旧的记录