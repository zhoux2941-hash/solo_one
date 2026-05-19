# MediaPipe 手部追踪 SDK

基于 MediaPipe 的实时手部追踪 SDK，支持 21 个关键点 3D 坐标追踪、单/双手识别、10 种手势识别，提供 C++ API 和 Python 绑定，支持 Windows/Linux/Android/iOS 跨平台部署。

## 功能特性

### 核心功能
- ✅ **21 个关键点 3D 追踪** - 每只手输出 21 个关键点的 3D 坐标 (x, y, z)
- ✅ **单/双手模式** - 支持单手和双手追踪，可配置最多追踪数量
- ✅ **10 种手势识别** - 握拳、数字 1-5、OK、点赞、比心
- ✅ **实时性能** - INT8 量化优化，手机端可达 30+ FPS
- ✅ **跨平台** - 支持 Windows / Linux / Android / iOS

### 手势列表
| 手势 | 说明 |
|------|------|
| ✊ Fist | 握拳 |
| ☝️ One | 数字 1（食指） |
| ✌️ Two | 数字 2（食指+中指） |
| 🤟 Three | 数字 3（食指+中指+无名指） |
| 🖖 Four | 数字 4（四指） |
| 🖐️ Five | 数字 5（五指张开） |
| 👌 OK | OK 手势 |
| 👍 ThumbsUp | 点赞 |
| ❤️ Heart | 比心 |

## 项目结构

```
hand_tracking_sdk/
├── include/hand_tracking_sdk/     # 头文件
│   ├── common.h                    # 通用数据结构
│   ├── hand_tracker.h              # 手部追踪核心 API
│   ├── gesture_recognizer.h        # 手势识别引擎
│   ├── visualizer.h                # 可视化工具
│   ├── performance_optimizer.h     # 性能优化工具
│   └── quantization.h              # INT8 量化
├── src/                            # C++ 源文件
├── python/                         # Python 绑定
│   ├── bindings.cpp                # pybind11 绑定
│   ├── setup.py                    # Python 包配置
│   └── examples/                   # Python 示例
├── examples/                       # C++ 示例应用
│   ├── demo.cpp                    # 基础演示
│   ├── virtual_paint.cpp           # 虚拟画笔
│   ├── ppt_controller.cpp          # PPT 翻页控制
│   └── volume_control.cpp          # 音量控制
├── tests/                          # 单元测试
├── platforms/                      # 跨平台配置
│   ├── android/                    # Android 构建配置
│   └── ios/                        # iOS 构建配置
└── CMakeLists.txt                  # 顶层 CMake 配置
```

## 快速开始

### 环境要求
- CMake >= 3.18
- C++17 编译器 (MSVC 2019+, GCC 8+, Clang 10+)
- OpenCV >= 4.5.0
- Python >= 3.7 (Python 绑定)
- pybind11 >= 2.6 (Python 绑定)

### C++ 编译

```bash
mkdir build && cd build
cmake .. -DBUILD_EXAMPLES=ON -DBUILD_PYTHON_BINDINGS=ON
cmake --build . --config Release
```

### Python 安装

```bash
cd python
pip install .
```

## API 使用

### C++ 示例

```cpp
#include <hand_tracking_sdk/hand_tracker.h>
#include <hand_tracking_sdk/visualizer.h>
#include <opencv2/opencv.hpp>

using namespace hand_tracking_sdk;

int main() {
    // 配置追踪器
    TrackerConfig config;
    config.mode = TrackingMode::MULTI_HAND;
    config.max_num_hands = 2;
    config.enable_gesture_recognition = true;
    config.use_int8_quantization = true;

    // 初始化追踪器
    HandTracker tracker;
    if (!tracker.Initialize(config)) {
        std::cerr << "Failed to initialize tracker" << std::endl;
        return -1;
    }

    Visualizer visualizer;
    cv::VideoCapture cap(0);

    while (true) {
        cv::Mat frame;
        cap >> frame;
        if (frame.empty()) break;

        FrameResult result;
        if (tracker.ProcessFrame(frame, result)) {
            // 输出关键点和手势
            for (const auto& hand : result.hands) {
                std::cout << "Gesture: " << hand.gesture.name << std::endl;
                std::cout << "Index tip: (" << hand.landmarks[8].position.x
                          << ", " << hand.landmarks[8].position.y << ")" << std::endl;
            }

            visualizer.DrawAll(frame, result);
        }

        cv::imshow("Hand Tracking", frame);
        if (cv::waitKey(1) == 27) break;
    }

    tracker.Release();
    return 0;
}
```

