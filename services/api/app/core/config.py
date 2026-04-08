from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://nora:nora_pass@postgres:5432/nora_db"
    DATABASE_SYNC_URL: str = "postgresql://nora:nora_pass@postgres:5432/nora_db"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "nora-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"
    # Phase 2: OpenAI integration (optional — falls back to simulation when not set)
    OPENAI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
