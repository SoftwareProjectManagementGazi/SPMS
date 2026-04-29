"""Phase 15 RBAC-03 / D-1.16 — Bulk-action dynamic perm dispatch (Plan 15-07).

Verifies that the bulk-action endpoint:
1. Gates entry through `Depends(require_permission('admin.users.bulk'))` umbrella.
2. The use case raises `PermissionDeniedError` (mapped to 403) BEFORE any DB
   mutation when the admin lacks the action sub-perm (D-1.16, Pitfall 17).
3. Successfully proceeds when both the umbrella perm AND the action sub-perm
   are present.

Why this matters (Pitfall 17): the dynamic perm check happens INSIDE the
use case. We MUST verify the check fires BEFORE any user row is touched —
partial-success is forbidden when perms are missing for the requested action.
"""
import pytest
from sqlalchemy import select

from app.infrastructure.database.models.role import RoleModel
from app.infrastructure.database.models.user import UserModel

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_dynamic_perm_check_raises_when_role_change_perm_missing(
    permitted_client, db_session,
):
    """admin.users.bulk umbrella granted; admin.users.role_change MISSING.

    A bulk role_change action MUST raise 403 PERMISSION_DENIED with
    missing_permission='admin.users.role_change' BEFORE any users are touched.
    """
    member_role = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Member"))
        )
    ).scalar_one()
    pm_role = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Project Manager"))
        )
    ).scalar_one()

    # Seed two target users on Member role
    u1 = UserModel(
        email="bulkperm1@testexample.com",
        full_name="BulkPerm1",
        password_hash="$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa",
        is_active=True,
        role_id=member_role.id,
    )
    u2 = UserModel(
        email="bulkperm2@testexample.com",
        full_name="BulkPerm2",
        password_hash="$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa",
        is_active=True,
        role_id=member_role.id,
    )
    db_session.add_all([u1, u2])
    await db_session.flush()
    u1_id, u2_id = u1.id, u2.id

    # Caller has umbrella perm + deactivate but NOT role_change.
    async with permitted_client(
        perms=["admin.users.bulk", "admin.users.deactivate"],
    ) as client:
        resp = await client.post(
            "/api/v1/admin/users/bulk-action",
            json={
                "action": "role_change",
                "user_ids": [u1_id, u2_id],
                "payload": {"role_id": pm_role.id},
            },
        )
    assert resp.status_code == 403, resp.text
    detail = resp.json()["detail"]
    assert detail["error_code"] == "PERMISSION_DENIED"
    assert detail["missing_permission"] == "admin.users.role_change"

    # Confirm no users got their role mutated (Pitfall 17 — fail-fast before DB).
    await db_session.refresh(u1)
    await db_session.refresh(u2)
    assert u1.role_id == member_role.id
    assert u2.role_id == member_role.id


@pytest.mark.asyncio
async def test_dynamic_perm_check_passes_when_action_perm_present(
    permitted_client, db_session,
):
    """admin.users.bulk + admin.users.deactivate → bulk deactivate succeeds (200)."""
    member_role = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Member"))
        )
    ).scalar_one()
    u = UserModel(
        email="bulkperm3@testexample.com",
        full_name="BulkPerm3",
        password_hash="$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa",
        is_active=True,
        role_id=member_role.id,
    )
    db_session.add(u)
    await db_session.flush()
    u_id = u.id

    async with permitted_client(
        perms=["admin.users.bulk", "admin.users.deactivate"],
    ) as client:
        resp = await client.post(
            "/api/v1/admin/users/bulk-action",
            json={
                "action": "deactivate",
                "user_ids": [u_id],
                "payload": None,
            },
        )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["success_count"] == 1
    assert body["failed_count"] == 0


@pytest.mark.asyncio
async def test_bulk_action_rejected_without_umbrella_perm(
    permitted_client, db_session,
):
    """Caller lacking admin.users.bulk umbrella → 403 from
    require_permission factory (the use case is never even reached).
    """
    member_role = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Member"))
        )
    ).scalar_one()
    u = UserModel(
        email="bulkperm4@testexample.com",
        full_name="BulkPerm4",
        password_hash="$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa",
        is_active=True,
        role_id=member_role.id,
    )
    db_session.add(u)
    await db_session.flush()
    u_id = u.id

    # Caller has NO admin.users.bulk and NO admin.* at all.
    async with permitted_client(perms=["task.create"]) as client:
        resp = await client.post(
            "/api/v1/admin/users/bulk-action",
            json={
                "action": "deactivate",
                "user_ids": [u_id],
                "payload": None,
            },
        )
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["error_code"] == "PERMISSION_DENIED"
    assert resp.json()["detail"]["missing_permission"] == "admin.users.bulk"
