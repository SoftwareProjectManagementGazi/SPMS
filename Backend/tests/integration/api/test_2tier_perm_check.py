"""Phase 15 RBAC-04 / D-1.13 / D-1.14 — 2-tier perm + membership/leader integration tests (Plan 15-08).

Each endpoint family covered with the Hibrit 2-tier semantics:
- (a) caller has NO perm → 403 PERMISSION_DENIED (require_permission factory short-circuits FIRST)
- (b) caller has perm but is NOT a project member/leader → 403 (membership/leader gate trips)
- (c) caller has BOTH perm + membership/leader → 2xx success (selective coverage; full-stack
      green-path is implicitly covered by the existing Phase 9/12/14 family suites which run
      under the Admin super-role and continue to pass post-Plan 15-08 per Pitfall 9 + D-1.5)

The 2-tier check is the security invariant for D-1.14: matrix toggle UI is GERÇEK enforce —
a PM rolündeki kullanıcı with `task.delete=granted` cannot delete tasks on a project where they
aren't Team.leader_id (require_project_transition_authority blocks). Backend enforces both layers
so granting/revoking perms via the matrix actually changes endpoint behavior.

Pitfall 13 ordering: require_permission placed FIRST positionally (cheap in-memory claim lookup
short-circuits before DB-heavy membership/leader queries). Cached get_current_user reuses the
single JWT decode across both decorators.

Backwards-compat (Pitfall 9 + D-1.5): existing Admin authenticated_client tests keep passing
because _is_admin(user) super-role short-circuits in _has_permission BEFORE the claim check.
"""
import json

import pytest
from sqlalchemy import select, text

from app.infrastructure.database.models.user import UserModel

pytestmark = pytest.mark.requires_db


# ---------------------------------------------------------------------------
# Seed helpers
# ---------------------------------------------------------------------------

_PROCESS_CONFIG = {
    "schema_version": 1,
    "workflow": {
        "mode": "flexible",
        "nodes": [
            {
                "id": "nd_a1b2c3d4e5",
                "name": "Tasarim",
                "x": 0,
                "y": 0,
                "color": "#888",
                "is_archived": False,
                "is_initial": True,
                "is_final": True,
            }
        ],
        "edges": [],
        "groups": [],
    },
    "phase_completion_criteria": {},
    "enable_phase_assignment": False,
    "enforce_sequential_dependencies": False,
    "enforce_wip_limits": False,
    "restrict_expired_sprints": False,
}


async def _resolve_permitted_user_id(db_session, perms: list[str]) -> int:
    """Resolve the UserModel.id minted by the permitted_client factory.

    NOTE: must be called AFTER `async with permitted_client(perms=...)` has
    entered (the fixture creates the user inside its context). The fixture
    writes a UserModel keyed off a hash of the perms tuple; we query
    post-flush by the same email pattern so 2-tier tests can wire the user
    as a project member/manager for the GREEN-path case.
    """
    expected_email = f"permclient+{abs(hash(tuple(sorted(perms))))}@testexample.com"
    row = await db_session.execute(
        select(UserModel.id).where(UserModel.email == expected_email)
    )
    return row.scalar_one()


async def _seed_project(
    db_session,
    *,
    key: str,
    member_user_id: int | None = None,
    manager_user_id: int | None = None,
) -> int:
    """Seed a minimal project; optionally attach a member or set the manager.

    `manager_user_id` is required for `require_project_transition_authority`
    (Phase 9 D-15) to pass — without manager (or Team.leader_id) the inline
    `_authorize_transition` helper raises 403 even with admin perms.
    """
    existing = (
        await db_session.execute(
            text("SELECT id FROM projects WHERE key=:k"), {"k": key}
        )
    ).scalar()
    if existing:
        return existing

    pc = json.dumps(_PROCESS_CONFIG)
    if manager_user_id is not None:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status, "
                "process_config, manager_id) "
                "VALUES (:key, '2T API', now(), 'SCRUM', 'ACTIVE', "
                "CAST(:pc AS jsonb), :mid)"
            ),
            {"key": key, "pc": pc, "mid": manager_user_id},
        )
    else:
        await db_session.execute(
            text(
                "INSERT INTO projects (key, name, start_date, methodology, status, "
                "process_config) "
                "VALUES (:key, '2T API', now(), 'SCRUM', 'ACTIVE', CAST(:pc AS jsonb))"
            ),
            {"key": key, "pc": pc},
        )
    await db_session.flush()
    pid = (
        await db_session.execute(
            text("SELECT id FROM projects WHERE key=:k"), {"k": key})
    ).scalar()

    if member_user_id is not None:
        await db_session.execute(
            text(
                "INSERT INTO project_members (project_id, user_id) "
                "VALUES (:pid, :uid) ON CONFLICT DO NOTHING"
            ),
            {"pid": pid, "uid": member_user_id},
        )
        await db_session.flush()

    return pid


