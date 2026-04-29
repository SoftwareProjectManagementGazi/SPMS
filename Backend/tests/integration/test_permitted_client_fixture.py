"""Phase 15 D-1.15 — permitted_client fixture sanity (Plan 15-04).

Verifies the fixture builds JWT with permissions[] claim correctly and the
header reaches the backend through the test ASGI client.
"""
import pytest

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_permitted_client_jwt_contains_perms(permitted_client):
    """Token decoded by jose carries the permissions[] claim, sorted alphabetically."""
    from jose import jwt
    from app.infrastructure.config import settings

    async with permitted_client(perms=["task.create", "admin.access"]) as client:
        # Extract the bearer token from the Authorization header
        auth = client.headers.get("Authorization", "")
        assert auth.startswith("Bearer ")
        token = auth[len("Bearer "):]
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        assert payload.get("permissions") == sorted(["task.create", "admin.access"])


@pytest.mark.asyncio
async def test_permitted_client_with_empty_perms(permitted_client):
    """Empty perms list also encodes (key present, list empty)."""
    from jose import jwt
    from app.infrastructure.config import settings

    async with permitted_client(perms=[]) as client:
        token = client.headers["Authorization"][len("Bearer "):]
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        assert payload.get("permissions") == []
