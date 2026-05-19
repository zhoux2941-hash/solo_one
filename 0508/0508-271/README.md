# 汽修门店业务管理平台

面向中小型汽修门店的业务管理系统，后端采用 SpringBoot 架构，前端使用 Vue3 + Element Plus，本地开发使用 H2 数据库。

## 功能特性

### 核心业务模块
1. **客户管理** - 车主客户信息管理
2. **车辆档案** - 车辆车架号、行驶里程等专属档案建立
3. **维修工单** - 车辆进厂检测、故障登记、维保项目开单报价、派工施工、竣工质检、结算收款
4. **配件库存** - 配件入库、领用出库、库存余量预警
5. **数据统计** - 月度维保营收统计、热门维修项目排行、客户复购数据分析

### 工单流程状态闭环
- CREATED (已创建) → ASSIGNED (已派工) → WORKING (施工中) → COMPLETED (已完工) → SETTLED (已结算)

## 技术栈

### 后端
- Spring Boot 2.7.18
- Spring Data JPA
- H2 Database
- Lombok

### 前端
- Vue 3.4
- Vue Router 4.2
- Element Plus 2.4
- Axios 1.6
- Vite 5.0

## 项目结构

```
auto-repair-shop/
├── backend/                 # 后端 SpringBoot 项目
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/autorepair/
│   │   │   │   ├── entity/      # 数据实体
│   │   │   │   ├── repository/  # 数据访问层
│   │   │   │   ├── service/     # 业务逻辑层
│   │   │   │   ├── controller/  # 控制层
│   │   │   │   ├── config/      # 配置类
│   │   │   │   ├── common/      # 公共类
│   │   │   │   └── AutoRepairApplication.java
│   │   │   └── resources/
│   │   │       └── application.yml
│   └── pom.xml
└── frontend/                # 前端 Vue3 项目
    ├── src/
    │   ├── views/               # 页面组件
    │   ├── router/              # 路由配置
    │   ├── api/                 # API 接口
    │   ├── App.vue
    │   └── main.js
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 快速开始

### 后端启动

1. 进入后端目录：
```bash
cd backend
```

2. 使用 Maven 构建并运行：
```bash
mvn spring-boot:run
```

3. 后端服务启动后访问：
- 应用接口：http://localhost:8080
- H2 数据库控制台：http://localhost:8080/h2-console
  - JDBC URL: jdbc:h2:file:./data/autorepair
  - 用户名: sa
  - 密码: (空)

### 前端启动

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 访问前端应用：http://localhost:3000

## 数据实体

### Customer (客户表)
- 客户名称、联系电话、微信号、地址、备注

### Vehicle (车辆档案表)
- 客户ID、车牌号、车架号、品牌、型号、颜色、行驶里程、发动机号

### Part (配件库存表)
- 配件编号、名称、品牌、规格、单位、进价、售价、库存、预警库存、存放位置

### WorkOrder (维修工单表)
- 工单号、客户信息、车辆信息、故障描述、维修项目、工时费、配件费、总金额、状态、维修技师

### WorkRecord (施工记录表)
- 工单ID、操作内容、操作人、操作时间

## API 接口

### 客户管理
- GET /api/customer/list - 获取客户列表
- GET /api/customer/search?keyword=xxx - 搜索客户
- POST /api/customer/save - 保存客户
- DELETE /api/customer/{id} - 删除客户

### 车辆管理
- GET /api/vehicle/list - 获取车辆列表
- GET /api/vehicle/customer/{customerId} - 获取客户的车辆
- GET /api/vehicle/search?keyword=xxx - 搜索车辆
- POST /api/vehicle/save - 保存车辆
- DELETE /api/vehicle/{id} - 删除车辆

### 配件管理
- GET /api/part/list - 获取配件列表
- GET /api/part/warning - 获取库存预警配件
- POST /api/part/save - 保存配件
- POST /api/part/stockIn/{id} - 入库
- POST /api/part/stockOut/{id} - 出库
- DELETE /api/part/{id} - 删除配件

### 工单管理
- GET /api/workorder/list - 获取工单列表
- GET /api/workorder/status/{status} - 按状态获取工单
- GET /api/workorder/search?keyword=xxx - 搜索工单
- POST /api/workorder/create - 创建工单
- POST /api/workorder/{id}/assign - 派工
- POST /api/workorder/{id}/start - 开始施工
- POST /api/workorder/{id}/complete - 完成施工
- POST /api/workorder/{id}/settle - 结算收款
- GET /api/workorder/{id}/records - 获取施工记录

### 统计分析
- GET /api/statistics/dashboard - 数据看板统计
- GET /api/statistics/monthly - 月度统计