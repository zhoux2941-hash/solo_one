# VideoEditor SDK - 跨平台视频剪辑SDK

## 项目概述

高性能跨平台视频剪辑SDK，基于C++开发，支持iOS/Android/Windows/Mac，提供实时视频导出性能。

## 核心功能

### 视频处理
- ✅ 视频裁剪 - 精确时间范围裁剪
- ✅ 视频拼接 - 多片段无缝拼接
- ✅ 转场特效 - 10+种内置转场（淡入淡出、溶解、滑动、擦除、波纹、缩放、旋转等）

### 变速功能
- ✅ 基础变速 - 0.5x到2x倍速
- ✅ 曲线变速 - 分段变速，支持速度曲线
- ✅ 时间重映射 - 输入/输出时间点映射

### 叠加层
- ✅ 音频混音 - 背景音乐、音量调节
- ✅ 贴纸叠加 - 图片贴纸，支持缩放、旋转、透明度
- ✅ 文字叠加 - 自定义文字，支持字体、颜色、位置

### 滤镜系统
- ✅ 亮度调节
- ✅ 对比度调节
- ✅ 饱和度调节
- ✅ 高斯模糊
- ✅ 锐化
- ✅ 复古（Sepia）
- ✅ 暗角（Vignette）

## 技术架构

### 渲染引擎
```
FFmpeg 解码 → YUV420P → OpenGL 渲染 → RGBA → FFmpeg 编码
          ↓
      滤镜链处理
      转场特效
      叠加层合成
```

### 性能优化策略

1. **GPU硬件加速**
   - OpenGL渲染管线，所有像素处理在GPU完成
   - FBO离屏渲染，避免GPU-CPU数据往返
   - 着色器程序预编译

2. **编码优化**
   - H.264硬件编码支持
   - 快速预设（preset=fast）
   - 低延迟编码模式（tune=zerolatency）
   - 多线程编码（threads=8）

3. **内存优化**
   - 零拷贝纹理上传
   - 帧缓冲池复用
   - 流式处理避免内存峰值

4. **多线程架构**
   - 解码线程 - 预读取帧
   - 渲染线程 - GPU处理
   - 编码线程 - 压缩输出
   - 管线化并行处理

## 目录结构

```
VideoEditorSDK/
├── include/ve/                          # 公共头文件
│   ├── ve.h                            # SDK入口
│   ├── types.h                         # 基础类型
│   ├── editor.h                        # 编辑器核心
│   ├── decoder.h                       # 解码器
│   ├── encoder.h                       # 编码器
│   ├── renderer.h                      # 渲染器
│   ├── filters.h                       # 滤镜
│   ├── transitions.h                   # 转场
│   ├── audio.h                         # 音频处理
│   └── ve_capi.h                       # C API
├── src/
│   ├── core/                           # 核心逻辑
│   │   ├── ve.cpp
│   │   └── editor.cpp
│   ├── decoder/                        # FFmpeg解码
│   │   └── ffmpeg_decoder.cpp
│   ├── encoder/                        # FFmpeg编码
│   │   └── ffmpeg_encoder.cpp
│   ├── renderer/                       # OpenGL渲染
│   │   ├── gl_renderer.cpp
│   │   ├── filter_chain.cpp
│   │   └── shaders.cpp
│   ├── transitions/                    # 转场特效
│   │   └── transitions.cpp
│   ├── audio/                          # 音频处理
│   │   └── audio_mixer.cpp
│   ├── utils/                          # 工具类
│   │   ├── logger.h/cpp
│   │   └── timer.h/cpp
│   └── platform/                       # 平台绑定
│       ├── c/ve_capi.cpp              # C API
│       ├── android/                    # Android JNI
│       │   ├── ve_jni.cpp
│       │   ├── VideoEditor.java
│       │   └── VideoEditor.kt
│       └── apple/                      # iOS/macOS
│           ├── VEVideoEditor.h/mm
│           └── VEVideoEditor.swift
├── cmake/
│   └── FindFFmpeg.cmake
├── CMakeLists.txt
└── PROJECT_SUMMARY.md
```

## 平台绑定

