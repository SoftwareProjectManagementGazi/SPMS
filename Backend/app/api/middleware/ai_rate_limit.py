"""AI Workflow Generator — 3-tier rate limiter (D-05).

In-memory sliding-window counters. Single-instance backend friendly; for
multi-instance switch to Redis (the API surface stays the same — replace
the `_RateLimiter` storage with Redis INCR + EXPIRE).

Tiers (from plan §17 D-05):
    USER_HOURLY_LIMIT  = 8    — burst protection per user
    USER_DAILY_LIMIT   = 25   — heavy-tester ceiling per user
    PROJECT_DAILY_LIMIT = 400 — Gemini free-tier guard (500 RPD * 80%)

Failure modes:
    user_hourly  → HTTP 429, Retry-After in seconds, frontend State 6 toast
    user_daily   → HTTP 429, Retry-After until UTC midnight, frontend State 6
    project_quota → HTTP 503, retry next UTC day, frontend State 5

Plan ref: .planning/ai-workflow-generator-plan.md §10.1
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from time import time

from fastapi import HTTPException, Request, status

logger = logging.getLogger(__name__)


# Tunables — keep at module level so monkey-patching in tests is trivial
USER_HOURLY_LIMIT = 8
USER_DAILY_LIMIT = 25
PROJECT_DAILY_LIMIT = 400


class _RateLimiter:
    """In-memory 3-tier limiter with sliding windows.

    Memory profile: O(N_users * 25) timestamps at steady state ≈ kilobytes
    for hundreds of users. Sufficient for academic demo; trade up to Redis
    when sharding the backend.
    """

    def __init__(self) -> None:
        self.user_hour: dict[str, list[float]] = defaultdict(list)
        self.user_day: dict[str, list[float]] = defaultdict(list)
        self.project_day: list[float] = []

    @staticmethod
    def _seconds_until_utc_midnight() -> int:
        now = datetime.now(timezone.utc)
        midnight = (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        return int((midnight - now).total_seconds())

    def check_and_increment(self, user_id: str) -> None:
        """Raise HTTPException if any tier is exceeded; otherwise record the call.

        Three tiers checked in increasing scope. The first one that's hit wins —
        the call isn't recorded, so retries after window slide naturally succeed.
        """
        now = time()

        # Slide windows
        self.user_hour[user_id] = [
            t for t in self.user_hour[user_id] if now - t < 3600
        ]
        self.user_day[user_id] = [
            t for t in self.user_day[user_id] if now - t < 86400
        ]
        self.project_day = [t for t in self.project_day if now - t < 86400]

        # Tier 1: user hourly
        if len(self.user_hour[user_id]) >= USER_HOURLY_LIMIT:
            oldest = self.user_hour[user_id][0]
            reset_in = max(1, int(3600 - (now - oldest)))
            logger.info(
                "Rate limit hit: user_hourly user=%s reset_in=%ds", user_id, reset_in
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "kind": "user_hourly",
                    "reset_in_seconds": reset_in,
                    "message": "Saatlik AI sınırına ulaştın.",
                },
                headers={"Retry-After": str(reset_in)},
            )

        # Tier 2: user daily
        if len(self.user_day[user_id]) >= USER_DAILY_LIMIT:
            reset_in = self._seconds_until_utc_midnight()
            logger.info(
                "Rate limit hit: user_daily user=%s reset_in=%ds", user_id, reset_in
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "kind": "user_daily",
                    "reset_in_seconds": reset_in,
                    "message": "Günlük AI kullanım sınırına ulaştın.",
                },
                headers={"Retry-After": str(reset_in)},
            )

        # Tier 3: project ceiling
        if len(self.project_day) >= PROJECT_DAILY_LIMIT:
            reset_in = self._seconds_until_utc_midnight()
            logger.warning(
                "Rate limit hit: project_quota reset_in=%ds (free-tier ceiling)",
                reset_in,
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "kind": "project_quota",
                    "reset_in_seconds": reset_in,
                    "message": "AI servisi şu an meşgul, yarın tekrar dene.",
                },
            )

        # All clear — record this call
        self.user_hour[user_id].append(now)
        self.user_day[user_id].append(now)
        self.project_day.append(now)


# Module-level singleton — one in-memory store per backend process
_limiter = _RateLimiter()


async def ai_rate_limit(request: Request) -> None:
    """FastAPI dependency: enforce 3-tier limits on AI endpoints.

    Pulls user_id from the request's authenticated state (populated by the
    JWT auth dep elsewhere in the stack). Anonymous requests should never
    reach AI endpoints — they're already gated behind `get_current_user`.
    """
    # current_user is set by the auth dependency before this runs (FastAPI
    # resolves deps in dependency order; the router applies both).
    user = getattr(request.state, "user", None) or getattr(
        request.scope, "user", None
    )
    # Fallback: try the standard `request.user` attribute. If still missing
    # we fail open (no limiting) since the auth gate is the real guardrail.
    user_id: str
    if user is not None and hasattr(user, "email"):
        user_id = str(user.email)
    elif user is not None and hasattr(user, "id"):
        user_id = str(user.id)
    else:
        # Last-resort fallback: limit by IP if auth state isn't wired here.
        # This still protects against unauthenticated abuse if someone bypasses
        # the auth dep upstream.
        user_id = request.client.host if request.client else "anonymous"

    _limiter.check_and_increment(user_id)


# Test helper — reset state between unit tests
def _reset_for_tests() -> None:
    """Clear all counters. Tests only — production code never calls this."""
    _limiter.user_hour.clear()
    _limiter.user_day.clear()
    _limiter.project_day.clear()
