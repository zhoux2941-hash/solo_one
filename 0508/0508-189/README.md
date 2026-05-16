# 食堂刷卡消费模拟系统

## 项目简介

基于 Spring Boot + 原生 HTML/JS 的食堂刷卡消费模拟系统。

## 功能特性

1. **员工餐补管理**
   - 每位员工每月自动获得 500 元餐补
   - 每月月初自动重置余额为 500 元

2. **消费功能**
   - 支持选择员工进行消费
   - 输入消费金额和食堂窗口
   - 实时显示余额和今日累计消费

3. **二次确认机制**
   - 当日消费累计超过 50 元时，弹出二次确认框

4. **余额预警**
   - 余额低于 50 元时，首页顶部显示红色警告条
   - 自动发送邮件提醒（控制台日志模拟）

5. **消费记录**
   - 记录每笔消费的员工ID、金额、时间、窗口编号
   - 可查看历史消费记录

6. **员工管理**
   - 支持添加新员工

## 技术栈

### 后端
- Java 8
- Spring Boot 2.7.15
- Spring Data JPA
- H2 内存数据库

### 前端
- 原生 HTML5
- 原生 JavaScript (ES6+)
- CSS3

## 项目结构

```
0508-189/
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/cafeteria/
│   │       │   ├── CafeteriaApplication.java
│   │       │   ├── config/
│   │       │   │   ├── CorsConfig.java
│   │       │   │   └── DataInitializer.java
│   │       │   ├── controller/
│   │       │   │   └── EmployeeController.java
│   │       │   ├── entity/
│   │       │   │   ├── Employee.java
│   │       │   │   └── ConsumptionRecord.java
│   │       │   ├── repository/
│   │       │   │   ├── EmployeeRepository.java
│   │       │   │   └── ConsumptionRecordRepository.java
│   │       │   └── service/
│   │       │       └── EmployeeService.java
│   │       └── resources/
│   │           └── application.properties
│   └── pom.xml
└── frontend/
    └── index.html
```

## 运行说明

### 1. 启动后端服务

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### 2. 访问前端页面

直接用浏览器打开 `frontend/index.html` 文件

### 3. H2 数据库控制台

访问 `http://localhost:8080/h2-console`

- JDBC URL: `jdbc:h2:mem:cafeteria`
- 用户名: `sa`
- 密码: (空)

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/employee/all | 获取所有员工 |
| GET | /api/employee/{employeeId} | 获取员工信息 |
| POST | /api/employee/consume | 消费扣款 |
| GET | /api/employee/{employeeId}/history | 获取消费记录 |
| POST | /api/employee/create | 创建新员工 |

## 初始测试数据

系统启动时会自动创建 3 位测试员工：

- E001 - 张三 - zhangsan@example.com
- E002 - 李四 - lisi@example.com
- E003 - 王五 - wangwu@example.com

每位员工初始余额 500 元。
