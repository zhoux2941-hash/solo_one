import os
import sys
import argparse
import wave
import numpy as np
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class NoiseGenerator:
    def __init__(self, sample_rate=16000):
        self.sample_rate = sample_rate
    
    def generate_white_noise(self, duration, amplitude=0.1):
        samples = int(duration * self.sample_rate)
        noise = np.random.randn(samples) * amplitude
        return noise
    
    def generate_pink_noise(self, duration, amplitude=0.1):
        samples = int(duration * self.sample_rate)
        white = np.random.randn(samples)
        
        b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
        a = [1, -2.494956002, 2.017265875, -0.522189400]
        
        pink = np.zeros_like(white)
        for i in range(4, samples):
            pink[i] = (b[0] * white[i] + b[1] * white[i-1] + b[2] * white[i-2] + b[3] * white[i-3]
                      - a[1] * pink[i-1] - a[2] * pink[i-2] - a[3] * pink[i-3])
        
        pink = pink * amplitude / (np.std(pink) + 1e-10)
        return pink
    
    def generate_brown_noise(self, duration, amplitude=0.1):
        samples = int(duration * self.sample_rate)
        white = np.random.randn(samples)
        brown = np.cumsum(white)
        brown = brown - np.mean(brown)
        brown = brown * amplitude / (np.max(np.abs(brown)) + 1e-10)
        return brown
    
    def generate_room_reverb(self, audio, rt60=0.3, wet_gain=0.3):
        sample_rate = self.sample_rate
        impulse_length = int(rt60 * sample_rate)
        
        impulse = np.zeros(impulse_length)
        impulse[0] = 1.0
        
        decay = np.exp(-np.arange(impulse_length) / (rt60 * sample_rate / 6.9))
        noise = np.random.randn(impulse_length) * decay
        impulse_response = noise / (np.max(np.abs(noise)) + 1e-10)
        
        reverb_audio = np.convolve(audio, impulse_response, mode='same')
        reverb_audio = reverb_audio / (np.max(np.abs(reverb_audio)) + 1e-10)
        
        mixed = (1 - wet_gain) * audio + wet_gain * reverb_audio
        return mixed
    
    def add_noise(self, audio, noise_type='white', snr_db=10):
        if len(audio) == 0:
            return audio
        
        audio_float = audio.astype(np.float32) / 32768.0 if audio.dtype == np.int16 else audio
        
        signal_power = np.mean(audio_float ** 2)
        noise_power = signal_power / (10 ** (snr_db / 10))
        noise_amplitude = np.sqrt(noise_power)
        
        duration = len(audio_float) / self.sample_rate
        
        if noise_type == 'white':
            noise = self.generate_white_noise(duration, noise_amplitude)
        elif noise_type == 'pink':
            noise = self.generate_pink_noise(duration, noise_amplitude)
        elif noise_type == 'brown':
            noise = self.generate_brown_noise(duration, noise_amplitude)
        else:
            noise = self.generate_white_noise(duration, noise_amplitude)
        
        if len(noise) > len(audio_float):
            noise = noise[:len(audio_float)]
        elif len(noise) < len(audio_float):
            noise = np.pad(noise, (0, len(audio_float) - len(noise)), mode='wrap')
        
        noisy_audio = audio_float + noise
        max_val = np.max(np.abs(noisy_audio))
        if max_val > 1.0:
            noisy_audio = noisy_audio / max_val
        
        if audio.dtype == np.int16:
            noisy_audio = (noisy_audio * 32767).astype(np.int16)
        
        return noisy_audio
    
    def apply_augmentation(self, audio, aug_type='all', snr_db=10):
        if aug_type == 'noise_white':
            return self.add_noise(audio, 'white', snr_db)
        elif aug_type == 'noise_pink':
            return self.add_noise(audio, 'pink', snr_db)
        elif aug_type == 'noise_brown':
            return self.add_noise(audio, 'brown', snr_db)
        elif aug_type == 'reverb':
            return self.generate_room_reverb(audio)
        elif aug_type == 'all':
            audio = self.add_noise(audio, np.random.choice(['white', 'pink', 'brown']), snr_db)
            if np.random.random() > 0.5:
                audio = self.generate_room_reverb(audio)
            return audio
        else:
            return audio


