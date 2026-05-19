# 生鲜社区团购配送 Web 管理系统

全栈生鲜社区团购配送管理系统，采用 SpringBoot + Vue + UniApp 技术栈，支持三端权限区分（用户端、团长端、管理端）。

## 项目结构

```
0508-262/
├── backend/                 # SpringBoot 后端项目
│   ├── src/main/java/com/community/buying/
│   │   ├── entity/          # 实体类
│   │   ├── repository/      # 数据访问层
│   │   ├── service/         # 业务逻辑层
│   │   ├── controller/      # 控制器层
│   │   ├── config/          # 配置类
│   │   ├── security/        # 安全认证（JWT）
│   │   └── dto/             # 数据传输对象
│   └── src/main/resources/
│       └── application.yml  # 配置文件
│
├── admin-vue/              # Vue 管理后台
│   ├── src/
│   │   ├── views/           # 页面组件
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # 状态管理
│   │   └── utils/           # 工具函数
│   └── package.json
│
└── uniapp-frontend/        # UniApp 小程序前端
    ├── pages/               # 页面
    ├── manifest.json        # 应用配置
    └── pages.json           # 页面路由
```

## 功能模块

### 1. 用户权限系统
- ✅ JWT 身份认证
- ✅ 角色权限管理（管理员/团长/普通用户）
- ✅ 三端权限区分

### 2. 商品管理
- ✅ 商品分类管理
- ✅ 商品上架/下架
- ✅ 商品信息编辑
- ✅ 推荐商品设置

### 3. 团购活动
- ✅ 开团创建
- ✅ 拼团参与
- ✅ 限时折扣配置
- ✅ 活动状态管理

### 4. 订单管理
- ✅ 用户下单
- ✅ 支付模拟
- ✅ 订单分拣状态更新
- ✅ 配送状态跟踪

### 5. 团长门店管理
- ✅ 门店信息管理
- ✅ 团长权限控制
- ✅ 门店订单查看

### 6. 配送路线分配
- ✅ 配送路线创建
- ✅ 路线分配订单
- ✅ 配送人员管理

### 7. 售后退款
- ✅ 退款申请提交
- ✅ 退款审核处理
- ✅ 退款状态跟踪

### 8. 数据可视化
- ✅ 订单统计报表
- ✅ 销售趋势图表
- ✅ 仪表盘数据展示

## 技术栈

### 后端
- **框架**: Spring Boot 2.7.x
- **数据库**: H2 内存数据库
- **ORM**: Spring Data JPA
- **认证**: Spring Security + JWT
- **接口风格**: RESTful API

### 管理后台
- **框架**: Vue 3
- **构建工具**: Vite
- **UI 组件**: Element Plus
- **状态管理**: Pinia
- **图表**: ECharts

### 前端（小程序）
- **框架**: UniApp
- **跨平台**: 支持微信小程序、H5、App等

## 快速开始

### 后端启动

1. 进入后端目录
```bash
cd backend
```

2. 使用 Maven 构建运行
```bash
mvn spring-boot:run
```

3. 服务启动后访问：
   - API 地址: http://localhost:8080
   - H2 控制台: http://localhost:8080/h2-console

### 管理后台启动

1. 进入管理后台目录
```bash
cd admin-vue
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 访问 http://localhost:3000

### UniApp 前端启动

1. 使用 HBuilderX 打开 `uniapp-frontend` 目录
2. 选择运行到小程序或 H5

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 团长 | leader | 123456 |
| 普通用户 | user | 123456 |

## API 接口说明

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册

### 商品接口
- `GET /api/products/public/list` - 获取商品列表（公开）
- `GET /api/products/public/{id}` - 获取商品详情
- `POST /api/products` - 新增商品（管理员）
- `PUT /api/products/{id}` - 编辑商品（管理员）
- `PUT /api/products/{id}/status` - 更新商品状态（管理员）

### 订单接口
- `POST /api/orders` - 创建订单
- `POST /api/orders/{id}/pay` - 模拟支付
- `GET /api/orders/user/{userId}` - 获取用户订单
- `PUT /api/orders/{id}/sort-status` - 更新分拣状态
- `PUT /api/orders/{id}/delivery-status` - 更新配送状态

### 统计接口
- `GET /api/statistics/dashboard` - 仪表盘数据
- `GET /api/statistics/order-trend` - 订单趋势

## 开发说明

### 后端开发
- 实体类位于 `entity/` 目录
- Repository 接口位于 `repository/` 目录
- 业务逻辑在 `service/` 目录实现
- API 接口在 `controller/` 目录定义

### 前端开发
- Vue 管理后台页面位于 `admin-vue/src/views/`
- UniApp 页面位于 `uniapp-frontend/pages/`
- API 请求统一使用封装的 request 工具

## 注意事项

1. H2 为内存数据库，重启后数据会重置
2. 系统会自动初始化测试数据
3. JWT Token 有效期需在配置文件中调整
4. 生产环境建议更换为 MySQL/PostgreSQL

## 许可证

MIT License
