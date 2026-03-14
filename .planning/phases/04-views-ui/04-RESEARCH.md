# Phase 4: Views & UI - Research

**Researched:** 2026-03-15
**Domain:** React drag-and-drop Kanban, calendar scheduling (FullCalendar), Gantt/timeline (frappe-gantt), view persistence
**Confidence:** HIGH (core libraries), MEDIUM (frappe-gantt React integration)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Kanban Board (VIEW-01)**
- Columns are driven by the project's configured status list — NOT hardcoded. Backend returns statuses for the project; board renders one column per status.
- Dragging a card between columns fires `PATCH /tasks/{id}` with the new status value.
- DnD library: `@dnd-kit/core` + `@dnd-kit/sortable` (not installed yet — add to package.json).
- Rich card: task key (PROJ-42), title (2-line clamp), assignee avatar + name, priority badge, due date, label badges (max 2, then "+N more"), recurring icon (↺) if applicable, points badge.
- Card border/frame is priority-coded: CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=gray. Card body background stays neutral/natural.
- Board-level compact/rich toggle (top of the board) collapses cards to: key + title + priority border only.
- Sprint filter dropdown above the board. Options: Backlog (tasks with sprint=null), named project phases, All.
- Default: active phase (if one exists), else All.
- All project members can drag tasks. No role restriction on status changes via drag.
- Drag-to-done warning: if task dragged to "done" column and has unresolved blocking dependencies → show non-blocking warning toast. User can still complete the move.
- No per-column "Add task" button. Task creation via the existing top-level "+ New Task" button only.
- WIP limits: None in Phase 4. Deferred to Phase 7 (Process Models).
- Mobile: One column visible at a time. Horizontal swipe to navigate columns. Column name + task count shown in a tab strip at top. Touch drag supported via @dnd-kit's `TouchSensor`.

**Calendar View (VIEW-02)**
- Library: FullCalendar — `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid` (not installed yet).
- Tasks with `due_date` set → rendered as event chips on that date.
- Recurring task instances → appear on each scheduled recurrence date.
- Project phases (sprints) → rendered as shaded background bands covering their date range.
- Click event → navigate to `/tasks/[id]`. Hover event → quick-view popover.
- Drag event to different day → updates `due_date` via `PATCH /tasks/{id}`. FullCalendar `editable: true`.
- View modes: Month (default) + Week. Mobile: Month view only.
- Collapsible sidebar listing undated tasks with search/filter. Drag from sidebar onto calendar day → sets `due_date`.

**Gantt / Timeline View (VIEW-03)**
- Library: `frappe-gantt` (not installed yet).
- Each bar spans from task's `start_date` (fallback: `created_at`) to `due_date`.
- Finish-to-start dependencies rendered as arrows (frappe-gantt native support). Read-only — no drag-to-reschedule.
- Click bar → quick-view popover with "View full task →" link. Undated tasks hidden.
- Day scale default; user can switch to Week scale. Mobile: horizontal scroll.

**List View**
- Columns: Task Key | Title | Status | Assignee | Priority | Due Date (non-customizable Phase 4).
- Sort: click column headers. Filter: Status, Priority, Assignee (multi-select dropdowns).
- Click row → `/tasks/[id]`. Pagination: Load More pattern (20 per page).

**View Persistence (VIEW-04)**
- Chosen view tab persisted in `localStorage` keyed by `project-view-{projectId}`.
- On page load, read localStorage and default to saved view. No backend user preference table.

**Phase (Sprint) Management**
- UI labels them "phases" with editable names. Separate `/projects/[id]/sprints` page.
- Create phase: name, start date, end date. Edit: name and dates (while Planned or Active).
- Close phase: dialog — move N incomplete tasks to another phase or Backlog.
- Delete phase: confirmation dialog — move N tasks.
- Phases list: name, date range, status badge (Planned/Active/Closed), task count (done/total), progress bar.

**Task Status Management**
- Default statuses: Backlog / Todo / In Progress / In Review / Done (5 columns).
- Manager and Admin only can manage statuses. Members see columns read-only.
- Project Settings tab → "Board Columns" section: list with drag-to-reorder, rename inline, delete with confirmation, "Add column" button.
- Deleting a status column: dialog — move N tasks to another status (required).

### Claude's Discretion

- Exact frappe-gantt React integration approach (wrapper lib vs direct DOM usage).
- How to represent recurring task instances as calendar events (generate occurrences client-side from recurrence data vs adding a backend endpoint).
- Color palette for phase background bands in the calendar.
- Exact localStorage key format and fallback if no saved view.
- Backend endpoint design for dynamic status list per project (new endpoint or added to project response).

