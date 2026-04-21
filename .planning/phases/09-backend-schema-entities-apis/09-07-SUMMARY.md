---
phase: 09-backend-schema-entities-apis
plan: "07"
subsystem: backend-entities-schema
tags: [phase-report, fpdf2, pdf-export, vertical-slice, BACK-06, D-25, D-58, D-59, D-60, audit-log]
dependency_graph:
  requires: ["09-01", "09-02", "09-03", "09-04"]
  provides:
    - "PhaseReport Pydantic entity with phase_id NODE_ID_REGEX + cycle_number/revision defaults (D-25)"
    - "IPhaseReportRepository interface (7 abstract methods incl. get_latest_by_project_phase)"
    - "PhaseReportModel ORM mapped to phase_reports table (migration 005 partial unique index)"
    - "SqlAlchemyPhaseReportRepository: full CRUD + soft-delete + get_latest_by_project_phase"
    - "IAuditRepository.count_phase_transitions abstract method"
    - "SqlAlchemyAuditRepository.count_phase_transitions (D-25 cycle_number auto-calc via extra_metadata JSONB)"
    - "get_phase_report_repo DI factory in deps/phase_report.py + dependencies.py shim"
    - "PhaseReportCreateDTO/UpdateDTO/ResponseDTO (UpdateDTO omits revision/cycle_number per T-09-07-01)"
    - "5 use cases: Create (D-25 auto-calc + override), Update (revision +=1), Delete, List, Get"
    - "render_pdf() service with 3-platform Unicode font chain + Helvetica fallback + _safe() encoding guard"
    - "10 unit tests (entity + use cases + PDF smoke) passing"
    - "4 integration tests (repo + partial unique index behavior, Pitfall 8)"
  affects:
    - "Backend/app/domain/repositories/audit_repository.py"
    - "Backend/app/infrastructure/database/repositories/audit_repo.py"
    - "Backend/app/infrastructure/database/models/__init__.py"
    - "Backend/app/api/dependencies.py"
    - "Backend/app/api/deps/phase_report.py"
tech_stack:
  added:
    - "fpdf2 2.8.7 (installed; already in requirements.txt)"
  patterns:
    - "pdf.epw for multi_cell width instead of 0 — avoids fpdf2 2.8.x 'Not enough horizontal space' error"
    - "_safe(text, is_unicode) — latin-1 encode/replace fallback when Helvetica font is active"
    - "_resolve_font(pdf) — 3-platform candidate list (macOS/Linux/Windows) with Helvetica fallback"
    - "D-25 cycle_number derivation: count(audit_log phase_transitions) + 1 via extra_metadata JSONB query"
    - "D-25 revision auto-increment: existing.revision += 1 in UpdatePhaseReportUseCase before repo.update"
key_files:
  created:
    - Backend/app/domain/entities/phase_report.py
    - Backend/app/domain/repositories/phase_report_repository.py
    - Backend/app/infrastructure/database/models/phase_report.py
    - Backend/app/infrastructure/database/repositories/phase_report_repo.py
    - Backend/app/application/dtos/phase_report_dtos.py
    - Backend/app/application/use_cases/manage_phase_reports.py
    - Backend/app/application/services/phase_report_pdf.py
    - Backend/tests/unit/test_phase_report_entity.py
    - Backend/tests/unit/application/test_manage_phase_reports.py
    - Backend/tests/unit/application/test_phase_report_pdf.py
    - Backend/tests/integration/infrastructure/test_phase_report_repo_integration.py
  modified:
    - Backend/app/domain/repositories/audit_repository.py
    - Backend/app/infrastructure/database/repositories/audit_repo.py
    - Backend/app/infrastructure/database/models/__init__.py
    - Backend/app/api/deps/phase_report.py
    - Backend/app/api/dependencies.py
decisions:
  - "cycle_number auto-calc rule: count(audit_log WHERE action='phase_transition' AND entity_id=project_id AND extra_metadata->>'source_phase_id'=phase_id) + 1, unless explicit override in DTO (D-25)"
  - "revision auto-increment: PATCH always does existing.revision += 1 before repo.update; UpdateDTO omits revision field entirely (T-09-07-01 tamper mitigation)"
  - "Partial unique index (Pitfall 8): soft-deleted rows excluded from ux_phase_reports_active; re-create after soft-delete works correctly"
  - "Race condition Pitfall 9: concurrent creates with same cycle_number raise IntegrityError; retry strategy deferred to router plan 09-10"
  - "PDF font fallback chain: macOS Arial Unicode → Linux DejaVu → Windows ArialUni → Helvetica (Latin-1 fallback with _safe() replace encoding)"
  - "multi_cell uses pdf.epw not 0 — fpdf2 2.8.7 raises FPDFException with w=0 at small font sizes (Rule 1 fix)"
  - "Turkish diacritics: _safe() replaces non-Latin-1 chars with '?' when Helvetica is active; no crash, visual fidelity degraded (manual verification per 09-VALIDATION.md)"
  - "Manual visual verification of PDF quality deferred to 09-VALIDATION.md Manual Verifications section"
