import numpy as np
from collections import deque
from src.utils.config_loader import Config
from src.audio.vad import VoiceActivityDetector

try:
    import webrtc_audio_processing as webrtc_ap
    WEBRTC_AVAILABLE = True
except ImportError:
    WEBRTC_AVAILABLE = False
    print("[AudioProcessor] 警告: webrtc-audio-processing 未安装，将使用纯Python实现")


class AudioProcessor:
    def __init__(self, enable_vad=True):
        self.config = Config()
        self.sample_rate = self.config.get('audio.sample_rate')
        self.chunk_size = self.config.get('audio.chunk_size')
        
        self.aec_enabled = self.config.get('aec.enabled', True)
        self.ns_enabled = self.config.get('ns.enabled', True)
        self.ns_level = self.config.get('ns.level', 3)
        self.ns_method = self.config.get('ns.method', 'mmse')
        
        self.apm = None
        if WEBRTC_AVAILABLE:
            self._init_webrtc()
        
        self.enable_vad = enable_vad
        if self.enable_vad:
            self.vad = VoiceActivityDetector(
                sample_rate=self.sample_rate,
                frame_size=512,
                mode='energy'
            )
        
        self.prev_samples = np.zeros(512, dtype=np.float32)
        
        self.n_fft = 512
        self.hop_length = 256
        self.hann_window = np.hanning(self.n_fft)
        
        self.noise_psd = np.zeros(self.n_fft // 2 + 1, dtype=np.float32)
        self.noise_estimate_initialized = False
        self.noise_update_alpha = 0.95
        self.ns_snr_threshold = 0.0
        
        self.mmse_xi_prev = np.ones(self.n_fft // 2 + 1, dtype=np.float32) * 0.5
        self.mmse_gain_prev = np.ones(self.n_fft // 2 + 1, dtype=np.float32)
        
        self.aec_filter = np.zeros(1024, dtype=np.float32)
        self.aec_buffer = deque(maxlen=2048)
        
        self.snr_history = deque(maxlen=100)
        self.current_snr = 0.0
    
    def _init_webrtc(self):
        try:
            self.apm = webrtc_ap.AudioProcessingModule()
            
            if self.aec_enabled:
                self.apm.echo_canceller.enable = True
                self.apm.echo_canceller.suppression_level = webrtc_ap.EchoCanceller.SuppressionLevel.High
            
            if self.ns_enabled:
                self.apm.noise_suppression.enable = True
                level_map = {
                    0: webrtc_ap.NoiseSuppression.Level.Low,
                    1: webrtc_ap.NoiseSuppression.Level.Moderate,
                    2: webrtc_ap.NoiseSuppression.Level.High,
                    3: webrtc_ap.NoiseSuppression.Level.VeryHigh
                }
                self.apm.noise_suppression.level = level_map.get(
                    self.ns_level, 
                    webrtc_ap.NoiseSuppression.Level.High
                )
            
            self.apm.initialize(self.sample_rate, num_channels=1)
            print("[AudioProcessor] WebRTC音频处理模块初始化成功")
        except Exception as e:
            print(f"[AudioProcessor] WebRTC初始化失败: {e}，将使用纯Python实现")
            self.apm = None
    
    def process(self, audio_data, reference_data=None, estimate_snr=False):
        if audio_data is None or len(audio_data) == 0:
            return audio_data
        
        audio_float = audio_data.astype(np.float32) / 32768.0
        
        if estimate_snr:
            self._estimate_snr(audio_float)
        
        if self.apm is not None and WEBRTC_AVAILABLE:
            try:
                processed = self._process_webrtc(audio_float, reference_data)
                return (processed * 32768.0).astype(np.int16)
            except Exception as e:
                pass
        
        processed = self._process_python(audio_float, reference_data)
        return (processed * 32768.0).astype(np.int16)
    
    def _process_webrtc(self, audio_float, reference_data=None):
        if reference_data is not None and self.aec_enabled:
            ref_float = reference_data.astype(np.float32) / 32768.0
            self.apm.process_reverse_stream(ref_float)
        
        processed = self.apm.process_stream(audio_float)
        return processed
    
    def _process_python(self, audio_float, reference_data=None):
        if len(audio_float) < self.n_fft:
            padding = self.n_fft - len(audio_float)
            audio_float = np.pad(audio_float, (0, padding), mode='constant')
        
        if self.aec_enabled:
            audio_float = self._nlms_aec(audio_float, reference_data)
        
        if self.ns_enabled:
            if self.ns_method == 'mmse':
                audio_float = self._mmse_ns(audio_float)
            elif self.ns_method == 'subspace':
                audio_float = self._subspace_ns(audio_float)
            else:
                audio_float = self._spectral_subtraction_ns(audio_float)
        
        return audio_float
    
    def _estimate_snr(self, audio_float):
        if not self.noise_estimate_initialized:
            self._estimate_noise_psd(audio_float[:self.n_fft * 10])
            return
        
        frame = audio_float[:self.n_fft] * self.hann_window
        spectrum = np.abs(np.fft.rfft(frame))
        signal_power = np.mean(spectrum ** 2)
        noise_power = np.mean(self.noise_psd)
        
        if noise_power > 0:
            snr = 10 * np.log10(signal_power / noise_power)
            self.snr_history.append(snr)
            self.current_snr = np.mean(self.snr_history)
    
    def _estimate_noise_psd(self, audio_float):
        n_frames = len(audio_float) // self.hop_length - 1
        if n_frames < 5:
            return
        
        noise_estimates = []
        for i in range(min(20, n_frames)):
            start = i * self.hop_length
            frame = audio_float[start:start + self.n_fft]
            if len(frame) < self.n_fft:
                frame = np.pad(frame, (0, self.n_fft - len(frame)), mode='constant')
            frame = frame * self.hann_window
            spectrum = np.abs(np.fft.rfft(frame))
            noise_estimates.append(spectrum ** 2)
        
        if noise_estimates:
            self.noise_psd = np.mean(np.array(noise_estimates), axis=0)
            self.noise_estimate_initialized = True
    
    def _update_noise_psd(self, frame_psd, is_silence):
        if is_silence:
            alpha = self.noise_update_alpha
            self.noise_psd = alpha * self.noise_psd + (1 - alpha) * frame_psd
        else:
            alpha = 0.99
            self.noise_psd = alpha * self.noise_psd + (1 - alpha) * np.minimum(frame_psd, self.noise_psd)
    
    def _spectral_subtraction_ns(self, audio_float, alpha=None, beta=None):
        n_frames = (len(audio_float) - self.n_fft) // self.hop_length + 1
        output = np.zeros_like(audio_float)
        
        if alpha is None:
            alpha = 2.0 if self.current_snr > 5 else 3.0
        if beta is None:
            beta = 0.005 if self.current_snr > 5 else 0.01
        
        if not self.noise_estimate_initialized:
            self._estimate_noise_psd(audio_float)
        
        for i in range(n_frames):
            start = i * self.hop_length
            frame = audio_float[start:start + self.n_fft]
            if len(frame) < self.n_fft:
                frame = np.pad(frame, (0, self.n_fft - len(frame)), mode='constant')
            
            windowed = frame * self.hann_window
            spectrum = np.fft.rfft(windowed)
            mag = np.abs(spectrum)
            phase = np.angle(spectrum)
            mag_sq = mag ** 2
            
            is_silence = np.mean(mag_sq) < np.mean(self.noise_psd) * 2
            self._update_noise_psd(mag_sq, is_silence)
            
            mag_clean = np.sqrt(np.maximum(mag_sq - alpha * self.noise_psd, beta * mag_sq))
            spectrum_clean = mag_clean * np.exp(1j * phase)
            frame_clean = np.fft.irfft(spectrum_clean)
            
            output[start:start + self.n_fft] += frame_clean * self.hann_window
        
        output = output / (np.sum(self.hann_window ** 2) / self.hop_length + 1e-10)
        return output
    
    def _mmse_ns(self, audio_float):
        n_frames = (len(audio_float) - self.n_fft) // self.hop_length + 1
        output = np.zeros_like(audio_float)
        
        if not self.noise_estimate_initialized:
            self._estimate_noise_psd(audio_float)
        
        for i in range(n_frames):
            start = i * self.hop_length
            frame = audio_float[start:start + self.n_fft]
            if len(frame) < self.n_fft:
                frame = np.pad(frame, (0, self.n_fft - len(frame)), mode='constant')
            
            windowed = frame * self.hann_window
            spectrum = np.fft.rfft(windowed)
            mag = np.abs(spectrum)
            phase = np.angle(spectrum)
            mag_sq = mag ** 2
            
            gamma_k = mag_sq / (self.noise_psd + 1e-10)
            xi_k = 0.97 * self.mmse_xi_prev + 0.03 * np.maximum(gamma_k - 1, 0)
            xi_k = np.maximum(xi_k, 0.1)
            
            nu_k = xi_k * gamma_k / (1 + xi_k)
            
            from scipy.special import ive
            try:
                sqrt_nu = np.sqrt(np.pi * nu_k / 2)
                bessel_term = ive(0, nu_k / 2) + ive(1, nu_k / 2)
                gain = (xi_k / (1 + xi_k)) * np.exp(-nu_k / 2) * bessel_term
            except:
                gain = xi_k / (1 + xi_k)
            
            gain = np.minimum(np.maximum(gain, 0.01), 1.0)
            
            self.mmse_xi_prev = xi_k
            self.mmse_gain_prev = gain
            
            is_silence = np.mean(mag_sq) < np.mean(self.noise_psd) * 2
            self._update_noise_psd(mag_sq, is_silence)
            
            mag_clean = mag * gain
            spectrum_clean = mag_clean * np.exp(1j * phase)
            frame_clean = np.fft.irfft(spectrum_clean)
            
            output[start:start + self.n_fft] += frame_clean * self.hann_window
        
        output = output / (np.sum(self.hann_window ** 2) / self.hop_length + 1e-10)
        return output
    
    def _subspace_ns(self, audio_float, frame_len=256, mu=0.8, lambda_val=0.5):
        output = np.copy(audio_float)
        n_samples = len(audio_float)
        
        for i in range(0, n_samples - frame_len, frame_len // 2):
            frame = audio_float[i:i + frame_len]
            
            R = np.zeros((frame_len, frame_len))
            for j in range(frame_len):
                for k in range(frame_len):
                    if j == k:
                        R[j, k] = self.noise_energy if hasattr(self, 'noise_energy') else 0.01
            
            try:
                eigvals, eigvecs = np.linalg.eigh(R)
                noise_subspace = eigvecs[:, eigvals < lambda_val]
                proj_matrix = noise_subspace @ noise_subspace.T
                frame_clean = frame - proj_matrix @ frame
                output[i:i + frame_len] = mu * output[i:i + frame_len] + (1 - mu) * frame_clean
            except:
                pass
        
        return output
    
    def _nlms_aec(self, audio_float, reference_data=None, mu=0.01, delta=1e-10):
        if reference_data is None:
            return audio_float
        
        ref_float = reference_data.astype(np.float32) / 32768.0
        
        for sample in ref_float:
            self.aec_buffer.append(sample)
        
        output = np.copy(audio_float)
        filter_len = len(self.aec_filter)
        
        for i in range(len(audio_float)):
            if len(self.aec_buffer) >= filter_len:
                x = np.array(list(self.aec_buffer)[-filter_len:])
                echo_estimate = np.dot(self.aec_filter, x)
                error = audio_float[i] - echo_estimate
                
                norm = np.dot(x, x) + delta
                self.aec_filter += mu * error * x / norm
                
                output[i] = error
            
            if i < len(ref_float):
                self.aec_buffer.append(ref_float[i])
        
        return output
    
    def _simple_aec(self, audio_float, filter_length=1024, mu=0.01):
        if len(audio_float) < filter_length:
            return audio_float
        
        output = np.copy(audio_float)
        combined = np.concatenate([self.prev_samples, audio_float])
        
        for i in range(len(audio_float)):
            start = i + len(self.prev_samples)
            if start >= filter_length:
                x = combined[start - filter_length:start]
                echo_estimate = np.sum(x * 0.001)
                output[i] = audio_float[i] - mu * echo_estimate
        
        self.prev_samples = audio_float[-512:] if len(audio_float) >= 512 else audio_float
        
        return output
    
    def is_speech(self, audio_data):
        if not self.enable_vad:
            return True
        return self.vad.is_speech(audio_data)
    
    def get_current_snr(self):
        return self.current_snr
    
    def reset(self):
        self.prev_samples = np.zeros(512, dtype=np.float32)
        self.noise_psd = np.zeros(self.n_fft // 2 + 1, dtype=np.float32)
        self.noise_estimate_initialized = False
        self.mmse_xi_prev = np.ones(self.n_fft // 2 + 1, dtype=np.float32) * 0.5
        self.mmse_gain_prev = np.ones(self.n_fft // 2 + 1, dtype=np.float32)
        self.aec_filter = np.zeros(1024, dtype=np.float32)
        self.aec_buffer.clear()
        self.snr_history.clear()
        self.current_snr = 0.0
        
        if self.enable_vad:
            self.vad.reset()
        
        if self.apm is not None:
            try:
                self.apm.initialize(self.sample_rate, num_channels=1)
            except:
                pass
