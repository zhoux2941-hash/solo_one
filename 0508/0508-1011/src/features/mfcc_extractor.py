import numpy as np
from src.utils.config_loader import Config

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    print("[MFCC] 警告: librosa 未安装，将使用纯numpy实现")


class MFCCExtractor:
    def __init__(self, enable_cmn=True, enable_vtn=True, enable_spectral_weighting=True):
        self.config = Config()
        self.sample_rate = self.config.get('audio.sample_rate')
        self.n_mfcc = self.config.get('mfcc.n_mfcc')
        self.n_mels = self.config.get('mfcc.n_mels')
        self.n_fft = self.config.get('mfcc.n_fft')
        self.hop_length = self.config.get('mfcc.hop_length')
        self.win_length = self.config.get('mfcc.win_length')
        self.fmin = self.config.get('mfcc.fmin')
        self.fmax = self.config.get('mfcc.fmax')
        
        self.enable_cmn = enable_cmn
        self.enable_cvn = enable_vtn
        self.enable_spectral_weighting = enable_spectral_weighting
        
        self.mel_filterbank = self._create_mel_filterbank()
        self.dct_matrix = self._create_dct_matrix()
        self.lifter_coeffs = self._create_lifter_coeffs()
        
        self.cmn_mean = None
        self.cmn_std = None
        self.feature_stats_initialized = False
        self.feature_buffer = []
        
        self.noise_psd = np.zeros(self.n_fft // 2 + 1, dtype=np.float32)
        self.noise_estimate_initialized = False
    
    def _hz_to_mel(self, hz):
        return 2595 * np.log10(1 + hz / 700)
    
    def _mel_to_hz(self, mel):
        return 700 * (10 ** (mel / 2595) - 1)
    
    def _create_mel_filterbank(self):
        low_mel = self._hz_to_mel(self.fmin)
        high_mel = self._hz_to_mel(self.fmax)
        mel_points = np.linspace(low_mel, high_mel, self.n_mels + 2)
        hz_points = self._mel_to_hz(mel_points)
        bin_points = np.floor((self.n_fft + 1) * hz_points / self.sample_rate).astype(int)
        
        filterbank = np.zeros((self.n_mels, int(self.n_fft / 2 + 1)))
        for m in range(1, self.n_mels + 1):
            f_m_minus = bin_points[m - 1]
            f_m = bin_points[m]
            f_m_plus = bin_points[m + 1]
            
            for k in range(f_m_minus, f_m):
                filterbank[m - 1, k] = (k - bin_points[m - 1]) / (bin_points[m] - bin_points[m - 1])
            for k in range(f_m, f_m_plus):
                filterbank[m - 1, k] = (bin_points[m + 1] - k) / (bin_points[m + 1] - bin_points[m])
        
        return filterbank
    
    def _create_dct_matrix(self):
        n = self.n_mels
        dct = np.zeros((self.n_mfcc, n))
        for k in range(self.n_mfcc):
            for i in range(n):
                dct[k, i] = np.cos(np.pi * k * (2 * i + 1) / (2 * n))
        dct[0] *= np.sqrt(1 / n)
        dct[1:] *= np.sqrt(2 / n)
        return dct
    
    def _create_lifter_coeffs(self, L=22):
        coeffs = 1 + (L / 2) * np.sin(np.pi * np.arange(self.n_mfcc) / L)
        return coeffs
    
    def _spectral_subtraction(self, mag_spectrum, alpha=2.0, beta=0.01):
        if not self.noise_estimate_initialized:
            return mag_spectrum
        
        clean_mag = np.sqrt(np.maximum(mag_spectrum ** 2 - alpha * self.noise_psd, beta * mag_spectrum ** 2))
        return clean_mag
    
    def _spectral_weighting(self, mel_spectrum, snr_estimate=None):
        if not self.enable_spectral_weighting:
            return mel_spectrum
        
        if snr_estimate is None:
            snr_estimate = 10.0
        
        snr_db = snr_estimate
        if snr_db < 0:
            snr_db = 0
        
        weighting = 1.0 + (snr_db / 20.0)
        weighted = mel_spectrum * weighting
        
        return weighted
    
    def _apply_cmn(self, features):
        if not self.enable_cmn:
            return features
        
        mean = np.mean(features, axis=1, keepdims=True)
        return features - mean
    
    def _apply_cvn(self, features):
        if not self.enable_cvn:
            return features
        
        std = np.std(features, axis=1, keepdims=True) + 1e-10
        return features / std
    
    def _apply_liftering(self, mfcc):
        liftered = mfcc * self.lifter_coeffs[:, np.newaxis]
        return liftered
    
    def estimate_noise(self, audio_float, num_frames=20):
        if len(audio_float) < self.n_fft:
            return
        
        noise_estimates = []
        n_frames = len(audio_float) // self.hop_length
        window = np.hanning(self.n_fft)
        
        for i in range(min(num_frames, n_frames)):
            start = i * self.hop_length
            frame = audio_float[start:start + self.n_fft]
            if len(frame) < self.n_fft:
                frame = np.pad(frame, (0, self.n_fft - len(frame)), mode='constant')
            
            windowed = frame * window
            spectrum = np.abs(np.fft.rfft(windowed))
            noise_estimates.append(spectrum ** 2)
        
        if noise_estimates:
            self.noise_psd = np.mean(np.array(noise_estimates), axis=0)
            self.noise_estimate_initialized = True
    
    def extract(self, audio_data, snr_estimate=None):
        if audio_data is None or len(audio_data) == 0:
            return None
        
        audio_float = audio_data.astype(np.float32) / 32768.0
        
        if not self.noise_estimate_initialized:
            self.estimate_noise(audio_float)
        
        if LIBROSA_AVAILABLE:
            try:
                return self._extract_librosa(audio_float, snr_estimate)
            except Exception as e:
                print(f"[MFCC] librosa提取失败，使用numpy实现: {e}")
        
        return self._extract_numpy(audio_float, snr_estimate)
    
    def _extract_librosa(self, audio_float, snr_estimate=None):
        mfcc = librosa.feature.mfcc(
            y=audio_float,
            sr=self.sample_rate,
            n_mfcc=self.n_mfcc,
            n_mels=self.n_mels,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
            win_length=self.win_length,
            fmin=self.fmin,
            fmax=self.fmax
        )
        
        mfcc = self._apply_liftering(mfcc)
        
        mfcc_delta = librosa.feature.delta(mfcc)
        mfcc_delta2 = librosa.feature.delta(mfcc, order=2)
        
        features = np.concatenate([mfcc, mfcc_delta, mfcc_delta2], axis=0)
        
        features = self._apply_cmn(features)
        features = self._apply_cvn(features)
        
        return features.astype(np.float32)
    
    def _extract_numpy(self, audio_float, snr_estimate=None):
        if len(audio_float) < self.n_fft:
            padding = self.n_fft - len(audio_float)
            audio_float = np.pad(audio_float, (0, padding), mode='constant')
        
        n_frames = (len(audio_float) - self.n_fft) // self.hop_length + 1
        window = np.hanning(self.win_length)
        
        features = []
        for i in range(n_frames):
            start = i * self.hop_length
            frame = audio_float[start:start + self.n_fft]
            
            if len(frame) < self.n_fft:
                frame = np.pad(frame, (0, self.n_fft - len(frame)), mode='constant')
            
            windowed = frame * window
            spectrum = np.fft.rfft(windowed)
            mag_spectrum = np.abs(spectrum)
            
            if self.noise_estimate_initialized:
                mag_spectrum = self._spectral_subtraction(mag_spectrum)
            
            mag_spectrum = mag_spectrum ** 2
            
            mel_spectrum = np.dot(self.mel_filterbank, mag_spectrum)
            mel_spectrum = self._spectral_weighting(mel_spectrum, snr_estimate)
            
            log_mel = np.log(mel_spectrum + 1e-10)
            
            mfcc = np.dot(self.dct_matrix, log_mel)
            features.append(mfcc)
        
        features = np.array(features).T
        
        features = self._apply_liftering(features)
        
        if features.shape[1] > 1:
            delta = self._compute_delta(features)
            delta2 = self._compute_delta(delta)
            features = np.concatenate([features, delta, delta2], axis=0)
        
        features = self._apply_cmn(features)
        features = self._apply_cvn(features)
        
        return features.astype(np.float32)
    
    def _compute_delta(self, features, window=2):
        n_frames = features.shape[1]
        if n_frames < 2 * window + 1:
            return np.zeros_like(features)
        
        delta = np.zeros_like(features)
        denom = 2 * sum(i ** 2 for i in range(1, window + 1))
        
        for t in range(n_frames):
            numerator = np.zeros(features.shape[0])
            for i in range(1, window + 1):
                if t + i < n_frames:
                    numerator += i * features[:, t + i]
                if t - i >= 0:
                    numerator -= i * features[:, t - i]
            delta[:, t] = numerator / denom
        
        return delta
    
    def normalize(self, features):
        if features is None:
            return None
        
        mean = np.mean(features, axis=1, keepdims=True)
        std = np.std(features, axis=1, keepdims=True) + 1e-10
        return (features - mean) / std
    
    def reset(self):
        self.cmn_mean = None
        self.cmn_std = None
        self.feature_stats_initialized = False
        self.feature_buffer = []
        self.noise_psd = np.zeros(self.n_fft // 2 + 1, dtype=np.float32)
        self.noise_estimate_initialized = False
