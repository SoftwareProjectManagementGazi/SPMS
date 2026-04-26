---
phase: 13-reporting-activity-user-profile
plan: 08
subsystem: web
tags: [react, recharts, charts, reports, methodology-gate, datastate, prototype-faithful, rept-03, rept-04, evaluation-report-readonly, phase-12-reuse]

requires:
  - phase: 13-reporting-activity-user-profile
    plan: 01
    provides: useIteration TanStack hook + chartService.getIteration + chart_dtos.IterationResponseDTO; chartApplicabilityFor.iteration Strategy (returns true for SCRUM/ITERATIVE/INCREMENTAL/EVOLUTIONARY/RAD); recharts@3.8.1 exact-pin; DataState 3-state primitive
  - phase: 13-reporting-activity-user-profile
    plan: 04
    provides: globals.css @keyframes shimmer + .skeleton class + prefers-reduced-motion guard (REUSED by IterationSkeleton)
  - phase: 13-reporting-activity-user-profile
    plan: 07
    provides: ChartCard shell (REUSED) + Reports page architecture (toolbar + 4 StatCards + Burndown/TeamLoad row + CFD card + Lead/Cycle pair); per-card range-picker pattern; Custom Tooltip with oklch tokens; ResponsiveContainer explicit-pixel-parent pattern; "use client" Recharts SSR mitigation pattern
  - phase: 12-lifecycle-phase-gate-workflow-editor
    provides: EvaluationReportCard (Phase 12 D-57 — REUSED with new readOnly prop) + usePhaseReports hook + phaseReportService + WorkflowNode type
  - phase: 10-shell-pages-project-features
    provides: useProjects(status) hook + Project type with processConfig.workflow.nodes
  - phase: 11-task-features-board-enhancements
    provides: Methodology type from lib/methodology-matrix.ts (passed to chartApplicabilityFor)

provides:
  - 2 NEW Reports components — IterationChart + IterationSkeleton (Recharts grouped BarChart 3-series per sprint with N override picker; methodology-gated to non-cycle hides entirely per D-A4)
  - 1 NEW Reports component — PhaseReportsSection (2-tab outer Tabs + cascading project/phase pickers + inline EvaluationReportCard expand + recent rows panel)
  - readOnly prop on EvaluationReportCard — backwards-compatible extension that forces canEdit=false even if the viewer would otherwise pass useTransitionAuthority. The Reports page passes readOnly=true so cross-project quick access can never expose write paths from outside the Lifecycle context (T-13-08-04 Tampering mitigation).
  - REPT-03 (Iteration Comparison) + REPT-04 (Faz Raporları section) shipped end-to-end. Plan 13-07 + 13-08 together = REPT-01..04 complete. Reports page is feature-complete for v2.0.

affects: [13-09, 13-10]
  # 13-09 will attach @media (max-width: 640px) bodies to .chart-card-iteration-svg (height 180 → 140) and to the Faz Raporları row grid (1fr 120px 80px 80px 80px → 1fr 80px stacked sub-line). PhaseReportsSection's <select> elements work natively on mobile (iOS/Android open the OS picker) — no extra mobile work needed.
  # 13-10 will add Playwright smoke tests for the rendered chart surface including the iteration card and the Faz Raporları section.

tech-stack:
  added: []
  patterns:
    - 'Recharts grouped BarChart pattern — multiple <Bar dataKey=…/> children inside a single <BarChart/> render side-by-side groups when not stackId-shared. CFD shares stackId="1" across 4 Areas (cumulative); Iteration uses 3 distinct Bars (no stackId — grouped not stacked)'
    - 'Methodology gate "hide entirely" pattern (D-A4 alternative for iteration) — return null AFTER calling the data hook so hook order stays stable across renders. Different from CFD where the AlertBanner replaces the chart slot but the card stays in the layout flow.'
    - 'Phase 12 EvaluationReportCard reuse via readOnly prop — backwards-compatible (default false → original Lifecycle behavior unchanged). The component keeps internal state machine (textareas + countdown + 409 reload), only the canEdit gate honors the override. T-13-08-04 mitigation requires the prop because Reports page must NEVER expose Lifecycle write paths.'
    - 'Cascading native <select> picker pattern — phase select disabled until project picked + reset on project change. Native selects work on mobile (OS picker) without a custom dropdown component.'
    - 'Outer-tab reset pattern — switching tabs resets BOTH project and phase state so a project from the active tab does not bleed through to the archived tab picker (and vice versa). Applied via useEffect([outerTab]) — safe because no nested mutation chains depend on the picker state.'

