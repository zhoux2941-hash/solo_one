import numpy as np
from collections import deque


class VoiceActivityDetector:
    def __init__(self, sample_rate=16000, frame_size=512, mode='energy'):
        self.sample_rate = sample_rate
        self.frame_size = frame_size
        self.mode = mode
        
        self.energy_threshold = 0.01
        self.spectral_flatness_threshold = 0.6
        self.zcr_threshold = 0.1
        
        self.noise_energy = 0.0
        self.noise_estimate_initialized = False
        self.energy_history = deque(maxlen=100)
        
        self.speech_frames = 0
        self.silence_frames = 0
        self.min_speech_frames = 3
        self.min_silence_frames = 10
        self.is_speech_state = False
        
        try:
            import webrtcvad
            self.webrtc_vad = webrtcvad.Vad(3)
            self.webrtc_available = True
        except ImportError:
            self.webrtc_vad = None
            self.webrtc_available = False
    
    def reset(self):
        self.noise_energy = 0.0
        self.noise_estimate_initialized = False
        self.energy_history.clear()
        self.speech_frames = 0
        self.silence_frames = 0
        self.is_speech_state = False
    
    def estimate_noise(self, audio_float, num_frames=20):
        if len(audio_float) < self.frame_size * num_frames:
            return
        
        energies = []
        for i in range(num_frames):
            start = i * self.frame_size
            end = start + self.frame_size
            if end > len(audio_float):
                break
            frame = audio_float[start:end]
            energy = np.mean(frame ** 2)
            energies.append(energy)
        
        if energies:
            self.noise_energy = np.mean(sorted(energies)[:len(energies)//2])
            self.noise_estimate_initialized = True
            self.energy_threshold = self.noise_energy * 3.0
    
    def compute_energy(self, frame):
        return np.mean(frame ** 2)
    
    def compute_spectral_flatness(self, frame):
        windowed = frame * np.hanning(len(frame))
        spectrum = np.abs(np.fft.rfft(windowed))
        spectrum = spectrum + 1e-10
        log_spectrum = np.log(spectrum)
        arithmetic_mean = np.mean(spectrum)
        geometric_mean = np.exp(np.mean(log_spectrum))
        return geometric_mean / (arithmetic_mean + 1e-10)
    
    def compute_zcr(self, frame):
        crossings = np.sum(np.abs(np.diff(np.sign(frame)))) / 2
        return crossings / len(frame)
    
    def is_speech(self, audio_data, return_details=False):
        if audio_data is None or len(audio_data) == 0:
            if return_details:
                return False, {}
            return False
        
        audio_float = audio_data.astype(np.float32) / 32768.0 if audio_data.dtype == np.int16 else audio_data
        
        if len(audio_float) < self.frame_size:
            padding = self.frame_size - len(audio_float)
            audio_float = np.pad(audio_float, (0, padding), mode='constant')
        
        if not self.noise_estimate_initialized:
            self.estimate_noise(audio_float)
        
        if self.webrtc_available and self.mode == 'webrtc':
            return self._is_speech_webrtc(audio_float, return_details)
        
        return self._is_speech_energy(audio_float, return_details)
    
    def _is_speech_webrtc(self, audio_float, return_details):
        try:
            audio_bytes = (audio_float * 32767).astype(np.int16).tobytes()
            is_speech = self.webrtc_vad.is_speech(audio_bytes, self.sample_rate)
            
            if is_speech:
                self.speech_frames += 1
                self.silence_frames = 0
            else:
                self.silence_frames += 1
                self.speech_frames = 0
            
            if self.speech_frames >= self.min_speech_frames:
                self.is_speech_state = True
            elif self.silence_frames >= self.min_silence_frames:
                self.is_speech_state = False
            
            if return_details:
                return self.is_speech_state, {'method': 'webrtc'}
            return self.is_speech_state
            
        except Exception as e:
            return self._is_speech_energy(audio_float, return_details)
    
    def _is_speech_energy(self, audio_float, return_details):
        n_frames = len(audio_float) // self.frame_size
        speech_scores = []
        details = {'energies': [], 'flatness': [], 'zcr': []}
        
        for i in range(n_frames):
            start = i * self.frame_size
            end = start + self.frame_size
            frame = audio_float[start:end]
            
            energy = self.compute_energy(frame)
            flatness = self.compute_spectral_flatness(frame)
            zcr = self.compute_zcr(frame)
            
            details['energies'].append(energy)
            details['flatness'].append(flatness)
            details['zcr'].append(zcr)
            
            self.energy_history.append(energy)
            
            energy_score = 1.0 if energy > self.energy_threshold else 0.0
            flatness_score = 1.0 if flatness < self.spectral_flatness_threshold else 0.0
            zcr_score = 1.0 if zcr < self.zcr_threshold else 0.0
            
            combined_score = 0.5 * energy_score + 0.3 * flatness_score + 0.2 * zcr_score
            speech_scores.append(combined_score)
        
        if not speech_scores:
            if return_details:
                return False, details
            return False
        
        avg_score = np.mean(speech_scores)
        is_speech_frame = avg_score > 0.5
        
        if is_speech_frame:
            self.speech_frames += 1
            self.silence_frames = 0
        else:
            self.silence_frames += 1
            self.speech_frames = 0
        
        if self.speech_frames >= self.min_speech_frames:
            self.is_speech_state = True
        elif self.silence_frames >= self.min_silence_frames:
            self.is_speech_state = False
        
        details['avg_score'] = avg_score
        details['energy_threshold'] = self.energy_threshold
        details['noise_energy'] = self.noise_energy
        
        if return_details:
            return self.is_speech_state, details
        return self.is_speech_state
    
    def update_noise_estimate(self, audio_float, alpha=0.95):
        if not self.noise_estimate_initialized:
            self.estimate_noise(audio_float)
            return
        
        energy = self.compute_energy(audio_float[:self.frame_size])
        if energy < self.noise_energy * 2:
            self.noise_energy = alpha * self.noise_energy + (1 - alpha) * energy
            self.energy_threshold = self.noise_energy * 3.0
    
    def get_speech_segments(self, audio_float, min_duration=0.1, max_duration=2.0):
        segments = []
        n_frames = len(audio_float) // self.frame_size
        frame_duration = self.frame_size / self.sample_rate
        
        in_speech = False
        segment_start = 0
        
        for i in range(n_frames):
            start = i * self.frame_size
            end = start + self.frame_size
            frame = audio_float[start:end]
            
            is_speech_here, _ = self._is_speech_energy(frame, False)
            
            if is_speech_here and not in_speech:
                in_speech = True
                segment_start = i
            elif not is_speech_here and in_speech:
                in_speech = False
                duration = (i - segment_start) * frame_duration
                if min_duration <= duration <= max_duration:
                    segments.append((segment_start * self.frame_size, i * self.frame_size))
        
        if in_speech:
            duration = (n_frames - segment_start) * frame_duration
            if min_duration <= duration <= max_duration:
                segments.append((segment_start * self.frame_size, n_frames * self.frame_size))
        
        return segments
