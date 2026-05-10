# 宿舍水电费分摊系统

一个基于 Vue3 + Spring Boot + MySQL + Redis 的宿舍水电费分摊管理系统。

## 功能特性

- 用户注册登录，关联寝室号
- 每月录入总电费、总水费
- 系统自动按人头均摊费用
- 缴费状态管理（点击"我已缴费"）
- 查看历史月份账单
- 查看未缴名单

## 技术栈

### 前端
- Vue 3 + Vite
- Vue Router + Pinia
- Element Plus
- Axios

### 后端
- Spring Boot 3.2
- MyBatis-Plus
- MySQL 8.0
- Redis
- JWT

## 项目结构

```
.
├── backend/          # Spring Boot 后端项目
│   ├── src/main/java/com/dorm/bill/
│   │   ├── common/       # 公共类
│   │   ├── config/       # 配置类
│   │   ├── controller/   # 控制器
│   │   ├── dto/          # 数据传输对象
│   │   ├── entity/       # 实体类
│   │   ├── mapper/       # 数据访问层
│   │   └── service/      # 业务逻辑层
│   └── pom.xml
├── frontend/         # Vue3 前端项目
│   ├── src/
│   │   ├── api/         # API 接口
│   │   ├── router/      # 路由配置
│   │   ├── stores/      # 状态管理
│   │   ├── utils/       # 工具函数
│   │   ├── views/       # 页面组件
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   └── vite.config.js
└── sql/
    └── init.sql      # 数据库初始化脚本
```

## 快速开始

### 环境要求
- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Redis

### 数据库配置

1. 新建数据库并执行初始化脚本：
```bash
mysql -u root -p < sql/init.sql
```

2. 修改 `backend/src/main/resources/application.yml` 中的数据库连接信息：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/dorm_bill
    username: root
    password: your_password
  data:
    redis:
      host: localhost
      port: 6379
      password: your_redis_password
```

### 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动。

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:5173` 启动。

## API 接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 账单相关
- `POST /api/bills` - 创建账单
- `GET /api/bills` - 获取寝室账单列表
- `GET /api/bills/{billId}` - 获取账单详情
- `POST /api/bills/{billId}/pay` - 确认缴费
- `GET /api/bills/my` - 获取我的账单
- `GET /api/bills/unpaid` - 获取未缴费名单

## 使用流程

1. **注册账号**：每个室友注册时输入寝室号，相同寝室号会自动关联到同一个寝室
2. **录入账单**：每月由任意一人录入总电费和总水费，系统自动按人数均摊
3. **确认缴费**：室友点击"我已缴费"按钮确认已缴纳
4. **查看记录**：可查看历史账单和当前未缴费人员

## 数据库表设计

### dormitory（寝室表）
- id: 主键
- dorm_number: 寝室号

### user（用户表）
- id: 主键
- username: 用户名
- password: 密码（MD5加密）
- nickname: 昵称
- dorm_id: 关联寝室ID

### bill（账单表）
- id: 主键
- dorm_id: 寝室ID
- bill_date: 账单月份（YYYY-MM）
- electricity_amount: 总电费
- water_amount: 总水费
- total_amount: 总金额
- per_person_amount: 人均金额
- head_count: 分摊人数
- created_by: 录入人

### payment（缴费记录表）
- id: 主键
- bill_id: 账单ID
- user_id: 用户ID
- amount: 应缴金额
- status: 缴费状态（0-未缴，1-已缴）
- paid_at: 缴费时间

## License

MIT
