# 🏘️ 社区互助平台

一个基于 Spring Boot + 原生 HTML/JS 的社区互助悬赏平台。

## ✨ 功能特性

- **用户系统**：注册、登录、账户余额管理
- **任务发布**：发布悬赏任务，设置赏金、截止时间、所需技能
- **任务申请**：接单者申请感兴趣的任务
- **任务承接**：发布者确认接单后任务进入进行中状态
- **任务提交**：接单人完成任务后提交描述和图片凭证
- **确认完成**：发布者确认完成后，系统扣除5%服务费，剩余赏金转入接单人账户
- **交易记录**：查看所有交易流水

## 🛠️ 技术栈

### 后端
- Java 8
- Spring Boot 2.7.x
- Spring Data JPA
- H2 内存数据库

### 前端
- 原生 HTML5
- CSS3 (渐变/动画/响应式)
- 原生 JavaScript (ES6+)

## 📁 项目结构

```
mutual-help-platform/
├── backend/                    # Spring Boot 后端
│   ├── src/
│   │   └── main/
│   │       ├── java/com/community/platform/
│   │       │   ├── entity/    # 实体类
│   │       │   ├── repository/# 数据访问层
│   │       │   ├── service/   # 业务逻辑层
│   │       │   ├── controller/# 控制器
│   │       │   ├── dto/       # 数据传输对象
│   │       │   └── MutualHelpPlatformApplication.java
│   │       └── resources/
│   │           └── application.properties
│   └── pom.xml
└── frontend/                   # 前端
    ├── index.html
    ├── style.css
    └── app.js
```

## 🚀 快速启动

### 前置要求
- JDK 8 或更高版本
- Maven 3.x

### 1. 启动后端服务

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

### 2. 启动前端

直接在浏览器中打开 `frontend/index.html` 文件即可，或使用任意 HTTP 服务器：

```bash
# 使用 Node.js http-server
cd frontend
npx http-server -p 5500

# 或使用 Python
cd frontend
python -m http.server 5500
```

然后访问 http://localhost:5500

## 📋 API 接口说明

### 用户相关
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/{id}` - 获取用户信息

### 任务相关
- `POST /api/tasks/publish` - 发布任务
- `GET /api/tasks/published` - 获取已发布的任务列表
- `GET /api/tasks/{taskId}` - 获取任务详情
- `GET /api/tasks/publisher/{publisherId}` - 获取我发布的任务
- `GET /api/tasks/accepter/{accepterId}` - 获取我承接的任务

### 申请相关
- `POST /api/tasks/apply` - 申请任务
- `GET /api/tasks/{taskId}/applications` - 获取任务的所有申请
- `POST /api/tasks/applications/{applicationId}/accept` - 接受申请

### 提交相关
- `POST /api/tasks/submit` - 提交任务完成
- `GET /api/tasks/{taskId}/submission` - 获取任务提交内容
- `POST /api/tasks/submissions/{submissionId}/confirm` - 确认任务完成

### 交易相关
- `GET /api/tasks/transactions/{userId}` - 获取用户交易记录

## 💡 使用流程

1. **注册账号**：新用户注册并登录
2. **充值余额**：发布任务前需要先充值（前端模拟充值）
3. **发布任务**：填写任务标题、描述、赏金、截止时间、所需技能
4. **浏览任务**：在任务大厅查看所有可接的任务
5. **申请任务**：对接感兴趣的任务，填写申请留言
6. **确认接单**：发布者查看申请列表，选择合适的接单人
7. **完成任务**：接单人完成任务后，提交完成描述和图片凭证
8. **确认打款**：发布者确认任务完成，系统自动扣除5%服务费，剩余95%赏金转入接单人账户

## 🔧 H2 数据库控制台

启动后端后，可以访问 H2 控制台查看数据库：
- URL: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:mutualhelpdb`
- 用户名: `sa`
- 密码: (空)

## ⚠️ 注意事项

1. 本项目使用 H2 内存数据库，重启后数据会丢失
2. 前端充值功能为模拟充值，仅用于测试
3. 图片上传会转换为 Base64 存储在数据库中
4. 平台服务费固定为 5%，在代码中配置
