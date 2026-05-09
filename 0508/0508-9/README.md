# 在线考试系统 - 作弊行为监控与分析

一个功能完整的在线考试系统，重点实现了作弊行为的实时监控与分析功能。

## 项目架构

```
online-exam/
├── backend/                    # Java Spring Boot 后端
│   ├── src/main/java/com/exam/
│   │   ├── config/            # 配置类
│   │   │   ├── RedisConfig.java
│   │   │   └── WebSocketConfig.java
│   │   ├── controller/        # 控制器
│   │   │   ├── CheatController.java
│   │   │   ├── ExamController.java
│   │   │   └── UserController.java
│   │   ├── dto/               # 数据传输对象
│   │   │   ├── ApiResponse.java
│   │   │   └── CheatLogDTO.java
│   │   ├── entity/            # 实体类
│   │   │   ├── CheatLog.java
│   │   │   ├── Exam.java
│   │   │   ├── Question.java
│   │   │   └── User.java
│   │   ├── repository/        # 数据访问层
│   │   │   ├── CheatLogRepository.java
│   │   │   ├── ExamRepository.java
│   │   │   ├── QuestionRepository.java
│   │   │   └── UserRepository.java
│   │   ├── service/           # 业务逻辑层
│   │   │   └── CheatService.java
│   │   ├── websocket/         # WebSocket
│   │   │   └── CheatWebSocketHandler.java
│   │   └── OnlineExamApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml    # 应用配置
│   │   └── schema.sql         # 数据库初始化脚本
│   └── pom.xml
├── frontend/                   # Vue 3 前端
│   ├── src/
│   │   ├── components/        # 组件
│   │   │   ├── HeatMapChart.vue
│   │   │   ├── TrendChart.vue
│   │   │   └── RankingChart.vue
│   │   ├── composables/       # 组合式函数
│   │   │   └── useCheatMonitor.js
│   │   ├── router/            # 路由
│   │   │   └── index.js
│   │   ├── stores/            # Pinia 状态管理
│   │   │   └── user.js
│   │   ├── styles/            # 样式
│   │   │   └── global.css
│   │   ├── utils/             # 工具函数
│   │   │   └── axios.js
│   │   ├── views/             # 页面
│   │   │   ├── Login.vue
│   │   │   ├── student/
│   │   │   │   ├── ExamList.vue
│   │   │   │   └── ExamPage.vue
│   │   │   └── teacher/
│   │   │       ├── ExamManagement.vue
│   │   │       ├── CreateExam.vue
│   │   │       ├── QuestionManagement.vue
│   │   │       ├── MonitorPanel.vue
│   │   │       └── ExamReport.vue
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 核心功能

### 1. 作弊行为监控（学生端）

监控的异常行为类型：
- **切出窗口** (`VISIBILITY_CHANGE`): 监听 `visibilitychange` 事件，检测用户切换标签页或最小化窗口
- **鼠标离开考试区域** (`MOUSE_LEAVE`): 监听 `mouseleave` 事件，检测鼠标移出浏览器窗口
- **复制操作** (`COPY`): 监听 `copy` 事件，禁用并记录复制行为
- **粘贴操作** (`PASTE`): 监听 `paste` 事件，禁用并记录粘贴行为
- **右键菜单** (`RIGHT_CLICK`): 监听 `contextmenu` 事件，禁用右键菜单
- **可疑快捷键** (`KEYBOARD_SHORTCUT`): 监听 `keydown` 事件，禁用 Ctrl+C/V/X/A/P 及 F12 等

### 2. 实时数据传输

- 前端通过 WebSocket 连接 `/ws/cheat` 端点
- 每次检测到异常行为，立即通过 WebSocket 发送作弊日志
- 日志格式：
```json
{
  "user_id": 1,
  "exam_id": 100,
  "question_id": 50,
  "action_type": "VISIBILITY_CHANGE",
  "timestamp": "2026-05-09T10:30:00"
}
```

### 3. 数据存储

**MySQL 存储** (`cheat_logs` 表):
- 持久化存储所有作弊日志
- 支持按考试、用户、时间范围查询

**Redis 存储**:
- Key: `cheat:exam:{examId}:user:{userId}` - 学生总作弊次数
- Key: `cheat:exam:{examId}:user:{userId}:type:{actionType}` - 各类型作弊次数
- 使用 `INCR` 命令原子递增计数

### 4. 作弊分析报告

**作弊热力图**:
- X轴：题目序号（第1题、第2题...）
- Y轴：作弊类型（切出窗口、鼠标离开、复制、粘贴、右键菜单、快捷键）
- 颜色深浅：表示该类型作弊在该题目上发生的频次

**全班作弊趋势折线图**:
- X轴：时间轴（按分钟分组）
- Y轴：作弊事件数量
- 展示考试过程中作弊事件的密度变化

**高风险学生排行榜**:
- 基于作弊总次数和类型权重计算风险分数
- 权重配置：
  - 切出窗口: 3分
  - 鼠标离开: 2分
  - 复制: 5分
  - 粘贴: 5分
  - 右键菜单: 4分
  - 快捷键: 3分

## 技术栈

### 后端
- **Java 17**
- **Spring Boot 3.2.5**
- **Spring Data JPA** - ORM 框架
- **Spring WebSocket** - 实时通信
- **Spring Data Redis** - Redis 操作
- **MySQL 8.0** - 关系数据库
- **Redis** - 缓存和计数
- **Lombok** - 简化代码
- **FastJSON2** - JSON 处理

### 前端
- **Vue 3** - 前端框架
- **Vue Router 4** - 路由
- **Pinia** - 状态管理
- **Axios** - HTTP 客户端
- **ECharts 5** - 图表库
- **Vite** - 构建工具

## 快速开始

### 环境要求
- JDK 17+
- Node.js 18+
- MySQL 8.0
- Redis 6.0+

### 数据库初始化

1. 创建数据库并执行初始化脚本：

```sql
-- 在 MySQL 中执行 backend/src/main/resources/schema.sql
```

脚本会创建以下表：
- `users` - 用户表（预置测试账号）
- `exams` - 考试表
- `questions` - 题目表
- `cheat_logs` - 作弊日志表

预置测试账号：
- 教师: `teacher1` / `123456` (张老师)
- 教师: `teacher2` / `123456` (李老师)
- 学生: `student1` / `123456` (王学生)
- 学生: `student2` / `123456` (赵学生)
- 学生: `student3` / `123456` (刘学生)
- 学生: `student4` / `123456` (陈学生)

### 配置后端

修改 `backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/exam_system
    username: root
    password: your_password
  
  data:
    redis:
      host: localhost
      port: 6379
