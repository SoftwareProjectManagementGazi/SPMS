"""Phase 15 RBAC-01 — RBAC seed idempotency + bootstrap counts (Plan 15-04).

P2 test-integrity fix. Previously this file:
  * asserted magic counts (38 / 12 / 26 / 23 / 5) against whatever RBAC rows
    happened to already be in the shared DB — so on a clean DB it would NOT catch
    a removed permission, and
  * despite the "idempotency" name, never actually re-ran the seed.

Now it seeds the canonical matrix into the transactional ``db_session`` via the
``rbac_clean`` fixture (ambient RBAC rows wiped first), derives every expected
count from the canonical lists, and explicitly REPLAYS ``seed_rbac`` to prove
idempotency (ON CONFLICT DO NOTHING → no duplicates, no error per Pitfall 8).
"""
import pytest
from sqlalchemy import func, select

from app.infrastructure.database._seed_rbac import (
    MEMBER_PERMS,
    PERMISSIONS_SEED,
    PM_PERMS,
    seed_rbac,
)
from app.infrastructure.database.models.permission import PermissionModel
from app.infrastructure.database.models.role import RoleModel
from app.infrastructure.database.models.role_permission import RolePermissionModel

pytestmark = pytest.mark.requires_db

# Derived from the single source of truth — not hard-coded literals.
EXPECTED_TOTAL = len(PERMISSIONS_SEED)
EXPECTED_SYSTEM = sum(1 for _, _, _, scope in PERMISSIONS_SEED if scope == "system")
EXPECTED_PROJECT = sum(1 for _, _, _, scope in PERMISSIONS_SEED if scope == "project")


async def _count(session, model, where=None) -> int:
    stmt = select(func.count()).select_from(model)
    if where is not None:
        stmt = stmt.where(where)
    return (await session.execute(stmt)).scalar()


@pytest.mark.asyncio
async def test_permissions_seeded(rbac_clean):
    """The canonical permission count is materialised exactly."""
    assert await _count(rbac_clean, PermissionModel) == EXPECTED_TOTAL


@pytest.mark.asyncio
async def test_permissions_scope_distribution(rbac_clean):
    """Scope partition matches the canonical system/project split."""
    assert (
        await _count(rbac_clean, PermissionModel, PermissionModel.scope == "system")
        == EXPECTED_SYSTEM
    )
    assert (
        await _count(rbac_clean, PermissionModel, PermissionModel.scope == "project")
        == EXPECTED_PROJECT
    )


@pytest.mark.asyncio
async def test_role_permissions_matrix_bootstrap(rbac_clean):
    """PM / Member get exactly their canonical cells; Admin (super-role) + Guest get none."""
    async def count_for_role(name: str) -> int:
        role = (
            await rbac_clean.execute(select(RoleModel).where(RoleModel.name.ilike(name)))
        ).scalar_one()
        return await _count(
            rbac_clean, RolePermissionModel, RolePermissionModel.role_id == role.id
        )

    assert await count_for_role("Project Manager") == len(PM_PERMS)
    assert await count_for_role("Member") == len(MEMBER_PERMS)
    assert await count_for_role("Admin") == 0
    assert await count_for_role("Guest") == 0


@pytest.mark.asyncio
async def test_system_roles_flagged(rbac_clean):
    """All four system roles exist and carry is_system_role=true."""
    for name in ["Admin", "Project Manager", "Member", "Guest"]:
        role = (
            await rbac_clean.execute(select(RoleModel).where(RoleModel.name.ilike(name)))
        ).scalar_one_or_none()
        assert role is not None, f"System role {name} missing"
        assert role.is_system_role is True, f"Role {name} should be is_system_role=true"


@pytest.mark.asyncio
async def test_seed_rbac_is_idempotent(rbac_clean):
    """Re-running seed_rbac must not duplicate rows or raise (Pitfall 8 replay-safety)."""
    before_perms = await _count(rbac_clean, PermissionModel)
    before_cells = await _count(rbac_clean, RolePermissionModel)

    # Replay — ON CONFLICT DO NOTHING means the counts must not change.
    await seed_rbac(rbac_clean, commit=False)

    assert await _count(rbac_clean, PermissionModel) == before_perms == EXPECTED_TOTAL
    assert (
        await _count(rbac_clean, RolePermissionModel)
        == before_cells
        == len(PM_PERMS) + len(MEMBER_PERMS)
    )