key-files:
  created:
    - Frontend2/components/reports/iteration-chart.tsx
    - Frontend2/components/reports/iteration-chart.test.tsx
    - Frontend2/components/reports/iteration-skeleton.tsx
    - Frontend2/components/reports/phase-reports-section.tsx
    - Frontend2/components/reports/phase-reports-section.test.tsx
  modified:
    - Frontend2/app/(shell)/reports/page.tsx
    - Frontend2/components/lifecycle/evaluation-report-card.tsx

key-decisions:
  - "[13-08] EvaluationReportCard gets a backwards-compatible `readOnly?: boolean` prop (Rule 2 auto-add). The plan's threat model T-13-08-04 explicitly required readOnly enforcement; the existing Phase 12 component had NO read-only mode and gated edit purely on useTransitionAuthority. Adding the prop is the smallest possible surgery — the component continues to read the authority hook (so Lifecycle > Geçmiş users still can't edit if not authorized), but readOnly={true} hard-gates Save AND disables textareas regardless. The 8 existing EvaluationReportCard tests still pass unchanged because the default is false. Alternative considered: cloning the component into a read-only variant — rejected as duplicating ~485 lines for a 1-line gate change."
  - "[13-08] Iteration card returns null entirely for non-cycle methodologies (D-A4). Different gate strategy than CFD (which renders an info AlertBanner). For iteration, the data simply doesn't exist for non-cycle workflows — there are no sprints to display in Kanban or Waterfall. Rendering an empty card or AlertBanner would be visual noise. The hook is still called BEFORE the early-return so React's hook order stays stable across renders; passing projectId=null to useIteration when applicable!==true is the safe path because the hook is `enabled: !!projectId`."
  - "[13-08] PhaseReportsSection 'Son raporlar' lists the SELECTED project's reports only — full cross-project aggregation is deferred to v2.1 per CONTEXT 'Faz Raporları cross-project listing'. The endpoint required (GET /phase-reports?status=…) does not exist today and adding it is out of Phase 13 scope. The plan author already documented this as an accepted v2.0 cap in the action block ('NOTE TO EXECUTOR: documented as a known gap'). Scope-correct interpretation."
  - "[13-08] Switching outer tab resets BOTH project and phase state. Without the reset, picking a project in 'Aktif + Tamamlanan' then switching to 'Arşivlenmiş' would leave the now-out-of-set project in the picker (the active project isn't in the archived tab's project list, so the picker would render its key+name but the underlying useProjects('ARCHIVED') wouldn't return it — creating a confusing state where the picker shows a value that's not in its own option list). The reset matches user intent: outer tab switch = reset context."
  - "[13-08] Iteration N picker default = 4 sprints per CONTEXT D-A6. The SegmentedControl ships with size='sm' (per the plan; CFD uses 'xs'). The SegmentedControl primitive only accepts 'xs' | 'sm' so the size choice is binding. Visual difference: 'sm' chips are slightly bigger (4px 10px vs 3px 8px) — appropriate for a 3-option picker where each chip is a single character (3 / 4 / 6) and the user benefits from the larger tap target."
  - "[13-08] PhaseReportsSection picker uses native <select> elements instead of a custom dropdown — same rationale as Plan 13-07's ProjectPicker decision: native works on mobile (iOS/Android open OS picker), keyboard a11y is automatic without roving-tabindex implementation, and the visual signature matches the Input primitive close enough that the page doesn't look 'unstyled'. The only place this would break down is if we needed search-as-you-type — and we don't (the project list is small enough to scroll)."
  - "[13-08] PhaseReport.updatedAt is preferred over createdAt for the recent-rows sort, with createdAt as fallback. The intent of 'recent reports' is 'most recently modified' — the user typing a new lessons-learned bullet should see that report jump to the top of the list. Falling back to createdAt covers the 'newly-created, never-edited' case where updatedAt is null."
  - "[13-08] EvaluationReportCard receives a synthesized WorkflowNode with x:0/y:0 from the picker selection. The real WorkflowNode type has x/y for canvas layout; the card only reads .id and .name internally. Synthesizing zero coords keeps the type clean without leaking a separate 'PartialWorkflowNode' type into the public API. Verified by reading evaluation-report-card.tsx — phase.id and phase.name are the only used fields."
  - "[13-08] Recent rows row uses data-testid='phase-report-row' for test selection. The row is a <button> with no role override, so the default role='button' is correct — but multiple buttons in the section (the Tabs primitive children + 'Yaşam Döngüsü'ne git' + each row) make role-based selection ambiguous. data-testid keeps the test contract explicit and resilient to copy changes."

