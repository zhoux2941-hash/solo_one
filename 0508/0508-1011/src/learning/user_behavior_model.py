import time
import numpy as np
from collections import defaultdict, deque
from datetime import datetime, timedelta
from enum import Enum


class BehaviorEventType(Enum):
    WAKE_DETECTED = "wake_detected"
    COMMAND_RECOGNIZED = "command_recognized"
    CORRECTION = "correction"
    FEEDBACK = "feedback"
    USAGE_PATTERN = "usage_pattern"


class UserBehaviorModel:
    def __init__(self, user_history):
        self.history = user_history
        
        self.command_sequence_model = defaultdict(lambda: defaultdict(int))
        self.max_sequence_length = 3
        
        self.time_pattern_model = defaultdict(lambda: {
            'hour_counts': np.zeros(24),
            'day_counts': np.zeros(7),
            'total': 0
        })
        
        self.user_accuracy_model = {
            'wake': {'expected_confidence': 0.85, 'variance': 0.1},
            'command': {'expected_confidence': 0.75, 'variance': 0.15}
        }
        
        self.adaptation_rate = 0.1
        self.forget_rate = 0.001
        
        self.recent_sequences = deque(maxlen=100)
        self.current_sequence = []
        
        self._build_from_history()
    
    def _build_from_history(self):
        interactions = self.history.get_recent_interactions(1000)
        
        command_sequence = []
        for interaction in interactions:
            if interaction.type == 'command' and interaction.command:
                command_sequence.append(interaction.command)
                if len(command_sequence) > self.max_sequence_length:
                    command_sequence = command_sequence[-self.max_sequence_length:]
                
                for i in range(1, len(command_sequence)):
                    prefix = tuple(command_sequence[:i])
                    next_cmd = command_sequence[i]
                    self.command_sequence_model[prefix][next_cmd] += 1
            
            if interaction.type == 'command' or interaction.type == 'wake':
                dt = datetime.fromtimestamp(interaction.timestamp)
                cmd_type = interaction.type
                self.time_pattern_model[cmd_type]['hour_counts'][dt.hour] += 1
                self.time_pattern_model[cmd_type]['day_counts'][dt.weekday()] += 1
                self.time_pattern_model[cmd_type]['total'] += 1
        
        print(f"[UserBehaviorModel] 从历史数据构建完成")
        print(f"  序列模式数: {len(self.command_sequence_model)}")
    
    def record_interaction(self, interaction):
        if interaction.type == 'command' and interaction.command:
            self.current_sequence.append(interaction.command)
            if len(self.current_sequence) > self.max_sequence_length:
                self.current_sequence = self.current_sequence[-self.max_sequence_length:]
            
            if len(self.current_sequence) >= 2:
                for i in range(1, len(self.current_sequence)):
                    prefix = tuple(self.current_sequence[:i])
                    next_cmd = self.current_sequence[i]
                    self.command_sequence_model[prefix][next_cmd] += 1
        
        if interaction.type in ['command', 'wake']:
            dt = datetime.fromtimestamp(interaction.timestamp)
            self.time_pattern_model[interaction.type]['hour_counts'][dt.hour] += 1
            self.time_pattern_model[interaction.type]['day_counts'][dt.weekday()] += 1
            self.time_pattern_model[interaction.type]['total'] += 1
        
        if interaction.confidence > 0:
            self._update_accuracy_model(interaction.type, interaction.confidence)
        
        self._apply_forgetting()
    
    def _update_accuracy_model(self, interaction_type, confidence):
        if interaction_type not in self.user_accuracy_model:
            return
        
        model = self.user_accuracy_model[interaction_type]
        old_expected = model['expected_confidence']
        
        new_expected = old_expected * (1 - self.adaptation_rate) + confidence * self.adaptation_rate
        new_variance = (
            model['variance'] * (1 - self.adaptation_rate) + 
            abs(confidence - old_expected) * self.adaptation_rate
        )
        
        model['expected_confidence'] = new_expected
        model['variance'] = max(0.01, min(0.5, new_variance))
    
    def _apply_forgetting(self):
        for prefix in list(self.command_sequence_model.keys()):
            for cmd in list(self.command_sequence_model[prefix].keys()):
                self.command_sequence_model[prefix][cmd] *= (1 - self.forget_rate)
                if self.command_sequence_model[prefix][cmd] < 0.1:
                    del self.command_sequence_model[prefix][cmd]
            if not self.command_sequence_model[prefix]:
                del self.command_sequence_model[prefix]
        
        for cmd_type in self.time_pattern_model:
            self.time_pattern_model[cmd_type]['hour_counts'] *= (1 - self.forget_rate)
            self.time_pattern_model[cmd_type]['day_counts'] *= (1 - self.forget_rate)
    
    def predict_next_commands(self, current_commands=None, top_k=3):
        if current_commands is None:
            current_commands = self.current_sequence
        
        predictions = {}
        
        for i in range(1, min(len(current_commands), self.max_sequence_length) + 1):
            prefix = tuple(current_commands[-i:])
            if prefix in self.command_sequence_model:
                for next_cmd, count in self.command_sequence_model[prefix].items():
                    weight = i * count
                    predictions[next_cmd] = predictions.get(next_cmd, 0) + weight
        
        if not predictions:
            common = self.history.get_common_commands(top_k)
            return {cmd: 1.0 / len(common) for cmd in common}
        
        total = sum(predictions.values())
        if total > 0:
            predictions = {k: v / total for k, v in predictions.items()}
        
        sorted_preds = sorted(predictions.items(), key=lambda x: x[1], reverse=True)
        return dict(sorted_preds[:top_k])
    
    def get_time_based_probability(self, interaction_type='command'):
        if interaction_type not in self.time_pattern_model:
            return 0.5
        
        model = self.time_pattern_model[interaction_type]
        if model['total'] == 0:
            return 0.5
        
        now = datetime.now()
        hour_prob = model['hour_counts'][now.hour] / max(model['total'] / 24, 1)
        day_prob = model['day_counts'][now.weekday()] / max(model['total'] / 7, 1)
        
        combined = (hour_prob + day_prob) / 2
        return min(1.0, combined)
    
    def get_expected_confidence_range(self, interaction_type='command'):
        if interaction_type not in self.user_accuracy_model:
            return (0.5, 0.9)
        
        model = self.user_accuracy_model[interaction_type]
        expected = model['expected_confidence']
        std = np.sqrt(model['variance'])
        
        return (max(0.0, expected - 2 * std), min(1.0, expected + 2 * std))
    
    def get_adaptive_bias(self, interaction_type='command', context=None):
        bias = 0.0
        
        time_prob = self.get_time_based_probability(interaction_type)
        if time_prob > 0.7:
            bias -= 0.03
        elif time_prob < 0.2:
            bias += 0.03
        
        if context and context.get('command'):
            predictions = self.predict_next_commands(top_k=5)
            if context['command'] in predictions:
                prob = predictions[context['command']]
                bias -= prob * 0.05
        
        return bias
    
    def get_behavior_summary(self):
        return {
            'sequence_patterns': len(self.command_sequence_model),
            'time_patterns': {
                k: {
                    'total': v['total'],
                    'peak_hour': int(np.argmax(v['hour_counts'])),
                    'peak_day': int(np.argmax(v['day_counts']))
                }
                for k, v in self.time_pattern_model.items()
            },
            'accuracy_model': self.user_accuracy_model,
            'current_sequence': self.current_sequence,
            'top_predictions': self.predict_next_commands(top_k=5)
        }
    
    def reset(self):
        self.command_sequence_model.clear()
        for v in self.time_pattern_model.values():
            v['hour_counts'] = np.zeros(24)
            v['day_counts'] = np.zeros(7)
            v['total'] = 0
        self.current_sequence.clear()
        self.recent_sequences.clear()
        self.user_accuracy_model = {
            'wake': {'expected_confidence': 0.85, 'variance': 0.1},
            'command': {'expected_confidence': 0.75, 'variance': 0.15}
        }
        print("[UserBehaviorModel] 已重置")
