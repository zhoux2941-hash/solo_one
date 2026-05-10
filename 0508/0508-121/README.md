# 流星雨观测记录系统

一个完整的流星雨观测记录和辐射点计算系统，使用 Vue3 + Spring Boot + MySQL + Redis 技术栈。

## 功能特性

- 🚀 **创建观测会话**: 选择流星雨名称、观测地点、开始时间
- ✨ **记录流星信息**: 记录每颗流星的星座区域、亮度等级(-2到+4等)、颜色(白/黄/蓝/红)
- 📐 **辐射点计算**: 根据多条流星轨迹，使用最小二乘法计算辐射点位置
- 🌌 **SVG星图展示**: 在星图上绘制轨迹线和反向延长线，标记辐射点
- 🏆 **公认辐射点**: 统计所有用户结果，取众数作为公认辐射点
- 💾 **Redis缓存**: 缓存热门流星雨的观测会话列表

## 技术栈

### 后端
- Java 8
- Spring Boot 2.7.18
- Spring Data JPA
- Spring Data Redis
- MySQL 8.0
- Apache Commons Math3 (最小二乘法)
- Lombok

### 前端
- Vue 3
- Vue Router 4
- Vite 5
- Axios

## 项目结构

```
0508-121/
├── meteor-backend/          # 后端 Spring Boot 项目
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/meteor/
│       │   ├── MeteorObservationApplication.java
│       │   ├── config/          # 配置类
│       │   ├── controller/      # 控制器
│       │   ├── dto/             # 数据传输对象
│       │   ├── entity/          # 实体类
│       │   ├── repository/      # 数据访问层
│       │   ├── service/         # 业务逻辑层
│       │   └── util/            # 工具类(辐射点计算等)
│       └── resources/
│           └── application.yml
│
└── meteor-frontend/          # 前端 Vue3 项目
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js
        ├── App.vue
        ├── api/index.js         # API 服务
        ├── components/
        │   └── StarMap.vue      # SVG 星图组件
        └── views/
            ├── Home.vue         # 首页
            ├── Observation.vue  # 观测页面
            ├── SessionDetail.vue # 会话详情
            └── Consensus.vue    # 共识辐射点统计
```

## 快速开始

### 环境要求
- JDK 8+
- Node.js 16+
- MySQL 8.0
- Redis 6.0+

### 1. 数据库准备

在 MySQL 中创建数据库：

```sql
CREATE DATABASE meteor_observation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

如果 MySQL 用户名/密码不是 root/root，请修改 `meteor-backend/src/main/resources/application.yml` 中的配置。

### 2. 启动后端

```bash
cd meteor-backend

# Maven 构建
mvn clean install

# 运行
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动。

首次启动时会自动创建数据表并初始化10个流星雨数据。

### 3. 启动前端

```bash
cd meteor-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

## API 接口

### 流星雨相关
- `GET /api/showers` - 获取所有流星雨
- `GET /api/showers/hot` - 获取热门流星雨(Redis缓存)
- `GET /api/showers/constellations` - 获取星座列表
- `GET /api/showers/info` - 获取系统信息

### 观测会话相关
- `POST /api/sessions` - 创建观测会话
- `GET /api/sessions/{id}` - 获取会话信息
- `GET /api/sessions/{id}/detail` - 获取会话详情(含记录和辐射点)
- `POST /api/sessions/{id}/end` - 结束会话并计算辐射点
- `GET /api/sessions/shower/{name}` - 获取某流星雨的所有会话
- `GET /api/sessions/shower/{name}/consensus` - 获取公认辐射点统计

### 流星记录相关
- `POST /api/records/session/{sessionId}` - 添加流星记录
- `GET /api/records/session/{sessionId}` - 获取会话的所有记录
- `DELETE /api/records/{id}` - 删除记录

## 辐射点计算原理

### 最小二乘法
系统使用 Apache Commons Math3 库的 Levenberg-Marquardt 优化器：

1. **目标**: 找到一个点，使其到所有流星轨迹线的距离之和最小
2. **模型**: 每个流星轨迹定义一条直线，辐射点应为所有直线的交点
3. **残差**: 点到直线的距离 + 角度残差
4. **置信度**: 基于 RMS 误差和记录数量计算

### 坐标系统
- **RA (赤经)**: 0° ~ 360°，横轴
- **Dec (赤纬)**: -90° ~ +90°，纵轴

### 公认辐射点
- 统计所有已完成会话的辐射点星座
- 取出现次数最多的星座(众数)作为公认辐射点
- 计算该星座所有坐标的平均值

## 使用流程

1. 打开首页 `http://localhost:3000`
2. 点击「开始新观测」创建观测会话
3. 在观测页面记录流星：
   - 选择划过的星座
   - 设置亮度等级(-2到+4)
   - 选择颜色
   - 输入轨迹起点和终点坐标(用于辐射点计算)
4. 记录至少3颗流星的完整轨迹后结束观测
5. 在详情页查看：
   - SVG星图上的轨迹和辐射点
   - 辐射点坐标和置信度
6. 在「辐射点统计」页面查看所有用户的共识结果

## 数据说明

### 预设流星雨
- 象限仪座流星雨 (QUA)
- 天琴座流星雨 (LYR)
- 宝瓶座η流星雨 (ETA)
- 英仙座流星雨 (PER) - 热门
- 猎户座流星雨 (ORI)
- 狮子座流星雨 (LEO)
- 双子座流星雨 (GEM) - 热门
- 小熊座流星雨 (URS)
- 金牛座流星雨 (TAU)
- 宝瓶座δ南流星雨 (SDA)

### 预设星座(24个)
猎户座、大犬座、金牛座、双子座、狮子座、大熊座、小熊座、
天琴座、天鹅座、宝瓶座、飞马座、英仙座、仙后座、天龙座、
武仙座、室女座、天秤座、天蝎座、人马座、摩羯座、白羊座、
巨蟹座、牧夫座、蛇夫座

### 颜色选项
白、黄、蓝、红

### 亮度等级
-2等(最亮) ~ +4等(最暗)

## 许可证

MIT License