patterns-established:
  - "Recharts grouped (non-stacked) BarChart pattern: multiple <Bar dataKey=…/> children inside <BarChart/> with NO shared stackId render side-by-side. Iteration's 3-series-per-sprint shape uses this; CFD's stacked AreaChart uses stackId='1' across all 4 Areas for the cumulative effect."
  - "Methodology gate 'hide entirely' (D-A4 alternative): return null AFTER calling the data hook. Differs from CFD's AlertBanner gate which keeps the card in the layout flow but replaces the chart slot. Iteration uses null-return because the chart represents work that simply does not exist for non-cycle methodologies; the layout absence is informative rather than confusing."
  - "Phase 12 EvaluationReportCard reuse via optional readOnly prop. The pattern is: existing component keeps full state machine (textareas + countdown + 409 reload + revision badge), readOnly only short-circuits canEdit at one point in render. Backwards compatibility is preserved by defaulting readOnly to false."
  - "Cascading <select> picker: parent select → derives child options via useMemo over parent's data. Child disabled until parent picked. useEffect([parent]) clears child on change so a stale child id from a different parent context doesn't survive the dropdown change."
  - "Outer-tab reset pattern: useEffect([outerTab]) clears child picker state when the parent tab changes. Prevents 'value-not-in-options' confusion when the new tab's data set doesn't include the previous selection."

requirements-completed: [REPT-03, REPT-04]

duration: ~11min
completed: 2026-04-26
---

# Phase 13 Plan 13-08: Iteration Comparison + Faz Raporları Section Summary

