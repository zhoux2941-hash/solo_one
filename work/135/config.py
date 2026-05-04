from pydantic_settings import BaseSettings
from typing import Optional, List
from datetime import timedelta
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "ShortLink Service"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "shortlink"
    
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    
    ELASTICSEARCH_HOSTS: List[str] = ["http://localhost:9200"]
    ELASTICSEARCH_USERNAME: Optional[str] = None
    ELASTICSEARCH_PASSWORD: Optional[str] = None
    ELASTICSEARCH_SSL_VERIFY: bool = True
    ELASTICSEARCH_CA_CERTS: Optional[str] = None
    
    ES_INDEX_PREFIX: str = "clicks"
    ES_INDEX_ROLLOVER_DAYS: int = 1
    ES_WRITE_ALIAS: str = "clicks-write"
    ES_SEARCH_ALIAS: str = "clicks-search"
    
    SHORT_CODE_LENGTH: int = 6
    BASE_URL: str = "http://localhost:8000"
    
    GEOIP2_DATABASE_PATH: str = os.path.join(os.path.dirname(__file__), "data", "GeoLite2-City.mmdb")
    
    CACHE_TTL: int = 3600
    HOT_CACHE_TTL: int = 7200
    CACHE_WARMUP_INTERVAL: int = 600
    HOT_SHORTCODE_LIMIT: int = 100
    HOT_HOURS: int = 1
    
    SINGLEFLIGHT_TIMEOUT: int = 5
    SINGLEFLIGHT_LOCK_TTL: int = 3
    
    QR_VERSION: int = 1
    QR_ERROR_CORRECT: str = "M"
    QR_BOX_SIZE: int = 10
    QR_BORDER: int = 4
    QR_FILL_COLOR: str = "black"
    QR_BACK_COLOR: str = "white"
    
    CSV_CHUNK_SIZE: int = 10 * 1024 * 1024
    DB_BATCH_SIZE: int = 100
    ES_BATCH_SIZE: int = 500
    MAX_UPLOAD_SIZE: int = 1024 * 1024 * 1024
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def REDIS_URL(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    @property
    def QR_ERROR_CORRECT_LEVEL(self) -> int:
        import qrcode
        level_map = {
            'L': qrcode.constants.ERROR_CORRECT_L,
            'M': qrcode.constants.ERROR_CORRECT_M,
            'Q': qrcode.constants.ERROR_CORRECT_Q,
            'H': qrcode.constants.ERROR_CORRECT_H,
        }
        return level_map.get(self.QR_ERROR_CORRECT, qrcode.constants.ERROR_CORRECT_M)

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
