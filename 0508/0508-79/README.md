# 盲盒玩家互换平台

一个基于 Vue3 + Spring Boot + MySQL + Redis 的盲盒交换平台。

## 技术栈

### 后端
- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- Spring Security + JWT
- MySQL 8.0+
- Redis

### 前端
- Vue 3
- Vite
- Vue Router
- Pinia
- Element Plus
- Axios

## 功能特性

1. **用户系统**
   - 用户注册/登录
   - JWT 认证

2. **盲盒管理**
   - 上传盲盒（型号、系列名称、款式、图片URL、新旧程度）
   - 编辑/删除盲盒
   - 查看我的盲盒

3. **交换意向**
   - 发布交换意向（选择自己的盲盒，指定期望的系列/款式）
   - 支持模糊匹配
   - 取消交换意向

4. **自动匹配**
   - 双向匹配算法（A提供X想要Y，B提供Y想要X）
   - 匹配成功发送站内消息
   - 定时任务自动扫描匹配

5. **匹配大厅**
   - 搜索可交换的盲盒（系列/款式模糊匹配）
   - 查看盲盒详情
   - 主动发起交换请求
   - 分页支持

6. **交换请求**
   - 查看发起/收到的交换请求
   - 接受/拒绝交换请求
   - 取消交换请求
   - 接受后双方盲盒状态更新为不可交换

7. **消息通知**
   - 站内消息系统
   - 未读消息计数
   - 消息类型：匹配通知、交换请求、系统消息

8. **Redis 功能**
   - 记录用户最近浏览的10个盲盒
   - 基于浏览历史推荐盲盒
   - 热门系列排行榜（ZSet）

## 项目结构

```
.
├── backend/                 # 后端 Spring Boot 项目
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/blindbox/exchange/
│       │   ├── BlindexExchangeApplication.java
│       │   ├── config/          # 配置类（Redis、Security、异常处理）
│       │   ├── controller/      # 控制器
│       │   ├── dto/             # 数据传输对象
│       │   ├── entity/          # 实体类
│       │   ├── repository/      # 数据访问层
│       │   ├── security/        # 安全相关（JWT）
│       │   └── service/         # 业务逻辑层
│       └── resources/
│           ├── application.yml  # 应用配置
│           └── schema.sql       # 数据库初始化脚本
└── frontend/                # 前端 Vue 项目
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js
        ├── App.vue
        ├── router/           # 路由配置
        ├── api/              # API 接口
        ├── assets/           # 静态资源
        └── views/            # 页面组件
```

## 快速开始

### 前置要求

- JDK 17+
- Maven 3.8+
- Node.js 16+
- MySQL 8.0+
- Redis 6.0+

### 启动步骤

#### 1. 启动 MySQL 和 Redis

确保 MySQL 和 Redis 服务已启动。

#### 2. 创建数据库

```sql
CREATE DATABASE blindbox_exchange DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 3. 配置后端

修改 `backend/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    username: your_mysql_username
    password: your_mysql_password
  data:
    redis:
      password: your_redis_password  # 如果有密码
```

#### 4. 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动。

数据库表会自动通过 JPA ddl-auto 创建。

#### 5. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:5173` 启动。

### 访问应用

打开浏览器访问 `http://localhost:5173`

## API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 盲盒接口
- `GET /api/boxes/my` - 获取我的盲盒
- `GET /api/boxes/my/available` - 获取我的可用盲盒
- `POST /api/boxes` - 添加盲盒
- `PUT /api/boxes/{id}` - 更新盲盒
- `DELETE /api/boxes/{id}` - 删除盲盒
- `GET /api/boxes/search` - 搜索盲盒（支持分页）
- `GET /api/boxes/hot-series` - 获取热门系列

### 交换意向接口
- `GET /api/intents/my` - 获取我的交换意向
- `POST /api/intents` - 发布交换意向
- `POST /api/intents/{id}/cancel` - 取消交换意向

### 交换请求接口
- `GET /api/requests/my` - 获取我的交换请求
- `POST /api/requests` - 发起交换请求
- `POST /api/requests/{id}/accept` - 接受请求
- `POST /api/requests/{id}/reject` - 拒绝请求
- `POST /api/requests/{id}/cancel` - 取消请求

### 消息接口
- `GET /api/messages` - 获取我的消息
- `GET /api/messages/unread-count` - 获取未读消息数
- `POST /api/messages/{id}/read` - 标记已读
- `POST /api/messages/read-all` - 全部标记已读

### 浏览历史接口
- `GET /api/history` - 获取浏览历史
- `DELETE /api/history` - 清除浏览历史
- `GET /api/history/recommendations` - 获取推荐

## 匹配算法

双向匹配逻辑：
1. 用户A发布意向：提供盲盒X，期望系列Y
2. 用户B发布意向：提供盲盒Y，期望系列X
3. 系统检测到双向匹配
4. 自动创建 Match 记录
5. 向双方发送站内消息

系列匹配使用模糊匹配（包含关系）。

## 数据模型

### 用户 (users)
- id, username, password, email, nickname, avatar, bio

### 盲盒 (blind_boxes)
- id, user_id, model_number, series_name, style_name, image_url, condition, is_available

### 交换意向 (exchange_intents)
- id, user_id, offer_box_id, desired_series, desired_style, status

### 交换请求 (exchange_requests)
- id, from_user_id, to_user_id, offer_box_id, request_box_id, status

### 消息 (messages)
- id, user_id, title, content, is_read, type, related_id

## License

MIT
