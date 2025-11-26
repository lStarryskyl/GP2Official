"""Application configuration."""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings."""
    
    # App
    app_name: str = "Architect AI"
    debug: bool = True
    
    # Database / Frontend
    mongo_url: str = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    database_name: str = "architect_ai"
    frontend_origin: str = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
    
    # JWT
    secret_key: str = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    
    # LLM
    llm_provider: str = os.environ.get("LLM_PROVIDER", "stub")
    llm_api_key: Optional[str] = os.environ.get("LLM_API_KEY")
    llm_model_name: str = os.environ.get("LLM_MODEL_NAME", "gpt-4")
    huggingface_api_key: Optional[str] = os.environ.get("HUGGINGFACE_API_KEY")
    
    class Config:
        env_file = ".env"


settings = Settings()
