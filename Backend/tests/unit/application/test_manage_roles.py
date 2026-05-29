"""Phase 15 RBAC-05 — Unit tests for Create/Update/Delete role use cases (Plan 15-05).

Covers:
- CreateRoleUseCase: reserved-name reject (T-15-07), duplicate reject, happy path + audit emit
- UpdateRoleUseCase: system-role reject (T-15-03), not-found, happy path
- DeleteRoleUseCase: system-role reject (T-15-03), Member-fallback transaction with
  per-user audit emission (D-2.2 + Member-fallback-01 mitigation)
- All use AsyncMock — no DB. Pure DIP unit tests.
"""
import pytest
from unittest.mock import AsyncMock

from app.application.dtos.role_dtos import RoleCreateDTO, RoleUpdateDTO
from app.application.use_cases.create_role import CreateRoleUseCase
from app.application.use_cases.delete_role import DeleteRoleUseCase
from app.application.use_cases.update_role import UpdateRoleUseCase
from app.domain.entities.role import Role
from app.domain.exceptions import (
    RoleNameInvalidError,
    RoleNotFoundError,
    SystemRoleProtectedError,
)


# ---------------------------------------------------------------------------
# CreateRoleUseCase
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_role_rejects_reserved_name():
    """T-15-07 — reserved-name spoofing (Admin/Project Manager/Member/Guest) rejected case-insensitive."""
    role_repo = AsyncMock()
    audit_repo = AsyncMock()
    use_case = CreateRoleUseCase(role_repo, audit_repo)
    with pytest.raises(RoleNameInvalidError):
        await use_case.execute(RoleCreateDTO(name="Admin"), admin_id=1)


@pytest.mark.asyncio
async def test_create_role_rejects_reserved_name_case_insensitive():
    """ADMIN / project manager / MeMbEr all collide with the canonical reserved set."""
    role_repo = AsyncMock()
    audit_repo = AsyncMock()
    use_case = CreateRoleUseCase(role_repo, audit_repo)
    for n in ("ADMIN", "project manager", "MeMbEr"):
        with pytest.raises(RoleNameInvalidError):
            await use_case.execute(RoleCreateDTO(name=n), admin_id=1)


@pytest.mark.asyncio
async def test_create_role_rejects_duplicate():
    """Duplicate (case-insensitive via IRoleRepository.get_by_name ILIKE) rejected."""
    role_repo = AsyncMock()
    role_repo.get_by_name = AsyncMock(return_value=Role(id=5, name="Designer"))
    audit_repo = AsyncMock()
    use_case = CreateRoleUseCase(role_repo, audit_repo)
    with pytest.raises(RoleNameInvalidError):
        await use_case.execute(RoleCreateDTO(name="Designer"), admin_id=1)


@pytest.mark.asyncio
async def test_create_role_happy_path():
    """is_system_role=False forced; audit emitted with role_id+role_name."""
    role_repo = AsyncMock()
    role_repo.get_by_name = AsyncMock(return_value=None)
    role_repo.create = AsyncMock(return_value=Role(id=10, name="Designer", is_system_role=False))
    audit_repo = AsyncMock()
    use_case = CreateRoleUseCase(role_repo, audit_repo)
    result = await use_case.execute(RoleCreateDTO(name="Designer"), admin_id=1)
    assert result.id == 10
    assert result.name == "Designer"
    assert result.is_system_role is False
    audit_repo.create_with_metadata.assert_awaited_once()
    kwargs = audit_repo.create_with_metadata.call_args.kwargs
    assert kwargs["entity_type"] == "role"
    assert kwargs["action"] == "created"
    assert kwargs["metadata"]["role_id"] == 10
    assert kwargs["metadata"]["role_name"] == "Designer"


# ---------------------------------------------------------------------------
# UpdateRoleUseCase
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_role_rejects_system_role():
    """T-15-03 — system role tampering blocked."""
    role_repo = AsyncMock()
    role_repo.get_by_id = AsyncMock(
        return_value=Role(id=1, name="Admin", is_system_role=True)
    )
    use_case = UpdateRoleUseCase(role_repo, AsyncMock())
    with pytest.raises(SystemRoleProtectedError):
        await use_case.execute(role_id=1, dto=RoleUpdateDTO(name="Admin2"), admin_id=2)


@pytest.mark.asyncio
async def test_update_role_not_found():
    role_repo = AsyncMock()
    role_repo.get_by_id = AsyncMock(return_value=None)
    use_case = UpdateRoleUseCase(role_repo, AsyncMock())
    with pytest.raises(RoleNotFoundError):
        await use_case.execute(role_id=99, dto=RoleUpdateDTO(name="X"), admin_id=2)


@pytest.mark.asyncio
async def test_update_role_rejects_reserved_name():
    """Renaming a custom role to a reserved name still hits the reserved-name check."""
    custom = Role(id=10, name="Designer", is_system_role=False)
    role_repo = AsyncMock()
    role_repo.get_by_id = AsyncMock(return_value=custom)
    use_case = UpdateRoleUseCase(role_repo, AsyncMock())
    with pytest.raises(RoleNameInvalidError):
        await use_case.execute(role_id=10, dto=RoleUpdateDTO(name="member"), admin_id=2)


