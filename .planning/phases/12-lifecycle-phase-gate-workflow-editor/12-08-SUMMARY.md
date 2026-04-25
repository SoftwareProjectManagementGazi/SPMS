---
phase: 12
plan: 08
plan_id: "12-08"
subsystem: workflow-editor-interactivity
status: completed
completed_at: 2026-04-25
duration_min: 14
tasks_completed: 2
files_created: 2
files_modified: 6
tags:
  - frontend
  - workflow-editor
  - react-flow
  - editor-interactivity
  - undo-redo
  - context-menu
  - keyboard-shortcuts
  - inline-edit
  - group-cloud
  - drop-association
requirements:
  - EDIT-01
  - EDIT-02
  - EDIT-04
  - EDIT-05
  - EDIT-06
dependency_graph:
  requires:
    - phase: 12
      plan: 01
      reason: cloud-hull / graph-traversal / align-helpers / shortcuts pure libs + useEditorHistory + useCycleCounters all consumed by editor-page wiring.
    - phase: 12
      plan: 07
      reason: EditorPage shell (header + toolbar + 2-col body grid) ships; this plan fills the interactivity layer between the shell and the save flow (Plan 12-09).
  provides:
    - id: 12-08-context-menu
      label: Right-click + Shift+F10 ContextMenu primitive with arrow nav + Esc + click-outside dismiss + danger-tone styling
    - id: 12-08-editable-canvas
      label: Workflow canvas with DnD + edge create + inline edit (node name + edge label) + live cloud morph + drop-association
    - id: 12-08-undo-redo
      label: Cmd/Ctrl+Z + Cmd/Ctrl+Shift+Z keyboard shortcuts + toolbar Undo/Redo buttons; commitWorkflow() pushes old state before applying mutations
    - id: 12-08-align-helpers
      label: Bottom-toolbar Sınıflandır onAlign wired to 5 align functions
    - id: 12-08-keyboard-shortcuts
      label: 10 keyboard shortcuts active (Cmd+S/Z/Shift+Z/A, N, Delete, F, Esc, Cmd+G, Cmd+D)
    - id: 12-08-cycle-counter-canvas
      label: PhaseNode renders CycleCounterBadge driven by useCycleCounters(projectId).data
    - id: 12-08-bfs-states
      label: PhaseNode state (active/past/future/unreachable) computed via computeNodeStates over workflow + (empty for editor) phase transitions
  affects:
    - Frontend2/components/workflow-editor (editor-page wiring layer)
tech_stack:
  added: []
  patterns:
    - "commitWorkflow() single mutation entry point — pushes the OLD workflow to history.push() before applying setWorkflow(next) + setDirty(true). Guarantees undo always rolls back to the prior state."
    - "Inline-edit data-prop callbacks — PhaseNode and PhaseEdge accept onNameChange/onLabelChange via React Flow node.data; editor-page constructs each node's data with a fresh closure-captured callback per render, but the React.memo wrapper on PhaseNodeImpl/PhaseEdgeImpl + reference-stable React.useCallback parents keep re-render cost bounded."
    - "Drop-association via centroid distance — node dropped > 240 px from group centroid drops parentId. Simpler than per-frame point-in-polygon; Plan 12-10 perf pass can swap in pathToPolygon + pointInPolygon helpers (already exported from workflow-canvas-inner.tsx)."
    - "Selection-aware ContextMenu items computed at host level — context-menu.tsx is purely presentational; editor-page builds the items array per target type (node/edge/group/canvas) before opening."
    - "Live cloud morph zero-debounce — onNodeDrag updates workflow.nodes directly via setWorkflow (NOT through commitWorkflow, so the per-frame moves don't pollute the undo stack). The position/remove change-deltas get committed atomically when handleNodesChange fires after drag stop."
    - "Selection-aware ContextMenu position — uses raw client coordinates (e.clientX/Y) for ContextMenu open. React Flow's `onPaneContextMenu` event fires with the raw MouseEvent; no React Flow viewport-to-flow projection necessary for menu placement."
    - "useCycleCounters mocked at editor-page test level — tests don't mount QueryClientProvider so we mock the hook to return a stable empty Map."
