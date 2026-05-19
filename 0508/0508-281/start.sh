#!/bin/bash

echo "=============================================="
echo "  实时物体检测与多目标追踪系统"
echo "  YOLOv5s + TensorRT + DeepSORT"
echo "=============================================="

echo ""
echo "检查Python环境..."
python3 --version

echo ""
echo "安装依赖..."
pip3 install -r requirements.txt

echo ""
echo "启动服务..."
echo "访问 http://localhost:8000 查看前端界面"
echo "按 Ctrl+C 停止服务"
echo "=============================================="

cd backend/api && python3 main.py
