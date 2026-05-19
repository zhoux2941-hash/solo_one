import numpy as np
import time
import threading
from collections import deque
from src.utils.config_loader import Config
from src.audio.recorder import AudioRecorder
from src.audio.audio_processor import AudioProcessor
from src.features.mfcc_extractor import MFCCExtractor
from src.inference.wake_word_detector import WakeWordDetector
from src.inference.command_recognizer import CommandRecognizer
from src.learning import (
    UserHistory, 
    AdaptiveThresholdManager, 
    UserBehaviorModel
)


class VoiceAssistant:
    def __init__(self, use_torch_models=False, enable_vad=True, enable_learning=True):
        self.config = Config()
        self.sample_rate = self.config.get('audio.sample_rate')
        self.chunk_size = self.config.get('audio.chunk_size')
        self.record_seconds = self.config.get('audio.record_seconds')
        
        self.enable_vad = enable_vad
        self.enable_learning = enable_learning
        
        self.recorder = AudioRecorder()
        self.audio_processor = AudioProcessor(enable_vad=enable_vad)
        self.mfcc_extractor = MFCCExtractor()
        
        wake_engine_path = self.config.get('model.paths.wake_trt_engine')
        wake_onnx_path = self.config.get('model.paths.wake_model')
        command_engine_path = self.config.get('model.paths.command_trt_engine')
        command_onnx_path = self.config.get('model.paths.command_model')
        
        self.wake_detector = WakeWordDetector(wake_engine_path, wake_onnx_path)
        self.command_recognizer = CommandRecognizer(command_engine_path, command_onnx_path)
        
        if use_torch_models:
            self._load_torch_models()
        
        self.audio_buffer = deque(maxlen=int(self.sample_rate * 2 / self.chunk_size))
        self.is_running = False
        self.process_thread = None
        
        self.wake_word_callback = None
        self.command_callback = None
        
        self.total_latency = 0
        self.latency_count = 0
        
        self.noise_level = 0.0
        self.snr_estimate = 10.0
        self.snr_update_interval = 100
        self.frame_count = 0
        
        if self.enable_learning:
            self._init_learning()
    
    def _init_learning(self):
        print("[VoiceAssistant] 初始化自我学习模块...")
        
        history_path = self.config.get('learning.history_path', 'data/user_history.json')
        self.user_history = UserHistory(storage_path=history_path)
        
        threshold_config = {
            'base_wake_threshold': self.config.get('model.wake_word.base_threshold', 0.85),
            'base_command_threshold': 0.70,
            'min_wake_threshold': 0.70,
            'max_wake_threshold': 0.97,
            'min_command_threshold': 0.50,
            'max_command_threshold': 0.95,
            'adjustment_step': 0.02,
            'target_wake_fpr': 0.05,
            'target_command_success_rate': 0.90,
            'adjustment_interval': 300
        }
        self.threshold_manager = AdaptiveThresholdManager(
            self.user_history, 
            config=threshold_config
        )
        
        self.behavior_model = UserBehaviorModel(self.user_history)
        
        self.last_threshold_adjustment = time.time()
        self.threshold_adjustment_interval = self.config.get(
            'learning.threshold_adjustment_interval', 300
        )
        
        print("[VoiceAssistant] 自我学习模块初始化完成")
    
    def _load_torch_models(self):
        try:
            from src.model.dnn_models import get_wake_word_model, get_command_model
            import torch
            
            wake_model = get_wake_word_model()
            command_model = get_command_model()
            
            self.wake_detector.set_torch_model(wake_model)
            self.command_recognizer.set_torch_model(command_model)
            print("[VoiceAssistant] 已加载PyTorch模型")
        except Exception as e:
            print(f"[VoiceAssistant] 加载PyTorch模型失败: {e}")
    
    def set_wake_word_callback(self, callback):
        self.wake_word_callback = callback
    
    def set_command_callback(self, callback):
        self.command_callback = callback
    
    def start(self):
        if self.is_running:
            return
        
        self.is_running = True
        self.recorder.start()
        self.process_thread = threading.Thread(target=self._process_loop, daemon=True)
        self.process_thread.start()
        
        print("[VoiceAssistant] 语音助手已启动，等待唤醒词...")
    
    def stop(self):
        self.is_running = False
        if self.process_thread:
            self.process_thread.join(timeout=2.0)
        self.recorder.stop()
        
        if self.latency_count > 0:
            avg_latency = self.total_latency / self.latency_count
            print(f"[VoiceAssistant] 平均延迟: {avg_latency:.2f} ms")
    
    def _process_loop(self):
        while self.is_running:
            try:
                chunk = self.recorder.read_chunk(timeout=0.1)
                if chunk is None:
                    continue
                
                start_time = time.time()
                
                self.frame_count += 1
                if self.frame_count % self.snr_update_interval == 0:
                    self.audio_processor.process(chunk, estimate_snr=True)
                    self.snr_estimate = self.audio_processor.get_current_snr()
                    self.wake_detector.update_noise_level(self.noise_level, self.snr_estimate)
                
                if self.enable_learning and self.frame_count % 500 == 0:
                    self._periodic_learning_update()
                
                processed_chunk = self.audio_processor.process(chunk)
                
                is_speech = True
                if self.enable_vad:
                    is_speech = self.audio_processor.is_speech(processed_chunk)
                
                self.audio_buffer.append(processed_chunk)
                
                if len(self.audio_buffer) >= 10:
                    audio_data = np.concatenate(list(self.audio_buffer))
                    features = self.mfcc_extractor.extract(audio_data)
                    features = self.mfcc_extractor.normalize(features)
                    
                    context = {'snr': self.snr_estimate}
                    
                    if self.enable_learning:
                        adaptive_wake_threshold = self.threshold_manager.get_wake_threshold(context)
                        self.wake_detector.set_threshold(adaptive_wake_threshold)
                    
                    is_wake, wake_conf = self.wake_detector.detect(
                        features, 
                        is_speech=is_speech,
                        snr=self.snr_estimate
                    )
                    
                    if is_wake:
                        latency = (time.time() - start_time) * 1000
                        self.total_latency += latency
                        self.latency_count += 1
                        print(f"[VoiceAssistant] 唤醒检测延迟: {latency:.2f} ms, SNR: {self.snr_estimate:.1f} dB, 置信度: {wake_conf:.3f}")
                        
                        if self.enable_learning:
                            self._record_wake_detection(wake_conf, context)
                        
                        if self.wake_word_callback:
                            self.wake_word_callback(wake_conf)
                        
                        self._listen_for_command()
                
            except Exception as e:
                print(f"[VoiceAssistant] 处理错误: {e}")
                time.sleep(0.01)
    
    def _listen_for_command(self):
        print("[VoiceAssistant] 请说出命令...")
        time.sleep(0.3)
        
        command_audio = self.recorder.record_seconds(self.record_seconds)
        processed_audio = self.audio_processor.process(command_audio)
        
        if self.enable_vad:
            is_speech = self.audio_processor.is_speech(processed_audio)
            if not is_speech:
                print("[VoiceAssistant] 未检测到语音，请重试")
                return
        
        features = self.mfcc_extractor.extract(processed_audio)
        features = self.mfcc_extractor.normalize(features)
        
        context = {'snr': self.snr_estimate}
        
        if self.enable_learning:
            predictions = self.behavior_model.predict_next_commands(top_k=5)
            context['predictions'] = predictions
        
        command, confidence = self.command_recognizer.recognize(features)
        
        if command:
            if self.enable_learning:
                command_threshold = self.threshold_manager.get_command_threshold(command, context)
                
                behavior_bias = self.behavior_model.get_adaptive_bias('command', {'command': command})
                adjusted_confidence = confidence + behavior_bias
                
                if adjusted_confidence < command_threshold:
                    print(f"[VoiceAssistant] 命令 '{command}' 置信度 {confidence:.3f} + 偏差 {behavior_bias:.3f} = {adjusted_confidence:.3f} < 阈值 {command_threshold:.3f}，拒绝")
                    if self.command_callback:
                        self.command_callback(None, confidence)
                    return
                
                self._record_command(command, confidence, context)
            
            print(f"[VoiceAssistant] 识别命令: '{command}', 置信度: {confidence:.3f}")
            if self.command_callback:
                self.command_callback(command, confidence)
    
    def detect_once(self, audio_data):
        processed = self.audio_processor.process(audio_data)
        
        is_speech = True
        if self.enable_vad:
            is_speech = self.audio_processor.is_speech(processed)
        
        if not is_speech:
            return False, 0.0
        
        features = self.mfcc_extractor.extract(processed)
        features = self.mfcc_extractor.normalize(features)
        return self.wake_detector.detect(features, is_speech=is_speech)
    
    def recognize_once(self, audio_data):
        processed = self.audio_processor.process(audio_data)
        features = self.mfcc_extractor.extract(processed)
        features = self.mfcc_extractor.normalize(features)
        return self.command_recognizer.recognize(features)
    
    def get_current_snr(self):
        return self.audio_processor.get_current_snr()
    
    def get_commands(self):
        return self.command_recognizer.get_commands()
    
    def _record_wake_detection(self, confidence, context=None):
        if not self.enable_learning:
            return
        
        interaction = self.user_history.record_wake_detection(
            confidence=confidence,
            is_correct=None,
            context=context
        )
        
        self.threshold_manager.update_wake_confidence(confidence)
        self.behavior_model.record_interaction(interaction)
    
    def _record_command(self, command, confidence, context=None):
        if not self.enable_learning:
            return
        
        interaction = self.user_history.record_command(
            command=command,
            confidence=confidence,
            is_correct=None,
            context=context
        )
        
        self.threshold_manager.update_command_confidence(command, confidence)
        self.behavior_model.record_interaction(interaction)
    
    def _periodic_learning_update(self):
        if not self.enable_learning:
            return
        
        if self.threshold_manager.adjust_thresholds():
            self.user_history.save()
    
    def provide_feedback(self, feedback_type, details=None):
        if not self.enable_learning:
            return
        
        details = details or {}
        
        if feedback_type in ['false_positive', 'false_negative']:
            self.user_history.record_feedback(feedback_type, details)
            self.threshold_manager.handle_feedback(feedback_type, details)
        
        elif feedback_type == 'command_correct':
            self.user_history.record_feedback(feedback_type, details)
            self.threshold_manager.handle_feedback(feedback_type, details)
            
            command = details.get('command')
            confidence = details.get('confidence', 0)
            if command:
                for i, interaction in enumerate(reversed(self.user_history.interactions)):
                    if interaction.type == 'command' and interaction.command == command:
                        interaction.is_correct = True
                        break
        
        elif feedback_type == 'command_incorrect':
            self.user_history.record_feedback(feedback_type, details)
            self.threshold_manager.handle_feedback(feedback_type, details)
            
            command = details.get('command')
            if command:
                for i, interaction in enumerate(reversed(self.user_history.interactions)):
                    if interaction.type == 'command' and interaction.command == command:
                        interaction.is_correct = False
                        break
        
        self.user_history.save()
        print(f"[VoiceAssistant] 已记录反馈: {feedback_type}")
    
    def get_learning_status(self):
        if not self.enable_learning:
            return {'enabled': False}
        
        return {
            'enabled': True,
            'history_size': len(self.user_history.interactions),
            'threshold_summary': self.threshold_manager.get_threshold_summary(),
            'behavior_summary': self.behavior_model.get_behavior_summary(),
            'common_commands': self.user_history.get_common_commands(top_n=5),
            'wake_stats': self.user_history.get_wake_statistics(),
            'interaction_count_24h': self.user_history.get_interaction_count(24)
        }
    
    def get_predicted_next_commands(self, top_k=5):
        if not self.enable_learning:
            return {}
        return self.behavior_model.predict_next_commands(top_k=top_k)
    
    def reset_learning(self):
        if not self.enable_learning:
            return
        
        self.user_history.clear_history()
        self.threshold_manager.reset()
        self.behavior_model.reset()
        print("[VoiceAssistant] 学习数据已重置")
    
    def save_learning_data(self):
        if not self.enable_learning:
            return
        self.user_history.save()
        print("[VoiceAssistant] 学习数据已保存")
    
    def cleanup(self):
        self.stop()
        
        if self.enable_learning:
            self.save_learning_data()
        
        self.wake_detector.cleanup()
        self.command_recognizer.cleanup()
        self.recorder.close()
