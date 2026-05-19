#!/usr/bin/env python3
import os
import argparse
import subprocess


def export_yolov5_engine(weights_path, output_path, input_size=640, batch_size=8, fp16=True):
    print(f"开始导出 YOLOv5 模型到 TensorRT 引擎...")
    print(f"权重文件: {weights_path}")
    print(f"输出路径: {output_path}")
    print(f"输入尺寸: {input_size}")
    print(f"批处理大小: {batch_size}")
    print(f"FP16: {fp16}")
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    try:
        import torch
        import torch.nn as nn
        
        print("\n尝试使用 PyTorch 导出 ONNX...")
        
        model = torch.hub.load('ultralytics/yolov5', 'custom', path=weights_path, verbose=False)
        model.eval()
        
        dummy_input = torch.randn(batch_size, 3, input_size, input_size)
        onnx_path = output_path.replace('.engine', '.onnx')
        
        torch.onnx.export(
            model,
            dummy_input,
            onnx_path,
            opset_version=12,
            input_names=['images'],
            output_names=['output'],
            dynamic_axes=None
        )
        
        print(f"ONNX 模型已保存: {onnx_path}")
        
        trtexec_path = '/usr/src/tensorrt/bin/trtexec'
        if os.path.exists(trtexec_path):
            print("\n使用 TensorRT 转换引擎...")
            
            cmd = [
                trtexec_path,
                f'--onnx={onnx_path}',
                f'--saveEngine={output_path}',
                f'--batch={batch_size}',
                f'--workspace=4096',
                '--verbose'
            ]
            
            if fp16:
                cmd.append('--fp16')
            
            subprocess.run(cmd, check=True)
            print(f"TensorRT 引擎已保存: {output_path}")
        else:
            print(f"未找到 trtexec，请手动安装 TensorRT")
            print(f"ONNX 模型已生成: {onnx_path}")
            
    except Exception as e:
        print(f"导出失败: {e}")
        print("请确保已正确安装 PyTorch 和 TensorRT")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='导出 YOLOv5 TensorRT 引擎')
    parser.add_argument('--weights', type=str, default='models/yolov5s.pt', help='PyTorch 权重路径')
    parser.add_argument('--output', type=str, default='models/yolov5s.engine', help='输出引擎路径')
    parser.add_argument('--img-size', type=int, default=640, help='输入尺寸')
    parser.add_argument('--batch-size', type=int, default=8, help='批处理大小')
    parser.add_argument('--fp16', action='store_true', default=True, help='使用 FP16 推理')
    
    args = parser.parse_args()
    
    export_yolov5_engine(
        weights_path=args.weights,
        output_path=args.output,
        input_size=args.img_size,
        batch_size=args.batch_size,
        fp16=args.fp16
    )
