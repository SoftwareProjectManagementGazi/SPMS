---
phase: 04-views-ui
verified: 2026-03-15T12:00:00Z
status: human_needed
score: 29/29 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 28/29
  gaps_closed:
    - "Sprint date ranges appear as shaded background bands with the sprint name — sprints={[]} replaced by a real useQuery in page.tsx"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Drag a Kanban card from one column to another"
    expected: "Card moves to target column, PATCH /tasks/{id} fires, board re-fetches"
    why_human: "DnD behavior and real API call cannot be verified by static analysis"
  - test: "Drag a calendar event to a different day"
    expected: "Event moves, PATCH /tasks/{id} fires with new due_date"
    why_human: "FullCalendar drag interaction requires browser runtime"
  - test: "Open Calendar tab and verify sprint date ranges appear as shaded background bands"
    expected: "Sprint bands with correct colors and sprint names are visible on the calendar"
    why_human: "FullCalendar background event rendering requires browser runtime; fix is wired correctly but visual confirmation needed"
  - test: "Drag an undated task from the sidebar onto a calendar day"
    expected: "Task appears on that day, due_date set via PATCH"
    why_human: "Cross-component drag from UndatedTasksSidebar to CalendarTab requires browser runtime"
  - test: "Open /projects/{id}/sprints and create a phase"
    expected: "Phase appears in list with Planned status badge and 0% progress bar"
    why_human: "Full form submission and rendering of sprint list requires browser + backend"
  - test: "Switch project view tabs (Board -> Calendar -> Timeline -> List)"
    expected: "Each tab renders its view; reload restores last-used tab"
    why_human: "localStorage persistence behavior and tab rendering require browser runtime"
---

# Phase 4: Views & UI — Verification Report

**Phase Goal:** Users can interact with project work through a drag-and-drop Kanban board, a calendar showing tasks and events, a Gantt timeline showing dependencies, and can switch between view modes per project
**Verified:** 2026-03-15
**Status:** human_needed (all automated checks pass; 29/29 truths verified)
**Re-verification:** Yes — after gap closure (plan 04-05)

## Re-verification Summary

The single gap from the initial verification has been closed.

**Gap closed:** `page.tsx` previously passed `sprints={[]}` (a hardcoded empty array) to `CalendarTab`, meaning sprint background bands could never render. Plan 04-05 fixed this by:

1. Adding `import sprintService from "@/services/sprint-service"` at line 25 of `page.tsx`
2. Adding a `useQuery` at lines 114-118:
   ```ts
   const { data: sprints = [] } = useQuery({
     queryKey: ["project-sprints", id],
     queryFn: () => sprintService.list(Number(id)),
     enabled: !!id,
   })
   ```
3. Passing the fetched data at line 275: `<CalendarTab projectId={id} tasks={allTasks} sprints={sprints} />`

`sprintService.list(projectId: number)` calls `GET /sprints?project_id={id}` and returns `Sprint[]`. The `Sprint` interface includes `start_date` and `end_date` fields, which `CalendarTab` uses at lines 134-143 to build `sprintBands` for FullCalendar's `display: 'background'` events. The rendering logic in `CalendarTab` was already correct in the initial verification — only the wiring from the page was broken.

