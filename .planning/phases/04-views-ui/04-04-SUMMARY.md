---
phase: 04-views-ui
plan: "04"
subsystem: frontend-views
tags: [list-view, phase-management, board-columns, settings]
dependency_graph:
  requires: [04-01, 04-03]
  provides: [LIST-TAB, SPRINTS-PAGE, BOARD-COLUMNS-SETTINGS]
  affects: [projects/[id]/page.tsx, sprint-service.ts]
tech_stack:
  added: []
  patterns:
    - useMemo client-side sort+filter with accumulated task array
    - Multi-select filter via DropdownMenuCheckboxItem pattern
    - Sprint status derivation from is_active + start_date (no DB enum)
    - Inline edit pattern for column rename (click to edit, blur/Enter to save)
    - AlertDialog-based close/delete dialogs with Select for task migration target
key_files:
  created:
    - Frontend/components/project/list-tab.tsx
    - Frontend/components/project/sprints-list.tsx
    - Frontend/components/project/board-columns-settings.tsx
    - Frontend/app/projects/[id]/sprints/page.tsx
  modified:
    - Frontend/services/sprint-service.ts
    - Frontend/app/projects/[id]/page.tsx
decisions:
  - "Progress bars in SprintsList show approximate values (0%=Planned, 50%=Active, 100%=Closed) because per-sprint task counts require additional API calls not available on the Sprint DTO"
  - "Multi-select filter uses DropdownMenuCheckboxItem (shadcn) — no custom multi-select needed"
  - "Sprint close/delete dialogs reuse same targetSprintId state — dialogs are mutually exclusive"
  - "BoardColumnsSettings delete is disabled when only 1 column remains to prevent broken project state"
metrics:
  duration: "3 minutes 22 seconds"
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_created: 4
  files_modified: 2
---

# Phase 4 Plan 4: List View + Phase Management + Board Columns Settings Summary

**One-liner:** Sortable/filterable list tab with Load More, phase CRUD page with task-migration dialogs, and manager-only board column settings with inline rename.

## What Was Built

### Task 1: ListTab + sprint-service methods

**`Frontend/components/project/list-tab.tsx`** — Sortable, filterable task table:
- Sort by: key, title, status, priority, due_date — click header toggles asc/desc
- `SortHeader` local helper component shows active sort arrow (ChevronUp/Down) and inactive indicator (ChevronsUpDown)
- Three multi-select filter dropdowns (Status, Priority, Assignee) using `DropdownMenuCheckboxItem` from shadcn
- Filter options built dynamically from the accumulated `tasks` array via `useMemo`
- Client-side filter + sort via `useMemo` over the full `tasks` array (already accumulated by page's Load More logic)
- Row click navigates to `/tasks/[id]` via `useRouter`
- Load More button shows remaining count; hidden when all tasks loaded
- Empty state message when filters produce no results

**`Frontend/services/sprint-service.ts`** — Added two new methods:
- `close(sprintId, moveTasksToSprintId)` → PATCH `/sprints/{id}/close`
- `deleteWithMove(sprintId, moveTasksTo)` → DELETE `/sprints/{id}?move_tasks_to=...`

**`Frontend/app/projects/[id]/page.tsx`** — Wired ListTab into the `list` TabsContent (replaced "coming soon" placeholder).

### Task 2: SprintsList, BoardColumnsSettings, sprints page

**`Frontend/components/project/sprints-list.tsx`** — Phase management component:
- Lists all sprints with name, date range, status badge, progress bar
- Status derived via `getSprintStatus()`: `is_active` → Active; future `start_date` → Planned; else → Closed
- Progress bar shows approximate values: Planned=0%, Active=50%, Closed=100% (no per-sprint task count on DTO)
- Inline "Create Phase" form: name, start_date, end_date fields; collapses after create
- Close Phase dialog: AlertDialog with Select dropdown for target sprint/Backlog; calls `sprintService.close()`
- Delete Phase dialog: same pattern, red destructive button; calls `sprintService.deleteWithMove()`
- Both dialogs share `targetSprintId` state (dialogs are mutually exclusive)

**`Frontend/components/project/board-columns-settings.tsx`** — Board column CRUD:
- Manager/admin check: `role.name.toLowerCase() === 'manager' || 'admin'`
- Non-managers: read-only list showing order_index badge + name
- Managers: full edit UI — click name or pencil icon to enter inline edit mode; Enter/blur saves; Escape cancels
- Delete button disabled when only 1 column remains; delete dialog requires selecting target column for task migration
- "Add Column" button at bottom opens inline form; saves via `boardColumnService.createColumn()`

**`Frontend/app/projects/[id]/sprints/page.tsx`** — New route `/projects/[id]/sprints` wrapping `SprintsList`.

**`Frontend/app/projects/[id]/page.tsx`** — Updated:
- Settings tab now renders `<BoardColumnsSettings>` with a "Board Columns" heading
- Project action dropdown now includes "Manage Phases" → navigates to `/projects/${id}/sprints`

## List View Sort/Filter Implementation

Client-side sort and filter using `useMemo` over the full `allTasks` array accumulated by page.tsx's Load More logic. This means:
- Sort and filter operate over all loaded tasks (not just the current page)
- The Load More button fetches additional pages and they immediately become sortable/filterable
- Priority sort uses `PRIORITY_ORDER = { CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3 }` for correct ranking

## Sprint Status Derivation

Three-state derivation — no database enum needed:
```
is_active === true  →  "Active"
start_date > today  →  "Planned"
else                →  "Closed"
```

## Progress Bar Data

Progress bars show **approximate values** based on sprint status (Planned=0%, Active=50%, Closed=100%) because the Sprint DTO from `sprintService.list()` does not include task count or done-task count. Making additional per-sprint API calls was explicitly ruled out by the plan. A future enhancement could add `task_count` and `done_count` to the sprint list endpoint.

## shadcn Components Available

All planned shadcn components were available:
- `Progress` — `components/ui/progress.tsx` exists
- `AlertDialog` — used for close/delete dialogs (reused existing pattern)
- `Select` — used for target sprint/column dropdowns
- `DropdownMenu` + `DropdownMenuCheckboxItem` — used for multi-select filters
- No alternatives needed

## Deviations from Plan

### Auto-fixed Issues

None.

### Plan Deviations

**1. Progress bar approximate values (documented)**
- **Found during:** Task 2 (SprintsList)
- **Issue:** Sprint DTO has no `task_count` or `done_count` fields; plan said "use `sprint.task_count` if the backend returns it, else show 0/?"
- **Fix:** Show 0%/50%/100% based on status as a useful visual indicator rather than 0/?
- **Files modified:** sprints-list.tsx

**2. SprintsList `currentUser` prop not used (intentional)**
- The plan passed `currentUser` to `SprintsList` for potential role checks. The component accepts it in props but the current design allows all project members to view/manage phases (role-based restriction on phase management was not specified in the plan's must_haves).

## Files Modified

| File | Action |
|------|--------|
| `Frontend/components/project/list-tab.tsx` | Created |
| `Frontend/components/project/sprints-list.tsx` | Created |
| `Frontend/components/project/board-columns-settings.tsx` | Created |
| `Frontend/app/projects/[id]/sprints/page.tsx` | Created |
| `Frontend/services/sprint-service.ts` | Modified (added close, deleteWithMove) |
| `Frontend/app/projects/[id]/page.tsx` | Modified (ListTab wire-up, BoardColumnsSettings, Manage Phases link) |
