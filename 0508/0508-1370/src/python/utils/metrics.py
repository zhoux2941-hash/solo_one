import numpy as np
import cv2
from skimage.metrics import structural_similarity as ssim
from skimage.metrics import peak_signal_noise_ratio as psnr


def calculate_psnr(original, enhanced, data_range=255.0):
    if original.shape != enhanced.shape:
        enhanced = cv2.resize(enhanced, (original.shape[1], original.shape[0]))
    
    if len(original.shape) == 3:
        original_y = cv2.cvtColor(original, cv2.COLOR_BGR2YCrCb)[:, :, 0]
        enhanced_y = cv2.cvtColor(enhanced, cv2.COLOR_BGR2YCrCb)[:, :, 0]
    else:
        original_y = original
        enhanced_y = enhanced
    
    return float(psnr(original_y, enhanced_y, data_range=data_range))


def calculate_ssim(original, enhanced, data_range=255.0):
    if original.shape != enhanced.shape:
        enhanced = cv2.resize(enhanced, (original.shape[1], original.shape[0]))
    
    if len(original.shape) == 3:
        original_gray = cv2.cvtColor(original, cv2.COLOR_BGR2GRAY)
        enhanced_gray = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)
    else:
        original_gray = original
        enhanced_gray = enhanced
    
    return float(ssim(original_gray, enhanced_gray, data_range=data_range))


def calculate_quality_metrics(original, enhanced):
    psnr_value = calculate_psnr(original, enhanced)
    ssim_value = calculate_ssim(original, enhanced)
    return {
        'psnr': psnr_value,
        'ssim': ssim_value
    }
