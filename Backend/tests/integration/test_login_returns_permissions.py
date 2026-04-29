"""Phase 15 RBAC-02 — Login response carries permissions[] claim (Plan 15-06).

Validates the JWT claim composition path:
    LoginUserUseCase →
        IRolePermissionRepository.list_by_role(user.role.id) →
            sorted alphabetically (Pitfall 14) →
                JWT payload {"sub", "permissions"} →
                    SecurityAdapter.create_access_token

Test seeds a Member user, calls /api/v1/auth/login, decodes the returned JWT,
asserts the permissions[] claim matches the migration 007 seed (5 perms for
Member). Admin login asserts the empty list (D-1.5 super-role; 0 explicit
role_permissions rows by design).
"""
import pytest
from jose import jwt
from sqlalchemy import select

from app.infrastructure.config import settings
from app.infrastructure.database.models.role import RoleModel
from app.infrastructure.database.models.user import UserModel
from app.infrastructure.security import get_password_hash

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_login_member_returns_member_permissions_in_jwt(client, db_session):
    """A user assigned the Member role gets the 5 Member perms in the JWT
    permissions[] claim, sorted alphabetically (Pitfall 14).

    Migration 007 MEMBER_PERMS = [
        "task.create", "task.change_assignee", "task.change_status",
        "comment.create", "artifact.create"
    ]
    """
    member_role = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Member"))
        )
    ).scalar_one_or_none()
    assert member_role is not None, "Member role must be seeded by migration 007"

    raw_password = "Test1234!"
    user = UserModel(
        email="member-login-test@testexample.com",
        full_name="Member Login Test",
        password_hash=get_password_hash(raw_password),
        is_active=True,
        role_id=member_role.id,
    )
    db_session.add(user)
    await db_session.flush()

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": raw_password},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "access_token" in body

    payload = jwt.decode(
        body["access_token"],
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
    )
    perms = payload.get("permissions")
    assert perms is not None, "JWT must carry permissions[] claim (Phase 15 D-1.3)"
    # Pitfall 14 — sorted alphabetically
    assert perms == sorted(perms), "permissions[] claim must be sorted (Pitfall 14)"
    expected_member_perms = sorted(
        [
            "task.create",
            "task.change_assignee",
            "task.change_status",
            "comment.create",
            "artifact.create",
        ]
    )
    assert perms == expected_member_perms, (
        f"Member should get the 5 seeded Member perms; got {perms}"
    )


@pytest.mark.asyncio
async def test_login_admin_returns_empty_permissions_in_jwt(client, db_session):
    """D-1.5 — Admin gets 0 explicit role_permissions rows; JWT carries [].

    Even with an empty claim, the Admin user can still authorize all actions
    via the _is_admin(user) short-circuit in _has_permission (T-15-04
    last-admin-lockout mitigation).
    """
    admin_role = (
        await db_session.execute(
            select(RoleModel).where(RoleModel.name.ilike("Admin"))
        )
    ).scalar_one_or_none()
    assert admin_role is not None, "Admin role must be seeded"

    raw_password = "AdminTest1234!"
    admin_user = UserModel(
        email="admin-login-test@testexample.com",
        full_name="Admin Login Test",
        password_hash=get_password_hash(raw_password),
        is_active=True,
        role_id=admin_role.id,
    )
    db_session.add(admin_user)
    await db_session.flush()

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": admin_user.email, "password": raw_password},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()

    payload = jwt.decode(
        body["access_token"],
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
    )
    perms = payload.get("permissions")
    assert perms == [], (
        f"Admin should have empty permissions[] claim per D-1.5; got {perms}"
    )
