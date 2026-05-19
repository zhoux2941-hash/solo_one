#!/bin/bash

echo "=========================================="
echo "Jetson Nano 环境安装脚本"
echo "=========================================="

set -e

echo ""
echo "[1/5] 更新系统包..."
sudo apt-get update
sudo apt-get upgrade -y

echo ""
echo "[2/5] 安装系统依赖..."
sudo apt-get install -y \
    python3-pip \
    python3-dev \
    build-essential \
    portaudio19-dev \
    libasound2-dev \
    libsndfile1-dev \
    ffmpeg \
    git \
    cmake \
    libatlas-base-dev \
    gfortran

echo ""
echo "[3/5] 安装Python基础依赖..."
pip3 install --upgrade pip setuptools wheel

echo ""
echo "[4/5] 安装Python包..."
pip3 install numpy scipy PyYAML tqdm soundfile librosa
pip3 install pyaudio
pip3 install onnx onnxruntime-gpu

echo ""
echo "[5/5] 安装webrtc-audio-processing..."
cd /tmp
git clone https://github.com/xiongyihui/python-webrtc-audio-processing.git
cd python-webrtc-audio-processing
python3 setup.py build
sudo python3 setup.py install
cd ..
rm -rf python-webrtc-audio-processing

echo ""
echo "=========================================="
echo "基础依赖安装完成！"
echo ""
echo "TensorRT 安装说明:"
echo "  Jetson Nano 预装了TensorRT，请确保:"
echo "  1. 已安装 JetPack 4.6+"
echo "  2. 安装 pycuda: pip3 install pycuda"
echo "  3. 验证: python3 -c 'import tensorrt'"
echo ""
echo "PyTorch 安装说明:"
echo "  请从 NVIDIA 官方下载适配 Jetson 的 PyTorch 版本"
echo "  参考: https://forums.developer.nvidia.com/t/pytorch-for-jetson-version-1-12-now-available/72048"
echo ""
echo "安装完成后，请运行: python3 main.py --mode test"
echo "=========================================="
