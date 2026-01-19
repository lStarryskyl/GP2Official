"""Utility routes."""

from fastapi import APIRouter
from utils.cache import CacheManager

router = APIRouter()

@router.get("/cache/stats")
async def get_cache_stats():
    """Get Redis cache statistics."""
    return await CacheManager.get_cache_stats()
