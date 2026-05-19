import pyaudio
import numpy as np
import threading
import queue
import time
from src.utils.config_loader import Config


class AudioRecorder:
    def __init__(self):
        self.config = Config()
        self.sample_rate = self.config.get('audio.sample_rate')
        self.channels = self.config.get('audio.channels')
        self.chunk_size = self.config.get('audio.chunk_size')
        self.format = pyaudio.paInt16
        
        self.audio = pyaudio.PyAudio()
        self.stream = None
        self.is_recording = False
        self.audio_queue = queue.Queue()
        self.record_thread = None
    
    def start(self):
        if self.is_recording:
            return
        
        self.stream = self.audio.open(
            format=self.format,
            channels=self.channels,
            rate=self.sample_rate,
            input=True,
            frames_per_buffer=self.chunk_size,
            stream_callback=self._callback
        )
        
        self.is_recording = True
        self.stream.start_stream()
        print(f"[AudioRecorder] 开始录音，采样率: {self.sample_rate}Hz")
    
    def _callback(self, in_data, frame_count, time_info, status):
        if status:
            print(f"[AudioRecorder] 状态警告: {status}")
        
        audio_data = np.frombuffer(in_data, dtype=np.int16)
        self.audio_queue.put(audio_data)
        return (in_data, pyaudio.paContinue)
    
    def read_chunk(self, timeout=1.0):
        try:
            return self.audio_queue.get(timeout=timeout)
        except queue.Empty:
            return None
    
    def read_all_available(self):
        chunks = []
        while not self.audio_queue.empty():
            chunks.append(self.audio_queue.get())
        if chunks:
            return np.concatenate(chunks)
        return None
    
    def stop(self):
        if not self.is_recording:
            return
        
        self.is_recording = False
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
            self.stream = None
        print("[AudioRecorder] 停止录音")
    
    def record_seconds(self, seconds):
        print(f"[AudioRecorder] 录制 {seconds} 秒音频...")
        frames = []
        stream = self.audio.open(
            format=self.format,
            channels=self.channels,
            rate=self.sample_rate,
            input=True,
            frames_per_buffer=self.chunk_size
        )
        
        for _ in range(0, int(self.sample_rate / self.chunk_size * seconds)):
            data = stream.read(self.chunk_size)
            frames.append(data)
        
        stream.stop_stream()
        stream.close()
        
        audio_data = np.frombuffer(b''.join(frames), dtype=np.int16)
        return audio_data
    
    def close(self):
        self.stop()
        if self.audio:
            self.audio.terminate()
