import os
import sys
import json
import time
import queue
import threading
import multiprocessing as mp
from typing import Dict, Optional, Deque
from collections import deque
from dataclasses import dataclass, field
from enum import Enum

import zmq
import numpy as np
import cv2
import torch
import torch.nn.functional as F

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from models.espcn import get_multiscale_espcn
from models.fsrcnn import get_multiscale_fsrcnn
from utils.metrics import calculate_quality_metrics
from utils.gpu_utils import get_device, PerformanceMonitor, get_gpu_utilization, get_cpu_usage


Config.ensure_dirs()


class ScaleSwitchState(Enum):
    IDLE = "idle"
    PENDING = "pending"
    WARMING = "warming"
    SWITCHING = "switching"
    DRAINING = "draining"


@dataclass
class ScaleSwitchStats:
    total_switches: int = 0
    successful_switches: int = 0
    failed_switches: int = 0
    last_switch_time_ms: float = 0
    last_switch_old_scale: int = 0
    last_switch_new_scale: int = 0
    last_switch_buffered_frames: int = 0
    last_switch_warmup_frames: int = 0


@dataclass
class StreamMemoryPool:
    input_buffer: bytearray = None
    output_buffer: bytearray = None
    metrics_input_buffer: bytearray = None
    metrics_output_buffer: bytearray = None
    input_tensor_buffer: torch.Tensor = None
    output_tensor_buffer: torch.Tensor = None
    _initialized: bool = False
    
    def initialize(self, device, input_height=360, input_width=640, max_scale=4):
        if self._initialized:
            return
        
        max_output_height = input_height * max_scale
        max_output_width = input_width * max_scale
        
        self.input_buffer = bytearray(input_height * input_width * 3 * 2)
        self.output_buffer = bytearray(max_output_height * max_output_width * 3 * 2)
        self.metrics_input_buffer = bytearray(input_height * input_width * 3)
        self.metrics_output_buffer = bytearray(max_output_height * max_output_width * 3)
        
        self.input_tensor_buffer = torch.zeros(
            1, 3, input_height, input_width, 
            dtype=torch.float32, device=device
        )
        
        self.output_tensor_buffer = torch.zeros(
            1, 3, max_output_height, max_output_width,
            dtype=torch.float32, device=device
        )
        
        self._initialized = True
    
    def reset(self):
        if self.input_buffer:
            self.input_buffer[:] = b'\x00' * len(self.input_buffer)
        if self.output_buffer:
            self.output_buffer[:] = b'\x00' * len(self.output_buffer)


@dataclass
class StreamState:
    stream_id: str
    scale_factor: int = 2
    target_scale_factor: Optional[int] = None
    switch_state: ScaleSwitchState = ScaleSwitchState.IDLE
    switch_buffered_frames: Deque = field(default_factory=deque)
    switch_warmup_complete: bool = False
    switch_max_buffer_size: int = 300
    is_active: bool = False
    fps: float = 0
    processing_time_ms: float = 0
    psnr: float = 0
    ssim: float = 0
    last_frame_time: float = 0
    frames_processed: int = 0
    frame_times: list = field(default_factory=list)
    monitor: PerformanceMonitor = field(default_factory=PerformanceMonitor)
    last_metrics_calc: float = 0
    switch_stats: ScaleSwitchStats = field(default_factory=ScaleSwitchStats)
    _switch_lock: threading.Lock = field(default_factory=threading.Lock)
    memory_pool: StreamMemoryPool = field(default_factory=StreamMemoryPool)
    input_height: int = 360
    input_width: int = 640


