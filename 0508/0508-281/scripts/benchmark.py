#!/usr/bin/env python3
import time
import cv2
import numpy as np
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.models.yolov5_trt import YOLOv5TRT


def benchmark(batch_size=8, iterations=100, input_size=640):
    print("=" * 50)
    print("YOLOv5 TensorRT 性能基准测试")
    print("=" * 50)
    
    detector = YOLOv5TRT("config/config.yaml")
    
    print(f"\n测试参数:")
    print(f"  批处理大小: {batch_size}")
    print(f"  迭代次数: {iterations}")
    print(f"  输入尺寸: {input_size}x{input_size}")
    
    test_frames = []
    for _ in range(batch_size):
        frame = np.random.randint(0, 255, (input_size, input_size, 3), dtype=np.uint8)
        test_frames.append(frame)
    
    print(f"\n预热中...")
    for _ in range(10):
        detector.detect_batch(test_frames)
    
    print(f"\n开始基准测试...")
    start_time = time.time()
    
    total_detections = 0
    for i in range(iterations):
        results = detector.detect_batch(test_frames)
        total_detections += sum(len(r) for r in results)
        
        if (i + 1) % 20 == 0:
            elapsed = time.time() - start_time
            fps = ((i + 1) * batch_size) / elapsed
            print(f"  进度 {i+1}/{iterations} - FPS: {fps:.2f}")
    
    total_time = time.time() - start_time
    total_frames = iterations * batch_size
    avg_fps = total_frames / total_time
    avg_time_per_frame = (total_time / total_frames) * 1000
    
    print("\n" + "=" * 50)
    print("测试结果:")
    print(f"  总帧数: {total_frames}")
    print(f"  总耗时: {total_time:.2f} 秒")
    print(f"  平均 FPS: {avg_fps:.2f}")
    print(f"  单帧平均耗时: {avg_time_per_frame:.2f} ms")
    print(f"  总检测数: {total_detections}")
    print("=" * 50)
    
    if avg_fps >= 15:
        print("\n✅ 性能达标！ (> 15 FPS)")
    else:
        print("\n⚠️  性能未达标，建议:")
        print("  - 减少批处理大小")
        print("  - 使用 FP16 推理")
        print("  - 降低输入分辨率")
        print("  - 优化 TensorRT 引擎配置")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='YOLOv5 TensorRT 性能基准测试')
    parser.add_argument('--batch-size', type=int, default=8, help='批处理大小')
    parser.add_argument('--iterations', type=int, default=100, help='迭代次数')
    parser.add_argument('--img-size', type=int, default=640, help='输入尺寸')
    
    args = parser.parse_args()
    
    benchmark(
        batch_size=args.batch_size,
        iterations=args.iterations,
        input_size=args.img_size
    )
