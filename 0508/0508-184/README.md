# 物业维修管理系统

## 功能概述
- 业主报修 → 分配维修工 → 维修工领取备件 → 扣减库存
- 维修工单创建时自动锁定备件库存 30 分钟，超时未领取则释放
- 如果备件不足，系统自动生成采购申请单（状态：待审批）
- 报表：每个维修工的“平均维修时长”和“备件消耗排行”

## 技术栈
- 前端：Vue 2.x + Element UI
- 后端：Java Spring Boot 2.7.x
- 数据库：MySQL

## 项目结构
```
0508-184/
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/property/maintenance/
│   │   │   │   ├── entity/      # 实体类
│   │   │   │   ├── repository/  # 数据访问层
│   │   │   │   ├── service/     # 业务逻辑层
│   │   │   │   ├── controller/  # 控制器
│   │   │   │   └── task/        # 定时任务
│   │   │   └── resources/
│   │   │       ├── schema.sql   # 数据库脚本
│   │   │       └── application.yml
│   └── pom.xml
└── frontend/                # 前端项目
    ├── src/
    │   ├── views/               # 页面组件
    │   ├── router/              # 路由
    │   ├── App.vue
    │   └── main.js
    ├── public/
    └── package.json
```

## 后端启动步骤

### 1. 配置数据库
- 创建 MySQL 数据库：`property_maintenance`
- 修改 `backend/src/main/resources/application.yml` 中的数据库连接信息

### 2. 初始化数据库
执行 `backend/src/main/resources/schema.sql` 中的 SQL 脚本

### 3. 启动后端服务
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
服务启动后访问：http://localhost:8080

## 前端启动步骤

### 1. 安装依赖
```bash
cd frontend
npm install
```

### 2. 启动开发服务器
```bash
npm run serve
```
访问：http://localhost:8081

## 主要功能说明

### 1. 库存锁定机制
- 创建工单时锁定所需备件 30 分钟
- 定时任务每分钟检查过期锁定并自动释放
- 领取备件时确认使用并扣除库存

### 2. 采购申请
- 库存不足时自动创建采购申请单
- 采购数量 = max(短缺数量, 最低库存预警)
- 支持审批/拒绝采购申请

### 3. 报表功能
- 维修工平均维修时长统计
- 维修工备件消耗排行

## API 接口列表

### 维修工单
- POST /api/orders - 创建工单
- PUT /api/orders/{id}/assign - 分配维修工
- PUT /api/orders/{id}/pickup - 领取备件
- PUT /api/orders/{id}/complete - 完成工单
- PUT /api/orders/{id}/cancel - 取消工单
- GET /api/orders - 获取所有工单

### 采购申请
- GET /api/purchase-requests/pending - 获取待审批申请
- PUT /api/purchase-requests/{id}/approve - 审批通过
- PUT /api/purchase-requests/{id}/reject - 拒绝

### 报表
- GET /api/reports/average-repair-duration - 平均维修时长
- GET /api/reports/spare-part-consumption-ranking - 备件消耗排行

## 常见问题

### Q1: 执行 mvn spring-boot:run 报错 "No plugin found for prefix 'spring-boot'"
**原因**：没有在正确的目录下执行命令。
**解决**：必须进入 `backend` 目录后再执行命令：
```bash
cd backend
mvn spring-boot:run
```
或直接双击 `start-backend.bat` 启动脚本。

### Q2: 数据库连接失败
**原因**：MySQL未启动或配置不正确。
**解决**：
1. 确保MySQL服务已启动
2. 检查 `backend/src/main/resources/application.yml` 中的数据库用户名和密码是否正确
3. 确保已创建 `property_maintenance` 数据库

### Q3: npm install 速度慢
**解决**：使用淘宝镜像：
```bash
npm install --registry=https://registry.npmmirror.com
```

### Q4: 前端访问后端跨域问题
**说明**：后端Controller已添加 `@CrossOrigin(origins = "*")` 注解，默认支持跨域访问。
