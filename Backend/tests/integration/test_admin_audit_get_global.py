"""Phase 14 Plan 14-01 Task 3 — Admin audit endpoint integration tests.

Verifies:
- D-A8: admin gets the paginated audit list
- D-Z2 / Pitfall 6: truncated=True when actual count > 50000 (use case-level
  unit test with in-memory fake; in-DB seeding 50k rows is too slow for CI)
- Pitfall 7: JSONB filter (action_prefix=task.) returns matches when seeded
  with action='task.created'
- Access matrix: admin-200, member-403, anonymous-401
"""
from __future__ import annotations

from typing import List, Optional, Tuple

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases.get_global_audit import GetGlobalAuditUseCase


async def _db_has_roles(session: AsyncSession) -> bool:
    try:
        result = await session.execute(text("SELECT COUNT(*) FROM roles"))
        return (result.scalar() or 0) > 0
    except Exception:
        return False


# ---------------------------------------------------------------------------
# In-memory fake — exercises Pitfall 6 (50k cap) without seeding the DB
# ---------------------------------------------------------------------------


class FakeAuditRepoForCap:
    """Returns N items from get_global_audit, computing truncated correctly
    so the use case-level math matches the real audit_repo.get_global_audit
    semantics."""

    def __init__(self, total_seeded: int):
        self.total_seeded = total_seeded
        # Synthetic items list — only the first `limit` are actually returned.
        # Each item is a minimal dict matching AdminAuditItemDTO.
        self._items_template = [
            {
                "id": i + 1,
                "action": "task.created",
                "entity_type": "task",
                "entity_id": (i % 100) + 1,
                "field_name": None, "old_value": None, "new_value": None,
                "user_id": (i % 10) + 1, "user_name": f"User {(i % 10) + 1}",
                "user_avatar": None, "timestamp": None,
                "metadata": {"project_id": (i % 5) + 1},
            }
            for i in range(min(total_seeded, 50000))  # Cap items to 50k
        ]

    async def get_global_audit(
        self,
        date_from=None,
        date_to=None,
        actor_id: Optional[int] = None,
        action_prefix: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[dict], int, bool]:
        # Apply minimal in-memory filter so the test can exercise the
        # action_prefix path too.
        items = list(self._items_template)
        if action_prefix:
            items = [i for i in items if i["action"].startswith(action_prefix)]
        if actor_id is not None:
            items = [i for i in items if i["user_id"] == actor_id]
        HARD_CAP = 50000
        actual = self.total_seeded if not (action_prefix or actor_id) else len(items)
        truncated = actual > HARD_CAP
        capped_total = min(actual, HARD_CAP)
        eff_offset = min(offset, capped_total)
        eff_limit = max(0, min(limit, capped_total - eff_offset))
        return items[eff_offset : eff_offset + eff_limit], capped_total, truncated


# ---------------------------------------------------------------------------
# Use-case-level tests (Pitfall 6 truncated flag)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_global_audit_truncated_flag_when_over_50k():
    """Pitfall 6: actual_count > 50000 → response.truncated=True AND
    total == 50000 (capped)."""
    repo = FakeAuditRepoForCap(total_seeded=60000)
    uc = GetGlobalAuditUseCase(repo)
    resp = await uc.execute(limit=50, offset=0)
    assert resp.truncated is True
    assert resp.total == 50000
    assert len(resp.items) == 50


@pytest.mark.asyncio
async def test_get_global_audit_not_truncated_when_under_50k():
    repo = FakeAuditRepoForCap(total_seeded=200)
    uc = GetGlobalAuditUseCase(repo)
    resp = await uc.execute(limit=50, offset=0)
    assert resp.truncated is False
    assert resp.total == 200
    assert len(resp.items) == 50


@pytest.mark.asyncio
async def test_get_global_audit_action_prefix_filter():
    """Pitfall 7: action_prefix filter returns matching rows. Fake honors
    the prefix; in production this maps to AuditLogModel.action.like(...)."""
    repo = FakeAuditRepoForCap(total_seeded=100)
    uc = GetGlobalAuditUseCase(repo)
    resp = await uc.execute(action_prefix="task.", limit=10, offset=0)
    assert resp.total == 100  # All synthetic items use action="task.created"
    # Filter that excludes everything
    resp2 = await uc.execute(action_prefix="zzz.", limit=10, offset=0)
    assert resp2.total == 0


# ---------------------------------------------------------------------------
# HTTP integration — access matrix
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_audit_admin_gets_200(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    async with authenticated_client(role="admin") as ac:
        r = await ac.get("/api/v1/admin/audit")
        assert r.status_code == 200, r.text
        body = r.json()
        assert "items" in body
        assert "total" in body
        assert "truncated" in body
        assert isinstance(body["truncated"], bool)


@pytest.mark.asyncio
async def test_admin_audit_member_gets_403(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    async with authenticated_client(role="member") as ac:
        r = await ac.get("/api/v1/admin/audit")
        assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_audit_anonymous_gets_401(client: AsyncClient):
    r = await client.get("/api/v1/admin/audit")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_admin_audit_json_export_admin_gets_attachment(authenticated_client, db_session):
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    async with authenticated_client(role="admin") as ac:
        r = await ac.get("/api/v1/admin/audit.json")
        assert r.status_code == 200, r.text
        assert r.headers["content-type"].startswith("application/json")
        assert "attachment" in r.headers.get("content-disposition", "")


@pytest.mark.asyncio
async def test_admin_audit_pagination_param_validation(authenticated_client, db_session):
    """limit must be ge=1 le=100; offset must be ge=0."""
    if not await _db_has_roles(db_session):
        pytest.skip("Roles not seeded")
    async with authenticated_client(role="admin") as ac:
        r = await ac.get("/api/v1/admin/audit?limit=0")
        assert r.status_code == 422
        r2 = await ac.get("/api/v1/admin/audit?limit=200")
        assert r2.status_code == 422
        r3 = await ac.get("/api/v1/admin/audit?offset=-1")
        assert r3.status_code == 422
