# 动物园鸟类禽流感监测与隔离预警系统

## 项目简介

本系统是专为动物园兽医站设计的鸟类禽流感监测与隔离预警管理平台，包含前端（原生HTML/JS）和后端（Java Spring Boot）两部分。

## 功能特性

### 1. 鸟类个体档案管理
- 鸟类编号、品种、笼舍编号
- 疫苗接种日期记录
- 抗体滴度监测
- 健康状态追踪
- 隔离状态管理

### 2. 监测数据录入
- 体温监测记录
- 粪便样本PCR检测结果
- 周边野生鸟类观测数量统计
- 监测时间和备注

### 3. 自动预警规则
- **一级预警（立即隔离）**：体温 > 41℃ 或 PCR检测阳性
- **二级预警（加强消毒）**：周边野生鸟类异常增多（同比 +200%）

### 4. 统计报表
- 各品种疫苗接种率统计
- 预警触发统计（按级别、类型分类）

## 技术栈

### 后端
- Java 11
- Spring Boot 2.7.x
- Spring Data JPA
- H2 内存数据库

### 前端
- 原生 HTML5
- 原生 JavaScript (ES6+)
- CSS3 (Grid/Flexbox 布局)

## 项目结构

```
0508-249/
├── backend/                 # 后端项目
│   ├── pom.xml             # Maven配置
│   └── src/
│       └── main/
│           ├── java/com/zoo/monitoring/
│           │   ├── entity/          # 实体类
│           │   ├── repository/      # 数据访问层
│           │   ├── service/         # 业务逻辑层
│           │   └── controller/      # 控制层
│           └── resources/
│               └── application.properties  # 应用配置
└── frontend/               # 前端项目
    └── index.html          # 主页面
```

## 快速开始

### 环境要求
- JDK 11+
- Maven 3.6+

### 启动后端服务

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### H2数据库控制台
访问 `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:zoodb`
- 用户名: `sa`
- 密码: (空)

### 访问前端

直接用浏览器打开 `frontend/index.html` 文件即可

## API接口说明

### 鸟类档案 API
- `GET /api/birds` - 获取所有鸟类
- `GET /api/birds/{id}` - 获取指定鸟类
- `POST /api/birds` - 新增鸟类
- `PUT /api/birds/{id}` - 更新鸟类信息
- `PUT /api/birds/{id}/quarantine` - 设置隔离状态

### 监测数据 API
- `GET /api/monitoring` - 获取所有监测数据
- `GET /api/monitoring/bird/{birdId}` - 获取指定鸟类的监测数据
- `POST /api/monitoring` - 新增监测数据（自动触发预警检查）

### 预警中心 API
- `GET /api/alerts` - 获取所有预警
- `GET /api/alerts/unhandled` - 获取未处理预警
- `PUT /api/alerts/{id}/handle` - 标记预警已处理

### 统计报表 API
- `GET /api/reports/vaccination-rate` - 获取疫苗接种率报表
- `GET /api/reports/alert-statistics?days=30` - 获取预警统计

## 使用说明

1. **新增鸟类档案**：在"鸟类档案"页面点击"新增鸟类"按钮，填写信息后保存
2. **录入监测数据**：在"监测数据"页面点击"新增监测"，选择鸟类并填写监测数据，系统自动检查预警规则
3. **处理预警**：在"预警中心"页面查看所有预警，对未处理的预警点击"标记处理"
4. **查看报表**：在"统计报表"页面查看疫苗接种率和预警触发统计

## 注意事项

- 系统使用H2内存数据库，重启服务后数据会丢失
- 预警规则在监测数据提交时自动执行
- 野生鸟类异常增多的判断基于最近一周历史数据平均值
