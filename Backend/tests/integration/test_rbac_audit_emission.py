"""Phase 15 RBAC-03 / D-1.9 — rbac.* audit emission integration tests (Plan 15-07).

Exercises Plan 15-05 use cases through Plan 15-06 routers and verifies
extra_metadata JSONB shape per D-1.9. Pattern mirrors Phase 14 14-09 D-D2
enrichment test.

The 5 SemanticEventTypes covered:

| audit_log row              | Triggered by                             |
|----------------------------|------------------------------------------|
| entity_type=role action=created          | POST   /admin/roles            |
| entity_type=role action=updated          | PATCH  /admin/roles/{id}        |
| entity_type=role action=deleted          | DELETE /admin/roles/{id}        |
| entity_type=role action=permission_granted | PATCH /admin/permissions/matrix granted=true  |
| entity_type=role action=permission_revoked | PATCH /admin/permissions/matrix granted=false |

The DELETE /admin/roles/{id} flow ALSO emits N user.role_changed rows per D-2.2
Member fallback transaction — covered as a cascade assertion.

All audit emission goes through ``audit_repo.create_with_metadata`` (D-1.9),
which serializes the metadata dict as JSONB on the ``extra_metadata`` column
(Python attribute) — DB column name is literally ``metadata`` per Pitfall 7.
"""
import pytest
from sqlalchemy import desc, select

from app.infrastructure.database.models.audit_log import AuditLogModel
from app.infrastructure.database.models.role import RoleModel
from app.infrastructure.database.models.user import UserModel

pytestmark = pytest.mark.requires_db


async def _latest_audit_row(db_session, entity_type: str, action: str):
    """Fetch the most recent audit_log row matching (entity_type, action)."""
    stmt = (
        select(AuditLogModel)
        .where(
            AuditLogModel.entity_type == entity_type,
            AuditLogModel.action == action,
        )
        .order_by(desc(AuditLogModel.timestamp), desc(AuditLogModel.id))
        .limit(1)
    )
    result = await db_session.execute(stmt)
    return result.scalar_one_or_none()


@pytest.mark.asyncio
async def test_role_created_emits_audit_with_role_metadata(
    authenticated_client, db_session,
):
    """POST /admin/roles emits one audit_log row with entity_type=role,
    action=created, and metadata containing role_id / role_name / icon_key /
    color_token (D-1.9 / Plan 15-05 CreateRoleUseCase emission).
    """
    async with authenticated_client(role="admin") as client:
        resp = await client.post(
            "/api/v1/admin/roles",
            json={
                "name": "AuditTestRoleCreate",
                "description": "audit test",
                "icon_key": "user",
                "color_token": "--info",
            },
        )
        assert resp.status_code == 201, resp.text
        role_id = resp.json()["id"]

        row = await _latest_audit_row(db_session, "role", "created")
        assert row is not None, "role.created audit row must be emitted"
        assert row.entity_id == role_id
        meta = row.extra_metadata or {}
        assert meta.get("role_id") == role_id
        assert meta.get("role_name") == "AuditTestRoleCreate"
        assert meta.get("icon_key") == "user"
        assert meta.get("color_token") == "--info"

        # Cleanup — also exercises rbac.role_deleted path implicitly
        await client.delete(f"/api/v1/admin/roles/{role_id}")


@pytest.mark.asyncio
async def test_role_updated_emits_audit_with_field_deltas(
    authenticated_client, db_session,
):
    """PATCH /admin/roles/{id} emits role.updated with metadata.fields list
    capturing which fields were patched (D-1.9 / Plan 15-05 UpdateRoleUseCase
    emission with sorted(updates.keys())).
    """
    async with authenticated_client(role="admin") as client:
        # Create
        r1 = await client.post(
            "/api/v1/admin/roles",
            json={"name": "AuditUpdateRoleA"},
        )
        assert r1.status_code == 201, r1.text
        rid = r1.json()["id"]

        # Update — patch description only
        r2 = await client.patch(
            f"/api/v1/admin/roles/{rid}",
            json={"description": "updated desc"},
        )
        assert r2.status_code == 200, r2.text

        row = await _latest_audit_row(db_session, "role", "updated")
        assert row is not None, "role.updated audit row must be emitted"
        assert row.entity_id == rid
        meta = row.extra_metadata or {}
        assert meta.get("role_id") == rid
        assert "description" in (meta.get("fields") or [])

        # Cleanup
        await client.delete(f"/api/v1/admin/roles/{rid}")


