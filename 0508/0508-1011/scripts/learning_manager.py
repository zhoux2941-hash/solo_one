import os
import sys
import json
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.learning import UserHistory, AdaptiveThresholdManager, UserBehaviorModel


def show_history(args):
    history = UserHistory(storage_path=args.path)
    
    print(f"=" * 70)
    print(f"用户历史记录")
    print(f"=" * 70)
    print(f"\n存储路径: {args.path}")
    print(f"总交互数: {len(history.interactions)}")
    
    if len(history.interactions) == 0:
        print("\n暂无历史记录")
        return
    
    wake_stats = history.get_wake_statistics()
    print(f"\n唤醒词统计:")
    print(f"  总检测: {wake_stats['total_detections']}")
    print(f"  正确: {wake_stats['correct_detections']}")
    print(f"  误报: {wake_stats['false_positives']}")
    print(f"  漏报: {wake_stats['false_negatives']}")
    if wake_stats['confidences']:
        print(f"  平均置信度: {sum(wake_stats['confidences'])/len(wake_stats['confidences']):.3f}")
    
    print(f"\n命令统计:")
    cmd_stats = history.get_command_statistics()
    if cmd_stats:
        for cmd, stats in sorted(cmd_stats.items(), key=lambda x: x[1]['total'], reverse=True):
            print(f"  {cmd}: {stats['total']}次, 成功率: {stats['success_rate']:.3f}, 平均置信度: {stats['avg_confidence']:.3f}")
    else:
        print("  暂无命令记录")
    
    print(f"\n常用命令 (Top 5): {history.get_common_commands(5)}")
    print(f"24小时内交互数: {history.get_interaction_count(24)}")
    
    if args.recent > 0:
        print(f"\n最近 {args.recent} 条交互:")
        recent = history.get_recent_interactions(args.recent)
        for i, interaction in enumerate(recent):
            time_str = json.dumps(interaction.timestamp, ensure_ascii=False)
            if interaction.type == 'wake':
                print(f"  [{i}] 唤醒检测 - 置信度: {interaction.confidence:.3f}, 正确: {interaction.is_correct}")
            elif interaction.type == 'command':
                print(f"  [{i}] 命令 '{interaction.command}' - 置信度: {interaction.confidence:.3f}, 正确: {interaction.is_correct}")
            elif interaction.type == 'correction':
                print(f"  [{i}] 反馈: {interaction.feedback}")


def show_thresholds(args):
    history = UserHistory(storage_path=args.path)
    threshold_mgr = AdaptiveThresholdManager(history)
    
    print(f"=" * 70)
    print(f"自适应阈值状态")
    print(f"=" * 70)
    
    summary = threshold_mgr.get_threshold_summary()
    print(f"\n唤醒词阈值:")
    print(f"  当前: {summary['wake_threshold']:.3f}")
    print(f"  基准: {summary['base_wake_threshold']:.3f}")
    print(f"  范围: [{threshold_mgr.min_wake_threshold:.3f}, {threshold_mgr.max_wake_threshold:.3f}]")
    
    print(f"\n命令词阈值:")
    print(f"  当前(通用): {summary['command_threshold']:.3f}")
    print(f"  基准: {summary['base_command_threshold']:.3f}")
    print(f"  范围: [{threshold_mgr.min_command_threshold:.3f}, {threshold_mgr.max_command_threshold:.3f}]")
    
    if summary['command_specific_thresholds']:
        print(f"\n命令特定阈值:")
        for cmd, thresh in summary['command_specific_thresholds'].items():
            print(f"  {cmd}: {thresh:.3f}")
    
    print(f"\n统计:")
    print(f"  调整次数: {summary['adjustment_count']}")
    print(f"  唤醒置信度缓冲区: {summary['wake_confidence_buffer_size']}")
    print(f"  命令置信度缓冲区: {summary['command_confidence_buffer_size']}")


def show_behavior(args):
    history = UserHistory(storage_path=args.path)
    behavior_model = UserBehaviorModel(history)
    
    print(f"=" * 70)
    print(f"用户行为模型")
    print(f"=" * 70)
    
    summary = behavior_model.get_behavior_summary()
    print(f"\n序列模式数: {summary['sequence_patterns']}")
    
    print(f"\n时间模式:")
    for cmd_type, stats in summary['time_patterns'].items():
        if stats['total'] > 0:
            print(f"  {cmd_type}: 共{stats['total']}次, 高峰时段: {stats['peak_hour']}点, 高峰日: 周{stats['peak_day']}")
    
    print(f"\n准确度模型:")
    for interaction_type, model in summary['accuracy_model'].items():
        print(f"  {interaction_type}: 期望置信度: {model['expected_confidence']:.3f}, 方差: {model['variance']:.3f}")
    
    print(f"\n当前命令序列: {summary['current_sequence']}")
    
    print(f"\n下一个命令预测 (Top 5):")
    for cmd, prob in summary['top_predictions'].items():
        print(f"  {cmd}: {prob:.3f}")


