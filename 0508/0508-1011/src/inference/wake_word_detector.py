import numpy as np
import time
from collections import deque
from src.utils.config_loader import Config
from src.inference.tensorrt_engine import TensorRTEngine


class WakeWordDetector:
    def __init__(self, engine_path, onnx_path=None):
        self.config = Config()
        self.base_threshold = self.config.get('model.wake_word.base_threshold', self.config.get('model.wake_word.threshold', 0.85))
        self.window_size = self.config.get('model.wake_word.window_size', 30)
        self.min_activation_count = self.config.get('model.wake_word.min_activation_count', 5)
        self.wake_word_name = self.config.get('model.wake_word.name', 'Hey Device')
        
        self.noise_adaptive_threshold = True
        self.current_threshold = self.base_threshold
        
        self.engine = TensorRTEngine(engine_path, onnx_path)
        
        self.activation_window = deque(maxlen=self.window_size)
        self.confidence_history = deque(maxlen=100)
        
        self.detection_count = 0
        self.cooldown = False
        self.cooldown_duration = 2.0
        self.last_detection_time = 0
        
        self.verification_window = deque(maxlen=3)
        self.min_verification_count = 2
        
        self.temporal_smoothing = True
        self.smoothing_alpha = 0.3
        self.smoothed_prob = 0.0
        
        self.noise_level = 0.0
        self.snr_estimate = 10.0
        
        self.total_inference_time = 0
        self.inference_count = 0
        
        self.false_positive_filter = True
        self.fp_check_window = deque(maxlen=50)
        self.min_fp_check = 10
    
    def set_torch_model(self, model):
        self.engine.set_torch_model(model)
    
    def update_noise_level(self, noise_level, snr=None):
        self.noise_level = noise_level
        if snr is not None:
            self.snr_estimate = snr
        
        if self.noise_adaptive_threshold:
            if self.snr_estimate < 5:
                self.current_threshold = min(0.95, self.base_threshold + 0.1)
            elif self.snr_estimate < 10:
                self.current_threshold = self.base_threshold + 0.05
            else:
                self.current_threshold = self.base_threshold
    
    def detect(self, features, is_speech=True, snr=None):
        if features is None:
            return False, 0.0
        
        if self.cooldown:
            if time.time() - self.last_detection_time > self.cooldown_duration:
                self.cooldown = False
                self.reset()
            else:
                return False, 0.0
        
        if not is_speech:
            self.fp_check_window.append(False)
            return False, 0.0
        
        start_time = time.time()
        features = self._prepare_features(features)
        
        output = self.engine.infer(features)
        inference_time = (time.time() - start_time) * 1000
        
        self.total_inference_time += inference_time
        self.inference_count += 1
        
        if output is None:
            return False, 0.0
        
        wake_prob = output[0][1] if output.ndim == 2 else output[1]
        
        if self.temporal_smoothing:
            self.smoothed_prob = self.smoothing_alpha * wake_prob + (1 - self.smoothing_alpha) * self.smoothed_prob
            wake_prob = self.smoothed_prob
        
        self.activation_window.append(wake_prob)
        self.confidence_history.append(wake_prob)
        self.fp_check_window.append(True)
        
        is_detected = self._check_activation(wake_prob)
        
        if is_detected:
            is_detected = self._multi_stage_verification(wake_prob)
        
        if is_detected:
            is_detected = self._false_positive_check()
        
        if is_detected:
            self.cooldown = True
            self.last_detection_time = time.time()
            self.detection_count += 1
            print(f"[WakeWord] 检测到唤醒词 '{self.wake_word_name}'，置信度: {wake_prob:.4f}, 阈值: {self.current_threshold:.2f}")
        
        return is_detected, wake_prob
    
    def _check_activation(self, current_prob):
        if current_prob < self.current_threshold:
            return False
        
        recent_probs = list(self.activation_window)[-10:]
        count_above = sum(1 for p in recent_probs if p >= self.current_threshold)
        
        if count_above >= self.min_activation_count:
            avg_prob = np.mean(recent_probs)
            if avg_prob >= self.current_threshold * 0.9:
                return True
        
        return False
    
    def _multi_stage_verification(self, current_prob):
        self.verification_window.append(current_prob)
        
        if len(self.verification_window) < self.min_verification_count:
            return False
        
        verified_count = sum(1 for p in self.verification_window if p >= self.current_threshold * 0.95)
        
        if verified_count >= self.min_verification_count:
            avg_verified = np.mean([p for p in self.verification_window if p >= self.current_threshold * 0.95])
            if avg_verified >= self.current_threshold:
                return True
        
        return False
    
    def _false_positive_check(self):
        if not self.false_positive_filter:
            return True
        
        speech_count = sum(1 for s in self.fp_check_window if s)
        if speech_count < self.min_fp_check:
            return False
        
        if len(self.confidence_history) >= 20:
            recent_conf = list(self.confidence_history)[-20:]
            mean_conf = np.mean(recent_conf)
            std_conf = np.std(recent_conf)
            
            if std_conf < 0.05 and mean_conf < 0.5:
                return False
        
        return True
    
    def _prepare_features(self, features):
        target_frames = 125
        
        if features.shape[1] > target_frames:
            features = features[:, -target_frames:]
        elif features.shape[1] < target_frames:
            padding = target_frames - features.shape[1]
            features = np.pad(features, ((0, 0), (0, padding)), mode='constant')
        
        return features.astype(np.float32).reshape(1, features.shape[0], features.shape[1])
    
    def get_average_inference_time(self):
        if self.inference_count == 0:
            return 0
        return self.total_inference_time / self.inference_count
    
    def get_current_threshold(self):
        return self.current_threshold
    
    def set_threshold(self, threshold):
        self.current_threshold = max(self.base_threshold * 0.8, min(self.base_threshold * 1.15, threshold))
    
    def reset(self):
        self.activation_window.clear()
        self.confidence_history.clear()
        self.verification_window.clear()
        self.fp_check_window.clear()
        self.detection_count = 0
        self.cooldown = False
        self.smoothed_prob = 0.0
    
    def cleanup(self):
        self.engine.cleanup()