### Python 示例

```python
import cv2
from py_hand_tracking_sdk import (
    HandTracker, TrackerConfig, TrackingMode, Visualizer
)

# 初始化
config = TrackerConfig()
config.mode = TrackingMode.MULTI_HAND
config.max_num_hands = 2
config.enable_gesture_recognition = True

tracker = HandTracker()
tracker.initialize(config)
visualizer = Visualizer()

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    success, result = tracker.process_frame(frame)
    if success:
        for hand in result.hands:
            print(f"Gesture: {hand.gesture.name}, "
                  f"Confidence: {hand.gesture.confidence:.2f}")

        frame = visualizer.draw_all(frame, result)

    cv2.imshow("Hand Tracking", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

tracker.release()
```

## 示例应用

### 1. 虚拟画笔 (Virtual Paint)
用食指在空中绘画，支持：
- 数字 1 = 开始绘画
- 数字 2 = 选择/暂停
- 握拳 = 撤销
- 数字 3 = 切换颜色
- 数字 4/5 = 调整粗细
- C = 清除画布
- S = 保存图片

```bash
./build/examples/virtual_paint
```

### 2. PPT 翻页控制器
用手势控制 PPT 演示：
- 张开手掌左右滑动 = 上一页/下一页
- 握拳 = 暂停/继续
- 点赞 = 开始演示 (F5)
- OK = 退出演示 (ESC)

```bash
./build/examples/ppt_controller
```

### 3. 音量控制
用手势控制系统音量：
- 握拳 = 激活/关闭控制
- 捏合距离 = 控制音量大小
- 旋转手势 = 精细调节音量
- 点赞 = 音量 +5
- 数字 5 = 切换控制模式

```bash
./build/examples/volume_control
```

## 性能优化

### INT8 量化
SDK 支持 INT8 模型量化，可显著提升移动端性能：

```cpp
config.use_int8_quantization = true;

// 手动使用量化工具
Int8Quantizer quantizer;
quantizer.Initialize("model.tflite");
quantizer.OptimizeForMobile();  // 针对移动端优化
quantizer.SetNumThreads(4);     // 设置线程数
```

### 性能指标（参考）
| 设备 | 精度 | FPS | 延迟 |
|------|------|-----|------|
| iPhone 14 Pro | INT8 | 35+ | ~18ms |
| Android (骁龙 8 Gen 2) | INT8 | 32+ | ~22ms |
| PC (i7-12700K) | FP32 | 60+ | ~10ms |

### 性能调优建议
1. 使用 `TrackingMode::SINGLE_HAND` 替代 `MULTI_HAND` 可提升 ~30% 性能
2. 降低输入分辨率（如 640x480）可提升性能
3. 使用 `FrameSkipper` 控制处理帧率
4. 启用 INT8 量化可提升 ~2x 性能

## 运行测试

```bash
cd build
ctest -C Release --output-on-failure
```

测试包括：
- 手势识别单元测试
- 性能优化工具测试
- INT8 量化功能测试

## 跨平台部署

### Android
```bash
cd platforms/android
./gradlew assembleRelease
```

### iOS
```bash
cd platforms/ios
pod install
open HandTrackingSDK.xcworkspace
```

## 数据格式

### 关键点索引
```
0:  手腕 (Wrist)
1-4: 拇指 (Thumb: MCP → IP → TIP)
5-8: 食指 (Index: MCP → PIP → DIP → TIP)
9-12: 中指 (Middle: MCP → PIP → DIP → TIP)
13-16: 无名指 (Ring: MCP → PIP → DIP → TIP)
17-20: 小指 (Pinky: MCP → PIP → DIP → TIP)
```

### 坐标系
- x: 水平方向 (0.0 = 左, 1.0 = 右)
- y: 垂直方向 (0.0 = 上, 1.0 = 下)
- z: 深度方向 (正值 = 远离摄像机)

## 常见问题

**Q: 如何提高手势识别准确率？**
A: 确保手部在画面中心，光线充足。可以调整 `min_detection_confidence` 和 `min_tracking_confidence` 参数。

**Q: 如何在移动端获得最佳性能？**
A: 启用 INT8 量化，使用单手模式，降低输入分辨率到 640x480。

**Q: 可以添加自定义手势吗？**
A: 可以扩展 `GestureRecognizer` 类，添加新的手势检测逻辑。

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。
