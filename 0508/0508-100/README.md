# 食堂剩菜回收量趋势预测系统

## 项目概述
这是一个基于 Vue 3 + Spring Boot 的食堂剩菜回收量趋势预测系统，采用简单指数平滑算法进行预测，并支持实时调整平滑系数。

## 技术栈
- **前端**: Vue 3 + Vite + ECharts + Axios
- **后端**: Spring Boot 2.7 + Spring Data JPA + Spring Cache
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **算法**: 简单指数平滑（Simple Exponential Smoothing）

## 项目结构
```
0508-100/
├── canteen-backend/          # Spring Boot 后端
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/canteen/
│       │   ├── CanteenApplication.java
│       │   ├── config/
│       │   │   ├── CorsConfig.java
│       │   │   └── RedisConfig.java
│       │   ├── controller/
│       │   │   └── FoodWasteController.java
│       │   ├── dto/
│       │   │   ├── DailySummaryDTO.java
│       │   │   └── PredictionDTO.java
│       │   ├── entity/
│       │   │   └── FoodWaste.java
│       │   ├── repository/
│       │   │   └── FoodWasteRepository.java
│       │   └── service/
│       │       ├── FoodWasteService.java
│       │       └── PredictionService.java
│       └── resources/
│           └── application.yml
├── canteen-frontend/         # Vue 3 前端
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── style.css
│       └── api/
│           └── api.js
└── database/
    └── init.sql              # MySQL 初始化脚本
```

## 功能特性
1. **历史数据展示**: 展示过去30天的午餐、晚餐、总计回收量曲线
2. **预测功能**: 基于简单指数平滑算法预测未来3天的回收量
3. **实时调整**: 可通过滑动条调整平滑系数(α)，实时更新预测结果
4. **周末效应**: Mock数据包含周末效应（周末剩菜量减少约55%）
5. **Redis缓存**: 预测结果自动缓存1分钟

## 算法说明
**简单指数平滑公式**:
```
F(t+1) = α * A(t) + (1-α) * F(t)
```
其中:
- F(t+1): 下一期预测值
- A(t): 当前期实际值
- F(t): 当前期预测值
- α: 平滑系数 (0 < α < 1)

**α 值选择**:
- α 接近 1: 更关注近期数据，对变化敏感
- α 接近 0: 更关注历史数据，预测更平滑

## 运行步骤

### 前置要求
- JDK 11+
- Maven 3.6+
- Node.js 16+
- MySQL 8.0
- Redis

### 1. 数据库初始化
```bash
# 在 MySQL 中执行初始化脚本
mysql -u root -p < database/init.sql
```

### 2. 启动后端
```bash
cd canteen-backend

# 确保 MySQL 和 Redis 已启动
# 修改 application.yml 中的数据库密码（如需要）

# 启动 Spring Boot
mvn spring-boot:run
```

后端启动后访问: http://localhost:8080

API 接口:
- `GET /api/historical?days=30` - 获取历史数据
- `GET /api/prediction?alpha=0.3&days=3` - 获取预测数据

### 3. 启动前端
```bash
cd canteen-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端启动后访问: http://localhost:5173

## API 文档

### GET /api/historical
获取历史数据

**参数**:
- `days` (可选, 默认30): 数据天数

**返回示例**:
```json
[
  {
    "date": "2026-05-09",
    "lunch": 13.20,
    "dinner": 9.60,
    "total": 22.80
  }
]
```

### GET /api/prediction
获取预测数据

**参数**:
- `alpha` (可选, 默认0.3): 平滑系数 (0.01-0.99)
- `days` (可选, 默认3): 预测天数

**返回示例**:
```json
{
  "historical": [...],
  "predictions": [
    {
      "date": "2026-05-10",
      "lunch": 6.85,
      "dinner": 4.98,
      "total": 11.83
    }
  ],
  "alpha": 0.3
}
```

## 数据特点
Mock数据包含以下规律：
- 工作日（周一至周五）剩菜量较高（午餐约13-15kg，晚餐约10-12kg）
- 周末（周六、周日）剩菜量较低（午餐约5-7kg，晚餐约3-5kg）
- 总计呈现明显的7天周期波动

## 注意事项
1. 确保 MySQL 和 Redis 服务已启动
2. 如修改数据库密码，请同步修改 `application.yml`
3. 首次运行后端会自动创建数据库表（无需手动建表）
4. 预测结果已包含周末效应调整
