# ISS Tracker - 国际空间站过境预报网站

## 技术栈
- **前端**: Vue3 + Vite + Element Plus + Leaflet
- **后端**: Java 11 + Spring Boot 2.7
- **数据库**: MySQL 8.0 + Redis

## 功能特性
1. 用户输入经纬度，系统计算未来7天的ISS过境事件
2. 列表展示过境事件，标记可见（仰角>10度）
3. 用户点击"我看到了"，打卡记录过境观测
4. 上传简短描述
5. 每个过境事件累积打卡人数（Redis缓存）
6. 地图展示看见的区域热力图

## 项目结构
```
.
├── backend/                    # 后端Spring Boot项目
│   ├── src/main/java/com/isstracker/
│   │   ├── config/            # 配置类
│   │   ├── controller/        # API控制器
│   │   ├── dto/               # 数据传输对象
│   │   ├── entity/            # JPA实体
│   │   ├── exception/         # 异常处理
│   │   ├── repository/        # 数据访问层
│   │   ├── service/           # 业务逻辑层
│   │   └── IssTrackerApplication.java
│   ├── src/main/resources/
│   │   └── application.yml
│   └── pom.xml
├── frontend/                   # 前端Vue3项目
│   ├── src/
│   │   ├── api/               # API服务
│   │   ├── assets/styles/     # 样式文件
│   │   ├── router/            # 路由配置
│   │   ├── utils/             # 工具函数
│   │   ├── views/             # 页面组件
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/                   # 数据库脚本
│   └── init.sql
└── README.md
```

## API接口

### 过境预测
- **GET** `/api/predict/passes?lat=39.9&lon=116.4` - 获取指定位置未来7天ISS过境事件

### 观测记录
- **POST** `/api/observations` - 创建观测打卡记录
- **GET** `/api/observations/pass/{passEventId}` - 获取指定过境的所有观测
- **GET** `/api/observations/count/{passEventId}` - 获取指定过境的观测人数
- **GET** `/api/observations/heatmap` - 获取热力图数据

## 启动说明

### 前置要求
- JDK 11+
- Maven 3.6+
- Node.js 16+
- MySQL 8.0+
- Redis 6.0+

### 1. 数据库初始化
```bash
# 进入数据库目录
cd database

# 执行初始化脚本
mysql -u root -p < init.sql
```

### 2. 启动后端服务
```bash
# 进入后端目录
cd backend

# 修改配置（如需）
# 编辑 src/main/resources/application.yml
# 修改 MySQL 和 Redis 的连接配置

# 编译并运行
mvn clean install
mvn spring-boot:run
```
后端服务将在 `http://localhost:8080` 启动

### 3. 启动前端服务
```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
前端服务将在 `http://localhost:5173` 启动

### 4. 访问应用
打开浏览器访问：`http://localhost:5173`

## 使用说明

### 过境预报页面
1. 输入或获取当前位置的经纬度
2. 点击"查询过境"按钮
3. 查看未来7天的ISS过境事件列表
4. 可见事件（仰角>10°）会高亮显示
5. 点击"我看到了"进行打卡，可添加简短描述

### 热力图页面
1. 查看全球观测分布
2. 可以显示/隐藏热力图
3. 点击标记点查看详细信息
4. 刷新数据获取最新观测

## 配置说明

### 后端配置 (application.yml)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/iss_tracker
    username: root
    password: your_password
  data:
    redis:
      host: localhost
      port: 6379
      password: your_redis_password
```

### 前端配置 (vite.config.js)
```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',  // 后端地址
      changeOrigin: true
    }
  }
}
```

## 注意事项
- ISS过境预测使用模拟数据，实际项目可接入真实的卫星轨道计算库（如 Orekit、Skyfield 等）
- 真实的ISS过境预测需要：TLE（两行根数）数据、SGP4/SDP4 轨道传播模型
- 建议在生产环境中使用 HTTPS
- 考虑添加用户认证以防止恶意打卡

