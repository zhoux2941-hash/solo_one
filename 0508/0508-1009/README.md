# WebTransport 3D Model Streaming System

基于WebTransport的3D模型流式传输系统，支持渐进式网格渲染(Progressive Mesh)、LOD服务器端决策、自适应带宽调整和断线续传。

## 系统架构

```
┌─────────────────┐     WebTransport/WS      ┌─────────────────┐
│   Browser       │◄────────────────────────►│   Server        │
│  (Three.js)     │   Binary Data Streams    │ (Node.js)       │
└─────────────────┘                          └─────────────────┘
          │                                            │
          │                                            │
          ▼                                            ▼
┌─────────────────┐                          ┌─────────────────┐
│ Progressive     │                          │ Model Processor │
│ Renderer        │                          │ (LOD Generator) │
└─────────────────┘                          └─────────────────┘
          │                                            │
          │                                            │
          ▼                                            ▼
┌─────────────────┐                          ┌─────────────────┐
│ LOD Manager     │                          │ Chunk Manager   │
│ (Client-side)   │                          │ (Stream Control)│
└─────────────────┘                          └─────────────────┘
```

## 核心功能

### 1. 模型分块与LOD生成 (`tools/model-processor.cjs`)
- **GLTF/GLB解析**: 支持标准GLTF 2.0格式
- **LOD层级**: 自动生成4个精度层级(LOD 0-3)
- **几何数据分片**: 顶点数据按1000个顶点分块，索引数据按3000个索引分块
- **纹理分块**: 支持Mipmap和256x256瓦片分块
- **数据压缩**: GZIP压缩减少传输量

### 2. WebTransport服务器 (`server/server.js`)
- **QUIC协议**: 基于WebTransport的低延迟双向通信
- **流式传输**: 单向数据流批量发送数据块
- **服务器端LOD决策**: 根据客户端视点位置动态调整推送精度
- **带宽自适应**: 实时监测带宽，动态调整发送速率
- **断线续传**: 30秒内重连可恢复已接收数据

### 3. Three.js客户端 (`client/js/`)
- **渐进式渲染**: 先显示低精度模型，逐步细化
- **LOD切换**: 基于距离自动切换LOD层级
- **数据解压**: 浏览器原生DecompressionStream
- **重连机制**: 自动重连并恢复传输状态

## 性能指标

| 指标 | 目标 | 实现方式 |
|------|------|---------|
| 首屏时间 | < 2秒 | 优先传输LOD3低精度数据 |
| 完整加载 | < 10秒 | 并行流式传输 + GZIP压缩 |
| 模型大小 | 10MB+ | 分块传输 + 按需加载 |
| LOD切换 | 无缝 | 双缓冲几何数据 |

## 快速开始

### 1. 处理模型

```bash
# 处理自定义模型
node tools/model-processor.cjs path/to/your/model.glb

# 或使用内置测试模型
node tools/model-processor.cjs
```

### 2. 启动服务器

```bash
# WebTransport版本 (需要Node.js 18+)
npm install
npm start

# WebSocket版本 (兼容Node.js 10+)
node server/server-http.cjs
```

### 3. 访问应用

打开浏览器访问: `http://localhost:8080`

## API协议

### 数据块格式

```
┌─────────────┬──────────────┬──────────────────┬────────────────┐
│ ID Length   │ Chunk ID     │ Compressed Size  │ Original Size  │
│ (2 bytes)   │ (N bytes)    │ (4 bytes)        │ (4 bytes)      │
├─────────────┴──────────────┴──────────────────┴────────────────┤
│                      Compressed Data                          │
│                   (M bytes, GZIP)                           │
└──────────────────────────────────────────────────────────────┘
```

### 消息类型

| 类型 | 方向 | 描述 |
|------|------|------|
| `metadata` | S→C | 模型元数据和LOD信息 |
| `cameraUpdate` | C→S | 相机位置和目标点 |
| `chunkAck` | C→S | 数据块确认 |
| `resume` | C→S | 断线续传请求 |
| `bandwidthReport` | C→S | 带宽估计报告 |

## LOD策略

| LOD层级 | 距离阈值 | 顶点简化比例 | 用途 |
|---------|---------|-------------|------|
| LOD 0 | < 5m | 100% | 特写细节 |
| LOD 1 | 5-15m | 50% | 正常观看 |
| LOD 2 | 15-30m | 25% | 远景 |
| LOD 3 | > 30m | 12.5% | 首屏快速显示 |

## 目录结构

```
├── client/                 # 客户端代码
│   ├── index.html          # 主页面
│   ├── css/
│   │   └── style.css       # 样式文件
│   └── js/
│       ├── app.js          # 应用入口
│       ├── webtransport-client.js  # WebTransport客户端
│       ├── websocket-client.js     # WebSocket客户端(备选)
│       └── progressive-renderer.js # Three.js渲染器
├── server/                 # 服务器代码
│   ├── server.js           # WebTransport服务器
│   ├── server-ws.cjs       # WebSocket服务器
│   └── server-http.cjs     # HTTP服务器(兼容)
├── tools/                  # 工具脚本
│   ├── model-processor.js  # ES模块版本
│   └── model-processor.cjs # CommonJS版本
├── models/                 # 模型数据
│   ├── input.glb           # 输入模型
│   └── processed/          # 处理后的分块数据
│       ├── metadata.json   # 模型元数据
│       └── chunks/         # 数据块文件
└── certificates/           # SSL证书
```

## 浏览器兼容性

- **Chrome 97+**: 完整WebTransport支持
- **Firefox 114+**: 部分WebTransport支持
- **其他浏览器**: 自动降级到WebSocket

## 技术亮点

1. **QUIC vs WebSocket**: WebTransport基于QUIC，支持多路复用、0-RTT握手、流级拥塞控制
2. **渐进式网格**: 从低到高逐步提升模型精度，首屏极快
3. **服务器端LOD**: 减少不必要的高精度数据传输
4. **智能分块**: 按几何语义分块，支持局部更新
5. **断线续传**: 基于resume token的状态恢复机制

## 性能优化建议

1. **模型预处理**: 使用Draco压缩几何数据
2. **纹理优化**: 使用KTX2/Basis Universal格式
3. **带宽预测**: 基于历史数据预测带宽，提前调整LOD
4. **视锥体剔除**: 只传输可见部分的数据
5. **客户端缓存**: 利用IndexedDB缓存已接收的数据块
