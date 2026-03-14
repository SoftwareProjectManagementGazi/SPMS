# Phase 4: Views & UI - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can interact with project work through four view modes within the project detail page: a drag-and-drop Kanban board, a Calendar showing tasks and events, a read-only Gantt/timeline showing dependencies, and a sortable/filterable List view. View mode choice persists per project in localStorage. A dedicated Phase management page (/projects/[id]/sprints) is included for creating, editing, closing, and deleting project phases. Status columns are dynamic and configurable per project.

Requirements in scope: VIEW-01, VIEW-02, VIEW-03, VIEW-04.

</domain>

<decisions>
## Implementation Decisions

### Kanban Board (VIEW-01)

**Columns:**
- Columns are driven by the project's configured status list — NOT hardcoded. Backend returns statuses for the project; board renders one column per status.
- Dragging a card between columns fires `PATCH /tasks/{id}` with the new status value.

**DnD library:** `@dnd-kit/core` + `@dnd-kit/sortable` (not installed yet — add to package.json).

**Task card style (rich by default, collapsible to compact):**
- Rich card: task key (PROJ-42), title (2-line clamp), assignee avatar + name, priority badge, due date, label badges (max 2, then "+N more"), recurring icon (↺) if applicable, points badge.
- Card **border/frame** is priority-coded: CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=gray. Card body background stays neutral/natural.
- A board-level compact/rich toggle (top of the board) collapses cards to: key + title + priority border only.

**Phase filter:**
- Sprint filter dropdown above the board. Options: Backlog (tasks with sprint=null), named project phases, All.
- Default: active phase (if one exists), else All.

**Drag permissions:** All project members can drag tasks. No role restriction on status changes via drag.

**Drag-to-done warning:** If a task is dragged to a column whose status maps to "done" and the task has unresolved blocking dependencies → show a non-blocking warning toast. User can still complete the move.

**Task creation:** No per-column "Add task" button. Task creation via the existing top-level "+ New Task" button only.

**WIP limits:** None in Phase 4. Deferred to Phase 7 (Process Models).

**Mobile:** One column visible at a time. Horizontal swipe to navigate columns. Column name + task count shown in a tab strip at top. Touch drag supported via @dnd-kit's `TouchSensor`.

---

### Calendar View (VIEW-02)

**Library:** FullCalendar — `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid` (not installed yet).

**Events displayed:**
- Tasks with `due_date` set → rendered as event chips on that date.
- Recurring task instances → appear on each scheduled recurrence date.
- Project phases (sprints) → rendered as shaded background bands covering their date range, with sprint name as a banner at the top of the range.

**Interaction:**
- Click event → navigate to `/tasks/[id]`.
- Hover event → quick-view popover (title, assignee, status, priority). No popover on click.
- Drag event to different day → updates `due_date` via `PATCH /tasks/{id}`. FullCalendar `editable: true`.

**View modes:** Month (default) + Week. Mobile: Month view only.

**Undated tasks sidebar:**
- Collapsible, scrollable sidebar panel alongside the calendar listing tasks without a due date.
- Sidebar includes a search/filter field.
- Drag from sidebar onto a calendar day → sets `due_date` on the task via PATCH.

---

### Gantt / Timeline View (VIEW-03)

**Library:** `frappe-gantt` (not installed yet).

**Task bars:** Each bar spans from the task's `start_date` (fallback: `created_at`) to `due_date`.

**Dependencies:** Finish-to-start dependencies rendered as arrows between bars (frappe-gantt native support). Start-to-start dependency type deferred to Phase 7.

**Read-only:** No drag-to-reschedule. Dates are changed via the task detail page.

**Click bar:** Quick-view popover showing title, assignee, dates, status, priority, with a "View full task →" link to `/tasks/[id]`.

**Undated tasks:** Hidden from Gantt. An info note at the top: "N tasks without dates not shown."

**Time scale:** Day scale default. User can switch to Week scale via controls. Mobile: horizontal scroll.

---

### List View

**Columns (default, non-customizable in Phase 4):** Task Key | Title | Status | Assignee | Priority | Due Date.

**Sort:** Click column headers to sort ascending/descending.

**Filter:** Filter bar above the list — filter by Status, Priority, Assignee (multi-select dropdowns).

**Click row:** Navigates to `/tasks/[id]`.

**Pagination:** Uses existing Load More pattern (backend paginated endpoint, 20 per page).

---

### View Persistence (VIEW-04)

- Chosen view tab (board/calendar/timeline/list) persisted in `localStorage` keyed by `project-view-{projectId}`.
- On page load, read localStorage and default to the saved view.
- No backend user preference table needed.

---

### Phase (Sprint) Management

**Naming:** The DB model is "sprints" but the UI labels them **"phases"** with fully editable names (no locked "Sprint 1" naming).

**Location:** Separate `/projects/[id]/sprints` page (linked from project sidebar or a nav item).

**Operations:**
- Create phase: name (editable), start date, end date.
- Edit phase: name and dates (allowed while Planned or Active).
- Close/complete phase: triggers a dialog — "N incomplete tasks in this phase. Move them to: [dropdown of other phases or Backlog]."
- Delete phase: triggers a confirmation dialog — "N tasks in this phase. Move them to: [dropdown]."

**Phases list page shows:** Phase name, date range, status badge (Planned/Active/Closed), task count (done / total), progress bar.

