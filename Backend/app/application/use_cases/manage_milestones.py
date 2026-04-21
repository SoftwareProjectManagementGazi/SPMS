"""BACK-04 / D-19, D-20, D-21 Milestone use cases.

Validates linked_phase_ids against the owning project's workflow nodes.
Cross-project references rejected (D-20). Archived nodes rejected (D-21).
"""
from typing import List, Optional
from app.domain.entities.milestone import Milestone, MilestoneStatus
from app.domain.repositories.milestone_repository import IMilestoneRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.exceptions import (
    ProjectNotFoundError,
    ArchivedNodeReferenceError,
    DomainError,
)
from app.application.dtos.milestone_dtos import (
    MilestoneCreateDTO, MilestoneUpdateDTO, MilestoneResponseDTO,
)


async def _validate_phase_ids_against_workflow(
    phase_ids: List[str],
    project_id: int,
    project_repo: IProjectRepository,
) -> None:
    """D-19/D-21: each id must exist in project.process_config.workflow.nodes and
    not be is_archived. Raises ArchivedNodeReferenceError on first violation.
    Empty list is valid (D-24)."""
    if not phase_ids:
        return
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise ProjectNotFoundError(project_id)
    nodes = (project.process_config or {}).get("workflow", {}).get("nodes", [])
    node_map = {n["id"]: n for n in nodes}
    for pid in phase_ids:
        node = node_map.get(pid)
        if node is None:
            raise ArchivedNodeReferenceError(node_id=pid, reason="non-existent in project workflow")
        if node.get("is_archived"):
            raise ArchivedNodeReferenceError(node_id=pid, reason="archived")


class CreateMilestoneUseCase:
    def __init__(self, milestone_repo: IMilestoneRepository, project_repo: IProjectRepository):
        self.milestone_repo = milestone_repo
        self.project_repo = project_repo

    async def execute(self, dto: MilestoneCreateDTO, user_id: int) -> MilestoneResponseDTO:
        await _validate_phase_ids_against_workflow(
            dto.linked_phase_ids, dto.project_id, self.project_repo
        )
        milestone = Milestone(
            project_id=dto.project_id,
            name=dto.name,
            description=dto.description,
            target_date=dto.target_date,
            status=dto.status,
            linked_phase_ids=dto.linked_phase_ids,
        )
        created = await self.milestone_repo.create(milestone)
        return MilestoneResponseDTO.model_validate(created)


class UpdateMilestoneUseCase:
    def __init__(self, milestone_repo: IMilestoneRepository, project_repo: IProjectRepository):
        self.milestone_repo = milestone_repo
        self.project_repo = project_repo

    async def execute(self, milestone_id: int, dto: MilestoneUpdateDTO, user_id: int) -> MilestoneResponseDTO:
        existing = await self.milestone_repo.get_by_id(milestone_id)
        if existing is None:
            raise DomainError(f"Milestone {milestone_id} not found")
        if dto.linked_phase_ids is not None:
            await _validate_phase_ids_against_workflow(
                dto.linked_phase_ids, existing.project_id, self.project_repo
            )
        # Apply non-None fields
        patch = dto.model_dump(exclude_unset=True)
        for k, v in patch.items():
            setattr(existing, k, v)
        updated = await self.milestone_repo.update(existing)
        return MilestoneResponseDTO.model_validate(updated)


class DeleteMilestoneUseCase:
    def __init__(self, milestone_repo: IMilestoneRepository):
        self.milestone_repo = milestone_repo

    async def execute(self, milestone_id: int) -> bool:
        return await self.milestone_repo.delete(milestone_id)


class ListMilestonesUseCase:
    def __init__(self, milestone_repo: IMilestoneRepository):
        self.milestone_repo = milestone_repo

    async def execute(self, project_id: int, phase_id: Optional[str] = None) -> List[MilestoneResponseDTO]:
        if phase_id is None:
            items = await self.milestone_repo.list_by_project(project_id)
        else:
            items = await self.milestone_repo.list_by_phase(project_id, phase_id)
        return [MilestoneResponseDTO.model_validate(m) for m in items]


class GetMilestoneUseCase:
    def __init__(self, milestone_repo: IMilestoneRepository):
        self.milestone_repo = milestone_repo

    async def execute(self, milestone_id: int) -> Optional[MilestoneResponseDTO]:
        m = await self.milestone_repo.get_by_id(milestone_id)
        return MilestoneResponseDTO.model_validate(m) if m else None