def simulate_feedback(args):
    history = UserHistory(storage_path=args.path)
    threshold_mgr = AdaptiveThresholdManager(history)
    
    print(f"=" * 70)
    print(f"模拟反馈: {args.feedback_type}")
    print(f"=" * 70)
    
    before_wake = threshold_mgr.get_wake_threshold()
    before_cmd = threshold_mgr.get_command_threshold()
    
    print(f"\n调整前:")
    print(f"  唤醒阈值: {before_wake:.3f}")
    print(f"  命令阈值: {before_cmd:.3f}")
    
    details = {}
    if args.command:
        details['command'] = args.command
    if args.confidence:
        details['confidence'] = args.confidence
    
    threshold_mgr.handle_feedback(args.feedback_type, details)
    
    after_wake = threshold_mgr.get_wake_threshold()
    after_cmd = threshold_mgr.get_command_threshold()
    
    print(f"\n调整后:")
    print(f"  唤醒阈值: {after_wake:.3f} (变化: {after_wake - before_wake:+.3f})")
    print(f"  命令阈值: {after_cmd:.3f} (变化: {after_cmd - before_cmd:+.3f})")
    
    if args.save:
        history.save()
        print(f"\n已保存到 {args.path}")


def clear_history(args):
    if not args.yes:
        confirm = input(f"确定要清除历史记录 {args.path} 吗? (yes/no): ")
        if confirm.lower() != 'yes':
            print("已取消")
            return
    
    history = UserHistory(storage_path=args.path)
    history.clear_history()
    print(f"历史记录已清除: {args.path}")


def export_data(args):
    history = UserHistory(storage_path=args.path)
    
    data = {
        'interactions': [i.to_dict() for i in history.interactions],
        'command_stats': dict(history.command_stats),
        'wake_stats': history.wake_stats,
        'user_preferences': history.user_preferences
    }
    
    output_path = args.output or 'learning_data_export.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"数据已导出到: {output_path}")
    print(f"  交互记录: {len(data['interactions'])} 条")
    print(f"  命令类型: {len(data['command_stats'])} 种")


def main():
    parser = argparse.ArgumentParser(description="自我学习功能管理工具")
    parser.add_argument('--path', type=str, default='data/user_history.json',
                        help='历史数据文件路径')
    
    subparsers = parser.add_subparsers(dest='command', help='操作命令')
    
    history_parser = subparsers.add_parser('history', help='查看历史记录')
    history_parser.add_argument('--recent', type=int, default=0, help='显示最近N条记录')
    history_parser.set_defaults(func=show_history)
    
    threshold_parser = subparsers.add_parser('threshold', help='查看阈值状态')
    threshold_parser.set_defaults(func=show_thresholds)
    
    behavior_parser = subparsers.add_parser('behavior', help='查看行为模型')
    behavior_parser.set_defaults(func=show_behavior)
    
    feedback_parser = subparsers.add_parser('feedback', help='模拟反馈')
    feedback_parser.add_argument('feedback_type', 
                                 choices=['false_positive', 'false_negative', 'command_correct', 'command_incorrect'],
                                 help='反馈类型')
    feedback_parser.add_argument('--command', type=str, help='相关命令')
    feedback_parser.add_argument('--confidence', type=float, help='置信度')
    feedback_parser.add_argument('--save', action='store_true', help='保存更改')
    feedback_parser.set_defaults(func=simulate_feedback)
    
    clear_parser = subparsers.add_parser('clear', help='清除历史记录')
    clear_parser.add_argument('--yes', action='store_true', help='确认清除')
    clear_parser.set_defaults(func=clear_history)
    
    export_parser = subparsers.add_parser('export', help='导出学习数据')
    export_parser.add_argument('--output', type=str, help='输出文件路径')
    export_parser.set_defaults(func=export_data)
    
    args = parser.parse_args()
    
    if hasattr(args, 'func'):
        args.func(args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
