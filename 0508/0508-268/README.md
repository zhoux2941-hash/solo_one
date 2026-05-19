# 城市智慧停车车位管控系统

## 项目概述

基于 Spring Boot + Vue3 开发的城市片区智慧停车统一管理平台，依托长连接实现车位状态、在场车辆实时推送，覆盖路侧泊位、室内车场全场景停车管理。

## 技术栈

### 后端
- Spring Boot 2.7.x
- Spring Data JPA
- WebSocket
- H2 数据库（嵌入式）
- Lombok

### 前端
- **运营管理后台**: Vue3 + Element Plus + ECharts
- **车主H5移动端**: Vue3 + Vant
- **车场岗亭操作端**: Vue3 + Element Plus

## 项目结构

```
smart-parking-platform/
├── backend/                          # 后端项目
│   ├── src/main/java/com/smartparking/
│   │   ├── entity/                   # 实体类
│   │   ├── repository/               # 数据访问层
│   │   ├── service/                  # 业务逻辑层
│   │   ├── controller/               # 控制器
│   │   ├── websocket/                # WebSocket模块
│   │   ├── common/                   # 通用类
│   │   └── exception/                # 异常处理
│   └── src/main/resources/
│       ├── application.yml           # 应用配置
│       └── data.sql                  # 初始化数据
├── frontend/
│   ├── admin/                        # 运营管理后台
│   ├── h5/                           # 车主H5移动端
│   └── booth/                        # 车场岗亭操作端
└── README.md
```

## 核心功能

### 1. 车场与车位管理
- 路侧泊位、室内车场分级建档
- 实时采集车位空余/占用状态
- WebSocket实时状态推送

### 2. 车辆入场管理
- 车牌自动识别
- 入场计时
- 车位自动分配

### 3. 智能计费系统
- 日间/夜间/节假日阶梯费率
- 首30分钟免费
- 单日封顶计费

### 4. 车主端功能
- 停车缴费
- 欠费补缴
- 电子发票申领
- 附近车位查询

### 5. 岗亭端功能
- 手动开闸
- 异常车辆放行
- 临时访客登记
- 实时监控面板

### 6. 数据可视化
- 车位热力图
- 车场车流峰值统计
- 营收数据看板
- 实时在场车辆监控

### 7. 订单幂等性
- 防重复扣费
- 离场自动清场归档
- 弱网下单数据本地缓存

## 快速启动

### 后端启动

```bash
cd backend

# Maven编译打包
mvn clean package -DskipTests

# 运行
mvn spring-boot:run
```

或直接运行主类: `SmartParkingApplication.java`

### 前端启动

**运营管理后台 (端口3001)**
```bash
cd frontend/admin
npm install
npm run dev
```

**车主H5移动端 (端口3002)**
```bash
cd frontend/h5
npm install
npm run dev
```

**车场岗亭操作端 (端口3003)**
```bash
cd frontend/booth
npm install
npm run dev
```

## 访问地址

| 系统 | 地址 | 说明 |
|------|------|------|
| 后端API | http://localhost:8080/api | API服务端口 |
| H2控制台 | http://localhost:8080/api/h2-console | 数据库管理 |
| 运营管理后台 | http://localhost:3001 | 管理端 |
| 车主H5 | http://localhost:3002 | 移动端 |
| 岗亭操作端 | http://localhost:3003 | 岗亭端 |

## 数据库配置

H2数据库为嵌入式数据库，默认配置：
- JDBC URL: `jdbc:h2:file:./data/smart_parking`
- 用户名: `sa`
- 密码: (空)

## API接口说明

### 车辆管理
- `POST /parking/entry` - 车辆入场
- `POST /parking/exit` - 车辆离场
- `POST /parking/manual-release` - 人工放行

### 订单支付
- `GET /parking/order/unpaid/{plateNumber}` - 查询待支付订单
- `POST /parking/order/{orderId}/pay` - 支付订单

### 统计查询
- `GET /parking/statistics/dashboard` - 看板统计
- `GET /parking/statistics/heatmap` - 热力图数据
- `GET /parking/statistics/peak` - 峰值统计

### 车场车位
- `GET /parking/lots` - 查询所有车场
- `GET /parking/spaces/{parkingLotId}` - 查询车场车位
- `PUT /parking/space/{spaceId}/status` - 更新车位状态

## WebSocket推送

连接地址: `ws://localhost:8080/api/ws/parking/{clientType}`

支持的客户端类型:
- `admin` - 管理后台
- `booth` - 岗亭端

推送消息类型:
- `PARKING_SPACE_UPDATE` - 车位状态更新
- `VEHICLE_ENTRY` - 车辆入场通知
- `VEHICLE_EXIT` - 车辆离场通知

## 核心实体

| 实体 | 说明 |
|------|------|
| ParkingLot | 停车场信息 |
| ParkingSpace | 车位信息 |
| VehicleEntry | 车辆入场记录 |
| BillingOrder | 计费订单 |
| RateConfig | 费率配置 |

## 注意事项

1. 本项目使用H2内存数据库，重启后数据重置
2. WebSocket连接断开后会自动重连
3. 生产环境建议切换到MySQL/PostgreSQL
4. 车牌识别为模拟实现，可对接真实识别设备
