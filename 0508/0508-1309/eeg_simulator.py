import numpy as np
from scipy import signal

class EEGSimulator:
    def __init__(self, sampling_rate=256, duration=10, channels=8):
        self.sampling_rate = sampling_rate
        self.duration = duration
        self.channels = channels
        self.n_samples = sampling_rate * duration
        self.time = np.linspace(0, duration, self.n_samples)

    def generate_background_activity(self, alpha_amp=30, beta_amp=15, theta_amp=20, delta_amp=40):
        eeg = np.zeros((self.channels, self.n_samples))
        for ch in range(self.channels):
            delta = delta_amp * np.random.randn() * np.sin(2 * np.pi * 2 * self.time + np.random.rand() * 2 * np.pi)
            theta = theta_amp * np.random.randn() * np.sin(2 * np.pi * 6 * self.time + np.random.rand() * 2 * np.pi)
            alpha = alpha_amp * np.random.randn() * np.sin(2 * np.pi * 10 * self.time + np.random.rand() * 2 * np.pi)
            beta = beta_amp * np.random.randn() * np.sin(2 * np.pi * 20 * self.time + np.random.rand() * 2 * np.pi)
            noise = 5 * np.random.randn(self.n_samples)
            eeg[ch] = delta + theta + alpha + beta + noise
        return eeg

    def generate_spike(self, amplitude=100, duration_ms=70):
        spike_len = int(self.sampling_rate * duration_ms / 1000)
        t = np.linspace(0, duration_ms / 1000, spike_len)
        spike = amplitude * np.exp(-((t - duration_ms/2000) ** 2) / (2 * (duration_ms/6000) ** 2))
        return spike

    def generate_sharp_wave(self, amplitude=80, duration_ms=150):
        sharp_len = int(self.sampling_rate * duration_ms / 1000)
        t = np.linspace(0, duration_ms / 1000, sharp_len)
        sharp = amplitude * np.sin(2 * np.pi * 3.5 * t) * np.exp(-(t - duration_ms/2000) ** 2 / (2 * (duration_ms/3000) ** 2))
        return sharp

    def generate_spike_wave_complex(self, amplitude=150, duration_ms=300):
        swc_len = int(self.sampling_rate * duration_ms / 1000)
        t = np.linspace(0, duration_ms / 1000, swc_len)
        spike = amplitude * np.exp(-((t - 0.05) ** 2) / (2 * 0.02 ** 2))
        wave = amplitude * 0.6 * np.sin(2 * np.pi * 3 * (t - 0.08)) * np.exp(-((t - 0.15) ** 2) / (2 * 0.1 ** 2))
        return spike + wave

    def generate_normal_eeg(self):
        eeg = self.generate_background_activity(alpha_amp=35, beta_amp=12, theta_amp=15, delta_amp=25)
        return eeg

    def generate_interictal_eeg(self):
        eeg = self.generate_background_activity(alpha_amp=25, beta_amp=18, theta_amp=30, delta_amp=35)
        n_spikes = np.random.randint(3, 8)
        spike_times = np.random.choice(self.n_samples - 100, n_spikes, replace=False)
        spike_times.sort()
        for ch in range(self.channels):
            if np.random.rand() > 0.3:
                for st in spike_times:
                    spike = self.generate_spike(amplitude=np.random.randint(60, 120))
                    spike_len = len(spike)
                    if st + spike_len <= self.n_samples:
                        eeg[ch, st:st+spike_len] += spike * np.random.uniform(0.7, 1.3)
        return eeg

    def generate_ictal_eeg(self):
        eeg = self.generate_background_activity(alpha_amp=15, beta_amp=25, theta_amp=45, delta_amp=45)
        seizure_start = int(self.n_samples * 0.2)
        seizure_end = int(self.n_samples * 0.8)
        seizure_duration = seizure_end - seizure_start
        t_seizure = np.linspace(0, seizure_duration / self.sampling_rate, seizure_duration)
        for ch in range(self.channels):
            freq = np.random.uniform(8, 14)
            amp_mod = 1 + 0.3 * np.sin(2 * np.pi * 2 * t_seizure)
            seizure_activity = 80 * amp_mod * np.sin(2 * np.pi * freq * t_seizure + np.random.rand() * 2 * np.pi)
            n_swc = np.random.randint(5, 15)
            swc_times = np.random.choice(seizure_duration - 200, n_swc, replace=False)
            for swt in swc_times:
                swc = self.generate_spike_wave_complex(amplitude=np.random.randint(100, 200))
                swc_len = len(swc)
                if swt + swc_len <= seizure_duration:
                    seizure_activity[swt:swt+swc_len] += swc * np.random.uniform(0.8, 1.2)
            eeg[ch, seizure_start:seizure_end] += seizure_activity
            eeg[ch, seizure_start:seizure_start+100] *= np.linspace(0, 1, 100)
            eeg[ch, seizure_end-100:seizure_end] *= np.linspace(1, 0, 100)
        return eeg

    def generate_eeg(self, mode='normal'):
        if mode == 'normal':
            return self.generate_normal_eeg()
        elif mode == 'interictal':
            return self.generate_interictal_eeg()
        elif mode == 'ictal':
            return self.generate_ictal_eeg()
        else:
            return self.generate_normal_eeg()
