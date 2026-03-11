"""
Integration tests for CORS enforcement — allowlist-based origin rejection.

All tests are marked xfail — stubs for Nyquist compliance.
Implementation is pending Plan 01-03 (CORS configuration hardening).
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.xfail(reason="pending implementation in 01-03 — CORS enforcement not yet configured")
async def test_cors_rejects_non_allowlisted_origin(client: AsyncClient):
    """OPTIONS request from 'http://evil.com' receives CORS headers that do NOT include that origin."""
    # Stub: will send OPTIONS preflight from evil.com and verify Access-Control-Allow-Origin is absent or differs
    raise NotImplementedError("CORS origin rejection not yet configured")


@pytest.mark.asyncio
@pytest.mark.xfail(reason="pending implementation in 01-03 — CORS enforcement not yet configured")
async def test_cors_allows_allowlisted_origin(client: AsyncClient):
    """OPTIONS request from an origin in CORS_ORIGINS list is accepted."""
    # Stub: will send OPTIONS preflight from an allowlisted origin and verify it is reflected in response headers
    raise NotImplementedError("CORS origin allowlisting not yet configured")
