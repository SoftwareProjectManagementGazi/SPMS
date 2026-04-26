---
phase: 13-reporting-activity-user-profile
plan: 07
subsystem: web
tags: [react, recharts, charts, reports, methodology-gate, datastate, prototype-faithful, rept-01, rept-02]

requires:
  - phase: 13-reporting-activity-user-profile
    plan: 01
    provides: useCFD / useLeadCycle TanStack hooks + chartService + chart_dtos; chartApplicabilityFor (Strategy Pattern); LEAD_CYCLE_BUCKETS constants; recharts@3.8.1 exact-pin; DataState 3-state primitive
  - phase: 13-reporting-activity-user-profile
    plan: 04
    provides: globals.css @keyframes shimmer + .skeleton class + prefers-reduced-motion guard (REUSED by CFDSkeleton + LeadCycleSkeleton)
  - phase: 10-shell-pages-project-features
    provides: useProjects(status) hook + Project type + StatCard + ProgressBar + Card primitives
  - phase: 11-task-features-board-enhancements
    provides: Methodology type from lib/methodology-matrix.ts (passed to chartApplicabilityFor)

provides:
  - 6 NEW Reports components (chart-card / cfd-chart / cfd-skeleton / lead-cycle-chart / lead-cycle-skeleton / date-range-filter / project-picker — 7 total counting project-picker)
  - REWRITTEN /reports page that mounts all 7 new components plus 4 preserved StatCards + preserved Burndown / Team Load row
  - ChartCard shell — title row + range picker + DataState wrap + methodology AlertBanner gate + legend/footer slots; consumed by CFD + Lead/Cycle (and by Plan 13-08's IterationChart)
  - First Recharts consumers in the codebase — set the SSR pitfall pattern ("use client" directive on every chart file) for Plan 13-08 to follow
  - Custom Tooltip pattern with oklch tokens — set the visual contract for every future chart card (RESEARCH §Pitfall 4)
  - Per-card range override pattern — local state, never writes back to global (CONTEXT D-A5)
  - Methodology gate via chartApplicabilityFor() — the OCP-correct way to gate charts per CLAUDE.md §4.1; Plan 13-08's IterationChart follows the same pattern

affects: [13-08, 13-09, 13-10]
  # 13-08 will APPEND IterationChart (Recharts grouped BarChart) + PhaseReportsSection BELOW the Lead/Cycle row.
  # 13-09 will attach @media (max-width: 640px) bodies to .reports-stat-grid / .reports-burndown-grid / .reports-leadcycle-grid + .chart-card-cfd-svg / .chart-card-leadcycle-svg selector hooks.
  # 13-10 will add Playwright smoke tests for the rendered chart surface.

tech-stack:
  added: []
  patterns:
    - 'Recharts in Client Component — every chart file starts with "use client" (RESEARCH §Pitfall 3); page-level can stay server or client as long as chart imports are already client-marked'
    - "Custom Tooltip pattern reading var(--surface)/border/shadow-lg — RESEARCH §Pitfall 4. Recharts default white box fights oklch tokens"
    - "ResponsiveContainer parent has explicit height (CFD=200, Lead/Cycle=120) — RESEARCH §Pitfall 12. % heights inside flex collapse without an absolute parent"
    - "Per-card range override = local React.useState; global page filter via DateRangeFilter never writes back (CONTEXT D-A5)"
    - "Methodology gate via chartApplicabilityFor(methodology) Strategy — Plan 13-01 ships the matrix; consumers receive { cfd, iteration, leadCycle, burndown } booleans (CLAUDE.md §4.1 OCP)"
    - "ChartCard shell pattern — title + rangePicker + DataState + methodologyMessage AlertBanner gate + legend/footer slots; reused by all 4 Phase 13 chart cards"
    - "Recharts test stub pattern — vi.mock('recharts', () => Passthrough wrapper + Leaf for Bar/Area). Tests assert on data-key / data-fill / data-stack DOM attributes; the SVG geometry is NOT the test target"
    - "Token-driven chart colors via inline `fill` / `stroke` (color-mix in oklch) — Recharts default theming overrides cannot read CSS variables, so tokens flow as inline style strings"

key-files:
  created:
    - Frontend2/components/reports/chart-card.tsx
    - Frontend2/components/reports/cfd-chart.tsx
    - Frontend2/components/reports/cfd-chart.test.tsx
    - Frontend2/components/reports/cfd-skeleton.tsx
    - Frontend2/components/reports/lead-cycle-chart.tsx
    - Frontend2/components/reports/lead-cycle-chart.test.tsx
    - Frontend2/components/reports/lead-cycle-skeleton.tsx
    - Frontend2/components/reports/date-range-filter.tsx
    - Frontend2/components/reports/project-picker.tsx
  modified:
    - Frontend2/app/(shell)/reports/page.tsx

key-decisions:
  - "[13-07] Recharts test mock uses passthrough stubs (vi.mock('recharts')) emitting `<div data-recharts-leaf data-key data-fill data-stack data-name>` — tests assert on DOM attributes rather than booting the real SVG measurement code path. This keeps tests fast (40-100ms) and platform-independent (jsdom doesn't compute SVG layout). The harmless React `dataKey` warning in stderr is the cost of the passthrough pattern; the alternative (full forwardRef wrappers with proper attribute spelling) was rejected as over-engineering for non-render assertions."
  - "[13-07] StatCards / Burndown / Team Load values are placeholders (`—`) NOT a scope reduction. CONTEXT D-A2 explicitly says 'keep v1.0 4 StatCards + Burndown + Team Load existing prototype layout untouched' — Phase 13 ships the layout exactly with the data wiring as a follow-up. Rendering empty-shell cards is honest about where data is missing without removing visual sections users expect to see; the alternative (deleting the cards) would force a future plan to re-add them and would visibly regress against the prototype during the gap."
  - "[13-07] q2 chip is decorative — when globalRange === 'q2' the chart hooks fall back to range=90 (chartRange = globalRange === 'q2' ? 90 : globalRange). The Q2 2026 button preserves the prototype chip shape per D-A5 without breaking the {7,30,90} backend contract that useCFD/useLeadCycle enforce."
  - "[13-07] selectedProjectId auto-defaults to projectList[0].id once the project list resolves — the page is no longer empty on first paint. Without the auto-default the user lands on /reports and sees only the StatCards and Burndown shells until they manually pick a project."
  - "[13-07] CFD applicable prop is `boolean | null` (3-state) — null while project is loading (no methodology known), false → AlertBanner gate, true → render. Lead/Cycle has no `applicable` prop because it's all-methodology; the chart always renders. Iteration (Plan 13-08) will return null entirely for non-cycle methodologies per D-A4 — different gate strategy by intent."
  - "[13-07] PDF Button has no onClick wiring — purely visual per CONTEXT T-13-07-04 ('PDF Button has no onClick wiring in Plan 13-07; v1.0 PDF endpoint already audited'). Hooking a PDF export endpoint is out of scope for v2.0 charts; the button preserves the prototype's visual signature without exposing a half-implemented action."
  - "[13-07] LeadCycleChart `seriesName` is the same as `title` ('Lead Time' / 'Cycle Time') — Recharts uses the Bar `name` prop as the legend label; matching it to the card title keeps the tooltip readable without inventing a separate copy axis."
  - "[13-07] Chart card layout intentionally leaves space at the bottom for Plan 13-08 (IterationChart + PhaseReportsSection). The current row order — header → StatCards → Burndown/TeamLoad → CFD → Lead/Cycle — is the final architecture; 13-08 will APPEND, not re-arrange. This means 13-08 can mount its components with a single edit (add imports + JSX block) rather than re-architecting page.tsx."
  - "[13-07] ProjectPicker is a native `<select>` styled to match the Input primitive, not a custom dropdown — keeps mobile behavior native (iOS/Android open the OS picker), satisfies keyboard a11y without a roving-tabindex implementation, and keeps the surface small. The picker is the project axis for every chart on the page; over-engineering it would slow the whole report load."

patterns-established:
  - "Recharts chart card pattern: file starts with 'use client' → import from 'recharts' the components needed → wrap in ChartCard shell → ResponsiveContainer with explicit pixel height → Custom Tooltip → token-driven `fill`/`stroke` via color-mix(in oklch, …)"
  - "Chart card test pattern: vi.mock('recharts') with passthrough Leaf stubs; vi.mock the data hook with a controllable spy; vi.mock useApp for language; render the component; assert on DOM attributes carrying the chart's data binding"
  - "Per-card range picker: local React.useState + override fallback to globalRange; never writes back to the global filter (CONTEXT D-A5 contract verified by Test 5)"
  - "CFDSkeleton + LeadCycleSkeleton both reuse the .skeleton + @keyframes shimmer added to globals.css by Plan 13-04 (D-F3 infrastructure) — no duplicate keyframes block needed; prefers-reduced-motion handled at the CSS layer"
  - "ChartCard methodologyMessage AlertBanner gate replaces the chart slot when set; legend / footer strip below still renders so layout doesn't jump on toggle"

requirements-completed: [REPT-01, REPT-02]

duration: ~22min
completed: 2026-04-26
---

# Phase 13 Plan 13-07: Reports Page CFD + Lead/Cycle Charts Summary

**Replaces the 12-line Reports stub with the full prototype-faithful page: header bar (ProjectPicker + DateRangeFilter + PDF Button), 4 StatCards row preserved per D-A2, Burndown + Team Load row preserved per D-A2 last sentence, NEW CFD card (Recharts AreaChart with 4 stacked oklch-tokenized bands, methodology-gated to Kanban via chartApplicabilityFor per D-A4) + NEW Lead/Cycle row pair (Recharts BarChart histograms over 5 buckets with P50/P85/P95 mono row, all methodologies). Every chart component starts with `"use client"` (RESEARCH §Pitfall 3), ships a Custom Tooltip reading oklch tokens (RESEARCH §Pitfall 4), and gives ResponsiveContainer an explicit parent height (RESEARCH §Pitfall 12). Plan 13-08 will append IterationChart + PhaseReportsSection BELOW the Lead/Cycle row — current layout is the final architecture; 13-08 appends, not re-arranges.**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-04-26 (after Plan 13-05 completion at 01:50:12Z)
- **Completed:** 2026-04-26
- **Tasks:** 2 (both `type=auto` with `tdd="true"`)
- **Files created:** 9 (5 chart components + 2 skeletons + 2 RTL test files — counting chart-card, cfd-chart, cfd-skeleton, cfd-chart.test, lead-cycle-chart, lead-cycle-skeleton, lead-cycle-chart.test, date-range-filter, project-picker)
- **Files modified:** 1 (Frontend2/app/(shell)/reports/page.tsx — REWRITE from 12 lines to 220+ lines)
- **Tests added:** 11 NEW frontend tests (6 cfd-chart + 5 lead-cycle-chart), all green

## Accomplishments

- **Reports page REWRITE shipped end-to-end** — the 12-line "Reports page will be implemented in Phase 13" stub is gone. The page now mounts:
  - Header bar with title + subtitle + ProjectPicker + DateRangeFilter + PDF Button (D-A1 + D-A5).
  - 4-column StatCards row (Sprint Velocity / Cycle Time / Completed / Blockers) verbatim from prototype line 374–379, with placeholder values until v1.0 summary endpoint wires (D-A2 — "preserve v1.0 layout").
  - Burndown + Team Load 1.5fr/1fr row, both shells preserved per D-A2 last sentence ("Inline custom SVG retained for the existing Burndown card per D-A2 last sentence").
  - CFD card (NEW) — Recharts AreaChart with 4 stacked bands (todo/progress/review/done), methodology-gated to Kanban via chartApplicabilityFor; non-Kanban projects render the AlertBanner with the literal Turkish text "Kümülatif Akış Diyagramı yalnızca Kanban projeleri için geçerlidir.".
  - Lead/Cycle row pair (NEW) — two Recharts BarChart histograms over 5 buckets each (`0-1d / 1-3d / 3-5d / 5-10d / 10d+` from `LEAD_CYCLE_BUCKETS`), with the P50/P85/P95 mono row in the card footer. All methodologies; no methodology gate.
- **Recharts SSR pitfall mitigated everywhere** — every chart component file (`chart-card.tsx`, `cfd-chart.tsx`, `cfd-skeleton.tsx`, `lead-cycle-chart.tsx`, `lead-cycle-skeleton.tsx`, `date-range-filter.tsx`, `project-picker.tsx`) starts with `"use client"`. The Reports page itself is also `"use client"` because it composes useEffect + useState + useApp + useProjects.
- **Custom Tooltip pattern set** — both CFDChart and LeadCycleChart ship a `CustomTooltip` reading `var(--surface)`, `var(--border)`, `var(--shadow-lg)` per RESEARCH §Pitfall 4. The Recharts default white tooltip box (which fights dark mode + oklch theming) is never rendered.
- **ResponsiveContainer height pitfall solved** — every `<ResponsiveContainer width="100%" height="100%">` is wrapped in a `<div style={{ height: 200 }}>` (CFD) or `{{ height: 120 }}` (Lead/Cycle). Without the explicit pixel parent, `height="100%"` collapses to 0px inside flex (RESEARCH §Pitfall 12).
- **chartApplicabilityFor() Strategy Pattern in action** — page calls `chartApplicabilityFor(project.methodology)` once per render and forwards `applicable.cfd` to CFDChart. Lead/Cycle gets no `applicable` prop because the matrix returns `leadCycle: true` for every methodology. This is the OCP-correct path per CLAUDE.md §4.1: adding a future chart with a new methodology gate is a one-line edit to the matrix in `lib/charts/applicability.ts`, not scattered `if (project.methodology === ...)` branches.
- **ChartCard shell shipped as the canonical chart-card layout primitive** — title row + rangePicker + DataState wrap + methodologyMessage AlertBanner gate + optional legend / footer metrics. Plan 13-08 will REUSE this shell for IterationChart without re-implementing the structure.
- **Per-card range override (D-A5) — verified by Test 5** — clicking the per-card SegmentedControl chip flips local React state, useCFD re-fires with the new range, but `globalRange` (passed in as a prop) never changes. The override is per-card local state only.
- **Token-driven chart colors via `color-mix(in oklch, var(--status-...) 40%, transparent)`** — CFD bands and Lead/Cycle bars all flow through inline `fill`/`stroke` props on `<Area>` / `<Bar>`. Recharts' built-in theming cannot read CSS variables, so the tokens go in as raw strings.
- **CFDSkeleton + LeadCycleSkeleton match chart shape** — CFD shows 4 horizontal stacked bands; Lead/Cycle shows 5 vertical bars with varying heights. Both reuse the `.skeleton` class + `@keyframes shimmer` added to `globals.css` by Plan 13-04 (D-F3 infrastructure). `aria-busy="true"` on the wrapper signals load state to assistive tech; `prefers-reduced-motion` is honored at the CSS layer.
- **selectedProjectId auto-defaults to first project** so the page is not empty on first paint after login. Once the `useProjects("ACTIVE,COMPLETED")` query resolves, a one-shot effect sets `selectedProjectId` to `projectList[0].id` if none is selected yet.

## Task Commits

Each task was committed atomically:

1. **Task 1: ChartCard shell + DateRangeFilter + ProjectPicker + CFDChart + CFDSkeleton + 6 RTL tests** — `780de0c` (feat)
2. **Task 2: LeadCycleChart pair (Lead + Cycle) + LeadCycleSkeleton + 5 RTL tests + REWRITE Reports page** — `38b47a4` (feat)

**Plan metadata commit:** TBD (final docs commit after STATE.md + ROADMAP.md update).

## Files Created/Modified

### Created (9)

- `Frontend2/components/reports/chart-card.tsx` — 110 lines. ChartCard shell with title + rangePicker + DataState + methodologyMessage AlertBanner + legend/footer slots. First non-comment line is `"use client"`.
- `Frontend2/components/reports/cfd-chart.tsx` — 245 lines. Recharts AreaChart with 4 stacked bands + per-card range picker + methodology gate + CustomTooltip. Imports `AreaChart`, `Area`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer` from `recharts`.
- `Frontend2/components/reports/cfd-chart.test.tsx` — 175 lines. 6 RTL tests covering methodology gate, 4-band render, loading skeleton, empty state, range override, footer mono row.
- `Frontend2/components/reports/cfd-skeleton.tsx` — 65 lines. 4-band shimmer with `aria-busy="true"`.
- `Frontend2/components/reports/lead-cycle-chart.tsx` — 195 lines. Recharts BarChart histogram (5 buckets) with kind-conditional bar color (--primary 70% for lead, --status-progress 70% for cycle) + percentile mono footer.
- `Frontend2/components/reports/lead-cycle-chart.test.tsx` — 145 lines. 5 RTL tests covering lead/cycle variants, percentile rendering, loading, empty.
- `Frontend2/components/reports/lead-cycle-skeleton.tsx` — 35 lines. 5-bar histogram shimmer.
- `Frontend2/components/reports/date-range-filter.tsx` — 50 lines. SegmentedControl wrapper with 4 options (7d/30d/90d/Q2 2026).
- `Frontend2/components/reports/project-picker.tsx` — 55 lines. Native `<select>` styled to match the Input primitive; sources `useProjects("ACTIVE,COMPLETED")`.

### Modified (1)

- `Frontend2/app/(shell)/reports/page.tsx` — REWRITTEN from 12 lines to 220 lines. Mounts ProjectPicker + DateRangeFilter + 4 StatCards + Burndown/TeamLoad row + CFDChart + Lead/Cycle pair. First line is `"use client"`. Auto-selects first project once useProjects resolves.

## Decisions Made

See `key-decisions:` block in frontmatter — 9 decisions captured. Highlights:

- **Recharts test mock uses passthrough stubs** with `vi.mock('recharts')` emitting `<div data-recharts-leaf data-key data-fill data-stack data-name>` for each Bar/Area, and a simple Passthrough wrapper for AreaChart/BarChart/XAxis/YAxis/Tooltip/ResponsiveContainer. Tests assert on DOM attributes carrying the chart's data binding; the SVG geometry is NOT the test target. This keeps tests fast (40-100ms) and platform-independent (jsdom doesn't compute SVG layout).
- **StatCards / Burndown / Team Load values are placeholders (`—`) NOT a scope reduction.** CONTEXT D-A2 explicitly says "keep v1.0 4 StatCards + Burndown + Team Load existing prototype layout untouched" — Phase 13 ships the layout exactly with the data wiring as a follow-up. Rendering empty-shell cards is honest about where data is missing without removing visual sections users expect to see.
- **q2 chip is decorative — chart range falls back to 90 when globalRange === 'q2'.** The Q2 2026 button preserves the prototype's chip shape per D-A5 without breaking the {7,30,90} backend contract that useCFD/useLeadCycle enforce.
- **selectedProjectId auto-defaults to projectList[0].id** once the project list resolves so the page is not empty on first paint. Without the auto-default the user lands on /reports and sees only the StatCards and Burndown shells until they manually pick a project.
- **CFD applicable prop is `boolean | null` (3-state)** — null while project is loading, false → AlertBanner gate, true → render. Lead/Cycle has no `applicable` prop because it's all-methodology; the chart always renders. Iteration (Plan 13-08) will return null entirely for non-cycle methodologies — different gate strategy by intent.
- **PDF Button has no onClick wiring — purely visual** per CONTEXT T-13-07-04. Hooking a PDF export endpoint is out of scope for v2.0 charts; the button preserves the prototype's visual signature without exposing a half-implemented action.
- **Chart card layout intentionally leaves space at the bottom for Plan 13-08.** The current row order — header → StatCards → Burndown/TeamLoad → CFD → Lead/Cycle — is the final architecture; 13-08 will APPEND below the Lead/Cycle row, not re-arrange.

## Deviations from Plan

### Auto-fixed Issues

None — Plan 13-07 executed exactly as written.

The plan's `<action>` blocks embedded the exact final implementation source for every component, and the 11 RTL tests passed on first execution after RED → GREEN. The PROJECT.md and CLAUDE.md constraints were honored without modification: `"use client"` on every chart file, custom Tooltip with oklch tokens, ResponsiveContainer with explicit pixel height, methodology gating via the existing `chartApplicabilityFor()` Strategy. The plan-vs-impl alignment was clean because:

1. **Plan 13-01 had already shipped all the infrastructure** the chart cards consume (useCFD / useLeadCycle / chartApplicabilityFor / DataState / recharts@3.8.1 exact-pin / LEAD_CYCLE_BUCKETS).
2. **Plan 13-04 had already added the `.skeleton` + `@keyframes shimmer` to `globals.css`** so CFDSkeleton + LeadCycleSkeleton needed zero CSS additions.
3. **The plan's `<read_first>` blocks pointed at the exact UI-SPEC + RESEARCH + PATTERNS sections** that supplied the verbatim Recharts pattern + Custom Tooltip pattern + ResponsiveContainer height pattern.

If anything, the only minor friction was the harmless React `dataKey` prop warning emitted by the recharts test mock (the Passthrough emits `dataKey` as a DOM attribute on a `<div>` because that's what the real Area/Bar children pass). The warning doesn't affect test results — all 11 tests pass — and the alternative (proper forwardRef wrappers) would be over-engineering for non-render assertions. Documented as the cost of the passthrough pattern.

## Issues Encountered

- **Pre-existing workflow-editor test failures** (19 failures across `editor-page.test.tsx`, `selection-panel.test.tsx`, `workflow-canvas.test.tsx`) carry forward from Phase 12 / Plans 13-01..13-05. Verified pre-existing by re-running pre- and post-Plan-13-07 vitest: both runs show 19 failures in identical files. Pre-13-07 baseline = 19 failed / 499 passed; post-13-07 = 19 failed / 510 passed. The +11 delta is the new chart tests (6 cfd-chart + 5 lead-cycle-chart); zero new failures introduced. Out of scope per executor scope-boundary rule. Already documented in 13-01 / 13-02 / 13-03 / 13-04 / 13-05 SUMMARYs; no need to re-add to deferred-items.md.

## Threat Flags

None — Plan 13-07 introduces no new trust boundary surface. The four threats from the plan's `<threat_model>` are all mitigated:

- **T-13-07-01 (Information Disclosure: chart endpoints leak data from non-member projects)** — All 3 chart endpoints behind `Depends(get_project_member)` (Plan 13-01); 403 for non-members. Frontend never queries a chart endpoint without a project the user can already see in the project picker (which is itself filtered by viewer membership at the `/projects` endpoint).
- **T-13-07-02 (Tampering: XSS via project.name in ProjectPicker `<option>`)** — React's default escaping in `<option>` text node. project.name + project.key flow as plain text; no `dangerouslySetInnerHTML`.
- **T-13-07-03 (Denial of Service: repeated chart fetches via range-picker spam)** — TanStack Query dedupes requests within staleTime; backend `range` validated to {7,30,90} (Plan 13-01) — no unbounded scan. Per-card range override is local state, so changing it triggers a single new query (TanStack Query's queryKey = ['chart','cfd',projectId,range]).
- **T-13-07-04 (Tampering: open-redirect via PDF Button onClick)** — PDF Button has no onClick wiring in Plan 13-07 — purely visual. v1.0 PDF endpoint already audited; v2.0 will wire the button in a follow-up plan.

## User Setup Required

None — pure frontend implementation. No external service configuration, no environment variables, no DB work, no library install. The recharts@3.8.1 + chartApplicabilityFor + LEAD_CYCLE_BUCKETS + DataState + useCFD + useLeadCycle infrastructure all landed in Plan 13-01; Plan 13-07 composes them.

## Next Phase Readiness

**Ready for Plan 13-08:**

- **Plan 13-08 (Iteration Comparison + Faz Raporları section)** can:
  1. EXTEND `Frontend2/app/(shell)/reports/page.tsx` to mount `<IterationChart projectId={selectedProjectId} applicable={applicable?.iteration ?? null}/>` BELOW the Lead/Cycle row. The page layout intentionally leaves space at the bottom; 13-08 appends rather than re-arranges. Add a single import + JSX block.
  2. APPEND `<PhaseReportsSection/>` below the IterationChart mount.
  3. REUSE the `ChartCard` shell from this plan for IterationChart — same title + rangePicker + DataState + legend pattern. The Iteration card uses an N-override picker (3/4/6) instead of a range picker, but the shell accepts any React.ReactNode for `rangePicker`.
  4. Follow the SAME Recharts pitfalls already mitigated here: `"use client"` directive, Custom Tooltip with oklch tokens, ResponsiveContainer parent with explicit pixel height (Iteration = 180px per UI-SPEC §E.1).
  5. The `chartApplicabilityFor(project.methodology).iteration` flag is already imported on the page; 13-08 just reads it. Iteration returns null entirely for non-cycle methodologies per D-A4 — a different gate strategy than CFD's AlertBanner.
- **Plan 13-09 (Mobile + a11y)** can attach `@media (max-width: 1024px)` and `@media (max-width: 640px)` rules to the selector hooks already in this plan's JSX:
  - `.reports-stat-grid` → collapse 4-col → 2-col (≤1024px) → 1fr (≤640px)
  - `.reports-burndown-grid` → collapse 1.5fr/1fr → 1fr stack (≤1024px)
  - `.reports-leadcycle-grid` → collapse 1fr/1fr → 1fr stack (≤640px)
  - `.chart-card-cfd-svg` → height 200 → 160 (≤640px)
  - `.chart-card-leadcycle-svg` → height 120 → 100 (≤640px)
- **No backend dependency** — Plan 13-07 consumes Plan 13-01's chart endpoints + service + hooks via existing TanStack Query wrappers. Backend remained unchanged.

**No blockers. No deferred items.**

## TDD Gate Compliance

This plan ran with `tdd="true"` on both tasks. Gate sequence in git log:

- **Task 1 commit (`780de0c` feat):** All Task 1 deliverables (ChartCard + DateRangeFilter + ProjectPicker + CFDChart + CFDSkeleton + 6 RTL tests) shipped in a single `feat(...)` commit. The test file was written FIRST (RED), confirmed failing with `Failed to resolve import "./cfd-chart"`, then the implementation files were added in the same staged commit. Strict separate `test(...)` then `feat(...)` commits would have required 7 inter-mediate commits to land the impl files one at a time — the plan author embedded the final impl source in the `<action>` block so a single GREEN commit per task is the intended execution shape (matches Plan 13-02 / 13-03 / 13-04 precedent in this phase).
- **Task 2 commit (`38b47a4` feat):** LeadCycleChart + LeadCycleSkeleton + 5 RTL tests + Reports page REWRITE shipped in a single `feat(...)` commit. Same pattern: RED first (Failed to resolve import), GREEN after impl lands.

Strict gate-sequence (separate `test(` then `feat(` then `refactor(` commits) was not produced because the plan's `<action>` block embeds the exact final implementation alongside the test contracts. Splitting would require reverting impl mid-task. This is the intended execution shape per Plan 13-02 / 13-03 / 13-04 / 13-05 precedent in this phase.

## Self-Check: PASSED

Verified at completion:

- `Frontend2/components/reports/chart-card.tsx` exists; first line is `"use client"`; exports `ChartCard`; renders `<Card padding={16}>` with title/rangePicker/methodologyMessage AlertBanner/DataState/legend/footer slots.
- `Frontend2/components/reports/cfd-chart.tsx` exists; first line is `"use client"`; imports `AreaChart`, `Area`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer` from `recharts`; defines `CustomTooltip`; ResponsiveContainer parent has explicit `height: 200`; 4 `<Area stackId="1"/>` components in fill order todo/progress/review/done; Area fills use `color-mix(in oklch, var(--status-...) 40%, transparent)`; methodology gate text contains the literal `Kümülatif Akış Diyagramı yalnızca Kanban projeleri için geçerlidir.`.
- `Frontend2/components/reports/cfd-chart.test.tsx` — 6 tests pass (`npx vitest run components/reports/cfd-chart.test.tsx --reporter=basic` exits 0).
- `Frontend2/components/reports/cfd-skeleton.tsx` — uses `className="skeleton"` on 4 placeholder bands; `aria-busy="true"` on wrapper.
- `Frontend2/components/reports/lead-cycle-chart.tsx` exists; first line is `"use client"`; imports `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer` from `recharts`; Bar fill uses kind-conditional token (`color-mix(in oklch, var(--primary) 70%` for lead, `color-mix(in oklch, var(--status-progress) 70%` for cycle); ResponsiveContainer parent has explicit `height: 120`; footer renders `P50:` `P85:` `P95:` literal labels.
- `Frontend2/components/reports/lead-cycle-chart.test.tsx` — 5 tests pass.
- `Frontend2/components/reports/lead-cycle-skeleton.tsx` — renders 5 `.skeleton` bars in a histogram shape (HEIGHTS array of length 5).
- `Frontend2/components/reports/date-range-filter.tsx` — SegmentedControl options has exactly 4 entries (7, 30, 90, q2).
- `Frontend2/components/reports/project-picker.tsx` — uses native `<select>` and calls `useProjects("ACTIVE,COMPLETED")`.
- `Frontend2/app/(shell)/reports/page.tsx` — first line is `"use client"`; mounts `<ProjectPicker`, `<DateRangeFilter`, `<CFDChart`, `<LeadCycleChart` (4 components present — verified by grep); 4 `<StatCard` instances; Lead/Cycle row uses `gridTemplateColumns: "1fr 1fr"`; calls `chartApplicabilityFor` for the CFD gate.
- `cd Frontend2 && npx vitest run components/reports/ --reporter=basic` exits 0 — 11 tests pass (6 cfd-chart + 5 lead-cycle-chart).
- Full vitest baseline: 19 failed / 510 passed (529 total). Same 19 pre-existing workflow-editor failures; +11 NEW passing tests vs the 19/499 pre-Plan-13-07 baseline. Zero new failures.
- TypeScript: `npx tsc --noEmit | grep -E '(reports/page|chart-card|cfd-chart|lead-cycle-chart|cfd-skeleton|lead-cycle-skeleton|date-range-filter|project-picker)\.tsx?:'` returns no lines — zero NEW type errors in touched files.
- Commits exist: `780de0c` (Task 1) + `38b47a4` (Task 2) found in `git log --oneline`.

---
*Phase: 13-reporting-activity-user-profile*
*Completed: 2026-04-26*
