# 共享单车运营平台

一个完整的共享单车运营管理平台，包含实时车辆监控、数据分析、需求预测和调度建议功能。

## 技术栈

### 后端
- Java 17
- Spring Boot 3.2
- MySQL 8.0
- Redis
- Smile 机器学习库（OLS线性回归）
- JPA + Hibernate

### 前端
- Vue 3
- Vite 5
- Leaflet 地图
- Chart.js 图表
- Axios

## 项目结构

```
bike-sharing-platform/
├── backend/                 # 后端 Spring Boot 项目
│   ├── src/main/java/
│   │   └── com/bikesharing/platform/
│   │       ├── config/     # 配置类（Redis, CORS）
│   │       ├── controller/ # REST API 控制器
│   │       ├── dto/        # 数据传输对象
│   │       ├── entity/     # JPA 实体类
│   │       ├── repository/ # 数据访问层
│   │       ├── scheduler/  # 定时任务
│   │       └── service/    # 业务逻辑层
│   ├── src/main/resources/
│   │   └── application.yml # 应用配置
│   └── pom.xml
├── database/                # 数据库脚本
│   ├── schema.sql         # 表结构
│   └── test-data.sql      # 测试数据（100个停车点+历史记录）
└── frontend/               # 前端 Vue 3 项目
    ├── src/
    │   ├── components/    # Vue 组件
    │   ├── App.vue        # 主应用
    │   └── main.js
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 核心功能

### 1. 实时车辆监控
- 100个停车点的实时状态（上海地区）
- Redis缓存实时车辆数（key: `bike:point:{pointId}`）
- 供需不平衡指数计算：
  - 车辆数/容量 > 80%：过饱和（绿色）
  - 车辆数/容量 < 20%：紧缺（红色）
  - 20%-80%：正常（黄色）

### 2. 数据分析
- 过去一周各时段借/还需求折线图
- 按小时统计借还次数

### 3. 需求预测
- 预测未来2小时每个停车点的借车/还车需求
- 使用历史同时间段平均值 + Smile OLS线性回归
- 每10分钟自动刷新预测缓存到Redis

### 4. 调度建议
- 自动匹配过饱和点和紧缺点
- 计算最优调度方案
- 显示距离、数量、详细原因

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/parking-points/status | 获取所有停车点实时状态 |
| GET | /api/analysis/hourly-demand | 获取过去一周每小时需求 |
| GET | /api/prediction/next-2h | 获取未来2小时预测 |
| GET | /api/prediction/refresh | 手动刷新预测 |
| GET | /api/dispatch/suggestions | 获取调度建议 |

## 快速开始

### 前置要求
- JDK 17+
- Node.js 16+
- MySQL 8.0
- Redis 6+

### 1. 启动数据库

```bash
# 登录 MySQL
mysql -u root -p

# 执行表结构脚本
source database/schema.sql

# 执行测试数据脚本（会生成100个停车点和2周历史记录）
source database/test-data.sql
```

### 2. 启动 Redis

```bash
# Windows
redis-server

# 或使用 Docker
docker run -p 6379:6379 redis
```

### 3. 启动后端

```bash
cd backend

# Maven 打包
mvn clean package -DskipTests

# 运行
java -jar target/platform-1.0.0.jar

# 或使用 Maven 直接运行
mvn spring-boot:run
```

后端默认端口：`http://localhost:8080`

### 4. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 开发模式运行
npm run dev
```

前端默认地址：`http://localhost:3000`

## 定时任务

- **预测刷新**：每10分钟执行一次（`PredictionScheduler.refreshPredictions`）
- **Redis同步**：每5分钟将Redis数据同步到数据库

## 配置说明

### 修改数据库连接

编辑 `backend/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/bike_sharing
    username: your_username
    password: your_password
  data:
    redis:
      host: localhost
      port: 6379
```

### 修改前端代理

编辑 `frontend/vite.config.js`：

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080', // 后端地址
      changeOrigin: true
    }
  }
}
```

## 供需指数说明

| 状态 | 使用率范围 | 颜色 | 说明 |
|------|-----------|------|------|
| 过饱和 | > 80% | 绿色 | 车辆富余，可调出 |
| 正常 | 20% - 80% | 黄色 | 供需平衡 |
| 紧缺 | < 20% | 红色 | 车辆不足，需调入 |

## 预测算法

预测值 = 历史同时间段平均值 × 70% + OLS回归预测 × 30%

- 历史数据：过去2周每小时的借还记录
- OLS模型：基于过去6小时的趋势预测
- 置信度：基于R²值计算（0.5-0.9）
