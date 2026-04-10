# Phase 7: Process Models, Adaptation & Integrations - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Admins can define and select process model templates (Scrum, Kanban, Waterfall, Iterative + custom admin-defined), organizations can configure system-wide settings from an admin panel without restarting the server, and the system integrates with Slack and Microsoft Teams via a pluggable integration service layer.

Three sub-systems delivered:
1. **Process Model Templates** (PROC-01 to PROC-05) — methodology selection at project creation auto-seeds board columns, recurring tasks, sprint duration, and behavioral flags
2. **Adaptive Configuration** (ADAPT-01 to ADAPT-06) — admin panel at `/admin` for global system params, module toggles, custom template management, theming
3. **External Integrations** (EXT-01 to EXT-05) — Slack + Microsoft Teams via `IIntegrationService` adapter pattern; per-project webhook routing with admin master switch

Requirements in scope: PROC-01, PROC-02, PROC-03, PROC-04, PROC-05, ADAPT-01, ADAPT-02, ADAPT-03, ADAPT-04, ADAPT-05, ADAPT-06, EXT-01, EXT-02, EXT-03, EXT-04, EXT-05.

</domain>

<decisions>
## Implementation Decisions

### Process Template Content (PROC-01, PROC-02, PROC-05)

**D-01: ITERATIVE methodology must be added.** The current `Methodology` enum (SCRUM, KANBAN, WATERFALL) is missing ITERATIVE. Add `ITERATIVE = "ITERATIVE"` to the Python enum and Frontend `Methodology` type. Requires an Alembic migration using the `autocommit_block()` pattern (same as Phase 5 `ALTER TYPE ADD VALUE` DDL).

**D-02: Template payload structure (SDD §5.5.2).** Each template defines:
- `columns`: ordered list with `name` (Turkish), `order`, `wip_limit` (nullable, only relevant for Kanban)
- `recurring_tasks`: list of task seeds (inserted into `tasks` table at project creation with `is_recurring=true`, `recurrence_type`, `recurrence_end_date`)
- `behavioral_flags`: JSONB — methodology-specific defaults (see D-05)

**D-03: Built-in column sets (fully in Turkish, per SDD §5.5.1 / §5.5.3 — initial seeds only, fully customizable after creation):**
- **SCRUM:** İş Birikimi | Yapılacaklar | Devam Eden | İnceleme | Tamamlandı
- **KANBAN:** Yapılacaklar | Devam Eden (wip_limit: 3) | Test | Tamamlandı
- **WATERFALL:** Gereksinimler | Tasarım | Geliştirme | Test | Dağıtım
- **ITERATIVE:** Planlama | Analiz | Geliştirme | Değerlendirme

These are seeds only. Project Manager has full flexibility to add, rename, reorder, or delete columns after creation.

**D-04: Auto-created recurring tasks at project creation (per SDD §5.2.3 completion-loop reliance).** All methodologies get seeds inserted ONCE into the `tasks` table at project creation. The Phase 3 completion-generation loop (when task moved to Done → spawn next instance) handles future recurrences automatically. Seeds:
- **SCRUM:** 'Günlük Toplantı' (recurrence_type: daily), 'Sprint Değerlendirmesi' (periodic)
- **KANBAN:** 'Haftalık Senkronizasyon' (recurrence_type: weekly)
- **WATERFALL:** 'Aşama Değerlendirmesi' (milestone-based)
- **ITERATIVE:** 'İterasyon Planlama' (periodic)

Project Manager has full UI flexibility to enable, disable, edit, or delete these after creation. They are seeds, not mandatory events.

**D-05: Methodology-specific behavioral flags (defaults, all user-overridable via Project Settings).** Stored as JSONB in a `process_config` column on the `projects` table:
- **WATERFALL default:** `enforce_sequential_dependencies: true`
- **KANBAN default:** `enforce_wip_limits: true`
- **SCRUM default:** `restrict_expired_sprints: true`
- All other methodology × flag combinations default to false

Project Manager / Admin can toggle any flag ON or OFF for any project at any time (not locked to methodology).

