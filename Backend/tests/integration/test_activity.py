"""Integration tests for activity endpoints.

Covers:
- GET /api/v1/activity  (global feed, D-28 — admin only after BL-01 fix)
- Non-admin authenticated users receive 403 (cross-tenant leak mitigation)
- Unauthenticated access returns 401
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_global_activity_admin_returns_200(authenticated_client, db_session):
    """BL-01 fix: admin callers get paginated global feed."""
    async with authenticated_client(role="admin") as ac:
        response = await ac.get("/api/v1/activity?limit=20&offset=0")
    assert response.status_code == 200, response.text
    data = response.json()
    assert "items" in data, "Response must have 'items' key"
    assert "total" in data, "Response must have 'total' key"
    assert isinstance(data["items"], list)
    assert isinstance(data["total"], int)
    assert data["total"] >= 0


@pytest.mark.asyncio
async def test_get_global_activity_non_admin_forbidden(authenticated_client, db_session):
    """BL-01 fix: non-admin authenticated users receive 403 (no cross-tenant leak)."""
    async with authenticated_client(role="member") as ac:
        response = await ac.get("/api/v1/activity?limit=20&offset=0")
    assert response.status_code == 403, response.text


@pytest.mark.asyncio
async def test_get_global_activity_requires_auth(client: AsyncClient):
    """Unauthenticated request to GET /activity returns 401."""
    response = await client.get("/api/v1/activity")
    assert response.status_code == 401
