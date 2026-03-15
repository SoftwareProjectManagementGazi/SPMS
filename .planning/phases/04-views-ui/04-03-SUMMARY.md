---
phase: 04-views-ui
plan: "03"
subsystem: ui
tags: [kanban, dnd-kit, react-query, next-dynamic, localStorage, board-columns, sprint-filter]

# Dependency graph
requires:
  - phase: 04-01
    provides: board column CRUD API and boardColumnService.getColumns endpoint
  - phase: 04-02
    provides: CalendarTab and GanttTab components for dynamic import
provides:
  - "Drag-and-drop Kanban board (DndContext, KanbanColumn, KanbanCard) backed by live backend columns"
  - "boardColumnService with GET/POST/PATCH/DELETE /projects/{id}/columns"
  - "View persistence: project detail page last-used tab stored in localStorage keyed by project-view-{projectId}"
  - "Calendar and Gantt tabs wired into project detail page via next/dynamic ssr:false"
  - "Sprint filter dropdown in BoardTab for filtering tasks by sprint, backlog, or all"
  - "Compact/rich card toggle collapsing all KanbanCards simultaneously"
  - "Mobile single-column Kanban with horizontal tab strip"
affects:
  - "04-04 (Settings tab Board Columns section, ListTab stub replacement)"
  - "Phase 7 (dependency arrows on Gantt)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@dnd-kit/core DndContext + useDroppable + DragOverlay pattern for multi-container Kanban"
    - "useSortable per card with CSS.Transform.toString for transform+transition style"
    - "next/dynamic({ ssr: false }) for frappe-gantt and FullCalendar SSR-incompatible components"
    - "localStorage-backed controlled Tabs (useState initializer reads from localStorage)"
    - "React Query v5 pattern: onSuccess moved to useEffect watching query data (onSuccess removed in v5)"

key-files:
  created:
    - Frontend/services/board-column-service.ts
    - Frontend/components/project/kanban-card.tsx
    - Frontend/components/project/kanban-column.tsx
    - Frontend/components/project/board-tab.tsx
  modified:
    - Frontend/app/projects/[id]/page.tsx

key-decisions:
  - "[04-03]: onSuccess callback removed from useQuery — React Query v5 dropped it; sprint default set via useEffect watching sprints data"
  - "[04-03]: tasksByColumn typed explicitly as Record<string, ParentTask[]> to fix TS2488 iterator errors"
  - "[04-03]: drag-to-done warning uses generic toast (no task dependency data on ParentTask); always shows on last-column drop per CONTEXT.md"
  - "[04-03]: Mobile layout uses block/hidden sm:flex responsive classes — no JS breakpoint detection needed"
  - "[04-03]: DragOverlay KanbanCard uses overlay=true prop to skip drag listeners, preventing double sensor registration"

patterns-established:
  - "Multi-container DnD: useDroppable per column (id=col-{id}) + SortableContext items={tasks.map(t=>t.id)} per column"
  - "Column tasks lookup: tasksByColumn Record<colId, ParentTask[]> rebuilt in useMemo on filteredTasks+columns change"
  - "getColumnIdForTask() iterates tasksByColumn to find source column during handleDragEnd"

requirements-completed: [VIEW-01, VIEW-04]

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 4 Plan 03: Kanban Board + View Persistence Summary

**Drag-and-drop Kanban board using @dnd-kit multi-container with live backend columns, sprint filter, compact/rich toggle, mobile tab strip, and localStorage view persistence wiring CalendarTab and GanttTab into project detail page**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-15T07:50:51Z
- **Completed:** 2026-03-15T07:54:28Z
- **Tasks:** 2/2
- **Files modified:** 5

## Accomplishments

- Built full Kanban board with @dnd-kit/core DndContext, per-column useDroppable, per-card useSortable, and DragOverlay ghost card
- handleDragEnd resolves destination column from drop target (col-{id} or task id) and fires taskService.patchTask with new column_id
- Project detail page upgraded: controlled Tabs with localStorage persistence, Calendar + Timeline tabs wired to dynamically imported CalendarTab/GanttTab (ssr:false)

## Task Commits

1. **Task 1: board-column-service.ts + KanbanCard + KanbanColumn** - `0f3115a` (feat)
2. **Task 2: BoardTab + page.tsx view persistence + Calendar/Gantt** - `93a0996` (feat)

## Files Created/Modified

- `Frontend/services/board-column-service.ts` - CRUD service for /projects/{id}/columns; exports boardColumnService + BoardColumn interface
- `Frontend/components/project/kanban-card.tsx` - Draggable card with useSortable, priority border-l-4 color coding, rich/compact modes, overlay prop
- `Frontend/components/project/kanban-column.tsx` - Column container with useDroppable (col-{id}) + SortableContext, WIP limit badge, isOver highlight
- `Frontend/components/project/board-tab.tsx` - Full Kanban: DndContext, sprint filter Select, compact/rich toggle, mobile tab strip, handleDragEnd with drag-to-done toast
- `Frontend/app/projects/[id]/page.tsx` - Controlled Tabs (localStorage), Calendar tab, Timeline tab (GanttTab), BoardTab replaces static card grid, Settings stub

