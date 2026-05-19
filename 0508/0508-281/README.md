# 实时物体检测与多目标追踪系统

基于 YOLOv5s + TensorRT + DeepSORT 的边缘计算实时追踪系统，专为 Jetson Nano 等嵌入式设备优化。

## 功能特性

- 🚀 **高性能推理**: YOLOv5s 转 TensorRT 引擎，支持批处理（最多8帧）
- 🎯 **多目标追踪**: DeepSORT 算法，支持目标ID持续追踪
- 🔄 **实时推送**: WebSocket 实时推送检测结果到前端
- 📺 **RTSP 流**: 支持 RTSP 视频流输入
- 🎨 **Canvas 绘制**: 前端 Canvas 实时绘制检测框和轨迹线
- 📜 **历史记录**: 支持查看历史检测记录
- ⚡ **速度优化**: 目标检测速度 > 15fps（640x640 输入）

## 系统架构

```
RTSP 视频流 → 帧缓冲 → 批处理推理（YOLOv5s TensorRT）
    ↓
DeepSORT 追踪 → WebSocket 推送 → 前端 Canvas 展示
```

## 目录结构

```
.
├── backend/
│   ├── api/
│   │   └── main.py              # FastAPI 主服务
│   ├── models/
│   │   ├── __init__.py
│   │   └── yolov5_trt.py        # YOLOv5 TensorRT 推理引擎
│   ├── tracking/
│   │   ├── __init__.py
│   │   ├── kalman_filter.py     # 卡尔曼滤波
│   │   ├── nn_matching.py       # 最近邻匹配
│   │   ├── linear_assignment.py # 匈牙利算法
│   │   └── deepsort.py          # DeepSORT 主算法
│   └── __init__.py
├── frontend/
│   └── index.html               # 前端界面
├── config/
│   └── config.yaml              # 配置文件
├── scripts/
├── requirements.txt
├── start.sh                     # Linux 启动脚本
├── start.bat                    # Windows 启动脚本
└── README.md
```

## 快速开始

### 1. 环境要求

- Python 3.8+
- Jetson Nano / Jetson Xavier / 类似边缘设备
- TensorRT 8.x（推荐）
- CUDA 和 cuDNN

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置文件

编辑 `config/config.yaml`:

```yaml
detector:
  model_path: models/yolov5s.engine    # TensorRT 模型路径
  input_size: 640                       # 输入尺寸
  conf_threshold: 0.4                   # 置信度阈值
  iou_threshold: 0.5                    # NMS IOU 阈值
  max_batch_size: 8                     # 最大批处理大小
  classes: 80                           # 类别数量
  fp16: true                            # FP16 推理

tracker:
  max_cosine_distance: 0.3
  nn_budget: 100
  max_iou_distance: 0.7
  max_age: 70
  n_init: 3

stream:
  rtsp_url: rtsp://localhost:8554/stream  # RTSP 流地址
  fps: 30
  width: 1280
  height: 720

server:
  host: 0.0.0.0
  port: 8000
  ws_path: /ws
```

### 4. 启动服务

**Linux / Jetson:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```cmd
start.bat
```

或者手动启动：

```bash
cd backend/api
python main.py
```

### 5. 访问前端

打开浏览器访问：`http://localhost:8000`

## 模型转换（Jetson 专用）

### 1. 下载 YOLOv5s PyTorch 模型

```bash
cd models
wget https://github.com/ultralytics/yolov5/releases/download/v6.0/yolov5s.pt
```

### 2. 转换为 ONNX

```python
import torch
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
dummy_input = torch.randn(1, 3, 640, 640)
torch.onnx.export(model, dummy_input, "yolov5s.onnx", opset_version=12)
```

### 3. 使用 TensorRT 转换

```bash
/usr/src/tensorrt/bin/trtexec --onnx=yolov5s.onnx --saveEngine=yolov5s.engine --fp16 --explicitBatch
```

## API 接口

### WebSocket 接口

- **连接地址**: `ws://localhost:8000/ws`
- **实时推送**: 检测结果（物体类别、边界框、追踪ID）

### REST API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/history` | GET | 获取历史检测记录 |
| `/api/status` | GET | 获取系统状态 |
| `/api/config` | POST | 更新配置 |
| `/api/reset` | POST | 重置追踪器 |

## 性能指标（Jetson Nano）

- **检测速度**: > 15 FPS（640x640 输入，批处理=8）
- **内存占用**: ~ 2GB
- **CPU 占用**: ~ 40%
- **GPU 占用**: ~ 85%

## 前端功能

1. **实时视频展示**: Canvas 绘制检测框
2. **轨迹线显示**: 可选显示目标运动轨迹
3. **状态监控**: FPS、检测数量、帧ID
4. **目标列表**: 当前检测到的目标详情
5. **历史记录**: 查看过去的检测结果

## 常见问题

### Q: TensorRT 不可用怎么办？

A: 系统会自动降级到 CPU 模式，使用 OpenCV 轮廓检测进行演示。

### Q: RTSP 流无法连接怎么办？

A: 系统会自动尝试使用本地摄像头（/dev/video0）。

### Q: 如何调整批处理大小？

A: 编辑 `config/config.yaml` 中的 `max_batch_size` 参数，推荐 Jetson Nano 使用 4-8。

## 许可证

MIT License
