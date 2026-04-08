from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import (
    get_current_user,
    get_project_repo,
    get_report_repo,
    _is_admin,
)
from app.application.dtos.report_dtos import (
    SummaryDTO,
    BurndownDTO,
    VelocityDTO,
    DistributionDTO,
    PerformanceDTO,
)
from app.application.use_cases.generate_reports import (
    GetSummaryUseCase,
    GetBurndownUseCase,
    GetVelocityUseCase,
    GetDistributionUseCase,
    GetPerformanceUseCase,
)
from app.domain.entities.user import User
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.report_repository import IReportRepository

router = APIRouter()


def _parse_assignee_ids(assignee_ids: Optional[str]) -> Optional[List[int]]:
    """Parse comma-separated assignee_ids string into a list of ints."""
    if not assignee_ids:
        return None
    try:
        ids = [int(x.strip()) for x in assignee_ids.split(",") if x.strip()]
        return ids if ids else None
    except ValueError:
        return None


async def _check_project_membership(
    project_id: int,
    current_user: User,
    project_repo: IProjectRepository,
) -> None:
    """Raise HTTP 403 if user is not a member of the project (admins bypass)."""
    if _is_admin(current_user):
        return
    project = await project_repo.get_by_id_and_user(project_id, current_user.id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this project",
        )


@router.get("/summary", response_model=SummaryDTO)
async def get_summary(
    project_id: int = Query(...),
    assignee_ids: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    report_repo: IReportRepository = Depends(get_report_repo),
):
    await _check_project_membership(project_id, current_user, project_repo)
    ids = _parse_assignee_ids(assignee_ids)
    use_case = GetSummaryUseCase(report_repo)
    return await use_case.execute(project_id, ids, date_from, date_to)


@router.get("/burndown", response_model=BurndownDTO)
async def get_burndown(
    project_id: int = Query(...),
    sprint_id: Optional[int] = Query(None),
    assignee_ids: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    report_repo: IReportRepository = Depends(get_report_repo),
):
    await _check_project_membership(project_id, current_user, project_repo)
    use_case = GetBurndownUseCase(report_repo)
    return await use_case.execute(project_id, sprint_id)


@router.get("/velocity", response_model=VelocityDTO)
async def get_velocity(
    project_id: int = Query(...),
    assignee_ids: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    report_repo: IReportRepository = Depends(get_report_repo),
):
    await _check_project_membership(project_id, current_user, project_repo)
    ids = _parse_assignee_ids(assignee_ids)
    use_case = GetVelocityUseCase(report_repo)
    return await use_case.execute(project_id, date_from, date_to)


@router.get("/distribution", response_model=DistributionDTO)
async def get_distribution(
    project_id: int = Query(...),
    group_by: str = Query("status"),
    assignee_ids: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    report_repo: IReportRepository = Depends(get_report_repo),
):
    await _check_project_membership(project_id, current_user, project_repo)
    ids = _parse_assignee_ids(assignee_ids)
    use_case = GetDistributionUseCase(report_repo)
    return await use_case.execute(project_id, group_by, ids, date_from, date_to)


@router.get("/performance", response_model=PerformanceDTO)
async def get_performance(
    project_id: int = Query(...),
    assignee_ids: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    report_repo: IReportRepository = Depends(get_report_repo),
):
    await _check_project_membership(project_id, current_user, project_repo)
    ids = _parse_assignee_ids(assignee_ids)
    use_case = GetPerformanceUseCase(report_repo)
    return await use_case.execute(project_id, ids, date_from, date_to)
