import numpy as np
from scipy import stats
from scipy.ndimage import median_filter
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field
import logging

from .usb_capture import USBTimingSample

logger = logging.getLogger(__name__)


@dataclass
class NoiseMetrics:
    """噪声评估指标"""
    noise_level: float = 0.0
    snr: float = 0.0
    outlier_ratio: float = 0.0
    is_vm_environment: bool = False


@dataclass
class FingerprintFeatures:
    # 鲁棒统计特征（抗噪声）
    median_response_time: float = 0.0
    mad_response_time: float = 0.0  # 中位数绝对偏差
    iqr_response_time: float = 0.0
    percentile_10: float = 0.0
    percentile_25: float = 0.0
    percentile_50: float = 0.0
    percentile_75: float = 0.0
    percentile_90: float = 0.0

    # 分布形状特征（相对稳定）
    skew_robust: float = 0.0
    kurtosis_robust: float = 0.0
    median_cv: float = 0.0  # 基于中位数的变异系数

    # 时序特征（平滑后）
    autocorr_lag1_smoothed: float = 0.0
    clock_drift_robust: float = 0.0

    # 噪声相关特征
    noise_metrics: NoiseMetrics = field(default_factory=NoiseMetrics)

    # 保留原始特征用于兼容性
    mean_response_time: float = 0.0
    std_response_time: float = 0.0

    def to_array(self) -> np.ndarray:
        """转换为特征向量（优先使用鲁棒特征）"""
        return np.array([
            self.median_response_time,
            self.mad_response_time,
            self.iqr_response_time,
            self.percentile_10,
            self.percentile_25,
            self.percentile_75,
            self.percentile_90,
            self.skew_robust,
            self.kurtosis_robust,
            self.median_cv,
            self.autocorr_lag1_smoothed,
            self.clock_drift_robust
        ])

    def to_dict(self) -> Dict:
        return {
            'median_response_time': self.median_response_time,
            'mad_response_time': self.mad_response_time,
            'iqr_response_time': self.iqr_response_time,
            'percentile_10': self.percentile_10,
            'percentile_25': self.percentile_25,
            'percentile_50': self.percentile_50,
            'percentile_75': self.percentile_75,
            'percentile_90': self.percentile_90,
            'skew_robust': self.skew_robust,
            'kurtosis_robust': self.kurtosis_robust,
            'median_cv': self.median_cv,
            'autocorr_lag1_smoothed': self.autocorr_lag1_smoothed,
            'clock_drift_robust': self.clock_drift_robust,
            'noise_level': self.noise_metrics.noise_level,
            'snr': self.noise_metrics.snr,
            'is_vm_environment': self.noise_metrics.is_vm_environment,
            # 兼容旧版
            'mean_response_time': self.mean_response_time,
            'std_response_time': self.std_response_time
        }


