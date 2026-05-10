# 实验室危化品领用管理系统

## 技术栈

- 前端：Vue 3 + Vite + Element Plus
- 后端：Spring Boot 3.2 + JPA
- 数据库：MySQL 8.0（存储领用记录）
- 缓存：Redis（记录审批临时状态）

## 功能特性

### 角色管理
- **实验员**：申请领用化学品，查看申请记录和审批进度
- **安全员**：一审审批（通过/驳回），查看待一审申请列表
- **主管**：二审审批（通过/驳回），库存管理（添加/编辑化学品）

### 业务流程
1. 实验员申请领用：选择化学品 -> 填写数量/用途/预计使用日期 -> 提交（状态：待一审）
2. 安全员一审：同意（状态：待二审，Redis记录24小时期限）/ 驳回（状态：一审驳回）
3. 主管二审：同意（库存自动扣减，状态：已完成）/ 驳回（状态：二审驳回）
4. 自动机制：一审通过后24小时内未二审，系统自动驳回

### 前端特性
- 库存预警：库存低于阈值（100）标红显示
- 审批流程进度条：可视化展示审批状态
- 角色权限控制：不同角色看到不同的菜单和页面

### 后端特性
- 库存扣减加锁：使用JPA悲观锁（PESSIMISTIC_WRITE）防止超扣
- Redis审批状态管理：记录二审期限，过期自动驳回
- 定时任务：每分钟检查过期审批

## 项目结构

```
.
├── backend/                    # 后端Spring Boot项目
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/example/chemical/
│       │   ├── ChemicalManagementApplication.java
│       │   ├── config/         # 配置类（Redis、CORS）
│       │   ├── controller/     # 控制器层
│       │   ├── dto/            # 数据传输对象
│       │   ├── entity/         # 实体类
│       │   ├── repository/     # 数据访问层
│       │   └── service/        # 业务逻辑层
│       └── resources/
│           ├── application.yml # 应用配置
│           ├── schema.sql      # 数据库表结构
│           └── data.sql        # 初始测试数据
└── frontend/                   # 前端Vue3项目
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js
        ├── App.vue
        ├── styles.css
        ├── router/index.js     # 路由配置
        ├── utils/request.js    # Axios封装
        ├── api/                # API接口
        ├── components/         # 公共组件
        └── views/              # 页面视图
```

## 快速开始

### 环境要求

- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Maven 3.6+

### 步骤1：启动MySQL和Redis

```bash
# 确保MySQL服务已启动
# 确保Redis服务已启动（默认端口6379）
```

### 步骤2：初始化数据库

```bash
# 方法1：执行SQL脚本
mysql -u root -p < backend/src/main/resources/schema.sql
mysql -u root -p < backend/src/main/resources/data.sql

# 方法2：启动后端时自动执行（JPA ddl-auto: update）
```

### 步骤3：配置数据库连接

修改 `backend/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    username: your_username
    password: your_password
  data:
    redis:
      host: localhost
      port: 6379
```

### 步骤4：启动后端服务

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

### 步骤5：启动前端服务

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 http://localhost:5173 启动

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 实验员 | tech1 | 123456 |
| 实验员 | tech2 | 123456 |
| 安全员 | safety1 | 123456 |
| 主管 | director1 | 123456 |

## API接口文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 退出登录
- `GET /api/auth/current` - 获取当前用户
- `POST /api/auth/register` - 注册用户

### 化学品接口
- `GET /api/chemicals` - 获取所有化学品
- `GET /api/chemicals/{id}` - 获取化学品详情
- `POST /api/chemicals` - 添加化学品（主管权限）
- `PUT /api/chemicals/{id}` - 更新化学品（主管权限）

### 申请接口
- `POST /api/applications` - 创建申请（实验员权限）
- `GET /api/applications/my` - 获取我的申请（实验员权限）
- `GET /api/applications/pending-first-review` - 获取待一审列表（安全员权限）
- `GET /api/applications/pending-second-review` - 获取待二审列表（主管权限）
- `POST /api/applications/first-review` - 一审审批（安全员权限）
- `POST /api/applications/second-review` - 二审审批（主管权限）
- `GET /api/applications/{id}` - 获取申请详情
- `GET /api/applications/{id}/remaining-time` - 获取剩余审批时间

## 核心实现说明

### 库存扣减加锁机制

在 `ChemicalRepository` 中使用 `@Lock(LockModeType.PESSIMISTIC_WRITE)`：

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT c FROM Chemical c WHERE c.id = :id")
Optional<Chemical> findByIdWithLock(@Param("id") Long id);
```

在 `ApplicationService.secondReview()` 中调用，确保库存扣减操作的原子性。

### Redis审批状态管理

- 一审通过后，在Redis中设置key `approval:{applicationId}`，过期时间24小时
- 二审前检查Redis key是否存在，不存在则自动驳回
- 定时任务每分钟检查过期审批，更新数据库状态

### 前端路由权限控制

在 `router/index.js` 中使用 `beforeEach` 钩子：
- 检查登录状态
- 检查角色权限
- 未认证跳转到登录页
- 无权限跳转到默认页
