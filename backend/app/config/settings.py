"""Application configuration via environment variables."""

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings loaded from `.env`."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "FeedbackIQ API"
    debug: bool = True
    api_prefix: str = "/api"

    database_url: str = "sqlite:///./feedbackiq.db"

    secret_key: str = "change-me-to-a-long-random-secret-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7
    algorithm: str = "HS256"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    mock_ai: bool = False
    sentiment_model: str = "distilbert-base-uncased-finetuned-sst-2-english"
    embedding_model: str = "all-MiniLM-L6-v2"
    faiss_index_path: str = "./data/faiss_index.bin"
    faiss_id_map_path: str = "./data/faiss_ids.json"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors(cls, value: str | List[str]) -> str:
        if isinstance(value, list):
            return ",".join(value)
        return value

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