### Deferred Ideas (OUT OF SCOPE)

- WIP (Work In Progress) limits per Kanban column → Phase 7 (Process Models/Kanban methodology config).
- View preference synced across devices (backend user_project_preferences table) → future enhancement if needed.
- Default status columns derived from selected process model (Scrum/Kanban/Waterfall/Iterative) → Phase 7 (PROC-02).
- Start-to-start dependency type visual in Gantt → Phase 7.
- Sprint/Phase assignment directly from Kanban board → Phase 7 if needed.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIEW-01 | Proje board'u sürükle-bırak destekli Kanban panosu olarak çalışır; görev kartları renk/etiketle durum bildirir | @dnd-kit/core + @dnd-kit/sortable multi-container pattern; DndContext + SortableContext per column; PATCH /tasks/{id} on drop |
| VIEW-02 | Takvim modülü görevlerin ve tekrarlayan etkinliklerin zaman çizelgesini gösterir | FullCalendar @fullcalendar/react daygrid/timegrid/interaction; background events for sprints; external Draggable for sidebar |
| VIEW-03 | Zaman çizelgesi / Gantt görünümü görev bağımlılıklarını ve süre çakışmalarını gösterir | frappe-gantt direct DOM integration via useRef/useEffect; task.dependencies comma-separated string field |
| VIEW-04 | Kullanıcı projelerine isteğe göre Kanban, Gantt veya Liste/Takvim görünümü ekleyebilir (modüler panolar) | localStorage key `project-view-{projectId}`; read on mount, write on tab change; Radix Tabs already installed |
</phase_requirements>

---

## Summary

Phase 4 implements four view modes on the existing project detail page (`/projects/[id]/page.tsx`), which already has Radix Tabs with Board/List/Timeline stubs and a Members tab. Three new libraries must be installed and integrated: `@dnd-kit` for Kanban drag-and-drop, `@fullcalendar` for the calendar, and `frappe-gantt` for the timeline. In addition, new backend endpoints are needed for board column CRUD (the `BoardColumnModel` already exists in the DB but has no API routes) and enhanced sprint management (close/delete with task reassignment).

The largest complexity risk is in the multi-container Kanban (cross-column DnD with optimistic updates) and the Calendar's external-drag sidebar (requires `@fullcalendar/interaction`). frappe-gantt wrapper libraries are all abandoned (5-7 years old); the correct approach is direct DOM integration via `useRef` with `"use client"` and `next/dynamic` to avoid SSR. The recurring-event expansion for the calendar is best handled client-side from the task's `recurrence_interval` + `recurrence_end_date` / `recurrence_count` fields already available in the task DTO — no new backend endpoint needed for that.

**Primary recommendation:** Build all four views as isolated tab components, each a `"use client"` component. Wrap FullCalendar and frappe-gantt in `next/dynamic({ ssr: false })` wrappers. Use TanStack Query `useMutation` + `invalidateQueries` for all drag-triggered PATCH calls. Status (column) data needs a new backend endpoint `GET /projects/{id}/columns` (or include in project response). The `BoardColumn` entity and SQLAlchemy model already exist — only the use-case, repository, and API route are missing.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | ^6.x | DnD context, sensors, collision detection | Successor to react-beautiful-dnd; accessible, touch-ready, performant |
| @dnd-kit/sortable | ^8.x | Sortable preset (useSortable hook, SortableContext) | Simplifies Kanban card sorting within and across columns |
| @fullcalendar/react | ^6.1 | React wrapper for FullCalendar | Official adapter; v6 handles its own CSS injection (no CSS import hacks) |
| @fullcalendar/daygrid | ^6.1 | Month/week grid views | Required for dayGridMonth and dayGridWeek |
| @fullcalendar/timegrid | ^6.1 | Time-slotted views | Required for timeGridWeek |
| @fullcalendar/interaction | ^6.1 | Event drag-drop + external drag | Required for editable events and sidebar-to-calendar drag |
| frappe-gantt | ^1.2 | Gantt chart with dependency arrows | Latest actively maintained version; zero dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | latest (already installed) | Recurring event occurrence expansion, date formatting | Client-side recurrence expansion for Calendar view |
| @tanstack/react-query | ^5 (already installed) | Data fetching, mutation, cache invalidation | All drag-triggered PATCH calls follow existing pattern |
| sonner | ^1.7 (already installed) | Toast for drag-to-done warning | Non-blocking warning when task moved to done with open blockers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| frappe-gantt (direct DOM) | frappe-gantt-react wrapper | Wrapper is 7 years stale, not maintained; direct DOM is more reliable |
| frappe-gantt | react-gantt-chart / dhtmlx-gantt | Paid or heavier; frappe-gantt is locked in CONTEXT.md |
| FullCalendar v6 | react-big-calendar | FullCalendar is locked in CONTEXT.md and has superior external drag support |

