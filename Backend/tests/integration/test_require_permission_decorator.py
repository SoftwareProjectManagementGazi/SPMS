"""Phase 15 RBAC-02 — require_permission decorator integration tests (Plan 15-06).

Validates:
- 403 PERMISSION_DENIED envelope shape (D-1.11 / Phase 9 D-09 taxonomy)
- Admin super-role short-circuit (D-1.5)
- Permitted user (claim membership) succeeds
- Empty-claim user without Admin role → 403

Uses the permitted_client fixture from Plan 15-04 (sets JWT permissions[]
sorted per Pitfall 14). The test mounts a tiny isolated endpoint guarded by
``Depends(require_permission('admin.users.invite'))`` on the SAME app so
``app.dependency_overrides`` for ``get_db_session`` continues to apply (the
permitted_client fixture seeds the user via ``db_session``).
"""
import pytest
from fastapi import Depends

from app.api.deps.auth import get_current_user, require_permission
from app.api.main import app
from app.domain.entities.user import User

pytestmark = pytest.mark.requires_db


# ---------------------------------------------------------------------------
# Mount a permission-gated probe endpoint on the real app for the test run.
# Idempotent: re-running the test suite re-registers the same path (FastAPI
# allows multiple registrations; only the first is used). We pick a unique
# path to avoid collision with real routes.
# ---------------------------------------------------------------------------
_PROBE_PATH = "/__test/perm-probe-admin-users-invite"


def _ensure_probe_route_registered() -> None:
    """Mount the probe route once per process. Subsequent calls are no-ops."""
    if any(getattr(r, "path", None) == _PROBE_PATH for r in app.routes):
        return

    @app.get(_PROBE_PATH)
    async def _probe(
        _user: User = Depends(require_permission("admin.users.invite")),
    ):
        return {"ok": True, "checked_perm": "admin.users.invite"}


_ensure_probe_route_registered()


@pytest.mark.asyncio
async def test_require_permission_denies_when_perm_absent(permitted_client):
    """User without 'admin.users.invite' in their JWT claim gets 403 with
    the Phase 9 D-09 PERMISSION_DENIED envelope.
    """
    async with permitted_client(perms=["task.create"], role="Member") as client:
        resp = await client.get(_PROBE_PATH)
        assert resp.status_code == 403, resp.text
        body = resp.json()
        assert isinstance(body.get("detail"), dict), (
            "PERMISSION_DENIED detail must be an object envelope, not a string"
        )
        detail = body["detail"]
        assert detail["error_code"] == "PERMISSION_DENIED"
        assert detail["missing_permission"] == "admin.users.invite"
        assert "admin.users.invite" in detail["message"]


@pytest.mark.asyncio
async def test_require_permission_grants_when_perm_in_claim(permitted_client):
    """User with the matching perm in the JWT claim passes the gate (200)."""
    async with permitted_client(
        perms=["admin.users.invite", "admin.access"], role="Member"
    ) as client:
        resp = await client.get(_PROBE_PATH)
        assert resp.status_code == 200, resp.text
        assert resp.json() == {
            "ok": True,
            "checked_perm": "admin.users.invite",
        }


@pytest.mark.asyncio
async def test_require_permission_admin_super_role_bypasses_check(permitted_client):
    """D-1.5 — Admin role short-circuits via _is_admin in _has_permission.
    Even with empty perms claim, Admin succeeds (T-15-04 mitigation).
    """
    async with permitted_client(perms=[], role="Admin") as client:
        resp = await client.get(_PROBE_PATH)
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["ok"] is True
