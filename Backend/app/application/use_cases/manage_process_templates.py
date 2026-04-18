from typing import List

from app.domain.entities.process_template import ProcessTemplate
from app.domain.repositories.process_template_repository import IProcessTemplateRepository
from app.application.dtos.process_template_dtos import (
    ProcessTemplateCreateDTO,
    ProcessTemplateUpdateDTO,
    ProcessTemplateResponseDTO,
)


class ListProcessTemplatesUseCase:
    def __init__(self, repo: IProcessTemplateRepository):
        self._repo = repo

    async def execute(self) -> List[ProcessTemplateResponseDTO]:
        templates = await self._repo.get_all()
        return [ProcessTemplateResponseDTO.model_validate(t) for t in templates]


class CreateProcessTemplateUseCase:
    def __init__(self, repo: IProcessTemplateRepository):
        self._repo = repo

    async def execute(self, dto: ProcessTemplateCreateDTO) -> ProcessTemplateResponseDTO:
        template = ProcessTemplate(
            name=dto.name,
            is_builtin=False,
            columns=dto.columns,
            recurring_tasks=dto.recurring_tasks,
            behavioral_flags=dto.behavioral_flags,
            description=dto.description,
        )
        created = await self._repo.create(template)
        return ProcessTemplateResponseDTO.model_validate(created)


class UpdateProcessTemplateUseCase:
    def __init__(self, repo: IProcessTemplateRepository):
        self._repo = repo

    async def execute(
        self, template_id: int, dto: ProcessTemplateUpdateDTO
    ) -> ProcessTemplateResponseDTO:
        existing = await self._repo.get_by_id(template_id)
        if existing is None:
            raise ValueError(f"Process template {template_id} not found")
        if existing.is_builtin:
            raise PermissionError("Built-in templates cannot be modified")

        update_data = dto.model_dump(exclude_unset=True)
        updated_template = existing.model_copy(update=update_data)
        saved = await self._repo.update(updated_template)
        return ProcessTemplateResponseDTO.model_validate(saved)


class DeleteProcessTemplateUseCase:
    def __init__(self, repo: IProcessTemplateRepository):
        self._repo = repo

    async def execute(self, template_id: int) -> None:
        existing = await self._repo.get_by_id(template_id)
        if existing is None:
            raise ValueError(f"Process template {template_id} not found")
        if existing.is_builtin:
            raise PermissionError("Built-in templates cannot be deleted")
        await self._repo.delete(template_id)
