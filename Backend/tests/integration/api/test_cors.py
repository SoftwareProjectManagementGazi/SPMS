"""
Integration tests for CORS enforcement — allowlist-based origin rejection.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cors_rejects_non_allowlisted_origin(client: AsyncClient):
    """OPTIONS request from 'http://evil.com' receives CORS headers that do NOT include that origin."""
    response = await client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://evil.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    # FastAPI/Starlette CORS: when origin is not allowed, the
    # Access-Control-Allow-Origin header is either absent or does not match evil.com
    allow_origin = response.headers.get("access-control-allow-origin", "")
    assert allow_origin != "http://evil.com", (
        f"Expected CORS to reject http://evil.com but got: {allow_origin}"
    )


@pytest.mark.asyncio
async def test_cors_allows_allowlisted_origin(client: AsyncClient):
    """OPTIONS request from an origin in CORS_ORIGINS list is accepted."""
    response = await client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    allow_origin = response.headers.get("access-control-allow-origin", "")
    assert allow_origin == "http://localhost:3000", (
        f"Expected CORS to allow http://localhost:3000 but got: {allow_origin}"
    )
