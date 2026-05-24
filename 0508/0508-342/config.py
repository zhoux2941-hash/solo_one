from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "sqlite:///./leakage_alerts.db"
    time_window_minutes: int = 30
    alert_review_window_hours: int = 24
    async_task_interval_minutes: int = 5
    snapshot_retention_days: int = 30
    host: str = "0.0.0.0"
    port: int = 8000

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
