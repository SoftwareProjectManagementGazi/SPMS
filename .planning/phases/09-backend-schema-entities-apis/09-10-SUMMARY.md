---
phase: 09-backend-schema-entities-apis
plan: "10"
subsystem: backend-api
tags: [crud-routers, filters, permissions, pdf-export, apply-template, API-04, API-05, API-06, API-07, API-08, API-09]
dependency_graph:
  requires:
    - ["09-04", "09-05", "09-06", "09-07", "09-08", "09-09"]
  provides:
    - "milestones.py: 5-endpoint CRUD router with inline RPTA check (D-35)"
    - "artifacts.py: 6-endpoint CRUD router with split PATCH /mine vs /artifacts/{id} (D-36)"
    - "phase_reports.py: 6-endpoint CRUD + PDF export with 30s per-user rate limit (D-37/D-51)"
    - "projects.py: ?status= filter (API-04), PATCH+DELETE /phase-criteria with D-19 validation (API-06)"
    - "tasks.py: ?phase_id= filter (API-05)"
    - "apply_process_template.py: ApplyProcessTemplateUseCase with pg_try_advisory_xact_lock 5s retry (D-44)"
    - "process_templates.py: POST /{id}/apply endpoint gated by require_admin (D-44)"
    - "6 integration test files covering D-35/36/37/44 positive + negative paths"
  affects:
    - Backend/app/api/v1/milestones.py
    - Backend/app/api/v1/artifacts.py
    - Backend/app/api/v1/phase_reports.py
    - Backend/app/api/v1/projects.py
    - Backend/app/api/v1/tasks.py
    - Backend/app/api/v1/process_templates.py
    - Backend/app/application/use_cases/apply_process_template.py
    - Backend/app/api/main.py
tech_stack:
  added: []
  patterns:
    - "Inline RPTA check: POST endpoints extract project_id from body; inline _authorize_transition re-implements D-15 logic using _is_admin + project.manager_id + SqlAlchemyTeamRepository.user_leads_any_team_on_project"
    - "Split PATCH URLs: /artifacts/{id}/mine (assignee-scoped, 3 fields) vs /artifacts/{id} (manager-scoped, all fields). Frontend selects URL based on user role + assignee_id check"
    - "Per-user PDF rate limit: in-memory _pdf_last_request dict keyed by user.id, separate from idempotency_cache. 30s window. Returns 429 + Retry-After header"
    - "apply-to-projects partial success: 200 OK with {applied: [...], failed: [{project_id, error}]}. Partial failure is intentional per D-44"
    - "D-19 strict phase_id validation on PATCH /phase-criteria: loads workflow.nodes, builds set of non-archived IDs, returns 400 INVALID_PHASE_ID + bad_phase_ids list"
    - "Advisory lock key disambiguation: template_apply uses hash('template_apply:{pid}'), phase_gate uses hash('phase_gate:{pid}') — separate keyspaces, parallel ops allowed"
key_files:
  created:
    - Backend/app/api/v1/milestones.py
    - Backend/app/api/v1/artifacts.py
    - Backend/app/api/v1/phase_reports.py
    - Backend/app/application/use_cases/apply_process_template.py
    - Backend/tests/integration/api/test_milestones_api.py
    - Backend/tests/integration/api/test_artifacts_api.py
    - Backend/tests/integration/api/test_phase_reports_api.py
    - Backend/tests/integration/api/test_projects_api_phase9.py
    - Backend/tests/integration/api/test_tasks_api_phase9.py
    - Backend/tests/integration/api/test_process_templates_api_phase9.py
  modified:
    - Backend/app/api/v1/projects.py
    - Backend/app/api/v1/tasks.py
    - Backend/app/api/v1/process_templates.py
    - Backend/app/api/main.py
