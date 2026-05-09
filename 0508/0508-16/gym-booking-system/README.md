# 健身房团课预约系统

一个完整的健身房团课预约管理系统，包含会员预约、签到、数据分析看板等功能。

## 技术栈

### 后端
- **Java 11**
- **Spring Boot 2.7.18**
- **Spring Data JPA** - 数据持久化
- **Spring Data Redis** - 缓存课程剩余名额
- **MySQL** - 主数据库
- **Redis** - 缓存层
- **Lombok** - 简化代码

### 前端
- **Vue 3** - 前端框架
- **Vite** - 构建工具
- **Vue Router 4** - 路由管理
- **Element Plus** - UI组件库
- **Axios** - HTTP客户端
- **ECharts 5** - 数据可视化图表

## 项目结构

```
gym-booking-system/
├── backend/                    # 后端Spring Boot项目
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/gym/
│       │   ├── GymBookingApplication.java    # 启动类
│       │   ├── config/
│       │   │   ├── RedisConfig.java          # Redis配置
│       │   │   └── WebConfig.java            # Web配置(CORS)
│       │   ├── controller/
│       │   │   ├── CourseController.java     # 课程API
│       │   │   ├── BookingController.java    # 预约API
│       │   │   └── AnalyticsController.java  # 数据分析API
│       │   ├── entity/
│       │   │   ├── Course.java               # 课程实体
│       │   │   └── Booking.java              # 预约实体
│       │   ├── repository/
│       │   │   ├── CourseRepository.java
│       │   │   └── BookingRepository.java
│       │   └── service/
│       │       ├── CourseService.java
│       │       ├── BookingService.java
│       │       ├── RedisCacheService.java    # Redis缓存服务
│       │       └── AnalyticsService.java     # 数据分析服务
│       └── resources/
│           ├── application.yml
│           └── schema.sql                    # 数据库初始化脚本
└── frontend/                   # 前端Vue 3项目
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.js
        ├── App.vue
        ├── router/index.js
        ├── utils/api.js        # API封装
        └── views/
            ├── CourseList.vue  # 课程列表页
            ├── MyBookings.vue  # 我的预约页
            └── Analytics.vue   # 数据分析看板
```

## 数据库设计

### 课程表 (course)
| 字段 | 类型 | 说明 |
|------|------|------|
| course_id | BIGINT | 主键，课程ID |
| name | VARCHAR(100) | 课程名称 |
| coach_id | BIGINT | 教练ID |
| coach_name | VARCHAR(50) | 教练姓名 |
| start_time | DATETIME | 课程开始时间 |
| end_time | DATETIME | 课程结束时间 |
| capacity | INT | 课程容量 |
| description | TEXT | 课程描述 |

### 预约记录表 (booking)
| 字段 | 类型 | 说明 |
|------|------|------|
| booking_id | BIGINT | 主键，预约ID |
| user_id | BIGINT | 用户ID |
| user_name | VARCHAR(50) | 用户姓名 |
| course_id | BIGINT | 课程ID |
| status | VARCHAR(20) | 状态：BOOKED/CHECKED_IN/NO_SHOW |
| book_time | DATETIME | 预约时间 |
| checkin_time | DATETIME | 签到时间 |

## 核心功能

### 1. 课程预约
- 查看所有即将开始的课程
- 显示课程剩余名额（Redis缓存）
- 预约课程（自动扣减Redis中的名额）
- 取消预约（自动恢复Redis中的名额）

### 2. 签到系统
- 开课前30分钟可以开始签到
- 课程开始后不能再签到
- 签到后状态更新为 CHECKED_IN

### 3. 爽约机制
- 定时任务每分钟检查过期预约
- 课程结束后仍未签到的预约标记为 NO_SHOW

### 4. 数据分析看板
#### 教练签到率趋势折线图
- 展示每个教练30天内的签到率变化
- 支持选择不同教练查看数据
- Y轴显示百分比，X轴显示日期

