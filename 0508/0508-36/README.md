# 共享轮椅刹车片磨损同比分析仪

一个全栈应用，用于监控和分析共享轮椅的刹车片磨损状态。

## 项目结构

```
0508-36/
├── backend/                    # Java Spring Boot 后端
│   ├── pom.xml                # Maven 配置
│   └── src/
│       └── main/
│           ├── java/com/wheelchair/
│           │   ├── WheelchairWearAnalyzerApplication.java
│           │   ├── config/
│           │   │   ├── CorsConfig.java
│           │   │   └── DataInitializer.java
│           │   ├── controller/
│           │   │   └── WheelchairController.java
│           │   ├── dto/
│           │   │   ├── WearDataResponse.java
│           │   │   └── YearOverYearResponse.java
│           │   ├── entity/
│           │   │   └── BrakeWearRecord.java
│           │   ├── repository/
│           │   │   └── BrakeWearRepository.java
│           │   └── service/
│           │       └── WheelchairWearService.java
│           └── resources/
│               └── application.yml
└── frontend/                   # Vue 3 前端
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js
        ├── style.css
        ├── App.vue
        └── api/
            └── index.js
```

## 技术栈

### 后端
- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- MySQL
- Lombok

### 前端
- Vue 3.4
- Vite 5
- ECharts 5.4
- Axios

## 快速开始

### 前置条件
- JDK 17+
- Maven 3.6+
- Node.js 18+
- MySQL 8.0+

### 1. 配置数据库

确保 MySQL 已启动，并创建数据库（也可以让应用自动创建）：

```sql
CREATE DATABASE IF NOT EXISTS wheelchair_wear CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

修改后端配置文件 `backend/src/main/resources/application.yml` 中的数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/wheelchair_wear
    username: root
    password: your_password
```

### 2. 启动后端

```bash
cd backend

# 使用 Maven 构建并运行
mvn spring-boot:run

# 或者先构建再运行
mvn clean package
java -jar target/wear-analyzer-1.0.0.jar
```

后端将在 `http://localhost:8080` 启动。

### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 `http://localhost:5173` 启动。

### 4. 访问应用

打开浏览器访问 `http://localhost:5173`

## API 接口

### 获取当前磨损值

- **URL**: `GET /api/wheelchairs/wear`
- **响应**:
```json
[
  {
    "wheelchairId": "W1",
    "currentWear": 45,
    "recordDate": "2026-05-09"
  },
  ...
]
```

### 获取同比增幅

- **URL**: `GET /api/wheelchairs/year-over-year`
- **响应**:
```json
[
  {
    "wheelchairId": "W1",
    "growthRate": 15.23,
    "lastMonthWear": 39,
    "currentMonthWear": 45
  },
  ...
]
```

## 功能特性

- 📊 **双柱状图对比**: 同时展示每辆轮椅的当前磨损值和同比增幅
- 🏷️ **状态标签**: 自动根据磨损值判断状态（正常/注意/需更换）
- 📈 **数据表格**: 详细展示磨损数据和同比计算
- 🎨 **美观界面**: 现代化的 UI 设计，响应式布局
- 🔄 **自动数据初始化**: 启动时自动生成过去 2 个月的模拟数据

## 数据说明

- 系统包含 8 辆轮椅（W1 ~ W8）
- 磨损值范围：0 ~ 100（数值越高磨损越严重）
- 状态阈值：
  - 0 ~ 49：正常（绿色）
  - 50 ~ 69：注意（橙色）
  - 70 ~ 100：需更换（红色）
- 同比增幅计算：对比本月与上月同期的磨损值
