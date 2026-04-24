# Phase 12: Lifecycle, Phase Gate & Workflow Editor - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 12-lifecycle-phase-gate-workflow-editor
**Areas discussed:** Plan decomposition & build order, Workflow Editor architecture + advanced features, Phase Gate flow & permissions, Lifecycle sub-tabs UX detail

---

## Plan decomposition & build order

### Q1: How should the ~10 plans be sequenced across Lifecycle and Workflow Editor work?

| Option | Description | Selected |
|--------|-------------|----------|
| Lifecycle-first (Recommended) | Plans 12-01..06 Lifecycle, 12-07..10 Editor. Highest user-visible value first. | ✓ |
| Editor-first | Editor infrastructure first, downstream features consume. Risk: no user value until plan 6+. | |
| Interleaved by vertical slice | Infra/feature/feature/...; every plan ships end-to-end value. | |

**User's choice:** Lifecycle-first (Recommended)
**Notes:** Phase Gate + Milestones = highest user value; editor is internal tooling.

### Q2: Plan 01 shared infra scope

| Option | Description | Selected |
|--------|-------------|----------|
| Plan 01 = full shared infra (Recommended) | Canvas primitive + all services/hooks + BFS + validators + permission hook. ~20-25 files. | ✓ |
| Thin plan 01 — services only | Canvas built in plan 07; LifecycleTab uses inlined SVG in plan 02. | |
| Skip shared-infra plan | Each feature builds what it needs; later refactors. | |

**User's choice:** Plan 01 = full shared infra (Recommended)

### Q3: When to introduce team-leader permission hook?

| Option | Description | Selected |
|--------|-------------|----------|
| Plan 01 (Recommended) | Ship `use-transition-authority.ts` in shared-infra plan; all consumers share. | ✓ |
| Plan 02 (Phase Gate) | Introduce alongside first consumer; later features compose. | |
| Defer to later plan | Phase 12 role-only (Admin/PM); TL scope to Phase 13+. | |

**User's choice:** Plan 01 (Recommended)

### Q4: E2E verification scope

| Option | Description | Selected |
|--------|-------------|----------|
| Per-plan unit + integration (Recommended) | Unit tests for pure logic, RTL for UI. E2E deferred until test-DB seeder lands. | ✓ |
| Per-plan + E2E smoke in final plan | Add 1-2 Playwright specs in plan 10. | |
| Full E2E for every feature | Each feature plan includes E2E; ~3-4 days added. | |

**User's choice:** Per-plan unit + integration (Recommended)

---

## Workflow Editor architecture + advanced features

### Q1: Core canvas implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Port prototype SVG + extend (Recommended) | Reuse prototype SVG + @dnd-kit; ~600-800 lines, zero extra deps. | |
| **React Flow library** | @xyflow/react; built-in DnD + edges + minimap + zoom. ~70KB gzipped. User-chosen. | ✓ |
| Custom SVG + react-draggable | Custom canvas + react-draggable for positioning. Rejected middle ground. | |

**User's choice:** React Flow library
**Notes:** Constraint: custom node/edge renderers to preserve 100% prototype visual fidelity — we use React Flow's graph-model/DnD/minimap plumbing only.

### Q2: Canvas sharing between LifecycleTab and Editor

| Option | Description | Selected |
|--------|-------------|----------|
| Single primitive with readOnly prop (Recommended) | `<WorkflowCanvas readOnly?/>` in plan 01; both modes share. | ✓ |
| Two separate components | Decoupled but higher maintenance; visual drift risk. | |

**User's choice:** Single primitive with readOnly prop (Recommended)

### Q3: BFS active-phase state computation location

| Option | Description | Selected |
|--------|-------------|----------|
| Frontend pure function (Recommended) | `lib/lifecycle/graph-traversal.ts::computeNodeStates(wf, txs)` pure fn. Testable. No backend change. | ✓ |
| Backend endpoint | New `/projects/{id}/phase-states`. Scope creep. | |
| Hybrid cache | Frontend computes; cache in process_config. Invalidation complexity. | |

