# 幼儿园午睡床位体温监测异常检测系统

## 项目简介

本系统用于幼儿园午睡期间的床位体温实时监测和异常检测。系统包含12个床位，每小时自动记录一次体温数据（模拟数据），并实时检测体温异常情况，及时发出告警。

## 技术栈

### 后端
- **框架**: Spring Boot 2.7.18
- **数据库**: MySQL 8.0+
- **缓存**: Redis 6.0+
- **ORM**: Spring Data JPA
- **实时推送**: SSE (Server-Sent Events)

### 前端
- **框架**: Vue 3 + Vite
- **UI组件**: Element Plus
- **图表**: ECharts
- **路由**: Vue Router 4
- **HTTP客户端**: Axios

## 功能特性

1. **床位管理**: 12个床位信息管理，包含幼儿姓名、年龄、性别
2. **体温模拟**: 自动模拟生成体温数据（正常范围36.0-37.2℃）
3. **异常检测**:
   - 体温过高（>37.2℃）
   - 体温过低（<36.0℃）
   - 连续两次体温上升超过0.5℃
4. **实时监测**: SSE实时推送体温数据，异常床位红色边框闪烁
5. **历史查询**: 按床位号和时间范围查询历史体温记录，支持图表展示
6. **异常告警**: 异常记录统计和列表展示

## 项目结构

```
temperature-monitor/
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/kindergarten/temperature/
│   │   │   │   ├── controller/    # 控制器层
│   │   │   │   ├── service/       # 服务层
│   │   │   │   ├── repository/    # 数据访问层
│   │   │   │   ├── entity/        # 实体类
│   │   │   │   ├── dto/           # 数据传输对象
│   │   │   │   ├── config/        # 配置类
│   │   │   │   ├── init/          # 初始化
│   │   │   │   └── TemperatureMonitorApplication.java
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/init.sql
│   │   └── test/
│   └── pom.xml
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── api/                # API接口
│   │   ├── views/              # 页面组件
│   │   ├── router/             # 路由配置
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 快速开始

### 环境要求

- JDK 1.8+
- Maven 3.6+
- MySQL 8.0+
- Redis 6.0+
- Node.js 16+

### 数据库配置

1. 创建数据库：
```sql
CREATE DATABASE kindergarten DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 修改后端配置文件 `backend/src/main/resources/application.yml`：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/kindergarten?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false
    username: your_username
    password: your_password
  redis:
    host: localhost
    port: 6379
    password: your_redis_password
```

### 启动后端

```bash
cd backend
mvn clean package
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

### 系统使用

1. 访问 `http://localhost:3000`
2. 点击「初始化数据」按钮生成初始体温数据
3. 点击「开始采集」按钮启动模拟数据生成
4. 查看实时监测页面，观察床位体温变化
5. 异常床位会有红色边框闪烁和告警提示

## API接口文档

### 床位管理
- `GET /api/beds` - 获取所有床位
- `GET /api/beds/{bedNo}` - 获取指定床位信息
- `POST /api/beds` - 新增床位
- `PUT /api/beds/{bedNo}` - 更新床位信息
- `DELETE /api/beds/{bedNo}` - 删除床位

### 体温数据
- `POST /api/temperature/record?bedNo={bedNo}&temperature={temp}` - 记录体温
- `GET /api/temperature/history/{bedNo}` - 获取床位历史记录
- `GET /api/temperature/abnormal` - 获取所有异常记录
- `GET /api/temperature/snapshot` - 获取当前所有床位体温快照
- `GET /api/temperature/snapshot/{bedNo}` - 获取指定床位体温快照

### SSE实时推送
- `GET /api/sse/subscribe` - 订阅实时体温更新

### 模拟控制
- `POST /api/simulation/start` - 启动数据模拟
- `POST /api/simulation/stop` - 停止数据模拟
- `GET /api/simulation/status` - 获取模拟状态
- `POST /api/simulation/init-data` - 生成初始数据

## 异常检测规则

1. **体温过高**: 体温 > 37.2℃
2. **体温过低**: 体温 < 36.0℃
3. **快速上升**: 连续两次测量，体温上升 > 0.5℃

## 配置说明

可在 `application.yml` 中调整以下参数：

```yaml
monitor:
  bed-count: 12              # 床位数量
  min-temperature: 36.0      # 正常体温下限
  max-temperature: 37.2      # 正常体温上限
  max-rise: 0.5              # 最大允许上升幅度
  simulate-interval: 10000   # 模拟数据生成间隔(毫秒)
```

## 注意事项

1. 请确保MySQL和Redis服务已启动
2. 首次启动会自动创建数据表和初始化12个床位信息
3. 模拟数据间隔默认10秒，可根据需要调整
4. SSE连接断开后会自动重连
