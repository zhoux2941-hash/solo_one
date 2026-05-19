import os
import sys
import time
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.voice_assistant import VoiceAssistant


def demo_basic_usage():
    print("=" * 70)
    print("自我学习功能演示")
    print("=" * 70)
    
    print("\n1. 初始化语音助手 (启用自我学习)")
    print("-" * 70)
    
    assistant = VoiceAssistant(
        use_torch_models=False,
        enable_vad=False,
        enable_learning=True
    )
    
    print(f"\n学习状态: {'已启用' if assistant.enable_learning else '未启用'}")
    
    print("\n2. 查看初始学习状态")
    print("-" * 70)
    
    status = assistant.get_learning_status()
    print(f"历史记录数: {status['history_size']}")
    print(f"当前唤醒阈值: {status['threshold_summary']['wake_threshold']:.3f}")
    print(f"当前命令阈值: {status['threshold_summary']['command_threshold']:.3f}")
    print(f"常用命令: {status['common_commands']}")
    
    print("\n3. 模拟用户交互并收集反馈")
    print("-" * 70)
    
    interactions = [
        ('wake', 0.92, True),
        ('command', '开灯', 0.85, True),
        ('command', '调亮', 0.78, True),
        ('command', '查询温度', 0.91, True),
        ('wake', 0.88, True),
        ('command', '关灯', 0.82, True),
        ('wake', 0.75, False),
        ('command', '播放音乐', 0.68, True),
        ('command', '停止播放', 0.89, True),
    ]
    
    print("\n模拟交互:")
    for i, interaction in enumerate(interactions):
        if interaction[0] == 'wake':
            _, conf, is_correct = interaction
            print(f"  [{i}] 唤醒检测 - 置信度: {conf:.2f}, 正确: {is_correct}")
            if is_correct:
                assistant.provide_feedback('command_correct', {'command': 'wake', 'confidence': conf})
            else:
                assistant.provide_feedback('false_positive')
        else:
            _, cmd, conf, is_correct = interaction
            print(f"  [{i}] 命令 '{cmd}' - 置信度: {conf:.2f}, 正确: {is_correct}")
            if is_correct:
                assistant.provide_feedback('command_correct', {'command': cmd, 'confidence': conf})
            else:
                assistant.provide_feedback('command_incorrect', {'command': cmd})
    
    print("\n4. 交互后的学习状态")
    print("-" * 70)
    
    status = assistant.get_learning_status()
    print(f"历史记录数: {status['history_size']}")
    print(f"当前唤醒阈值: {status['threshold_summary']['wake_threshold']:.3f}")
    print(f"当前命令阈值: {status['threshold_summary']['command_threshold']:.3f}")
    print(f"常用命令: {status['common_commands']}")
    print(f"24小时交互数: {status['interaction_count_24h']}")
    
    print("\n5. 预测下一个可能的命令")
    print("-" * 70)
    
    predictions = assistant.get_predicted_next_commands(top_k=5)
    print("基于用户行为模式的预测:")
    for cmd, prob in predictions.items():
        print(f"  {cmd}: {prob:.3f}")
    
    print("\n6. 阈值自适应调整演示")
    print("-" * 70)
    
    print("\n模拟连续误报场景...")
    for i in range(5):
        assistant.provide_feedback('false_positive')
    
    status_after_fp = assistant.get_learning_status()
    print(f"误报后唤醒阈值: {status_after_fp['threshold_summary']['wake_threshold']:.3f}")
    
    print("\n模拟连续漏报场景...")
    for i in range(5):
        assistant.provide_feedback('false_negative')
    
    status_after_fn = assistant.get_learning_status()
    print(f"漏报后唤醒阈值: {status_after_fn['threshold_summary']['wake_threshold']:.3f}")
    
    print("\n7. 保存学习数据")
    print("-" * 70)
    
    assistant.save_learning_data()
    print("学习数据已保存到: data/user_history.json")
    
    print("\n8. 行为模型分析")
    print("-" * 70)
    
    behavior = status['behavior_summary']
    print(f"学习到的序列模式数: {behavior['sequence_patterns']}")
    if behavior['time_patterns']['command']['total'] > 0:
        print(f"命令使用高峰时段: {behavior['time_patterns']['command']['peak_hour']}点")
    
    print("\n" + "=" * 70)
    print("演示完成")
    print("=" * 70)
    
    print("\n提示:")
    print("  - 使用 'python scripts/learning_manager.py history' 查看完整历史")
    print("  - 使用 'python scripts/learning_manager.py threshold' 查看阈值状态")
    print("  - 使用 'python scripts/learning_manager.py behavior' 查看行为模型")
    print("  - 使用 'python scripts/learning_manager.py clear' 清除学习数据")
    
    assistant.cleanup()


def demo_with_audio_files():
    print("\n" + "=" * 70)
    print("使用音频文件演示自我学习")
    print("=" * 70)
    
    test_audio_dir = 'data/audio/test/wake_word/positive'
    
    if not os.path.exists(test_audio_dir):
        print(f"\n测试音频目录不存在: {test_audio_dir}")
        print("请先运行: python scripts/record_samples.py --mode wake_word")
        return
    
    assistant = VoiceAssistant(use_torch_models=False, enable_vad=False, enable_learning=True)
    
    from scripts.noise_augmentation import load_wav
    
    audio_files = [f for f in os.listdir(test_audio_dir) if f.endswith('.wav')][:5]
    
    print(f"\n测试 {len(audio_files)} 个音频文件:")
    
    for i, audio_file in enumerate(audio_files):
        file_path = os.path.join(test_audio_dir, audio_file)
        audio_data, sr = load_wav(file_path)
        
        is_wake, conf = assistant.detect_once(audio_data)
        
        print(f"  [{i}] {audio_file}: {'检测到' if is_wake else '未检测'} 唤醒词, 置信度: {conf:.3f}")
        
        if is_wake:
            assistant.provide_feedback('command_correct', {'command': 'wake', 'confidence': conf})
    
    status = assistant.get_learning_status()
    print(f"\n测试后历史记录数: {status['history_size']}")
    
    assistant.cleanup()


if __name__ == '__main__':
    demo_basic_usage()
    
    try:
        demo_with_audio_files()
    except Exception as e:
        print(f"\n音频演示跳过: {e}")
    
    print("\n完成!")
