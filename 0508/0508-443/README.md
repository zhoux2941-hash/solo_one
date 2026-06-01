# IPTV组播流分析与录制系统

一个功能完整的IPTV组播流监控、分析与录制系统，基于Node.js + FFmpeg + Vue技术栈开发。

## 功能特性

### 流监控
- 支持同时监控多个组播地址（如 udp://239.1.1.1:1234）
- 实时显示指标：
  - 码率（Mbps）
  - 丢包率（%）
  - 连续传输流时长
  - PTS抖动
- 实时状态显示（正常/离线）

### 告警系统
- 码率异常低于阈值时触发告警
- 丢包率超过5%时触发告警
- 无信号输入时触发告警
- 告警记录保存到数据库
- 前端实时通知弹窗
- 历史告警按流地址和时间范围筛选

### 录制功能
- 手动开始/停止录制任意组播流
- FFmpeg实时转码保存为TS文件
- 支持按时间自动切割（默认15分钟）
- 文件名包含流地址、日期、时间信息
- 录制文件前端直接播放

### TS文件分析
- 上传本地TS文件进行分析
- 提取节目列表信息
- 显示音视频PID信息
- 识别编码格式（H.264、H.265、AAC等）
- 显示分辨率、帧率、采样率等参数
- 检测文件错误信息

## 技术架构

### 后端
- **Node.js** - 服务端运行环境
- **Express** - Web框架
- **Socket.IO** - 实时数据推送
- **FFmpeg/FFprobe** - 视频处理与分析
- **JSON文件存储** - 简化版数据库（可替换为H2）

### 前端
- **Vue 3** - 前端框架
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Element Plus** - UI组件库
- **Video.js** - 视频播放器
- **Axios** - HTTP客户端

## 环境要求

- Node.js >= 16.0.0
- FFmpeg >= 4.0（需配置环境变量或在.env中指定路径）
- npm 或 yarn

## 安装与运行

### 1. 安装FFmpeg

确保系统已安装FFmpeg：
```bash
ffmpeg -version
ffprobe -version
```

### 2. 后端安装

```bash
cd backend
npm install
```

配置环境变量（.env文件）：
```
PORT=3000
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
RECORDINGS_DIR=./recordings
UPLOADS_DIR=./uploads
```

启动后端服务：
```bash
npm run dev
```

后端服务运行在 http://localhost:3000

### 3. 前端安装

```bash
cd frontend
npm install
```

启动前端开发服务器：
```bash
npm run dev
```

前端服务运行在 http://localhost:5173

## 使用说明

### 添加组播流

1. 点击"添加组播流"按钮
2. 填写流名称、组播地址（如 udp://239.1.1.1:1234）
3. 设置期望码率（用于告警阈值判断）
4. 启用监控

### 录制流

1. 在流监控卡片上点击"开始录制"
2. 设置切割时长（分钟）
3. 点击确认开始录制
4. 录制的文件会自动按设置的时间切割

### 播放录制文件

1. 进入"录制管理"页面
2. 找到已完成的录制记录
3. 点击"播放"按钮
4. 在弹窗中选择不同的分段文件进行播放

### 分析TS文件

1. 进入"TS文件分析"页面
2. 拖拽或点击上传TS文件
3. 点击"开始分析"
4. 查看分析结果（节目信息、流信息、PID信息等）

### 查看历史告警

1. 进入"历史告警"页面
2. 使用筛选条件（流地址、类型、时间范围）查询
3. 对告警进行确认或删除操作

## 项目结构

```
iptv-monitor/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── server.js       # 主入口文件
│   │   ├── config.js       # 配置文件
│   │   ├── database.js     # 数据库操作
│   │   ├── modules/        # 业务模块
│   │   │   ├── streamMonitor.js   # 流监控模块
│   │   │   ├── streamRecorder.js  # 录制模块
│   │   │   ├── alertManager.js    # 告警管理
│   │   │   └── tsAnalyzer.js      # TS文件分析
│   │   └── routes/         # API路由
│   │       ├── streams.js
│   │       ├── alerts.js
│   │       ├── recordings.js
│   │       └── analyze.js
│   ├── package.json
│   └── .env
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── main.js         # 入口文件
│   │   ├── App.vue         # 根组件
│   │   ├── router/         # 路由配置
│   │   ├── stores/         # 状态管理
│   │   │   ├── socket.js
│   │   │   └── alert.js
│   │   ├── api/            # API服务
│   │   └── views/          # 页面组件
│   │       ├── Monitor.vue
│   │       ├── Recordings.vue
│   │       ├── Analyze.vue
│   │       └── Alerts.vue
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## API接口文档

### 流管理
- `GET /api/streams` - 获取所有流
- `GET /api/streams/:id` - 获取单个流信息
- `POST /api/streams` - 添加新流
- `PUT /api/streams/:id` - 更新流信息
- `DELETE /api/streams/:id` - 删除流
- `POST /api/streams/:id/start` - 开始监控
- `POST /api/streams/:id/stop` - 停止监控

### 告警管理
- `GET /api/alerts` - 获取告警列表（支持筛选）
- `POST /api/alerts/:id/acknowledge` - 确认告警
- `DELETE /api/alerts/:id` - 删除告警

### 录制管理
- `GET /api/recordings` - 获取录制记录
- `GET /api/recordings/status` - 获取正在录制的状态
- `POST /api/recordings/:streamId/start` - 开始录制
- `POST /api/recordings/:streamId/stop` - 停止录制
- `DELETE /api/recordings/:id` - 删除录制记录

### 文件分析
- `POST /api/analyze/upload` - 上传并分析TS文件

## Socket.IO实时事件

- `streamMetrics` - 流指标更新
- `newAlert` - 新告警通知
- `recordingStarted` - 录制开始
- `recordingStopped` - 录制停止
- `recordingSegment` - 新录制分段

## 注意事项

1. **组播网络**：确保服务器所在网络能够接收组播流
2. **FFmpeg路径**：如果FFmpeg不在系统PATH中，需要在.env文件中指定完整路径
3. **存储空间**：录制文件会占用大量磁盘空间，请确保有足够的存储空间
4. **防火墙**：确保防火墙允许组播流量通过
5. **权限**：确保录制和上传目录有正确的读写权限

## 性能优化建议

1. 监控的流数量较多时，建议增加监控间隔
2. 录制文件建议定期清理或转存
3. 数据库指标数据建议定期归档
4. 生产环境建议使用Nginx反向代理

## 许可证

MIT License
