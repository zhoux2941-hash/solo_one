# 办公室绿植浇水提醒协作工具

## 项目简介

一个基于 Vue 3 + Spring Boot 的全栈应用，用于管理办公室 12 盆绿植的浇水提醒。支持多用户协作和实时状态同步。

## 技术栈

**后端**
- Java 8
- Spring Boot 2.7
- Spring Data JPA
- MySQL 8
- WebSocket

**前端**
- Vue 3
- Vite 4
- Vue Router 4
- Axios

## 项目结构

```
0508-74/
├── backend/                    # Java 后端
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/office/plantreminder/
│       │   ├── PlantReminderApplication.java
│       │   ├── config/         # WebSocket、CORS 配置
│       │   ├── controller/     # REST API 控制器
│       │   ├── dto/            # 数据传输对象
│       │   ├── entity/         # JPA 实体
│       │   ├── repository/     # 数据访问层
│       │   ├── service/        # 业务逻辑层
│       │   └── websocket/      # WebSocket 处理器
│       └── resources/
│           ├── application.yml
│           └── schema.sql      # 数据库初始化脚本
└── frontend/                   # Vue 前端
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js
        ├── App.vue
        ├── api/
        │   └── plant.js
        ├── components/
        │   └── PlantCard.vue
        ├── router/
        │   └── index.js
        └── views/
            ├── PlantList.vue
            └── OverdueList.vue
```

## 功能特性

### 绿植管理
- 展示 12 盆绿植卡片（绿萝、发财树、多肉、吊兰、虎皮兰、文竹、富贵竹）
- 每盆绿植显示：名称、品种、位置、浇水周期、上次浇水时间、下次浇水时间、状态
- 支持 4 种状态：正常、即将到期（1-2 天内）、今天需要浇水、逾期

### 浇水功能
- 用户点击"已浇水"按钮，输入姓名完成记录
- 系统自动更新上次浇水时间和下次浇水日期
- 生成浇水日志

### 逾期提醒
- 独立页面展示所有逾期未浇水的绿植
- 红色高亮显示，引起注意

### 多用户协作
- 使用 WebSocket 实现实时状态广播
- 用户 A 浇完水后，其他在线用户立即看到状态更新

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/plants | 获取所有绿植列表 |
| GET | /api/plants/{id} | 获取单盆绿植详情 |
| GET | /api/plants/overdue | 获取逾期绿植列表 |
| POST | /api/plants/water | 浇水操作 |
| GET | /api/plants/{id}/logs | 获取浇水记录 |

### 浇水请求体
```json
{
  "plantId": 1,
  "wateredBy": "张三",
  "notes": "可选备注"
}
```

## 运行步骤

### 1. 初始化数据库

确保 MySQL 已安装并启动，然后执行 SQL 脚本：

```bash
mysql -u root -p < backend/src/main/resources/schema.sql
```

或手动在 MySQL 中执行 `backend/src/main/resources/schema.sql` 的内容。

**注意**：脚本会创建数据库 `plant_reminder` 并插入 12 盆初始绿植数据。

### 2. 配置数据库连接

修改 `backend/src/main/resources/application.yml` 中的数据库用户名和密码：

```yaml
spring:
  datasource:
    username: your_username
    password: your_password
```

### 3. 启动后端

```bash
cd backend
mvn clean package -DskipTests
mvn spring-boot:run
```

后端将在 `http://localhost:8080` 启动。

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将在 `http://localhost:3000` 启动。

### 5. 访问应用

打开浏览器访问 `http://localhost:3000`

## 测试多用户协作

1. 打开两个浏览器窗口（或两个标签页）都访问 `http://localhost:3000`
2. 在窗口 A 中，点击任意绿植的"已浇水"按钮，输入姓名
3. 观察窗口 B，该绿植的状态会自动更新，无需刷新页面

## 绿植配置

初始 12 盆绿植：

| 名称 | 品种 | 浇水周期 | 位置 |
|------|------|----------|------|
| 绿萝1号 | 绿萝 | 3天 | 前台左侧 |
| 绿萝2号 | 绿萝 | 3天 | 前台右侧 |
| 发财树A | 发财树 | 7天 | 办公室A区 |
| 发财树B | 发财树 | 7天 | 办公室B区 |
| 多肉组合1 | 多肉 | 10天 | 会议桌 |
| 多肉组合2 | 多肉 | 10天 | 茶水间 |
| 吊兰A | 吊兰 | 4天 | 窗边1 |
| 吊兰B | 吊兰 | 4天 | 窗边2 |
| 虎皮兰 | 虎皮兰 | 14天 | 仓库门口 |
| 文竹 | 文竹 | 5天 | 经理办公室 |
| 富贵竹A | 富贵竹 | 6天 | 走廊左侧 |
| 富贵竹B | 富贵竹 | 6天 | 走廊右侧 |

如需修改，可编辑 `backend/src/main/resources/schema.sql` 中的 INSERT 语句，或直接修改数据库表。

## 环境要求

- JDK 8+
- Maven 3.6+
- Node.js 16+
- MySQL 5.7+ 或 8+
