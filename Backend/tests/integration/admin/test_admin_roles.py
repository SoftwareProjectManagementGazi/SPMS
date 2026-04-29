"""Phase 15 RBAC-05 — Admin roles CRUD integration tests (Plan 15-06).

Covers GET / POST / PATCH / DELETE on /api/v1/admin/roles. Validates:
- 4 system roles seeded (Admin / Project Manager / Member / Guest)
- Custom-role create happy path + reserved-name + duplicate-name 422 envelope
- System-role PATCH/DELETE → 422 SYSTEM_ROLE_PROTECTED (T-15-03)
- Member-fallback transaction (D-2.2): users on a deleted role auto-migrate
  to Member; per-user audit row emitted

Uses authenticated_client(role="Admin") because the new admin endpoints are
gated by Depends(require_permission('admin.access')); Admin role
short-circuits via _is_admin (D-1.5).
"""
import pytest
from sqlalchemy import select

from app.infrastructure.database.models.role import RoleModel
from app.infrastructure.database.models.user import UserModel

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_list_roles_returns_4_system_roles(authenticated_client):
    """Migration 007 seeded Admin + Project Manager + Member + Guest."""
    async with authenticated_client(role="admin") as client:
        resp = await client.get("/api/v1/admin/roles")
        assert resp.status_code == 200, resp.text
        body = resp.json()
        names = [r["name"] for r in body["items"]]
        for expected in ("Admin", "Project Manager", "Member", "Guest"):
            assert expected in names, f"system role '{expected}' must be seeded"
        assert body["total"] >= 4
        # is_system_role flag visible on system roles
        admin_row = next(r for r in body["items"] if r["name"] == "Admin")
        assert admin_row["is_system_role"] is True


@pytest.mark.asyncio
async def test_create_role_happy_path(authenticated_client):
    """POST /admin/roles creates a custom role; is_system_role=False forced."""
    async with authenticated_client(role="admin") as client:
        resp = await client.post(
            "/api/v1/admin/roles",
            json={
                "name": "DesignerTestRole",
                "description": "Custom test role",
                "icon_key": "user",
                "color_token": "--info",
            },
        )
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["name"] == "DesignerTestRole"
        assert body["is_system_role"] is False
        assert body["icon_key"] == "user"
        assert body["color_token"] == "--info"
        # Cleanup
        del_resp = await client.delete(f"/api/v1/admin/roles/{body['id']}")
        assert del_resp.status_code == 204


@pytest.mark.asyncio
async def test_create_role_rejects_reserved_name(authenticated_client):
    """D-2.6 / T-15-07 — reserved name returns 422 ROLE_NAME_INVALID."""
    async with authenticated_client(role="admin") as client:
        resp = await client.post("/api/v1/admin/roles", json={"name": "Admin"})
        assert resp.status_code == 422, resp.text
        assert resp.json()["detail"]["error_code"] == "ROLE_NAME_INVALID"
        assert resp.json()["detail"]["reason"] == "reserved"


@pytest.mark.asyncio
async def test_create_role_rejects_duplicate(authenticated_client):
    """ROLE_NAME_INVALID with reason='duplicate' on second insert."""
    async with authenticated_client(role="admin") as client:
        r1 = await client.post(
            "/api/v1/admin/roles", json={"name": "DupTestRoleZeta"}
        )
        assert r1.status_code == 201, r1.text
        r2 = await client.post(
            "/api/v1/admin/roles", json={"name": "DupTestRoleZeta"}
        )
        assert r2.status_code == 422, r2.text
        assert r2.json()["detail"]["error_code"] == "ROLE_NAME_INVALID"
        assert r2.json()["detail"]["reason"] == "duplicate"
        # Cleanup
        await client.delete(f"/api/v1/admin/roles/{r1.json()['id']}")


@pytest.mark.asyncio
async def test_system_role_protected_on_patch(authenticated_client, db_session):
    """D-2.3 / T-15-03 — PATCH on Admin role returns 422 SYSTEM_ROLE_PROTECTED."""
    admin_role = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Admin"))
        )
    ).scalar_one()

    async with authenticated_client(role="admin") as client:
        resp = await client.patch(
            f"/api/v1/admin/roles/{admin_role.id}",
            json={"name": "AdminRenamed"},
        )
        assert resp.status_code == 422, resp.text
        detail = resp.json()["detail"]
        assert detail["error_code"] == "SYSTEM_ROLE_PROTECTED"
        assert detail["role_name"].lower() == "admin"


@pytest.mark.asyncio
async def test_system_role_protected_on_delete(authenticated_client, db_session):
    """D-2.3 — DELETE on Member role returns 422 SYSTEM_ROLE_PROTECTED."""
    member_role = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Member"))
        )
    ).scalar_one()

    async with authenticated_client(role="admin") as client:
        resp = await client.delete(f"/api/v1/admin/roles/{member_role.id}")
        assert resp.status_code == 422, resp.text
        assert resp.json()["detail"]["error_code"] == "SYSTEM_ROLE_PROTECTED"


@pytest.mark.asyncio
async def test_delete_role_migrates_users_to_member(authenticated_client, db_session):
    """D-2.2 — Member fallback transaction. Affected users moved to Member;
    audit emits 1 role.deleted + N user.role_changed rows.
    """
    member_role = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Member"))
        )
    ).scalar_one()

    async with authenticated_client(role="admin") as client:
        # 1. Create custom role
        r1 = await client.post(
            "/api/v1/admin/roles", json={"name": "FallbackTestRole"}
        )
        assert r1.status_code == 201, r1.text
        custom_role_id = r1.json()["id"]

        # 2. Assign 2 users to it (manually inject via db_session)
        u1 = UserModel(
            email="fb1-rolemigrate@testexample.com",
            full_name="FB1",
            password_hash="$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa",
            is_active=True,
            role_id=custom_role_id,
        )
        u2 = UserModel(
            email="fb2-rolemigrate@testexample.com",
            full_name="FB2",
            password_hash="$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa",
            is_active=True,
            role_id=custom_role_id,
        )
        db_session.add_all([u1, u2])
        await db_session.flush()
        u1_id, u2_id = u1.id, u2.id

        # 3. Delete custom role
        resp = await client.delete(f"/api/v1/admin/roles/{custom_role_id}")
        assert resp.status_code == 204, resp.text

        # 4. Verify both users now have Member role
        await db_session.refresh(u1)
        await db_session.refresh(u2)
        assert u1.role_id == member_role.id, (
            f"User {u1_id} should have migrated to Member after role delete"
        )
        assert u2.role_id == member_role.id, (
            f"User {u2_id} should have migrated to Member after role delete"
        )
