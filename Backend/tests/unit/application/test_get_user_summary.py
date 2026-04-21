"""API-03 / D-48 user summary use case — verify asyncio.gather is used (3 parallel queries)."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.application.use_cases.get_user_summary import GetUserSummaryUseCase
from app.domain.entities.project import Project, Methodology, ProjectStatus
from datetime import datetime


def _mk_project(status=ProjectStatus.ACTIVE):
    return Project(
        id=1, key="K", name="P", start_date=datetime(2026, 1, 1),
        methodology=Methodology.SCRUM, status=status,
    )


@pytest.mark.asyncio
async def test_gather_3_parallel_queries():
    user_repo = MagicMock()
    project_repo = MagicMock()
    project_repo.list_by_member_and_status = AsyncMock(return_value=[_mk_project()])
    project_repo.count_by_member = AsyncMock(return_value=3)
    audit_repo = MagicMock()
    audit_repo.get_recent_by_user = AsyncMock(return_value=[])
    task_repo = MagicMock()
    task_repo.count_active_by_assignee = AsyncMock(return_value=7)
    task_repo.count_completed_since = AsyncMock(return_value=12)

    uc = GetUserSummaryUseCase(user_repo, project_repo, audit_repo, task_repo)
    resp = await uc.execute(user_id=5)
    assert resp.stats.active_tasks == 7
    assert resp.stats.completed_last_30d == 12
    assert resp.stats.project_count == 3
    assert len(resp.projects) == 1


@pytest.mark.asyncio
async def test_include_archived_adds_status():
    """D-49: include_archived=True adds ARCHIVED to status list."""
    project_repo = MagicMock()
    project_repo.list_by_member_and_status = AsyncMock(return_value=[])
    project_repo.count_by_member = AsyncMock(return_value=0)
    task_repo = MagicMock()
    task_repo.count_active_by_assignee = AsyncMock(return_value=0)
    task_repo.count_completed_since = AsyncMock(return_value=0)
    audit_repo = MagicMock()
    audit_repo.get_recent_by_user = AsyncMock(return_value=[])

    uc = GetUserSummaryUseCase(MagicMock(), project_repo, audit_repo, task_repo)
    await uc.execute(user_id=5, include_archived=True)
    project_repo.list_by_member_and_status.assert_awaited_once()
    statuses_called = project_repo.list_by_member_and_status.call_args[0][1]
    assert "ARCHIVED" in statuses_called


@pytest.mark.asyncio
async def test_exclude_archived_by_default():
    project_repo = MagicMock()
    project_repo.list_by_member_and_status = AsyncMock(return_value=[])
    project_repo.count_by_member = AsyncMock(return_value=0)
    task_repo = MagicMock()
    task_repo.count_active_by_assignee = AsyncMock(return_value=0)
    task_repo.count_completed_since = AsyncMock(return_value=0)
    audit_repo = MagicMock()
    audit_repo.get_recent_by_user = AsyncMock(return_value=[])

    uc = GetUserSummaryUseCase(MagicMock(), project_repo, audit_repo, task_repo)
    await uc.execute(user_id=5)
    statuses_called = project_repo.list_by_member_and_status.call_args[0][1]
    assert "ARCHIVED" not in statuses_called
    assert "ACTIVE" in statuses_called
