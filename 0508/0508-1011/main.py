#!/usr/bin/env python3
import os
import sys
import argparse
import signal
from src.voice_assistant import VoiceAssistant


def on_wake_word(confidence):
    print(f"\n>>> 唤醒词检测成功！置信度: {confidence:.4f}")
    print(">>> 请说出命令...")


def on_command(command, confidence):
    print(f"\n>>> 识别命令: {command}")
    print(f">>> 置信度: {confidence:.4f}")
    
    command_handlers = {
        "开灯": lambda: print(">>> 执行: 打开灯光"),
        "关灯": lambda: print(">>> 执行: 关闭灯光"),
        "调亮": lambda: print(">>> 执行: 调亮灯光"),
        "调暗": lambda: print(">>> 执行: 调暗灯光"),
        "查询温度": lambda: print(">>> 执行: 查询温度，当前温度: 25°C"),
        "查询湿度": lambda: print(">>> 执行: 查询湿度，当前湿度: 60%"),
        "播放音乐": lambda: print(">>> 执行: 播放音乐"),
        "停止播放": lambda: print(">>> 执行: 停止播放"),
        "打开窗帘": lambda: print(">>> 执行: 打开窗帘"),
        "关闭窗帘": lambda: print(">>> 执行: 关闭窗帘"),
    }
    
    handler = command_handlers.get(command)
    if handler:
        handler()
    else:
        print(f">>> 未知命令: {command}")


def main():
    parser = argparse.ArgumentParser(description="实时语音唤醒和命令词识别系统")
    parser.add_argument('--mode', type=str, default='realtime', 
                        choices=['realtime', 'test', 'train'],
                        help='运行模式: realtime(实时), test(测试), train(训练)')
    parser.add_argument('--use-torch', action='store_true', help='使用PyTorch模型')
    parser.add_argument('--wake-threshold', type=float, default=None, help='唤醒词检测阈值')
    
    args = parser.parse_args()
    
    if args.mode == 'realtime':
        run_realtime(args)
    elif args.mode == 'test':
        run_test(args)
    elif args.mode == 'train':
        run_train(args)


def run_realtime(args):
    print("=" * 60)
    print("实时语音唤醒和命令词识别系统")
    print("=" * 60)
    
    print("\n初始化系统...")
    assistant = VoiceAssistant(use_torch_models=args.use_torch)
    
    if args.wake_threshold:
        assistant.wake_detector.threshold = args.wake_threshold
    
    assistant.set_wake_word_callback(on_wake_word)
    assistant.set_command_callback(on_command)
    
    commands = assistant.get_commands()
    print(f"\n支持的命令 ({len(commands)}个):")
    for i, cmd in enumerate(commands, 1):
        print(f"  {i}. {cmd}")
    
    print(f"\n唤醒词: {assistant.wake_detector.wake_word_name}")
    print("按 Ctrl+C 退出\n")
    
    def signal_handler(sig, frame):
        print("\n\n正在关闭系统...")
        assistant.cleanup()
        print("系统已关闭，再见！")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        assistant.start()
        
        while True:
            import time
            time.sleep(1.0)
            
    except KeyboardInterrupt:
        pass
    finally:
        assistant.cleanup()


def run_test(args):
    print("=" * 60)
    print("系统测试模式")
    print("=" * 60)
    
    print("\n初始化系统...")
    assistant = VoiceAssistant(use_torch_models=args.use_torch)
    
    commands = assistant.get_commands()
    print(f"\n支持的命令 ({len(commands)}个):")
    for i, cmd in enumerate(commands, 1):
        print(f"  {i}. {cmd}")
    
    print("\n测试1: 延迟测试")
    print("-" * 60)
    
    import numpy as np
    import time
    
    sample_rate = 16000
    duration = 2.0
    dummy_audio = np.random.randn(int(sample_rate * duration)).astype(np.float32) * 1000
    dummy_audio = dummy_audio.astype(np.int16)
    
    from src.audio.audio_processor import AudioProcessor
    from src.features.mfcc_extractor import MFCCExtractor
    
    processor = AudioProcessor()
    extractor = MFCCExtractor()
    
    processed = processor.process(dummy_audio)
    features = extractor.extract(processed)
    features = extractor.normalize(features)
    
    print(f"输入特征形状: {features.shape}")
    
    print("\n唤醒检测延迟测试 (100次迭代):")
    times = []
    for i in range(100):
        start = time.time()
        assistant.wake_detector.detect(features)
        times.append((time.time() - start) * 1000)
    
    print(f"  平均: {np.mean(times):.2f} ms")
    print(f"  中位数: {np.median(times):.2f} ms")
    print(f"  最小: {np.min(times):.2f} ms")
    print(f"  最大: {np.max(times):.2f} ms")
    
    if np.mean(times) < 200:
        print("  ✓ 满足要求 (<200ms)")
    else:
        print("  ✗ 不满足要求 (>=200ms)")
    
    print("\n命令识别延迟测试 (100次迭代):")
    times = []
    for i in range(100):
        start = time.time()
        assistant.command_recognizer.recognize(features)
        times.append((time.time() - start) * 1000)
    
    print(f"  平均: {np.mean(times):.2f} ms")
    print(f"  中位数: {np.median(times):.2f} ms")
    print(f"  最小: {np.min(times):.2f} ms")
    print(f"  最大: {np.max(times):.2f} ms")
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)
    
    assistant.cleanup()


def run_train(args):
    print("=" * 60)
    print("模型训练模式")
    print("=" * 60)
    
    print("\n请使用以下命令进行训练:")
    print("  python scripts/train_model.py --model wake    # 训练唤醒词模型")
    print("  python scripts/train_model.py --model command # 训练命令词模型")
    print("  python scripts/train_model.py --model all     # 训练所有模型")
    
    print("\n训练数据目录结构:")
    print("  data/audio/train/")
    print("    ├── wake_word/")
    print("    │   ├── positive/  # 唤醒词正样本 (.wav)")
    print("    │   └── negative/  # 唤醒词负样本 (.wav)")
    print("    └── commands/")
    print("        ├── 开灯/")
    print("        ├── 关灯/")
    print("        └── ...")


if __name__ == '__main__':
    main()
