"""Phase 15 D-1.17 — Unit tests for migrated ChangeUserRoleUseCase (Plan 15-05).

Validates the post-migration contract:
- Constructor: (user_repo, role_repo, audit_repo)
- execute signature: (target_user_id, role_id: int, admin_id)
- Self-edit guard (D-2.9): target_user_id == admin_id raises PermissionError
- Role existence guard: unknown role_id raises RoleNotFoundError
- User existence guard: unknown target_user_id raises UserNotFoundError
- Happy path: calls user_repo.update_role(target_user_id, role_id) + emits audit
  with target_role_id + target_role_name (looked up via IRoleRepository.get_by_id)
"""
import pytest
from unittest.mock import AsyncMock

from app.application.use_cases.change_user_role import ChangeUserRoleUseCase
from app.domain.entities.role import Role
from app.domain.entities.user import User
from app.domain.exceptions import RoleNotFoundError, UserNotFoundError


# Pydantic v2 — User requires password_hash; use a dummy value for fixtures
_DUMMY_PWD = "$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa"


@pytest.mark.asyncio
async def test_self_edit_raises():
    """D-2.9 — admin trying to change own role hits backend-authoritative guard."""
    user_repo = AsyncMock()
    role_repo = AsyncMock()
    audit_repo = AsyncMock()
    use_case = ChangeUserRoleUseCase(user_repo, role_repo, audit_repo)
    with pytest.raises(PermissionError, match="Kendi rolünü"):
        await use_case.execute(target_user_id=42, role_id=2, admin_id=42)
    user_repo.update_role.assert_not_called()
    audit_repo.create_with_metadata.assert_not_called()


@pytest.mark.asyncio
async def test_user_not_found_raises():
    """target_user_id missing → UserNotFoundError before role lookup."""
    user_repo = AsyncMock()
    user_repo.get_by_id = AsyncMock(return_value=None)
    role_repo = AsyncMock()
    audit_repo = AsyncMock()
    use_case = ChangeUserRoleUseCase(user_repo, role_repo, audit_repo)
    with pytest.raises(UserNotFoundError):
        await use_case.execute(target_user_id=99, role_id=2, admin_id=1)


@pytest.mark.asyncio
async def test_role_not_found_raises():
    """role_id missing → RoleNotFoundError; user is loaded first."""
    target = User(id=42, email="x@y.com", full_name="Y", password_hash=_DUMMY_PWD)
    user_repo = AsyncMock()
    user_repo.get_by_id = AsyncMock(return_value=target)
    role_repo = AsyncMock()
    role_repo.get_by_id = AsyncMock(return_value=None)
    audit_repo = AsyncMock()
    use_case = ChangeUserRoleUseCase(user_repo, role_repo, audit_repo)
    with pytest.raises(RoleNotFoundError):
        await use_case.execute(target_user_id=42, role_id=99, admin_id=1)


@pytest.mark.asyncio
async def test_happy_path_updates_user_and_audits_with_role_name():
    """Migrated contract: update_role(uid, role_id) + audit emits target_role_id + target_role_name."""
    target = User(
        id=42, email="t@y.com", full_name="T", password_hash=_DUMMY_PWD,
        role=Role(id=3, name="OldRole"),
    )
    target_role = Role(id=2, name="NewRole")
    user_repo = AsyncMock()
    user_repo.get_by_id = AsyncMock(return_value=target)
    role_repo = AsyncMock()
    role_repo.get_by_id = AsyncMock(return_value=target_role)
    audit_repo = AsyncMock()
    use_case = ChangeUserRoleUseCase(user_repo, role_repo, audit_repo)

    await use_case.execute(target_user_id=42, role_id=2, admin_id=1)

    user_repo.update_role.assert_awaited_once_with(42, 2)
    audit_repo.create_with_metadata.assert_awaited_once()
    args, kwargs = audit_repo.create_with_metadata.call_args
    assert kwargs["entity_type"] == "user"
    assert kwargs["action"] == "role_changed"
    assert kwargs["entity_id"] == 42
    assert kwargs["user_id"] == 1
    assert kwargs["metadata"]["target_role_id"] == 2
    assert kwargs["metadata"]["target_role_name"] == "NewRole"
    assert kwargs["metadata"]["source_role"] == "OldRole"
    assert kwargs["metadata"]["user_email"] == "t@y.com"
    assert kwargs["metadata"]["requested_by_admin_id"] == 1
