# 工厂车间生产协同管控系统

## 项目简介

本项目是一个工厂车间生产协同管控Web系统，采用前后端分离架构开发。

## 技术栈

### 后端
- Java 8
- Spring Boot 2.7.x
- Spring Data JPA
- H2 内存数据库
- JWT 认证

### 前端
- 原生 HTML5
- CSS3
- JavaScript (无框架依赖)

## 功能模块

### 组织架构管理
- 车间管理
- 生产线管理
- 班组管理
- 人员管理

### 物料档案管理
- 原材料管理
- 半成品管理
- 辅料管理

## 项目结构

```
0508-220/
├── backend/                    # 后端项目
│   ├── src/
│   │   └── main/
│   │       ├── java/com/factory/
│   │       │   ├── entity/        # 实体类
│   │       │   ├── repository/    # 数据访问层
│   │       │   ├── service/       # 业务逻辑层
│   │       │   ├── controller/    # 控制层
│   │       │   ├── config/        # 配置类
│   │       │   ├── interceptor/   # 拦截器
│   │       │   ├── common/        # 公共类
│   │       │   ├── util/          # 工具类
│   │       │   └── ProductionManagementApplication.java
│   │       └── resources/
│   │           └── application.properties
│   └── pom.xml
├── frontend/                   # 前端项目
│   ├── css/                        # 样式文件
│   ├── js/                         # JavaScript文件
│   ├── pages/                      # 业务页面
│   ├── index.html                  # 主页面
│   └── login.html                  # 登录页面
├── start-backend.bat           # 后端启动脚本
├── start-frontend.bat          # 前端启动脚本
└── README.md
```

## 快速开始

### 环境要求
- JDK 8 或以上
- Maven 3.6 或以上
- 浏览器（推荐Chrome/Edge）

### 启动步骤

#### 方式一：使用启动脚本（推荐）

1. **启动后端**
   ```
   双击运行 start-backend.bat
   ```
   后端服务启动在 http://localhost:8080/api

2. **启动前端**
   ```
   双击运行 start-frontend.bat
   ```
   前端服务启动在 http://127.0.0.1:8081

3. **访问系统**
   - 打开浏览器访问 http://127.0.0.1:8081
   - 默认账号：admin / admin123

#### 方式二：手动启动

1. **启动后端**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **启动前端**
   ```bash
   cd frontend
   
   # 方式1：使用http-server（需要先安装 npm install -g http-server）
   http-server -p 8081
   
   # 方式2：直接用浏览器打开 login.html
   ```

## 系统说明

### 数据库
- 使用H2内存数据库，数据存储在内存中，重启后数据会重置
- H2控制台地址：http://localhost:8080/api/h2-console
- JDBC URL: jdbc:h2:mem:factorydb
- 用户名: admin
- 密码: admin123

### API接口
- 登录接口：POST /api/auth/login
- 车间管理：/api/workshop/**
- 生产线管理：/api/production-line/**
- 班组管理：/api/team/**
- 人员管理：/api/employee/**
- 物料管理：/api/material/**

### 认证方式
- 采用JWT Token认证
- Token需放在请求头 Authorization: Bearer {token}

## 开发说明

### 后端开发规范
- Controller层处理HTTP请求和响应
- Service层处理业务逻辑
- Repository层负责数据持久化
- Entity层定义数据模型

### 前端开发规范
- 公共请求工具：js/request.js
- 表单校验工具：js/validator.js
- 公共样式：css/common.css
- 布局样式：css/layout.css
- 业务页面：pages/*.html