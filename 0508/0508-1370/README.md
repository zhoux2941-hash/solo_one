# WebRTC 实时视频流超分辨率网关

一个基于 Node.js + Python 混合架构的实时视频超分辨率网关系统，支持 WebRTC 视频流接收、实时超分辨率处理和转发。

## 功能特性

- ✅ **WebRTC 实时通信** - 支持视频流的发布和订阅
- ✅ **超分辨率处理** - 基于 ESPCN/FSRCNN 轻量级模型，支持 2x/3x/4x 倍率
- ✅ **GPU 加速** - 支持 CUDA 和 Metal 加速，无 GPU 时自动降级到 CPU
- ✅ **低延迟通信** - Node.js 与 Python 之间使用 ZeroMQ 通信，避免 HTTP/WebSocket 延迟
- ✅ **并发处理** - 支持最多 5 路视频流并发，每路保持 15fps 以上
- ✅ **画质评估** - 自动计算 PSNR 和 SSIM 指标，每 30 秒记录到数据库
- ✅ **视频录制** - 支持录制超分前后的视频流，可下载对比
- ✅ **实时监控** - WebSocket 推送延迟、帧率、GPU 占用等统计信息
- ✅ **管理 API** - 支持动态调整超分倍率、流管理、录制控制

## 技术架构

```
客户端A (WebRTC推流)
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│                     Node.js 网关                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │  信令服务   │    │  媒体处理   │    │  WebSocket  │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│         │                  │                  │         │
│         └──────────┬───────┘                  │         │
│                    │                          │         │
│              ┌─────▼─────┐                    │         │
│              │  ZeroMQ   │◄───────────────────┘         │
│              └─────┬─────┘                              │
└────────────────────┼────────────────────────────────────┘
                     │ ZeroMQ IPC
└────────────────────┼────────────────────────────────────┐
│              ┌─────▼─────┐   Python 超分服务            │
│              │  请求队列  │                              │
│              └─────┬─────┘                              │
│                    │                                    │
│              ┌─────▼─────┐   ┌──────────────────┐       │
│              │  ESPCN模型 │──►│  PSNR/SSIM评估   │       │
│              └─────┬─────┘   └──────────────────┘       │
│                    │                                    │
│              ┌─────▼─────┐                              │
│              │  响应队列  │                              │
│              └─────┬─────┘                              │
└────────────────────┼────────────────────────────────────┘
                     │
                     ▼
         客户端B/C/D (WebRTC观看)
```

## 系统要求

- Node.js >= 18.0.0
- Python >= 3.9
- CUDA >= 11.0 (可选，用于GPU加速)
- FFmpeg (用于视频录制)
- 支持 WebRTC 的浏览器 (Chrome, Firefox, Edge)

## 快速开始

### 1. 安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 Python 依赖
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

主要配置项：
- `NODE_PORT`: Node.js 服务端口
- `PYTHON_ZMQ_PORT`: Python ZMQ 请求端口
- `MAX_STREAMS`: 最大并发流数
- `DEFAULT_SCALE`: 默认超分倍率 (2/3/4)
- `USE_GPU`: 是否启用 GPU 加速
- `METRICS_INTERVAL_SEC`: 指标计算间隔

### 3. 启动服务

```bash
# 方式一：分别启动（推荐用于开发）
# 终端1：启动 Python 超分服务
npm run start:python

# 终端2：启动 Node.js 网关
npm start

# 方式二：同时启动
npm run start:all
```

### 4. 访问仪表盘

打开浏览器访问 `http://localhost:3000`

## API 文档

### 信令接口

#### 发布流
```http
POST /api/signaling/publish
Content-Type: application/json

{
  "sdp": "...",
  "type": "offer",
  "peerId": "optional_peer_id"
}
```

#### 订阅流
```http
POST /api/signaling/subscribe
Content-Type: application/json

{
  "streamId": "stream_xxx",
  "sdp": "...",
  "type": "offer"
}
```

#### 添加 ICE 候选
```http
POST /api/signaling/ice
Content-Type: application/json

{
  "peerId": "peer_id",
  "candidate": {...}
}
```

### 流管理接口

#### 获取流列表
```http
GET /api/streams
```

#### 获取流详情
```http
GET /api/streams/:streamId
```

#### 设置超分倍率
```http
PUT /api/streams/:streamId/scale
Content-Type: application/json

{
  "scale": 2
}
```

#### 获取流历史指标
```http
GET /api/streams/:streamId/history
```

### 录制接口

#### 开始录制
```http
POST /api/recordings/start
Content-Type: application/json

{
  "streamId": "stream_xxx",
  "scale": 2
}
```

#### 停止录制
```http
POST /api/recordings/:streamId/stop
```

#### 获取录制列表
```http
GET /api/recordings
```

#### 下载视频
```http
GET /api/recordings/:recordingId/download/input
GET /api/recordings/:recordingId/download/output
```

#### 画质对比
```http
GET /api/recordings/:recordingId/compare
```

### 管理接口

#### 系统状态
```http
GET /api/admin/status
```

#### Python 服务状态
```http
GET /api/admin/python/stats
POST /api/admin/python/ping
```

#### 终止流
```http
DELETE /api/admin/streams/:streamId
```

