"""
RBAC enforcement tests for task endpoints.
Tests verify that non-project-members receive HTTP 403 and admins bypass the check.

These tests require a running database (spms_db_test).
"""
import pytest
from httpx import AsyncClient
from sqlalchemy import select as sa_select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from app.infrastructure.database.models import (
    UserModel, ProjectModel, TaskModel, RoleModel, PermissionModel, RolePermissionModel,
)
from app.infrastructure.adapters.security_adapter import SecurityAdapter

# Plan 15-02 TIDY-05 (CONTEXT D-4.4): auto-skip when DB unreachable.
pytestmark = pytest.mark.requires_db


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _create_role(session: AsyncSession, name: str) -> RoleModel:
    role = RoleModel(name=name)
    session.add(role)
    await session.flush()
    return role


async def _grant(session: AsyncSession, role_id: int, perm_key: str) -> None:
    """Grant ``perm_key`` to a role so /auth/login composes it into the JWT's
    permissions[] claim. Without this the test role has zero permissions, so the
    require_permission tier-1 gate fires 403 BEFORE the membership guard — the
    thing these tests actually mean to exercise — is ever reached."""
    perm = (
        await session.execute(sa_select(PermissionModel).where(PermissionModel.key == perm_key))
    ).scalar_one_or_none()
    if perm is None:
        perm = PermissionModel(key=perm_key, label_tr=perm_key, label_en=perm_key, scope="project")
        session.add(perm)
        await session.flush()
    session.add(RolePermissionModel(role_id=role_id, permission_id=perm.id))
    await session.flush()


async def _create_user(session: AsyncSession, email: str, role: RoleModel) -> UserModel:
    security = SecurityAdapter()
    user = UserModel(
        email=email,
        password_hash=security.get_password_hash("Test1234!"),
        full_name=f"Test User {email}",
        role_id=role.id,
        is_active=True,
    )
    session.add(user)
    await session.flush()
    return user


async def _create_project(session: AsyncSession, manager_id: int, suffix: str = "") -> ProjectModel:
    project = ProjectModel(
        key=f"TEST{suffix}",
        name="Test Project",
        description="RBAC test project",
        manager_id=manager_id,
        methodology="KANBAN",
        start_date=datetime(2025, 1, 1, tzinfo=timezone.utc),
    )
    session.add(project)
    await session.flush()
    return project


async def _create_task(session: AsyncSession, project_id: int, assignee_id: int) -> TaskModel:
    task = TaskModel(
        title="Test Task",
        description="RBAC test task",
        project_id=project_id,
        assignee_id=assignee_id,
        priority="MEDIUM",
    )
    session.add(task)
    await session.flush()
    return task


