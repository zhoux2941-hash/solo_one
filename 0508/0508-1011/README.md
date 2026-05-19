# 实时语音唤醒和命令词识别系统

在Jetson Nano（或树莓派）上实现的实时语音唤醒和命令词识别系统，采用MFCC特征提取 + DNN神经网络模型，使用TensorRT进行FP16加速推理。

## 功能特性

- **唤醒词检测**: "Hey Device"，延迟<200ms
- **命令词识别**: 支持10个中文命令词
  - 开灯、关灯、调亮、调暗、查询温度
  - 查询湿度、播放音乐、停止播放、打开窗帘、关闭窗帘
- **音频处理**: 回声消除(AEC) + 降噪(NS)，基于webrtc-audio-processing
- **推理加速**: TensorRT FP16量化加速
- **跨平台**: 支持Jetson Nano、树莓派、Windows/Linux PC

## 项目结构

```
├── config/
│   └── config.yaml          # 配置文件
├── models/                  # 模型文件目录
├── data/
│   ├── audio/               # 音频数据
│   │   ├── train/           # 训练数据
│   │   └── test/            # 测试数据
│   └── features/            # 提取的特征
├── src/
│   ├── audio/               # 音频处理模块
│   │   ├── recorder.py      # 音频录制
│   │   └── audio_processor.py  # AEC+NS处理
│   ├── features/            # 特征提取
│   │   └── mfcc_extractor.py   # MFCC特征提取
│   ├── model/               # 模型定义
│   │   └── dnn_models.py    # DNN模型架构
│   ├── inference/           # 推理引擎
│   │   ├── tensorrt_engine.py   # TensorRT引擎
│   │   ├── wake_word_detector.py # 唤醒词检测
│   │   └── command_recognizer.py # 命令识别
│   ├── utils/               # 工具模块
│   │   └── config_loader.py # 配置加载
│   └── voice_assistant.py   # 主程序
├── scripts/
│   ├── audio_recorder_tool.py   # 音频录制工具
│   ├── test_accuracy.py      # 准确率测试工具
│   ├── train_model.py        # 模型训练脚本
│   └── install_jetson.sh     # Jetson安装脚本
├── main.py                  # 入口程序
├── requirements.txt         # Python依赖
└── README.md
```

## 快速开始

### 1. 环境安装

#### Jetson Nano
```bash
chmod +x scripts/install_jetson.sh
./scripts/install_jetson.sh
```

#### Windows/Linux PC
```bash
pip install -r requirements.txt
```

### 2. 测试系统

```bash
# 测试系统延迟和功能
python main.py --mode test

# 使用PyTorch模型测试（无需TensorRT）
python main.py --mode test --use-torch
```

### 3. 运行实时识别

```bash
# 使用TensorRT引擎（需要已转换的.engine文件）
python main.py --mode realtime

# 使用PyTorch模型
python main.py --mode realtime --use-torch

# 自定义唤醒阈值
python main.py --mode realtime --wake-threshold 0.8
```

## 数据采集和训练

### 采集音频数据

```bash
# 列出音频设备
python scripts/audio_recorder_tool.py --mode list

# 单次录音
python scripts/audio_recorder_tool.py --mode single --output data/audio/train

# 语音触发录音
python scripts/audio_recorder_tool.py --mode trigger --output data/audio/train
```

### 数据目录结构

```
data/audio/train/
├── wake_word/
│   ├── positive/       # 唤醒词正样本 (.wav)
│   └── negative/       # 唤醒词负样本 (.wav)
└── commands/
    ├── 开灯/
    ├── 关灯/
    ├── 调亮/
    └── ...
```

### 训练模型

```bash
# 训练唤醒词模型
python scripts/train_model.py --model wake --epochs 50

# 训练命令词模型
python scripts/train_model.py --model command --epochs 50

# 训练所有模型
python scripts/train_model.py --model all
```

### 转换TensorRT引擎

训练完成后，ONNX模型会保存在models目录下。首次运行时，TensorRT引擎会自动从ONNX转换。

## 性能指标

| 指标 | 目标 | 说明 |
|------|------|------|
| 唤醒检测延迟 | <200ms | 从音频输入到检测结果输出 |
| 命令识别准确率 | >90% | @1米距离，安静环境 |
| 实时处理 | 是 | 16kHz采样率，实时处理 |

## 准确率测试

```bash
# 完整测试
python scripts/test_accuracy.py --mode all

# 仅测试唤醒词
python scripts/test_accuracy.py --mode wake

# 仅测试命令识别
python scripts/test_accuracy.py --mode command

# 延迟测试
python scripts/test_accuracy.py --mode latency --iterations 100
```

## 配置说明

主要配置项在 `config/config.yaml` 中：

- **audio**: 音频采样率、通道、块大小等
- **aec**: 回声消除配置
- **ns**: 降噪配置（级别0-3）
- **mfcc**: MFCC特征参数
- **model.wake_word**: 唤醒词检测阈值、窗口大小
- **model.commands**: 命令词列表
- **model.inference**: 推理引擎配置

## 自定义开发

### 添加新命令

1. 在 `config/config.yaml` 中添加命令词
2. 采集对应音频数据
3. 重新训练命令识别模型

### 自定义回调

```python
from src.voice_assistant import VoiceAssistant

assistant = VoiceAssistant()

def on_wake(confidence):
    print(f"唤醒: {confidence}")

def on_command(command, confidence):
    print(f"命令: {command}, {confidence}")

assistant.set_wake_word_callback(on_wake)
assistant.set_command_callback(on_command)
assistant.start()
```

## 常见问题

### 1. 音频设备问题
```bash
# 列出设备
python scripts/audio_recorder_tool.py --mode list
```

### 2. TensorRT不可用
系统会自动回退到ONNX Runtime或PyTorch进行推理。

### 3. 唤醒词误触发
- 增加 `model.wake_word.threshold`
- 增加更多负样本训练
- 调整 `model.wake_word.min_activation_count`

## 许可证

MIT License
