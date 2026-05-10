# 生物实验室移液路径优化工具

一个帮助生物实验室优化移液枪移液路径的全栈应用。

## 技术栈

- **前端**: Vue 3 + Vite + Element Plus + Pinia
- **后端**: Java 17 + Spring Boot 3 + Spring Data JPA
- **数据库**: MySQL 8+
- **缓存**: Redis

## 功能特性

### 1. 试管架布局管理
- 创建自定义行列数的试管架（默认6x8）
- 可视化编辑孔位试剂类型（样本A/B/C、缓冲液、废液）
- 支持拖拽批量设置孔位

### 2. 实验方案管理
- 创建和管理实验方案
- 添加多个移液任务（源孔 → 目标孔）
- 记录移液体积和备注

### 3. 路径优化
- 基于TSP（旅行商问题）算法计算最短路径
- 两种算法：
  - 最近邻算法（适合任务数≤10）
  - 模拟退火算法（适合任务数>10）
- 可视化展示优化路径和执行顺序
- 支持手动调整顺序并重新计算距离

### 4. 方案分享
- 一键生成8位分享码
- 通过分享码查看他人方案
- 支持导入为自己的方案

## 项目结构

```
0508-132/
├── backend/                    # 后端Spring Boot项目
│   ├── src/main/java/com/biolab/pipette/
│   │   ├── PipetteOptimizerApplication.java  # 主应用类
│   │   ├── algorithm/         # TSP路径优化算法
│   │   ├── config/            # 配置类（CORS、Redis）
│   │   ├── controller/        # API控制器
│   │   ├── dto/               # 数据传输对象
│   │   ├── model/             # 实体模型
│   │   ├── repository/        # 数据访问层
│   │   └── service/           # 业务逻辑层
│   ├── src/main/resources/
│   │   ├── application.yml    # 应用配置
│   │   └── schema.sql         # 数据库初始化脚本
│   └── pom.xml
└── frontend/                   # 前端Vue3项目
    ├── src/
    │   ├── views/             # 页面组件
    │   ├── stores/            # Pinia状态管理
    │   ├── services/          # API服务
    │   ├── router/            # 路由配置
    │   ├── App.vue            # 根组件
    │   └── main.js            # 入口文件
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 快速开始

### 前置要求

- Java 17+
- Node.js 16+
- MySQL 8+
- Redis 6+

### 数据库准备

1. 启动MySQL服务
2. 执行初始化脚本：
```bash
mysql -u root -p < backend/src/main/resources/schema.sql
```

或者直接让Hibernate自动创建表（application.yml中已配置 `ddl-auto: update`）

### 启动后端

```bash
cd backend
# 修改 application.yml 中的数据库和Redis连接信息
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端应用将在 http://localhost:3000 启动

## API接口

### 试管架管理
- `POST /api/tube-racks` - 创建试管架
- `GET /api/tube-racks` - 获取所有试管架
- `GET /api/tube-racks/{id}` - 获取试管架详情
- `PUT /api/tube-racks/{tubeRackId}/wells/{row}/{col}` - 更新孔位
- `PUT /api/tube-racks/{tubeRackId}/wells/batch` - 批量更新孔位
- `DELETE /api/tube-racks/{id}` - 删除试管架

### 实验方案管理
- `POST /api/experiments` - 创建实验方案
- `GET /api/experiments` - 获取所有方案
- `GET /api/experiments/shared` - 获取分享的方案
- `GET /api/experiments/{id}` - 获取方案详情
- `GET /api/experiments/share/{code}` - 通过分享码获取方案
- `PUT /api/experiments/{id}` - 更新方案
- `POST /api/experiments/{id}/share` - 分享方案
- `DELETE /api/experiments/{id}` - 删除方案

### 路径优化
- `POST /api/optimization/optimize` - 执行路径优化
- `POST /api/optimization/calculate-manual` - 计算手动路径距离

## 使用流程

1. **创建试管架**
   - 进入"试管架"页面
   - 点击"新建试管架"，设置行数和列数
   - 选择试剂类型，点击孔位标记试剂

2. **创建实验方案**
   - 进入"实验方案"页面
   - 点击"新建实验方案"，选择试管架
   - 添加移液任务，设置源孔、目标孔、体积

3. **路径优化**
   - 进入"路径优化"页面
   - 选择实验方案，设置起始位置
   - 点击"开始优化"查看结果
   - 可手动调整顺序对比优化效果

4. **分享方案**
   - 在实验方案详情页点击"分享"
   - 获取8位分享码
   - 同事可通过首页"输入分享码"查看

## 算法说明

### 距离计算
使用欧几里得距离计算孔位间距离：
```
距离 = √[(row2 - row1)² + (col2 - col1)²]
```

### 最近邻算法
从起始位置开始，每次选择最近的未访问源孔位，依次完成所有任务。

### 模拟退火算法
模拟物理退火过程，在高温时接受恶化解以避免局部最优，随着温度降低逐渐收敛到全局最优解。

## License

MIT