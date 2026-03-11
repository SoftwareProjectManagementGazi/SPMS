---
phase: 01-foundation-security-hardening
plan: 03
subsystem: api
tags: [fastapi, rbac, cors, pydantic-settings, sqlalchemy, pytest]

requires:
  - phase: 01-01
    provides: "xfail test stubs for startup validation, config, RBAC, CORS"
  - phase: 01-02
    provides: "TimestampedMixin models, Alembic migration applied to spms_db"

provides:
  - "_validate_startup_secrets() function in main.py that raises RuntimeError on insecure defaults"
  - "DEBUG and CORS_ORIGINS fields on Settings with cors_origins_list property"
  - "echo=settings.DEBUG wired in database.py"
  - "get_project_member FastAPI dependency (admin bypass + get_by_id_and_user check)"
  - "get_task_project_member FastAPI dependency (404 task check + membership check)"
  - "All 6 task endpoints protected: list, create, get, update, delete"

affects:
  - "02-task-management"
  - "03-projects"
  - "any phase adding new endpoints (dependency pattern established)"

tech-stack:
  added: []
  patterns:
    - "Startup secret validation via _validate_startup_secrets() called in lifespan before seed_data"
    - "CORS origins read from CORS_ORIGINS env var via cors_origins_list property"
    - "Dependency injection RBAC: get_project_member for project-path endpoints, get_task_project_member for task-id endpoints"
    - "Admin bypass: _is_admin(user) helper checks user.role.name.lower() == 'admin'"

key-files:
  created: []
  modified:
    - "Backend/app/infrastructure/config.py"
    - "Backend/app/infrastructure/database/database.py"
    - "Backend/app/api/main.py"
    - "Backend/app/api/dependencies.py"
    - "Backend/app/api/v1/tasks.py"
    - "Backend/tests/unit/test_startup_validation.py"
    - "Backend/tests/unit/test_config.py"
    - "Backend/tests/integration/api/test_rbac_tasks.py"
    - "Backend/tests/integration/api/test_cors.py"

key-decisions:
  - "Admin bypass uses role.name.lower() == 'admin' — case-insensitive to handle seeder-set values"
  - "Create task endpoint (POST /) performs inline membership check since project_id is in DTO body, not path param"
  - "get_task_project_member raises 404 (not 403) when task doesn't exist — reveals task existence only to authenticated users"
  - "Startup validation function extracted as _validate_startup_secrets(settings) — allows unit testing without triggering DB seed"
  - "CORS test relies on lifespan NOT triggering via ASGITransport in tests — validated working"

patterns-established:
  - "Dependency-per-access-pattern: project endpoints use get_project_member; task-id endpoints use get_task_project_member"
  - "Admin bypass helper _is_admin(user) centralizes the role check"
  - "Integration tests use tests/integration/conftest.py (main DB) — Alembic migration must be applied before tests run"

requirements-completed: [ARCH-07, ARCH-08, ARCH-10, SEC-02, SEC-03]

duration: 35min
completed: 2026-03-11
---

# Phase 01 Plan 03: Security Hardening — RBAC, Startup Validation, CORS Env Summary

**FastAPI dependency-based RBAC on all 6 task endpoints with admin bypass, startup RuntimeError on insecure JWT_SECRET/DB_PASSWORD defaults, and CORS origins moved from hardcoded list to CORS_ORIGINS env var**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-03-11T20:00:00Z
- **Completed:** 2026-03-11T20:35:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Added `DEBUG` and `CORS_ORIGINS` settings fields; `cors_origins_list` property parses comma-separated origins
- Replaced `echo=True` with `echo=settings.DEBUG` in SQLAlchemy engine creation
- Added `_validate_startup_secrets()` called in lifespan before seed_data — raises descriptive RuntimeError on insecure defaults
- Added `get_project_member` and `get_task_project_member` FastAPI dependencies with admin role bypass
- Injected membership checks on all 6 task endpoints — non-members receive HTTP 403
- All 14 tests pass green (6 unit + 6 RBAC integration + 2 CORS integration)

## Task Commits

Each task was committed atomically:

1. **Task 1: Harden config, startup validation, CORS env var, SQLAlchemy echo** - `bd10772` (feat)
2. **Task 2: Implement get_project_member dependency and inject into all task endpoints** - `4aca834` (feat)

## Files Created/Modified

