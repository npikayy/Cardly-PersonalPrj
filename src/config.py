import json

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.constants import Environment


class Config(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: Environment = Environment.LOCAL
    APP_VERSION: str = "1.0.0"

    MONGODB_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"
    PUBLIC_BASE_URL: str = "http://localhost:5173"

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://cardly-web-official.vercel.app",
    ]
    SENTRY_DSN: str | None = None

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return []
            if value.startswith("["):
                parsed = json.loads(value)
                return [str(origin) for origin in parsed]
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Config()
