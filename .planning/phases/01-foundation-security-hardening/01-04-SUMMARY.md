---
phase: 01-foundation-security-hardening
plan: 04
subsystem: data-layer
tags: [soft-delete, audit-trail, repository, clean-architecture]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [soft-delete-task, soft-delete-project, soft-delete-user, audit-trail-task, audit-trail-project, IAuditRepository]
  affects: [task-endpoints, project-endpoints, use-cases]
tech_stack:
  added: [SqlAlchemyAuditRepository]
  patterns: [soft-delete-filter, audit-diff-on-update, dynamic-field-mapping]
key_files:
  created:
    - Backend/app/domain/repositories/audit_repository.py
    - Backend/app/infrastructure/database/repositories/audit_repo.py
  modified:
    - Backend/app/infrastructure/database/repositories/task_repo.py
    - Backend/app/infrastructure/database/repositories/project_repo.py
    - Backend/app/infrastructure/database/repositories/user_repo.py
    - Backend/app/api/dependencies.py
    - Backend/app/application/use_cases/manage_tasks.py
    - Backend/tests/unit/infrastructure/test_task_repo_soft_delete.py
    - Backend/tests/integration/infrastructure/test_audit_log.py
decisions:
  - "Soft-delete implemented at repository layer (not use-case layer) per Clean Architecture — use cases stay clean"
  - "deleted_at set via datetime.utcnow() in Python code, not via server_default or onupdate (Pitfall 2)"
  - "project_repo.update() uses dynamic field mapping via updatable_fields list (ARCH-06 resolved)"
  - "Unit tests use unittest.mock for session — avoids PostgreSQL Enum/SQLite incompatibility in isolated test suite"
  - "Integration audit tests marked xfail — require live DB with seeded data; xfail not xskip to stay in collection (Nyquist rule)"
metrics:
  duration: "6 min"
  completed_date: "2026-03-11"
  tasks_completed: 2
  files_modified: 9
---

# Phase 1 Plan 4: Soft-Delete and Audit Trail Repository Layer Summary

**One-liner:** Soft-delete filters (is_deleted==False) on all queries plus field-level AuditLogModel writes on task/project updates, with IAuditRepository domain interface and SqlAlchemyAuditRepository implementation.

## What Was Built

### Task 1: IAuditRepository + SqlAlchemyAuditRepository

- `Backend/app/domain/repositories/audit_repository.py` — ABC with `create()` and `get_by_entity()` abstract methods
- `Backend/app/infrastructure/database/repositories/audit_repo.py` — SQLAlchemy implementation; `create()` inserts AuditLogModel row; `get_by_entity()` returns list of dicts ordered by timestamp DESC
- `Backend/app/api/dependencies.py` — added `get_audit_repo()` factory following existing `get_task_repo()`/`get_project_repo()` pattern

### Task 2: Soft Delete and Audit Diff on All Repositories

**task_repo.py:**
- `_get_base_query()` now includes `.where(TaskModel.is_deleted == False)` — all list/get queries filter soft-deleted rows
- `delete()` replaced: no longer issues `DELETE` SQL; sets `model.is_deleted = True` and `model.deleted_at = datetime.utcnow()`; returns `False` when task already deleted/not found
- `update()` signature extended with `user_id: int = None`; before applying changes, diffs each field in `update_data` against current model value; creates one `AuditLogModel` row per changed field; increments `model.version`; persists all in one commit

**project_repo.py:**
- New `_get_base_query()` with `is_deleted == False` filter — applied to `get_by_id`, `get_all`, `get_by_id_and_user`, `create` re-fetch
- `delete()` soft-deletes same as task_repo
- `update()` refactored to dynamic field mapping via `updatable_fields` list (resolves ARCH-06); writes audit diff rows per changed field; accepts `user_id`

**user_repo.py:**
- New `_get_base_query()` with `is_deleted == False` filter on all read queries
- Added `delete()` method with soft-delete (was missing entirely)

**manage_tasks.py:**
- `UpdateTaskUseCase.execute()` now passes `user_id=user_id` to `task_repo.update()`

## Test Results

```
5 passed, 5 xfailed, 3 xpassed
```

- 5 unit tests pass (mock-based, no DB required): soft-delete sets is_deleted=True, delete returns False for missing task, update writes audit rows, no audit row for unchanged fields
- 5 xfailed: integration tests (require live DB) + admin hard-delete placeholder
- 3 xpassed: index existence tests were already satisfied by model-level `index=True` declarations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TaskModel uses `delete` SQL import in original task_repo.py**
- **Found during:** Task 2 implementation
- **Issue:** Original `delete()` imported `sqlalchemy.delete` and issued a hard `DELETE` SQL statement
- **Fix:** Replaced with soft-delete logic; removed `delete` from sqlalchemy imports
- **Files modified:** Backend/app/infrastructure/database/repositories/task_repo.py

**2. [Rule 2 - Missing functionality] user_repo.py had no `delete()` method**
- **Found during:** Task 2 — plan called for soft-delete on user_repo
- **Issue:** `IUserRepository` declares `delete()` abstract but `SqlAlchemyUserRepository` had no implementation
- **Fix:** Added soft-delete `delete()` method
- **Files modified:** Backend/app/infrastructure/database/repositories/user_repo.py

**3. [Rule 1 - Bug] Unit test used `hashed_password` but model column is `password_hash`**
- **Found during:** TDD RED phase — test setup error
- **Issue:** Field name mismatch prevented test fixtures from building
- **Fix:** Corrected to `password_hash` in seed fixture
- **Files modified:** tests/unit/infrastructure/test_task_repo_soft_delete.py

**4. [Rule 3 - Blocking] SQLite in-memory DB incompatible with PostgreSQL Enum and joinedload patterns**
- **Found during:** TDD RED phase — SQLite cannot process PostgreSQL native Enum types
- **Issue:** SQLAlchemy Enum with `name="methodology_type"` raises KeyError on SQLite
- **Fix:** Switched unit tests from in-memory SQLite to `unittest.mock` for the session — no external DB required
- **Files modified:** tests/unit/infrastructure/test_task_repo_soft_delete.py

## Self-Check: PASSED

All created files exist on disk. Both task commits (2b0a7c5, 2b89b0c) verified in git log.
