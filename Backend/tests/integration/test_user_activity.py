"""Phase 13 Plan 13-01 Task 1 — user activity use case tests (in-memory fakes).

Pattern: Phase 12 D-09 in-memory fakes. Verifies the privacy filter signaling
contract — viewer_user_id + is_admin must reach the repository so the SQL
WHERE clause scopes results to the viewer's project memberships.
"""
from __future__ import annotations
from typing import List, Optional, Tuple
import pytest

from app.application.use_cases.get_user_activity import GetUserActivityUseCase


def _audit_item(
    item_id: int, *, action: str = "created", entity_type: str = "task",
    entity_id: int = 1, project_id: Optional[int] = None,
):
    """Build a synthetic audit_log item dict with the project association
    encoded into ``metadata.project_id`` for in-memory filter logic.
    """
    return {
        "id": item_id, "action": action, "entity_type": entity_type,
        "entity_id": entity_id, "entity_label": None, "field_name": None,
        "old_value": None, "new_value": None,
        "user_id": 99, "user_name": "Target", "user_avatar": None,
        "timestamp": None,
        "metadata": {"project_id": project_id} if project_id is not None else None,
    }


class FakePrivacyFilteredAuditRepo:
    """Mirrors the privacy filter contract: when ``is_admin=False``, only
    return events whose ``metadata['project_id']`` is in viewer_project_ids.
    Captures every call's parameters for assertion in tests.
    """

    def __init__(
        self,
        all_items: List[dict],
        viewer_project_map: Optional[dict] = None,
    ):
        self._items = all_items
        # viewer_user_id → list of project_ids the viewer can access
        self._viewer_project_map = viewer_project_map or {}
        self.last_call: Optional[dict] = None

    async def get_user_activity(
        self,
        target_user_id: int,
        viewer_user_id: int,
        is_admin: bool,
        types: Optional[List[str]] = None,
        date_from=None,
        date_to=None,
        limit: int = 30,
        offset: int = 0,
    ) -> Tuple[List[dict], int]:
        self.last_call = {
            "target_user_id": target_user_id,
            "viewer_user_id": viewer_user_id,
            "is_admin": is_admin,
            "types": types,
            "limit": limit,
            "offset": offset,
        }

        if is_admin:
            visible = list(self._items)
        else:
            allowed = set(self._viewer_project_map.get(viewer_user_id, []))
            visible = [
                item for item in self._items
                if item.get("metadata", {}).get("project_id") in allowed
            ]

        # Honor the 200-cap convention so callers can verify the cap behavior.
        capped = visible[: min(limit, 200)]
        return capped[offset : offset + min(limit, 200)], len(visible)


# ---------------------------------------------------------------------------
# Test 9: Privacy filter — non-admin viewer only sees member-project events
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_user_activity_filters_by_viewer_projects():
    """Viewer (id=2) is a member of project 10 only. The repo holds events
    for projects 10 + 20. Use case must return only the project-10 events.
    """
    items = [
        _audit_item(1, project_id=10),
        _audit_item(2, project_id=10),
        _audit_item(3, project_id=20),  # not visible
        _audit_item(4, project_id=20),  # not visible
    ]
    fake_repo = FakePrivacyFilteredAuditRepo(
        all_items=items,
        viewer_project_map={2: [10]},
    )
    use_case = GetUserActivityUseCase(fake_repo)
    result = await use_case.execute(
        target_user_id=99, viewer_user_id=2, is_admin=False,
    )

    assert result.total == 2
    assert len(result.items) == 2
    assert {it.id for it in result.items} == {1, 2}

    # Privacy contract: the use case forwarded viewer + admin flags.
    assert fake_repo.last_call["viewer_user_id"] == 2
    assert fake_repo.last_call["is_admin"] is False


# ---------------------------------------------------------------------------
# Test 10: Admin bypass — returns ALL events regardless of membership
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_admin_bypass():
    items = [
        _audit_item(1, project_id=10),
        _audit_item(2, project_id=10),
        _audit_item(3, project_id=20),
        _audit_item(4, project_id=99),
    ]
    fake_repo = FakePrivacyFilteredAuditRepo(
        all_items=items,
        viewer_project_map={2: []},  # viewer is NOT a member of any project
    )
    use_case = GetUserActivityUseCase(fake_repo)
    result = await use_case.execute(
        target_user_id=99, viewer_user_id=2, is_admin=True,
    )

    assert result.total == 4
    assert len(result.items) == 4


# ---------------------------------------------------------------------------
# Test 11: Privacy filter pulls task events scoped through tasks.project_id
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_user_activity_includes_task_events():
    items = [
        _audit_item(1, entity_type="task", project_id=10),
        _audit_item(2, entity_type="task", project_id=10),
        _audit_item(3, entity_type="project", project_id=10),
    ]
    fake_repo = FakePrivacyFilteredAuditRepo(
        all_items=items,
        viewer_project_map={2: [10]},
    )
    use_case = GetUserActivityUseCase(fake_repo)
    result = await use_case.execute(
        target_user_id=99, viewer_user_id=2, is_admin=False,
    )

    assert result.total == 3
    entity_types = {it.entity_type for it in result.items}
    assert "task" in entity_types
    assert "project" in entity_types


# ---------------------------------------------------------------------------
# Test 12: Pagination — limit forwarded to repo (cap enforced backend-side)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_pagination_capped_at_200():
    """Caller passes limit=500. The use case forwards it; the repository
    contract caps at 200 (T-13-01-04 mitigation).
    """
    items = [_audit_item(i, project_id=10) for i in range(1, 250)]
    fake_repo = FakePrivacyFilteredAuditRepo(
        all_items=items,
        viewer_project_map={2: [10]},
    )
    use_case = GetUserActivityUseCase(fake_repo)
    result = await use_case.execute(
        target_user_id=99, viewer_user_id=2, is_admin=False, limit=500,
    )

    # Use case forwards the raw limit so the repo enforces the cap.
    assert fake_repo.last_call["limit"] == 500
    # Total count surfaces ALL matching items so UIs can show "200 of N".
    assert result.total == 249
    # But returned items are capped at 200 by the repo.
    assert len(result.items) == 200
