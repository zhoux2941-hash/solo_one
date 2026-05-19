#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "=============================================="
echo "  启动分布式追踪 - MASTER 节点"
echo "=============================================="

sed -i 's/is_master: false/is_master: true/' config/config.yaml
sed -i 's/camera_id: cam_[0-9]*/camera_id: cam_master/' config/config.yaml

echo "配置已更新为 MASTER 模式"
echo ""

python backend/api/main.py
