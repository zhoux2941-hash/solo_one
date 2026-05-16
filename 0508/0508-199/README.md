# 电影院选座与会员积分兑换系统

## 项目简介

这是一个完整的电影院选座系统，包含原生HTML/CSS/JavaScript前端和Java Spring Boot后端。系统支持电影选择、场次选择、可视化座位选择、会员积分管理以及小食兑换等功能。

## 功能特性

### 1. 选座购票
- 🎬 电影列表展示
- ⏰ 场次时间选择
- 🪑 可视化座位图（支持多座位选择）
- 💳 模拟支付流程
- 🔒 座位锁定机制（10分钟超时自动释放）

### 2. 会员积分系统
- 📱 手机号注册/登录
- ⭐ 购票累计积分（票价 × 10）
- 🎁 积分兑换小食
- 📋 购票记录与兑换记录查询

### 3. 报表统计
- 📊 各影片上座率统计
- 🏆 小食兑换排行榜
- 📈 实时数据更新

## 项目结构

```
cinema-system/
├── index.html              # 前端主页面
├── styles.css              # 前端样式文件
├── app.js                  # 前端逻辑文件
└── backend/                # Java后端项目
    ├── pom.xml             # Maven配置
    └── src/main/
        ├── java/com/cinema/
        │   ├── CinemaApplication.java      # 主启动类
        │   ├── entity/                     # 实体类
        │   │   ├── Movie.java
        │   │   ├── Schedule.java
        │   │   ├── Seat.java
        │   │   ├── Member.java
        │   │   ├── Order.java
        │   │   ├── Snack.java
        │   │   └── Exchange.java
        │   ├── repository/                 # 数据访问层
        │   ├── service/                    # 业务逻辑层
        │   ├── controller/                 # 控制层
        │   └── config/                     # 配置类
        └── resources/
            └── application.yml             # 配置文件
```

## 快速开始

### 方式一：仅使用前端（推荐快速体验）

1. 直接在浏览器中打开 `index.html` 文件即可使用
2. 前端使用localStorage存储数据，无需后端支持

### 方式二：运行完整前后端系统

#### 环境要求
- JDK 1.8+
- Maven 3.6+

#### 启动后端
```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

#### H2数据库控制台
访问 `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:cinemadb`
- 用户名: `sa`
- 密码: (空)

## API接口文档

### 电影相关
- `GET /api/movies` - 获取所有电影
- `GET /api/movies/{id}` - 获取单个电影

### 场次相关
- `GET /api/schedules/movie/{movieId}` - 获取电影场次
- `GET /api/schedules/{id}` - 获取单个场次

### 座位相关
- `GET /api/seats/schedule/{scheduleId}` - 获取场次座位
- `POST /api/seats/lock` - 锁定座位
- `POST /api/seats/release` - 释放座位

### 会员相关
- `POST /api/members/login` - 登录/注册
- `GET /api/members/{id}` - 获取会员信息

### 订单相关
- `POST /api/orders` - 创建订单
- `GET /api/orders/member/{memberId}` - 获取会员订单

### 小食相关
- `GET /api/snacks` - 获取所有小食

### 兑换相关
- `POST /api/exchanges` - 兑换小食
- `GET /api/exchanges/member/{memberId}` - 获取兑换记录

### 报表相关
- `GET /api/reports` - 获取所有报表
- `GET /api/reports/occupancy` - 获取上座率报表
- `GET /api/reports/snack-ranking` - 获取小食兑换排行

## 技术栈

### 前端
- HTML5
- CSS3
- 原生JavaScript (ES6+)
- LocalStorage数据存储

### 后端
- Spring Boot 2.7.18
- Spring Data JPA
- H2 内存数据库
- Lombok
- Maven

## 使用说明

1. **选择电影**：在首页点击任意电影卡片进入场次选择
2. **选择场次**：点击合适的时间场次进入座位选择
3. **选择座位**：在座位图上点击可选座位（绿色），最多可选择6个座位
4. **提交订单**：确认座位后点击"提交订单"，输入会员手机号（可选）
5. **确认支付**：点击"确认支付"完成购票，会员自动获得积分
6. **会员中心**：点击右上角"会员中心"登录并查看积分、兑换小食
7. **数据报表**：点击右上角"数据报表"查看上座率和兑换排行

## 注意事项

- 座位锁定时间为10分钟，超时未支付将自动释放
- 会员积分永久有效
- 前端独立运行时数据存储在浏览器localStorage中
- 后端启动后会自动初始化测试数据