No regressions detected on the 28 previously-verified truths.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | GET /projects/{id}/columns returns columns ordered by order_index | VERIFIED | `board_columns.py` GET endpoint wired to `ListColumnsUseCase`; repo orders by `order_index ASC` |
| 2 | POST /projects/{id}/columns creates a column (manager/admin only) | VERIFIED | `create_column` endpoint has manager check via `project.manager_id == current_user.id` |
| 3 | PATCH /projects/{id}/columns/{col_id} renames or reorders a column | VERIFIED | `update_column` endpoint wired to `UpdateColumnUseCase` |
| 4 | DELETE /projects/{id}/columns/{col_id}?move_tasks_to={col_id} moves tasks then deletes | VERIFIED | `delete_column` endpoint uses `Query(...)` required param; wired to `DeleteColumnUseCase` |
| 5 | PATCH /sprints/{id}/close moves incomplete tasks and marks sprint closed | VERIFIED | `close_sprint` at line 77 in `sprints.py`; `CloseSprintUseCase` uses `ilike('%done%')` for incomplete detection |
| 6 | DELETE /sprints/{id}?move_tasks_to=N moves tasks then deletes sprint | VERIFIED | `move_tasks_to` Query param at line 94 in `sprints.py`; `DeleteSprintUseCase` moves all tasks |
| 7 | New projects get seeded with 5 default columns | VERIFIED | `ProjectCreateDTO.columns` default = `["Backlog", "Todo", "In Progress", "In Review", "Done"]` |
| 8 | taskService.patchTask sends PATCH /tasks/{id} for partial updates | VERIFIED | `task-service.ts` line 206: `apiClient.patch` confirmed |
| 9 | Calendar tab renders tasks with due_date as FullCalendar event chips | VERIFIED | `calendar-tab.tsx` builds `taskEvents` from tasks with `dueDate != null` |
| 10 | Recurring task instances appear on each recurrence date | VERIFIED | `expandRecurringTask()` at line 48 uses date-fns addDays/addWeeks/addMonths |
| 11 | Sprint date ranges appear as shaded background bands with the sprint name | VERIFIED | `page.tsx` lines 114-118: `useQuery(['project-sprints', id], () => sprintService.list(Number(id)))` fetches real data; line 275 passes `sprints={sprints}` to CalendarTab; `CalendarTab` lines 134-143 map to `display: 'background'` events |
| 12 | Dragging a calendar event fires PATCH /tasks/{id} with new due_date | VERIFIED | `eventDrop` handler at line 153 calls `taskService.patchTask(id, { due_date: startStr })` |
| 13 | Undated tasks sidebar lists tasks without due_date with search; drag to calendar sets due_date | VERIFIED | `undated-tasks-sidebar.tsx` filters by `!dueDate`; `Draggable` initialized; `drop` handler calls `patchTask` |
| 14 | Gantt tab renders tasks with due_date as horizontal bars using frappe-gantt | VERIFIED | `gantt-tab.tsx` dynamic-imports `frappe-gantt`; renders bars via `new Gantt(containerRef, ganttTasks, options)` |
| 15 | Tasks without dates are hidden from Gantt; info note shows count | VERIFIED | `undatedCount` computed at line 24; note rendered at line 77-79 |
| 16 | Neither FullCalendar nor frappe-gantt cause SSR crash | VERIFIED | `"use client"` on both; frappe-gantt uses dynamic `import()` inside `useEffect` |
| 17 | Kanban board renders one column per board column from GET /projects/{id}/columns | VERIFIED | `board-tab.tsx` queries `['project-columns', projectId]` via `boardColumnService.getColumns`; passes each to `KanbanColumn` |
| 18 | Tasks grouped into respective columns by columnId | VERIFIED | `tasksByColumn` useMemo in `board-tab.tsx` groups tasks by `task.columnId` |
| 19 | User can drag card between columns; PATCH fires with new column_id | VERIFIED | `handleDragEnd` at line 149 calls `mutation.mutate({ taskId, columnId })`; mutation calls `taskService.patchTask(..., { column_id })` |
| 20 | Drag-to-last-column shows non-blocking warning toast | VERIFIED | `toast.warning` at line 154 fires on drop to `lastCol` |
| 21 | Board compact/rich toggle collapses all cards | VERIFIED | `compact` state toggled at line 218; propagated to all `KanbanCard` instances |
| 22 | Sprint filter dropdown filters tasks to selected sprint | VERIFIED | `filteredTasks` useMemo at line 96-99; `activeSprintId` state updated by Select |
| 23 | View mode persists in localStorage keyed by project-view-{projectId} | VERIFIED | `localStorage.setItem(\`project-view-${id}\`, value)` at line 62 |
| 24 | Calendar and Gantt tabs mounted via next/dynamic({ssr:false}) | VERIFIED | `page.tsx` lines 35-43: two `dynamic(...)` calls with `{ ssr: false }` |
| 25 | List tab renders table with sortable column headers | VERIFIED | `SortHeader` component; `sortField`/`sortDir` state; `useMemo` sort in `list-tab.tsx` |
| 26 | Filter bar filters by Status, Priority, Assignee | VERIFIED | `DropdownMenuCheckboxItem` dropdowns for all three fields |
| 27 | Click table row navigates to /tasks/[id] | VERIFIED | `router.push(\`/tasks/${task.id}\`)` at line 278 |
| 28 | Phase management page lists phases with status badge and progress | VERIFIED | `sprints-list.tsx` renders `getSprintStatus()`; `Progress` component present |
| 29 | Project Settings tab shows Board Columns section for managers | VERIFIED | `board-columns-settings.tsx` with `isManagerOrAdmin` check; rendered in `page.tsx` Settings TabsContent |