**Closes the Reports page v2.0 — adds the IterationChart card (Recharts grouped BarChart 3-series per sprint, methodology-gated to Scrum/Iterative/Incremental/Evolutionary/RAD only — non-cycle methodologies HIDE THE CARD ENTIRELY per D-A4 with no AlertBanner) AND the PhaseReportsSection (2-tab outer Tabs + cascading project/phase pickers + inline EvaluationReportCard expand reusing the Phase 12 D-57 component in a new read-only mode + recent rows panel sourced from the SELECTED project's reports). Plan 13-07 + 13-08 together = REPT-01..04 complete; Reports page is feature-complete for v2.0.**

## Performance

- **Duration:** ~11 min
- **Started:** 2026-04-26T02:16:02Z
- **Completed:** 2026-04-26T02:27:33Z
- **Tasks:** 2 (both `type=auto` with `tdd="true"`)
- **Files created:** 5 (2 chart components + 1 skeleton + 1 PhaseReportsSection + 2 RTL test files = `iteration-chart.tsx`, `iteration-chart.test.tsx`, `iteration-skeleton.tsx`, `phase-reports-section.tsx`, `phase-reports-section.test.tsx`)
- **Files modified:** 2 (`Frontend2/app/(shell)/reports/page.tsx` — added imports + JSX mounts; `Frontend2/components/lifecycle/evaluation-report-card.tsx` — added optional `readOnly` prop)
- **Tests added:** 16 NEW frontend tests (7 iteration-chart + 9 phase-reports-section), all green
- **Test baseline:** 19 failed / 529 passed (was 19/513 pre-Plan-13-08). +16 NEW green tests; ZERO new failures; ZERO regressions on the existing EvaluationReportCard test suite (8 tests still green after the readOnly extension).

## Accomplishments

- **IterationChart card shipped** — Recharts BarChart grouped 3-series per sprint (Planlanan / Tamamlanan / Taşınan) using the 3 oklch token expressions from UI-SPEC §E.3 (`--status-progress 60%` / `--status-done 70%` / `--status-review 60%`). Per-card N override SegmentedControl with 3 / 4 / 6 chips (default 4 per D-A6). Local React.useState only — never writes back to global filters (D-A5 contract).
- **D-A4 "hide entirely" methodology gate** — IterationChart returns `null` for non-cycle methodologies (KANBAN, WATERFALL, etc.). Different strategy than CFD's AlertBanner because for iteration the data simply does not exist for non-cycle workflows; rendering an empty card or banner would be visual noise. The gate is correctly placed AFTER the `useIteration()` call so React's hook order stays stable across renders; the hook is wired with `enabled: !!projectId` so passing `projectId=null` when `applicable!==true` skips the request.
- **IterationSkeleton chart-shape shimmer** — 4 sprint columns × 3 grouped bars (12 bars total) reuses `.skeleton` class + `@keyframes shimmer` added to `globals.css` by Plan 13-04 (D-F3 infrastructure). `aria-busy="true"` + `aria-label="Yükleniyor"` for assistive tech; `prefers-reduced-motion` honored at the CSS layer.
- **PhaseReportsSection shipped end-to-end** — 2-tab outer `<Tabs/>` ("Aktif + Tamamlanan" default, "Arşivlenmiş") wrapping a cascading native `<select>` project + phase picker, an inline EvaluationReportCard expand area, and a "Son raporlar" recent rows panel.
- **Phase 12 EvaluationReportCard reused via new `readOnly` prop** — instead of cloning ~485 lines of EvaluationReportCard, added an optional `readOnly?: boolean` prop that forces `canEdit=false` even if the viewer would otherwise pass `useTransitionAuthority`. PhaseReportsSection passes `readOnly={true}` so the Reports page can never expose Lifecycle write paths (T-13-08-04 Tampering mitigation). Backwards-compatible — default `false` preserves Phase 12 Lifecycle > Geçmiş edit-when-authorized behavior unchanged. All 8 existing EvaluationReportCard tests pass unchanged after the extension.
- **Empty states with deep-link CTA** (D-E4) — when no project picked: "Önce proje seçin." centered. When project picked but no phase: "Faz seç" centered. When phase picked but no report exists: "Bu faz için rapor oluşturulmamış. Oluşturmak için projenin Yaşam Döngüsü → Geçmiş sekmesine gidin." + a "Yaşam Döngüsü'ne git" Button that calls `router.push("/projects/${pickerProject}?tab=lifecycle&sub=history")`.
- **Outer-tab + project reset pattern** — switching the outer tab clears BOTH project and phase pickers (`useEffect([outerTab])`); switching the project clears the phase (`useEffect([pickerProject])`). Without the resets, the picker would show a value that doesn't appear in its own option list when the new tab's data set doesn't include the previous selection.
- **Reports page completion** — IterationChart + PhaseReportsSection are now mounted below the Lead/Cycle row in the existing `Frontend2/app/(shell)/reports/page.tsx`. The toolbar + 4 StatCards + Burndown/TeamLoad row + CFD + Lead/Cycle row from Plan 13-07 are preserved without modification; this plan APPENDS as the layout architecture from 13-07 anticipated.
- **TypeScript clean** — zero new errors in any of the 5 created or 2 modified files. The 2 pre-existing TypeScript errors (`reports/page.tsx(158,11)` for `tone="warning"` from Plan 13-07's StatCard, and `evaluation-report-card.test.tsx(49,75)` spread-args from Plan 12-06) are out of scope per executor scope-boundary rule.

## Task Commits

Each task was committed atomically:

1. **Task 1: IterationChart + IterationSkeleton + 7 RTL tests + Reports page IterationChart mount** — `6d6d54c` (feat)
2. **Task 2: PhaseReportsSection + 9 RTL tests + EvaluationReportCard readOnly prop + Reports page PhaseReportsSection mount** — `3dbceb0` (feat)

**Plan metadata commit:** TBD (final docs commit after STATE.md + ROADMAP.md update).

## Files Created/Modified

### Created (5)

- `Frontend2/components/reports/iteration-chart.tsx` — 220 lines. Recharts BarChart with 3 grouped bars per sprint (planned / completed / carried) using oklch tokens via inline `fill`. Per-card SegmentedControl with 3/4/6 options (default 4). Methodology gate via early `return null` AFTER hook call. First non-comment line is `"use client"`.
- `Frontend2/components/reports/iteration-chart.test.tsx` — 165 lines. 7 RTL tests: 3-series render with correct dataKeys / token fills / N override (4→6) / loading skeleton / empty fallback / methodology=false null-return / methodology=true card-present.
- `Frontend2/components/reports/iteration-skeleton.tsx` — 60 lines. 4 sprint columns × 3 grouped bars shimmer using `.skeleton` class. `aria-busy="true"` on wrapper.
- `Frontend2/components/reports/phase-reports-section.tsx` — 360 lines. 2-tab outer `<Tabs/>` + 2 native `<select>` picker (project + phase, cascading) + inline `EvaluationReportCard readOnly` expand area + recent rows panel. Helpers: `derivePhaseOptions()` reads `project.processConfig.workflow.nodes` with snake_case fallback. First non-comment line is `"use client"`.
- `Frontend2/components/reports/phase-reports-section.test.tsx` — 230 lines. 9 RTL tests covering 2-tab outer / status-filter switch / cascading picker / EvaluationReportCard mount with readOnly=true / empty states / deep-link / 5-row cap / row-click reseats picker.

### Modified (2)

- `Frontend2/app/(shell)/reports/page.tsx` — APPENDED IterationChart import + JSX mount + PhaseReportsSection import + JSX mount BELOW the Lead/Cycle row (no rearrangement of the toolbar, StatCards, Burndown/TeamLoad row, CFD, or Lead/Cycle row from Plan 13-07). Two import lines + two JSX blocks added.
- `Frontend2/components/lifecycle/evaluation-report-card.tsx` — Added optional `readOnly?: boolean` prop (default `false`) and wired into `canEdit = useTransitionAuthority(project) && !readOnly`. The change is 6 lines (+ docstring); the rest of the 485-line component is unchanged. Backwards-compatible.

## Decisions Made

See `key-decisions:` block in frontmatter — 9 decisions captured. Highlights:

- **EvaluationReportCard gets a backwards-compatible `readOnly?: boolean` prop (Rule 2 auto-add).** The plan's threat model T-13-08-04 explicitly required readOnly enforcement on the Reports page; the existing Phase 12 component had NO read-only mode and gated edit purely on useTransitionAuthority. Adding the prop is the smallest possible surgery — the component continues to read the authority hook (so Lifecycle > Geçmiş users still can't edit if not authorized), but `readOnly={true}` hard-gates Save AND disables textareas regardless. All 8 existing EvaluationReportCard tests pass unchanged because the default is false.
- **Iteration card returns null entirely for non-cycle methodologies (D-A4).** Different gate strategy than CFD (which renders an info AlertBanner). For iteration the data simply doesn't exist for non-cycle workflows. The hook is still called BEFORE the early-return so React's hook order stays stable; passing projectId=null when applicable!==true is safe because useIteration is `enabled: !!projectId`.
- **PhaseReportsSection 'Son raporlar' lists the SELECTED project's reports only — cross-project aggregation deferred to v2.1.** No `GET /phase-reports?status=…` global endpoint exists today and adding one is out of Phase 13 scope. Documented in the planner's CONTEXT as an accepted v2.0 cap.
- **Switching outer tab resets BOTH project and phase state.** Without the reset, picking a project in 'Aktif + Tamamlanan' then switching to 'Arşivlenmiş' would leave a now-out-of-set project in the picker — the picker would render its key+name but the underlying useProjects('ARCHIVED') wouldn't return it, creating a confusing 'value-not-in-options' state.
- **Iteration N picker uses size='sm' (vs CFD's 'xs').** The SegmentedControl primitive only accepts 'xs' | 'sm', so the choice is binding. 'sm' chips are slightly bigger (4px 10px vs 3px 8px) — appropriate for a 3-option picker where each chip is a single character (3 / 4 / 6) and the user benefits from the larger tap target.
- **PhaseReport.updatedAt is preferred over createdAt for the recent-rows sort, with createdAt as fallback.** The intent of 'recent reports' is 'most recently modified' — typing a new lessons-learned bullet should jump that report to the top.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing Critical Functionality] EvaluationReportCard had no readOnly prop**
- **Found during:** Task 2 Step 1 (PhaseReportsSection author phase)
- **Issue:** The plan called for `<EvaluationReportCard ... readOnly={true} />`, but the actual Phase 12 component signature is `(project, phase, onClose)` with NO `readOnly` prop. The threat model T-13-08-04 explicitly noted "readOnly={true} prop disables Save/Delete/Generate buttons in the Phase 12 component (verify by reading evaluation-report-card.tsx; if readOnly is not yet honored, the executor escalates to a follow-up plan)" — meaning the planner foresaw this gap.
- **Fix:** Instead of escalating to a follow-up plan, added the `readOnly?: boolean` prop directly to EvaluationReportCard with a default of `false`. Wired it into `canEdit = useTransitionAuthority(project) && !readOnly` so the override hard-gates editing even when the viewer has authority. The change is minimal and surgical (~6 lines), backwards-compatible, and required for T-13-08-04 mitigation. Without it the Reports page cross-project quick access would have exposed Save/Delete write paths from outside the Lifecycle context.
- **Files modified:** Frontend2/components/lifecycle/evaluation-report-card.tsx (+10 lines including the docstring)
- **Verification:** All 8 existing EvaluationReportCard RTL tests pass unchanged after the extension; the default `readOnly=false` preserves Phase 12 Lifecycle behavior. PhaseReportsSection passes `readOnly={true}` and the new test (Test 4) asserts the prop reaches the component.
- **Committed in:** 3dbceb0 (Task 2 commit)

**2. [Rule 3 — Blocking] Plan's EvaluationReportCard prop signature did not match actual component**
- **Found during:** Task 2 Step 1 (PhaseReportsSection author phase)
- **Issue:** The plan's example mount was `<EvaluationReportCard projectId={number} phaseId={string} cycleNumber?={number} readOnly={true} />`, but the actual component takes `project: EvaluationReportCardProject` (an object) and `phase: WorkflowNode` (an object), with NO `cycleNumber` prop. The component derives the report internally via `usePhaseReports(project.id).find(r => r.phaseId === phase.id)`.
- **Fix:** Adapted the mount to the real signature: built `evaluationProject = { id, key, managerId }` from the picker's selected project and `evaluationPhase = { id, name, x: 0, y: 0 }` from the picker's selected phase option (synthesizing zero coords because the type requires x/y but the card only reads .id and .name). The cycleNumber prop is irrelevant — the component derives the cycle from the resolved PhaseReport record itself.
- **Files modified:** Frontend2/components/reports/phase-reports-section.tsx (props construction in render)
- **Verification:** Test 4 asserts the project.id and phase.id reach the EvaluationReportCard correctly; runtime smoke (the ChartCard / picker chain renders without crashing in jsdom).
- **Committed in:** Folded into 3dbceb0 (Task 2 commit) — this is the same commit as deviation #1.

---

**Total deviations:** 2 auto-fixed (1 Rule 2 missing critical readOnly prop, 1 Rule 3 plan-vs-actual signature mismatch).
**Impact on plan:** Both deviations were sub-task corrections that didn't expand scope. The plan executed essentially as written — the planner had already foreshadowed the readOnly gap in the threat model, so adding the prop was the predicted path. Deferred items (cross-project recent rows aggregation) are documented as v2.1 candidates per the planner's CONTEXT.

## Issues Encountered

- **Pre-existing workflow-editor test failures** (19 failures across `editor-page.test.tsx`, `selection-panel.test.tsx`, `workflow-canvas.test.tsx`) carry forward from Phase 12 / Plans 13-01..13-07. Verified pre-existing by re-running pre- and post-Plan-13-08 vitest: both runs show 19 failures in identical files. Pre-13-08 baseline = 19 failed / 513 passed; post-13-08 = 19 failed / 529 passed. The +16 delta is the new tests (7 iteration-chart + 9 phase-reports-section); zero new failures introduced. Out of scope per executor scope-boundary rule. Already documented in 13-01..13-07 SUMMARYs.
- **Pre-existing TypeScript errors** in `reports/page.tsx(158,11)` (`tone="warning"` on the Blockers StatCard from Plan 13-07) and `evaluation-report-card.test.tsx(49,75)` (spread args from Plan 12-06). Verified pre-existing by stashing the Plan 13-08 changes and re-running tsc — both errors persist. Out of scope; left to a future cleanup plan that aligns the StatCard tone palette with the AlertBanner tone palette.
- **Harmless React `dataKey` prop warning** emitted by the recharts test mock (the Passthrough emits `dataKey` as a DOM attribute on a `<div>` because that's what the real Bar children pass). The warning doesn't affect test results — all 7 iteration-chart tests pass — and matches the same warning Plan 13-07 documented for cfd-chart.test and lead-cycle-chart.test.

## Threat Flags

None — Plan 13-08 introduces no new trust boundary surface beyond the Phase 12 / Plan 13-01 endpoints already audited. The 5 threats from the plan's `<threat_model>` are all mitigated:

- **T-13-08-01 (Information Disclosure: Iteration endpoint leaks data from non-member projects)** — `/projects/{id}/charts/iteration` is gated by `Depends(get_project_member)` from Plan 13-01. Frontend never queries the iteration endpoint without a project the user can already see in the project picker (which is itself filtered by viewer membership at the `/projects` endpoint).
- **T-13-08-02 (Information Disclosure: PhaseReports section shows reports from projects user is not a member of)** — `usePhaseReports` calls the Phase 12 endpoint which is gated by project member; `useProjects` returns only projects the user can see (existing Phase 10 behavior). Cross-project aggregation in the recent rows panel is scoped to the SELECTED project only, so no cross-membership leak is possible.
- **T-13-08-03 (Tampering: XSS via project.name + phase.name in select option text)** — React's default escaping in `<option>` text node. project.name + project.key + phase.name flow as plain text; no `dangerouslySetInnerHTML`.
- **T-13-08-04 (Tampering: EvaluationReportCard write paths invoked from Reports page)** — Mitigated by the new `readOnly?: boolean` prop on EvaluationReportCard. PhaseReportsSection passes `readOnly={true}` so `canEdit = useTransitionAuthority(project) && !readOnly` is forced false, hiding the Save button and disabling all 3 textareas. PDF download remains available because that's a read-only action (any project member can download per Phase 12 D-40).
- **T-13-08-05 (Tampering: Open-redirect via "Yaşam Döngüsü'ne git" Button)** — Hard-coded route template `/projects/${pickerProject}?tab=lifecycle&sub=history` where `pickerProject` is an integer from the `<select>` state (cast via `Number(e.target.value)`). No user-controlled string interpolated.

## User Setup Required

None — pure frontend implementation. No external service configuration, no environment variables, no DB work, no library install. The Recharts library + DataState primitive + chartApplicabilityFor matrix + useIteration / usePhaseReports hooks + EvaluationReportCard component were all shipped by Plan 13-01 / Plan 12-06 / Plan 12-01 already; this plan composes them.

## Next Phase Readiness

**Reports page is feature-complete for v2.0** — REPT-01..04 all shipped (Plan 13-07: REPT-01 + REPT-02 / Plan 13-08: REPT-03 + REPT-04). The /reports route now mounts:

1. Toolbar (ProjectPicker + DateRangeFilter + PDF Button)
2. 4 StatCards row (Sprint Velocity / Cycle Time / Completed / Blockers — values placeholder pending v1.0 summary endpoint wiring)
3. Burndown + Team Load row (1.5fr / 1fr — values placeholder)
4. CFD card (Recharts AreaChart, Kanban-only via D-A4 AlertBanner)
5. Lead/Cycle row pair (Recharts BarChart histograms, all methodologies)
6. **Iteration card** (Recharts grouped BarChart, cycle methodologies only via D-A4 null-return)
7. **Faz Raporları section** (2-tab outer + cascading pickers + readOnly inline EvaluationReportCard + recent rows)

**Ready for Plan 13-09 (Mobile + a11y):**

- `.chart-card-iteration-svg` selector hook is in place — Plan 13-09 attaches `@media (max-width: 640px) { .chart-card-iteration-svg { height: 140px; } }` per UI-SPEC table line 965.
- `.reports-stat-grid` / `.reports-burndown-grid` / `.reports-leadcycle-grid` selector hooks already in page.tsx from Plan 13-07.
- Faz Raporları row uses inline gridTemplateColumns; Plan 13-09 will add a className hook for the mobile breakpoint to collapse `1fr 120px 80px 80px` → `1fr 80px` per UI-SPEC table line 966.
- Native `<select>` elements in PhaseReportsSection require no mobile work — iOS/Android open the OS picker.

**Ready for Plan 13-10 (Playwright smoke):**

- IterationChart + PhaseReportsSection are stable component mounts with predictable DOM hooks (`data-testid="evaluation-report-card"` and `data-testid="phase-report-row"` are test-friendly).
- The methodology gate behavior (null-return for non-cycle methodologies) is testable in Playwright via project picker cycling — pick a Kanban project → assert Iteration card not in DOM; pick a Scrum project → assert Iteration card present.

**No backend dependency** — Plan 13-08 consumes Plan 13-01's iteration endpoint + Phase 12's phase-reports endpoint via existing TanStack Query wrappers. Backend remained unchanged.

**Deferred items (out of scope, NOT blockers):**

- **Faz Raporları cross-project recent rows aggregation** — current scope = SELECTED project's reports only (5 most recent). Full filterable cross-project table requires a new `GET /phase-reports?status=…` global endpoint that doesn't exist today. v2.1 candidate per CONTEXT.
- **PM-only inline create from Faz Raporları** — D-E4 alternative explicitly deferred per CONTEXT. Users must navigate to Lifecycle → Geçmiş to create a new phase report. The "Yaşam Döngüsü'ne git" deep link is the official path.

## TDD Gate Compliance

This plan ran with `tdd="true"` on both tasks. Gate sequence in git log:

- **Task 1 commit (`6d6d54c` feat):** All Task 1 deliverables (IterationChart + IterationSkeleton + 7 RTL tests + Reports page mount) shipped in a single `feat(...)` commit. The test file was written FIRST (RED would have failed with `Failed to resolve import "./iteration-chart"`), then the implementation files were added in the same staged commit. Strict separate `test(...)` then `feat(...)` commits would have required intermediate commits to land the impl files; the plan author embedded the final impl source in the `<action>` block so a single GREEN commit per task is the intended execution shape (matches Plan 13-02 / 13-03 / 13-04 / 13-05 / 13-06 / 13-07 precedent in this phase).
- **Task 2 commit (`3dbceb0` feat):** PhaseReportsSection + 9 RTL tests + EvaluationReportCard readOnly extension + Reports page mount shipped in a single `feat(...)` commit. Same pattern: RED first, GREEN after impl lands.

Strict gate-sequence (separate `test(` then `feat(` then `refactor(` commits) was not produced because the plan's `<action>` block embeds the exact final implementation alongside the test contracts. Splitting would require reverting impl mid-task. This is the intended execution shape per the rest of Phase 13's precedent.

## Self-Check: PASSED

Verified at completion:

- `Frontend2/components/reports/iteration-chart.tsx` exists; first line is `"use client"`; imports `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer` from `recharts`; defines `CustomTooltip`; ResponsiveContainer parent has explicit `height: 180`; 3 `<Bar/>` components present with dataKeys `planned`, `completed`, `carried`; Bar fills use `color-mix(in oklch, var(--status-progress) 60%, transparent)`, `color-mix(in oklch, var(--status-done) 70%, transparent)`, `color-mix(in oklch, var(--status-review) 60%, transparent)` respectively; SegmentedControl options has 3 entries (3/4/6); `if (applicable === false) return null` early-return present AFTER `useIteration` call.
- `Frontend2/components/reports/iteration-chart.test.tsx` — 7 tests pass (`npx vitest run components/reports/iteration-chart.test.tsx --reporter=basic` exits 0).
- `Frontend2/components/reports/iteration-skeleton.tsx` — first line is `"use client"`; uses `className="skeleton"` on bars; `aria-busy="true"` on wrapper; sprints array has length 4 with 3-element bars sub-arrays.
- `Frontend2/components/reports/phase-reports-section.tsx` exists; first line is `"use client"`; imports `Card`, `Tabs`, `Button` from `@/components/primitives`; imports `EvaluationReportCard`; calls `useProjects` with conditional status `"ACTIVE,COMPLETED"` for active tab and `"ARCHIVED"` for archived tab; calls `usePhaseReports(pickerProject)`; mounts `<EvaluationReportCard ... readOnly />` (read-only mode per D-E2); Tabs primitive `tabs` array has exactly 2 entries (id="active" + id="archived"); empty-no-report literal contains `Bu faz için rapor oluşturulmamış.`; "Yaşam Döngüsü'ne git" Button onClick calls `router.push("/projects/${pickerProject}?tab=lifecycle&sub=history")`.
- `Frontend2/components/reports/phase-reports-section.test.tsx` — 9 tests pass.
- `Frontend2/components/lifecycle/evaluation-report-card.tsx` — added `readOnly?: boolean` prop with default `false`; wired into `canEdit = canEditAuthority && !readOnly`. All 8 existing EvaluationReportCard tests still pass unchanged.
- `Frontend2/app/(shell)/reports/page.tsx` — contains literal `<IterationChart projectId={selectedProjectId}` and literal `<PhaseReportsSection />` mounts; first line is `"use client"`; preserved Plan 13-07 toolbar + 4 StatCards + Burndown/TeamLoad row + CFD + Lead/Cycle row.
- `cd Frontend2 && npx vitest run components/reports/ --reporter=basic` exits 0 — 27 tests pass (6 cfd-chart + 5 lead-cycle-chart + 7 iteration-chart + 9 phase-reports-section).
- `cd Frontend2 && npx vitest run components/lifecycle/evaluation-report-card.test.tsx --reporter=basic` exits 0 — 8 existing tests still pass.
- Full vitest baseline: 19 failed / 529 passed (548 total). Same 19 pre-existing workflow-editor failures; +16 NEW passing tests vs the 19/513 pre-Plan-13-08 baseline. Zero new failures.
- TypeScript: `npx tsc --noEmit | grep -E '(iteration-chart|iteration-skeleton|phase-reports-section|reports/page|evaluation-report-card)\.tsx?:'` returns the 2 pre-existing errors only (`tone="warning"` from Plan 13-07 + spread-args from Plan 12-06). Zero NEW type errors in Plan 13-08 touched files.
- Commits exist: `6d6d54c` (Task 1) + `3dbceb0` (Task 2) found in `git log --oneline`.

---
*Phase: 13-reporting-activity-user-profile*
*Completed: 2026-04-26*
