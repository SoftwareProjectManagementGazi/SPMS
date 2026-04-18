# Phase 7: Process Models, Adaptation & Integrations - Research

**Researched:** 2026-04-10
**Domain:** Process template engine, dynamic configuration, webhook-based integrations, SQLAlchemy JSONB, FastAPI adapter pattern
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Add `ITERATIVE = "ITERATIVE"` to `Methodology` enum. Requires Alembic migration using `autocommit_block()` / `AUTOCOMMIT` isolation level (`ALTER TYPE methodology_type ADD VALUE`).

**D-02:** Template payload structure: `columns` (ordered list with name, order, wip_limit), `recurring_tasks` (seeds inserted to `tasks` table at project creation with `is_recurring=true`), `behavioral_flags` (JSONB).

**D-03:** Built-in column sets (Turkish, seeds only, fully customizable after creation):
- SCRUM: İş Birikimi | Yapılacaklar | Devam Eden | İnceleme | Tamamlandı
- KANBAN: Yapılacaklar | Devam Eden (wip_limit: 3) | Test | Tamamlandı
- WATERFALL: Gereksinimler | Tasarım | Geliştirme | Test | Dağıtım
- ITERATIVE: Planlama | Analiz | Geliştirme | Değerlendirme

**D-04:** Auto-created recurring task seeds at project creation. All methodologies get seeds inserted once into `tasks` table; Phase 3 completion-loop handles future recurrences.
- SCRUM: 'Günlük Toplantı' (daily), 'Sprint Değerlendirmesi' (periodic)
- KANBAN: 'Haftalık Senkronizasyon' (weekly)
- WATERFALL: 'Aşama Değerlendirmesi' (milestone-based)
- ITERATIVE: 'İterasyon Planlama' (periodic)

**D-05:** Methodology behavioral flags (defaults, user-overridable), stored as JSONB in `process_config` column on `projects`:
- WATERFALL default: `enforce_sequential_dependencies: true`
- KANBAN default: `enforce_wip_limits: true`
- SCRUM default: `restrict_expired_sprints: true`

**D-06:** WIP limit enforcement is a warning toast only (non-blocking). Toast text: "Uyarı: Bu kolon için belirlenen WIP (Aynı Anda Yapılan İş) limiti aşıldı!" Column header visual: amber at limit, red at 2+ over.

**D-07:** `PROCESS_TEMPLATES` table. 4 built-in templates are hard-locked read-only seeds. Admin can only CRUD custom templates.

**D-08:** Admin template management at `/admin/process-templates`. Admin-only (no PM/TM access). Built-in templates view-only.

**D-09:** Project Settings 'Süreç Modeli' section added to existing Settings tab. Sprint duration, behavioral flag toggles, current methodology badge. Accessible to PM and Admin.

**D-10:** Mid-project methodology change: no data loss, sprint archival if leaving SCRUM, config update, Turkish confirmation dialog.

**D-11:** Admin panel at `/admin`. Two sub-pages: `/admin/process-templates` and `/admin/settings`.

**D-12:** `SYSTEM_CONFIG` table. Parameters: sprint duration (days), max task limit, notification frequency (Anında/Saatlik Özet/Günlük Özet). Backend cached singleton — no restart required.

**D-13:** Reporting module toggle. Off = sidebar nav item removed + `/reports` returns 403. Stored in `SYSTEM_CONFIG`.

**D-14:** UI theming: primary brand color → CSS custom properties. Chart color theme. Status label colors via `board_columns.color`. All stored in `SYSTEM_CONFIG`.

**D-15:** Slack + Microsoft Teams only. Webhook-based (outbound only). No OAuth.

**D-16:** Three trigger events (Turkish messages):
- `project.created` → "🚀 Yeni Proje Oluşturuldu: [Proje Adı]"
- `task.assigned` → "👤 Yeni Görev Atandı: [Görev Adı] → [Atanan Kişi]"
- `task.status_changed` → "[Görev Adı] durumu [Eski Kolon] ➡️ [Yeni Kolon] olarak güncellendi."

**D-17:** `IIntegrationService` interface with `send_event(event_type, payload)`. `SlackIntegrationService` and `TeamsIntegrationService` implement it. Factory/registry maps platform → implementation. New integration = new adapter class only.

**D-18:** Per-project webhook routing stored in `project.process_config` JSONB. Admin master switch in `SYSTEM_CONFIG`. 'Bağlantıyı Test Et' button sends Turkish test payload.

**D-19:** Webhook URLs stored in `process_config` JSONB on project. Backend never exposes raw URL in GET responses.

### Claude's Discretion

- Exact `process_config` JSONB schema (field naming, nested vs flat structure)
- Whether `SYSTEM_CONFIG` is a single-row settings table or key-value store
- Cached singleton implementation pattern for SYSTEM_CONFIG (e.g., TTL cache, invalidation on PUT)
- CSS custom property injection strategy in Next.js (layout.tsx `<style>` tag with dynamic values vs. CSS-in-JS)
- `/admin` layout structure (sidebar tabs vs. top nav for Process Templates / System Settings)
- Exact Slack Block Kit vs. simple text payload format
- Backend service registration pattern for IIntegrationService factory