metrics:
  duration: "12 min"
  completed: "2026-04-21"
  tasks_completed: 2
  files_changed: 16
---

# Phase 09 Plan 07: PhaseReport Vertical Slice (BACK-06) Summary

**One-liner:** PhaseReport entity + ORM + repo + DTOs + 5 use cases + fpdf2 PDF service with Unicode font chain and Helvetica fallback, cycle_number auto-calc from audit_log (D-25), revision auto-increment on PATCH (D-25).

## What Was Built

### Task 09-07-01: PhaseReport entity + ORM + repo + DI factory + audit_repo count helper (TDD)

**`Backend/app/domain/entities/phase_report.py`** — PhaseReport Pydantic entity:

| Field | Type | Notes |
|-------|------|-------|
| `phase_id` | `str` | NODE_ID_REGEX validated (D-22) |
| `cycle_number` | `int` | Default 1, D-25 auto-calc by use case |
| `revision` | `int` | Default 1, D-25 auto-increment on PATCH |
| `completed_tasks_notes` | `Dict[str, str]` | Default `{}`, D-40 |
| `summary_*` fields | `Optional[int]` | 4 explicit SQL columns (D-39) |

**`Backend/app/domain/repositories/phase_report_repository.py`** — `IPhaseReportRepository` with 7 abstract methods including `get_latest_by_project_phase` (returns highest cycle_number row).

**`Backend/app/infrastructure/database/models/phase_report.py`** — `PhaseReportModel` ORM mapped to `phase_reports` table. Partial unique index `ux_phase_reports_active (project_id, phase_id, cycle_number) WHERE is_deleted=FALSE` enforced at DB level via migration 005.

**`Backend/app/infrastructure/database/repositories/phase_report_repo.py`** — `SqlAlchemyPhaseReportRepository` with full CRUD, soft-delete, and `get_latest_by_project_phase` (ORDER BY cycle_number DESC LIMIT 1).

**Audit repo extension:**
- `IAuditRepository.count_phase_transitions(project_id, source_phase_id) -> int` (abstract method added)
- `SqlAlchemyAuditRepository.count_phase_transitions` — uses `AuditLogModel.extra_metadata["source_phase_id"].astext == source_phase_id` JSONB query (D-08 envelope pattern from Pitfall 7)

**DI factory** — `Backend/app/api/deps/phase_report.py` stub replaced with full implementation; exported from `dependencies.py` shim.

**Tests:** 2 unit tests (entity defaults + phase_id validation) + 4 integration tests (roundtrip, partial-unique duplicate rejection, soft-delete allows re-create, get_latest).

### Task 09-07-02: PhaseReport DTOs + use cases + PDF service + unit tests (TDD)

**DTOs (`Backend/app/application/dtos/phase_report_dtos.py`):**
- `PhaseReportCreateDTO`: `project_id`, `phase_id` required; `cycle_number` optional (None → auto-calc)
- `PhaseReportUpdateDTO`: Only the 8 mutable fields; NO `revision`, `cycle_number`, `phase_id`, `project_id` (T-09-07-01 tamper mitigation — Pydantic ignores unknown keys at parse time)
- `PhaseReportResponseDTO`: Full response shape with `ConfigDict(from_attributes=True)`

**Use cases (`Backend/app/application/use_cases/manage_phase_reports.py`):**

| Use Case | Key Logic |
|----------|-----------|
| `CreatePhaseReportUseCase` | `_validate_phase_in_workflow` → D-25 cycle_number auto-calc → create |
| `UpdatePhaseReportUseCase` | `existing.revision += 1` before `repo.update` (D-25) |
| `DeletePhaseReportUseCase` | Delegates to `repo.delete` (soft-delete) |
| `ListPhaseReportsUseCase` | Routes to `list_by_phase` or `list_by_project` based on `phase_id` arg |
| `GetPhaseReportUseCase` | Delegates to `repo.get_by_id` |

