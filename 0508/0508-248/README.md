# 地铁轨道探伤车检测报告智能分析系统

## 项目简介

本系统是为地铁工务段设计的钢轨伤损检测与维修管理系统，实现探伤检测数据录入、伤损自动分级、维修工单自动生成、统计报表展示等功能。

## 技术栈

### 前端
- 原生 HTML5 + CSS3 + JavaScript
- Chart.js 图表库

### 后端
- Java 8
- Spring Boot 2.7.18
- Spring Data JPA
- H2 内存数据库
- Lombok

## 功能特性

### 1. 探伤检测数据管理
- 支持录入线路区间、里程桩号、钢轨位置、伤损类型、伤损深度、检测日期
- 支持多条件查询和筛选
- 支持删除检测记录

### 2. 伤损严重程度自动分级
- **Ⅰ级 (轻微)**: 伤损深度 < 5mm
- **Ⅱ级 (中度)**: 伤损深度 5mm ~ 10mm
- **Ⅲ级 (严重)**: 伤损深度 > 10mm

### 3. 维修工单自动生成
- Ⅱ级伤损: 建议1个月内修复，自动生成工单
- Ⅲ级伤损: 建议立即修复，自动生成工单
- 支持工单状态管理（待处理 → 处理中 → 已完成）

### 4. 统计报表
- 各区间伤损密度统计与柱状图展示
- 伤损发展趋势预测（历史数据 + 预测曲线）
- 各区间伤损明细统计表
- 各级伤损数量统计卡片

## 项目结构

```
0508-248/
├── frontend/                    # 前端目录
│   ├── css/
│   │   └── style.css           # 样式文件
│   ├── js/
│   │   └── app.js              # 前端逻辑
│   └── index.html              # 主页面
└── backend/                     # 后端目录
    ├── src/
    │   └── main/
    │       ├── java/com/metro/inspection/
    │       │   ├── entity/     # 实体类
    │       │   ├── dto/        # 数据传输对象
    │       │   ├── repository/ # 数据访问层
    │       │   ├── service/    # 业务逻辑层
    │       │   ├── controller/ # 控制器层
    │       │   ├── config/     # 配置类
    │       │   └── RailInspectionApplication.java  # 启动类
    │       └── resources/
    │           └── application.yml  # 配置文件
    └── pom.xml                  # Maven配置
```

## 快速开始

### 环境要求
- JDK 1.8+
- Maven 3.6+

### 启动后端服务

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

后端服务启动后访问：http://localhost:8080

H2数据库控制台：http://localhost:8080/h2-console
- JDBC URL: jdbc:h2:mem:metro_inspection
- 用户名: sa
- 密码: (空)

### 启动前端

直接在浏览器中打开：`frontend/index.html`

## API 接口文档

### 检测记录接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/inspections | 创建检测记录 |
| GET | /api/inspections | 查询检测记录列表 |
| GET | /api/inspections/{id} | 查询单个检测记录 |
| DELETE | /api/inspections/{id} | 删除检测记录 |

查询参数：
- section: 线路区间
- severityLevel: 严重程度 (LEVEL1/LEVEL2/LEVEL3)
- damageType: 伤损类型

### 维修工单接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/work-orders | 查询工单列表 |
| GET | /api/work-orders/{orderNo} | 查询单个工单 |
| PUT | /api/work-orders/{orderNo}/status | 更新工单状态 |

查询参数：
- status: 工单状态 (PENDING/PROCESSING/COMPLETED)

### 报表统计接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/reports/statistics | 获取统计数据 |
| GET | /api/reports/density | 获取区间密度数据 |
| GET | /api/reports/trend | 获取趋势预测数据 |

## 伤损类型说明

- **裂纹**: 钢轨表面或内部出现的裂缝
- **核伤**: 钢轨内部产生的疲劳损伤
- **磨耗**: 钢轨顶部因摩擦产生的磨损

## 使用说明

1. **数据录入**: 在"数据录入"页面填写检测信息并提交
2. **查看记录**: 在"检测列表"页面查看所有检测记录，可按条件筛选
3. **工单管理**: 在"维修工单"页面查看自动生成的工单，可更新工单状态
4. **统计报表**: 在"统计报表"页面查看各类统计图表和数据

## 注意事项

- 系统使用H2内存数据库，重启后数据会丢失
- 前端默认连接后端地址：http://localhost:8080
- 如需持久化数据，可修改application.yml配置切换到MySQL等数据库
