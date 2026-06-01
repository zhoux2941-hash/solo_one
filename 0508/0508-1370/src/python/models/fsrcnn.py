import torch
import torch.nn as nn
import torch.nn.functional as F


class FSRCNN(nn.Module):
    def __init__(self, scale_factor=2, num_channels=3, d=56, s=12, m=4):
        super(FSRCNN, self).__init__()
        self.scale_factor = scale_factor
        
        self.first_part = nn.Sequential(
            nn.Conv2d(num_channels, d, kernel_size=5, stride=1, padding=2),
            nn.PReLU(d)
        )
        
        self.mid_part = [nn.Conv2d(d, s, kernel_size=1, stride=1, padding=0), nn.PReLU(s)]
        for _ in range(m):
            self.mid_part.extend([nn.Conv2d(s, s, kernel_size=3, stride=1, padding=1), nn.PReLU(s)])
        self.mid_part.extend([nn.Conv2d(s, d, kernel_size=1, stride=1, padding=0), nn.PReLU(d)])
        self.mid_part = nn.Sequential(*self.mid_part)
        
        self.last_part = nn.ConvTranspose2d(
            d, num_channels, kernel_size=9, stride=scale_factor,
            padding=4, output_padding=scale_factor - 1
        )
        
        self._initialize_weights()
    
    def _initialize_weights(self):
        for m in self.first_part:
            if isinstance(m, nn.Conv2d):
                nn.init.normal_(m.weight, mean=0.0, std=0.001)
                nn.init.zeros_(m.bias)
        
        for m in self.mid_part:
            if isinstance(m, nn.Conv2d):
                nn.init.normal_(m.weight, mean=0.0, std=0.001)
                nn.init.zeros_(m.bias)
        
        nn.init.normal_(self.last_part.weight, mean=0.0, std=0.001)
        nn.init.zeros_(self.last_part.bias)
    
    def forward(self, x):
        x = self.first_part(x)
        x = self.mid_part(x)
        x = self.last_part(x)
        return x


class FSRCNNMultiScale(nn.Module):
    def __init__(self, num_channels=3, d=56, s=12, m=4):
        super(FSRCNNMultiScale, self).__init__()
        self.num_channels = num_channels
        
        self.first_part = nn.Sequential(
            nn.Conv2d(num_channels, d, kernel_size=5, stride=1, padding=2),
            nn.PReLU(d)
        )
        
        self.mid_part = [nn.Conv2d(d, s, kernel_size=1, stride=1, padding=0), nn.PReLU(s)]
        for _ in range(m):
            self.mid_part.extend([nn.Conv2d(s, s, kernel_size=3, stride=1, padding=1), nn.PReLU(s)])
        self.mid_part.extend([nn.Conv2d(s, d, kernel_size=1, stride=1, padding=0), nn.PReLU(d)])
        self.mid_part = nn.Sequential(*self.mid_part)
        
        self.scale_branches = nn.ModuleDict({
            '2': nn.ConvTranspose2d(d, num_channels, kernel_size=9, stride=2, padding=4, output_padding=1),
            '3': nn.ConvTranspose2d(d, num_channels, kernel_size=9, stride=3, padding=4, output_padding=2),
            '4': nn.ConvTranspose2d(d, num_channels, kernel_size=9, stride=4, padding=4, output_padding=3),
        })
        
        self._initialize_weights()
    
    def _initialize_weights(self):
        for m in self.first_part:
            if isinstance(m, nn.Conv2d):
                nn.init.normal_(m.weight, mean=0.0, std=0.001)
                nn.init.zeros_(m.bias)
        
        for m in self.mid_part:
            if isinstance(m, nn.Conv2d):
                nn.init.normal_(m.weight, mean=0.0, std=0.001)
                nn.init.zeros_(m.bias)
        
        for scale in self.scale_branches:
            nn.init.normal_(self.scale_branches[scale].weight, mean=0.0, std=0.001)
            nn.init.zeros_(self.scale_branches[scale].bias)
    
    def forward(self, x, scale_factor=2):
        scale_key = str(scale_factor)
        if scale_key not in self.scale_branches:
            raise ValueError(f"Unsupported scale factor: {scale_factor}")
        
        x = self.first_part(x)
        x = self.mid_part(x)
        x = self.scale_branches[scale_key](x)
        return x


def get_fsrcnn_model(scale_factor=2, pretrained=False, device='cpu'):
    model = FSRCNN(scale_factor=scale_factor)
    if pretrained:
        pass
    return model.to(device)


def get_multiscale_fsrcnn(pretrained=False, device='cpu'):
    model = FSRCNNMultiScale()
    if pretrained:
        pass
    return model.to(device)
