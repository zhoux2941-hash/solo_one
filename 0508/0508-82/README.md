# 知识竞赛团队抢答系统

一个功能完整的知识竞赛团队抢答系统，支持多队伍实时抢答、主持人控制、题库管理和成绩统计。

## 技术栈

### 后端
- **Spring Boot 3.2.0** - Java后端框架
- **Spring Security + JWT** - 用户认证和授权
- **Spring Data JPA** - ORM框架
- **MySQL 8.0+** - 关系型数据库，存储题库和成绩
- **Redis** - 分布式锁和实时排名
- **WebSocket (STOMP)** - 实时消息推送
- **Apache POI** - Excel题库导入

### 前端
- **Vue 3** - 前端框架
- **Vite** - 构建工具
- **Vue Router** - 路由管理
- **Pinia** - 状态管理
- **Element Plus** - UI组件库
- **Axios** - HTTP客户端
- **SockJS + STOMP.js** - WebSocket客户端

## 功能特性

### 1. 竞赛管理
- 创建竞赛：可设定题库范围、题目数量、队伍数量（2-4支）
- 自定义队伍名称
- 竞赛状态管理（已创建/进行中/已结束）

### 2. 主持人功能
- 特殊主持人账号（默认：host / host123456）
- 开始/结束竞赛
- 按题库分类随机抽题
- 显示题目（题干和选项）
- 判定答题对错并加分
- 实时查看各队分数

### 3. 队伍抢答功能
- 各队伍通过设备点击抢答按钮
- Redis分布式锁确保只有最先抢答的队伍获得答题权
- 10秒答题时限
- 实时显示抢答状态

### 4. 实时交互
- WebSocket实时推送分数和状态
- 所有队伍可见题目和抢答状态
- 实时倒计时显示

### 5. 题库管理
- 题目分类管理
- 单题添加
- Excel批量导入
- 支持简单/中等/困难三种难度
- 自定义题目分值

### 6. 成绩统计
- 竞赛结束后自动生成成绩表
- 各队答题统计（正确数/错误数/正确率）
- 最终排名展示

## 项目结构

```
0508-82/
├── backend/                    # Spring Boot后端
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/quiz/
│   │   │   │   ├── config/          # 配置类
│   │   │   │   │   ├── DataInitializer.java
│   │   │   │   │   ├── RedisConfig.java
│   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   └── WebSocketConfig.java
│   │   │   │   ├── controller/      # 控制器
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   ├── CompetitionController.java
│   │   │   │   │   ├── HostController.java
│   │   │   │   │   └── QuestionController.java
│   │   │   │   ├── dto/             # 数据传输对象
│   │   │   │   ├── entity/          # JPA实体
│   │   │   │   ├── repository/      # 数据访问层
│   │   │   │   ├── security/        # 安全相关
│   │   │   │   └── service/         # 业务逻辑层
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/init.sql
│   └── pom.xml
│
└── frontend/                   # Vue3前端
    ├── src/
    │   ├── api/                 # API接口封装
    │   ├── router/              # 路由配置
    │   ├── stores/              # Pinia状态管理
    │   ├── styles/              # 全局样式
    │   ├── utils/               # 工具函数（WebSocket）
    │   └── views/               # 页面组件
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 快速开始

### 环境要求
- JDK 17+
- Node.js 16+
- MySQL 8.0+
- Redis 6.0+

### 1. 启动数据库

#### MySQL
```sql
-- 创建数据库
CREATE DATABASE quiz_competition DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 执行初始化脚本（backend/src/main/resources/db/init.sql）
```

#### Redis
确保Redis服务正在运行（默认端口6379）

### 2. 配置后端

修改 `backend/src/main/resources/application.yml`：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/quiz_competition
    username: root
    password: your_password
  
  redis:
    host: localhost
    port: 6379
```

### 3. 启动后端

```bash
cd backend

# 使用Maven运行
mvn spring-boot:run

# 或打包后运行
mvn clean package
java -jar target/quiz-competition-1.0.0.jar
```

后端服务将在 http://localhost:8080 启动

### 4. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

前端开发服务器将在 http://localhost:3000 启动

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 主持人 | host | host123456 |

普通用户可通过注册页面自行注册

