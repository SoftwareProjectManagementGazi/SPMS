# Phase 11: Task Features & Board Enhancements - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the complete task-centric experience in Frontend2: full 8-tab ProjectDetail page (Board/List/Timeline/Calendar/Activity/Lifecycle/Members/Settings), Task Create Modal, Task Detail page, Backlog Panel, phase-assignment UI gated by `process_config.enable_phase_assignment`, WIP violation feedback, MyTasks page, and dependency/watcher/label/attachment functionality for tasks.

**Scope (v2.0 requirements):** TASK-01..06, PAGE-03, PAGE-04, PAGE-07.

**NOT in scope:**
- Lifecycle tab CONTENT (Phase 12 — LIFE-01..07)
- Activity tab CONTENT (Phase 13 — PROF-01)
- Settings > Lifecycle sub-tab (Phase 12)
- Workflow editor itself (Phase 12 — EDIT-01..07; Phase 11 only links to it)
- `enable_phase_assignment` toggle UI (Phase 12, in Settings > Lifecycle)
- Cycle endpoints for non-Scrum methodologies (Phase 12/13 backend)
- User Profile pages (Phase 13 — PROF-02..04)
- Reporting charts (Phase 13 — REPT-01..04)
- Worklog / time tracking (Phase 13+)

**Cross-phase contracts:**
- Phase 12 will ADD the toggle UI to Settings > Lifecycle. Phase 11 contract: field exists in `process_config` with default `false`, read-only on UI for Phase 11.
- Phase 13 will FILL the Activity tab content and User Profile pages. Phase 11 contract: Activity tab is rendered with "coming soon" stub; `MyTasksExperience` is componentized so User Profile can reuse it.
- Phase 12 will also OWN Columns editor depth; Phase 11 ships a minimum Settings > Columns tab that allows renaming statuses and editing WIP limits only.

</domain>

<decisions>
## Implementation Decisions

### Task Create Modal (TASK-01)
- **D-01:** Modal state lives in a **global `TaskModalContext`** provider at root layout (`Frontend2/context/task-modal-context.tsx`). Exposes `openTaskModal(defaultProjectId?)` + `closeTaskModal()`. Matches the prototype's `window.__openTaskModal` pattern. Any component (Header Create button, ProjectDetail "Görev" button, Backlog "Add" button) triggers it via hook. Modal renders once in root layout.
- **D-02:** **No draft persistence** — close discards. Matches prototype behavior exactly. Modal is a short-form with 15 fields max; re-entry is acceptable if user accidentally closes.
- **D-03:** Post-submit behavior: **close modal → success toast ("Görev oluşturuldu") → TanStack Query invalidates `['tasks', projectId]` → user stays on current page**. Fastest UX for batch task creation. No navigation on success.
- **D-04:** Required fields: **Title + Project only**. All other fields (task type, parent, description, priority, assignee, points, due, cycle, phase, tags, recurring) optional. "Oluştur" button disabled until both required set. Matches prototype validation.
- **D-05:** All prototype fields from `create-task-modal.jsx` ship in Phase 11: task type (task/subtask/bug), parent task selector (if subtask), title, description (plain text), priority, assignee (from project members), due date, cycle (Scrum only, see D-44), phase (conditional on `enable_phase_assignment`, see D-40), points, tags (project-scoped, see D-33), recurring (Collapsible with freq + end options).
- **D-06:** Keyboard: Esc closes; **Ctrl/Cmd+Enter submits** (matches prototype). Autofocus on Title field on open.

### Header Create Button Redesign (REVISES Phase 10 D-09)
- **D-07:** **IMPORTANT — Phase 10 wired Header "Oluştur" button to `/projects/new`. Phase 11 INVERTS this.** Header Create button PRIMARY function = open Task Create Modal (task creation occurs more frequently than project creation). Phase 11 rewires `Frontend2/components/app-shell/header.tsx` to call `openTaskModal()` instead of routing to `/projects/new`.
- **D-08:** **"Yeni Proje" button moves to `/projects` (list page)** as a permission-gated primary button ("Yeni Proje" + Plus icon). Visible only to users whose role is Admin or Project Manager (`currentUser.role === 'Admin' || currentUser.role === 'Project Manager'`). Hidden for Team Members. Reuses existing `useAuth().user` to check role.

### ProjectDetail 8-Tab Structure (PAGE-03)
- **D-09:** Tab state via **React `useState`** (not URL param). Matches prototype. Refresh loses tab but tabs switch instantly client-side. Acceptable tradeoff for MVP.
- **D-10:** **All 8 tabs rendered, but Activity and Lifecycle tabs show "coming soon" stubs.** Stub = AlertBanner inside tab body: Activity → "Bu sekme Faz 13'te aktive edilecek." / Lifecycle → "Bu sekme Faz 12'de aktive edilecek." Preserves prototype visual fidelity. No tab rearrangement as phases land.
- **D-11:** **Settings tab sub-tabs in Phase 11: General + Columns + Workflow link.** Lifecycle sub-tab gets a "Faz 12" stub. General = project name/description/dates/archive (PATCH /api/v1/projects/{id}). Workflow = link-out button to `/workflow-editor` (Phase 12). Columns = status column editor (rename + WIP limit edit, uses existing `Backend/app/api/v1/board_columns.py`).
- **D-12:** **Methodology-aware Settings > Columns:** Scrum/Kanban show full column editor. Waterfall may hide WIP limits (waterfall has phases, not flow). Document methodology matrix in downstream plan.

