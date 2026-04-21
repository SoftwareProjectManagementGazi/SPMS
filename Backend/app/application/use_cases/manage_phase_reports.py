"""BACK-06 / D-25 PhaseReport use cases."""
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
