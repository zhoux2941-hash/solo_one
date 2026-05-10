# 配音任务接单系统

一个完整的配音任务接单系统，包含甲方发布任务、配音员试音、中标结算等功能。

## 技术栈

### 后端
- Java 11
- Spring Boot 2.7.x
- MyBatis Plus 3.5.x
- MySQL 8.x
- Redis
- JWT 认证
- Hutool 工具库

### 前端
- Vue 3 + Vite
- Element Plus UI 组件库
- Pinia 状态管理
- Vue Router
- Axios HTTP 客户端

## 功能特性

### 角色
- **甲方**：发布配音任务、选择中标配音员、支付积分
- **配音员**：浏览任务、提交试音、接收中标/未中标通知、提现

### 核心功能
- ✅ 用户注册登录（JWT 认证）
- ✅ 甲方发布任务（标题、文字内容≤200字、时长要求、预算、示例音频≤5MB）
- ✅ 配音员浏览任务大厅
- ✅ 配音员提交试音（音频≤5MB + 附言）
- ✅ 甲方试听所有试音并选择中标者
- ✅ 站内消息通知（中标/未中标通知）
- ✅ 积分系统（甲方支付、配音员收入、提现）
- ✅ Redis 缓存热门任务（试音数量多的任务）
- ✅ 音频文件存储到本地磁盘，数据库记录路径

## 项目结构

```
dubbing-task-system/
├── backend/                    # Spring Boot 后端
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/dubbing/
│       │   ├── config/         # 配置类
│       │   ├── controller/     # 控制器
│       │   ├── dto/            # 数据传输对象
│       │   ├── entity/         # 实体类
│       │   ├── interceptor/    # 拦截器
│       │   ├── mapper/         # MyBatis Mapper
│       │   ├── service/        # 服务层
│       │   ├── util/           # 工具类
│       │   ├── vo/             # 视图对象
│       │   └── DubbingApplication.java
│       └── resources/
│           ├── application.yml
│           └── mapper/
├── frontend/                   # Vue3 前端
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/                # API 接口
│       ├── router/             # 路由配置
│       ├── stores/             # Pinia 状态
│       ├── styles/             # 全局样式
│       ├── utils/              # 工具函数
│       ├── views/              # 页面组件
│       ├── App.vue
│       └── main.js
├── sql/                        # 数据库脚本
│   └── init.sql
└── README.md
```

## 快速开始

### 环境要求
- JDK 11+
- Maven 3.6+
- Node.js 16+
- MySQL 8.0+
- Redis 6.0+

### 1. 数据库初始化

```bash
# 连接 MySQL 数据库
mysql -u root -p

# 执行初始化脚本
source /path/to/sql/init.sql
```

### 2. 创建音频存储目录

Windows:
```bash
mkdir D:\dubbing-audio
```

Linux/Mac:
```bash
mkdir -p /dubbing-audio
```

> 注意：如果修改了存储目录，请同步修改 `backend/src/main/resources/application.yml` 中的 `app.audio.upload-path` 配置。

### 3. 配置修改

编辑 `backend/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/dubbing_system?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: your_password  # 修改为你的 MySQL 密码
  
  data:
    redis:
      host: localhost
      port: 6379
      password: ""  # 修改为你的 Redis 密码（如果有）
```

### 4. 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080/api` 启动。

### 5. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:5173` 启动。

## 测试账号

初始化脚本中包含以下测试账号（密码均为 `123456`）：

| 用户名 | 角色 | 余额 | 说明 |
|--------|------|------|------|
| publisher1 | 甲方 | 10000 积分 | 影视公司A |
| publisher2 | 甲方 | 5000 积分 | 游戏工作室B |
| voice1 | 配音员 | 0 积分 | 声优小明 |
| voice2 | 配音员 | 0 积分 | 配音达人 |
| voice3 | 配音员 | 0 积分 | 专业配音员 |

## API 接口

### 用户模块
- `POST /api/user/register` - 用户注册
- `POST /api/user/login` - 用户登录
- `GET /api/user/info` - 获取当前用户信息

### 任务模块
- `POST /api/task/publish` - 发布任务
- `GET /api/task/list` - 任务列表
- `GET /api/task/hot` - 热门任务（Redis缓存）
- `GET /api/task/detail/{id}` - 任务详情
- `GET /api/task/my-published` - 我发布的任务
- `POST /api/task/select-winner` - 选择中标者

### 试音模块
- `POST /api/audition/submit` - 提交试音
- `GET /api/audition/task/{taskId}` - 获取任务的所有试音
- `GET /api/audition/my` - 获取我的试音

### 交易模块
- `POST /api/transaction/withdraw` - 申请提现
- `GET /api/transaction/my` - 获取我的交易记录

### 消息模块
- `GET /api/message/my` - 获取我的消息
- `GET /api/message/unread-count` - 获取未读消息数
- `POST /api/message/read/{id}` - 标记消息已读
- `POST /api/message/read-all` - 全部标记已读

## 数据字典

### 用户角色 (user.role)
| 值 | 含义 |
|----|------|
| 1 | 甲方 |
| 2 | 配音员 |

### 任务状态 (task.status)
| 值 | 含义 |
|----|------|
| 1 | 招募中 |
| 2 | 已结束 |

### 试音状态 (audition.status)
| 值 | 含义 |
|----|------|
| 0 | 待审核 |
| 1 | 已中标 |
| 2 | 未中标 |

### 交易类型 (transaction.type)
| 值 | 含义 |
|----|------|
| 1 | 收入 |
| 2 | 支出 |
| 3 | 提现 |

### 消息类型 (message.type)
| 值 | 含义 |
|----|------|
| 0 | 系统消息 |
| 1 | 中标通知 |
| 2 | 未中标通知 |

## Redis 缓存

- **Key**: `hot:tasks`
- **Value**: 热门任务列表（试音数量最多的前10个任务）
- **过期时间**: 300 秒（5分钟）

热门任务会在任务发布、试音提交、选择中标者时自动清除缓存。

## 音频文件

- 所有音频文件存储在 `app.audio.upload-path` 配置的目录下
- 文件格式：仅限 MP3
- 文件大小：最大 5MB
- 文件名：UUID + 原扩展名
- 访问路径：`/api/audio/{filename}`（后端静态资源映射）

## 安全说明

1. 密码使用 MD5 加密存储
2. JWT Token 有效期 24 小时
3. 关键接口需要登录认证
4. 角色权限控制（甲方/配音员权限分离）

## 注意事项

1. 首次运行前请确保 MySQL 和 Redis 服务已启动
2. 音频存储目录需要有写入权限
3. 生产环境请修改 JWT Secret
4. 生产环境请使用 HTTPS