**User's choice:** Frontend pure function (Recommended)

### Q4: EDIT-05 parallel active phases rule

| Option | Description | Selected |
|--------|-------------|----------|
| Any node reachable from an active node in sequential-flexible/flexible (Recommended) | BFS encodes; V-Model + Spiral support parallel; sequential-locked/continuous = 1 active. | ✓ |
| User explicitly marks nodes active | Per-node isActive flag; leaks UX to user. | |
| Only in V-Model / hardcoded by mode | Doesn't generalize to Spiral/RAD. | |

**User's choice:** Any node reachable from an active node in sequential-flexible/flexible (Recommended)

### Q5: EDIT-06 cycle counter data source

| Option | Description | Selected |
|--------|-------------|----------|
| Client-side from /activity endpoint (Recommended) | `useCycleCounters` aggregates client-side; TanStack Query cached. | ✓ |
| New backend aggregation endpoint | Backend scope creep. | |
| Compute from phase_reports table | Misses phases with transitions but no report yet. | |

**User's choice:** Client-side from /activity endpoint (Recommended)

### Q6: EDIT-07 preset template apply semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Staged with Apply confirmation (Recommended) | Preview + Apply + Undo. ConfirmDialog warning about node ID breakage. | ✓ |
| Destructive replace immediately | One misclick wipes; undo only via Ctrl+Z. | |
| Merge with existing | Produces messy hybrids. | |

**User's choice:** Staged with Apply confirmation (Recommended)

### Q7: React Flow SSR/hydration strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic import with ssr:false (Recommended) | `dynamic(() => import('./workflow-canvas'), { ssr: false, loading: <Skeleton/> })`. Matches Phase 11 D-36 TipTap. | ✓ |
| "use client" boundary | Still SSR-renders; React Flow's window access breaks. | |

**User's choice:** Dynamic import with ssr:false (Recommended) (after SSR/hydration explanation)
**Notes:** User initially asked for clarification in Turkish ("ssr hydrationdan kasıtın nedir?"). After plain-text explanation covering Node.js SSR, window/ResizeObserver browser APIs, hydration mismatch, and why "use client" alone is insufficient, user confirmed the dynamic import approach.

### Q8: React Flow custom node/edge renderers fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Custom renderers, 100% prototype-faithful (Recommended) | `<PhaseNode/>` + `<PhaseEdge/>` replicate prototype's absolute-positioned divs + SVG path stroke dasharray exactly. React Flow defaults discarded. | ✓ |
| React Flow defaults + light theming | Faster build but visually diverges; violates v2.0 fidelity rule. | |

**User's choice:** Custom renderers, 100% prototype-faithful (Recommended)

### Q9: Edge creation UX

| Option | Description | Selected |
|--------|-------------|----------|
| Drag from handle to handle (Recommended) | React Flow default. Node handles → click-hold → drag → release creates edge. | ✓ |
| Click source then click target | More discoverable but slower. | |
| Keyboard + select flow | Accessibility-forward but hidden. | |

**User's choice:** Drag from handle to handle (Recommended)

### Q10: Node inline edit pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Double-click enables inline name edit + side panel for rest (Recommended) | Double-click → name input; description/color/WIP/flags in side panel. | ✓ |
| Everything via side panel only | Safer but slower for renames. | |
| Double-click opens modal | Disruptive. | |

**User's choice:** Double-click enables inline name edit + side panel for rest (Recommended)

### Q11: Undo/redo scope

| Option | Description | Selected |
|--------|-------------|----------|
| Local in-memory stack, cleared on Save (Recommended) | Stack in component state; Cmd+Z/Cmd+Shift+Z. ~100 lines. | ✓ |
| Project-synced via backend | Scope creep. | |
| Skip undo/redo | Prototype has it; omission = visible regression. | |

**User's choice:** Local in-memory stack, cleared on Save (Recommended)

