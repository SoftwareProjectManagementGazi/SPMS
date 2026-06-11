from typing import Any, Dict, List, Optional

from app.domain.entities.process_template import ProcessTemplate
from app.domain.repositories.process_template_repository import IProcessTemplateRepository
from app.application.dtos.process_template_dtos import (
    ProcessTemplateCreateDTO,
    ProcessTemplateUpdateDTO,
    ProcessTemplateResponseDTO,
)
from app.application.dtos.workflow_dtos import WorkflowConfig as WorkflowConfigDTO


def _validate_default_workflow(wf: Optional[Dict[str, Any]]) -> None:
    """Validate the graph with the same Pydantic model that guards project
    phase_workflow saves. Raises ValidationError; the router maps it to 422."""
    if isinstance(wf, dict):
        WorkflowConfigDTO(**wf)


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
        _validate_default_workflow(dto.default_workflow)
        template = ProcessTemplate(
            name=dto.name,
            is_builtin=False,
            columns=dto.columns,
            recurring_tasks=dto.recurring_tasks,
            behavioral_flags=dto.behavioral_flags,
            description=dto.description,
            default_workflow=dto.default_workflow,
            default_columns=dto.default_columns,
            default_phase_criteria=dto.default_phase_criteria,
            default_artifacts=dto.default_artifacts,
            cycle_label_tr=dto.cycle_label_tr,
            cycle_label_en=dto.cycle_label_en,
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
        # Built-ins are editable (admin-only route); only DELETE stays blocked.
        # The seeder is idempotent per-name, so edits survive restarts.
        _validate_default_workflow(dto.default_workflow)

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
