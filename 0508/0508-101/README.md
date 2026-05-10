# 校学生会经费管理系统

一个基于 Vue + Java Spring Boot + MySQL + Redis 的全栈经费管理工具，用于对比活动的预算和决算。

## 功能特性

- **活动管理**：创建活动，填写活动名称、申请部门、预算金额和预算细项
- **决算提交**：活动结束后，负责人填写实际花费和决算细项
- **审批流程**：管理员审批决算，审批通过后活动关闭
- **数据可视化**：使用 ECharts 展示预算 vs 决算柱状图，超出预算的柱子标红
- **部门筛选**：按照部门筛选活动
- **统计分析**：展示部门整体预算执行率（决算总额/预算总额）
- **Redis 缓存**：缓存热门活动的对比数据，提升性能

## 技术栈

### 后端
- Java 11
- Spring Boot 2.7.x
- Spring Data JPA
- Spring Data Redis
- MySQL 8.0
- Lombok

### 前端
- Vue 3
- Vue Router 4
- Vuex 4
- Element Plus
- ECharts 5
- Axios

## 项目结构

```
.
├── backend/                    # 后端 Spring Boot 项目
│   ├── src/
│   │   └── main/
│   │       ├── java/com/studentunion/budgetmanagement/
│   │       │   ├── config/        # 配置类（Redis、CORS）
│   │       │   ├── controller/    # 控制器层
│   │       │   ├── dto/           # 数据传输对象
│   │       │   ├── entity/        # 实体类
│   │       │   ├── repository/    # 数据访问层
│   │       │   └── service/       # 业务逻辑层
│   │       └── resources/
│   │           └── application.yml
│   └── pom.xml
├── frontend/                   # 前端 Vue 项目
│   ├── src/
│   │   ├── api/               # API 接口
│   │   ├── router/            # 路由配置
│   │   ├── store/             # Vuex 状态管理
│   │   ├── views/             # 页面组件
│   │   │   ├── Activities.vue
│   │   │   ├── ActivityDetail.vue
│   │   │   ├── CreateActivity.vue
│   │   │   └── Stats.vue
│   │   ├── App.vue
│   │   └── main.js
│   ├── public/
│   └── package.json
├── database/
│   └── init.sql               # 数据库初始化脚本
└── README.md
```

## 快速开始

### 环境准备

确保已安装以下软件：
- JDK 11+
- Node.js 14+
- MySQL 8.0+
- Redis 5.0+
- Maven 3.6+

### 1. 初始化数据库

```bash
# 登录 MySQL
mysql -u root -p

# 执行初始化脚本
source database/init.sql
```

或者直接在 MySQL 客户端中执行 `database/init.sql` 文件的内容。

### 2. 启动 Redis

```bash
# Windows
redis-server

# Linux/Mac
redis-server
```

### 3. 配置后端

修改 `backend/src/main/resources/application.yml` 中的数据库和 Redis 配置：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/student_union_budget?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: your_password  # 修改为你的 MySQL 密码
  redis:
    host: localhost
    port: 6379
```

### 4. 启动后端

```bash
cd backend

# 使用 Maven 运行
mvn spring-boot:run

# 或者先打包再运行
mvn clean package
java -jar target/budget-management-0.0.1-SNAPSHOT.jar
```

后端服务将在 `http://localhost:8080` 启动。

### 5. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run serve
```

前端服务将在 `http://localhost:8081` 启动。

### 6. 访问应用

打开浏览器访问 `http://localhost:8081`

## 初始测试用户

| 用户名 | 密码 | 角色 | 部门 |
|--------|------|------|------|
| admin | admin123 | 管理员 | 学生会 |
| leader1 | leader123 | 负责人 | 宣传部 |
| leader2 | leader123 | 负责人 | 文艺部 |
| leader3 | leader123 | 负责人 | 体育部 |

## API 接口

### 活动管理

- `GET /api/activities` - 获取所有活动（支持 department 参数筛选）
- `GET /api/activities/{id}` - 获取活动详情
- `POST /api/activities` - 创建活动
- `PUT /api/activities/{id}/submit` - 提交决算
- `PUT /api/activities/{id}/approve` - 审批通过
- `PUT /api/activities/{id}/reject` - 拒绝审批
- `DELETE /api/activities/{id}` - 删除活动

### 统计接口

- `GET /api/activities/departments` - 获取所有部门列表
- `GET /api/activities/stats` - 获取部门统计数据（支持 department 参数筛选）

## 工作流程

1. **创建活动**：社团负责人创建活动，填写预算细项
2. **提交决算**：活动结束后，负责人填写决算细项并提交
3. **审批**：管理员审批决算，可通过或拒绝
4. **查看对比**：在详情页查看预算 vs 决算的柱状图
5. **统计分析**：在统计页查看各部门预算执行率

## Redis 缓存配置

- 活动列表缓存 10 分钟
- 活动详情缓存 10 分钟
- 部门统计数据缓存 10 分钟
- 当活动数据变更时自动清除相关缓存

## 功能截图说明

### 活动列表页
- 展示所有活动，支持按部门筛选
- 显示活动状态（已创建、待审批、已关闭等）
- 超出预算的决算金额标红显示
- 提供提交决算、审批、删除等操作

### 创建活动页
- 填写活动基本信息
- 动态添加预算细项
- 自动计算预算总额

### 活动详情页
- 展示活动基本信息和执行率
- ECharts 柱状图对比预算和决算
- 超出预算的柱子自动标红
- 显示预算细项和决算细项对比

### 统计分析页
- 部门预算执行率统计表格
- 部门预算 vs 决算柱状图
- 部门执行率饼图
- 总体统计数据（总活动数、总预算、总结算、整体执行率）

## 许可证

MIT License