**PDF service (`Backend/app/application/services/phase_report_pdf.py`):**
- `render_pdf(report, project_name, phase_name) -> bytes` — main entry point
- `_resolve_font(pdf)` — tries 3 platform-specific Unicode fonts; falls back to Helvetica
- `_safe(text, is_unicode)` — Latin-1 encode/replace guard for Helvetica fallback (no crash on Turkish chars)
- 4 composition functions: `_render_header`, `_render_summary`, `_render_tasks_section`, `_render_reflection`
- Output starts with `b"%PDF"` (valid PDF magic bytes)

**Tests:** 4 use case unit tests (cycle_number auto, explicit override, revision increment, delete) + 4 PDF smoke tests (valid bytes, empty fields, Turkish diacritics no-crash, completed_tasks_notes).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] fpdf2 not installed in active Python environment**
- **Found during:** Task 2, running RED phase tests
- **Issue:** `fpdf2` is in `requirements.txt` but not installed in the current Anaconda environment
- **Fix:** `pip install fpdf2` (already a declared dependency)
- **Files modified:** None (environment fix)
- **Commit:** N/A (environment)

**2. [Rule 1 - Bug] FPDFUnicodeEncodingException when Helvetica fallback is active**
- **Found during:** Task 2, GREEN phase — all 4 PDF tests failed
- **Issue:** Static Turkish labels (`"Tasınan"`, `"Döngü"` etc.) in the PDF service contain chars outside Latin-1; fpdf2 raises `FPDFUnicodeEncodingException` when no Unicode font file is present (Windows dev environment)
- **Fix:** Added `_safe(text, is_unicode_font)` helper using `encode("latin-1", errors="replace")`. All static labels replaced with ASCII equivalents or conditionally use diacritics only when Unicode font is active
- **Files modified:** `Backend/app/application/services/phase_report_pdf.py`
- **Commit:** 1cac858

**3. [Rule 1 - Bug] fpdf2 2.8.x `multi_cell(0, ...)` raises "Not enough horizontal space"**
- **Found during:** Task 2, GREEN phase — `test_render_handles_completed_tasks_notes` failed after Turkish fix
- **Issue:** `multi_cell(w=0, ...)` with font size 9 triggers an fpdf2 edge case in 2.8.7 where `w=0` doesn't resolve correctly to effective page width
- **Fix:** Changed all `multi_cell(0, ...)` calls to `multi_cell(pdf.epw, ...)` where `pdf.epw` is the effective page width (A4 portrait = 180mm usable)
- **Files modified:** `Backend/app/application/services/phase_report_pdf.py`
- **Commit:** 1cac858

## Known Stubs

None. All new fields and methods are wired end-to-end. The router/rate-limiter/PDF export endpoint live in plan 09-10 (as documented in plan objectives).

## Threat Flags

No new threat surface beyond the plan's threat model. All T-09-07-* threats addressed:

| Threat | Mitigation Applied |
|--------|-------------------|
| T-09-07-01: Client PATCH sends `revision: 999` | `PhaseReportUpdateDTO` has no `revision` field; Pydantic ignores unknown keys |
| T-09-07-03: Race condition on concurrent creates | Partial unique index raises `IntegrityError`; retry strategy deferred to router (09-10) |
| T-09-07-06: fpdf2 crash on malformed string | `_safe()` encoding guard + tested with Turkish diacritics smoke test |

## Self-Check: PASSED

Files created/exist:
- Backend/app/domain/entities/phase_report.py — FOUND
- Backend/app/domain/repositories/phase_report_repository.py — FOUND
- Backend/app/infrastructure/database/models/phase_report.py — FOUND
- Backend/app/infrastructure/database/repositories/phase_report_repo.py — FOUND
- Backend/app/application/dtos/phase_report_dtos.py — FOUND
- Backend/app/application/use_cases/manage_phase_reports.py — FOUND
- Backend/app/application/services/phase_report_pdf.py — FOUND
- Backend/tests/unit/test_phase_report_entity.py — FOUND
- Backend/tests/unit/application/test_manage_phase_reports.py — FOUND
- Backend/tests/unit/application/test_phase_report_pdf.py — FOUND
- Backend/tests/integration/infrastructure/test_phase_report_repo_integration.py — FOUND

Commits verified:
- aec7e1d feat(09-07): PhaseReport entity + ORM + repo + DI factory + audit_repo.count_phase_transitions — FOUND
- 1cac858 feat(09-07): PhaseReport DTOs + 5 use cases + fpdf2 PDF service + unit tests — FOUND
