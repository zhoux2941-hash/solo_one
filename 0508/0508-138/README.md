# 🔬 在线矿物鉴定辅助工具

一个基于 Vue3 + Java + MySQL + Redis 的在线矿物鉴定辅助系统，用户可以通过输入矿物的特征（摩氏硬度、条痕色、光泽、解理）来获取可能的矿物种类推荐。

## 🎯 功能特性

- **特征输入**：通过滑块选择摩氏硬度（1-10，步长0.5），通过下拉菜单选择条痕色、光泽、解理类型
- **智能匹配**：基于特征匹配算法，返回匹配度最高的前5种矿物
- **详细信息**：每种矿物展示图片、化学式、典型产地、描述信息
- **众包修正**：用户可以提交"鉴定确认"，系统会根据用户反馈自动修正特征匹配权重
- **Redis缓存**：使用Redis缓存矿物数据，提升查询性能

## 🛠️ 技术栈

### 后端
- **框架**：Spring Boot 2.7.x
- **持久层**：Spring Data JPA + Hibernate
- **数据库**：MySQL 8.0
- **缓存**：Redis + Spring Cache
- **其他**：Lombok、Validation

### 前端
- **框架**：Vue 3 + Composition API
- **构建工具**：Vite
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **UI 组件**：Element Plus
- **HTTP 客户端**：Axios
- **样式**：SCSS

## 📁 项目结构

```
mineral-identification/
├── backend/                    # 后端 Spring Boot 项目
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/mineral/identification/
│       │   ├── config/         # 配置类 (RedisConfig)
│       │   ├── controller/     # 控制器 (MineralController)
│       │   ├── dto/            # 数据传输对象
│       │   ├── entity/         # JPA 实体类
│       │   ├── repository/     # JPA 仓库接口
│       │   ├── service/        # 业务逻辑层
│       │   └── MineralIdentificationApplication.java  # 启动类
│       └── resources/
│           ├── application.yml # 应用配置
│           └── db/             # 数据库脚本
│               ├── schema.sql  # 数据库表结构
│               └── data.sql    # 50种矿物数据及特征
│
└── frontend/                   # 前端 Vue3 项目
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── api/                # API 接口
        ├── components/         # 可复用组件
        ├── router/             # 路由配置
        ├── store/              # Pinia 状态管理
        ├── styles/             # 全局样式
        ├── views/              # 页面视图
        │   └── HomeView.vue    # 主页
        ├── App.vue
        └── main.js
```

## 🚀 快速开始

### 环境要求

- JDK 8 或更高版本
- Node.js 16 或更高版本
- MySQL 8.0
- Redis

### 数据库准备

1. 执行数据库脚本：
```bash
# 登录 MySQL
mysql -u root -p

# 执行表结构和数据脚本
mysql -u root -p < backend/src/main/resources/db/schema.sql
mysql -u root -p < backend/src/main/resources/db/data.sql
```

### 后端启动

1. 进入后端目录：
```bash
cd backend
```

2. 修改数据库配置（如有需要）：
   编辑 `src/main/resources/application.yml`，修改数据库用户名和密码

3. 启动应用：
```bash
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### 前端启动

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

前端应用将在 `http://localhost:3000` 启动

## 🔧 API 接口

### 1. 获取特征选项
```
GET /api/minerals/feature-options
```
返回条痕色、光泽、解理的所有可选值

### 2. 矿物鉴定
```
POST /api/minerals/identify
Content-Type: application/json

{
  "hardness": 7,
  "streak": "white",
  "luster": "glassy",
  "cleavage": "absent"
}
```
参数说明：
- `hardness`: 摩氏硬度（可选，BigDecimal）
- `streak`: 条痕色（可选）
- `luster`: 光泽（可选）
- `cleavage`: 解理（可选）

返回匹配度最高的前5种矿物

### 3. 鉴定确认
```
POST /api/minerals/confirm
Content-Type: application/json

{
  "confirmedMineralId": 7,
  "hardness": 7,
  "streak": "white",
  "luster": "glassy",
  "cleavage": "absent"
}
```
提交用户的鉴定确认，用于众包数据修正

### 4. 查询所有矿物
```
GET /api/minerals
```

### 5. 根据ID查询矿物
```
GET /api/minerals/{id}
```

## 💡 匹配算法说明

### 权重分配
- 摩氏硬度：30%（最重要的鉴定特征）
- 条痕色：25%
- 光泽：25%
- 解理：20%

### 硬度匹配
- 容差范围：±0.5
- 在容差范围内，根据差值计算匹配分数
- 差值越小，匹配分数越高

### 特征匹配
- 条痕色、光泽、解理采用精确匹配
- 每个特征有一个可调整的权重值
- 众包确认会增加相应特征的权重

### 众包修正
- 用户每次确认鉴定结果后，系统会将该矿物对应特征的权重增加 0.01
- 随着用户反馈的积累，匹配算法会越来越精准

## 📊 预设矿物列表

系统预设了50种常见矿物，包括：

**造岩矿物**：石英、长石、云母、角闪石、辉石、橄榄石等

**金属矿石**：赤铁矿、磁铁矿、黄铁矿、方铅矿、闪锌矿、黄铜矿等

**宝石矿物**：金刚石、刚玉（红宝石、蓝宝石）、黄玉、绿柱石（祖母绿、海蓝宝石）、石榴子石等

**其他**：方解石、萤石、磷灰石、滑石、石膏、石墨、硫磺等

## 🎨 界面预览

- **左侧面板**：特征输入区域
  - 摩氏硬度滑块（1-10，步长0.5）
  - 条痕色下拉菜单
  - 光泽下拉菜单
  - 解理下拉菜单
  - 开始鉴定按钮

- **右侧面板**：结果展示区域
  - 排名标识（第1-5名）
  - 矿物中英文名称
  - 匹配度百分比和进度条
  - 矿物图片
  - 化学式、典型产地、描述
  - 鉴定确认按钮

- **悬浮帮助按钮**：点击查看使用说明

## 🔄 缓存策略

- 矿物列表使用 Redis 缓存，缓存时间1小时
- 鉴定确认后自动清除缓存，确保数据一致性
- 特征选项在首次加载后缓存到前端

## 📝 注意事项

1. 确保 MySQL 和 Redis 服务已启动
2. 首次运行需要先执行数据库脚本初始化数据
3. 后端配置文件中的数据库和 Redis 连接信息可能需要根据实际环境修改
4. 矿物图片使用的是外部链接，如无法访问可以替换为本地图片

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