async def _seed_task(db_session, project_id: int, title: str = "T1") -> int:
    """Seed a task tied to project_id; returns task.id."""
    res = await db_session.execute(
        text(
            "INSERT INTO tasks (title, description, priority, project_id, "
            "is_recurring, status_locked, is_archived, due_date_dirty) "
            "VALUES (:t, 'desc', 'medium', :pid, false, false, false, false) "
            "RETURNING id"
        ),
        {"t": title, "pid": project_id},
    )
    return res.scalar_one()


# ---------------------------------------------------------------------------
# Tasks family — POST/PATCH/DELETE; perm-missing trips tier 1 BEFORE membership/RPTA
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_2tier_task_create_403_when_perm_missing(permitted_client, db_session):
    """POST /tasks/ with no task.create perm → 403 PERMISSION_DENIED (tier 1 trips)."""
    pid = await _seed_project(db_session, key="2TT01")
    async with permitted_client(perms=[]) as client:
        resp = await client.post(
            "/api/v1/tasks/",
            json={"title": "T1", "project_id": pid},
        )
    assert resp.status_code == 403, resp.text
    detail = resp.json()["detail"]
    assert detail["error_code"] == "PERMISSION_DENIED"
    assert detail["missing_permission"] == "task.create"


@pytest.mark.asyncio
async def test_2tier_task_create_403_when_membership_missing(
    permitted_client, db_session
):
    """Has task.create but is NOT a project member → 403 from inline membership check."""
    pid = await _seed_project(db_session, key="2TT02")
    async with permitted_client(perms=["task.create"]) as client:
        resp = await client.post(
            "/api/v1/tasks/",
            json={"title": "T1", "project_id": pid},
        )
    # tier 1 passes; tier 2 (inline `_is_admin` + `get_by_id_and_user`) returns 403
    assert resp.status_code == 403, resp.text


@pytest.mark.asyncio
async def test_2tier_task_create_201_when_both_present(permitted_client, db_session):
    """task.create + project membership → 201 created."""
    async with permitted_client(perms=["task.create"]) as client:
        # Resolve the freshly-minted user id INSIDE the fixture context.
        user_id = await _resolve_permitted_user_id(db_session, ["task.create"])
        pid = await _seed_project(db_session, key="2TT03", member_user_id=user_id)
        resp = await client.post(
            "/api/v1/tasks/",
            json={"title": "T1", "project_id": pid},
        )
    assert resp.status_code == 201, resp.text


@pytest.mark.asyncio
async def test_2tier_task_delete_403_when_perm_missing(permitted_client, db_session):
    """DELETE /tasks/{id} with no task.delete → 403 PERMISSION_DENIED."""
    async with permitted_client(perms=[]) as client:
        # Even if the task does not exist, perm-first short-circuit returns 403
        # with the perm envelope (Pitfall 13 ordering verification).
        resp = await client.delete("/api/v1/tasks/99999")
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "task.delete"


# ---------------------------------------------------------------------------
# Projects family — POST/PATCH/DELETE
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_2tier_project_create_403_when_perm_missing(permitted_client):
    """POST /projects/ with no project.create → 403 PERMISSION_DENIED."""
    async with permitted_client(perms=[]) as client:
        resp = await client.post(
            "/api/v1/projects/",
            json={
                "key": "P2T01",
                "name": "2tier-fail",
                "start_date": "2026-04-29T00:00:00",
                "methodology": "SCRUM",
            },
        )
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "project.create"


@pytest.mark.asyncio
async def test_2tier_project_create_201_when_perm_present(permitted_client):
    """project.create alone is sufficient (creator becomes manager)."""
    async with permitted_client(perms=["project.create"]) as client:
        resp = await client.post(
            "/api/v1/projects/",
            json={
                "key": "P2T02",
                "name": "2tier-create-ok",
                "start_date": "2026-04-29T00:00:00",
                "methodology": "SCRUM",
            },
        )
    assert resp.status_code in (200, 201), resp.text


