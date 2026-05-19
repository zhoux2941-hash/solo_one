import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
LOG_DIR = BASE_DIR / "logs"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'usb_fingerprint.db'}")

SAMPLE_COUNT = 100
TIMEOUT_MS = 5000

# 虚拟机环境优化配置
VM_SAMPLE_COUNT = 200
VM_MULTI_SESSION_COUNT = 3
VM_SIMILARITY_THRESHOLD = 0.75
NORMAL_SIMILARITY_THRESHOLD = 0.85

MODEL_PATH = MODEL_DIR / "fingerprint_model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"

for directory in [DATA_DIR, MODEL_DIR, LOG_DIR]:
    directory.mkdir(exist_ok=True, parents=True)
