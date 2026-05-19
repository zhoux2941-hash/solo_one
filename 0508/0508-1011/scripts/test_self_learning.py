import os
import sys
import time
import argparse
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.voice_assistant import VoiceAssistant
from src.learning import UserHistory, AdaptiveThresholdManager, UserBehaviorModel


def test_history_module():
    print("=" * 70)
    print("测试1: 用户历史记录模块")
    print("=" * 70)
    
    history = UserHistory(storage_path='data/test_history.json')
    
    print("\n录制一些模拟交互...")
    for i in range(20):
        if i % 2 == 0:
            history.record_wake_detection(confidence=0.85 + np.random.rand() * 0.1, is_correct=True)
        else:
            history.record_wake_detection(confidence=0.6 + np.random.rand() * 0.2, is_correct=False)
    
    commands = ['开灯', '关灯', '调亮', '调暗', '查询温度']
    for i in range(30):
        cmd = commands[i % len(commands)]
        history.record_command(
            command=cmd,
            confidence=0.7 + np.random.rand() * 0.25,
            is_correct=np.random.rand() > 0.2
        )
    
    print(f"\n总交互数: {len(history.interactions)}")
    print(f"唤醒词统计: {history.get_wake_statistics()}")
    print(f"常用命令: {history.get_common_commands(3)}")
    print(f"平均置信度: {history.get_average_confidence():.3f}")
    print(f"整体成功率: {history.get_success_rate():.3f}")
    
    print("\n命令统计:")
    for cmd in commands:
        stats = history.get_command_statistics(cmd)
        print(f"  {cmd}: {stats.get('total', 0)}次, 成功率: {stats.get('success_rate', 0):.3f}")
    
    history.save()
    print("\n历史已保存")
    
    history2 = UserHistory(storage_path='data/test_history.json')
    print(f"重新加载后交互数: {len(history2.interactions)}")
    
    if os.path.exists('data/test_history.json'):
        os.remove('data/test_history.json')
        print("测试历史文件已清理")
    
    return True


def test_threshold_manager():
    print("\n" + "=" * 70)
    print("测试2: 自适应阈值管理器")
    print("=" * 70)
    
    history = UserHistory(storage_path='data/test_threshold_history.json')
    threshold_mgr = AdaptiveThresholdManager(history)
    
    print(f"\n初始唤醒阈值: {threshold_mgr.get_wake_threshold():.3f}")
    print(f"初始命令阈值: {threshold_mgr.get_command_threshold():.3f}")
    
    print("\n模拟高误报场景...")
    for i in range(20):
        is_correct = i < 5
        history.record_wake_detection(confidence=0.9, is_correct=is_correct)
        threshold_mgr.update_wake_confidence(0.9, is_correct)
    
    threshold_mgr.last_adjustment_time = 0
    adjusted = threshold_mgr.adjust_thresholds()
    print(f"是否调整: {adjusted}")
    print(f"调整后唤醒阈值: {threshold_mgr.get_wake_threshold():.3f}")
    
    print("\n模拟低置信度但高准确率场景...")
    for cmd in ['开灯', '关灯', '调亮']:
        for i in range(15):
            history.record_command(cmd, confidence=0.65, is_correct=True)
            threshold_mgr.update_command_confidence(cmd, 0.65, True)
    
    threshold_mgr.last_adjustment_time = 0
    threshold_mgr.adjust_thresholds()
    print(f"命令'开灯'阈值: {threshold_mgr.get_command_threshold('开灯'):.3f}")
    
    print("\n测试反馈处理...")
    threshold_mgr.handle_feedback('false_positive')
    print(f"误报反馈后唤醒阈值: {threshold_mgr.get_wake_threshold():.3f}")
    
    threshold_mgr.handle_feedback('false_negative')
    print(f"漏报反馈后唤醒阈值: {threshold_mgr.get_wake_threshold():.3f}")
    
    summary = threshold_mgr.get_threshold_summary()
    print(f"\n阈值摘要: {summary}")
    
    if os.path.exists('data/test_threshold_history.json'):
        os.remove('data/test_threshold_history.json')
    
    return True


def test_behavior_model():
    print("\n" + "=" * 70)
    print("测试3: 用户行为模型")
    print("=" * 70)
    
    history = UserHistory(storage_path='data/test_behavior_history.json')
    behavior_model = UserBehaviorModel(history)
    
    print("\n模拟常用命令序列...")
    sequences = [
        ['开灯', '调亮', '查询温度'],
        ['关灯', '调暗'],
        ['开灯', '查询温度', '播放音乐'],
        ['开灯', '调亮', '调亮'],
        ['查询温度', '查询湿度'],
    ]
    
    for seq in sequences:
        for cmd in seq:
            interaction = history.record_command(cmd, confidence=0.8, is_correct=True)
            behavior_model.record_interaction(interaction)
    
    predictions = behavior_model.predict_next_commands(current_commands=['开灯'], top_k=3)
    print(f"\n'开灯'后的预测: {predictions}")
    
    predictions = behavior_model.predict_next_commands(current_commands=['调亮'], top_k=3)
    print(f"'调亮'后的预测: {predictions}")
    
    time_prob = behavior_model.get_time_based_probability('command')
    print(f"\n当前时间使用概率: {time_prob:.3f}")
    
    bias = behavior_model.get_adaptive_bias('command', context={'command': '查询温度'})
    print(f"'查询温度'的行为偏差: {bias:.4f}")
    
    conf_range = behavior_model.get_expected_confidence_range('command')
    print(f"期望置信度范围: [{conf_range[0]:.3f}, {conf_range[1]:.3f}]")
    
    summary = behavior_model.get_behavior_summary()
    print(f"\n行为模型摘要:")
    print(f"  序列模式数: {summary['sequence_patterns']}")
    print(f"  当前序列: {summary['current_sequence']}")
    print(f"  下一个预测: {summary['top_predictions']}")
    
    if os.path.exists('data/test_behavior_history.json'):
        os.remove('data/test_behavior_history.json')
    
    return True


