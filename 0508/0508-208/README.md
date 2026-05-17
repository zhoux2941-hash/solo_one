# 机场失物招领系统

基于 Spring Boot + 原生 HTML/JS 的机场失物招领内部管理系统。

## 功能特性

### 工作人员功能
- ✅ 拾到物品登记（物品名称、品牌、颜色、地点、日期、照片）
- ✅ 物品列表管理
- ✅ 遗失申报查看
- ✅ 智能匹配系统（关键词+地点匹配，匹配度评分）
- ✅ 认领预约管理

### 乘客功能
- ✅ 遗失物品申报
- ✅ 查看匹配物品
- ✅ 预约认领

## 技术栈

**后端：**
- Spring Boot 2.7.15
- Spring Data JPA
- H2 内存数据库
- Maven

**前端：**
- 原生 HTML5
- 原生 JavaScript (ES6+)
- CSS3

## 快速开始

### 1. 启动后端服务

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

### 2. 访问前端

直接在浏览器中打开 `frontend/index.html` 文件即可

## API 接口

### 物品管理
- `POST /api/found-items` - 登记拾到物品
- `GET /api/found-items` - 获取所有物品
- `GET /api/found-items/{id}` - 获取单个物品
- `PUT /api/found-items/{id}/status` - 更新物品状态

### 遗失申报
- `POST /api/lost-claims` - 提交遗失申报
- `GET /api/lost-claims` - 获取所有申报
- `GET /api/lost-claims/{id}/matches` - 获取匹配结果

### 认领预约
- `POST /api/appointments` - 创建预约
- `GET /api/appointments` - 获取所有预约
- `PUT /api/appointments/{id}/status` - 更新预约状态

## H2 数据库控制台

访问：http://localhost:8080/h2-console

- JDBC URL: `jdbc:h2:mem:lostfounddb`
- 用户名: `sa`
- 密码: (空)

## 匹配算法说明

系统采用多维度智能匹配：

| 匹配维度 | 分值 |
|---------|------|
| 关键词匹配 | 每个关键词 +25分 |
| 地点完全匹配 | +30分 |
| 地点部分匹配 | +15分 |
| 日期相差1天内 | +15分 |
| 日期相差3天内 | +10分 |
| 日期相差7天内 | +5分 |

满分：100分
