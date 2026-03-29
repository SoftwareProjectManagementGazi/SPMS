---
phase: 05-notifications
verified: 2026-03-29T12:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Start backend (uvicorn app.api.main:app) and check startup log"
    expected: "No ModuleNotFoundError; APScheduler logs two job registrations; Phase 5 migration logs show notification_preferences and task_watchers tables created (or already exist)"
    why_human: "Cannot execute backend in this environment; ImportError fix confirmed by static analysis only"
    status: deferred
  - test: "Assign a task to a second user; wait up to 30 seconds without refreshing"
    expected: "Bell badge increments; dropdown shows TASK_ASSIGNED notification in Turkish; clicking it marks as read"
    why_human: "Requires two live browser sessions with authenticated users and a running backend + database"
    status: deferred
  - test: "With SMTP configured in .env, assign a task to a user whose preferences have email enabled"
    expected: "That user receives an HTML email (task_assigned.html template) within seconds of the assignment"
    why_human: "Requires real SMTP configuration and email delivery infrastructure"
    status: deferred
  - test: "Add a comment to a task assigned to another user; check that user's inbox"
    expected: "HTML email with comment_added.html template received; subject includes task title"
    why_human: "Requires SMTP and two user sessions"
    status: deferred
  - test: "In Settings -> Bildirimler, disable COMMENT_ADDED email toggle; save; add a comment"
    expected: "No email sent for that event; in-app notification still appears (email_ok guard correctly skips send)"
    why_human: "Requires live backend interaction and SMTP monitoring"
    status: deferred
  - test: "Navigate to Settings -> Bildirimler; save preferences; reload page"
    expected: "Toast 'Tercihler kaydedildi'; saved values preserved after reload"
    why_human: "Visual confirmation and persistence check require running app"
    status: deferred
  - test: "Open a task where current user is not the assignee; check task sidebar"
    expected: "'Görevi İzle' button visible; clicking changes to 'İzlemeyi Bırak'; after watching, adding a comment from another session triggers a COMMENT_ADDED in-app notification"
    why_human: "Requires running frontend with multiple authenticated sessions"
    status: deferred
---

# Phase 5: Notifications Verification Report

**Phase Goal:** Users receive timely in-app and email notifications about task and project events, can configure their notification preferences, and message history is durably stored.
**Verified:** 2026-03-29
**Status:** passed
**Re-verification:** Yes — confirming gap-closure state from 2026-03-16 verification (UAT items deferred per user request)

---

## Re-verification Summary

Previous verification (2026-03-16) found status `human_needed` with `score: 5/5`. All automated checks were already passing. The two earlier gaps (migration rename, email wiring) were closed in plan 05-07 and confirmed in that previous run. This re-verification confirms no regressions have been introduced and re-classifies the human_verification items as `deferred` per project instruction.

| Item | Previous Status | 2026-03-29 Status |
|------|----------------|-------------------|
| Migration import (`migration_004.py`) | VERIFIED | VERIFIED — file confirmed at correct path, `004_phase5_schema.py` absent |
| Email wiring in tasks.py / comments.py | VERIFIED | VERIFIED — `send_notification_email` imported and called at lines 186, 268 (tasks.py), line 103 (comments.py) |
| All 5 observable truths | VERIFIED | VERIFIED — no regressions |

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | When a task is assigned or its status changes, the assignee sees an in-app notification without refreshing the page | VERIFIED | tasks.py triggers TASK_ASSIGNED and STATUS_CHANGE via notif_service.notify(); use-notifications.ts polls every 30s; migration_004.py importable so schema runs at startup |
| 2 | Deadline-approaching, comment-added, and task-assigned events each trigger a notification; role-based permissions prevent members from sending messages beyond their allowed scope | VERIFIED | tasks.py: TASK_ASSIGNED, STATUS_CHANGE, TASK_DELETED; comments.py: COMMENT_ADDED; scheduler/jobs.py: deadline_alert_job fires DEADLINE_APPROACHING; project membership enforced throughout API layer |
| 3 | User can enable email notifications and receives an email when assigned to a task or when a comment is added | VERIFIED | send_notification_email() called in update_task (line 186), patch_task (line 268), create_comment (line 103); email_ok guard checks pref.email_enabled + per-type email key; SMTP_HOST guard in email_service.py prevents silent failure in non-SMTP environments |
| 4 | User can mute notifications or set "important events only" mode; preference is saved and respected on subsequent events | VERIFIED | notification_preferences ORM model with JSON preferences field; Settings page has NotificationPreferencesForm; PollingNotificationService.notify() reads per-type in_app preference before creating notification row; PUT /api/v1/notifications/preferences validates deadline_days |
| 5 | Comments and messages remain accessible in history even after the associated project is archived or deleted | VERIFIED | Notification rows stored as text snapshots with related_entity_id as dead-reference-safe integer; purge_notifications_job removes read rows older than 90 days; unread rows kept indefinitely |

