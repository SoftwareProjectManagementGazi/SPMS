"""BACK-05 / D-36 split Artifact use cases.

D-36:
  - Assignee updates status/note/file_id on OWN artifact (not reassign).
  - Admin/PM/TL updates all fields.
"""
from typing import List, Optional
from app.domain.entities.artifact import Artifact
from app.domain.repositories.artifact_repository import IArtifactRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.exceptions import ArchivedNodeReferenceError, ProjectNotFoundError
from app.application.dtos.artifact_dtos import (
    ArtifactCreateDTO, ArtifactUpdateByAssigneeDTO, ArtifactUpdateByManagerDTO,
    ArtifactResponseDTO,
)


async def _validate_phase_id_in_workflow(
    phase_id: Optional[str], project_id: int, project_repo: IProjectRepository
) -> None:
    if phase_id is None:
        return
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise ProjectNotFoundError(project_id)
    nodes = (project.process_config or {}).get("workflow", {}).get("nodes", [])
    node_map = {n["id"]: n for n in nodes}
    node = node_map.get(phase_id)
    if node is None:
        raise ArchivedNodeReferenceError(node_id=phase_id, reason="non-existent in project workflow")
    if node.get("is_archived"):
        raise ArchivedNodeReferenceError(node_id=phase_id, reason="archived")


class CreateArtifactUseCase:
    def __init__(self, artifact_repo: IArtifactRepository, project_repo: IProjectRepository):
        self.artifact_repo = artifact_repo
        self.project_repo = project_repo

    async def execute(self, dto: ArtifactCreateDTO, user_id: int) -> ArtifactResponseDTO:
        await _validate_phase_id_in_workflow(dto.linked_phase_id, dto.project_id, self.project_repo)
        artifact = Artifact(
            project_id=dto.project_id,
            name=dto.name,
            status=dto.status,
            assignee_id=dto.assignee_id,
            linked_phase_id=dto.linked_phase_id,
            note=dto.note,
            file_id=dto.file_id,
        )
        created = await self.artifact_repo.create(artifact)
        return ArtifactResponseDTO.model_validate(created)


class UpdateArtifactByAssigneeUseCase:
    """D-36: assignee can update own artifact's status/note/file_id only."""
    def __init__(self, artifact_repo: IArtifactRepository):
        self.artifact_repo = artifact_repo

    async def execute(
        self, artifact_id: int, dto: ArtifactUpdateByAssigneeDTO, user_id: int
    ) -> ArtifactResponseDTO:
        existing = await self.artifact_repo.get_by_id(artifact_id)
        if existing is None:
            from app.domain.exceptions import DomainError
            raise DomainError(f"Artifact {artifact_id} not found")
        if existing.assignee_id != user_id:
            raise PermissionError(
                f"User {user_id} is not the assignee of artifact {artifact_id}; "
                "manager-level update required"
            )
        # Apply only the 3 allowed fields
        patch = dto.model_dump(exclude_unset=True)
        for k, v in patch.items():
            if k not in {"status", "note", "file_id"}:
                # Defence-in-depth: DTO already excludes assignee_id, but guard anyway
                raise ValueError(f"Assignee cannot update field {k!r}")
            setattr(existing, k, v)
        updated = await self.artifact_repo.update(existing)
        return ArtifactResponseDTO.model_validate(updated)


class UpdateArtifactByManagerUseCase:
    """D-36: Admin/PM/TL can update all fields."""
    def __init__(self, artifact_repo: IArtifactRepository, project_repo: IProjectRepository):
        self.artifact_repo = artifact_repo
        self.project_repo = project_repo

    async def execute(
        self, artifact_id: int, dto: ArtifactUpdateByManagerDTO, user_id: int
    ) -> ArtifactResponseDTO:
        existing = await self.artifact_repo.get_by_id(artifact_id)
        if existing is None:
            from app.domain.exceptions import DomainError
            raise DomainError(f"Artifact {artifact_id} not found")
        # Re-validate phase_id if provided
        if dto.linked_phase_id is not None:
            await _validate_phase_id_in_workflow(
                dto.linked_phase_id, existing.project_id, self.project_repo
            )
        patch = dto.model_dump(exclude_unset=True)
        for k, v in patch.items():
            setattr(existing, k, v)
        updated = await self.artifact_repo.update(existing)
        return ArtifactResponseDTO.model_validate(updated)


class DeleteArtifactUseCase:
    def __init__(self, artifact_repo: IArtifactRepository):
        self.artifact_repo = artifact_repo

    async def execute(self, artifact_id: int) -> bool:
        return await self.artifact_repo.delete(artifact_id)


class ListArtifactsUseCase:
    def __init__(self, artifact_repo: IArtifactRepository):
        self.artifact_repo = artifact_repo

    async def execute(
        self, project_id: int, phase_id: Optional[str] = None, include_phase_none: bool = False
    ) -> List[ArtifactResponseDTO]:
        if phase_id is None and not include_phase_none:
            items = await self.artifact_repo.list_by_project(project_id)
        else:
            items = await self.artifact_repo.list_by_phase(project_id, phase_id)
        return [ArtifactResponseDTO.model_validate(a) for a in items]


class GetArtifactUseCase:
    def __init__(self, artifact_repo: IArtifactRepository):
        self.artifact_repo = artifact_repo

    async def execute(self, artifact_id: int) -> Optional[ArtifactResponseDTO]:
        a = await self.artifact_repo.get_by_id(artifact_id)
        return ArtifactResponseDTO.model_validate(a) if a else None
