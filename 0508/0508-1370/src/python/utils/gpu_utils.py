import torch
import psutil
import time


def get_device(use_gpu=True, device_id=0):
    if use_gpu and torch.cuda.is_available():
        device = torch.device(f'cuda:{device_id}')
        print(f"Using GPU: {torch.cuda.get_device_name(device_id)}")
        return device, 'cuda'
    elif use_gpu and torch.backends.mps.is_available():
        device = torch.device('mps')
        print("Using Apple Metal GPU")
        return device, 'mps'
    else:
        print("Using CPU")
        return torch.device('cpu'), 'cpu'


def get_gpu_memory_usage(device_id=0):
    if torch.cuda.is_available():
        allocated = torch.cuda.memory_allocated(device_id) / 1024**3
        reserved = torch.cuda.memory_reserved(device_id) / 1024**3
        return {
            'allocated_gb': allocated,
            'reserved_gb': reserved,
            'utilization': torch.cuda.utilization(device_id)
        }
    return None


def get_gpu_utilization(device_id=0):
    if torch.cuda.is_available():
        return torch.cuda.utilization(device_id)
    return 0


def get_system_memory_usage():
    memory = psutil.virtual_memory()
    return {
        'total_gb': memory.total / 1024**3,
        'available_gb': memory.available / 1024**3,
        'percent_used': memory.percent
    }


def get_cpu_usage():
    return psutil.cpu_percent(interval=0.1)


class PerformanceMonitor:
    def __init__(self):
        self.frame_times = []
        self.last_time = time.time()
        self.fps = 0
    
    def tick(self):
        now = time.time()
        delta = now - self.last_time
        self.last_time = now
        
        self.frame_times.append(delta)
        if len(self.frame_times) > 30:
            self.frame_times.pop(0)
        
        if len(self.frame_times) > 0:
            avg_time = sum(self.frame_times) / len(self.frame_times)
            self.fps = 1.0 / avg_time if avg_time > 0 else 0
        
        return delta
    
    def get_stats(self):
        return {
            'fps': self.fps,
            'avg_frame_time_ms': (sum(self.frame_times) / len(self.frame_times) * 1000) if self.frame_times else 0,
            'gpu_utilization': get_gpu_utilization(),
            'gpu_memory': get_gpu_memory_usage(),
            'cpu_usage': get_cpu_usage(),
            'system_memory': get_system_memory_usage()
        }
