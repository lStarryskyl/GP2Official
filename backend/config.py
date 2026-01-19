"""Application configuration."""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings."""
    
    # App
    app_name: str = "Architect AI"
    debug: bool = True
    environment: str = "development"
    
    # Database / Frontend
    mongo_url: str = "mongodb://localhost:27017"
    database_name: str = "architect_ai"
    use_in_memory_db: bool = False
    frontend_origin: str = "http://localhost:3000"
    
    # JWT - Security critical: no defaults for production
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    refresh_token_expire_days: int = 14
    
    # AI / LLM Configuration
    llm_provider: str = "gemini"
    llm_api_key: Optional[str] = None
    llm_model_name: str = "gpt-4"
    openai_api_key: Optional[str] = None
    huggingface_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    claude_api_key: Optional[str] = None
    ollama_base_url: str = "http://localhost:11434"
    
    # Logo and Branding
    logo_path: str = "../frontend/public/logo.png"
    
    # PlantUML / external services
    plantuml_api_host: Optional[str] = None
    plantuml_api_key: Optional[str] = None
    
    # Supabase Configuration
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_key: Optional[str] = None
    use_supabase: bool = False
    
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

    @property 
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"
        
    @property
    def database_url(self) -> str:
        """Get the appropriate database URL."""
        if self.use_in_memory_db:
            return "memory://localhost"
        return self.mongo_url


settings = Settings()

# Log settings for debugging (remove sensitive data)
import logging
_logger = logging.getLogger(__name__)
_logger.info(f"Settings loaded: environment={settings.environment}, use_supabase={settings.use_supabase}, supabase_url={'set' if settings.supabase_url else 'not set'}")

# Validate production configuration at startup (skip if env vars not fully set)
try:
    settings.validate_production_config()
except ValueError as e:
    _logger.warning(f"Production config validation skipped: {e}")

def _resolve_llm_api_key(cfg: Settings) -> Optional[str]:
    """Prefer provider-specific keys if generic one not supplied."""
    if cfg.llm_api_key:
        return cfg.llm_api_key
    provider = (cfg.llm_provider or "").lower()
    if provider in {"openai", "gpt"} and cfg.openai_api_key:
        return cfg.openai_api_key
    if provider in {"gemini", "google", "google_gemini"} and cfg.gemini_api_key:
        return cfg.gemini_api_key
    if provider in {"huggingface", "hf"} and cfg.huggingface_api_key:
        return cfg.huggingface_api_key
    return cfg.llm_api_key


settings.llm_api_key = _resolve_llm_api_key(settings)
