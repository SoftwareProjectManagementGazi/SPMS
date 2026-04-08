---
phase: 06-reporting-analytics
plan: "01"
subsystem: api
tags: [fastapi, sqlalchemy, pydantic, reporting, analytics, clean-architecture]

# Dependency graph
requires:
  - phase: 04-views-ui
    provides: Board columns ilike('%done%') pattern for status detection
  - phase: 05-notifications
    provides: Dependency injection pattern (get_*_repo in dependencies.py)
provides:
  - IReportRepository interface (6 abstract methods)
  - SqlAlchemyReportRepository with full SQL aggregation queries
  - 5 use case classes (Summary, Burndown, Velocity, Distribution, Performance)
  - FastAPI router with 5 GET endpoints at /api/v1/reports/
  - All reporting response DTOs (SummaryDTO, BurndownDTO, VelocityDTO, DistributionDTO, PerformanceDTO, MemberPerformanceDTO, TaskExportRowDTO)
affects: [06-02-backend-export, 06-03-frontend-reports-page, 06-04-team-performance-manager-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Report DTOs use ConfigDict(from_attributes=True) per project standard"
    - "IReportRepository ABC follows same pattern as INotificationRepository"
    - "SqlAlchemyReportRepository uses done-column ilike('%done%') detection per Phase 4 pattern"
    - "Burndown audit log query casts column IDs to strings for new_value TEXT field comparison"
    - "Router uses inline _check_project_membership helper instead of Depends() — project_id is query param, not path param"
    - "get_report_repo uses lazy import pattern matching get_notification_repo"

key-files:
  created:
    - Backend/app/application/dtos/report_dtos.py
    - Backend/app/domain/repositories/report_repository.py
    - Backend/app/infrastructure/database/repositories/report_repo.py
    - Backend/app/application/use_cases/generate_reports.py
    - Backend/app/api/v1/reports.py
  modified:
    - Backend/app/api/dependencies.py
    - Backend/app/api/main.py

key-decisions:
  - "Inline _check_project_membership() helper in reports.py instead of Depends() — project_id is a query param on all report endpoints, not a path param, so the existing get_project_member dependency (which reads path param) cannot be reused"
  - "Burndown day loop casts done column IDs to strings via [str(cid) for cid in done_col_ids] per AuditLogModel.new_value being TEXT type (Phase 5 pattern, Pitfall 4)"
  - "TaskExportRowDTO used in get_tasks_for_export method — supports Plan 02 (PDF/Excel export) without changes to repo interface"
  - "Priority label normalisation handles both 'HIGH' and 'TaskPriority.HIGH' enum str representations"

patterns-established:
  - "Report endpoints all use project_id as required query param (not path param)"
  - "All 5 report endpoints share identical auth pattern: get_current_user + inline membership check"

requirements-completed: [REPT-01, REPT-02, REPT-04]

# Metrics
duration: 4min
completed: 2026-04-08
---

# Phase 6 Plan 01: Backend Reporting Data Endpoints Summary

**5 reporting API endpoints (summary, burndown, velocity, distribution, performance) with Clean Architecture — DTOs, IReportRepository interface, SQL aggregation repo, thin use cases, and FastAPI router registered at /api/v1/reports/**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-08T06:49:58Z
- **Completed:** 2026-04-08T06:54:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Created all reporting DTOs (SummaryDTO, BurndownDTO, VelocityDTO, DistributionDTO, PerformanceDTO, MemberPerformanceDTO, TaskExportRowDTO) with Pydantic + ConfigDict
- Created IReportRepository ABC with 6 abstract methods covering all data and export operations
- Implemented SqlAlchemyReportRepository with SQL aggregation queries for all 6 methods, including burndown with audit log tracking (column ID cast to string), velocity with sprint/week fallback, performance with on-time delivery calculation
- Created 5 thin use case classes delegating entirely to IReportRepository
- Created FastAPI router with 5 GET endpoints, all enforcing project membership via inline helper (project_id is query param, not path param)
- Registered get_report_repo dependency and reports router in dependencies.py and main.py respectively

## Task Commits

Each task was committed atomically:

1. **Task 1: Domain contracts — report DTOs and IReportRepository interface** - `a4ba510e` (feat)
2. **Task 2: SQL report repo, use cases, router, and wiring** - `20381907` (feat)

## Files Created/Modified

- `Backend/app/application/dtos/report_dtos.py` — 7 Pydantic response DTOs for all reporting endpoints
- `Backend/app/domain/repositories/report_repository.py` — IReportRepository ABC with 6 abstract methods
- `Backend/app/infrastructure/database/repositories/report_repo.py` — SqlAlchemyReportRepository with full SQL aggregation queries
- `Backend/app/application/use_cases/generate_reports.py` — 5 use case classes (GetSummaryUseCase, GetBurndownUseCase, GetVelocityUseCase, GetDistributionUseCase, GetPerformanceUseCase)
- `Backend/app/api/v1/reports.py` — FastAPI router with 5 GET endpoints + _parse_assignee_ids helper
- `Backend/app/api/dependencies.py` — Added get_report_repo dependency + IReportRepository import
- `Backend/app/api/main.py` — Registered reports router at /api/v1/reports

## Decisions Made

- **Inline membership check**: `_check_project_membership()` as a coroutine helper in reports.py instead of using `Depends(get_project_member)`. The reason: all report endpoints take `project_id` as a query parameter, but the existing `get_project_member` dependency reads it as a path parameter. Creating an inline async helper is consistent with how Phase 3 comment/sprint endpoints handled the same pattern.
- **TaskExportRowDTO in IReportRepository**: Included `get_tasks_for_export()` in the interface even though Plan 01 doesn't expose an export endpoint. This supports Plan 02 (PDF/Excel export) without any interface changes.
- **String cast for burndown**: `[str(cid) for cid in done_col_ids]` per Pitfall 4 — AuditLogModel.new_value is a TEXT column, so column IDs must be cast to strings for the IN clause comparison.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The system Python 3.13 lacks pydantic; used the project's venv at `/Users/ayseoz/Desktop/project-management-system/Backend/.venv/bin/python3` for verification.

## Known Stubs

None — all 5 endpoints perform real SQL queries against live database tables. The `get_tasks_for_export()` method is wired but not exposed as an HTTP endpoint in this plan (Plan 02 will add the export endpoint).

## Next Phase Readiness

- All 5 report data endpoints are available for Plan 03 (frontend reports page) and Plan 04 (manager dashboard)
- Plan 02 (PDF/Excel export) can use `get_tasks_for_export()` from the existing IReportRepository interface without changes
- No blockers

---
*Phase: 06-reporting-analytics*
*Completed: 2026-04-08*
