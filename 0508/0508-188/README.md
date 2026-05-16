# 班级投票系统

一个基于Spring Boot + WebSocket的实时投票系统，支持管理员创建投票、用户实时投票、结果实时更新。

## 功能特性

- ✅ 管理员创建投票（标题、选项列表、是否允许多选、截止时间）
- ✅ 用户输入昵称后投票
- ✅ IP + 昵称联合校验，防止重复投票
- ✅ WebSocket实时推送投票结果更新
- ✅ 截止时间后自动关闭投票
- ✅ 实时显示每个选项的票数和百分比
- ✅ 响应式UI设计

## 技术栈

### 后端
- Java 8
- Spring Boot 2.7.x
- Spring WebSocket (STOMP)
- Spring Data JPA
- H2 内存数据库
- Lombok

### 前端
- HTML5
- JavaScript (ES6+)
- SockJS + STOMP.js
- CSS3 (响应式设计)

## 快速开始

### 环境要求
- JDK 8+
- Maven 3.6+

### 运行步骤

1. **克隆项目**
   ```bash
   cd voting-system
   ```

2. **编译项目**
   ```bash
   mvn clean install
   ```

3. **运行应用**
   ```bash
   mvn spring-boot:run
   ```

4. **访问应用**
   - 首页：http://localhost:8080/index.html
   - 管理员创建投票：http://localhost:8080/admin.html
   - H2数据库控制台：http://localhost:8080/h2-console

### H2数据库连接信息
- JDBC URL: `jdbc:h2:mem:votingdb`
- 用户名: `sa`
- 密码: (空)

## API接口

### 创建投票
```
POST /api/polls
Content-Type: application/json

{
    "title": "投票标题",
    "options": ["选项1", "选项2", "选项3"],
    "allowMultiple": false,
    "deadline": "2024-12-31T23:59:59"
}
```

### 获取所有投票
```
GET /api/polls
```

### 获取单个投票详情
```
GET /api/polls/{id}
```

### 提交投票
```
POST /api/polls/{id}/vote
Content-Type: application/json

{
    "nickname": "用户昵称",
    "optionIds": [1, 2]
}
```

## WebSocket实时推送

- 连接端点：`/ws`
- 订阅主题：`/topic/poll/{pollId}`
- 当有新投票时，会自动推送最新的投票结果给所有订阅者

## 项目结构

```
src/main/java/com/voting/
├── VotingApplication.java          # 主应用入口
├── config/
│   └── WebSocketConfig.java        # WebSocket配置
├── controller/
│   └── PollController.java         # REST API控制器
├── dto/
│   ├── PollRequest.java            # 创建投票请求DTO
│   └── VoteRequest.java            # 投票请求DTO
├── entity/
│   ├── Poll.java                   # 投票实体
│   ├── PollOption.java             # 投票选项实体
│   └── VoteRecord.java             # 投票记录实体
├── repository/
│   ├── PollRepository.java         # 投票数据访问层
│   ├── PollOptionRepository.java   # 选项数据访问层
│   └── VoteRecordRepository.java   # 投票记录数据访问层
└── service/
    ├── PollService.java            # 投票业务逻辑
    └── WebSocketService.java       # WebSocket推送服务

src/main/resources/
├── application.yml                 # 应用配置
└── static/
    ├── index.html                  # 首页
    ├── admin.html                  # 管理员创建投票页面
    └── poll.html                   # 用户投票页面
```

## 使用说明

### 管理员端
1. 访问 `/admin.html`
2. 填写投票标题
3. 添加投票选项（至少2个）
4. 选择是否允许多选
5. 设置截止时间
6. 点击"创建投票"
7. 获取投票链接并分享

### 用户端
1. 访问投票链接
2. 输入自己的昵称
3. 选择投票选项（单选或多选）
4. 点击"提交投票"
5. 实时查看投票结果更新

## 安全机制

- **重复投票校验**：基于IP地址 + 昵称的唯一约束
- **投票截止控制**：到达截止时间后自动禁止投票
- **多选限制**：根据投票设置控制选项选择数量
- **数据完整性**：使用数据库事务确保投票数据一致性

## 注意事项

1. 当前使用H2内存数据库，重启后数据会丢失
2. 生产环境建议替换为MySQL/PostgreSQL等持久化数据库
3. 可以添加用户认证机制增强安全性
4. 可以添加投票结果导出功能

## License

MIT License
