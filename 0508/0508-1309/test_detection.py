import sys
import os
import numpy as np

from eeg_simulator import EEGSimulator
from eeg_analysis import EEGAnalyzer

def test_spike_detection_improvement():
    simulator = EEGSimulator(sampling_rate=256, duration=10, channels=8)
    analyzer = EEGAnalyzer(sampling_rate=256)

    print("=" * 60)
    print("棘波检测算法改进验证测试")
    print("=" * 60)

    test_modes = [
        ('normal', '正常脑电'),
        ('interictal', '癫痫发作间期'),
        ('ictal', '癫痫发作期')
    ]

    thresholds = [0.7, 0.8, 0.85, 0.9]

    for mode, mode_name in test_modes:
        print(f"\n{'─' * 60}")
        print(f"测试模式: {mode_name}")
        print(f"{'─' * 60}")

        eeg_data = simulator.generate_eeg(mode)

        for threshold in thresholds:
            total_detections = 0
            for ch in range(8):
                detections = analyzer.detect_spikes(eeg_data, channel_idx=ch, threshold=threshold)
                total_detections += len(detections)

            avg_detections = total_detections / 8
            print(f"  阈值 {threshold:.2f}: 平均每导联检测 {avg_detections:.1f} 个波形")

    print(f"\n{'=' * 60}")
    print("检测结果信息增强验证")
    print(f"{'=' * 60}")

    eeg_data = simulator.generate_eeg('interictal')
    detections = analyzer.detect_spikes(eeg_data, channel_idx=0, threshold=0.85)

    print(f"\n在癫痫间期模式下，导联0检测到 {len(detections)} 个波形:")
    for i, det in enumerate(detections[:5]):
        print(f"  #{i+1}: 时间={det['time']:.2f}s, 相关度={det['correlation']:.3f}, "
              f"幅值={det.get('amplitude', 'N/A'):.1f}μV, "
              f"类型={det.get('morphology_type', 'N/A')}, "
              f"时长={det.get('duration_ms', 'N/A'):.0f}ms")

    print(f"\n{'=' * 60}")
    print("多级验证机制说明")
    print(f"{'=' * 60}")
    print("""
    1. 带通滤波 (1-70Hz) - 去除直流漂移和高频噪声
    2. 候选峰值检测 - 仅考虑超过2.5倍标准差的峰值
    3. 模板匹配 (阈值默认0.85) - 提高相关系数要求
    4. 形态学验证:
       - 峰值位置约束 (20%-80%窗口内)
       - 幅值显著性 (>2倍局部标准差)
       - 上升沿斜率检查
       - 持续时间约束 (棘波<70ms, 尖波70-200ms)
    5. 幅值阈值过滤 (>2.5倍全局标准差)
    6. 局部显著性验证 (>2倍局部标准差)
    7. 非极大值抑制 (100ms内取最优)
    """)

    return True

if __name__ == '__main__':
    try:
        test_spike_detection_improvement()
        print("\n✓ 测试完成！")
    except Exception as e:
        print(f"\n✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