---

### Task Status Management

**Default statuses for new project:** Backlog / Todo / In Progress / In Review / Done (5 columns).
- Phase 7 note: when PROC-02 (process model templates) is implemented, derive defaults from the selected process model instead.

**Who manages statuses:** Manager and Admin only. Members see columns read-only.

**Status management UI:** Project Settings tab → "Board Columns" section.
- List of current statuses with drag-to-reorder.
- Rename inline, delete with confirmation.
- "Add column" button at bottom.

**Deleting a status column:** Shows a dialog — "N tasks are in this column. Move them to: [dropdown of other statuses]." Required to complete deletion.

---

### Claude's Discretion

- Exact frappe-gantt React integration approach (wrapper lib vs direct DOM usage).
- How to represent recurring task instances as calendar events (generate occurrences client-side from recurrence data vs adding a backend endpoint).
- Color palette for phase background bands in the calendar.
- Exact localStorage key format and fallback if no saved view.
- Backend endpoint design for dynamic status list per project (new endpoint or added to project response).

</decisions>

<specifics>
## Specific Ideas

- "Sprints are phases for the project — not specifically named sprints, so label them 'phase' with an editable name."
- Card frame/border is color-coded by priority; card body stays neutral — priority indicator is the border only, not the full card.
- Rich cards are collapsible to compact at a board level (one toggle for all cards, not per-card).
- Undated task sidebar in Calendar has search functionality and allows drag-to-calendar to assign due date.
- Default 5 statuses (Backlog/Todo/In Progress/In Review/Done) — but noted explicitly: this changes in Phase 7 to be driven by process model.
- Phase management page shows progress bars per phase (done/total task count) — useful for sprint health at a glance.
- When closing a phase, user picks where incomplete tasks land (dialog with dropdown) — not automatic move.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Frontend/app/projects/[id]/page.tsx` — already has Board/List/Timeline/Members/Settings tabs with `<Tabs>`. Board is a card grid stub; List and Timeline tabs show "coming soon" messages. This is the integration point for all four views.
- `components/ui/card.tsx`, `badge.tsx`, `avatar.tsx` — all in use on the current board tab; reuse directly for Kanban cards.
- `components/ui/tabs.tsx` (Radix Tabs) — already installed and in use on the project detail page.
- `components/ui/confirm-dialog.tsx` — established in Phase 2; use for status column deletion and phase close/delete confirmations.
- `components/ui/calendar.tsx` (shadcn date picker, react-day-picker) — NOT the scheduling calendar. Keep this for date inputs; use FullCalendar separately for the Calendar view tab.
- `components/project/members-tab.tsx` — pattern for how a tab's content component is structured.
- `components/project/customize-columns.tsx` + `field-toggles.tsx` — existing column management UI components; could inform Board Columns settings UI.
- `Frontend/services/task-service.ts` — `PATCH /tasks/{id}` already wired; use for status update on DnD drop and due-date update on calendar drag.
- `recharts` installed — no conflict with FullCalendar or frappe-gantt.

### Established Patterns
- TanStack Query `useMutation` + `invalidateQueries(['project-tasks-paginated', id])` — all status/date updates via drag follow this pattern.
- Clean Architecture: if new backend endpoints are needed (status list, phase progress), they follow Domain → Application → Infrastructure → API with `Depends()` for auth.
- `getByProjectPaginated(id, page, PAGE_SIZE)` — existing paginated task fetch; List view reuses this with added sort/filter query params.
- ConfirmDialog pattern: controlled `open` state managed by caller, not internal trigger.
- Phase 3 established: sprint endpoints (`GET /sprints?project_id=X`, `POST /sprints`, `PATCH /sprints/{id}`, `DELETE /sprints/{id}`) are already built on the backend.

### Integration Points
- Board tab in `page.tsx` — replace card grid with true Kanban column layout using @dnd-kit.
- List tab in `page.tsx` — replace "coming soon" with table + sort/filter + pagination.
- Timeline tab in `page.tsx` — replace "coming soon" with frappe-gantt component.
- New: Calendar tab — add to the Tabs list alongside Board/List/Timeline.
- New: `/projects/[id]/sprints` page — sprint/phase management UI.
- New: Project Settings tab → Board Columns section — status CRUD UI.
- Backend: need a status/column list endpoint per project (or include in project response) since statuses are dynamic.

### New Libraries to Install
- `@dnd-kit/core` + `@dnd-kit/sortable` — Kanban drag-and-drop.
- `@fullcalendar/react` + `@fullcalendar/daygrid` + `@fullcalendar/timegrid` — Calendar view.
- `frappe-gantt` — Gantt/Timeline view.

</code_context>

<deferred>
## Deferred Ideas

- WIP (Work In Progress) limits per Kanban column → Phase 7 (Process Models/Kanban methodology config).
- View preference synced across devices (backend user_project_preferences table) → future enhancement if needed.
- Default status columns derived from selected process model (Scrum/Kanban/Waterfall/Iterative) → Phase 7 (PROC-02).
- Start-to-start dependency type visual in Gantt → Phase 7 (Gantt enhancement tied to process model).
- Sprint/Phase assignment directly from Kanban board (drag card into a sprint lane) → Phase 7 if needed.

</deferred>

---

*Phase: 04-views-ui*
*Context gathered: 2026-03-15*
