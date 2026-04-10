from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_process_template_repo, require_admin
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
from app.domain.entities.user import User

router = APIRouter()


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