### Deferred Ideas (OUT OF SCOPE)

- Google Calendar integration
- Start-to-start dependency visual arrows in Gantt
- WIP limit hard block variant
- Sprint/Phase assignment directly from Kanban board (drag card into sprint lane)
- Real-time WebSocket-based integration events
- Per-user webhook preference
- Google Calendar OAuth two-way sync
- GDPR full data export / deletion right
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROC-01 | Project creation allows selecting Scrum, Waterfall, Kanban, Iterative methodology | D-01 adds ITERATIVE enum; `ProjectCreation` component needs ITERATIVE card; `process-templates.ts` needs ITERATIVE entry |
| PROC-02 | Selected methodology auto-creates board structure (columns) from template | `ProcessTemplateFactory` use case seeds columns from built-in/custom template definitions at project creation |
| PROC-03 | User can customize process template (activity ordering, sprint duration, meeting periods) | Project Settings 'Süreç Modeli' section with behavioral flags + sprint duration input; PATCH `/projects/{id}` |
| PROC-04 | New process models can be defined (admin level) | `PROCESS_TEMPLATES` table + `/admin/process-templates` CRUD; custom templates appear in methodology dropdown |
| PROC-05 | Selected methodology auto-plans calendar and recurring events | Recurring task seeds inserted at project creation; Phase 3 completion-loop handles future instances |
| ADAPT-01 | Project-level methodology change (affects that project only) | PATCH `/projects/{id}` with methodology change logic; sprint archival for SCRUM departure |
| ADAPT-02 | Admin can define new templates or edit existing ones | `/admin/process-templates` CRUD; PUT/PATCH `/process-templates/{id}` |
| ADAPT-03 | UI elements (color palette, status labels) configurable at org level | `SYSTEM_CONFIG` theme fields; CSS custom property injection on frontend |
| ADAPT-04 | Modules can be toggled active/inactive per installation | Reporting module toggle in `SYSTEM_CONFIG`; conditional sidebar render + 403 on `/reports` |
| ADAPT-05 | System parameters (sprint duration, task limit, notification frequency) editable from admin panel | `SYSTEM_CONFIG` table + `/admin/settings` PUT endpoint |
| ADAPT-06 | Adaptation actions require no server restart | Cached `SYSTEM_CONFIG` singleton with invalidation on update; CSS vars applied dynamically |
| EXT-01 | Third-party integration infrastructure + at least one example (Slack/Teams) | `IIntegrationService` interface + `SlackIntegrationService` + `TeamsIntegrationService` |
| EXT-02 | Integrations kept in independent service layer; no impact on core | `Backend/app/infrastructure/integrations/` directory; integration triggered post-event, not inside use case |
| EXT-03 | External data sharing requires user permission | Per-project opt-in webhook URL configuration; admin master switch |
| EXT-04 | Integration API keys stored securely | Webhook URLs in `process_config` JSONB; never returned in GET responses |
| EXT-05 | Adding new integration requires no changes to existing modules | Adapter pattern: new class only; factory registration; no core changes |
</phase_requirements>

---

## Summary

Phase 7 delivers three subsystems on top of a stable 6-phase foundation: (1) a process template engine that seeds board columns, recurring tasks, and behavioral flags when a project is created; (2) an admin configuration panel for global system parameters, module toggles, and UI theming without server restarts; and (3) a webhook-based external integration layer for Slack and Microsoft Teams using an adapter/factory pattern.

The existing codebase is well-prepared for this phase. The `Methodology` enum, `ProjectModel`, `BoardColumnModel` (with `wip_limit` column already present), and `CreateProjectUseCase` are all in place. The Phase 5 `INotificationService` abstraction is the direct pattern mirror for `IIntegrationService`. The Phase 4 dnd-kit board, `sonner` toast system, and `ConfirmDialog` are all reusable unchanged. The migration pattern (async `upgrade()` function + `AUTOCOMMIT` for enum DDL) is established through migration_004.

The main new infrastructure is: two new database tables (`process_templates`, `system_config`), one new JSONB column on `projects` (`process_config`), a new domain interface and two integration adapters, the `/admin` route space, and extensions to the Project Settings tab and Kanban board column header.

**Primary recommendation:** Follow the established clean architecture layering (domain interface → infrastructure adapter → dependency injection), use the Phase 5 migration pattern for the ITERATIVE enum DDL, and store all dynamic configuration in `SYSTEM_CONFIG` with a module-level cached singleton that invalidates on PUT.

---

## Standard Stack