### Backlog Panel (TASK-02) — NEW DESIGN (not in prototype)
- **D-13:** **Fixed column that pushes content.** When open: ProjectDetail content grid shrinks right by 300px (sibling column). When closed: full width. Persistent vertical toggle button at far left edge (`Frontend2/components/project-detail/backlog-toggle.tsx`). Matches Jira/Linear backlog column pattern.
- **D-14:** Open-state **persisted per-project in localStorage**. Key: `spms.backlog.open.{projectId}` = `true` | `false`. Each project remembers its last state. Default = closed on first visit.
- **D-15:** **v1 feature set:** search by title/key (client-side filter on loaded list), filter by priority (multi-select chips), filter by assignee (avatar multi-select), drag-drop to Board columns (@dnd-kit cross-container). **Bulk operations deferred** to Phase 12/13 per user direction.
- **D-16:** **Backlog definition is methodology-dependent**, configured per project (via Settings > General in Phase 11; defaults set at project creation). See the **Backlog Definition Matrix** below. User can override the default definition from Settings > General > Backlog Tanımı.

**Backlog Definition Matrix (defaults per methodology):**

| Methodology  | Default backlog definition                                                | Rationale                                                                       |
|--------------|---------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| Scrum        | Tasks where `cycle_id` (sprint_id) is null                                | Classic Scrum backlog = not yet in any sprint                                   |
| Kanban       | Tasks in the leftmost column (the "Backlog" column id, configurable)      | Kanban has no sprint; first column == backlog                                   |
| Waterfall    | Tasks where `phase_id` is null OR phase is the first lifecycle phase      | Waterfall = not yet assigned to a phase; or in analysis/requirements phase      |
| Iterative    | Tasks where `cycle_id` (iteration_id) is null                             | Same semantics as Scrum but label = Iterasyon                                   |
| Incremental  | Tasks where `cycle_id` (increment_id) is null                             | Increment-based, same as iterative                                              |
| Evolutionary | Tasks where `cycle_id` (evolution_id) is null                             | Evolution-based, same as iterative                                              |
| RAD          | Tasks where `cycle_id` (iteration_id) is null                             | RAD iterations are short; same definition as iterative                          |

- **D-17:** Settings > General adds a **"Backlog Tanımı" SegmentedControl** so users can override default: `["Döngü'e atanmamış", "İlk kolondaki görevler", "Faza atanmamış", "Özel seçim"]`. Stored in `project.process_config.backlog_definition` (new field, extends Phase 9 BACK-03 schema). Default set during Create Project wizard Step 4 based on methodology.
- **D-18:** **Backlog panel is visible for all methodologies.** The query to load backlog tasks uses the project's backlog definition. Panel is closed by default; user-invoked.

### Board Tab (Board view + PAGE-07 WIP + TASK-03/05 phase UI)
- **D-19:** **Drag-and-drop via `@dnd-kit/core`** (not native HTML5). Target: bulletproof, smooth animations, consistent actions, keyboard-accessible (arrow keys to move cards). Sensor config: PointerSensor + KeyboardSensor. Use `DragOverlay` for ghost card. No "spaghetti" — isolate DnD wiring into a single `<BoardDnDProvider>` wrapper that Board + Backlog both mount inside.
- **D-20:** **WIP violation = Warn + Allow (soft).** Matches prototype exactly: when column task count exceeds its `wipLimit`, column background shifts to `color-mix(in oklch, var(--priority-critical) 6%, var(--bg-2))` AND an `AlertBanner` (tone="danger", icon=Alert) renders inside the column: "WIP limiti aşıldı" / "WIP limit exceeded". Drop succeeds regardless — team self-polices.
- **D-21:** **Compact/Rich toggle** on board toolbar via SegmentedControl ("Sıkı" / "Detaylı"). State saved in localStorage key `spms.board.density.{projectId}`. Compact card = key + title + avatar only; Rich card = + priority chip + points + due date. Matches prototype.
- **D-22:** Board toolbar Phase 11 scope: **search input + density toggle + current-cycle badge (e.g., "Sprint 7") + phase filter dropdown**. Phase filter hidden when `enable_phase_assignment=false`. All toolbar controls match prototype visual.
- **D-23:** **Click a card → navigate to `/projects/{id}/tasks/{taskId}`**. No inline quick-edit on board cards. Drag = reorder (status change). Plain click = open detail page. Matches prototype behavior.
- **D-24:** When `enable_phase_assignment=true`: **each board card shows a phase badge** (small pill above title) with the phase name from `process_config.workflow.nodes`. Badge color per phase using existing `--status-*` or custom node tone.