### Q12: EDIT-02 swimlane group creation paths

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom toolbar 'Grup' button + drag rectangle on canvas (Recommended) | Click "Grup" → crosshair → drag rectangle → spatial auto-group. | |
| Select nodes then 'Group' action | Multi-select + toolbar button; needs Shift-select. | |
| Drag nodes onto existing group dropzone | Requires parent-child data model. | |
| **ALL 3 + drag-node-into-group + group-cloud + non-group node + bidirectional button + right-click context menu** | User's custom spec: cloud-shaped group with smooth margin, 5 creation paths, right-click menu, Grupla/Grubu-Çöz toggle. | ✓ |

**User's choice:** All paths + smooth cloud-shaped group + bidirectional button + right-click context menu
**Notes:** User provided rich freeform spec. Reflected back + confirmed as D-20..D-24. Key visual: group rendered as SVG concave-hull cloud with live-morph during node drag, not sharp rectangle.

### Q13: Group cloud computation timing

| Option | Description | Selected |
|--------|-------------|----------|
| Live morph (Recommended) | 60fps recompute on every drag frame. Feels best. | ✓ |
| Snap on drop | Fixed during drag; animates on release. Less fluid. | |
| Manual resize handles | Figma-style; no auto-growth. | |

**User's choice:** Live morph (Recommended)

### Q14: "AI öner" button behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Keep button, "Yakında" badge (Recommended) | Disabled + badge + tooltip; preserves fidelity. | ✓ |
| Remove entirely | Deviation from prototype. | |
| Implement simple suggestion | Scope creep; AI is v3.0. | |

**User's choice:** Keep button, "Yakında" badge (Recommended)

### Q15: Zoom/pan controls

| Option | Description | Selected |
|--------|-------------|----------|
| React Flow default `<Controls/>` + prototype CSS theme (Recommended) | Built-in; themed via CSS variable overrides. | ✓ |
| Fully custom | More code; React Flow controls sufficient. | |

**User's choice:** React Flow default `<Controls/>` + prototype CSS theme (Recommended)

### Q16: Multi-select pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Shift+click + marquee drag (Recommended) | React Flow native; Cmd+A; bulk Delete/Group/Duplicate/Arrow-move. | ✓ |
| Only Shift+click | No marquee; cumbersome for 5+ nodes. | |

**User's choice:** Shift+click + marquee drag (Recommended)

### Q17: Workflow validation rules

| Option | Description | Selected |
|--------|-------------|----------|
| 5 rules: initial/final/reachability/cycles-in-flow/orphans (Recommended) | Pure validator; 300ms debounce; feedback exempt from cycle. | ✓ |
| Only backend validate | No inline feedback; bad UX. | |
| Prototype's static text | Doesn't actually validate. | |

**User's choice:** 5 rules (Recommended)

### Q18: Node color picker

| Option | Description | Selected |
|--------|-------------|----------|
| Status token picker (8 preset swatches) (Recommended) | status-todo/progress/review/done/blocked + priority-critical/high + primary. | ✓ |
| Custom hex + preset | Brand consistency at risk. | |
| Only 4 status tokens | Prototype supports 8; truncating = regression. | |

**User's choice:** Status token picker (8 preset swatches) (Recommended)

### Q19: Edge bidirectional semantic

| Option | Description | Selected |
|--------|-------------|----------|
| Pair-wise only — reverse for that specific pair (Recommended) | A↔B doesn't imply A↔C via B. | |
| Bidirectional = implicit two edges | Data model confusion. | |
| No bidirectional | Prototype has it; removal = regression. | |
| **Pair-wise only + "All" gate concept from jira_workflow.jpeg** | User's extended spec: pair-wise bidirectional + new "All" gate edge field for source-agnostic transitions (Jira pattern). | ✓ |

**User's choice:** Pair-wise + Jira "All" gate
**Notes:** User referenced `jira_workflow.jpeg` showing "All" pills next to target nodes in a Jira workflow. Interpreted as a new `is_all_gate: boolean` edge field meaning "any node can transition TO this target". Triggered D-18 schema v2 bump.

