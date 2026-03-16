# Phase 5: Notifications - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Users receive timely in-app and email notifications about task and project events, can configure their notification preferences per event type, and notification history is durably stored. Covers: real-time delivery (polling), notification bell UI, email sending, event triggers, role-based alerts, watch-task feature, and notification preferences.

Requirements in scope: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05, NOTIF-06.

</domain>

<decisions>
## Implementation Decisions

### Real-time Delivery

- **Mechanism:** Frontend polling — not WebSocket or SSE. Simple, no extra infra, sufficient for a project management tool.
- **Interval:** Every 30 seconds. Configurable via `.env` (e.g., `NOTIFICATION_POLL_INTERVAL_MS=30000`).
- **On load:** Fetch unread notifications immediately on page load, then poll at the configured interval.
- **Active tab only:** Polling pauses when the browser tab loses focus (`visibilitychange` event). Resumes on focus.
- **New notification feedback:** Bell badge count increments + a `sonner` toast appears briefly.
- **Toast is clickable:** Clicking the toast navigates to the related task or project.
- **Architecture note:** The notification service layer must be abstracted (service interface) to allow future migration to WebSocket or GraphQL subscriptions without reworking consumers.

---

### Notification Bell UI

- **Surface:** Bell icon in the navbar → dropdown panel showing the latest 20 notifications, plus a "View all" link to `/notifications` (dedicated full-history page).
- **Badge:** Unread count shown on bell icon; caps at `99+`.
- **Notification item layout (dropdown and page):** Type icon + Turkish message text + relative time ("2 dakika önce"). Avatar not used.
- **All UI text and notification messages must be in Turkish.**
- **Mark as read:** Clicking a notification marks it as read and navigates to the related entity.
- **"Mark all as read" button** at the top of the dropdown.
- **Delete individual notification:** Trash/X icon on each notification row.
- **"Clear all" button** in the dropdown and on the /notifications page (triggers immediate purge of all read notifications for the user).
- **Unread visual:** Unread notifications have a subtle accent background; read ones are neutral.
- **Empty state:** Turkish message — "Tüm bildirimlerinizi okudunuz!" with an illustration.

**`/notifications` full page:**
- Chronological, newest first.
- Paginated with Load More pattern (consistent with existing pagination).
- Filter tabs: **Tümü** | **Okunmamış**.

---

### Notification Event Types

Extend the existing `NotificationType` enum with new types:

| Type | Trigger | Recipients |
|---|---|---|
| `TASK_ASSIGNED` | Task assigned to a user | Assignee (excluding self) |
| `COMMENT_ADDED` | Comment added to a task | Assignee + watchers (excluding actor) |
| `DEADLINE_APPROACHING` | Task due date approaching | Assignee |
| `STATUS_CHANGE` | Task status changed | Assignee + watchers (excluding actor) |
| `TASK_DELETED` | Task deleted | Assignee + watchers (excluding actor) |
| `PROJECT_CREATED` | New project created | All Admins |
| `PROJECT_DELETED` | Project deleted or archived | All Admins |
| `PROJECT_UPDATED` | Project settings changed | All Admins |

**Self-action suppression:** If the actor who triggered the event is also a recipient, they do NOT receive a notification. They already know what they did.

---

### Deadline Approaching Scheduler

- **Mechanism:** APScheduler running inside the FastAPI process (no Redis/Celery). Daily cron job checks all active tasks with due dates.
- **When it fires:** User configures advance notice in their preferences — options: 1, 2, 3, or 7 days before.
- **Rule:** The 1-day-before notification always fires regardless of user preference. If user chose 3 days, they receive alerts at both 3 days and 1 day before.
- **Scheduler also handles:** 90-day auto-purge of read notifications (same daily job).

---

### Watch Task Feature

