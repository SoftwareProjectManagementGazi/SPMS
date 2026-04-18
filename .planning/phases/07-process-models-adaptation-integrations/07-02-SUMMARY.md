---
phase: 07-process-models-adaptation-integrations
plan: "02"
subsystem: backend-application-api
tags: [process-templates, system-config, repository-impl, use-cases, cached-singleton, admin-api, CRUD]
dependency_graph:
  requires: [07-01-SUMMARY]
  provides: [SqlAlchemyProcessTemplateRepository, SqlAlchemySystemConfigRepository, system_config_service, manage_process_templates, manage_system_config, process-templates-router, admin-settings-router]
  affects: [07-04-PLAN, 07-05-PLAN]
tech_stack:
  added: []
  patterns: [cached-module-singleton, asyncio-Lock, pg-insert-ON-CONFLICT, PermissionError-builtin-guard, require_admin-dependency]
key_files:
  created:
    - Backend/app/infrastructure/database/repositories/process_template_repo.py
    - Backend/app/infrastructure/database/repositories/system_config_repo.py
    - Backend/app/application/services/system_config_service.py
    - Backend/app/application/use_cases/manage_process_templates.py
    - Backend/app/application/use_cases/manage_system_config.py
    - Backend/app/api/v1/process_templates.py
    - Backend/app/api/v1/admin_settings.py
  modified:
    - Backend/app/api/dependencies.py
    - Backend/app/api/main.py
decisions:
  - "require_admin placed after _is_admin and get_current_user in dependencies.py — Python module-level function ordering prevents forward-reference NameError at import time"
  - "SqlAlchemyProcessTemplateRepository uses _session prefix (not session) to match existing repo patterns in this codebase"
  - "system_config_service uses module-level _cache with asyncio.Lock double-checked locking — no restart needed for config changes to take effect"
  - "upsert_many loops and flushes once at end — avoids N separate commits per key while maintaining atomicity"
  - "UpdateProcessTemplateUseCase uses model_copy(update=...) on existing entity for partial update — preserves fields not in dto"
metrics:
  duration_seconds: 126
  completed_date: "2026-04-10"
  tasks_completed: 2
  files_created: 7
  files_modified: 2
---

# Phase 7 Plan 02: Backend CRUD for Process Templates and System Config Summary

**One-liner:** SqlAlchemy repository implementations, asyncio-locked cached config singleton, four use case classes (list/create/update/delete with builtin guard), and two admin-only API routers registered in main.py for /api/v1/process-templates and /api/v1/admin/settings.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Repository implementations + cached system config service + use cases | 331e6db9 | process_template_repo.py, system_config_repo.py, system_config_service.py, manage_process_templates.py, manage_system_config.py |
| 2 | API routes for process templates and admin settings + DI wiring + router registration | ad6976eb | process_templates.py, admin_settings.py, dependencies.py, main.py |

## What Was Built

### Task 1: Infrastructure + Application Layer

**process_template_repo.py** — `SqlAlchemyProcessTemplateRepository(IProcessTemplateRepository)`:
- `get_all()`: selects all templates ordered by `is_builtin DESC, name ASC` (built-ins first, then alphabetical).
- `get_by_id(template_id)`: returns entity or `None`.
- `get_by_name(name)`: returns entity or `None`.
- `create(template)`: inserts with `is_builtin=False`, flush + refresh, returns entity.
- `update(template)`: fetches model, applies field-level updates, flush + refresh, returns entity. Raises `ValueError` if not found.
- `delete(template_id)`: fetches model, deletes, flush. Raises `ValueError` if not found.

**system_config_repo.py** — `SqlAlchemySystemConfigRepository(ISystemConfigRepository)`:
- `get_all()`: returns `{key: value}` dict from all rows.
- `get_by_key(key)`: returns value string or `None`.
- `upsert(key, value)`: uses `pg_insert(...).on_conflict_do_update(index_elements=["key"], set_={"value": ..., "updated_at": func.now()})` — atomic PostgreSQL upsert.
- `upsert_many(entries)`: loops upsert per key, single flush at end.