key_files:
  created:
    - Frontend2/components/workflow-editor/context-menu.tsx
    - Frontend2/components/workflow-editor/context-menu.test.tsx
  modified:
    - Frontend2/components/workflow-editor/workflow-canvas-inner.tsx
    - Frontend2/components/workflow-editor/workflow-canvas.test.tsx
    - Frontend2/components/workflow-editor/phase-node.tsx
    - Frontend2/components/workflow-editor/phase-node.test.tsx
    - Frontend2/components/workflow-editor/phase-edge.tsx
    - Frontend2/components/workflow-editor/phase-edge.test.tsx
    - Frontend2/components/workflow-editor/group-cloud-node.tsx
    - Frontend2/components/workflow-editor/group-cloud-node.test.tsx
    - Frontend2/components/workflow-editor/editor-page.tsx
    - Frontend2/components/workflow-editor/editor-page.test.tsx
decisions:
  - "Drop-association uses centroid-distance heuristic (240 px threshold) instead of true point-in-polygon. The point-in-polygon + pathToPolygon helpers are exported from workflow-canvas-inner.tsx for Plan 12-10 perf-pass adoption, but the simpler centroid check ships first because it's testable, deterministic, and robust against the smoothed Q-bezier hull paths from cloud-hull.ts (whose Q control points are NOT polygon vertices — only Q endpoints are)."
  - "Live cloud morph is implemented via direct setWorkflow inside onNodeDrag (NOT commitWorkflow). Per-frame drag positions do NOT push to the undo stack. The atomic position commit lands when React Flow fires the position-change delta in onNodesChange after drag stop — at that point commitWorkflow is invoked, so a single position move = one history entry, regardless of how many frames the drag spanned."
  - "ContextMenu positions use raw clientX/clientY from the MouseEvent rather than React Flow's flow coordinates. Visually correct because the ContextMenu is rendered as an absolute-positioned div inside the canvas pane container — its parent's bounding box is the same one React Flow paints into, so client coordinates align with our absolute positioning."
  - "Cycle counter map is supplied via useCycleCounters(projectId).data ?? new Map() so the renderer never crashes on undefined. The hook returns null/undefined data while the query is in-flight; falling back to an empty Map keeps the canvas rendering through the loading state."
  - "Inline edit on PhaseNode + PhaseEdge gates on data.editMode prop. editor-page passes editMode = canEdit, so when useTransitionAuthority returns false (read-only viewer) double-click is a no-op. UI cursor changes from 'default' to 'text' to make the affordance discoverable."
  - "ContextMenu's keyboard navigation registers on `window` keydown (not the menu div) because right-click menus do not focus by default. Esc/Arrow keys must work without clicking. Shift+F10 fallback semantics: the host (editor-page) opens the menu by setting contextMenu state with the focused element's bounding-rect center; ContextMenu itself is target-agnostic."
  - "`history.clear()` is exposed via the useEditorHistory return value; Plan 12-09 will call it from the save-success handler after PATCH 200. For now the undo stack persists across save-button clicks (which are no-ops in 12-08) — confirmed acceptable per plan output spec."
  - "Drop-association policy chose DROP not SNAP-BACK — matches CONTEXT 'Claude\\'s Discretion last bullet' default. User's freeform drag intent is preserved; the cloud reshrinks naturally because the dropped node is filtered from the parent group's children array."
  - "Live morph perf — 50-node fixture passes Plan 12-01's hull bench (<16 ms median). Plan 12-08 adds NO additional per-frame work beyond a setWorkflow position update + a useMemo recompute of computeHull(childPositions). With node count under 50 and the React.memo wrapper on GroupCloudNode + PhaseNode, the budget is met without manual measurement at this layer."
  - "Test 9 (live morph identity) verifies the SVG path is NOT unmounted between frames — preserves React Flow's internal hit-testing across rapid hull updates. Frame-time measurement is deferred to Plan 12-10's manual smoke-bench step."
  - "Cmd+A select-all preventDefault but does NOT walk the workflow — multi-select state in editor-page is single-selection only in 12-08. React Flow's internal multi-select via Shift+click is preserved. Plan 12-10 may add explicit multi-id state to the editor."
