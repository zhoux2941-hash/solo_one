# 鲜花保鲜剂配方对比工具

一个全栈应用，用于对比三种鲜花保鲜剂配方（A、B、C）的保鲜效果。

## 技术栈

### 后端
- **框架**: Spring Boot 2.7.18
- **数据库**: MySQL 8.0+
- **缓存**: Redis
- **ORM**: Spring Data JPA
- **构建工具**: Maven
- **Java**: 17

### 前端
- **框架**: Vue 3 (Composition API)
- **UI组件库**: Element Plus
- **图表库**: Chart.js + vue-chartjs (雷达图)
- **HTTP客户端**: Axios
- **构建工具**: Vite

## 项目结构

```
0508-55/
├── backend/                    # 后端项目
│   ├── src/
│   │   └── main/
│   │       ├── java/com/flower/preservative/
│   │       │   ├── FlowerPreservativeApplication.java    # 主启动类
│   │       │   ├── config/                                # 配置类
│   │       │   │   ├── RedisConfig.java
│   │       │   │   └── WebConfig.java
│   │       │   ├── controller/                            # 控制器
│   │       │   │   └── FlowerPreservativeController.java
│   │       │   ├── dto/                                   # 数据传输对象
│   │       │   │   ├── FormulaComparisonDTO.java
│   │       │   │   ├── FormulaRecommendationDTO.java
│   │       │   │   └── SimulationResultDTO.java
│   │       │   ├── entity/                                # 实体类
│   │       │   │   ├── Flower.java
│   │       │   │   ├── FlowerFormulaMapping.java
│   │       │   │   └── Formula.java
│   │       │   ├── repository/                            # 数据访问层
│   │       │   │   ├── FlowerFormulaMappingRepository.java
│   │       │   │   ├── FlowerRepository.java
│   │       │   │   └── FormulaRepository.java
│   │       │   └── service/                               # 业务逻辑层
│   │       │       └── FlowerPreservativeService.java
│   │       └── resources/
│   │           ├── application.yml                         # 应用配置
│   │           └── data.sql                                # 数据库初始化脚本
│   └── pom.xml                                             # Maven配置
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── api/
│   │   │   └── flowerService.js                            # API服务
│   │   ├── components/
│   │   │   ├── FormulaRadarChart.vue                       # 雷达图组件
│   │   │   ├── RecommendationCard.vue                      # 推荐卡片组件
│   │   │   └── SimulationProgress.vue                      # 模拟进度条组件
│   │   ├── App.vue                                         # 主应用组件
│   │   └── main.js                                         # 入口文件
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 功能特性

1. **配方推荐**: 根据鲜花类型智能推荐最适合的保鲜剂配方
2. **雷达图对比**: 可视化对比三种配方在保鲜天数、成本、易用性三个维度的表现
3. **模拟实验**: 输入实验天数，模拟不同配方下鲜花的枯萎程度
4. **Redis缓存**: 模拟结果自动缓存24小时，提升响应速度
5. **预设数据**: 内置8种常见鲜花（玫瑰、百合、康乃馨等）的推荐规则

## 预设配方

| 配方 | 名称 | 特点 | 保鲜天数 | 成本(1-5) | 易用性(1-5) |
|------|------|------|----------|-----------|-------------|
| A | 营养型配方 | 提供充足营养 | 14 | 3 | 4 |
| B | 抗菌型配方 | 防止水质恶化 | 12 | 4 | 5 |
| C | 平衡型配方 | 性价比高 | 10 | 2 | 3 |

## 预设推荐规则

| 鲜花类型 | 推荐配方 | 寿命延长(天) |
|----------|----------|--------------|
| 玫瑰 | B | 15 |
| 百合 | A | 18 |
| 康乃馨 | C | 20 |
| 菊花 | C | 18 |
| 郁金香 | B | 14 |
| 向日葵 | A | 16 |
| 满天星 | C | 28 |
| 洋桔梗 | B | 17 |

## 快速开始

### 环境要求

- JDK 17+
- MySQL 8.0+
- Redis 6.0+
- Node.js 16+
- Maven 3.6+

### 1. 启动数据库服务

确保MySQL和Redis服务正在运行。

### 2. 初始化数据库

在MySQL中执行 `backend/src/main/resources/data.sql` 脚本，或者让JPA自动创建表结构后手动插入数据。

```sql
-- 连接MySQL后执行
source backend/src/main/resources/data.sql;
```

### 3. 配置后端

检查并修改 `backend/src/main/resources/application.yml` 中的数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/flower_preservative?...
    username: root
    password: 123456  # 修改为你的密码
  
  redis:
    host: localhost
    port: 6379
```

### 4. 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动。

### 5. 安装前端依赖并启动

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

### 6. 访问应用

打开浏览器访问 `http://localhost:3000`

## API接口文档

### 获取所有鲜花类型

```
GET /api/flower-types
```

### 获取所有配方

```
GET /api/formulas
```

### 获取配方推荐

```
GET /api/recommendations?flowerType=玫瑰
```

### 运行模拟实验

```
GET /api/simulate?flowerType=玫瑰&experimentDays=7
```

## 核心算法

### 枯萎程度模拟算法

```
基础规则：
- 实验天数 ≤ 0: 枯萎率 = 0% (新鲜)
- 实验天数 ≤ 有效天数 × 50%: 枯萎率线性增加到15%
- 实验天数 ≤ 有效天数: 枯萎率从15%线性增加到80%
- 实验天数 > 有效天数: 每超1天增加5%，最多100%

状态判定：
- < 20%: 新鲜
- 20% ~ 49%: 良好
- 50% ~ 79%: 逐渐枯萎
- ≥ 80%: 枯萎严重
```

### 雷达图归一化

```
保鲜天数: (实际值 / 20) × 100 (上限100)
成本: 100 - (实际值 / 5) × 100 (值越低越好，反向处理)
易用性: (实际值 / 5) × 100
```

## 注意事项

1. 如果Redis不可用，应用仍可正常运行，只是没有缓存功能
2. 数据库密码和Redis配置请根据实际环境修改
3. 模拟实验天数限制在0-60天之间
4. 前端使用Vite代理 `/api` 路径到后端，避免跨域问题

## 许可证

仅供学习和参考使用。