### Q20: Save flow error handling

| Option | Description | Selected |
|--------|-------------|----------|
| Full error map with toast + retry (Recommended) | 200/422/409/429/network all handled with specific UX. | ✓ |
| Only success/failure | Users don't know why rejected. | |

**User's choice:** Full error map with toast + retry (Recommended)

### Q21: Minimap interaction

| Option | Description | Selected |
|--------|-------------|----------|
| React Flow `<MiniMap/>` default + themed (Recommended) | Click-pan + drag viewport; CSS-themed. | ✓ |
| Custom static minimap (prototype-style) | No interaction; limited value. | |
| No minimap | Deviation. | |

**User's choice:** React Flow `<MiniMap/>` default + themed (Recommended)

### Q22: Schema v2 + All gate + bidirectional implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, v1→v2 schema bump (Recommended) | Normalizer v1→v2 adds defaults; WorkflowEdge Pydantic gains optional fields; use case honors both. | ✓ |
| Only bidirectional, defer All gate | Scope dar; Jira fidelity incomplete. | |
| Only All gate, drop bidirectional | Regression on prototype. | |

**User's choice:** Yes, v1→v2 schema bump (Recommended)

### Q23: "All" gate label localization

| Option | Description | Selected |
|--------|-------------|----------|
| T() helper i18n — 'Hepsi' / 'All' (Recommended) | Uses `useApp().language`; consistent Turkish UX. | ✓ |
| Fixed 'All' (Jira-native) | Inconsistent for Turkish users. | |
| Fixed 'Hepsi' | Inconsistent for English users. | |

**User's choice:** T() helper i18n (Recommended)

### Q24: isInitial / isFinal flags

| Option | Description | Selected |
|--------|-------------|----------|
| Both editor modes supported (Recommended) | Right-panel checkboxes; validator enforces ≥1 each. | ✓ |
| Status flow only | Lifecycle's first node auto-initial; less flexible. | |
| No flags | Regression. | |

**User's choice:** Both editor modes supported (Recommended)

### Q25: Keyboard shortcuts

| Option | Description | Selected |
|--------|-------------|----------|
| Core 8 shortcuts (Recommended) | Save/Undo/Redo/Add/Delete/Select-All/Fit-View/Esc. | ✓ |
| Only save+undo | Power users unhappy. | |
| Full 12+ including arrow-keys and Cmd+G | More code but pro UX. | |

**User's choice:** Core 8 shortcuts (Recommended)
**Notes:** Supplemented in D-26 with arrow-keys for move + Cmd+G group + Cmd+D duplicate via multi-select.

### Q26: Node handle pattern

| Option | Description | Selected |
|--------|-------------|----------|
| 4-way source/target (Recommended) | Top/right/bottom/left handles; V-Model verification edges require it. | ✓ |
| 2 horizontal (prototype pattern) | V-Model vertical edges impossible. | |
| Center handle with smart routing | Overkill for Phase 12. | |

**User's choice:** 4-way source/target (Recommended)

### Q27: Edge label inline edit

| Option | Description | Selected |
|--------|-------------|----------|
| Double-click edge → inline input (Recommended) | Double-click pill becomes input; side panel also edits. | ✓ |
| Side panel only | Less discoverable. | |

**User's choice:** Double-click edge → inline input (Recommended)

### Q28: Auto-layout button

| Option | Description | Selected |
|--------|-------------|----------|
| Skip for Phase 12 | ~200-400 lines + dependency; scope. | |
| Basic grid-snap + align helpers (Recommended) | Snap-to-20px + 5 align actions; ~80 lines. | |
| Full auto-layout (dagre) | Scope creep. | |
| **Basic grid-snap + align + note more detailed design deferred** | User explicitly noted: detailed design deferred to future. | ✓ |

**User's choice:** Basic grid-snap + align helpers + note deferred detailed auto-layout for future
**Notes:** Captured in Deferred Ideas: "Full dagre/ELK auto-layout deferred to v2.1+".

### Q29: Dirty-save protection

