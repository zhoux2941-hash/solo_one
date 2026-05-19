# 在线音乐播放分享 Web 平台

基于 SpringBoot + React + Ant Design + H2 数据库开发的在线音乐 Web 平台。

## 功能特性

### 后端功能
- 用户注册登录（JWT 鉴权）
- 音乐文件上传与存储
- 音乐分类标签管理
- 歌单创建与管理
- 音乐评论互动
- 播放历史记录
- 分享链接生成
- 后台音乐资源审核

### 前端功能
- 登录注册页面
- 音乐发现首页（搜索、热门榜单）
- 在线音乐播放器（无缝播放）
- 歌单管理
- 播放历史
- 用户个人主页
- 音乐详情与评论
- 后台审核页面（管理员）

## 技术栈

### 后端
- SpringBoot 2.7.x
- Spring Data JPA
- Spring Security
- JWT (jjwt)
- H2 数据库
- Lombok

### 前端
- React 18
- React Router 6
- Ant Design 5
- Zustand（状态管理）
- Axios
- Vite

## 项目结构

```
.
├── backend/              # SpringBoot 后端项目
│   ├── src/
│   │   └── main/
│   │       ├── java/com/music/
│   │       │   ├── entity/        # 实体类
│   │       │   ├── repository/    # 数据访问层
│   │       │   ├── service/       # 业务逻辑层
│   │       │   ├── controller/    # 控制器
│   │       │   ├── config/        # 配置类
│   │       │   ├── dto/           # 数据传输对象
│   │       │   └── MusicPlatformApplication.java
│   │       └── resources/
│   │           └── application.yml
│   └── pom.xml
└── frontend/             # React 前端项目
    ├── src/
    │   ├── components/   # 公共组件
    │   ├── pages/        # 页面组件
    │   ├── services/     # API 服务
    │   ├── store/        # 状态管理
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 快速开始

### 环境要求
- JDK 11+
- Node.js 16+
- Maven

### 后端启动

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动。

H2 控制台：`http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/musicdb`
- 用户名: `sa`
- 密码: (空)

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

## 默认管理员账号

首次启动时，您需要注册一个普通用户，然后可以通过 H2 控制台手动将用户角色修改为 `ADMIN` 来获得管理员权限。

## API 接口说明

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 音乐接口
- `GET /api/musics/public/list` - 获取已审核音乐列表
- `GET /api/musics/public/hot` - 获取热门音乐
- `GET /api/musics/public/{id}` - 获取音乐详情
- `POST /api/musics/upload` - 上传音乐（需要登录）
- `GET /api/musics/my-uploads` - 获取我的上传（需要登录）
- `GET /api/musics/admin/pending` - 获取待审核音乐（管理员）
- `POST /api/musics/admin/{id}/approve` - 审核通过（管理员）
- `POST /api/musics/admin/{id}/reject` - 审核拒绝（管理员）

### 文件接口
- `GET /api/files/music/{fileName}` - 获取音乐文件
- `GET /api/files/cover/{fileName}` - 获取封面图片

### 歌单接口
- `GET /api/playlists/my` - 获取我的歌单
- `POST /api/playlists` - 创建歌单
- `GET /api/playlists/{id}/musics` - 获取歌单音乐
- `POST /api/playlists/{playlistId}/musics/{musicId}` - 添加音乐到歌单
- `DELETE /api/playlists/{playlistId}/musics/{musicId}` - 从歌单移除音乐

### 评论接口
- `GET /api/comments/music/{musicId}` - 获取音乐评论
- `POST /api/comments` - 发表评论

### 用户接口
- `GET /api/users/profile` - 获取个人资料
- `PUT /api/users/profile` - 更新个人资料
- `GET /api/users/history` - 获取播放历史

### 分享接口
- `POST /api/shares` - 创建分享链接
- `GET /api/shares/{code}` - 获取分享目标

## 开发说明

### 后端配置
配置文件位于 `backend/src/main/resources/application.yml`，可修改：
- 服务器端口
- 数据库配置
- JWT 密钥和过期时间
- 文件上传路径

### 前端配置
前端配置文件位于 `frontend/vite.config.js`，可修改：
- 开发服务器端口
- API 代理配置

## 注意事项

1. 上传的音乐文件会保存在 `backend/uploads/music` 目录
2. 封面图片会保存在 `backend/uploads/covers` 目录
3. 数据库文件保存在 `backend/data` 目录
4. 所有音乐需要管理员审核通过后才会在公开列表显示