class RobustPreprocessor:
    """鲁棒数据预处理 - 专门针对虚拟机环境噪声"""

    @staticmethod
    def remove_outliers_iqr(data: np.ndarray, k: float = 1.5) -> Tuple[np.ndarray, float]:
        """使用IQR方法移除异常值"""
        q25, q75 = np.percentile(data, [25, 75])
        iqr = q75 - q25
        lower_bound = q25 - k * iqr
        upper_bound = q75 + k * iqr

        mask = (data >= lower_bound) & (data <= upper_bound)
        cleaned_data = data[mask]
        outlier_ratio = 1 - len(cleaned_data) / len(data)

        return cleaned_data, outlier_ratio

    @staticmethod
    def remove_outliers_zscore(data: np.ndarray, threshold: float = 3.0) -> Tuple[np.ndarray, float]:
        """使用Z-score方法移除异常值"""
        median = np.median(data)
        mad = np.median(np.abs(data - median))
        if mad == 0:
            mad = np.std(data) * 0.6745

        modified_z_scores = 0.6745 * (data - median) / mad if mad != 0 else np.zeros_like(data)
        mask = np.abs(modified_z_scores) < threshold
        cleaned_data = data[mask]
        outlier_ratio = 1 - len(cleaned_data) / len(data)

        return cleaned_data, outlier_ratio

    @staticmethod
    def smooth_moving_average(data: np.ndarray, window_size: int = 5) -> np.ndarray:
        """移动平均平滑"""
        if len(data) < window_size:
            return data

        kernel = np.ones(window_size) / window_size
        smoothed = np.convolve(data, kernel, mode='same')
        return smoothed

    @staticmethod
    def smooth_median_filter(data: np.ndarray, window_size: int = 3) -> np.ndarray:
        """中值滤波平滑 - 对脉冲噪声特别有效"""
        if len(data) < window_size:
            return data

        smoothed = median_filter(data, size=window_size)
        return smoothed

    @staticmethod
    def estimate_noise_level(data: np.ndarray) -> Tuple[float, float]:
        """估计噪声水平和信噪比"""
        if len(data) < 10:
            return 0.0, float('inf')

        # 使用差分估计噪声
        differences = np.diff(data)
        noise_level = np.median(np.abs(differences)) / 0.6745

        # 信号强度（使用MAD）
        signal_strength = np.median(np.abs(data - np.median(data)))

        snr = signal_strength / noise_level if noise_level > 0 else float('inf')

        return noise_level, snr

    @staticmethod
    def detect_vm_environment(data: np.ndarray, timestamps: np.ndarray) -> bool:
        """检测是否为虚拟机环境（基于噪声特征）"""
        noise_level, snr = RobustPreprocessor.estimate_noise_level(data)

        # 虚拟机环境通常有更高的噪声水平和不规则的时间间隔
        time_intervals = np.diff(timestamps)
        interval_std = np.std(time_intervals)
        interval_mean = np.mean(time_intervals)

        interval_cv = interval_std / interval_mean if interval_mean > 0 else float('inf')

        # 虚拟机环境判断标准
        # 1. 高噪声水平
        # 2. 低信噪比
        # 3. 时间间隔变异系数大
        is_vm = (
            noise_level > 1.0 or  # 噪声阈值
            snr < 5.0 or          # 信噪比阈值
            interval_cv > 0.5      # 时间间隔变异系数
        )

        return is_vm