class SuperResolutionProcessor:
    def __init__(self, device, device_type, model_type='espcn'):
        self.device = device
        self.device_type = device_type
        
        if model_type == 'espcn':
            self.model = get_multiscale_espcn(device=device)
        elif model_type == 'fsrcnn':
            self.model = get_multiscale_fsrcnn(device=device)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        self.model.eval()
        self._model_lock = threading.RLock()
        
        self.stream_states: Dict[str, StreamState] = {}
        self._stream_lock = threading.Lock()
        
        self.frame_queue = queue.Queue(maxsize=100)
        self.result_queue = queue.Queue(maxsize=100)
        
        self._warmed_scales = set()
        self._warmup_lock = threading.Lock()
        
        self._worker_thread = None
        self._switch_worker_thread = None
        self._should_run = False
        
        self._switch_event = threading.Event()
        self._pending_switches: Dict[str, int] = {}
        self._switch_result_callbacks: Dict[str, callable] = {}
    
    def start(self):
        self._should_run = True
        self._worker_thread = threading.Thread(target=self._process_loop, daemon=True)
        self._switch_worker_thread = threading.Thread(target=self._switch_worker_loop, daemon=True)
        self._worker_thread.start()
        self._switch_worker_thread.start()
        
        threading.Thread(target=self._prewarm_all_scales, daemon=True).start()
    
    def stop(self):
        self._should_run = False
        self._switch_event.set()
        if self._worker_thread:
            self._worker_thread.join(timeout=2)
        if self._switch_worker_thread:
            self._switch_worker_thread.join(timeout=2)
    
    def _prewarm_all_scales(self):
        time.sleep(1.0)
        dummy_frame = np.random.randint(0, 255, (240, 320, 3), dtype=np.uint8)
        
        for scale in Config.ALLOWED_SCALES:
            try:
                with self._warmup_lock:
                    if scale not in self._warmed_scales:
                        print(f"Pre-warming scale {scale}x...")
                        input_tensor = self._preprocess_frame(dummy_frame)
                        for i in range(3):
                            with torch.no_grad():
                                with torch.cuda.amp.autocast() if self.device_type == 'cuda' else nullcontext():
                                    _ = self.model(input_tensor, scale_factor=scale)
                                    if self.device_type == 'cuda':
                                        torch.cuda.synchronize()
                        self._warmed_scales.add(scale)
                        print(f"Scale {scale}x pre-warmed successfully")
            except Exception as e:
                print(f"Failed to pre-warm scale {scale}x: {e}")
    
    def _process_loop(self):
        with torch.no_grad():
            while self._should_run:
                try:
                    item = self.frame_queue.get(timeout=0.1)
                    if item is None:
                        continue
                    
                    stream_id = item['stream_id']
                    
                    with self._stream_lock:
                        state = self.stream_states.get(stream_id)
                    
                    if state:
                        with state._switch_lock:
                            if state.switch_state in [ScaleSwitchState.PENDING, ScaleSwitchState.WARMING, ScaleSwitchState.SWITCHING]:
                                if len(state.switch_buffered_frames) < state.switch_max_buffer_size:
                                    state.switch_buffered_frames.append(item)
                                self.frame_queue.task_done()
                                continue
                    
                    result = self._process_single_frame(item)
                    if result:
                        self.result_queue.put(result)
                    
                    self.frame_queue.task_done()
                except queue.Empty:
                    continue
                except Exception as e:
                    print(f"Processing error: {e}")
    
    def _switch_worker_loop(self):
        while self._should_run:
            try:
                self._switch_event.wait(timeout=0.1)
                self._switch_event.clear()
                
                pending_copy = dict(self._pending_switches)
                self._pending_switches.clear()
                
                for stream_id, new_scale in pending_copy.items():
                    self._execute_scale_switch(stream_id, new_scale)
                    
            except Exception as e:
                print(f"Switch worker error: {e}")
    
    def _execute_scale_switch(self, stream_id, new_scale):
        with self._stream_lock:
            if stream_id not in self.stream_states:
                if stream_id in self._switch_result_callbacks:
                    self._switch_result_callbacks[stream_id](False, "Stream not found")
                    del self._switch_result_callbacks[stream_id]
                return
            
            state = self.stream_states[stream_id]
        
        old_scale = state.scale_factor
        
        if old_scale == new_scale:
            if stream_id in self._switch_result_callbacks:
                self._switch_result_callbacks[stream_id](True, "Scale already set")
                del self._switch_result_callbacks[stream_id]
            return
        
        if new_scale not in Config.ALLOWED_SCALES:
            if stream_id in self._switch_result_callbacks:
                self._switch_result_callbacks[stream_id](False, f"Invalid scale: {new_scale}")
                del self._switch_result_callbacks[stream_id]
            return
        
        switch_start_time = time.time()
        warmup_frames_used = 0
        
        try:
            with state._switch_lock:
                state.target_scale_factor = new_scale
                state.switch_state = ScaleSwitchState.PENDING
                state.switch_buffered_frames.clear()
                state.switch_warmup_complete = False
            
            with self._warmup_lock:
                if new_scale not in self._warmed_scales:
                    print(f"Warming up scale {new_scale}x for stream {stream_id}...")
                    dummy_frame = np.random.randint(0, 255, (240, 320, 3), dtype=np.uint8)
                    input_tensor = self._preprocess_frame(dummy_frame)
                    
                    with state._switch_lock:
                        state.switch_state = ScaleSwitchState.WARMING
                    
                    with self._model_lock:
                        for i in range(3):
                            with torch.no_grad():
                                with torch.cuda.amp.autocast() if self.device_type == 'cuda' else nullcontext():
                                    _ = self.model(input_tensor, scale_factor=new_scale)
                                    if self.device_type == 'cuda':
                                        torch.cuda.synchronize()
                                    warmup_frames_used += 1
                    
                    self._warmed_scales.add(new_scale)
                    print(f"Scale {new_scale}x warmed up for stream {stream_id}")
            
            with state._switch_lock:
                state.switch_state = ScaleSwitchState.SWITCHING
                
                old_scale_buffer = list(state.switch_buffered_frames)
                state.switch_buffered_frames.clear()
                
                state.scale_factor = new_scale
                state.target_scale_factor = None
                state.switch_warmup_complete = True
                state.switch_state = ScaleSwitchState.DRAINING
            
            processed_in_switch = 0
            for item in old_scale_buffer:
                item['scale'] = old_scale
                result = self._process_single_frame(item)
                if result:
                    self.result_queue.put(result)
                processed_in_switch += 1
            
            with state._switch_lock:
                new_scale_buffer = list(state.switch_buffered_frames)
                state.switch_buffered_frames.clear()
                state.switch_state = ScaleSwitchState.IDLE
            
            for item in new_scale_buffer:
                item['scale'] = new_scale
                result = self._process_single_frame(item)
                if result:
                    self.result_queue.put(result)
                processed_in_switch += 1
            
            switch_time_ms = (time.time() - switch_start_time) * 1000
            total_buffered = len(old_scale_buffer) + len(new_scale_buffer)
            
            with state._switch_lock:
                state.switch_stats.total_switches += 1
                state.switch_stats.successful_switches += 1
                state.switch_stats.last_switch_time_ms = switch_time_ms
                state.switch_stats.last_switch_old_scale = old_scale
                state.switch_stats.last_switch_new_scale = new_scale
                state.switch_stats.last_switch_buffered_frames = total_buffered
                state.switch_stats.last_switch_warmup_frames = warmup_frames_used
            
            print(f"Scale switch completed for {stream_id}: {old_scale}x -> {new_scale}x "
                  f"in {switch_time_ms:.1f}ms, processed {processed_in_switch} buffered frames")
            
            if stream_id in self._switch_result_callbacks:
                self._switch_result_callbacks[stream_id](
                    True, 
                    f"Switched {old_scale}x -> {new_scale}x",
                    {
                        'switch_time_ms': switch_time_ms,
                        'buffered_frames': total_buffered,
                        'warmup_frames': warmup_frames_used
                    }
                )
                del self._switch_result_callbacks[stream_id]
            
        except Exception as e:
            print(f"Scale switch failed for {stream_id}: {e}")
            
            with state._switch_lock:
                state.switch_state = ScaleSwitchState.IDLE
                state.target_scale_factor = None
                state.switch_stats.total_switches += 1
                state.switch_stats.failed_switches += 1
            
            if stream_id in self._switch_result_callbacks:
                self._switch_result_callbacks[stream_id](False, str(e))
                del self._switch_result_callbacks[stream_id]
    
    def _process_single_frame(self, item):
        stream_id = item['stream_id']
        frame_data = item['frame']
        timestamp = item['timestamp']
        scale = item.get('scale', 2)
        original_frame = item.get('original_frame', None)
        
        with self._stream_lock:
            if stream_id not in self.stream_states:
                self.stream_states[stream_id] = StreamState(stream_id=stream_id)
            state = self.stream_states[stream_id]
            
            if not state.memory_pool._initialized:
                h, w = state.input_height, state.input_width
                state.memory_pool.initialize(self.device, h, w, 4)
        
        process_start = time.time()
        
        try:
            frame = np.frombuffer(frame_data, dtype=np.uint8)
            frame = cv2.imdecode(frame, cv2.IMREAD_COLOR)
            
            if frame is None:
                return None
            
            h, w = frame.shape[:2]
            if state.input_height != h or state.input_width != w:
                state.input_height = h
                state.input_width = w
                state.memory_pool.initialize(self.device, h, w, 4)
            
            original_for_metrics = None
            if original_frame is not None:
                original_for_metrics = np.frombuffer(original_frame, dtype=np.uint8)
                original_for_metrics = cv2.imdecode(original_for_metrics, cv2.IMREAD_COLOR)
            
            input_tensor = self._preprocess_frame_with_pool(frame, state.memory_pool)
            
            with self._model_lock:
                with torch.cuda.amp.autocast() if self.device_type == 'cuda' else nullcontext():
                    output_tensor = self.model(input_tensor, scale_factor=scale)
            
            output_frame = self._postprocess_frame_with_pool(output_tensor, state.memory_pool, scale)
            
            now = time.time()
            proc_time = (now - process_start) * 1000
            
            state.monitor.tick()
            state.processing_time_ms = proc_time
            state.fps = state.monitor.fps
            state.frames_processed += 1
            state.last_frame_time = now
            
            if original_for_metrics is not None and output_frame is not None:
                output_h, output_w = output_frame.shape[:2]
                if not hasattr(state, '_metrics_resized_buffer') or \
                   state._metrics_resized_buffer.shape[:2] != original_for_metrics.shape[:2]:
                    state._metrics_resized_buffer = np.zeros(
                        (original_for_metrics.shape[0], original_for_metrics.shape[1], 3), 
                        dtype=np.uint8
                    )
                
                cv2.resize(
                    output_frame, 
                    (original_for_metrics.shape[1], original_for_metrics.shape[0]),
                    dst=state._metrics_resized_buffer,
                    interpolation=cv2.INTER_AREA
                )
                
                metrics = calculate_quality_metrics(original_for_metrics, state._metrics_resized_buffer)
                state.psnr = metrics['psnr']
                state.ssim = metrics['ssim']
                state.last_metrics_calc = now
            
            _, encoded_frame = cv2.imencode('.jpg', output_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            
            return {
                'stream_id': stream_id,
                'frame': encoded_frame.tobytes(),
                'timestamp': timestamp,
                'processing_time_ms': proc_time,
                'scale': scale,
                'original_shape': frame.shape,
                'output_shape': output_frame.shape,
                'psnr': state.psnr,
                'ssim': state.ssim,
                'fps': state.fps,
                'switch_state': state.switch_state.value,
                'target_scale': state.target_scale_factor
            }
            
        except Exception as e:
            print(f"Frame processing error for stream {stream_id}: {e}")
            return None
    
    def _preprocess_frame(self, frame):
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        tensor = torch.from_numpy(frame_rgb).float().permute(2, 0, 1).unsqueeze(0)
        tensor = tensor / 255.0
        return tensor.to(self.device)
    
    def _preprocess_frame_with_pool(self, frame, memory_pool):
        h, w = frame.shape[:2]
        
        if not hasattr(memory_pool, '_bgr2rgb_buffer') or \
           memory_pool._bgr2rgb_buffer.shape[:2] != (h, w):
            memory_pool._bgr2rgb_buffer = np.zeros((h, w, 3), dtype=np.uint8)
        
        cv2.cvtColor(frame, cv2.COLOR_BGR2RGB, dst=memory_pool._bgr2rgb_buffer)
        
        input_tensor = memory_pool.input_tensor_buffer[:, :, :h, :w]
        frame_tensor = torch.from_numpy(memory_pool._bgr2rgb_buffer).permute(2, 0, 1).float()
        input_tensor.copy_(frame_tensor.unsqueeze(0) / 255.0, non_blocking=True)
        
        return input_tensor
    
    def _postprocess_frame(self, tensor):
        tensor = tensor.squeeze(0).clamp(0, 1).permute(1, 2, 0).cpu().numpy()
        tensor = (tensor * 255.0).astype(np.uint8)
        return cv2.cvtColor(tensor, cv2.COLOR_RGB2BGR)
    
    def _postprocess_frame_with_pool(self, tensor, memory_pool, scale):
        _, _, h, w = tensor.shape
        output_h, output_w = h * scale, w * scale
        
        if not hasattr(memory_pool, '_output_np_buffer') or \
           memory_pool._output_np_buffer.shape[:2] != (output_h, output_w):
            memory_pool._output_np_buffer = np.zeros((output_h, output_w, 3), dtype=np.uint8)
        
        if not hasattr(memory_pool, '_rgb2bgr_buffer') or \
           memory_pool._rgb2bgr_buffer.shape[:2] != (output_h, output_w):
            memory_pool._rgb2bgr_buffer = np.zeros((output_h, output_w, 3), dtype=np.uint8)
        
        tensor_cpu = tensor.squeeze(0).clamp(0, 1).permute(1, 2, 0).cpu()
        tensor_np = (tensor_cpu.numpy() * 255.0).astype(np.uint8)
        
        np.copyto(memory_pool._output_np_buffer, tensor_np)
        
        cv2.cvtColor(memory_pool._output_np_buffer, cv2.COLOR_RGB2BGR, dst=memory_pool._rgb2bgr_buffer)
        
        return memory_pool._rgb2bgr_buffer
    
    def submit_frame(self, stream_id, frame_data, timestamp, scale=2, original_frame=None):
        try:
            self.frame_queue.put_nowait({
                'stream_id': stream_id,
                'frame': frame_data,
                'timestamp': timestamp,
                'scale': scale,
                'original_frame': original_frame
            })
            return True
        except queue.Full:
            return False
    
    def get_result(self, timeout=0.01):
        try:
            return self.result_queue.get(timeout=timeout)
        except queue.Empty:
            return None
    
    def set_scale_async(self, stream_id, scale, callback=None):
        if scale not in Config.ALLOWED_SCALES:
            if callback:
                callback(False, f"Invalid scale: {scale}")
            return False
        
        with self._stream_lock:
            if stream_id not in self.stream_states:
                self.stream_states[stream_id] = StreamState(stream_id=stream_id)
            state = self.stream_states[stream_id]
        
        with state._switch_lock:
            if state.switch_state != ScaleSwitchState.IDLE:
                if callback:
                    callback(False, f"Switch already in progress: {state.switch_state.value}")
                return False
            
            state.switch_state = ScaleSwitchState.PENDING
            state.target_scale_factor = scale
        
        if callback:
            self._switch_result_callbacks[stream_id] = callback
        
        self._pending_switches[stream_id] = scale
        self._switch_event.set()
        
        return True
    
    def set_scale(self, stream_id, scale):
        result_holder = {'success': False, 'message': '', 'details': None}
        result_event = threading.Event()
        
        def callback(success, message, details=None):
            result_holder['success'] = success
            result_holder['message'] = message
            result_holder['details'] = details
            result_event.set()
        
        if not self.set_scale_async(stream_id, scale, callback):
            return False
        
        if not result_event.wait(timeout=10.0):
            return False
        
        return result_holder['success']
    
    def get_stream_stats(self, stream_id=None):
        with self._stream_lock:
            if stream_id:
                if stream_id in self.stream_states:
                    state = self.stream_states[stream_id]
                    return self._format_stats(state)
                return None
            
            stats = {}
            for sid, state in self.stream_states.items():
                stats[sid] = self._format_stats(state)
            return stats
    
    def _format_stats(self, state):
        base_stats = state.monitor.get_stats()
        
        with state._switch_lock:
            switch_info = {
                'switch_state': state.switch_state.value,
                'target_scale_factor': state.target_scale_factor,
                'switch_buffer_size': len(state.switch_buffered_frames),
                'switch_max_buffer_size': state.switch_max_buffer_size,
                'switch_stats': {
                    'total_switches': state.switch_stats.total_switches,
                    'successful_switches': state.switch_stats.successful_switches,
                    'failed_switches': state.switch_stats.failed_switches,
                    'last_switch_time_ms': state.switch_stats.last_switch_time_ms,
                    'last_switch_old_scale': state.switch_stats.last_switch_old_scale,
                    'last_switch_new_scale': state.switch_stats.last_switch_new_scale,
                    'last_switch_buffered_frames': state.switch_stats.last_switch_buffered_frames,
                    'last_switch_warmup_frames': state.switch_stats.last_switch_warmup_frames
                }
            }
        
        return {
            'stream_id': state.stream_id,
            'scale_factor': state.scale_factor,
            'is_active': state.is_active,
            'fps': state.fps,
            'processing_time_ms': state.processing_time_ms,
            'frames_processed': state.frames_processed,
            'psnr': state.psnr,
            'ssim': state.ssim,
            'gpu_utilization': base_stats['gpu_utilization'],
            'gpu_memory': base_stats['gpu_memory'],
            'cpu_usage': base_stats['cpu_usage'],
            'system_memory': base_stats['system_memory'],
            **switch_info
        }
    
    def cleanup_stream(self, stream_id):
        with self._stream_lock:
            if stream_id in self.stream_states:
                state = self.stream_states[stream_id]
                with state._switch_lock:
                    state.switch_buffered_frames.clear()
                del self.stream_states[stream_id]
        
        if stream_id in self._switch_result_callbacks:
            del self._switch_result_callbacks[stream_id]
        if stream_id in self._pending_switches:
            del self._pending_switches[stream_id]


class nullcontext:
    def __enter__(self):
        return None
    def __exit__(self, *exc):
        return False


class ZeroMQServer:
    def __init__(self, processor: SuperResolutionProcessor):
        self.processor = processor
        self.context = zmq.Context()
        
        self.request_socket = self.context.socket(zmq.PULL)
        self.request_socket.bind(f"tcp://{Config.ZMQ_HOST}:{Config.ZMQ_REQUEST_PORT}")
        
        self.response_socket = self.context.socket(zmq.PUSH)
        self.response_socket.bind(f"tcp://{Config.ZMQ_HOST}:{Config.ZMQ_RESPONSE_PORT}")
        
        self.control_socket = self.context.socket(zmq.REP)
        self.control_port = Config.ZMQ_REQUEST_PORT + 2
        self.control_socket.bind(f"tcp://{Config.ZMQ_HOST}:{self.control_port}")
        
        self._should_run = False
        self._threads = []
    
    def start(self):
        self._should_run = True
        self.processor.start()
        
        self._threads = [
            threading.Thread(target=self._receive_loop, daemon=True),
            threading.Thread(target=self._send_loop, daemon=True),
            threading.Thread(target=self._control_loop, daemon=True),
        ]
        
        for t in self._threads:
            t.start()
        
        print(f"Super-resolution server started")
        print(f"  Request port: {Config.ZMQ_REQUEST_PORT}")
        print(f"  Response port: {Config.ZMQ_RESPONSE_PORT}")
        print(f"  Control port: {self.control_port}")
    
    def stop(self):
        self._should_run = False
        self.processor.stop()
        
        for t in self._threads:
            t.join(timeout=2)
        
        self.request_socket.close()
        self.response_socket.close()
        self.control_socket.close()
        self.context.term()
    
    def _receive_loop(self):
        while self._should_run:
            try:
                msg = self.request_socket.recv_multipart(flags=zmq.NOBLOCK)
                if len(msg) >= 4:
                    stream_id = msg[0].decode('utf-8')
                    timestamp = float(msg[1].decode('utf-8'))
                    scale = int(msg[2].decode('utf-8'))
                    frame_data = msg[3]
                    original_frame = msg[4] if len(msg) > 4 else None
                    
                    self.processor.submit_frame(stream_id, frame_data, timestamp, scale, original_frame)
                    
            except zmq.Again:
                time.sleep(0.001)
            except Exception as e:
                print(f"Receive error: {e}")
    
    def _send_loop(self):
        while self._should_run:
            result = self.processor.get_result(timeout=0.01)
            if result:
                try:
                    response = [
                        result['stream_id'].encode('utf-8'),
                        str(result['timestamp']).encode('utf-8'),
                        str(result['processing_time_ms']).encode('utf-8'),
                        str(result['scale']).encode('utf-8'),
                        str(result['fps']).encode('utf-8'),
                        str(result['psnr']).encode('utf-8'),
                        str(result['ssim']).encode('utf-8'),
                        str(result.get('switch_state', 'idle')).encode('utf-8'),
                        str(result.get('target_scale', '')).encode('utf-8'),
                        result['frame']
                    ]
                    self.response_socket.send_multipart(response, flags=zmq.NOBLOCK)
                except zmq.Again:
                    pass
                except Exception as e:
                    print(f"Send error: {e}")
    
    def _control_loop(self):
        while self._should_run:
            try:
                msg = self.control_socket.recv_json(flags=zmq.NOBLOCK)
                response = self._handle_control_message(msg)
                self.control_socket.send_json(response)
            except zmq.Again:
                time.sleep(0.01)
            except Exception as e:
                print(f"Control error: {e}")
    
    def _handle_control_message(self, msg):
        cmd = msg.get('cmd')
        stream_id = msg.get('stream_id')
        
        if cmd == 'set_scale':
            scale = msg.get('scale', 2)
            async_mode = msg.get('async', False)
            
            if async_mode:
                success = self.processor.set_scale_async(stream_id, scale)
                return {'success': success, 'scale': scale, 'async': True}
            else:
                success = self.processor.set_scale(stream_id, scale)
                return {'success': success, 'scale': scale, 'async': False}
        
        elif cmd == 'get_stats':
            stats = self.processor.get_stream_stats(stream_id)
            return {'success': True, 'stats': stats}
        
        elif cmd == 'get_all_stats':
            stats = self.processor.get_stream_stats()
            return {
                'success': True,
                'stats': stats,
                'server_stats': {
                    'gpu_utilization': get_gpu_utilization(),
                    'cpu_usage': get_cpu_usage(),
                    'active_streams': len([s for s in self.processor.stream_states.values() if s.is_active])
                }
            }
        
        elif cmd == 'cleanup_stream':
            self.processor.cleanup_stream(stream_id)
            return {'success': True}
        
        elif cmd == 'ping':
            return {'success': True, 'timestamp': time.time()}
        
        else:
            return {'success': False, 'error': f'Unknown command: {cmd}'}


def main():
    print("Initializing Super-Resolution Service...")
    
    device, device_type = get_device(Config.USE_GPU, Config.GPU_DEVICE)
    
    processor = SuperResolutionProcessor(device, device_type, model_type='espcn')
    server = ZeroMQServer(processor)
    
    try:
        server.start()
        
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        server.stop()
        print("Server stopped")


if __name__ == '__main__':
    main()
