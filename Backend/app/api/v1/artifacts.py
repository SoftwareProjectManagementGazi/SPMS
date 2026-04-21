"""API-08 / D-36 Artifact CRUD router.

Permissions (D-36):
  GET (list/detail) — any project member
  POST/DELETE — require_project_transition_authority (Admin/PM/TL)
  PATCH /artifacts/{id}/mine — assignee only (status/note/file_id)
  PATCH /artifacts/{id} — Admin/PM/TL (all fields including assignee_id)
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps.auth import get_current_user, _is_admin
from app.api.deps.artifact import get_artifact_repo
from app.api.deps.project import get_project_repo
from app.application.use_cases.manage_artifacts import (
    CreateArtifactUseCase,
    UpdateArtifactByAssigneeUseCase,
    UpdateArtifactByManagerUseCase,
    DeleteArtifactUseCase,
    ListArtifactsUseCase,
    GetArtifactUseCase,
)
from app.application.dtos.artifact_dtos import (
    ArtifactCreateDTO,
    ArtifactUpdateByAssigneeDTO,
    ArtifactUpdateByManagerDTO,
    ArtifactResponseDTO,
)
from app.domain.exceptions import ArchivedNodeReferenceError, ProjectNotFoundError, DomainError

router = APIRouter()


async def _authorize_transition(user, project_id: int, project_repo, artifact_repo):
    """Inline D-15 RPTA check for artifact mutations."""
    if _is_admin(user):
        return
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(404, f"Project {project_id} not found")
    if project.manager_id == user.id:
        return
    from app.infrastructure.database.repositories.team_repo import SqlAlchemyTeamRepository
    team_repo_direct = SqlAlchemyTeamRepository(artifact_repo.session)
    if await team_repo_direct.user_leads_any_team_on_project(user.id, project_id):
        return
    raise HTTPException(403, "Phase transition authority required")


def _to_http(e: Exception) -> HTTPException:
    if isinstance(e, ArchivedNodeReferenceError):
        return HTTPException(
            400,
            detail={"error_code": "ARCHIVED_NODE_REF", "node_id": e.node_id, "reason": e.reason},
        )
    if isinstance(e, (ProjectNotFoundError, DomainError)):
        return HTTPException(404, detail=str(e))
    if isinstance(e, PermissionError):
        return HTTPException(403, detail=str(e))
    raise e


@router.get("/projects/{project_id}/artifacts", response_model=list[ArtifactResponseDTO])
async def list_artifacts(
    project_id: int,
    phase_id: Optional[str] = Query(default=None),
    _current=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
):
    uc = ListArtifactsUseCase(artifact_repo)
    return await uc.execute(project_id=project_id, phase_id=phase_id)


@router.get("/artifacts/{artifact_id}", response_model=ArtifactResponseDTO)
async def get_artifact(
    artifact_id: int,
    _current=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
):
    uc = GetArtifactUseCase(artifact_repo)
    a = await uc.execute(artifact_id)
    if a is None:
        raise HTTPException(404, "Artifact not found")
    return a


@router.post("/artifacts", response_model=ArtifactResponseDTO, status_code=201)
async def create_artifact(
    dto: ArtifactCreateDTO,
    user=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
    project_repo=Depends(get_project_repo),
):
    await _authorize_transition(user, dto.project_id, project_repo, artifact_repo)
    uc = CreateArtifactUseCase(artifact_repo, project_repo)
    try:
        return await uc.execute(dto, user.id)
    except Exception as e:
        raise _to_http(e)


@router.patch("/artifacts/{artifact_id}/mine", response_model=ArtifactResponseDTO)
async def update_artifact_as_assignee(
    artifact_id: int,
    dto: ArtifactUpdateByAssigneeDTO,
    user=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
):
    """D-36: assignee can update status/note/file_id on own artifact only."""
    uc = UpdateArtifactByAssigneeUseCase(artifact_repo)
    try:
        return await uc.execute(artifact_id, dto, user.id)
    except Exception as e:
        raise _to_http(e)


@router.patch("/artifacts/{artifact_id}", response_model=ArtifactResponseDTO)
async def update_artifact_as_manager(
    artifact_id: int,
    dto: ArtifactUpdateByManagerDTO,
    user=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
    project_repo=Depends(get_project_repo),
):
    """D-36: Admin/PM/TL can update all fields including assignee_id."""
    existing = await artifact_repo.get_by_id(artifact_id)
    if existing is None:
        raise HTTPException(404, "Artifact not found")
    await _authorize_transition(user, existing.project_id, project_repo, artifact_repo)
    uc = UpdateArtifactByManagerUseCase(artifact_repo, project_repo)
    try:
        return await uc.execute(artifact_id, dto, user.id)
    except Exception as e:
        raise _to_http(e)


@router.delete("/artifacts/{artifact_id}", status_code=204)
async def delete_artifact(
    artifact_id: int,
    user=Depends(get_current_user),
    artifact_repo=Depends(get_artifact_repo),
    project_repo=Depends(get_project_repo),
):
    existing = await artifact_repo.get_by_id(artifact_id)
    if existing is None:
        raise HTTPException(404, "Artifact not found")
    await _authorize_transition(user, existing.project_id, project_repo, artifact_repo)
    uc = DeleteArtifactUseCase(artifact_repo)
    await uc.execute(artifact_id)
    return None