### Core (already installed — no new installs required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | existing | API framework | Project standard |
| SQLAlchemy (async) | existing | ORM + raw SQL | Project standard |
| asyncpg | existing | PostgreSQL async driver | Project standard |
| Pydantic v2 | existing | DTOs, domain entities | Project standard |
| Next.js (App Router) | existing | Frontend framework | Project standard |
| @tanstack/react-query v5 | existing | Server state management | Project standard; React Query v5 note: no `onSuccess` in `useQuery` (use `useEffect`) |
| dnd-kit | existing | Drag-and-drop (Kanban WIP enforcement) | Phase 4 established |
| sonner | existing | Toast notifications | Phase 4 established |
| shadcn/ui (new-york preset) | existing | Component library | Project standard |
| Tailwind CSS | existing | Styling | Project standard |

### New Dependencies

None required. All libraries needed for Phase 7 are already installed. The integration HTTP calls use Python's built-in `httpx` (already in Backend .venv) or `aiohttp`. Verify availability:

```bash
cd /Users/ayseoz/Desktop/project-management-system/Backend
.venv/bin/python -c "import httpx; print(httpx.__version__)"
```

If `httpx` is not available, `aiohttp` is the fallback. Both support async HTTP POST for webhook delivery.

**Version verification (key packages already installed):**
- `wip_limit` column already exists on `board_columns` table (confirmed in `board_column.py` line 12)
- `custom_fields` JSON column already on `ProjectModel` — evaluate reuse vs. dedicated `process_config` JSONB column (recommendation: dedicated column for clarity)
- `process-templates.ts` client-side template file already exists but uses English column names and lacks ITERATIVE — must be updated

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
Backend/app/
  domain/
    interfaces/
      integration_service.py         # IIntegrationService interface (mirrors INotificationService)
  infrastructure/
    integrations/
      __init__.py
      slack_integration_service.py   # SlackIntegrationService
      teams_integration_service.py   # TeamsIntegrationService
      integration_factory.py         # Registry: platform str → IIntegrationService
    database/
      models/
        process_template.py          # ProcessTemplateModel
        system_config.py             # SystemConfigModel
      migrations/
        migration_005.py             # Phase 7 schema: enum + new tables + process_config column
  application/
    use_cases/
      manage_process_templates.py    # CRUD use cases for ProcessTemplate
      manage_system_config.py        # Get/update use cases for SystemConfig
    services/
      system_config_service.py       # Cached singleton; invalidated on PUT
  api/
    v1/
      process_templates.py           # /api/v1/process-templates router
      admin_settings.py              # /api/v1/admin/settings router

Frontend/
  app/
    admin/
      page.tsx                       # Admin layout with Tabs (Process Templates / System Settings)
  services/
    process-template-service.ts      # CRUD calls for /process-templates
    admin-settings-service.ts        # GET/PUT for /admin/settings
  components/
    admin/
      process-templates-tab.tsx      # Template list table + create/edit dialog
      system-settings-tab.tsx        # System params + module toggles + theming
    project/
      process-model-settings.tsx     # 'Süreç Modeli' section for Project Settings tab
      integration-settings.tsx       # 'Entegrasyonlar' section for Project Settings tab
```

### Pattern 1: IIntegrationService Adapter (mirrors Phase 5 INotificationService)

**What:** Domain interface with a single `send_event` method. Concrete adapters implement it. A factory maps platform name to implementation.

**When to use:** Any new outbound integration. Adding Google Calendar later = new adapter class only.

```python
# Backend/app/domain/interfaces/integration_service.py
from abc import ABC, abstractmethod
from typing import Any, Dict

class IIntegrationService(ABC):
    @abstractmethod
    async def send_event(self, event_type: str, payload: Dict[str, Any]) -> None:
        """Fire-and-forget: send event to external platform. Silently skip on failure."""
        ...
```

```python
# Backend/app/infrastructure/integrations/slack_integration_service.py
import httpx
from app.domain.interfaces.integration_service import IIntegrationService

class SlackIntegrationService(IIntegrationService):
    def __init__(self, webhook_url: str):
        self._webhook_url = webhook_url

    async def send_event(self, event_type: str, payload: dict) -> None:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(self._webhook_url, json={"text": payload.get("message", "")})
        except Exception:
            pass  # Fire-and-forget; never raise into caller
```

```python
# Backend/app/infrastructure/integrations/integration_factory.py
from app.domain.interfaces.integration_service import IIntegrationService
from app.infrastructure.integrations.slack_integration_service import SlackIntegrationService
from app.infrastructure.integrations.teams_integration_service import TeamsIntegrationService

_REGISTRY = {
    "slack": SlackIntegrationService,
    "teams": TeamsIntegrationService,
}

def get_integration_service(platform: str, webhook_url: str) -> IIntegrationService:
    cls = _REGISTRY.get(platform.lower())
    if cls is None:
        raise ValueError(f"Unknown integration platform: {platform}")
    return cls(webhook_url)
