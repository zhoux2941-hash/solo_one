# 榫卯结构参数化工具

一个基于 Vue3 + Java Spring Boot + MySQL + Redis + Three.js 的木工榫卯结构在线参数化设计工具。

## 功能特性

- 🎨 **多种榫卯类型**: 支持燕尾榫、直榫、夹头榫、框榫、搭接榫等多种传统榫卯结构
- 📐 **参数化设计**: 可自定义木料尺寸、榫头尺寸、加工余量等参数
- 🔄 **实时3D预览**: 使用Three.js实现实时3D渲染，支持旋转、缩放、平移
- 📄 **图纸导出**: 支持导出STL格式用于3D打印，或PDF格式图纸（带尺寸标注）
- ⭐ **收藏功能**: 保存常用参数组合，快速调用

## 技术栈

### 后端
- Java 17
- Spring Boot 3.2
- Spring Data JPA
- Spring Data Redis
- MySQL 8.0
- iText 7 (PDF导出)

### 前端
- Vue 3 (Composition API)
- Vite 5
- Element Plus
- Three.js (3D渲染)
- Pinia (状态管理)
- Vue Router
- Axios

## 项目结构

```
├── backend/                    # 后端项目
│   ├── src/main/java/com/woodjoin/
│   │   ├── controller/      # 控制器
│   │   ├── service/         # 业务逻辑
│   │   ├── entity/          # 实体类
│   │   ├── dto/             # 数据传输对象
│   │   ├── repository/      # 数据访问层
│   │   ├── config/          # 配置类
│   │   └── exception/     # 异常处理
│   ├── src/main/resources/
│   │   └── application.yml
│   └── pom.xml
└── frontend/                 # 前端项目
    ├── src/
    │   ├── api/            # API接口
    │   ├── components/     # 组件
    │   ├── router/         # 路由
    │   ├── stores/        # 状态管理
    │   ├── styles/        # 样式
    │   ├── utils/         # 工具类
    │   ├── views/         # 页面视图
    │   ├── App.vue
    │   └── main.js
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 快速开始

### 环境要求
- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Maven 3.8+

### 后端启动

1. **启动MySQL并创建数据库**
```sql
CREATE DATABASE woodjoin DEFAULT CHARACTER SET utf8mb4;
```

2. **启动Redis**（默认端口6379）

3. **修改配置文件** `backend/src/main/resources/application.yml
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/woodjoin
    username: root
    password: your_password
```

4. **运行后端服务
```bash
cd backend
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

### 前端启动

1. **安装依赖**
```bash
cd frontend
npm install
```

2. **开发模式运行
```bash
npm run dev
```

前端将在 http://localhost:3000 启动

### API接口

#### 榫卯相关
- `POST /api/join/calculate` - 计算榫卯参数
- `POST /api/join/export/stl` - 导出STL文件
- `POST /api/join/export/pdf` - 导出PDF文件

#### 收藏相关
- `GET /api/favorites` - 获取收藏列表
- `POST /api/favorites` - 新建收藏
- `PUT /api/favorites/{id}` - 更新收藏
- `DELETE /api/favorites/{id}` - 删除收藏

#### 应力模拟
- `GET /api/stress/directions` - 获取载荷方向列表
- `POST /api/stress/simulate` - 执行应力模拟分析
  - 参数: `joinType`, `woodLength`, `woodWidth`, `woodHeight`, `tenonLength`, `tenonWidth`, `tenonHeight`, `margin`, `loadForce`, `loadDirection`
  - 返回: 应力分布、安全系数、风险等级等

#### 其他
- `GET /api/join-types` - 获取榫卯类型列表
- `GET /api/health` - 健康检查

## 使用说明

1. **选择榫卯类型**：在左侧面板选择需要的榫卯类型
2. **设置参数**：调整木料尺寸、榫头尺寸和加工余量
3. **实时预览**：右侧3D视图实时更新，可通过鼠标交互
4. **应力模拟**：点击"应力模拟"按钮，设置载荷大小和方向，查看伪彩色应力分布
5. **导出图纸**：点击导出按钮下载STL或PDF文件
6. **收藏参数**：点击收藏按钮保存常用参数组合

## 应力模拟功能

### 载荷方向
| 方向 | 说明 |
|------|------|
| TENSION | 拉伸载荷 - 沿榫卯轴线方向拉伸 |
| COMPRESSION | 压缩载荷 - 沿榫卯轴线方向压缩 |
| SHEAR | 剪切载荷 - 垂直于榫卯轴线方向剪切 |
| BENDING | 弯曲载荷 - 垂直于榫卯轴线方向弯曲 |

### 风险等级
- **安全 (绿色)**：安全系数 > 3.0，设计合理
- **中等 (橙色)**：安全系数 1.5-3.0，建议优化
- **高风险 (红色)**：安全系数 < 1.5，需调整设计

### 伪彩色图例
- 🔵 蓝色 - 低应力区域
- 🔵🟢 青色 - 较低应力
- 🟢🟡 黄绿 - 中等应力
- 🟡🟠 黄橙 - 较高应力
- 🔴 红色 - 高应力集中区域

## 榫卯类型说明

| 类型 | 说明 | 适用场景
|------|------|--------
| 燕尾榫 | 梯形截面，抗拉力强 | 抽屉、柜体连接
| 直榫 | 简单通用 | 框架结构
| 夹头榫 | 带肩部夹紧结构 | 桌腿、家具腿连接
| 框榫 | 指接结构 | 门框、窗框拼接
| 搭接榫 | 半搭接结构 | 梁架、横梁连接

## 许可证

MIT License