@pytest.mark.asyncio
async def test_role_deleted_emits_role_deleted_plus_user_role_changed_cascade(
    authenticated_client, db_session,
):
    """DELETE /admin/roles/{id} emits 1 role.deleted (with affected_user_count
    and fallback_role_name=Member) PLUS N user.role_changed cascade rows per
    D-2.2 Member fallback transaction.
    """
    async with authenticated_client(role="admin") as client:
        # Create custom role
        r1 = await client.post(
            "/api/v1/admin/roles",
            json={"name": "AuditDeleteRoleB"},
        )
        rid = r1.json()["id"]

        # Assign 1 user to the custom role (we want non-zero affected count)
        u = UserModel(
            email="auditdel-u1@testexample.com",
            full_name="AuditDelUser",
            password_hash="$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa",
            is_active=True,
            role_id=rid,
        )
        db_session.add(u)
        await db_session.flush()
        u_id = u.id

        # Delete custom role
        r2 = await client.delete(f"/api/v1/admin/roles/{rid}")
        assert r2.status_code == 204, r2.text

        # role.deleted row
        row_role = await _latest_audit_row(db_session, "role", "deleted")
        assert row_role is not None, "role.deleted audit row must be emitted"
        assert row_role.entity_id == rid
        meta = row_role.extra_metadata or {}
        assert meta.get("role_id") == rid
        assert meta.get("role_name") == "AuditDeleteRoleB"
        assert meta.get("affected_user_count") == 1
        assert meta.get("fallback_role_name") == "Member"

        # user.role_changed cascade row for the affected user
        cascade_row = await _latest_audit_row(db_session, "user", "role_changed")
        assert cascade_row is not None, (
            "user.role_changed cascade row must be emitted (D-2.2 Member fallback)"
        )
        assert cascade_row.entity_id == u_id
        cmeta = cascade_row.extra_metadata or {}
        assert cmeta.get("source_role") == "AuditDeleteRoleB"
        assert cmeta.get("target_role") == "Member"
        assert cmeta.get("cascade_from_delete_role_id") == rid


@pytest.mark.asyncio
async def test_permission_granted_emits_audit(authenticated_client, db_session):
    """PATCH /admin/permissions/matrix with granted=True emits role.permission_granted
    with metadata.perm_key + metadata.granted=True (D-1.9 / Plan 15-05
    UpdatePermissionMatrixUseCase emission).
    """
    pm_role = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Project Manager"))
        )
    ).scalar_one()

    # Pick a perm NOT in the seeded PM matrix to avoid collision with bootstrap
    # rows. We use a known project-scope perm; matrix bootstrap gave PM 23 perms
    # but `project.archive` is one PM may have — use a less common permission.
    # Use 'admin.access' — system perm; PM has 0 admin.* perms in baseline.
    target_perm = "admin.access"

    async with authenticated_client(role="admin") as client:
        # Pre-clean: revoke any pre-existing cell for determinism
        await client.patch(
            "/api/v1/admin/permissions/matrix",
            json={"role_id": pm_role.id, "perm_key": target_perm, "granted": False},
        )

        # Grant
        r1 = await client.patch(
            "/api/v1/admin/permissions/matrix",
            json={"role_id": pm_role.id, "perm_key": target_perm, "granted": True},
        )
        assert r1.status_code == 204, r1.text

        row = await _latest_audit_row(db_session, "role", "permission_granted")
        assert row is not None, "role.permission_granted audit row must be emitted"
        meta = row.extra_metadata or {}
        assert meta.get("role_id") == pm_role.id
        assert meta.get("perm_key") == target_perm
        assert meta.get("granted") is True

        # Cleanup — revoke
        await client.patch(
            "/api/v1/admin/permissions/matrix",
            json={"role_id": pm_role.id, "perm_key": target_perm, "granted": False},
        )


@pytest.mark.asyncio
async def test_permission_revoked_emits_audit(authenticated_client, db_session):
    """PATCH /admin/permissions/matrix with granted=False emits
    role.permission_revoked with metadata.perm_key + metadata.granted=False.
    """
    pm_role = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Project Manager"))
        )
    ).scalar_one()

    target_perm = "admin.access"

    async with authenticated_client(role="admin") as client:
        # Pre-grant so the revoke is meaningful
        await client.patch(
            "/api/v1/admin/permissions/matrix",
            json={"role_id": pm_role.id, "perm_key": target_perm, "granted": True},
        )

        # Revoke
        r2 = await client.patch(
            "/api/v1/admin/permissions/matrix",
            json={"role_id": pm_role.id, "perm_key": target_perm, "granted": False},
        )
        assert r2.status_code == 204, r2.text

        row = await _latest_audit_row(db_session, "role", "permission_revoked")
        assert row is not None, "role.permission_revoked audit row must be emitted"
        meta = row.extra_metadata or {}
        assert meta.get("role_id") == pm_role.id
        assert meta.get("perm_key") == target_perm
        assert meta.get("granted") is False
