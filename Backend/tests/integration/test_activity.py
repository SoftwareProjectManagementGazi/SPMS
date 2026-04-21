"""Integration tests for activity endpoints.
Wave 0 stub — function signatures pre-declared for Nyquist compliance.
Full test bodies implemented in Plan 10 Task 1 after GET /activity endpoint is live.
"""
import pytest
from httpx import AsyncClient


# Wave 0 stub — full body added in Plan 10
@pytest.mark.asyncio
async def test_get_global_activity_returns_200(authenticated_client: AsyncClient):
    """D-28: global activity feed requires authentication, returns paginated items."""
    pass


# Wave 0 stub — full body added in Plan 10
@pytest.mark.asyncio
async def test_get_global_activity_requires_auth(client: AsyncClient):
    """Unauthenticated request to GET /activity returns 401."""
    pass
