#!/usr/bin/env python3
import yaml
import sys

config_path = "config/config.yaml"

camera_id = sys.argv[1] if len(sys.argv) > 1 else "cam_01"
region = sys.argv[2] if len(sys.argv) > 2 else "region_a"
port = int(sys.argv[3]) if len(sys.argv) > 3 else 8000

with open(config_path, 'r') as f:
    config = yaml.safe_load(f)

config['distributed']['is_master'] = False
config['distributed']['camera_id'] = camera_id
config['distributed']['region'] = region
config['server']['port'] = port

with open(config_path, 'w') as f:
    yaml.dump(config, f, default_flow_style=False)

print("配置已更新为 EDGE 模式")
print(f"  camera_id: {camera_id}")
print(f"  region: {region}")
print(f"  Web port: {port}")
