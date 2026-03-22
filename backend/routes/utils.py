"""Utility routes."""

from fastapi import APIRouter
from utils.cache import CacheManager, redis_client
from config import settings

router = APIRouter()

@router.get("/redis/status")
async def get_redis_status():
    """Get Redis connection status."""
    return {
        "configured": bool(settings.redis_url),
        "connected": redis_client is not None,
        "url": "configured" if settings.redis_url else "not configured"
    }

@router.get("/cache/stats")
async def get_cache_stats():
    """Get Redis cache statistics."""
    return await CacheManager.get_cache_stats()

@router.get("/config/status")
async def get_config_status():
    """Get configuration status."""
    return {
        "llm_provider": settings.llm_provider,
        "llm_api_key_set": bool(settings.llm_api_key),
        "gemini_key_set": bool(settings.gemini_api_key),
        "database_configured": bool(settings.database_url),
        "environment": settings.environment
    }