### List Tab
- **D-25:** **TanStack Table (headless)** for List tab. Provides sort/filter primitives; styling uses prototype tokens to match visual. Replaces prototype's plain CSS grid. Columns: Key, Title (w/ bug icon), Status, Priority, Assignee, Due, Points. **Phase column** added conditionally when `enable_phase_assignment=true`. Client-side sort on header click. Search input shared with Board toolbar search (same query string via URL or context).
- **D-26:** Default sort: Priority desc → Due asc → Key asc. Persistence of sort/filter state: session-only (React state). Not stored in localStorage for v1.

### Timeline Tab — RESEARCH ITEM
- **D-27:** **Full Gantt library required — must be bulletproof, glitch-free, smooth transitions, React 19 compatible.** Current constraints (no spaghetti, quality-first). Library selection DEFERRED to researcher agent. **Research candidates:** `svar-gantt` (React-native, 2025 maintenance), `frappe-gantt` (vanilla SVG, light), custom SVG (maximum control but highest dev cost), `@wojtekmaj/react-timeline-gantt`. **Researcher MUST evaluate:** React 19 + Next.js 16 compatibility, theme-ability (must adopt oklch tokens), bundle size, drag-resize support, dependency arrow support, active maintenance, TypeScript types quality. Tech debt note from REQUIREMENTS.md: "Gantt dependency arrows deferred to v3" — so dependency arrows are nice-to-have, not blocking.
- **D-28:** Timeline features v1: read with real `task.start`/`task.due` (not prototype's placeholder index math), Day/Week/Month view toggle (Week default), smooth transitions between views. Drag-to-reschedule is stretch goal; if library supports it cleanly, include; otherwise defer.

### Calendar Tab
- **D-29:** **Custom calendar matching prototype visually + Outlook-style scroll-zoom.** No third-party library (avoids theme-override fight against CSS defaults of FullCalendar/react-big-calendar). ~150-200 lines in `Frontend2/components/project-detail/calendar-view.tsx`. 7-col grid, 6 rows of days, today highlighted, task chips per day with priority color.
- **D-30:** **Scroll-zoom:** Ctrl+scroll (or pinch on trackpad) adjusts day-cell height from compact (60px) to comfortable (160px). Height persisted in localStorage key `spms.calendar.zoom.{projectId}`. Prev/Next/Today nav. Click day → opens day-detail popover with full task list.
- **D-31:** Calendar tasks display: up to 3 visible chips per day when collapsed; "+N more" link opens day popover. Task chip color = priority tone via color-mix; click chip → task detail page.

### MyTasks Page (PAGE-04)
- **D-32:** **Ship full `MyTasksExperience` from prototype, componentized.** Divide into reusable pieces:
  - `components/my-tasks/my-tasks-experience.tsx` — Main component (accepts props for compact/defaultView/etc.)
  - `components/my-tasks/saved-views-tabs.tsx` — 6 saved views tabbar
  - `components/my-tasks/task-filter-bar.tsx` — search + priority/project/assignee filters
  - `components/my-tasks/task-group-list.tsx` — groupBy rendering (project/status/priority/due/none)
  - `components/my-tasks/task-row.tsx` — The reusable row used in compact & rich modes
  - `lib/my-tasks/smart-sort.ts` — pure sort logic (testable)
  - `lib/my-tasks/due-bucket.ts` — due-date bucketing (overdue/today/week/later)
  - `hooks/use-my-tasks-store.ts` — localStorage persistence + overrides (maps prototype's MT_STORE_KEY)
- **D-33:** MyTasks page mounts `<MyTasksExperience />` (full-featured, no compact). Dashboard Member view mounts `<MyTasksExperience compact={true} defaultView="today" hideRightRail hideHeader />` (see D-41).

### Task Detail (`/projects/[id]/tasks/[taskId]`)
- **D-34:** **Separate full-page route** at `/projects/[id]/tasks/[taskId]`. 2-column layout matching prototype `task-detail.jsx`: main content (left) + properties sidebar (right, 300px). Browser back returns to ProjectDetail. URL-shareable.
- **D-35:** **Parent Task link section** (Jira epic-link style): If task is a sub-task (`task.parent_task_id` is set), render a prominent section at top of main content — breadcrumb-style: Folder icon + project name + chevron + parent task key + parent title (clickable → parent detail page). Above the task title.
- **D-36:** **Description section** — Jira-like rich/plain text toggle:
  - Toggle SegmentedControl at top-right of Description section ("Düz" / "Zengin")
  - Plain mode = plain textarea
  - Rich mode = **TipTap** editor (`@tiptap/react` + `@tiptap/starter-kit`) with toolbar on top: Bold, Italic, Underline, Strike, H1/H2/H3, Bullet list, Numbered list, Blockquote, Code, Code block, Link, Image (paste), Horizontal rule. Toolbar styled to match prototype (primary button tones, kbd-hints). Content stored as HTML in `task.description`.
  - Preference (plain vs rich default) persisted per-user in localStorage (`spms.description.mode`).
  - Save via PATCH /api/v1/tasks/{id} on blur OR explicit Save button (debounced 2s).
- **D-37:** **Sub-tasks section** — rich-row list (NOT checkboxes). Each sub-task row: key (mono) + title + status badge + due date + assignee avatar + labels. Click anywhere on row → navigate to that sub-task's detail page. "Ekle" button opens Task Create Modal with type=subtask pre-selected and parent_task_id pre-filled with current task.
- **D-38:** **Properties sidebar — fully functional inline edit (NOT read-only, NOT static):**
  - Each row: label on left, clickable value on right → **inline edit mechanic: click the value → inline select/dropdown opens in place** (not a menu overlay). Enter/Esc commits/cancels. PATCH /api/v1/tasks/{id} on commit. Matches Linear/Notion pattern.
  - Editable rows: Status (dropdown of project columns), Assignee (member picker), Reporter (member picker), Priority (4-option select), Points (number input), Due date (date picker), Cycle (cycle picker — Scrum only), Phase (phase picker — conditional on `enable_phase_assignment`), Labels (multi-chip picker with add/create — see D-46), Watcher toggle (see D-47).
  - Optimistic update: TanStack Query `setQueryData` updates cache immediately; rollback on error via `onError`.
- **D-39:** **TASK-04 phase distribution mini stepper:** Horizontal chevron stepper inside properties sidebar below the Labels row. Renders only when `enable_phase_assignment=true` AND task has at least one sub-task. Chips = phase names (from `process_config.workflow.nodes`), each chip shows count of sub-tasks in that phase. Highlighted = phase with most sub-tasks. Reuses `PriorityChip`-style visual tokens.

### Phase Assignment Gating (TASK-03/04/05)
- **D-40:** `enable_phase_assignment` **read from `project.process_config.enable_phase_assignment`** (BACK-03 JSONB). Default `false`. Phase 11 does NOT expose the toggle UI — that is Phase 12 (Settings > Lifecycle). Phase 11 only reads the value via `useProject(projectId)` hook. Schema update: default JSON blob extends to `{ "schema_version": 1, "workflow": {...}, "enable_phase_assignment": false, "backlog_definition": "cycle_null" }`. Migration or backend normalizer (already in BACK-03) auto-fills default on read.
- **D-41:** Phase dropdown source: **`project.process_config.workflow.nodes[]`**. Each node has `{ id, name }`. Phase UI (dropdown in modal, badge on cards, column in list, filter in toolbar, mini stepper in sidebar) all read from this single source. If `workflow.nodes` is empty, phase UI shows "Faz tanımlı değil" and disables selection.

### Cycle Label (TASK-06)
- **D-42:** **Methodology-agnostic cycle label — user-overridable per project.** Defaults at project creation:

| Methodology  | Default cycle label | Default enabled? | Data source                 |
|--------------|---------------------|------------------|-----------------------------|
| Scrum        | Sprint              | Yes              | /api/v1/sprints             |
| Kanban       | — (disabled)        | No (hide field)  | N/A                         |
| Waterfall    | Faz                 | Yes (reuses phase_id) | process_config.workflow.nodes |
| Iterative    | İterasyon           | Yes              | N/A in Phase 11 (disabled)  |
| Incremental  | Artım               | Yes              | N/A in Phase 11 (disabled)  |
| Evolutionary | Evrim               | Yes              | N/A in Phase 11 (disabled)  |
| RAD          | İterasyon           | Yes              | N/A in Phase 11 (disabled)  |

- **D-43:** **User can override the default cycle label** via Settings > General > "Döngü Etiketi" text input. Stored in `project.process_config.cycle_label`. Falls back to methodology default if null.
- **D-44:** **Cycle data source in Phase 11:** **Scrum only** (uses existing `/api/v1/sprints`). For all other methodologies in Phase 11, the cycle field in Task Modal is **disabled with helper text "Faz 12'de aktive edilecek"** (except Waterfall which reuses `phase_id` via the phase dropdown). No new backend work for cycles in Phase 11.
- **D-45:** **Kanban: hide the cycle field entirely** in Task Create Modal and Task Detail sidebar. Kanban has no cycle concept.

### Comments (Task Detail)
- **D-46:** **Flat thread (no nesting)** with **@mention + edit + delete** (author can edit/delete own comments **with NO time-based constraint**). Plain textarea input with @ character triggering a member-picker dropdown (within project members). On submit, comment posts to existing Phase 3 comment endpoints. Display: avatar + author + timestamp + body. Edit: inline textarea replaces body. Delete: soft-delete with "Silindi" placeholder, keeps thread order intact.
- **D-47:** Activity section uses **sub-tabs: Yorumlar / Geçmiş** (Worklog deferred). Yorumlar is default active. Geçmiş = audit log view pulling from `audit_log` table (PATCH events on the task, status changes, assignee changes). Read-only history display: "{actor} changed {field} from {old} to {new} at {time}". Filterable by field.

### Task Attachments
- **D-48:** **Attachments section** under Comments on task detail. Upload/list/delete UI:
  - Drag-drop file area + click-to-browse
  - Attached files listed with: filename + size + uploader avatar + uploaded time + download icon + delete icon (for uploader/PM)
  - Uses existing `Backend/app/api/v1/attachments.py` endpoints (Phase 2 TASK-05)
  - Include **link references** (URL bookmarks) alongside files: "Bağlantı Ekle" button → input for URL + optional title. Stored alongside attachments with type="link".

### Task Dependencies
- **D-49:** **Full CRUD in properties sidebar.** "Bağımlılıklar" section below Labels. "Bağımlılık ekle" button opens a small modal/popover with:
  - Type select: "Engelliyor" (blocks) / "Engellemekte" (blocked_by) / "İlişkili" (relates_to)
  - Task picker (search input + dropdown of project tasks, excludes self + already-linked)
  - Confirm button
- Current deps listed as rows: icon + type label + task key (mono) + task title + X to remove. Click task → navigate to that task's detail page. Backend endpoints already exist (Phase 3).

### Header Search Wiring
- **D-50:** **Autocomplete dropdown** from header search input. Keyboard shortcut: **Cmd/Ctrl+K** focuses input. Debounced 250ms search calls `GET /api/v1/tasks/search?q=X` + `GET /api/v1/projects?search=X` in parallel (`Promise.all`). Results grouped by type:
  - Projects (top) — up to 3 matches, each = key badge + name
  - Tasks (middle) — up to 7 matches, each = key + title + project name
  - "Tümünü gör" link → future `/search?q=X` page (Phase 13+)
- Click result → navigate. Esc closes dropdown. Up/Down arrows navigate results.

### Task Labels (Etiketler)
- **D-51:** **Project-scoped labels with auto-create on first use.** Backend already has labels table (from Phase 2). Each label is linked to a project.
  - Task modal tag input: type to filter existing project labels, Enter with non-matching string creates new label in the project's pool and assigns to task.
  - Autocomplete dropdown shows existing labels with usage count.
  - Label list per project fetched via `GET /api/v1/projects/{id}/labels` (add endpoint if missing; Phase 11 backend work item).
  - Display: small Badge with color (auto-derived from label name hash, or user-picked via Settings).

### Dashboard Member View (reuses MyTasksExperience)
- **D-52:** Phase 11 completes the **Member view on Dashboard** by mounting `<MyTasksExperience compact={true} defaultView="today" hideHeader hideRightRail hideQuickAdd />`. User sees their 6 saved views but condensed into a dashboard widget. Phase 10 D-27 established the Manager/Member toggle; Phase 11 fills Member view with the real component.

### Task Watcher Toggle
- **D-53:** **"Takip et" / "Takipte" toggle button in Task Detail header** (not sidebar). Toggle calls POST `/api/v1/tasks/{id}/watch` / DELETE `/api/v1/tasks/{id}/watch` (existing endpoints from Phase 3). Button text flips on toggle. Watcher count badge beside button (reads `task.watcher_count` from backend). Notification generation already wired (Phase 5).

### Responsive Behavior
- **D-54:** **Desktop-first (≥1280px) but adaptive at key breakpoints:**
  - **<1280px:** Backlog panel auto-closes regardless of localStorage preference. Toggle button remains visible; if user force-opens, show small hint text in panel header "Dar ekranda kısıtlı görünüm".
  - **<1024px:** ProjectDetail 8-tab bar becomes horizontally scrollable (overflow-x: auto, fade mask at edges). No hamburger dropdown.
  - **<1024px:** Task Detail sidebar (properties) stacks BELOW main content instead of right column. Properties shown as expandable sections.
- **D-55:** No mobile-first redesign in Phase 11. Dedicated mobile optimization is future work (not in v2.0).

### Claude's Discretion
- Exact @dnd-kit sensor/modifier configuration (PointerSensor + KeyboardSensor baseline)
- TipTap extension configuration (start with @tiptap/starter-kit, add link/image as needed)
- Exact debounce values for search/rich-text save
- Animation duration for backlog panel slide (default 150-200ms)
- Toast library choice (reuse from Phase 10 D-07)
- Confirmation dialog reuse (from Phase 10 D-25 ConfirmDialog component)
- Label color derivation algorithm (string hash → hue)
- Phase stepper visual treatment (chevron style, sizing)
- Context provider composition order in root layout
- Which tests to run in plan verification (lean on TanStack Query's caching; unit tests for sorting/bucketing logic)

### Folded Todos
None — no pending todos matched Phase 11 scope per STATE.md.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prototype Source Files (design authority — read first)
- `New_Frontend/src/pages/project-detail.jsx` — 8-tab ProjectDetail full implementation (404 lines). Defines BoardTab, ListTab, TimelineTab, CalendarTab, LifecycleTab, MembersTab, SettingsTab, KanbanCard. Match visually.
- `New_Frontend/src/pages/create-task-modal.jsx` — Full 15-field task create modal (275 lines). All fields, styling, keyboard shortcuts, validation.
- `New_Frontend/src/pages/task-detail.jsx` — 2-column task detail with properties sidebar + description + sub-tasks + activity (147 lines). Parent task link pattern needs EXTENSION (add section at top when sub-task).
- `New_Frontend/src/pages/my-tasks.jsx` — `MyTasksExperience` reusable (655 lines — views, filters, groupBy, density, sort, localStorage). Port verbatim, split into components per D-32.
- `New_Frontend/src/pages/my-tasks-parts.jsx` — Supporting parts for MyTasksExperience (458 lines — TaskRow, filters, right rail, quick add).
- `New_Frontend/src/data.jsx` — CYCLE_LABELS map, STATUSES, DEFAULT_LIFECYCLES, DEFAULT_COLUMNS per methodology. Seed cycle label defaults from this file.
- `New_Frontend/src/primitives.jsx` — Already ported to Frontend2; reference for any primitive that needs small extensions (e.g., Tabs for scrollable variant).

### Frontend2 Existing Code (build on top of)
- `Frontend2/components/primitives/` — All 16 primitive components already available (Avatar, AvatarStack, Badge, Button, Card, Kbd, Tabs, Section, PriorityChip, StatusDot, Input, ProgressBar, SegmentedControl, Collapsible, AlertBanner, Toggle).
- `Frontend2/app/(shell)/projects/[id]/page.tsx` — Existing stub with ArchiveBanner + NaN guard. Phase 11 replaces the placeholder Card with the full 8-tab layout.
- `Frontend2/app/(shell)/my-tasks/page.tsx` — Existing stub. Phase 11 replaces with `<MyTasksExperience />` mount.
- `Frontend2/context/app-context.tsx` — AppContext (theme + language + density). Extend if needed for Task modal context composition.
- `Frontend2/context/auth-context.tsx` — AuthContext with user/role for permission gating.
- `Frontend2/services/project-service.ts` + `Frontend2/hooks/use-projects.ts` — Pattern reference for new services/hooks (task-service.ts, use-tasks.ts, use-backlog.ts).
- `Frontend2/app/(shell)/layout.tsx` — Root for QueryClientProvider + future TaskModalContext + DnDContext.
- `Frontend2/components/app-shell/header.tsx` — MUST revise per D-07 (Create button → Task Modal).

### Backend API Endpoints (Phase 9 — all implemented except where noted)
- `GET /api/v1/tasks/project/{id}` — with filters: `?status=...&priority=...&assignee_id=...&phase_id=...&cycle_id=...&in_backlog=true`
- `GET /api/v1/tasks/my-tasks` — current user's tasks (already exists for MyTasks page)
- `GET /api/v1/tasks/search?q=X` — search tasks (for header search autocomplete)
- `POST /api/v1/tasks` — create task (Task Modal submit)
- `PATCH /api/v1/tasks/{id}` — update task (inline sidebar edits, status changes from DnD)
- `GET /api/v1/tasks/{id}` — single task for detail page
- `GET /api/v1/tasks/{id}/history` — audit log for Geçmiş tab
- `GET /api/v1/tasks/{id}/dependencies` + POST/DELETE — dependency CRUD
- `GET /api/v1/tasks/{id}/watch` + POST/DELETE — watcher toggle
- `GET /api/v1/projects/{id}/comments` + POST/PATCH/DELETE — comments
- `POST /api/v1/tasks/{id}/attachments` + DELETE — attachments
- `GET /api/v1/sprints?project_id={id}` — cycles (Scrum only Phase 11)
- `GET /api/v1/projects/{id}` — includes `process_config` JSONB for phase dropdown + backlog definition + cycle label

### Backend API Endpoints — NEW Phase 11 backend work items
- **`GET /api/v1/projects/{id}/labels`** — list project labels (auto-create on first use requires POST /api/v1/labels scoped to project)
- **`POST /api/v1/labels`** — create label (scoped to project_id)
- **Normalizer update to BACK-03** — add `enable_phase_assignment: false`, `backlog_definition: "cycle_null"`, `cycle_label: null` to default process_config on read if missing (leverage existing Phase 9 on-read normalizer)

### Project Context
- `.planning/REQUIREMENTS.md` — TASK-01..06, PAGE-03, PAGE-04, PAGE-07 requirements
- `.planning/phases/08-foundation-design-system/08-CONTEXT.md` — D-01..D-09: prototype token system, primitive components, i18n, App Shell conventions
- `.planning/phases/10-shell-pages-project-features/10-CONTEXT.md` — D-01..D-36: API integration patterns, AuthContext, TanStack Query setup, route groups, ConfirmDialog/Toast patterns, Header Create button (D-09 REVISED by Phase 11 D-07)
- `.planning/phases/09-backend-schema-entities-apis/` — BACK-03 process_config schema (extend in Phase 11 via normalizer), API-05 tasks phase_id filter

### Research Items (for gsd-phase-researcher)
- **Gantt library evaluation** (D-27): Compare `svar-gantt`, `frappe-gantt`, `@wojtekmaj/react-timeline-gantt`, and custom SVG on: React 19 + Next.js 16 compat, theming via CSS vars (must adopt oklch tokens), bundle size, drag-resize, smooth transitions, dependency arrows, maintenance, TypeScript types. Output: concrete library recommendation + theme adaptation strategy + POC snippet.
- **@dnd-kit drag-drop patterns**: Cross-container drag (backlog → board column), smooth animations, keyboard accessibility, optimistic status update on drop.
- **TipTap rich editor integration**: Starter kit configuration, toolbar UX matching prototype, HTML storage, SSR compatibility with Next.js 16.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets in Frontend2
- **All 16 primitives** — AlertBanner (for WIP violation banner, "coming soon" stubs, archive), SegmentedControl (Compact/Rich, density, backlog definition), Collapsible (Recurring section in modal, sub-tab sections), PriorityChip, StatusDot, Tabs (8-tab bar, sub-tab bars), Card, Badge, Input, Avatar, AvatarStack, Toggle, Button, Kbd, ProgressBar, Section.
- **AuthContext** — for role-based gating on Create Project button (D-08).
- **AppContext** — theme + language + density (affects MyTasksExperience density default).
- **ConfirmDialog** (Phase 10) — reused for dependency/label/comment delete confirmations (already matches prototype style).
- **ToastProvider** (Phase 10 D-07) — task modal success/error toasts.
- **ArchiveBanner** (Phase 10 D-33) — reused on archived projects; continues to block edits per D-34.
- **`(shell)/layout.tsx` QueryClientProvider** — extend by wrapping with TaskModalProvider, then DnDProvider.
- **Existing stubs** for `/my-tasks` and `/projects/[id]` — replace content without recreating routes.

### Established Patterns
- **`"use client"` directive** on all interactive components
- **Named exports** for components (`export function X`)
- **`@/` path alias** for all imports
- **Inline styles with CSS token vars** — e.g., `style={{ background: "var(--surface)", boxShadow: "inset 0 0 0 1px var(--border)" }}` (prototype style)
- **Axios + interceptors** (Phase 10 D-02/D-05) — all new services follow this
- **TanStack Query invalidation** — `invalidateQueries({ queryKey: ['tasks', projectId] })` after mutations
- **Optimistic updates** (new pattern for D-38) — `queryClient.setQueryData` + rollback on `onError`
- **Form validation** — prototype pattern: button disabled until required fields set; no Zod/react-hook-form overhead
- **Turkish-first strings with T() helper** — language from `useApp().language`

### Integration Points
- **`Frontend2/app/layout.tsx`** — Add `TaskModalProvider` (after existing AppProvider + AuthProvider, inside QueryClientProvider hierarchy).
- **`Frontend2/app/(shell)/layout.tsx`** — Add `<DnDProvider>` wrapping children to enable cross-container drag (board + backlog).
- **`Frontend2/components/app-shell/header.tsx`** — Rewire "Oluştur" button per D-07: `onClick={() => openTaskModal()}`. Remove /projects/new routing.
- **`Frontend2/app/(shell)/projects/page.tsx`** — Add permission-gated "Yeni Proje" primary button per D-08.
- **`Frontend2/app/(shell)/projects/[id]/page.tsx`** — Replace placeholder Card with `<ProjectDetailShell project={project}>` wrapping the 8-tab layout.
- **New route:** `Frontend2/app/(shell)/projects/[id]/tasks/[taskId]/page.tsx` — Task Detail full page.
- **New files (non-exhaustive):** 
  - `Frontend2/components/project-detail/` — board-tab.tsx, list-tab.tsx, timeline-tab.tsx, calendar-view.tsx, members-tab.tsx, settings-tab.tsx, backlog-panel.tsx, board-card.tsx
  - `Frontend2/components/task-detail/` — properties-sidebar.tsx, description-editor.tsx, sub-tasks-list.tsx, comments-section.tsx, history-section.tsx, attachments-section.tsx, dependencies-section.tsx, parent-task-link.tsx
  - `Frontend2/components/task-modal/` — task-create-modal.tsx, task-modal-provider.tsx + hook
  - `Frontend2/components/my-tasks/` — per D-32 component split
  - `Frontend2/components/header/create-button.tsx` — dropdown/single action button
  - `Frontend2/components/header/search-autocomplete.tsx` — autocomplete dropdown
  - `Frontend2/services/task-service.ts`, `label-service.ts`, `comment-service.ts`, `attachment-service.ts`
  - `Frontend2/hooks/use-tasks.ts`, `use-task-detail.ts`, `use-backlog.ts`, `use-labels.ts`, `use-watchers.ts`
  - `Frontend2/lib/dnd/` — dnd-provider.tsx, board-dnd.ts (handlers for cross-container drag)

### Cross-File Dependency Rules
- **Task Modal Context** must be mounted above `ProjectDetail`, `MyTasks`, and the Header. Place in root layout or shell layout.
- **DnD Context** must wrap Backlog + Board together (shared drag space). Mount in shell layout OR in project-detail page wrapper.
- **TipTap** is dynamically imported (`const TipTap = dynamic(() => import(...), { ssr: false })`) to avoid SSR issues — only loads when Rich mode selected.

</code_context>

<specifics>
## Specific Ideas

- **TaskModalContext exposes `openTaskModal({ defaultProjectId?, defaultType?, defaultParentId? })`** — the defaultParentId lets the Sub-tasks section's "Ekle" button pre-fill the parent for sub-task creation.
- **Header search shortcut Cmd/Ctrl+K** matches Linear/Notion/Vercel convention.
- **Sprint "current cycle" badge on board toolbar** — shows the project's current Sprint from `/api/v1/sprints?current=true`. Defaults to latest active sprint if no "current" marker.
- **Backlog panel width 300px** matches the requirement text exactly. Animate with `transition: margin-left 180ms ease` on the main content column.
- **Task Detail Parent Task link visual** — breadcrumb-like: icon + project name (muted) + chevron + parent key (mono) + parent title. Clickable like Jira epic link.
- **TipTap toolbar composition** — use @tiptap/starter-kit + @tiptap/extension-link + @tiptap/extension-image. Toolbar buttons use Button primitive with ghost variant; grouped with borders per action group.
- **Comments @mention** — simple custom matcher: `@` → open dropdown of project members filtered by subsequent characters. On select, insert `<span class="mention" data-user-id="X">@Name</span>` token into comment HTML.
- **Dependencies add via picker** — reuse the search input pattern from the header autocomplete, scoped to current project's tasks.
- **Audit log display** — if `audit_log.metadata` contains `{ field: "status", from: "todo", to: "progress" }`, render "Durumu *Yapılacak*tan *Devam Eden*e değiştirdi" in Turkish (localize field names + values with the same T() helper).
- **Label color derivation** — `hue = hash(label_name) % 360` → `oklch(70% 0.15 ${hue})` for the badge background, with auto-contrast foreground.
- **Scroll-zoom calendar** — listen `wheel` with `ctrlKey` → adjust cell height state by delta * 2. Clamp to [60, 160]. Debounce localStorage write.
- **Methodology matrix** (backlog definition, cycle label) should live as **const in `Frontend2/lib/methodology-matrix.ts`** — single source of truth used by Settings > General defaults, Task Modal cycle/phase visibility, and Backlog panel query builder.
- **WIP limit check on drop** — in @dnd-kit's onDragEnd: compute target column new length; if `newLength > column.wipLimit`, show AlertBanner + apply red bg tint to that column. Drop still proceeds (soft warn).
- **Sub-task row "key" width** — mono 80px like prototype List tab. Status badge dot. Due in "May 3" short format. Avatar 20px.
- **Properties sidebar inline edit** — wrap each editable value in a small component `<InlineEdit value={current} onCommit={patch} type="select" options={...} />`. Click → becomes input; Enter commits; Esc cancels; blur commits. Optimistic update + rollback.

</specifics>

<deferred>
## Deferred Ideas

### Pushed to Phase 12
- **Lifecycle tab content** (LIFE-01..07) — Phase 11 renders only the "coming soon" stub.
- **Settings > Lifecycle sub-tab** (phase completion criteria, phase assignment toggle UI, methodology change).
- **Workflow editor itself** (EDIT-01..07) — Phase 11 only renders a link-out button.
- **Cycle endpoints for non-Scrum methodologies** — Phase 11 disables cycle field with "Faz 12'de aktive edilecek".

### Pushed to Phase 13
- **Activity tab content** (PROF-01 timeline with icons, filters, pagination).
- **User Profile pages** (PROF-02..04).
- **Reporting charts** (REPT-01..04).
- **Full /search page** (header autocomplete has "Tümünü gör" link to this future page).
- **Worklog tab** on task detail.
- **Dedicated mobile responsive optimization** beyond the 1280/1024 breakpoint rules (D-54).

### Bulk Operations on Backlog Panel
- Explicitly deferred by user (D-15). Revisit in Phase 12 or 13 when the backlog workflow is battle-tested.

### Board Card Quick-Edit (hover dropdowns)
- User chose click=navigate. Inline quick-edit on board cards not in scope.

### Reviewed Todos (not folded)
None — no pending todos matched Phase 11 scope per STATE.md (2026-04-21 snapshot).

</deferred>

---

*Phase: 11-task-features-board-enhancements*
*Context gathered: 2026-04-22*
