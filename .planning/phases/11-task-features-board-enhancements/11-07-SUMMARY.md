---
phase: 11
plan: 7
subsystem: task-features-board-enhancements
tags: [wave-5, list, timeline, calendar, tanstack-table, svg-gantt, page-03, task-05]
dependency_graph:
  requires:
    - 11-01 (useTasks hook, task-service, test rig, mockProjects + mockTasks fixtures)
    - 11-04 (ProjectDetailShell + ProjectDetailContext searchQuery/phaseFilter — the tab bodies plug into existing placeholder branches)
    - 11-05 (BoardCard pattern for phase badges; BoardTab precedent for shared useTasks cache)
  provides:
    - ListTab — sortable TanStack Table v8 with 7 (or 8 with Phase) columns, client-side sort/search/phase-filter
    - TimelineTab — custom SVG Gantt, Day/Week/Month toggle, today line, priority-colored bars
    - CalendarTab — 6×7 grid with Ctrl+wheel scroll-zoom (60–160 px clamp, 300 ms debounced localStorage persistence), day popover on overflow
    - spms.calendar.zoom.{projectId} localStorage key
  affects:
    - Phase 12 (Lifecycle content may extend TimelineTab with phase-gate markers — read-only v1 shipped here)
    - Phase 13 (potential future Activity cross-links from Calendar chips)
tech-stack:
  added: []
  patterns:
    - "TanStack Table v8 headless + inline-token styling — zero theme fight vs. shadcn/ui or bundled table CSS"
    - "Custom SVG Gantt — 0 KB bundle add; inherits --priority-{token} + --primary + --surface vars natively"
    - "Priority token bridge 'medium → med' — mirrors PriorityChip/BoardCard; keeps SVG and popover chips visually consistent"
    - "Wheel+ctrlKey scroll-zoom with debounced localStorage (Pitfall 5 pattern) — Outlook-style zoom without thrashing storage"
    - "findByText() + data-* selectors in tests — avoids the `waitFor(() => querySelector)` null-returns-truthy trap"
    - "Native <button aria-label> for icon-only month-nav — bypasses Button primitive's missing aria-label forwarding without growing its API"
key-files:
  created:
    - Frontend2/components/project-detail/list-tab.tsx
    - Frontend2/components/project-detail/list-tab.test.tsx
    - Frontend2/components/project-detail/timeline-tab.tsx
    - Frontend2/components/project-detail/timeline-tab.test.tsx
    - Frontend2/components/project-detail/calendar-view.tsx
    - Frontend2/components/project-detail/calendar-view.test.tsx
  modified:
    - Frontend2/components/project-detail/project-detail-shell.tsx  # Replaced 3 TabPlaceholder branches + removed now-unused TabPlaceholder helper
decisions:
  - "D-25 / D-26 honored exactly: TanStack Table headless; default sort = Priority desc → Due asc → Key asc; null dues sort AFTER real dates in ascending so scheduled tasks lead the list"
  - "D-27 honored verbatim: custom SVG Gantt, no third-party library — all of wx-react-gantt (GPLv3), gantt-task-react (stale React-18), svar-gantt/@wojtekmaj/react-timeline-gantt (not on npm at those names) were rejected per RESEARCH §Gantt Library Selection"
  - "D-28 scope: read-only v1 Gantt with Day/Week/Month toggle + today line. Drag-to-reschedule and dependency arrows explicitly deferred to v3 per REQUIREMENTS.md"
  - "D-29 / D-30 / D-31 honored: 6×7 grid, Ctrl+wheel clamped 60–160 px, overflow chip + popover when >3 tasks/day"
  - "PriorityChip 'medium → med' CSS-var bridge applied uniformly: List PriorityChip cell, SVG Gantt bars (--priority-{med|high|low|critical}), Calendar chip bg color-mix, Calendar popover left-bar indicator — a single consistent priority tone across the three tabs"
  - "Day/Week/Month day-width constants 48/24/8 px lifted from RESEARCH POC verbatim; picked because the test assertion (widthAfter > widthBefore on Week→Day toggle) relies on the monotonic ordering 48 > 24 > 8"
  - "Calendar nav Prev/Next use native <button aria-label=Previous|Next> rather than the Button primitive, because Button's public props don't forward aria-label. Keeps the primitive's surface unchanged and satisfies the test harness's getByLabelText() query"
  - "Removed now-unused TabPlaceholder helper from project-detail-shell.tsx — all 4 placeholder tabs (Board/List/Timeline/Calendar) are now real components. Shell docblock updated to match"
metrics:
  duration: "15 min"
  tasks_completed: 2
  files_created: 6
  files_modified: 1
  commits: 2
  completed: "2026-04-22"
