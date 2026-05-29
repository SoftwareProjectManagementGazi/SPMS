"""BACK-06 / D-25 PhaseReport use case tests."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime
from app.application.use_cases.manage_phase_reports import (
    CreatePhaseReportUseCase, UpdatePhaseReportUseCase, DeletePhaseReportUseCase,
)
from app.application.dtos.phase_report_dtos import PhaseReportCreateDTO, PhaseReportUpdateDTO
from app.domain.entities.phase_report import PhaseReport
from app.domain.entities.project import Project, Methodology, ProjectStatus


def _mk_project():
    # C3: V2 schema — `phase_workflow`, capabilities sub-object, `task_workflow`.
    return Project(
        id=1, key="K", name="P", start_date=datetime(2026, 1, 1),
        methodology=Methodology.SCRUM, status=ProjectStatus.ACTIVE,
        process_config={
            "schema_version": 2,
            "phase_workflow": {
                "mode": "flexible",
                "capabilities": {
                    "enforce_wip_limits": False,
                    "enforce_sequential_dependencies": False,
                    "restrict_expired_sprints": False,
                    "initial_node_id": "nd_a1b2c3d4e5",
                },
                "nodes": [{"id": "nd_a1b2c3d4e5", "name": "N", "x": 0, "y": 0, "color": "#888", "is_archived": False}],
                "edges": [], "groups": [],
            },
            "task_workflow": {
                "capabilities": {"enforce_wip_limits": False, "initial_node_id": None},
                "edges": [],
                "groups": [],
            },
            "phase_completion_criteria": {},
            "enable_phase_assignment": False,
        },
    )


@pytest.mark.asyncio
async def test_cycle_number_auto_calc_from_audit():
    """D-25: cycle_number = count(audit_log phase_transitions) + 1."""
    project_repo = MagicMock()
    project_repo.get_by_id = AsyncMock(return_value=_mk_project())
    audit_repo = MagicMock()
    audit_repo.count_phase_transitions = AsyncMock(return_value=2)
    # Plan 15-02 TIDY-02: Plan 14-09 D-D2 added create_with_metadata audit emit
    # inside CreatePhaseReportUseCase.execute. Mock must be AsyncMock to be awaitable.
    audit_repo.create_with_metadata = AsyncMock()
    report_repo = MagicMock()
    report_repo.create = AsyncMock(
        side_effect=lambda r: PhaseReport(id=1, **r.model_dump(exclude={"id"}))
    )

    uc = CreatePhaseReportUseCase(report_repo, audit_repo, project_repo)
    dto = PhaseReportCreateDTO(project_id=1, phase_id="nd_a1b2c3d4e5")
    resp = await uc.execute(dto, user_id=5)
    assert resp.cycle_number == 3  # 2 transitions + 1
    audit_repo.count_phase_transitions.assert_awaited_once_with(1, "nd_a1b2c3d4e5")


@pytest.mark.asyncio
async def test_cycle_number_explicit_override():
    """Admin override: cycle_number provided in DTO → use it, skip auto-calc."""
    project_repo = MagicMock()
    project_repo.get_by_id = AsyncMock(return_value=_mk_project())
    audit_repo = MagicMock()
    audit_repo.count_phase_transitions = AsyncMock()
    # Plan 15-02 TIDY-02: same as above — D-D2 audit emit must be AsyncMock.
    audit_repo.create_with_metadata = AsyncMock()
    report_repo = MagicMock()
    report_repo.create = AsyncMock(
        side_effect=lambda r: PhaseReport(id=1, **r.model_dump(exclude={"id"}))
    )

    uc = CreatePhaseReportUseCase(report_repo, audit_repo, project_repo)
    dto = PhaseReportCreateDTO(project_id=1, phase_id="nd_a1b2c3d4e5", cycle_number=7)
    resp = await uc.execute(dto, user_id=5)
    assert resp.cycle_number == 7
    audit_repo.count_phase_transitions.assert_not_awaited()


@pytest.mark.asyncio
async def test_revision_auto_increments_on_update():
    existing = PhaseReport(id=1, project_id=1, phase_id="nd_a1b2c3d4e5", cycle_number=1, revision=3)
    report_repo = MagicMock()
    report_repo.get_by_id = AsyncMock(return_value=existing)
    report_repo.update = AsyncMock(side_effect=lambda r: r)

    uc = UpdatePhaseReportUseCase(report_repo)
    dto = PhaseReportUpdateDTO(issues="new issues")
    resp = await uc.execute(report_id=1, dto=dto, user_id=5)
    assert resp.revision == 4
    assert resp.issues == "new issues"


@pytest.mark.asyncio
async def test_delete_soft_deletes():
    report_repo = MagicMock()
    report_repo.delete = AsyncMock(return_value=True)
    uc = DeletePhaseReportUseCase(report_repo)
    assert await uc.execute(1) is True
    # kills mutation: the canned True passes even if execute ignored its arg / never
    # delegated. Pin the forwarded id.
    report_repo.delete.assert_awaited_once_with(1)