def test_integration():
    print("\n" + "=" * 70)
    print("测试4: 集成测试 (使用模拟数据)")
    print("=" * 70)
    
    print("\n初始化语音助手 (启用学习功能)...")
    assistant = VoiceAssistant(use_torch_models=False, enable_vad=False, enable_learning=True)
    
    print(f"\n学习状态: {assistant.enable_learning}")
    
    print("\n测试反馈接口...")
    assistant.provide_feedback('command_correct', {'command': '开灯', 'confidence': 0.95})
    assistant.provide_feedback('command_incorrect', {'command': '关灯'})
    
    status = assistant.get_learning_status()
    print(f"\n学习状态摘要:")
    print(f"  历史大小: {status['history_size']}")
    print(f"  唤醒阈值: {status['threshold_summary']['wake_threshold']:.3f}")
    print(f"  命令阈值: {status['threshold_summary']['command_threshold']:.3f}")
    print(f"  常用命令: {status['common_commands']}")
    
    predictions = assistant.get_predicted_next_commands(top_k=3)
    print(f"  下一个命令预测: {predictions}")
    
    print("\n测试学习数据保存...")
    assistant.save_learning_data()
    
    print("\n清理测试数据...")
    assistant.reset_learning()
    
    assistant.cleanup()
    
    if os.path.exists('data/user_history.json'):
        os.remove('data/user_history.json')
    
    return True


def simulate_real_usage():
    print("\n" + "=" * 70)
    print("测试5: 模拟真实使用场景")
    print("=" * 70)
    
    history = UserHistory(storage_path='data/simulated_history.json')
    threshold_mgr = AdaptiveThresholdManager(history)
    behavior_model = UserBehaviorModel(history)
    
    commands = ['开灯', '关灯', '调亮', '调暗', '查询温度', '查询湿度', '播放音乐', '停止播放']
    
    print("\n模拟100次交互...")
    for i in range(100):
        if np.random.rand() < 0.3:
            wake_conf = 0.7 + np.random.rand() * 0.25
            is_correct = np.random.rand() > 0.1
            interaction = history.record_wake_detection(wake_conf, is_correct)
            threshold_mgr.update_wake_confidence(wake_conf, is_correct)
            behavior_model.record_interaction(interaction)
        else:
            cmd = commands[int(np.random.randint(0, len(commands)))]
            cmd_conf = 0.6 + np.random.rand() * 0.35
            is_correct = np.random.rand() > 0.15
            interaction = history.record_command(cmd, cmd_conf, is_correct)
            threshold_mgr.update_command_confidence(cmd, cmd_conf, is_correct)
            behavior_model.record_interaction(interaction)
        
        if i % 20 == 0 and i > 0:
            threshold_mgr.last_adjustment_time = 0
            threshold_mgr.adjust_thresholds()
    
    print(f"\n交互总数: {len(history.interactions)}")
    print(f"唤醒检测: {history.get_wake_statistics()}")
    print(f"整体成功率: {history.get_success_rate():.3f}")
    print(f"\n当前阈值:")
    print(f"  唤醒: {threshold_mgr.get_wake_threshold():.3f}")
    print(f"  命令(通用): {threshold_mgr.get_command_threshold():.3f}")
    
    print(f"\n常用命令阈值:")
    for cmd in history.get_common_commands(5):
        print(f"  {cmd}: {threshold_mgr.get_command_threshold(cmd):.3f}")
    
    print(f"\n行为预测 (基于最后3个命令):")
    recent_cmds = [i.command for i in history.interactions if i.type == 'command'][-3:]
    print(f"  最近命令: {recent_cmds}")
    preds = behavior_model.predict_next_commands(recent_cmds, top_k=3)
    print(f"  预测: {preds}")
    
    history.save()
    
    if os.path.exists('data/simulated_history.json'):
        os.remove('data/simulated_history.json')
    
    return True


def main():
    parser = argparse.ArgumentParser(description="自我学习功能测试")
    parser.add_argument('--test', type=str, default='all',
                        choices=['all', 'history', 'threshold', 'behavior', 'integration', 'simulate'],
                        help='测试模块')
    
    args = parser.parse_args()
    
    os.makedirs('data', exist_ok=True)
    
    results = {}
    
    try:
        if args.test in ['all', 'history']:
            results['history'] = test_history_module()
        
        if args.test in ['all', 'threshold']:
            results['threshold'] = test_threshold_manager()
        
        if args.test in ['all', 'behavior']:
            results['behavior'] = test_behavior_model()
        
        if args.test in ['all', 'integration']:
            results['integration'] = test_integration()
        
        if args.test in ['all', 'simulate']:
            results['simulate'] = simulate_real_usage()
        
        print("\n" + "=" * 70)
        print("测试结果汇总")
        print("=" * 70)
        for test_name, passed in results.items():
            status = "✓ 通过" if passed else "✗ 失败"
            print(f"  {test_name}: {status}")
        
        all_passed = all(results.values())
        print(f"\n总体: {'全部通过 ✓' if all_passed else '存在失败 ✗'}")
        
        return 0 if all_passed else 1
        
    except Exception as e:
        print(f"\n测试异常: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    exit(main())