@pytest.mark.asyncio
async def test_update_role_happy_path_partial_update():
    """Partial update — only icon_key changes; name preserved."""
    custom = Role(id=10, name="Designer", is_system_role=False, icon_key="palette")
    role_repo = AsyncMock()
    role_repo.get_by_id = AsyncMock(return_value=custom)
    # Echo back the entity the use case passes to update(), so the result reflects
    # the use case's OWN mutation. A hard-coded return made this tautological — it
    # passed even if the use case never applied the dto.
    role_repo.update = AsyncMock(side_effect=lambda r: r)
    audit_repo = AsyncMock()
    use_case = UpdateRoleUseCase(role_repo, audit_repo)
    result = await use_case.execute(
        role_id=10, dto=RoleUpdateDTO(icon_key="brush"), admin_id=2,
    )
    # kills mutation: the use case must apply dto.icon_key (palette → brush) AND
    # preserve the unchanged name.
    assert result.icon_key == "brush"
    assert result.name == "Designer"
    audit_repo.create_with_metadata.assert_awaited_once()


# ---------------------------------------------------------------------------
# DeleteRoleUseCase
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_role_rejects_system_role():
    """T-15-03 — DELETE on system role rejected with SystemRoleProtectedError."""
    role_repo = AsyncMock()
    role_repo.get_by_id = AsyncMock(
        return_value=Role(id=1, name="Admin", is_system_role=True)
    )
    use_case = DeleteRoleUseCase(role_repo, AsyncMock(), AsyncMock(), AsyncMock())
    with pytest.raises(SystemRoleProtectedError):
        await use_case.execute(role_id=1, admin_id=2)


@pytest.mark.asyncio
async def test_delete_role_not_found():
    role_repo = AsyncMock()
    role_repo.get_by_id = AsyncMock(return_value=None)
    use_case = DeleteRoleUseCase(role_repo, AsyncMock(), AsyncMock(), AsyncMock())
    with pytest.raises(RoleNotFoundError):
        await use_case.execute(role_id=99, admin_id=2)


@pytest.mark.asyncio
async def test_delete_role_member_fallback_emits_audit_per_user():
    """D-2.2 / Member-fallback-01 — single transaction:
    1. Look up Member role
    2. bulk_update_role_id (3 affected users)
    3. delete_by_role (cascade junction rows)
    4. delete role
    5. emit 1 role_deleted + 3 user_role_changed = 4 audit rows total
    """
    custom_role = Role(id=10, name="Designer", is_system_role=False)
    member_role = Role(id=3, name="Member", is_system_role=True)
    role_repo = AsyncMock()
    role_repo.get_by_id = AsyncMock(return_value=custom_role)
    role_repo.get_by_name = AsyncMock(return_value=member_role)
    role_repo.delete = AsyncMock(return_value=True)
    role_perm_repo = AsyncMock()
    user_repo = AsyncMock()
    user_repo.bulk_update_role_id = AsyncMock(return_value=[100, 200, 300])  # 3 affected
    audit_repo = AsyncMock()

    use_case = DeleteRoleUseCase(role_repo, role_perm_repo, user_repo, audit_repo)
    await use_case.execute(role_id=10, admin_id=1)

    user_repo.bulk_update_role_id.assert_awaited_once_with(from_role_id=10, to_role_id=3)
    role_perm_repo.delete_by_role.assert_awaited_once_with(10)
    role_repo.delete.assert_awaited_once_with(10)
    # 1 role_deleted + 3 user_role_changed = 4 audit emissions
    assert audit_repo.create_with_metadata.await_count == 4
    # First call should be role_deleted with affected_user_count=3
    first_call = audit_repo.create_with_metadata.await_args_list[0]
    assert first_call.kwargs["entity_type"] == "role"
    assert first_call.kwargs["action"] == "deleted"
    assert first_call.kwargs["metadata"]["affected_user_count"] == 3
    assert first_call.kwargs["metadata"]["fallback_role_name"] == "Member"
    # Subsequent 3 calls should be user role_changed with cascade hint
    for idx, uid in enumerate([100, 200, 300]):
        c = audit_repo.create_with_metadata.await_args_list[idx + 1]
        assert c.kwargs["entity_type"] == "user"
        assert c.kwargs["entity_id"] == uid
        assert c.kwargs["action"] == "role_changed"
        assert c.kwargs["metadata"]["target_role"] == "Member"
        assert c.kwargs["metadata"]["cascade_from_delete_role_id"] == 10


@pytest.mark.asyncio
async def test_delete_role_no_affected_users_still_succeeds():
    """Edge case: deleting a custom role nobody uses still emits 1 role_deleted audit."""
    custom_role = Role(id=10, name="Empty", is_system_role=False)
    member_role = Role(id=3, name="Member", is_system_role=True)
    role_repo = AsyncMock()
    role_repo.get_by_id = AsyncMock(return_value=custom_role)
    role_repo.get_by_name = AsyncMock(return_value=member_role)
    role_repo.delete = AsyncMock(return_value=True)
    role_perm_repo = AsyncMock()
    user_repo = AsyncMock()
    user_repo.bulk_update_role_id = AsyncMock(return_value=[])  # no affected users
    audit_repo = AsyncMock()

    use_case = DeleteRoleUseCase(role_repo, role_perm_repo, user_repo, audit_repo)
    await use_case.execute(role_id=10, admin_id=1)

    # Just 1 role_deleted audit (no per-user cascade audits)
    assert audit_repo.create_with_metadata.await_count == 1
    assert audit_repo.create_with_metadata.await_args.kwargs["action"] == "deleted"
    assert audit_repo.create_with_metadata.await_args.kwargs["metadata"]["affected_user_count"] == 0