| Option | Description | Selected |
|--------|-------------|----------|
| beforeunload + router intercept (Recommended) | Native dialog + ConfirmDialog on router navigation. | ✓ |
| Only beforeunload | Router navigations unguarded. | |
| Auto-save | Rate-limit issues; scope creep. | |

**User's choice:** beforeunload + router intercept (Recommended)

---

## Phase Gate flow & permissions

### Q1: Phase Gate UX placement

| Option | Description | Selected |
|--------|-------------|----------|
| Inline expand in Lifecycle tab (Recommended) | Prototype pattern — expand between summary strip and canvas. | ✓ |
| Modal dialog | Design freeze violation. | |
| Sidebar drawer | Not in prototype. | |

**User's choice:** Inline expand in Lifecycle tab (Recommended)

### Q2: Criteria editor location

| Option | Description | Selected |
|--------|-------------|----------|
| Settings > Yaşam Döngüsü per-phase panel (Recommended) | Left phase picker + right criteria editor; enable_phase_assignment toggle at top. | ✓ |
| Inline in Phase Gate expand | Duplicate UI; Settings stays empty. | |
| Both places | Duplicate, high maintenance. | |

**User's choice:** Settings > Yaşam Döngüsü per-phase panel (Recommended)

### Q3: Permission gating approach

| Option | Description | Selected |
|--------|-------------|----------|
| `useTransitionAuthority()` hook — 3-role (Recommended) | Composes useAuth + project.manager_id + useLedTeams. All consumers share. | ✓ |
| Role only (Admin/PM) | Team Leaders see no button; Phase 9 D-18 violation. | |
| Show to all, handle 403 | Bad UX. | |

**User's choice:** `useTransitionAuthority()` hook — 3-role (Recommended)

### Q4: Open tasks action flow

| Option | Description | Selected |
|--------|-------------|----------|
| SegmentedControl + per-task exceptions Collapsible (Recommended) | Matches Phase 9 D-04 body shape exactly. | ✓ |
| SegmentedControl only (no exceptions) | Phase 9 D-04 exceptions unused. | |
| Per-task individual dropdown | Hell at 50 tasks. | |

**User's choice:** SegmentedControl + per-task exceptions Collapsible (Recommended)

### Q5: allow_override UX

| Option | Description | Selected |
|--------|-------------|----------|
| Conditional checkbox + two-button (Recommended) | In sequential-locked unmet: AlertBanner + checkbox; primary button relabels "Zorla Geç". | ✓ |
| Always-visible "Zorla Geç" button | Misclick risk high. | |
| No override | Phase 9 D-05 violation. | |

**User's choice:** Conditional checkbox + two-button (Recommended)

### Q6: Error handling matrix

| Option | Description | Selected |
|--------|-------------|----------|
| Full matrix with retry (Recommended) | 409/422/429/400/network each with specific UX. | ✓ |
| Only toast | Criteria failure detail lost. | |

**User's choice:** Full matrix with retry (Recommended)

### Q7: Idempotency-Key strategy

| Option | Description | Selected |
|--------|-------------|----------|
| crypto.randomUUID() per expand session + retry reuses (Recommended) | Phase 9 D-50 idempotency semantics preserved. | ✓ |
| New UUID per request | Duplicate transitions. | |
| Skip idempotency | Phase 9 infrastructure unused. | |

**User's choice:** crypto.randomUUID() per expand session + retry reuses (Recommended)

### Q8: 0-task phase handling (LIFE-03)

| Option | Description | Selected |
|--------|-------------|----------|
| --- metrics + "Uygulanamaz" criteria + info banner (Recommended) | Prototype phaseStats.total===0 branch. | ✓ |
| Block transition entirely | Blocks legitimate intermediate phases. | |
| Normal metrics (0/0, %0) | Confusing UI. | |

**User's choice:** --- metrics + "Uygulanamaz" criteria + info banner (Recommended)

### Q9: Concurrent transition detection

