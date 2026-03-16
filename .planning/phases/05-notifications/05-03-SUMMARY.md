---
phase: 05-notifications
plan: "03"
subsystem: infrastructure
tags: [python, sqlalchemy, fastapi-mail, apscheduler, clean-architecture, notifications, email, scheduler]

# Dependency graph
requires:
  - phase: 05-02
    provides: INotificationRepository, INotificationPreferenceRepository, IUserRepository interfaces and domain entities

provides:
  - SqlAlchemyNotificationRepository: full 9-method CRUD + deadline query implementation
  - SqlAlchemyNotificationPreferenceRepository: get_by_user + upsert
  - SqlAlchemyUserRepository.get_all_by_role: role-based user lookup for fan-out
  - send_notification_email(): BackgroundTasks-based email helper with SMTP_HOST guard
  - 4 Jinja2 HTML templates (Turkish) with SPMS branding
  - deadline_alert_job + purge_notifications_job APScheduler job functions
  - scheduler: AsyncIOScheduler instance (Europe/Istanbul timezone)

affects:
  - 05-04 (API layer: router instantiates these repos and injects into use cases)
  - 05-05 (deadline worker: scheduler will register deadline_alert_job and purge_notifications_job)

# Tech tracking
tech-stack:
  added:
    - apscheduler 3.x (AsyncIOScheduler with CronTrigger)
    - fastapi-mail 1.x (Jinja2 template email via BackgroundTasks)
  patterns:
    - Repository pattern: SQLAlchemy AsyncSession with explicit commit/refresh per write operation
    - SMTP_HOST conditional guard prevents dev/test failures when email not configured
    - Scheduler creates its own AsyncSessionLocal session (no FastAPI Depends injection)
    - purge_old_read uses Python-side datetime cutoff (timedelta) for portability

key-files:
  created:
    - Backend/app/infrastructure/database/repositories/notification_repo.py
    - Backend/app/infrastructure/database/repositories/notification_preference_repo.py
    - Backend/app/infrastructure/email/__init__.py
    - Backend/app/infrastructure/email/email_service.py
    - Backend/app/infrastructure/email/templates/task_assigned.html
    - Backend/app/infrastructure/email/templates/comment_added.html
    - Backend/app/infrastructure/email/templates/deadline_approaching.html
    - Backend/app/infrastructure/email/templates/status_change.html
    - Backend/app/scheduler/__init__.py
    - Backend/app/scheduler/jobs.py
  modified:
    - Backend/app/infrastructure/database/repositories/user_repo.py
    - Backend/requirements.txt

key-decisions:
  - "purge_old_read uses Python timedelta cutoff instead of raw SQL interval for SQLAlchemy portability across databases"
  - "get_tasks_approaching_deadline uses raw text() SQL with cast to ::date for same-day matching regardless of time component"
  - "SMTP_HOST conditional in send_notification_email allows zero-config development — no env vars needed to start"
  - "scheduler module-level instance allows Plan 04/05 to import and register jobs without re-instantiation"

# Metrics
duration: 5min
completed: 2026-03-16
---

# Phase 5 Plan 03: Infrastructure Layer Summary

**SQLAlchemy notification repository implementations, fastapi-mail email service with 4 Turkish Jinja2 HTML templates, and APScheduler daily job functions for deadline alerts and notification purge**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-16T07:48:39Z
- **Completed:** 2026-03-16T07:53:07Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Implemented SqlAlchemyNotificationRepository with all 9 INotificationRepository abstract methods — CRUD, mark_read/all, delete, clear_read, purge_old_read, get_tasks_approaching_deadline
- Implemented SqlAlchemyNotificationPreferenceRepository with get_by_user and upsert (create-or-update pattern)
- Extended SqlAlchemyUserRepository with get_all_by_role() using ilike role name join for admin fan-out use cases
- Created send_notification_email() with SMTP_HOST guard — zero-config safe for development, no exceptions when SMTP unconfigured
- Created 4 Jinja2 HTML email templates in Turkish with consistent SPMS branding (dark header, white card, CTA button, footer)
- Created deadline_alert_job respecting per-user deadline_days preference with 1-day always-fire guarantee
- Created purge_notifications_job deleting read notifications older than 90 days
- Added apscheduler and fastapi-mail to requirements.txt

## Task Commits

Each task was committed atomically:

1. **Task 1: SQLAlchemy notification repositories and user repo extension** - `b7c0208` (feat)
2. **Task 2: Email service, Jinja2 templates, APScheduler jobs, requirements.txt** - `f5f3b26` (feat)

## Files Created/Modified

- `Backend/app/infrastructure/database/repositories/notification_repo.py` - SqlAlchemyNotificationRepository (9 methods)
- `Backend/app/infrastructure/database/repositories/notification_preference_repo.py` - SqlAlchemyNotificationPreferenceRepository (get_by_user + upsert)
- `Backend/app/infrastructure/database/repositories/user_repo.py` - Added get_all_by_role()
- `Backend/app/infrastructure/email/__init__.py` - Package init
- `Backend/app/infrastructure/email/email_service.py` - send_notification_email() with SMTP guard
- `Backend/app/infrastructure/email/templates/task_assigned.html` - Jinja2 email template (Turkish)
- `Backend/app/infrastructure/email/templates/comment_added.html` - Jinja2 email template (Turkish)
- `Backend/app/infrastructure/email/templates/deadline_approaching.html` - Jinja2 email template (Turkish)
- `Backend/app/infrastructure/email/templates/status_change.html` - Jinja2 email template (Turkish)
- `Backend/app/scheduler/__init__.py` - Package init
- `Backend/app/scheduler/jobs.py` - deadline_alert_job, purge_notifications_job, scheduler instance
- `Backend/requirements.txt` - Added apscheduler and fastapi-mail

## Decisions Made

- purge_old_read uses Python-side timedelta cutoff instead of raw SQL interval for cross-database portability
- get_tasks_approaching_deadline casts due_date to ::date for same-day deadline matching regardless of time component
- SMTP_HOST guard at function start ensures zero dev friction — send_notification_email silently returns when SMTP not set
- scheduler is a module-level singleton so Plan 04/05 can import and register jobs without creating new instances

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] fastapi-mail not installed in local Anaconda environment**
- **Found during:** Task 2 verification
- **Issue:** `fastapi-mail` not present in local Anaconda env, causing import verification to fail
- **Fix:** Ran `pip install fastapi-mail` to satisfy the verification requirement; package is already in requirements.txt
- **Files modified:** None (environment-only fix)

## Issues Encountered

None blocking.

## User Setup Required

None — SMTP_HOST defaults to empty string; all email sending is silently skipped in dev.

## Next Phase Readiness

- Plan 04 (API router) can now import SqlAlchemyNotificationRepository, SqlAlchemyNotificationPreferenceRepository, and all use cases
- Plan 05 (scheduler wiring) can import `scheduler` and call `scheduler.add_job(deadline_alert_job, ...)` during app startup
- Zero circular imports — infrastructure layer depends only on domain and application layers

---
*Phase: 05-notifications*
*Completed: 2026-03-16*
