import os
import sys
import argparse
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.model.dnn_models import WakeWordDNN, CommandRecognitionDNN, export_to_onnx
from src.features.mfcc_extractor import MFCCExtractor
from src.audio.audio_processor import AudioProcessor


class AudioDataset(Dataset):
    def __init__(self, data_dir, extractor, processor, num_classes=2, is_wake_word=True):
        self.data_dir = data_dir
        self.extractor = extractor
        self.processor = processor
        self.num_classes = num_classes
        self.is_wake_word = is_wake_word
        self.samples = []
        self.labels = []
        
        self._load_data()
    
    def _load_data(self):
        import wave
        
        if self.is_wake_word:
            positive_dir = os.path.join(self.data_dir, 'wake_word', 'positive')
            negative_dir = os.path.join(self.data_dir, 'wake_word', 'negative')
            
            if os.path.exists(positive_dir):
                for f in os.listdir(positive_dir):
                    if f.endswith('.wav'):
                        self.samples.append(os.path.join(positive_dir, f))
                        self.labels.append(1)
            
            if os.path.exists(negative_dir):
                for f in os.listdir(negative_dir):
                    if f.endswith('.wav'):
                        self.samples.append(os.path.join(negative_dir, f))
                        self.labels.append(0)
        else:
            from src.utils.config_loader import Config
            config = Config()
            commands = config.get('model.commands') or [
                "开灯", "关灯", "调亮", "调暗", "查询温度",
                "查询湿度", "播放音乐", "停止播放", "打开窗帘", "关闭窗帘"
            ]
            
            for idx, command in enumerate(commands):
                command_dir = os.path.join(self.data_dir, 'commands', command)
                if os.path.exists(command_dir):
                    for f in os.listdir(command_dir):
                        if f.endswith('.wav'):
                            self.samples.append(os.path.join(command_dir, f))
                            self.labels.append(idx)
        
        print(f"加载了 {len(self.samples)} 个样本")
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        import wave
        
        file_path = self.samples[idx]
        label = self.labels[idx]
        
        with wave.open(file_path, 'rb') as wf:
            n_frames = wf.getnframes()
            raw_data = wf.readframes(n_frames)
            audio_data = np.frombuffer(raw_data, dtype=np.int16)
        
        processed = self.processor.process(audio_data)
        features = self.extractor.extract(processed)
        features = self.extractor.normalize(features)
        
        target_frames = 125
        if features.shape[1] > target_frames:
            features = features[:, -target_frames:]
        elif features.shape[1] < target_frames:
            padding = target_frames - features.shape[1]
            features = np.pad(features, ((0, 0), (0, padding)), mode='constant')
        
        return torch.FloatTensor(features), torch.LongTensor([label])


def train_wake_word_model(data_dir, output_dir, epochs=50, batch_size=16, lr=0.001):
    print("\n" + "=" * 60)
    print("训练唤醒词检测模型")
    print("=" * 60)
    
    extractor = MFCCExtractor()
    processor = AudioProcessor()
    
    dataset = AudioDataset(data_dir, extractor, processor, num_classes=2, is_wake_word=True)
    
    if len(dataset) == 0:
        print("没有训练数据！")
        return
    
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    model = WakeWordDNN()
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'min', patience=3)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    
    best_acc = 0
    os.makedirs(output_dir, exist_ok=True)
    
    for epoch in range(epochs):
        model.train()
        train_loss = 0
        train_correct = 0
        train_total = 0
        
        for features, labels in tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs}"):
            features, labels = features.to(device), labels.squeeze().to(device)
            
            optimizer.zero_grad()
            outputs = model(features)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            train_total += labels.size(0)
            train_correct += (predicted == labels).sum().item()
        
        model.eval()
        val_loss = 0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for features, labels in val_loader:
                features, labels = features.to(device), labels.squeeze().to(device)
                outputs = model(features)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
        
        train_acc = 100 * train_correct / train_total
        val_acc = 100 * val_correct / val_total
        avg_train_loss = train_loss / len(train_loader)
        avg_val_loss = val_loss / len(val_loader)
        
        scheduler.step(avg_val_loss)
        
        print(f"Epoch {epoch+1}: Train Loss: {avg_train_loss:.4f}, Train Acc: {train_acc:.2f}%, Val Loss: {avg_val_loss:.4f}, Val Acc: {val_acc:.2f}%")
        
        if val_acc > best_acc:
            best_acc = val_acc
            model_path = os.path.join(output_dir, 'wake_word_dnn_best.pth')
            torch.save(model.state_dict(), model_path)
            print(f"保存最佳模型到: {model_path}")
    
    print(f"\n训练完成，最佳验证准确率: {best_acc:.2f}%")
    
    final_model_path = os.path.join(output_dir, 'wake_word_dnn.pth')
    torch.save(model.state_dict(), final_model_path)
    
    onnx_path = os.path.join(output_dir, 'wake_word_dnn.onnx')
    model.load_state_dict(torch.load(os.path.join(output_dir, 'wake_word_dnn_best.pth')))
    export_to_onnx(model, onnx_path)
    
    return model