| Option | Description | Selected |
|--------|-------------|----------|
| Optimistic + 409 banner (Recommended) | No polling; refetch on 409. | ✓ |
| Every 30s background poll | Extra API cost. | |
| WebSocket real-time | PROJECT.md Out of Scope. | |

**User's choice:** Optimistic + 409 banner (Recommended)

### Q10: cycle_number increment source

| Option | Description | Selected |
|--------|-------------|----------|
| Backend auto (Phase 9 D-25) (Recommended) | Frontend never sends; backend computes from audit_log. | ✓ |
| Frontend explicit | Race condition risk. | |

**User's choice:** Backend auto (Phase 9 D-25) (Recommended)

### Q11: Transition note char limit

| Option | Description | Selected |
|--------|-------------|----------|
| Optional, 500 char + counter (Recommended) | N/500 counter; red border on overflow. | ✓ |
| Required, 1000 char | Too much friction. | |
| Optional, unlimited | UX disaster at long notes. | |

**User's choice:** Optional, 500 char + counter (Recommended)

### Q12: Cycle counter (×N) badge position

| Option | Description | Selected |
|--------|-------------|----------|
| Top-right corner, absolute (Recommended) | Size=xs Badge; visible only count ≥ 2; hover tooltip. | ✓ |
| Next to description | Collides with WIP indicator. | |
| No badge | EDIT-06 violation. | |

**User's choice:** Top-right corner, absolute (Recommended)

---

## Lifecycle sub-tabs UX detail

### Q1: LIFE-05 Milestone add UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline add row (Recommended) | Prototype pattern — add Card with inputs + save/cancel. | ✓ |
| Modal dialog | Breaks focus. | |
| Drawer | Not in prototype. | |

**User's choice:** Inline add row (Recommended)

### Q2: Milestone linked_phase_ids picker

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-select chip picker (Recommended) | Same UX as Phase 11 D-51 label chips. | ✓ |
| Single-phase picker | Multi-phase milestones underrepresented. | |
| No picker, UI deferred | Gantt integration (D-51) loses anchor. | |

**User's choice:** Multi-select chip picker (Recommended)

### Q3: LIFE-06 Artifact management UX

| Option | Description | Selected |
|--------|-------------|----------|
| Prototype row pattern + inline expand + file upload (Recommended) | Inline expand with file attachment. | ✓ |
| Modal-based | Prototype inline expand violation. | |
| Read-only (Phase 13) | LIFE-06 violation. | |

**User's choice:** Prototype row pattern + inline expand + file upload (Recommended)

### Q4: Methodology default artifacts behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-seed + user edit/delete/custom-add (Recommended) | Phase 9 D-28 seed; PM manages manually. | ✓ |
| Seed-only, no user edit | Phase 9 D-36 permission unused. | |

**User's choice:** Auto-seed + user edit/delete/custom-add (Recommended)

### Q5: LIFE-04 History row component reuse

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 11 MTTaskRow compact (Recommended) | Reuse Phase 11 D-32 components/my-tasks/task-row. | ✓ |
| New history-task-row component | Duplicate work; drift risk. | |
| BoardCard primitive | Wrong size/context. | |

**User's choice:** Phase 11 MTTaskRow compact (Recommended)

### Q6: History task data source

| Option | Description | Selected |
|--------|-------------|----------|
| Lazy-fetch on expand (Recommended) | TanStack Query on Collapsible expand; cached. | ✓ |
| Pre-load all cards | N API calls for N closed phases. | |

**User's choice:** Lazy-fetch on expand (Recommended)

### Q7: LIFE-07 Evaluation Report authoring

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid auto-prefill + PM editable (Recommended) | Summary fields read-only from backend; PM writes issues/lessons/recommendations. | ✓ |
| Fully blank manual form | More work for PM. | |
| AI summary | v3.0 scope. | |

**User's choice:** Hybrid auto-prefill + PM editable (Recommended)

### Q8: LIFE-07 PDF export UX

