from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    NEO4J_DATABASE: str = "neo4j"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
