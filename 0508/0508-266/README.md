# 军工涉密装备出入库管理系统

## 项目简介

基于 SpringBoot + Vue3 + Element Plus + H2 嵌入式数据库的全栈 Web 管理系统，专为军工涉密装备出入库管理设计，支持四级角色权限隔离、全流程审批留痕、内网离线部署。

## 技术栈

### 后端技术
- **框架**: SpringBoot 2.7.18
- **ORM**: MyBatis-Plus 3.5.3.1
- **数据库**: H2 嵌入式数据库
- **认证**: JWT
- **安全**: XSS防护、请求限流、SQL注入防护
- **工具**: Hutool、EasyExcel

### 前端技术
- **框架**: Vue 3
- **UI组件**: Element Plus
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **HTTP客户端**: Axios

## 系统功能

### 1. 四级角色权限体系
- **系统管理员 (ADMIN)**: 全权限管理，用户、角色、菜单配置
- **库管专员 (WAREHOUSE_KEEPER)**: 装备管理、库存盘点、入库审批
- **涉密审核员 (AUDITOR)**: 涉密装备二级审批、日志审计
- **一线领用人员 (OPERATOR)**: 装备领用申请、个人申请记录查看

### 2. 装备全生命周期管理
- 装备台账管理（增删改查）
- RFID唯一标识溯源
- 涉密等级管理（非密/秘密/机密/绝密）
- 实时库存状态监控
- 多条件模糊查询、分页导出

### 3. 审批流程管理
- **三级审批流程**: 领用申请 -> 库管审批 -> 涉密审核
- 支持领用、归还、调拨三种申请类型
- 审批支持驳回、撤回操作
- 全程留痕，记录经办人、审批人、时间戳

### 4. 日志审计
- 操作日志全记录
- 支持按模块、类型、状态查询
- 日志导出功能
- 防篡改设计

### 5. 安全特性
- XSS攻击防护
- 请求频率限流
- JWT无状态认证
- 数据软删除（不物理删除）
- 行级数据权限隔离

## 项目结构

```
equipment-management/
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/military/equipment/
│   │   │   │   ├── annotation/     # 自定义注解
│   │   │   │   ├── aspect/         # AOP切面
│   │   │   │   ├── common/         # 通用类
│   │   │   │   ├── config/         # 配置类
│   │   │   │   ├── controller/     # 控制器
│   │   │   │   ├── dto/            # 数据传输对象
│   │   │   │   ├── entity/         # 实体类
│   │   │   │   ├── exception/      # 异常处理
│   │   │   │   ├── filter/         # 过滤器
│   │   │   │   ├── interceptor/    # 拦截器
│   │   │   │   ├── mapper/         # 数据访问层
│   │   │   │   ├── service/        # 业务逻辑层
│   │   │   │   ├── util/           # 工具类
│   │   │   │   └── vo/             # 视图对象
│   │   │   └── resources/
│   │   │       ├── mapper/          # MyBatis XML
│   │   │       ├── sql/             # 数据库初始化脚本
│   │   │       └── application.yml  # 配置文件
│   └── pom.xml
└── frontend/                   # 前端项目
    ├── src/
    │   ├── api/                  # API接口
    │   ├── layout/               # 布局组件
    │   ├── router/               # 路由配置
    │   ├── store/                # 状态管理
    │   ├── utils/                # 工具类
    │   ├── views/                # 页面组件
    │   ├── App.vue
    │   └── main.js
    ├── public/
    └── package.json
```

## 数据库设计

核心数据表：
1. **sys_user**: 用户表
2. **sys_role**: 角色表
3. **sys_menu**: 菜单表
4. **sys_user_role**: 用户角色关联表
5. **sys_role_menu**: 角色菜单关联表
6. **equipment**: 装备表
7. **approval_process**: 审批流程表
8. **operation_log**: 操作日志表

## 快速开始

### 环境要求
- JDK 11+
- Node.js 14+
- Maven 3.6+

### 后端启动

1. 进入后端目录
```bash
cd backend
```

2. 编译项目
```bash
mvn clean package
```

3. 运行项目
```bash
java -jar target/equipment-management-1.0.0.jar
```

或使用Maven直接运行：
```bash
mvn spring-boot:run
```

后端服务启动后访问：
- API接口: http://localhost:8080/api
- H2控制台: http://localhost:8080/h2-console
  - JDBC URL: jdbc:h2:file:./data/equipment_db
  - 用户名: admin
  - 密码: Military@2024

### 前端启动

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run serve
```

前端访问: http://localhost:3000

### 测试账号

系统预置四个测试账号，密码均为：`admin123`

| 用户名 | 角色 | 说明 |
|--------|------|------|
| admin | 系统管理员 | 全权限 |
| warehouse | 库管专员 | 装备管理、入库审批 |
| auditor | 涉密审核员 | 二级审批、日志审计 |
| operator | 一线领用人员 | 领用申请 |

## 内网离线部署

### 后端打包部署
1. 编译打包：`mvn clean package`
2. 复制 `target/equipment-management-1.0.0.jar` 到目标服务器
3. 运行：`java -jar equipment-management-1.0.0.jar`

### 前端打包部署
1. 构建生产版本：`npm run build`
2. 复制 `dist` 目录内容到 Web 服务器（Nginx/Apache）
3. 配置反向代理到后端API

### Nginx配置示例
```nginx
server {
    listen 80;
    server_name equipment.example.com;

    root /var/www/equipment/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 核心特性说明

### 1. 权限控制
- 后端：拦截器实现认证，业务层判断角色权限
- 前端：路由守卫 + 角色判断动态显示菜单和按钮

### 2. 审批流程
```
领用申请 -> 库管审批(step 1) -> 涉密审核(step 2) -> 完成
              ↓                        ↓
            驳回                    驳回
```

### 3. 数据安全
- 所有删除操作均为软删除（逻辑删除）
- H2数据库文件加密存储
- 操作日志全程记录，不可篡改

### 4. XSS防护
- 全局过滤器过滤请求参数
- 特殊字符转义处理

### 5. 请求限流
- 基于Guava Cache实现IP+接口级别的限流
- 默认限制：100次/分钟

## 开发说明

### 后端开发规范
- Controller层：参数校验、统一返回格式
- Service层：业务逻辑、事务控制
- Mapper层：数据访问，继承BaseMapper
- Entity层：实体类，公共字段继承BaseEntity

### 前端开发规范
- API统一封装在 `src/api` 目录
- 路由按模块组织
- 状态管理使用 Pinia
- UI组件统一使用 Element Plus

## 常见问题

### 1. H2数据库无法访问
- 检查 `data` 目录是否有读写权限
- 确认 JDBC URL 配置正确

### 2. 跨域问题
- 后端已配置 CorsRegistry，开发环境使用代理
- 生产环境建议通过 Nginx 统一部署

### 3. 密码加密
- 当前版本使用固定密码测试，生产环境需启用BCrypt
- 可在 `AuthService.java` 中恢复密码加密逻辑

## 版本信息

- 当前版本：v1.0.0
- 发布日期：2024
- 适用环境：内网隔离环境部署

## 技术支持

如有问题，请检查：
1. 后端日志：查看控制台输出
2. 前端日志：浏览器开发者工具 Console
3. 数据库：通过H2控制台检查表数据