| Option | Description | Selected |
|--------|-------------|----------|
| Direct download + loading state (Recommended) | GET /phase-reports/{id}/pdf → Blob download with filename. | ✓ |
| Preview + edit + download | Report is already editable. | |
| Email send | No mail infra. | |

**User's choice:** Direct download + loading state (Recommended)

### Q9: Milestone timeline integration

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, vertical flag lines on Phase 11 Gantt (Recommended) | Small additive prop to existing custom SVG Gantt. | ✓ |
| Milestone sub-tab only | Cross-reference missing. | |
| Defer to Phase 13 | Reports Gantt absent; unnecessary delay. | |

**User's choice:** Yes, vertical flag lines on Phase 11 Gantt (Recommended)

### Q10: Methodology change handling

| Option | Description | Selected |
|--------|-------------|----------|
| A — Forbid (Recommended) | Settings > General read-only Metodoloji + tooltip. | |
| B — Manual mapping wizard (+2-3 plans) | Scope inflation for rare use case. | |
| C — Destructive reset | Data loss risk. | |
| **A now, note future mapping** | User's confirmation: forbid now, deferred ideas records possible v2.1 mapping wizard. | ✓ |

**User's choice:** Forbid now, note future mapping
**Notes:** User "şuan yasakla, ileride mapping olabilir diye not al" — captured in Deferred Ideas.

### Q11: Overview sub-tab

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, ship it (Recommended) | Port prototype OverviewSubTab verbatim (~200 lines). | ✓ |
| No, canvas only | Prototype deviation; metrics loss. | |
| Phase 13 | Deviation. | |

**User's choice:** Yes, ship it (Recommended)

### Q12: Kanban Lifecycle tab behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Overview + Milestones only (Recommended) | Prototype hides History + Artifacts for Kanban. | ✓ |
| Full 4 sub-tabs | Confusing when History/Artifacts empty. | |
| Hide Lifecycle tab entirely | Navigation inconsistency. | |

**User's choice:** Overview + Milestones only (Recommended)

---

## Claude's Discretion

Areas where the user said "you decide" or deferred to Claude:
- React Flow version pin (latest stable `@xyflow/react`).
- Concave-hull algorithm choice (library vs. convex-hull-plus-padding baseline).
- CanvasSkeleton component styling.
- Animation timings for group cloud morph + group expand transitions.
- SVG path smoothing coefficients for group clouds.
- Right-click context menu library / custom implementation.
- Debounce value for validation-panel recompute (300ms baseline).
- Toast library reuse (Phase 10 D-07 ToastProvider).
- ConfirmDialog reuse (Phase 10 D-25).
- Pydantic schema validator for `is_all_gate` / `bidirectional`.
- "Sınıflandır" dropdown menu layout in bottom toolbar.
- Exact behavior when a grouped node is dragged outside the group cloud (default: drop parent association).

---

## Deferred Ideas

- **Methodology change with manual mapping wizard** (v2.1) — User: "ileride mapping olabilir diye not al".
- **Full dagre/ELK auto-layout algorithm** (v2.1+) — User confirmed "daha detaylı bir tasarım daha sonra olabilir".
- **Workflow merge-resolution UI for 409 conflicts** (v2.1).
- **WebSocket / real-time concurrent transition detection** (PROJECT.md Out of Scope — v3.0 ADV-01).
- **Multi-file artifact attachments** (Phase 9 D-41 deferred).
- **Async PDF generation job queue** (Phase 9 D-60 deferred).
- **Reports page "Faz Raporları" aggregate section** (Phase 13 REPT-04).
- **Activity tab content** (Phase 13 PROF-01).
- **User Profile pages** (Phase 13 PROF-02..04).
- **All reporting charts** (Phase 13 REPT-01..04).
- **AI-powered workflow suggestion** (v3.0) — "AI öner" button is a "Yakında" placeholder in Phase 12.
- **Advanced keyboard shortcuts panel UI** (beyond Core 8).
- **Edge path routing algorithms** (orthogonal / smooth-step / user-configurable per edge).
- **Nested workflow nodes** (sub-workflow inside a node).
