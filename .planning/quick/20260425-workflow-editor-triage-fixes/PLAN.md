---
slug: workflow-editor-triage-fixes
created: 2026-04-25
type: ui-triage-fix
source: .planning/ui-reviews/triage-2026-04-25/workflow-editor.md
---

# Workflow Editor — Prototype Parity Fixes

## Goal
Apply 25 of 26 prototype-vs-implementation flaws documented in the
`triage-2026-04-25/workflow-editor.md` review (skipping #16 — AI öner
"Yakında" badge stays). Each logical fix produces an atomic commit so the
history is auditable.

## Selected items
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26

## Excluded
- **#16** — AI öner "Yakında" badge: user wants to keep current state.

## Approach (commit batches)

| # | Fix | Files |
|---|-----|-------|
| C1 | #2 mode-banner critical-tone restored | `mode-banner.tsx` |
| C2 | #15 bottom-toolbar pill radius 999→10 | `bottom-toolbar.tsx` |
| C3 | #25 edge label pill fontSize 10.5→10 | `phase-edge.tsx` |
| C4 | #13 + #23 root padding + body grid | `editor-page.tsx` |
| C5 | #14 remove disabled Çoğalt button | `editor-page.tsx` |
| C6 | #5 zoom −/+ + Fit toolbar buttons | `editor-page.tsx`, `workflow-canvas-inner.tsx` |
| C7 | #4 enable React Flow MiniMap | `editor-page.tsx`, `minimap-wrapper.tsx` |
| C8 | #10 phase-node handles visible | `phase-node.tsx` |
| C9 | #6 validation panel reachability + tasks-warning | `validation-panel.tsx` |
| C10 | #11 source→target summary box | `selection-panel.tsx` |
| C11 | #7 + #8 + #12 NodeEditor delete + EdgeEditor delete + status horizontal | `selection-panel.tsx` |
| C12 | #24 Flow/Workflow icons in mode segmented + #21 vertical button list | `editor-page.tsx`, `flow-rules.tsx` |
| C13 | #1 + #3 separate lifecycle/status workflow + active state | `editor-page.tsx` |
| C14 | #9 wire onAddEdge | `editor-page.tsx`, `bottom-toolbar.tsx` |
| C15 | #22 trim shortcuts to 5 + #19 fix Cmd+A,G,D + #26 fix isMac flash | `shortcuts-panel.tsx`, `editor-page.tsx` |
| C16 | #17 + #18 + #20 preset hash + drag-stop sync + focus trap | `preset-menu.tsx`, `editor-page.tsx`, `dirty-save-dialog.tsx`, `context-menu.tsx` |

## Acceptance
- All 25 fixes committed atomically.
- TypeScript build passes.
- No regressions in test suite.
- Manual smoke test: open the editor, verify each fix visually.

## Out of scope
- Backend schema changes (use existing JSONB process_config for status flow).
- New tests beyond compile-safety.
- Documentation files.
