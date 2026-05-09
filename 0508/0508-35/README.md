# 公厕厕纸余量智能感知可视化看板

## 项目简介

某公园有6个独立公厕（编号 WC01~WC06），每个公厕内部有3个厕位（A/B/C）。本项目实现了公厕厕纸余量的智能感知可视化系统，支持：

- 嵌套网格图展示（3×2公厕网格 → 点击展开显示3个厕位详情）
- 厕纸剩余百分比实时展示
- 模拟传感器数据（mock 随机生成）
- 周末人流高峰模式（周末余量下降更快）
- 每10秒自动更新余量（模拟消耗）
- 响应式设计

## 技术栈

### 后端
- Java 8
- Spring Boot 2.7.18
- Spring Data JPA
- MySQL 8.x
- Maven

### 前端
- Vue 3.4
- Vite 5
- Axios
- CSS3

## 项目结构

```
0508-35/
├── backend/                          # 后端 Spring Boot 项目
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/toilet/
│       │   ├── ToiletPaperMonitorApplication.java
│       │   ├── controller/
│       │   │   └── ToiletController.java
│       │   ├── entity/
│       │   │   ├── Toilet.java
│       │   │   └── ToiletStall.java
│       │   ├── repository/
│       │   │   └── ToiletRepository.java
│       │   └── service/
│       │       └── ToiletService.java
│       └── resources/
│           └── application.yml
│
├── frontend/                         # 前端 Vue 3 项目
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── style.css
│       ├── App.vue
│       └── api/
│           └── toilet.js
│
└── README.md
```

## 快速开始

### 前置条件
- JDK 8+
- Maven 3.6+
- Node.js 16+
- MySQL 8.x

### 1. 配置 MySQL

确保 MySQL 服务已启动，修改后端配置文件：

```yaml
# backend/src/main/resources/application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/toilet_monitor?createDatabaseIfNotExist=true
    username: root
    password: your_password
```

数据库会自动创建，表结构由 JPA 自动生成。

### 2. 启动后端

```bash
cd backend

# 使用 Maven 编译运行
mvn clean install
mvn spring-boot:run
```

或者打包后运行：
```bash
mvn clean package
java -jar target/toilet-paper-monitor-0.0.1-SNAPSHOT.jar
```

后端启动后访问：`http://localhost:8080/api/toilets`

### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端启动后访问：`http://localhost:3000`

## 功能特性

### 数据初始化
应用启动时自动创建6个公厕（WC01~WC06），每个公厕3个厕位（A/B/C），初始厕纸余量随机 60%~100%。

### 定时更新
- 每10秒自动更新所有厕位的厕纸余量
- 工作日消耗：基础 2-4%/10秒
- 周末消耗：基础 5-7%/10秒（人流更高）
- 余量降到0后有10%概率自动换纸（重置为60%~100%）

### 可视化展示
#### 主视图（公厕网格）
- 3×2 网格布局展示6个公厕
- 每个卡片显示公厕位置和3个厕位的迷你进度条
- 支持点击进入详情

#### 详情视图（厕位详情）
- 大尺寸进度条显示厕纸余量
- 三级颜色指示：
  - 🟢 绿色 (60%~100%)：余量充足
  - 🟠 橙色 (20%~50%)：余量中等
  - 🔴 红色 (0%~20%)：余量不足（闪烁提示）
- 点击返回按钮可回到公厕列表

### 自动刷新
前端每10秒自动刷新数据，保持与后端同步。

## API 接口

### 获取所有公厕及厕位数据
```
GET /api/toilets
```

响应示例：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "code": "WC01",
      "name": "公厕 WC01",
      "location": "公园东门入口处",
      "stalls": [
        {
          "id": 1,
          "code": "A",
          "name": "厕位 A",
          "paperLevel": 85,
          "lastUpdate": "2025-05-09T10:30:00"
        }
      ]
    }
  ]
}
```

## 开发说明

### 修改数据库连接
编辑 `backend/src/main/resources/application.yml`

### 修改定时更新频率
修改 `backend/src/main/java/com/toilet/service/ToiletService.java` 中的 `@Scheduled` 注解。

### 修改消耗速率
修改 `ToiletService.java` 中的 `calculateConsumption()` 方法。

## 生产部署

### 后端打包
```bash
cd backend
mvn clean package -DskipTests
```

### 前端打包
```bash
cd frontend
npm run build
```

打包后的文件在 `frontend/dist` 目录，可部署到 Nginx 等静态服务器。

## 注意事项

1. 首次启动需确保 MySQL 已启动
2. 默认数据库用户名为 root，密码为 root，请根据实际情况修改
3. 端口配置：
   - 后端：8080
   - 前端开发：3000
4. 前端已配置代理，无需处理跨域问题