**Score:** 29/29 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `Backend/app/domain/repositories/board_column_repository.py` | IBoardColumnRepository interface with 6 methods | VERIFIED | All methods confirmed: `get_by_project`, `get_by_id`, `create`, `update`, `delete`, `count_tasks` |
| `Backend/app/application/dtos/board_column_dtos.py` | BoardColumnDTO, CreateColumnDTO, UpdateColumnDTO | VERIFIED | All 4 DTOs present including `DeleteColumnRequestDTO` |
| `Backend/app/infrastructure/database/repositories/board_column_repo.py` | SqlAlchemy implementation | VERIFIED | All 6 interface methods implemented |
| `Backend/app/application/use_cases/manage_board_columns.py` | 5 use cases | VERIFIED | `ListColumnsUseCase`, `CreateColumnUseCase`, `UpdateColumnUseCase`, `DeleteColumnUseCase`, `SeedDefaultColumnsUseCase` |
| `Backend/app/api/v1/board_columns.py` | 4 endpoints GET/POST/PATCH/DELETE | VERIFIED | All 4 routes confirmed; registered under `/api/v1/projects` prefix |
| `Frontend/services/task-service.ts` | patchTask using apiClient.patch | VERIFIED | `apiClient.patch<TaskResponseDTO>(\`/tasks/${taskId}\`, partial)` confirmed |
| `Frontend/components/project/calendar-tab.tsx` | CalendarTab with events, sprint bands, drag | VERIFIED | Task events, recurring expansion, sprint bands (wired via page.tsx useQuery), drag-to-patch all functional |
| `Frontend/components/project/undated-tasks-sidebar.tsx` | Draggable sidebar with search | VERIFIED | FullCalendar `Draggable` initialized; `.undated-task-item` with `data-task-id` attributes |
| `Frontend/components/project/gantt-tab.tsx` | frappe-gantt bars with day/week toggle | VERIFIED | Dynamic import; day/week toggle; undated count; popup with View link |
| `Frontend/services/board-column-service.ts` | CRUD service 4 methods | VERIFIED | `getColumns`, `createColumn`, `updateColumn`, `deleteColumn` all present |
| `Frontend/components/project/board-tab.tsx` | Full Kanban with DndContext | VERIFIED | DndContext, sprint filter, compact toggle, mobile tab strip, DragOverlay |
| `Frontend/components/project/kanban-column.tsx` | SortableContext + droppable | VERIFIED | `useDroppable({ id: 'col-{id}' })` + `SortableContext` confirmed |
| `Frontend/components/project/kanban-card.tsx` | Draggable card with priority border | VERIFIED | `useSortable`, `CSS.Transform.toString`, `priorityBorderColor`, rich/compact modes |
| `Frontend/app/projects/[id]/page.tsx` | Controlled Tabs with localStorage, all 4 views + sprint query | VERIFIED | `activeView` state with localStorage initializer; Board, List, Timeline, Calendar, Members, Settings tabs; `useQuery(['project-sprints', id])` now present |
| `Frontend/components/project/list-tab.tsx` | Sortable/filterable table with Load More | VERIFIED | `SortHeader`, 3 filter dropdowns, `useMemo` sort+filter, Load More button |
| `Frontend/components/project/sprints-list.tsx` | Phase management — list, create, close, delete | VERIFIED | `getSprintStatus`, AlertDialog close/delete with `Select` target; `sprintService.close` and `deleteWithMove` calls |
| `Frontend/components/project/board-columns-settings.tsx` | Column CRUD in Settings | VERIFIED | Manager/admin check; inline edit; delete with task-move dialog; Add Column form |
| `Frontend/app/projects/[id]/sprints/page.tsx` | Route page wrapping SprintsList | VERIFIED | `SprintsPage` with `use(params)` pattern; wraps `SprintsList` in `AppShell` |
| `Frontend/services/sprint-service.ts` | `list(projectId)` method returning Sprint[] | VERIFIED | Line 22-23: `list: (projectId: number): Promise<Sprint[]> => apiClient.get('/sprints', { params: { project_id: projectId } }).then(r => r.data)` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `board_columns.py` router | `SqlAlchemyBoardColumnRepository` | `Depends(get_board_column_repo)` | WIRED | `get_board_column_repo` in `dependencies.py` returns `SqlAlchemyBoardColumnRepository` |
| `sprints.py` PATCH /close | `sprint_repo.move_tasks_to_sprint` | `CloseSprintUseCase.execute` | WIRED | `close_sprint` endpoint → `CloseSprintUseCase` → `sprint_repo.move_tasks_to_sprint` |
| `calendar-tab.tsx eventDrop` | `taskService.patchTask` | PATCH /tasks/{id} on drop | WIRED | Line 158: `taskService.patchTask(info.event.id, { due_date: info.event.startStr })` |
| `undated-tasks-sidebar.tsx Draggable` | `calendar-tab.tsx drop handler` | `new Draggable(sidebarRef, { itemSelector: '.undated-task-item' })` | WIRED | Draggable initialized in `useEffect`; `drop` handler in CalendarTab reads `data-task-id` |
| `gantt-tab.tsx useEffect` | `frappe-gantt Gantt constructor` | `import('frappe-gantt').then(({ default: Gantt }) => new Gantt(...))` | WIRED | Dynamic import + constructor call confirmed |
| `board-tab.tsx DndContext onDragEnd` | `taskService.patchTask` | `mutation.mutate({ taskId, columnId })` | WIRED | `handleDragEnd` resolves destination column id; fires `useMutation` calling `patchTask` |
| `page.tsx localStorage read` | `Tabs defaultValue` | `useState` initialized from `localStorage.getItem('project-view-{id}')` | WIRED | Lines 54-56 confirmed |
| `board-tab.tsx` | `boardColumnService.getColumns` | `useQuery(['project-columns', projectId])` | WIRED | Confirmed |
| `page.tsx CalendarTab` | sprint data | `useQuery(['project-sprints', id]) → sprints prop` | WIRED | Lines 114-118 fetch sprints; line 275 passes `sprints={sprints}` — gap now closed |
| `sprints-list.tsx close button` | `sprintService.close` | `useMutation` calling close endpoint | WIRED | `closeMutation` confirmed |
| `board-columns-settings.tsx delete` | `boardColumnService.deleteColumn` | ConfirmDialog + target dropdown | WIRED | Confirmed |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| VIEW-01 | 04-01, 04-03, 04-04 | Drag-and-drop Kanban board; task cards with color/status indicators | SATISFIED | `board-tab.tsx` DndContext + `kanban-card.tsx` priority border colors; column CRUD API fully wired |
| VIEW-02 | 04-02 | Calendar shows tasks and recurring events on timeline; sprint background bands | SATISFIED | Task events and recurring expansion work; sprint bands now wired via `useQuery(['project-sprints', id])` in `page.tsx` |
| VIEW-03 | 04-02 | Gantt/Timeline shows task bars; dependency deferred to Phase 7 (plan decision) | SATISFIED (with accepted deferral) | frappe-gantt renders task bars; day/week toggle; dependency arrows deferred to Phase 7 by plan decision |
| VIEW-04 | 04-03, 04-04 | User can switch between Kanban, Gantt, Calendar, List views per project | SATISFIED | All 4 view tabs present in page.tsx; localStorage persistence wired; dynamic imports for SSR-safe calendar/gantt |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `Frontend/components/project/gantt-tab.tsx` | 11 | `// TODO (Phase 7)` dependency arrows | Info | Known and accepted plan deferral; Gantt still renders task bars correctly |
| `Frontend/components/project/sprints-list.tsx` | (progress bar) | Approximate progress (0%/50%/100%) | Info | Plan-accepted deviation; no per-sprint task count on Sprint DTO |

