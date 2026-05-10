# 奶茶店小料搭配评分预测器 - 启动指南

## 前置环境
- Java 11+
- Maven 3.6+
- Node.js 16+
- MySQL 5.7+ / 8.0+
- Redis 5.0+

## 快速启动步骤

### 1. 初始化数据库
```bash
# 进入 MySQL
mysql -u root -p

# 执行初始化脚本
source e:/trae-project/0508-59/database/init.sql
```

或使用 MySQL 客户端直接执行 `database/init.sql` 文件。

### 2. 配置数据库连接
修改 `backend/src/main/resources/application.yml`：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/milk_tea?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root      # 修改为你的 MySQL 用户名
    password: root      # 修改为你的 MySQL 密码
  redis:
    host: localhost
    port: 6379
    password:           # 如有 Redis 密码请填写
    database: 0
```

### 3. 启动后端服务
```bash
cd e:/trae-project/0508-59/backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动。

### 4. 启动前端服务
```bash
cd e:/trae-project/0508-59/frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

### 5. 访问应用
打开浏览器访问：`http://localhost:3000`

## 功能说明

### 评分预测规则
评分基于以下因素计算：
1. **茶底基础分**：乌龙(8.0) > 红茶(7.5) > 绿茶(7.0)
2. **小料基础分**：珍珠(8.5) = 爆珠(8.5) > 布丁(8.0) > 仙草(7.5) > 椰果(7.0)
3. **茶底+小料协同**：
   - 红茶+珍珠、红茶+布丁、红茶+仙草
   - 绿茶+椰果、绿茶+爆珠
   - 乌龙+布丁、乌龙+仙草、乌龙+珍珠
4. **小料组合加成**：珍珠+布丁、仙草+布丁、椰果+爆珠等
5. **数量优化**：1-3种小料最佳，超过会扣分

### 热门搭配（预定义高分组合）
1. 乌龙 + 珍珠 + 布丁（9.5分）
2. 红茶 + 珍珠 + 布丁（9.3分）
3. 绿茶 + 椰果 + 爆珠（9.0分）
4. 乌龙 + 仙草 + 布丁（8.8分）
5. 红茶 + 珍珠（8.5分）

### 接口说明
- `POST /api/predict` - 预测评分并返回推荐
- `GET /api/tea-bases` - 获取所有茶底
- `GET /api/toppings` - 获取所有小料
- `GET /api/records?limit=10` - 获取最近预测记录

## 项目结构
```
milk-tea-predictor/
├── backend/                          # Java 后端
│   ├── pom.xml                       # Maven 配置
│   └── src/main/
│       ├── java/com/milktea/predictor/
│       │   ├── PredictorApplication.java
│       │   ├── common/
│       │   │   └── Result.java
│       │   ├── config/
│       │   │   ├── CorsConfig.java
│       │   │   └── RedisConfig.java
│       │   ├── controller/
│       │   │   └── PredictController.java
│       │   ├── dto/
│       │   │   ├── PredictRequest.java
│       │   │   ├── PredictResponse.java
│       │   │   └── RecommendedCombination.java
│       │   ├── entity/
│       │   │   ├── RatingRecord.java
│       │   │   ├── TeaBase.java
│       │   │   └── Topping.java
│       │   ├── mapper/
│       │   │   ├── RatingRecordMapper.java
│       │   │   ├── TeaBaseMapper.java
│       │   │   └── ToppingMapper.java
│       │   └── service/
│       │       ├── PredictService.java
│       │       └── impl/
│       │           └── PredictServiceImpl.java
│       └── resources/
│           └── application.yml
├── frontend/                         # Vue 3 前端
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── App.vue
│       └── api/
│           └── index.js
├── database/
│   └── init.sql                      # 数据库初始化脚本
└── README.md
```

## 注意事项
1. MySQL 和 Redis 必须先启动
2. 如无 Redis，后端会自动降级到默认热门数据，不会报错
3. 预测记录会自动存入数据库
4. 热门搭配会缓存到 Redis，1小时过期
