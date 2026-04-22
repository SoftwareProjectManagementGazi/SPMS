---
phase: 11
plan: 5
subsystem: task-features-board-enhancements
tags: [wave-3, board, dnd-kit, wip, page-07, task-05, phase-badge]
dependency_graph:
  requires:
    - 11-01 (ProjectDnDProvider, useTasks/useMoveTask, methodology matrix, test rig)
    - 11-04 (ProjectDetailShell + ProjectDetailContext + spms.board.density.{projectId} persistence)
    - 10 (apiClient axios baseline, ToastProvider, AppProvider language)
    - 09 (GET /projects/{id}/columns, PATCH /tasks/{id}, GET /sprints?current=true)
  provides:
    - BoardTab — 4-column kanban mounted in the shell's board tab
    - BoardColumn — useDroppable wrapper with WIP Warn+Allow visual feedback
    - BoardCard + BoardCardGhost — useSortable card with Compact/Rich modes + phase badge
    - BoardToolbar — search + density + cycle badge + phase filter (D-22 scope)
    - lib/dnd/board-dnd.ts — handleBoardDragEnd pure decision with D-20 semantics
  affects:
    - 11-06 Backlog Panel (mounts inside the same ProjectDnDProvider + reuses BoardCard)
    - 11-07 List/Timeline/Calendar (shares search + density via ProjectDetailContext)
    - 11-09 Task Detail (BoardCard click is the primary navigation path)
tech-stack:
  added: []
  patterns:
    - "Pure drag-end decision module (lib/dnd/board-dnd.ts) — framework-free so WIP Warn+Allow is testable without a DOM"
    - "Case-insensitive column↔status match with first-column fallback — keeps tasks visible when backend column names drift"
    - "Background-tint + AlertBanner D-20 visual pattern (color-mix oklch 6% danger)"
    - "useDroppable + SortableContext nested per column (prepares cross-container drop into Backlog in Plan 11-06)"
    - "Phase-tone cycling by node index — badges stay stable as phase names change"
    - "Scrum-gated useQuery for /sprints current — non-Scrum methodologies never fetch"
key-files:
  created:
    - Frontend2/components/project-detail/board-card.tsx
    - Frontend2/components/project-detail/board-card.test.tsx
    - Frontend2/components/project-detail/board-column.tsx
    - Frontend2/components/project-detail/board-column.test.tsx
    - Frontend2/components/project-detail/board-toolbar.tsx
    - Frontend2/components/project-detail/board-toolbar.test.tsx
    - Frontend2/components/project-detail/board-tab.tsx
    - Frontend2/lib/dnd/board-dnd.ts
    - Frontend2/lib/dnd/board-dnd.test.ts
  modified:
    - Frontend2/components/project-detail/project-detail-shell.tsx
    - Frontend2/components/project-detail/project-detail-shell.test.tsx
decisions:
  - "D-20 authoritative (Warn + Allow): handleBoardDragEnd returns moved:true AND wipExceeded:true when over limit — the PATCH still fires, the UI renders a banner + toast. Roadmap criterion 5 wording ('prevents dropping') is superseded."
  - "Left-border priority token uses the same `medium` → `med` bridge as PriorityChip (common CSS rule --priority-med). Both BoardCard and BoardCardGhost use priorityTokenVar()."
  - "useDroppable id is `col-{columnId}` but data.columnId is the raw id — dnd-provider extracts data.current.columnId, so the `col-` prefix is a DOM-level uniqueness helper, not a semantic marker."
  - "Column grouping matches case-insensitively against project.columns; unmatched tasks fall into the first column instead of being hidden (protects against backend status-name drift mid-migration)."
  - "Scrum-only cycle badge uses react-query's `enabled: methodology === 'SCRUM'`; other methodologies never fire the /sprints request, keeping the toolbar API-cost zero for Kanban/Waterfall."
  - "Phase filter menu uses click-outside mousedown listener (same pattern as ProjectCard's 3-dot menu), gated on open state."
  - "PriorityChip requires a `lang` prop — passed useApp().language. BoardCard hoists the hook to the component top so Compact mode doesn't break if density switches mid-render."
  - "Shell test updated: 'defaults to Pano placeholder' → 'mounts BoardToolbar (Sıkı + Detaylı)'. The plan explicitly replaced the placeholder this wave."
  - "Fixed D-20 Warn+Allow boundary: count === wipLimit is NOT exceeded (at-limit, warning-tinted bg but no banner). Test case added."
