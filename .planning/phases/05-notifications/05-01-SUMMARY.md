---
phase: 05-notifications
plan: "01"
subsystem: database

tags: [postgres, sqlalchemy, alembic, pydantic, notifications, enum-migration]

requires:
  - phase: 03-project-task-completion
    provides: task model and tasks table that task_watchers references
  - phase: 01-foundation
    provides: Base, TimestampedMixin, UserModel that notification_preferences and task_watchers FK to

provides:
  - "NotificationType enum with 9 values (4 original + 5 new: STATUS_CHANGE, TASK_DELETED, PROJECT_CREATED, PROJECT_DELETED, PROJECT_UPDATED)"
  - "NotificationModel.related_entity_type column for toast navigation"
  - "NotificationPreference domain entity and NotificationPreferenceModel ORM"
  - "TaskWatcherModel ORM (task_watchers composite PK join table)"
  - "Alembic migration 004_phase5 with autocommit_block() for enum DDL"
  - "Async lifespan migration 004_phase5_schema.py with AUTOCOMMIT isolation for enum DDL"
  - "Settings.NOTIFICATION_POLL_INTERVAL_MS = 30000"

affects: [05-02, 05-03, 05-04, 05-05, 05-06]

tech-stack:
  added: []
  patterns:
    - "Dual migration pattern: alembic/versions/ for CLI + app/infrastructure/database/migrations/ for lifespan"
    - "ALTER TYPE ADD VALUE outside transaction: autocommit_block() in Alembic, AUTOCOMMIT isolation in async migration"
    - "Idempotent migrations via information_schema.tables and information_schema.columns checks"
    - "TimestampedMixin on notification_preferences (user-owned preference record); no mixin on task_watchers (lightweight join table)"

key-files:
  created:
    - Backend/app/domain/entities/notification_preference.py
    - Backend/app/infrastructure/database/models/notification_preference.py
    - Backend/app/infrastructure/database/models/task_watcher.py
    - Backend/alembic/versions/004_phase5_schema.py
    - Backend/app/infrastructure/database/migrations/004_phase5_schema.py
  modified:
    - Backend/app/domain/entities/notification.py
    - Backend/app/infrastructure/database/models/notification.py
    - Backend/app/infrastructure/database/models/__init__.py
    - Backend/app/infrastructure/config.py

key-decisions:
  - "Legacy PROJECT_UPDATE enum value kept (no rename) — safest approach; PROJECT_UPDATED added as new canonical value; both coexist"
  - "notification_preferences uses TimestampedMixin (user-owned record, has lifecycle); task_watchers uses no mixin (ephemeral join table)"
  - "Alembic autocommit_block() used for enum DDL (Alembic 1.7+ pattern, confirmed on 1.17.2)"
  - "Async lifespan migration uses engine.execution_options(isolation_level='AUTOCOMMIT') for enum DDL block"
  - "notification_preferences has user_id UNIQUE constraint — one row per user, created on first access"

requirements-completed: [NOTIF-01, NOTIF-02, NOTIF-05, NOTIF-06]

duration: 12min
completed: 2026-03-16
---

# Phase 5 Plan 01: Schema Foundation Summary

**PostgreSQL notification_type enum extended to 9 values, notification_preferences and task_watchers tables created via dual idempotent migrations (Alembic + async lifespan) with autocommit-safe ALTER TYPE pattern**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-16T08:16:50Z
- **Completed:** 2026-03-16T08:29:00Z
- **Tasks:** 2/2
- **Files modified:** 9 (4 modified + 5 created)

## Accomplishments

- Extended `NotificationType` Python enum from 4 to 9 values; kept legacy `PROJECT_UPDATE` and added 5 new canonical values
- Created `NotificationPreference` domain entity + `NotificationPreferenceModel` ORM (user_id unique, preferences JSON, email_enabled, deadline_days)
- Created `TaskWatcherModel` ORM (task_watchers composite PK join table — opt-in watch feature storage)
- Added `related_entity_type` field to both `Notification` domain entity and `NotificationModel` ORM
- Wrote both migration files with idempotency checks and correct autocommit handling for `ALTER TYPE ADD VALUE`

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend NotificationType enum + update domain/ORM models** - `5aa250e` (feat)
2. **Task 2: Phase 5 Alembic + async lifespan migrations** - `1abadd9` (feat)

## Files Created/Modified

- `Backend/app/domain/entities/notification.py` - Added 5 new NotificationType values + related_entity_type field to Notification entity
- `Backend/app/infrastructure/database/models/notification.py` - Added related_entity_type column to NotificationModel
- `Backend/app/domain/entities/notification_preference.py` - New NotificationPreference Pydantic entity
- `Backend/app/infrastructure/database/models/notification_preference.py` - New NotificationPreferenceModel ORM (TimestampedMixin, user_id unique)
- `Backend/app/infrastructure/database/models/task_watcher.py` - New TaskWatcherModel ORM (composite PK)
- `Backend/app/infrastructure/database/models/__init__.py` - Registered NotificationPreferenceModel and TaskWatcherModel
- `Backend/app/infrastructure/config.py` - Added NOTIFICATION_POLL_INTERVAL_MS = 30000
- `Backend/alembic/versions/004_phase5_schema.py` - Alembic migration (revision 004_phase5, down_revision 003_phase3)
- `Backend/app/infrastructure/database/migrations/004_phase5_schema.py` - Async lifespan migration (upgrade(engine) signature)

## Decisions Made

- **Legacy enum value kept:** `PROJECT_UPDATE` (singular) is kept as-is; `PROJECT_UPDATED` (plural) added as the new canonical value per CONTEXT.md. Both coexist — no risk of breaking existing notification rows.
- **Alembic autocommit_block():** Used `op.get_context().autocommit_block()` (Alembic 1.7+, confirmed on 1.17.2) to wrap `ALTER TYPE ADD VALUE` statements, preventing "cannot run inside a transaction block" error.
- **AUTOCOMMIT isolation in async migration:** Used `engine.execution_options(isolation_level="AUTOCOMMIT")` to create a fresh autocommit connection for enum DDL — cleaner than issuing raw `COMMIT` statements.
- **notification_preferences with TimestampedMixin:** Preference record has user lifecycle (can be soft-deleted/versioned); task_watchers is ephemeral and gets no mixin.
- **notification_preferences.user_id unique constraint:** One row per user, created lazily on first settings access; the UNIQUE constraint enforces this at DB level.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all migrations syntactically valid on first attempt. Enum verification confirmed 9 values present.

## User Setup Required

None - no external service configuration required. Migrations will run automatically via lifespan on next app start.

## Next Phase Readiness

- Schema contracts established; plans 02-06 can proceed
- `NotificationType` Python enum and SQL migration are in sync (9 values each)
- `NotificationPreferenceModel` and `TaskWatcherModel` are registered with SQLAlchemy metadata and will be included in any `Base.metadata.create_all()` calls
- Migration 004 must be run (via Alembic CLI or app startup) before any code in plans 02-06 writes to notification_preferences or task_watchers tables

---
*Phase: 05-notifications*
*Completed: 2026-03-16*
