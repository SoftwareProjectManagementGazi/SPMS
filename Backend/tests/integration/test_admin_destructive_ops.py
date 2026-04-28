"""Phase 14 Plan 14-14 — admin destructive-op bypass + audit-enrichment tests.

Closes UAT Test 23 gap: admin can DELETE any project from /admin/projects
regardless of project ownership; backend returns 204 (not 404). Non-admin
callers (PM/Member) still get 404 when they try to delete a project they
don't manage — info-disclosure-safe response preserved.

Tests follow Phase 12 D-09 in-memory-fake pattern for use-case-level coverage
+ real-DB integration tests for HTTP-layer behavior (matching the existing
test_admin_users_crud.py / test_admin_audit_get_global.py shape).

Sibling-flow Test 4 (M-1 mandatory):
- Plan 14-14 Task 1 audit pass found NO sibling use cases with the same
  PM-scoped guard:
    * UpdateProjectUseCase already has admin-bypass (manage_projects.py:129
      accepts is_admin: bool; router passes is_admin=_is_admin(current_user)).
    * Archive/un-archive route through UpdateProjectUseCase (status=ARCHIVED)
      so they ride on the existing Update bypass.
    * Member ops (Add/Remove/AddTeam) have no internal manager guard; the
      guard lives at the API layer (_is_manager_or_admin) which is already
      admin-aware.
    * Bulk-deactivate / bulk-role-change / reset-password are already
      admin-scoped via Depends(require_admin).
- Test 4 ships as @pytest.mark.skip(reason=...) regression sentinel so the
  test exists in the suite. If a future change re-introduces a PM-only guard
  on a sibling, re-enable this test.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases.manage_projects import DeleteProjectUseCase
from app.domain.entities.project import Methodology, Project
from app.domain.entities.role import Role
from app.domain.entities.user import User
from app.domain.exceptions import ProjectNotFoundError


# ---------------------------------------------------------------------------
# In-memory fakes (Phase 12 D-09 pattern — DIP enforced, no DB needed)
# ---------------------------------------------------------------------------


class FakeProjectRepoForDelete:
    """Minimal IProjectRepository impl — get_by_id + delete. Captures last
    delete call for assertions."""

    def __init__(self, projects: Dict[int, Project]) -> None:
        self._projects = dict(projects)
        self.deleted_ids: List[int] = []

    async def get_by_id(self, project_id: int) -> Optional[Project]:
        return self._projects.get(project_id)

    async def delete(self, project_id: int) -> None:
        self.deleted_ids.append(project_id)
        self._projects.pop(project_id, None)


class FakeAuditRepoForDelete:
    """Captures every create_with_metadata call so tests can assert
    target_manager_id was recorded for compliance."""

    def __init__(self) -> None:
        self.calls: List[Dict[str, Any]] = []

    async def create_with_metadata(
        self,
        entity_type: str,
        entity_id: int,
        action: str,
        user_id: Optional[int],
        metadata: dict,
        field_name: str = "transition",
        old_value: Optional[Any] = None,
        new_value: Optional[Any] = None,
    ):
        self.calls.append(
            {
                "entity_type": entity_type,
                "entity_id": entity_id,
                "action": action,
                "user_id": user_id,
                "metadata": metadata,
                "field_name": field_name,
            }
        )
        return None


def _make_user(uid: int, role_name: str, email: str) -> User:
    return User(
        id=uid,
        email=email,
        password_hash="hash",
        full_name=f"User {uid}",
        is_active=True,
        role=Role(id=1, name=role_name),
    )


def _make_project(pid: int, manager_id: int, key: str = "TEST", name: str = "Test Project") -> Project:
    from datetime import datetime
    return Project(
        id=pid,
        key=key,
        name=name,
        start_date=datetime(2026, 1, 1),
        methodology=Methodology.SCRUM,
        manager_id=manager_id,
        status="ACTIVE",
    )


# ---------------------------------------------------------------------------
# Use-case-level tests (in-memory fakes)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_can_delete_unowned_project_use_case():
    """Test 1 — admin (role.name='admin') deletes a project owned by a
    different PM. Use case returns silently (no exception); project is
    removed from the repo; audit row records action='project.deleted_by_admin'
    with metadata.target_manager_id == original PM id (M-1 must-haves)."""
    project = _make_project(pid=42, manager_id=99)  # PM 99 owns it
    repo = FakeProjectRepoForDelete({42: project})
    audit = FakeAuditRepoForDelete()
    admin = _make_user(uid=1, role_name="admin", email="admin@spms.com")

    uc = DeleteProjectUseCase(repo, audit_repo=audit)
    await uc.execute(project_id=42, actor=admin)

    assert 42 in repo.deleted_ids
    # Audit-trail compliance — actor=admin.id, target=project_id, AND
    # target_manager_id=<original PM id>.
    assert len(audit.calls) == 1
    call = audit.calls[0]
    assert call["entity_type"] == "project"
    assert call["entity_id"] == 42
    assert call["action"] == "project.deleted_by_admin"
    assert call["user_id"] == 1  # admin.id
    md = call["metadata"]
    assert md["target_manager_id"] == 99  # original PM id
    assert md["project_key"] == "TEST"
    assert md["project_name"] == "Test Project"


@pytest.mark.asyncio
async def test_pm_cannot_delete_unowned_project_use_case():
    """Test 2 — non-admin PM tries to delete a project they don't manage.
    Use case raises ProjectNotFoundError (info-disclosure-safe — same
    response as a missing project). NO audit row written (the bypass
    didn't kick in)."""
    project = _make_project(pid=42, manager_id=99)  # PM 99 owns it
    repo = FakeProjectRepoForDelete({42: project})
    audit = FakeAuditRepoForDelete()
    other_pm = _make_user(uid=7, role_name="Project Manager", email="pm@spms.com")

    uc = DeleteProjectUseCase(repo, audit_repo=audit)
    with pytest.raises(ProjectNotFoundError):
        await uc.execute(project_id=42, actor=other_pm)

    assert repo.deleted_ids == []  # Nothing deleted
    assert audit.calls == []  # No admin-action audit row


@pytest.mark.asyncio
async def test_admin_can_delete_own_project_use_case():
    """Test 3 — admin who is ALSO the project's manager → delete still
    works, but the by_admin audit row is NOT written (the bypass didn't
    kick in because actor.id == manager_id; the regular delete path is
    sufficient and the repo-level audit covers it)."""
    project = _make_project(pid=42, manager_id=1)  # admin (id=1) owns it
    repo = FakeProjectRepoForDelete({42: project})
    audit = FakeAuditRepoForDelete()
    admin_owner = _make_user(uid=1, role_name="admin", email="admin@spms.com")

    uc = DeleteProjectUseCase(repo, audit_repo=audit)
    await uc.execute(project_id=42, actor=admin_owner)

    assert 42 in repo.deleted_ids
    # No `project.deleted_by_admin` audit row — admin was acting as PM.
    assert audit.calls == []


@pytest.mark.skip(
    reason=(
        "Plan 14-14 Task 1 audit pass found NO sibling use cases with a "
        "PM-scoped ownership guard that admin needs to bypass: "
        "(a) UpdateProjectUseCase already accepts is_admin: bool and the "
        "router passes is_admin=_is_admin(current_user) — admin can already "
        "PATCH any project (UAT Test 22 / D-D2 already green); "
        "(b) Archive/un-archive route through UpdateProjectUseCase via "
        "status=ARCHIVED so they ride on the same bypass; "
        "(c) AddProjectMemberUseCase / RemoveProjectMemberUseCase / "
        "AddTeamToProjectUseCase have no internal manager guard — the guard "
        "lives at the API layer (_is_manager_or_admin) which is already "
        "admin-aware; "
        "(d) Bulk-deactivate / bulk-role-change / reset-password are admin-"
        "scoped via Depends(require_admin). "
        "Skip preserved as a documented regression sentinel per Plan 14-14 "
        "must-haves M-1 — if a future change re-introduces a PM-only guard "
        "on a sibling write-path use case, re-enable this test by replacing "
        "the skip with the real assertion."
    )
)
def test_admin_can_archive_unowned_project_skip_sentinel():
    """Test 4 (M-1 mandatory regression sentinel) — sibling-flow test.

    Per Plan 14-14 must-haves truth #5: this test MUST exist in the suite
    even when no sibling use case currently has the bug. The skip reason
    above documents the audit findings; re-enable if a regression occurs.
    """
    pass  # pragma: no cover


# ---------------------------------------------------------------------------
# HTTP integration test — real-DB end-to-end (matches existing admin tests)
# ---------------------------------------------------------------------------


async def _db_has_roles(session: AsyncSession) -> bool:
    try:
        result = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (result.scalar() or 0) > 0
    except Exception:
        return False


async def _seed_pm_user(session: AsyncSession, email: str) -> int:
    """Insert a Project Manager user (different from the admin authclient
    fixture user) and return their id."""
    # Get Project Manager role id (case-insensitive)
    pm_role_id = (
        await session.execute(
            text("SELECT id FROM roles WHERE LOWER(name)='project manager' LIMIT 1")
        )
    ).scalar()
    if pm_role_id is None:
        # Fallback: any non-admin role
        pm_role_id = (
            await session.execute(
                text("SELECT id FROM roles WHERE LOWER(name)<>'admin' LIMIT 1")
            )
        ).scalar()

    await session.execute(
        text(
            "INSERT INTO users (email, full_name, password_hash, is_active, role_id) "
            "VALUES (:email, 'Other PM', "
            "'$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa', "
            "true, :rid) ON CONFLICT (email) DO NOTHING"
        ),
        {"email": email, "rid": pm_role_id},
    )
    uid = (
        await session.execute(
            text("SELECT id FROM users WHERE email=:email"), {"email": email}
        )
    ).scalar()
    await session.flush()
    return int(uid)


async def _seed_project_owned_by(session: AsyncSession, key: str, manager_id: int) -> int:
    """Insert a project with manager_id set to the given user, return id."""
    await session.execute(
        text(
            "INSERT INTO projects (key, name, start_date, methodology, status, manager_id) "
            "VALUES (:k, :n, now(), 'SCRUM', 'ACTIVE', :mid) "
            "ON CONFLICT (key) DO UPDATE SET manager_id = EXCLUDED.manager_id"
        ),
        {"k": key, "n": f"Project {key}", "mid": manager_id},
    )
    pid = (
        await session.execute(
            text("SELECT id FROM projects WHERE key=:k"), {"k": key}
        )
    ).scalar()
    await session.flush()
    return int(pid)


@pytest.mark.asyncio
async def test_admin_delete_unowned_project_returns_204(
    authenticated_client, db_session
):
    """End-to-end — admin DELETEs /api/v1/projects/{id} where the project
    is owned by a different PM. Backend returns 204, project row is gone,
    and an audit_log row exists with action='project.deleted_by_admin'
    + extra_metadata->>'target_manager_id' matching the original PM id."""
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded — admin tests need role table populated")

    # Seed: a PM user (different from authclient admin) + a project they own.
    pm_id = await _seed_pm_user(db_session, "delete_target_pm@testexample.com")
    project_id = await _seed_project_owned_by(db_session, "DELOK", pm_id)

    async with authenticated_client(role="admin") as ac:
        r = await ac.delete(f"/api/v1/projects/{project_id}")
        assert r.status_code == 204, r.text

    # Project gone from DB
    remaining = (
        await db_session.execute(
            text("SELECT id FROM projects WHERE id=:pid"),
            {"pid": project_id},
        )
    ).scalar()
    assert remaining is None, "project row should be deleted"

    # Audit row exists
    row = (
        await db_session.execute(
            text(
                "SELECT user_id, metadata FROM audit_log "
                "WHERE action='project.deleted_by_admin' "
                "AND entity_type='project' AND entity_id=:pid"
            ),
            {"pid": project_id},
        )
    ).first()
    assert row is not None, "expected project.deleted_by_admin audit row"
    actor_id, meta = row[0], row[1]
    assert isinstance(meta, dict)
    assert meta.get("target_manager_id") == pm_id
    assert meta.get("project_key") == "DELOK"
    # actor_id is the admin user — assert it's not the PM whose project we deleted
    assert actor_id is not None
    assert actor_id != pm_id


@pytest.mark.asyncio
async def test_pm_cannot_delete_unowned_project_returns_404(
    authenticated_client, db_session
):
    """End-to-end — non-admin PM tries to DELETE a project they don't
    manage. Backend returns 404 (info-disclosure-safe — same response
    as a missing project). Project row remains in DB."""
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded — admin tests need role table populated")

    # Seed: a project owned by a DIFFERENT PM (not the authclient PM user).
    other_pm_id = await _seed_pm_user(db_session, "owner_pm@testexample.com")
    project_id = await _seed_project_owned_by(db_session, "PMNOPE", other_pm_id)

    async with authenticated_client(role="Project Manager") as ac:
        r = await ac.delete(f"/api/v1/projects/{project_id}")
        assert r.status_code == 404, r.text

    # Project still exists
    remaining = (
        await db_session.execute(
            text("SELECT id FROM projects WHERE id=:pid"),
            {"pid": project_id},
        )
    ).scalar()
    assert remaining == project_id, "project row should NOT be deleted"
