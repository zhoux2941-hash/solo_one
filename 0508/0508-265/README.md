# 工业产线设备运维工单协同系统

## 项目简介

这是一个完整的工业内网专用产线运维工单协同管理系统，采用前后端分离架构开发。

### 技术栈

**后端：**
- Spring Boot 2.7.x
- Spring Data JPA
- H2 数据库 (内嵌)
- WebSocket (STOMP)
- 内网IP访问控制

**前端：**
- Vue 3
- Pinia (状态管理)
- Vue Router
- Element Plus
- Axios
- SockJS + STOMP.js

## 功能特性

### 前端模块
1. **工单创建模块** - 创建设备维修工单
2. **设备台账查看模块** - 查看所有设备信息和状态
3. **多级审批流转模块** - 班组-组长-管理员三级审批
4. **运维人员排班模块** - 运维人员排班管理
5. **异常消息弹窗提醒模块** - WebSocket实时推送设备告警

### 后端模块
1. **设备数据接入模块** - 设备数据管理和模拟告警
2. **工单流程引擎模块** - 工单状态流转管理
3. **审批权限校验模块** - 多级审批权限控制
4. **消息推送模块** - WebSocket实时消息推送
5. **H2数据持久化模块** - 所有数据持久化存储

## 快速开始

### 环境要求
- JDK 11+
- Node.js 16+
- Maven 3.6+

### 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

H2控制台: http://localhost:8080/h2-console
- JDBC URL: jdbc:h2:file:./data/workorder
- 用户名: admin
- 密码: admin

### 启动前端

```bash
cd frontend
npm install
npm run serve
```

前端服务将在 http://localhost:3000 启动

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 组长 | leader | leader123 |
| 运维人员 | worker1 | worker123 |
| 运维人员 | worker2 | worker123 |

## 项目结构

```
.
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/industrial/workorder/
│   │   │   │   ├── controller/    # 控制器层
│   │   │   │   ├── service/       # 服务层
│   │   │   │   ├── repository/    # 数据访问层
│   │   │   │   ├── entity/        # 实体类
│   │   │   │   ├── config/        # 配置类
│   │   │   │   └── WorkorderApplication.java
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   └── test/
│   └── pom.xml
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── components/         # 组件
│   │   ├── views/              # 页面视图
│   │   ├── router/             # 路由
│   │   ├── store/              # 状态管理
│   │   ├── api/                # API接口
│   │   ├── utils/              # 工具函数
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 核心功能说明

### 工单审批流程

```
创建工单 → 组长审批 → 管理员审批 → 运维人员认领 → 维修处理 → 填写维修记录 → 工单完成
```

### 设备告警推送

系统会自动模拟设备异常告警，通过WebSocket实时推送到前端，并可以一键生成运维工单。

### 内网权限控制

后端过滤器会校验客户端IP，仅允许内网网段访问：
- 192.168.0.0/16
- 10.0.0.0/8
- 172.16.0.0/12
- 127.0.0.1/32 (本地)

## 打包部署

### 后端打包

```bash
cd backend
mvn clean package
java -jar target/workorder-system-1.0.0.jar
```

### 前端打包

```bash
cd frontend
npm run build
```

将dist目录部署到Web服务器即可。

## 注意事项

1. 本系统设计为内网专用，部署时请确保网络环境安全
2. H2数据库文件默认保存在 backend/data 目录，请定期备份
3. 生产环境建议修改默认密码和数据库配置