@pytest.mark.asyncio
async def test_2tier_project_delete_403_when_perm_missing(permitted_client, db_session):
    """DELETE /projects/{id} with no project.delete → 403 PERMISSION_DENIED."""
    pid = await _seed_project(db_session, key="P2T03")
    async with permitted_client(perms=[]) as client:
        resp = await client.delete(f"/api/v1/projects/{pid}")
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "project.delete"


@pytest.mark.asyncio
async def test_2tier_project_edit_403_when_perm_missing(permitted_client, db_session):
    """PATCH /projects/{id} with no project.edit → 403 PERMISSION_DENIED."""
    pid = await _seed_project(db_session, key="P2T04")
    async with permitted_client(perms=[]) as client:
        resp = await client.patch(
            f"/api/v1/projects/{pid}", json={"name": "renamed"}
        )
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "project.edit"


# ---------------------------------------------------------------------------
# Comments family (resource-specific perms per D-3.5)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_2tier_comment_create_403_when_perm_missing(permitted_client):
    """POST /comments/ with no comment.create → 403 PERMISSION_DENIED.

    Verifies tier 1 (require_permission) fires BEFORE the inline task lookup +
    membership check (Pitfall 13). Even with a non-existent task_id the response
    must be PERMISSION_DENIED, not TASK_NOT_FOUND.
    """
    async with permitted_client(perms=[]) as client:
        resp = await client.post(
            "/api/v1/comments/",
            json={"task_id": 999999, "content": "hi"},
        )
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "comment.create"


@pytest.mark.asyncio
async def test_2tier_comment_edit_403_when_perm_missing(permitted_client):
    """PATCH /comments/{id} with no comment.edit → 403 PERMISSION_DENIED."""
    async with permitted_client(perms=[]) as client:
        resp = await client.patch(
            "/api/v1/comments/99999", json={"content": "hello"}
        )
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "comment.edit"


@pytest.mark.asyncio
async def test_2tier_comment_delete_403_when_perm_missing(permitted_client):
    """DELETE /comments/{id} with no comment.delete → 403 PERMISSION_DENIED."""
    async with permitted_client(perms=[]) as client:
        resp = await client.delete("/api/v1/comments/99999")
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "comment.delete"


# ---------------------------------------------------------------------------
# Milestones family (resource-specific perms + RPTA)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_2tier_milestone_create_403_when_perm_missing(permitted_client):
    """POST /milestones with no milestone.create → 403 PERMISSION_DENIED.

    Body project_id intentionally non-existent — perm-first short-circuit returns
    PERMISSION_DENIED before _authorize_transition runs (Pitfall 13).
    """
    async with permitted_client(perms=[]) as client:
        resp = await client.post(
            "/api/v1/milestones",
            json={"project_id": 999999, "name": "M1"},
        )
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "milestone.create"


@pytest.mark.asyncio
async def test_2tier_milestone_create_blocked_when_not_pm_leader(
    permitted_client, db_session
):
    """milestone.create perm but NOT project manager/leader → 403 from inline RPTA."""
    pid = await _seed_project(db_session, key="M2T02")
    async with permitted_client(perms=["milestone.create"]) as client:
        resp = await client.post(
            "/api/v1/milestones",
            json={"project_id": pid, "name": "M2"},
        )
    # tier 1 passes (perm); tier 2 (inline `_authorize_transition`) → 403
    assert resp.status_code == 403, resp.text


@pytest.mark.asyncio
async def test_2tier_milestone_edit_403_when_perm_missing(permitted_client):
    """PATCH /milestones/{id} with no milestone.edit → 403 PERMISSION_DENIED."""
    async with permitted_client(perms=[]) as client:
        resp = await client.patch(
            "/api/v1/milestones/99999", json={"name": "renamed"}
        )
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "milestone.edit"


@pytest.mark.asyncio
async def test_2tier_milestone_delete_403_when_perm_missing(permitted_client):
    """DELETE /milestones/{id} with no milestone.delete → 403 PERMISSION_DENIED."""
    async with permitted_client(perms=[]) as client:
        resp = await client.delete("/api/v1/milestones/99999")
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "milestone.delete"


