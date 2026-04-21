"""BACK-04 Milestone use case unit tests."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.application.use_cases.manage_milestones import (
    CreateMilestoneUseCase, UpdateMilestoneUseCase, DeleteMilestoneUseCase,
    ListMilestonesUseCase,
)
from app.application.dtos.milestone_dtos import MilestoneCreateDTO, MilestoneUpdateDTO
from app.domain.entities.milestone import Milestone, MilestoneStatus
from app.domain.entities.project import Project, Methodology, ProjectStatus
from app.domain.exceptions import ArchivedNodeReferenceError, ProjectNotFoundError
from datetime import datetime


def _mk_project(nodes):
    return Project(
        id=1, key="K", name="P", start_date=datetime(2026, 1, 1),
        methodology=Methodology.SCRUM, status=ProjectStatus.ACTIVE,
        process_config={
            "schema_version": 1,
            "workflow": {"mode": "flexible", "nodes": nodes, "edges": [], "groups": []},
            "phase_completion_criteria": {},
            "enable_phase_assignment": False,
            "enforce_sequential_dependencies": False,
            "enforce_wip_limits": False,
            "restrict_expired_sprints": False,
        },
    )


@pytest.mark.asyncio
async def test_create_success_with_valid_phase_ids():
    nodes = [{"id": "nd_a1b2c3d4e5", "name": "N1", "x": 0, "y": 0, "color": "#888", "is_archived": False}]
    project = _mk_project(nodes)
    project_repo = MagicMock()
    project_repo.get_by_id = AsyncMock(return_value=project)
    milestone_repo = MagicMock()
    milestone_repo.create = AsyncMock(
        side_effect=lambda m: Milestone(id=1, **m.model_dump(exclude={"id"}))
    )

    use_case = CreateMilestoneUseCase(milestone_repo, project_repo)
    dto = MilestoneCreateDTO(project_id=1, name="M1", linked_phase_ids=["nd_a1b2c3d4e5"])
    resp = await use_case.execute(dto, user_id=5)
    assert resp.id == 1
    assert resp.name == "M1"


@pytest.mark.asyncio
async def test_create_rejects_missing_phase_id():
    project = _mk_project(nodes=[])  # workflow has no nodes
    project_repo = MagicMock()
    project_repo.get_by_id = AsyncMock(return_value=project)
    milestone_repo = MagicMock()

    use_case = CreateMilestoneUseCase(milestone_repo, project_repo)
    dto = MilestoneCreateDTO(project_id=1, name="M1", linked_phase_ids=["nd_a1b2c3d4e5"])
    with pytest.raises(ArchivedNodeReferenceError) as ei:
        await use_case.execute(dto, user_id=5)
    assert ei.value.node_id == "nd_a1b2c3d4e5"
    assert "non-existent" in ei.value.reason


@pytest.mark.asyncio
async def test_create_rejects_archived_phase_id():
    nodes = [{"id": "nd_a1b2c3d4e5", "name": "N1", "x": 0, "y": 0, "color": "#888", "is_archived": True}]
    project = _mk_project(nodes)
    project_repo = MagicMock()
    project_repo.get_by_id = AsyncMock(return_value=project)
    milestone_repo = MagicMock()

    use_case = CreateMilestoneUseCase(milestone_repo, project_repo)
    dto = MilestoneCreateDTO(project_id=1, name="M1", linked_phase_ids=["nd_a1b2c3d4e5"])
    with pytest.raises(ArchivedNodeReferenceError) as ei:
        await use_case.execute(dto, user_id=5)
    assert "archived" in ei.value.reason


@pytest.mark.asyncio
async def test_create_rejects_nonexistent_project():
    project_repo = MagicMock()
    project_repo.get_by_id = AsyncMock(return_value=None)
    milestone_repo = MagicMock()

    use_case = CreateMilestoneUseCase(milestone_repo, project_repo)
    dto = MilestoneCreateDTO(project_id=999, name="M1", linked_phase_ids=["nd_a1b2c3d4e5"])
    with pytest.raises(ProjectNotFoundError):
        await use_case.execute(dto, user_id=5)


@pytest.mark.asyncio
async def test_empty_phase_ids_bypasses_validation():
    """D-24: empty list is valid — project workflow is not fetched."""
    project_repo = MagicMock()
    project_repo.get_by_id = AsyncMock()  # should not be called
    milestone_repo = MagicMock()
    milestone_repo.create = AsyncMock(
        side_effect=lambda m: Milestone(id=1, **m.model_dump(exclude={"id"}))
    )

    use_case = CreateMilestoneUseCase(milestone_repo, project_repo)
    dto = MilestoneCreateDTO(project_id=1, name="M1", linked_phase_ids=[])
    await use_case.execute(dto, user_id=5)
    project_repo.get_by_id.assert_not_awaited()


@pytest.mark.asyncio
async def test_delete_returns_repo_result():
    milestone_repo = MagicMock()
    milestone_repo.delete = AsyncMock(return_value=True)
    uc = DeleteMilestoneUseCase(milestone_repo)
    assert await uc.execute(1) is True
    milestone_repo.delete.assert_awaited_once_with(1)


@pytest.mark.asyncio
async def test_list_without_phase_calls_list_by_project():
    milestone_repo = MagicMock()
    milestone_repo.list_by_project = AsyncMock(return_value=[])
    milestone_repo.list_by_phase = AsyncMock(return_value=[])
    uc = ListMilestonesUseCase(milestone_repo)
    await uc.execute(project_id=1, phase_id=None)
    milestone_repo.list_by_project.assert_awaited_once_with(1)
    milestone_repo.list_by_phase.assert_not_called()


@pytest.mark.asyncio
async def test_list_with_phase_calls_list_by_phase():
    milestone_repo = MagicMock()
    milestone_repo.list_by_project = AsyncMock(return_value=[])
    milestone_repo.list_by_phase = AsyncMock(return_value=[])
    uc = ListMilestonesUseCase(milestone_repo)
    await uc.execute(project_id=1, phase_id="nd_a1b2c3d4e5")
    milestone_repo.list_by_phase.assert_awaited_once_with(1, "nd_a1b2c3d4e5")
