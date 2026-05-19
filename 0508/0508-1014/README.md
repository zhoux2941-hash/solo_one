# WebCodecs + WebNN 实时视频超分辨率

基于 WebCodecs API 和 WebNN 实现的实时视频超分辨率应用，使用 ESPCN 轻量模型进行 2x/3x 超分辨率处理。

## 功能特性

- 🎥 **多视频源支持**: 摄像头实时捕获 + 本地视频文件
- 🚀 **硬件加速**: WebNN GPU 加速推理，支持 WebGL 和 CPU 回退
- 🔬 **ESPCN 模型**: 轻量级高效亚像素卷积神经网络
- 📊 **实时指标**: FPS、PSNR、推理时间、分辨率显示
- ⚡ **帧缓存流水线**: 异步推理，降低延迟
- 🎛️ **灵活控制**: 超分倍数切换、推理后端选择

## 技术栈

- **WebCodecs API**: 视频帧编解码
- **WebNN API**: 神经网络硬件加速 (GPU)
- **WebGL2**: 图像处理加速回退方案
- **ESPCN**: 高效亚像素卷积超分模型
- **Vite**: 现代化构建工具

## 系统要求

### 浏览器支持

- Chrome 94+ (推荐，支持 WebCodecs)
- Edge 94+
- 其他现代浏览器 (部分功能回退)

### WebNN 支持

需要浏览器启用 WebNN API:
1. Chrome: 访问 `chrome://flags`，启用 `#webnn` 和 `#webnn-gpu`
2. Edge: 类似 Chrome 配置

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 使用说明

1. **选择视频源**:
   - 摄像头: 使用设备摄像头实时捕获
   - 本地文件: 选择本地视频文件进行处理

2. **设置超分倍数**:
   - 2x: 1080p → 4K (3840×2160)
   - 3x: 1080p → 6K (5760×3240)

3. **选择推理后端**:
   - WebNN (GPU): 最优性能，需要浏览器支持
   - WebGL: GPU 加速回退方案
   - CPU: 纯 CPU 计算，性能较低

4. **点击开始**: 启动实时超分辨率处理

## 性能目标

| 分辨率 | 超分倍数 | 目标 FPS |
|--------|----------|----------|
| 1080p → 4K | 2x | 15 FPS |
| 1080p → 6K | 3x | 8 FPS |

## 项目结构

```
├── src/
│   ├── main.js              # 主入口和UI控制
│   ├── videoCapture.js      # 视频流捕获
│   ├── frameDecoder.js      # 帧解码 (WebCodecs)
│   ├── espcnModel.js        # ESPCN超分模型（支持配置覆盖）
│   ├── webnnEngine.js       # WebNN推理引擎
│   ├── frameBuffer.js       # 帧缓存管理
│   ├── pipeline.js          # 异步推理流水线（支持模型热切换）
│   ├── psnrCalculator.js    # PSNR质量指标
│   ├── temporalFilter.js    # 时域滤波（消除鬼影闪烁）
│   ├── modelManager.js      # 模型管理器（热更新核心）
│   └── videoEncoder.js      # 视频编码输出
├── index.html               # 页面结构
├── styles.css               # 样式文件
├── server.js                # 本地HTTP服务器
└── package.json             # 项目配置
```

## 核心架构

### 处理流水线

```
视频源 → 帧捕获 → 帧缓存 → 超分推理 → 输出显示
                ↓           ↑
              解码       PSNR计算
```

### 帧缓存策略

- 最大缓存 5 帧
- 异步推理避免阻塞
- 自动丢弃过期帧保持实时性

## ESPCN 模型结构

ESPCN (Efficient Sub-Pixel Convolutional Neural Network) 是一种轻量级超分模型：

- **Conv1**: 5×5×64, ReLU
- **Conv2**: 3×3×32, ReLU  
- **Conv3**: 3×3×(3×r²)
- **DepthToSpace**: 亚像素重排

优势：
- 参数量小，推理快
- 端到端训练
- 亚像素卷积避免棋盘伪影

## 质量指标

### PSNR (峰值信噪比)

- \> 40 dB: 极佳质量
- 30-40 dB: 良好质量  
- 20-30 dB: 可接受
- < 20 dB: 质量较差

## 浏览器兼容性处理

应用采用渐进式增强策略：

1. **最佳体验**: WebCodecs + WebNN GPU
2. **良好体验**: WebCodecs + WebGL
3. **基础体验**: Canvas API + CPU

## 故障排查

### 摄像头无法访问

- 检查浏览器权限设置
- 确认摄像头未被其他应用占用

### WebNN 不可用

- 确认浏览器版本 ≥ Chrome 94
- 检查 `chrome://flags` 中 WebNN 是否启用
- 使用 WebGL 或 CPU 后端

### 性能低下

- 降低超分倍数
- 关闭其他 GPU 占用应用
- 检查是否启用硬件加速

## 许可证

MIT License

## 参考资料

- [WebCodecs API 规范](https://www.w3.org/TR/webcodecs/)
- [WebNN API 规范](https://www.w3.org/TR/webnn/)
- [ESPCN 论文](https://arxiv.org/abs/1609.05158)
