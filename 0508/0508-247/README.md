# 精神科病房智能门禁与行为分析系统

## 项目简介

本系统为精神专科医院安保科使用，集成了病房门禁管理、患者手环定位、夜间行为分析预警等功能。

## 技术栈

- **后端**: Java + Spring Boot 2.7.x + JPA + H2数据库
- **前端**: 原生 HTML + JavaScript + CSS

## 功能特性

### 1. 病房门禁管理
- 查看所有病房门锁状态
- 护士远程解锁病房门
- 记录解锁原因和操作人
- 管理授权人员名单

### 2. 患者手环定位
- 实时显示患者当前位置
- 位置包括：病房内、走廊、活动室
- 支持模拟位置上报功能

### 3. 夜间行为分析与预警
- 自动分析23:00-6:00期间患者在走廊的活动频次
- 连续3晚活动超过5次/晚时自动推送预警
- 预警提示可能失眠或病情变化

### 4. 预警中心
- 展示所有未读预警信息
- 支持标记已读功能
- 可手动触发分析任务

## 项目结构

```
0508-247/
├── backend/                    # 后端项目
│   ├── pom.xml                # Maven配置
│   └── src/
│       └── main/
│           ├── java/com/psychiatric/
│           │   ├── AccessControlApplication.java    # 主启动类
│           │   ├── entity/                          # 实体类
│           │   ├── repository/                      # 数据访问层
│           │   ├── service/                         # 业务逻辑层
│           │   ├── controller/                      # 控制器
│           │   └── config/                          # 配置类
│           └── resources/
│               └── application.yml                  # 应用配置
└── frontend/                   # 前端项目
    └── index.html             # 主页面
```

## 快速开始

### 环境要求

- JDK 11+
- Maven 3.6+

### 启动后端

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### 访问前端

直接在浏览器中打开 `frontend/index.html` 文件即可

## API接口

### 病房管理
- `GET /api/wards` - 获取所有病房
- `GET /api/wards/{wardNumber}` - 获取单个病房
- `POST /api/wards` - 创建病房
- `POST /api/wards/{wardNumber}/unlock` - 解锁房门
- `POST /api/wards/{wardNumber}/lock` - 锁门

### 患者管理
- `GET /api/patients` - 获取所有患者
- `GET /api/patients/{braceletId}` - 获取单个患者
- `POST /api/patients` - 创建患者
- `POST /api/patients/{braceletId}/location` - 更新位置

### 位置记录
- `GET /api/location-records` - 获取所有位置记录
- `GET /api/location-records/bracelet/{braceletId}` - 获取患者位置记录
- `POST /api/location-records` - 新增位置记录

### 预警管理
- `GET /api/alerts` - 获取所有预警
- `GET /api/alerts/unread` - 获取未读预警
- `POST /api/alerts/{id}/read` - 标记预警已读
- `POST /api/alerts/analyze` - 触发行为分析

## H2数据库控制台

访问 `http://localhost:8080/h2-console` 查看数据库
- JDBC URL: `jdbc:h2:mem:testdb`
- 用户名: `sa`
- 密码: (空)

## 初始化数据

系统启动时自动初始化：
- 3个病房：A101, A102, A103
- 4个患者：张三(B001), 李四(B002), 王五(B003), 赵六(B004)