decisions:
  - "Inline RPTA check pattern: require_project_transition_authority DI helper takes project_id as path param. For POST (project_id in body) and PATCH/DELETE (project_id inferred from existing entity), we re-implement inline using the same 4-line logic. Claude's discretion: acceptable duplication for Phase 9; refactor candidate for Phase 10+ to a reusable service helper"
  - "Artifact PATCH split into two URL paths: /artifacts/{id}/mine (assignee-only; UpdateArtifactByAssigneeUseCase) and /artifacts/{id} (manager-scoped; UpdateArtifactByManagerUseCase). Frontend chooses URL based on role + assignee_id match. Server-side: /mine checks assignee_id==user_id; /manager path checks RPTA"
  - "PDF rate limit: separate _pdf_last_request dict from idempotency_cache. Keyed by user.id only (not per-project). 30s window. Both D-51 requirement and T-09-10-03 DoS mitigation"
  - "apply-to-projects advisory lock key: hash('template_apply:{project_id}') — distinct from Phase Gate's hash('phase_gate:{project_id}'). Acknowledged race on process_config write (last-write-wins) for v2.0 per T-09-10-05"
  - "phase-criteria PATCH D-19 strict validation: loads workflow.nodes, excludes is_archived==True nodes from valid set, returns 400 with error_code=INVALID_PHASE_ID + bad_phase_ids list. Aligns with same strictness applied to Task.phase_id, Milestone.linked_phase_ids, Artifact.linked_phase_id, PhaseReport.phase_id"
  - "require_pm_approval flag in ApplyProcessTemplateUseCase: accepted in request body, included in response, but no approval workflow triggered in v2.0. Notification/approval UI deferred to Phase 12"
metrics:
  duration: "6 min"
  completed: "2026-04-21"
  tasks_completed: 2
  files_changed: 14

requirements-completed: [API-04, API-05, API-06, API-07, API-08, API-09]
---

# Phase 09 Plan 10: Remaining API Routers + Apply-Template (API-04/05/06/07/08/09) Summary

