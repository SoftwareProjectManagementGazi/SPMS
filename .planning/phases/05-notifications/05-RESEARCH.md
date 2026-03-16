# Phase 5: Notifications - Research

**Researched:** 2026-03-16
**Domain:** In-app polling notifications, email delivery (fastapi-mail), APScheduler cron jobs, notification preferences, watch-task feature
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Real-time Delivery**
- Mechanism: Frontend polling — not WebSocket or SSE
- Interval: Every 30 seconds; configurable via `.env` (`NOTIFICATION_POLL_INTERVAL_MS=30000`)
- On load: Fetch unread notifications immediately on page load, then poll at configured interval
- Active tab only: Polling pauses on `visibilitychange` blur, resumes on focus
- New notification feedback: Bell badge count increments + `sonner` toast appears briefly
- Toast is clickable: navigates to related task or project
- Architecture note: Notification service layer must be abstracted (service interface) to allow future migration to WebSocket or GraphQL subscriptions without reworking consumers

**Notification Bell UI**
- Bell icon in navbar -> dropdown panel showing latest 20 notifications, plus "View all" link to `/notifications`
- Badge: unread count, caps at `99+`
- Notification item layout: Type icon + Turkish message text + relative time ("2 dakika önce"). No avatar.
- ALL UI text and notification messages must be in Turkish
- Clicking a notification marks it as read and navigates to the related entity
- "Mark all as read" button at top of dropdown
- Delete individual notification: Trash/X icon on each row
- "Clear all" button in dropdown and `/notifications` page (purges all read notifications for user)
- Unread: subtle accent background; read: neutral
- Empty state: "Tüm bildirimlerinizi okudunuz!" with an illustration
- `/notifications` full page: chronological newest-first, Load More pagination, filter tabs Tümü | Okunmamış

**Notification Event Types**
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

Self-action suppression: Actor who triggered event does NOT receive a notification.

**Deadline Approaching Scheduler**
- APScheduler running inside FastAPI process (no Redis/Celery). Daily cron job checks all active tasks with due dates.
- User configures advance notice: 1, 2, 3, or 7 days before
- 1-day-before notification always fires regardless of user preference
- Scheduler also handles: 90-day auto-purge of read notifications

**Watch Task Feature**
- Default: nobody watches — opt-in only
- Assignees: always receive task notifications through standard rules — no explicit watch needed
- Watch toggle: "Görevi İzle / İzlemeyi Bırak" button in task detail sidebar
- Storage: extend existing `project_members` structure to track watched task IDs per member (avoid separate table)

**Email Notifications**
- Real emails via SMTP — not logged to console
- Library: `fastapi-mail` (async, with Jinja2 template support)
- Format: HTML emails using Jinja2 templates, written in Turkish
- Delivery: FastAPI `BackgroundTasks` — non-blocking
- Triggered by: Task assigned, comment added, deadline approaching, status change
- Global toggle: user can disable all email notifications
- Per-type control: each notification type has an email toggle in preferences

**Notification Preferences**
- Storage: database (persists across devices). New `notification_preferences` table or JSON column on user — Claude's discretion on schema
- Settable per type: `TASK_ASSIGNED`, `COMMENT_ADDED`, `DEADLINE_APPROACHING`, `STATUS_CHANGE`, `TASK_DELETED`
- Per type: two toggles — in-app on/off, email on/off
- Global email toggle: single on/off that overrides all per-type email settings
- Deadline warning days: selector (1, 2, 3, or 7 days)
- UI location: Settings page -> new "Bildirimler" section

**Role-based Notification Rules**
- All project members can add comments — no role restriction
- Admins receive in-app (and optionally email) for PROJECT_CREATED, PROJECT_DELETED, PROJECT_UPDATED
- Project managers: same as regular members (own task events + watches)

**Notification History and Retention**
- Read notifications older than 90 days are auto-purged by APScheduler daily job
- Unread notifications kept indefinitely until read
- "Clear all" purges only read notifications on demand
- When related task/project is deleted: notification rows are KEPT; message text already stored as string; `related_entity_id` becomes a dead reference — handled gracefully on navigation

**No Grouping**
- No notification grouping or batching — each event creates its own notification row

### Claude's Discretion

