from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_process_template_repo, require_admin
from app.api.deps.project import get_project_repo
from app.infrastructure.database.database import get_db_session
from app.application.dtos.process_template_dtos import (
    ProcessTemplateCreateDTO,
    ProcessTemplateResponseDTO,
    ProcessTemplateUpdateDTO,
)
from app.application.use_cases.manage_process_templates import (
    CreateProcessTemplateUseCase,
    DeleteProcessTemplateUseCase,
    ListProcessTemplatesUseCase,
    UpdateProcessTemplateUseCase,
)
from app.application.use_cases.apply_process_template import ApplyProcessTemplateUseCase
from app.domain.entities.user import User
from app.domain.exceptions import DomainError

router = APIRouter()


class ApplyTemplateDTO(BaseModel):
    """D-44: apply template to list of project IDs."""
    project_ids: List[int]
    require_pm_approval: bool = False


@router.get("/", response_model=List[ProcessTemplateResponseDTO])
async def list_templates(
    admin: User = Depends(require_admin),
    repo=Depends(get_process_template_repo),
):
    uc = ListProcessTemplatesUseCase(repo)
    return await uc.execute()


@router.post(
    "/",
    response_model=ProcessTemplateResponseDTO,
    status_code=status.HTTP_201_CREATED,
)
async def create_template(
    dto: ProcessTemplateCreateDTO,
    admin: User = Depends(require_admin),
    repo=Depends(get_process_template_repo),
):
    uc = CreateProcessTemplateUseCase(repo)
    return await uc.execute(dto)


@router.patch("/{template_id}", response_model=ProcessTemplateResponseDTO)
async def update_template(
    template_id: int,
    dto: ProcessTemplateUpdateDTO,
    admin: User = Depends(require_admin),
    repo=Depends(get_process_template_repo),
):
    try:
        uc = UpdateProcessTemplateUseCase(repo)
        return await uc.execute(template_id, dto)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    admin: User = Depends(require_admin),
    repo=Depends(get_process_template_repo),
):
    try:
        uc = DeleteProcessTemplateUseCase(repo)
        await uc.execute(template_id)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{template_id}/apply")
async def apply_template(
    template_id: int,
    dto: ApplyTemplateDTO,
    _admin: User = Depends(require_admin),
    template_repo=Depends(get_process_template_repo),
    project_repo=Depends(get_project_repo),
    session: AsyncSession = Depends(get_db_session),
):
    """D-44: Apply process template to a list of projects with per-project advisory lock.

    Returns {"applied": [...project_ids], "failed": [{project_id, error}]}.
    Partial success is intentional (D-44) — 200 OK even if some projects failed.
    """
    uc = ApplyProcessTemplateUseCase(project_repo, template_repo, session)
    try:
        return await uc.execute(template_id, dto.project_ids, dto.require_pm_approval)
    except DomainError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
