# API 参考文档

## 数据结构

### Point3D
3D 坐标点

```cpp
struct Point3D {
    float x;  // X 坐标 [0, 1]
    float y;  // Y 坐标 [0, 1]
    float z;  // Z 坐标 (深度)
};
```

### Landmark
单个关键点信息

```cpp
struct Landmark {
    Point3D position;      // 位置坐标
    float visibility;      // 可见度 [0, 1]
    float presence;        // 存在置信度 [0, 1]
};
```

### GestureType
手势类型枚举

```cpp
enum class GestureType {
    NONE = 0,      // 无手势
    FIST = 1,      // 握拳
    ONE = 2,       // 数字 1
    TWO = 3,       // 数字 2
    THREE = 4,     // 数字 3
    FOUR = 5,      // 数字 4
    FIVE = 6,      // 数字 5
    OK = 7,        // OK 手势
    THUMBS_UP = 8, // 点赞
    HEART = 9      // 比心
};
```

### GestureResult
手势识别结果

```cpp
struct GestureResult {
    GestureType type;       // 手势类型
    float confidence;       // 置信度 [0, 1]
    std::string name;       // 手势名称
};
```

### HandResult
单只手的追踪结果

```cpp
struct HandResult {
    HandLandmarks landmarks;        // 21 个关键点 (归一化坐标)
    HandLandmarks world_landmarks;  // 世界坐标系关键点
    GestureResult gesture;          // 手势识别结果
    bool is_left_hand;              // 是否左手
    float hand_score;               // 手部检测置信度
    std::array<float, 4> bounding_box; // 边界框 [x_min, y_min, x_max, y_max]
};
```

### FrameResult
单帧处理结果

```cpp
struct FrameResult {
    std::vector<HandResult> hands;  // 检测到的手列表
    int64_t timestamp_ms;           // 时间戳 (毫秒)
    float inference_time_ms;        // 推理耗时 (毫秒)
    int width;                      // 帧宽度
    int height;                     // 帧高度
};
```

### TrackerConfig
追踪器配置

```cpp
struct TrackerConfig {
    TrackingMode mode = TrackingMode::MULTI_HAND;
    int max_num_hands = 2;
    float min_detection_confidence = 0.5f;
    float min_tracking_confidence = 0.5f;
    bool enable_gesture_recognition = true;
    bool use_int8_quantization = true;
    std::string model_path;         // 自定义模型路径
};
```

## HandTracker 类

### 构造函数
```cpp
HandTracker();
```

### Initialize
初始化追踪器

```cpp
bool Initialize(const TrackerConfig& config);
```

**参数:**
- `config`: 追踪器配置

**返回:**
- `true` 初始化成功
- `false` 初始化失败

### ProcessFrame
处理单帧图像（同步）

```cpp
bool ProcessFrame(const cv::Mat& frame, FrameResult& result);
```

**参数:**
- `frame`: 输入图像 (BGR 格式)
- `result`: 输出处理结果

**返回:**
- `true` 处理成功
- `false` 处理失败

### ProcessFrameAsync
处理单帧图像（异步）

```cpp
bool ProcessFrameAsync(const cv::Mat& frame);
```

**参数:**
- `frame`: 输入图像

### GetLatestResult
获取最新的异步处理结果

```cpp
bool GetLatestResult(FrameResult& result);
```

### Release
释放资源

```cpp
void Release();
```

### IsInitialized
检查是否已初始化

```cpp
bool IsInitialized() const;
```

### GetConfig
获取当前配置

```cpp
const TrackerConfig& GetConfig() const;
```

### GetSDKVersion (静态)
获取 SDK 版本

```cpp
static std::string GetSDKVersion();
```

## GestureRecognizer 类

### Recognize
识别手势

```cpp
GestureResult Recognize(const HandLandmarks& landmarks, bool is_left_hand);
```

### GetSupportedGestures (静态)
获取支持的手势列表

```cpp
static const std::vector<GestureType>& GetSupportedGestures();
```

