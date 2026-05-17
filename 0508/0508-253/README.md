# 新兵军事训练科目考评管理系统

## 项目简介

这是一个全栈 Web 应用系统，用于管理新兵军事训练科目的考评工作。

## 技术栈

### 后端
- Spring Boot 2.7.18
- Spring Data JPA
- H2 Database
- Lombok

### 前端
- Vue 3
- Vue Router 4
- Element Plus
- Axios

## 项目结构
```
.
├── backend/                 # 后端项目
│   ├── src/
│   │   └── main/
│   │       ├── java/com/military/training/
│   │       │   ├── entity/       # 实体类
│   │       │   ├── repository/ # 数据访问层
│   │       │   ├── service/    # 业务逻辑层
│   │       │   └── controller/   # 控制层
│   │       └── resources/
│   └── pom.xml
└── frontend/                # 前端项目
    ├── src/
    │   ├── api/            # API 接口
    │   ├── views/          # 页面组件
    │   ├── router/         # 路由配置
    │   ├── App.vue
    │   └── main.js
    └── package.json
    └── public/
```

## 功能模块

1. **训练科目库管理**
   - 科目分类（队列、战术、体能、射击）
   - 科目增删改查
   - 按分类筛选

2. **参训人员信息建档**
   - 人员信息管理
   - 批量导入功能
   - 按排、班筛选

3. **单项科目成绩录入**
   - 成绩录入与编辑
   - 按人员/科目筛选
   - 成绩等级标记

4. **综合素养评分**
   - 自动计算总分、平均分
   - 等级评定（优秀、良好、中等、及格、不及格）

5. **训练成绩排名统计**
   - 总分排名
   - 按排统计
   - 各等级人数统计

6. **训练短板分析**
   - 个人薄弱科目分析
   - 全员薄弱科目统计
   - 针对性训练建议

## 快速开始

### 后端启动

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

H2 数据库控制台: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/training`
- 用户名: `admin`
- 密码: `admin`

### 前端启动

```bash
cd frontend
npm install
npm run serve
```

前端服务将在 `http://localhost:8080` 或其他端口启动