class FeatureExtractor:
    def __init__(self, enable_noise_reduction: bool = True):
        self.enable_noise_reduction = enable_noise_reduction
        self.preprocessor = RobustPreprocessor()

    def preprocess_data(self, response_times: np.ndarray, timestamps: np.ndarray) -> Tuple[np.ndarray, np.ndarray, NoiseMetrics]:
        """数据预处理管道"""
        if not self.enable_noise_reduction:
            noise_level, snr = self.preprocessor.estimate_noise_level(response_times)
            is_vm = self.preprocessor.detect_vm_environment(response_times, timestamps)
            return response_times, timestamps, NoiseMetrics(
                noise_level=noise_level,
                snr=snr,
                outlier_ratio=0.0,
                is_vm_environment=is_vm
            )

        # 1. 移除异常值（组合方法）
        cleaned_data, outlier_ratio_z = self.preprocessor.remove_outliers_zscore(response_times, threshold=3.0)

        if len(cleaned_data) < len(response_times) * 0.5:
            cleaned_data, outlier_ratio_iqr = self.preprocessor.remove_outliers_iqr(response_times, k=1.5)
            outlier_ratio = outlier_ratio_iqr
        else:
            outlier_ratio = outlier_ratio_z

        # 2. 平滑处理（虚拟机环境使用更强的平滑）
        is_vm = self.preprocessor.detect_vm_environment(cleaned_data, timestamps)

        if is_vm:
            smoothed_data = self.preprocessor.smooth_median_filter(cleaned_data, window_size=5)
            smoothed_data = self.preprocessor.smooth_moving_average(smoothed_data, window_size=7)
        else:
            smoothed_data = self.preprocessor.smooth_median_filter(cleaned_data, window_size=3)
            smoothed_data = self.preprocessor.smooth_moving_average(smoothed_data, window_size=5)

        # 3. 估计噪声指标
        noise_level, snr = self.preprocessor.estimate_noise_level(smoothed_data)

        noise_metrics = NoiseMetrics(
            noise_level=noise_level,
            snr=snr,
            outlier_ratio=outlier_ratio,
            is_vm_environment=is_vm
        )

        return smoothed_data, timestamps, noise_metrics

    def extract_robust_statistics(self, data: np.ndarray) -> Dict[str, float]:
        """提取鲁棒统计特征"""
        # 分位数
        p10, p25, p50, p75, p90 = np.percentile(data, [10, 25, 50, 75, 90])

        # 中位数绝对偏差（MAD）
        mad = np.median(np.abs(data - p50))
        # 标准化MAD（相当于标准差的鲁棒估计）
        mad_normalized = mad / 0.6745

        # IQR
        iqr = p75 - p25

        # 基于中位数的变异系数
        median_cv = mad_normalized / p50 if p50 != 0 else 0

        # 鲁棒偏度和峰度（基于分位数）
        q25, q50, q75 = p25, p50, p75
        skew_robust = (q75 + q25 - 2 * q50) / (q75 - q25) if (q75 - q25) != 0 else 0

        # 鲁棒峰度
        decile_range = p90 - p10
        kurtosis_robust = iqr / decile_range if decile_range != 0 else 0

        return {
            'median': p50,
            'mad': mad_normalized,
            'iqr': iqr,
            'p10': p10,
            'p25': p25,
            'p50': p50,
            'p75': p75,
            'p90': p90,
            'skew_robust': skew_robust,
            'kurtosis_robust': kurtosis_robust,
            'median_cv': median_cv
        }

    def extract_robust_temporal_features(self, data: np.ndarray, timestamps: np.ndarray) -> Dict[str, float]:
        """提取鲁棒时序特征"""
        features = {}

        # 平滑后的自相关
        if len(data) > 5:
            autocorr = np.corrcoef(data[:-1], data[1:])[0, 1]
            features['autocorr_lag1_smoothed'] = autocorr if not np.isnan(autocorr) else 0.0
        else:
            features['autocorr_lag1_smoothed'] = 0.0

        # 鲁棒时钟漂移估计
        if len(timestamps) >= 3:
            time_intervals = np.diff(timestamps)
            median_interval = np.median(time_intervals)
            mad_interval = np.median(np.abs(time_intervals - median_interval))
            mad_interval_normalized = mad_interval / 0.6745

            drift_robust = (mad_interval_normalized / median_interval) * 1e6 if median_interval != 0 else 0.0
            features['clock_drift_robust'] = drift_robust
        else:
            features['clock_drift_robust'] = 0.0

        return features

    def extract_features(self, samples: List[USBTimingSample]) -> FingerprintFeatures:
        """提取鲁棒指纹特征 - 主入口"""
        if len(samples) < 10:
            raise ValueError("Need at least 10 samples for robust feature extraction")

        response_times = np.array([s.setup_response_time for s in samples])
        timestamps = np.array([s.timestamp for s in samples])

        # 预处理
        cleaned_data, cleaned_timestamps, noise_metrics = self.preprocess_data(
            response_times, timestamps
        )

        if len(cleaned_data) < 5:
            raise ValueError("Too many outliers, please re-collect samples")

        # 提取鲁棒统计特征
        stats_features = self.extract_robust_statistics(cleaned_data)

        # 提取时序特征
        temporal_features = self.extract_robust_temporal_features(cleaned_data, cleaned_timestamps)

        # 构建特征对象
        features = FingerprintFeatures(
            median_response_time=stats_features['median'],
            mad_response_time=stats_features['mad'],
            iqr_response_time=stats_features['iqr'],
            percentile_10=stats_features['p10'],
            percentile_25=stats_features['p25'],
            percentile_50=stats_features['p50'],
            percentile_75=stats_features['p75'],
            percentile_90=stats_features['p90'],
            skew_robust=stats_features['skew_robust'],
            kurtosis_robust=stats_features['kurtosis_robust'],
            median_cv=stats_features['median_cv'],
            autocorr_lag1_smoothed=temporal_features['autocorr_lag1_smoothed'],
            clock_drift_robust=temporal_features['clock_drift_robust'],
            noise_metrics=noise_metrics,
            # 兼容旧版特征
            mean_response_time=float(np.mean(cleaned_data)),
            std_response_time=float(np.std(cleaned_data))
        )

        return features

    def compute_adaptive_similarity(self, features1: FingerprintFeatures, features2: FingerprintFeatures) -> float:
        """计算自适应相似度 - 根据噪声水平动态调整权重"""
        # 检测是否为高噪声环境
        is_high_noise = (
            features1.noise_metrics.is_vm_environment or
            features2.noise_metrics.is_vm_environment or
            features1.noise_metrics.noise_level > 1.0 or
            features2.noise_metrics.noise_level > 1.0
        )

        # 高噪声环境下的权重配置
        if is_high_noise:
            weights = {
                'median_response_time': 0.25,
                'mad_response_time': 0.15,
                'iqr_response_time': 0.15,
                'percentile_25': 0.10,
                'percentile_75': 0.10,
                'median_cv': 0.10,
                'clock_drift_robust': 0.15
            }
        else:
            weights = {
                'median_response_time': 0.20,
                'mad_response_time': 0.10,
                'iqr_response_time': 0.10,
                'percentile_10': 0.08,
                'percentile_25': 0.08,
                'percentile_75': 0.08,
                'percentile_90': 0.08,
                'skew_robust': 0.08,
                'median_cv': 0.10,
                'autocorr_lag1_smoothed': 0.05,
                'clock_drift_robust': 0.05
            }

        vec1 = features1.to_dict()
        vec2 = features2.to_dict()

        similarity = 0.0
        total_weight = 0.0

        for key, weight in weights.items():
            if key in vec1 and key in vec2:
                v1 = vec1[key]
                v2 = vec2[key]

                max_val = max(abs(v1), abs(v2), 1e-10)
                diff_abs = abs(v1 - v2) / max_val

                # 高噪声环境使用更宽松的差异容忍
                if is_high_noise:
                    feature_sim = max(0, 1 - diff_abs * 0.5)
                else:
                    feature_sim = max(0, 1 - diff_abs)

                similarity += feature_sim * weight
                total_weight += weight

        return similarity / total_weight if total_weight > 0 else 0.0

    def compute_similarity(self, features1: FingerprintFeatures, features2: FingerprintFeatures,
                           weights: Dict[str, float] = None) -> float:
        """兼容性方法 - 内部调用自适应相似度"""
        return self.compute_adaptive_similarity(features1, features2)


