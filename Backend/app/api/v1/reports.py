import io
from datetime import date as date_type, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pathlib import Path
import jinja2

from app.api.dependencies import (
    get_current_user,
    get_project_repo,
    get_report_repo,
    _is_admin,
)
from app.application.dtos.report_dtos import (
    SummaryDTO,
    BurndownDTO,
    VelocityDTO,
    DistributionDTO,
    PerformanceDTO,
)
from app.application.use_cases.generate_reports import (
    GetSummaryUseCase,
    GetBurndownUseCase,
    GetVelocityUseCase,
    GetDistributionUseCase,
    GetPerformanceUseCase,
)
from app.domain.entities.user import User
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.report_repository import IReportRepository

router = APIRouter()


def _parse_assignee_ids(assignee_ids: Optional[str]) -> Optional[List[int]]:
    """Parse comma-separated assignee IDs string into a list of ints.
    Returns None if input is None or empty string.
    """
    if not assignee_ids:
        return None
    try:
        ids = [int(i.strip()) for i in assignee_ids.split(",") if i.strip()]
        return ids if ids else None
    except ValueError:
        return None


@router.get("/summary", response_model=SummaryDTO)
async def get_summary(
    project_id: int,
    assignee_ids: Optional[str] = Query(None),
    date_from: Optional[date_type] = Query(None),
    date_to: Optional[date_type] = Query(None),
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    report_repo: IReportRepository = Depends(get_report_repo),
):
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(project_id, current_user.id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")

    parsed_ids = _parse_assignee_ids(assignee_ids)
    use_case = GetSummaryUseCase(report_repo)
    return await use_case.execute(project_id, parsed_ids, date_from, date_to)


@router.get("/burndown", response_model=BurndownDTO)
async def get_burndown(
    project_id: int,
    sprint_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    report_repo: IReportRepository = Depends(get_report_repo),
):
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(project_id, current_user.id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")

    use_case = GetBurndownUseCase(report_repo)
    return await use_case.execute(project_id, sprint_id)


@router.get("/velocity", response_model=VelocityDTO)
async def get_velocity(
    project_id: int,
    date_from: Optional[date_type] = Query(None),
    date_to: Optional[date_type] = Query(None),
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    report_repo: IReportRepository = Depends(get_report_repo),
):
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(project_id, current_user.id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")

    use_case = GetVelocityUseCase(report_repo)
    return await use_case.execute(project_id, date_from, date_to)


@router.get("/distribution", response_model=DistributionDTO)
async def get_distribution(
    project_id: int,
    group_by: str = Query("status"),
    assignee_ids: Optional[str] = Query(None),
    date_from: Optional[date_type] = Query(None),
    date_to: Optional[date_type] = Query(None),
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    report_repo: IReportRepository = Depends(get_report_repo),
):
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(project_id, current_user.id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")

    parsed_ids = _parse_assignee_ids(assignee_ids)
    use_case = GetDistributionUseCase(report_repo)
    return await use_case.execute(project_id, group_by, parsed_ids, date_from, date_to)


@router.get("/performance", response_model=PerformanceDTO)
async def get_performance(
    project_id: int,
    assignee_ids: Optional[str] = Query(None),
    date_from: Optional[date_type] = Query(None),
    date_to: Optional[date_type] = Query(None),
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    report_repo: IReportRepository = Depends(get_report_repo),
):
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(project_id, current_user.id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")

    parsed_ids = _parse_assignee_ids(assignee_ids)
    use_case = GetPerformanceUseCase(report_repo)
    return await use_case.execute(project_id, parsed_ids, date_from, date_to)


@router.get("/export/pdf")
async def export_pdf(
    project_id: int,
    assignee_ids: Optional[str] = Query(None),
    date_from: Optional[date_type] = Query(None),
    date_to: Optional[date_type] = Query(None),
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    report_repo: IReportRepository = Depends(get_report_repo),
):
    # Membership check (inline — project_id is query param, not path param)
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(project_id, current_user.id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")

    # Get project details for filename and header
    project_obj = await project_repo.get_by_id(project_id)
    if not project_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    parsed_ids = _parse_assignee_ids(assignee_ids)
    tasks = await report_repo.get_tasks_for_export(project_id, parsed_ids, date_from, date_to)

    # Build filter summary string
    filter_parts = []
    if parsed_ids:
        filter_parts.append(f"Atanan ID: {', '.join(str(i) for i in parsed_ids)}")
    if date_from:
        filter_parts.append(f"Başlangıç: {date_from}")
    if date_to:
        filter_parts.append(f"Bitiş: {date_to}")
    filter_summary = " | ".join(filter_parts) if filter_parts else "Tüm veriler"

    generated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M")

    # Render HTML template
    template_dir = Path(__file__).resolve().parent.parent.parent / "infrastructure" / "email" / "templates"
    env = jinja2.Environment(loader=jinja2.FileSystemLoader(str(template_dir)))
    template = env.get_template("report.html")
    html_string = template.render(
        project_name=project_obj.name,
        filter_summary=filter_summary,
        generated_at=generated_at,
        tasks=tasks,
    )

    # Generate PDF via WeasyPrint
    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html_string).write_pdf()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF oluşturulamadı: {exc}",
        )

    project_key = getattr(project_obj, 'key', 'UNKNOWN')
    filename = f"SPMS_Report_{project_key}_{date_type.today()}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/excel")
async def export_excel(
    project_id: int,
    assignee_ids: Optional[str] = Query(None),
    date_from: Optional[date_type] = Query(None),
    date_to: Optional[date_type] = Query(None),
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
    report_repo: IReportRepository = Depends(get_report_repo),
):
    # Same membership check as PDF
    if not _is_admin(current_user):
        project = await project_repo.get_by_id_and_user(project_id, current_user.id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")

    project_obj = await project_repo.get_by_id(project_id)
    if not project_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    parsed_ids = _parse_assignee_ids(assignee_ids)
    tasks = await report_repo.get_tasks_for_export(project_id, parsed_ids, date_from, date_to)

    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Excel kütüphanesi yüklenemedi: {exc}",
        )

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "SPMS Raporu"

    # Header row styling: #4F46E5 background, white bold text
    header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True, size=10)
    header_alignment = Alignment(horizontal="left", vertical="center")

    headers = ["Görev Kodu", "Başlık", "Durum", "Atanan", "Öncelik",
               "Sprint", "Puan", "Oluşturulma", "Bitiş Tarihi", "Güncelleme", "Raporlayan"]
    col_widths = [14, 40, 16, 24, 14, 20, 8, 18, 18, 18, 24]

    for col_idx, (header, width) in enumerate(zip(headers, col_widths), 1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = header_alignment
        ws.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = width

    ws.row_dimensions[1].height = 20

    # Data rows
    for task in tasks:
        ws.append([
            task.task_key or "",
            task.title,
            task.status or "",
            task.assignee or "",
            task.priority or "",
            task.sprint or "",
            task.points,
            task.created_at.strftime("%Y-%m-%d %H:%M") if task.created_at else "",
            task.due_date.strftime("%Y-%m-%d") if task.due_date else "",
            task.updated_at.strftime("%Y-%m-%d %H:%M") if task.updated_at else "",
            task.reporter or "",
        ])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    project_key = getattr(project_obj, 'key', 'UNKNOWN')
    filename = f"SPMS_Report_{project_key}_{date_type.today()}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
