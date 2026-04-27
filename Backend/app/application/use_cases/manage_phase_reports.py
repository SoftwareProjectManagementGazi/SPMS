"""BACK-06 / D-25 PhaseReport use cases.

Plan 14-09 additions: D-D2 enriched audit metadata on create. The phase_id
is resolved to a human-readable `source_phase_name` via the project's
process_config workflow nodes at write time (D-D2 — frontend mapper consumes
the resolved name).
"""
from typing import List, Optional
from app.domain.entities.phase_report import PhaseReport
from app.domain.repositories.phase_report_repository import IPhaseReportRepository
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.exceptions import ProjectNotFoundError, ArchivedNodeReferenceError
from app.application.dtos.phase_report_dtos import (
    PhaseReportCreateDTO, PhaseReportUpdateDTO, PhaseReportResponseDTO,
)


async def _validate_phase_in_workflow(
    phase_id: str, project_id: int, project_repo: IProjectRepository
) -> None:
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise ProjectNotFoundError(project_id)
    nodes = (project.process_config or {}).get("workflow", {}).get("nodes", [])
    node = next((n for n in nodes if n["id"] == phase_id), None)
    if node is None:
        raise ArchivedNodeReferenceError(node_id=phase_id, reason="non-existent in project workflow")
    if node.get("is_archived"):
        raise ArchivedNodeReferenceError(node_id=phase_id, reason="archived")


async def _resolve_phase_name(
    phase_id: str, project_id: int, project_repo: IProjectRepository
) -> Optional[str]:
    """Plan 14-09 D-D2: resolve phase_id → workflow node.name via project lookup.

    Falls back to None if the project or node disappeared (D-D6 graceful).
    Mirrors the BoardColumn.name resolver pattern from task_repo.py.
    """
    project = await project_repo.get_by_id(project_id)
    if project is None:
        return None
    nodes = (project.process_config or {}).get("workflow", {}).get("nodes", [])
    node = next((n for n in nodes if n.get("id") == phase_id), None)
    if node is None:
        return None
    return node.get("name") or phase_id


async def _build_phase_report_audit_metadata(
    report: PhaseReport, project_repo: IProjectRepository
) -> dict:
    """Plan 14-09 D-D2: compose the audit metadata envelope for a phase_report event."""
    project = await project_repo.get_by_id(report.project_id)
    project_key = project.key if project is not None else None
    source_phase_name = await _resolve_phase_name(
        report.phase_id, report.project_id, project_repo
    )
    return {
        "report_id": report.id,
        "project_id": report.project_id,
        "project_key": project_key,
        "source_phase_id": report.phase_id,
        "source_phase_name": source_phase_name,
    }


class CreatePhaseReportUseCase:
    def __init__(
        self,
        report_repo: IPhaseReportRepository,
        audit_repo: IAuditRepository,
        project_repo: IProjectRepository,
    ):
        self.report_repo = report_repo
        self.audit_repo = audit_repo
        self.project_repo = project_repo

    async def execute(self, dto: PhaseReportCreateDTO, user_id: int) -> PhaseReportResponseDTO:
        await _validate_phase_in_workflow(dto.phase_id, dto.project_id, self.project_repo)
        # D-25: auto-calc cycle_number if not provided
        if dto.cycle_number is None:
            n = await self.audit_repo.count_phase_transitions(dto.project_id, dto.phase_id)
            cycle_number = n + 1
        else:
            cycle_number = dto.cycle_number
        report = PhaseReport(
            project_id=dto.project_id,
            phase_id=dto.phase_id,
            cycle_number=cycle_number,
            revision=1,
            summary_task_count=dto.summary_task_count,
            summary_done_count=dto.summary_done_count,
            summary_moved_count=dto.summary_moved_count,
            summary_duration_days=dto.summary_duration_days,
            completed_tasks_notes=dto.completed_tasks_notes,
            issues=dto.issues,
            lessons=dto.lessons,
            recommendations=dto.recommendations,
            created_by=user_id,
        )
        created = await self.report_repo.create(report)
        # Plan 14-09 D-D2: enriched audit metadata on report create.
        metadata = await _build_phase_report_audit_metadata(created, self.project_repo)
        await self.audit_repo.create_with_metadata(
            entity_type="phase_report",
            entity_id=created.id or 0,
            action="created",
            user_id=user_id,
            metadata=metadata,
            field_name="phase_report",
        )
        return PhaseReportResponseDTO.model_validate(created)


class UpdatePhaseReportUseCase:
    def __init__(self, report_repo: IPhaseReportRepository):
        self.report_repo = report_repo

    async def execute(self, report_id: int, dto: PhaseReportUpdateDTO, user_id: int) -> PhaseReportResponseDTO:
        existing = await self.report_repo.get_by_id(report_id)
        if existing is None:
            from app.domain.exceptions import DomainError
            raise DomainError(f"PhaseReport {report_id} not found")
        # D-25: revision auto-increments on PATCH
        existing.revision += 1
        patch = dto.model_dump(exclude_unset=True)
        for k, v in patch.items():
            setattr(existing, k, v)
        updated = await self.report_repo.update(existing)
        return PhaseReportResponseDTO.model_validate(updated)


class DeletePhaseReportUseCase:
    def __init__(self, report_repo: IPhaseReportRepository):
        self.report_repo = report_repo

    async def execute(self, report_id: int) -> bool:
        return await self.report_repo.delete(report_id)


class ListPhaseReportsUseCase:
    def __init__(self, report_repo: IPhaseReportRepository):
        self.report_repo = report_repo

    async def execute(self, project_id: int, phase_id: Optional[str] = None) -> List[PhaseReportResponseDTO]:
        items = (
            await self.report_repo.list_by_phase(project_id, phase_id)
            if phase_id
            else await self.report_repo.list_by_project(project_id)
        )
        return [PhaseReportResponseDTO.model_validate(r) for r in items]


class GetPhaseReportUseCase:
    def __init__(self, report_repo: IPhaseReportRepository):
        self.report_repo = report_repo

    async def execute(self, report_id: int) -> Optional[PhaseReportResponseDTO]:
        r = await self.report_repo.get_by_id(report_id)
        return PhaseReportResponseDTO.model_validate(r) if r else None
