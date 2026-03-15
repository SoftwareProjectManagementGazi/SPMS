---
phase: 04-views-ui
plan: "02"
subsystem: frontend-views
tags: [fullcalendar, frappe-gantt, dnd-kit, calendar-view, gantt-view, recurring-tasks, ssr-safe]
dependency_graph:
  requires:
    - 04-01 (patchTask in task-service.ts)
    - Phase 03 (ParentTask type with dueDate, isRecurring, recurrenceInterval, sprintId fields)
  provides:
    - CalendarTab component (VIEW-02)
    - UndatedTasksSidebar component (with FullCalendar Draggable)
    - GanttTab component (VIEW-03)
  affects:
    - 04-03 (project detail page integration — GanttTab must use dynamic/ssr:false)
tech_stack:
  added:
    - "@fullcalendar/react ^6.1.20"
    - "@fullcalendar/core ^6.1.20"
    - "@fullcalendar/daygrid ^6.1.20"
    - "@fullcalendar/timegrid ^6.1.20"
    - "@fullcalendar/interaction ^6.1.20"
    - "@dnd-kit/core ^6.3.1"
    - "@dnd-kit/sortable ^10.0.0"
    - "frappe-gantt ^1.2.2"
  patterns:
    - FullCalendar React integration with dayGridPlugin + interactionPlugin
    - External Draggable from @fullcalendar/interaction for sidebar-to-calendar drag
    - frappe-gantt via dynamic import() inside useEffect for SSR-safe DOM access
    - Recurring event client-side expansion using date-fns (addDays/addWeeks/addMonths)
    - Sprint background bands using FullCalendar display:'background' events
key_files:
  created:
    - Frontend/components/project/calendar-tab.tsx
    - Frontend/components/project/undated-tasks-sidebar.tsx
    - Frontend/components/project/gantt-tab.tsx
    - Frontend/lib/frappe-gantt.d.ts
  modified:
    - Frontend/package.json (8 new libraries added)
decisions:
  - "frappe-gantt CSS loaded via import 'frappe-gantt/dist/frappe-gantt.css' — confirmed path from node_modules"
  - "frappe-gantt TypeScript types not available on npm; created lib/frappe-gantt.d.ts module declaration file"
  - "Dependency arrows deferred to Phase 7 — ParentTask type has no dependency IDs field; dependencies: '' with TODO comment"
  - "Recurring event expansion done client-side using date-fns; cap at min(recurrenceCount, 52) and view window end"
  - "frappe-gantt Gantt constructor called via dynamic import() inside useEffect (not at module top level) for belt-and-suspenders SSR safety"
  - "DropArg type imported from @fullcalendar/interaction (not @fullcalendar/core) — resolved TS2305 error"
  - "ganttTasks dependency array stringified to avoid object reference churn in useEffect deps"
  - "--legacy-peer-deps used for npm install due to React 19 peer dependency mismatch with @dnd-kit"
metrics:
  duration: "3 minutes"
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 4 Plan 02: Calendar View (VIEW-02) + Gantt View (VIEW-03) Summary

**One-liner:** FullCalendar calendar view with task events, sprint bands, recurring expansion, and drag-to-reschedule; frappe-gantt read-only timeline with day/week scale toggle — both SSR-safe "use client" components.

## What Was Built

### CalendarTab (`Frontend/components/project/calendar-tab.tsx`)
- FullCalendar dayGrid + interaction plugins, month/week views
- Three event arrays: task events (non-recurring tasks with dueDate), recurring event instances (client-side expansion via date-fns), sprint background bands
- Recurring event expansion: `expandRecurringTask()` uses date-fns addDays/addWeeks/addMonths, capped at min(recurrenceCount, 52), bounded by view window
- Sprint bands: `display: 'background'` events with predefined 5-color palette (light tints)
- `eventDrop` handler: calls `taskService.patchTask(id, { due_date: startStr })` then invalidates query cache
- `drop` handler: reads `data-task-id` from dragged element, calls `patchTask` to assign due date
- Hover popover: fixed-positioned div with title, priority badge, due date, recurring indicator
- `eventClick`: navigates to `/tasks/[id]` (strips `-rN` suffix for recurring instances); skips background events
- Collapsible undated tasks sidebar (state-controlled open/close toggle)
- No `next/dynamic` import — component is itself `"use client"` and safe for client rendering

