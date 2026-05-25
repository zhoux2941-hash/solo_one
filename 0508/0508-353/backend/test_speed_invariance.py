import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from app.dtw_comparator import DTWComparator
from app.templates import TemplateGenerator, landmarks_to_array


def generate_speed_variation(base_sequence: np.ndarray, speed_factor: float) -> np.ndarray:
    original_len = len(base_sequence)
    feature_dim = base_sequence.shape[1]

    new_len = int(original_len / speed_factor)

    from scipy.interpolate import interp1d

    original_indices = np.linspace(0, 1, original_len)
    new_indices = np.linspace(0, 1, new_len)

    result = np.zeros((new_len, feature_dim))

    for dim in range(feature_dim):
        f = interp1d(original_indices, base_sequence[:, dim], kind='cubic')
        result[:, dim] = f(new_indices)

    return result


def add_noise(sequence: np.ndarray, noise_level: float = 0.02) -> np.ndarray:
    noise = np.random.normal(0, noise_level, sequence.shape)
    return sequence + noise


def test_speed_invariance():
    print("=" * 70)
    print("测试：不同速度下手语动作的评分一致性")
    print("=" * 70)

    template_gen = TemplateGenerator()
    comparator = DTWComparator(
        use_dynamic_band=True,
        sakoe_chiba_ratio=0.5,
        min_band_width=15,
        use_time_normalization=True,
        target_frames=30
    )

    template_landmarks = template_gen.generate_synthetic_template("hello", num_frames=30)
    template_array = landmarks_to_array(template_landmarks)

    print(f"\n标准模板帧数: {len(template_array)}")
    print(f"特征维度: {template_array.shape[1]}")

    speed_factors = [0.5, 0.67, 0.8, 1.0, 1.25, 1.5, 2.0, 3.0]
    noise_levels = [0.0, 0.01, 0.02, 0.03, 0.05]

    print("\n" + "-" * 70)
    print("不同速度下的评分（无噪声）:")
    print("-" * 70)
    print(f"{'速度因子':>10} | {'输入帧数':>10} | {'分数':>10} | {'平均距离':>12} | {'时间伸缩':>10}")
    print("-" * 70)

    for speed in speed_factors:
        input_sequence = generate_speed_variation(template_array, speed)
        input_sequence = add_noise(input_sequence, 0.0)

        result = comparator.compare_with_heatmap(template_array, input_sequence)

        path_metrics = result.get('path_metrics', {})
        stretch_factor = path_metrics.get('time_stretch_factor', 1.0)

        print(f"{speed:>10.2f}x | {len(input_sequence):>10} | {result['score']:>10.2f} | {result['average_distance']:>12.4f} | {stretch_factor:>10.2f}x")

    for noise in noise_levels:
        print(f"\n" + "-" * 70)
        print(f"不同速度下的评分（噪声水平: {noise}）:")
        print("-" * 70)
        print(f"{'速度因子':>10} | {'输入帧数':>10} | {'分数':>10} | {'平均距离':>12}")
        print("-" * 70)

        scores = []
        for speed in speed_factors:
            input_sequence = generate_speed_variation(template_array, speed)
            input_sequence = add_noise(input_sequence, noise)

            result = comparator.compare_with_heatmap(template_array, input_sequence)
            scores.append(result['score'])

            print(f"{speed:>10.2f}x | {len(input_sequence):>10} | {result['score']:>10.2f} | {result['average_distance']:>12.4f}")

        avg_score = np.mean(scores)
        std_score = np.std(scores)
        min_score = np.min(scores)
        max_score = np.max(scores)

        print("-" * 70)
        print(f"{'统计':>10} | {'':>10} | {avg_score:>10.2f}±{std_score:.2f} | 范围: {min_score:.1f}-{max_score:.1f}")

    print("\n" + "=" * 70)
    print("测试：2倍速（原问题场景）")
    print("=" * 70)

    print("\n使用改进的DTW（时间归一化 + 动态带宽）:")
    comparator_improved = DTWComparator(
        use_dynamic_band=True,
        sakoe_chiba_ratio=0.5,
        min_band_width=15,
        use_time_normalization=True,
        target_frames=30
    )

    for speed in [2.0, 1.5, 0.5]:
        input_sequence = generate_speed_variation(template_array, speed)
        input_sequence = add_noise(input_sequence, 0.02)
        result = comparator_improved.compare_with_heatmap(template_array, input_sequence)
        path_metrics = result.get('path_metrics', {})

        print(f"\n  速度: {speed}x")
        print(f"  帧数: 模板={len(template_array)}, 输入={len(input_sequence)}")
        print(f"  带宽: {path_metrics.get('band_width_used', 'N/A')}")
        print(f"  归一化帧数: {path_metrics.get('normalized_frames', 'N/A')}")
        print(f"  分数: {result['score']:.2f}")
        print(f"  连续性: {path_metrics.get('continuity', 'N/A'):.4f}")
        print(f"  路径效率: {path_metrics.get('path_efficiency', 'N/A'):.4f}")

    print("\n" + "=" * 70)
    print("测试：20个词汇在2倍速下的评分")
    print("=" * 70)

    words = [
        "hello", "thank_you", "sorry", "please", "good",
        "bad", "yes", "no", "want", "dont_want",
        "i", "you", "he", "like", "help",
        "learn", "work", "eat", "drink", "goodbye"
    ]

    all_scores = []
    print(f"\n{'词汇':>15} | {'1.0x分数':>10} | {'2.0x分数':>10} | {'0.5x分数':>10}")
    print("-" * 60)

    for word in words:
        template_lm = template_gen.generate_synthetic_template(word, num_frames=30)
        template_arr = landmarks_to_array(template_lm)

        scores_word = []
        for speed in [1.0, 2.0, 0.5]:
            input_seq = generate_speed_variation(template_arr, speed)
            input_seq = add_noise(input_seq, 0.02)
            result = comparator_improved.compare_with_heatmap(template_arr, input_seq)
            scores_word.append(result['score'])

        all_scores.append(scores_word)
        print(f"{word:>15} | {scores_word[0]:>10.2f} | {scores_word[1]:>10.2f} | {scores_word[2]:>10.2f}")

    all_scores = np.array(all_scores)
    print("-" * 60)
    print(f"{'平均':>15} | {np.mean(all_scores[:,0]):>10.2f} | {np.mean(all_scores[:,1]):>10.2f} | {np.mean(all_scores[:,2]):>10.2f}")
    print(f"{'标准差':>15} | {np.std(all_scores[:,0]):>10.2f} | {np.std(all_scores[:,1]):>10.2f} | {np.std(all_scores[:,2]):>10.2f}")

    print("\n" + "=" * 70)
    print("修复验证结论:")
    print("=" * 70)
    print(f"正常速度(1.0x)平均分: {np.mean(all_scores[:,0]):.2f}")
    print(f"2倍速度平均分: {np.mean(all_scores[:,1]):.2f}")
    print(f"0.5倍速度平均分: {np.mean(all_scores[:,2]):.2f}")
    print(f"不同速度下分数差异: {np.max([np.mean(all_scores[:,0]), np.mean(all_scores[:,1]), np.mean(all_scores[:,2])]) - np.min([np.mean(all_scores[:,0]), np.mean(all_scores[:,1]), np.mean(all_scores[:,2])]):.2f} 分")

    if np.mean(all_scores[:, 1]) >= 80:
        print("\n✓ 修复成功！2倍速动作评分已恢复正常(≥80分)")
    else:
        print("\n✗ 需要进一步优化")

    return np.mean(all_scores[:, 1]) >= 80


if __name__ == "__main__":
    success = test_speed_invariance()
    sys.exit(0 if success else 1)
