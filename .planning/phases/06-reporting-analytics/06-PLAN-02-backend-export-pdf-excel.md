---
plan: "06-02"
phase: "06-reporting-analytics"
type: execute
title: "Backend PDF/Excel Export Endpoints"
wave: 2
depends_on: ["06-01"]
requirements: [REPT-03]
files_modified:
  - Backend/requirements.txt
  - Backend/app/infrastructure/email/templates/report.html
  - Backend/app/api/v1/reports.py
autonomous: true
must_haves:
  truths:
    - "GET /api/v1/reports/export/pdf returns a downloadable PDF file with filtered task data"
    - "GET /api/v1/reports/export/excel returns a downloadable XLSX file with all task fields"
    - "PDF filename follows SPMS_Report_[ProjectKey]_[YYYY-MM-DD].pdf pattern"
    - "Excel filename follows SPMS_Report_[ProjectKey]_[YYYY-MM-DD].xlsx pattern"
    - "PDF contains header with SPMS Raporu, project name, filter summary, and generation timestamp"
    - "Excel header row is styled with indigo (#4F46E5) background and white text"
  artifacts:
    - path: "Backend/requirements.txt"
      provides: "weasyprint and openpyxl declared as dependencies"
      contains: "weasyprint"
    - path: "Backend/app/infrastructure/email/templates/report.html"
      provides: "Jinja2 HTML template rendered by WeasyPrint into PDF"
      contains: "SPMS Raporu"
    - path: "Backend/app/api/v1/reports.py"
      provides: "Two additional export endpoints appended to the existing reports router"
      contains: "export/pdf"
  key_links:
    - from: "Backend/app/api/v1/reports.py"
      to: "Backend/app/infrastructure/email/templates/report.html"
      via: "Jinja2 Environment template loading"
      pattern: "get_template.*report\\.html"
    - from: "Backend/app/api/v1/reports.py"
      to: "Backend/app/infrastructure/database/repositories/report_repo.py"
      via: "get_tasks_for_export method on IReportRepository"
      pattern: "get_tasks_for_export"
---

## Objective

Add PDF and Excel export capabilities to the reports router created in Plan 01. A Jinja2 HTML template is rendered via WeasyPrint for PDF. openpyxl generates styled Excel workbooks. Both endpoints use `StreamingResponse` to deliver the file as a download. The `requirements.txt` is updated with `weasyprint` and `openpyxl`.

Purpose: Users need to export filtered report data for offline use or sharing (REPT-03).

Output: Updated requirements.txt, new Jinja2 PDF template, 2 export endpoints added to existing reports router.

## Tasks

