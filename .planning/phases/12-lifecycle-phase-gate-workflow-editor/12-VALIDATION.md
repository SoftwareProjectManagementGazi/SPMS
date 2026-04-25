---
phase: 12
slug: lifecycle-phase-gate-workflow-editor
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-25
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source of truth: 12-RESEARCH.md `## Validation Architecture` (lines 828–880).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frontend framework** | Vitest 1.6.0 + @testing-library/react 16.3.2 (verified `Frontend2/package.json:64-65`) |
| **Frontend config file** | `Frontend2/vitest.config.ts` |
| **Backend framework** | pytest (Phase 9 baseline) |
| **Backend config file** | `Backend/pytest.ini` (existing) |
| **Quick run command** | `cd Frontend2 && npm run test -- <pattern>` (single test file) |
| **Full suite command** | `cd Frontend2 && npm test && cd ../Backend && python -m pytest` |
| **Estimated runtime** | ~60–120 s full suite (Frontend2 vitest ~30–60 s + Backend pytest ~30–60 s) |

---

## Sampling Rate

- **After every task commit:** Run the task-scoped quick command (e.g. `npm run test -- phase-gate-expand`)
- **After every plan wave:** Run the full Frontend2 suite (`cd Frontend2 && npm test`)
- **After Backend-touching plans (12-09):** Run `cd Backend && python -m pytest` in addition
- **Before `/gsd-verify-work`:** Full suite must be green (Frontend2 + Backend) AND benchmark suites pass perf budgets
- **Max feedback latency:** 60 s for quick command, 180 s for full suite

---

## Per-Task Verification Map