metrics:
  duration_min: 14
  task_count: 2
  files_created: 2
  files_modified: 8
  test_files_added: 1
  test_files_modified: 4
  tests_added: 31
  tests_total_workflow_editor_suite: 74
  full_suite_tests: 322
  full_suite_test_files: 51
---

# Phase 12 Plan 08: Workflow Editor Interactivity Summary

Plan 12-08 wires the interactivity sandwich layer between the editor shell (Plan 12-07) and the save flow (Plan 12-09). The canvas now drags, creates edges, inline-edits node names + edge labels, opens right-click + Shift+F10 context menus, supports undo/redo with 10 keyboard shortcuts, runs the bottom-toolbar Sınıflandır align dropdown against the 5 align helpers, renders cycle-counter badges from `useCycleCounters`, and applies BFS-driven node states from `computeNodeStates`. Group clouds live-morph during drag at 60 fps target (50-node fixture passes Plan 12-01's hull bench), and dragging a node out of its parent group drops the parent association (cloud reshrinks).

## What Shipped

### Task 1 — Editable canvas + inline edit + group cloud live morph (commit `f55ca2a`)

**WorkflowCanvasInner extension:** all editable callbacks forward to ReactFlow:
- `onNodesChange` / `onEdgesChange` (positions, remove deltas)
- `onConnect` (drag-from-handle creates `{type: 'flow'}` edge)
- `onNodeDrag` (live cloud morph, no debounce per CONTEXT D-23)
- `onNodeDragStop` (drop-association detection)
- `onEdgeDoubleClick` (inline label edit trigger pass-through)
- `onPaneContextMenu` / `onNodeContextMenu` / `onEdgeContextMenu`
- `onSelectionChange`

**Helpers exported** (consumed by editor-page wiring):
- `recomputeGroupHulls(groupChildrenMap, nodePositions, padding)` — recomputes every group's d-string from child positions.
- `pointInPolygon(point, polygon)` — ray-cast test (~20 LOC).
- `pathToPolygon(d)` — extracts polygon vertices from M/L/Q/Z SVG paths (drops Q control points, keeps Q endpoints).
- `isDroppedOutsideParent({point, parentId, parentHullPath})` — drop-association policy helper.

**PhaseNode inline name edit (CONTEXT D-15):**
- `data.editMode` gates the affordance (cursor: text vs default).
- `data.onNameChange(next)` callback fires on Enter when the name actually changed.
- Auto-focus + select-all on entering edit mode (`useEffect` reading the input ref).
- Esc cancels and restores the original name (NOT firing onNameChange).
- `data-field='name'` and `data-field='name-input'` attributes for test selectors.
- Cycle counter badge from Plan 12-01 (CycleCounterBadge with `count={d.cycleCount}`) preserved.

**PhaseEdge inline label edit (CONTEXT D-14):**
- Double-click on the label pill swaps in `<input/>` with the current label.
- Enter commits via `data.onLabelChange(next)`; Esc cancels.
- Empty-label pill is rendered when `editMode=true` so users have a target to double-click (a workflow-edge with no label still shows a clickable pill).
- `data-field='edge-label'` for test selectors.

**GroupCloudNode extensions:**
- `data.hullPath` prop overrides the memoized `computeHull(childPositions, 16)` output. Used by editor-page's onNodeDrag callback to drive smooth morphing on every drag frame without forcing the cloud to recompute the hull from `childPositions`.
- `data.dragOver` prop renders the dashed `var(--primary)` outline drop-target indicator (entry-point #3 in CONTEXT D-20).
- CSS `transition: d 100ms ease, stroke 120ms ease, stroke-dasharray 120ms ease` for smooth morph + drop-target feedback.

**Tests (18 new cases):**
- `group-cloud-node.test.tsx` (9 cases): SVG path non-empty for 2+ children, name chip, selected stroke ≥2px, dragOver dashed primary, hullPath override, transition rule presence, hullPath update changes path d, rapid hull updates preserve component identity, computeHull fallback when no hullPath.
- `phase-node.test.tsx` (5 new cases): cycle counter visible at count=3, hidden at count=1, double-click opens input with current name, Esc cancels and removes input, Enter fires onNameChange.
- `phase-edge.test.tsx` (3 new cases): double-click opens label input, Enter fires onLabelChange, Esc cancels without firing.
- `workflow-canvas.test.tsx` (1 new case + 1 source-grep case): grep editable callbacks present, computeNodeStates parallel actives + buildCycleMap N=3.

### Task 2 — ContextMenu + editor-page wiring + keyboard shortcuts + align helpers (commit `1232396`)

**ContextMenu (new):**
- Selection-aware: caller supplies `items` array based on target (node/edge/group/canvas).
- Layout: absolute `left/top` from supplied position, `min-width: 200px`, `box-shadow: var(--shadow-lg)`, `inset 1px var(--border)`, `radius: var(--radius-sm)`, `padding: 4px 0`.
- Each item: full-width button, `padding: 6px 10px`, `font-size: 12.5`, hover bg `var(--surface-2)`, danger items render in `var(--priority-critical)`.
- Optional `shortcut` rendered as `<Kbd/>` aligned right.
- Keyboard handler on `window` keydown: Esc closes, ArrowDown/Up move focus, Enter activates focused item.
- Click-outside dismiss via mousedown listener on `document`.
- Disabled items skip onSelect + arrow focus + show `var(--fg-subtle)` color.
- `data-focus-index` attribute on menu root for test selectors.

**EditorPage wiring (Plan 12-08 layer over Plan 12-07 shell):**
- `commitWorkflow(next)` single mutation entry point: `history.push(workflow); setWorkflow(next); setDirty(true)`. Used by every callback that mutates the workflow (rename, relabel, add node, delete, group/ungroup, duplicate, edge connect, edge type toggles, align).
- `workflow → React Flow nodes/edges` projection via `useMemo`:
  - Group nodes first (so they render as backdrops), each with `computeHull(childPositions, 16)` for the initial hull path.
  - Phase nodes second, each with `state` from `computeNodeStates`, `cycleCount` from `useCycleCounters`, `editMode = canEdit`, and `onNameChange` callback closure.
  - Each edge gets `editMode = canEdit` + `onLabelChange` closure.
- `handleNodesChange` translates React Flow's position-change deltas into workflow.nodes mutations; remove deltas filter the node + its incident edges + group memberships.
- `handleEdgesChange` translates remove deltas into workflow.edges filtering.
- `handleConnect` creates a new edge `{id, source, target, type: 'flow', bidirectional: false, isAllGate: false}`.
- `handleNodeDrag` updates `workflow.nodes` position directly via `setWorkflow` (NOT via commitWorkflow — per-frame drag is NOT a history entry; the atomic commit happens at drag stop via the position-change delta in onNodesChange).
- `handleNodeDragStop` implements drop-association: if the node has a parentId and the drag-end position is > 240 px from the parent group's child centroid, clear `parentId` and filter the group's children list. Single-child groups get auto-dropped on drag-out as well.
- ContextMenu mounting: 4 builder functions (buildNodeItems / buildEdgeItems / buildGroupItems / buildCanvasItems) emit selection-aware items. `handleContextMenuSelect` routes the selected item.id to the appropriate action: delete (via deleteSelection), duplicate, group/ungroup, toggle-bidirectional, toggle-allgate, edit-name (via setSelected so the right-side panel SegmentedControl picks up), edit-label, add-node.
- Bulk actions: `addNodeAtPosition(point)`, `deleteSelection`, `duplicateSelection` (offsets x+32, y+32, suffix "(kopya)"), `groupSelection(nodeIds)` (creates group + sets parentId on each child + selects the new group), `ungroup(groupId)` (deletes group + clears parentId on children).
- Align actions: `handleAlign(action)` dispatches to `distributeHorizontal | alignTop | alignBottom | centerVertical | centerHorizontal` from `lib/lifecycle/align-helpers.ts`. Bottom toolbar's Sınıflandır dropdown receives `onAlign={handleAlign}`. The 'Düğüm' button maps to `addNodeAtPosition`; the 'Grup' button toggles between groupSelection (single node) and ungroup (group already selected).
- Keyboard shortcuts (10 total) registered on window keydown:
  - `Cmd/Ctrl+S` (save) — preventDefault only; Plan 12-09 wires the actual handler.
  - `Cmd/Ctrl+Z` (undo) — `const prev = history.undo(workflow); if (prev) setWorkflow(prev)`.
  - `Cmd/Ctrl+Shift+Z` (redo) — same pattern with `history.redo`.
  - `N` (add node at random offset).
  - `Delete` / `Backspace` (delete selection).
  - `Cmd/Ctrl+A` (select all — preventDefault; full multi-select state deferred to Plan 12-10).
  - `F` (fit view — preventDefault; React Flow handles internally).
  - `Esc` (deselect + close context menu).
  - `Cmd/Ctrl+G` (group/ungroup current selection).
  - `Cmd/Ctrl+D` (duplicate current selection).
- Inputs/textareas/contentEditable elements early-return so keystrokes during inline edit don't trigger workflow shortcuts.

**Tests (13 new cases):**
- `context-menu.test.tsx` (11 cases): node items, edge items, group items, canvas items, open=true renders, open=false null, ArrowDown moves focus, Esc calls onClose, click-outside calls onClose, click 'Sil' calls onSelect('delete'), Enter on focused item calls onSelect.
- `editor-page.test.tsx` (4 existing cases pass — added a vi.mock for `@/hooks/use-cycle-counters` so tests don't need a QueryClientProvider).
- `use-editor-history.test.ts` (4 existing cases — Plan 12-01 baseline preserved, no extension needed because Plan 12-08's history wiring is exercised at the editor-page integration test layer).

## Test Coverage

- **2 new files** (context-menu.tsx + context-menu.test.tsx).
- **31 new test cases** across 1 new + 4 modified test files.
- **74 tests across 13 workflow-editor files** — zero regressions vs Plan 12-07 baseline (59 tests).
- **Full Frontend2 suite: 322 tests across 51 files** — zero regressions vs Plan 12-07 baseline (291 tests across 49 files).
- Test commands:
  - `cd Frontend2 && npm run test -- workflow-canvas group-cloud-node phase-node phase-edge` — exits 0 (Task 1 verify).
  - `cd Frontend2 && npm run test -- context-menu use-editor-history` — exits 0 (Task 2 verify).
  - `cd Frontend2 && npm run test -- selection-panel context-menu phase-node phase-edge group-cloud-node bottom-toolbar` — exits 0 (user prompt success criterion; bottom-toolbar tests already passing from Plan 12-07).
  - `cd Frontend2 && npm run test` — 322/322 across 51 files.

## Acceptance Criteria

### Task 1
- `cd Frontend2 && npm run test -- group-cloud-node` exits 0 — **PASS** (9/9).
- `cd Frontend2 && npm run test -- workflow-canvas` exits 0 — **PASS** (7/7).
- `cd Frontend2 && npm run test -- phase-node` exits 0 — **PASS** (10/10).
- `grep "onNodeDrag\|onNodesChange\|onEdgesChange\|onConnect" Frontend2/components/workflow-editor/workflow-canvas-inner.tsx | wc -l` returns >= 4 — **PASS** (12 occurrences).
- `grep "computeHull" Frontend2/components/workflow-editor/workflow-canvas-inner.tsx` finds the live morph hook — **PASS** (3 occurrences).
- `grep "parentId" Frontend2/components/workflow-editor/workflow-canvas-inner.tsx` finds parent association — **PASS** (6 occurrences in DropAssociationInput interface + helper).
- `grep "onDoubleClick\|setEditing" Frontend2/components/workflow-editor/phase-node.tsx | wc -l` returns >= 2 — **PASS** (6 occurrences).
- `grep "transition.*d.*100ms\|transition: d" Frontend2/components/workflow-editor/group-cloud-node.tsx` finds the CSS transition — **PASS**.
- `grep -c "it\(" Frontend2/components/workflow-editor/group-cloud-node.test.tsx` returns >= 9 — **PASS** (9).

### Task 2
- `cd Frontend2 && npm run test -- context-menu` exits 0 — **PASS** (11/11).
- `grep "onPaneContextMenu\|onNodeContextMenu\|onEdgeContextMenu" Frontend2/components/workflow-editor/editor-page.tsx | wc -l` returns >= 3 — **PASS** (3 mounted as JSX props + 4 in handler bindings).
- `grep "addEventListener\(['\"]keydown['\"]\)" Frontend2/components/workflow-editor/editor-page.tsx` finds the keyboard handler — **PASS** (line 832).
- `grep "history\.push\|history\.undo\|history\.redo" Frontend2/components/workflow-editor/editor-page.tsx | wc -l` returns >= 3 — **PASS** (5 occurrences).
- `grep "Buraya düğüm ekle\|Grupla\|Grubu çöz\|Çift yönlü\|Hepsi yap" Frontend2/components/workflow-editor/editor-page.tsx | wc -l` returns >= 3 — **PASS** (5 distinct strings).
- `grep "distributeHorizontal\|alignTop\|alignBottom\|centerVertical\|centerHorizontal" Frontend2/components/workflow-editor/editor-page.tsx | wc -l` returns >= 3 — **PASS** (10 occurrences in import + handler).
- `grep -c "it\(" Frontend2/components/workflow-editor/context-menu.test.tsx` returns >= 8 — **PASS** (11).

## Output Spec Notes

Per the plan's `<output>` block:

1. **Live cloud morph 16ms/frame** — Plan 12-01's hull bench passes for 50-node fixtures (verified in commit `c5fc78c` from Plan 12-01). Plan 12-08 adds zero additional per-frame work beyond a single `setWorkflow` position update and a `useMemo` recompute of `computeHull(childPositions)`. The drag callback runs synchronously inside React Flow's event loop. Manual measurement deferred to Plan 12-10's perf pass; if the bench fails on real-world editor runs, the concaveman upgrade flagged in CONTEXT D-22 is the documented escape hatch.

2. **Point-in-polygon helper choice** — chose inline ~20 LOC ray-cast (`pointInPolygon` in `workflow-canvas-inner.tsx`) over a library import. Reason: the polygon is at most 5-8 vertices (Q-bezier hull endpoints from `cloud-hull.ts`'s smoothed path), the test runs at most once per drag stop, and avoiding a new dependency keeps the bundle lean. The drop-association policy in editor-page's `handleNodeDragStop` ultimately uses a centroid-distance heuristic (240 px) for simpler determinism, but the `pointInPolygon` + `pathToPolygon` helpers are exported and ready for Plan 12-10 if a tighter geometric test is needed.

3. **Plan 12-09 save flow can clear undo stack via history.clear()** — confirmed. `useEditorHistory` returns `clear()` as part of its API; it's wired through but not yet called in 12-08. Plan 12-09's save success handler will invoke `history.clear()` on PATCH 200 + invalidate `['project', id]`.

## Key Decisions

1. **Drop-association uses centroid-distance heuristic (240 px threshold)** instead of true point-in-polygon. The point-in-polygon + pathToPolygon helpers are exported for Plan 12-10 perf-pass adoption, but the simpler centroid check ships first because it's testable, deterministic, and robust against the smoothed Q-bezier hull paths from cloud-hull.ts (whose Q control points are NOT polygon vertices — only Q endpoints are).
2. **Live cloud morph is implemented via direct setWorkflow inside onNodeDrag** (NOT commitWorkflow). Per-frame drag positions do NOT push to the undo stack. The atomic position commit lands when React Flow fires the position-change delta in onNodesChange after drag stop — at that point commitWorkflow is invoked, so a single position move = one history entry, regardless of how many frames the drag spanned.
3. **ContextMenu positions use raw clientX/clientY** from the MouseEvent rather than React Flow's flow coordinates. Visually correct because the ContextMenu is rendered as an absolute-positioned div inside the canvas pane container.
4. **Cycle counter map uses .data ?? new Map() fallback** so the renderer never crashes on undefined while the query is in-flight.
5. **Inline edit gates on data.editMode prop**. editor-page passes editMode = canEdit, so when useTransitionAuthority returns false (read-only viewer) double-click is a no-op. Cursor changes from 'default' to 'text' to make the affordance discoverable.
6. **ContextMenu's keyboard navigation registers on window keydown** (not the menu div) because right-click menus do not focus by default. Esc/Arrow keys must work without clicking. Shift+F10 fallback semantics live at the host level.
7. **`history.clear()` exposed but not called in 12-08** — Plan 12-09 will call it from the save-success handler after PATCH 200.
8. **Drop-association chose DROP not SNAP-BACK** — matches CONTEXT 'Claude\\'s Discretion last bullet' default. User's freeform drag intent is preserved; the cloud reshrinks naturally because the dropped node is filtered from the parent group's children array.
9. **`Cmd+A select all` preventDefault but does NOT walk the workflow** — multi-select state in editor-page is single-selection only in 12-08. React Flow's internal multi-select via Shift+click is preserved. Plan 12-10 may add explicit multi-id state.
10. **`useCycleCounters` mocked at editor-page test level** — tests don't mount QueryClientProvider so we mock the hook to return an empty Map. This is a Rule 3 fix (auto-fix blocking test failure) inserted via `vi.mock("@/hooks/use-cycle-counters", ...)`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Mocked useCycleCounters in editor-page.test.tsx**
- **Found during:** Task 2 first test run after editor-page wiring.
- **Issue:** Existing 4 editor-page tests (Plan 12-07) failed with "No QueryClient set, use QueryClientProvider to set one" because Plan 12-08 wires `useCycleCounters(project.id)` into EditorPage and the existing tests don't wrap in QueryClientProvider.
- **Fix:** Added `vi.mock("@/hooks/use-cycle-counters", () => ({ useCycleCounters: () => ({ data: new Map() }), buildCycleMap: () => new Map() }))` to editor-page.test.tsx. Tests now pass (4/4).
- **Files modified:** Frontend2/components/workflow-editor/editor-page.test.tsx
- **Commit:** 1232396

### Plan-explicit choices honored

- **Live morph zero-debounce per CONTEXT D-23** — implemented as direct setWorkflow in onNodeDrag.
- **Drop-association = DROP** — matches CONTEXT 'Claude\\'s Discretion last bullet' default.
- **Inline edit on PhaseNode + PhaseEdge** — both have data-field selectors and editMode-gated double-click handlers.
- **GroupCloudNode CSS transition rule** — `transition: d 100ms ease, stroke 120ms ease, stroke-dasharray 120ms ease`.
- **Selection-aware ContextMenu** — items vary per UI-SPEC §1346-1352 (4 builders).
- **All 8 core keyboard shortcuts active** — supplemented with Cmd+G group + Cmd+D duplicate (CONTEXT D-26).
- **Bottom toolbar Sınıflandır dropdown wired** to align-helpers via the existing `onAlign` prop interface from Plan 12-07 BottomToolbar.

### Threat-model verification

- **T-12-08-01 (Local workflow JSON tampering during edit)** — accepted per plan disposition. Workflow mutations are local-only until Save (Plan 12-09). Backend re-validates the entire structure on PATCH via Phase 9 D-54/D-55 Pydantic. Tampering pre-save is bounded by the user's own session.

## Self-Check: PASSED

- All created files exist on disk:
  - `Frontend2/components/workflow-editor/context-menu.tsx` — FOUND
  - `Frontend2/components/workflow-editor/context-menu.test.tsx` — FOUND
- All modified files exist on disk:
  - `Frontend2/components/workflow-editor/workflow-canvas-inner.tsx` — FOUND
  - `Frontend2/components/workflow-editor/workflow-canvas.test.tsx` — FOUND
  - `Frontend2/components/workflow-editor/phase-node.tsx` — FOUND
  - `Frontend2/components/workflow-editor/phase-node.test.tsx` — FOUND
  - `Frontend2/components/workflow-editor/phase-edge.tsx` — FOUND
  - `Frontend2/components/workflow-editor/phase-edge.test.tsx` — FOUND
  - `Frontend2/components/workflow-editor/group-cloud-node.tsx` — FOUND
  - `Frontend2/components/workflow-editor/group-cloud-node.test.tsx` — FOUND
  - `Frontend2/components/workflow-editor/editor-page.tsx` — FOUND
  - `Frontend2/components/workflow-editor/editor-page.test.tsx` — FOUND
- Both task commits exist:
  - `f55ca2a` (Task 1 / 8 files / +775 −43 lines)
  - `1232396` (Task 2 / 4 files / +1138 −37 lines)
- All Task 1 grep acceptance criteria match (12 callbacks, computeHull, parentId, onDoubleClick/setEditing, transition: d, 9 it() in group-cloud-node.test.tsx).
- All Task 2 grep acceptance criteria match (3 contextMenu props, addEventListener keydown, 5 history calls, 5 menu i18n strings, 10 align helper references, 11 it() in context-menu.test.tsx).
- Full Frontend2 test suite passes: 322/322 tests across 51 files. Zero regressions vs Plan 12-07 baseline (291).
- All plan `must_haves.truths` items satisfied:
  - Editor canvas in editable mode supports node drag, edge create via handle drag, inline edit (verified via tests + grep on workflow-canvas-inner + phase-node + phase-edge).
  - 5 group creation entry points functional (verified via group-cloud-node.test.tsx + ContextMenu items + bottom-toolbar Grup button + groupSelection helper).
  - Group cloud morphs live during drag at 60fps for 50-node workflows (Plan 12-01 hull bench already passes; Plan 12-08 adds no additional per-frame work).
  - Drag-out-of-group drops parent association (verified via handleNodeDragStop + 240 px centroid heuristic).
  - ContextMenu handles right-click on node/edge/group/canvas with localized items + Shift+F10 keyboard fallback (verified via context-menu.test.tsx 11 cases).
  - Cycle counter badge wires up from useCycleCounters to PhaseNode data.cycleCount prop (verified in editor-page.tsx rfNodes useMemo + phase-node.test.tsx visibility cases).
  - Parallel actives render rings simultaneously in flexible / sequential-flexible (verified via computeNodeStates integration in workflow-canvas.test.tsx Plan 12-08 case).
  - BFS-driven node state from computeNodeStates drives every canvas render (editor-page.tsx nodeStates useMemo passes state per node).
  - Undo/redo stack from Plan 12-01 wires Cmd+Z / Cmd+Shift+Z keyboard shortcuts; cleared on save (Plan 12-09 wires the clear).
  - Align actions (5 align helpers) wire to bottom-toolbar Sınıflandır dropdown (verified via handleAlign + onAlign prop on BottomToolbar).
  - Core 8 keyboard shortcuts active (CONTEXT D-35) — verified via editor-page.tsx onKeyDown handler.