**Score:** 5/5 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `Backend/app/domain/entities/notification.py` | NotificationType with 9 values + Notification entity with related_entity_type | VERIFIED | 9 enum values confirmed (4 original + 5 new); related_entity_type field present |
| `Backend/app/infrastructure/database/models/notification.py` | NotificationModel with related_entity_type column | VERIFIED | Column(String(20), nullable=True) present at line 16 |
| `Backend/app/infrastructure/database/models/notification_preference.py` | NotificationPreferenceModel with user_id unique, JSON preferences, email_enabled, deadline_days | VERIFIED | All columns present; TimestampedMixin applied |
| `Backend/app/infrastructure/database/models/task_watcher.py` | TaskWatcherModel with composite PK (task_id, user_id) | VERIFIED | Both columns are primary_key=True with CASCADE FK |
| `Backend/app/infrastructure/database/migrations/migration_004.py` | Renamed Phase 5 migration — importable as migration_004 | VERIFIED | File exists at correct path; old `004_phase5_schema.py` absent from migrations dir |
| `Backend/app/domain/repositories/notification_repository.py` | INotificationRepository with 9 abstract methods | VERIFIED | All methods present including purge_old_read and get_tasks_approaching_deadline |
| `Backend/app/domain/repositories/notification_preference_repository.py` | INotificationPreferenceRepository with get_by_user and upsert | VERIFIED | Both abstract methods defined |
| `Backend/app/domain/repositories/user_repository.py` | IUserRepository with get_all_by_role | VERIFIED | get_all_by_role abstract method present |
| `Backend/app/application/use_cases/manage_notifications.py` | All 8 notification use case classes | VERIFIED | CreateNotificationUseCase and all others importable; all have execute() methods |
| `Backend/app/application/dtos/notification_dtos.py` | NotificationResponseDTO, NotificationListResponseDTO, NotificationPreferenceDTO, NotificationPreferenceUpdateDTO | VERIFIED | All 4 DTOs defined |
| `Backend/app/application/services/notification_service.py` | INotificationService + PollingNotificationService | VERIFIED | Self-suppression (actor_id == user_id) and per-type in_app preference check present |
| `Backend/app/infrastructure/database/repositories/notification_repo.py` | SqlAlchemyNotificationRepository with 9 methods | VERIFIED | All 9 methods implemented including deadline query with ::date cast |
| `Backend/app/infrastructure/database/repositories/notification_preference_repo.py` | SqlAlchemyNotificationPreferenceRepository | VERIFIED | get_by_user and upsert implemented |
| `Backend/app/infrastructure/email/email_service.py` | send_notification_email() with SMTP_HOST guard | VERIFIED | Silent return when settings.SMTP_HOST is empty; BackgroundTasks pattern used |
| `Backend/app/infrastructure/email/templates/` | 4 Jinja2 HTML templates | VERIFIED | task_assigned.html, comment_added.html, deadline_approaching.html, status_change.html all present |
| `Backend/app/scheduler/jobs.py` | deadline_alert_job + purge_notifications_job + scheduler | VERIFIED | AsyncIOScheduler instance; both job functions use AsyncSessionLocal pattern |
| `Backend/app/api/v1/notifications.py` | Notification CRUD router with 5 routes | VERIFIED | GET /, POST /mark-all-read, DELETE /clear-read, PATCH /{id}/read, DELETE /{id}; fixed-path routes registered before parametric |
| `Backend/app/api/v1/notification_preferences.py` | Preferences router with GET / and PUT / | VERIFIED | deadline_days validation against {1,2,3,7} present |
| `Backend/app/api/v1/tasks.py` | Email trigger after TASK_ASSIGNED notify() in update_task and patch_task | VERIFIED | send_notification_email called at lines 186 and 268; preference guard present at both sites |
| `Backend/app/api/v1/comments.py` | Email trigger after COMMENT_ADDED notify() in create_comment | VERIFIED | send_notification_email called at line 103; preference guard present |
| `Backend/app/api/v1/projects.py` | PROJECT_CREATED/UPDATED/DELETED admin fan-out via asyncio.gather | VERIFIED | All three event types trigger asyncio.gather fan-out to admins |
| `Backend/app/api/main.py` | Notification routers registered; scheduler started in lifespan; migration_004 imported | VERIFIED | Lines 104-114: migration_004 import, scheduler.add_job x2, scheduler.start(), shutdown on exit; routers at lines 145-146 |
| `Frontend/services/notification-service.ts` | API client with 7 methods using apiClient | VERIFIED | list, markRead, markAllRead, deleteNotification, clearRead, getPreferences, updatePreferences — all implemented |
| `Frontend/hooks/use-notifications.ts` | Polling hook with visibilitychange pause | VERIFIED | refetchInterval conditional on isTabActive; prevUnreadCount ref prevents toast on initial load |
| `Frontend/components/notifications/notification-bell.tsx` | Bell icon + Popover dropdown with badge, Turkish text, empty state | VERIFIED | Badge caps at 99+; empty state "Tüm bildirimlerinizi okudunuz!"; "Tüm bildirimleri gör" footer link |
| `Frontend/components/notifications/notification-item.tsx` | Single notification row with type icon, relative time, read/delete actions | VERIFIED | File exists and is imported by bell component and notifications page |
| `Frontend/app/notifications/page.tsx` | Full notification history page with pagination and filter tabs | VERIFIED | Tabs (Tümü/Okunmamış), offset-based Load More, skeleton loading, empty state |
| `Frontend/components/notifications/notification-preferences-form.tsx` | Preferences form with per-type toggles | VERIFIED | notificationService.getPreferences() + updatePreferences() wired via useQuery/useMutation |
| `Frontend/app/settings/page.tsx` | Settings page with Bildirimler section | VERIFIED | NotificationPreferencesForm imported and rendered in Card at line 224 |
| `Frontend/components/task-detail/task-sidebar.tsx` | Watch toggle button for non-assignees | VERIFIED | showWatchToggle guard checks currentUser?.id !== task.assignee?.id; "Görevi İzle / İzlemeyi Bırak" button present |
| `Frontend/services/task-service.ts` | getWatchStatus, watchTask, unwatchTask methods | VERIFIED | All 3 methods calling GET/POST/DELETE /tasks/{id}/watch |
| `Backend/app/api/v1/tasks.py` (watch routes) | GET/POST/DELETE /{task_id}/watch endpoints | VERIFIED | All 3 routes present at lines 407, 424, 444 |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `Backend/app/api/main.py` | `Backend/app/infrastructure/database/migrations/migration_004.py` | lifespan import `migration_004.upgrade` | VERIFIED | Line 104: import resolves — file exists at correct path |
| `Backend/app/api/v1/tasks.py` | `Backend/app/infrastructure/email/email_service.py` | send_notification_email() after TASK_ASSIGNED notify | VERIFIED | Called in update_task (line 186) and patch_task (line 268); preference guard at both sites |
| `Backend/app/api/v1/comments.py` | `Backend/app/infrastructure/email/email_service.py` | send_notification_email() after COMMENT_ADDED notify | VERIFIED | Called in create_comment (line 103); preference guard present |
| `Backend/app/api/v1/tasks.py` | `Backend/app/application/services/notification_service.py` | notif_service.notify() for TASK_ASSIGNED, STATUS_CHANGE, TASK_DELETED | VERIFIED | All three event types present; watcher fan-out inline |
| `Backend/app/api/v1/comments.py` | `Backend/app/application/services/notification_service.py` | notif_service.notify() for COMMENT_ADDED | VERIFIED | Assignee + watcher fan-out both present |
| `Backend/app/api/v1/projects.py` | `Backend/app/application/services/notification_service.py` | asyncio.gather fan-out for PROJECT_CREATED/UPDATED/DELETED | VERIFIED | All three event types trigger admin fan-out |
| `Backend/app/infrastructure/email/email_service.py` | `Backend/app/infrastructure/config.py` | settings.SMTP_HOST conditional guard | VERIFIED | Silent return when SMTP_HOST is empty string |
| `Backend/app/scheduler/jobs.py` | `Backend/app/infrastructure/database/database.py` | AsyncSessionLocal() in both job functions | VERIFIED | Both jobs use `async with AsyncSessionLocal() as session` |
| `Frontend/hooks/use-notifications.ts` | `Frontend/services/notification-service.ts` | notificationService.list() inside useQuery | VERIFIED | queryFn calls notificationService.list({ limit: 20 }) |
| `Frontend/components/notifications/notification-bell.tsx` | `Frontend/hooks/use-notifications.ts` | useNotifications() hook | VERIFIED | Hook called at top of NotificationBell component |
| `Frontend/components/header.tsx` | `Frontend/components/notifications/notification-bell.tsx` | NotificationBell rendered in header | VERIFIED | Imported at line 5; rendered at line 56; static badge "3" replaced |
| `Frontend/components/notifications/notification-preferences-form.tsx` | `Frontend/services/notification-service.ts` | getPreferences() + updatePreferences() | VERIFIED | Both called via useQuery and useMutation |
| `Frontend/app/notifications/page.tsx` | `Frontend/services/notification-service.ts` | notificationService.list() with offset | VERIFIED | queryFn calls notificationService.list({ limit: LIMIT, offset }) |
| `Frontend/components/task-detail/task-sidebar.tsx` | `Frontend/services/task-service.ts` | getWatchStatus, watchTask, unwatchTask | VERIFIED | All 3 methods called via useQuery/useMutation |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| NOTIF-01 | 05-01, 05-02, 05-04, 05-05, 05-06, 05-07 | Real-time in-app notifications for task/project changes | VERIFIED | In-app pipeline complete; migration_004.py importable; polling hook delivers notifications every 30s |
| NOTIF-02 | 05-02, 05-03, 05-04 | Notifications triggered for assignment, status change, comment, deadline approaching | VERIFIED | All event types triggered in tasks.py, comments.py, projects.py; APScheduler deadline_alert_job |
| NOTIF-03 | 05-02, 05-04 | Role-based messaging permissions | VERIFIED | Admin fan-out for project events; project membership enforced via dependencies throughout API layer |
| NOTIF-04 | 05-03, 05-04, 05-06, 05-07 | Email notifications (task assignment, comment, etc.) | VERIFIED | send_notification_email() called for TASK_ASSIGNED and COMMENT_ADDED; guarded by email_enabled + per-type email preference |
| NOTIF-05 | 05-01, 05-02, 05-03, 05-04, 05-06 | User can customize notification preferences | VERIFIED | notification_preferences table, full preferences form in Settings, PollingNotificationService respects per-type in_app preference |
| NOTIF-06 | 05-01, 05-02, 05-04, 05-06 | Message/comment history durably stored; access log kept even after project deletion | VERIFIED | Text snapshot storage; dead-reference design for related_entity_id; 90-day purge of read-only notifications |

