# 暗房胶片冲印管理系统

基于 Spring Boot + 原生 HTML/JS 开发的传统胶片冲印工作室管理系统。

## 功能特点

- 🧪 **耗材管理** - 显影液、定影液等暗房药水库存管理
- 🎞️ **底片登记** - 客户送来的胶卷信息登记管理
- ⚗️ **工序记录** - 显影、停影、定影、水洗、晾干全套流程记录
- 🖼️ **成品归档** - 冲印完成后的照片数量与交付信息记录
- 📊 **数据看板** - 实时统计数据展示

## 技术栈

### 后端
- Java 8
- Spring Boot 2.7.x
- Spring Data JPA
- H2 内存数据库

### 前端
- 原生 HTML5
- CSS3
- 原生 JavaScript (ES6+)

## 项目结构

```
film-processing-system/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/darkroom/film/
│       │       ├── config/          # 配置类
│       │       ├── controller/      # REST API 控制器
│       │       ├── entity/          # 实体类
│       │       ├── repository/      # 数据访问层
│       │       ├── service/         # 业务逻辑层
│       │       └── FilmProcessingApplication.java  # 启动类
│       └── resources/
│           ├── static/
│           │   ├── css/
│           │   │   └── style.css    # 样式文件
│           │   ├── js/
│           │   │   └── app.js       # 前端逻辑
│           │   └── index.html        # 主页面
│           ├── application.properties  # 应用配置
│           ├── schema.sql           # 数据库表结构
│           └── data.sql             # 初始数据
└── pom.xml                           # Maven 配置
```

## 快速开始

### 环境要求
- JDK 8+
- Maven 3.6+

### 启动方式

1. **使用 Maven 启动**
```bash
mvn spring-boot:run
```

2. **访问系统**
- 前端页面：http://localhost:8080/index.html
- H2 控制台：http://localhost:8080/h2-console
  - JDBC URL: jdbc:h2:mem:filmdb
  - 用户名: admin
  - 密码: admin

## API 接口

### 耗材管理
- `GET /api/materials` - 获取所有耗材
- `GET /api/materials/{id}` - 获取单个耗材
- `POST /api/materials` - 新增耗材
- `PUT /api/materials/{id}` - 更新耗材
- `DELETE /api/materials/{id}` - 删除耗材

### 底片管理
- `GET /api/films` - 获取所有底片
- `GET /api/films/{id}` - 获取单个底片
- `POST /api/films` - 新增底片
- `PUT /api/films/{id}` - 更新底片
- `DELETE /api/films/{id}` - 删除底片

### 工序记录
- `GET /api/process-steps` - 获取所有工序
- `GET /api/process-steps/film/{filmId}` - 获取底片的所有工序
- `POST /api/process-steps` - 新增工序

### 成品管理
- `GET /api/finished-products` - 获取所有成品
- `GET /api/finished-products/{id}` - 获取单个成品
- `POST /api/finished-products` - 新增成品
- `PUT /api/finished-products/{id}` - 更新成品

## 使用说明

1. **登记底片** - 在"底片登记"页面录入客户送来的胶卷信息
2. **管理耗材** - 在"耗材管理"页面维护显影液、定影液等库存
3. **记录工序** - 在"工序记录"页面记录每一步冲洗操作
4. **成品归档** - 冲洗完成后，在"成品归档"页面登记照片数量和交付信息

## 状态说明

- **已接收 (RECEIVED)** - 底片刚登记，尚未开始冲洗
- **冲洗中 (PROCESSING)** - 正在进行冲洗工序
- **已完成 (COMPLETED)** - 冲洗完成，等待交付
- **已交付 (DELIVERED)** - 成品已交付给客户

## 许可证

MIT License