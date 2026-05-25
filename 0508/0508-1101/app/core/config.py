from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./gate_control.db"
    execution_queue_capacity: int = 1000
    receipt_pull_interval_seconds: int = 60
    receipt_pull_lookback_minutes: int = 30
    upstream_endpoint: str = "http://upstream.local/ack"
    interval_endpoint: str = "http://interval.local/ack"
    manual_endpoint: str = "http://manual.local/ack"
    device_endpoint: str = "http://device.local/exec"

    class Config:
        env_prefix = "GATE_"


settings = Settings()
