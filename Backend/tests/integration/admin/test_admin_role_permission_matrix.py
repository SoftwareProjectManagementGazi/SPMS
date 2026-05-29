"""Phase 15 RBAC-05 — Permission matrix GET + PATCH integration tests (Plan 15-06).

Validates:
- GET /api/v1/admin/permissions/matrix — full {roles, permissions, cells}
- PATCH /api/v1/admin/permissions/matrix — per-cell auto-save (D-1.12)
- Admin column readonly (D-1.5 / D-2.9 / T-15-04 last-admin-lockout) → 422

P2 test-integrity fix: counts are DERIVED from the canonical lists
(``PERMISSIONS_SEED`` / ``PM_PERMS`` / ``MEMBER_PERMS``) and seeded into the
transactional ``db_session`` — the shape test via ``rbac_clean`` (ambient wiped,
so cells == exactly the canonical bootstrap), the PATCH tests via ``rbac_present``
(additive — ensures the perms/roles exist without deleting anything the
committing PATCH path might touch).
"""
import pytest
from sqlalchemy import select

from app.infrastructure.database._seed_rbac import (
    MEMBER_PERMS,
    PERMISSIONS_SEED,
    PM_PERMS,
)
from app.infrastructure.database.models.role import RoleModel

pytestmark = pytest.mark.requires_db

EXPECTED_KEYS = {key for key, _, _, _ in PERMISSIONS_SEED}


@pytest.mark.asyncio
async def test_seeded_matrix_shape(rbac_clean, authenticated_client):
    """{roles, permissions, cells} with canonical perms + the exact bootstrap cells."""
    async with authenticated_client(role="admin") as client:
        resp = await client.get("/api/v1/admin/permissions/matrix")
        assert resp.status_code == 200, resp.text
        body = resp.json()

    assert {"roles", "permissions", "cells"} <= set(body.keys())
    # Permissions == canonical set (derived; catches drops / seed gaps).
    assert {p["key"] for p in body["permissions"]} == EXPECTED_KEYS
    # The four system roles are present.
    role_names = {r["name"].lower() for r in body["roles"]}
    assert {"admin", "project manager", "member", "guest"} <= role_names
    # Cells: exactly the canonical bootstrap (PM_PERMS + MEMBER_PERMS), all granted.
    assert all(c["granted"] is True for c in body["cells"])
    assert len(body["cells"]) == len(PM_PERMS) + len(MEMBER_PERMS)
    # Per-role cell counts match the canonical lists exactly (kills mutation:
    # seeding the wrong role's cells, or a get_matrix that drops rows).
    name_by_id = {r["id"]: r["name"].lower() for r in body["roles"]}
    per_role: dict[str, int] = {}
    for c in body["cells"]:
        per_role[name_by_id[c["role_id"]]] = per_role.get(name_by_id[c["role_id"]], 0) + 1
    assert per_role.get("project manager") == len(PM_PERMS)
    assert per_role.get("member") == len(MEMBER_PERMS)
    assert "admin" not in per_role  # Admin is a super-role: no explicit cells


@pytest.mark.asyncio
async def test_patch_cell_grants_then_revokes(rbac_present, authenticated_client, db_session):
    """D-1.12 — per-cell PATCH grants then revokes (PM × project.delete, not a default cell)."""
    pm = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Project Manager"))
        )
    ).scalar_one()

    def _has_cell(body, role_id, perm_key):
        perm = next((p for p in body["permissions"] if p["key"] == perm_key), None)
        assert perm is not None, f"{perm_key} missing from matrix permissions"
        return any(
            c["role_id"] == role_id and c["permission_id"] == perm["id"]
            for c in body["cells"]
        )

    async with authenticated_client(role="admin") as client:
        # PM has no project.delete by default.
        before = (await client.get("/api/v1/admin/permissions/matrix")).json()
        assert not _has_cell(before, pm.id, "project.delete")

        r_grant = await client.patch(
            "/api/v1/admin/permissions/matrix",
            json={"role_id": pm.id, "perm_key": "project.delete", "granted": True},
        )
        assert r_grant.status_code == 204, r_grant.text
        after_grant = (await client.get("/api/v1/admin/permissions/matrix")).json()
        # kills mutation: a PATCH that doesn't persist the grant fails here.
        assert _has_cell(after_grant, pm.id, "project.delete")

        r_revoke = await client.patch(
            "/api/v1/admin/permissions/matrix",
            json={"role_id": pm.id, "perm_key": "project.delete", "granted": False},
        )
        assert r_revoke.status_code == 204, r_revoke.text
        after_revoke = (await client.get("/api/v1/admin/permissions/matrix")).json()
        # kills mutation: a revoke that doesn't delete the cell fails here.
        assert not _has_cell(after_revoke, pm.id, "project.delete")


@pytest.mark.asyncio
async def test_patch_admin_role_rejected_with_system_role_protected(
    rbac_present, authenticated_client, db_session
):
    """D-1.5 / D-2.9 / T-15-04 — the Admin column is readonly even for an Admin user."""
    admin_role = (
        await db_session.execute(select(RoleModel).where(RoleModel.name.ilike("Admin")))
    ).scalar_one()

    async with authenticated_client(role="admin") as client:
        resp = await client.patch(
            "/api/v1/admin/permissions/matrix",
            json={"role_id": admin_role.id, "perm_key": "task.delete", "granted": False},
        )
    # kills mutation: dropping the admin-readonly guard would 204 here.
    assert resp.status_code == 422, resp.text
    assert resp.json()["detail"]["error_code"] == "SYSTEM_ROLE_PROTECTED"
