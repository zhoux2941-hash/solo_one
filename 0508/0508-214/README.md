# 监狱服刑人员亲情电话管理系统

## 项目简介

这是一个面向监狱通信管理部门的亲情电话管理系统，实现了通话配额管理、实时敏感词检测、预警推送、统计报表等核心功能。

## 技术栈

### 后端
- Spring Boot 2.7.18
- Spring Data JPA
- H2 内存数据库
- Lombok

### 前端
- 原生 HTML5
- 原生 JavaScript
- CSS3

## 核心功能

### 1. 通话配额管理
- 服刑人员每月通话次数配额（默认3次/月）
- 单次通话最长时长限制（默认15分钟）
- 通话前自动检查配额

### 2. 敏感词检测
- 支持敏感词库管理
- 通话转文字后自动检测敏感词
- 支持敏感词分类和严重级别设置

### 3. 预警管理
- 检测到敏感词后自动生成预警
- 预警待处理/已处理状态管理
- 预警处理记录留存

### 4. 统计报表
- 各监区通话频次统计
- 通话趋势分析（近7日/30日）
- 敏感词命中趋势分析
- 首页数据概览

## 项目结构

```
prison-call-system/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/prison/call/
│       │       ├── PrisonCallApplication.java
│       ├── entity/
│       │   ├── Inmate.java           # 服刑人员实体
│       │   ├── CallRecord.java       # 通话记录实体
│       │   ├── SensitiveWord.java    # 敏感词实体
│       │   └── Alert.java            # 预警实体
│       ├── repository/
│       │   ├── InmateRepository.java
│       │   ├── CallRecordRepository.java
│       │   ├── SensitiveWordRepository.java
│       │   └── AlertRepository.java
│       ├── service/
│       │   ├── InmateService.java
│       │   ├── CallService.java
│       │   ├── SensitiveWordService.java
│       │   ├── AlertService.java
│       │   └── ReportService.java
│       └── controller/
│           ├── InmateController.java
│           ├── CallController.java
│           ├── SensitiveWordController.java
│           ├── AlertController.java
│           └── ReportController.java
│       └── resources/
│           ├── application.yml
│           └── static/
│               ├── index.html
│               └── app.js
└── pom.xml
```

## 快速开始

### 环境要求
- JDK 11+
- Maven 3.6+

### 启动步骤

1. 进入项目根目录
```bash
cd prison-call-system
```

2. 使用Maven编译项目
```bash
mvn clean compile
```

3. 启动Spring Boot应用
```bash
mvn spring-boot:run
```

4. 访问系统
```
http://localhost:8080
```

### H2数据库控制台

项目集成了H2内存数据库，可通过以下地址访问数据库控制台：
```
http://localhost:8080/h2-console
```

连接参数：
- JDBC URL: `jdbc:h2:mem:prison_db`
- 用户名: `sa`
- 密码: (空)

## API接口文档

### 服刑人员管理
- `GET /api/inmates` - 获取所有服刑人员
- `GET /api/inmates/{id}` - 根据ID获取服刑人员
- `POST /api/inmates` - 新增服刑人员
- `PUT /api/inmates/{id}` - 更新服刑人员
- `DELETE /api/inmates/{id}` - 删除服刑人员

### 通话管理
- `GET /api/calls/quota/{inmateId}` - 检查通话配额
- `POST /api/calls/start` - 开始通话
- `POST /api/calls/end/{callId}` - 结束通话
- `GET /api/calls` - 获取所有通话记录
- `GET /api/calls/sensitive` - 获取含敏感词的通话记录

### 敏感词管理
- `GET /api/sensitive-words` - 获取所有敏感词
- `POST /api/sensitive-words/detect` - 检测文本中的敏感词
- `POST /api/sensitive-words` - 新增敏感词
- `DELETE /api/sensitive-words/{id}` - 删除敏感词

### 预警管理
- `GET /api/alerts` - 获取所有预警
- `GET /api/alerts/pending` - 获取待处理预警
- `PUT /api/alerts/{id}/handle` - 处理预警

### 统计报表
- `GET /api/reports/dashboard` - 首页统计数据
- `GET /api/reports/prison-area-calls` - 各监区通话统计
- `GET /api/reports/call-trend?days=30` - 通话趋势统计
- `GET /api/reports/alert-trend?days=30` - 预警趋势统计

## 默认数据

系统启动时会自动初始化以下测试数据：

### 服刑人员
- P001 张三（男，一监区）
- P002 李四（男，一监区）
- P003 王五（男，二监区）
- P004 赵六（男，二监区）
- P005 陈七（女，三监区）

### 敏感词库
- 逃脱类：越狱、逃跑、逃狱、劫狱
- 暴力类：袭击、打人、杀人、报复
- 毒品类：毒品、白粉、海洛因、冰毒
- 武器类：枪支、刀、武器、炸药
- 自伤类：自杀、自残、上吊
- 其他类：贿赂、送礼、钱、好处

## 系统截图

### 首页概览
展示系统统计数据、通话趋势、预警趋势和最新预警列表。

### 通话管理
- 选择服刑人员
- 检查通话配额
- 开始/结束通话
- 输入通话内容（模拟转文字）
- 自动检测敏感词并生成预警

### 通话记录
查看所有通话记录，包含服刑人员信息、通话时间、时长、是否含敏感词等。

### 预警管理
查看和处理预警，支持查看通话详情和标记处理状态。

### 服刑人员管理
管理服刑人员信息，设置通话配额和最长通话时长。

### 敏感词管理
维护敏感词库，支持添加、删除敏感词。

### 统计报表
展示各监区通话频次、通话趋势、敏感词命中趋势等图表。

## 配置说明

可通过 `application.yml` 配置系统参数：

```yaml
system:
  call:
    monthly-quota: 3      # 默认每月通话次数
    max-duration-minutes: 15  # 默认单次最长通话时长(分钟)
```

## 注意事项

1. 本系统使用H2内存数据库，重启后数据会丢失，生产环境建议替换为MySQL等持久化数据库。
2. 敏感词检测功能为模拟实现，实际应用可集成更专业的语音转文字和敏感词检测服务。
3. 系统未实现用户认证和权限管理，生产环境建议添加Spring Security等安全框架。

## 许可证

本项目仅供学习研究使用。
