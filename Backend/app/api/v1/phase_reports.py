"""API-09 / D-37 PhaseReport CRUD + PDF export router.

Permissions (D-37):
  GET (list/detail/pdf) — any project member (PDF also for members)
  POST/PATCH/DELETE — require_project_transition_authority (Admin/PM/TL)

PDF rate limit (D-51): 30s per user (in-memory dict keyed by user_id).
"""
import io
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.deps.auth import get_current_user, _is_admin
from app.api.deps.phase_report import get_phase_report_repo
from app.api.deps.project import get_project_repo
from app.api.deps.audit import get_audit_repo
from app.application.use_cases.manage_phase_reports import (
    CreatePhaseReportUseCase,
    UpdatePhaseReportUseCase,
    DeletePhaseReportUseCase,
    ListPhaseReportsUseCase,
    GetPhaseReportUseCase,
)
from app.application.dtos.phase_report_dtos import (
    PhaseReportCreateDTO,
    PhaseReportUpdateDTO,
    PhaseReportResponseDTO,
)
from app.application.services.phase_report_pdf import render_pdf
from app.domain.exceptions import ArchivedNodeReferenceError, ProjectNotFoundError, DomainError

router = APIRouter()

# D-51: per-user 30s rate limit for PDF. In-memory dict keyed by user_id.
_pdf_last_request: dict = {}
PDF_RATE_SECONDS = 30


async def _authorize(user, project_id: int, project_repo, report_repo):
    """Inline D-15 RPTA check for phase report mutations."""
    if _is_admin(user):
        return
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(404, f"Project {project_id} not found")
    if project.manager_id == user.id:
        return
    from app.infrastructure.database.repositories.team_repo import SqlAlchemyTeamRepository
    team_repo_direct = SqlAlchemyTeamRepository(report_repo.session)
    if await team_repo_direct.user_leads_any_team_on_project(user.id, project_id):
        return
    raise HTTPException(403, "Phase transition authority required")


def _to_http(e: Exception) -> HTTPException:
    if isinstance(e, ArchivedNodeReferenceError):
        return HTTPException(
            400,
            detail={"error_code": "ARCHIVED_NODE_REF", "node_id": e.node_id},
        )
    if isinstance(e, (ProjectNotFoundError, DomainError)):
        return HTTPException(404, detail=str(e))
    raise e


@router.get("/projects/{project_id}/phase-reports", response_model=list[PhaseReportResponseDTO])
async def list_reports(
    project_id: int,
    phase_id: Optional[str] = None,
    _current=Depends(get_current_user),
    report_repo=Depends(get_phase_report_repo),
):
    uc = ListPhaseReportsUseCase(report_repo)
    return await uc.execute(project_id=project_id, phase_id=phase_id)


@router.get("/phase-reports/{report_id}", response_model=PhaseReportResponseDTO)
async def get_report(
    report_id: int,
    _current=Depends(get_current_user),
    report_repo=Depends(get_phase_report_repo),
):
    uc = GetPhaseReportUseCase(report_repo)
    r = await uc.execute(report_id)
    if r is None:
        raise HTTPException(404, "PhaseReport not found")
    return r


@router.post("/phase-reports", response_model=PhaseReportResponseDTO, status_code=201)
async def create_report(
    dto: PhaseReportCreateDTO,
    user=Depends(get_current_user),
    report_repo=Depends(get_phase_report_repo),
    audit_repo=Depends(get_audit_repo),
    project_repo=Depends(get_project_repo),
):
    await _authorize(user, dto.project_id, project_repo, report_repo)
    uc = CreatePhaseReportUseCase(report_repo, audit_repo, project_repo)
    try:
        return await uc.execute(dto, user.id)
    except Exception as e:
        raise _to_http(e)


@router.patch("/phase-reports/{report_id}", response_model=PhaseReportResponseDTO)
async def update_report(
    report_id: int,
    dto: PhaseReportUpdateDTO,
    user=Depends(get_current_user),
    report_repo=Depends(get_phase_report_repo),
    project_repo=Depends(get_project_repo),
):
    existing = await report_repo.get_by_id(report_id)
    if existing is None:
        raise HTTPException(404, "PhaseReport not found")
    await _authorize(user, existing.project_id, project_repo, report_repo)
    uc = UpdatePhaseReportUseCase(report_repo)
    return await uc.execute(report_id, dto, user.id)


@router.delete("/phase-reports/{report_id}", status_code=204)
async def delete_report(
    report_id: int,
    user=Depends(get_current_user),
    report_repo=Depends(get_phase_report_repo),
    project_repo=Depends(get_project_repo),
):
    existing = await report_repo.get_by_id(report_id)
    if existing is None:
        raise HTTPException(404, "PhaseReport not found")
    await _authorize(user, existing.project_id, project_repo, report_repo)
    uc = DeletePhaseReportUseCase(report_repo)
    await uc.execute(report_id)
    return None


@router.get("/phase-reports/{report_id}/pdf")
async def export_pdf(
    report_id: int,
    user=Depends(get_current_user),
    report_repo=Depends(get_phase_report_repo),
    project_repo=Depends(get_project_repo),
):
    """D-51: 30s per-user rate limit. Sync fpdf2 render."""
    # Rate limit check
    last = _pdf_last_request.get(user.id)
    if last and (datetime.utcnow() - last).total_seconds() < PDF_RATE_SECONDS:
        remaining = PDF_RATE_SECONDS - int((datetime.utcnow() - last).total_seconds())
        raise HTTPException(
            status_code=429,
            detail=f"PDF rate limit; retry after {remaining}s",
            headers={"Retry-After": str(remaining)},
        )
    _pdf_last_request[user.id] = datetime.utcnow()

    report = await report_repo.get_by_id(report_id)
    if report is None:
        raise HTTPException(404, "PhaseReport not found")

    # Resolve phase name from project workflow nodes
    project = await project_repo.get_by_id(report.project_id)
    phase_name = "N/A"
    project_name = project.name if project else "N/A"
    nodes = (project.process_config or {}).get("workflow", {}).get("nodes", []) if project else []
    node = next((n for n in nodes if n["id"] == report.phase_id), None)
    if node:
        phase_name = node.get("name", report.phase_id)

    pdf_bytes = render_pdf(report, project_name, phase_name)
    filename = f"PhaseReport_{report.project_id}_{report.phase_id}_r{report.revision}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
