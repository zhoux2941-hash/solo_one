# 图书漂流系统

一个基于 Spring Boot + 原生 HTML/JS 的图书漂流共享平台，适用于社区或学校使用。

## 功能特性

### 用户模块
- 用户注册、登录
- 个人信息管理

### 图书管理
- 发布闲置图书
- 查看可漂流图书列表
- 查看个人发布的图书

### 漂流申请
- 申请借阅图书
- 图书主人确认/拒绝申请
- 确认图书归还

### 阅读打卡
- 每日阅读打卡，记录阅读页数
- 查看打卡历史
- 自动计算阅读进度

### 热门排行
- 根据打卡次数生成热门图书排行榜
- 展示平均阅读进度

## 技术栈

### 后端
- Spring Boot 2.7.x
- Spring Data JPA
- H2 内存数据库

### 前端
- 原生 HTML5
- 原生 CSS3
- 原生 JavaScript (ES6+)

## 项目结构

```
book-drift-system/
├── src/
│   └── main/
│       ├── java/com/bookdrift/
│       │   ├── BookDriftApplication.java    # 启动类
│       │   ├── config/
│       │   │   └── WebConfig.java           # 跨域配置
│       │   ├── controller/                   # REST API 控制器
│       │   │   ├── UserController.java
│       │   │   ├── BookController.java
│       │   │   ├── DriftController.java
│       │   │   └── CheckInController.java
│       │   ├── entity/                       # 实体类
│       │   │   ├── User.java
│       │   │   ├── Book.java
│       │   │   ├── Drift.java
│       │   │   └── CheckIn.java
│       │   ├── repository/                   # 数据访问层
│       │   │   ├── UserRepository.java
│       │   │   ├── BookRepository.java
│       │   │   ├── DriftRepository.java
│       │   │   └── CheckInRepository.java
│       │   └── service/                      # 业务逻辑层
│       │       ├── UserService.java
│       │       ├── BookService.java
│       │       ├── DriftService.java
│       │       └── CheckInService.java
│       └── resources/
│           ├── application.properties        # 配置文件
│           └── static/                       # 静态资源
│               ├── index.html
│               ├── css/
│               │   └── style.css
│               └── js/
│                   ├── api.js
│                   └── app.js
└── pom.xml
```

## 快速开始

### 环境要求
- JDK 8 或更高版本
- Maven 3.6 或更高版本

### 运行方式

1. **克隆或下载项目**

2. **进入项目目录**
```bash
cd book-drift-system
```

3. **编译项目**
```bash
mvn clean package
```

4. **运行项目**
```bash
mvn spring-boot:run
```

或者运行打包后的 jar：
```bash
java -jar target/book-drift-system-1.0.0.jar
```

5. **访问系统**

打开浏览器访问：http://localhost:8080

### H2 数据库控制台

访问：http://localhost:8080/h2-console

- JDBC URL: `jdbc:h2:mem:bookdriftdb`
- 用户名: `sa`
- 密码: (空)

## API 接口

### 用户接口
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/{id}` - 获取用户信息

### 图书接口
- `POST /api/books` - 发布图书
- `GET /api/books` - 获取所有图书
- `GET /api/books/available` - 获取可漂流图书
- `GET /api/books/popular` - 获取热门图书排行
- `GET /api/books/owner/{ownerId}` - 获取用户发布的图书

### 漂流接口
- `POST /api/drifts` - 申请漂流
- `PUT /api/drifts/{id}/confirm` - 确认漂流
- `PUT /api/drifts/{id}/reject` - 拒绝漂流
- `PUT /api/drifts/{id}/complete` - 完成漂流（归还）
- `GET /api/drifts/requester/{requesterId}` - 我的申请记录
- `GET /api/drifts/owner/{ownerId}` - 收到的申请
- `GET /api/drifts/active/{requesterId}` - 正在进行的漂流

### 打卡接口
- `POST /api/checkins` - 阅读打卡
- `GET /api/checkins/drift/{driftId}` - 漂流打卡记录
- `GET /api/checkins/user/{userId}` - 用户打卡记录

## 使用说明

1. **注册账号**：点击右上角"注册"按钮创建账号
2. **发布图书**：登录后在"图书广场"点击"+ 发布图书"
3. **申请漂流**：在图书广场点击感兴趣图书的"申请漂流"按钮
4. **处理申请**：在"我的"->"收到的申请"中确认或拒绝申请
5. **阅读打卡**：在"我的"->"阅读打卡"中对正在借阅的图书打卡
6. **确认归还**：图书主人在"收到的申请"中确认图书归还

## 数据状态说明

### 图书状态
- `AVAILABLE` - 可漂流
- `DRIFTING` - 漂流中

### 漂流申请状态
- `PENDING` - 待确认
- `DRIFTING` - 漂流中
- `COMPLETED` - 已完成
- `REJECTED` - 已拒绝
