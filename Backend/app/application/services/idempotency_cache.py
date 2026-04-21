"""D-50 / D-53: in-memory idempotency + rate limit cache for Phase Gate endpoint.

Caveat: in-memory only; clears on app restart; does NOT cross process/worker boundaries.
Redis upgrade deferred to v3.0 ADV-04.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Optional


TTL_MINUTES = 10
RATE_LIMIT_SECONDS = 10  # D-50: 10s per (user_id, project_id)


@dataclass
class CachedResponse:
    value: Any
    stored_at: datetime


_cache: dict[tuple, CachedResponse] = {}
_last_request: dict[tuple, datetime] = {}


def check_rate_limit(user_id: int, project_id: int) -> Optional[float]:
    """Return seconds until next allowed request, or None if allowed now.

    D-50: 10-second sliding window per (user_id, project_id) pair.
    """
    key = (user_id, project_id)
    last = _last_request.get(key)
    if last is None:
        return None
    elapsed = (datetime.utcnow() - last).total_seconds()
    if elapsed < RATE_LIMIT_SECONDS:
        return RATE_LIMIT_SECONDS - elapsed
    return None


def record_request(user_id: int, project_id: int) -> None:
    _last_request[(user_id, project_id)] = datetime.utcnow()


def lookup(user_id: int, project_id: int, idempotency_key: str) -> Optional[Any]:
    """Return cached response for (user, project, key) if still within TTL."""
    entry = _cache.get((user_id, project_id, idempotency_key))
    if entry is None:
        return None
    if datetime.utcnow() - entry.stored_at > timedelta(minutes=TTL_MINUTES):
        _cache.pop((user_id, project_id, idempotency_key), None)
        return None
    return entry.value


def store(user_id: int, project_id: int, idempotency_key: str, value: Any) -> None:
    _cache[(user_id, project_id, idempotency_key)] = CachedResponse(value, datetime.utcnow())


def cleanup_expired() -> int:
    """Purge entries older than TTL. Returns count purged. Call via APScheduler cron."""
    now = datetime.utcnow()
    expired = [k for k, v in _cache.items() if now - v.stored_at > timedelta(minutes=TTL_MINUTES)]
    for k in expired:
        _cache.pop(k, None)
    return len(expired)


def reset_for_tests() -> None:
    """Test hook: clear all caches. Never call from production code."""
    _cache.clear()
    _last_request.clear()