**D-06: WIP limit enforcement is a warning toast, not a hard block.** When a column exceeds WIP limit during drag-and-drop (dnd-kit from Phase 4):
- Show a non-blocking warning toast in Turkish: "Uyarı: Bu kolon için belirlenen WIP (Aynı Anda Yapılan İş) limiti aşıldı!"
- Visually update the column header/badge (amber/red color + alert icon via Tailwind/shadcn) when the column is over limit
- Use the exact same dnd-kit callback structure and sonner toast system from Phase 4

---

### Template Customization Scope (PROC-03, PROC-04, ADAPT-01, ADAPT-02)

**D-07: Global process template registry (PROC-04).** Create a `PROCESS_TEMPLATES` table. Template payload: `columns` (with order + wip_limit), `recurring_tasks`, `behavioral_flags`. The 4 built-in templates (SCRUM, KANBAN, WATERFALL, ITERATIVE) are hard-locked as read-only seeds. Admin can create, edit, and delete custom templates only. Custom templates appear in the project creation methodology dropdown alongside built-in ones.

**D-08: Admin template management UI at `/admin/process-templates`.** Admin-only route (no access for Project Manager or Team Member — protected by SPMS-MOD-AUTH middleware per SDD §4.1.1). Lists all templates. Built-in templates are view-only. Full CRUD on custom templates only.

**D-09: Project-level customization in Project Settings tab.** Extend the existing Project Settings tab (established in Phase 4) with a 'Süreç Modeli' section: current methodology badge, sprint duration setting, behavioral flag toggles. Board columns already manageable there (Phase 4). Accessible to Project Manager and Admin.

**D-10: Mid-project methodology change (SDD §5.5.3).** When methodology is changed:
1. **No data loss** — preserve all existing board columns and tasks
2. **Sprint archival** — if switching away from SCRUM, auto-archive (soft-delete / mark `status=closed`) active/future sprints; historical sprint data is never deleted
3. **Config update** — inject new methodology's default behavioral flags into `process_config` JSONB (overwriting previous methodology defaults, but respecting any user overrides already set)
4. Show confirmation dialog in Turkish before applying the change

---

### Config Panel Design (ADAPT-03, ADAPT-04, ADAPT-05, ADAPT-06)

**D-11: Admin panel structure.** New `/admin` route space (Admin role only). Two sub-pages:
- `/admin/process-templates` — template management (D-08)
- `/admin/settings` — system config, module toggles, theming

**D-12: Configurable system parameters (ADAPT-05, SPMS-ADAPT-5).** Stored in a `SYSTEM_CONFIG` table. Backend reads dynamically via a cached singleton that refreshes on update — no restart required (SPMS-ADAPT-6). Parameters (all UI labels in Turkish):
- **'Varsayılan Döngü (Sprint) Süresi'** — default sprint duration in days (e.g., 14)
- **'Maksimum Görev Sınırı'** — global task limit / default WIP fallback
- **'Varsayılan Bildirim Frekansı'** — dropdown: 'Anında' / 'Saatlik Özet' / 'Günlük Özet'

**D-13: Module toggle (ADAPT-04).** Single toggle: Reporting module (Raporlama). When off: 'Raporlar' nav item removed from sidebar, `/reports` route returns 403. Toggle stored in `SYSTEM_CONFIG`, checked on nav render and route access.

**D-14: UI theming (ADAPT-03, SPMS-ADAPT-3).** Admin can configure:
- Global primary brand color → stored in `SYSTEM_CONFIG`, applied via CSS custom properties (shadcn/ui CSS variables) — no restart needed
- Chart/dashboard color themes → stored in `SYSTEM_CONFIG`, read by reporting components
- Status label colors per board column → stored on `board_columns.color` field (already exists)

Frontend reads `SYSTEM_CONFIG` theme values and injects them as CSS custom properties dynamically. All theme config labels in Turkish: 'Ana Tema Rengi', 'Pano Durum Renkleri', 'Grafik Teması'.

---

### External Integrations (EXT-01 to EXT-05)

**D-15: Slack + Microsoft Teams.** Both integrations are implemented in Phase 7. Webhook-based (outbound only). No OAuth required. User can use whichever platform they prefer, or both.

