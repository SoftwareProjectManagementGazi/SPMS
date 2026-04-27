"""Phase 14 Plan 14-01 Task 3 — Admin stats endpoint integration tests.

Verifies:
- D-A7 composite payload shape (3 keys: active_users_trend / methodology_distribution / project_velocities)
- Types match expectations
- Access matrix: admin-200, member-403, anonymous-401
- Use-case-level test: project_velocities length ≤ 30 (D-X4 cap)
"""
from __future__ import annotations

from typing import List

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases.get_admin_stats import GetAdminStatsUseCase


async def _db_has_roles(session: AsyncSession) -> bool:
    try:
        result = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (result.scalar() or 0) > 0
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Use case unit test — composite shape + 30-cap defense
# ---------------------------------------------------------------------------


class FakeAuditRepoForStats:
    async def active_users_trend(self, days: int = 30) -> List[dict]:
        return [
            {"date": f"2026-04-{day:02d}", "count": day % 5}
            for day in range(1, days + 1)
        ]


class FakeProjectInfo:
    def __init__(self, id: int, key: str, name: str) -> None:
        self.id = id
        self.key = key
        self.name = name


class FakeProjectRepoForStats:
    def __init__(self, num_projects: int):
        self._num = num_projects

    async def methodology_distribution(self) -> dict:
        return {"scrum": 12, "kanban": 8, "waterfall": 4, "iterative": 2}

    async def list_recent_projects(self, limit: int = 30) -> list:
        # Return up to limit projects (synthetic)
        n = min(self._num, limit)
        return [FakeProjectInfo(id=i + 1, key=f"P{i + 1}", name=f"Project {i + 1}")
                for i in range(n)]


@pytest.mark.asyncio
async def test_get_admin_stats_composite_shape():
    """D-A7 — three top-level keys with correct types."""
    audit = FakeAuditRepoForStats()
    project = FakeProjectRepoForStats(num_projects=5)
    uc = GetAdminStatsUseCase(audit, project, velocity_resolver=None)
    resp = await uc.execute()

    # 3 top-level keys
    data = resp.model_dump()
    assert set(data.keys()) == {
        "active_users_trend",
        "methodology_distribution",
        "project_velocities",
    }
    # Type spot-checks
    assert isinstance(data["active_users_trend"], list)
    assert len(data["active_users_trend"]) == 30
    assert isinstance(data["methodology_distribution"], dict)
    assert data["methodology_distribution"]["scrum"] == 12
    assert isinstance(data["project_velocities"], list)
    assert len(data["project_velocities"]) == 5


@pytest.mark.asyncio
async def test_get_admin_stats_velocities_capped_at_30():
    """D-X4 — even when project_repo would return >30, the use case caps at 30.
    (project_repo.list_recent_projects is invoked with limit=30, so this is a
    defense-in-depth assertion.)"""
    audit = FakeAuditRepoForStats()
    project = FakeProjectRepoForStats(num_projects=100)
    uc = GetAdminStatsUseCase(audit, project, velocity_resolver=None)
    resp = await uc.execute()
    assert len(resp.project_velocities) == 30


# ---------------------------------------------------------------------------
# HTTP integration — access matrix
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_stats_admin_gets_200(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    async with authenticated_client(role="admin") as ac:
        r = await ac.get("/api/v1/admin/stats")
        assert r.status_code == 200, r.text
        body = r.json()
        assert "active_users_trend" in body
        assert "methodology_distribution" in body
        assert "project_velocities" in body
        assert isinstance(body["active_users_trend"], list)
        assert isinstance(body["methodology_distribution"], dict)
        assert isinstance(body["project_velocities"], list)
        assert len(body["project_velocities"]) <= 30


@pytest.mark.asyncio
async def test_admin_stats_member_gets_403(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    async with authenticated_client(role="member") as ac:
        r = await ac.get("/api/v1/admin/stats")
        assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_stats_anonymous_gets_401(client: AsyncClient):
    r = await client.get("/api/v1/admin/stats")
    assert r.status_code == 401
