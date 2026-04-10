from app.domain.repositories.system_config_repository import ISystemConfigRepository
from app.application.dtos.system_config_dtos import (
    SystemConfigResponseDTO,
    SystemConfigUpdateDTO,
)
from app.application.services.system_config_service import get_system_config, invalidate_cache


class GetSystemConfigUseCase:
    def __init__(self, repo: ISystemConfigRepository):
        self._repo = repo

    async def execute(self) -> SystemConfigResponseDTO:
        result = await get_system_config(self._repo)
        return SystemConfigResponseDTO(config=result)


class UpdateSystemConfigUseCase:
    def __init__(self, repo: ISystemConfigRepository):
        self._repo = repo

    async def execute(self, dto: SystemConfigUpdateDTO) -> SystemConfigResponseDTO:
        await self._repo.upsert_many(dto.config)
        await invalidate_cache()
        result = await get_system_config(self._repo)
        return SystemConfigResponseDTO(config=result)
