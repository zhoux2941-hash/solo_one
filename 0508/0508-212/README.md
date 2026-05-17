# 野外露营营地线下备案规划系统

基于Spring Boot + 原生HTML/JS开发的野外露营营地管理系统，用于营地区域划分、配套设施登记、露营人员备案和场地使用记录管理。

## 技术栈

### 后端
- Java 8
- Spring Boot 2.7.x
- Spring Data JPA
- H2 内存数据库

### 前端
- HTML5
- CSS3
- 原生 JavaScript (无框架依赖)

## 功能模块

### 1. 营地区域划分
- 支持多种区域类型：休闲区、生火区、取水区、帐篷区、观景区
- 管理区域位置、面积、最大容量等信息
- 区域状态管理：正常、维护中、停用

### 2. 配套设施登记
- 设施类型：厕所、遮阳棚、照明、洗漱、烧烤、桌椅
- 设施状态管理：正常、维护中、损坏
- 完好程度记录：良好、一般、较差

### 3. 露营人员备案
- 团队信息登记：团队名称、领队信息
- 实名备案：身份证号、联系电话
- 露营状态追踪：已预订、露营中、已离开
- 入住/离开时间记录

### 4. 场地使用与维护记录
- 使用记录：记录场地使用时间段和时长
- 维护记录：记录维护人员、时间和内容
- 维护状态管理：待维护、已完成

## 项目结构

```
campsite-management/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/campsite/
│       │       ├── CampsiteApplication.java      # 启动类
│       │       ├── config/
│       │       │   └── CorsConfig.java           # 跨域配置
│       │       ├── controller/                   # 控制器层
│       │       │   ├── CampAreaController.java
│       │       │   ├── FacilityController.java
│       │       │   ├── CampRecordController.java
│       │       │   └── UsageRecordController.java
│       │       ├── entity/                       # 实体类
│       │       │   ├── CampArea.java
│       │       │   ├── Facility.java
│       │       │   ├── CampRecord.java
│       │       │   └── UsageRecord.java
│       │       ├── repository/                   # 数据访问层
│       │       │   ├── CampAreaRepository.java
│       │       │   ├── FacilityRepository.java
│       │       │   ├── CampRecordRepository.java
│       │       │   └── UsageRecordRepository.java
│       │       └── service/                      # 业务逻辑层
│       │           ├── CampAreaService.java
│       │           ├── FacilityService.java
│       │           ├── CampRecordService.java
│       │           └── UsageRecordService.java
│       └── resources/
│           ├── application.properties            # 应用配置
│           ├── schema.sql                        # 数据库表结构
│           ├── data.sql                          # 初始化数据
│           └── static/                           # 前端静态资源
│               ├── css/
│               │   └── style.css
│               ├── js/
│               │   └── common.js
│               ├── index.html                    # 首页
│               ├── area.html                     # 区域管理
│               ├── facility.html                 # 设施管理
│               ├── record.html                   # 人员备案
│               └── usage.html                    # 使用记录
└── pom.xml                                       # Maven配置
```

## 快速开始

### 环境要求
- JDK 1.8+
- Maven 3.6+

### 启动步骤

1. **编译项目**
```bash
mvn clean compile
```

2. **运行项目**
```bash
mvn spring-boot:run
```

3. **访问系统**
- 首页：http://localhost:8080/index.html
- H2数据库控制台：http://localhost:8080/h2-console

### H2数据库配置
- JDBC URL：`jdbc:h2:mem:campsitedb`
- 用户名：`sa`
- 密码：（空）

## API接口文档

### 营地区域接口
- `GET /api/areas` - 获取所有区域
- `GET /api/areas/{id}` - 获取指定区域
- `GET /api/areas/type/{type}` - 按类型查询区域
- `GET /api/areas/status/{status}` - 按状态查询区域
- `POST /api/areas` - 新增区域
- `PUT /api/areas/{id}` - 更新区域
- `DELETE /api/areas/{id}` - 删除区域

### 配套设施接口
- `GET /api/facilities` - 获取所有设施
- `GET /api/facilities/{id}` - 获取指定设施
- `GET /api/facilities/type/{type}` - 按类型查询设施
- `GET /api/facilities/status/{status}` - 按状态查询设施
- `POST /api/facilities` - 新增设施
- `PUT /api/facilities/{id}` - 更新设施
- `DELETE /api/facilities/{id}` - 删除设施

### 露营人员接口
- `GET /api/records` - 获取所有备案
- `GET /api/records/{id}` - 获取指定备案
- `GET /api/records/status/{status}` - 按状态查询备案
- `GET /api/records/area/{areaId}` - 按区域查询备案
- `POST /api/records` - 新增备案
- `PUT /api/records/{id}` - 更新备案
- `DELETE /api/records/{id}` - 删除备案

### 使用记录接口
- `GET /api/usage` - 获取所有记录
- `GET /api/usage/{id}` - 获取指定记录
- `GET /api/usage/type/{type}` - 按类型查询记录
- `GET /api/usage/area/{areaId}` - 按区域查询记录
- `GET /api/usage/maintenance/{status}` - 按维护状态查询
- `POST /api/usage` - 新增记录
- `PUT /api/usage/{id}` - 更新记录
- `DELETE /api/usage/{id}` - 删除记录

## 初始化数据

系统启动时会自动初始化以下示例数据：
- 5个营地区域（休闲区、生火区、取水区、帐篷区、观景区）
- 5个配套设施（厕所、遮阳棚、照明、洗手台、烧烤架）
- 3个露营备案记录
- 3个场地使用记录

## 注意事项

1. H2为内存数据库，重启后数据会重置
2. 如需持久化存储，请修改application.properties中的数据库配置
3. 生产环境建议更换为MySQL等持久化数据库
4. 系统无用户认证功能，适合内部管理使用
