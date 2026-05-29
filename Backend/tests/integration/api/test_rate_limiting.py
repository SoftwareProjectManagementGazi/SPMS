"""SEC-01: Rate limiting — real integration tests.

Replaces the previous ``xfail(strict=False) + assert False`` stubs (flagged as
fake passes). Rate limiting ships and is wired:
  * app/api/v1/auth.py — /login is ``@limiter.limit("10/minute")``,
    /register is ``@limiter.limit("5/minute")``.
  * app/api/main.py — registers the ``RateLimitExceeded`` -> 429 handler.

Isolation (critical): slowapi keys counters by ``get_remote_address(request)``
= ``request.client.host``. httpx ASGITransport defaults *every* test client to
127.0.0.1, so a naive client would share one counter with the rest of the suite
(both directions of pollution). Each test below builds its own client with a
UNIQUE source IP, giving it a private counter bucket — its hits don't affect
other tests, and other tests' hits don't affect it.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.api.main import app
from app.infrastructure.database.database import get_db_session

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db


def _client_with_ip(db_session, ip: str) -> AsyncClient:
    """An AsyncClient whose requests appear to originate from ``ip`` (so slowapi
    gives this test a counter independent of the 127.0.0.1 the rest of the suite
    shares). Routes the app's DB session to the transactional test session."""
    app.dependency_overrides[get_db_session] = lambda: db_session
    transport = ASGITransport(app=app, client=(ip, 9999))
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_login_rate_limit_429_after_10_requests(db_session):
    """/auth/login allows 10 requests/min from one IP; the 11th returns 429."""
    statuses: list[int] = []
    try:
        async with _client_with_ip(db_session, "10.10.0.1") as client:
            for _ in range(11):
                r = await client.post(
                    "/api/v1/auth/login",
                    json={"email": "nobody-rl@example.com", "password": "wrong-password"},
                )
                statuses.append(r.status_code)
    finally:
        app.dependency_overrides.clear()

    # The first 10 are processed (401 invalid creds) — NOT rate-limited.
    assert all(s != 429 for s in statuses[:10]), statuses
    # kills mutation: removing @limiter.limit("10/minute") makes the 11th a 401, not 429.
    assert statuses[10] == 429, statuses


@pytest.mark.asyncio
async def test_register_rate_limit_429_after_5_requests(db_session):
    """/auth/register allows 5 requests/min from one IP; the 6th returns 429."""
    statuses: list[int] = []
    try:
        async with _client_with_ip(db_session, "10.10.0.2") as client:
            for i in range(6):
                r = await client.post(
                    "/api/v1/auth/register",
                    json={
                        "email": f"rl-reg-{i}@example.com",
                        "password": "ValidPass123!",
                        "full_name": "Rate Limit",
                    },
                )
                statuses.append(r.status_code)
    finally:
        app.dependency_overrides.clear()

    # The first 5 are processed (201/400) — NOT rate-limited.
    assert all(s != 429 for s in statuses[:5]), statuses
    # kills mutation: removing @limiter.limit("5/minute") makes the 6th a 201/400, not 429.
    assert statuses[5] == 429, statuses