> One row per acceptance criterion. Plan-level test files create a single shared file across multiple criteria — duplicate rows reference the same file.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-* | 01 | 0 | infra | — | shared infra services + hooks + pure libs | Wave 0 | `npm run test -- graph-traversal workflow-validators cloud-hull use-transition-authority` | ❌ Wave 0 | ⬜ pending |
| 12-02-* | 02 | 1 | LIFE-02 | T-09-08 (Phase Gate idempotency) | Idempotency-Key UUID per session, 409/422/429 error matrix | RTL component | `npm run test -- phase-gate-expand` | ❌ Wave 0 (`Frontend2/components/lifecycle/phase-gate-expand.test.tsx`) | ⬜ pending |
| 12-02-* | 02 | 1 | LIFE-02 | — | Override gate visible only in sequential-locked + criteria fail | RTL component | `npm run test -- phase-gate-expand` | shared | ⬜ pending |
| 12-02-* | 02 | 1 | LIFE-02 | T-09-08 | Submit POST sends `Idempotency-Key` header, reuse on retry | RTL component | `npm run test -- phase-gate-expand` | shared | ⬜ pending |
| 12-03-* | 03 | 1 | LIFE-01 | — | Criteria editor PATCH round-trip persists | RTL component + integration | `npm run test -- criteria-editor-panel` | ❌ Wave 0 (`Frontend2/components/lifecycle/criteria-editor-panel.test.tsx`) | ⬜ pending |
| 12-03-* | 03 | 1 | LIFE-01 | — | `enable_phase_assignment` Toggle persists independently | RTL component | shared | ⬜ pending |
| 12-04-* | 04 | 2 | LIFE-03 | — | Zero-task phase MiniMetric renders `---` mono | RTL snapshot | `npm run test -- mini-metric` | ❌ Wave 0 | ⬜ pending |
| 12-04-* | 04 | 2 | LIFE-03 | — | Zero-task gate auto-criteria render "Uygulanamaz" + info AlertBanner | RTL component | `npm run test -- phase-gate-expand` (shared) | shared | ⬜ pending |
| 12-04-* | 04 | 2 | LIFE-04 | — | History Collapsible first expand triggers GET tasks?phase_id&status=done | RTL component | `npm run test -- history-subtab` | ❌ Wave 0 | ⬜ pending |
| 12-04-* | 04 | 2 | LIFE-04 | — | Re-open hits TanStack cache (no second network) | RTL component | shared | ⬜ pending |
| 12-05-* | 05 | 2 | LIFE-05 | — | Milestone CRUD optimistic insert + rollback on 4xx | RTL component | `npm run test -- milestones-subtab` | ❌ Wave 0 | ⬜ pending |
| 12-05-* | 05 | 2 | LIFE-05 | — | Timeline Gantt renders vertical flag lines + popover | RTL component | `npm run test -- timeline-tab` | ✓ existing Phase 11 (extend) | ⬜ pending |
| 12-06-* | 06 | 2 | LIFE-06 | — | Artifact inline expand + status SegmentedControl save | RTL component | `npm run test -- artifacts-subtab` | ❌ Wave 0 | ⬜ pending |
| 12-06-* | 06 | 2 | LIFE-06 | — | Single file per artifact (1-file constraint enforced) | RTL component | shared | ⬜ pending |
| 12-06-* | 06 | 2 | LIFE-07 | — | Evaluation Report auto-prefill from PhaseReport summary fields | RTL component | `npm run test -- evaluation-report-card` | ❌ Wave 0 | ⬜ pending |
| 12-06-* | 06 | 2 | LIFE-07 | — | PDF Blob download with filename pattern + 30 s rate-limit countdown | RTL component | shared | ⬜ pending |
| 12-07-* | 07 | 3 | infra | — | Editor page shell + ssr:false dynamic import + viewport ≥1024 fallback | RTL component | `npm run test -- workflow-editor-page` | ❌ Wave 0 | ⬜ pending |
| 12-08-* | 08 | 3 | EDIT-01 | — | Edge-type SegmentedControl writes type back to workflow | RTL component | `npm run test -- selection-panel phase-edge` | ❌ Wave 0 | ⬜ pending |
| 12-08-* | 08 | 3 | EDIT-01 | — | strokeDasharray per type (flow solid / verification 6 3 / feedback 8 4 2 4) | RTL snapshot | `npm run test -- phase-edge` | ❌ Wave 0 | ⬜ pending |
| 12-08-* | 08 | 3 | EDIT-02 | — | Group creation via 5 entry points (drag-rect, multi-select, drag-into, multi-select+button, right-click) | RTL component | `npm run test -- group-cloud-node` | ❌ Wave 0 | ⬜ pending |
| 12-08-* | 08 | 3 | EDIT-02 | — | Cloud-hull recompute on drag stays ≤16 ms / frame for 50 nodes | vitest bench | `npm run test -- cloud-hull.bench` | ❌ Wave 0 | ⬜ pending |
| 12-08-* | 08 | 3 | EDIT-02 | — | Drag-out-of-group drops parent association | RTL component | shared `group-cloud-node` | shared | ⬜ pending |
| 12-08-* | 08 | 3 | EDIT-04 | — | `computeNodeStates` correct for linear / disconnected / cyclic / parallel | unit (pure) | `npm run test -- graph-traversal` | ❌ Wave 0 (Plan 01 file) | ⬜ pending |
| 12-08-* | 08 | 3 | EDIT-04 | — | `computeNodeStates` 100-node bench < 50 ms | vitest bench | `npm run test -- graph-traversal.bench` | ❌ Wave 0 | ⬜ pending |
| 12-08-* | 08 | 3 | EDIT-05 | — | Parallel actives render rings simultaneously in flexible + sequential-flexible | RTL component | `npm run test -- workflow-canvas` | ❌ Wave 0 | ⬜ pending |
| 12-08-* | 08 | 3 | EDIT-06 | — | Cycle counter aggregation Map<nodeId,count> from activity feed | unit (pure) | `npm run test -- use-cycle-counters` | ❌ Wave 0 | ⬜ pending |
| 12-08-* | 08 | 3 | EDIT-06 | — | Badge visible only when count ≥ 2; tooltip TR | RTL component | `npm run test -- cycle-counter-badge` | ❌ Wave 0 | ⬜ pending |
| 12-09-* | 09 | 3 | EDIT-03 | — | sequential-flexible validator rule 5 (acyclic flow edges) | unit (pure) | `npm run test -- workflow-validators` | ❌ Wave 0 (Plan 01 file) | ⬜ pending |
| 12-09-* | 09 | 3 | LIFE-02 | — | Backend `is_all_gate=true` allows any non-archived source | pytest integration | `pytest Backend/tests/integration/test_execute_phase_transition.py::test_all_gate_allows_any_source` | ❌ Wave 0 | ⬜ pending |
| 12-09-* | 09 | 3 | LIFE-02 | — | Backend `bidirectional=true` allows reverse only between paired nodes | pytest integration | shared backend file | shared | ⬜ pending |
| 12-09-* | 09 | 3 | EDIT-03 | — | Backend sequential-flexible feedback edge transition allowed | pytest integration | `pytest Backend/tests/integration/test_execute_phase_transition.py::test_sequential_flexible_feedback` | shared backend file | ⬜ pending |
| 12-09-* | 09 | 3 | infra | — | Pre-existing edges read with default `bidirectional=false, is_all_gate=false` | pytest integration | `pytest Backend/tests/integration/test_workflow_edge_defaults.py` | ❌ Wave 0 | ⬜ pending |
| 12-09-* | 09 | 3 | infra | — | Seeder emits new edge fields explicitly | pytest integration | `pytest Backend/tests/integration/test_seeder.py::test_workflow_edges_have_v2_fields` | ❌ Wave 0 (extend) | ⬜ pending |
| 12-09-* | 09 | 3 | EDIT-* save | — | PATCH /projects/{id} workflow save with 200/422/409/429/network matrix | RTL component | `npm run test -- editor-save-flow` | ❌ Wave 0 | ⬜ pending |
| 12-10-* | 10 | 4 | EDIT-07 | — | Preset Şablon Yükle "Artırımlı/Evrimsel/RAD" replaces canvas after ConfirmDialog | RTL component | `npm run test -- editor-page` | ❌ Wave 0 | ⬜ pending |
| 12-10-* | 10 | 4 | LIFE-* / EDIT-* | — | Manual UAT click-through checklist (14 rows × pass/fail) | manual | `.planning/phases/12-.../12-UAT-CHECKLIST.md` | ❌ Wave 0 (manual artifact) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Plan 01 (shared infra) ships these test files as stubs/full suites so subsequent waves can red-green against them:

- [ ] `Frontend2/lib/lifecycle/graph-traversal.ts` + `graph-traversal.test.ts` + `graph-traversal.bench.ts` — pure BFS unit + perf bench (EDIT-04)
- [ ] `Frontend2/lib/lifecycle/workflow-validators.ts` + `workflow-validators.test.ts` — 5-rule validator (EDIT-03 rule 5)
- [ ] `Frontend2/lib/lifecycle/cloud-hull.ts` + `cloud-hull.test.ts` + `cloud-hull.bench.ts` — convex-hull-plus-padding baseline + perf bench (EDIT-02)
- [ ] `Frontend2/lib/lifecycle/align-helpers.ts` + `align-helpers.test.ts` — 5 align/distribute functions
- [ ] `Frontend2/lib/lifecycle/shortcuts.ts` — keyboard registry (no test required, integrated test in editor-page)
- [ ] `Frontend2/hooks/use-transition-authority.ts` + `use-transition-authority.test.tsx` — 3-role permission hook
- [ ] `Frontend2/hooks/use-cycle-counters.ts` + `use-cycle-counters.test.tsx` — activity-feed aggregation (EDIT-06)
- [ ] `Frontend2/hooks/use-led-teams.ts` — TanStack-cached led-teams query (5 min staleTime)
- [ ] `Frontend2/components/lifecycle/__tests__/setup.tsx` — shared RTL fixtures (project, user, workflow)
- [ ] Backend test fixtures: `Backend/tests/integration/conftest.py` (existing) + new factory for projects with v2-shape edges
- [ ] `Backend/tests/integration/test_execute_phase_transition.py` (extend) — all_gate + bidirectional + sequential-flexible feedback cases
- [ ] `Backend/tests/integration/test_workflow_edge_defaults.py` (NEW) — defaults applied on read for legacy-shape edges
- [ ] `Backend/tests/integration/test_seeder.py` (extend) — emits new fields explicitly

---

## Manual-Only Verifications

Per SPEC: manual UAT click-through is the verification artifact for end-to-end flows. Documented in `.planning/phases/12-.../12-UAT-CHECKLIST.md` (created in Plan 12-10).

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| LifecycleTab end-to-end render across SCRUM / WATERFALL / KANBAN methodologies | LIFE-01..07 | Visual fidelity to prototype is the contract; automated snapshots can't catch oklch token regressions | Open `/projects/{id}` for one project per methodology; verify summary strip + canvas + sub-tabs render per `12-UI-SPEC.md` lines 765–1050 |
| Workflow Editor full DnD interaction (drag, drop, group, ungroup, edge create) on real React Flow canvas | EDIT-01..07 | jsdom does not run a real layout engine; touch + drag events differ in real browsers | Open `/workflow-editor?projectId=X`; complete the 7 actions in `12-UAT-CHECKLIST.md` rows 8–14 |
| PDF download produces a non-empty file with correct filename + opens in OS PDF reader | LIFE-07 | Blob download is not testable in jsdom; depends on browser file save UI | Click "PDF" on a History card with a saved Evaluation Report; confirm `Phase-Report-{key}-{slug}-rev{N}.pdf` lands in Downloads + opens |
| Phase Gate transition shows toast + active node ring updates without page refresh | LIFE-02 | TanStack invalidation behavior across queries depends on real network timing | On a Waterfall project with all auto criteria satisfied, click "Sonraki Faza Geç" → confirm → verify summary-strip badge increments + new node ring lights up |
| Mobile/tablet viewport fallback (<1024 px) | EDIT-* | Resizing browser is the actual test; Playwright would over-engineer this for one assertion | Open editor page, resize browser to 768 px width → verify "Workflow editörü 1024px+ ekran gerektirir." fallback appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60 s (quick), < 180 s (full)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