### Installation
```bash
npm install @dnd-kit/core @dnd-kit/sortable @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction frappe-gantt
```

---

## Architecture Patterns

### Recommended Project Structure
```
Frontend/
├── app/projects/[id]/
│   └── page.tsx                  # Add Calendar tab, localStorage view persistence
│   └── sprints/
│       └── page.tsx              # NEW: Phase management page
├── components/project/
│   ├── board-tab.tsx             # NEW: Full Kanban with @dnd-kit
│   ├── kanban-column.tsx         # NEW: Single column (SortableContext)
│   ├── kanban-card.tsx           # NEW: Task card (useSortable)
│   ├── calendar-tab.tsx          # NEW: FullCalendar wrapper component
│   ├── undated-tasks-sidebar.tsx # NEW: Sidebar for calendar view
│   ├── gantt-tab.tsx             # NEW: frappe-gantt wrapper
│   ├── list-tab.tsx              # NEW: Sortable/filterable table
│   ├── sprints-list.tsx          # NEW: Phase management UI
│   └── board-columns-settings.tsx # NEW: Status CRUD in project settings
├── services/
│   ├── task-service.ts           # Extend: add updateStatus(id, columnId) method
│   └── board-column-service.ts   # NEW: CRUD for board columns
Backend/
├── app/api/v1/
│   └── board_columns.py          # NEW: GET/POST/PATCH/DELETE /projects/{id}/columns
├── app/application/use_cases/
│   └── manage_board_columns.py   # NEW: column CRUD use cases
├── app/infrastructure/database/repositories/
│   └── board_column_repo.py      # NEW: SqlAlchemy repo for BoardColumnModel
```

### Pattern 1: Multi-Container Kanban (DnD Kit)
**What:** One `DndContext` wraps all columns; each column is a `SortableContext` with its task IDs. Cross-column drag handled in `onDragEnd`.
**When to use:** Every Kanban column render.

```tsx
// Source: https://blog.logrocket.com/build-kanban-board-dnd-kit-react/
// components/project/board-tab.tsx

import { DndContext, DragEndEvent, DragOverlay, closestCorners,
         PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

export function BoardTab({ projectId, columns, tasks }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  )

  const mutation = useMutation({
    mutationFn: ({ taskId, columnId }: { taskId: string; columnId: number }) =>
      taskService.updateTask(taskId, { column_id: columnId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks-paginated', projectId] })
    }
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const sourceColumnId = getColumnForTask(active.id)
    const destColumnId = getColumnId(over.id)
    if (sourceColumnId === destColumnId) return
    const destColumn = columns.find(c => c.id === destColumnId)
    if (destColumn?.isDone && taskHasOpenBlockers(active.id)) {
      toast.warning('Task has unresolved blocking dependencies')
    }
    mutation.mutate({ taskId: String(active.id), columnId: destColumnId })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {columns.map(col => (
          <SortableContext key={col.id} items={taskIdsForColumn(col.id)} strategy={verticalListSortingStrategy}>
            <KanbanColumn column={col} tasks={tasksForColumn(col.id)} />
          </SortableContext>
        ))}
      </div>
      <DragOverlay>{activeTask ? <KanbanCard task={activeTask} overlay /> : null}</DragOverlay>
    </DndContext>
  )
}
```

### Pattern 2: FullCalendar with External Sidebar Drag
**What:** `FullCalendar` with `interaction` plugin for internal drag (updates due_date) and external drag from undated task sidebar.
**When to use:** Calendar tab only.

