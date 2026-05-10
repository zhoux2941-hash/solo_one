# 音乐节志愿者调度系统

一个完整的音乐节志愿者调度系统，基于 Vue3 + Vite + Java Spring Boot + MySQL + Redis 开发。

## 功能特性

### 角色系统
- **志愿者**：注册账号、申请岗位、查看排班、签到
- **组长**：审核申请、分配班次、管理排班
- **管理员**：管理岗位、实时签到统计、导出Excel

### 核心功能
1. **志愿者注册**：注册时填写可工作时间段和技能特长
2. **岗位申请**：选择意向岗位（检票、引导、舞台协助、后勤等）
3. **班次分配**：组长按岗位为志愿者分配具体班次（日期、时间、地点）
4. **排班通知**：分配后志愿者收到通知
5. **移动签到**：支持签到码和GPS定位两种签到方式
6. **防重复签到**：数据库唯一约束确保不重复签到
7. **实时统计**：Redis缓存实现签到人数实时刷新
8. **Excel导出**：支持导出排班表Excel

## 技术栈

### 后端
- Java 17
- Spring Boot 3.2
- Spring Security (JWT认证)
- Spring Data JPA
- Spring Data Redis
- MySQL
- Apache POI (Excel导出)
- Lombok

### 前端
- Vue 3
- Vite
- Pinia (状态管理)
- Vue Router
- Element Plus
- Axios
- Day.js

## 项目结构

```
.
├── backend/                    # Spring Boot 后端
│   ├── pom.xml
│   ├── sql/
│   │   └── init.sql           # 数据库初始化脚本
│   └── src/main/java/com/festival/volunteer/
│       ├── VolunteerSystemApplication.java
│       ├── config/            # 配置类
│       │   ├── SecurityConfig.java
│       │   └── RedisConfig.java
│       ├── controller/        # 控制器
│       │   ├── AuthController.java
│       │   ├── PositionController.java
│       │   ├── VolunteerController.java
│       │   ├── LeaderController.java
│       │   └── AdminController.java
│       ├── dto/               # 数据传输对象
│       ├── entity/            # 实体类
│       │   ├── User.java
│       │   ├── Position.java
│       │   ├── VolunteerApplication.java
│       │   ├── Schedule.java
│       │   ├── CheckIn.java
│       │   └── Notification.java
│       ├── repository/        # 数据访问层
│       ├── security/          # 安全相关
│       │   ├── JwtAuthenticationFilter.java
│       │   └── JwtTokenProvider.java
│       └── service/           # 业务逻辑层
│           ├── AuthService.java
│           ├── PositionService.java
│           ├── ApplicationService.java
│           ├── ScheduleService.java
│           ├── CheckInService.java
│           ├── NotificationService.java
│           └── ExcelExportService.java
│
└── frontend/                   # Vue3 前端
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js
        ├── App.vue
        ├── layouts/
        │   └── MainLayout.vue
        ├── router/
        │   └── index.js
        ├── stores/
        │   └── auth.js
        ├── utils/
        │   ├── api.js
        │   └── constants.js
        └── views/
            ├── Login.vue
            ├── Register.vue
            ├── Dashboard.vue
            ├── NotFound.vue
            ├── Notifications.vue
            ├── volunteer/
            │   ├── Positions.vue
            │   ├── MyApplications.vue
            │   ├── MySchedules.vue
            │   └── CheckIn.vue
            ├── leader/
            │   ├── Applications.vue
            │   └── ScheduleManage.vue
            └── admin/
                ├── PositionManage.vue
                └── CheckInStats.vue
```

## 快速开始

### 环境要求
- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Redis 5.0+
- Maven 3.6+

### 数据库配置

1. 创建MySQL数据库：
```sql
CREATE DATABASE festival_volunteer DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 执行初始化脚本（可选，会自动插入示例岗位）：
```bash
mysql -u root -p festival_volunteer < backend/sql/init.sql
```

3. 修改后端配置文件 `backend/src/main/resources/application.yml`：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/festival_volunteer?useSSL=false&serverTimezone=Asia/Shanghai
    username: your_username
    password: your_password
  
  redis:
    host: localhost
    port: 6379
    password: your_password  # 如果没有密码可删除此行

jwt:
  secret: your_jwt_secret_key

application:
  check-in:
    code: FESTIVAL2024  # 签到码，可自定义
```