| 平台 | 语言 | 文件 |
|------|------|------|
| 原生 | C++ | include/ve/*.h |
| 跨语言 | C API | include/ve/ve_capi.h |
| Android | Java/Kotlin | src/platform/android/ |
| iOS/macOS | ObjC/Swift | src/platform/apple/ |

## 性能指标

**目标：1080p 30fps 视频导出速度 ≥ 实时**

### 优化要点：
1. **解码优化** - FFmpeg硬件解码（dxva2/vtb/cuvid）
2. **渲染优化** - 每帧处理时间 < 16ms
3. **编码优化** - 硬件加速H.264编码
4. **并行处理** - 解码-渲染-编码流水线

### 预期性能：
- 1分钟视频导出时间：≤60秒
- CPU使用率：<50%（8核CPU）
- 内存峰值：<512MB

## 构建说明

### Windows
```bash
mkdir build && cd build
cmake .. -G "Visual Studio 17 2022"
cmake --build . --config Release
```

### macOS/iOS
```bash
mkdir build && cd build
cmake .. -GXcode -DVE_BUILD_OBJC=ON
cmake --build . --config Release
```

### Android
```bash
ndk-build NDK_PROJECT_PATH=. APP_BUILD_SCRIPT=Android.mk
```

## 使用示例

### C++
```cpp
#include "ve/ve.h"
#include "ve/editor.h"

ve::Initialize();

auto editor = std::make_unique<ve::VideoEditor>();
editor->SetOutputSize(ve::Size(1920, 1080));
editor->SetOutputFramerate(30.0);

int clip = editor->AddVideoClip("input.mp4");
editor->SetTransition(clip, ve::TransitionType::Fade, 0.5);

editor->Export("output.mp4",
    [](float p) { printf("Progress: %.1f%%\n", p*100); },
    [](int c, const char* m) { printf("Error: %s\n", m); }
);

ve::Shutdown();
```

### Swift
```swift
let editor = VideoEditor()
editor.outputSize = CGSize(width: 1920, height: 1080)
editor.addVideoClip("input.mp4")
editor.export(outputPath: "output.mp4",
    progress: { p in print("Progress: \(p)") },
    error: { code, msg in print("Error: \(msg)") }
)
```

### Kotlin
```kotlin
val editor = VideoEditorKt()
editor.outputWidth = 1920
editor.outputHeight = 1080
editor.addVideoClip("input.mp4")
editor.export("output.mp4",
    progress = { p -> println("Progress: $p") },
    error = { code, msg -> println("Error: $msg") }
)
```

## 依赖库

- **FFmpeg 5.0+** - 音视频编解码
  - libavcodec, libavformat, libavutil
  - libswscale, libswresample
- **OpenGL 3.3+** - 图形渲染
- **GLAD** - OpenGL函数加载

## 支持的转场类型

1. None - 无转场
2. Fade - 淡入淡出
3. Dissolve - 溶解
4. Slide Left/Right/Up/Down - 四向滑动
5. Wipe Left/Right - 擦除
6. Ripple - 波纹
7. Zoom - 缩放
8. Rotate - 旋转

## 支持的滤镜类型

1. Brightness - 亮度
2. Contrast - 对比度
3. Saturation - 饱和度
4. GaussianBlur - 高斯模糊
5. Sharpen - 锐化
6. Sepia - 复古色调
7. Vignette - 暗角

## 音频变速不变调 (Pitch-Preserving Speed Change)

### 解决的问题

- ❌ 原实现: 简单重采样导致音调变化
  - 0.5x 慢放 → 声音低沉（频率减半）
  - 2.0x 快放 → 声音像松鼠叫（频率翻倍）

- ✅ 新实现: SOLA (Synchronous Overlap-Add) 算法
  - 变速不变调
  - 自然的音质
  - 支持 0.25x - 4.0x 速度范围

### 算法特点

- **SOLA算法**：基于波形相似性的时域伸缩
- **汉宁窗平滑**：消除边界不连续
- **交叉淡入淡出**：Overlap-Add 确保相位连续
- **参数配置**：
  - Frame Size: 1024 samples (~23ms @ 44100Hz)
  - Overlap: 512 samples
  - Sync Window: 256 samples

### 使用方式

```cpp
#include "ve/editor.h"

auto clip = std::make_shared<VideoClip>("input.mp4");
clip->Open();

// 设置速度 - 自动应用变速不变调
clip->SetSpeed(0.75f);  // 75% 速度，音调不变
clip->SetSpeed(1.5f);   // 150% 速度，音调不变

editor->AddVideoClip(clip);
editor->Export("output.mp4", ...);
```

## 版本信息

- SDK版本: 1.1.0
- C++标准: C++17
- CMake版本: 3.20+
- 新增功能: 音频变速不变调 (SOLA algorithm)
