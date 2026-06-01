import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    ZMQ_REQUEST_PORT = int(os.getenv('PYTHON_ZMQ_PORT', 5555))
    ZMQ_RESPONSE_PORT = int(os.getenv('PYTHON_ZMQ_RESPONSE_PORT', 5556))
    ZMQ_HOST = '127.0.0.1'

    MAX_STREAMS = int(os.getenv('MAX_STREAMS', 5))
    TARGET_FPS = int(os.getenv('TARGET_FPS', 15))
    MIN_CPU_FPS = 10

    DEFAULT_SCALE = int(os.getenv('DEFAULT_SCALE', 2))
    ALLOWED_SCALES = [int(x) for x in os.getenv('ALLOWED_SCALES', '2,3,4').split(',')]

    USE_GPU = os.getenv('USE_GPU', 'true').lower() != 'false'
    GPU_DEVICE = int(os.getenv('GPU_DEVICE', 0))

    METRICS_INTERVAL_SEC = int(os.getenv('METRICS_INTERVAL_SEC', 30))

    MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
    MODEL_CACHE_DIR = os.path.join(MODELS_DIR, 'cache')

    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

    @classmethod
    def ensure_dirs(cls):
        os.makedirs(cls.MODEL_CACHE_DIR, exist_ok=True)