### UndatedTasksSidebar (`Frontend/components/project/undated-tasks-sidebar.tsx`)
- Filters `tasks` to those without `dueDate`
- Search filter by title or key
- Each item: `div.undated-task-item` with `data-task-id` and `data-task-title` attributes required by FullCalendar Draggable
- `useEffect` on mount initializes `new Draggable(containerRef.current, { itemSelector: '.undated-task-item', eventData: fn })`
- Cleanup calls `draggable.destroy()`
- Priority badge colors, 1-line title clamp, grab cursor

### GanttTab (`Frontend/components/project/gantt-tab.tsx`)
- `"use client"` on line 5
- `useRef<HTMLDivElement>` for DOM container; `ganttRef` for Gantt instance
- `useEffect` uses dynamic `import('frappe-gantt')` for SSR-safe DOM access
- Cleanup: `containerRef.current.innerHTML = ''` on unmount or deps change
- Day/Week scale toggle via `viewMode` state — re-instantiates Gantt on change
- Tasks without `dueDate` excluded; count shown in info note
- `custom_popup_html` returns HTML with task name, date range, "View full task" link
- `draggable: false` — read-only per CONTEXT.md
- `frappe-gantt/dist/frappe-gantt.css` imported at top of file
- Parent integration note in file header comment: must use `dynamic(..., { ssr: false })`

### frappe-gantt.d.ts (`Frontend/lib/frappe-gantt.d.ts`)
- Module declaration for frappe-gantt (no @types package exists)
- Defines GanttTask, GanttOptions interfaces and Gantt class

## Decisions Made

1. **frappe-gantt CSS path** — `frappe-gantt/dist/frappe-gantt.css` confirmed from node_modules directory listing
2. **frappe-gantt TypeScript types** — no @types package; created module declaration file manually
3. **Dependency arrows deferred** — ParentTask type has no dependency IDs field; `dependencies: ''` with Phase 7 TODO comment
4. **Recurring event expansion approach** — client-side using date-fns; no backend endpoint needed; capped at 52 occurrences
5. **DropArg import fix** — TS2305 resolved by importing from `@fullcalendar/interaction` not `@fullcalendar/core`
6. **frappe-gantt SSR safety** — dynamic `import()` inside `useEffect` (not at module top) provides belt-and-suspenders safety even within "use client" file
7. **useEffect dependency array** — ganttTasks stringified (`.map(t => t.id+t.start+t.end).join(',')`) to avoid object reference churn causing unnecessary re-renders

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DropArg type exported from wrong module**
- **Found during:** Task 1 TypeScript check
- **Issue:** Plan specified `import { EventApi, EventDropArg, DropArg } from '@fullcalendar/core'` but DropArg is not exported from @fullcalendar/core
- **Fix:** Changed to `import type { DropArg } from '@fullcalendar/interaction'`
- **Files modified:** Frontend/components/project/calendar-tab.tsx
- **Commit:** 4653eb3

**2. [Rule 2 - Missing TypeScript types] frappe-gantt has no type declarations**
- **Found during:** Task 2 TypeScript check
- **Issue:** `error TS7016: Could not find a declaration file for module 'frappe-gantt'` — implicit any type
- **Fix:** Created `Frontend/lib/frappe-gantt.d.ts` with full module declaration
- **Files modified:** Frontend/lib/frappe-gantt.d.ts (new)
- **Commit:** 2f36482

## TypeScript Errors — New Files

Zero TypeScript errors in the 3 new component files and the declaration file after applying fixes.

Pre-existing errors in unrelated files (lib/mock-data.ts, app/page.tsx, components/task-detail/task-header.tsx) were out of scope and not touched.

## Self-Check: PASSED

All 4 files confirmed present on disk. Both task commits (4653eb3, 2f36482) confirmed in git log.