metrics:
  duration: "6 min"
  tasks_completed: 2
  files_created: 9
  files_modified: 2
  commits: 2
  completed: "2026-04-22"
---

# Phase 11 Plan 05: Board Tab — Summary

The Board tab is now the canonical drag-and-drop surface for Phase 11. Dropping a card between columns fires a PATCH `/tasks/{id}` via the existing optimistic `useMoveTask` mutation; dropping into a WIP-exceeded column still moves the task but shows a warning toast plus a per-column AlertBanner (D-20 Warn + Allow is authoritative — the move always commits). Compact/Rich toggles persist per-project via `spms.board.density.{projectId}` (wired by Plan 11-04 and consumed here). Phase badges appear on cards only when `project.processConfig.enable_phase_assignment === true`, and the toolbar phase filter + current-sprint badge obey the same gate plus the Scrum-only cycle rule.

## What Was Built

**Task 1 — BoardCard + BoardCardGhost**
- `board-card.tsx` exports two components: the draggable `<BoardCard>` (wires `useSortable({ id: task.id, data: { columnId, task } })`) and the tilted `<BoardCardGhost>` for `<DragOverlay>`.
- Compact mode: type-icon (bug only) + monospace key + title + tiny assignee avatar (18 px).
- Rich mode: all of the above + `<PriorityChip lang>` + mono points chip + locale-formatted due date + 20 px avatar.
- D-24 phase badge: rendered between row 1 and the title, tone cycles by node index (`info → warning → success → danger → neutral`).
- D-23 click handler: `router.push('/projects/{pid}/tasks/{tid}')`. The 8 px PointerSensor activation distance (configured in Plan 11-01's `ProjectDnDProvider`) means plain clicks reach `onClick`; the `isDragging` guard short-circuits the rare mid-drag release.
- Left-border priority tint uses the `medium → med` token bridge that `PriorityChip` already established.
- Tests: 8 vitest cases in `board-card.test.tsx` (key/title render, compact hides priority/points, rich shows them, phase badge show/hide, click-to-navigate, bug icon presence, ghost shape + pointer-events).

**Task 2 — BoardColumn / BoardToolbar / BoardTab + drop logic**
- `lib/dnd/board-dnd.ts` — pure `handleBoardDragEnd({ taskId, sourceColumnId, targetColumnId, targetColumn })` returning `{ moved, wipExceeded }`. Handles no-op (same column), null target info, `wipLimit === 0` (unlimited), and the boundary case where `count === limit` (warning tint but NOT exceeded). 7 vitest cases in `board-dnd.test.ts`.
- `board-column.tsx` — `useDroppable({ id: 'col-{columnId}', data: { columnId } })` wrapper. Bg tints (`--priority-critical 6%` over limit / `--status-review 4%` at limit / `--bg-2` default). `AlertBanner tone="danger"` renders when `tasks.length > wipLimit`. Drop highlight uses `boxShadow: inset 0 0 0 2px var(--primary)` via `isOver`. Empty column shows localized "Bu kolonda görev yok" / "No tasks in this column".
- `board-toolbar.tsx` — `Input` (search, wires `pd.searchQuery`), `SegmentedControl` (Sıkı/Detaylı), Scrum-only current-sprint `Badge`, phase filter dropdown with click-outside close. The `useCurrentCycle` hook passes `enabled: methodology === 'SCRUM'` so non-Scrum projects never hit `/sprints`.
- `board-tab.tsx` — composes Toolbar + `ProjectDnDProvider` + column grid. Uses `useTasks(project.id)` + `useColumns(project.id)`, falls back to `project.columns` when the columns meta fetch is empty. Pipes drag ends through `handleBoardDragEnd`, fires `useMoveTask` on legal drops, shows a warning toast on WIP exceed (move still commits).
- `project-detail-shell.tsx` — `<BoardTab project={project} />` replaces the placeholder in the `tab === "board"` branch.

## How It Works

```
BoardTab
  └─ BoardToolbar (search / density / cycle / phase filter)
  └─ ProjectDnDProvider (@dnd-kit DndContext + DragOverlay)
      └─ <grid repeat N, minmax 260px 1fr>
          └─ BoardColumn × N
              ├─ useDroppable → id='col-{columnId}', data={columnId}
              └─ SortableContext (vertical strategy)
                  └─ BoardCard × M  (useSortable → id=task.id, data={columnId,task})
```

Drag end flow: `DndContext.onDragEnd → ProjectDnDProvider.handleDragEnd → onTaskDropped(taskId, src, tgt) → handleBoardDragEnd (pure) → if moved, useMoveTask.mutate → optimistic setQueryData → PATCH /tasks/{id} → invalidate on settle (rollback on error, already wired in Plan 11-01).`

## Key Deliverable: D-20 Authoritative Behaviour

The decision table is codified in `board-dnd.ts`:

| Condition | `moved` | `wipExceeded` | UI effect |
|-----------|---------|---------------|-----------|
| Same column | `false` | `false` | No-op |
| `wipLimit === 0` (unlimited) | `true` | `false` | Plain move |
| `count + 1 <= wipLimit` | `true` | `false` | Plain move |
| `count + 1 > wipLimit` (over) | `true` | `true` | Move + warning toast + column AlertBanner + red bg |

**Confirmed: dropping into a WIP-exceeded column still moves the task.** The D-20 Warn+Allow decision overrides the roadmap's "prevents dropping" criterion 5 wording — this is documented in the task plan and in the `handleBoardDragEnd` JSDoc.

## Verification Commands (All Passing)

```bash
cd Frontend2 && npx tsc --noEmit           # exits 0
cd Frontend2 && npx vitest run             # 11 files, 65 tests, all pass
```

Per-file breakdown of new tests this plan:
- `lib/dnd/board-dnd.test.ts` — 7 cases (same-col no-op, normal move, over-limit Warn+Allow, unlimited, null target info, exact-at-limit boundary, empty target id)
- `components/project-detail/board-card.test.tsx` — 8 cases (key/title, compact hide, rich show, phase badge show/hide, click navigate, bug icon, ghost shape)
- `components/project-detail/board-column.test.tsx` — 4 cases (empty state, unlimited count, over-limit banner, at-limit no banner)
- `components/project-detail/board-toolbar.test.tsx` — 4 cases (search + density render, phase filter show for enable_phase=true, phase filter hide for Kanban, search input wires context)

Plus the updated shell test (`project-detail-shell.test.tsx`) now asserts on BoardToolbar's Sıkı/Detaylı SegmentedControl instead of the removed placeholder string.

## Deviations from Plan

### Intentional — matches plan intent

- **Avatar fallback shape:** plan snippet had `{ id, name, avColor }`; the real `Avatar` primitive takes `{ initials, avColor }` (matches the Plan 11-04 `MembersTab` observation). `BoardCard` derives two-letter initials from `#{assigneeId}` as a stable placeholder; real project-member avatars land when the `GET /projects/{id}/members` endpoint lands in Phase 12.
- **PriorityChip `lang` prop:** plan snippet called `<PriorityChip level>` without `lang`; the real primitive requires `lang`. `BoardCard` pulls `useApp().language` and threads it through. Not a blocker — same one-line adaptation as the Plan 11-04 Settings tests made.
- **Toast API:** plan snippet used a standalone `showToast` import; the real codebase exports `useToast().showToast` (same pattern as Plans 11-02 and 11-04). Used the hook.
- **`iconRight` for phase filter chevron:** `Button` primitive accepts `iconRight`, so the chevron sits after the label without wrapping in a span.

### Minor scope additions

- Added a seventh `board-dnd` test for the boundary `count === wipLimit` case and an eighth for empty `targetColumnId` (more defensive than the plan's five-case minimum).
- `BoardColumn` also renders at-limit warning-tint bg (no banner) when `count === wipLimit`, matching the prototype's 3-tier visual (over / at / below).
- Phase filter menu adds a click-outside `mousedown` listener for dismissal (same pattern as `ProjectCard` 3-dot menu).

### No Rule 1/2/3/4 deviations recorded

The plan compiled cleanly on the first test run — no blocking bugs, no missing critical functionality. The only code edit outside the plan's file list was `project-detail-shell.test.tsx`, which had to move from "assert placeholder string" to "assert BoardToolbar element" because the placeholder branch is now gone. That edit is in scope for Task 2 per the plan's `files_modified` list (indirect: shell.tsx was modified; the test covering the removed branch naturally required a matching update).

## Known Stubs

- **Assignee avatar initials:** derived from `#{assigneeId}` as placeholder until `GET /projects/{id}/members` lands. Documented inline. Does not block the plan's goal — the BoardCard still renders identifiable cards and the drag/click flows work.
- **Board columns meta fallback:** when `GET /projects/{id}/columns` returns `[]`, BoardTab falls back to `project.columns` (the status-name list) and uses `wipLimit = 0` for every column. Plan 11-04's Kolonlar sub-tab already persists WIP; once users save a limit for at least one column, the meta fetch populates. Documented inline.

Neither stub prevents the plan's goal: the 4-column board is reachable, drag+drop works, WIP Warn+Allow triggers correctly when limits exist.

## Threat Flags

None. The only network surface this plan introduces is `GET /projects/{id}/columns` (reused from Phase 9 — existing project-member authz) and `GET /sprints?current=true` (reused from Phase 9). Neither is a new endpoint.

## TDD Gate Compliance

Both tasks carry `tdd="true"`. As with Plans 11-01 and 11-04 (see their TDD Gate Compliance notes), each task committed a single `feat(...)` commit with tests co-located alongside the implementation rather than split RED/GREEN/REFACTOR. The tests were written first for each task (RED conceptually), then the component satisfied them (GREEN), confirmed before commit. No refactor phase was needed. All 23 new unit tests green on the final plan commit.

## Self-Check: PASSED

Created files verified (via filesystem existence):
- FOUND: Frontend2/components/project-detail/board-card.tsx
- FOUND: Frontend2/components/project-detail/board-card.test.tsx
- FOUND: Frontend2/components/project-detail/board-column.tsx
- FOUND: Frontend2/components/project-detail/board-column.test.tsx
- FOUND: Frontend2/components/project-detail/board-toolbar.tsx
- FOUND: Frontend2/components/project-detail/board-toolbar.test.tsx
- FOUND: Frontend2/components/project-detail/board-tab.tsx
- FOUND: Frontend2/lib/dnd/board-dnd.ts
- FOUND: Frontend2/lib/dnd/board-dnd.test.ts

Modified files verified:
- FOUND (modified): Frontend2/components/project-detail/project-detail-shell.tsx
- FOUND (modified): Frontend2/components/project-detail/project-detail-shell.test.tsx

Commits verified (via git log):
- FOUND: b162630 (Task 1 — BoardCard + BoardCardGhost)
- FOUND: 3f6e852 (Task 2 — BoardColumn + BoardToolbar + BoardTab + drop logic)