**3 new CRUD routers (Milestone/Artifact/PhaseReport) with D-35/36/37 permissions and PDF export; 3 extended routers (projects/?status=, tasks/?phase_id=, process-templates//apply) with D-19 phase criteria validation and D-44 per-project advisory lock apply-template.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-21T15:45:47Z
- **Completed:** 2026-04-21T15:51:47Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

### Task 09-10-01: Milestone/Artifact/PhaseReport CRUD routers + PDF export

**`Backend/app/api/v1/milestones.py`** — 5 endpoints (GET list, GET detail, POST, PATCH, DELETE). POST/PATCH/DELETE use inline `_authorize_transition` that replicates D-15 RPTA logic (admin OR project.manager_id OR team leader via `user_leads_any_team_on_project`). GET endpoints require only `get_current_user`. Raises 400 with `ARCHIVED_NODE_REF` when linked_phase_ids reference non-existent or archived nodes (delegated to use case).

**`Backend/app/api/v1/artifacts.py`** — 6 endpoints. Split PATCH pattern:
- `PATCH /artifacts/{id}/mine` — assignee-only; delegates to `UpdateArtifactByAssigneeUseCase` which checks `existing.assignee_id == user_id` and returns `PermissionError` (translated to 403) for non-assignees.
- `PATCH /artifacts/{id}` — manager-scoped; requires RPTA check, delegates to `UpdateArtifactByManagerUseCase` (can update all fields including `assignee_id`).

**`Backend/app/api/v1/phase_reports.py`** — 6 endpoints including `GET /phase-reports/{id}/pdf`. PDF endpoint: in-memory `_pdf_last_request` dict keyed by `user.id`; 30s window; returns 429 + `Retry-After` header on second request within window. Delegates to `render_pdf()` from `phase_report_pdf.py`; returns `StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf")` with `Content-Disposition`.

**`Backend/app/api/main.py`** — mounts 3 new routers at `/api/v1`.

### Task 09-10-02: Project/Task/ProcessTemplate extensions + apply-template

**`projects.py` extensions:**
- `list_projects` accepts `?status=` query param (API-04); branches to `project_repo.list_by_status([status])` when provided; falls back to existing flow otherwise.
- `PATCH /{project_id}/phase-criteria` — upserts `process_config.phase_completion_criteria[phase_id]`. D-19 strict validation: loads `workflow.nodes`, builds set of non-archived IDs, rejects unknown/archived phase_ids with HTTP 400 + `{"error_code": "INVALID_PHASE_ID", "bad_phase_ids": [...]}`.
- `DELETE /{project_id}/phase-criteria?phase_id=nd_xxx` — pops the entry from the dict.

**`tasks.py` extension:** `list_project_tasks` accepts `?phase_id=` query param (API-05); branches to `task_repo.list_by_project_and_phase(project_id, phase_id)` when provided; result is wrapped in `PaginatedResponse` shape.

**`apply_process_template.py`** — `ApplyProcessTemplateUseCase.execute()` iterates over `project_ids`, acquires `pg_try_advisory_xact_lock` per project (bounded 5s retry, 1s sleep between attempts), applies `process_template_id` + optional `default_workflow`/`default_phase_criteria`, calls `project_repo.update()`. Returns `{applied: [...], failed: [{project_id, error}]}`.

**`process_templates.py` extension** — `POST /{template_id}/apply` gated by `require_admin`; instantiates `ApplyProcessTemplateUseCase` with shared `AsyncSession`; returns partial success response.

## Task Commits

Each task was committed atomically using TDD (RED then GREEN):

1. **Task 09-10-01 RED: Failing tests for CRUD routers** — `996441c` (test)
2. **Task 09-10-01 GREEN: 3 CRUD routers + PDF export + main.py mount** — `00eb45a` (feat)
3. **Task 09-10-02 RED: Failing tests for router extensions** — `41f495c` (test)
4. **Task 09-10-02 GREEN: Project/task/template extensions + apply-template use case** — `ddb1a67` (feat)

## Files Created

- `Backend/app/api/v1/milestones.py` — API-07/D-35; 5 endpoints
- `Backend/app/api/v1/artifacts.py` — API-08/D-36; 6 endpoints with split PATCH
- `Backend/app/api/v1/phase_reports.py` — API-09/D-37/D-51; 6 endpoints + PDF
- `Backend/app/application/use_cases/apply_process_template.py` — D-44; per-project advisory lock
- `Backend/tests/integration/api/test_milestones_api.py` — 4 tests (admin POST 201, member 403, list 200, invalid phase 400)
- `Backend/tests/integration/api/test_artifacts_api.py` — 3 tests (admin create, non-assignee /mine 403, manager patch)
- `Backend/tests/integration/api/test_phase_reports_api.py` — 2 tests (CRUD + PDF, PDF rate limit 429)
- `Backend/tests/integration/api/test_projects_api_phase9.py` — 4 tests (status filter, phase-criteria CRUD, D-19 reject)
- `Backend/tests/integration/api/test_tasks_api_phase9.py` — 1 test (phase_id filter)
- `Backend/tests/integration/api/test_process_templates_api_phase9.py` — 1 test (apply returns applied/failed)

## Files Modified

- `Backend/app/api/v1/projects.py` — added ?status= param, PATCH+DELETE /phase-criteria endpoints
- `Backend/app/api/v1/tasks.py` — added ?phase_id= param to list_project_tasks
- `Backend/app/api/v1/process_templates.py` — added POST /{id}/apply endpoint + ApplyTemplateDTO
- `Backend/app/api/main.py` — mounted milestones, artifacts, phase_reports routers

## Decisions Made

**Inline RPTA authorization (Claude's Discretion resolved):**
`require_project_transition_authority` DI helper assumes `project_id` is a FastAPI path parameter. For POST endpoints where `project_id` comes from the request body, and for PATCH/DELETE where it's inferred from the existing entity, we re-implement the 4-line check inline (`_authorize_transition` helper function in each router). This is explicit duplication but avoids creating a new abstract DI pattern mid-phase. Refactor candidate for Phase 10+.

**Artifact PATCH split URLs:**
`/artifacts/{id}/mine` (assignee-only) and `/artifacts/{id}` (manager-scoped). The URL itself encodes the permission scope, making the API self-documenting. Frontend selects the correct URL based on `user.id == artifact.assignee_id`. Server-side defense: use case level `PermissionError` for `/mine`, RPTA gate for `/manager`.

**PDF rate limit isolation:**
`_pdf_last_request` is a module-level dict in `phase_reports.py`, completely separate from `idempotency_cache._last_request`. This matches D-51 (per-user 30s limit for CPU-heavy PDF render). The isolation means PDF rate limit state survives idempotency cache resets.

**Apply-to-projects partial success:**
HTTP 200 even when some projects fail. Intentional per D-44/T-09-10-08. Admin reviews the `failed` list. The `require_pm_approval` flag is present in the request/response but deferred to Phase 12 (no approval notification logic triggered in v2.0).

**Phase-criteria D-19 strict validation:**
PATCH validates `dto.phase_id` against the project's `process_config.workflow.nodes` set (excluding `is_archived=True`). Returns `{"error_code": "INVALID_PHASE_ID", "bad_phase_ids": [...]}` with HTTP 400. This makes the phase-criteria endpoint consistent with all other phase-referencing endpoints (Task.phase_id, Milestone.linked_phase_ids, Artifact.linked_phase_id, PhaseReport.phase_id).

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written, with minor adaptations for existing code patterns:

**1. [Rule 1 - Bug] Fixed fixture name async_session -> db_session in integration tests**
- **Found during:** Pre-implementation review of earlier plans (09-05..09-09 established this pattern)
- **Issue:** Plan template used `async_session` but conftest only defines `db_session`
- **Fix:** Used `db_session` directly in all 6 test files (consistent with Pitfall 1 pattern)
- **Files modified:** All 6 test files

**2. [Rule 1 - Bug] Added _db_has_roles() skip guard instead of _migration_005_applied() for CRUD tests**
- **Found during:** Pre-implementation review — CRUD router tests don't require Alembic 005 column check (roles check is sufficient since test DB is created via create_all)
- **Fix:** Used `_db_has_roles()` skip guard (same pattern as plans 09-09) — cleaner for router-level tests where the 005 migration columns aren't the gating factor
- **Files modified:** All 6 test files

**3. [Rule 1 - Bug] PaginatedResponse shape for phase_id-filtered tasks**
- **Found during:** Task 09-10-02 implementation — existing list_project_tasks returns `PaginatedResponse` not a flat list
- **Fix:** When `phase_id` is provided, wraps the filtered list in `PaginatedResponse` shape to maintain API contract consistency
- **Files modified:** `Backend/app/api/v1/tasks.py`

## Known Stubs

None. All Phase 9 plan 10 features are wired end-to-end.

Deferred items (out of Phase 9 scope, documented per CONTEXT.md):
- `require_pm_approval` flag accepted but approval workflow not triggered — Phase 12
- PDF rate limit uses in-memory dict (not Redis) — v3.0 ADV-04

## Threat Surface Scan

All T-09-10-* threats addressed per plan's threat_model:

| Threat | Component | Mitigation Status |
|--------|-----------|------------------|
| T-09-10-01: Member creates milestone via body project_id | milestones.py | `_authorize_transition` inline RPTA check — fetches project, verifies admin/manager/team-leader |
| T-09-10-02: Non-assignee bypasses /mine via body user_id | artifacts.py | `UpdateArtifactByAssigneeUseCase` reads `user_id` from JWT (Depends), checks `existing.assignee_id == user_id` |
| T-09-10-03: DoS via rapid PDF export | phase_reports.py | `_pdf_last_request` 30s per-user rate limit + 429 Retry-After |
| T-09-10-04: apply-to-projects 10k IDs | apply_process_template.py | Accepted — bounded 5s wait per project; Admin responsibility |
| T-09-10-05: Concurrent template apply + phase gate on same project | Both | Separate lock keys; last-write-wins on process_config for v2.0 (accepted) |
| T-09-10-06: phase-criteria PATCH leaks full process_config | projects.py | Returns only `{project_id, phase_id, criteria[phase_id]}` — not full process_config |
| T-09-10-07: PATCH phase-criteria with non-existent phase_id | projects.py | D-19 validation: 400 INVALID_PHASE_ID + bad_phase_ids list |
| T-09-10-08: apply partial success with HTTP 200 | apply_process_template.py | Accepted — D-44 intentional design; Admin reviews `failed` list |

## Self-Check: PASSED

Files created/exist:
- Backend/app/api/v1/milestones.py — FOUND (5 endpoints, inline RPTA)
- Backend/app/api/v1/artifacts.py — FOUND (/mine + /manager split PATCH)
- Backend/app/api/v1/phase_reports.py — FOUND (PDF + rate limit _pdf_last_request)
- Backend/app/application/use_cases/apply_process_template.py — FOUND (ApplyProcessTemplateUseCase)
- Backend/tests/integration/api/test_milestones_api.py — FOUND (4 tests)
- Backend/tests/integration/api/test_artifacts_api.py — FOUND (3 tests)
- Backend/tests/integration/api/test_phase_reports_api.py — FOUND (2 tests)
- Backend/tests/integration/api/test_projects_api_phase9.py — FOUND (4 tests)
- Backend/tests/integration/api/test_tasks_api_phase9.py — FOUND (1 test)
- Backend/tests/integration/api/test_process_templates_api_phase9.py — FOUND (1 test)

Route verification: all routes mounted — PASSED (verified via python -c "import app.api.main; assert ...")

Commits verified:
- 996441c test(09-10): add RED failing tests for milestone/artifact/phase-report CRUD routers — FOUND
- 00eb45a feat(09-10): milestone/artifact/phase-report CRUD routers + PDF export — FOUND
- 41f495c test(09-10): add RED failing tests for project/task/process-template router extensions — FOUND
- ddb1a67 feat(09-10): project status filter, task phase_id filter, phase-criteria CRUD, apply-template — FOUND

---
*Phase: 09-backend-schema-entities-apis*
*Completed: 2026-04-21*
