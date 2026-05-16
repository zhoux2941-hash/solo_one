# 体检预约与报告查询系统

基于 Spring Boot + 原生 HTML/JS 的小型体检中心管理系统。

## 功能特性

### 用户端
- ✅ 在线预约体检套餐（基础套餐/升级套餐）
- ✅ 选择预约日期和时段
- ✅ 每日名额限制（50人），实时显示剩余名额
- ✅ 预约成功后发送确认短信（模拟）
- ✅ 手机号查询个人预约记录
- ✅ 在线查看体检报告

### 医生后台
- ✅ 查看所有预约记录
- ✅ 上传体检报告（PDF链接 + 文本指标）
- ✅ 标记异常指标
- ✅ 添加医生诊断建议
- ✅ 查看已上传报告列表

### 报告查看
- ✅ 异常指标高亮显示（红色背景）
- ✅ 医生建议展示
- ✅ PDF报告链接
- ✅ 一键申请报告复查功能

## 技术栈

### 后端
- Java 8
- Spring Boot 2.7.x
- Spring Data JPA
- H2 内存数据库
- Lombok

### 前端
- 原生 HTML5
- 原生 JavaScript (ES6+)
- CSS3 (Flex/Grid)
- 无任何前端框架依赖

## 项目结构

```
medical-reservation/
├── pom.xml
├── README.md
└── src/
    └── main/
        ├── java/
        │   └── com/
        │       └── health/
        │           ├── MedicalApplication.java
        │           ├── controller/
        │           │   ├── HealthPackageController.java
        │           │   ├── ReservationController.java
        │           │   └── MedicalReportController.java
        │           ├── service/
        │           │   ├── HealthPackageService.java
        │           │   ├── ReservationService.java
        │           │   └── MedicalReportService.java
        │           ├── entity/
        │           │   ├── HealthPackage.java
        │           │   ├── Reservation.java
        │           │   ├── MedicalReport.java
        │           │   └── HealthIndicator.java
        │           ├── dto/
        │           │   └── ReservationRequest.java
        │           └── repository/
        │               ├── HealthPackageRepository.java
        │               ├── ReservationRepository.java
        │               └── MedicalReportRepository.java
        └── resources/
            ├── application.properties
            └── static/
                ├── index.html      # 用户预约首页
                ├── report.html     # 报告查看页
                ├── doctor.html     # 医生后台
                └── app.js          # 前端逻辑
```

## 快速启动

### 环境要求
- JDK 8+
- Maven 3.6+

### 启动步骤

1. **进入项目目录**
   ```bash
   cd 0508-195
   ```

2. **编译项目**
   ```bash
   mvn clean package -DskipTests
   ```

3. **运行项目**
   ```bash
   mvn spring-boot:run
   ```

   或者直接运行 JAR：
   ```bash
   java -jar target/medical-reservation-1.0.0.jar
   ```

4. **访问系统**
   - 用户端：http://localhost:8080/index.html
   - 医生后台：http://localhost:8080/doctor.html
   - H2数据库控制台：http://localhost:8080/h2-console

### H2数据库配置
- JDBC URL：`jdbc:h2:mem:medicaldb`
- 用户名：`sa`
- 密码：（空）

## API 接口文档

### 套餐接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/packages | 获取所有体检套餐 |
| GET | /api/packages/{id} | 获取指定套餐详情 |

### 预约接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/reservations/slots?date=yyyy-MM-dd | 查询指定日期剩余名额 |
| POST | /api/reservations | 创建预约 |
| GET | /api/reservations/phone/{phone} | 手机号查询预约记录 |
| GET | /api/reservations | 获取所有预约 |
| GET | /api/reservations/{id} | 获取指定预约详情 |

### 报告接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/reports | 上传体检报告 |
| GET | /api/reports/reservation/{id} | 根据预约ID查询报告 |
| GET | /api/reports/phone/{phone} | 手机号查询报告列表 |
| GET | /api/reports | 获取所有报告 |
| POST | /api/reports/{id}/recheck | 申请报告复查 |

## 使用流程

### 用户预约流程
1. 打开 http://localhost:8080/index.html
2. 选择体检套餐（基础/升级）
3. 填写个人信息（姓名、手机号、身份证）
4. 选择预约日期和时段
5. 提交预约，收到短信通知

### 报告查询流程
1. 点击"我的预约"标签
2. 输入手机号查询
3. 点击"查看报告"按钮查看详情
4. 如有异常，可点击"申请报告复查"

### 医生上传报告流程
1. 打开 http://localhost:8080/doctor.html
2. 在预约列表找到对应记录
3. 点击"上传报告"按钮
4. 填写体检指标，标记异常项
5. 添加医生建议，保存报告

## 预置数据

系统启动时自动创建两个体检套餐：

| 套餐名称 | 价格 | 包含项目 |
|---------|------|---------|
| 基础体检套餐 | ¥299 | 身高、体重、血压、血常规、尿常规、肝功能、肾功能、心电图、胸片 |
| 升级体检套餐 | ¥599 | 基础套餐 + 甲状腺功能、肿瘤标志物、腹部彩超、甲状腺彩超、颈椎DR |

## 配置说明

主要配置项在 `application.properties`：

```properties
# 每日预约名额限制
medical.daily.limit=50

# 服务器端口
server.port=8080
```

## 注意事项

1. **数据持久化**：当前使用 H2 内存数据库，重启后数据会丢失。如需持久化，可修改为 MySQL 等数据库。
2. **短信功能**：当前为模拟实现，仅在控制台打印短信内容。生产环境需对接真实短信服务商。
3. **PDF上传**：当前仅支持填写 PDF 链接。如需支持文件上传，需添加文件存储逻辑。
4. **权限控制**：医生后台未做登录验证，生产环境需添加用户认证系统。

## 扩展建议

- [ ] 添加用户登录/注册功能
- [ ] 接入真实短信服务（阿里云、腾讯云等）
- [ ] 支持 PDF 文件上传和存储
- [ ] 添加数据统计和报表功能
- [ ] 支持在线支付
- [ ] 添加预约提醒（短信/邮件）
- [ ] 支持导出报告为 PDF