- Exact schema for notification preferences (separate table vs JSON column on user record)
- Exact schema extension for task watching on `project_members`
- APScheduler job configuration (startup registration, timezone handling)
- Jinja2 email template design (layout, colors, SPMS branding)
- `NotificationType` enum extension approach (Alembic migration for the SQL enum type)
- Polling implementation pattern (TanStack Query `refetchInterval` vs custom `setInterval` hook)
- Exact Turkish message templates for each notification type

### Deferred Ideas (OUT OF SCOPE)

- Jinja2 for Phase 6 PDF exports (note for Phase 6 planning)
- WebSocket or GraphQL subscription delivery (future migration path — service must be abstractable)
- Celery + Redis task queue (FastAPI BackgroundTasks sufficient for now)
- Push notifications (browser/mobile)
- Notification digest emails
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTIF-01 | Task/project changes delivered as real-time in-app notifications | Polling via TanStack Query `refetchInterval`; bell dropdown + `/notifications` page; immediate fetch on load |
| NOTIF-02 | Notifications triggered for task assignment, status change, comment, deadline approaching | `CreateNotificationUseCase` called from tasks.py, comments.py, projects.py endpoints; APScheduler cron for deadline |
| NOTIF-03 | Each user has messaging/notification permissions per role | Admins get project-level events; members get task-level events; comment-sending open to all members; role checked via existing `_is_admin()` |
| NOTIF-04 | Email notifications supported (task assignment, comment, etc.) | `fastapi-mail` + `BackgroundTasks`; Jinja2 HTML templates in Turkish; conditional on `settings.SMTP_HOST` |
| NOTIF-05 | User can customize notification preferences (mute, important-only) | `notification_preferences` table; per-type in-app/email toggles; global email toggle; deadline days selector |
| NOTIF-06 | Message/comment history durably stored; access log kept even after project deletion | Notification rows kept after entity deletion; `message` stored as text snapshot; `related_entity_id` may be dead reference — 404 guard on navigation |
</phase_requirements>

---

## Summary

Phase 5 builds a complete notification system on an already-partially-constructed foundation: `NotificationModel` and the `Notification` entity exist but are unused, and the `NotificationType` enum has 4 of the required 8 values. The core work is: extend the enum, wire up `CreateNotificationUseCase` calls at every task/comment/project mutation endpoint, build the polling hook and bell UI in the frontend, add email sending via `fastapi-mail`, introduce APScheduler for the daily deadline cron and 90-day purge, add notification preferences storage and UI, and implement the watch-task feature.

The stack is already established: FastAPI + SQLAlchemy + asyncpg on the backend; Next.js 16 + TanStack Query v5 + shadcn/ui + sonner on the frontend. No new frontend dependencies are needed. Two new backend packages are required: `apscheduler` (3.x series — confirmed stable API) and `fastapi-mail`. Both are pip-installable with no infrastructure changes.

The most technically sensitive area is extending the PostgreSQL `notification_type` enum: `ALTER TYPE ... ADD VALUE` cannot run inside a transaction block, so the Alembic migration and the async lifespan migration must execute those statements outside a transaction (using `AUTOCOMMIT` or `op.execute` with `postgresql_autocommit=True`). This is the single biggest pitfall for the phase.

**Primary recommendation:** Use a dedicated `notification_preferences` table (not JSON column) for preferences — it gives per-row indexing for the scheduler query and is extensible without schema changes. Use a `task_watchers` table (rather than modifying the `project_members` association table) to track watch-task memberships — cleaner separation and avoids a breaking migration on the existing association table.

---

## Standard Stack

### Core (Backend)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `apscheduler` | 3.x (3.10+) | Daily cron for deadline alerts + 90-day purge | Battle-tested; 4.x has breaking API changes; 3.x `AsyncIOScheduler` integrates cleanly with FastAPI lifespan |
| `fastapi-mail` | 1.4.x | Async SMTP email with Jinja2 HTML templates | Official FastAPI ecosystem; wraps aiosmtplib; `BackgroundTasks` integration is first-class |
| SQLAlchemy 2 + asyncpg | already installed | Notification + preferences ORM models | Established project pattern |
| Jinja2 | already installed (transitive) | HTML email templates | Used by fastapi-mail; templates reusable for Phase 6 PDF |

