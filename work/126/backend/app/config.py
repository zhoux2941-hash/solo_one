from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path

class Settings(BaseSettings):
    APP_NAME: str = "法庭弹道分析工具"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    RESULTS_DIR: Path = BASE_DIR / "data" / "results"
    REPORTS_DIR: Path = BASE_DIR / "data" / "reports"
    
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/ballistic.db"
    
    MAX_FILE_SIZE: int = 500 * 1024 * 1024
    ALLOWED_EXTENSIONS: list = [".las", ".ply"]
    ALLOWED_IMAGE_EXTENSIONS: list = [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"]
    
    SAMPLES_DIR: Path = BASE_DIR / "data" / "samples"
    IMAGES_DIR: Path = BASE_DIR / "data" / "images"
    FEATURES_DIR: Path = BASE_DIR / "data" / "features"
    
    class Config:
        env_file = ".env"

settings = Settings()

def ensure_directories():
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    settings.SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    settings.IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    settings.FEATURES_DIR.mkdir(parents=True, exist_ok=True)
