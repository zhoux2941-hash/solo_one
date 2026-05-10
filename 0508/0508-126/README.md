# 恒星光谱分类教学工具

一个交互式的恒星光谱分类在线教学工具，使用 Vue3 + Java + MySQL + Redis 技术栈。

## 功能特性

- 🎯 **模拟光谱展示**：展示包含氢线、金属线等特征吸收线的模拟光谱
- 🎮 **交互学习**：从 O, B, A, F, G, K, M 七个光谱类型中选择，通过滑块调整有效温度
- 📊 **实时匹配**：系统根据用户选择重新生成标准光谱模板，计算相关系数给出匹配度
- 🔬 **真实样本**：提供 SDSS 公开数据的模拟样本示例
- 📈 **学习统计**：记录用户分类正确率，给出对应温度和颜色的详细解释
- ⚡ **Redis 缓存**：预先生成的光谱模板使用 Redis 缓存，提升响应速度

## 技术栈

### 后端
- Java 17
- Spring Boot 3.2
- Spring Data JPA
- Spring Data Redis
- MySQL 8.0+
- Apache Commons Math3 (相关系数计算)

### 前端
- Vue 3
- Vite
- Chart.js + vue-chartjs (光谱可视化)
- Axios

## 项目结构

```
0508-126/
├── backend/                    # Java 后端
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/astronomy/spectral/
│       │   ├── config/         # Redis 配置
│       │   ├── controller/     # REST API
│       │   ├── model/          # 数据模型
│       │   ├── repository/     # JPA 仓库
│       │   ├── service/        # 业务逻辑
│       │   └── SpectralClassificationApplication.java
│       └── resources/
│           └── application.yml
└── frontend/                   # Vue3 前端
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.vue             # 主应用组件
        ├── main.js
        ├── style.css
        └── components/
            └── SpectrumChart.vue  # 光谱图表组件
```

## 光谱类型说明

| 类型 | 温度范围 (K) | 颜色 | 特征 |
|------|-------------|------|------|
| O | 30,000 - 60,000 | 蓝白色 | 氦电离线强，氢线弱 |
| B | 10,000 - 30,000 | 蓝白色 | 中性氦线强，氢线增强 |
| A | 7,500 - 10,000 | 白色 | 氢线最强，金属线开始出现 |
| F | 6,000 - 7,500 | 黄白色 | 氢线减弱，金属线增强 |
| G | 5,000 - 6,000 | 黄色 | 氢线弱，金属线和分子带强（太阳型） |
| K | 3,500 - 5,000 | 橙黄色 | 氢线很弱，分子带很强 |
| M | 2,400 - 3,500 | 红色 | 分子带主导，金属线强 |

## 安装与运行

### 环境要求
- JDK 17+
- Maven 3.6+
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+

### 1. 配置 MySQL 数据库

创建数据库：
```sql
CREATE DATABASE spectral_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

修改 `backend/src/main/resources/application.yml` 中的数据库连接配置：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/spectral_db
    username: your_username
    password: your_password
```

### 2. 启动 Redis

确保 Redis 服务在本地运行（默认端口 6379）。

### 3. 启动后端服务

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动。

### 4. 启动前端开发服务器

```bash
cd frontend
npm install
npm run dev
```

前端将在 `http://localhost:5173` 启动。

### 5. 访问应用

打开浏览器访问 `http://localhost:5173` 即可使用。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/spectrum/types | 获取所有光谱类型 |
| GET | /api/spectrum/types/{type} | 获取指定类型的详细信息 |
| GET | /api/spectrum/generate | 生成指定类型和温度的光谱 |
| GET | /api/spectrum/target | 获取随机目标光谱 |
| GET | /api/spectrum/sdss/{type} | 获取 SDSS 样本光谱 |
| POST | /api/spectrum/classify | 提交分类结果并计算匹配度 |
| GET | /api/spectrum/stats | 获取用户学习统计 |

## 核心算法

### 光谱生成
1. 使用普朗克黑体辐射公式生成连续谱
2. 根据恒星类型叠加特征吸收线（高斯轮廓）
3. 添加随机噪声模拟真实观测
4. 归一化强度到 [0, 1] 区间

### 匹配度计算
使用 Pearson 相关系数计算用户生成光谱与目标光谱的相似度：
- 相关系数范围 [-1, 1]
- 转换为匹配度：(correlation + 1) / 2 * 100
- 匹配度 ≥ 70% 为良好

## 学习指南

1. **观察目标光谱**：注意吸收线的位置和深度
2. **选择光谱类型**：根据特征线选择可能的类型
3. **调整温度滑块**：观察光谱形状的变化
4. **提交分类**：查看匹配度和正确答案
5. **学习解释**：了解该类型恒星的特征
6. **浏览 SDSS 样本**：熟悉真实观测光谱

## License

MIT License
