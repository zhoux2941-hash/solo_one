# 作业管理系统

基于 Spring Boot + 原生 HTML/JS 的作业管理系统，支持教师布置作业、学生提交、在线批改、成绩统计等功能。

## 功能特性

### 教师端
- ✅ 布置作业（标题、截止时间、附件要求）
- ✅ 查看学生提交的作业
- ✅ 在线批改作业（0-100分 + 评语）
- ✅ 班级成绩分布直方图（优/良/中/差占比）

### 学生端
- ✅ 查看待完成的作业
- ✅ 在线提交作业（文字内容 + 附件）
- ✅ 查看作业成绩和教师评语
- ✅ 查看历史成绩和班级排名百分位
- ✅ 查看平均分等统计数据

## 技术栈

- **后端**: Spring Boot 2.7.x + Spring Data JPA + H2 Database
- **前端**: 原生 HTML5 + CSS3 + JavaScript (ES6+)
- **构建工具**: Maven

## 快速开始

### 环境要求
- JDK 8+
- Maven 3.6+

### 启动方式

#### 方式一：使用 Maven 启动
```bash
# 进入项目目录
cd 0508-193

# 编译并启动
mvn spring-boot:run
```

#### 方式二：打包后运行
```bash
# 打包
mvn clean package

# 运行
java -jar target/homework-system-1.0.0.jar
```

### 访问系统

启动成功后，访问以下地址：

- **系统首页**: http://localhost:8080/index.html
- **H2数据库控制台**: http://localhost:8080/h2-console

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 教师 | teacher | 123456 |
| 学生 | student1 ~ student8 | 123456 |

## 项目结构

```
0508-193/
├── src/
│   ├── main/
│   │   ├── java/com/homework/
│   │   │   ├── HomeworkSystemApplication.java    # 启动类
│   │   │   ├── entity/                           # 实体类
│   │   │   │   ├── User.java                     # 用户实体
│   │   │   │   ├── Homework.java                 # 作业实体
│   │   │   │   └── Submission.java               # 提交实体
│   │   │   ├── repository/                       # 数据访问层
│   │   │   ├── service/                          # 业务逻辑层
│   │   │   └── controller/                       # 控制层
│   │   └── resources/
│   │       ├── application.properties             # 配置文件
│   │       └── static/                           # 前端静态资源
│   │           ├── index.html                    # 登录页
│   │           ├── teacher.html                  # 教师端
│   │           ├── student.html                  # 学生端
│   │           └── js/
│   │               ├── common.js                 # 公共工具函数
│   │               ├── teacher.js                # 教师端逻辑
│   │               └── student.js                # 学生端逻辑
├── pom.xml                                        # Maven配置
└── README.md
```

## API 接口

### 用户接口
- `POST /api/users/login` - 用户登录

### 作业接口
- `POST /api/homeworks` - 创建作业
- `GET /api/homeworks/teacher/{teacherId}` - 教师作业列表
- `GET /api/homeworks/class/{className}` - 班级作业列表
- `GET /api/homeworks/{id}` - 作业详情

### 提交接口
- `POST /api/submissions/submit` - 提交作业
- `POST /api/submissions/grade/{id}` - 批改作业
- `GET /api/submissions/homework/{homeworkId}` - 作业提交列表
- `GET /api/submissions/student/{studentId}` - 学生提交列表
- `GET /api/submissions/homework/{homeworkId}/distribution` - 成绩分布
- `GET /api/submissions/student/{studentId}/stats` - 学生成绩统计

## 成绩等级说明

| 等级 | 分数范围 | 颜色标识 |
|------|----------|----------|
| 优 | 90-100分 | 🟢 绿色 |
| 良 | 80-89分 | 🔵 蓝色 |
| 中 | 60-79分 | 🟡 橙色 |
| 差 | 0-59分 | 🔴 红色 |
