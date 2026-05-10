# 电影院爆米花机预热排班优化器

一个基于排队论模型的智能排班系统，帮助电影院优化爆米花机的预热时间，避免高峰期排队等待。

## 技术栈

### 后端
- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Data JPA** - 数据库访问
- **Spring Data Redis** - 缓存
- **MySQL 8.0** - 数据存储
- **Lombok** - 简化代码

### 前端
- **Vue 3**
- **Vite** - 构建工具
- **Chart.js + vue-chartjs** - 图表展示
- **Axios** - HTTP客户端

## 项目结构

```
popcorn-optimizer/
├── popcorn-optimizer-backend/     # 后端项目
│   ├── src/main/java/com/cinema/popcorn/
│   │   ├── config/                # 配置类
│   │   ├── controller/            # REST API控制器
│   │   ├── dto/                   # 数据传输对象
│   │   ├── entity/                # 实体类
│   │   ├── exception/             # 异常处理
│   │   ├── repository/            # 数据访问层
│   │   └── service/               # 业务逻辑层
│   ├── src/main/resources/
│   │   ├── db/init.sql            # 数据库初始化脚本
│   │   └── application.yml        # 应用配置
│   └── pom.xml
│
└── popcorn-optimizer-frontend/    # 前端项目
    ├── src/
    │   ├── components/            # Vue组件
    │   ├── App.vue                # 主组件
    │   ├── main.js                # 入口文件
    │   └── style.css              # 全局样式
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 功能特性

1. **排队论算法（M/M/c模型）**
   - 计算预期排队长度
   - 计算平均等待时间
   - 确定需要的服务台数量

2. **智能排班优化**
   - 考虑15分钟预热时间
   - 针对高峰期（19:00-21:00）优化
   - 支持3台爆米花机

3. **数据展示**
   - 预期排队长度曲线图
   - 机器预热甘特图
   - 统计数据卡片
   - 优化建议文本

4. **数据管理**
   - MySQL存储历史客流数据
   - Redis缓存优化结果
   - 支持节假日客流模式

## 快速开始

### 前置要求

- JDK 17+
- Node.js 16+
- MySQL 8.0+
- Redis 6.0+
- Maven 3.6+

### 1. 数据库准备

执行数据库初始化脚本：

```bash
mysql -u root -p < popcorn-optimizer-backend/src/main/resources/db/init.sql
```

或者在MySQL客户端中手动执行：
```sql
SOURCE /path/to/init.sql;
```

### 2. 修改配置

根据实际环境修改 `application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/popcorn_optimizer?useSSL=false&serverTimezone=Asia/Shanghai
    username: your_username
    password: your_password
  
  data:
    redis:
      host: localhost
      port: 6379
```

### 3. 启动后端

```bash
cd popcorn-optimizer-backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### 4. 启动前端

```bash
cd popcorn-optimizer-frontend
npm install
npm run dev
```

前端应用将在 `http://localhost:5173` 启动

## API 接口

### 优化计算
```
POST /api/optimize
Content-Type: application/json

{
  "expectedPassengers": 500,
  "date": "2024-01-15",
  "isHoliday": false
}
```

### 获取系统配置
```
GET /api/optimize/config
```

### 客流数据管理
```
POST   /api/passenger-flow           # 保存单条客流记录
POST   /api/passenger-flow/batch     # 批量保存
GET    /api/passenger-flow/date/{date}           # 按日期查询
GET    /api/passenger-flow/range?start=&end=     # 按范围查询
GET    /api/passenger-flow/peak?date=&startHour=&endHour=  # 高峰期数据
GET    /api/passenger-flow/average?hour=&dayOfWeek=        # 平均数据
```

## 核心算法

### 排队论 M/M/c 模型

- **λ**: 到达率（人/分钟）
- **μ**: 服务率（人/分钟/台）
- **c**: 服务台数量（机器数）
- **ρ**: 系统利用率 = λ/(cμ)

关键计算公式：

1. 系统空闲概率 P₀：
```
P₀ = [Σ(n=0到c-1) (cρ)ⁿ/n! + (cρ)ᶜ/(c!(1-ρ))]⁻¹
```

2. 平均排队长度 Lq：
```
Lq = P₀ × (cρ)ᶜ × ρ / [c! × (1-ρ)²]
```

3. 平均等待时间 Wq：
```
Wq = Lq / λ
```

## 使用说明

1. 打开前端应用 `http://localhost:5173`
2. 在左侧输入预期的总客流量（人/天）
3. 选择日期并标记是否为节假日
4. 点击「开始优化计算」
5. 查看：
   - 统计数据（使用机器数、平均等待时间）
   - 排队长度曲线图
   - 机器预热甘特图
   - 详细的优化建议

## 配置参数

可在 `application.yml` 中调整以下参数：

```yaml
app:
  popcorn:
    total-machines: 3              # 总机器数
    warmup-minutes: 15             # 预热时间（分钟）
    peak-start-hour: 19            # 高峰开始小时
    peak-end-hour: 21              # 高峰结束小时
    max-queue-length: 10           # 最大允许排队长度
    service-rate-per-machine: 30   # 每台机器服务效率（人/小时）
```

## 许可证

MIT License
