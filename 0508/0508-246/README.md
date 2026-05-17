# 屠宰场检疫管理系统

## 功能模块

### 1. 入场登记
- 扫描RFID耳标
- 录入产地、免疫记录、运输车辆
- 自动记录入场时间

### 2. 检疫记录
- 按RFID搜索生猪
- 检疫员记录检疫结果（合格/不合格）
- 合格进入待宰圈，不合格标记待处理

### 3. 屠宰追溯
- 屠宰线自动扫描
- 胴体与耳标关联
- 建立完整追溯链

### 4. 不合格处理
- 显示待处理不合格生猪列表
- 记录无害化处理方式
- 上报处理结果

### 5. 查询统计
- 按状态查询
- 显示完整的追溯信息

## 技术栈

### 后端
- Java 11
- Spring Boot 2.7.18
- Spring Data JPA
- H2 内存数据库

### 前端
- 原生 HTML5
- 原生 JavaScript (ES6+)
- CSS3

## 运行方式

### 后端启动
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

后端服务运行在：http://localhost:8080

H2数据库控制台：http://localhost:8080/h2-console

### 前端启动
直接用浏览器打开 `frontend/index.html` 即可

## API接口

- POST /api/pigs/register - 生猪入场登记
- POST /api/pigs/{id}/quarantine - 提交检疫结果
- POST /api/pigs/{id}/associate-carcass - 胴体关联
- POST /api/pigs/{id}/dispose - 无害化处理
- GET /api/pigs - 查询所有生猪
- GET /api/pigs/{id} - 按ID查询
- GET /api/pigs/rfid/{rfidTag} - 按耳标查询
- GET /api/pigs/status/{status} - 按状态查询