- `Backend/app/infrastructure/config.py` - Added DEBUG, CORS_ORIGINS fields and cors_origins_list property
- `Backend/app/infrastructure/database/database.py` - Changed echo=True to echo=settings.DEBUG
- `Backend/app/api/main.py` - Added _validate_startup_secrets(), lifespan now validates before seed; CORS uses env var
- `Backend/app/api/dependencies.py` - Added _is_admin(), get_project_member, get_task_project_member
- `Backend/app/api/v1/tasks.py` - All 6 endpoints now use get_project_member or get_task_project_member
- `Backend/tests/unit/test_startup_validation.py` - Full implementation (was xfail stub)
- `Backend/tests/unit/test_config.py` - Full implementation (was xfail stub)
- `Backend/tests/integration/api/test_rbac_tasks.py` - Full implementation (was xfail stub)
- `Backend/tests/integration/api/test_cors.py` - Full implementation (was xfail stub)

## Decisions Made

- Admin bypass uses `role.name.lower() == "admin"` — case-insensitive string comparison to handle seeded role names
- Create task endpoint performs inline membership check since `project_id` is in the DTO body, not the URL path
- `get_task_project_member` returns HTTP 404 when the task doesn't exist (before checking membership) — correct REST semantics
- `_validate_startup_secrets(settings)` is extracted as a standalone function to allow unit testing without triggering the DB seeder

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Alembic migration 001 had not been applied to main DB**
- **Found during:** Task 2 (running integration tests for the first time in this session)
- **Issue:** The integration tests use the main database (via `tests/integration/conftest.py`). The 01-02 migration added `version`, `is_deleted`, `deleted_at` columns that weren't present in `spms_db`
- **Fix:** Ran `alembic upgrade head` to apply the 001_phase1_schema migration
- **Files modified:** None (DB schema change only)
- **Verification:** Tests passed after migration applied
- **Committed in:** N/A (DB migration, no file change)

**2. [Rule 1 - Bug] Test helper used wrong enum case for methodology and task priority**
- **Found during:** Task 2 (RBAC integration test execution)
- **Issue:** Test used `"kanban"` and `"medium"` but DB enums are `"KANBAN"` and `"MEDIUM"` (uppercase)
- **Fix:** Changed to uppercase in `_create_project()` and `_create_task()` helpers
- **Files modified:** `Backend/tests/integration/api/test_rbac_tasks.py`
- **Verification:** Tests passed after fix
- **Committed in:** 4aca834

**3. [Rule 1 - Bug] Test helper used wrong HTTP method for login and wrong endpoint for create task**
- **Found during:** Task 2 (RBAC integration test execution)
- **Issue:** Login helper used form data (`data=`) instead of JSON; create test used `POST /api/v1/tasks/project/{id}` (non-existent) instead of `POST /api/v1/tasks/`
- **Fix:** Changed `_login` to use `json={"email": ..., "password": ...}`; changed create test URL to `POST /api/v1/tasks/`
- **Files modified:** `Backend/tests/integration/api/test_rbac_tasks.py`
- **Verification:** Tests passed after fix
- **Committed in:** 4aca834

**4. [Rule 1 - Bug] Project entity requires non-null start_date but test created project without it**
- **Found during:** Task 2 (get_task test failure — task repo couldn't build Task entity from DB)
- **Issue:** `Project.start_date: datetime` is required (not Optional); test helper omitted it causing Pydantic validation error inside task repo
- **Fix:** Added `start_date=datetime(2025, 1, 1, tzinfo=timezone.utc)` to `_create_project()`
- **Files modified:** `Backend/tests/integration/api/test_rbac_tasks.py`
- **Verification:** Tests passed after fix
- **Committed in:** 4aca834

---

**Total deviations:** 4 auto-fixed (1 blocking DB migration, 3 test correctness bugs)
**Impact on plan:** All fixes necessary for tests to reach the database correctly and assert expected behavior. No scope creep.

## Issues Encountered

- The `tests/integration/conftest.py` uses the main `spms_db` database (not a test DB). This differs from the root `tests/conftest.py` which creates `spms_db_test`. The more specific conftest wins, so integration tests run against the real DB. Alembic migrations must be applied before integration tests run.

## Next Phase Readiness

- Task endpoint RBAC fully enforced — Phase 1 blocker ARCH-10 resolved
- Startup validation in place — Phase 1 blocker ARCH-08 resolved
- CORS origins environment-configurable — SEC-03 resolved
- SQLAlchemy echo controlled by DEBUG flag — ARCH-07 resolved
- Ready for Plan 01-04 (next plan in phase)

## Self-Check: PASSED

All 2 task commits verified (bd10772, 4aca834). All 9 modified files present. 14 tests pass.

---
*Phase: 01-foundation-security-hardening*
*Completed: 2026-03-11*
