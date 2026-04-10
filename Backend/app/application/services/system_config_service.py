import asyncio
from typing import Optional, Dict

_cache: Optional[Dict[str, str]] = None
_cache_lock = asyncio.Lock()


async def get_system_config(repo) -> Dict[str, str]:
    """Return cached system config, loading from DB on first call."""
    global _cache
    if _cache is not None:
        return dict(_cache)  # Return copy to prevent mutation
    async with _cache_lock:
        if _cache is None:
            _cache = await repo.get_all()
    return dict(_cache)


async def invalidate_cache() -> None:
    """Invalidate the in-memory config cache so next call re-reads from DB."""
    global _cache
    _cache = None