**system_config_service.py** — Module-level cached singleton:
- `_cache: Optional[Dict[str, str]] = None` with `asyncio.Lock()` for thread safety.
- `get_system_config(repo)`: returns cached copy; if cache is None, acquires lock and populates from DB (double-checked locking pattern).
- `invalidate_cache()`: sets `_cache = None` so next read hits DB.

**manage_process_templates.py** — Four use cases:
- `ListProcessTemplatesUseCase.execute()`: calls `repo.get_all()`, maps to `ProcessTemplateResponseDTO`.
- `CreateProcessTemplateUseCase.execute(dto)`: builds entity with `is_builtin=False`, calls `repo.create()`.
- `UpdateProcessTemplateUseCase.execute(template_id, dto)`: fetches existing, raises `PermissionError("Built-in templates cannot be modified")` if `is_builtin`, applies `model_copy(update=dto.model_dump(exclude_unset=True))`, calls `repo.update()`.
- `DeleteProcessTemplateUseCase.execute(template_id)`: fetches existing, raises `PermissionError("Built-in templates cannot be deleted")` if `is_builtin`, calls `repo.delete()`.

**manage_system_config.py** — Two use cases:
- `GetSystemConfigUseCase.execute()`: calls `get_system_config(repo)` from cached service.
- `UpdateSystemConfigUseCase.execute(dto)`: `repo.upsert_many(dto.config)` → `invalidate_cache()` → `get_system_config(repo)` to return fresh data.

### Task 2: API Layer + DI Wiring

**process_templates.py** — Admin-only CRUD router:
- `GET /` → `ListProcessTemplatesUseCase` → `List[ProcessTemplateResponseDTO]`
- `POST /` → `CreateProcessTemplateUseCase` → `ProcessTemplateResponseDTO` (201)
- `PATCH /{template_id}` → `UpdateProcessTemplateUseCase` → `ProcessTemplateResponseDTO`; `PermissionError` → 403, `ValueError` → 404
- `DELETE /{template_id}` → `DeleteProcessTemplateUseCase` → 204 No Content; `PermissionError` → 403, `ValueError` → 404
- All endpoints use `Depends(require_admin)`.

**admin_settings.py** — Admin-only config router:
- `GET /` → `GetSystemConfigUseCase` → `SystemConfigResponseDTO`
- `PUT /` → `UpdateSystemConfigUseCase` → `SystemConfigResponseDTO` (cache invalidated on write)
- Both endpoints use `Depends(require_admin)`.

**dependencies.py** additions:
- `get_process_template_repo(session)`: lazy-imports `SqlAlchemyProcessTemplateRepository`.
- `get_system_config_repo(session)`: lazy-imports `SqlAlchemySystemConfigRepository`.
- `require_admin(current_user)`: raises HTTP 403 if user is not admin; placed after `_is_admin` and `get_current_user` to avoid NameError at import time.

**main.py** additions:
- Imports `process_templates` and `admin_settings` modules.
- `app.include_router(process_templates_router_module.router, prefix="/api/v1/process-templates", tags=["Process Templates"])`
- `app.include_router(admin_settings_router_module.router, prefix="/api/v1/admin/settings", tags=["Admin Settings"])`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] require_admin placed after get_current_user, not before**
- **Found during:** Task 2
- **Issue:** Initial placement of `require_admin` in dependencies.py was before `get_current_user`, causing `NameError: name 'get_current_user' is not defined` at module import time (Python resolves default argument expressions at function definition time).
- **Fix:** Moved `require_admin` to after `_is_admin` and `get_current_user`, matching the forward-reference constraint.
- **Files modified:** Backend/app/api/dependencies.py
- **Commit:** ad6976eb

## Known Stubs

None — all files contain complete implementations wired to real repositories and use cases.

## Self-Check: PASSED

**Files exist:**
- Backend/app/infrastructure/database/repositories/process_template_repo.py — FOUND
- Backend/app/infrastructure/database/repositories/system_config_repo.py — FOUND
- Backend/app/application/services/system_config_service.py — FOUND
- Backend/app/application/use_cases/manage_process_templates.py — FOUND
- Backend/app/application/use_cases/manage_system_config.py — FOUND
- Backend/app/api/v1/process_templates.py — FOUND
- Backend/app/api/v1/admin_settings.py — FOUND

**Commits exist:**
- 331e6db9 — FOUND
- ad6976eb — FOUND
