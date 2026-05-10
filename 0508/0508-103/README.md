# 智能垃圾桶管理系统

## 项目概述

本项目是一个小区智能垃圾桶管理系统，包含管理后台和居民小程序端。

## 技术栈

- **后端**: Java + Spring Boot + MyBatis-Plus + MySQL + Redis
- **前端**: Vue 3 + Element Plus + Vite

## 功能模块

### 居民功能
- 居民注册（房号、姓名）
- 垃圾投递获得积分
  - 可回收：1kg = 2分
  - 厨余：1kg = 1分
  - 有害/其他：不加分
- 查看积分和兑换记录
- 积分兑换商品

### 管理员功能
- 居民管理（注册、查询）
- 垃圾投递模拟
- 商品管理（增删改查）
- 订单管理（查看、核销、取消）

## 项目结构

```
0508-103/
├── backend/                    # 后端项目
│   ├── src/main/java/
│   │   └── com/example/trashbin/
│   │       ├── common/         # 通用类
│   │       ├── config/         # 配置类
│   │       ├── controller/     # 控制器
│   │       ├── dto/            # 数据传输对象
│   │       ├── entity/         # 实体类
│   │       ├── mapper/         # Mapper接口
│   │       └── service/        # 服务层
│   ├── src/main/resources/
│   │   ├── application.yml     # 应用配置
│   │   └── schema.sql          # 数据库脚本
│   └── pom.xml                 # Maven配置
└── frontend/                   # 前端项目
    ├── src/
    │   ├── api/                # API接口
    │   ├── layouts/            # 布局组件
    │   ├── router/             # 路由配置
    │   ├── utils/              # 工具类
    │   └── views/              # 页面组件
    │       ├── admin/          # 管理后台页面
    │       └── mini/           # 小程序端页面
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 启动说明

### 1. 准备环境

- JDK 1.8+
- Node.js 16+
- MySQL 5.7+
- Redis 5.0+

### 2. 初始化数据库

执行 `backend/src/main/resources/schema.sql` 脚本：

```bash
mysql -u root -p < backend/src/main/resources/schema.sql
```

### 3. 启动后端

修改 `backend/src/main/resources/application.yml` 中的数据库和Redis配置：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/trash_bin?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: your_password
  
  redis:
    host: localhost
    port: 6379
```

启动后端服务：

```bash
cd backend
mvn spring-boot:run
```

后端服务默认运行在 `http://localhost:8080`

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务默认运行在 `http://localhost:3000`

### 5. 访问页面

- **管理后台**: http://localhost:3000/admin
- **小程序端**: http://localhost:3000/mini

## Redis原子操作说明

项目使用Redis Lua脚本实现积分的原子操作，防止并发问题：

### 积分增加（垃圾投递）
```lua
local current = redis.call('get', KEYS[1])
if current == false then
    current = 0
end
local newPoints = tonumber(current) + tonumber(ARGV[1])
redis.call('set', KEYS[1], newPoints)
redis.call('expire', KEYS[1], 86400)
return newPoints
```

### 积分扣减（兑换商品）
```lua
local current = redis.call('get', KEYS[1])
if current == false then
    return -1  -- 积分数据异常
end
local newPoints = tonumber(current) - tonumber(ARGV[1])
if newPoints < 0 then
    return -2  -- 积分不足
end
redis.call('set', KEYS[1], newPoints)
redis.call('expire', KEYS[1], 86400)
return newPoints
```

## API接口

### 居民管理
- `POST /api/resident/register` - 居民注册
- `GET /api/resident/list` - 获取居民列表
- `GET /api/resident/{id}` - 获取居民详情
- `GET /api/resident/{id}/points` - 获取居民积分

### 垃圾投递
- `POST /api/garbage/throw` - 投递垃圾
- `GET /api/garbage/records/{residentId}` - 获取投递记录

### 商品管理
- `POST /api/product` - 添加商品
- `PUT /api/product` - 更新商品
- `DELETE /api/product/{id}` - 删除商品
- `GET /api/product/list` - 获取商品列表
- `GET /api/product/{id}` - 获取商品详情

### 订单管理
- `POST /api/order` - 创建兑换订单
- `POST /api/order/{id}/verify` - 核销订单
- `POST /api/order/{id}/cancel` - 取消订单
- `GET /api/order/list` - 获取订单列表
- `GET /api/order/resident/{residentId}` - 获取居民订单
- `GET /api/order/status/{status}` - 按状态获取订单
