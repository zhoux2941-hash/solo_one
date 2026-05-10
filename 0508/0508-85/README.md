# 密室剧本协作编辑器

一个支持多人实时协作的密室剧本编辑器系统。

## 技术栈

### 后端
- Java 17
- Spring Boot 2.7.x
- Spring Data JPA
- Spring Data Redis
- Spring WebSocket (STOMP)
- MySQL 8.0
- Redis
- iText7 (PDF导出)

### 前端
- Vue 3
- Vite
- Vue Router 4
- Pinia (状态管理)
- Element Plus (UI组件库)
- Axios (HTTP请求)
- SockJS + STOMP.js (WebSocket)

## 功能特性

- ✅ 创建剧本（名称、背景故事、难度预估）
- ✅ 场景管理（添加/编辑/删除场景，支持场景名、描述、图片URL）
- ✅ 谜题链管理（每个场景下的谜题链，包含谜面、解谜方式、答案、解锁条件）
- ✅ 多人协作编辑（WebSocket实时广播更新）
- ✅ PDF导出功能
- ✅ Redis缓存场景编辑锁，防止冲突

## 项目结构

```
.
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/escaperoom/
│   │   │   │   ├── ScriptEditorApplication.java    # 启动类
│   │   │   │   ├── config/                         # 配置类
│   │   │   │   ├── controller/                     # 控制器
│   │   │   │   ├── dto/                            # 数据传输对象
│   │   │   │   ├── entity/                         # 实体类
│   │   │   │   ├── repository/                     # 数据访问层
│   │   │   │   └── service/                        # 服务层
│   │   │   └── resources/
│   │   │       ├── application.yml                 # 配置文件
│   │   │       └── schema.sql                      # 数据库脚本
│   └── pom.xml
│
└── frontend/                # 前端项目
    ├── src/
    │   ├── api/                           # API接口
    │   ├── router/                        # 路由配置
    │   ├── stores/                        # Pinia状态管理
    │   ├── views/                         # 页面组件
    │   ├── App.vue                        # 根组件
    │   └── main.js                        # 入口文件
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 环境要求

- JDK 17+
- Maven 3.6+
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+

## 快速启动

### 1. 启动数据库服务

确保MySQL和Redis服务已启动。

MySQL配置（默认）:
- Host: localhost
- Port: 3306
- Username: root
- Password: root

Redis配置（默认）:
- Host: localhost
- Port: 6379
- No password

如需修改配置，请编辑 `backend/src/main/resources/application.yml`

### 2. 初始化数据库

MySQL会自动创建表结构（JPA ddl-auto=update），也可以手动执行：

```bash
mysql -u root -p < backend/src/main/resources/schema.sql
```

### 3. 启动后端

```bash
cd backend
mvn clean package -DskipTests
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 http://localhost:3000 启动

## 使用说明

1. 打开浏览器访问 http://localhost:3000
2. 点击"创建新剧本"，填写剧本信息
3. 在剧本列表中点击剧本卡片进入编辑器
4. 在编辑器左侧添加场景
5. 选中场景后，在右侧编辑场景信息和添加谜题
6. 实时协作：多人同时打开同一个剧本，编辑内容会实时同步
7. 点击右上角"导出PDF"按钮可导出剧本为PDF文件

## 实时协作说明

- 使用STOMP over WebSocket进行实时通信
- 订阅的Topic:
  - `/topic/script/{id}/updated` - 剧本更新
  - `/topic/script/{id}/scene/updated` - 场景更新
  - `/topic/script/{id}/scene/deleted` - 场景删除
  - `/topic/scene/{id}/puzzle/updated` - 谜题更新
  - `/topic/scene/{id}/puzzle/deleted` - 谜题删除

## API接口

### 剧本管理
- `GET /api/scripts` - 获取所有剧本
- `GET /api/scripts/{id}` - 获取剧本详情
- `POST /api/scripts` - 创建剧本
- `PUT /api/scripts/{id}` - 更新剧本
- `DELETE /api/scripts/{id}` - 删除剧本
- `GET /api/scripts/{id}/export` - 导出PDF

### 场景管理
- `POST /api/scenes?scriptId={scriptId}` - 添加场景
- `PUT /api/scenes/{sceneId}` - 更新场景
- `DELETE /api/scenes/{sceneId}` - 删除场景

### 谜题管理
- `POST /api/puzzles?sceneId={sceneId}` - 添加谜题
- `PUT /api/puzzles/{puzzleId}` - 更新谜题
- `DELETE /api/puzzles/{puzzleId}` - 删除谜题

## 缓存机制

使用Redis缓存场景编辑锁：
- Key: `scene:lock:{sceneId}`
- 超时时间: 30秒
- 防止多人同时编辑同一个场景

## 注意事项

1. 首次启动前确保MySQL和Redis已安装并启动
2. 如果使用不同的数据库密码，请修改 `application.yml` 中的配置
3. 前端开发模式下使用Vite代理转发API请求到后端
4. 生产环境需要配置Nginx或其他反向代理