# ---------------------------------------------------------------------------
# Artifacts family (D-3.5 resource-specific perms)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_2tier_artifact_create_403_when_perm_missing(permitted_client):
    """POST /artifacts with no artifact.create → 403 PERMISSION_DENIED."""
    async with permitted_client(perms=[]) as client:
        resp = await client.post(
            "/api/v1/artifacts",
            json={"project_id": 999999, "name": "A1"},
        )
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "artifact.create"


@pytest.mark.asyncio
async def test_2tier_artifact_edit_403_when_perm_missing(permitted_client):
    """PATCH /artifacts/{id} with no artifact.edit → 403 PERMISSION_DENIED."""
    async with permitted_client(perms=[]) as client:
        resp = await client.patch(
            "/api/v1/artifacts/99999", json={"name": "renamed"}
        )
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "artifact.edit"


@pytest.mark.asyncio
async def test_2tier_artifact_delete_403_when_perm_missing(permitted_client):
    """DELETE /artifacts/{id} with no artifact.delete → 403 PERMISSION_DENIED."""
    async with permitted_client(perms=[]) as client:
        resp = await client.delete("/api/v1/artifacts/99999")
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "artifact.delete"


# ---------------------------------------------------------------------------
# Phase reports family (D-3.5 resource-specific perms)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_2tier_phase_report_create_403_when_perm_missing(permitted_client):
    """POST /phase-reports with no phase_report.create → 403 PERMISSION_DENIED."""
    async with permitted_client(perms=[]) as client:
        resp = await client.post(
            "/api/v1/phase-reports",
            json={"project_id": 999999, "phase_id": "nd_a1b2c3d4e5"},
        )
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "phase_report.create"


@pytest.mark.asyncio
async def test_2tier_phase_report_edit_403_when_perm_missing(permitted_client):
    """PATCH /phase-reports/{id} with no phase_report.edit → 403 PERMISSION_DENIED."""
    async with permitted_client(perms=[]) as client:
        resp = await client.patch(
            "/api/v1/phase-reports/99999", json={"issues": "x"}
        )
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "phase_report.edit"


@pytest.mark.asyncio
async def test_2tier_phase_report_delete_403_when_perm_missing(permitted_client):
    """DELETE /phase-reports/{id} with no phase_report.delete → 403 PERMISSION_DENIED."""
    async with permitted_client(perms=[]) as client:
        resp = await client.delete("/api/v1/phase-reports/99999")
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "phase_report.delete"


# ---------------------------------------------------------------------------
# Labels family (lifecycle.edit umbrella per D-3.5 admin convention)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_2tier_label_create_403_when_perm_missing(permitted_client):
    """POST /labels with no lifecycle.edit → 403 PERMISSION_DENIED."""
    async with permitted_client(perms=[]) as client:
        resp = await client.post(
            "/api/v1/labels",
            json={"project_id": 999999, "name": "L1", "color": "#aabbcc"},
        )
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "lifecycle.edit"


# ---------------------------------------------------------------------------
# Phase transitions family (lifecycle.edit per D-1.4)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_2tier_phase_transition_403_when_perm_missing(permitted_client):
    """POST /projects/{id}/phase-transitions with no lifecycle.edit → 403."""
    async with permitted_client(perms=[]) as client:
        resp = await client.post(
            "/api/v1/projects/999999/phase-transitions",
            json={
                "to_phase_id": "nd_a1b2c3d4e5",
                "from_phase_id": "nd_a1b2c3d4e5",
                "allow_override": False,
            },
        )
    assert resp.status_code == 403, resp.text
    assert resp.json()["detail"]["missing_permission"] == "lifecycle.edit"


# ---------------------------------------------------------------------------
# Admin super-role smoke (D-1.5) — the existing authenticated_client fixture
# uses role=Admin which super-roles past _has_permission, so existing test
# suites continue to pass without modification.
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_2tier_admin_super_role_bypasses_perm_check(
    authenticated_client, db_session
):
    """Admin role short-circuits _has_permission (D-1.5); endpoint reachable
    even though the JWT carries no permissions[] claim."""
    pid = await _seed_project(db_session, key="ADM2T")
    async with authenticated_client(role="admin") as client:
        # Admin path: super-role bypasses both tiers; 200/204 expected.
        resp = await client.delete(f"/api/v1/projects/{pid}")
    # 204 success or 404 (project missing on rollback) — never 403.
    assert resp.status_code != 403, resp.text
