#!/usr/bin/env python3
"""Quick test script for USB Fingerprint System"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=== USB Fingerprint System Test ===\n")

print("1. Testing imports...")
try:
    from usb_fingerprint.usb_capture import USBCapture
    from usb_fingerprint.feature_extractor import FeatureExtractor
    from usb_fingerprint.ml_model import USBFingerprintModel
    from usb_fingerprint.database import init_db
    print("   ✓ All imports successful")
except Exception as e:
    print(f"   ✗ Import failed: {e}")
    sys.exit(1)

print("\n2. Initializing database...")
try:
    init_db()
    print("   ✓ Database initialized")
except Exception as e:
    print(f"   ✗ Database init failed: {e}")

print("\n3. Testing USB Capture module...")
try:
    capture = USBCapture(sample_count=10)
    devices = capture.list_devices()
    print(f"   ✓ Found {len(devices)} USB devices")
    for i, dev in enumerate(devices[:3], 1):
        print(f"     {i}. 0x{dev.vendor_id:04x}:0x{dev.product_id:04x} - {dev.product}")
    if len(devices) > 3:
        print(f"     ... and {len(devices) - 3} more")
except Exception as e:
    print(f"   ✗ USB Capture failed: {e}")

print("\n4. Testing Feature Extractor...")
try:
    extractor = FeatureExtractor()
    print("   ✓ Feature Extractor initialized")
except Exception as e:
    print(f"   ✗ Feature Extractor failed: {e}")

print("\n5. Testing ML Model...")
try:
    model = USBFingerprintModel()
    loaded = model.load_model()
    if loaded:
        print("   ✓ ML Model loaded existing model")
    else:
        print("   ✓ ML Model initialized (new model)")
except Exception as e:
    print(f"   ✗ ML Model failed: {e}")

print("\n6. Testing API module...")
try:
    from usb_fingerprint.api import app
    print("   ✓ FastAPI app initialized")
    print(f"   ✓ Available routes: {len(app.routes)}")
except Exception as e:
    print(f"   ✗ API module failed: {e}")

print("\n7. Testing CLI module...")
try:
    from usb_fingerprint.cli import main
    print("   ✓ CLI module initialized")
except Exception as e:
    print(f"   ✗ CLI module failed: {e}")

print("\n=== All tests completed! ===")
print("\nNext steps:")
print("  1. Run 'usb-fingerprint device list' to see connected devices")
print("  2. Run 'usb-fingerprint server' to start the API server")
print("  3. Visit http://localhost:8000/docs for API documentation")
