"""Phase 15 RBAC-05 — Permission matrix GET + PATCH integration tests (Plan 15-06).

Validates:
- GET /api/v1/admin/permissions/matrix — full {roles, permissions, cells}
- PATCH /api/v1/admin/permissions/matrix — per-cell auto-save (D-1.12)
- Admin column readonly (D-1.5 / D-2.9 / T-15-04 last-admin-lockout) → 422

Migration 007 bootstrap: PM 23 perms / Member 5 perms / Admin 0 / Guest 0.
"""
import pytest
from sqlalchemy import select

from app.infrastructure.database.models.role import RoleModel

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_seeded_matrix_shape(authenticated_client):
    """Verifies {roles, permissions, cells} structure + cell count.

    Migration 007 seeds: PM 23 + Member 5 + Admin 0 + Guest 0 = 28 cells minimum.
    """
    async with authenticated_client(role="admin") as client:
        resp = await client.get("/api/v1/admin/permissions/matrix")
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert "roles" in body
        assert "permissions" in body
        assert "cells" in body
        assert len(body["roles"]) >= 4  # Admin / PM / Member / Guest
        assert len(body["permissions"]) == 38
        # Migration 007 seeds 28 cells (PM 23 + Member 5)
        assert len(body["cells"]) >= 28, (
            f"expected ≥28 cells (PM 23 + Member 5); got {len(body['cells'])}"
        )
        # All cells default to granted=True (absence = revoked)
        assert all(c["granted"] is True for c in body["cells"])


@pytest.mark.asyncio
async def test_patch_cell_grants_then_revokes(authenticated_client, db_session):
    """D-1.12 — per-cell PATCH grants and revokes a permission.
    PM gets 'project.delete' temporarily, then revokes.
    """
    pm = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Project Manager"))
        )
    ).scalar_one()

    async with authenticated_client(role="admin") as client:
        # PM does not have 'project.delete' by default
        r_grant = await client.patch(
            "/api/v1/admin/permissions/matrix",
            json={"role_id": pm.id, "perm_key": "project.delete", "granted": True},
        )
        assert r_grant.status_code == 204, r_grant.text

        # Verify by re-fetching matrix
        m = await client.get("/api/v1/admin/permissions/matrix")
        body = m.json()
        proj_delete_perm = next(
            (p for p in body["permissions"] if p["key"] == "project.delete"), None
        )
        assert proj_delete_perm is not None
        proj_delete_id = proj_delete_perm["id"]
        granted_pair = any(
            c["role_id"] == pm.id and c["permission_id"] == proj_delete_id
            for c in body["cells"]
        )
        assert granted_pair, (
            "PM × project.delete cell must be present after grant"
        )

        # Revoke
        r_revoke = await client.patch(
            "/api/v1/admin/permissions/matrix",
            json={"role_id": pm.id, "perm_key": "project.delete", "granted": False},
        )
        assert r_revoke.status_code == 204, r_revoke.text


@pytest.mark.asyncio
async def test_patch_admin_role_rejected_with_system_role_protected(
    authenticated_client, db_session
):
    """D-1.5 / D-2.9 / T-15-04 — Admin column is readonly even for Admin user.
    Backend defends against UI bypass (last-admin-lockout mitigation).
    """
    admin_role = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Admin"))
        )
    ).scalar_one()

    async with authenticated_client(role="admin") as client:
        resp = await client.patch(
            "/api/v1/admin/permissions/matrix",
            json={
                "role_id": admin_role.id,
                "perm_key": "task.delete",
                "granted": False,
            },
        )
        assert resp.status_code == 422, resp.text
        assert resp.json()["detail"]["error_code"] == "SYSTEM_ROLE_PROTECTED"