```

### Pattern 2: SYSTEM_CONFIG Cached Singleton

**What:** Single-row (or key-value) DB table read on first access and cached in memory. Invalidated when admin performs a PUT. No restart required.

**When to use:** Any setting that must take effect immediately without restart.

**Recommendation for table structure:** Key-value store (`key TEXT PRIMARY KEY, value TEXT`) is simpler to extend. Single-row alternative is also valid but requires migration to add columns. Key-value is preferred for ADAPT-06 extensibility.

```python
# Backend/app/application/services/system_config_service.py
import asyncio
from typing import Optional, Dict, Any

_cache: Optional[Dict[str, Any]] = None
_cache_lock = asyncio.Lock()

async def get_system_config(repo) -> Dict[str, Any]:
    global _cache
    if _cache is not None:
        return _cache
    async with _cache_lock:
        if _cache is None:
            _cache = await repo.get_all()
    return _cache

async def invalidate_cache() -> None:
    global _cache
    _cache = None
```

**Note:** This is a module-level singleton (process-scoped). In a multi-worker deployment with multiple uvicorn processes, each process has its own cache — a PUT to one worker invalidates only that worker's cache. For this project (single uvicorn process in development), this is acceptable. The planner does not need to address multi-worker cache invalidation.

### Pattern 3: process_config JSONB on projects

**Recommendation for the discretion item:** Use a dedicated `process_config` JSONB column on `projects` (not repurposing `custom_fields`). The semantic distinction matters: `custom_fields` is user-defined metadata; `process_config` is system-managed methodology state.

**Recommended schema (flat, not nested):**
```json
{
  "methodology": "SCRUM",
  "sprint_duration_days": 14,
  "enforce_sequential_dependencies": false,
  "enforce_wip_limits": false,
  "restrict_expired_sprints": true,
  "integrations": {
    "platform": "slack",
    "webhook_url": "https://hooks.slack.com/..."
  }
}
```

Flat structure is easier to PATCH incrementally. The `integrations` sub-key is the only nested object, containing only `platform` and `webhook_url`.

### Pattern 4: Integration Event Triggering (fire-and-forget after response)

**What:** Integration events are triggered AFTER the use case succeeds, in the API router, using `asyncio.create_task()` for non-blocking dispatch. Never inside the use case itself (clean architecture boundary).

**When to use:** All three event triggers (project.created, task.assigned, task.status_changed).

```python
# In projects.py router, after create_project use case succeeds:
import asyncio

async def _fire_integration_event(project_process_config, event_type, payload):
    """Non-blocking: check admin master switch + project webhook config."""
    config = await system_config_service.get_system_config(config_repo)
    if not config.get("integrations_enabled", True):
        return
    integrations = (project_process_config or {}).get("integrations", {})
    webhook_url = integrations.get("webhook_url")
    platform = integrations.get("platform")
    if webhook_url and platform:
        svc = get_integration_service(platform, webhook_url)
        await svc.send_event(event_type, payload)

# After project creation:
asyncio.create_task(
    _fire_integration_event(
        project.process_config,
        "project.created",
        {"message": f"🚀 Yeni Proje Oluşturuldu: {project.name}"}
    )
)
```

### Pattern 5: Migration 005 for Phase 7 Schema

**What:** Follows the established `migration_004.py` pattern — idempotent async `upgrade(engine)` function. Two sections: AUTOCOMMIT block for enum DDL, regular transaction for table/column DDL.

```python
# Backend/app/infrastructure/database/migrations/migration_005.py
async def upgrade(engine: AsyncEngine) -> None:
    # Section 1: AUTOCOMMIT for ALTER TYPE ADD VALUE
    autocommit_engine = engine.execution_options(isolation_level="AUTOCOMMIT")
    async with autocommit_engine.connect() as conn:
        if not await _enum_value_exists(conn, "methodology_type", "ITERATIVE"):
            await conn.execute(text(
                "ALTER TYPE methodology_type ADD VALUE IF NOT EXISTS 'ITERATIVE'"
            ))

    # Section 2: Regular transaction for new tables + columns
    async with engine.begin() as conn:
        # ADD process_config JSONB to projects
        if not await _column_exists(conn, "projects", "process_config"):
            await conn.execute(text(
                "ALTER TABLE projects ADD COLUMN process_config JSONB"
            ))
        # CREATE process_templates table
        if not await _table_exists(conn, "process_templates"):
            await conn.execute(text("""
                CREATE TABLE process_templates (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
                    columns JSONB NOT NULL DEFAULT '[]',
                    recurring_tasks JSONB NOT NULL DEFAULT '[]',
                    behavioral_flags JSONB NOT NULL DEFAULT '{}',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                )
            """))
        # CREATE system_config table (key-value store)
        if not await _table_exists(conn, "system_config"):
            await conn.execute(text("""
                CREATE TABLE system_config (
                    key VARCHAR(100) PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                )
            """))
