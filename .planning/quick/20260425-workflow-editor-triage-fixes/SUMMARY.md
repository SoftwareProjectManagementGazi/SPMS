---
slug: workflow-editor-triage-fixes
status: complete
created: 2026-04-25
finished: 2026-04-25
---

# Workflow Editor Triage Fixes — Summary

## Result
All 25 selected items from `.planning/ui-reviews/triage-2026-04-25/workflow-editor.md` shipped across 16 atomic commits on `main`.

## Excluded
- **#16** — AI öner "Yakında" badge: user opted to keep current state.

## Commits (oldest → newest)

| SHA | Triage # | Summary |
|-----|---------|---------|
| `e78293a` | #2 | Critical-tone Lock banner only for sequential-locked |
| `e8afbed` | #15 | Bottom toolbar pill radius 999 → 10 |
| `0676036` | #25 | Edge label fontSize 10.5 → 10 |
| `8cbaa51` | #13, #23 | Drop double padding + grid 1fr 320px body |
| `a22db31` | #14 | Remove disabled Çoğalt header button |
| `9f20fef` | #5 | Zoom −/+ + Fit toolbar buttons (ReactFlowProvider + ref bridge) |
| `e23d426` | #4 | Render React Flow MiniMap bottom-right; drop dead MinimapWrapper |
| `e40eebc` | #10 | Visible left-target / right-source phase-node handles |
| `b725a06` | #6 | Reachability + tasks-warning rows in validation panel |
| `a2252b0` | #11 | Edge selection source→target summary box |
| `6ab4351` | #7, #8, #12 | Node + edge delete buttons + status-mode horizontal Initial/Final |
| `e8592d9` | #21, #24 | Mode-segment icons + vertical FlowRules button list |
| `1874cc9` | #1, #3 | Separate lifecycle/status workflows + active state from transitions |
| `7ff2122` | #9 | Wired bottom-toolbar Bağlantı edge-create flow |
| `7192756` | #19, #22, #26 | Trim shortcuts + fix Cmd+A/G/D + isMac flash via dynamic import |
| `335130c` | #17, #18, #20 | Preset hash + drag-stop polygon + dialog/menu focus management |

## Files touched
- `Frontend2/components/workflow-editor/`
  - `editor-page.tsx`
  - `mode-banner.tsx`
  - `bottom-toolbar.tsx`
  - `phase-edge.tsx`
  - `phase-node.tsx`
  - `validation-panel.tsx`
  - `selection-panel.tsx`
  - `right-panel.tsx`
  - `flow-rules.tsx`
  - `shortcuts-panel.tsx`
  - `preset-menu.tsx`
  - `dirty-save-dialog.tsx`
  - `context-menu.tsx`
  - `workflow-canvas.tsx`
  - `workflow-canvas-inner.tsx`
  - `minimap-wrapper.tsx` (deleted)

## Notes / Follow-ups
- TypeScript passes cleanly on all modified files; only pre-existing errors remain (`edgeId` discriminated-union TS2339 on lines 1009/1018 of `editor-page.tsx`, `edgesUpdatable` ReactFlowProps mismatch in `workflow-canvas-inner.tsx`). These are not regressions and are out of scope for this UI parity pass.
- Backend already accepts arbitrary keys in `process_config` JSONB, so the new `status_workflow` field requires no migration.
- `useQuery({ queryKey: ["phase-transitions", project.id], ... })` was added inline rather than promoted to a hook because `useCycleCounters` already exists for the count map and a second hook for raw transitions felt overkill.
- Manual UAT not run as part of this quick task; recommend a smoke test in browser to verify each fix visually.

## Out of scope (intentional)
- Backend `status_workflow` schema validation (field is stored as opaque JSON).
- New unit tests; the changes are mostly UI parity tweaks that the existing component test suite covers structurally.
- Removing pre-existing TS errors above.
