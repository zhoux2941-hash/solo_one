# 施工进度拍照打卡系统

一个面向农村施工队的进度拍照打卡系统，支持施工员打卡、房主查看进度和催进度等功能。

## 功能特性

### 核心功能

1. **用户管理**
   - 支持施工员和房主两种角色
   - 用户注册、登录、退出功能

2. **项目管理**
   - 房主可创建施工项目（包含房主姓名、地址、建筑面积）
   - 每个项目自动生成5个工序：地基、框架、砌墙、封顶、装修
   - 项目状态管理（进行中/已完成）

3. **进度打卡**
   - 施工员选择项目进行打卡
   - 记录当日完成百分比（自动累加）
   - 支持上传现场照片（模拟）
   - 添加工作描述

4. **自动进度切换**
   - 系统自动计算每个工序的累计完成百分比
   - 当某工序达到100%时自动切换到下一工序
   - 所有工序完成后项目状态自动变为"已完成"

5. **时间线展示**
   - 打卡记录按时间线展示（类似朋友圈）
   - 展示照片、进度、描述、时间

6. **房主留言**
   - 房主可查看所有打卡记录
   - 支持发送普通留言
   - 支持"催进度"功能

7. **Redis缓存**
   - 缓存项目当前工序和进度
   - 缓存打卡时间线
   - 加快首页和详情页加载速度

## 技术栈

### 后端
- Java 8
- Spring Boot 2.7.x
- Spring Data JPA
- Spring Security + JWT
- Spring Data Redis
- MySQL 8.0+
- Redis 5.0+
- Lombok

### 前端
- Vue 2.6.x
- Vue Router 3.x
- Vuex 3.x
- Element UI 2.x
- Axios
- Sass

## 项目结构

```
.
├── backend/                    # 后端Spring Boot项目
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/construction/progress/
│   │   │   │   ├── config/          # 配置类
│   │   │   │   ├── constant/        # 常量定义
│   │   │   │   ├── controller/      # 控制器
│   │   │   │   ├── dto/             # 数据传输对象
│   │   │   │   ├── entity/          # 实体类
│   │   │   │   ├── repository/      # 数据访问层
│   │   │   │   ├── security/        # 安全相关
│   │   │   │   ├── service/         # 业务逻辑层
│   │   │   │   └── ProgressTrackerApplication.java
│   │   │   └── resources/
│   │   │       ├── application.yml  # 应用配置
│   │   │       └── schema.sql       # 数据库初始化脚本
│   │   └── pom.xml
│
├── frontend/                   # 前端Vue项目
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── api/                # API接口
│   │   ├── components/         # 组件
│   │   ├── router/             # 路由配置
│   │   ├── store/              # 状态管理
│   │   ├── styles/             # 全局样式
│   │   ├── views/              # 页面视图
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   ├── vue.config.js
│   └── babel.config.js
│
└── README.md
```

## 快速开始

### 环境要求

- JDK 8 或更高版本
- Maven 3.6+
- Node.js 14+
- MySQL 8.0+
- Redis 5.0+

### 数据库准备

1. 创建MySQL数据库
```sql
CREATE DATABASE construction_progress DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 执行初始化脚本
   - 脚本位置: `backend/src/main/resources/schema.sql`
   - 包含示例数据，可直接导入测试

### 后端启动

1. 修改配置文件 `backend/src/main/resources/application.yml`
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/construction_progress?...
    username: your_mysql_username
    password: your_mysql_password
  
  redis:
    host: localhost
    port: 6379
    password: your_redis_password  # 如果有密码
```

2. 启动Redis服务

3. 启动后端应用
```bash
cd backend
mvn spring-boot:run
```

后端将在 `http://localhost:8080` 启动

### 前端启动

1. 安装依赖
```bash
cd frontend
npm install
```

2. 启动开发服务器
```bash
npm run serve
```

前端将在 `http://localhost:8081` 启动

### 测试账号

系统已预置以下测试账号（密码均为：`123456`）：

| 用户名 | 密码 | 角色 | 说明 |
|-------|------|------|------|
| worker1 | 123456 | 施工员 | 已创建打卡记录 |
| worker2 | 123456 | 施工员 | 已创建打卡记录 |
| owner1 | 123456 | 房主 | 有2个项目 |
| owner2 | 123456 | 房主 | 有1个项目 |

## API接口说明

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 项目接口
- `POST /api/projects` - 房主创建项目
- `GET /api/projects` - 获取项目列表
- `GET /api/projects/{id}` - 获取项目详情
- `GET /api/projects/{id}/stages` - 获取项目工序进度

### 打卡接口
- `POST /api/checkins` - 施工员打卡
- `GET /api/checkins/project/{projectId}` - 获取项目打卡时间线
- `GET /api/checkins/my` - 获取我的打卡记录

### 留言接口
- `POST /api/comments` - 房主留言/催进度
- `GET /api/comments/project/{projectId}` - 获取项目留言
- `GET /api/comments/my` - 获取我的留言
- `PUT /api/comments/{id}/read` - 标记已读

## 使用流程

### 施工员流程
1. 注册/登录账号（选择"施工员"角色）
2. 进入"拍照打卡"页面
3. 选择要打卡的项目
4. 填写今日完成百分比
5. 添加工作描述（可选）
6. 上传现场照片（模拟）
7. 点击"确认打卡"

### 房主流程
1. 注册/登录账号（选择"房主"角色）
2. 进入"项目列表"创建新项目
3. 点击项目查看详细进度
4. 在"工序进度"标签页查看各阶段完成情况
5. 在"打卡记录"标签页查看时间线（类似朋友圈）
6. 在"留言板"标签页发送留言或催进度

## 核心业务逻辑

### 进度累加规则
- 每次打卡记录的"每日进度"会累加到当前工序的总进度
- 当总进度达到100%时，自动标记该工序为已完成
- 自动切换到下一工序（如果存在）
- 如果是最后一个工序，项目状态变为"已完成"

### Redis缓存策略
- 项目状态缓存：`project:status:{projectId}`，有效期1小时
- 打卡时间线缓存：`project:timeline:{projectId}`，有效期1小时
- 创建/更新打卡时自动清除相关缓存

## 注意事项

1. **密码安全**：示例数据中的密码是经过BCrypt加密的，实际使用时请更换更强的密码
2. **文件上传**：当前版本的图片上传是模拟实现，实际部署时可接入真实的文件存储服务（如OSS、MinIO等）
3. **JWT密钥**：请在生产环境中修改 `jwt.secret` 配置
4. **Redis配置**：确保Redis服务正常运行，否则可能导致性能问题
5. **跨域配置**：生产环境建议配置具体的允许域名，而非使用通配符 `*`

## 后续优化建议

1. 接入真实的图片存储服务（阿里云OSS、腾讯云COS、MinIO等）
2. 添加消息通知功能（WebSocket或消息队列）
3. 完善权限控制和数据隔离
4. 添加数据统计报表功能
5. 移动端适配或开发小程序版本
6. 添加位置打卡功能（GPS定位）
7. 支持视频上传
8. 添加项目团队管理功能

## License

MIT License
