# 在线考试答题系统

基于 SpringBoot + Vite + Vue3 + H2 数据库的企业员工在线考试系统

## 功能特性

### 后端功能
- 用户管理（管理员/考生角色区分）
- 题库管理（单选、多选、判断、简答题）
- 题库批量导入
- 试卷管理（手动组卷/自动组卷）
- 考试场次管理
- 答题实时保存
- 自动判分
- 成绩排名统计
- 考试记录回溯

### 前端功能
- 登录页面（权限区分）
- 管理员后台
  - 数据统计看板
  - 题库管理（增删改查、批量导入）
  - 试卷管理（创建、自动组卷）
  - 考试场次管理
  - 成绩查询与排名
  - 用户管理
- 考生端
  - 考试列表
  - 答题页面（实时保存、倒计时、防切屏）
  - 考试记录与成绩回顾

### 核心功能
- 答题实时自动保存
- 考试倒计时强制交卷
- 答题页面全屏模式
- 切屏检测与警告
- 自动判分和成绩统计

## 技术栈

### 后端
- SpringBoot 3.2.0
- Spring Data JPA
- H2 Database
- Lombok

### 前端
- Vue 3.3
- Vite 5.0
- Vue Router 4
- Pinia
- Element Plus
- Axios

## 快速开始

### 环境要求
- JDK 17+
- Node.js 16+
- Maven

### 后端启动

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

H2控制台：http://localhost:8080/h2-console

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 http://localhost:3000 启动

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 考生 | user1 | 123456 |

## 使用流程

1. **管理员端**
   - 登录系统
   - 进入题库管理，添加题目或批量导入示例题目
   - 进入试卷管理，创建试卷或使用自动组卷功能
   - 进入考试管理，创建考试场次
   - 查看成绩和排名

2. **考生端**
   - 登录系统
   - 在"我的考试"中选择进行中的考试
   - 进入答题页面，开始答题
   - 答完后提交试卷，查看成绩

## 项目结构

```
online-exam/
├── backend/                    # 后端项目
│   ├── src/main/java/com/exam/
│   │   ├── entity/            # 实体类
│   │   ├── repository/        # 数据访问层
│   │   ├── service/           # 业务逻辑层
│   │   ├── controller/        # 控制层
│   │   ├── config/            # 配置类
│   │   └── common/            # 公共类
│   └── src/main/resources/
│       └── application.yml    # 配置文件
└── frontend/                   # 前端项目
    ├── src/
    │   ├── views/             # 页面组件
    │   ├── stores/            # Pinia状态管理
    │   ├── router/            # 路由配置
    │   ├── api/               # API接口
    │   └── utils/             # 工具函数
    └── vite.config.js         # Vite配置
```