async def _login(client: AsyncClient, email: str) -> str:
    """Login and return the JWT access token."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Test1234!"},
    )
    assert response.status_code == 200, f"Login failed for {email}: {response.text}"
    return response.json()["access_token"]


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_non_member_gets_403_on_list_tasks(client: AsyncClient, db_session: AsyncSession):
    """Authenticated user who is not a project member gets HTTP 403 on GET /api/v1/tasks/project/{project_id}."""
    member_role = await _create_role(db_session, "member_lp")
    owner = await _create_user(db_session, "owner_lp@test.com", member_role)
    non_member = await _create_user(db_session, "nonmember_lp@test.com", member_role)
    project = await _create_project(db_session, owner.id, "LP")
    await db_session.commit()

    token = await _login(client, "nonmember_lp@test.com")
    response = await client.get(
        f"/api/v1/tasks/project/{project.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_non_member_gets_403_on_create_task(client: AsyncClient, db_session: AsyncSession):
    """Non-member gets 403 on POST /api/v1/tasks/project/{project_id}."""
    member_role = await _create_role(db_session, "member_ct")
    await _grant(db_session, member_role.id, "task.create")  # tier-1 PASSES → reach membership guard
    owner = await _create_user(db_session, "owner_ct@test.com", member_role)
    non_member = await _create_user(db_session, "nonmember_ct@test.com", member_role)
    project = await _create_project(db_session, owner.id, "CT")
    await db_session.commit()

    token = await _login(client, "nonmember_ct@test.com")
    response = await client.post(
        "/api/v1/tasks/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Malicious Task",
            "description": "Should be blocked",
            "project_id": project.id,
            "priority": "MEDIUM",
        },
    )
    assert response.status_code == 403, response.text
    # Pin to the membership guard (not the perm gate, which now passes).
    assert response.json()["detail"] == "Access denied to this project"


@pytest.mark.asyncio
async def test_non_member_gets_403_on_get_task(client: AsyncClient, db_session: AsyncSession):
    """Non-member gets 403 on GET /api/v1/tasks/{task_id}."""
    member_role = await _create_role(db_session, "member_gt")
    owner = await _create_user(db_session, "owner_gt@test.com", member_role)
    non_member = await _create_user(db_session, "nonmember_gt@test.com", member_role)
    project = await _create_project(db_session, owner.id, "GT")
    task = await _create_task(db_session, project.id, owner.id)
    await db_session.commit()

    token = await _login(client, "nonmember_gt@test.com")
    response = await client.get(
        f"/api/v1/tasks/{task.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_non_member_gets_403_on_update_task(client: AsyncClient, db_session: AsyncSession):
    """Non-member gets 403 on PUT /api/v1/tasks/{task_id}."""
    member_role = await _create_role(db_session, "member_ut")
    await _grant(db_session, member_role.id, "task.change_status")  # tier-1 PASSES
    owner = await _create_user(db_session, "owner_ut@test.com", member_role)
    non_member = await _create_user(db_session, "nonmember_ut@test.com", member_role)
    project = await _create_project(db_session, owner.id, "UT")
    task = await _create_task(db_session, project.id, owner.id)
    await db_session.commit()

    token = await _login(client, "nonmember_ut@test.com")
    response = await client.put(
        f"/api/v1/tasks/{task.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Hacked Title"},
    )
    assert response.status_code == 403, response.text
    # kills mutation: dropping get_task_project_member's guard would let this through.
    assert response.json()["detail"] == "Access denied to this project"


@pytest.mark.asyncio
async def test_non_member_gets_403_on_delete_task(client: AsyncClient, db_session: AsyncSession):
    """Non-member gets 403 on DELETE /api/v1/tasks/{task_id}."""
    member_role = await _create_role(db_session, "member_dt")
    await _grant(db_session, member_role.id, "task.delete")  # tier-1 PASSES
    owner = await _create_user(db_session, "owner_dt@test.com", member_role)
    non_member = await _create_user(db_session, "nonmember_dt@test.com", member_role)
    project = await _create_project(db_session, owner.id, "DT")
    task = await _create_task(db_session, project.id, owner.id)
    await db_session.commit()

    token = await _login(client, "nonmember_dt@test.com")
    response = await client.delete(
        f"/api/v1/tasks/{task.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403, response.text
    # kills mutation: dropping get_task_project_member's guard would let this through.
    assert response.json()["detail"] == "Access denied to this project"


@pytest.mark.asyncio
async def test_admin_can_access_any_project_tasks(client: AsyncClient, db_session: AsyncSession):
    """Admin user gets 200 on GET /api/v1/tasks/project/{project_id} even without membership."""
    member_role = await _create_role(db_session, "member_adm")
    admin_role = await _create_role(db_session, "admin")
    owner = await _create_user(db_session, "owner_adm@test.com", member_role)
    admin = await _create_user(db_session, "admin_adm@test.com", admin_role)
    project = await _create_project(db_session, owner.id, "ADM")
    await db_session.commit()

    token = await _login(client, "admin_adm@test.com")
    response = await client.get(
        f"/api/v1/tasks/project/{project.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
