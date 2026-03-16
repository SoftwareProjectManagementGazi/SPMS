---
phase: 05-notifications
plan: "04"
subsystem: api
tags: [python, fastapi, sqlalchemy, apscheduler, notifications, clean-architecture, routing, dependency-injection]

# Dependency graph
requires:
  - phase: 05-03
    provides: SqlAlchemyNotificationRepository, SqlAlchemyNotificationPreferenceRepository, PollingNotificationService, scheduler, deadline_alert_job, purge_notifications_job

provides:
  - notifications.py APIRouter with 5 routes (GET /, POST /mark-all-read, DELETE /clear-read, PATCH /{id}/read, DELETE /{id})
  - notification_preferences.py APIRouter with 2 routes (GET /, PUT /)
  - get_notification_repo, get_notification_preference_repo, get_notification_service dependency injectors in dependencies.py
  - TASK_ASSIGNED trigger in tasks.py update_task + patch_task (assignee != actor)
  - STATUS_CHANGE trigger in tasks.py for assignee + watchers on status_id change
  - TASK_DELETED trigger in tasks.py for assignee + watchers before hard-delete
  - COMMENT_ADDED trigger in comments.py for task assignee + watchers
  - PROJECT_CREATED/UPDATED/DELETED fan-out to all admins in projects.py via asyncio.gather
  - APScheduler started in lifespan (deadline_alert_job at 08:00, purge_notifications_job at 03:00)
  - Phase 5 migration_004 runs in lifespan at startup
  - Self-suppression enforced on every notify() call via actor_id parameter

affects:
  - 05-05 (frontend polling — backend is now fully functional, frontend can poll /api/v1/notifications)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Fixed-path routes registered before parametric routes in same router (prevent FastAPI path param conflicts)
    - asyncio.gather for concurrent admin fan-out notifications in project endpoints
    - Pre-fetch entity before mutation when deletion would remove the data needed for the notification
    - Inline sa_select(TaskWatcherModel) query inside endpoint (acceptable for watcher fan-out, avoids over-abstracting)

key-files:
  created:
    - Backend/app/api/v1/notifications.py
    - Backend/app/api/v1/notification_preferences.py
  modified:
    - Backend/app/api/dependencies.py
    - Backend/app/api/v1/tasks.py
    - Backend/app/api/v1/comments.py
    - Backend/app/api/v1/projects.py
    - Backend/app/api/main.py

key-decisions:
  - "Fixed-path routes (mark-all-read, clear-read) registered before parametric routes in notifications.py — same pattern as tasks.py /search"
  - "delete_project fetches project name before DeleteProjectUseCase.execute() — name needed for notification message after deletion"
  - "delete_task fetches watchers before DeleteTaskUseCase.execute() — CASCADE delete would remove task_watcher rows"
  - "asyncio.gather used for project admin fan-out — concurrent notification delivery avoids sequential blocking"
  - "PollingNotificationService.notify() already handles self-suppression via actor_id; no duplicate guard needed in router code"

requirements-completed: [NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05, NOTIF-06]

# Metrics
duration: 10min
completed: 2026-03-16
---

# Phase 5 Plan 04: API Router Wiring Summary

**Two new notification routers, 7 modified files, and full notification trigger wiring — frontend can now poll /api/v1/notifications to receive real-time task/comment/project events**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-16T07:55:00Z
- **Completed:** 2026-03-16T08:00:41Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Created `notifications.py` router with all 5 CRUD routes — list, mark-read, mark-all-read, delete, clear-read; fixed-path routes registered before parametric to avoid path param conflicts
- Created `notification_preferences.py` router with GET + PUT endpoints; PUT validates `deadline_days` against `{1, 2, 3, 7}` and returns HTTP 400 for invalid values
- Added `get_notification_repo`, `get_notification_preference_repo`, `get_notification_service` to `dependencies.py` using lazy imports to avoid circular dependency risk
- Wired `TASK_ASSIGNED` notification in `update_task`/`patch_task`: fires for assignee when `dto.assignee_id != current_user.id`
- Wired `STATUS_CHANGE` notification in `update_task`/`patch_task`: fires for assignee and all watchers when `dto.status_id` is set
- Wired `TASK_DELETED` notification in `delete_task`: pre-fetches task and watchers before deletion (CASCADE would remove watcher rows), notifies both groups
- Wired `COMMENT_ADDED` in `create_comment`: notifies task assignee + watchers using inline watcher query
- Wired `PROJECT_CREATED/UPDATED/DELETED` fan-out in `create_project`/`update_project`/`delete_project` using `asyncio.gather` for concurrent admin notifications
- Registered both new routers in `main.py`; Phase 5 migration (`migration_004`) runs in lifespan at startup; APScheduler starts and shuts down cleanly in lifespan

## Task Commits

Each task was committed atomically:

1. **Task 1: Create notification routers and add dependency injectors** - `a5fa80d` (feat)
2. **Task 2: Wire notification triggers and register scheduler + routers in main.py** - `9959353` (feat)

## Files Created/Modified

- `Backend/app/api/v1/notifications.py` — New router: 5 notification CRUD routes
- `Backend/app/api/v1/notification_preferences.py` — New router: 2 preference routes with deadline_days validation
- `Backend/app/api/dependencies.py` — Added 3 new dependency functions for notification repos and service
- `Backend/app/api/v1/tasks.py` — Added TASK_ASSIGNED, STATUS_CHANGE, TASK_DELETED triggers with watcher fan-out
- `Backend/app/api/v1/comments.py` — Added COMMENT_ADDED trigger for assignee + watchers
- `Backend/app/api/v1/projects.py` — Added PROJECT_CREATED/UPDATED/DELETED admin fan-out notifications
- `Backend/app/api/main.py` — Imported and registered both notification routers; migration_004 in lifespan; APScheduler start/shutdown

## Decisions Made

- Fixed-path routes (`/mark-all-read`, `/clear-read`) registered before parametric routes (`/{id}/read`, `/{id}`) — same pattern as tasks.py `/search` to prevent FastAPI treating string literals as path param values
- `delete_project` fetches project name before `DeleteProjectUseCase.execute()` — after deletion the entity is gone, name is needed for the notification message
- `delete_task` fetches both task entity and watcher list before `DeleteTaskUseCase.execute()` — CASCADE delete on `task_watchers` would remove watcher rows during deletion
- `asyncio.gather` used for admin fan-out in project endpoints — concurrent notify() calls avoid sequential blocking for N admins
- Lazy imports in `get_notification_repo` / `get_notification_preference_repo` / `get_notification_service` mitigate any potential circular import issues at module load time

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — notification system uses existing DB connection; APScheduler runs in-process; no new environment variables needed.

## Next Phase Readiness

- Backend notification system is fully functional: routers registered, triggers wired, migration runs at startup, scheduler runs daily jobs
- Frontend can now poll `GET /api/v1/notifications` with a Bearer token and receive `{"notifications": [], "unread_count": 0, "total": 0}`
- Plan 05-05 (frontend notification bell + polling UI) can proceed

---
*Phase: 05-notifications*
*Completed: 2026-03-16*
