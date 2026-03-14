---
phase: 03-project-task-completion
plan: "01"
subsystem: testing

tags: [pytest, xfail, tdd, sprints, comments, attachments, project-members, task-dependencies, recurring-tasks]

# Dependency graph
requires:
  - phase: 02-authentication-team-management
    provides: "Established stub pattern: xfail markers, no app imports, async unit stubs + sync integration stubs"
  - phase: 01-foundation-security-hardening
    provides: "Original stub pattern from 01-01 — pytest.mark.xfail Nyquist compliance baseline"
provides:
  - "9 xfail stub files covering all Phase 3 backend features"
  - "26 unit test stubs across 6 use-case files"
  - "14 integration test stubs across 3 API endpoint files"
affects:
  - 03-02-sprints
  - 03-03-comments
  - 03-04-attachments
  - 03-05-project-members
  - 03-06-task-dependencies
  - 03-07-recurring-tasks

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "pytest.mark.xfail(strict=False) stubs: unit stubs are async with @pytest.mark.asyncio; integration stubs are sync def"
    - "No app imports in stub files — body is assert False only"

key-files:
  created:
    - Backend/tests/unit/application/test_manage_sprints.py
    - Backend/tests/unit/application/test_manage_comments.py
    - Backend/tests/unit/application/test_manage_attachments.py
    - Backend/tests/unit/application/test_manage_project_members.py
    - Backend/tests/unit/application/test_task_dependencies.py
    - Backend/tests/unit/application/test_recurring_tasks.py
    - Backend/tests/integration/api/test_sprints_api.py
    - Backend/tests/integration/api/test_comments_api.py
    - Backend/tests/integration/api/test_attachments_api.py
  modified: []

key-decisions:
  - "[03-01]: Unit stubs use @pytest.mark.asyncio + async def; integration stubs use plain sync def — mirrors Phase 1/2 pattern"
  - "[03-01]: No app imports in any stub files — avoids import errors from not-yet-existing modules"
  - "[03-01]: All 40 tests marked xfail(strict=False) so they appear in collection without failing the suite"

patterns-established:
  - "Phase 3 test scaffold pattern: xfail stubs before implementation, no app imports, unit=async, integration=sync"

requirements-completed: [TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11]

# Metrics
duration: 2min
completed: 2026-03-14
---

# Phase 3 Plan 01: Wave 0 Test Scaffolds Summary

**40 xfail test stubs across 9 files covering sprints, comments, attachments, project members, task dependencies, and recurring tasks — Nyquist compliance before Phase 3 implementation begins**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-14T15:12:30Z
- **Completed:** 2026-03-14T15:14:35Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created 6 unit test stub files (26 tests) covering all Phase 3 use cases with async xfail stubs
- Created 3 integration test stub files (14 tests) covering API endpoints for sprints, comments, and attachments with sync xfail stubs
- All 40 tests collected by pytest with zero import errors, satisfying Nyquist compliance rule

## Task Commits

Each task was committed atomically:

1. **Task 1: Unit test stubs — use cases** - `d96c3c2` (test)
2. **Task 2: Integration test stubs — API endpoints** - `4711fc7` (test)

**Plan metadata:** committed with docs commit below

## Files Created/Modified
- `Backend/tests/unit/application/test_manage_sprints.py` - 4 xfail stubs for Sprint CRUD use cases
- `Backend/tests/unit/application/test_manage_comments.py` - 5 xfail stubs for Comment CRUD + author guard
- `Backend/tests/unit/application/test_manage_attachments.py` - 4 xfail stubs for attachment upload/download/validation
- `Backend/tests/unit/application/test_manage_project_members.py` - 4 xfail stubs for AddProjectMember/RemoveProjectMember
- `Backend/tests/unit/application/test_task_dependencies.py` - 4 xfail stubs for blocks relation + cycle detection
- `Backend/tests/unit/application/test_recurring_tasks.py` - 5 xfail stubs for recurrence lifecycle
- `Backend/tests/integration/api/test_sprints_api.py` - 5 xfail stubs for Sprint API endpoints
- `Backend/tests/integration/api/test_comments_api.py` - 5 xfail stubs for Comments API endpoints
- `Backend/tests/integration/api/test_attachments_api.py` - 4 xfail stubs for Attachments API endpoints

## Decisions Made
- Unit stubs use `@pytest.mark.asyncio` + `async def` — mirrors the Phase 1/2 async use-case stub pattern
- Integration stubs use plain `def` (sync) — matches the established integration test pattern from Phase 2 (test_auth_avatar.py)
- No app imports in any stub file — avoids import errors from modules that don't exist yet, exactly as established in [02-01]

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `python` command not available in shell (Windows alias disabled); used `/c/Users/yusti/anaconda3/Scripts/pytest` directly — resolved immediately, no impact on output.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 3 stub files in place; implementation plans (03-02 through 03-08) can proceed in order
- Wave 1 plans (sprints, comments, attachments backend) can begin immediately
- No blockers

---
*Phase: 03-project-task-completion*
*Completed: 2026-03-14*
