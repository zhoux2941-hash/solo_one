# 在线答题竞赛系统

技术栈：Vue 3 + Spring Boot + WebSocket

## 功能特性

1. **主持人出题**：支持输入题目内容、4个选项、正确答案和倒计时（默认20秒）
2. **两队答题**：支持红队和蓝队同时在线答题
3. **实时更新**：每道题结束后实时更新两队总分，通过WebSocket广播
4. **MVP统计**：游戏结束后统计"最快答对"的MVP个人

## 项目结构

```
0508-181/
├── backend/              # 后端Spring Boot项目
│   ├── pom.xml          # Maven配置
│   └── src/main/
│       ├── java/com/quiz/
│       │   ├── QuizGameApplication.java      # 主应用类
│       │   ├── config/WebSocketConfig.java   # WebSocket配置
│       │   ├── controller/QuizController.java # 测试接口
│       │   ├── entity/                       # 实体类
│       │   │   ├── Answer.java
│       │   │   ├── Question.java
│       │   │   ├── Team.java
│       │   │   ├── TeamMember.java
│       │   │   └── WebSocketMessage.java
│       │   ├── service/QuizService.java      # 核心业务逻辑
│       │   └── websocket/QuizWebSocketHandler.java # WebSocket处理器
│       └── resources/application.yml         # 配置文件
└── frontend/             # 前端Vue项目
    └── index.html       # 单页应用（Vue 3 CDN）
```

## 启动方式

### 后端启动

1. 确保已安装JDK 1.8+和Maven
2. 进入backend目录：
   ```bash
   cd backend
   ```
3. 编译并启动：
   ```bash
   mvn clean package
   java -jar target/quiz-game-1.0.0.jar
   ```
   或者直接运行：
   ```bash
   mvn spring-boot:run
   ```
4. 后端服务将在 `http://localhost:8080` 启动

### 前端启动

1. 直接用浏览器打开 `frontend/index.html` 文件即可
2. 或者使用任何静态文件服务器，例如：
   ```bash
   cd frontend
   python -m http.server 8081
   ```
3. 然后访问 `http://localhost:8081`

## 使用说明

### 主持人操作

1. 打开页面，选择"主持人"身份
2. 输入题目内容、选项、正确答案和倒计时
3. 点击"发布题目"开始答题
4. 可以手动点击"结束本题"提前结束
5. 所有题目完成后点击"结束游戏"查看结果

### 选手操作

1. 打开页面，选择"参赛选手"身份
2. 输入姓名，选择队伍（红队或蓝队）
3. 点击"加入队伍"
4. 等待主持人出题
5. 看到题目后，点击选项提交答案

## WebSocket消息类型

| 消息类型 | 方向 | 说明 |
|---------|------|------|
| JOIN_TEAM | 前端→后端 | 选手加入队伍 |
| JOIN_SUCCESS | 后端→前端 | 加入成功 |
| HOST_QUESTION | 前端→后端 | 主持人发布题目 |
| NEW_QUESTION | 后端→前端 | 广播新题目 |
| SUBMIT_ANSWER | 前端→后端 | 选手提交答案 |
| SCORE_UPDATE | 后端→前端 | 分数更新广播 |
| QUESTION_END | 前端→后端 | 结束本题 |
| GAME_END | 前端→后端 | 结束游戏 |

## MVP评选规则

1. 优先比较答对题目数量，数量多者为MVP
2. 答对数量相同时，比较总响应时间，时间短者为MVP