### Core (Frontend)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-query` | ^5.90.16 (already installed) | `refetchInterval` polling for notifications | Already in codebase; v5 `refetchInterval` accepts number or function |
| `sonner` | ^1.7.4 (already installed) | Toast notification for new items | Already installed; `toast()` with `action` prop for navigable toasts |
| `shadcn/ui` components | already installed | Bell dropdown, ScrollArea, Badge, Tabs, Switch | Already in codebase; no new installs |
| `lucide-react` | already installed | Bell icon, type icons per notification category | Already used in header.tsx |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| APScheduler 3.x | APScheduler 4.x | 4.x has redesigned API (add_schedule not add_job); codebase is on 3.x idioms — 3.x is safer |
| `notification_preferences` separate table | JSON column on UserModel | Table gives indexed scheduler queries; JSON is simpler but requires app-level parsing |
| `task_watchers` separate table | JSON array in `project_members` | Separate table is queryable; JSON in association table requires migration and manual parsing |
| TanStack Query `refetchInterval` | Custom `setInterval` hook | `refetchInterval` is the standard Query pattern; handles deduplication and background/focus state natively |

### Installation

```bash
# Backend only — two new packages
pip install apscheduler fastapi-mail
# Add to Backend/requirements.txt:
# apscheduler
# fastapi-mail
```

---

## Architecture Patterns

### Recommended Project Structure (New Files)

```
Backend/
├── app/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── notification.py          # extend NotificationType enum (4 new values)
│   │   │   └── notification_preference.py  # NEW: NotificationPreference entity
│   │   └── repositories/
│   │       ├── notification_repository.py  # NEW: INotificationRepository interface
│   │       └── notification_preference_repository.py  # NEW interface
│   ├── application/
│   │   ├── use_cases/
│   │   │   └── manage_notifications.py  # NEW: CreateNotification, ListUserNotifications,
│   │   │                                #   MarkRead, MarkAllRead, DeleteNotification,
│   │   │                                #   ClearReadNotifications use cases
│   │   ├── dtos/
│   │   │   └── notification_dtos.py     # NEW: NotificationResponseDTO, PreferencesDTO
│   │   └── services/
│   │       └── notification_service.py  # NEW: INotificationService + impl (abstraction layer)
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── models/
│   │   │   │   ├── notification.py      # UPDATE: add related_entity_type column
│   │   │   │   ├── notification_preference.py  # NEW model
│   │   │   │   └── task_watcher.py      # NEW model
│   │   │   ├── repositories/
│   │   │   │   ├── notification_repo.py  # NEW SqlAlchemyNotificationRepository
│   │   │   │   └── notification_preference_repo.py  # NEW
│   │   │   └── migrations/
│   │   │       └── 004_phase5_schema.py  # NEW: enum values, preferences table, watchers table
│   │   └── email/
│   │       ├── email_service.py         # NEW: send_notification_email()
│   │       └── templates/
│   │           ├── task_assigned.html
│   │           ├── comment_added.html
│   │           ├── deadline_approaching.html
│   │           └── status_change.html
│   ├── api/
│   │   └── v1/
│   │       ├── notifications.py          # NEW router
│   │       └── notification_preferences.py  # NEW router
│   └── scheduler/
│       └── jobs.py                      # NEW: deadline_alert_job, purge_old_notifications_job
Frontend/
├── services/
│   └── notification-service.ts          # NEW
├── hooks/
│   └── use-notifications.ts             # NEW
├── components/
│   └── notifications/
│       ├── notification-bell.tsx         # NEW: bell + dropdown
│       ├── notification-item.tsx         # NEW: single row component
│       └── notification-preferences-form.tsx  # NEW: settings section
└── app/
    └── notifications/
        └── page.tsx                     # NEW: full history page
```

### Pattern 1: Notification Creation at Mutation Endpoints

**What:** After every state-mutating endpoint (task assign, comment create, status change, task delete, project CRUD), call `CreateNotificationUseCase` to fan out notifications to recipients.

**When to use:** Every time a state change should be visible to other users.

**Where it hooks in:** `Backend/app/api/v1/tasks.py`, `comments.py`, `projects.py` — immediately after the primary use case executes, before returning the response.

**Example (tasks.py — task assignment):**
```python
# After UpdateTaskUseCase.execute(dto) returns updated_task:
if dto.assignee_id and dto.assignee_id != current_user.id:
    notif_use_case = CreateNotificationUseCase(notification_repo)
    await notif_use_case.execute(
        user_id=dto.assignee_id,
        type=NotificationType.TASK_ASSIGNED,
        message=f"{current_user.full_name} sizi '{updated_task.title}' görevine atadı",
        related_entity_id=updated_task.id,
        related_entity_type="task",
    )
```

