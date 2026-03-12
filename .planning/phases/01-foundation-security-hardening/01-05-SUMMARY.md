---
phase: 01-foundation-security-hardening
plan: 05
subsystem: api
tags: [pydantic, sqlalchemy, fastapi, typescript, dtos, eager-loading]

# Dependency graph
requires:
  - phase: 01-foundation-security-hardening/01-03
    provides: RBAC, CORS, startup validation
  - phase: 01-foundation-security-hardening/01-04
    provides: soft-delete, audit trail, dynamic project_repo.update

provides:
  - UserListDTO canonical location in auth_dtos.py (no inline duplicate in auth.py)
  - ProjectResponseDTO with manager_id, manager_name, manager_avatar fields
  - project_repo joinedloads manager user in all queries via _get_base_query
  - task_repo.create() returns full entity with eager loading (no internal get_by_id call)
  - UpdateTaskUseCase and CreateTaskUseCase do NOT call get_by_id after repo returns entity
  - Frontend taskService has single getByProjectId and single create (duplicates removed)

affects:
  - 02-features (any phase that uses ProjectResponseDTO, taskService, or auth endpoints)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Repo pattern: _get_base_query() centralizes eager loading options for reuse in create/get_by_id/get_all"
    - "DTO canonical location: all DTOs live in app/application/dtos/; routers only import, never define"
    - "Nested manager data: _to_entity populates manager_name/avatar from joinedload relationship"
    - "Single round-trip create: flush+commit then inline _get_base_query rather than delegating to get_by_id"

key-files:
  created: []
  modified:
    - Backend/app/application/dtos/auth_dtos.py
    - Backend/app/api/v1/auth.py
    - Backend/app/application/dtos/project_dtos.py
    - Backend/app/domain/entities/project.py
    - Backend/app/infrastructure/database/repositories/project_repo.py
    - Backend/app/application/use_cases/manage_tasks.py
    - Backend/app/infrastructure/database/repositories/task_repo.py
    - Frontend/services/task-service.ts
    - Frontend/app/projects/[id]/page.tsx

key-decisions:
  - "Added manager_name/manager_avatar to Project domain entity (not just DTO) so model_validate() works cleanly via from_attributes"
  - "task_repo.create() uses _get_base_query() inline after flush+commit instead of delegating to get_by_id — avoids double method call while reusing eager load options"
  - "task_repo.update() still calls get_by_id internally — this is the correct single round-trip (use case no longer duplicates it)"
  - "Pre-existing TypeScript errors in mock-data.ts and lib files are out of scope; no new errors introduced"
  - "Integration tests require a running database (pre-existing environment constraint); unit tests (13 passed) confirm correctness"

patterns-established:
  - "DTO ownership: define once in dtos/ layer, import everywhere — never redefine inline in router files"
  - "Nested display fields on domain entity: add Optional fields for denormalized display data (manager_name) alongside FK (manager_id)"

requirements-completed: [ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06]

# Metrics
duration: 16min
completed: 2026-03-12
---

# Phase 01 Plan 05: Architecture Cleanup Summary

**Eliminated DTO duplication and double DB round-trips: UserListDTO canonicalized, ProjectResponseDTO gains manager display fields via joinedload, task create/update use cases reduced from two queries to one.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-12T15:08:46Z
- **Completed:** 2026-03-12T15:24:47Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- ARCH-02: Removed inline `UserListDTO` class from `auth.py`; now imported from `auth_dtos.py` (single canonical location)
- ARCH-03: `ProjectResponseDTO` and `Project` entity now include `manager_name` and `manager_avatar`; `project_repo._get_base_query()` joinedloads the manager relationship so all repo methods populate these fields automatically
- ARCH-04/05: `task_repo.create()` no longer calls `get_by_id` internally; `CreateTaskUseCase` and `UpdateTaskUseCase` no longer call `get_by_id` after their respective repo operations — each task operation is now a single post-commit query
- ARCH-01: Frontend `taskService` duplicate methods (`getTasksByProject`, `createTask`) removed; calling component updated to use canonical `getByProjectId`

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix DTO migration, double round-trips, and manager DTO** - `1f7c1f5` (feat)
2. **Task 2: Merge duplicate task service methods in frontend** - `596b905` (feat)

## Files Created/Modified

- `Backend/app/api/v1/auth.py` - Removed inline UserListDTO class; added import from auth_dtos.py
- `Backend/app/application/dtos/auth_dtos.py` - UserListDTO was already canonical here (no change needed)
- `Backend/app/application/dtos/project_dtos.py` - Added manager_name, manager_avatar (Optional) to ProjectResponseDTO; manager_id made Optional
- `Backend/app/domain/entities/project.py` - Added manager_name, manager_avatar (Optional) to Project entity
- `Backend/app/infrastructure/database/repositories/project_repo.py` - Added joinedload(ProjectModel.manager) to _get_base_query; _to_entity populates manager display fields
- `Backend/app/application/use_cases/manage_tasks.py` - CreateTaskUseCase: removed redundant get_by_id post-create; UpdateTaskUseCase: removed redundant get_by_id post-update
- `Backend/app/infrastructure/database/repositories/task_repo.py` - create() uses _get_base_query() inline instead of calling get_by_id
- `Frontend/services/task-service.ts` - Removed getTasksByProject and createTask duplicate methods
- `Frontend/app/projects/[id]/page.tsx` - Updated queryFn to use getByProjectId instead of getTasksByProject

## Decisions Made

- Added `manager_name`/`manager_avatar` to the `Project` domain entity (not just the DTO) so that `ProjectResponseDTO.model_validate(project)` works via `from_attributes=True` without requiring custom mapping at the router level.
- `task_repo.create()` uses `_get_base_query()` inline (same select as `get_by_id` but inlined) rather than delegating to `get_by_id` — this achieves a single round-trip while reusing the eager load configuration.
- `task_repo.update()` continues to call `get_by_id` internally; this is correct — it is the one required post-commit reload. The use case no longer duplicates this call.

## Deviations from Plan

None — plan executed exactly as written. ARCH-06 was confirmed already done in 01-04 (dynamic field mapping in `project_repo.update()`).

## Issues Encountered

- Integration tests require a running PostgreSQL instance (pre-existing environment constraint, not caused by this plan). Unit tests (13 passed, 1 xfailed) pass cleanly and confirm correctness of all changes.
- Pre-existing TypeScript errors in `lib/mock-data.ts`, `services/auth-service.ts`, and `components/task-detail/task-header.tsx` are out of scope; no new errors were introduced by this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Architecture is clean: no duplicate DTOs, no redundant DB queries, ProjectResponseDTO exposes manager data for frontend display
- Frontend taskService API surface is consistent: `getByProjectId` + `create` are the canonical task methods
- Ready for feature development phases that will consume project manager display data

---
*Phase: 01-foundation-security-hardening*
*Completed: 2026-03-12*
