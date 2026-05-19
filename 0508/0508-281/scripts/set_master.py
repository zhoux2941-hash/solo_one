#!/usr/bin/env python3
import yaml
import sys

config_path = "config/config.yaml"

with open(config_path, 'r') as f:
    config = yaml.safe_load(f)

config['distributed']['is_master'] = True
config['distributed']['camera_id'] = 'cam_master'
config['server']['port'] = 8000

with open(config_path, 'w') as f:
    yaml.dump(config, f, default_flow_style=False)

print("配置已更新为 MASTER 模式")
print(f"  camera_id: {config['distributed']['camera_id']}")
print(f"  Web port: {config['server']['port']}")
