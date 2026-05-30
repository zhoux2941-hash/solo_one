import numpy as np
from scipy import signal
from scipy.signal import find_peaks, butter, filtfilt
import json

class EEGAnalyzer:
    def __init__(self, sampling_rate=256, use_dynamic_threshold=True):
        self.sampling_rate = sampling_rate
        self.use_dynamic_threshold = use_dynamic_threshold
        self.templates = self._load_default_templates()
        self.spike_duration_range = (0.02, 0.07)
        self.sharp_duration_range = (0.07, 0.2)
        self.amplitude_threshold_std = 2.5
        self.type_thresholds = {
            'spike': 0.85,
            'sharp': 0.82,
            'spike_wave': 0.80
        }

    def _load_default_templates(self):
        sr = 256
        spike_len = int(sr * 0.07)
        t_spike = np.linspace(0, 0.07, spike_len)
        default_spike = np.exp(-((t_spike - 0.035) ** 2) / (2 * 0.012 ** 2))
        sharp_len = int(sr * 0.15)
        t_sharp = np.linspace(0, 0.15, sharp_len)
        default_sharp = np.sin(2 * np.pi * 3.5 * t_sharp) * np.exp(-((t_sharp - 0.075) ** 2) / (2 * 0.05 ** 2))
        swc_len = int(sr * 0.3)
        t_swc = np.linspace(0, 0.3, swc_len)
        spike = np.exp(-((t_swc - 0.05) ** 2) / (2 * 0.02 ** 2))
        wave = 0.6 * np.sin(2 * np.pi * 3 * (t_swc - 0.08)) * np.exp(-((t_swc - 0.15) ** 2) / (2 * 0.1 ** 2))
        default_swc = spike + wave
        return [
            {'data': default_spike, 'type': 'spike', 'duration': 0.07},
            {'data': default_sharp, 'type': 'sharp', 'duration': 0.15},
            {'data': default_swc, 'type': 'spike_wave', 'duration': 0.3}
        ]

    def set_type_thresholds(self, thresholds_dict):
        self.type_thresholds.update(thresholds_dict)

    def get_threshold_for_type(self, morphology_type):
        return self.type_thresholds.get(morphology_type, 0.85)

    def bandpass_filter(self, data, low_freq=1, high_freq=70):
        nyquist = 0.5 * self.sampling_rate
        low = low_freq / nyquist
        high = high_freq / nyquist
        b, a = butter(4, [low, high], btype='band')
        return filtfilt(b, a, data)

    def compute_signal_stats(self, data):
        mean = np.mean(data)
        std = np.std(data)
        return mean, std

    def find_candidate_peaks(self, data, min_distance=0.1):
        mean, std = self.compute_signal_stats(data)
        min_distance_samples = int(min_distance * self.sampling_rate)
        peaks, properties = find_peaks(
            np.abs(data - mean),
            height=self.amplitude_threshold_std * std,
            distance=min_distance_samples,
            prominence=0.5 * std
        )
        return peaks, properties

    def extract_waveform(self, data, peak_sample, template_len):
        half_len = template_len // 2
        start = max(0, peak_sample - half_len)
        end = min(len(data), peak_sample + half_len)
        waveform = data[start:end]
        if len(waveform) < template_len:
            padding = template_len - len(waveform)
            waveform = np.pad(waveform, (0, padding), mode='edge')
        return waveform

    def classify_waveform_type(self, duration_ms):
        duration_sec = duration_ms / 1000
        if duration_sec <= self.spike_duration_range[1]:
            return 'spike'
        elif duration_sec <= self.sharp_duration_range[1]:
            return 'sharp'
        else:
            return 'spike_wave'

    def check_waveform_morphology(self, waveform):
        n = len(waveform)
        if n < 5:
            return False, {}
        peak_idx = np.argmax(np.abs(waveform - np.mean(waveform)))
        baseline = np.mean(np.concatenate([waveform[:n//10], waveform[-n//10:]]))
        peak_amp = np.max(np.abs(waveform - baseline))
        std = np.std(waveform)
        if peak_amp < 2.0 * std:
            return False, {}
        if peak_idx < n * 0.2 or peak_idx > n * 0.8:
            return False, {}
        rising_part = waveform[:peak_idx+1] - baseline
        falling_part = waveform[peak_idx:] - baseline
        if len(rising_part) > 1 and len(falling_part) > 1:
            rising_slope = np.max(np.abs(np.diff(rising_part)))
            falling_slope = np.max(np.abs(np.diff(falling_part)))
            if rising_slope < 0.5 * peak_amp / len(rising_part) * 10:
                return False, {}
        duration = n / self.sampling_rate
        duration_ms = duration * 1000
        morphology_type = self.classify_waveform_type(duration_ms)
        return True, {
            'peak_amplitude': peak_amp,
            'duration_ms': duration_ms,
            'type': morphology_type
        }

    def template_matching(self, signal_data, template):
        from scipy.signal import correlate
        sig_norm = (signal_data - np.mean(signal_data)) / (np.std(signal_data) + 1e-8)
        temp_norm = (template - np.mean(template)) / (np.std(template) + 1e-8)
        correlation = correlate(sig_norm, temp_norm, mode='valid')
        correlation = correlation / len(temp_norm)
        return correlation

    def detect_spikes(self, eeg_data, channel_idx=0, threshold=None, use_dynamic=None):
        if eeg_data.ndim == 2:
            channel_data = eeg_data[channel_idx]
        else:
            channel_data = eeg_data
        filtered_data = self.bandpass_filter(channel_data, low_freq=1, high_freq=70)
        mean, std = self.compute_signal_stats(filtered_data)
        candidate_peaks, peak_props = self.find_candidate_peaks(filtered_data)
        if len(candidate_peaks) == 0:
            return []
        all_detections = []
        for template_info in self.templates:
            template = template_info['data']
            template_type = template_info['type']
            template_len = len(template)
            if use_dynamic is None:
                use_dynamic = self.use_dynamic_threshold
            if threshold is None:
                if use_dynamic:
                    current_threshold = self.get_threshold_for_type(template_type)
                else:
                    current_threshold = 0.85
            else:
                current_threshold = threshold
            correlation = self.template_matching(filtered_data, template)
            for peak in candidate_peaks:
                corr_idx = max(0, min(peak, len(correlation) - 1))
                corr_peak = correlation[corr_idx]
                if corr_peak < current_threshold:
                    continue
                waveform = self.extract_waveform(filtered_data, peak, template_len)
                morph_valid, morph_info = self.check_waveform_morphology(waveform)
                if not morph_valid:
                    continue
                peak_amp = np.abs(filtered_data[peak] - mean)
                if peak_amp < self.amplitude_threshold_std * std:
                    continue
                half_template = template_len // 2
                local_data = filtered_data[max(0, peak-half_template):min(len(filtered_data), peak+half_template)]
                local_std = np.std(local_data) if len(local_data) > 1 else std
                if np.abs(filtered_data[peak] - mean) < 2.0 * local_std:
                    continue
                detection = {
                    'sample': int(peak),
                    'time': peak / self.sampling_rate,
                    'correlation': float(corr_peak),
                    'amplitude': float(np.abs(filtered_data[peak] - mean)),
                    'morphology_type': morph_info.get('type', 'unknown'),
                    'duration_ms': morph_info.get('duration_ms', 0),
                    'template_type': template_type,
                    'threshold_used': current_threshold,
                    'channel': channel_idx
                }
                all_detections.append(detection)
        all_detections.sort(key=lambda x: x['sample'])
        merged = []
        for det in all_detections:
            if not merged:
                merged.append(det)
            else:
                last = merged[-1]
                if det['sample'] - last['sample'] < int(0.1 * self.sampling_rate):
                    if det['correlation'] * det['amplitude'] > last['correlation'] * last['amplitude']:
                        merged[-1] = det
                else:
                    merged.append(det)
        return merged

    def optimize_threshold(self, feedback_data, template_type='spike'):
        if len(feedback_data) < 10:
            return self.get_threshold_for_type(template_type), {}
        correlations = []
        labels = []
        for fb in feedback_data:
            if fb.get('morphology_type') == template_type or fb.get('template_type') == template_type:
                correlations.append(fb.get('correlation', 0))
                labels.append(fb.get('user_label', 0))
        if len(correlations) < 5:
            return self.get_threshold_for_type(template_type), {}
        correlations = np.array(correlations)
        labels = np.array(labels)
        thresholds = np.linspace(0.7, 0.98, 57)
        best_f1 = 0
        best_threshold = self.get_threshold_for_type(template_type)
        best_metrics = {}
        for thresh in thresholds:
            predictions = (correlations >= thresh).astype(int)
            tp = np.sum((predictions == 1) & (labels == 1))
            fp = np.sum((predictions == 1) & (labels == 0))
            fn = np.sum((predictions == 0) & (labels == 1))
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
            if f1 > best_f1:
                best_f1 = f1
                best_threshold = thresh
                best_metrics = {
                    'precision': precision,
                    'recall': recall,
                    'f1': f1,
                    'tp': int(tp),
                    'fp': int(fp),
                    'fn': int(fn),
                    'total': len(labels)
                }
        return best_threshold, best_metrics

    def compute_fft(self, eeg_data, channel_idx=0):
        if eeg_data.ndim == 2:
            channel_data = eeg_data[channel_idx]
        else:
            channel_data = eeg_data
        n = len(channel_data)
        fft_vals = np.fft.fft(channel_data)
        fft_freqs = np.fft.fftfreq(n, 1/self.sampling_rate)
        positive_idx = fft_freqs >= 0
        freqs = fft_freqs[positive_idx]
        power = np.abs(fft_vals[positive_idx]) ** 2
        power = power / n
        bands = {
            'delta': {'range': [0.5, 4], 'power': 0},
            'theta': {'range': [4, 8], 'power': 0},
            'alpha': {'range': [8, 13], 'power': 0},
            'beta': {'range': [13, 30], 'power': 0},
            'gamma': {'range': [30, 45], 'power': 0}
        }
        for band_name, band_info in bands.items():
            band_mask = (freqs >= band_info['range'][0]) & (freqs < band_info['range'][1])
            bands[band_name]['power'] = float(np.sum(power[band_mask]))
        return {
            'frequencies': freqs.tolist(),
            'power': power.tolist(),
            'bands': {k: {'range': v['range'], 'power': v['power']} for k, v in bands.items()}
        }
