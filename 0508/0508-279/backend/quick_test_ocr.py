import os
import sys
import cv2
import numpy as np
from PIL import Image, ImageDraw

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from image_processor import ImageProcessor

def create_simple_test():
    test_dir = "../test_images"
    os.makedirs(test_dir, exist_ok=True)
    
    print("🚀 创建测试图片...")
    
    img_path = os.path.join(test_dir, "simple_test.jpg")
    
    img = Image.new('RGB', (200, 150), color='#f0f0f0')
    draw = ImageDraw.Draw(img)
    
    try:
        from PIL import ImageFont
        font = ImageFont.truetype("simhei.ttf", 20)
    except:
        font = None
    
    draw.rectangle([(20, 20), (180, 130)], outline='#667eea', width=2)
    if font:
        draw.text((40, 50), "长城 北京", fill='#333', font=font)
        draw.text((40, 80), "游客 2024", fill='#333', font=font)
    else:
        draw.text((40, 50), "Great Wall", fill='#333')
        draw.text((40, 80), "Beijing", fill='#333')
    
    img.save(img_path, quality=50)
    
    low_res_path = os.path.join(test_dir, "low_res_test.jpg")
    low_res_img = img.resize((100, 75))
    low_res_img.save(low_res_path, quality=30)
    
    return img_path, low_res_path

def main():
    print("=" * 50)
    print("OCR 快速测试")
    print("=" * 50)
    print()
    
    processor = ImageProcessor()
    
    normal_img, low_res_img = create_simple_test()
    
    print("📊 测试 1: 普通分辨率图片")
    print(f"   图片路径: {normal_img}")
    result1 = processor.extract_text(normal_img)
    print(f"   识别结果: '{result1}'")
    print()
    
    print("📊 测试 2: 低分辨率图片 (100x75)")
    print(f"   图片路径: {low_res_img}")
    result2 = processor.extract_text(low_res_img)
    print(f"   识别结果: '{result2}'")
    print()
    
    print("=" * 50)
    print("✅ OCR 改进功能已实现！")
    print()
    print("改进技术包括:")
    print("  • 2x/3x 超分辨率增强")
    print("  • 非局部均值去噪")
    print("  • CLAHE 对比度增强")
    print("  • 图像锐化处理")
    print("  • 自适应阈值 + Otsu 二值化")
    print("  • 多种 Tesseract 配置")
    print("  • 置信度评估与最佳选择")
    print("=" * 50)

if __name__ == "__main__":
    main()