```tsx
// "use client" — must be a client component
// Use next/dynamic with ssr:false if imported from a Server Component parent

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import { useEffect, useRef } from 'react'

// Background events for sprint bands
const sprintEvents = sprints.map(s => ({
  id: `sprint-${s.id}`,
  title: s.name,
  start: s.start_date,
  end: s.end_date,
  display: 'background',
  color: SPRINT_BAND_COLOR,
}))

// Make sidebar tasks draggable — must run after mount
const sidebarRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  if (!sidebarRef.current) return
  const draggable = new Draggable(sidebarRef.current, {
    itemSelector: '.undated-task-item',
    eventData: (el) => ({ id: el.dataset.taskId, title: el.dataset.taskTitle }),
  })
  return () => draggable.destroy()
}, [])

// Calendar props
<FullCalendar
  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  editable={true}          // enables internal event drag
  droppable={true}         // enables external sidebar drag
  events={[...taskEvents, ...sprintEvents, ...recurringEvents]}
  eventClick={(info) => router.push(`/tasks/${info.event.id}`)}
  eventDrop={(info) => {   // internal drag to new date
    taskService.updateTask(info.event.id, { due_date: info.event.startStr })
    queryClient.invalidateQueries({ queryKey: ['project-tasks-paginated', projectId] })
  }}
  drop={(info) => {        // external sidebar drop
    const taskId = info.draggedEl.dataset.taskId
    taskService.updateTask(taskId, { due_date: info.dateStr })
  }}
  eventMouseEnter={(info) => showHoverPopover(info)}
  eventMouseLeave={() => hideHoverPopover()}
/>
```

### Pattern 3: frappe-gantt via Direct DOM (useRef)
**What:** `frappe-gantt` is a vanilla JS library. No maintained React wrapper exists. Mount it imperatively in `useEffect` using a `useRef` div container.
**When to use:** Timeline tab only.

```tsx
// "use client" — mandatory
// Wrap with next/dynamic({ ssr: false }) in the parent
"use client"
import { useEffect, useRef } from 'react'
import Gantt from 'frappe-gantt'

export function GanttTab({ tasks }: { tasks: ParentTask[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<Gantt | null>(null)

  const ganttTasks = tasks
    .filter(t => t.dueDate)
    .map(t => ({
      id: t.id,
      name: t.key + ' ' + t.title,
      start: t.createdAt.split('T')[0],  // fallback to created_at
      end: t.dueDate!.split('T')[0],
      progress: 0,
      dependencies: t.dependencies?.map(d => d.dependsOnId).join(', ') ?? '',
      custom_class: `priority-${t.priority.toLowerCase()}`,
    }))

  useEffect(() => {
    if (!containerRef.current || ganttTasks.length === 0) return
    ganttRef.current = new Gantt(containerRef.current, ganttTasks, {
      view_mode: 'Day',
      draggable: false,        // read-only per CONTEXT.md
      custom_popup_html: (task) => `
        <div class="gantt-popup">
          <h6>${task.name}</h6>
          <p>${task._start} → ${task._end}</p>
          <a href="/tasks/${task.id}">View full task →</a>
        </div>
      `,
    })
    return () => { ganttRef.current = null }
  }, [ganttTasks])

  return <div ref={containerRef} className="overflow-x-auto" />
}
```

### Pattern 4: View Persistence via localStorage
**What:** On mount, read `project-view-{projectId}` from localStorage. On tab change, write it. Radix Tabs `defaultValue` is controlled by state.

```tsx
// In /app/projects/[id]/page.tsx
const [activeView, setActiveView] = useState<string>(() => {
  if (typeof window === 'undefined') return 'board'
  return localStorage.getItem(`project-view-${id}`) ?? 'board'
})

function handleViewChange(value: string) {
  setActiveView(value)
  localStorage.setItem(`project-view-${id}`, value)
}

<Tabs value={activeView} onValueChange={handleViewChange}>
  <TabsList>
    <TabsTrigger value="board">Board</TabsTrigger>
    <TabsTrigger value="calendar">Calendar</TabsTrigger>
    <TabsTrigger value="timeline">Timeline</TabsTrigger>
    <TabsTrigger value="list">List</TabsTrigger>
    <TabsTrigger value="members">Members</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  ...
</Tabs>
```

### Pattern 5: Recurring Event Client-Side Expansion
**What:** Tasks with `is_recurring=true` have `recurrence_interval`, `recurrence_end_date`, and/or `recurrence_count`. Expand them client-side using date-fns to produce FullCalendar event objects.

