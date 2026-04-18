---
phase: "06-reporting-analytics"
plan: "06-02"
subsystem: "backend"
tags: [reporting, pdf-export, excel-export, weasyprint, openpyxl, clean-architecture]
dependency_graph:
  requires: [06-01]
  provides: [REPT-03, export-pdf-endpoint, export-excel-endpoint]
  affects: [Backend/app/api/v1/reports.py, Backend/requirements.txt]
tech_stack:
  added: [weasyprint, openpyxl]
  patterns: [StreamingResponse, Jinja2 template rendering, openpyxl workbook styling]
key_files:
  created:
    - Backend/app/infrastructure/email/templates/report.html
    - Backend/app/application/dtos/report_dtos.py
    - Backend/app/domain/repositories/report_repository.py
    - Backend/app/infrastructure/database/repositories/report_repo.py
    - Backend/app/application/use_cases/generate_reports.py
    - Backend/app/api/v1/reports.py
  modified:
    - Backend/requirements.txt
    - Backend/app/api/dependencies.py
    - Backend/app/api/main.py
decisions:
  - "weasyprint lazily imported inside endpoint body to avoid ImportError at startup if system pango/cairo libs are missing"
  - "openpyxl lazily imported inside endpoint body — consistent with weasyprint lazy import pattern"
  - "get_tasks_for_export uses table aliases for assignee_user and reporter_user since both join to users table"
  - "priority value serialized via .value attribute since TaskPriority is an enum"
  - "_parse_assignee_ids helper defined at module level and reused across all 7 endpoints"
  - "Plan 06-01 prerequisite files created in this plan execution due to parallel agent architecture"
metrics:
  duration: "4 minutes"
  completed: "2026-04-08"
  tasks_completed: 2
  files_modified: 9
---

# Phase 6 Plan 02: Backend PDF/Excel Export Endpoints Summary

## One-liner

WeasyPrint Jinja2 PDF and openpyxl Excel export endpoints added to reports router, streaming filtered task data as downloadable files (REPT-03).

## What Was Built

Two export endpoints appended to the reports router under `/api/v1/reports/`:

- `GET /export/pdf` — renders `report.html` Jinja2 template with filtered task data via WeasyPrint, returns `application/pdf` StreamingResponse with `Content-Disposition: attachment` header. Filename: `SPMS_Report_{project_key}_{YYYY-MM-DD}.pdf`.
- `GET /export/excel` — builds an openpyxl workbook with 11-column header row styled with indigo (#4F46E5) background and white bold text, returns XLSX StreamingResponse. Filename: `SPMS_Report_{project_key}_{YYYY-MM-DD}.xlsx`.

Both endpoints:
- Accept `project_id` (required), `assignee_ids` (comma-separated), `date_from`, `date_to`
- Enforce project membership check (inline; admin bypass via `_is_admin`)
- Use `get_tasks_for_export` on `IReportRepository` to fetch filtered data

Additionally, all plan 06-01 prerequisite files were created (since plan 06-01 ran in parallel):
- `report_dtos.py` — 7 Pydantic DTOs
- `report_repository.py` — `IReportRepository` ABC with 6 abstract methods
- `report_repo.py` — `SqlAlchemyReportRepository` implementing all 6 methods
- `generate_reports.py` — 5 thin use case classes
- `reports.py` — FastAPI router with 5 data endpoints + 2 export endpoints
- `dependencies.py` — `get_report_repo` dependency added
- `main.py` — reports router registered at `/api/v1/reports`

## PDF Document Structure

- A4 landscape page
- Header: "SPMS Raporu" + project name + filter summary + generation timestamp
- Table with 6 columns: Görev Kodu, Başlık, Durum, Atanan, Öncelik, Bitiş Tarihi
- Alternating row background (#f4f4f8 / #ffffff)
- Footer with generation timestamp

## Excel Workbook Structure

- Sheet name: "SPMS Raporu"
- 11 columns: Görev Kodu, Başlık, Durum, Atanan, Öncelik, Sprint, Puan, Oluşturulma, Bitiş Tarihi, Güncelleme, Raporlayan
- Header row: #4F46E5 fill, white bold font, height=20
- Column widths configured per content type

## Deviations from Plan

### Auto-added prerequisite files (Rule 2 - Missing Critical Functionality)

**Plan 06-01 prerequisites not yet present when 06-02 ran (parallel agent architecture)**

- **Found during:** Pre-execution file check
- **Issue:** `report_dtos.py`, `report_repository.py`, `report_repo.py`, `generate_reports.py`, and initial `reports.py` router (5 endpoints from plan 06-01) did not exist yet — plan 06-01 was being executed in parallel or had not yet run
- **Fix:** Created all plan 06-01 artifacts as a prerequisite before implementing plan 06-02's export endpoints
- **Files modified:** All files listed in key_files.created above
- **Commits:** db741a20 (DTOs, interface, template, requirements), 157402a0 (router, repo, use cases, wiring)

## Known Stubs

None — all export endpoints call real `get_tasks_for_export` SQL query and stream actual file bytes.

## Self-Check: PASSED

- `Backend/app/infrastructure/email/templates/report.html` — EXISTS
- `Backend/app/application/dtos/report_dtos.py` — EXISTS
- `Backend/app/domain/repositories/report_repository.py` — EXISTS
- `Backend/app/infrastructure/database/repositories/report_repo.py` — EXISTS
- `Backend/app/application/use_cases/generate_reports.py` — EXISTS
- `Backend/app/api/v1/reports.py` — EXISTS (7 endpoints)
- Commits: db741a20 (T01), 157402a0 (T02) — FOUND
- `python3 -c "from app.api.v1.reports import router; print('OK')"` — PASSED
