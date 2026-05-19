import os
import sys
import argparse
import wave
import numpy as np
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.voice_assistant import VoiceAssistant
from src.audio.audio_processor import AudioProcessor
from src.features.mfcc_extractor import MFCCExtractor


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


def test_wake_word_detection(test_dir, assistant, threshold=0.5):
    print("\n" + "=" * 60)
    print("唤醒词检测测试")
    print("=" * 60)
    
    positive_dir = os.path.join(test_dir, 'wake_word', 'positive')
    negative_dir = os.path.join(test_dir, 'wake_word', 'negative')
    
    if not os.path.exists(positive_dir):
        print(f"[测试] 正样本目录不存在: {positive_dir}")
        return None
    
    positive_files = [f for f in os.listdir(positive_dir) if f.endswith('.wav')]
    negative_files = []
    
    if os.path.exists(negative_dir):
        negative_files = [f for f in os.listdir(negative_dir) if f.endswith('.wav')]
    
    print(f"正样本数量: {len(positive_files)}")
    print(f"负样本数量: {len(negative_files)}")
    
    tp = 0
    fp = 0
    
    print("\n测试正样本...")
    for f in tqdm(positive_files, desc="正样本"):
        file_path = os.path.join(positive_dir, f)
        audio_data, sr = load_wav(file_path)
        is_wake, conf = assistant.detect_once(audio_data)
        if is_wake or conf > threshold:
            tp += 1
    
    print("\n测试负样本...")
    for f in tqdm(negative_files, desc="负样本"):
        file_path = os.path.join(negative_dir, f)
        audio_data, sr = load_wav(file_path)
        is_wake, conf = assistant.detect_once(audio_data)
        if is_wake or conf > threshold:
            fp += 1
    
    tpr = tp / len(positive_files) if positive_files else 0
    fpr = fp / len(negative_files) if negative_files else 0
    
    print(f"\n唤醒词检测结果:")
    print(f"  真阳性率 (TPR): {tpr:.4f} ({tp}/{len(positive_files)})")
    print(f"  假阳性率 (FPR): {fpr:.4f} ({fp}/{len(negative_files)})")
    
    return {'tpr': tpr, 'fpr': fpr, 'tp': tp, 'fp': fp, 
            'total_positive': len(positive_files), 'total_negative': len(negative_files)}


def test_command_recognition(test_dir, assistant):
    print("\n" + "=" * 60)
    print("命令词识别测试")
    print("=" * 60)
    
    commands = assistant.get_commands()
    print(f"命令列表: {commands}")
    
    correct = 0
    total = 0
    confusion_matrix = np.zeros((len(commands), len(commands)), dtype=int)
    
    for idx, command in enumerate(commands):
        command_dir = os.path.join(test_dir, 'commands', command)
        if not os.path.exists(command_dir):
            print(f"[测试] 跳过命令 '{command}': 目录不存在")
            continue
        
        files = [f for f in os.listdir(command_dir) if f.endswith('.wav')]
        print(f"\n命令 '{command}' 样本数: {len(files)}")
        
        for f in tqdm(files, desc=command):
            file_path = os.path.join(command_dir, f)
            audio_data, sr = load_wav(file_path)
            pred, conf = assistant.recognize_once(audio_data)
            
            total += 1
            if pred == command:
                correct += 1
            
            if pred in commands:
                pred_idx = commands.index(pred)
                confusion_matrix[idx, pred_idx] += 1
    
    accuracy = correct / total if total > 0 else 0
    
    print(f"\n命令识别结果:")
    print(f"  准确率: {accuracy:.4f} ({correct}/{total})")
    
    if total > 0:
        print("\n混淆矩阵:")
        print("       " + " ".join([f"{c[:4]:>5}" for c in commands]))
        for i, row in enumerate(confusion_matrix):
            print(f"{commands[i][:4]:>5} " + " ".join([f"{v:>5}" for v in row]))
    
    return {'accuracy': accuracy, 'correct': correct, 'total': total, 
            'confusion_matrix': confusion_matrix}


def test_latency(assistant, num_iterations=100):
    print("\n" + "=" * 60)
    print("延迟测试")
    print("=" * 60)
    
    import time
    
    sample_rate = 16000
    duration = 2.0
    dummy_audio = np.random.randn(int(sample_rate * duration)).astype(np.float32) * 1000
    dummy_audio = dummy_audio.astype(np.int16)
    
    processor = AudioProcessor()
    extractor = MFCCExtractor()
    
    processed = processor.process(dummy_audio)
    features = extractor.extract(processed)
    features = extractor.normalize(features)
    
    print(f"输入特征形状: {features.shape}")
    
    print("\n测试唤醒检测延迟...")
    times = []
    for _ in tqdm(range(num_iterations), desc="唤醒检测"):
        start = time.time()
        assistant.wake_detector.detect(features)
        times.append((time.time() - start) * 1000)
    
    print(f"  平均延迟: {np.mean(times):.2f} ms")
    print(f"  中位数: {np.median(times):.2f} ms")
    print(f"  90分位: {np.percentile(times, 90):.2f} ms")
    print(f"  99分位: {np.percentile(times, 99):.2f} ms")
    
    print("\n测试命令识别延迟...")
    times = []
    for _ in tqdm(range(num_iterations), desc="命令识别"):
        start = time.time()
        assistant.command_recognizer.recognize(features)
        times.append((time.time() - start) * 1000)
    
    print(f"  平均延迟: {np.mean(times):.2f} ms")
    print(f"  中位数: {np.median(times):.2f} ms")
    print(f"  90分位: {np.percentile(times, 90):.2f} ms")
    print(f"  99分位: {np.percentile(times, 99):.2f} ms")


def main():
    parser = argparse.ArgumentParser(description="语音识别系统测试工具")
    parser.add_argument('--test-dir', type=str, default='data/audio/test', help='测试数据目录')
    parser.add_argument('--mode', type=str, default='all', 
                        choices=['all', 'wake', 'command', 'latency'],
                        help='测试模式')
    parser.add_argument('--threshold', type=float, default=0.5, help='唤醒词检测阈值')
    parser.add_argument('--iterations', type=int, default=100, help='延迟测试迭代次数')
    parser.add_argument('--use-torch', action='store_true', help='使用PyTorch模型')
    
    args = parser.parse_args()
    
    print("初始化语音助手...")
    assistant = VoiceAssistant(use_torch_models=args.use_torch)
    
    try:
        if args.mode in ['all', 'wake']:
            test_wake_word_detection(args.test_dir, assistant, args.threshold)
        
        if args.mode in ['all', 'command']:
            test_command_recognition(args.test_dir, assistant)
        
        if args.mode in ['all', 'latency']:
            test_latency(assistant, args.iterations)
    
    finally:
        assistant.cleanup()
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)


if __name__ == '__main__':
    main()
