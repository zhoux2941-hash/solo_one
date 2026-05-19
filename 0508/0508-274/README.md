# P2P CDN 系统

基于 WebTorrent 协议的 P2P CDN 系统，用于分发静态资源（JS/CSS/图片）。

## 功能特性

### 服务端
- ✅ **种子文件生成**：自动为上传的文件创建 torrent 种子
- ✅ **Tracker 服务器**：内置基于 bittorrent-tracker 的 tracker 服务
- ✅ **分片策略**：每片 1MB，支持断点续传
- ✅ **统计系统**：P2P 命中率、上传下载量、节点统计等
- ✅ **管理界面**：可视化的资源管理和统计面板

### 前端 SDK
- ✅ **P2P 优先**：优先从 P2P 网络获取资源
- ✅ **CDN 回退**：P2P 失败时自动回退到传统 CDN
- ✅ **分片下载**：支持 1MB 分片下载
- ✅ **断点续传**：支持 Range 请求
- ✅ **资源注入**：便捷的 JS/CSS/图片注入 API
- ✅ **自动统计**：自动上报下载和上传统计

## 项目结构

```
p2p-cdn-system/
├── server/
│   ├── index.js           # 主服务器入口
│   ├── tracker.js         # Tracker 服务器
│   ├── torrent-creator.js # 种子文件生成服务
│   ├── stats.js           # 统计服务
│   └── resource-server.js # 资源服务器
├── sdk/
│   └── p2p-cdn-sdk.js     # 前端 SDK
├── admin/
│   ├── index.html         # 管理面板 HTML
│   ├── style.css          # 管理面板样式
│   └── admin.js           # 管理面板逻辑
├── public/
│   └── index.html         # 演示页面
├── data/                  # 数据存储目录
└── package.json
```

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
npm start
```

服务启动后：
- 主服务：http://localhost:3000
- Tracker：ws://localhost:8000
- 管理面板：http://localhost:3000/admin/
- 演示页面：http://localhost:3000/

## 使用说明

### 1. 上传资源

1. 打开管理面板：http://localhost:3000/admin/
2. 点击"上传新资源"按钮
3. 选择要分发的文件（支持 JS、CSS、图片等）
4. 上传成功后，记录下返回的 `infoHash`

### 2. 前端 SDK 使用

#### 基本用法

```html
<!-- 引入 SDK -->
<script src="/sdk/p2p-cdn-sdk.js"></script>

<script>
  // 初始化 SDK
  const sdk = new P2PCDNSDK({
    trackerUrl: 'ws://localhost:8000',
    cdnBaseUrl: 'http://localhost:3000/api/resource',
    apiBaseUrl: 'http://localhost:3000/api',
    debug: true
  });

  // 获取资源（P2P 优先，自动回退到 CDN）
  const buffer = await sdk.fetchResource('your-info-hash-here');
  
  // 注入脚本
  await sdk.injectScript('your-info-hash-here');
  
  // 注入样式
  await sdk.injectStylesheet('your-info-hash-here');
  
  // 注入图片
  await sdk.injectImage('your-info-hash-here', 'image-element-id');
</script>
```

#### API 文档

**构造函数选项**
- `trackerUrl`：Tracker 服务器地址（默认：ws://localhost:8000）
- `cdnBaseUrl`：CDN 资源地址（默认：http://localhost:3000/api/resource）
- `apiBaseUrl`：API 服务地址（默认：http://localhost:3000/api）
- `pieceLength`：分片大小，默认 1MB
- `p2pTimeout`：P2P 超时时间，默认 5000ms
- `enableP2P`：是否启用 P2P，默认 true
- `debug`：是否开启调试日志，默认 false

**方法**
- `fetchResource(infoHash, options)`：获取资源
- `fetchPiece(infoHash, pieceIndex)`：获取指定分片
- `injectScript(infoHash)`：注入脚本到页面
- `injectStylesheet(infoHash)`：注入样式表到页面
- `injectImage(infoHash, elementId)`：注入图片到页面
- `getStats(infoHash)`：获取统计数据
- `destroy()`：销毁 SDK 实例

### 3. API 接口

#### 上传资源
```
POST /api/upload
Content-Type: multipart/form-data

file: <文件内容>
```

响应：
```json
{
  "infoHash": "...",
  "name": "filename.js",
  "size": 12345,
  "magnetURI": "magnet:?xt=urn:btih:...",
  "pieceLength": 1048576,
  "pieces": 5
}
```

#### 获取资源
```
GET /api/resource/{infoHash}
Headers:
  Range: bytes=start-end (可选)
```

#### 获取统计数据
```
GET /api/stats
```

响应：
```json
{
  "totalP2PHits": 100,
  "totalP2PMisses": 20,
  "totalP2PDownloaded": 5242880,
  "totalCDNDownloaded": 1048576,
  "totalUploaded": 2097152,
  "activePeers": 5,
  "p2pHitRate": 83.33,
  "resources": {
    "info-hash-1": {
      "p2pHits": 50,
      "p2pMisses": 10,
      "p2pDownloaded": 2621440,
      "cdnDownloaded": 524288,
      "uploaded": 1048576,
      "peers": 3
    }
  }
}
```

## 工作原理

### 1. 资源分发流程

```
用户浏览器
    ↓
1. 请求资源 (infoHash)
    ↓
2. SDK 尝试 P2P 下载
    ├─ 成功 → 使用 P2P 数据 → 上报统计
    └─ 失败/超时 → 回退到 CDN → 上报统计
```

### 2. P2P 网络

- 每个浏览器都是一个节点（Peer）
- Tracker 服务器维护节点列表
- 节点之间通过 WebRTC 直接传输数据
- 支持同时从多个节点下载不同分片

### 3. 分片策略

- 默认分片大小：1MB
- 大文件自动分割成多个分片
- 支持断点续传（通过 HTTP Range）
- 每个分片独立校验和传输

## 性能优化建议

1. **CDN 边缘部署**：将 HTTP 资源服务器部署到 CDN 边缘节点
2. **Tracker 集群**：高并发场景下使用 Tracker 集群
3. **种子预加载**：热门资源提前在多个节点做种
4. **缓存策略**：合理配置 SDK 缓存策略

## 注意事项

1. **浏览器兼容性**：需要支持 WebRTC 的现代浏览器
2. **跨域问题**：确保正确配置 CORS
3. **隐私考虑**：P2P 网络会暴露用户 IP
4. **法律合规**：确保分发的内容符合法律法规

## 开发

### 开发模式（自动重启）
```bash
npm run dev
```

### 目录说明
- `server/`：服务端代码
- `sdk/`：前端 SDK
- `admin/`：管理面板
- `public/`：静态文件和演示
- `data/`：运行时数据存储

## 许可证

MIT
