import os
import json
import time
import numpy as np
from collections import deque, defaultdict
from datetime import datetime, timedelta


class UserInteraction:
    def __init__(self, timestamp, interaction_type, command=None, confidence=0.0, 
                 is_correct=None, feedback=None, context=None):
        self.timestamp = timestamp
        self.type = interaction_type  # 'wake', 'command', 'correction'
        self.command = command
        self.confidence = confidence
        self.is_correct = is_correct
        self.feedback = feedback
        self.context = context or {}
    
    def to_dict(self):
        return {
            'timestamp': self.timestamp,
            'type': self.type,
            'command': self.command,
            'confidence': self.confidence,
            'is_correct': self.is_correct,
            'feedback': self.feedback,
            'context': self.context
        }
    
    @classmethod
    def from_dict(cls, data):
        return cls(
            timestamp=data.get('timestamp', time.time()),
            interaction_type=data.get('type', 'unknown'),
            command=data.get('command'),
            confidence=data.get('confidence', 0.0),
            is_correct=data.get('is_correct'),
            feedback=data.get('feedback'),
            context=data.get('context', {})
        )


class UserHistory:
    def __init__(self, storage_path='data/user_history.json', max_history=10000):
        self.storage_path = storage_path
        self.max_history = max_history
        
        self.interactions = deque(maxlen=max_history)
        self.command_stats = defaultdict(lambda: {
            'total': 0,
            'correct': 0,
            'confidences': [],
            'avg_confidence': 0.0,
            'success_rate': 0.0
        })
        
        self.wake_stats = {
            'total_detections': 0,
            'correct_detections': 0,
            'false_positives': 0,
            'false_negatives': 0,
            'confidences': []
        }
        
        self.user_preferences = {
            'common_commands': [],
            'usage_patterns': {},
            'preferred_threshold': None
        }
        
        self._load()
    
    def _load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                for item in data.get('interactions', []):
                    self.interactions.append(UserInteraction.from_dict(item))
                
                self.command_stats = defaultdict(lambda: {
                    'total': 0, 'correct': 0, 'confidences': [],
                    'avg_confidence': 0.0, 'success_rate': 0.0
                })
                for cmd, stats in data.get('command_stats', {}).items():
                    self.command_stats[cmd] = stats
                
                self.wake_stats = data.get('wake_stats', self.wake_stats)
                self.user_preferences = data.get('user_preferences', self.user_preferences)
                
                print(f"[UserHistory] 加载了 {len(self.interactions)} 条历史记录")
            except Exception as e:
                print(f"[UserHistory] 加载历史失败: {e}")
    
    def save(self):
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        
        data = {
            'interactions': [i.to_dict() for i in self.interactions],
            'command_stats': dict(self.command_stats),
            'wake_stats': self.wake_stats,
            'user_preferences': self.user_preferences,
            'last_updated': time.time()
        }
        
        with open(self.storage_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def add_interaction(self, interaction):
        self.interactions.append(interaction)
        
        if interaction.type == 'command' and interaction.command:
            stats = self.command_stats[interaction.command]
            stats['total'] += 1
            stats['confidences'].append(interaction.confidence)
            if len(stats['confidences']) > 100:
                stats['confidences'] = stats['confidences'][-100:]
            stats['avg_confidence'] = np.mean(stats['confidences'])
            if interaction.is_correct is not None:
                if interaction.is_correct:
                    stats['correct'] += 1
            stats['success_rate'] = stats['correct'] / max(stats['total'], 1)
        
        elif interaction.type == 'wake':
            self.wake_stats['total_detections'] += 1
            self.wake_stats['confidences'].append(interaction.confidence)
            if len(self.wake_stats['confidences']) > 100:
                self.wake_stats['confidences'] = self.wake_stats['confidences'][-100:]
            if interaction.is_correct is not None:
                if interaction.is_correct:
                    self.wake_stats['correct_detections'] += 1
                else:
                    self.wake_stats['false_positives'] += 1
        
        elif interaction.type == 'correction':
            if interaction.feedback == 'wake_missed':
                self.wake_stats['false_negatives'] += 1
        
        self._update_preferences()
    
    def record_wake_detection(self, confidence, is_correct=None, context=None):
        interaction = UserInteraction(
            timestamp=time.time(),
            interaction_type='wake',
            confidence=confidence,
            is_correct=is_correct,
            context=context
        )
        self.add_interaction(interaction)
        return interaction
    
    def record_command(self, command, confidence, is_correct=None, context=None):
        interaction = UserInteraction(
            timestamp=time.time(),
            interaction_type='command',
            command=command,
            confidence=confidence,
            is_correct=is_correct,
            context=context
        )
        self.add_interaction(interaction)
        return interaction
    
    def record_feedback(self, feedback_type, details=None):
        interaction = UserInteraction(
            timestamp=time.time(),
            interaction_type='correction',
            feedback=feedback_type,
            context=details or {}
        )
        self.add_interaction(interaction)
        return interaction
    
    def _update_preferences(self):
        command_counts = defaultdict(int)
        hour_counts = defaultdict(int)
        
        for interaction in self.interactions:
            if interaction.type == 'command' and interaction.command:
                command_counts[interaction.command] += 1
            
            hour = datetime.fromtimestamp(interaction.timestamp).hour
            hour_counts[hour] += 1
        
        sorted_commands = sorted(command_counts.items(), key=lambda x: x[1], reverse=True)
        self.user_preferences['common_commands'] = [cmd for cmd, _ in sorted_commands[:10]]
        
        peak_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)
        self.user_preferences['usage_patterns'] = {
            'peak_hours': [h for h, _ in peak_hours[:3]],
            'hour_distribution': dict(hour_counts)
        }
    
    def get_command_statistics(self, command=None):
        if command:
            return dict(self.command_stats.get(command, {}))
        return dict(self.command_stats)
    
    def get_wake_statistics(self):
        return dict(self.wake_stats)
    
    def get_recent_interactions(self, count=100):
        return list(self.interactions)[-count:]
    
    def get_usage_frequency(self, command):
        stats = self.command_stats.get(command, {})
        return stats.get('total', 0)
    
    def get_average_confidence(self, command=None):
        if command:
            stats = self.command_stats.get(command, {})
            return stats.get('avg_confidence', 0.0)
        
        all_confidences = []
        for stats in self.command_stats.values():
            all_confidences.extend(stats.get('confidences', []))
        return np.mean(all_confidences) if all_confidences else 0.0
    
    def get_success_rate(self, command=None):
        if command:
            stats = self.command_stats.get(command, {})
            return stats.get('success_rate', 0.0)
        
        total = sum(s['total'] for s in self.command_stats.values())
        correct = sum(s['correct'] for s in self.command_stats.values())
        return correct / max(total, 1)
    
    def get_common_commands(self, top_n=5):
        return self.user_preferences.get('common_commands', [])[:top_n]
    
    def get_interaction_count(self, hours=24):
        cutoff = time.time() - hours * 3600
        return sum(1 for i in self.interactions if i.timestamp > cutoff)
    
    def clear_history(self):
        self.interactions.clear()
        self.command_stats.clear()
        self.wake_stats = {
            'total_detections': 0,
            'correct_detections': 0,
            'false_positives': 0,
            'false_negatives': 0,
            'confidences': []
        }
        if os.path.exists(self.storage_path):
            os.remove(self.storage_path)
        print("[UserHistory] 历史记录已清除")
