# 表情包大赛系统

公司内部表情包大赛平台，支持用户上传作品、投票、评论等功能。

## 技术栈

### 后端
- Java 8
- Spring Boot 2.7
- MySQL 8.0
- Redis
- MyBatis Plus
- JWT
- Spring Security

### 前端
- Vue 2
- Element UI
- Vue Router
- Vuex
- Axios

## 功能特性

### 用户功能
- ✅ 用户注册/登录（JWT认证）
- ✅ 上传表情包（支持PNG/JPG，限2MB）
- ✅ 查看表情包列表和详情
- ✅ 投票系统（每日10票，不能重复投同一作品）
- ✅ 评论功能（支持回复）
- ✅ 查看排行榜

### 管理员功能
- ✅ 审核待提交的表情包
- ✅ 通过/拒绝作品

### 技术亮点
- ✅ Redis缓存实时票数和用户剩余票数
- ✅ 每日投票限制（自动过期）
- ✅ 实时更新票数，后台定时同步到数据库
- ✅ 支持分页查询
- ✅ CORS跨域支持

## 数据库设计

主要数据表：
- `user` - 用户表
- `meme` - 表情包表
- `vote` - 投票记录表
- `comment` - 评论表

## 快速开始

### 后端启动

1. 创建数据库并导入表结构：
```bash
mysql -u root -p < backend/src/main/resources/schema.sql
```

2. 修改配置文件 `backend/src/main/resources/application.yml`：
```yaml
spring:
  datasource:
    username: your_mysql_username
    password: your_mysql_password
  redis:
    host: localhost
    port: 6379
```

3. 启动后端：
```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 运行

### 前端启动

1. 安装依赖：
```bash
cd frontend
npm install
```

2. 启动开发服务器：
```bash
npm run serve
```

前端将在 `http://localhost:8081` 运行

## API接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 表情包接口
- `POST /api/memes/upload` - 上传表情包
- `GET /api/memes/approved` - 获取已审核通过的表情包列表
- `GET /api/memes/{id}` - 获取表情包详情
- `GET /api/memes/images/{filename}` - 获取图片

### 投票接口
- `POST /api/votes/{memeId}` - 投票
- `GET /api/votes/remaining` - 获取今日剩余票数
- `GET /api/votes/count/{memeId}` - 获取作品票数

### 评论接口
- `POST /api/comments` - 发表评论
- `GET /api/comments/meme/{memeId}` - 获取作品评论

### 排行榜接口
- `GET /api/ranking` - 获取完整排行榜（前三名+特别奖项）
- `GET /api/ranking/top?limit=N` - 获取前N名

### 管理员接口（需要ADMIN角色）
- `GET /api/admin/memes/pending` - 获取待审核列表
- `POST /api/admin/memes/{id}/review` - 审核表情包

## Redis缓存策略

### Key设计
- `meme:vote:count:{memeId}` - 作品票数
- `meme:user:votes:{userId}:{date}` - 用户今日剩余票数（24小时过期）
- `meme:voted:meme:{userId}:{date}` - 用户今日已投票作品集合（24小时过期）

### 数据同步
- 实时读写Redis
- 每10票同步一次到MySQL
- 每日凌晨全量同步Redis数据到MySQL

## 默认管理员账号

- 用户名：`admin`
- 密码：需要重新设置（可在schema.sql中修改）

## 项目结构

```
├── backend/                    # 后端项目
│   ├── src/main/java/com/meme/
│   │   ├── MemeContestApplication.java
│   │   ├── common/            # 通用类
│   │   ├── config/            # 配置类
│   │   ├── controller/        # 控制器
│   │   ├── dto/               # 数据传输对象
│   │   ├── entity/            # 实体类
│   │   ├── filter/            # 过滤器
│   │   ├── mapper/            # MyBatis Mapper
│   │   ├── service/           # 业务逻辑
│   │   ├── util/              # 工具类
│   │   └── vo/                # 视图对象
│   └── pom.xml
│
└── frontend/                   # 前端项目
    ├── src/
    │   ├── views/             # 页面组件
    │   ├── router/            # 路由配置
    │   ├── store/             # Vuex状态管理
    │   ├── api/               # API调用
    │   ├── styles/            # 样式文件
    │   ├── App.vue
    │   └── main.js
    └── package.json
```