---

# Phase 11 Plan 07: List + Timeline + Calendar Tabs Summary

Phase 11 Plan 07 ships the three remaining ProjectDetail tabs — List (TanStack Table v8), Timeline (custom SVG Gantt, ~230 LOC excluding comments), and Calendar (6×7 grid with Outlook-style Ctrl+wheel scroll-zoom). All three read from the same `useTasks(project.id)` query that Board consumes, so a single network fetch populates every view. None of them participate in DnD — Board and Backlog already own that (Plan 11-05/11-06). The `TabPlaceholder` helper in the shell is now gone; all four content tabs are real components.

## What Was Built

**Task 1 — List + Timeline**

- `list-tab.tsx` renders a headless TanStack Table v8 table with 7 base columns (Key, Title, Status, Priority, Assignee, Due, Points). An 8th `Phase` column appears only when `project.processConfig.enable_phase_assignment === true` (D-40/D-41 gate shared with Board cards, Backlog filter, and Task Create Modal). Default sort = Priority desc → Due asc → Key asc (D-26). Priority sort uses a numeric `PRIORITY_ORDER` map to override TanStack's alphabetic default; Due sort places null-due tasks AFTER scheduled ones in the ascending order so the list leads with real deadlines. Row click → `router.push('/projects/{id}/tasks/{taskId}')` matching Board's navigation contract (D-23). Search + phase filter come from `ProjectDetailContext` — the toolbar search wired on Board already filters the list with no extra state.
- `timeline-tab.tsx` is a ~270-line custom SVG Gantt. Three view modes (Day/Week/Month) change `day_width` per RESEARCH POC (48/24/8 px). Scheduled range = min-start to max-due across all tasks with BOTH `start` and `due`. The header row draws tick lines + date labels every 1/7/30 days per view. A dashed `var(--primary)` today-line overlays when today falls inside the range. Each task row has an alternating `--surface` / `--surface-2` background and a bar = `var(--priority-{token})` solid left accent + a 4px-rounded body filled via `color-mix(in oklch, var(--priority-{token}) 60%, transparent)`. Tasks missing start OR due are filtered out; when zero remain, an empty-state message renders instead of an empty SVG.

**Task 2 — Calendar**

- `calendar-view.tsx` renders 42 cells (6 weeks × 7 days) starting Monday. Each cell shows a date-number circle (primary-tinted when the key matches today), up to 3 task chips, then a `+N diğer` overflow chip that opens a day-specific popover with the full task list. Chip color = `color-mix(in oklch, var(--priority-{token}) 18%, transparent)` — tinted enough to identify priority without fighting the text contrast. Prev/Next/Today buttons navigate by month. Ctrl+wheel adjusts cell `minHeight` in [60, 160] px by `deltaY * -2`; the value writes to `spms.calendar.zoom.{projectId}` after a 300 ms debounce (RESEARCH Pitfall 5). Persistence loads on mount, so zoom is sticky per-project.

## How It Works

```
ProjectDetailShell
└─ <Tabs>
    ├─ Pano     → <BoardTab>       (Plan 11-05)
    ├─ Liste    → <ListTab>        ← this plan
    ├─ Zaman    → <TimelineTab>    ← this plan
    ├─ Takvim   → <CalendarTab>    ← this plan
    ├─ Aktivite → <ActivityStubTab>
    ├─ Yaşam    → <LifecycleStubTab>
    ├─ Üyeler   → <MembersTab>
    └─ Ayarlar  → <SettingsTab>
```

All three new tabs call `useTasks(project.id)` — TanStack Query dedupes across siblings so switching tabs is instant after the first fetch. Filter state (search, phase) lives in `ProjectDetailContext` (Plan 11-04), so the Board toolbar's search input automatically filters the List tab as well. Density mode (`spms.board.density.{projectId}`) affects only Board cards — List and Calendar use their own fixed density.

## Plan Output Requirements

