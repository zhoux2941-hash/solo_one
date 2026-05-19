# 企业级订单管理系统 (OMS)

基于 React 18 + TypeScript + Vite + Spring Boot 的企业级订单管理系统

## ✨ 技术特性

### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **UI组件**: Ant Design 5
- **状态管理**: Zustand
- **路由**: React Router 6
- **HTTP客户端**: Axios
- **图表**: ECharts
- **国际化**: i18next (中文/英文/日文)

### 后端技术栈
- **框架**: Spring Boot 3.x
- **数据库**: H2 (可切换 MySQL)
- **认证**: JWT
- **API**: RESTful + GraphQL
- **实时通信**: WebSocket (STOMP)
- **ORM**: Spring Data JPA

## 🏗️ 项目结构

```
oms-system/
├── backend/                          # 后端 Spring Boot 项目
│   ├── src/main/java/com/oms/
│   │   ├── entity/                   # JPA 实体类
│   │   │   ├── Tenant.java           # 租户实体
│   │   │   ├── User.java             # 用户实体
│   │   │   ├── Role.java             # 角色实体
│   │   │   ├── Permission.java       # 权限实体
│   │   │   ├── Product.java          # 商品实体
│   │   │   ├── Order.java            # 订单实体
│   │   │   └── OrderItem.java        # 订单明细实体
│   │   ├── repository/               # 数据访问层
│   │   ├── service/                  # 业务逻辑层
│   │   ├── controller/               # REST API 控制器
│   │   ├── config/                   # 配置类 (WebSocket、数据初始化)
│   │   ├── security/                 # JWT 安全工具
│   │   └── OmsApplication.java       # 启动类
│   └── src/main/resources/
│       └── application.yml           # 应用配置
│
├── frontend/                         # 前端项目
│   └── main-app/                     # 主应用
│       ├── src/
│       │   ├── components/           # 公共组件
│       │   │   └── Layout.tsx        # 主布局组件
│       │   ├── pages/                # 页面组件
│       │   │   ├── Login.tsx         # 登录页
│       │   │   ├── Dashboard.tsx     # 仪表盘
│       │   │   ├── Order.tsx         # 订单管理
│       │   │   ├── Product.tsx       # 商品管理
│       │   │   ├── Finance.tsx       # 财务报表
│       │   │   └── System.tsx        # 系统管理
│       │   ├── store/                # Zustand 状态管理
│       │   │   ├── useAuthStore.ts   # 认证状态
│       │   │   └── useThemeStore.ts  # 主题状态
│       │   ├── api/                  # API 封装
│       │   │   └── axios.ts          # Axios 实例
│       │   ├── router/               # 路由配置
│       │   ├── i18n/                 # 国际化配置
│       │   ├── main.tsx              # 应用入口
│       │   └── index.css             # 全局样式
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
│
└── docs/                              # 文档
    ├── database-design.md             # 数据库设计
    └── architecture.md                # 系统架构设计
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.x
- JDK >= 17
- Maven >= 3.8.x

### 后端启动

```bash
cd backend

# Maven 构建
mvn clean install

# 启动应用 (默认端口 8080)
mvn spring-boot:run
```

后端启动后访问：
- H2控制台: http://localhost:8080/api/h2-console
- JDBC URL: `jdbc:h2:mem:omsdb`
- 用户名: `sa`
- 密码: (空)

### 前端启动

```bash
cd frontend/main-app

# 安装依赖
npm install

# 启动开发服务器 (端口 5173)
npm run dev
```

### 默认账号
- 用户名: `admin`
- 密码: `admin123`

## 🎯 核心功能

### 1. 多租户架构 ✓
- 基于 tenant_id 的数据完全隔离
- 支持企业级多租户模式
- 租户独立配置管理

### 2. 订单管理 ✓
- 订单创建/编辑
- 多级审批流程
- 订单取消/退款
- 订单状态追踪
- 订单导出功能

### 3. 商品管理 ✓
- SKU 全生命周期管理
- 库存实时同步
- 价格策略 (阶梯价/会员价/时间价)
- 商品分类管理
- 库存预警机制

### 4. 财务报表 ✓
- 月度/年度报表统计
- 同比/环比对比分析
- Excel/PDF 报表导出
- 营收趋势可视化
- 成本利润深度分析

### 5. 权限系统 ✓
- RBAC 权限模型
- 部门级联权限控制
- 页面级权限控制
- 按钮级细粒度权限
- 数据权限自动隔离

### 6. 消息通知 ✓
- WebSocket 实时推送
- 邮件通知集成
- 短信通知集成
- 站内消息中心

### 7. 数据看板 ✓
- ECharts 丰富图表库
- 拖拽式自定义布局
- 多维度数据分析
- 实时数据自动更新

### 8. 前端高级特性 ✓
- 亮色/暗色主题切换
- 响应式布局 (PC/Pad/Phone)
- Service Worker 离线缓存
- IndexedDB 本地存储
- 多语言国际化 (中/英/日)

## 🔧 核心配置

### 后端配置 (application.yml)
```yaml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:h2:mem:omsdb
    username: sa
    password:
jwt:
  secret: your-secret-key
  expiration: 86400000
```

### 前端环境变量
```env
VITE_API_BASE_URL=/api
VITE_WS_URL=ws://localhost:8080/api/ws
```

## 📊 数据库

数据库采用 H2 内存数据库，核心表包括：
- **tenants** - 租户表
- **users** - 用户表
- **roles** - 角色表
- **permissions** - 权限表
- **products** - 商品表
- **orders** - 订单表
- **order_items** - 订单明细表

详细数据库设计请参考 `docs/database-design.md`

## 🔐 安全机制

### 认证
- JWT Token 无状态认证
- Token 自动刷新机制
- 登录失败账号锁定

### 授权
- 基于 RBAC 的细粒度权限控制
- 接口级别权限校验
- 基于 tenant_id 的数据行级隔离

### 数据安全
- BCrypt 密码加密存储
- 敏感数据自动脱敏
- SQL 注入防护
- XSS 跨站脚本防护

## 📈 扩展能力

### 微前端架构
系统预留微前端架构扩展能力，可拆分为：
- `main-app` - 主应用 (基座)
- `order-app` - 订单管理子应用
- `product-app` - 商品管理子应用
- `finance-app` - 财务报表子应用

### 中间件集成
系统已预留集成接口：
- Redis 缓存
- Seata 分布式事务
- SkyWalking 全链路追踪
- Elasticsearch 全文搜索

## 📚 文档

- [数据库设计文档](./docs/database-design.md)
- [系统架构设计](./docs/architecture.md)

## 📝 License

MIT
