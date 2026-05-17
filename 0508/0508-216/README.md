# 博物馆展柜微环境恒湿调控系统

## 项目概述

本系统用于博物馆展柜的微环境湿度监控与自动调控，确保文物保存环境的湿度稳定。

## 功能特性

### 1. 展柜设备管理
- 展柜信息的增删改查
- 支持有机展品（木器、书画）和无机展品分类
- 可设置目标湿度范围（有机：50-55%RH，无机：40-45%RH）

### 2. 传感器数据采集
- 模拟传感器每15分钟上报湿度数据
- 实时显示当前湿度值

### 3. 自动调控系统
- 湿度偏差超过±5%时自动启动加湿/除湿
- 实时显示恒湿机状态（待机、加湿中、除湿中、警告）
- 调控日志记录

### 4. 报表统计
- 湿度波动曲线图（24小时、7天、30天）
- 调控能耗统计（加湿能耗、除湿能耗）
- 按日期范围查询统计数据

## 技术架构

### 前端
- 原生 HTML5 + JavaScript
- Chart.js 图表库
- CSS3 样式

### 后端
- Spring Boot 2.7.18
- Spring Data JPA
- H2 内存数据库
- Maven 构建

## 项目结构

```
museum-humidity-control/
├── frontend/                 # 前端项目
│   ├── index.html           # 主页面
│   ├── styles.css           # 样式文件
│   └── app.js               # 前端逻辑
└── backend/                  # 后端项目
    ├── src/
    │   └── main/
    │       ├── java/        # Java源代码
    │       └── resources/   # 配置文件
    └── pom.xml              # Maven配置
```

## 快速开始

### 环境要求
- JDK 1.8+
- Maven 3.6+
- 现代浏览器（Chrome、Firefox等）

### 启动后端

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

### 访问前端

直接在浏览器中打开 `frontend/index.html` 文件，或使用本地Web服务器（如VS Code的Live Server）

### H2数据库控制台

访问 http://localhost:8080/h2-console
- JDBC URL: jdbc:h2:mem:museumdb
- 用户名: sa
- 密码: （空）

## API接口

### 展柜设备管理
- `GET /api/devices` - 获取所有展柜
- `GET /api/devices/{id}` - 获取单个展柜
- `POST /api/devices` - 创建立柜
- `PUT /api/devices/{id}` - 更新展柜
- `DELETE /api/devices/{id}` - 删除展柜

### 湿度数据
- `GET /api/humidity/device/{deviceId}` - 获取湿度记录
- `POST /api/humidity` - 上报湿度数据

### 调控日志
- `GET /api/control-logs/device/{deviceId}` - 获取调控日志

### 能耗统计
- `GET /api/energy-statistics` - 获取能耗统计数据

## 系统参数配置

在 `backend/src/main/resources/application.properties` 中可配置：

```properties
# 湿度偏差阈值（%RH）
control.humidity.deviation-threshold=5.0

# 传感器上报间隔（分钟）
sensor.report-interval-minutes=15
```

## 使用说明

1. 启动后端服务
2. 打开前端页面
3. 在"展柜设备管理"标签页添加或管理展柜
4. 在"实时监控"标签页查看湿度变化和调控状态
5. 在"报表统计"标签页查看历史数据和能耗统计

## 注意事项

- 本系统使用H2内存数据库，重启后数据会丢失
- 传感器数据为模拟生成，用于演示目的
- 实际部署时需连接真实的传感器设备和恒湿机
