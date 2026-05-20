"""Phase 13 + Reports migration v2 chart aggregation router. Mounted at /api/v1.

5 endpoints, all read-only and project-member gated:
- GET /projects/{project_id}/charts/cfd             (D-X1, range 7|30|90)
- GET /projects/{project_id}/charts/lead-cycle      (D-X2, range 7|30|90)
- GET /projects/{project_id}/charts/iteration       (D-X3, count 3|4|6)
- GET /projects/{project_id}/charts/phase-progress  (Reports v2, Strategy D)
- GET /projects/{project_id}/chart-capabilities     (Reports v2, Strategy D)

Strategy D removed the iteration endpoint's methodology gate — capability
gating happens FE-side via /chart-capabilities. Empty data on iteration =
empty array, not a 422.

Phase 9 error taxonomy: 422 with `error_code` body on range/count validation
failures. Member gate inherits from `Depends(get_project_member)` →
non-member returns 403 (T-13-01-01 mitigation).
"""
from fastapi import APIRouter, Depends, Query, HTTPException

from app.api.deps.project import get_project_member, get_project_repo
from app.api.deps.audit import get_audit_repo
from app.api.deps.task import get_task_repo
from app.api.deps.report import get_report_repo
from app.application.use_cases.get_project_cfd import GetProjectCFDUseCase
from app.application.use_cases.get_project_lead_cycle import GetProjectLeadCycleUseCase
from app.application.use_cases.get_project_iteration import GetProjectIterationUseCase
from app.application.use_cases.get_chart_capabilities import GetChartCapabilitiesUseCase
from app.application.use_cases.get_project_phase_progress import (
    GetProjectPhaseProgressUseCase,
)
from app.application.dtos.chart_dtos import (
    CFDResponseDTO,
    LeadCycleResponseDTO,
    IterationResponseDTO,
    ChartCapabilitiesResponseDTO,
    PhaseProgressResponseDTO,
)
from app.domain.exceptions import ProjectNotFoundError


router = APIRouter()


@router.get("/projects/{project_id}/charts/cfd", response_model=CFDResponseDTO)
async def get_project_cfd(
    project_id: int,
    range: int = Query(default=30),
    _member=Depends(get_project_member),
    audit_repo=Depends(get_audit_repo),
    task_repo=Depends(get_task_repo),
) -> CFDResponseDTO:
    """D-X1 CFD daily snapshot, member-gated, range-validated to {7, 30, 90}."""
    use_case = GetProjectCFDUseCase(audit_repo, task_repo)
    try:
        return await use_case.execute(project_id=project_id, range_days=range)
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail={"error_code": "INVALID_RANGE", "message": str(e)},
        )


@router.get("/projects/{project_id}/charts/lead-cycle", response_model=LeadCycleResponseDTO)
async def get_project_lead_cycle(
    project_id: int,
    range: int = Query(default=30),
    _member=Depends(get_project_member),
    audit_repo=Depends(get_audit_repo),
) -> LeadCycleResponseDTO:
    """D-X2 Lead/Cycle aggregation, member-gated, range-validated to {7, 30, 90}."""
    use_case = GetProjectLeadCycleUseCase(audit_repo)
    try:
        return await use_case.execute(project_id=project_id, range_days=range)
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail={"error_code": "INVALID_RANGE", "message": str(e)},
        )


@router.get("/projects/{project_id}/charts/iteration", response_model=IterationResponseDTO)
async def get_project_iteration(
    project_id: int,
    count: int = Query(default=4),
    _member=Depends(get_project_member),
    audit_repo=Depends(get_audit_repo),
) -> IterationResponseDTO:
    """D-X3 Last-N sprints. Strategy D: no methodology gate — empty data when no sprints."""
    use_case = GetProjectIterationUseCase(audit_repo)
    try:
        return await use_case.execute(project_id=project_id, count=count)
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail={"error_code": "INVALID_COUNT", "message": str(e)},
        )


# ---------------------------------------------------------------------------
# Reports migration v2 (Strategy D) — capability + phase-progress endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/projects/{project_id}/chart-capabilities",
    response_model=ChartCapabilitiesResponseDTO,
)
async def get_chart_capabilities_endpoint(
    project_id: int,
    _member=Depends(get_project_member),
    project_repo=Depends(get_project_repo),
) -> ChartCapabilitiesResponseDTO:
    """Per-chart visibility flags for the project. Computed from project
    state + workflow capabilities — methodology enum is never consulted.

    Frontend reads this once on page load to decide which chart cards
    render normally vs. show a capability gate AlertBanner.
    """
    use_case = GetChartCapabilitiesUseCase(project_repo)
    try:
        caps = await use_case.execute(project_id)
    except ProjectNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"error_code": "PROJECT_NOT_FOUND", "project_id": project_id},
        )
    return ChartCapabilitiesResponseDTO(**caps)


@router.get(
    "/projects/{project_id}/charts/phase-progress",
    response_model=PhaseProgressResponseDTO,
)
async def get_project_phase_progress(
    project_id: int,
    _member=Depends(get_project_member),
    project_repo=Depends(get_project_repo),
    report_repo=Depends(get_report_repo),
) -> PhaseProgressResponseDTO:
    """Aggregate tasks per phase node, broken down by column category.

    Returns ordered list following ``process_config.phase_workflow.nodes`` —
    one entry per non-archived node with {total, done, in_progress, todo}.
    Empty list when the project has no phase nodes (FE capability gate
    should prevent this from being called in normal flows).
    """
    use_case = GetProjectPhaseProgressUseCase(project_repo, report_repo)
    try:
        return await use_case.execute(project_id)
    except ProjectNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={"error_code": "PROJECT_NOT_FOUND", "project_id": project_id},
        )
