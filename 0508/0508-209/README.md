# 公交公司司机疲劳驾驶预警系统

## 项目简介

本系统是一个基于Java Spring Boot后端和HTML/JS前端的司机疲劳驾驶预警系统，主要用于公交公司安全部门实时监控司机状态，及时发现并预警疲劳驾驶行为。

## 功能特性

### 车载设备模拟
- 模拟车载设备每2秒上报司机面部特征数据
- 支持打哈欠、闭眼、分心三种异常状态模拟
- 可选择不同司机进行数据上报
- 实时显示上报日志和状态

### 后端告警逻辑
- 统计单位时间内异常次数
- 阈值可配置（默认：打哈欠≥3次/分钟，闭眼≥5次/分钟，分心≥4次/分钟）
- 触发疲劳告警并实时推送
- 内置H2内存数据库存储数据

### 调度中心监控
- WebSocket实时推送告警信息
- 语音提醒司机功能（模拟）
- 司机在线状态监控
- 24小时告警分布图
- 告警处理功能

### 报表统计
- 司机疲劳告警频次排行
- 易疲劳时段统计
- 告警热力图展示
- 告警历史记录查询

## 技术栈

### 后端
- Java 8+
- Spring Boot 2.7.x
- Spring WebSocket
- Spring Data JPA
- H2 Database
- Lombok
- FastJSON

### 前端
- HTML5
- JavaScript (ES6+)
- CSS3
- WebSocket API
- Web Audio API

## 项目结构

```
0508-209/
├── backend/                    # Java后端项目
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/buscompany/fatigue/
│   │       │       ├── FatigueMonitorApplication.java  # 主启动类
│   │       │       ├── config/
│   │       │       │   └── WebSocketConfig.java         # WebSocket配置
│   │       │       ├── controller/
│   │       │       │   ├── DeviceController.java        # 设备数据接口
│   │       │       │   ├── AlertController.java         # 告警管理接口
│   │       │       │   ├── DriverController.java        # 司机管理接口
│   │       │       │   └── ReportController.java        # 报表统计接口
│   │       │       ├── entity/
│   │       │       │   ├── Driver.java                  # 司机实体
│   │       │       │   ├── DeviceData.java              # 设备数据实体
│   │       │       │   └── Alert.java                   # 告警实体
│   │       │       ├── dto/
│   │       │       │   └── DeviceDataRequest.java       # 数据上报DTO
│   │       │       ├── repository/
│   │       │       │   ├── DriverRepository.java
│   │       │       │   ├── DeviceDataRepository.java
│   │       │       │   └── AlertRepository.java
│   │       │       ├── service/
│   │       │       │   ├── FatigueMonitorService.java   # 疲劳监控服务
│   │       │       │   ├── ReportService.java           # 报表服务
│   │       │       │   └── DataInitService.java         # 数据初始化服务
│   │       │       └── websocket/
│   │       │           └── AlertWebSocket.java          # WebSocket处理器
│   │       └── resources/
│   │           └── application.properties               # 应用配置
│   └── pom.xml                                           # Maven配置
└── frontend/                     # 前端页面
    ├── dashboard.html            # 调度中心监控页面
    ├── device-simulator.html     # 车载设备模拟器
    └── reports.html              # 报表统计页面
```

## 快速开始

### 环境要求
- JDK 1.8 或更高版本
- Maven 3.6+
- 现代浏览器（支持WebSocket）

### 启动后端服务

1. 进入后端目录：
```bash
cd backend
```

2. 使用Maven编译并启动：
```bash
mvn clean compile
mvn spring-boot:run
```

或者打包后运行：
```bash
mvn clean package
java -jar target/driver-fatigue-monitor-1.0.0.jar
```

服务启动后访问：
- 后端API: http://localhost:8080
- H2控制台: http://localhost:8080/h2-console
  - JDBC URL: jdbc:h2:mem:fatiguedb
  - 用户名: sa
  - 密码: (空)

### 访问前端页面

直接在浏览器中打开以下文件：
- `frontend/dashboard.html` - 调度中心监控页面
- `frontend/device-simulator.html` - 车载设备模拟器
- `frontend/reports.html` - 报表统计页面

## 使用说明

### 1. 车载设备模拟
1. 打开 `device-simulator.html`
2. 选择司机（系统已预置8名测试司机）
3. 点击"打哈欠"、"闭眼"、"分心"按钮模拟异常状态
4. 点击"开始模拟"，设备将每2秒上报一次数据

### 2. 调度中心监控
1. 打开 `dashboard.html`
2. 查看实时告警列表
3. 当出现告警时，可点击"语音提醒"向司机发送提醒
4. 处理告警后点击"标记已处理"

### 3. 报表统计
1. 打开 `reports.html`
2. 选择时间范围查询
3. 查看司机告警排行、时段分布图、热力图等

## 配置说明

在 `backend/src/main/resources/application.properties` 中可配置：

```properties
# 告警阈值配置
fatigue.alert.yawn-threshold=3       # 打哈欠阈值
fatigue.alert.eye-close-threshold=5   # 闭眼阈值
fatigue.alert.distraction-threshold=4 # 分心阈值
fatigue.alert.time-window-seconds=60  # 统计时间窗口(秒)
```

## API接口文档

### 设备数据上报
- POST `/api/device/report`
- 上报司机面部特征数据

### 告警管理
- GET `/api/alerts/unhandled` - 获取未处理告警
- GET `/api/alerts/driver/{driverNo}` - 获取指定司机告警
- POST `/api/alerts/{id}/handle` - 处理告警
- GET `/api/alerts/all` - 获取所有告警

### 司机管理
- GET `/api/drivers` - 获取所有司机
- GET `/api/drivers/online` - 获取在线司机
- GET `/api/drivers/{driverNo}` - 获取指定司机信息

### 报表统计
- GET `/api/reports/ranking` - 司机告警排行
- GET `/api/reports/by-hour` - 按小时统计告警
- GET `/api/reports/recent-alerts` - 近期告警
- GET `/api/reports/dashboard` - 仪表盘统计

## 预置测试数据

系统启动时会自动创建以下测试司机：

| 司机编号 | 姓名 | 车牌号 | 线路 |
|---------|------|--------|------|
| D001 | 张明 | 京A12345 | 1路 |
| D002 | 李强 | 京A12346 | 2路 |
| D003 | 王芳 | 京A12347 | 3路 |
| D004 | 刘洋 | 京A12348 | 4路 |
| D005 | 陈静 | 京A12349 | 5路 |
| D006 | 赵伟 | 京A12350 | 6路 |
| D007 | 孙丽 | 京A12351 | 7路 |
| D008 | 周杰 | 京A12352 | 8路 |

## 注意事项

1. 本系统使用H2内存数据库，重启服务后数据会丢失
2. 前端页面需在后端服务启动后才能正常工作
3. WebSocket连接断开后会自动重连
4. 语音提醒功能使用Web Audio API生成提示音

## 扩展建议

1. 接入真实的人脸识别摄像头设备
2. 集成短信/电话语音通知功能
3. 添加司机人脸识别登录功能
4. 实现历史数据持久化（MySQL/PostgreSQL）
5. 添加更多统计分析维度和图表
6. 实现用户权限管理系统