### 启动后端

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

后端服务启动在 http://localhost:8080

系统会自动创建默认用户：
- 管理员：admin / admin123
- 组长：leader / leader123

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务启动在 http://localhost:3000

## API 接口说明

### 认证接口
- `POST /api/auth/register` - 志愿者注册
- `POST /api/auth/login` - 登录

### 岗位接口
- `GET /api/positions/list` - 获取所有岗位
- `GET /api/positions/active` - 获取可申请岗位
- `GET /api/positions/{id}` - 获取岗位详情

### 志愿者接口
- `POST /api/volunteer/apply` - 申请岗位
- `GET /api/volunteer/applications` - 我的申请
- `GET /api/volunteer/schedules` - 我的排班
- `POST /api/volunteer/checkin` - 签到
- `GET /api/volunteer/checkin/{scheduleId}` - 查询签到状态
- `GET /api/volunteer/notifications` - 我的通知
- `POST /api/volunteer/notifications/{id}/read` - 标记通知已读
- `POST /api/volunteer/notifications/read-all` - 全部已读

### 组长接口
- `GET /api/leader/applications` - 获取所有申请
- `POST /api/leader/applications/{id}/approve` - 通过申请
- `POST /api/leader/applications/{id}/reject` - 拒绝申请
- `GET /api/leader/volunteers` - 获取所有志愿者
- `POST /api/leader/schedule` - 创建排班
- `GET /api/leader/schedules` - 获取所有排班
- `POST /api/leader/schedules/{id}/cancel` - 取消排班

### 管理员接口
- `POST /api/admin/position` - 新增岗位
- `PUT /api/admin/position/{id}` - 更新岗位
- `DELETE /api/admin/position/{id}` - 停用岗位
- `GET /api/admin/checkin-stats` - 签到统计
- `GET /api/admin/export/schedules` - 导出排班表Excel

## 数据模型

### 用户 (User)
- id, username, password, name, phone, email, role, availableTime, skills

### 岗位 (Position)
- id, name, description, type, requiredCount, currentCount, location, status

### 申请 (VolunteerApplication)
- id, userId, positionId, status, preferredTime, notes

### 排班 (Schedule)
- id, volunteerId, positionId, applicationId, scheduleDate, startTime, endTime, location, status

### 签到 (CheckIn)
- id, scheduleId, volunteerId, positionId, checkInTime, method, checkInCode, latitude, longitude

### 通知 (Notification)
- id, userId, title, content, type, isRead, scheduleId

## 使用流程

1. **志愿者注册登录**
   - 访问 http://localhost:3000
   - 点击注册，填写信息
   - 登录系统

2. **申请岗位**
   - 进入"岗位申请"页面
   - 浏览可申请岗位
   - 点击"立即申请"

3. **组长审核**
   - 使用 leader/leader123 登录
   - 进入"申请审核"页面
   - 通过或拒绝申请

4. **分配排班**
   - 在"申请审核"中点击"分配排班"
   - 或进入"排班管理"新增排班
   - 填写日期、时间、地点等信息

5. **志愿者签到**
   - 志愿者登录后进入"我的排班"
   - 点击"签到"按钮
   - 选择签到码或GPS方式签到
   - 签到码默认：FESTIVAL2024

6. **管理员统计**
   - 使用 admin/admin123 登录
   - 进入"签到统计"查看实时数据
   - 点击"导出排班表"下载Excel

## 注意事项

1. **签到防重复**：数据库对 scheduleId 设置了唯一约束，确保同一排班只能签到一次

2. **Redis缓存**：签到统计数据使用Redis缓存，过期时间5分钟，签到后自动更新缓存

3. **签到码配置**：可在 application.yml 中自定义签到码

4. **角色权限**：
   - 志愿者：VOLUNTEER
   - 组长：LEADER（可访问组长功能）
   - 管理员：ADMIN（可访问所有功能）

5. **JWT Token**：登录后Token存储在localStorage，有效期24小时

## License

MIT
