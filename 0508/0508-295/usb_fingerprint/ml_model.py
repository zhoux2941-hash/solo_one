import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from typing import List, Dict, Optional, Tuple
import logging
import hashlib

from .feature_extractor import FingerprintFeatures
from .config import (
    MODEL_PATH, SCALER_PATH,
    VM_SIMILARITY_THRESHOLD, NORMAL_SIMILARITY_THRESHOLD
)

logger = logging.getLogger(__name__)


class USBFingerprintModel:
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=150,
            max_depth=12,
            min_samples_split=7,
            min_samples_leaf=3,
            max_features='sqrt',
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )
        self.scaler = RobustScaler()
        self.device_labels = {}
        self.is_trained = False

    def _generate_device_id(self, features: FingerprintFeatures, vendor_id: int, product_id: int) -> str:
        feature_str = (
            f"{vendor_id}:{product_id}:"
            f"{features.median_response_time:.6f}:"
            f"{features.mad_response_time:.6f}:"
            f"{features.iqr_response_time:.6f}"
        )
        return hashlib.sha256(feature_str.encode()).hexdigest()[:16]

    def _get_adaptive_threshold(self, features: FingerprintFeatures) -> float:
        """根据噪声水平自适应调整阈值"""
        if features.noise_metrics.is_vm_environment or features.noise_metrics.noise_level > 1.0:
            return VM_SIMILARITY_THRESHOLD
        return NORMAL_SIMILARITY_THRESHOLD

    def train(self, features_list: List[FingerprintFeatures], device_ids: List[str]) -> Dict:
        if len(features_list) != len(device_ids):
            raise ValueError("Features and device_ids length mismatch")

        if len(features_list) < 2:
            raise ValueError("Need at least 2 samples for training")

        X = np.array([f.to_array() for f in features_list])

        unique_devices = list(set(device_ids))
        self.device_labels = {dev: i for i, dev in enumerate(unique_devices)}
        y = np.array([self.device_labels[dev] for dev in device_ids])

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        self.model.fit(X_train_scaled, y_train)

        y_pred = self.model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)

        self.is_trained = True

        report = classification_report(y_test, y_pred, output_dict=True)

        return {
            'accuracy': accuracy,
            'num_classes': len(unique_devices),
            'num_samples': len(features_list),
            'report': report
        }

    def predict(self, features: FingerprintFeatures, threshold: Optional[float] = None) -> Tuple[Optional[str], float]:
        if not self.is_trained:
            return None, 0.0

        # 使用自适应阈值
        if threshold is None:
            threshold = self._get_adaptive_threshold(features)

        X = features.to_array().reshape(1, -1)
        X_scaled = self.scaler.transform(X)

        probabilities = self.model.predict_proba(X_scaled)[0]
        max_prob_idx = np.argmax(probabilities)
        max_prob = probabilities[max_prob_idx]

        if max_prob >= threshold:
            reverse_labels = {v: k for k, v in self.device_labels.items()}
            device_id = reverse_labels.get(max_prob_idx)
            return device_id, max_prob
        else:
            return None, max_prob

    def add_device(self, features: FingerprintFeatures, device_id: str, vendor_id: int, product_id: int):
        if not self.is_trained:
            self.device_labels[device_id] = 0
            X = features.to_array().reshape(1, -1)
            self.scaler.fit(X)
            self.model.fit(self.scaler.transform(X), [0])
            self.is_trained = True
        else:
            existing_X = self._get_training_data()
            existing_y = self._get_training_labels()

            new_X = features.to_array().reshape(1, -1)
            new_label = max(self.device_labels.values()) + 1 if self.device_labels else 0
            self.device_labels[device_id] = new_label

            X_combined = np.vstack([existing_X, new_X])
            y_combined = np.append(existing_y, [new_label])

            X_scaled = self.scaler.fit_transform(X_combined)
            self.model.fit(X_scaled, y_combined)

    def _get_training_data(self) -> np.ndarray:
        if hasattr(self.model, 'estimators_') and self.model.estimators_:
            n_samples = max(sum(tree.n_samples_ for tree in self.model.estimators_) // len(self.model.estimators_), 10)
            n_features = len(self.model.feature_importances_)
            return np.random.rand(n_samples, n_features)
        return np.array([])

    def _get_training_labels(self) -> np.ndarray:
        return np.array(list(self.device_labels.values()))

    def save_model(self):
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'device_labels': self.device_labels,
            'is_trained': self.is_trained
        }
        joblib.dump(model_data, MODEL_PATH)
        logger.info(f"Model saved to {MODEL_PATH}")

    def load_model(self) -> bool:
        try:
            if MODEL_PATH.exists():
                model_data = joblib.load(MODEL_PATH)
                self.model = model_data['model']
                self.scaler = model_data['scaler']
                self.device_labels = model_data['device_labels']
                self.is_trained = model_data['is_trained']
                logger.info(f"Model loaded from {MODEL_PATH}")
                return True
        except Exception as e:
            logger.error(f"Error loading model: {e}")
        return False

    def get_feature_importance(self) -> Dict[str, float]:
        if not self.is_trained:
            return {}

        feature_names = [
            'median_response_time',
            'mad_response_time',
            'iqr_response_time',
            'percentile_10',
            'percentile_25',
            'percentile_75',
            'percentile_90',
            'skew_robust',
            'kurtosis_robust',
            'median_cv',
            'autocorr_lag1_smoothed',
            'clock_drift_robust'
        ]

        importance = self.model.feature_importances_
        return dict(zip(feature_names, importance.tolist()))
