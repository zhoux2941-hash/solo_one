# 文旅景区综合业态运营管理平台

## 项目简介

本项目采用前后端分离架构，提供景区组织架构管理、全员岗位权限管理、业态资源建档管理等功能。

## 技术栈

### 后端
- Java 8
- Spring Boot 2.7.x
- Spring Data JPA
- H2 内存数据库

### 前端
- 原生 HTML5 + CSS3 + JavaScript
- 无框架依赖

## 项目结构

```
0508-219/
├── backend/                    # 后端项目
│   ├── src/
│   │   └── main/
│   │       ├── java/com/scenic/
│   │       │   ├── entity/    # 实体类
│   │       │   ├── repository/ # 数据访问层
│   │       │   ├── service/   # 业务服务层
│   │       │   ├── controller/ # 控制层
│   │       │   ├── config/    # 配置类
│   │       │   └── dto/       # 数据传输对象
│   │       └── resources/
│   └── pom.xml
└── frontend/                   # 前端项目
    ├── css/
    ├── js/
    │   ├── auth/              # 认证模块
    │   ├── utils/             # 工具模块
    │   └── components/        # 页面组件
    └── pages/
```

## 快速启动

### 后端启动

1. 确保已安装 JDK 8+ 和 Maven
2. 进入 backend 目录
3. 执行命令：
   ```bash
   mvn spring-boot:run
   ```
4. 后端服务启动在 http://localhost:8080

### 前端访问

1. 使用浏览器打开 `frontend/pages/login.html`
2. 或使用任意静态文件服务器启动前端项目

## 默认账号

- 用户名：admin
- 密码：admin123

## 功能模块

### 1. 组织架构管理
- 部门管理：景区管理部门的增删改查
- 岗位管理：运营班组及岗位配置
- 员工管理：一线服务人员信息管理

### 2. 业态资源管理
- 业态分类：自然景点、游乐项目、民俗体验馆、休闲商业区等
- 业态资源：各业态资源建档管理，包含开放时段、容纳上限、收费标准、运维负责人等信息

## H2 控制台

访问 http://localhost:8080/h2-console

- JDBC URL: jdbc:h2:mem:scenicdb
- 用户名: admin
- 密码: admin123