**Self-suppression rule:** Always check `recipient_id != current_user.id` before creating the notification row.

### Pattern 2: Polling Hook (Frontend)

**What:** TanStack Query `useQuery` with `refetchInterval` that pauses on tab blur.

**Example:**
```typescript
// Frontend/hooks/use-notifications.ts
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

export function useNotifications() {
  const [isTabActive, setIsTabActive] = useState(true)

  useEffect(() => {
    const handleVisibility = () => setIsTabActive(!document.hidden)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list({ limit: 20 }),
    refetchInterval: isTabActive
      ? (Number(process.env.NEXT_PUBLIC_NOTIFICATION_POLL_INTERVAL_MS) || 30000)
      : false,
    refetchIntervalInBackground: false,
  })
}
```

**Note on TanStack Query v5:** `refetchInterval` accepts `number | false | ((query) => number | false | undefined)`. This pattern is confirmed against official v5 docs (https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Pattern 3: APScheduler in FastAPI Lifespan

**What:** `AsyncIOScheduler` from `apscheduler.schedulers.asyncio`, registered in the existing `lifespan` async context manager.

**Critical:** Use `AsyncIOScheduler`, not `BackgroundScheduler`, because the app runs on an asyncio event loop.

**Example:**
```python
# Backend/app/scheduler/jobs.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = AsyncIOScheduler(timezone="Europe/Istanbul")

# In Backend/app/api/main.py lifespan:
@asynccontextmanager
async def lifespan(app: FastAPI):
    _validate_startup_secrets(settings)
    async with AsyncSessionLocal() as session:
        await seed_data(session)
    # Register scheduler jobs
    from app.scheduler.jobs import scheduler, deadline_alert_job, purge_notifications_job
    scheduler.add_job(deadline_alert_job, CronTrigger(hour=8, minute=0))
    scheduler.add_job(purge_notifications_job, CronTrigger(hour=3, minute=0))
    scheduler.start()
    yield
    scheduler.shutdown()
```

**Timezone:** Use `"Europe/Istanbul"` (UTC+3) — project is Turkish-language.

### Pattern 4: fastapi-mail with BackgroundTasks

**What:** `ConnectionConfig` built from settings; `FastMail.send_message()` added to `BackgroundTasks`.

**Example:**
```python
# Backend/app/infrastructure/email/email_service.py
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from fastapi import BackgroundTasks
from app.infrastructure.config import settings
from pathlib import Path

_conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.SMTP_FROM,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    TEMPLATE_FOLDER=Path(__file__).parent / "templates",
)

async def send_notification_email(
    background_tasks: BackgroundTasks,
    to_email: str,
    subject: str,
    template_name: str,
    body: dict,
) -> None:
    """Non-blocking email send. Called from API endpoints after primary work completes."""
    if not settings.SMTP_HOST:
        return  # Dev: SMTP not configured, skip silently
    mail = FastMail(_conf)
    message = MessageSchema(
        subject=subject,
        recipients=[to_email],
        template_body=body,
        subtype=MessageType.html,
    )
    background_tasks.add_task(mail.send_message, message, template_name=template_name)
```

### Pattern 5: Enum Extension Migration

**What:** PostgreSQL SQL enum types require `ALTER TYPE ... ADD VALUE` which CANNOT run inside a transaction block.

**Critical pitfall:** Both the Alembic version file and the async lifespan migration must execute enum additions outside a transaction.

**Alembic approach:**
```python
# alembic/versions/004_phase5_schema.py
from alembic import op

def upgrade():
    # MUST run outside transaction — use execute_if + literal AUTOCOMMIT workaround
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'STATUS_CHANGE'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'TASK_DELETED'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'PROJECT_CREATED'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'PROJECT_DELETED'")
    op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'PROJECT_UPDATED'")
```

**Async lifespan migration approach:**
```python
# In 004_phase5_schema.py async upgrade():
async with engine.connect() as conn:
    # Commit current transaction first, then execute DDL in autocommit context
    await conn.execute(text("COMMIT"))
    for val in ["STATUS_CHANGE", "TASK_DELETED", "PROJECT_CREATED", "PROJECT_DELETED", "PROJECT_UPDATED"]:
        await conn.execute(
            text(f"ALTER TYPE notification_type ADD VALUE IF NOT EXISTS '{val}'")
        )
```

**Alternative (cleaner):** Use a fresh connection with `AUTOCOMMIT` isolation level for enum DDL statements.

### Anti-Patterns to Avoid

- **Direct SQLAlchemy in use cases:** All DB access through repository interfaces — never `session.execute` in a use case.
- **Calling email from use cases:** Email sending belongs in the API layer (has access to `BackgroundTasks`); use cases stay pure.
- **Polling in background tabs:** `refetchIntervalInBackground: false` must be set — otherwise 30s polling continues even when user is away, draining battery and adding unnecessary load.
- **Blocking email send:** Never `await mail.send_message()` inline in an endpoint — always via `BackgroundTasks`.
- **ALTER TYPE inside transaction:** Every new enum value addition must be committed before the transaction holding the migration opens.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Async email sending | Custom aiosmtplib wrapper | `fastapi-mail` | Handles connection pooling, TLS, Jinja2 integration, BackgroundTasks |
| Cron job scheduling | `asyncio.create_task` + `asyncio.sleep` loop | `APScheduler AsyncIOScheduler + CronTrigger` | APScheduler handles missed-run logic, timezone, error recovery, concurrent job limits |
| HTML email templates | Inline f-strings | Jinja2 templates in `templates/` folder | Maintainable, separable, reusable for Phase 6 PDF |
| Notification deduplication | Custom recent-event cache | None needed | CONTEXT.md explicitly says: no grouping, each event creates its own row |
| Polling state management | Manual `useEffect` + `useState` | `useQuery refetchInterval` | TanStack Query handles stale-time, cache invalidation, loading states automatically |

**Key insight:** Both APScheduler and fastapi-mail are designed specifically for the FastAPI use case. Custom implementations would require re-solving their edge cases (timezone-aware scheduling, graceful shutdown, mail retry, TLS negotiation).

---

## Common Pitfalls

### Pitfall 1: ALTER TYPE ADD VALUE in Transaction Block

**What goes wrong:** Migration fails with `ERROR: ALTER TYPE ... ADD VALUE cannot run inside a transaction block`

**Why it happens:** Alembic wraps migrations in a transaction by default. PostgreSQL < 12 does not allow enum value additions in any transaction; PostgreSQL 12+ allows it but the new value cannot be used until the transaction commits — creating subtle failures.

**How to avoid:** In the Alembic version file, add `IF NOT EXISTS` to all `ALTER TYPE ADD VALUE` statements. For the async lifespan migration (004_phase5_schema.py), acquire a raw connection with `AUTOCOMMIT` mode before issuing enum DDL. Match the existing project pattern from 003_phase3_schema.py.

**Warning signs:** Migration passes but app crashes on startup with `LookupError: 'STATUS_CHANGE' is not among the valid values for this Enum`.

### Pitfall 2: Enum Python vs SQL Out-of-Sync

**What goes wrong:** New values added to Python `NotificationType(str, Enum)` but not to the SQL `notification_type` enum type in PostgreSQL — inserts fail.

**Why it happens:** SQLAlchemy SqlEnum is generated from the Python enum at table-creation time; later Python additions require explicit SQL migration.

**How to avoid:** Keep the Python enum and the SQL migration in sync. Add all 4 new types (`STATUS_CHANGE`, `TASK_DELETED`, `PROJECT_CREATED`, `PROJECT_DELETED`, `PROJECT_UPDATED`) to the Python enum AND the migration in the same commit.

**Note:** The existing enum has `PROJECT_UPDATE` (singular). The new type is `PROJECT_UPDATED`. Rename the existing value or add both — the safest approach is to keep the old value and add the new ones to avoid breaking any existing rows.

### Pitfall 3: Scheduler Fires DB Queries Without an Active Session

**What goes wrong:** APScheduler job function calls the database but the SQLAlchemy `AsyncSession` is request-scoped — the job has no session.

**Why it happens:** FastAPI's `Depends(get_db)` is request-scoped. Scheduler jobs run outside the request lifecycle.

**How to avoid:** In scheduler job functions, create a fresh `AsyncSessionLocal()` session:
```python
async def deadline_alert_job():
    async with AsyncSessionLocal() as session:
        # use session directly or construct repos
        notification_repo = SqlAlchemyNotificationRepository(session)
        ...
```

**Warning signs:** `RuntimeError: Task got Future attached to a different loop` or `sqlalchemy.exc.InvalidRequestError: Session is not open`.

### Pitfall 4: Toast Navigates to Deleted Entity

**What goes wrong:** User clicks toast for a `TASK_DELETED` notification and lands on a 404 page with no context.

**Why it happens:** `related_entity_id` is kept but the task is soft-deleted.

**How to avoid:** The task detail page already uses soft-delete — ensure it returns a user-friendly "Görev bulunamadı" page (not a raw 404). For `TASK_DELETED` notification type specifically, disable the navigation action on toast and show "Bu görev silindi" instead.

**Warning signs:** Users report blank/error pages when clicking notifications.

### Pitfall 5: Notification Fan-out Blocks Endpoint Response

**What goes wrong:** Creating 10 notifications (e.g., project with 10 members) takes 500ms, blocking the API response.

**Why it happens:** `CREATE` statements run inline in the endpoint before `return`.

**How to avoid:** Use `asyncio.gather` to fan out multiple notification inserts concurrently, or move notification creation to a `BackgroundTask` if latency becomes measurable. For the current scope (small teams), inline `gather` is sufficient.

### Pitfall 6: `refetchIntervalInBackground` Default

**What goes wrong:** Polling continues in inactive tabs, causing unnecessary DB load.

**Why it happens:** TanStack Query v5 defaults `refetchIntervalInBackground` to `false` but only suppresses the network call if the tab is hidden AND `refetchIntervalInBackground` is explicitly `false`. The custom `visibilitychange`-based `isTabActive` state must also set `refetchInterval: false` (not just the TanStack setting) because the two mechanisms are independent.

**How to avoid:** Set BOTH `refetchInterval: isTabActive ? 30000 : false` AND `refetchIntervalInBackground: false`.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Notification Repository Interface (Clean Architecture pattern)
```python
# Backend/app/domain/repositories/notification_repository.py
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.notification import Notification

class INotificationRepository(ABC):
    @abstractmethod
    async def create(self, notification: Notification) -> Notification: ...

    @abstractmethod
    async def get_by_user(self, user_id: int, limit: int = 20, offset: int = 0) -> List[Notification]: ...

    @abstractmethod
    async def get_unread_count(self, user_id: int) -> int: ...

    @abstractmethod
    async def mark_read(self, notification_id: int, user_id: int) -> bool: ...

    @abstractmethod
    async def mark_all_read(self, user_id: int) -> None: ...

    @abstractmethod
    async def delete(self, notification_id: int, user_id: int) -> bool: ...

    @abstractmethod
    async def clear_read(self, user_id: int) -> None: ...

    @abstractmethod
    async def purge_old_read(self, days: int = 90) -> int: ...

    @abstractmethod
    async def get_tasks_approaching_deadline(self, days_ahead: int) -> List: ...
```

### Notification Service Interface (Abstraction for future WebSocket migration)
```python
# Backend/app/application/services/notification_service.py
from abc import ABC, abstractmethod
from app.domain.entities.notification import NotificationType

class INotificationService(ABC):
    @abstractmethod
    async def notify(
        self,
        user_id: int,
        type: NotificationType,
        message: str,
        related_entity_id: int | None = None,
        related_entity_type: str | None = None,
    ) -> None: ...
```

### sonner Toast with Navigation (existing pattern in codebase)
```typescript
// In use-notifications.ts — on new notification detected
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// When polling detects unread count increased:
toast("Yeni bildirim", {
  description: notification.message,
  action: {
    label: "Görüntüle",
    onClick: () => router.push(`/tasks/${notification.related_entity_id}`),
  },
})
```

### Preferences Schema Recommendation (Claude's discretion — separate table)
```python
# Backend/app/infrastructure/database/models/notification_preference.py
class NotificationPreferenceModel(TimestampedMixin, Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    # Per-type toggles stored as JSON for compact storage
    # Shape: {"TASK_ASSIGNED": {"in_app": true, "email": true}, ...}
    preferences = Column(JSON, nullable=False, server_default='{}')
    email_enabled = Column(Boolean, default=True, nullable=False)
    deadline_days = Column(Integer, default=1, nullable=False)  # 1, 2, 3, or 7
```

Rationale for separate table: `user_id` unique constraint means one row per user, easily created on first access. The JSON column for per-type settings avoids 5-10 boolean columns while keeping the table flat. Scheduler queries only need `deadline_days` and `email_enabled` — both are indexed-friendly top-level columns.

### Task Watchers Schema Recommendation (Claude's discretion — separate table)
```python
# Backend/app/infrastructure/database/models/task_watcher.py
class TaskWatcherModel(Base):
    __tablename__ = "task_watchers"

    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

Rationale: Cleaner than modifying `project_members` association table (which is currently a bare `Table` with no ORM model, making it harder to add JSON columns). A separate watchers table is queryable with standard SQLAlchemy and avoids a complex migration on the existing many-to-many.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@app.on_event("startup")` | `@asynccontextmanager` lifespan | FastAPI 0.95+ | Must register APScheduler in lifespan, not deprecated startup hook |
| APScheduler 4.x `add_schedule()` | APScheduler 3.x `add_job()` | 4.x released 2024 | Stick to 3.x — 4.x has breaking API; codebase uses 3.x idioms |
| `fastapi-mail` MessageType | `MessageType.html` enum value | v1.x | Must use `MessageType.html` (not string `"html"`) for HTML emails |
| TanStack Query v4 `onSuccess` | v5 removes `onSuccess` | v5.0 (2023) | Already applied in Phase 4 (STATE.md decision) — no `onSuccess` in use cases |

**Deprecated/outdated:**
- `@app.on_event("startup")`: Still works but deprecated in FastAPI; use `lifespan` (already what the project uses in `main.py`)
- APScheduler 4.x `add_schedule()` API: Not applicable — use 3.x

---

## Open Questions

1. **`PROJECT_UPDATE` vs `PROJECT_UPDATED` enum value name conflict**
   - What we know: Existing Python enum has `PROJECT_UPDATE = "PROJECT_UPDATE"`. CONTEXT.md specifies `PROJECT_UPDATED` as the new type name.
   - What's unclear: Whether to rename `PROJECT_UPDATE` -> `PROJECT_UPDATED` in the migration (breaking for any existing notification rows with that type) or keep both.
   - Recommendation: Keep `PROJECT_UPDATE` as-is (no existing data to worry about — notifications are not yet wired), add `PROJECT_UPDATED` as the new canonical value in the migration. Use only `PROJECT_UPDATED` going forward and treat `PROJECT_UPDATE` as a legacy stub.

2. **Admin lookup for project event notifications**
   - What we know: `IUserRepository` does not have a `get_all_admins()` method. `SqlAlchemyUserRepository` has `get_all()` (returns all non-deleted users).
   - What's unclear: Whether to add `get_all_by_role(role_name)` to the interface, or query admins inline in the notification service.
   - Recommendation: Add `get_all_by_role(role_name: str) -> List[User]` to `IUserRepository` — consistent with Clean Architecture and needed for the PROJECT_CREATED/DELETED/UPDATED fan-out.

3. **`related_entity_type` field on NotificationModel**
   - What we know: Current `NotificationModel` only has `related_entity_id` (int). Toast navigation needs to distinguish task vs project.
   - What's unclear: Whether to add a `related_entity_type` string column or derive type from `NotificationType`.
   - Recommendation: Add `related_entity_type = Column(String(20), nullable=True)` to `NotificationModel` in the Phase 5 migration. Populate with `"task"` or `"project"`. Derivation from `NotificationType` is brittle if types evolve.

---

## Integration Points (Exact Files)

### Backend — Existing Files to Modify

| File | Change |
|------|--------|
| `app/domain/entities/notification.py` | Add 4+ new enum values to `NotificationType`; rename note for `PROJECT_UPDATE` |
| `app/infrastructure/database/models/notification.py` | Add `related_entity_type` column |
| `app/infrastructure/database/models/__init__.py` | Import new models (notification_preference, task_watcher) |
| `app/infrastructure/config.py` | Add `NOTIFICATION_POLL_INTERVAL_MS: int = 30000` |
| `app/api/main.py` | Register APScheduler in lifespan; import new routers |
| `app/api/dependencies.py` | Add `get_notification_repo`, `get_notification_preference_repo` dependency functions |
| `app/api/v1/tasks.py` | Call `CreateNotificationUseCase` after assign, status change, delete |
| `app/api/v1/comments.py` | Call `CreateNotificationUseCase` after comment create |
| `app/api/v1/projects.py` | Call `CreateNotificationUseCase` after project create/delete/update |
| `Frontend/components/header.tsx` | Wire bell icon with real `useNotifications` hook; replace hardcoded badge "3" |
| `Frontend/app/settings/page.tsx` | Add "Bildirimler" section with preference form |
| `Frontend/components/task-detail/task-sidebar.tsx` | Add "Görevi İzle" toggle button |

### Backend — New Files to Create

| File | Purpose |
|------|---------|
| `app/domain/repositories/notification_repository.py` | `INotificationRepository` interface |
| `app/domain/repositories/notification_preference_repository.py` | `INotificationPreferenceRepository` interface |
| `app/domain/entities/notification_preference.py` | `NotificationPreference` entity |
| `app/application/use_cases/manage_notifications.py` | All notification use cases |
| `app/application/services/notification_service.py` | `INotificationService` abstraction |
| `app/application/dtos/notification_dtos.py` | Response/request DTOs |
| `app/infrastructure/database/models/notification_preference.py` | ORM model |
| `app/infrastructure/database/models/task_watcher.py` | ORM model |
| `app/infrastructure/database/repositories/notification_repo.py` | SQLAlchemy impl |
| `app/infrastructure/database/repositories/notification_preference_repo.py` | SQLAlchemy impl |
| `app/infrastructure/database/migrations/004_phase5_schema.py` | Async lifespan migration |
| `alembic/versions/004_phase5_schema.py` | Alembic migration |
| `app/infrastructure/email/email_service.py` | `send_notification_email()` helper |
| `app/infrastructure/email/templates/*.html` | Jinja2 email templates (4 types) |
| `app/scheduler/jobs.py` | `deadline_alert_job`, `purge_notifications_job` |
| `app/api/v1/notifications.py` | Notification CRUD router |
| `app/api/v1/notification_preferences.py` | Preferences GET/PUT router |

### Frontend — New Files to Create

| File | Purpose |
|------|---------|
| `services/notification-service.ts` | API client for all notification endpoints |
| `hooks/use-notifications.ts` | Polling hook with visibilitychange logic |
| `components/notifications/notification-bell.tsx` | Bell icon + dropdown |
| `components/notifications/notification-item.tsx` | Single notification row |
| `app/notifications/page.tsx` | Full `/notifications` history page |

---

## Validation Architecture

> `nyquist_validation` is explicitly `false` in `.planning/config.json` — this section is skipped per configuration.

---

## Sources

### Primary (HIGH confidence)
- TanStack Query v5 official docs — `refetchInterval` option and `refetchIntervalInBackground`: https://tanstack.com/query/v5/docs/framework/react/reference/useQuery
- fastapi-mail official docs and examples: https://sabuhish.github.io/fastapi-mail/ and https://pypi.org/project/fastapi-mail/
- APScheduler 3.x docs — `AsyncIOScheduler`, `CronTrigger`: https://apscheduler.readthedocs.io/en/3.x/
- PostgreSQL docs — `ALTER TYPE ADD VALUE` transaction constraint: https://www.postgresql.org/docs/current/sql-altertype.html
- Existing codebase — `NotificationModel`, `Notification` entity, `request_password_reset.py` SMTP pattern, `main.py` lifespan pattern

### Secondary (MEDIUM confidence)
- APScheduler 4.x migration guide (confirms 4.x API is breaking — reinforces use of 3.x): https://apscheduler.readthedocs.io/en/master/migration.html
- SQLAlchemy asyncpg ALTER TYPE transaction handling: https://github.com/MagicStack/asyncpg/issues/978

### Tertiary (LOW confidence — supplementary context only)
- FastAPI + APScheduler integration pattern blog posts (multiple sources, consistent with official docs)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries either already installed or verified via PyPI/official docs
- Architecture: HIGH — follows established Clean Architecture patterns already in the codebase
- Migration pitfall (ALTER TYPE): HIGH — verified against official PostgreSQL docs and asyncpg issues
- APScheduler integration: HIGH — confirmed via official 3.x docs; 4.x breaking change confirmed
- TanStack Query polling: HIGH — confirmed via official v5 docs; `refetchIntervalInBackground` bug noted from GitHub issues

**Research date:** 2026-03-16
**Valid until:** 2026-06-16 (90 days — stable libraries, conservative estimate)