def load_wav(file_path):
    with wave.open(file_path, 'rb') as wf:
        n_channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        sample_rate = wf.getframerate()
        n_frames = wf.getnframes()
        
        raw_data = wf.readframes(n_frames)
        audio_data = np.frombuffer(raw_data, dtype=np.int16)
        
        if n_channels > 1:
            audio_data = audio_data.reshape(-1, n_channels)[:, 0]
        
        return audio_data, sample_rate


def save_wav(file_path, audio_data, sample_rate):
    with wave.open(file_path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio_data.astype(np.int16).tobytes())


def augment_directory(input_dir, output_dir, snr_list=[0, 5, 10, 15], aug_types=['noise_white', 'noise_pink', 'noise_brown', 'reverb']):
    os.makedirs(output_dir, exist_ok=True)
    
    generator = NoiseGenerator()
    
    wav_files = [f for f in os.listdir(input_dir) if f.endswith('.wav')]
    print(f"找到 {len(wav_files)} 个音频文件")
    
    for wav_file in tqdm(wav_files, desc="增强音频"):
        file_path = os.path.join(input_dir, wav_file)
        audio_data, sample_rate = sample_rate = load_wav(file_path)
        
        base_name = os.path.splitext(wav_file)[0]
        
        save_wav(os.path.join(output_dir, f"{base_name}_clean.wav"), audio_data, sample_rate)
        
        for snr in snr_list:
            for aug_type in aug_types:
                if 'noise' in aug_type:
                    aug_audio = generator.apply_augmentation(audio_data, aug_type, snr)
                    save_wav(os.path.join(output_dir, f"{base_name}_{aug_type}_snr{snr}.wav"), aug_audio, sample_rate)
                elif aug_type == 'reverb':
                    aug_audio = generator.apply_augmentation(audio_data, aug_type)
                    save_wav(os.path.join(output_dir, f"{base_name}_reverb.wav"), aug_audio, sample_rate)


def create_noisy_test_set(input_dir, output_dir, snr_db=5, noise_type='white'):
    os.makedirs(output_dir, exist_ok=True)
    
    generator = NoiseGenerator()
    
    for root, dirs, files in os.walk(input_dir):
        for file in files:
            if file.endswith('.wav'):
                rel_path = os.path.relpath(root, input_dir)
                out_dir = os.path.join(output_dir, rel_path)
                os.makedirs(out_dir, exist_ok=True)
                
                file_path = os.path.join(root, file)
                audio_data, sample_rate = load_wav(file_path)
                
                noisy_audio = generator.add_noise(audio_data, noise_type, snr_db)
                save_wav(os.path.join(out_dir, file), noisy_audio, sample_rate)
    
    print(f"已创建SNR={snr_db}dB的测试集到: {output_dir}")


def main():
    parser = argparse.ArgumentParser(description="噪音数据增强工具")
    parser.add_argument('--mode', type=str, default='augment', 
                        choices=['augment', 'create_test'],
                        help='模式: augment(数据增强), create_test(创建测试集)')
    parser.add_argument('--input', type=str, required=True, help='输入目录')
    parser.add_argument('--output', type=str, required=True, help='输出目录')
    parser.add_argument('--snr', type=float, default=5, help='信噪比 (dB)')
    parser.add_argument('--noise-type', type=str, default='white', 
                        choices=['white', 'pink', 'brown'],
                        help='噪音类型')
    
    args = parser.parse_args()
    
    if args.mode == 'augment':
        augment_directory(args.input, args.output)
    elif args.mode == 'create_test':
        create_noisy_test_set(args.input, args.output, args.snr, args.noise_type)


if __name__ == '__main__':
    main()
