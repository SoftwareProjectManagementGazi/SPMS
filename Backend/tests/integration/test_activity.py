"""Integration tests for activity endpoints.

Covers:
- GET /api/v1/activity  (global feed, D-28 — any authenticated user)
- Unauthenticated access returns 401
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_global_activity_returns_200(authenticated_client, db_session):
    """D-28: global activity feed requires authentication, returns paginated shape."""
    async with authenticated_client(role="member") as ac:
        response = await ac.get("/api/v1/activity?limit=20&offset=0")
    assert response.status_code == 200, response.text
    data = response.json()
    assert "items" in data, "Response must have 'items' key"
    assert "total" in data, "Response must have 'total' key"
    assert isinstance(data["items"], list)
    assert isinstance(data["total"], int)
    assert data["total"] >= 0


@pytest.mark.asyncio
async def test_get_global_activity_requires_auth(client: AsyncClient):
    """Unauthenticated request to GET /activity returns 401."""
    response = await client.get("/api/v1/activity")
    assert response.status_code == 401