All 6 Phase 5 requirements: VERIFIED.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | No blockers, warnings, or stubs detected in any Phase 5 files |

Scanned for: TODO/FIXME/placeholder comments, empty return implementations, console.log-only stubs. None found in Phase 5 modified files.

---

## Human Verification Required (Deferred)

All 7 UAT items are deferred per project instruction. Automated checks pass; runtime confirmation is left for manual testing.

### 1. Backend Startup Check (deferred)

**Test:** Start the backend (`uvicorn app.api.main:app`) and inspect the startup log.
**Expected:** No `ModuleNotFoundError`; APScheduler logs two job registrations (`deadline_alert_job` at hour=8, `purge_notifications_job` at hour=3); Phase 5 migration logs indicate `notification_preferences` and `task_watchers` tables were created or already exist.
**Why human:** Cannot execute the backend process in this environment. The ImportError fix is confirmed by static analysis (file exists, import path matches) but runtime confirmation is deferred.

### 2. In-App Notification End-to-End (deferred)

**Test:** In Session A (User A), assign a task to User B. In Session B (logged in as User B), wait up to 30 seconds without refreshing.
**Expected:** Bell badge increments by 1; dropdown shows Turkish TASK_ASSIGNED message; clicking marks it read and navigates to the task page.
**Why human:** Requires two live browser sessions with authenticated users and a running backend with database.