```tsx
import { addDays, addWeeks, addMonths, isBefore, parseISO } from 'date-fns'

function expandRecurringTask(task: ParentTask, viewStart: Date, viewEnd: Date): CalendarEvent[] {
  if (!task.isRecurring || !task.recurrenceInterval) return []
  const events: CalendarEvent[] = []
  let current = parseISO(task.createdAt)
  const maxEnd = task.recurrenceEndDate ? parseISO(task.recurrenceEndDate) : viewEnd
  let count = 0
  const maxCount = task.recurrenceCount ?? 52  // safety cap
  const advanceFn = task.recurrenceInterval === 'daily' ? addDays
    : task.recurrenceInterval === 'weekly' ? addWeeks : addMonths

  while (isBefore(current, maxEnd) && count < maxCount && isBefore(current, viewEnd)) {
    if (isBefore(viewStart, current)) {
      events.push({ id: `${task.id}-r${count}`, title: task.title, date: current, taskId: task.id })
    }
    current = advanceFn(current, 1)
    count++
  }
  return events
}
```

### Pattern 6: Backend Board Column Endpoint
**What:** `BoardColumnModel` + `BoardColumn` entity already exist. Need route, use-case, repo.

```python
# Backend/app/api/v1/board_columns.py (NEW)
@router.get("/projects/{project_id}/columns", response_model=list[BoardColumnDTO])
async def list_columns(project_id: int, db: AsyncSession = Depends(get_db),
                       current_user = Depends(get_current_user)):
    # returns columns ordered by order_index

@router.post("/projects/{project_id}/columns", response_model=BoardColumnDTO, status_code=201)
async def create_column(project_id: int, dto: CreateColumnDTO, ...):
    # Manager/Admin only

@router.patch("/projects/{project_id}/columns/{column_id}", response_model=BoardColumnDTO)
async def update_column(project_id: int, column_id: int, dto: UpdateColumnDTO, ...):
    # Manager/Admin only

@router.delete("/projects/{project_id}/columns/{column_id}", status_code=204)
async def delete_column(project_id: int, column_id: int, move_tasks_to: int, ...):
    # moves tasks in column to move_tasks_to column_id first
```

### Pattern 7: Sprint Close/Delete with Task Reassignment
**What:** Existing sprint service is missing close + task-move operations. Need new use-case and API action.

```python
# PATCH /sprints/{id}/close  (new action)
# Body: { move_tasks_to_sprint_id: int | null }  (null = backlog)
# Use case: set sprint tasks sprint_id = move_tasks_to_sprint_id, then mark sprint closed

# DELETE /sprints/{id}
# Body or query: ?move_tasks_to=<sprint_id|null>
# Use case: move all tasks first, then delete sprint
```

### Anti-Patterns to Avoid
- **Using `onDragOver` for state mutations:** Only use `onDragOver` for visual indicators. Commit state (PATCH) in `onDragEnd` only.
- **Importing FullCalendar or frappe-gantt without `"use client"` + dynamic import:** Both access DOM on load and will throw in Next.js App Router server render.
- **Using abandoned React wrappers for frappe-gantt:** `frappe-gantt-react` and `react-frappe-gantt` are 5-7 years old, incompatible with React 19.
- **Hardcoding column names:** Columns come from the backend `board_columns` table. The board must fetch and render dynamically.
- **Re-creating Gantt instance on every render:** Store it in `useRef` and only recreate when the task list changes identity.
- **Blocking user from dropping to done column when dependencies exist:** The decision is a non-blocking warning toast — the move still proceeds.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop gestures | Custom mouse/touch event listeners | @dnd-kit/core sensors | Accessibility (keyboard), touch, pointer unification; collision detection |
| Calendar grid | HTML table month layout | FullCalendar daygrid | Week/month views, background events, event resize, external drag — all built in |
| Dependency arrows in Gantt | SVG path calculations | frappe-gantt native `dependencies` field | Arrow routing between bars is non-trivial; frappe-gantt does it natively |
| Recurrence date expansion | Custom date loop | date-fns addDays/addWeeks/addMonths | Edge cases: DST transitions, month-end, leap years |
| Drag overlay ghost card | CSS clone during drag | DragOverlay component from @dnd-kit | Proper portal rendering; avoids layout shifts |

**Key insight:** Each of the three view libraries solves a genuinely hard problem (collision detection, calendar layout, Gantt arrow routing) with hundreds of edge cases. Do not attempt custom implementations for any of these in a project-scoped phase.

---

## Common Pitfalls