```

**Register in `lifespan`** in `main.py` following the existing pattern (after upgrade_004):
```python
from app.infrastructure.database.migrations.migration_005 import upgrade as upgrade_005
await upgrade_005(engine)
```

### Pattern 6: Admin Route Guard

**What:** Use `_is_admin()` from `app.api.dependencies` as a FastAPI `Depends()`. Pattern already established in existing code.

```python
# Backend/app/api/v1/process_templates.py
from app.api.dependencies import get_current_user, _is_admin
from app.domain.entities.user import User

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not _is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return current_user
```

**Frontend guard:** Check `currentUser?.role?.name?.toLowerCase() === "admin"` in admin page; redirect to `/` with sonner toast "Bu sayfaya erişim yetkiniz yok." on non-admin access.

### Pattern 7: CSS Custom Property Injection in Next.js

**Recommendation for the discretion item:** Inject dynamic CSS variables from `SYSTEM_CONFIG` via a `<style>` tag in `layout.tsx`, rendered server-side with the current config values and invalidated via React Query on SYSTEM_CONFIG changes.

```tsx
// Frontend/app/layout.tsx — add dynamic style injection
// Fetch SYSTEM_CONFIG theme values on page load; inject as CSS custom properties
// Example: --primary: oklch(0.55 0.22 264) → replaced by admin-configured hex value
// Use a React Query-driven <style> tag in a client component wrapper
```

This avoids CSS-in-JS runtime overhead. The admin settings form calls `queryClient.invalidateQueries({ queryKey: ['system-config'] })` on successful save, triggering refetch and re-render of the style tag.

### Anti-Patterns to Avoid

- **Never call `IIntegrationService.send_event()` inside a use case.** Integration is infrastructure; use cases must stay clean. Trigger from the router post-response.
- **Never block the HTTP response on webhook delivery.** Use `asyncio.create_task()` so integration failures don't slow down or fail the user-facing request.
- **Never expose `webhook_url` in GET `/projects/{id}` responses.** Omit from `ProjectResponseDTO`. The URL is write-only (frontend stores it after PATCH, never reads it back from GET).
- **Never run `ALTER TYPE ADD VALUE` inside a transaction.** This is a PostgreSQL constraint. Always use the `AUTOCOMMIT` isolation level pattern from Phase 5.
- **Never seed built-in templates via the `process_templates` table on first migration.** Built-in templates should be defined as Python constants in a `BUILTIN_TEMPLATES` dict in the use case layer. The DB table holds custom templates only. The 4 built-ins are assembled at runtime from code, not from DB rows.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP POST for webhooks | Custom urllib/socket code | `httpx` async client | Timeout handling, connection pooling, proper error handling |
| JSON column type | Custom serialization | SQLAlchemy `JSON` type (already used in `ProjectModel.custom_fields`) | Handles serialization/deserialization; works with asyncpg |
| TTL cache | Custom timer logic | Module-level dict with `asyncio.Lock()` invalidated on PUT | Simple, zero-dependency, proven in similar projects |
| CSS variable injection | Tailwind JIT recompilation | `<style>` tag with inline CSS custom properties | No build step; instant; works with shadcn's CSS variable system |
| Admin role check | New auth middleware | `_is_admin()` from `app.api.dependencies` (already exists) | Already used project-wide; consistent; zero new code |
| Enum extension migration | Alembic autogenerate | Manual `ALTER TYPE ADD VALUE IF NOT EXISTS` with AUTOCOMMIT | Alembic autogenerate cannot handle `ADD VALUE`; AUTOCOMMIT pattern proven in Phase 5 |

**Key insight:** The integration infrastructure cost is low because the project already has the `INotificationService` pattern established. `IIntegrationService` is structurally identical — same interface shape, same factory registration, same call site pattern.

---

## Common Pitfalls

### Pitfall 1: ITERATIVE Enum Migration Must Use AUTOCOMMIT
**What goes wrong:** If `ALTER TYPE methodology_type ADD VALUE 'ITERATIVE'` runs inside a transaction block, PostgreSQL raises `ERROR: ALTER TYPE ... ADD VALUE cannot run inside a transaction block`.
**Why it happens:** PostgreSQL cannot add enum values transactionally.
**How to avoid:** Use the exact pattern from `migration_004.py` lines 68-76: `engine.execution_options(isolation_level="AUTOCOMMIT")` before the ADD VALUE statement.
**Warning signs:** `sqlalchemy.exc.InternalError: (asyncpg.exceptions.ActiveSQLTransactionError)` in startup logs.

### Pitfall 2: Frontend Methodology Type Mismatch
**What goes wrong:** `lib/types.ts` defines `Methodology = "scrum" | "kanban" | "waterfall"` (lowercase). The backend uses `SCRUM/KANBAN/WATERFALL/ITERATIVE` (uppercase). The project-creation component converts to uppercase before sending (`methodology: selectedMethodology.toUpperCase()`). Adding `iterative` must follow the same pattern.
**Why it happens:** Type was defined before the uppercase/lowercase convention was clarified.
**How to avoid:** Add `"iterative"` to the union type in `lib/types.ts`. The `process-templates.ts` template id uses lowercase `"iterative"`. The `toUpperCase()` call in the submit handler handles the conversion.
**Warning signs:** Backend returns 422 Unprocessable Entity on project creation when ITERATIVE is selected.

### Pitfall 3: process_config JSONB Not Returned in GET /projects/{id}
**What goes wrong:** `ProjectResponseDTO` does not include `process_config`. The frontend cannot read behavioral flags, sprint duration, or integration settings.
**Why it happens:** `process_config` is a new column; existing DTO must be extended.
**How to avoid:** Add `process_config: Optional[Dict[str, Any]] = None` to `ProjectResponseDTO`. Mask the `integrations.webhook_url` field (set to `None`) in the response mapper — never expose raw webhook URLs.

### Pitfall 4: SYSTEM_CONFIG Cached Singleton — Cache Not Invalidated After PUT
**What goes wrong:** Admin updates a system parameter via PUT `/admin/settings`, but the backend still serves the old cached value for subsequent GET requests because the cache was not invalidated.
**Why it happens:** The cached singleton pattern requires explicit invalidation.
**How to avoid:** The `update_system_config` use case (or the PUT endpoint handler) must call `await invalidate_cache()` after writing to DB. Order: write → invalidate → return response.

### Pitfall 5: Integration Events Not Fired from PATCH /tasks/{id}
**What goes wrong:** `task.assigned` and `task.status_changed` events exist in the router but the router currently does not call integration services. The integration fire point must be added to both PUT and PATCH handlers (both exist at lines 144 and 227 in `tasks.py`).
**Why it happens:** Integration layer is new in Phase 7 — not wired in earlier phases.
**How to avoid:** Both `update_task` (PUT) and `patch_task` (PATCH) handlers need the fire-and-forget integration call after the existing notification code. Follow the existing `asyncio.gather()` pattern for fan-out.

### Pitfall 6: Mid-Project SCRUM → Other Methodology Does Not Archive Sprints
**What goes wrong:** Sprints remain active after methodology change, causing state inconsistency.
**Why it happens:** The `UpdateProjectUseCase` currently only updates fields from DTO; it has no sprint archival logic.
**How to avoid:** In `UpdateProjectUseCase.execute()` (or the router handler), when `dto.methodology` is set and the old methodology was `SCRUM` and the new one is not `SCRUM`: query all sprints with `is_active=True` for the project and set `is_active=False` (soft-close). Never delete sprint records.

### Pitfall 7: Webhook URL Security — url Exposed in GET Response
**What goes wrong:** If `process_config` is returned verbatim in `ProjectResponseDTO`, the webhook URL is visible to all project members, not just admins/PM.
**Why it happens:** Default DTO serialization includes all fields.
**How to avoid:** In the project response mapper, always strip or null-out `process_config.integrations.webhook_url` before returning. Frontend only writes the URL on save; never reads it back to display.

### Pitfall 8: process-templates.ts Column Names Are English, Not Turkish
**What goes wrong:** The existing `Frontend/lib/process-templates.ts` has English column names ("Backlog", "Selected", "In Progress", etc.). These are what get sent to the backend as column names at project creation. Decision D-03 mandates Turkish column names.
**Why it happens:** `process-templates.ts` was created before the Turkish-language decision was locked.
**How to avoid:** Update `process-templates.ts` column arrays to match D-03 exactly: SCRUM → ["İş Birikimi", "Yapılacaklar", "Devam Eden", "İnceleme", "Tamamlandı"], etc. Add ITERATIVE entry. The `ProjectCreateDTO.columns` default (currently English) should also be updated.

### Pitfall 9: Board-Tab WIP Warning Toast Requires Column Count at Drop Time
**What goes wrong:** The `handleDragEnd` in `board-tab.tsx` must know the WIP limit of the destination column AND the current task count after the drop in order to show the warning toast. The column data is available from the `columns` query; the count is available from `tasksByColumn`.
**Why it happens:** The toast condition check must happen after the `pendingMove` optimistic state is applied.
**How to avoid:** In `handleDragEnd`, after setting `pendingMove`, compute `destColumnTasks = (tasksByColumn[destColId] ?? []).length + 1` and compare with `destCol.wip_limit`. Fire `toast.warning(...)` if over limit. The `pendingMove` state triggers a re-render that updates the column badge color.

---

## Code Examples

### ITERATIVE in Python Methodology Enum
```python
# Backend/app/domain/entities/project.py
class Methodology(str, Enum):
    SCRUM = "SCRUM"
    KANBAN = "KANBAN"
    WATERFALL = "WATERFALL"
    ITERATIVE = "ITERATIVE"  # D-01 addition