class MultiSessionFuser:
    """多会话特征融合 - 多次采集取稳定特征"""

    def __init__(self):
        self.session_features: List[FingerprintFeatures] = []

    def add_session(self, features: FingerprintFeatures):
        """添加一次采集会话的特征"""
        self.session_features.append(features)

    def fuse_features(self) -> FingerprintFeatures:
        """融合多次会话的特征，取中位数以获得最稳定的特征"""
        if not self.session_features:
            raise ValueError("No session features to fuse")

        feature_dicts = [f.to_dict() for f in self.session_features]

        # 对每个特征取中位数
        keys = [k for k in feature_dicts[0].keys() if k != 'is_vm_environment']
        fused_values = {}

        for key in keys:
            values = [d[key] for d in feature_dicts if key in d]
            fused_values[key] = np.median(values)

        # 噪声指标取平均
        is_vm = any(f.noise_metrics.is_vm_environment for f in self.session_features)

        fused = FingerprintFeatures(
            median_response_time=fused_values.get('median_response_time', 0.0),
            mad_response_time=fused_values.get('mad_response_time', 0.0),
            iqr_response_time=fused_values.get('iqr_response_time', 0.0),
            percentile_10=fused_values.get('percentile_10', 0.0),
            percentile_25=fused_values.get('percentile_25', 0.0),
            percentile_50=fused_values.get('percentile_50', 0.0),
            percentile_75=fused_values.get('percentile_75', 0.0),
            percentile_90=fused_values.get('percentile_90', 0.0),
            skew_robust=fused_values.get('skew_robust', 0.0),
            kurtosis_robust=fused_values.get('kurtosis_robust', 0.0),
            median_cv=fused_values.get('median_cv', 0.0),
            autocorr_lag1_smoothed=fused_values.get('autocorr_lag1_smoothed', 0.0),
            clock_drift_robust=fused_values.get('clock_drift_robust', 0.0),
            noise_metrics=NoiseMetrics(
                noise_level=np.mean([f.noise_metrics.noise_level for f in self.session_features]),
                snr=np.mean([f.noise_metrics.snr for f in self.session_features]),
                outlier_ratio=np.mean([f.noise_metrics.outlier_ratio for f in self.session_features]),
                is_vm_environment=is_vm
            ),
            mean_response_time=fused_values.get('mean_response_time', 0.0),
            std_response_time=fused_values.get('std_response_time', 0.0)
        )

        return fused
