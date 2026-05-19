import os
import sys
import argparse
import wave
import numpy as np
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.audio.recorder import AudioRecorder
from src.audio.audio_processor import AudioProcessor
from src.utils.config_loader import Config


def save_wav(file_path, audio_data, sample_rate, channels=1, sampwidth=2):
    with wave.open(file_path, 'wb') as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sampwidth)
        wf.setframerate(sample_rate)
        wf.writeframes(audio_data.tobytes())
    print(f"[AudioRecorder] 已保存: {file_path}")


def list_audio_devices():
    import pyaudio
    p = pyaudio.PyAudio()
    print("\n可用音频设备:")
    for i in range(p.get_device_count()):
        info = p.get_device_info_by_index(i)
        if info['maxInputChannels'] > 0:
            print(f"  {i}: {info['name']} (输入通道: {info['maxInputChannels']})")
    p.terminate()


def record_continuous(output_dir, duration=5, use_processing=True):
    os.makedirs(output_dir, exist_ok=True)
    
    recorder = AudioRecorder()
    processor = AudioProcessor() if use_processing else None
    
    print(f"\n[AudioRecorder] 开始连续录音，每段 {duration} 秒")
    print("[AudioRecorder] 按 Ctrl+C 停止录音\n")
    
    segment = 0
    try:
        while True:
            print(f"\n[AudioRecorder] 录制第 {segment + 1} 段...")
            audio_data = recorder.record_seconds(duration)
            
            if use_processing and processor:
                audio_data = processor.process(audio_data)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_name = f"audio_{timestamp}_{segment:04d}.wav"
            file_path = os.path.join(output_dir, file_name)
            save_wav(file_path, audio_data, recorder.sample_rate)
            
            segment += 1
            
    except KeyboardInterrupt:
        print("\n[AudioRecorder] 录音已停止")
    finally:
        recorder.close()


def record_single(output_path, duration=3, use_processing=True):
    recorder = AudioRecorder()
    processor = AudioProcessor() if use_processing else None
    
    print(f"\n[AudioRecorder] 录制 {duration} 秒音频...")
    print("[AudioRecorder] 请开始说话...")
    
    audio_data = recorder.record_seconds(duration)
    
    if use_processing and processor:
        audio_data = processor.process(audio_data)
    
    save_wav(output_path, audio_data, recorder.sample_rate)
    recorder.close()


def record_with_trigger(output_dir, threshold=500, min_duration=1.0, max_duration=3.0):
    os.makedirs(output_dir, exist_ok=True)
    
    config = Config()
    sample_rate = config.get('audio.sample_rate')
    chunk_size = config.get('audio.chunk_size')
    
    recorder = AudioRecorder()
    processor = AudioProcessor()
    
    print(f"\n[AudioRecorder] 开始语音触发录音")
    print(f"[AudioRecorder] 阈值: {threshold}, 最小时长: {min_duration}s, 最大时长: {max_duration}s")
    print("[AudioRecorder] 按 Ctrl+C 停止\n")
    
    recording = False
    audio_buffer = []
    silence_count = 0
    total_samples = 0
    segment = 0
    
    max_samples = int(max_duration * sample_rate)
    min_samples = int(min_duration * sample_rate)
    
    try:
        recorder.start()
        while True:
            chunk = recorder.read_chunk(timeout=1.0)
            if chunk is None:
                continue
            
            processed_chunk = processor.process(chunk)
            energy = np.mean(np.abs(processed_chunk))
            
            if not recording and energy > threshold:
                recording = True
                audio_buffer = [processed_chunk]
                total_samples = len(processed_chunk)
                silence_count = 0
                print(f"\n[AudioRecorder] 检测到语音，开始录音 #{segment + 1}")
            
            elif recording:
                audio_buffer.append(processed_chunk)
                total_samples += len(processed_chunk)
                
                if energy < threshold:
                    silence_count += 1
                else:
                    silence_count = 0
                
                if (silence_count > 10) or (total_samples >= max_samples):
                    if total_samples >= min_samples:
                        audio_data = np.concatenate(audio_buffer)
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        file_name = f"voice_{timestamp}_{segment:04d}.wav"
                        file_path = os.path.join(output_dir, file_name)
                        save_wav(file_path, audio_data, sample_rate)
                        segment += 1
                    else:
                        print(f"[AudioRecorder] 录音太短，已丢弃")
                    
                    recording = False
                    audio_buffer = []
                    total_samples = 0
                    silence_count = 0
                    print(f"[AudioRecorder] 等待下一次语音...")
            
    except KeyboardInterrupt:
        print("\n[AudioRecorder] 录音已停止")
    finally:
        recorder.close()


def main():
    parser = argparse.ArgumentParser(description="音频录制工具")
    parser.add_argument('--mode', type=str, default='single', 
                        choices=['single', 'continuous', 'trigger', 'list'],
                        help='录音模式: single(单次), continuous(连续), trigger(语音触发), list(列出设备)')
    parser.add_argument('--output', type=str, default='data/audio', help='输出目录或文件')
    parser.add_argument('--duration', type=float, default=3, help='单次录音时长(秒)')
    parser.add_argument('--no-processing', action='store_true', help='禁用音频处理')
    parser.add_argument('--threshold', type=int, default=500, help='语音触发阈值')
    
    args = parser.parse_args()
    
    if args.mode == 'list':
        list_audio_devices()
        return
    
    use_processing = not args.no_processing
    
    if args.mode == 'single':
        if os.path.isdir(args.output) or not args.output.endswith('.wav'):
            os.makedirs(args.output, exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = os.path.join(args.output, f"record_{timestamp}.wav")
        else:
            output_path = args.output
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
        record_single(output_path, args.duration, use_processing)
    
    elif args.mode == 'continuous':
        record_continuous(args.output, args.duration, use_processing)
    
    elif args.mode == 'trigger':
        record_with_trigger(args.output, args.threshold)


if __name__ == '__main__':
    main()
