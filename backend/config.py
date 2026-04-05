"""Application configuration."""

from pydantic_settings import BaseSettings
from typing import Optional
import os

def _coerce_bool_env(key: str) -> None:
    value = os.getenv(key)
    if not value:
        return
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "y", "on", "0", "false", "no", "n", "off"}:
        return
    os.environ[key] = "false"

_coerce_bool_env("DEBUG")

class Settings(BaseSettings):
    """Application settings."""

    # App
    app_name: str = "Architect AI"
    debug: bool = True
    environment: str = "development"

    # Database - Railway PostgreSQL URL
    database_url: str = ""  # Set by Railway: postgresql://...

    # Frontend
    frontend_origin: str = "http://localhost:3000"

    # JWT - Security critical: no defaults for production
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    refresh_token_expire_days: int = 14

    # AI - OpenAI (primary) + Gemini (fallback)
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    gemini_api_key: str = "AIzaSyCqHJnleUy8ZWpmzoKulcKLXHECmAB-UOw"
    gemini_pro_model: str = "gemini-2.0-flash"     # Flash has higher quota (2.5-pro hits limits fast)
    gemini_flash_model: str = "gemini-2.0-flash"  # For fast tasks
    gemini_fallback_model: str = "gemini-2.0-flash"  # Fallback

    # Legacy AI fields kept so existing code that references them doesn't break
    llm_provider: str = "gemini"
    llm_api_key: Optional[str] = None
    llm_model_name: str = "gemini-2.0-flash"
    ollama_base_url: str = "http://localhost:11434"

    # Logo and Branding
    logo_path: str = "../frontend/public/logo.png"

    # PlantUML / external services
    plantuml_api_host: Optional[str] = None
    plantuml_api_key: Optional[str] = None

    # Redis Cache
    redis_url: Optional[str] = None
    cache_ttl: int = 3600  # 1 hour default

    # Database Pool Settings
    db_min_connections: int = 1
    db_max_connections: int = 10
    db_connect_timeout: int = 30
    db_retry_attempts: int = 3

    class Config:
        env_file = ".env"
        case_sensitive = False

    def validate_production_config(self) -> None:
        """Validate critical settings for production deployment."""
        if self.environment == "production":
            if self.secret_key == "your-secret-key-change-in-production":
                raise ValueError("SECRET_KEY must be set for production!")
            if len(self.secret_key) < 32:
                raise ValueError("SECRET_KEY must be at least 32 characters long!")
            if self.debug:
                raise ValueError("DEBUG must be False in production!")
            if not self.database_url:
                raise ValueError("DATABASE_URL must be set for production!")

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"


settings = Settings()

# Prefer OpenAI when available; keep legacy Gemini keys as fallback
if settings.openai_api_key:
    settings.llm_provider = "openai"
    settings.llm_api_key = settings.openai_api_key
    settings.llm_model_name = settings.openai_model
elif not settings.llm_api_key:
    settings.llm_api_key = settings.gemini_api_key

# Log settings for debugging (no sensitive data)
import logging
_logger = logging.getLogger(__name__)
_logger.info(
    f"Settings loaded: environment={settings.environment}, "
    f"gemini_api_key={'set' if settings.gemini_api_key else 'not set'}, "
    f"database_url={'set' if settings.database_url else 'not set'}"
)

# Validate production configuration at startup
try:
    settings.validate_production_config()
except ValueError as e:
    _logger.warning(f"Production config validation: {e}")
