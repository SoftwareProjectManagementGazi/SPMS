"""BACK-04 / D-19, D-20, D-21 Milestone use cases.

Validates linked_phase_ids against the owning project's workflow nodes.
Cross-project references rejected (D-20). Archived nodes rejected (D-21).

Plan 14-09 additions: audit emission with D-D2 metadata envelope on create
and status transitions. audit_repo is optional so legacy callers (and the
existing pytest fakes) keep working.
"""
from typing import List, Optional
from app.domain.entities.milestone import Milestone, MilestoneStatus
from app.domain.repositories.milestone_repository import IMilestoneRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.exceptions import (
    ProjectNotFoundError,
    ArchivedNodeReferenceError,
    DomainError,
)
from app.application.dtos.milestone_dtos import (
    MilestoneCreateDTO, MilestoneUpdateDTO, MilestoneResponseDTO,
)


async def _build_milestone_audit_metadata(
    milestone: Milestone,
    project_repo: IProjectRepository,
    *,
    status_old: Optional[str] = None,
    status_new: Optional[str] = None,
) -> dict:
    """Plan 14-09 D-D2: compose the audit metadata envelope for a milestone event."""
    project = await project_repo.get_by_id(milestone.project_id)
    project_key = project.key if project is not None else None
    metadata: dict = {
        "milestone_id": milestone.id,
        "milestone_title": milestone.name,
        "project_id": milestone.project_id,
        "project_key": project_key,
    }
    if status_old is not None:
        metadata["status_old"] = status_old
    if status_new is not None:
        metadata["status_new"] = status_new
    return metadata


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
    def __init__(
        self,
        milestone_repo: IMilestoneRepository,
        project_repo: IProjectRepository,
        audit_repo: Optional[IAuditRepository] = None,
    ):
        self.milestone_repo = milestone_repo
        self.project_repo = project_repo
        self.audit_repo = audit_repo

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
        # Plan 14-09 D-D2: enriched audit metadata on create.
        if self.audit_repo is not None:
            metadata = await _build_milestone_audit_metadata(created, self.project_repo)
            await self.audit_repo.create_with_metadata(
                entity_type="milestone",
                entity_id=created.id or 0,
                action="created",
                user_id=user_id,
                metadata=metadata,
                field_name="milestone",
            )
        return MilestoneResponseDTO.model_validate(created)


class UpdateMilestoneUseCase:
    def __init__(
        self,
        milestone_repo: IMilestoneRepository,
        project_repo: IProjectRepository,
        audit_repo: Optional[IAuditRepository] = None,
    ):
        self.milestone_repo = milestone_repo
        self.project_repo = project_repo
        self.audit_repo = audit_repo

    async def execute(self, milestone_id: int, dto: MilestoneUpdateDTO, user_id: int) -> MilestoneResponseDTO:
        existing = await self.milestone_repo.get_by_id(milestone_id)
        if existing is None:
            raise DomainError(f"Milestone {milestone_id} not found")
        if dto.linked_phase_ids is not None:
            await _validate_phase_ids_against_workflow(
                dto.linked_phase_ids, existing.project_id, self.project_repo
            )
        # Plan 14-09 D-D2: capture status delta BEFORE apply so audit row has both ends.
        old_status = (
            existing.status.value
            if hasattr(existing.status, "value")
            else (str(existing.status) if existing.status is not None else None)
        )
        # Apply non-None fields
        patch = dto.model_dump(exclude_unset=True)
        for k, v in patch.items():
            setattr(existing, k, v)
        updated = await self.milestone_repo.update(existing)
        if self.audit_repo is not None:
            new_status = (
                updated.status.value
                if hasattr(updated.status, "value")
                else (str(updated.status) if updated.status is not None else None)
            )
            status_changed = old_status != new_status
            metadata = await _build_milestone_audit_metadata(
                updated,
                self.project_repo,
                status_old=old_status if status_changed else None,
                status_new=new_status if status_changed else None,
            )
            await self.audit_repo.create_with_metadata(
                entity_type="milestone",
                entity_id=updated.id or milestone_id,
                action="updated",
                user_id=user_id,
                metadata=metadata,
                field_name="milestone",
            )
        return MilestoneResponseDTO.model_validate(updated)


class DeleteMilestoneUseCase:
    def __init__(
        self,
        milestone_repo: IMilestoneRepository,
        audit_repo: Optional[IAuditRepository] = None,
        project_repo: Optional[IProjectRepository] = None,
    ):
        self.milestone_repo = milestone_repo
        self.audit_repo = audit_repo
        self.project_repo = project_repo

    async def execute(self, milestone_id: int) -> bool:
        existing = None
        if self.audit_repo is not None and self.project_repo is not None:
            existing = await self.milestone_repo.get_by_id(milestone_id)
        ok = await self.milestone_repo.delete(milestone_id)
        if ok and existing is not None and self.audit_repo is not None and self.project_repo is not None:
            metadata = await _build_milestone_audit_metadata(existing, self.project_repo)
            await self.audit_repo.create_with_metadata(
                entity_type="milestone",
                entity_id=milestone_id,
                action="deleted",
                user_id=None,
                metadata=metadata,
                field_name="milestone",
            )
        return ok


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
