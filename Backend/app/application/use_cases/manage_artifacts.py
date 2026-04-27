"""BACK-05 / D-36 split Artifact use cases.

D-36:
  - Assignee updates status/note/file_id on OWN artifact (not reassign).
  - Admin/PM/TL updates all fields.

Plan 14-09 additions: D-D2 enriched audit metadata on create/update/delete.
audit_repo is optional so legacy callers (and pytest fakes) keep working.
"""
from typing import List, Optional
from app.domain.entities.artifact import Artifact
from app.domain.repositories.artifact_repository import IArtifactRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.exceptions import ArchivedNodeReferenceError, ProjectNotFoundError
from app.application.dtos.artifact_dtos import (
    ArtifactCreateDTO, ArtifactUpdateByAssigneeDTO, ArtifactUpdateByManagerDTO,
    ArtifactResponseDTO,
)


async def _build_artifact_audit_metadata(
    artifact: Artifact,
    project_repo: IProjectRepository,
    *,
    status_old: Optional[str] = None,
    status_new: Optional[str] = None,
) -> dict:
    """Plan 14-09 D-D2: compose the audit metadata envelope for an artifact event."""
    project = await project_repo.get_by_id(artifact.project_id)
    project_key = project.key if project is not None else None
    metadata: dict = {
        "artifact_id": artifact.id,
        "artifact_name": artifact.name,
        "project_id": artifact.project_id,
        "project_key": project_key,
    }
    if status_old is not None:
        metadata["status_old"] = status_old
    if status_new is not None:
        metadata["status_new"] = status_new
    return metadata


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


def _enum_value(v) -> Optional[str]:
    """Helper — read enum .value or stringify; pass None through."""
    if v is None:
        return None
    return v.value if hasattr(v, "value") else str(v)


class CreateArtifactUseCase:
    def __init__(
        self,
        artifact_repo: IArtifactRepository,
        project_repo: IProjectRepository,
        audit_repo: Optional[IAuditRepository] = None,
    ):
        self.artifact_repo = artifact_repo
        self.project_repo = project_repo
        self.audit_repo = audit_repo

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
        if self.audit_repo is not None:
            metadata = await _build_artifact_audit_metadata(created, self.project_repo)
            await self.audit_repo.create_with_metadata(
                entity_type="artifact",
                entity_id=created.id or 0,
                action="created",
                user_id=user_id,
                metadata=metadata,
                field_name="artifact",
            )
        return ArtifactResponseDTO.model_validate(created)


class UpdateArtifactByAssigneeUseCase:
    """D-36: assignee can update own artifact's status/note/file_id only."""
    def __init__(
        self,
        artifact_repo: IArtifactRepository,
        audit_repo: Optional[IAuditRepository] = None,
        project_repo: Optional[IProjectRepository] = None,
    ):
        self.artifact_repo = artifact_repo
        self.audit_repo = audit_repo
        self.project_repo = project_repo

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
        # Plan 14-09 D-D2: capture status delta BEFORE apply so audit row sees both ends.
        old_status = _enum_value(existing.status)
        # Apply only the 3 allowed fields
        patch = dto.model_dump(exclude_unset=True)
        for k, v in patch.items():
            if k not in {"status", "note", "file_id"}:
                # Defence-in-depth: DTO already excludes assignee_id, but guard anyway
                raise ValueError(f"Assignee cannot update field {k!r}")
            setattr(existing, k, v)
        updated = await self.artifact_repo.update(existing)
        if self.audit_repo is not None and self.project_repo is not None:
            new_status = _enum_value(updated.status)
            status_changed = old_status != new_status
            metadata = await _build_artifact_audit_metadata(
                updated,
                self.project_repo,
                status_old=old_status if status_changed else None,
                status_new=new_status if status_changed else None,
            )
            await self.audit_repo.create_with_metadata(
                entity_type="artifact",
                entity_id=updated.id or artifact_id,
                action="updated",
                user_id=user_id,
                metadata=metadata,
                field_name="artifact",
            )
        return ArtifactResponseDTO.model_validate(updated)


class UpdateArtifactByManagerUseCase:
    """D-36: Admin/PM/TL can update all fields."""
    def __init__(
        self,
        artifact_repo: IArtifactRepository,
        project_repo: IProjectRepository,
        audit_repo: Optional[IAuditRepository] = None,
    ):
        self.artifact_repo = artifact_repo
        self.project_repo = project_repo
        self.audit_repo = audit_repo

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
        old_status = _enum_value(existing.status)
        patch = dto.model_dump(exclude_unset=True)
        for k, v in patch.items():
            setattr(existing, k, v)
        updated = await self.artifact_repo.update(existing)
        if self.audit_repo is not None:
            new_status = _enum_value(updated.status)
            status_changed = old_status != new_status
            metadata = await _build_artifact_audit_metadata(
                updated,
                self.project_repo,
                status_old=old_status if status_changed else None,
                status_new=new_status if status_changed else None,
            )
            await self.audit_repo.create_with_metadata(
                entity_type="artifact",
                entity_id=updated.id or artifact_id,
                action="updated",
                user_id=user_id,
                metadata=metadata,
                field_name="artifact",
            )
        return ArtifactResponseDTO.model_validate(updated)


class DeleteArtifactUseCase:
    def __init__(
        self,
        artifact_repo: IArtifactRepository,
        audit_repo: Optional[IAuditRepository] = None,
        project_repo: Optional[IProjectRepository] = None,
    ):
        self.artifact_repo = artifact_repo
        self.audit_repo = audit_repo
        self.project_repo = project_repo

    async def execute(self, artifact_id: int) -> bool:
        existing = None
        if self.audit_repo is not None and self.project_repo is not None:
            existing = await self.artifact_repo.get_by_id(artifact_id)
        ok = await self.artifact_repo.delete(artifact_id)
        if ok and existing is not None and self.audit_repo is not None and self.project_repo is not None:
            metadata = await _build_artifact_audit_metadata(existing, self.project_repo)
            await self.audit_repo.create_with_metadata(
                entity_type="artifact",
                entity_id=artifact_id,
                action="deleted",
                user_id=None,
                metadata=metadata,
                field_name="artifact",
            )
        return ok


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