### 3. Email Delivery — Task Assigned (deferred)

**Test:** Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in `.env`. Ensure User B has default preferences (email_enabled=True). Assign a task to User B.
**Expected:** User B receives an HTML email using the `task_assigned.html` template within seconds. Subject contains the task title.
**Why human:** Requires real SMTP configuration and email infrastructure to verify actual delivery.

### 4. Email Delivery — Comment Added (deferred)

**Test:** With SMTP configured, add a comment to a task assigned to User B (as User A).
**Expected:** User B receives an HTML email using the `comment_added.html` template. Subject contains the task title.
**Why human:** Same dependency on live SMTP infrastructure.

### 5. Email Preference Guard (deferred)

**Test:** In Settings -> Bildirimler, set User B's COMMENT_ADDED email toggle to off. Save. Add a comment to a task assigned to User B.
**Expected:** No email sent for that comment event. In-app notification still appears (in_app path is separate from email path).
**Why human:** Requires monitoring the SMTP outbox and verifying no email was sent.

### 6. Notification Preferences Persistence (deferred)

**Test:** In Settings -> Bildirimler, change deadline_days to 3; disable one notification type. Click Kaydet.
**Expected:** Toast message "Tercihler kaydedildi"; reloading the page preserves the saved values.
**Why human:** Visual confirmation and read-back from API require running app.

