# backend/app/core/config.py
import os
from pydantic import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Storm EOC Dashboard Backend"

    # Database Configuration
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "db")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "storm_eoc")
    # Use asyncpg driver for FastAPI
    SQLALCHEMY_DATABASE_URI: str = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}/{POSTGRES_DB}"
    # Synchronous URI for use in Celery workers (if not using asyncio in workers)
    SQLALCHEMY_DATABASE_URI_SYNC: str = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}/{POSTGRES_DB}"

    # Celery Configuration
    REDIS_HOST: str = os.getenv("REDIS_HOST", "redis")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    CELERY_BROKER_URL: str = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
    CELERY_RESULT_BACKEND: str = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"

    # External API Keys
    X_BEARER_TOKEN: str = os.getenv("X_BEARER_TOKEN")
    NOAA_API_KEY: str = os.getenv("NOAA_API_KEY")
    PLANET_API_KEY: str = os.getenv("PLANET_API_KEY")

    class Config:
        case_sensitive = True

settings = Settings()