def train_command_model(data_dir, output_dir, epochs=50, batch_size=16, lr=0.001):
    print("\n" + "=" * 60)
    print("训练命令词识别模型")
    print("=" * 60)
    
    extractor = MFCCExtractor()
    processor = AudioProcessor()
    
    from src.utils.config_loader import Config
    config = Config()
    commands = config.get('model.commands') or [
        "开灯", "关灯", "调亮", "调暗", "查询温度",
        "查询湿度", "播放音乐", "停止播放", "打开窗帘", "关闭窗帘"
    ]
    num_classes = len(commands)
    
    dataset = AudioDataset(data_dir, extractor, processor, num_classes=num_classes, is_wake_word=False)
    
    if len(dataset) == 0:
        print("没有训练数据！")
        return
    
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    
    model = CommandRecognitionDNN(num_classes=num_classes)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'min', patience=3)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    
    best_acc = 0
    os.makedirs(output_dir, exist_ok=True)
    
    for epoch in range(epochs):
        model.train()
        train_loss = 0
        train_correct = 0
        train_total = 0
        
        for features, labels in tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs}"):
            features, labels = features.to(device), labels.squeeze().to(device)
            
            optimizer.zero_grad()
            outputs = model(features)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            train_total += labels.size(0)
            train_correct += (predicted == labels).sum().item()
        
        model.eval()
        val_loss = 0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for features, labels in val_loader:
                features, labels = features.to(device), labels.squeeze().to(device)
                outputs = model(features)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
        
        train_acc = 100 * train_correct / train_total
        val_acc = 100 * val_correct / val_total
        avg_train_loss = train_loss / len(train_loader)
        avg_val_loss = val_loss / len(val_loader)
        
        scheduler.step(avg_val_loss)
        
        print(f"Epoch {epoch+1}: Train Loss: {avg_train_loss:.4f}, Train Acc: {train_acc:.2f}%, Val Loss: {avg_val_loss:.4f}, Val Acc: {val_acc:.2f}%")
        
        if val_acc > best_acc:
            best_acc = val_acc
            model_path = os.path.join(output_dir, 'command_recognition_dnn_best.pth')
            torch.save(model.state_dict(), model_path)
            print(f"保存最佳模型到: {model_path}")
    
    print(f"\n训练完成，最佳验证准确率: {best_acc:.2f}%")
    
    final_model_path = os.path.join(output_dir, 'command_recognition_dnn.pth')
    torch.save(model.state_dict(), final_model_path)
    
    onnx_path = os.path.join(output_dir, 'command_recognition_dnn.onnx')
    model.load_state_dict(torch.load(os.path.join(output_dir, 'command_recognition_dnn_best.pth')))
    export_to_onnx(model, onnx_path)
    
    return model


def main():
    parser = argparse.ArgumentParser(description="训练语音识别模型")
    parser.add_argument('--model', type=str, default='all', choices=['all', 'wake', 'command'],
                        help='要训练的模型类型')
    parser.add_argument('--data-dir', type=str, default='data/audio/train', help='训练数据目录')
    parser.add_argument('--output-dir', type=str, default='models', help='模型输出目录')
    parser.add_argument('--epochs', type=int, default=50, help='训练轮数')
    parser.add_argument('--batch-size', type=int, default=16, help='批次大小')
    parser.add_argument('--lr', type=float, default=0.001, help='学习率')
    
    args = parser.parse_args()
    
    if args.model in ['all', 'wake']:
        train_wake_word_model(args.data_dir, args.output_dir, args.epochs, args.batch_size, args.lr)
    
    if args.model in ['all', 'command']:
        train_command_model(args.data_dir, args.output_dir, args.epochs, args.batch_size, args.lr)
    
    print("\n训练完成！")


if __name__ == '__main__':
    main()
