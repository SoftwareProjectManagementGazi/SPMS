---
phase: 04-views-ui
plan: "05"
subsystem: ui
tags: [react, tanstack-query, fullcalendar, sprints, calendar]

# Dependency graph
requires:
  - phase: 04-views-ui
    provides: CalendarTab component with sprints prop already wired internally to render background bands
  - phase: 03-project-task-completion
    provides: sprintService.list(projectId) API service method
provides:
  - CalendarTab receives live sprint data from page.tsx useQuery
  - Sprint date ranges render as FullCalendar background bands in Calendar tab
  - VIEW-02 sprint band truth fully closed
affects:
  - Calendar tab user-visible behavior (sprint bands now appear)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useQuery with queryKey ["project-sprints", id] for per-project sprint data fetching
    - enabled: !!id guard on sprint query (consistent with other project-scoped queries)

key-files:
  created: []
  modified:
    - Frontend/app/projects/[id]/page.tsx

key-decisions:
  - "Sprint query placed after currentUser query near line 115 — consistent grouping with other project-scoped queries"
  - "enabled: !!id guard added — prevents query firing with undefined id on first render"

patterns-established:
  - "Data gap closure pattern: child components that accept array props must receive live query data, not hardcoded empty arrays"

requirements-completed:
  - VIEW-02

# Metrics
duration: 1min
completed: 2026-03-15
---

# Phase 4 Plan 05: Sprint Bands Wiring Summary

**Live sprint data wired into CalendarTab via useQuery, enabling FullCalendar background bands to render for sprint date ranges**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-15T08:19:09Z
- **Completed:** 2026-03-15T08:19:57Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added `sprintService` import to `page.tsx`
- Added `useQuery(["project-sprints", id], () => sprintService.list(Number(id)))` with `enabled: !!id` guard
- Replaced hardcoded `sprints={[]}` on `<CalendarTab>` with live `sprints={sprints}` prop
- No changes to `calendar-tab.tsx` — component was already fully implemented and waiting for data

## Task Commits

Each task was committed atomically:

1. **Task 1: Fetch sprints in page.tsx and pass to CalendarTab** - `45a4563` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `Frontend/app/projects/[id]/page.tsx` - Added sprintService import, sprint useQuery, replaced sprints={[]} with sprints={sprints}

## Decisions Made

None - followed plan as specified. All three changes were exactly as described in the plan.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Pre-existing TypeScript errors exist in `lib/mock-data.ts`, `app/page.tsx`, and `components/task-detail/task-header.tsx` — these are out of scope for this plan and were present before this change.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 04-views-ui is now complete — all VIEW requirements closed
- CalendarTab will display sprint background bands whenever sprints have `start_date` and `end_date` populated
- No blockers for Phase 05 or later phases

---
*Phase: 04-views-ui*
*Completed: 2026-03-15*