```

### 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端服务运行在 `http://localhost:8080`

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务运行在 `http://localhost:5173`

## API 接口

### 作弊相关接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/cheat/log` | 记录作弊日志（HTTP方式） |
| GET | `/api/cheat/statistics/{examId}` | 获取考试作弊统计 |
| GET | `/api/cheat/heatmap/{examId}/{userId}` | 获取学生作弊热力图数据 |
| GET | `/api/cheat/trend/{examId}` | 获取作弊趋势数据 |
| GET | `/api/cheat/risk/{examId}` | 获取高风险学生排行榜 |
| GET | `/api/cheat/realtime/{examId}` | 获取实时作弊日志 |
| GET | `/api/cheat/count/{examId}/{userId}` | 从Redis获取作弊计数 |

### 考试相关接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/exam/list` | 获取考试列表 |
| POST | `/api/exam/create` | 创建考试 |
| GET | `/api/exam/{examId}` | 获取考试详情 |
| PUT | `/api/exam/{examId}` | 更新考试 |
| GET | `/api/exam/{examId}/questions` | 获取考试题目 |
| POST | `/api/exam/{examId}/questions` | 添加题目 |
| POST | `/api/exam/{examId}/questions/batch` | 批量添加题目 |
| PUT | `/api/exam/{examId}/status` | 更新考试状态 |

### WebSocket 接口

- 连接地址: `ws://localhost:8080/ws/cheat`

**学生端消息类型**:

```json
// 注册
{
  "type": "register",
  "role": "STUDENT",
  "userId": 1
}

// 发送作弊日志
{
  "type": "cheat",
  "data": {
    "userId": 1,
    "examId": 100,
    "questionId": 50,
    "actionType": "VISIBILITY_CHANGE",
    "actionDetail": "用户切换窗口",
    "timestamp": "2026-05-09T10:30:00"
  }
}
```

**教师端消息类型**:

```json
// 注册
{
  "type": "register",
  "role": "TEACHER"
}

// 订阅考试监控
{
  "type": "subscribe",
  "examId": 100
}

// 接收实时作弊事件
{
  "type": "cheat",
  "data": { ... }
}
```

## 使用流程

### 教师端
1. 登录教师账号
2. 进入「考试管理」→「创建考试」
3. 添加题目（支持单选题、多选题）
4. 点击「开始考试」将考试状态设为 ACTIVE
5. 进入「考试监控」选择要监控的考试
6. 实时查看学生作弊行为
7. 考试结束后查看「考试报告」

### 学生端
1. 登录学生账号
2. 进入「我的考试」查看可参加的考试
3. 点击「开始考试」进入考试页面
4. 作答期间系统会自动监控异常行为
5. 完成后提交试卷

## 注意事项

1. 作弊监控仅作为辅助工具，不能完全替代人工监考
2. 建议在正式考试前进行测试，确保监控功能正常
3. 系统会禁用复制粘贴等功能，可能影响正常的文本编辑
4. WebSocket 断线后会自动重连，但断线期间的日志可能丢失

## License

MIT License