### 7. Watch Toggle Visibility (deferred)

**Test:** Open a task where the current user is NOT the assignee. Check the task sidebar.
**Expected:** "Görevi İzle" button visible. Click it; button changes to "İzlemeyi Bırak". From another session, add a comment to that task; the watching user receives a COMMENT_ADDED in-app notification.
**Why human:** Requires multiple sessions and a comment action across sessions.

---

## Gaps Summary

No gaps remain. All automated verification checks pass.

**Migration rename (Gap 1 — closed in 05-07):** `migration_004.py` confirmed at `Backend/app/infrastructure/database/migrations/migration_004.py`. Old `004_phase5_schema.py` is absent from the directory. `main.py` line 104 import resolves correctly.

**Email wiring (Gap 2 — closed in 05-07):** `send_notification_email()` confirmed called from three endpoint code paths — `update_task` (tasks.py line 186), `patch_task` (tasks.py line 268), and `create_comment` (comments.py line 103). Each call site applies a two-level preference guard. The SMTP_HOST guard inside `email_service.py` ensures silent no-op without SMTP.

All 6 NOTIF requirements are implemented end-to-end. Phase goal is achieved at the code level. Seven UAT items are deferred for manual testing when the backend and SMTP infrastructure are available.

---

_Verified: 2026-03-29_
_Verifier: Claude (gsd-verifier)_
