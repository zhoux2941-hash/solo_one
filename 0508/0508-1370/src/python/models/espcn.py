import torch
import torch.nn as nn
import torch.nn.functional as F


class ESPCN(nn.Module):
    def __init__(self, scale_factor=2, num_channels=3):
        super(ESPCN, self).__init__()
        self.scale_factor = scale_factor
        
        self.conv1 = nn.Conv2d(num_channels, 64, kernel_size=5, stride=1, padding=2)
        self.conv2 = nn.Conv2d(64, 64, kernel_size=3, stride=1, padding=1)
        self.conv3 = nn.Conv2d(64, 32, kernel_size=3, stride=1, padding=1)
        self.conv4 = nn.Conv2d(32, num_channels * (scale_factor ** 2), kernel_size=3, stride=1, padding=1)
        
        self.pixel_shuffle = nn.PixelShuffle(scale_factor)
        
        self._initialize_weights()
    
    def _initialize_weights(self):
        nn.init.orthogonal_(self.conv1.weight, gain=nn.init.calculate_gain('relu'))
        nn.init.orthogonal_(self.conv2.weight, gain=nn.init.calculate_gain('relu'))
        nn.init.orthogonal_(self.conv3.weight, gain=nn.init.calculate_gain('relu'))
        nn.init.orthogonal_(self.conv4.weight)
    
    def forward(self, x):
        x = F.tanh(self.conv1(x))
        x = F.tanh(self.conv2(x))
        x = F.tanh(self.conv3(x))
        x = self.pixel_shuffle(self.conv4(x))
        return x


class ESPCNMultiScale(nn.Module):
    def __init__(self, num_channels=3):
        super(ESPCNMultiScale, self).__init__()
        self.num_channels = num_channels
        
        self.conv1 = nn.Conv2d(num_channels, 64, kernel_size=5, stride=1, padding=2)
        self.conv2 = nn.Conv2d(64, 64, kernel_size=3, stride=1, padding=1)
        self.conv3 = nn.Conv2d(64, 32, kernel_size=3, stride=1, padding=1)
        
        self.scale_branches = nn.ModuleDict({
            '2': nn.Conv2d(32, num_channels * 4, kernel_size=3, stride=1, padding=1),
            '3': nn.Conv2d(32, num_channels * 9, kernel_size=3, stride=1, padding=1),
            '4': nn.Conv2d(32, num_channels * 16, kernel_size=3, stride=1, padding=1),
        })
        
        self.pixel_shuffle_2x = nn.PixelShuffle(2)
        self.pixel_shuffle_3x = nn.PixelShuffle(3)
        self.pixel_shuffle_4x = nn.PixelShuffle(4)
        
        self._initialize_weights()
    
    def _initialize_weights(self):
        nn.init.orthogonal_(self.conv1.weight, gain=nn.init.calculate_gain('relu'))
        nn.init.orthogonal_(self.conv2.weight, gain=nn.init.calculate_gain('relu'))
        nn.init.orthogonal_(self.conv3.weight, gain=nn.init.calculate_gain('relu'))
        for scale in self.scale_branches:
            nn.init.orthogonal_(self.scale_branches[scale].weight)
    
    def forward(self, x, scale_factor=2):
        scale_key = str(scale_factor)
        if scale_key not in self.scale_branches:
            raise ValueError(f"Unsupported scale factor: {scale_factor}")
        
        x = F.tanh(self.conv1(x))
        x = F.tanh(self.conv2(x))
        x = F.tanh(self.conv3(x))
        
        x = self.scale_branches[scale_key](x)
        
        if scale_factor == 2:
            x = self.pixel_shuffle_2x(x)
        elif scale_factor == 3:
            x = self.pixel_shuffle_3x(x)
        elif scale_factor == 4:
            x = self.pixel_shuffle_4x(x)
        
        return x


def get_espcn_model(scale_factor=2, pretrained=False, device='cpu'):
    model = ESPCN(scale_factor=scale_factor)
    if pretrained:
        pass
    return model.to(device)


def get_multiscale_espcn(pretrained=False, device='cpu'):
    model = ESPCNMultiScale()
    if pretrained:
        pass
    return model.to(device)