- **Default:** Nobody watches by default — opt-in only.
- **Assignees:** Always receive task notifications through the standard TASK_ASSIGNED/COMMENT_ADDED/STATUS_CHANGE rules — no explicit watch needed.
- **Watch toggle:** "Görevi İzle / İzlemeyi Bırak" button in the task detail sidebar.
- **Storage:** Extend existing `project_members` structure to track watched task IDs per member (avoid a separate table; exact schema is Claude's discretion).
- **Assignee notification behavior is configurable:** User can opt out of receiving notifications for their assigned tasks via the per-type toggles in Settings.

---

### Email Notifications

- **Real emails via SMTP** — not logged to console.
- **Library:** `fastapi-mail` (async, with Jinja2 template support).
- **Format:** HTML emails using Jinja2 templates, written in Turkish.
- **Delivery:** FastAPI `BackgroundTasks` — email is sent after the API responds, non-blocking.
- **Triggered by:** Task assigned, comment added, deadline approaching, status change (same events as in-app), controlled by user preferences.
- **Global toggle:** User can disable all email notifications from the Settings page.
- **Per-type control:** Each notification type has an email toggle in preferences (independent of in-app toggle).

---

### Notification Preferences

- **Storage:** Database (persists across devices). New `notification_preferences` table or JSON column on user record — Claude's discretion on schema.
- **Settable per type:** `TASK_ASSIGNED`, `COMMENT_ADDED`, `DEADLINE_APPROACHING`, `STATUS_CHANGE`, `TASK_DELETED`.
- **Per type:** Two toggles — in-app on/off, email on/off.
- **Global email toggle:** Single on/off that overrides all per-type email settings.
- **Deadline warning days:** Selector (1, 2, 3, or 7 days) — 1 day always fires regardless.
- **UI location:** Settings page → new "Bildirimler" (Notifications) section.

---

### Role-based Notification Rules

- **All project members** can add comments — no role restriction.
- **Admins** receive in-app (and optionally email) notifications for:
  - Project created (`PROJECT_CREATED`)
  - Project deleted or archived (`PROJECT_DELETED`)
  - Project settings changed (`PROJECT_UPDATED`)
- **Project managers** receive the same notifications as regular members (only their own task events + watches). No special PM-scoped alerts.

---

### Notification History & Retention

- **Retention:** Read notifications older than 90 days are auto-purged by the APScheduler daily job.
- **Unread notifications:** Kept indefinitely until read.
- **"Clear all" button:** Triggers immediate purge of all read notifications for the requesting user (not a scheduled action — fires on demand).
- **When related task/project is deleted:**
  - Notification rows are **kept** — message text is already stored as a string, so it remains readable.
  - `related_entity_id` becomes a dead reference — handled gracefully on navigation.
  - Navigating to a deleted task's URL shows a "404 / Task not found" page (soft-delete guard on the task detail page).
  - A `TASK_DELETED` notification is sent to the task's assignee and watchers when deletion occurs.

---

### Grouping

- No notification grouping or batching — each event creates its own notification row. Simple, no dedup logic.

---

### Claude's Discretion

- Exact schema for notification preferences (separate table vs JSON column on user record).
- Exact schema extension for task watching on `project_members`.
- APScheduler job configuration (startup registration, timezone handling).
- Jinja2 email template design (layout, colors, SPMS branding).
- `NotificationType` enum extension approach (Alembic migration for the SQL enum type).
- Polling implementation pattern (TanStack Query `refetchInterval` vs custom `setInterval` hook).
- Exact Turkish message templates for each notification type.

</decisions>

<specifics>
## Specific Ideas

- "Backend should be structured to allow future migration to WebSocket or GraphQL-based notification delivery without reworking consumers."
- Notification messages must be in Turkish — e.g., "Ali sizi 'Fix login bug' görevine atadı", "Bir yorum eklendi: 'Fix login bug'".
- Jinja2 HTML email templates should be reusable for Phase 6 PDF export (via WeasyPrint) — design with that in mind.
- Watch task toggle label: "Görevi İzle" / "İzlemeyi Bırak" — consistent Turkish verb form.
- Clear all = purge only read notifications (not unread) — user said "clear notifications button to trigger purge".
- 1-day deadline notification always fires even if user picks 3 days — user's exact words: "if user chooses 3, user gets notif both 3 day and 1 day before".
- Assignee notification is default but configurable: "assignee always gets the notifications (make it configurable via settings)".
- Empty state: "Tüm bildirimlerinizi okudunuz!" with an illustration.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Backend/app/infrastructure/database/models/notification.py` — `NotificationModel` already built with: id, user_id, message (Text), type (SqlEnum), is_read, related_entity_id, created_at. **No migration gap — model exists.**
- `Backend/app/domain/entities/notification.py` — `Notification` entity + `NotificationType` enum (TASK_ASSIGNED, COMMENT_ADDED, DEADLINE_APPROACHING, PROJECT_UPDATE). Extend enum with 4 new types.
- `sonner` (`Frontend/components/ui/sonner.tsx`) — toast library already installed. Use `toast()` with an action button for navigable toasts.
- `Backend/app/application/use_cases/request_password_reset.py` — established pattern: `if settings.SMTP_HOST: send_email(...)`. fastapi-mail follows the same conditional-config pattern.
- `Backend/app/api/dependencies.py` — `get_current_user` dependency; all notification endpoints use this for auth.
- `shadcn/ui` components — `Badge`, `Button`, `ScrollArea`, `Tabs` all available for the bell dropdown and /notifications page.
- `Backend/app/infrastructure/config.py` — `pydantic-settings` config; add `NOTIFICATION_POLL_INTERVAL_MS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` here.

### Established Patterns
- Clean Architecture: new `INotificationRepository`, `SqlAlchemyNotificationRepository`, use cases in `app/application/use_cases/` (e.g., `GetUserNotificationsUseCase`, `MarkNotificationReadUseCase`).
- TanStack Query `useQuery` with `refetchInterval` — standard pattern for polling. Already used throughout codebase for live data.
- `FastAPI BackgroundTasks` — already used implicitly in the codebase; email sending follows this pattern.
- APScheduler: not yet installed — add `apscheduler` to `requirements.txt`; register jobs at FastAPI startup via `@app.on_event("startup")`.
- `fastapi-mail`: not yet installed — add to `requirements.txt`. Config via `ConnectionConfig` from `fastapi_mail`.
- `TimestampedMixin` — apply to notification_preferences table.
- Turkish-language comments in codebase — notification message templates should follow suit.

### Integration Points
- `Backend/app/api/v1/` — new `notifications.py` router: `GET /notifications` (list + poll), `PATCH /notifications/{id}/read`, `POST /notifications/mark-all-read`, `DELETE /notifications/{id}`, `DELETE /notifications/clear-read`.
- `Backend/app/api/v1/` — new `notification_preferences.py` router: `GET /notifications/preferences`, `PUT /notifications/preferences`.
- `Backend/app/api/v1/tasks.py` — after task assignment, comment create, status change, task delete → call `CreateNotificationUseCase` inline or via service.
- `Backend/app/api/v1/projects.py` — after project create/delete/settings change → notify admins.
- `Frontend/components/app-shell.tsx` (or equivalent navbar) — add bell icon with badge + dropdown.
- `Frontend/app/notifications/page.tsx` — new page for full notification history.
- `Frontend/app/settings/page.tsx` — add "Bildirimler" section with per-type toggles + email toggle + deadline days selector.
- `Frontend/components/task-detail/task-sidebar.tsx` — add "Görevi İzle" toggle button.
- New: `Frontend/services/notification-service.ts` + `Frontend/hooks/use-notifications.ts`.

### New Libraries to Install
- `apscheduler` — deadline cron + 90-day purge job (backend).
- `fastapi-mail` — SMTP email sending with Jinja2 templates (backend).

</code_context>

<deferred>
## Deferred Ideas

- **Jinja2 for Phase 6 PDF exports** — User asked if Jinja2 can be used for analytics export. Answer: yes for HTML→PDF (via WeasyPrint); Excel exports use `openpyxl`/`xlsxwriter`. Note this for Phase 6 planning.
- **WebSocket or GraphQL subscription delivery** — Current approach is polling, but the notification service must be abstracted to make this migration possible in a future phase.
- **Celery + Redis task queue** — For now, FastAPI BackgroundTasks is sufficient. If email volume grows, migrate to Celery in Phase 7+.
- **Push notifications (browser/mobile)** — Web Push API for notifications even when the app is closed. Out of scope for this phase.
- **Notification digest emails** — Daily/weekly email digest summarizing all activity. User mentioned no grouping, so this is a future enhancement.

</deferred>

---

*Phase: 05-notifications*
*Context gathered: 2026-03-16*