<task id="06-02-T01" title="Jinja2 PDF template and requirements.txt update">
  <read_first>
    - Backend/requirements.txt — current dependencies (weasyprint and openpyxl must be added)
    - Backend/app/infrastructure/email/templates/task_assigned.html — existing Jinja2 email template pattern (HTML structure, variable interpolation syntax)
    - .planning/phases/06-reporting-analytics/06-UI-SPEC.md — PDF Document Design section (font, header, table styling, page size, column order)
    - .planning/phases/06-reporting-analytics/06-CONTEXT.md — Export section (PDF columns: task key, title, status, assignee, priority, due date; header: "SPMS Raporu")
  </read_first>
  <action>
    **File 1: Modify `Backend/requirements.txt`**

    Add these two lines at the end of the file (after `fastapi-mail`):
    ```
    openpyxl
    weasyprint
    ```

    NOTE for executor: After modifying requirements.txt, run `cd Backend && pip install openpyxl weasyprint` to install into the venv. WeasyPrint requires system libraries (pango, cairo). If `brew install pango` has not been run, run it first. If brew is not available or system deps fail, the PDF export endpoint will raise an ImportError at runtime — this is acceptable for now; the Excel export will still work.

    **File 2: Create `Backend/app/infrastructure/email/templates/report.html`**

    This is a Jinja2 HTML template rendered by WeasyPrint. It produces an A4 landscape PDF.

    ```html
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="utf-8">
      <style>
        @page {
          size: A4 landscape;
          margin: 1.5cm;
        }
        body {
          font-family: Inter, Arial, sans-serif;
          font-size: 11px;
          color: #1a1a21;
          margin: 0;
          padding: 0;
        }
        .header {
          border-top: 4px solid #4f46e5;
          padding-top: 12px;
          margin-bottom: 20px;
        }
        .header h1 {
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 4px 0;
          color: #1a1a21;
        }
        .header .meta {
          font-size: 10px;
          color: #6b7280;
          margin: 2px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        th {
          background-color: #4f46e5;
          color: #ffffff;
          font-weight: 600;
          font-size: 9px;
          text-align: left;
          padding: 6px 8px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        td {
          font-size: 9px;
          padding: 5px 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) td {
          background-color: #f4f4f8;
        }
        tr:nth-child(odd) td {
          background-color: #ffffff;
        }
        .footer {
          margin-top: 16px;
          font-size: 8px;
          color: #9ca3af;
          text-align: right;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SPMS Raporu</h1>
        <p class="meta">Proje: {{ project_name }}</p>
        <p class="meta">Filtreler: {{ filter_summary }}</p>
        <p class="meta">Oluşturulma: {{ generated_at }}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Görev Kodu</th>
            <th>Başlık</th>
            <th>Durum</th>
            <th>Atanan</th>
            <th>Öncelik</th>
            <th>Bitiş Tarihi</th>
          </tr>
        </thead>
        <tbody>
          {% for task in tasks %}
          <tr>
            <td>{{ task.task_key or '-' }}</td>
            <td>{{ task.title }}</td>
            <td>{{ task.status or '-' }}</td>
            <td>{{ task.assignee or '-' }}</td>
            <td>{{ task.priority or '-' }}</td>
            <td>{{ task.due_date.strftime('%Y-%m-%d') if task.due_date else '-' }}</td>
          </tr>
          {% endfor %}
        </tbody>
      </table>
      <div class="footer">
        SPMS &mdash; {{ generated_at }}
      </div>
    </body>
    </html>
    ```

    Template variables:
    - `project_name` (str): project name
    - `filter_summary` (str): human-readable filter description, e.g. "Atanan: Ayse Oz | Tarih: 2026-03-01 - 2026-03-31"
    - `generated_at` (str): formatted timestamp "YYYY-MM-DD HH:MM"
    - `tasks` (list of TaskExportRowDTO): each has .task_key, .title, .status, .assignee, .priority, .due_date
  </action>
  <acceptance_criteria>
    - `grep -r "weasyprint" Backend/requirements.txt` exits 0
    - `grep -r "openpyxl" Backend/requirements.txt` exits 0
    - `test -f Backend/app/infrastructure/email/templates/report.html` exits 0
    - `grep -r "SPMS Raporu" Backend/app/infrastructure/email/templates/report.html` exits 0
    - `grep -r "Görev Kodu" Backend/app/infrastructure/email/templates/report.html` exits 0
    - `grep -r "Başlık" Backend/app/infrastructure/email/templates/report.html` exits 0
    - `grep -r "A4 landscape" Backend/app/infrastructure/email/templates/report.html` exits 0
    - `grep -r "#4f46e5" Backend/app/infrastructure/email/templates/report.html` exits 0
    - `grep -r "project_name" Backend/app/infrastructure/email/templates/report.html` exits 0
    - `grep -r "filter_summary" Backend/app/infrastructure/email/templates/report.html` exits 0
    - `grep -r "generated_at" Backend/app/infrastructure/email/templates/report.html` exits 0
  </acceptance_criteria>
</task>

