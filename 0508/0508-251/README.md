# 山地复杂地形弹道补偿计算平台

## 项目简介

这是一个专业的山地复杂地形弹道补偿计算系统，提供完整的前后端解决方案。系统支持地形坡度测量、高低落差测距、弹道下坠补偿计算、横风扰流修正以及平地山地弹道数据对比分析。

## 技术栈

### 前端
- HTML5 + CSS3 + 原生 JavaScript
- Canvas 弹道可视化图表
- LocalStorage 本地数据存储

### 后端
- Spring Boot 2.7.18
- Spring Data JPA
- H2 内存数据库
- Maven 构建工具

## 功能模块

### 1. 地形坡度录入模块
- 支持输入射击点位和目标点位经纬度坐标
- 自动计算水平距离、海拔高差、直线距离
- 计算射击仰角
- 支持上坡/下坡/平地射击方向选择

### 2. 高低落差测距模块
- 支持坐标计算、激光测距、手动输入三种方式
- 考虑气压、温度、湿度等环境因素修正

### 3. 山地弹道下坠补偿模块
- 支持多种标准弹药类型（7.62x51, 5.56x45, .338, .50BMG）
- 支持自定义弹药参数
- 计算飞行时间、弹道下坠量、瞄准抬高量
- 计算剩余速度、剩余动能
- Canvas 弹道轨迹可视化

### 4. 横风山地扰流修正模块
- 支持山谷、山脊、山坡、平原等多种地形
- 计算地形放大系数
- 计算总风偏量和风偏修正量
- 预估弹道散布

### 5. 平地山地弹道数据对比模块
- 多距离点数据对比
- 差异分析和影响程度评估

### 6. 历史记录管理
- 本地存储历史计算记录
- 支持数据导出、删除、清空操作
- 后端 H2 数据库持久化存储

## 快速开始

### 环境要求
- JDK 11 或更高版本
- Maven 3.6 或更高版本
- 现代浏览器（Chrome, Firefox, Edge, Safari）

### 启动后端服务

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### 访问前端页面

直接在浏览器中打开 `frontend/index.html` 文件

## API 接口文档

### 健康检查
```
GET /api/health
```

### 坡度计算
```
POST /api/calculate/slope
Content-Type: application/json

{
    "shooterLatitude": 39.9042,
    "shooterLongitude": 116.4074,
    "shooterAltitude": 100,
    "targetLatitude": 39.9242,
    "targetLongitude": 116.4274,
    "targetAltitude": 300,
    "terrainSlope": 15,
    "shootDirection": "uphill"
}
```

### 弹道计算
```
POST /api/calculate/ballistic
Content-Type: application/json

{
    "ammoType": "7.62x51",
    "shootDistance": 800,
    "windSpeed": 5,
    "windDirection": 90,
    "terrainSlope": 20,
    "temperature": 15,
    "pressure": 1013
}
```

### 风偏修正计算
```
POST /api/calculate/wind
Content-Type: application/json

{
    "terrainType": "valley",
    "valleyWidth": 100,
    "valleyDepth": 50,
    "mainWindSpeed": 5,
    "turbulence": 15,
    "shootDistance": 500
}
```

### 数据管理接口
```
GET /api/records                 - 获取所有记录
GET /api/records/{id}            - 获取单条记录
GET /api/records/type/{type}     - 按类型获取记录
DELETE /api/records/{id}         - 删除记录
GET /api/statistics              - 获取统计数据
GET /api/records/paged           - 分页获取记录
```

## H2 数据库控制台

访问 `http://localhost:8080/h2-console`

- JDBC URL: `jdbc:h2:mem:ballisticdb`
- 用户名: `admin`
- 密码: `admin`

## 项目结构

```
.
├── frontend/
│   ├── index.html          # 前端主页面
│   └── app.js             # 前端业务逻辑
└── backend/
    ├── pom.xml            # Maven 配置文件
    └── src/main/
        ├── java/com/ballistic/trajectory/
        │   ├── TrajectoryCompensationApplication.java  # 主启动类
        │   ├── config/          # 配置类
        │   ├── controller/      # REST 控制器
        │   ├── dto/            # 数据传输对象
        │   ├── model/          # 数据实体
        │   ├── repository/     # 数据访问层
        │   └── service/        # 业务逻辑层
        └── resources/
            └── application.properties  # 应用配置
```

## 弹道计算公式说明

### 1. 距离计算（Haversine公式）
用于计算地球上两点之间的水平距离

### 2. 弹道计算模型
- 考虑重力加速度
- 考虑空气阻力影响
- 考虑风速风向影响
- 考虑温度、气压、海拔修正

### 3. MOA 转换公式
将厘米转换为角分（Minute of Angle）用于瞄准调整

## 注意事项

1. 本系统计算结果仅供参考，实际射击需结合现场环境调整
2. 弹道模型采用简化算法，极端条件下可能存在误差
3. 建议在专业人员指导下使用本系统
4. H2 数据库为内存数据库，服务重启后数据会丢失

## 版本历史

### v1.0.0 (2026-05-17)
- 初始版本发布
- 实现六大功能模块
- 前后端完整架构
