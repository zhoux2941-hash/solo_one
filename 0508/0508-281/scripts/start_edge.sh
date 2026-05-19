#!/bin/bash

CAMERA_ID=$1
REGION=$2

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

if [ -z "$CAMERA_ID" ]; then
    CAMERA_ID="cam_01"
fi

if [ -z "$REGION" ]; then
    REGION="region_a"
fi

echo "=============================================="
echo "  启动分布式追踪 - EDGE 节点"
echo "  Camera ID: $CAMERA_ID"
echo "  Region: $REGION"
echo "=============================================="

sed -i 's/is_master: true/is_master: false/' config/config.yaml
sed -i "s/camera_id: .*/camera_id: $CAMERA_ID/" config/config.yaml
sed -i "s/region: .*/region: $REGION/" config/config.yaml

echo "配置已更新为 EDGE 模式"
echo ""

python backend/api/main.py