The previous blocker anti-pattern (`sprints={[]}` hardcoded in `page.tsx` line 268) has been removed. It no longer appears in the file.

### Human Verification Required

#### 1. Kanban Drag-and-Drop

**Test:** Open a project board, drag a task card from one column to another
**Expected:** Card visually moves to the target column; PATCH /tasks/{id} fires with new column_id; board data refreshes
**Why human:** DnD sensor (PointerSensor/TouchSensor) behavior and live API call cannot be verified by static analysis

#### 2. Calendar Event Drag-to-Reschedule

**Test:** Open the Calendar tab, drag a task event chip to a different day
**Expected:** Event moves to the new date; PATCH /tasks/{id} fires with new due_date; event stays on new date after drop
**Why human:** FullCalendar's `eventDrop` is triggered by browser interaction

#### 3. Sprint Background Bands on Calendar

**Test:** Open the Calendar tab on a project that has sprints with start_date and end_date set
**Expected:** Sprint date ranges appear as soft-colored shaded bands behind calendar days, with the sprint name label visible
**Why human:** FullCalendar background event rendering (`display: 'background'`) requires browser runtime; the data wiring is now confirmed correct but visual rendering needs a browser

#### 4. Undated Tasks Sidebar Drag to Calendar

**Test:** Open the Calendar tab; expand the undated tasks sidebar; drag a task chip onto a calendar day
**Expected:** Task appears as an event on that day; PATCH /tasks/{id} fires with the new due_date
**Why human:** Cross-component FullCalendar `Draggable` and `drop` callback require browser runtime

#### 5. Phase Management Full Flow

**Test:** Navigate to /projects/{id}/sprints; create a phase; then close it with task migration to Backlog
**Expected:** Phase appears in list; Close dialog shows task count and Backlog option; after close, tasks move and phase status changes
**Why human:** Requires backend database with sprint and task data; full dialog flow cannot be verified statically

#### 6. View Tab Persistence

**Test:** On a project page, switch to Calendar tab; reload the page
**Expected:** Calendar tab is active (not Board) after reload; tab state restored from localStorage
**Why human:** localStorage behavior requires browser environment

---

_Verified: 2026-03-15_
_Verifier: Claude (gsd-verifier)_