#### 设置超分倍率
```http
POST /api/admin/streams/:streamId/scale
Content-Type: application/json

{
  "scale": 3
}
```

### 健康检查
```http
GET /api/health
```

## WebSocket 事件

### 服务端推送

#### `system:stats` - 系统统计
```javascript
{
  timestamp: 1234567890,
  streamStats: { ... },
  serverStats: {
    gpu_utilization: 45,
    cpu_usage: 30,
    active_streams: 2
  },
  connectedClients: 5
}
```

#### `stats:update` - 流统计更新
```javascript
{
  success: true,
  stats: {
    "stream_xxx": {
      streamId: "stream_xxx",
      fps: 15.2,
      avgDelayMs: 120.5,
      psnr: 32.5,
      ssim: 0.921,
      ...
    }
  }
}
```

#### `frame:data` - 视频帧数据
```javascript
{
  streamId: "stream_xxx",
  frame: "base64_encoded_frame",
  timestamp: 1234567890,
  processingTimeMs: 45.2,
  scale: 2,
  fps: 15.0,
  psnr: 32.5,
  ssim: 0.921
}
```

### 客户端发送

#### `stream:subscribe` - 订阅流
```javascript
socket.emit('stream:subscribe', 'stream_xxx');
```

#### `stream:unsubscribe` - 取消订阅
```javascript
socket.emit('stream:unsubscribe', 'stream_xxx');
```

#### `stream:list` - 请求流列表
```javascript
socket.emit('stream:list');
```

## 性能指标

| 指标 | 目标 |
|------|------|
| 端到端延迟 | < 500ms |
| 单路帧率 (GPU) | >= 15 FPS |
| 单路帧率 (CPU) | >= 10 FPS |
| 最大并发流数 | 5 路 |
| 超分倍率 | 2x / 3x / 4x |
| 输入分辨率 | 360p / 480p / 720p |
| 输出分辨率 | 720p / 1080p / 4K |

## 项目结构

```
.
├── src/
│   ├── node/                    # Node.js 代码
│   │   ├── server.js            # 主服务器
│   │   ├── config.js            # 配置
│   │   ├── utils/
│   │   │   └── logger.js        # 日志工具
│   │   ├── services/
│   │   │   ├── zmqClient.js     # ZeroMQ 客户端
│   │   │   ├── database.js      # 数据库服务
│   │   │   ├── framePipeline.js # 帧处理管道
│   │   │   ├── webrtcService.js # WebRTC 服务
│   │   │   ├── recorder.js      # 视频录制服务
│   │   │   └── websocketService.js # WebSocket 服务
│   │   └── routes/
│   │       ├── signaling.js     # 信令路由
│   │       ├── streams.js       # 流管理路由
│   │       ├── recordings.js    # 录制管理路由
│   │       └── admin.js         # 管理路由
│   └── python/                  # Python 代码
│       ├── superres_service.py  # 超分主服务
│       ├── config.py            # 配置
│       ├── models/
│       │   ├── espcn.py         # ESPCN 模型
│       │   └── fsrcnn.py        # FSRCNN 模型
│       └── utils/
│           ├── metrics.py       # PSNR/SSIM 计算
│           └── gpu_utils.py     # GPU 工具
├── public/                      # 前端代码
│   └── index.html               # 仪表盘
├── data/                        # 数据库文件
├── recordings/                  # 录制视频
├── logs/                        # 日志文件
├── package.json                 # Node.js 依赖
├── requirements.txt             # Python 依赖
├── .env                         # 环境变量
└── README.md                    # 项目文档
```

## 超分模型

### ESPCN (Efficient Sub-Pixel Convolutional Neural Network)
- 轻量级模型，适合实时处理
- 支持 2x/3x/4x 多尺度
- 基于 PixelShuffle 上采样

### FSRCNN (Fast Super-Resolution Convolutional Neural Network)
- 更快的推理速度
- 更小的模型体积
- 基于反卷积上采样

## 数据库结构

### streams 表
存储视频流基本信息

### quality_metrics 表
存储画质指标（PSNR、SSIM、帧率、延迟等）

### system_metrics 表
存储系统指标（GPU、CPU、内存使用等）

### recordings 表
存储录制视频信息

## 故障排查

### Python 服务无法启动
- 检查 PyTorch 是否正确安装
- 检查 CUDA 版本是否匹配
- 检查 ZeroMQ 端口是否被占用

### Node.js 服务无法连接 Python
- 确认 Python 服务已启动
- 检查 ZMQ 端口配置
- 查看日志文件

### WebRTC 连接失败
- 检查 STUN 服务器配置
- 确认防火墙设置
- 检查浏览器是否支持 WebRTC

### 视频延迟过高
- 检查 GPU 是否启用
- 降低超分倍率
- 减少并发流数

## 性能优化建议

1. **启用 GPU 加速** - 设置 `USE_GPU=true`
2. **使用 TensorRT 优化** - 对 PyTorch 模型进行量化和优化
3. **调整批处理大小** - 根据 GPU 显存调整
4. **启用混合精度训练** - 减少显存占用
5. **使用更快的 IPC** - 在同一机器上可考虑使用共享内存替代 ZeroMQ

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
