# 交通违章管理系统

## 功能说明

### 交警功能
- 录入违章记录（车牌号、时间、地点、罚款金额、扣分）
- 查看所有违章记录

### 车主功能
- 登录系统
- 查看个人违章记录
- 在线缴费（模拟支付）
- 缴费成功后生成电子凭证
- 累计扣分达12分时，系统自动标记"驾照暂扣"并禁止在线缴费

## 技术栈
- 后端：Java + Spring Boot + JPA + H2 Database
- 前端：原生 HTML + CSS + JavaScript

## 运行说明

### 1. 启动后端服务
```bash
cd backend
mvn spring-boot:run
```
后端服务将在 `http://localhost:8080` 启动

### 2. 启动前端
直接在浏览器中打开 `frontend/index.html` 文件

## 测试账号

| 角色 | 用户名 | 密码 | 车牌号 |
|------|--------|------|--------|
| 交警 | police | 123456 | - |
| 车主张三 | zhangsan | 123456 | 粤A12345 |
| 车主李四 | lisi | 123456 | 粤B67890 |

## API接口

### 登录
- POST `/api/auth/login`

### 违章管理
- POST `/api/violations` - 录入违章
- GET `/api/violations` - 获取所有违章
- GET `/api/violations/{id}` - 获取单条违章
- GET `/api/violations/plate/{plateNumber}` - 获取指定车牌所有违章
- GET `/api/violations/plate/{plateNumber}/unpaid` - 获取指定车牌未处理违章
- POST `/api/violations/{id}/pay` - 缴费
