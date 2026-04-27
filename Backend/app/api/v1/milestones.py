"""API-07 / D-35 Milestone CRUD router.

Permissions (D-35):
  GET (list/detail) — any project member
  POST/PATCH/DELETE — require_project_transition_authority (Admin/PM/TL)

Note on inline authority check:
  require_project_transition_authority DI helper takes project_id as path param.
  For POST (project_id in body) and PATCH/DELETE (project_id inferred from existing entity),
  we re-implement the check inline using the same logic.
  Claude's discretion: acceptable duplication for Phase 9; refactor candidate for Phase 10+.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps.auth import get_current_user, _is_admin
from app.api.deps.milestone import get_milestone_repo
from app.api.deps.project import get_project_repo
from app.api.deps.audit import get_audit_repo
from app.application.use_cases.manage_milestones import (
    CreateMilestoneUseCase,
    UpdateMilestoneUseCase,
    DeleteMilestoneUseCase,
    ListMilestonesUseCase,
    GetMilestoneUseCase,
)
from app.application.dtos.milestone_dtos import (
    MilestoneCreateDTO,
    MilestoneUpdateDTO,
    MilestoneResponseDTO,
)
from app.domain.exceptions import ArchivedNodeReferenceError, ProjectNotFoundError, DomainError

router = APIRouter()


def _to_http(e: Exception) -> HTTPException:
    if isinstance(e, ArchivedNodeReferenceError):
        return HTTPException(
            400,
            detail={"error_code": "ARCHIVED_NODE_REF", "node_id": e.node_id, "reason": e.reason},
        )
    if isinstance(e, ProjectNotFoundError):
        return HTTPException(404, detail=str(e))
    if isinstance(e, DomainError):
        return HTTPException(404, detail=str(e))
    raise e


async def _authorize_transition(user, project_id: int, project_repo, milestone_repo):
    """Inline D-15 RPTA check when project_id is not a path param."""
    if _is_admin(user):
        return
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(404, f"Project {project_id} not found")
    if project.manager_id == user.id:
        return
    from app.infrastructure.database.repositories.team_repo import SqlAlchemyTeamRepository
    team_repo_direct = SqlAlchemyTeamRepository(milestone_repo.session)
    if await team_repo_direct.user_leads_any_team_on_project(user.id, project_id):
        return
    raise HTTPException(403, "Phase transition authority required")


@router.get("/projects/{project_id}/milestones", response_model=list[MilestoneResponseDTO])
async def list_milestones(
    project_id: int,
    phase_id: Optional[str] = Query(default=None),
    _current=Depends(get_current_user),
    milestone_repo=Depends(get_milestone_repo),
):
    uc = ListMilestonesUseCase(milestone_repo)
    return await uc.execute(project_id=project_id, phase_id=phase_id)


@router.get("/milestones/{milestone_id}", response_model=MilestoneResponseDTO)
async def get_milestone(
    milestone_id: int,
    _current=Depends(get_current_user),
    milestone_repo=Depends(get_milestone_repo),
):
    uc = GetMilestoneUseCase(milestone_repo)
    m = await uc.execute(milestone_id)
    if m is None:
        raise HTTPException(404, "Milestone not found")
    return m


@router.post("/milestones", response_model=MilestoneResponseDTO, status_code=201)
async def create_milestone(
    dto: MilestoneCreateDTO,
    user=Depends(get_current_user),
    milestone_repo=Depends(get_milestone_repo),
    project_repo=Depends(get_project_repo),
    audit_repo=Depends(get_audit_repo),
):
    await _authorize_transition(user, dto.project_id, project_repo, milestone_repo)
    uc = CreateMilestoneUseCase(milestone_repo, project_repo, audit_repo=audit_repo)
    try:
        return await uc.execute(dto, user.id)
    except Exception as e:
        raise _to_http(e)


@router.patch("/milestones/{milestone_id}", response_model=MilestoneResponseDTO)
async def update_milestone(
    milestone_id: int,
    dto: MilestoneUpdateDTO,
    user=Depends(get_current_user),
    milestone_repo=Depends(get_milestone_repo),
    project_repo=Depends(get_project_repo),
    audit_repo=Depends(get_audit_repo),
):
    existing = await milestone_repo.get_by_id(milestone_id)
    if existing is None:
        raise HTTPException(404, f"Milestone {milestone_id} not found")
    await _authorize_transition(user, existing.project_id, project_repo, milestone_repo)
    uc = UpdateMilestoneUseCase(milestone_repo, project_repo, audit_repo=audit_repo)
    try:
        return await uc.execute(milestone_id, dto, user.id)
    except Exception as e:
        raise _to_http(e)


@router.delete("/milestones/{milestone_id}", status_code=204)
async def delete_milestone(
    milestone_id: int,
    user=Depends(get_current_user),
    milestone_repo=Depends(get_milestone_repo),
    project_repo=Depends(get_project_repo),
    audit_repo=Depends(get_audit_repo),
):
    existing = await milestone_repo.get_by_id(milestone_id)
    if existing is None:
        raise HTTPException(404, f"Milestone {milestone_id} not found")
    await _authorize_transition(user, existing.project_id, project_repo, milestone_repo)
    uc = DeleteMilestoneUseCase(milestone_repo, audit_repo=audit_repo, project_repo=project_repo)
    await uc.execute(milestone_id)
    return None
