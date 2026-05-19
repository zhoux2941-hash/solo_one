#!/usr/bin/env python3
"""验证所有模块可以正常导入"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("模块导入验证")
print("=" * 60)

modules = [
    ("config", "配置模块"),
    ("database", "数据库模块"),
    ("usb_capture", "USB采集模块"),
    ("feature_extractor", "特征提取模块（含VM优化）"),
    ("ml_model", "机器学习模型模块"),
    ("api", "API服务模块"),
    ("cli", "命令行工具模块"),
]

all_ok = True

for module_name, description in modules:
    try:
        __import__(f"usb_fingerprint.{module_name}")
        print(f"✓ {description:30s} - 导入成功")
    except Exception as e:
        print(f"✗ {description:30s} - 导入失败: {e}")
        all_ok = False

print("\n" + "=" * 60)

if all_ok:
    print("所有模块导入成功!")
    print("\n改进的主要功能:")
    print("  1. 异常值过滤 (Z-score + IQR)")
    print("  2. 数据平滑 (移动平均 + 中值滤波)")
    print("  3. 鲁棒统计特征 (中位数, MAD, IQR)")
    print("  4. 虚拟机环境自动检测")
    print("  5. 自适应相似度阈值")
    print("  6. 多会话特征融合")
else:
    print("部分模块导入失败，请检查错误信息")

print("=" * 60)