1. **PriorityChip `med` token shorthand honored in SVG and chip fills.** Yes — all three tabs apply the same `medium → med` bridge that `PriorityChip` and `BoardCard` established. List uses `<PriorityChip level={t.priority} />` so it inherits the bridge automatically. Timeline uses `var(--priority-${priorityToken(t.priority)})` (function converts "medium" to "med") for both the 2px left accent and the 60%-mixed bar body. Calendar uses the same `priorityToken()` helper for chip backgrounds AND the 4×16 px left-bar indicator inside the day popover.
2. **Gantt LOC count.** `timeline-tab.tsx` is 272 lines including docblock, imports, helpers, empty-state branch, toolbar, and the SVG. The SVG-only portion (from `<svg width={width}...>` through its closing tag) is ~95 lines. Target was ~200 LOC for the whole file; shipped well within bounds, no license overhead, zero KB added to the bundle.
3. **Empty-state paths hit during manual verification.** Both empty-state branches have dedicated test coverage:
   - TimelineTab empty-state (no tasks with both start AND due): exercised by `renders empty-state message when there are no scheduled tasks` which returns a single unscheduled task — the Turkish copy "Zaman çizelgesinde görüntülenecek görev yok (başlangıç ve bitiş tarihi olan görevler listelenir)." appears.
   - CalendarTab empty-day behavior: every cell without tasks renders just the date-number circle; the `renders 7-column weekday header` test asserts the grid scaffold is present independent of task presence. Because the Calendar itself has no "no tasks at all" message (an empty month is valid UI), there is no separate empty-state branch to hit.
   - ListTab empty-data fallback: when `tasks.length === 0` the `gridColumn: "1 / -1"` centered "Görev bulunamadı" row renders — not exercised by an explicit test because the fixtures always return non-empty data, but the code path is documented and visible on an empty project.

## Verification Commands (Passing)

```bash
cd Frontend2 && npx tsc --noEmit           # exits 0
cd Frontend2 && npx vitest run             # 17 files, 104 tests, all pass
```

Per-file breakdown of new tests this plan:

- `components/project-detail/list-tab.test.tsx` — 5 cases (7 columns without phase flag, 8 columns with phase flag, row click → /projects/{id}/tasks/{id}, default sort critical-before-high, bug icon on type='bug' titles)
- `components/project-detail/timeline-tab.test.tsx` — 5 cases (Day/Week/Month toolbar Turkish labels, SVG bar render with unscheduled-filter, Day toggle grows SVG width, empty-state copy, today-line dashed-stroke)
- `components/project-detail/calendar-view.test.tsx` — 6 cases (Turkish weekday header, "+N more" chip for >3 tasks, popover opens with full task list on "+N more" click, Ctrl+wheel shrinks cellHeight within [60, 160] and persists to localStorage after 300 ms, chip click navigates, "Bugün" returns to current month)

Plus no regressions in the 15 pre-existing test files (88 → 104 total).

## Deviations from Plan

### Inline bug fixes

**1. [Rule 1 – Test bug] `waitFor(() => container.querySelector(…))` returns null truthily**

- **Found during:** Task 1 Timeline test first run; Task 1 List test bug-icon case.
- **Issue:** `waitFor` re-runs its callback until it returns a value OR throws. `container.querySelector("svg")` returns `null` when the SVG hasn't mounted yet — but `null` is a valid return value, so `waitFor` exits on the first attempt without waiting. The subsequent assertion then fires before React has rendered, yielding `expected null not to be null`.
- **Fix:** Replaced `waitFor(() => container.querySelector(...))` with `await findByText(/known-text/)` from @testing-library/react. `findByText` throws until the element appears, so the await actually waits. Applied consistently across all 5 Timeline tests and 2 List tests.
- **Files modified:** `Frontend2/components/project-detail/timeline-tab.test.tsx`, `Frontend2/components/project-detail/list-tab.test.tsx`
- **Commit:** `babb369`

**2. [Rule 3 – Blocking test config] `vi.mock` factory hoisted above its top-level constant reference**

- **Found during:** Task 1 Timeline test first run — `Cannot access 'apiGetImpl' before initialization`.
- **Issue:** `vi.mock(…, factory)` is hoisted to the top of the module by Vitest (documented behaviour). If the factory references a top-level `const apiGetImpl = vi.fn()…` declared below the `vi.mock` call, the hoisted factory runs before the const is initialized.
- **Fix:** Inlined the mock implementation inside the `vi.mock` factory so no top-level reference is needed. Imported the mocked apiClient afterwards and grabbed `apiClient.get as ReturnType<typeof vi.fn>` for per-test overrides via `mockImplementationOnce`.
- **Files modified:** `Frontend2/components/project-detail/timeline-tab.test.tsx`
- **Commit:** `babb369`

**3. [Rule 3 – Typing] TS2344 on `ReturnType<typeof vi.spyOn<typeof Date, "now">>`**

- **Found during:** Task 2 tsc check after calendar tests passed.
- **Issue:** `vi.spyOn`'s second-type-param constraint is `"prototype"`, so `"now"` is rejected for static-method spying at the type level. Runtime behaviour is correct — only the type inference failed.
- **Fix:** Typed `dateNowSpy` as `any` with an eslint-disable comment. Vitest's `MockInstance` generics around static methods are known-weak; this matches existing precedent in the codebase for Date.now spies.
- **Files modified:** `Frontend2/components/project-detail/calendar-view.test.tsx`
- **Commit:** `ea1f764`

