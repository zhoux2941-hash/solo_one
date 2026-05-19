#!/usr/bin/env python3
"""测试虚拟机环境下的指纹稳定性改进"""

import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from usb_fingerprint.feature_extractor import (
    FeatureExtractor, RobustPreprocessor, MultiSessionFuser, FingerprintFeatures
)
from usb_fingerprint.usb_capture import USBTimingSample


def generate_simulated_samples(base_mean: float, noise_level: float = 1.0,
                               num_samples: int = 100, add_outliers: bool = True) -> list:
    """生成模拟的USB采样数据，模拟虚拟机环境噪声"""
    np.random.seed(42)

    # 基础信号 - 模拟真实USB响应时间
    base_times = np.random.normal(loc=base_mean, scale=base_mean * 0.1, size=num_samples)

    # 添加虚拟机噪声
    # 1. 高频噪声（调度抖动）
    high_freq_noise = np.random.normal(loc=0, scale=noise_level * 0.5, size=num_samples)

    # 2. 脉冲噪声（突发延迟）
    impulse_noise = np.zeros(num_samples)
    impulse_positions = np.random.choice(num_samples, size=int(num_samples * 0.1), replace=False)
    impulse_noise[impulse_positions] = np.random.normal(loc=noise_level * 5, scale=noise_level, size=len(impulse_positions))

    # 3. 低频漂移（时钟漂移）
    drift = np.linspace(0, noise_level * 2, num_samples)

    response_times = base_times + high_freq_noise + impulse_noise + drift

    # 生成时间戳（模拟不规则的采样间隔）
    base_interval = 0.01
    intervals = np.random.normal(loc=base_interval, scale=base_interval * 0.3, size=num_samples)
    timestamps = np.cumsum(intervals)

    samples = [
        USBTimingSample(
            timestamp=timestamps[i],
            setup_response_time=response_times[i],
            endpoint=0,
            transfer_type='control'
        )
        for i in range(num_samples)
    ]

    return samples


def test_noise_reduction():
    """测试噪声过滤效果"""
    print("=" * 60)
    print("测试1: 噪声过滤效果")
    print("=" * 60)

    # 生成带噪声的样本
    samples = generate_simulated_samples(base_mean=10.0, noise_level=2.0, num_samples=100)
    response_times = np.array([s.setup_response_time for s in samples])

    # 原始数据统计
    print(f"\n原始数据:")
    print(f"  均值: {np.mean(response_times):.4f}")
    print(f"  标准差: {np.std(response_times):.4f}")
    print(f"  中位数: {np.median(response_times):.4f}")
    print(f"  范围: [{np.min(response_times):.4f}, {np.max(response_times):.4f}]")

    # 测试异常值移除
    preprocessor = RobustPreprocessor()
    cleaned_zscore, outlier_zscore = preprocessor.remove_outliers_zscore(response_times)
    print(f"\nZ-score异常值移除:")
    print(f"  移除比例: {outlier_zscore:.2%}")
    print(f"  清理后标准差: {np.std(cleaned_zscore):.4f}")

    cleaned_iqr, outlier_iqr = preprocessor.remove_outliers_iqr(response_times)
    print(f"\nIQR异常值移除:")
    print(f"  移除比例: {outlier_iqr:.2%}")
    print(f"  清理后标准差: {np.std(cleaned_iqr):.4f}")

    # 测试平滑效果
    smoothed_ma = preprocessor.smooth_moving_average(cleaned_zscore, window_size=5)
    smoothed_median = preprocessor.smooth_median_filter(cleaned_zscore, window_size=3)
    print(f"\n平滑效果:")
    print(f"  移动平均后标准差: {np.std(smoothed_ma):.4f}")
    print(f"  中值滤波后标准差: {np.std(smoothed_median):.4f}")

    # 噪声估计
    noise_level, snr = preprocessor.estimate_noise_level(response_times)
    print(f"\n噪声估计:")
    print(f"  噪声水平: {noise_level:.4f}")
    print(f"  信噪比: {snr:.4f}")


def test_vm_detection():
    """测试虚拟机环境检测"""
    print("\n" + "=" * 60)
    print("测试2: 虚拟机环境检测")
    print("=" * 60)

    # 正常环境样本（低噪声）
    normal_samples = generate_simulated_samples(base_mean=10.0, noise_level=0.3, num_samples=100)
    normal_response = np.array([s.setup_response_time for s in normal_samples])
    normal_timestamps = np.array([s.timestamp for s in normal_samples])

    # 虚拟机环境样本（高噪声）
    vm_samples = generate_simulated_samples(base_mean=10.0, noise_level=2.5, num_samples=100)
    vm_response = np.array([s.setup_response_time for s in vm_samples])
    vm_timestamps = np.array([s.timestamp for s in vm_samples])

    preprocessor = RobustPreprocessor()

    is_normal_vm = preprocessor.detect_vm_environment(normal_response, normal_timestamps)
    is_vm_env = preprocessor.detect_vm_environment(vm_response, vm_timestamps)

    print(f"\n正常环境检测: {'虚拟机' if is_normal_vm else '物理机'}")
    print(f"虚拟机环境检测: {'虚拟机' if is_vm_env else '物理机'}")

    normal_noise, normal_snr = preprocessor.estimate_noise_level(normal_response)
    vm_noise, vm_snr = preprocessor.estimate_noise_level(vm_response)
    print(f"\n正常环境 - 噪声: {normal_noise:.4f}, SNR: {normal_snr:.4f}")
    print(f"虚拟机环境 - 噪声: {vm_noise:.4f}, SNR: {vm_snr:.4f}")


