"""Phase 15 RBAC-01 — Migration 007 idempotency smoke (Plan 15-04).

Verifies replay-safe upgrade per Pitfall 8: re-running the migration on a
seeded DB must not raise UNIQUE violations or create duplicate roles.

Marked requires_db (TIDY-05 conftest hook will skip when DB unreachable).
"""
import pytest

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_permissions_seeded_with_38_rows(db_session):
    """38 perms = 26 project (14 base + 12 LIFE-related per D-3.5) + 12 system (admin.* + permission.matrix.update)."""
    from sqlalchemy import select, func
    from app.infrastructure.database.models.permission import PermissionModel

    result = await db_session.execute(select(func.count(PermissionModel.id)))
    count = result.scalar()
    assert count == 38, f"Expected 38 perms after Migration 007, got {count}"


@pytest.mark.asyncio
async def test_permissions_scope_distribution(db_session):
    """Per CONTEXT D-3.5: 12 system (admin.* + permission.matrix.update) + 26 project (14 base + 12 LIFE)."""
    from sqlalchemy import select, func
    from app.infrastructure.database.models.permission import PermissionModel

    system_count = (
        await db_session.execute(
            select(func.count(PermissionModel.id)).where(
                PermissionModel.scope == "system"
            )
        )
    ).scalar()
    project_count = (
        await db_session.execute(
            select(func.count(PermissionModel.id)).where(
                PermissionModel.scope == "project"
            )
        )
    ).scalar()
    assert system_count == 12, f"Expected 12 system perms, got {system_count}"
    assert project_count == 26, f"Expected 26 project perms, got {project_count}"


@pytest.mark.asyncio
async def test_role_permissions_matrix_bootstrap(db_session):
    """PM 23 / Member 5 / Admin 0 / Guest 0 (D-1.5 super-role + D-2.4 guest empty)."""
    from sqlalchemy import select, func
    from app.infrastructure.database.models.role import RoleModel
    from app.infrastructure.database.models.role_permission import RolePermissionModel

    async def count_for_role(name: str) -> int:
        role = (
            await db_session.execute(
                select(RoleModel).where(RoleModel.name.ilike(name))
            )
        ).scalar_one()
        return (
            await db_session.execute(
                select(func.count(RolePermissionModel.role_id)).where(
                    RolePermissionModel.role_id == role.id
                )
            )
        ).scalar()

    assert await count_for_role("Project Manager") == 23
    assert await count_for_role("Member") == 5
    assert await count_for_role("Admin") == 0
    assert await count_for_role("Guest") == 0


@pytest.mark.asyncio
async def test_system_roles_flagged(db_session):
    """All 4 system roles (Admin / PM / Member / Guest) must have is_system_role=true."""
    from sqlalchemy import select
    from app.infrastructure.database.models.role import RoleModel

    for name in ["Admin", "Project Manager", "Member", "Guest"]:
        role = (
            await db_session.execute(
                select(RoleModel).where(RoleModel.name.ilike(name))
            )
        ).scalar_one_or_none()
        assert role is not None, f"System role {name} missing"
        assert role.is_system_role is True, f"Role {name} should be is_system_role=true"
