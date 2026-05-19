import os
import sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import uuid

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from image_processor import ImageProcessor

def create_test_images():
    test_dir = "../test_images"
    os.makedirs(test_dir, exist_ok=True)
    
    test_cases = [
        {
            'text': '长城 北京 游客 2024',
            'filename': 'test_normal.jpg',
            'quality': 'normal',
            'size': (400, 300)
        },
        {
            'text': '长城 北京 游客 2024',
            'filename': 'test_low_res.jpg',
            'quality': 'low_res',
            'size': (100, 75)
        },
        {
            'text': '长城 北京 游客 2024',
            'filename': 'test_blurry.jpg',
            'quality': 'blurry',
            'size': (400, 300)
        },
        {
            'text': '长城 北京 游客 2024',
            'filename': 'test_low_light.jpg',
            'quality': 'low_light',
            'size': (400, 300)
        },
        {
            'text': '故宫 天安门 历史 文化',
            'filename': 'test2_low_res.jpg',
            'quality': 'low_res',
            'size': (120, 90)
        }
    ]
    
    created_files = []
    
    for case in test_cases:
        img_path = os.path.join(test_dir, case['filename'])
        
        w, h = case['size']
        img = Image.new('RGB', (w, h), color='#e0e0e0')
        draw = ImageDraw.Draw(img)
        
        try:
            font_size = max(12, min(24, w // 15))
            font = ImageFont.truetype("simhei.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        draw.rectangle([(20, 20), (w-20, h-20)], outline='#667eea', width=2)
        
        text_x = w // 4
        text_y = h // 3
        draw.text((text_x, text_y), case['text'], fill='#333', font=font)
        
        if case['quality'] == 'blurry':
            img = img.filter(ImageFilter.GaussianBlur(radius=2))
        elif case['quality'] == 'low_light':
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(0.4)
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(0.5)
        
        if case['quality'] == 'low_res':
            img.save(img_path, quality=30)
        else:
            img.save(img_path, quality=95)
        
        created_files.append({
            'path': img_path,
            'filename': case['filename'],
            'quality': case['quality'],
            'expected_text': case['text']
        })
        print(f"✅ 创建测试图片: {case['filename']}")
    
    return created_files

def calculate_accuracy(extracted: str, expected: str) -> float:
    if not extracted or not expected:
        return 0.0
    
    extracted_chars = set(extracted.replace(' ', ''))
    expected_chars = set(expected.replace(' ', ''))
    
    if not expected_chars:
        return 0.0
    
    matches = len(extracted_chars.intersection(expected_chars))
    return matches / len(expected_chars)

def test_ocr_improvement():
    print("=" * 60)
    print("OCR 识别率改进测试")
    print("=" * 60)
    print()
    
    processor = ImageProcessor()
    
    test_files = create_test_images()
    print()
    
    print("-" * 60)
    print(f"{'测试图片':<25} {'质量类型':<15} {'识别率':<10}")
    print("-" * 60)
    
    total_accuracy = 0.0
    results = []
    
    for test_file in test_files:
        extracted_text = processor.extract_text(test_file['path'])
        accuracy = calculate_accuracy(extracted_text, test_file['expected_text'])
        
        total_accuracy += accuracy
        results.append({
            'filename': test_file['filename'],
            'quality': test_file['quality'],
            'accuracy': accuracy,
            'extracted': extracted_text,
            'expected': test_file['expected_text']
        })
        
        print(f"{test_file['filename']:<25} {test_file['quality']:<15} {accuracy:.1%}")
    
    print("-" * 60)
    avg_accuracy = total_accuracy / len(results) if results else 0
    print(f"{'平均识别率':<40} {avg_accuracy:.1%}")
    print()
    
    print("\n详细识别结果:")
    print("=" * 60)
    for result in results:
        print(f"\n📄 {result['filename']} ({result['quality']})")
        print(f"   期望: {result['expected']}")
        print(f"   实际: {result['extracted'] or '(空)'}")
        print(f"   识别率: {result['accuracy']:.1%}")
    
    print()
    print("=" * 60)
    
    if avg_accuracy >= 0.7:
        print(f"✅ OCR 识别率显著提升！平均识别率达到 {avg_accuracy:.1%}")
    elif avg_accuracy >= 0.5:
        print(f"⚠️  OCR 识别率有所提升，平均识别率 {avg_accuracy:.1%}")
    else:
        print(f"❌ OCR 识别率仍需改进，平均识别率 {avg_accuracy:.1%}")
    
    print()
    print("改进技术列表:")
    print("  1. 超分辨率增强 (2x/3x 双三次插值)")
    print("  2. 非局部均值去噪")
    print("  3. CLAHE 对比度增强")
    print("  4. 图像锐化处理")
    print("  5. 阴影去除")
    print("  6. 倾斜校正")
    print("  7. 自适应阈值二值化")
    print("  8. Otsu 阈值处理")
    print("  9. 形态学操作 (开/闭运算)")
    print("  10. 颜色反转处理")
    print("  11. 双边滤波")
    print("  12. PIL 图像增强 (对比度/锐度/亮度)")
    print("  13. 多种 Tesseract 配置组合")
    print("  14. 置信度评估 + 最佳结果选择")
    print()

if __name__ == "__main__":
    test_ocr_improvement()