<task id="06-02-T02" title="PDF and Excel export endpoints in reports router">
  <read_first>
    - Backend/app/api/v1/reports.py — existing router from Plan 01 (add export endpoints to this file)
    - Backend/app/infrastructure/email/templates/report.html — Jinja2 template created in T01
    - Backend/app/application/dtos/report_dtos.py — TaskExportRowDTO definition
    - Backend/app/domain/repositories/report_repository.py — get_tasks_for_export interface method
    - Backend/app/infrastructure/database/repositories/report_repo.py — SQL implementation of get_tasks_for_export
    - Backend/app/api/dependencies.py — get_report_repo, get_project_repo, get_current_user
    - .planning/phases/06-reporting-analytics/06-CONTEXT.md — Export section (filenames, columns, content structure)
    - .planning/phases/06-reporting-analytics/06-UI-SPEC.md — Excel Workbook Design section (sheet name, header row styling, column widths)
  </read_first>
  <action>
    **Modify `Backend/app/api/v1/reports.py`** to add two export endpoints at the bottom of the file.

    Add imports at the top of the file:
    ```python
    import io
    from datetime import date as date_type, datetime
    from fastapi.responses import StreamingResponse
    import jinja2
    from pathlib import Path
    ```

    **Endpoint 1: GET /export/pdf**

    ```python
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
                raise HTTPException(status_code=403, detail="Not a project member")
        
        # Get project details for filename and header
        project_obj = await project_repo.get_by_id(project_id)
        if not project_obj:
            raise HTTPException(status_code=404, detail="Project not found")
        
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
        from weasyprint import HTML
        pdf_bytes = HTML(string=html_string).write_pdf()
        
        project_key = getattr(project_obj, 'key', 'UNKNOWN')
        filename = f"SPMS_Report_{project_key}_{date_type.today()}.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    ```

    Extract a helper function `_parse_assignee_ids(assignee_ids: Optional[str]) -> Optional[List[int]]` at the module level (above the endpoints) that splits comma-separated string into list of ints, returns None if input is None or empty. Reuse this in all endpoints (refactor existing endpoints if they have inline parsing).

    Import `_is_admin` from dependencies: `from app.api.dependencies import get_current_user, get_project_repo, get_report_repo, _is_admin`

    **Endpoint 2: GET /export/excel**

    ```python
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
                raise HTTPException(status_code=403, detail="Not a project member")
        
        project_obj = await project_repo.get_by_id(project_id)
        if not project_obj:
            raise HTTPException(status_code=404, detail="Project not found")
        
        parsed_ids = _parse_assignee_ids(assignee_ids)
        tasks = await report_repo.get_tasks_for_export(project_id, parsed_ids, date_from, date_to)
        
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment
        
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
    ```
  </action>
  <acceptance_criteria>
    - `grep -r "export_pdf" Backend/app/api/v1/reports.py` exits 0
    - `grep -r "export_excel" Backend/app/api/v1/reports.py` exits 0
    - `grep -r "StreamingResponse" Backend/app/api/v1/reports.py` exits 0
    - `grep -r "SPMS_Report_" Backend/app/api/v1/reports.py` exits 0
    - `grep -r "SPMS Raporu" Backend/app/api/v1/reports.py` exits 0 (Excel sheet name)
    - `grep -r "4F46E5" Backend/app/api/v1/reports.py` exits 0 (Excel header fill color)
    - `grep -r "get_template.*report.html" Backend/app/api/v1/reports.py` exits 0 (Jinja2 template loading)
    - `grep -r "_parse_assignee_ids" Backend/app/api/v1/reports.py` exits 0 (helper function)
    - `grep -r "application/pdf" Backend/app/api/v1/reports.py` exits 0
    - `grep -r "openxmlformats-officedocument" Backend/app/api/v1/reports.py` exits 0
    - `grep -r "Content-Disposition" Backend/app/api/v1/reports.py` exits 0
    - `grep -r 'Görev Kodu.*Başlık.*Durum' Backend/app/api/v1/reports.py` exits 0 (Excel header row columns)
    - `cd Backend && python3 -c "from app.api.v1.reports import router; print('OK')"` exits 0
  </acceptance_criteria>
</task>

## Verification

After both tasks complete:
1. reports.py has 7 total endpoints (5 data + 2 export)
2. `Backend/app/infrastructure/email/templates/report.html` exists and contains proper Jinja2 template
3. `requirements.txt` includes both `weasyprint` and `openpyxl`
4. Export endpoints use StreamingResponse with Content-Disposition headers
5. Both export endpoints enforce project membership checks
