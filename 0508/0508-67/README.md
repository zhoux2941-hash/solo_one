# 办公楼饮水机水量监控系统

一个全栈的办公楼饮水机智能监控系统，实现实时监控、自动报警、工单管理和数据分析功能。

## 技术栈

### 后端
- **Java 17** + **Spring Boot 3.2**
- **MySQL 8.0** - 数据持久化存储
- **Redis** - 缓存实时状态数据
- **Spring Data JPA** - ORM框架
- **Spring Scheduling** - 定时任务（模拟传感器）
- **Lombok** - 简化代码

### 前端
- **Vue 3** + **Vite**
- **Element Plus** - UI组件库
- **ECharts** - 数据可视化图表
- **Vue Router** - 路由管理
- **Axios** - HTTP客户端

## 功能特性

### 1. 实时监控
- 每台饮水机自动每半小时上报水量数据（模拟传感器）
- 按楼层分组展示各饮水机状态
- 进度条可视化显示剩余水量
- 低水位（<5L）自动标红并闪烁预警
- 实时显示用水速度和预计低水位时间

### 2. 送水工单管理
- 低水位自动生成送水工单
- 待处理工单列表展示
- 一键确认送水完成
- 完整工单历史记录

### 3. 数据分析
- 各饮水机用水速度柱状图（L/小时）
- 单台饮水机用水趋势曲线
- 低水位预警线标记
- 送水员响应时长分布直方图

## 项目结构

```
water-monitor/
├── backend/                 # Spring Boot 后端
│   ├── src/main/java/com/company/watermonitor/
│   │   ├── config/          # 配置类（Redis、CORS）
│   │   ├── controller/      # REST API控制器
│   │   ├── dto/             # 数据传输对象
│   │   ├── entity/          # JPA实体类
│   │   ├── repository/      # 数据访问层
│   │   └── service/         # 业务逻辑层
│   ├── src/main/resources/
│   │   ├── application.yml  # 应用配置
│   │   └── data.sql         # 初始化数据
│   └── pom.xml              # Maven依赖
│
├── frontend/                # Vue 3 前端
│   ├── src/
│   │   ├── api/             # API接口
│   │   ├── router/          # 路由配置
│   │   ├── views/           # 页面组件
│   │   │   ├── Dashboard.vue    # 实时监控页
│   │   │   ├── Orders.vue       # 工单管理页
│   │   │   └── Analytics.vue    # 数据分析页
│   │   ├── App.vue          # 根组件
│   │   ├── main.js          # 入口文件
│   │   └── style.css        # 全局样式
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## 快速开始

### 环境准备

1. **安装 MySQL 8.0**
   ```sql
   CREATE DATABASE water_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **安装 Redis**
   - 确保Redis在默认端口6379运行

3. **安装 Java 17** 或更高版本
4. **安装 Node.js 18** 或更高版本

### 后端启动

1. 修改数据库配置（如需要）
   ```yaml
   # backend/src/main/resources/application.yml
   spring:
     datasource:
       username: your_username
       password: your_password
   ```

2. 使用Maven启动
   ```bash
   cd backend
   mvn spring-boot:run
   ```

   或打包后运行
   ```bash
   mvn clean package
   java -jar target/water-monitor-0.0.1-SNAPSHOT.jar
   ```

3. 后端服务运行在 `http://localhost:8080`

### 前端启动

1. 安装依赖
   ```bash
   cd frontend
   npm install
   ```

2. 启动开发服务器
   ```bash
   npm run dev
   ```

3. 访问 `http://localhost:3000`

## 数据库设计

### water_machines（饮水机表）
| 字段 | 类型 | 说明 |
|------|------|------|
| machine_id | BIGINT | 主键，饮水机ID |
| floor | INT | 楼层 |
| location | VARCHAR(100) | 位置描述 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### water_records（水量记录表）
| 字段 | 类型 | 说明 |
|------|------|------|
| record_id | BIGINT | 主键，记录ID |
| machine_id | BIGINT | 饮水机ID |
| remaining_liters | DOUBLE | 剩余水量（升） |
| report_time | DATETIME | 上报时间 |

### delivery_orders（送水工单表）
| 字段 | 类型 | 说明 |
|------|------|------|
| order_id | BIGINT | 主键，工单ID |
| machine_id | BIGINT | 饮水机ID |
| order_time | DATETIME | 下单时间 |
| delivered_time | DATETIME | 送达时间 |
| status | VARCHAR(20) | 状态（PENDING/COMPLETED） |
| remaining_liters | DOUBLE | 下单时剩余水量 |

## Redis缓存结构

缓存键：`machine:status:{machineId}`

存储内容：
- `remainingLiters` - 当前剩余水量
- `isLowWater` - 是否低水位
- `consumptionRate` - 用水速度
- `lastReportTime` - 上次上报时间
- `estimatedLowWaterTime` - 预计低水位时间

## API接口

### 饮水机管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/machines | 获取所有饮水机 |
| GET | /api/machines/status | 获取所有饮水机实时状态 |
| POST | /api/machines/{id}/simulate | 模拟一次传感器上报 |
| POST | /api/machines/{id}/refil | 手动加水 |
| GET | /api/machines/{id}/history | 获取历史记录 |

### 送水工单
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/orders | 获取所有工单 |
| GET | /api/orders/pending | 获取待处理工单 |
| POST | /api/orders/{id}/deliver | 确认送达 |
| GET | /api/orders/response-time/histogram | 获取响应时长分布 |

### 数据分析
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/analytics/consumption-rates | 获取各饮水机用水速度 |
| GET | /api/analytics/machine/{id}/history | 单台机器历史趋势 |

## 业务流程

1. **传感器上报**：每30分钟自动执行（可手动触发）
2. **水位检测**：剩余水量<5L标记为低水位
3. **自动派单**：检测到低水位时自动生成送水工单
4. **送水确认**：送水工完成后点击"已送达"
5. **数据更新**：确认后自动将水量恢复为满桶

## 配置说明

在 `application.yml` 中可调整：
```yaml
app:
  low-water-threshold: 5    # 低水位阈值（升）
  max-water-capacity: 20    # 水桶最大容量（升）
```

定时任务间隔（毫秒）：
```java
@Scheduled(fixedRate = 1800000)  // 30分钟
```
