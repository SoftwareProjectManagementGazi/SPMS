---
phase: 11
plan: 6
subsystem: task-features-board-enhancements
tags: [wave-4, backlog, task-02, dnd-kit, cross-container-drag, methodology-matrix]
dependency_graph:
  requires:
    - 11-01 (useBacklog hook, methodology-matrix resolveBacklogFilter, ProjectDnDProvider skeleton, test rig + fixtures)
    - 11-04 (ProjectDetailShell 8-tab container, ProjectDetailProvider, spms.backlog.open key naming convention via D-14 parallels)
    - 11-05 (BoardTab + board-dnd.ts handleBoardDragEnd + BoardCardGhost — extended for cross-container drop path)
  provides:
    - BacklogPanel (300px fixed column, D-13 push-content layout) + useBacklogOpenState hook
    - BacklogToggle (20px vertical pill at left edge, persistent across tabs per D-13)
    - BacklogTaskRow (useDraggable with BACKLOG_COLUMN_ID sentinel for cross-container DnD)
    - spms.backlog.open.{projectId} localStorage key (D-14 per-project persistence)
    - BACKLOG_COLUMN_ID = "__backlog__" exported sentinel value for source-column detection
    - ProjectDnDProvider lifted from BoardTab to ProjectDetailShell (shared drag space with Board)
    - Cross-container drop handler at shell level: invalidates both ['tasks','project',id] AND ['tasks','backlog',id] on successful move
    - Extended board-dnd.test.ts with 2 cross-container tests (normal + WIP-exceeded via backlog source)
  affects:
    - 11-07 List/Timeline/Calendar (backlog stays visible across all tabs, not only Board — validated by the structural choice to mount BacklogPanel at shell level)
    - 11-09 Task Detail (assignee avatars use the same #{id} initials placeholder; real roster lands when Phase 12 delivers GET /projects/{id}/members)
tech-stack:
  added: []
  patterns:
    - "Cross-container DnD via shared DndContext: backlog sources use a sentinel columnId ('__backlog__') so handleBoardDragEnd treats the drop like any other between-column move — the shell-level handler then invalidates the backlog query explicitly to remove the row from the panel"
    - "SSR-safe localStorage hydration: useState(false) default + useEffect-based hydration → effectiveOpen vs. open split so user intent survives viewport changes"
    - "useBacklogOpenState: per-project localStorage (spms.backlog.open.{projectId}) with <1280px auto-close override per D-54 — open reflects intent, effectiveOpen reflects visibility"
    - "Grep-based regression guard test (reads source via node:fs) for D-15 bulk-ops compliance"
    - "Client-side filter pipeline: search/priority/assignee run in useMemo off the useBacklog result; filtered count + total rendered in footer"
key-files:
  created:
    - Frontend2/components/project-detail/backlog-task-row.tsx
    - Frontend2/components/project-detail/backlog-toggle.tsx
    - Frontend2/components/project-detail/backlog-panel.tsx
    - Frontend2/components/project-detail/backlog-panel.test.tsx
  modified:
    - Frontend2/components/project-detail/project-detail-shell.tsx  # Mounts ProjectDnDProvider + BacklogPanel + BacklogToggle; owns handleDropped/renderGhost
    - Frontend2/components/project-detail/board-tab.tsx             # Removed ProjectDnDProvider wrapper + useMoveTask + handleBoardDragEnd imports (moved to shell)
    - Frontend2/lib/dnd/board-dnd.test.ts                            # +2 cross-container tests (7 → 9 cases)
decisions:
  - "ProjectDnDProvider is now mounted at ProjectDetailShell (not BoardTab) so Backlog and Board share one drag space — this is the single structural change required for cross-container DnD per RESEARCH §249-278"
  - "BACKLOG_COLUMN_ID = '__backlog__' is a sentinel that makes handleBoardDragEnd's source-vs-target comparison produce moved:true for backlog→column drops without needing a special code path (the decision function stays pure)"
  - "Backlog query invalidation is explicit at shell level: useMoveTask.onSettled invalidates ['tasks','project',id] but the backlog uses a sibling key ['tasks','backlog',id,filter] that must be invalidated separately after a cross-container move"
  - "open vs. effectiveOpen split in useBacklogOpenState: narrow viewports force-close via effectiveOpen=false, but open reflects the user's persisted intent so growing the viewport re-opens the panel without another click"
  - "Avatar primitive observation (same as 11-04/05): expects {initials,avColor} not plan-draft's {id,name,avColor}. BacklogTaskRow + BacklogPanel derive initials from #{assigneeId} placeholder until Phase 12's GET /projects/{id}/members lands"
  - "PriorityChip requires a lang prop (same as BoardCard); BacklogTaskRow uses withLabel={false} so only the 8px rotated-diamond indicator shows in the condensed row (matches UI-SPEC §4 anatomy)"
  - "D-15 bulk-ops compliance verified by two complementary mechanisms: (a) grep in the automated plan verify, (b) regression-guard tests that read backlog-panel.tsx + backlog-task-row.tsx via node:fs and assert the markers are absent"
  - "Shell's currentTasks query uses queryKey ['tasks','project',projectId,{}] to match useTasks(projectId) default — TanStack Query de-duplicates so BoardTab's useTasks + shell's explicit useQuery share one HTTP request"
  - "Test harness for useBacklogOpenState forces window.innerWidth=1600 in beforeEach because jsdom defaults to 1024 (< 1280 threshold); narrow-specific test overrides explicitly before renderHook"
metrics:
  duration: "5 min"
  tasks_completed: 1
  files_created: 4
  files_modified: 3
  commits: 1
  completed: "2026-04-22"
---

# Phase 11 Plan 06: Backlog Panel + Cross-Container DnD Summary

The project-detail shell now ships the Backlog panel (TASK-02). A 20px vertical pill at the far left of the content area toggles a 300px fixed column that pushes the active tab's content to the right (D-13). The panel lists the project's backlog tasks — methodology-aware via `resolveBacklogFilter(project)` — with search + priority chips + assignee-avatar filters, all running client-side off the `useBacklog(project)` TanStack Query result. Open/closed state persists per project in `spms.backlog.open.{projectId}` localStorage (D-14) and auto-closes below 1280px viewport (D-54). The single most important structural change in this plan: `<ProjectDnDProvider>` moves UP from BoardTab to ProjectDetailShell so a row dragged out of the panel lands inside the same DnD context as the Board columns — one gesture, one PATCH, one backlog invalidation. Bulk operations are explicitly deferred (D-15) and a regression-guard test asserts the bulk-selection markers do not exist in the panel source.

## What Was Built

**Task 1 — 3 new components + shell lift + test coverage**

- `backlog-task-row.tsx` — Draggable row with priority-colored left border + monospace key + title ellipsis + PriorityChip indicator + 20px assignee avatar. Uses `useDraggable` from `@dnd-kit/core` with `data: { columnId: "__backlog__", task }`. Click → navigate to task detail (D-23 parity). `BACKLOG_COLUMN_ID` sentinel is exported for reuse.
- `backlog-toggle.tsx` — 20px-wide 56px-tall vertical pill at the far left. `ChevronRight` when closed, `ChevronLeft` when open. Turkish/English aria-label via `useApp().language`. Flat button, no ring, stays visible regardless of which tab is active.
- `backlog-panel.tsx` — 300px-wide aside; header (title + backlog-definition pill + close button), narrow-screen hint, toolbar (search input + 4 priority chips + assignee avatar filter), task list (`BacklogTaskRow × N` or empty state), footer (filtered/total task count). `useBacklogOpenState(projectId)` is co-exported from this file and owns the three pieces of state: `open` (user intent, persisted), `narrow` (viewport <1280px, live via resize listener), `effectiveOpen` (open && !narrow).
- `project-detail-shell.tsx` — Lifted `<ProjectDnDProvider>` up from BoardTab. Shell now runs 2 useQuery calls (columns + current tasks) with the same cache keys BoardTab uses so the queries de-duplicate. `handleDropped` computes the target-column WIP info, runs `handleBoardDragEnd`, fires `useMoveTask` on legal drops, toasts on WIP exceed, and invalidates `['tasks','backlog',project.id]` on every drop (idempotent — fires whether the source was the backlog or another column).
- `board-tab.tsx` — Removed the `ProjectDnDProvider` wrapper + the `useMoveTask` + `handleBoardDragEnd` + `BoardCardGhost` + `useToast` imports (all migrated to the shell). BoardTab now just renders the toolbar + the column grid; the drag context is provided by the parent.
- `backlog-panel.test.tsx` — 8 tests covering `useBacklogOpenState` (default closed, persists true, persists false over prior, hydrates from localStorage on mount, auto-closes narrow, per-project isolation) + 2 regression-guard tests that read `backlog-panel.tsx` / `backlog-task-row.tsx` via `node:fs` and assert D-15 bulk-op markers are absent.
- `board-dnd.test.ts` — +2 tests: backlog→board with room (`moved:true, wipExceeded:false`), backlog→board onto a full column (`moved:true, wipExceeded:true` — Warn+Allow still applies when source is backlog).

## How It Works

```
ProjectDetailShell
  └─ ProjectDetailProvider (context for searchQuery / density / phaseFilter)
  └─ ProjectDnDProvider (@dnd-kit DndContext + DragOverlay) ← LIFTED UP in 11-06
      ├─ [left edge]   BacklogToggle (20×56 pill, aria-expanded toggles)
      ├─ [300px col]   BacklogPanel (useDraggable rows → BACKLOG_COLUMN_ID)
      └─ [flex:1]      Tab content
                       ├─ board     → BoardTab (no DnD wrapper now)
                       │              └─ BoardColumn × N (useDroppable)
                       │                  └─ BoardCard × M (useSortable)
                       ├─ list/time/cal → placeholders (11-07)
                       ├─ activity  → ActivityStubTab (Phase 13)
                       ├─ lifecycle → LifecycleStubTab (Phase 12)
                       ├─ members   → MembersTab
                       └─ settings  → SettingsTabLazy
```

Drag-end flow (cross-container case):
```
user drags BacklogTaskRow → shared DndContext.onDragEnd fires in ProjectDnDProvider
  → onTaskDropped(taskId, "__backlog__", "todo") [shell handler]
    → columns.find / currentTasks.filter → BoardColumnInfo { wipLimit, taskCount }
    → handleBoardDragEnd(...) [pure]  → { moved: true, wipExceeded?: boolean }
    → if wipExceeded: showToast({ variant:"warning", ... })
    → moveTask.mutate({ id, status: "todo" })  [useMoveTask: optimistic PATCH]
    → qc.invalidateQueries({ queryKey: ["tasks","backlog",project.id] })
  → row disappears from BacklogPanel on next render
  → card appears in BoardColumn "todo" optimistically before PATCH settles
```

## Key Deliverable: Cross-Container DnD works with ONE structural change

The plan required exactly one structural modification to make backlog→board drops work cleanly: move `<ProjectDnDProvider>` out of `BoardTab` and into `ProjectDetailShell`. The pure `handleBoardDragEnd` decision function did not need any new branches — it already accepts any `sourceColumnId` string and only cares whether `source !== target`. The backlog sentinel (`"__backlog__"`) is never a valid target (only board columns register as droppables) so a drop onto a board column always produces `moved: true`, the shell PATCHes status, and the TanStack Query invalidation at the shell level removes the row from the panel.

This is verified end-to-end by the 9-case `board-dnd.test.ts`:

| Case | Source | Target | Expected |
|------|--------|--------|----------|
| same-col no-op | todo | todo | moved:false |
| normal move | todo | progress (2/5) | moved:true, wip:false |
| wip exceeded | todo | progress (3/3) | moved:true, wip:true (Warn+Allow) |
| unlimited | todo | progress (999/0) | moved:true, wip:false |
| null target info | todo | progress | moved:true, wip:false |
| at-limit boundary | todo | progress (2/3→3/3) | moved:true, wip:false |
| empty target | todo | "" | moved:false |
| **backlog→board with room** | **__backlog__** | **todo (2/5)** | **moved:true, wip:false** |
| **backlog→board wip exceeded** | **__backlog__** | **progress (3/3)** | **moved:true, wip:true** |

## useBacklog Invalidation Coverage (plan output question)

The plan output section asked whether `useMoveTask`'s `onSettled` + `useBacklog`'s query key covers the cross-container case without extra code. **Answer: no — one extra line was needed.**

`useMoveTask` (Plan 11-01) invalidates only `['tasks','project',projectId]` on settle. `useBacklog` (Plan 11-01) keys its query as `['tasks','backlog',projectId,filter]`. These are *sibling* keys, not descendants of each other, so an invalidation of one does not touch the other. The shell's `handleDropped` callback therefore issues an explicit `qc.invalidateQueries({ queryKey: ["tasks","backlog",project.id] })` call after every drop. This is idempotent: dropping between two board columns (no backlog involvement) still triggers the invalidation, but since the backlog list did not change the refetch returns the same data. Keeping the invalidation unconditional simplifies the handler and matches Plan 11-05's established pattern.

## Verification Commands (All Passing)

```bash
cd Frontend2 && npx tsc --noEmit                       # exits 0
cd Frontend2 && npx vitest run                         # 13 files, 80 tests — all green
```

Per-file breakdown of new / updated tests this plan:
- `components/project-detail/backlog-panel.test.tsx` — 8 cases (6 hook behaviour + 2 D-15 regression guards)
- `lib/dnd/board-dnd.test.ts` — now 9 cases (+2 cross-container: normal move + wipExceeded)

Plus the pre-existing `project-detail-shell.test.tsx` (7 cases) still passes after the shell was significantly restructured — the stubbed api-client returning `[]` means `useMoveTask`, the lifted DnD context, and the BacklogPanel all mount successfully and the toolbar assertions (`Sıkı` / `Detaylı`) remain visible under the default-closed backlog.

## Deviations from Plan

### Intentional — matches plan intent

- **Avatar primitive shape:** Plan snippet used `Avatar user={{ id, name, avColor }}`; real primitive takes `{ initials, avColor }` (same observation as Plans 11-04 and 11-05). `BacklogTaskRow` + `BacklogPanel` derive 2-letter initials from `#{assigneeId}` as a placeholder until Phase 12's `GET /projects/{id}/members` endpoint lands.
- **PriorityChip `lang` prop:** Plan snippet used `<PriorityChip level={task.priority} />` without `lang`; real primitive requires `lang`. `BacklogTaskRow` threads `useApp().language` and passes `withLabel={false}` so only the 8px diamond indicator shows in the condensed row.
- **Shell `useToast` API:** Plan used a standalone `showToast` import; real codebase exports `useToast().showToast` (matches 11-02, 11-04, 11-05 precedent). Used the hook.
- **Shell shared query keys with BoardTab:** Plan called `useQuery` at the shell for columns + tasks; kept the same cache keys BoardTab uses (`["columns", projectId]`, `["tasks","project",projectId,{}]`) so TanStack Query de-duplicates instead of firing two HTTP requests.

### Minor scope additions

- Added `aria-expanded={open}` on `BacklogToggle` for accessibility (not in plan snippet — standard ARIA pattern for a toggleable disclosure button).
- Added `aria-pressed={active}` on the priority-chip and assignee-avatar filter buttons — same rationale.
- `useBacklogOpenState` exposes both `open` (intent) and `effectiveOpen` (computed visibility) instead of just one boolean — lets the shell render the toggle with the user's stored intent while gating panel rendering on `effectiveOpen` (D-54 auto-close). This is a minor API expansion over the plan snippet's single `open`/`setOpen` return shape.
- `backlog-panel.test.tsx` includes explicit `Object.defineProperty(window, "innerWidth", {...})` + `dispatchEvent(new Event("resize"))` in `beforeEach` so tests that don't care about narrow mode observe the wide-viewport path; the narrow-specific test overrides before `renderHook`. jsdom defaults to 1024px which is below the 1280 threshold and would break every other test.
- Extra regression-guard tests that read the panel + row source via `node:fs` and assert bulk-ops markers are absent. These run in the same vitest suite as the unit tests so a future developer trying to add bulk-op UI trips the failure locally before the PR lands.

### No Rule 1/2/3/4 deviations recorded

The plan compiled cleanly on the first test run. No TypeScript errors, no runtime loops, no OOM issues (the 11-04 pitfall about setTimeout-debounced effects + useEffect array-reference loops did not recur because the backlog panel uses `useMemo` off stable primitive deps).

## Known Stubs

- **Assignee avatar initials:** Derived from `#{assigneeId}` placeholder until `GET /projects/{id}/members` lands (Phase 12). Documented inline in both `backlog-task-row.tsx` and `backlog-panel.tsx`. Does not block the plan's goal — the panel still shows identifiable rows and the drag/click/filter flows work.
- **Custom backlog definition path:** When `project.processConfig.backlog_definition === "custom"`, `resolveBacklogFilter` returns `{ in_backlog: true }` (D-17 escape hatch). The backend currently accepts this query param (Plan 11-01 normalizer seeds the default). No custom-selection UI exists in Phase 11 — that lands in Phase 12's Settings > Lifecycle if needed.

Neither stub prevents the plan's goal: the Backlog panel is reachable, DnD works cross-container, filters work, narrow-viewport auto-close works.

## D-15 Compliance: Bulk Operations Explicitly Deferred

The plan's must-have list explicitly forbids bulk-operation UI in this panel: "Bulk operations explicitly deferred (D-15) — plan MUST NOT include bulk checkboxes or bulk action bar". Two complementary mechanisms verify compliance:

1. **Manual grep in the automated verify step:**
   ```
   ! grep -rE "bulkSelect|bulk-action|selectAll|Toplu işlem|bulk_op" \
     Frontend2/components/project-detail/backlog-panel.tsx \
     Frontend2/components/project-detail/backlog-task-row.tsx
   ```
2. **Regression-guard tests** in `backlog-panel.test.tsx` (last two cases) read each file via `node:fs` and assert `expect(src).not.toMatch(/bulkSelect|bulk-action|selectAll|Toplu işlem|bulk_op/i)`. A future developer adding bulk-op code trips these tests in CI.

## localStorage Keys Introduced

- `spms.backlog.open.{projectId}` — per-project open/closed boolean for the Backlog panel. Set by `useBacklogOpenState` in `BacklogPanel`. Defaults to "not set" → panel closed on first visit (D-14). Format matches the existing `spms.board.density.{projectId}` convention from Plan 11-04.

## Downstream Contracts

- **Plan 11-07 List/Timeline/Calendar:** Because the Backlog panel is mounted at shell level (not inside BoardTab), it remains visible and draggable across all tabs. Users can drag a backlog row onto the Board tab while the List tab is active — they just need to click "Pano" first since only board columns register as droppables. This behavior is a direct consequence of the D-13 "fixed left column" decision + the 11-06 DnD context lift.
- **Plan 11-09 Task Detail:** The backlog task row uses the same navigation pattern as BoardCard (`router.push('/projects/{pid}/tasks/{tid}')`) — when the task detail route lands in 11-09, both click paths (board card and backlog row) work identically.
- **Phase 12 Settings > General > Backlog Tanımı:** The panel reads `project.processConfig.backlog_definition` via `resolveBacklogFilter` which falls back to the methodology default. When Phase 12 exposes a SegmentedControl for overriding, changing the setting automatically updates the panel's query params via the TanStack Query refetch.

## Threat Flags

None. The only network surface this plan introduces is `GET /api/v1/tasks/project/{id}?cycle_id=null` (or the equivalent backlog-filter params) — this is the same endpoint Plan 11-05 BoardTab and Plan 11-01 useTasks already use, with existing project-member authorization enforced by the backend. T-11-06-01 disposition `accept` was documented in the plan and remains so: the backlog filter params (`cycle_id=null`, `status=backlog`, `phase_id=null`, `in_backlog=true`) are bounded values with no privilege-escalation vector.

## TDD Gate Compliance

Task 1 carries `tdd="true"`. As with Plans 11-01, 11-04, and 11-05 (see their TDD Gate Compliance notes), the single `feat(...)` commit bundles the implementation + co-located tests rather than splitting RED/GREEN/REFACTOR. Tests were drafted alongside the behaviour bullets in the plan's `<behavior>` section and verified green before the commit:
- useBacklogOpenState default-closed, persists-true, persists-false, hydrates-on-mount, narrow auto-close, per-project isolation → 6 hook cases.
- D-15 source-grep regression guards → 2 cases.
- board-dnd cross-container normal + WIP-exceeded → 2 cases.

All 10 new tests green on the final plan commit; no refactor phase was needed.

## Self-Check: PASSED

Created files verified (via filesystem existence):
- FOUND: Frontend2/components/project-detail/backlog-task-row.tsx
- FOUND: Frontend2/components/project-detail/backlog-toggle.tsx
- FOUND: Frontend2/components/project-detail/backlog-panel.tsx
- FOUND: Frontend2/components/project-detail/backlog-panel.test.tsx

Modified files verified (via git diff --stat):
- FOUND (modified): Frontend2/components/project-detail/project-detail-shell.tsx
- FOUND (modified): Frontend2/components/project-detail/board-tab.tsx
- FOUND (modified): Frontend2/lib/dnd/board-dnd.test.ts

Commits verified (via git log):
- FOUND: 4650e28 (Task 1 — backlog panel + cross-container DnD lift)

Verification commands:
- `cd Frontend2 && npx tsc --noEmit` — exits 0
- `cd Frontend2 && npx vitest run` — 13 files, 80 tests — all passing
- `grep -rE "bulkSelect|bulk-action|selectAll" Frontend2/components/project-detail/backlog-panel.tsx Frontend2/components/project-detail/backlog-task-row.tsx` — no matches (D-15 compliance)
- `grep ProjectDnDProvider Frontend2/components/project-detail/project-detail-shell.tsx` — matches (lifted up)
- `grep ProjectDnDProvider Frontend2/components/project-detail/board-tab.tsx` — no matches (moved out)
- `grep "resolveBacklogFilter\|useBacklog" Frontend2/components/project-detail/backlog-panel.tsx` — useBacklog matches (which in turn uses resolveBacklogFilter internally)
