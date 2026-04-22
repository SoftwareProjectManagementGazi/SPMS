"""Labels router — Phase 11 D-51.

Two endpoints:
  GET  /api/v1/projects/{project_id}/labels — list labels in a project (200 / 403)
  POST /api/v1/labels                        — create a new label (201 / 409 / 422 / 403)

The router is mounted with prefix="/api/v1" because both routes live under
distinct resources ("/projects/.../labels" and "/labels"). Narrowing the prefix
would double-prefix one of them.

Authorization:
  - GET uses Depends(get_project_member) which reads the path parameter
    project_id directly (T-11-03-02 IDOR mitigation).
  - POST reads project_id from the body, so membership is checked inline using
    the same IProjectRepository.get_by_id_and_user semantics plus an admin
    bypass — mirrors the Phase 9 board_columns.create_column pattern
    (T-11-03-01 IDOR mitigation).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.api.dependencies import (
    get_label_repo,
    get_current_user,
    get_project_member,
    get_project_repo,
    _is_admin,
)
from app.application.dtos.label_dtos import LabelCreateDTO, LabelResponseDTO
from app.application.use_cases.manage_labels import (
    ListProjectLabelsUseCase,
    CreateLabelUseCase,
)
from app.domain.repositories.label_repository import ILabelRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.exceptions import LabelNameAlreadyExistsError
from app.domain.entities.user import User


router = APIRouter()


@router.get(
    "/projects/{project_id}/labels",
    response_model=List[LabelResponseDTO],
    tags=["Labels"],
)
async def list_project_labels(
    project_id: int,
    current_user: User = Depends(get_project_member),  # 403 if not member
    repo: ILabelRepository = Depends(get_label_repo),
):
    """Return all labels in a project ordered by name with usage_count populated."""
    use_case = ListProjectLabelsUseCase(repo)
    return await use_case.execute(project_id)


@router.post(
    "/labels",
    response_model=LabelResponseDTO,
    status_code=status.HTTP_201_CREATED,
    tags=["Labels"],
)
async def create_label(
    dto: LabelCreateDTO,
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    repo: ILabelRepository = Depends(get_label_repo),
):
    """Create a new label scoped to dto.project_id.

    Membership is enforced inline (not via Depends(get_project_member), which
    requires project_id as a path parameter). Admin users bypass the check
    per the Phase 9 pattern (board_columns.create_column lines 54-66).
    """
    # T-11-03-01 IDOR mitigation: body-scoped membership check
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(dto.project_id, current_user.id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not a member of project {dto.project_id}",
            )

    try:
        use_case = CreateLabelUseCase(repo)
        return await use_case.execute(dto)
    except LabelNameAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )
