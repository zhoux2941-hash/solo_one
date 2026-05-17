# 市防洪泵站远程监控与自动启停系统

基于 Spring Boot + 原生 HTML/JS 的泵站监控系统。

## 功能特性

- 泵站设备管理（水泵编号、功率、启/停水位阈值）
- 水位传感器数据上报（每2分钟上报）
- 自动启停控制：
  - 水位 ≥ 启泵水位 → 自动启动水泵
  - 水位 ≤ 停泵水位 → 自动停止水泵
- 运行记录管理（启停时间、运行时长、排水总量）
- 报表统计：
  - 各泵站月排水量
  - 能耗分析
  - 泵效率趋势

## 技术栈

**后端：**
- Spring Boot 2.7.x
- Spring Data JPA
- H2 内存数据库
- Lombok

**前端：**
- 原生 HTML5 + JavaScript
- Chart.js (图表展示)
- CSS3 (响应式设计)

## 快速开始

### 1. 环境要求
- JDK 11+
- Maven 3.6+

### 2. 启动项目

```bash
mvn clean install
mvn spring-boot:run
```

### 3. 访问系统

- 前端监控页面: http://localhost:8080/index.html
- H2数据库控制台: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:pumpdb`
  - 用户名: `admin`
  - 密码: `admin`

## API 接口

### 泵站管理
- `GET /api/pumps` - 获取所有泵站
- `GET /api/pumps/{pumpNo}` - 获取单个泵站
- `POST /api/pumps` - 创建泵站
- `PUT /api/pumps/{pumpNo}` - 更新泵站

### 水位控制
- `POST /api/pumps/{pumpNo}/water-level` - 上报水位
- `GET /api/pumps/{pumpNo}/water-level/history` - 水位历史
- `POST /api/pumps/{pumpNo}/start` - 手动启动水泵
- `POST /api/pumps/{pumpNo}/stop` - 手动停止水泵

### 运行记录
- `GET /api/pumps/{pumpNo}/operations` - 运行历史

### 报表统计
- `GET /api/reports/pump/{pumpNo}/monthly?year=2024&month=5` - 单泵月报
- `GET /api/reports/pump/{pumpNo}/efficiency-trend?months=6` - 效率趋势
- `GET /api/reports/all/monthly?year=2024&month=5` - 所有泵站月报

## 默认测试数据

系统启动时会自动创建3个测试泵站：
- PUMP-001 (75kW, 启泵水位3.5m, 停泵水位1.2m)
- PUMP-002 (90kW, 启泵水位3.8m, 停泵水位1.5m)
- PUMP-003 (110kW, 启泵水位4.0m, 停泵水位1.8m)

## 使用说明

1. 在监控页面可以查看所有泵站实时状态
2. 手动控制水泵启停（也可通过水位自动触发）
3. 使用模拟水位上报功能测试自动启停逻辑
4. 切换到报表分析页面查看月排水量、能耗和效率趋势