### CalculateSimilarity (静态)
计算两组关键点的相似度

```cpp
static float CalculateSimilarity(const HandLandmarks& a, const HandLandmarks& b);
```

## Visualizer 类

### DrawLandmarks
绘制手部关键点

```cpp
void DrawLandmarks(cv::Mat& image, const HandResult& hand,
                   const cv::Scalar& landmark_color = cv::Scalar(0, 255, 0),
                   const cv::Scalar& connection_color = cv::Scalar(255, 0, 0));
```

### DrawBoundingBox
绘制边界框

```cpp
void DrawBoundingBox(cv::Mat& image, const HandResult& hand,
                     const cv::Scalar& color = cv::Scalar(0, 0, 255),
                     int thickness = 2);
```

### DrawGestureLabel
绘制手势标签

```cpp
void DrawGestureLabel(cv::Mat& image, const HandResult& hand,
                      const cv::Scalar& text_color = cv::Scalar(255, 255, 255),
                      const cv::Scalar& bg_color = cv::Scalar(0, 0, 0));
```

### DrawFPS
绘制 FPS 信息

```cpp
void DrawFPS(cv::Mat& image, float fps,
             const cv::Point& position = cv::Point(10, 30),
             const cv::Scalar& color = cv::Scalar(0, 255, 0),
             double font_scale = 1.0, int thickness = 2);
```

### DrawAll
绘制所有可视化元素

```cpp
void DrawAll(cv::Mat& image, const FrameResult& result, float fps = 0.0f);
```

### GetHandConnections (静态)
获取手部骨骼连接关系

```cpp
static const std::vector<std::pair<int, int>>& GetHandConnections();
```

## PerformanceProfiler 类

性能分析工具

```cpp
void StartFrame();        // 开始帧计时
void EndFrame();          // 结束帧计时
float GetFPS() const;     // 获取当前 FPS
void Reset();             // 重置统计
```

## FrameSkipper 类

帧跳过控制器，用于限制处理帧率

```cpp
FrameSkipper(int target_fps = 30);
bool ShouldProcessFrame();    // 是否应该处理当前帧
void SetTargetFPS(int fps);   // 设置目标 FPS
```

## LowPassFilter 类

低通滤波器，用于平滑关键点坐标

```cpp
LowPassFilter(float alpha = 0.5f);
Point3D Filter(const Point3D& input);  // 滤波处理
void Reset();                          // 重置滤波器
void SetAlpha(float alpha);            // 设置平滑系数
```

## Int8Quantizer 类

INT8 量化工具

```cpp
bool Initialize(const std::string& model_path,
                const std::vector<float>& calibration_data = {});
void QuantizeTensor(const std::vector<float>& input,
                    std::vector<int8_t>& output,
                    QuantizationParams& params);
void DequantizeTensor(const std::vector<int8_t>& input,
                      std::vector<float>& output,
                      const QuantizationParams& params);
void OptimizeForMobile();     // 针对移动端优化
void SetNumThreads(int num);  // 设置线程数
float GetQuantizationError() const;  // 获取量化误差
```

## 工具函数

### GestureTypeToString
手势类型转字符串

```cpp
const char* GestureTypeToString(GestureType type);
```

### StringToGestureType
字符串转手势类型

```cpp
GestureType StringToGestureType(const std::string& name);
```

## Python API

Python API 与 C++ API 一一对应，使用方式相同：

```python
from py_hand_tracking_sdk import (
    HandTracker, TrackerConfig, TrackingMode,
    GestureRecognizer, Visualizer,
    PerformanceProfiler, FrameSkipper, LowPassFilter,
    Int8Quantizer, QuantizationParams,
    GestureType, gesture_type_to_string, string_to_gesture_type
)
```

### 数据结构差异
- Python 中的 `Point3D` 支持属性访问 (`p.x`, `p.y`, `p.z`)
- `HandLandmarks` 是长度为 21 的列表
- Numpy 数组与 cv::Mat 自动转换