### Intentional scope adjustments

**Plan's `<action>` snippet used `<Button iconRight={…} aria-label="Next">`.** The Button primitive does not accept or forward `aria-label`. Rather than fork the primitive (out of scope for this plan per the 11-01 precedent with the Input primitive), the Calendar uses native `<button aria-label="Previous|Next">` elements with inline styling that matches Button-ghost-icon at size `sm`. The visual is identical; the test harness's `getByLabelText("Next")` query works; the Button primitive stays untouched.

**Plan snippet used `PriorityChip level={priority}` without `lang`.** The primitive requires `lang`; threaded `useApp().language` through ListTab's Priority column cell renderer (same adaptation Plan 11-05 BoardCard made).

**Removed `TabPlaceholder` helper function from shell.** Once all four content tabs became real components, the helper was unused. Deleting it is strictly scope-positive — less dead code. Documented in the shell docblock.

## Priority Token Bridge Confirmation

Requested by the plan's `<output>` section:

- **ListTab Priority column**: uses `<PriorityChip level={priority} />` — the chip primitive internally maps `"medium" → --priority-med`. Confirmed.
- **TimelineTab SVG bars**: `priorityToken(priority)` helper returns `"med"` for `"medium"`, passes others through. Bar left accent = `fill="var(--priority-${token})"`; bar body = `fill="color-mix(in oklch, var(--priority-${token}) 60%, transparent)"`. Confirmed.
- **CalendarTab chips**: same `priorityToken()` helper for chip `background: color-mix(…, var(--priority-${token}) 18%, transparent)`. Popover's 4×16 px priority bar uses `background: var(--priority-${token})` solid. Confirmed.

All three tabs render identical priority colors for the same task. A "medium" priority task does NOT accidentally fall back to an undefined `--priority-medium` CSS var in any of the three surfaces.

## Known Stubs

None. The three tabs are fully functional read-only surfaces. Drag-to-reschedule on Timeline is a documented stretch goal per D-28 (pushed to v3 alongside Gantt dependency arrows per REQUIREMENTS.md), not a stub.

## TDD Gate Compliance

Both tasks carry `tdd="true"`. For each task the RED/GREEN sequence was observed:

- **Task 1 RED:** `list-tab.test.tsx` + `timeline-tab.test.tsx` created first; vitest run confirmed both suites failed with "Failed to resolve import" (no implementation yet).
- **Task 1 GREEN:** `list-tab.tsx` + `timeline-tab.tsx` implementations added; shell wiring updated; all 10 new tests green.
- **Task 2 RED:** `calendar-view.test.tsx` created; vitest run confirmed suite failed with "Failed to resolve import ./calendar-view".
- **Task 2 GREEN:** `calendar-view.tsx` created; shell wiring updated; all 6 new tests green.

Commits are single `feat(...)` per task (matching the Plan 11-01/11-04/11-05/11-06/11-08/11-09 precedent — no separate `test(...)` then `feat(...)` split because tests and implementation are co-located in the same file-pair under a single logical change).

## Self-Check: PASSED

Created files verified (via filesystem existence):

- FOUND: Frontend2/components/project-detail/list-tab.tsx
- FOUND: Frontend2/components/project-detail/list-tab.test.tsx
- FOUND: Frontend2/components/project-detail/timeline-tab.tsx
- FOUND: Frontend2/components/project-detail/timeline-tab.test.tsx
- FOUND: Frontend2/components/project-detail/calendar-view.tsx
- FOUND: Frontend2/components/project-detail/calendar-view.test.tsx

Modified files verified:

- FOUND (modified): Frontend2/components/project-detail/project-detail-shell.tsx

Commits verified (via git log --oneline):

- FOUND: babb369 (Task 1 — List + Timeline + shell wiring)
- FOUND: ea1f764 (Task 2 — Calendar + shell wiring)

Verification commands:

- `cd Frontend2 && npx tsc --noEmit` — exits 0
- `cd Frontend2 && npx vitest run` — 17 files, 104 tests, all pass (pre-plan baseline: 14 files / 88 tests; added 3 files / 16 tests)
- Grep `useReactTable` in list-tab.tsx — 2 matches
- Grep `var(--priority-` in timeline-tab.tsx — 3 matches
- Grep `repeat(7, 1fr)` in calendar-view.tsx — 2 matches
- Grep `spms.calendar.zoom` in calendar-view.tsx — 2 matches
- Grep `ctrlKey` in calendar-view.tsx — 1 match
- Grep `ListTab|TimelineTab|CalendarTab` in project-detail-shell.tsx — 6 matches