```

### ITERATIVE in Frontend types.ts
```typescript
// Frontend/lib/types.ts
export type Methodology = "scrum" | "kanban" | "waterfall" | "iterative"
```

### Template Seeding in CreateProjectUseCase (D-02, D-03, D-04)
```python
# Backend/app/application/use_cases/manage_projects.py
BUILTIN_TEMPLATES = {
    Methodology.SCRUM: {
        "columns": [
            {"name": "İş Birikimi", "order": 0, "wip_limit": 0},
            {"name": "Yapılacaklar", "order": 1, "wip_limit": 0},
            {"name": "Devam Eden", "order": 2, "wip_limit": 0},
            {"name": "İnceleme", "order": 3, "wip_limit": 0},
            {"name": "Tamamlandı", "order": 4, "wip_limit": 0},
        ],
        "recurring_tasks": [
            {"title": "Günlük Toplantı", "recurrence_interval": "daily"},
            {"title": "Sprint Değerlendirmesi", "recurrence_interval": "weekly"},
        ],
        "behavioral_flags": {"restrict_expired_sprints": True},
    },
    Methodology.KANBAN: {
        "columns": [
            {"name": "Yapılacaklar", "order": 0, "wip_limit": 0},
            {"name": "Devam Eden", "order": 1, "wip_limit": 3},
            {"name": "Test", "order": 2, "wip_limit": 0},
            {"name": "Tamamlandı", "order": 3, "wip_limit": 0},
        ],
        "recurring_tasks": [
            {"title": "Haftalık Senkronizasyon", "recurrence_interval": "weekly"},
        ],
        "behavioral_flags": {"enforce_wip_limits": True},
    },
    # WATERFALL and ITERATIVE follow same pattern...
}
```

### process_config Default at Project Creation
```python
# In CreateProjectUseCase.execute() — inject process_config with methodology defaults
from app.domain.entities.project import Methodology

