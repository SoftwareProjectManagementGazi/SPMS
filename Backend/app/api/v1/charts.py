"""Phase 13 chart aggregation router. Mounted at /api/v1.

3 endpoints, all read-only and project-member gated:
- GET /projects/{project_id}/charts/cfd        (D-X1, range 7|30|90)
- GET /projects/{project_id}/charts/lead-cycle (D-X2, range 7|30|90)
- GET /projects/{project_id}/charts/iteration  (D-X3, count 3|4|6, methodology-gated)

Phase 9 error taxonomy: 422 with `error_code` body on validation / methodology
gate failures. Member gate inherits from `Depends(get_project_member)` →
non-member returns 403 (T-13-01-01 mitigation).
"""
from fastapi import APIRouter, Depends, Query, HTTPException

from app.api.deps.project import get_project_member, get_project_repo
from app.api.deps.audit import get_audit_repo
from app.api.deps.task import get_task_repo
from app.application.use_cases.get_project_cfd import GetProjectCFDUseCase
from app.application.use_cases.get_project_lead_cycle import GetProjectLeadCycleUseCase
from app.application.use_cases.get_project_iteration import GetProjectIterationUseCase
from app.application.dtos.chart_dtos import (
    CFDResponseDTO,
    LeadCycleResponseDTO,
    IterationResponseDTO,
)
from app.domain.exceptions import InvalidMethodologyError


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
    project_repo=Depends(get_project_repo),
) -> IterationResponseDTO:
    """D-X3 Last-N sprints, member-gated, methodology-gated to cycle methodologies."""
    use_case = GetProjectIterationUseCase(audit_repo, project_repo)
    try:
        return await use_case.execute(project_id=project_id, count=count)
    except InvalidMethodologyError as e:
        raise HTTPException(
            status_code=422,
            detail={
                "error_code": "INVALID_METHODOLOGY",
                "message": str(e),
                "methodology": e.methodology,
            },
        )
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail={"error_code": "INVALID_COUNT", "message": str(e)},
        )