#### 签到人数热力图
- X轴：星期一到星期日
- Y轴：时段（06:00-08:00, 08:00-10:00, ..., 20:00-22:00）
- 颜色深浅表示签到人数多少
- 数据基于最近4周

#### 爽约率最高课程 TOP 5 柱状图
- 展示爽约率最高的5门课程
- 显示每门课的爽约率、总预约数、爽约人数

## Redis缓存设计

### 缓存策略
- **Key格式**: `course:capacity:{courseId}`
- **Value**: 剩余名额数量
- **过期时间**: 24小时

### 操作流程
1. 课程创建时：`SET course:capacity:{id} = capacity`
2. 用户预约时：`DECR course:capacity:{id}`（原子操作）
3. 取消预约时：`INCR course:capacity:{id}`（原子操作）
4. 获取名额时：优先从Redis读取，不存在则从数据库初始化

## API接口

### 课程相关
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/courses | 获取所有即将开始的课程 |
| GET | /api/courses/{id} | 获取课程详情 |
| POST | /api/courses | 创建课程 |
| PUT | /api/courses/{id} | 更新课程 |
| DELETE | /api/courses/{id} | 删除课程 |
| GET | /api/courses/{id}/remaining | 获取课程剩余名额 |

### 预约相关
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/bookings | 预约课程 |
| POST | /api/bookings/{id}/checkin | 签到 |
| DELETE | /api/bookings/{id} | 取消预约 |
| GET | /api/bookings/user/{userId} | 获取用户预约列表 |

### 数据分析相关
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/analytics/coaches | 获取所有教练列表 |
| GET | /api/analytics/coach/{id}/checkin-rate?days=30 | 教练签到率趋势 |
| GET | /api/analytics/checkin-heatmap?weeks=4 | 签到热力图数据 |
| GET | /api/analytics/top-no-show-courses?limit=5 | 爽约率TOP5 |

## 快速开始

### 环境要求
- JDK 11+
- Maven 3.6+
- Node.js 16+
- MySQL 8.0+
- Redis 6.0+

### 后端启动

1. 配置数据库
```sql
-- 创建数据库
CREATE DATABASE gym_booking DEFAULT CHARACTER SET utf8mb4;
```

2. 修改 `backend/src/main/resources/application.yml` 中的数据库和Redis配置

3. 启动后端
```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### 前端启动

1. 安装依赖
```bash
cd frontend
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

### 访问应用

打开浏览器访问 `http://localhost:3000`

## 默认测试数据

系统初始化时会插入以下测试课程：

| 课程 | 教练 | 时间 | 容量 |
|------|------|------|------|
| 瑜伽基础课 | 张教练 | 09:00-10:00 | 20人 |
| 动感单车 | 李教练 | 10:30-11:30 | 25人 |
| 普拉提 | 张教练 | 14:00-15:00 | 15人 |
| HIIT训练 | 王教练 | 18:00-19:00 | 30人 |

默认测试用户：
- 用户ID: 1
- 用户姓名: 会员张三

## 注意事项

1. **Redis原子性**: 使用 `DECR/INCR` 原子操作确保并发预约时名额不会超卖
2. **签到时间窗口**: 严格限制在开课前30分钟至开课时间内
3. **爽约标记**: 定时任务自动处理过期预约，无需人工干预
4. **数据一致性**: Redis缓存与数据库保持最终一致，缓存缺失时从数据库恢复
5. **CORS配置**: 后端已配置允许跨域请求，前端可直接调用API

## 扩展建议

1. **用户认证**: 集成 JWT 或 Spring Security 实现登录认证
2. **消息通知**: 预约成功/签到提醒可通过短信或App推送
3. **课程分类**: 添加课程类型、难度等级等筛选条件
4. **会员积分**: 签到获得积分，爽约扣除积分
5. **预约限制**: 限制每人每天预约数量，或对爽约用户进行限制
6. **数据导出**: 支持导出报表为Excel/PDF
7. **权限管理**: 管理员、教练、会员不同角色权限控制