DEFAULT_BEHAVIORAL_FLAGS = {
    Methodology.SCRUM:       {"restrict_expired_sprints": True, "enforce_wip_limits": False, "enforce_sequential_dependencies": False},
    Methodology.KANBAN:      {"enforce_wip_limits": True, "restrict_expired_sprints": False, "enforce_sequential_dependencies": False},
    Methodology.WATERFALL:   {"enforce_sequential_dependencies": True, "enforce_wip_limits": False, "restrict_expired_sprints": False},
    Methodology.ITERATIVE:   {"enforce_sequential_dependencies": False, "enforce_wip_limits": False, "restrict_expired_sprints": False},
}

process_config = {
    "methodology": dto.methodology.value,
    "sprint_duration_days": 14,
    **DEFAULT_BEHAVIORAL_FLAGS.get(dto.methodology, {}),
    "integrations": {},
}
```

### reports/page.tsx isScrum Update
```typescript
// Frontend/app/reports/page.tsx, ~line 79
// Before: const isScrum = !methodology || methodology === "SCRUM";
// After:
const isScrum = !methodology || methodology === "SCRUM" || methodology === "ITERATIVE";
// Note: per CONTEXT.md specifics section — verify ITERATIVE routes to sprint path
// The existing code `!methodology || methodology === "SCRUM"` already handles non-Scrum
// correctly; ITERATIVE should be treated as non-sprint (like KANBAN/WATERFALL)
// Correct interpretation: ITERATIVE should NOT be treated as SCRUM for reports
// isScrum stays as-is; ITERATIVE will naturally fall to the non-sprint report path
```

### Slack Webhook Payload (simple text, not Block Kit)
```python
# Backend/app/infrastructure/integrations/slack_integration_service.py
# Simple text payload — no Slack Block Kit required per discretion
payload = {"text": message_text}
# For Teams, the payload structure differs:
# {"@type": "MessageCard", "text": message_text}
```

---

## Runtime State Inventory

Step 2.5: NOT APPLICABLE — Phase 7 is a greenfield feature addition, not a rename/refactor/migration. No existing runtime state references strings being changed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend build | ✓ | v25.2.1 | — |
| Python 3 | Backend | ✓ | 3.13.5 | — |
| PostgreSQL | All DB operations | assumed running (project runs) | — | — |
| httpx (async) | Webhook HTTP calls | verify before use | — | aiohttp (likely already installed) |
| shadcn/ui components | Admin UI | ✓ | All required components already installed per UI-SPEC | — |

**Check httpx availability:**
```bash
cd /Users/ayseoz/Desktop/project-management-system/Backend && .venv/bin/python -c "import httpx; print(httpx.__version__)"
```

If missing: `cd Backend && .venv/bin/pip install httpx` (lightweight, no conflicts).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Global config in env vars only | Dynamic `SYSTEM_CONFIG` DB table + cached singleton | Phase 7 | No restart required; admin-editable at runtime |
| Hard-coded board columns at project creation | Template engine with `BUILTIN_TEMPLATES` dict | Phase 7 | Methodology-appropriate columns auto-seeded |
| No integration layer | `IIntegrationService` adapter pattern | Phase 7 | New integrations = new adapter class only |
| `Methodology` enum with 3 values | Extended to 4 values (+ ITERATIVE) | Phase 7 | Requires AUTOCOMMIT enum DDL migration |
| `custom_fields` JSON for all project metadata | Dedicated `process_config` JSONB | Phase 7 | Clean semantic separation; behavioral flags accessible directly |

**Deprecated/outdated:**
- `process-templates.ts` English column names: replace with Turkish per D-03
- `ProjectCreateDTO.columns` default ("Backlog", "Todo", etc.): will be bypassed by template seeding; the default can remain as English fallback for projects created without methodology selection (though methodology is now required)
- `Methodology` type in `lib/types.ts` without ITERATIVE: must be extended

---

## Open Questions

1. **Should recurring task seeds use the `series_id` UUID linkage from Phase 3?**
   - What we know: Phase 3 introduced `series_id` for grouping recurring task instances. Seeds are the first instance; future instances are spawned by the completion-loop.
   - What's unclear: Whether seeds need a `series_id` pre-assigned at creation time or if the completion-loop assigns one when spawning the second instance.
   - Recommendation: Assign a `series_id` UUID to each seed at creation time. The completion-loop already handles same-series linkage. This ensures the "edit all / edit this" dialog works correctly from the seed task.

2. **SYSTEM_CONFIG table: key-value vs. single-row?**
   - What we know: Both approaches work. Key-value is more extensible. Single-row is simpler to query in one call.
   - Recommendation: Key-value store (`key VARCHAR PRIMARY KEY, value TEXT`). Use a `get_all()` repository method that returns `Dict[str, str]` and a thin service layer that coerces types (int, bool, etc.).

3. **Does `ProjectUpdateDTO` need `methodology` and `process_config` added, or should methodology change be a separate endpoint?**
   - What we know: `ProjectUpdateDTO` already has `methodology: Optional[Methodology]`. The sprint archival logic on SCRUM departure needs to be handled somewhere.
   - Recommendation: Keep as a single PATCH `/projects/{id}` endpoint. Add `process_config: Optional[Dict[str, Any]] = None` to `ProjectUpdateDTO`. The router handler checks if `dto.methodology` changed from SCRUM and triggers sprint archival before calling the use case.

4. **Where does the `color` field on `board_columns` stand?**
   - What we know: `board_columns` table was confirmed NOT to have a `color` column in the current `board_column.py` model. D-14 and UI-SPEC reference `board_columns.color`. CONTEXT.md canonical refs say "check if wip_limit column already exists" — `wip_limit` IS already there (line 12).
   - What's unclear: Does `color` already exist in the DB (added by a migration not reflected in the model), or does it need to be added?
   - Recommendation: Add `color VARCHAR(7) DEFAULT '#6366f1'` to `BoardColumnModel` in migration_005. The planner should include this as a required DB change.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `Backend/app/domain/entities/project.py` — Methodology enum, Project entity
- Direct code inspection: `Backend/app/infrastructure/database/models/project.py` — ProjectModel, existing JSON column
- Direct code inspection: `Backend/app/infrastructure/database/models/board_column.py` — wip_limit confirmed, color NOT present
- Direct code inspection: `Backend/app/infrastructure/database/migrations/migration_004.py` — AUTOCOMMIT pattern for enum DDL
- Direct code inspection: `Backend/app/api/v1/tasks.py` — existing status change notification hook location
- Direct code inspection: `Backend/app/api/main.py` — lifespan pattern, router registration
- Direct code inspection: `Frontend/lib/process-templates.ts` — existing template structure, English column names
- Direct code inspection: `Frontend/lib/types.ts` — Methodology type (lowercase, 3 values)
- Direct code inspection: `Frontend/app/projects/[id]/page.tsx` — Settings tab structure, existing components
- Direct code inspection: `Frontend/components/project/board-tab.tsx` — dnd-kit drag end handler, WIP badge location
- Direct code inspection: `Frontend/app/reports/page.tsx` line 79 — `isScrum` check

### Secondary (MEDIUM confidence)
- Phase 5 CONTEXT.md decisions (from STATE.md) — INotificationService abstraction pattern for IIntegrationService
- Phase 4 CONTEXT.md decisions (from STATE.md) — dnd-kit callback structure, WIP limit deferral, ConfirmDialog pattern
- Slack webhooks: simple JSON `{"text": "..."}` POST to webhook URL — well-established pattern
- Microsoft Teams incoming webhooks: `{"@type": "MessageCard", "text": "..."}` — well-established pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and verified in codebase
- Architecture: HIGH — patterns directly derived from existing Phase 5 INotificationService + Phase 4 DnD structure
- Pitfalls: HIGH — derived from actual code inspection (type mismatches, missing color column, etc.)
- Integration patterns: HIGH — Slack/Teams webhook formats are stable and well-documented

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable domain — webhook APIs and SQLAlchemy patterns change infrequently)
