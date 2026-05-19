# WebTransport 多人实时协作3D场景编辑器

基于WebTransport的多人实时协作3D场景编辑器，支持8人同时编辑，操作延迟低于100ms。

## 技术栈

- **后端**: Go + WebTransport (quic-go)
- **前端**: Three.js + WebTransport API + IndexedDB
- **实时同步**: WebTransport DataChannel

## 功能特性

- ✅ 创建/加入房间
- ✅ 3D图元操作（立方体、球体、圆柱体、平面）
- ✅ 移动、旋转、缩放变换
- ✅ 材质颜色修改
- ✅ WebTransport DataChannel实时同步
- ✅ IndexedDB离线存储
- ✅ 离线编辑后同步
- ✅ 延迟检测
- ✅ 多用户状态显示

## 安装与运行

### 环境要求

- Go 1.21+
- Chrome/Edge 116+ (支持WebTransport)

### 启动后端服务器

```bash
cd backend
go mod download
go run main.go
```

服务器将在 `https://localhost:4433` 启动。

### 访问前端

在浏览器中打开:
```
https://localhost:4433
```

**注意**: 由于使用自签名证书，浏览器会提示安全警告，点击"高级" -> "继续前往"即可。

## 使用说明

1. **加入房间**:
   - 输入房间ID和用户名
   - 点击"加入房间"

2. **创建图元**:
   - 点击对应的图元按钮（立方体、球体、圆柱体、平面）
   - 新图元将随机出现在场景中

3. **选择对象**:
   - 点击场景中的对象
   - 或在左侧对象列表中点击

4. **变换操作**:
   - 选择"移动"、"旋转"、"缩放"工具
   - 拖动控制柄进行操作

5. **修改颜色**:
   - 选中对象后，使用颜色选择器
   - 点击"应用颜色"

6. **删除对象**:
   - 选中对象后点击"删除选中"
   - 或在对象列表中点击×按钮

## 项目结构

```
├── backend/
│   ├── go.mod          # Go依赖
│   └── main.go         # WebTransport服务器
├── frontend/
│   ├── index.html      # 前端页面
│   └── app.js          # 前端逻辑
└── README.md
```

## 浏览器兼容性

WebTransport目前支持以下浏览器:
- Chrome 97+
- Edge 97+
- Opera 83+

Firefox正在开发中，暂不支持。

## 性能指标

- 支持并发用户: 8+
- 操作延迟: < 100ms
- 同步模式: 基于操作的增量同步