## Decisions Made

- React Query v5 removed `onSuccess` from `useQuery` — sprint default detection moved to `useEffect` watching the `sprints` data value with a `sprintDefaultSet` flag to prevent infinite loops
- `tasksByColumn` explicitly typed as `Record<string, ParentTask[]>` — TypeScript could not infer the type from an empty `{}` literal, causing TS2488 iterator errors on useMemo result
- Drag-to-done warning always shows on drop to last column regardless of dependency data, because `ParentTask` type carries no dependency IDs (deferred to Phase 7 per CONTEXT.md decision)
- Mobile layout implemented with Tailwind responsive classes (`block sm:hidden` / `hidden sm:flex`) — no JS-side breakpoint detection
- `overlay` prop on `KanbanCard` skips `{...listeners}` attachment to prevent @dnd-kit double sensor registration in DragOverlay

## Mobile Single-Column View Implementation

The mobile view (`block sm:hidden`) renders a horizontal scrollable tab strip above a single `KanbanColumn`. `useState<number>(0)` tracks `activeColumnIndex`. Each button in the strip calls `setActiveColumnIndex(idx)`. The single column below renders `sortedColumns[activeColumnIndex]` with its tasks from `tasksByColumn`. The full DndContext wraps both mobile and desktop layouts so drag-and-drop works on mobile too (TouchSensor with 250ms delay).

## Drag-to-Done Warning

The plan required a non-blocking toast if a task has blocking dependencies when dragged to the last column. Since `ParentTask` has no dependency ID field (deferred to Phase 7 per existing decision from 04-02 SUMMARY), the implementation shows a generic warning toast to all drops on the last column (`toast.warning`). This matches CONTEXT.md's intent — the warning is non-blocking and informational.

## @dnd-kit vs React 19

No compatibility issues encountered. `@dnd-kit/core@6.3.1` and `@dnd-kit/sortable@10.0.0` are already installed in the project (from 04-01 planning). `@dnd-kit/utilities` is present in node_modules (installed as a transitive dependency) and `CSS.Transform.toString` works correctly.

## page.tsx Structural Changes

**Removed:**
- Static card grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) in board TabsContent
- Load More button (pagination handled inside BoardTab via parent's `allTasks` accumulation)
- `<Tabs defaultValue="board">` (replaced with controlled)
- Unused imports: `CardContent`, `Avatar`, `AvatarFallback`, `AvatarImage`

**Added:**
- `import dynamic from "next/dynamic"`
- `const CalendarTab = dynamic(..., { ssr: false })`
- `const GanttTab = dynamic(..., { ssr: false })`
- `import { BoardTab } from "@/components/project/board-tab"`
- `<Tabs value={activeView} onValueChange={handleViewChange}>`
- `useState<string>` with localStorage initializer for `activeView`
- `useEffect` to re-sync `activeView` on project `id` change
- `<TabsTrigger value="calendar">Calendar</TabsTrigger>`
- `<TabsContent value="calendar">` with CalendarTab
- `<TabsContent value="timeline">` with GanttTab (replaces "coming soon" stub)
- `<TabsContent value="settings">` stub (plan 04-04 adds Board Columns section)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] React Query v5 onSuccess callback**
- **Found during:** Task 2 (BoardTab implementation)
- **Issue:** Plan used `onSuccess` in `useQuery` options, but React Query v5 removed this callback; TypeScript threw TS2769 overload errors
- **Fix:** Replaced both `onSuccess` callbacks with `useEffect` watching the query data values; added `sprintDefaultSet` boolean flag to prevent repeat executions
- **Files modified:** Frontend/components/project/board-tab.tsx
- **Verification:** npx tsc --noEmit reports no errors in board-tab.tsx
- **Committed in:** 93a0996 (Task 2 commit)

**2. [Rule 1 - Bug] tasksByColumn implicit any type inference**
- **Found during:** Task 2 (BoardTab implementation)
- **Issue:** `useMemo` initialized with `const map: Record<string, ParentTask[]> = {}` but TypeScript inferred `{}` as return type, causing TS7006/TS2488 errors on all map accesses
- **Fix:** Added explicit `(): Record<string, ParentTask[]>` return type annotation to the useMemo callback
- **Files modified:** Frontend/components/project/board-tab.tsx
- **Verification:** npx tsc --noEmit reports no errors
- **Committed in:** 93a0996 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 x Rule 1 - bug in React Query v5 API usage + TypeScript inference)
**Impact on plan:** Both fixes necessary for TypeScript compilation. Behavior matches plan spec exactly.

## Issues Encountered

- Pre-existing TypeScript errors in `lib/mock-data.ts`, `app/page.tsx`, and `components/task-detail/task-header.tsx` are unrelated to this plan and were not touched (out of scope per deviation rules boundary).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Kanban board is functional; plan 04-04 can add Board Columns management in the Settings tab
- ListTab stub is in place; plan 04-04 replaces it with the real list component
- BoardTab receives `tasks` from parent's accumulated `allTasks` — no internal pagination needed
- CalendarTab and GanttTab are mounted via dynamic imports; no SSR issues

---
*Phase: 04-views-ui*
*Completed: 2026-03-15*