### Pitfall 1: FullCalendar SSR Crash in Next.js App Router
**What goes wrong:** FullCalendar accesses `window` during module initialization. In App Router server components (no `"use client"` directive), this throws `ReferenceError: window is not defined`.
**Why it happens:** Next.js renders shared components on the server by default. FullCalendar is a browser-only library.
**How to avoid:** Create a dedicated `"use client"` wrapper component. In the parent (if it's a Server Component), import via `next/dynamic({ ssr: false })`. Keep the actual FullCalendar props inside the client component.
**Warning signs:** Build error `ReferenceError: window is not defined` during `next build`, or runtime crash on first navigation.

### Pitfall 2: frappe-gantt Instance Leaking Between Re-renders
**What goes wrong:** Each `useEffect` run creates a new Gantt SVG appended to the container div, but the old one is never removed. Results in duplicate Gantt charts stacked vertically.
**Why it happens:** frappe-gantt's constructor appends SVG to the container element. Without cleanup, multiple SVGs accumulate.
**How to avoid:** In the `useEffect` cleanup function, clear `containerRef.current.innerHTML = ''` before returning, and null out `ganttRef.current`. Alternatively call `gantt.refresh(tasks)` to update in place without re-creating.
**Warning signs:** Duplicate Gantt bars appearing after switching away and back to the Timeline tab.

### Pitfall 3: stale `items` Array in SortableContext
**What goes wrong:** SortableContext renders cards in wrong order or drag targets misfire.
**Why it happens:** The `items` prop must be sorted identically to the rendered card order. Mismatches cause incorrect collision detection.
**How to avoid:** Derive the `items` array from the same sorted task list used for rendering: `items={columnTasks.map(t => t.id)}`. Do not sort independently.
**Warning signs:** Cards snap to wrong position after drag; console warnings from @dnd-kit about mismatched IDs.

### Pitfall 4: FullCalendar External Drag Requires Imperative Initialization
**What goes wrong:** Sidebar tasks don't land on the calendar; `drop` callback never fires.
**Why it happens:** External drag requires calling `new Draggable(containerEl, options)` imperatively on the DOM container. There is no declarative React prop equivalent.
**How to avoid:** Use `useRef` on the sidebar container div. Call `new Draggable(sidebarRef.current, { itemSelector: '.undated-task-item' })` inside `useEffect` after mount. Store the instance and call `.destroy()` in the cleanup function.
**Warning signs:** `drop` callback never fires; no visual drag image appears when dragging from sidebar.

### Pitfall 5: Board Columns Not Seeded for New Projects
**What goes wrong:** A newly created project has no columns in `board_columns`, so the Kanban board renders empty even when tasks exist.
**Why it happens:** The `board_columns` table has no automatic seeding on project creation. The default 5 statuses (Backlog/Todo/In Progress/In Review/Done) must be explicitly inserted.
**How to avoid:** In the `create_project` use case (or via a DB trigger/seed), insert the 5 default columns with `order_index` 0-4 when a new project is created.
**Warning signs:** Board renders "no columns" message for every new project until columns are manually created via Settings.

### Pitfall 6: Sprint Entity Missing `status` Field for Planned/Active/Closed Display
**What goes wrong:** The Phase management list page cannot show the "Planned/Active/Closed" badge because the `Sprint` domain entity and DB model only have `is_active: bool`.
**Why it happens:** The current `Sprint` entity uses a single boolean `is_active`. Three states (Planned/Active/Closed) require a richer representation.
**How to avoid:** Add a `status` enum column to the sprints table: `PLANNED | ACTIVE | CLOSED`. Migration required. The existing `is_active` can be derived or removed. Alternatively, derive status: `start_date > today → Planned`, `is_active → Active`, `else → Closed`.
**Warning signs:** Sprint status badge always shows "Active" or "Planned" incorrectly.

### Pitfall 7: React 19 / Next.js 16 Compatibility with @dnd-kit
**What goes wrong:** Peer dependency warning or runtime crash with dnd-kit on React 19.
**Why it happens:** @dnd-kit was authored against React 17-18. React 19 changed some internal APIs.
**How to avoid:** Check the actual installed version: `npm info @dnd-kit/core peerDependencies`. If React 19 is not listed, add `--legacy-peer-deps` to install, then verify the board works in browser (dnd-kit typically still works in React 19 due to backward compatibility).
**Warning signs:** `npm install` fails with peer dependency conflicts mentioning React version.

---

## Code Examples

### Kanban Card with Priority Border
```tsx
// components/project/kanban-card.tsx
const priorityBorderColor = {
  CRITICAL: 'border-l-red-500',
  HIGH:     'border-l-orange-500',
  MEDIUM:   'border-l-yellow-400',
  LOW:      'border-l-gray-300',
}

export function KanbanCard({ task, compact = false }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={cn(
        'border-l-4 rounded bg-card cursor-grab active:cursor-grabbing',
        priorityBorderColor[task.priority]
      )}
    >
      {compact ? (
        <div className="p-2 text-sm font-mono">{task.key} <span className="line-clamp-1">{task.title}</span></div>
      ) : (
        <div className="p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-xs font-mono text-muted-foreground">{task.key}</span>
            <Badge variant="secondary">{task.priority}</Badge>
          </div>
          <p className="text-sm font-medium line-clamp-2">{task.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="h-4 w-4">
              <AvatarImage src={task.assignee?.avatar} />
              <AvatarFallback>{task.assignee?.name?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
            <span>{task.assignee?.name ?? 'Unassigned'}</span>
            {task.isRecurring && <span title="Recurring">↺</span>}
          </div>
        </div>
      )}
    </div>
  )
}
```

### Board Columns Backend DTO
```python
# Backend/app/application/dtos/board_column_dtos.py
from pydantic import BaseModel

class BoardColumnDTO(BaseModel):
    id: int
    project_id: int
    name: str
    order_index: int
    wip_limit: int = 0
    task_count: int = 0    # computed field

    model_config = ConfigDict(from_attributes=True)

class CreateColumnDTO(BaseModel):
    name: str
    order_index: int

class UpdateColumnDTO(BaseModel):
    name: str | None = None
    order_index: int | None = None

class DeleteColumnDTO(BaseModel):
    move_tasks_to_column_id: int   # required — tasks must be reassigned
```

### List View with Sort/Filter
```tsx
// components/project/list-tab.tsx — pattern for sort state
const [sortField, setSortField] = useState<'status' | 'priority' | 'due_date' | 'key'>('key')
const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
const [filters, setFilters] = useState<{ status: string[]; priority: string[]; assignee: string[] }>({
  status: [], priority: [], assignee: []
})

function handleSort(field: typeof sortField) {
  if (field === sortField) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
  else { setSortField(field); setSortDir('asc') }
}

// Apply filters + sort client-side on allTasks
const displayed = useMemo(() => {
  let result = allTasks
  if (filters.status.length) result = result.filter(t => filters.status.includes(t.status))
  if (filters.priority.length) result = result.filter(t => filters.priority.includes(t.priority))
  if (filters.assignee.length) result = result.filter(t => filters.assignee.includes(t.assignee?.id ?? ''))
  return result.sort(/* by sortField + sortDir */)
}, [allTasks, filters, sortField, sortDir])
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 2022 (rbd deprecated) | @dnd-kit is accessible-first, touch-ready, actively maintained |
| FullCalendar v5 (manual CSS import) | FullCalendar v6 (auto CSS injection) | 2023 | No need to configure CSS imports in Next.js; just import and use |
| frappe-gantt React wrappers | frappe-gantt direct DOM via useRef | 2024 (wrappers abandoned) | Must write thin integration yourself; cleaner and always up to date |
| next/dynamic ssr:false in Server Component | Must be inside "use client" component | Next.js 15 | Enforce boundary: only Client Components can opt out of SSR |

**Deprecated/outdated:**
- `frappe-gantt-react` (npm): Last published 7 years ago — incompatible with React 18+.
- `react-frappe-gantt` (npm): Last published 5 years ago — do not use.
- `react-beautiful-dnd`: No longer maintained; use @dnd-kit instead.

---

## Discretion Recommendations

### frappe-gantt Integration: Direct DOM (Recommended)
**Decision:** Use `frappe-gantt` directly via `useRef` + `useEffect`. Do not use any wrapper library.
**Rationale:** All wrapper libraries are 5-7 years old and incompatible with React 19. The direct DOM approach is 20-30 lines of code, works reliably, and tracks the actively maintained upstream (v1.2.2 as of March 2026).
**SSR protection:** Export the GanttTab component with `export default dynamic(() => import('./gantt-tab'), { ssr: false })` from a thin re-export file.

### Recurring Events: Client-Side Expansion (Recommended)
**Decision:** Expand recurring task occurrences client-side in the Calendar tab using date-fns.
**Rationale:** All recurrence data (interval, end_date, count) is already in the task DTO. A backend endpoint would add latency and cache complexity with no meaningful gain. Cap expansion at 52 occurrences or view window end, whichever is first.
**Risk:** Tasks with very long recurrence windows (e.g., daily for 5 years) could expand to 1825+ events — apply the view-window cap strictly.

### Sprint Status: Derive from Fields (Recommended)
**Decision:** Derive sprint status for UI display: if `start_date > today` → Planned; if `is_active = true` → Active; otherwise → Closed.
**Rationale:** Avoids a migration for an enum column. The Phase management page needs the three-state badge but the three states are fully determinable from existing fields. Add a migration only if Phase 7 adds workflow logic that requires an explicit state machine.

### Backend Column Endpoint: New Dedicated Route (Recommended)
**Decision:** Add `GET /projects/{id}/columns` (and POST/PATCH/DELETE variants) as a new router, not embedded in the project response.
**Rationale:** The project response is already complex. A dedicated endpoint follows the existing REST pattern (members have their own endpoints) and allows columns to be invalidated/refetched independently of the full project object.

### Calendar Sprint Background Band Colors (Recommended)
**Decision:** Use Tailwind's blue-100 / blue-200 palette (light blue tint) for sprint background bands. Use distinct colors per sprint via a predefined palette array cycling on sprint index.
**Rationale:** Neutral enough not to clash with event chip colors; distinct enough to be legible.

---

## Open Questions

1. **`PATCH /tasks/{id}` uses `PUT` in current task-service**
   - What we know: `taskService.updateTask` sends `PUT /tasks/{id}`, not `PATCH`.
   - What's unclear: Does the backend accept partial updates via `PUT`? The CONTEXT.md says "fires PATCH" for drag operations.
   - Recommendation: Verify the backend task update endpoint and add a dedicated `patchTask(id, partial)` using `apiClient.patch()` in `task-service.ts` for drag-triggered partial updates. This avoids sending the full task payload on every column change.

2. **`tasks.start_date` field existence**
   - What we know: The Gantt view uses `start_date` for the bar start (fallback to `created_at`). The `TaskResponseDTO` in `task-service.ts` does not currently include a `start_date` field.
   - What's unclear: Does the backend `Task` model have a `start_date` column, or does the Gantt always use `created_at`?
   - Recommendation: Check the backend `Task` model. If no `start_date` exists, always use `created_at` for Gantt bar start. Add `start_date` to `TaskResponseDTO` if the column exists.

3. **Board columns seeding on project creation**
   - What we know: The `board_columns` table exists but has no FK trigger or application-layer seed on project creation.
   - What's unclear: Whether the project creation use-case should be modified or a separate migration seeds defaults for existing projects.
   - Recommendation: Modify `create_project` use case to insert the 5 default columns atomically within the same transaction. For existing projects without columns, a one-time migration should insert defaults.

---

## Sources

### Primary (HIGH confidence)
- [FullCalendar React Docs](https://fullcalendar.io/docs/react) — React adapter setup, v6 CSS injection, editable events
- [FullCalendar External Dragging Docs](https://fullcalendar.io/docs/external-dragging) — Draggable class, droppable prop, eventReceive
- [@dnd-kit Sortable Context Docs](https://dndkit.com/presets/sortable/sortable-context) — SortableContext items prop, multi-container pattern
- [frappe/gantt GitHub](https://github.com/frappe/gantt) — Task object structure, constructor options, dependencies field

### Secondary (MEDIUM confidence)
- [LogRocket: Build Kanban with dnd-kit](https://blog.logrocket.com/build-kanban-board-dnd-kit-react/) — DndContext + SortableContext architecture, onDragEnd cross-column pattern
- [@dnd-kit Touch Sensor docs](https://docs.dndkit.com/api-documentation/sensors/touch) — delay/tolerance activation constraints for mobile
- [Next.js Lazy Loading Guide](https://nextjs.org/docs/app/guides/lazy-loading) — dynamic import with ssr:false must be inside Client Component in Next.js 15

### Tertiary (LOW confidence — verify before implementing)
- frappe-gantt v1.2.2 exact API (constructor options, popup API) — verified via search results but not official docs page; confirm against GitHub README before writing GanttTab component
- React 19 + @dnd-kit peer dependency compatibility — reported working but no official @dnd-kit release notes confirm React 19 support

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed via official docs and npm; versions from npm search results
- Architecture: HIGH — patterns verified against official FullCalendar docs and @dnd-kit docs; frappe-gantt pattern is MEDIUM (direct DOM approach is standard practice)
- Pitfalls: HIGH — SSR/browser-only pitfalls confirmed against Next.js docs; stale wrapper libraries confirmed via npm publish dates

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (FullCalendar and frappe-gantt are stable; @dnd-kit v6 stable)
