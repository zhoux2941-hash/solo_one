import time
import numpy as np
from collections import deque
from datetime import datetime, timedelta


class AdaptiveThresholdManager:
    def __init__(self, user_history, config=None):
        self.history = user_history
        
        config = config or {}
        self.base_wake_threshold = config.get('base_wake_threshold', 0.85)
        self.base_command_threshold = config.get('base_command_threshold', 0.70)
        
        self.min_wake_threshold = config.get('min_wake_threshold', 0.70)
        self.max_wake_threshold = config.get('max_wake_threshold', 0.97)
        self.min_command_threshold = config.get('min_command_threshold', 0.50)
        self.max_command_threshold = config.get('max_command_threshold', 0.95)
        
        self.adjustment_step = config.get('adjustment_step', 0.02)
        self.learning_rate = config.get('learning_rate', 0.1)
        self.forget_factor = config.get('forget_factor', 0.995)
        
        self.target_wake_fpr = config.get('target_wake_fpr', 0.05)
        self.target_command_success_rate = config.get('target_command_success_rate', 0.90)
        
        self.min_samples_for_adjustment = config.get('min_samples_for_adjustment', 10)
        self.adjustment_interval = config.get('adjustment_interval', 300)
        
        self.current_wake_threshold = self.base_wake_threshold
        self.current_command_threshold = self.base_command_threshold
        
        self.command_specific_thresholds = {}
        
        self.last_adjustment_time = 0
        self.adjustment_history = []
        
        self.wake_confidence_buffer = deque(maxlen=200)
        self.command_confidence_buffer = deque(maxlen=200)
        
        print(f"[AdaptiveThreshold] 初始化完成")
        print(f"  唤醒词基准阈值: {self.base_wake_threshold}")
        print(f"  命令词基准阈值: {self.base_command_threshold}")
    
    def get_wake_threshold(self, context=None):
        threshold = self.current_wake_threshold
        
        if context:
            if context.get('snr', 20) < 5:
                threshold += 0.05
            
            hour = datetime.now().hour
            peak_hours = self.history.user_preferences.get('usage_patterns', {}).get('peak_hours', [])
            if hour in peak_hours:
                threshold -= 0.03
        
        return np.clip(threshold, self.min_wake_threshold, self.max_wake_threshold)
    
    def get_command_threshold(self, command=None, context=None):
        if command and command in self.command_specific_thresholds:
            threshold = self.command_specific_thresholds[command]
        else:
            threshold = self.current_command_threshold
        
        if context:
            if context.get('snr', 20) < 5:
                threshold += 0.03
        
        common_commands = self.history.get_common_commands(top_n=3)
        if command in common_commands:
            threshold -= 0.05
        
        return np.clip(threshold, self.min_command_threshold, self.max_command_threshold)
    
    def update_wake_confidence(self, confidence, is_correct=None):
        self.wake_confidence_buffer.append({
            'confidence': confidence,
            'is_correct': is_correct,
            'timestamp': time.time()
        })
    
    def update_command_confidence(self, command, confidence, is_correct=None):
        self.command_confidence_buffer.append({
            'command': command,
            'confidence': confidence,
            'is_correct': is_correct,
            'timestamp': time.time()
        })
    
    def should_adjust(self):
        now = time.time()
        if now - self.last_adjustment_time < self.adjustment_interval:
            return False
        
        total_samples = len(self.wake_confidence_buffer) + len(self.command_confidence_buffer)
        return total_samples >= self.min_samples_for_adjustment
    
    def adjust_thresholds(self):
        if not self.should_adjust():
            return False
        
        self.last_adjustment_time = time.time()
        
        self._adjust_wake_threshold()
        self._adjust_command_thresholds()
        self._decay_thresholds()
        
        self.adjustment_history.append({
            'timestamp': time.time(),
            'wake_threshold': self.current_wake_threshold,
            'command_threshold': self.current_command_threshold
        })
        
        if len(self.adjustment_history) > 100:
            self.adjustment_history = self.adjustment_history[-100:]
        
        return True
    
    def _adjust_wake_threshold(self):
        wake_stats = self.history.get_wake_statistics()
        total_detections = wake_stats.get('total_detections', 0)
        false_positives = wake_stats.get('false_positives', 0)
        
        if total_detections < self.min_samples_for_adjustment:
            return
        
        current_fpr = false_positives / max(total_detections, 1)
        
        fpr_diff = current_fpr - self.target_wake_fpr
        
        if fpr_diff > 0.02:
            self.current_wake_threshold = min(
                self.current_wake_threshold + self.adjustment_step,
                self.max_wake_threshold
            )
        elif fpr_diff < -0.02:
            self.current_wake_threshold = max(
                self.current_wake_threshold - self.adjustment_step,
                self.min_wake_threshold
            )
        
        recent_correct = [c for c in list(self.wake_confidence_buffer)[-50:] 
                         if c.get('is_correct') is False]
        if len(recent_correct) >= 3:
            self.current_wake_threshold = max(
                self.current_wake_threshold - 0.01,
                self.min_wake_threshold
            )
        
        print(f"[AdaptiveThreshold] 唤醒阈值调整: {self.current_wake_threshold:.3f} (FPR: {current_fpr:.3f})")
    
    def _adjust_command_thresholds(self):
        all_commands = set()
        for item in self.command_confidence_buffer:
            if item['command']:
                all_commands.add(item['command'])
        
        for command in all_commands:
            self._adjust_single_command_threshold(command)
        
        avg_success_rate = self.history.get_success_rate()
        overall_diff = avg_success_rate - self.target_command_success_rate
        
        if overall_diff < -0.05:
            self.current_command_threshold = max(
                self.current_command_threshold - self.adjustment_step,
                self.min_command_threshold
            )
        elif overall_diff > 0.05:
            self.current_command_threshold = min(
                self.current_command_threshold + self.adjustment_step * 0.5,
                self.max_command_threshold
            )
        
        print(f"[AdaptiveThreshold] 命令阈值调整: {self.current_command_threshold:.3f} (成功率: {avg_success_rate:.3f})")
    
    def _adjust_single_command_threshold(self, command):
        stats = self.history.get_command_statistics(command)
        total = stats.get('total', 0)
        
        if total < self.min_samples_for_adjustment:
            return
        
        success_rate = stats.get('success_rate', 0)
        avg_confidence = stats.get('avg_confidence', 0)
        
        current_threshold = self.command_specific_thresholds.get(
            command, self.base_command_threshold
        )
        
        if success_rate < 0.7 and avg_confidence > 0.7:
            new_threshold = current_threshold - self.adjustment_step
        elif success_rate > 0.95 and avg_confidence < 0.6:
            new_threshold = current_threshold + self.adjustment_step * 0.5
        else:
            return
        
        new_threshold = np.clip(
            new_threshold, 
            self.min_command_threshold, 
            self.max_command_threshold
        )
        
        if abs(new_threshold - current_threshold) >= self.adjustment_step * 0.5:
            self.command_specific_thresholds[command] = new_threshold
            print(f"[AdaptiveThreshold] 命令 '{command}' 阈值: {current_threshold:.3f} -> {new_threshold:.3f}")
    
    def _decay_thresholds(self):
        wake_diff = self.current_wake_threshold - self.base_wake_threshold
        self.current_wake_threshold -= wake_diff * (1 - self.forget_factor)
        
        command_diff = self.current_command_threshold - self.base_command_threshold
        self.current_command_threshold -= command_diff * (1 - self.forget_factor)
        
        for cmd in list(self.command_specific_thresholds.keys()):
            diff = self.command_specific_thresholds[cmd] - self.base_command_threshold
            self.command_specific_thresholds[cmd] -= diff * (1 - self.forget_factor)
            
            if abs(self.command_specific_thresholds[cmd] - self.base_command_threshold) < 0.005:
                del self.command_specific_thresholds[cmd]
    
    def handle_feedback(self, feedback_type, details=None):
        details = details or {}
        
        if feedback_type == 'false_positive':
            self.current_wake_threshold = min(
                self.current_wake_threshold + self.adjustment_step * 2,
                self.max_wake_threshold
            )
            print(f"[AdaptiveThreshold] 收到误报反馈，提高唤醒阈值到 {self.current_wake_threshold:.3f}")
        
        elif feedback_type == 'false_negative':
            self.current_wake_threshold = max(
                self.current_wake_threshold - self.adjustment_step * 2,
                self.min_wake_threshold
            )
            print(f"[AdaptiveThreshold] 收到漏报反馈，降低唤醒阈值到 {self.current_wake_threshold:.3f}")
        
        elif feedback_type == 'command_incorrect':
            command = details.get('command')
            if command:
                current = self.command_specific_thresholds.get(command, self.current_command_threshold)
                new_threshold = max(current - self.adjustment_step, self.min_command_threshold)
                self.command_specific_thresholds[command] = new_threshold
                print(f"[AdaptiveThreshold] 命令 '{command}' 识别错误，降低阈值到 {new_threshold:.3f}")
        
        elif feedback_type == 'command_correct':
            command = details.get('command')
            confidence = details.get('confidence', 0)
            if command and confidence > 0.9:
                current = self.command_specific_thresholds.get(command, self.current_command_threshold)
                new_threshold = min(current + self.adjustment_step * 0.5, self.max_command_threshold)
                self.command_specific_thresholds[command] = new_threshold
                print(f"[AdaptiveThreshold] 命令 '{command}' 高置信度正确，提高阈值到 {new_threshold:.3f}")
    
    def get_threshold_summary(self):
        return {
            'wake_threshold': self.current_wake_threshold,
            'base_wake_threshold': self.base_wake_threshold,
            'command_threshold': self.current_command_threshold,
            'base_command_threshold': self.base_command_threshold,
            'command_specific_thresholds': dict(self.command_specific_thresholds),
            'adjustment_count': len(self.adjustment_history),
            'wake_confidence_buffer_size': len(self.wake_confidence_buffer),
            'command_confidence_buffer_size': len(self.command_confidence_buffer)
        }
    
    def reset(self):
        self.current_wake_threshold = self.base_wake_threshold
        self.current_command_threshold = self.base_command_threshold
        self.command_specific_thresholds.clear()
        self.adjustment_history.clear()
        self.wake_confidence_buffer.clear()
        self.command_confidence_buffer.clear()
        self.last_adjustment_time = 0
        print("[AdaptiveThreshold] 阈值已重置")
