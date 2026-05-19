import torch
import torch.nn as nn
import torch.nn.functional as F
from src.utils.config_loader import Config


class WakeWordDNN(nn.Module):
    def __init__(self, input_dim=120, num_classes=2):
        super(WakeWordDNN, self).__init__()
        
        self.config = Config()
        self.n_mfcc = self.config.get('mfcc.n_mfcc')
        
        self.conv1 = nn.Conv2d(1, 32, kernel_size=(3, 3), padding=(1, 1))
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=(3, 3), padding=(1, 1))
        self.bn2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=(3, 3), padding=(1, 1))
        self.bn3 = nn.BatchNorm2d(128)
        
        self.pool = nn.MaxPool2d((2, 2))
        self.dropout = nn.Dropout(0.3)
        
        self.lstm = nn.LSTM(input_size=128, hidden_size=128, num_layers=2, batch_first=True, bidirectional=True)
        
        self.fc1 = nn.Linear(256, 128)
        self.fc2 = nn.Linear(128, num_classes)
    
    def forward(self, x):
        if x.dim() == 3:
            x = x.unsqueeze(1)
        
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        
        batch_size, channels, freq, time = x.size()
        x = x.permute(0, 3, 1, 2).contiguous()
        x = x.view(batch_size, time, channels * freq)
        
        x, _ = self.lstm(x)
        x = x[:, -1, :]
        
        x = self.dropout(F.relu(self.fc1(x)))
        x = self.fc2(x)
        
        return F.softmax(x, dim=1)


class CommandRecognitionDNN(nn.Module):
    def __init__(self, input_dim=120, num_classes=10):
        super(CommandRecognitionDNN, self).__init__()
        
        self.config = Config()
        self.commands = self.config.get('model.commands')
        if self.commands:
            num_classes = len(self.commands)
        
        self.conv1 = nn.Conv2d(1, 32, kernel_size=(3, 3), padding=(1, 1))
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=(3, 3), padding=(1, 1))
        self.bn2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=(3, 3), padding=(1, 1))
        self.bn3 = nn.BatchNorm2d(128)
        self.conv4 = nn.Conv2d(128, 128, kernel_size=(3, 3), padding=(1, 1))
        self.bn4 = nn.BatchNorm2d(128)
        
        self.pool = nn.MaxPool2d((2, 2))
        self.dropout = nn.Dropout(0.4)
        
        self.fc1 = nn.Linear(128 * 7 * 7, 512)
        self.fc2 = nn.Linear(512, 256)
        self.fc3 = nn.Linear(256, num_classes)
    
    def forward(self, x):
        if x.dim() == 3:
            x = x.unsqueeze(1)
        
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        x = self.pool(F.relu(self.bn4(self.conv4(x))))
        
        x = x.view(x.size(0), -1)
        
        x = self.dropout(F.relu(self.fc1(x)))
        x = self.dropout(F.relu(self.fc2(x)))
        x = self.fc3(x)
        
        return F.softmax(x, dim=1)


def get_wake_word_model(pretrained=False, model_path=None):
    model = WakeWordDNN()
    if pretrained and model_path:
        model.load_state_dict(torch.load(model_path, map_location='cpu'))
    model.eval()
    return model


def get_command_model(pretrained=False, model_path=None):
    model = CommandRecognitionDNN()
    if pretrained and model_path:
        model.load_state_dict(torch.load(model_path, map_location='cpu'))
    model.eval()
    return model


def export_to_onnx(model, onnx_path, input_shape=(1, 120, 125)):
    model.eval()
    dummy_input = torch.randn(input_shape)
    
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print(f"模型已导出到: {onnx_path}")
