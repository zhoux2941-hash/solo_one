# 虚拟展厅导览系统 (WebXR)

基于 Three.js 和 WebXR 的 360° 全景虚拟展厅导览应用，支持 VR 模式、手机陀螺仪魔镜模式和交互式3D展品展示。

## 功能特性

- 🌐 **360° 全景展示** - 使用 Equirectangular 映射渲染全景场景
- 🎯 **热点交互** - 3D 球面标记，支持场景跳转、信息展示和3D模型预览
- 📦 **交互式3D展品** - 点击紫色热点可360°旋转查看3D模型，支持缩放、自动旋转
- 🥽 **VR 模式** - 支持 WebXR 沉浸式 VR 体验（需 VR 设备）
- 📱 **魔镜模式** - 利用手机陀螺仪控制视角，支持校准
- 🗺️ **导航地图** - 缩略图显示当前位置，点击快速跳转
- 💾 **管理后台** - 可视化上传全景图、配置热点、上传3D模型
- 📤 **配置导入导出** - JSON 格式配置文件

## 技术栈

- **前端**: Three.js, Vite, 原生 JavaScript
- **后端**: Node.js, Express, Multer
- **XR**: WebXR API

## 项目结构

```
virtual-exhibition/
├── src/
│   ├── main.js              # 应用入口
│   └── VirtualExhibition.js # 核心渲染类
├── server/
│   ├── index.js             # Express 后端 API
│   └── admin.html           # 管理后台页面
├── uploads/                 # 上传的全景图片
├── index.html               # 展厅首页
├── package.json             # 依赖配置
├── vite.config.js           # Vite 配置
└── README.md
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

同时启动前端开发服务器和后端 API：

```bash
npm run dev
```

- 展厅访问: http://localhost:3000
- 管理后台: http://localhost:3001/admin

### 单独启动服务

```bash
# 仅启动后端 API (端口 3001)
npm run server

# 仅启动前端开发服务器 (端口 3000)
npm run client
```

## 使用说明

### 展厅操作

- **旋转视角**: 鼠标拖动或触摸滑动
- **点击热点**: 
  - 绿色热点：跳转到其他场景
  - 蓝色热点：显示展品信息弹窗
- **VR 模式**: 点击 "VR模式" 按钮（需 VR 设备和支持 WebXR 的浏览器）
- **魔镜模式**: 手机上点击 "魔镜模式"，利用陀螺仪控制视角
- **导航地图**: 右下角点击地图点快速跳转

### 管理后台使用

1. 访问 `/admin` 进入管理后台
2. **场景管理**:
   - 点击 "添加场景" 上传全景图片（推荐 2:1 比例，如 2048×1024）
   - 设置场景在导航地图上的位置
3. **热点管理**:
   - 选择所属场景
   - 选择热点类型：跳转热点（绿色）或信息热点（蓝色）
   - 设置热点的 3D 球面坐标（Z 负值表示在观察者前方）
4. **配置导入导出**: 备份或迁移展厅配置

## API 接口

### 获取配置
```
GET /api/config
```

### 保存配置
```
POST /api/config
Content-Type: application/json
```

### 上传全景图
```
POST /api/upload
Content-Type: multipart/form-data
```

### 场景 CRUD
```
GET    /api/scenes
POST   /api/scenes
PUT    /api/scenes/:id
DELETE /api/scenes/:id
```

### 热点 CRUD
```
GET    /api/hotspots
POST   /api/hotspots
PUT    /api/hotspots/:id
DELETE /api/hotspots/:id
```

## 配置文件格式

```json
{
  "scenes": [
    {
      "id": "scene_1234567890",
      "name": "展厅名称",
      "image": "/uploads/panorama-123.jpg",
      "position": { "x": 100, "y": 100 }
    }
  ],
  "hotspots": [
    {
      "id": "hotspot_1234567890",
      "sceneId": "scene_1234567890",
      "type": "navigate",
      "target": "scene_0987654321",
      "title": "前往下一场景",
      "position": { "x": 0, "y": 0, "z": -400 }
    }
  ]
}
```

## 热点类型

- **navigate (跳转热点)**: 绿色球面，点击跳转到目标场景
- **info (信息热点)**: 蓝色球面，点击显示展品信息弹窗
- **model (3D模型热点)**: 紫色球面，点击打开3D模型查看器，支持360°旋转、缩放查看

## 3D模型查看器功能

- **旋转**: 鼠标拖动旋转视角
- **缩放**: 鼠标滚轮缩放
- **自动旋转**: 点击🔄按钮启用/禁用自动旋转
- **重置视角**: 点击🎯按钮重置到初始视角
- **支持格式**: GLTF、GLB格式的3D模型

## 浏览器兼容性

- ✅ Chrome/Edge (推荐) - 完整支持 WebXR
- ✅ Firefox - 支持全景和魔镜模式
- ✅ Safari (iOS) - 支持全景和魔镜模式（需授权陀螺仪）
- ⚠️ 其他浏览器 - 基础全景功能可用

## VR 设备支持

- Meta Quest 1/2/Pro
- HTC Vive
- Valve Index
- Windows Mixed Reality

## 注意事项

1. 全景图片推荐使用 2:1 比例（如 2048×1024、4096×2048）
2. 魔镜模式需要 HTTPS 环境（localhost 除外）
3. iOS 设备使用魔镜模式需要用户手动授权陀螺仪权限
4. VR 模式需要浏览器支持 WebXR API

## 许可证

MIT