def test_feature_stability():
    """测试特征稳定性 - 同一设备多次采集的特征相似度"""
    print("\n" + "=" * 60)
    print("测试3: 特征稳定性（同一设备多次采集）")
    print("=" * 60)

    extractor = FeatureExtractor(enable_noise_reduction=True)

    # 生成同一设备的3次采集（带虚拟机噪声）
    base_mean = 10.0
    sessions = []
    for i in range(3):
        samples = generate_simulated_samples(
            base_mean=base_mean + np.random.normal(0, 0.5),
            noise_level=2.0,
            num_samples=100
        )
        features = extractor.extract_features(samples)
        sessions.append(features)
        print(f"\n会话 {i+1}:")
        print(f"  中位数响应时间: {features.median_response_time:.4f}")
        print(f"  MAD: {features.mad_response_time:.4f}")
        print(f"  噪声水平: {features.noise_metrics.noise_level:.4f}")
        print(f"  虚拟机环境: {'是' if features.noise_metrics.is_vm_environment else '否'}")

    # 计算两两相似度
    print("\n特征相似度（自适应）:")
    for i in range(len(sessions)):
        for j in range(i + 1, len(sessions)):
            sim = extractor.compute_adaptive_similarity(sessions[i], sessions[j])
            print(f"  会话 {i+1} vs {j+1}: {sim:.4f}")

    # 测试多会话融合
    print("\n多会话融合:")
    fuser = MultiSessionFuser()
    for features in sessions:
        fuser.add_session(features)

    fused = fuser.fuse_features()
    print(f"  融合后中位数响应时间: {fused.median_response_time:.4f}")
    print(f"  融合后MAD: {fused.mad_response_time:.4f}")
    print(f"  融合后噪声水平: {fused.noise_metrics.noise_level:.4f}")

    # 计算融合特征与各会话的相似度
    print("\n融合特征与会话特征相似度:")
    for i, session in enumerate(sessions):
        sim = extractor.compute_adaptive_similarity(fused, session)
        print(f"  会话 {i+1}: {sim:.4f}")


def test_different_devices_separation():
    """测试不同设备的特征分离度"""
    print("\n" + "=" * 60)
    print("测试4: 不同设备的特征分离度")
    print("=" * 60)

    extractor = FeatureExtractor(enable_noise_reduction=True)

    # 生成3个不同设备的样本
    device_means = [8.0, 12.0, 15.0]
    device_features = []

    for i, mean in enumerate(device_means):
        samples = generate_simulated_samples(
            base_mean=mean,
            noise_level=1.5,
            num_samples=100
        )
        features = extractor.extract_features(samples)
        device_features.append(features)
        print(f"\n设备 {i+1} (基准均值={mean}ms):")
        print(f"  提取中位数: {features.median_response_time:.4f}")
        print(f"  MAD: {features.mad_response_time:.4f}")
        print(f"  IQR: {features.iqr_response_time:.4f}")

    # 计算不同设备之间的相似度
    print("\n不同设备之间相似度:")
    for i in range(len(device_features)):
        for j in range(i + 1, len(device_features)):
            sim = extractor.compute_adaptive_similarity(device_features[i], device_features[j])
            print(f"  设备 {i+1} vs {j+1}: {sim:.4f}")

    # 对比同一设备不同会话与不同设备的相似度差异
    print("\n同一设备vs不同设备相似度对比:")
    same_device_samples = []
    for _ in range(2):
        samples = generate_simulated_samples(base_mean=device_means[0], noise_level=1.5, num_samples=100)
        same_device_samples.append(extractor.extract_features(samples))

    same_device_sim = extractor.compute_adaptive_similarity(same_device_samples[0], same_device_samples[1])
    different_device_sim = extractor.compute_adaptive_similarity(device_features[0], device_features[1])

    print(f"  同一设备相似度: {same_device_sim:.4f}")
    print(f"  不同设备相似度: {different_device_sim:.4f}")
    print(f"  分离度: {same_device_sim - different_device_sim:.4f}")


def main():
    print("\n" + "*" * 60)
    print("* USB设备指纹虚拟机环境稳定性改进测试")
    print("*" * 60)

    try:
        test_noise_reduction()
        test_vm_detection()
        test_feature_stability()
        test_different_devices_separation()

        print("\n" + "*" * 60)
        print("* 所有测试完成!")
        print("*" * 60)
        print("\n改进总结:")
        print("  1. 异常值过滤 - 使用Z-score和IQR方法移除噪声点")
        print("  2. 数据平滑 - 移动平均+中值滤波组合")
        print("  3. 鲁棒特征 - 使用中位数/MAD/IQR替代均值/标准差")
        print("  4. 自适应阈值 - 虚拟机环境降低阈值要求")
        print("  5. 多会话融合 - 多次采集取中位数获得稳定指纹")

    except Exception as e:
        print(f"\n测试出错: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