**D-16: Three trigger events (all messages in Turkish):**
- `project.created` → "🚀 Yeni Proje Oluşturuldu: [Proje Adı]"
- `task.assigned` → "👤 Yeni Görev Atandı: [Görev Adı] → [Atanan Kişi]"
- `task.status_changed` (task moved to different column) → "[Görev Adı] durumu [Eski Kolon] ➡️ [Yeni Kolon] olarak güncellendi."

**D-17: IIntegrationService adapter architecture (EXT-02, EXT-05).** Domain layer interface `IIntegrationService` with `send_event(event_type, payload)` method. `SlackIntegrationService` and `TeamsIntegrationService` implement it. A factory/registry maps platform name → implementation. Adding a new integration = new adapter class only, no changes to existing modules or core.

**D-18: Per-project webhook routing with admin master switch.**
- **Per-project:** 'Entegrasyonlar' section in Project Settings tab (inside 'Süreç ve Kurallar' panel). Project Manager can select platform (Slack / Teams) and enter webhook URL. Stored in `project.process_config` JSONB (no new table). Includes a 'Bağlantıyı Test Et' button that fires a dummy payload to verify the channel.
- **Admin master switch:** 'Dış Entegrasyonlar Aktif' toggle in `/admin/settings` (SYSTEM_CONFIG). When disabled, ALL project-level webhooks are suspended immediately.

**D-19: API key / webhook URL security (EXT-04).** Webhook URLs are stored in `process_config` JSONB on the project record (database-persisted, not in env vars). Backend never exposes the raw URL in API responses (omit from GET endpoints). Admin master switch is additional access control layer.

---

### Claude's Discretion

- Exact `process_config` JSONB schema (field naming, nested vs flat structure)
- Whether `SYSTEM_CONFIG` is a single-row settings table or key-value store
- Cached singleton implementation pattern for SYSTEM_CONFIG (e.g., TTL cache, invalidation on PUT)
- CSS custom property injection strategy in Next.js (layout.tsx `<style>` tag with dynamic values vs. CSS-in-JS)
- `/admin` layout structure (sidebar tabs vs. top nav for Process Templates / System Settings)
- Exact Slack Block Kit vs. simple text payload format
- Backend service registration pattern for IIntegrationService factory

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Process Model (PROC-01 through PROC-05)
- `.planning/REQUIREMENTS.md` §Adaptation & Configuration (ADAPT-01 through ADAPT-06)
- `.planning/REQUIREMENTS.md` §External Integrations (EXT-01 through EXT-05)

### Roadmap
- `.planning/ROADMAP.md` §Phase 7 — Goal, success criteria, and requirement mapping

### Prior phase context (patterns to follow)
- `.planning/phases/04-views-ui/04-CONTEXT.md` — Board columns architecture, dnd-kit drag callbacks, WIP limit deferral note, sprint management page pattern, ConfirmDialog pattern
- `.planning/phases/05-notifications/05-CONTEXT.md` — `ALTER TYPE ADD VALUE` autocommit pattern (use for ITERATIVE enum addition), APScheduler pattern, INotificationService abstraction (mirror for IIntegrationService)
- `.planning/phases/06-reporting-analytics/06-CONTEXT.md` — methodology-aware `isScrum` check in reports/page.tsx (update to handle ITERATIVE)

