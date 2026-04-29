"""Phase 14 / Phase 15 Plan 15-07 — Admin system settings router.

2 endpoints with D-1.4 perm migration:
- GET / → admin.access (pure read; non-mutating)
- PUT / → admin.settings.update (mutation)
"""
from fastapi import APIRouter, Depends

from app.api.dependencies import get_system_config_repo
from app.api.deps.auth import require_permission
from app.application.dtos.system_config_dtos import (
    SystemConfigResponseDTO,
    SystemConfigUpdateDTO,
)
from app.application.use_cases.manage_system_config import (
    GetSystemConfigUseCase,
    UpdateSystemConfigUseCase,
)
from app.domain.entities.user import User

router = APIRouter()


@router.get("/", response_model=SystemConfigResponseDTO)
async def get_settings(
    admin: User = Depends(require_permission("admin.access")),
    repo=Depends(get_system_config_repo),
):
    uc = GetSystemConfigUseCase(repo)
    return await uc.execute()


@router.put("/", response_model=SystemConfigResponseDTO)
async def update_settings(
    dto: SystemConfigUpdateDTO,
    admin: User = Depends(require_permission("admin.settings.update")),
    repo=Depends(get_system_config_repo),
):
    uc = UpdateSystemConfigUseCase(repo)
    return await uc.execute(dto)
