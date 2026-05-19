import numpy as np
import time
from src.utils.config_loader import Config
from src.inference.tensorrt_engine import TensorRTEngine


class CommandRecognizer:
    def __init__(self, engine_path, onnx_path=None):
        self.config = Config()
        self.commands = self.config.get('model.commands') or [
            "开灯", "关灯", "调亮", "调暗", "查询温度",
            "查询湿度", "播放音乐", "停止播放", "打开窗帘", "关闭窗帘"
        ]
        self.num_commands = len(self.commands)
        
        self.engine = TensorRTEngine(engine_path, onnx_path)
        
        self.total_inference_time = 0
        self.inference_count = 0
    
    def set_torch_model(self, model):
        self.engine.set_torch_model(model)
    
    def recognize(self, features):
        if features is None:
            return None, 0.0
        
        start_time = time.time()
        features = self._prepare_features(features)
        
        output = self.engine.infer(features)
        inference_time = (time.time() - start_time) * 1000
        
        self.total_inference_time += inference_time
        self.inference_count += 1
        
        if output is None:
            return None, 0.0
        
        probs = output[0] if output.ndim == 2 else output
        command_idx = np.argmax(probs)
        confidence = probs[command_idx]
        
        if command_idx < len(self.commands):
            command = self.commands[command_idx]
            print(f"[Command] 识别命令: '{command}'，置信度: {confidence:.4f}")
            return command, confidence
        
        return None, confidence
    
    def recognize_top_k(self, features, k=3):
        if features is None:
            return []
        
        start_time = time.time()
        features = self._prepare_features(features)
        
        output = self.engine.infer(features)
        inference_time = (time.time() - start_time) * 1000
        
        self.total_inference_time += inference_time
        self.inference_count += 1
        
        if output is None:
            return []
        
        probs = output[0] if output.ndim == 2 else output
        top_indices = np.argsort(probs)[-k:][::-1]
        
        results = []
        for idx in top_indices:
            if idx < len(self.commands):
                results.append((self.commands[idx], probs[idx]))
        
        return results
    
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
    
    def get_commands(self):
        return self.commands
    
    def cleanup(self):
        self.engine.cleanup()