### Key existing files
- `Backend/app/domain/entities/project.py` — `Methodology` enum (add ITERATIVE), `Project` entity (add `process_config: Optional[Dict]`)
- `Backend/app/infrastructure/database/models/project.py` — `ProjectModel` with `methodology` column; needs `process_config` JSONB column
- `Backend/app/infrastructure/database/models/board_column.py` — existing `color` field; `wip_limit` may need adding
- `Backend/app/application/use_cases/manage_projects.py` — `CreateProject` use case; Phase 7 adds template seeding logic here
- `Frontend/services/project-service.ts` — `Methodology` type; project creation form
- `Frontend/app/projects/[id]/page.tsx` — Project Settings tab where 'Süreç Modeli' and 'Entegrasyonlar' sections are added
- `Frontend/app/reports/page.tsx` — `isScrum` check (line ~79); update to include ITERATIVE handling

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Methodology` enum already exists in `Backend/app/domain/entities/project.py` with SCRUM/KANBAN/WATERFALL — Phase 7 adds ITERATIVE
- `BoardColumnModel` already has a `color` field — reuse for status label theming (D-14); check if `wip_limit` column already exists or needs adding
- `process_config` / `custom_fields: Optional[Dict[str, Any]]` already on `Project` entity — evaluate whether `custom_fields` can be repurposed or whether a dedicated `process_config` column is cleaner
- Phase 4 Board Columns management UI at `/projects/[id]/page.tsx` (Settings tab) — extend in place with 'Süreç Modeli' and 'Entegrasyonlar' sections
- Phase 3 recurring task completion loop — existing generation-on-completion logic handles PROC-05 future instances automatically
- `INotificationService` abstraction from Phase 5 — direct pattern reference for `IIntegrationService`
- `sonner` toast system (Phase 4) — use same system for WIP limit warning
- `ConfirmDialog` component (Phase 2) — use for methodology change confirmation

### Integration Points
- `Backend/app/api/v1/projects.py` → `POST /projects` — extend to call template seeding factory after column creation
- `Backend/app/api/v1/tasks.py` → `PATCH /tasks/{id}` status change — add integration event trigger for `task.status_changed`
- New: `Backend/app/domain/interfaces/integration_service.py` — `IIntegrationService` interface
- New: `Backend/app/infrastructure/integrations/` — `SlackIntegrationService`, `TeamsIntegrationService`
- New: `Backend/app/infrastructure/database/models/process_template.py` — `ProcessTemplateModel`
- New: `Backend/app/infrastructure/database/models/system_config.py` — `SystemConfigModel`
- New: `Frontend/app/admin/` — admin route space with `process-templates/` and `settings/` sub-pages

</code_context>

<specifics>
## Specific Ideas

- ITERATIVE enum addition: use Phase 5's `autocommit_block()` / `AUTOCOMMIT` isolation level pattern for `ALTER TYPE methodology_type ADD VALUE 'ITERATIVE'`
- WIP limit column header visual: when column task count ≥ wip_limit, apply Tailwind `border-amber-500` + amber badge to column header in Kanban board; turn red `border-red-500` if 2+ over limit
- Turkish warning toast: "Uyarı: Bu kolon için belirlenen WIP (Aynı Anda Yapılan İş) limiti aşıldı!"
- Template seeding factory: implement as a `ProcessTemplateFactory` or `CreateProjectFromTemplate` use case that accepts methodology string → returns column list + recurring task seeds + behavioral flags
- `/admin` guard: use same `get_current_user` dependency with `role.name == 'admin'` check (pattern from project membership guards)
- Admin master switch for integrations: check `SYSTEM_CONFIG.integrations_enabled` in `IIntegrationService.send_event()` before dispatching — if false, silently skip
- 'Bağlantıyı Test Et' button: sends a fixed Turkish "🔔 SPMS bağlantı testi başarılı!" payload to the configured webhook URL; shows inline success/error state
- `process_config` JSONB default on project creation: `{"methodology": "SCRUM", "sprint_duration_days": 14, "enforce_sequential_dependencies": false, "enforce_wip_limits": false, "restrict_expired_sprints": true, "integrations": {}}`
- Mid-project methodology change: PATCH /projects/{id} with new methodology → backend checks old methodology, if SCRUM → archive sprints, then injects new methodology's flag defaults into process_config, preserve columns
- Reports page `isScrum` check (reports/page.tsx ~line 79): update to `const isScrum = !methodology || methodology === "SCRUM"` — already handles non-Scrum correctly; verify ITERATIVE routes to non-sprint path

</specifics>

<deferred>
## Deferred Ideas

- Google Calendar integration — user explicitly deferred; separate phase if needed
- Start-to-start dependency type visual arrows in Gantt (Phase 4 deferral) — still deferred
- WIP limit hard block variant — warning toast is the decision; hard block deferred
- Sprint/Phase assignment directly from Kanban board (drag card into sprint lane) — not in scope
- Real-time WebSocket-based integration events (currently fire-and-forget HTTP POST)
- Per-user webhook preference (user decides which events they want forwarded)
- Google Calendar OAuth two-way sync — v2 requirement
- GDPR full data export / deletion right — v2 requirement

</deferred>

---

*Phase: 07-process-models-adaptation-integrations*
*Context gathered: 2026-04-10*
