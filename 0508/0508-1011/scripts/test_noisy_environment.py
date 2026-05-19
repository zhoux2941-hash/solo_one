import os
import sys
import argparse
import wave
import numpy as np
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.voice_assistant import VoiceAssistant
from scripts.noise_augmentation import NoiseGenerator, load_wav, save_wav


def test_noisy_robustness(test_dir, output_dir, snr_list=[-5, 0, 5, 10, 15, 20], use_torch=True):
    os.makedirs(output_dir, exist_ok=True)
    
    print("=" * 70)
    print("噪音环境鲁棒性测试")
    print("=" * 70)
    
    print("\n初始化语音助手...")
    assistant = VoiceAssistant(use_torch_models=use_torch, enable_vad=True)
    
    generator = NoiseGenerator()
    
    wake_positive_dir = os.path.join(test_dir, 'wake_word', 'positive')
    wake_negative_dir = os.path.join(test_dir, 'wake_word', 'negative')
    commands_dir = os.path.join(test_dir, 'commands')
    
    results = {}
    
    if os.path.exists(wake_positive_dir):
        print("\n" + "-" * 70)
        print("测试唤醒词检测 (SNR=5dB目标场景)")
        print("-" * 70)
        
        positive_files = [f for f in os.listdir(wake_positive_dir) if f.endswith('.wav')]
        negative_files = []
        if os.path.exists(wake_negative_dir):
            negative_files = [f for f in os.listdir(wake_negative_dir) if f.endswith('.wav')]
        
        print(f"正样本: {len(positive_files)}, 负样本: {len(negative_files)}")
        
        for snr in snr_list:
            print(f"\nSNR = {snr} dB:")
            
            tp = 0
            fn = 0
            fp = 0
            
            print(f"  测试正样本...")
            for f in tqdm(positive_files, desc="    正样本"):
                file_path = os.path.join(wake_positive_dir, f)
                audio_data, sr = load_wav(file_path)
                
                noisy_audio = generator.add_noise(audio_data, 'white', snr)
                
                is_wake, conf = assistant.detect_once(noisy_audio)
                if is_wake:
                    tp += 1
                else:
                    fn += 1
            
            print(f"  测试负样本...")
            for f in tqdm(negative_files, desc="    负样本"):
                file_path = os.path.join(wake_negative_dir, f)
                audio_data, sr = load_wav(file_path)
                
                noisy_audio = generator.add_noise(audio_data, 'white', snr)
                
                is_wake, conf = assistant.detect_once(noisy_audio)
                if is_wake:
                    fp += 1
            
            tpr = tp / len(positive_files) if positive_files else 0
            fpr = fp / len(negative_files) if negative_files else 0
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            recall = tpr
            f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
            
            results[f'wake_snr_{snr}'] = {
                'tp': tp, 'fn': fn, 'fp': fp,
                'tpr': tpr, 'fpr': fpr,
                'precision': precision, 'recall': recall, 'f1': f1
            }
            
            print(f"    TPR: {tpr:.4f}, FPR: {fpr:.4f}, F1: {f1:.4f}")
    
    if os.path.exists(commands_dir):
        print("\n" + "-" * 70)
        print("测试命令词识别")
        print("-" * 70)
        
        commands = assistant.get_commands()
        print(f"命令列表: {commands}")
        
        command_results = {}
        
        for snr in snr_list:
            print(f"\nSNR = {snr} dB:")
            
            correct = 0
            total = 0
            
            for cmd in commands:
                cmd_dir = os.path.join(commands_dir, cmd)
                if not os.path.exists(cmd_dir):
                    continue
                
                files = [f for f in os.listdir(cmd_dir) if f.endswith('.wav')]
                
                for f in tqdm(files, desc=f"    {cmd}"):
                    file_path = os.path.join(cmd_dir, f)
                    audio_data, sr = load_wav(file_path)
                    
                    noisy_audio = generator.add_noise(audio_data, 'white', snr)
                    
                    pred, conf = assistant.recognize_once(noisy_audio)
                    total += 1
                    if pred == cmd:
                        correct += 1
            
            accuracy = correct / total if total > 0 else 0
            command_results[f'command_snr_{snr}'] = {
                'accuracy': accuracy, 'correct': correct, 'total': total
            }
            
            print(f"    准确率: {accuracy:.4f} ({correct}/{total})")
        
        results['commands'] = command_results
    
    print("\n" + "=" * 70)
    print("测试结果汇总")
    print("=" * 70)
    
    if 'wake_snr_5' in results:
        print("\n唤醒词检测 (SNR=5dB):")
        r = results['wake_snr_5']
        print(f"  TPR (召回率): {r['tpr']:.4f}")
        print(f"  FPR (误报率): {r['fpr']:.4f}")
        print(f"  F1 分数: {r['f1']:.4f}")
        print(f"  真阳性: {r['tp']}, 漏报: {r['fn']}, 误报: {r['fp']}")
    
    if 'commands' in results and 'command_snr_5' in results['commands']:
        print("\n命令词识别 (SNR=5dB):")
        r = results['commands']['command_snr_5']
        print(f"  准确率: {r['accuracy']:.4f}")
        print(f"  正确: {r['correct']}/{r['total']}")
    
    assistant.cleanup()
    
    return results


def compare_noise_types(test_dir, snr_db=5):
    print("\n" + "=" * 70)
    print(f"不同噪音类型对比测试 (SNR={snr_db}dB)")
    print("=" * 70)
    
    assistant = VoiceAssistant(use_torch_models=True, enable_vad=True)
    generator = NoiseGenerator()
    
    wake_positive_dir = os.path.join(test_dir, 'wake_word', 'positive')
    
    if not os.path.exists(wake_positive_dir):
        print("测试数据不存在")
        return
    
    positive_files = [f for f in os.listdir(wake_positive_dir) if f.endswith('.wav')][:20]
    
    noise_types = ['clean', 'white', 'pink', 'brown']
    
    for noise_type in noise_types:
        print(f"\n噪音类型: {noise_type}")
        
        tp = 0
        for f in tqdm(positive_files, desc="  测试"):
            file_path = os.path.join(wake_positive_dir, f)
            audio_data, sr = load_wav(file_path)
            
            if noise_type != 'clean':
                audio_data = generator.add_noise(audio_data, noise_type, snr_db)
            
            is_wake, conf = assistant.detect_once(audio_data)
            if is_wake:
                tp += 1
        
        print(f"  检测率: {tp/len(positive_files):.4f} ({tp}/{len(positive_files)})")
    
    assistant.cleanup()


def main():
    parser = argparse.ArgumentParser(description="噪音环境鲁棒性测试")
    parser.add_argument('--test-dir', type=str, default='data/audio/test', help='测试数据目录')
    parser.add_argument('--output-dir', type=str, default='data/audio/test_noisy', help='输出目录')
    parser.add_argument('--mode', type=str, default='all', 
                        choices=['all', 'robustness', 'noise_types'],
                        help='测试模式')
    parser.add_argument('--use-torch', action='store_true', default=True, help='使用PyTorch模型')
    parser.add_argument('--snr', type=float, default=5, help='测试SNR (dB)')
    
    args = parser.parse_args()
    
    if args.mode in ['all', 'robustness']:
        test_noisy_robustness(args.test_dir, args.output_dir, use_torch=args.use_torch)
    
    if args.mode in ['all', 'noise_types']:
        compare_noise_types(args.test_dir, args.snr)
    
    print("\n测试完成！")


if __name__ == '__main__':
    main()