## 使用流程

### 1. 准备题库
1. 主持人登录系统
2. 进入"题库管理"页面
3. 创建题目分类
4. 添加题目（单题添加或Excel导入）

### 2. Excel题库导入格式

Excel文件需包含以下列（从第1行开始）：

| 列号 | 列名 | 必填 | 说明 |
|------|------|------|------|
| A | 题目内容 | 是 | 问题描述 |
| B | 选项A | 是 | 选项A内容 |
| C | 选项B | 是 | 选项B内容 |
| D | 选项C | 是 | 选项C内容 |
| E | 选项D | 是 | 选项D内容 |
| F | 正确答案 | 是 | A/B/C/D |
| G | 难度 | 否 | EASY/MEDIUM/HARD（默认MEDIUM） |
| H | 分值 | 否 | 数字（默认10） |

### 3. 创建竞赛
1. 主持人进入"竞赛管理"页面
2. 点击"创建竞赛"
3. 填写竞赛信息：
   - 竞赛名称
   - 题目分类（可多选）
   - 题目数量
   - 队伍数量（2-4支）
   - 队伍名称

### 4. 开始竞赛
1. 主持人进入"主持面板"
2. 选择要开始的竞赛
3. 点击"开始竞赛"
4. 系统自动从题库随机抽题
5. 点击"显示第一题"开始第一轮

### 5. 抢答流程
1. 题目显示后，各队看到抢答按钮
2. 队伍点击抢答按钮
3. 系统通过Redis分布式锁确保只有一队抢到
4. 抢到的队伍有10秒时间答题
5. 主持人判定对错并加分
6. 点击"下一题"继续

### 6. 竞赛结束
- 所有题目答完后自动结束
- 生成最终排名和成绩统计

## 核心技术实现

### Redis分布式锁
```java
// 使用Lua脚本保证原子性
String script = "if redis.call('get', KEYS[1]) == ARGV[1] then " +
                "return redis.call('del', KEYS[1]) " +
                "else " +
                "return 0 " +
                "end";
```

### WebSocket消息类型
- `COMPETITION_STARTED` - 竞赛开始
- `QUESTION_DISPLAYED` - 显示新题目
- `BUZZER_WON` - 有人抢到答题权
- `ANSWER_TIMER_STARTED` - 开始答题计时
- `ANSWER_SUBMITTED` - 提交答案
- `ANSWER_JUDGED` - 判定结果
- `COMPETITION_FINISHED` - 竞赛结束

### 安全性
- JWT Token认证
- BCrypt密码加密
- 主持人专属API权限控制
- CORS配置

## API接口

### 认证接口
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/me` - 获取当前用户

### 题目管理
- `GET/POST /api/questions/categories` - 分类管理
- `GET/POST /api/questions` - 题目管理
- `POST /api/questions/import` - Excel导入（主持人）

### 竞赛管理
- `GET/POST /api/competitions` - 竞赛管理
- `GET /api/competitions/{id}/teams` - 获取队伍
- `GET /api/competitions/{id}/current-question` - 当前题目
- `GET /api/competitions/{id}/buzzer-status` - 抢答状态
- `POST /api/competitions/{id}/buzz` - 抢答
- `POST /api/competitions/submit-answer` - 提交答案
- `GET /api/competitions/{id}/statistics` - 成绩统计

### 主持人接口
- `POST /api/host/competitions/{id}/start` - 开始竞赛
- `POST /api/host/competitions/{id}/next-question` - 下一题
- `POST /api/host/competitions/judge` - 判定答案
- `POST /api/host/competitions/{id}/finish` - 结束竞赛

## 注意事项

1. **Redis必须运行**：抢答功能依赖Redis分布式锁
2. **数据库字符集**：建议使用utf8mb4支持中文和emoji
3. **JWT密钥**：生产环境请修改`app.jwt.secret`
4. **主持人账号**：首次启动自动创建，可在配置中修改
5. **WebSocket连接**：确保网络环境支持WebSocket

## 开发建议

- 使用浏览器多标签页测试多队伍抢答
- 主持人和参赛队员使用不同浏览器或隐身窗口
- 可通过Redis客户端监控锁状态
- 查看后端日志了解竞赛流程

## License

MIT License
