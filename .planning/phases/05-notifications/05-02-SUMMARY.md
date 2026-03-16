---
phase: 05-notifications
plan: "02"
subsystem: api
tags: [python, fastapi, clean-architecture, notifications, pydantic, abc, domain-layer]

# Dependency graph
requires:
  - phase: 05-01
    provides: Notification and NotificationPreference domain entities, DB schema, NotificationType enum

provides:
  - INotificationRepository interface with 9 abstract CRUD methods
  - INotificationPreferenceRepository interface with get_by_user and upsert
  - IUserRepository extended with get_all_by_role for admin fan-out
  - 4 notification DTOs (Response, ListResponse, Preference, PreferenceUpdate)
  - 8 use case classes covering full notification lifecycle
  - INotificationService abstraction with PollingNotificationService implementation

affects:
  - 05-03 (infrastructure: SQLAlchemy implementations of these interfaces)
  - 05-04 (API layer: router imports use cases and DTOs directly)
  - 05-05 (deadline worker: uses INotificationService.notify)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ABC-based repository interfaces in Backend/app/domain/repositories/
    - Use case classes with constructor-injected repositories (Clean Architecture)
    - INotificationService abstraction isolates delivery mechanism from API callers
    - PollingNotificationService: self-suppression via actor_id, per-type in_app preference check

key-files:
  created:
    - Backend/app/domain/repositories/notification_repository.py
    - Backend/app/domain/repositories/notification_preference_repository.py
    - Backend/app/application/dtos/notification_dtos.py
    - Backend/app/application/use_cases/manage_notifications.py
    - Backend/app/application/services/notification_service.py
  modified:
    - Backend/app/domain/repositories/user_repository.py

key-decisions:
  - "INotificationService abstraction added so API callers use notify() — switching to WebSocket requires only replacing PollingNotificationService, not touching router code"
  - "Self-suppression (actor_id == user_id) in PollingNotificationService.notify() — prevents noisy self-notifications when a user acts on their own content"
  - "per-type in_app preference check defaults to True — users receive notifications for any type not explicitly configured, reducing friction"
  - "model_copy(update=...) used in UpdateNotificationPreferencesUseCase to merge partial DTO fields onto existing Pydantic model"

patterns-established:
  - "NotificationService pattern: API layer calls notify(); service handles self-suppression + preferences + persistence"
  - "Use case raises ValueError with Turkish error message on not-found (matches existing pattern in manage_comments.py)"

requirements-completed: [NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-05, NOTIF-06]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 5 Plan 02: Notification Contracts Summary

**Clean Architecture contracts for notifications: 2 repository interfaces, 8 use cases, 4 DTOs, and INotificationService abstraction with PollingNotificationService using self-suppression and per-type preference gating**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T07:43:32Z
- **Completed:** 2026-03-16T07:45:56Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Defined INotificationRepository (9 abstract methods) and INotificationPreferenceRepository (2 abstract methods) — the contracts Plans 03/04 implement against
- Created all 8 notification use cases covering CRUD + preferences lifecycle with proper error messages in Turkish
- Built INotificationService abstraction with PollingNotificationService that implements self-suppression and per-type in_app preference checking
- Extended IUserRepository with get_all_by_role for admin fan-out (used in deadline/project notification workflows)

## Task Commits

Each task was committed atomically:

1. **Task 1: Define repository interfaces and extend IUserRepository** - `df561f1` (feat)
2. **Task 2: Define notification DTOs, use cases, and INotificationService abstraction** - `fc116bc` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `Backend/app/domain/repositories/notification_repository.py` - INotificationRepository with 9 abstract methods
- `Backend/app/domain/repositories/notification_preference_repository.py` - INotificationPreferenceRepository with get_by_user and upsert
- `Backend/app/domain/repositories/user_repository.py` - Extended with get_all_by_role abstract method
- `Backend/app/application/dtos/notification_dtos.py` - 4 DTOs: NotificationResponseDTO, NotificationListResponseDTO, NotificationPreferenceDTO, NotificationPreferenceUpdateDTO
- `Backend/app/application/use_cases/manage_notifications.py` - 8 use case classes with constructor-injected repositories
- `Backend/app/application/services/notification_service.py` - INotificationService + PollingNotificationService

## Decisions Made
- INotificationService abstraction ensures future WebSocket migration requires only replacing PollingNotificationService, not router code
- Self-suppression (actor_id == user_id guard) prevents noisy self-notifications when users act on their own tasks/comments
- Per-type in_app preference check defaults to True — unset preferences do not silently suppress notifications
- model_copy(update=...) pattern used for partial preference merges on Pydantic v2 models

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 03 (SQLAlchemy repository implementations) can now import all interfaces from this plan
- Plan 04 (API router) can import DTOs and use cases directly
- Plan 05 (deadline worker) can inject PollingNotificationService via INotificationService
- Zero database or HTTP code introduced — pure domain + application layer as specified

---
*Phase: 05-notifications*
*Completed: 2026-03-16*
