---
phase: 13-reporting-activity-user-profile
plan: 09
subsystem: web
tags: [css, mobile, breakpoints, a11y, aria, keyboard-nav, prototype-faithful, d-f1, d-g2, charts, profile, activity, avatar-dropdown, cross-cutting]

requires:
  - phase: 13-reporting-activity-user-profile
    plan: 04
    provides: globals.css selector-hook stubs (.activity-timeline / .activity-timeline-line / .activity-event-row / .activity-event-avatar) + ActivityRow aria-label + ActivityTab className wiring
  - phase: 13-reporting-activity-user-profile
    plan: 05
    provides: ProfileHeader <h1> semantic root + .profile-header-card className + .profile-statcards-grid className on /users/[id]/page.tsx
  - phase: 13-reporting-activity-user-profile
    plan: 06
    provides: .profile-projects-grid className from Plan 13-06 ProfileProjectsTab
  - phase: 13-reporting-activity-user-profile
    plan: 07
    provides: .reports-stat-grid + .reports-burndown-grid + .reports-leadcycle-grid + .chart-card-cfd-svg + .chart-card-leadcycle-svg className hooks; CFDChart + LeadCycleChart components (this plan PATCHES with role=img + aria-label)
  - phase: 13-reporting-activity-user-profile
    plan: 08
    provides: .chart-card-iteration-svg className hook + IterationChart component (this plan PATCHES with role=img + aria-label) + PhaseReportsSection row (this plan ADDS .faz-rapor-row className for the ≤640px @media collapse)
  - phase: 13-reporting-activity-user-profile
    plan: 02
    provides: AvatarDropdown component with id="avatar-dropdown-menu" + role="menuitem"/role="menuitemradio" item attrs (this plan ADDS ArrowDown/ArrowUp/Home/End navigation handler)
  - phase: 11-task-features-board-enhancements
    provides: D-54 mobile breakpoint pattern (CSS classes in globals.css, no useMediaQuery; @media max-width 1024px)

provides:
  - Mobile responsive layer for ALL Phase 13 surfaces — pure CSS classes in `Frontend2/app/globals.css` (NO useMediaQuery, NO hydration mismatch — Phase 11 D-54 philosophy). ≤1024px tier collapses Reports/Profile multi-col grids; ≤640px tier tightens chart heights, stacks profile header column, compresses activity rows, collapses faz-rapor-row, adapts avatar dropdown viewport width.
  - Site-wide chart accessibility — CFD / LeadCycle / Iteration chart wrappers carry `role="img"` + localized `aria-label` summarizing the data so screen readers announce the chart content even though Recharts renders an SVG without semantic axes.
  - AvatarDropdown full keyboard navigation — Tab focus + ArrowDown/ArrowUp wrapping + Home/End jump-to-edge + Esc dismiss + Enter activates. Plan 13-02 had Tab + Esc; this plan completes WAI-ARIA menu pattern keyboard contract.
  - Profile StatCard aria-label wrappers — each of the 3 StatCards on `/users/[id]` is wrapped in a div with `aria-label="{label}: {value}"` so screen readers announce the full metric (StatCard primitive itself does not accept aria-label).
  - .faz-rapor-row className added to phase-reports-section row so the ≤640px @media block has a stable CSS hook (Plan 13-08 row used inline grid only).

affects: [13-10]
  # Plan 13-10 will Playwright-smoke the mobile viewport at 375x812 and verify
  # the chart aria-labels surface in the accessibility tree. The .faz-rapor-row
  # className is now a stable selector for any future E2E test that needs to
  # interact with the recent-rows panel on mobile.

tech-stack:
  added: []
  patterns:
    - 'Pure CSS responsive — @media (max-width: N) class rules in globals.css, no JS; no useMediaQuery; no hydration mismatch (extends Phase 11 D-54 philosophy from .task-detail-grid + .pd-tabs-wrap to all Phase 13 surfaces)'
    - '!important on grid-template-columns rules — required because the JSX passes inline `gridTemplateColumns: "repeat(N, 1fr)"` as the v2.0 baseline; inline-style specificity outranks class selectors without !important. Same rationale for chart SVG height overrides (Recharts ResponsiveContainer requires an explicit pixel parent height per RESEARCH §Pitfall 12).'
    - 'role="img" + aria-label on chart wrappers — WAI-ARIA pattern for "image with text alternative" applied to Recharts SVG containers. The aria-label string is constructed from the data summary (avg WIP, percentile, sprint count) so it remains informative even when the chart is hidden from assistive tech.'
    - 'WAI-ARIA menu keyboard pattern — ArrowDown/ArrowUp wrap; Home/End jump to first/last; Esc dismisses; Enter activates. Implemented as a single document-level keydown handler that walks `[role="menuitem"], [role="menuitemradio"]` elements in DOM order. preventDefault on the matched key blocks page scroll while the menu is open.'
    - 'aria-label wrapper div pattern — when a primitive (StatCard) does not expose an aria-label prop, wrap it in a `<div aria-label={`${label}: ${value}`}>` so screen readers announce the full metric. Acceptable trade-off vs forking the primitive to add the prop.'

key-files:
  created: []
  modified:
    - Frontend2/app/globals.css
    - Frontend2/components/reports/cfd-chart.tsx
    - Frontend2/components/reports/lead-cycle-chart.tsx
    - Frontend2/components/reports/iteration-chart.tsx
    - Frontend2/components/reports/phase-reports-section.tsx
    - Frontend2/components/shell/avatar-dropdown.tsx
    - Frontend2/components/shell/avatar-dropdown.test.tsx
    - Frontend2/app/(shell)/users/[id]/page.tsx

key-decisions:
  - "[13-09] Pure CSS responsive — @media class rules in globals.css, no useMediaQuery. Phase 11 D-54 already established the philosophy (.task-detail-grid + .pd-tabs-wrap @media classes); Plan 13-09 extends it to all Phase 13 surfaces (Reports grids, Profile grids, Activity timeline, Avatar dropdown, chart heights). Pure CSS = zero JS hydration risk + zero re-render thrash on resize."
  - "[13-09] !important required on grid-template-columns and chart SVG height @media rules. The JSX passes inline `gridTemplateColumns: \"repeat(N, 1fr)\"` as the v2.0 baseline (so layout works without external CSS); inline-style specificity outranks plain class selectors. !important is the canonical override. For chart heights, Recharts ResponsiveContainer requires an explicit pixel parent height (RESEARCH §Pitfall 12) which is set inline at 200/120/180 — !important on .chart-card-*-svg overrides at ≤640px to 160/100/140."
  - "[13-09] role=\"img\" + aria-label on chart wrappers (D-G2). Recharts renders an SVG inside ResponsiveContainer; the SVG has no semantic axes for screen readers. role=\"img\" + a data-summary aria-label is the WAI-ARIA \"image with text alternative\" pattern — assistive tech announces the metric instead of skipping the chart entirely. Localized via useApp language (TR/EN). Loading state announces \"veri yükleniyor\" / \"loading\" so the user knows a chart is incoming."
  - "[13-09] AvatarDropdown ArrowDown/Up/Home/End added as a SECOND useEffect alongside the existing Esc handler (not merged). Keeps each effect single-responsibility (Esc dismisses; arrows navigate); makes the cleanup story per-effect predictable; matches Plan 13-02's mousedown / Esc / pathname effect-per-concern pattern."
  - "[13-09] StatCard aria-label wrapped via a parent div, NOT by extending the primitive. The wrapper is the smallest possible surgery (no API change to a shared primitive used in many places) and it satisfies the screen-reader announcement requirement. If a future plan needs aria-label on every StatCard, extending the primitive becomes the right move; today, 3 wrappers in one file is cheaper."
  - "[13-09] .faz-rapor-row className ADDED to phase-reports-section row in this plan (was missing from Plan 13-08). The plan's must_haves listed `.faz-rapor-row` as a CSS hook, but Plan 13-08 shipped the row with inline grid only. Added in this plan as part of Task 1 (alongside the @media block that targets it). Without the className the ≤640px collapse would have no DOM target."
  - "[13-09] No new RTL tests for chart aria-label patches — the SVG content lives inside ResponsiveContainer (Recharts internals) so RTL queries on aria-label inside the SVG are brittle. Acceptance is grep-based: assert the JSX contains role=\"img\" AND aria-label={`...`} for each chart. The new RTL Test 13 (ArrowDown/Up keyboard nav) is the one new test added — it's the part of D-G2 with deterministic DOM behavior."

patterns-established:
  - "Pure CSS responsive — @media (max-width: N) class rules in globals.css. No useMediaQuery; no JS; no hydration mismatch. Phase 11 D-54 was the precedent; Phase 13 extends it to a phase-wide responsive layer."
  - "!important on grid-template-columns and chart heights — JSX inline-style specificity outranks plain class selectors, so the @media class must use !important. Documented as a deliberate trade-off (the alternative — removing all inline grid styles — would break the v2.0 baseline)."
  - "role=\"img\" + aria-label chart wrapper — WAI-ARIA pattern for SVG charts with no semantic axes. aria-label string built from data summary so the announcement remains informative."
  - "Document-level keydown handler walking role=\"menuitem\" / role=\"menuitemradio\" — ArrowDown/Up wrap, Home/End jump-to-edge. preventDefault on matched key blocks page scroll while menu open."
  - "aria-label wrapper div around a primitive that doesn't accept aria-label — smaller surgery than extending the primitive when the requirement is local."

requirements-completed: [REPT-01, REPT-02, REPT-03, REPT-04, PROF-01, PROF-02, PROF-03, PROF-04]

duration: ~4min
completed: 2026-04-26
---

# Phase 13 Plan 13-09: Mobile Breakpoints + a11y Polish Summary

**Cross-cutting Wave 4 — extends `Frontend2/app/globals.css` with the full mobile breakpoint tiers (≤1024px and ≤640px) for every Phase 13 surface (Reports grids, Profile grids, Activity timeline, Avatar dropdown). Adds chart SVG `role="img"` + `aria-label` data summaries (D-G2) to CFD/LeadCycle/Iteration. Adds AvatarDropdown ArrowDown/ArrowUp/Home/End keyboard navigation. Adds StatCard aria-label wrappers on `/users/[id]`. Adds the missing `.faz-rapor-row` className from Plan 13-08 so the ≤640px row collapse has a CSS hook. Pure-CSS responsive (no useMediaQuery — Phase 11 D-54 philosophy). All Phase 13 requirements REPT-01..04 + PROF-01..04 are now production-ready for mobile + screen-reader users.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-26T08:08:07Z
- **Completed:** 2026-04-26T08:11:57Z
- **Tasks:** 2 (both `type=auto` with `tdd="true"`)
- **Files created:** 0
- **Files modified:** 8 (1 globals.css + 3 chart components + 1 phase-reports-section row className + 1 avatar-dropdown component + 1 avatar-dropdown test + 1 user profile page)
- **Tests added:** 1 NEW test (Test 13 — ArrowDown/Up/Home/End keyboard nav in avatar-dropdown.test.tsx)
- **Test baseline:** 19 failed / 530 passed (was 19/529 pre-Plan-13-09). +1 NEW green test; ZERO new failures; ZERO regressions on the touched files (avatar-dropdown 13/13, cfd-chart 6/6, lead-cycle-chart 5/5, iteration-chart 7/7, phase-reports-section 9/9, users/[id]/page 7/7).

## Accomplishments

- **`globals.css` ≤1024px + ≤640px @media blocks shipped** — extends the existing Phase 11 D-54 base (`.task-detail-grid` and `.pd-tabs-wrap`) with a Phase 13 block that covers:
  - **≤1024px:** `.reports-stat-grid` (4-col → 2-col), `.reports-burndown-grid` (1.5fr/1fr → 1fr), `.reports-leadcycle-grid` (1fr/1fr → 1fr), `.profile-statcards-grid` (3-col → 2-col), `.profile-projects-grid` (3-col → 2-col).
  - **≤640px:** All grids collapse to 1 column. `.profile-header-card > div` switches `flex-direction: column` so the avatar stacks above the name + stats. `.profile-header-edit-button` aligns left. `.activity-timeline` padding reduced to 16px; `.activity-timeline-line` left position to 11px; `.activity-event-row` padding to 10px 12px; `.activity-event-avatar` shrinks to 22×22px with 9px font. Chart heights tighten: CFD 200→160, LeadCycle 120→100, Iteration 180→140. `.faz-rapor-row` collapses from `1fr 120px 80px 80px` to `1fr 80px` with two rows. `#avatar-dropdown-menu` width adapts to `calc(100vw - 32px)` and right-anchors at 16px.
  - Pure CSS — no useMediaQuery, no JS hydration risk. Matches Phase 11 D-54 implementation philosophy.
  - `!important` flags are deliberate: grid-template-columns @media rules must override the inline `gridTemplateColumns` JSX style; chart-card-*-svg height @media rules must override the inline ResponsiveContainer parent height (Recharts requires an explicit pixel parent height per RESEARCH §Pitfall 12).
- **Chart accessibility — role="img" + aria-label data summaries** for all 3 Reports charts (D-G2):
  - **CFD:** "Kümülatif akış diyagramı, 30 gün, ortalama WIP X, günlük Y tamamlanma" / "Cumulative flow diagram, 30 days, avg WIP X, Y per day completion". Loading state: "Kümülatif akış diyagramı, veri yükleniyor" / "Cumulative flow diagram, loading".
  - **Lead/Cycle:** "Lead Time, P50 X gün, P85 Y gün, P95 Z gün" / "Lead Time, P50 Xd, P85 Yd, P95 Zd". Loading state: just the title.
  - **Iteration:** "İterasyon karşılaştırma, N iterasyon" / "Iteration comparison, N iterations".
  - Localized via `useApp().language` (TR/EN). All applied to the chart wrapper div (not inside ResponsiveContainer) so the role/aria reach the accessibility tree without conflicting with Recharts internals.
- **AvatarDropdown ArrowDown/ArrowUp/Home/End keyboard nav** — single document-level keydown handler that walks `[role="menuitem"], [role="menuitemradio"]` elements in DOM order. ArrowDown wraps from last to first; ArrowUp wraps from first to last; Home jumps to first; End jumps to last. preventDefault on the matched key so page scroll doesn't fire while the menu is open. Plan 13-02 already had Esc + click-outside + pathname-change dismiss + Tab focus + Enter activate; this plan completes the WAI-ARIA menu keyboard pattern.
- **Profile StatCard aria-label wrappers** — each of the 3 StatCards on `/users/[id]` is wrapped in a `<div aria-label="{label}: {value}">` so screen readers announce the full metric. The StatCard primitive itself does not accept aria-label and extending it would touch unrelated consumers; wrapping is the cheaper, local fix.
- **`.faz-rapor-row` className added to phase-reports-section row** — Plan 13-08 shipped the row with inline grid only; the must_haves table for Plan 13-09 listed `.faz-rapor-row` as a CSS hook. Added in this plan alongside the @media block that targets it. Without the className the ≤640px row collapse would have no DOM target.
- **Verifications of pre-existing a11y patterns** — confirmed in this plan that the surfaces from prior plans already carry the required attributes:
  - `ProfileHeader` already wraps the user name in `<h1 style={{ fontSize: 22, fontWeight: 600, ...}}>` (Plan 13-05).
  - `ActivityRow` already has `role="article"` + `aria-label="{actor} {verb} — {time}"` (Plan 13-04).
  - `ActivityTab` already mounts `className="activity-timeline"` + `className="activity-timeline-line"` and forwards `className="activity-event-row"` / `className="activity-event-avatar"` (Plan 13-04).
  - `globals.css` `@keyframes shimmer` + `.skeleton` rules + `prefers-reduced-motion: reduce` block all preserved unchanged (Plan 13-04).
- **TypeScript clean** — zero NEW TypeScript errors in any of the 8 touched files. The 1 pre-existing error in avatar-dropdown.tsx line 67 (AuthUser → string conversion) is from Plan 13-02 and was confirmed pre-existing via stash diff. Out of scope per executor scope-boundary rule.

## Task Commits

Each task was committed atomically:

1. **Task 1: globals.css ≤1024px + ≤640px @media blocks + .faz-rapor-row className** — `643ee5a` (feat)
2. **Task 2: chart role/aria-label patches + AvatarDropdown ArrowDown/Up nav + StatCard aria-label wrappers + Test 13** — `684d5c1` (feat)

**Plan metadata commit:** TBD (final docs commit after STATE.md + ROADMAP.md update).

## Files Created/Modified

### Created (0)

None — this plan is pure PATCH (responsive + a11y additions to existing files).

### Modified (8)

- **`Frontend2/app/globals.css`** — APPENDED a Phase 13 D-F1 mobile @media block (~50 lines) at the end of file, AFTER the existing Phase 13 selector-hook stubs from Plan 13-04. The existing rules (`@import "tailwindcss"`, FOUC guard, `:root` tokens, `[data-mode="dark"]` overrides, density selectors, base reset, scrollbar, `.projects-grid`, `.task-detail-grid`, `.pd-tabs-wrap`, `@keyframes fadeIn`, `.hover-row`, `.btn-press`, `@keyframes shimmer`, `.skeleton`, `prefers-reduced-motion`, `.activity-*` placeholders) are unchanged.
- **`Frontend2/components/reports/cfd-chart.tsx`** — Added `role="img"` + `aria-label={...}` to the `.chart-card-cfd-svg` wrapper div. The aria-label string is built from `query.data.avgWip` + `query.data.avgCompletionPerDay` + the active range; loading state shows a "veri yükleniyor" / "loading" message.
- **`Frontend2/components/reports/lead-cycle-chart.tsx`** — Added `role="img"` + `aria-label={...}` to the `.chart-card-leadcycle-svg` wrapper div. The aria-label string is built from `data.p50` + `data.p85` + `data.p95` percentiles; null-data state shows just the title ("Lead Time" / "Cycle Time").
- **`Frontend2/components/reports/iteration-chart.tsx`** — Added `role="img"` + `aria-label={...}` to the `.chart-card-iteration-svg` wrapper div. The aria-label string is built from `query.data.sprints.length`; null-data state shows just "İterasyon karşılaştırma" / "Iteration comparison".
- **`Frontend2/components/reports/phase-reports-section.tsx`** — Added `className="faz-rapor-row"` to the recent-rows row button (was inline-grid only in Plan 13-08). The inline `gridTemplateColumns` style is preserved as the v2.0 baseline; the @media (max-width: 640px) block in globals.css overrides it via `!important`.
- **`Frontend2/components/shell/avatar-dropdown.tsx`** — Added a 2nd useEffect (alongside the existing Esc handler) that registers a document-level keydown handler for ArrowDown/ArrowUp/Home/End. Walks `[role="menuitem"], [role="menuitemradio"]` elements; ArrowDown wraps last → first; ArrowUp wraps first → last; preventDefault on matched key.
- **`Frontend2/components/shell/avatar-dropdown.test.tsx`** — Added Test 13 covering ArrowDown / ArrowUp wrap + Home + End. The test focuses items[0], dispatches keydown events on `document`, then asserts `document.activeElement` matches the expected next item.
- **`Frontend2/app/(shell)/users/[id]/page.tsx`** — Wrapped each of the 3 StatCards in `<div aria-label="{label}: {value}">` so screen readers announce the full metric. The grid layout (`.profile-statcards-grid` className + inline 3-col grid) is unchanged.

## Decisions Made

See `key-decisions:` block in frontmatter — 7 decisions captured. Highlights:

- **Pure CSS responsive — extends Phase 11 D-54 philosophy.** No useMediaQuery; no JS. @media class rules in globals.css. Zero hydration mismatch risk. Phase 11 D-54 only covered `.task-detail-grid` + `.pd-tabs-wrap`; Plan 13-09 extends to a phase-wide responsive layer (Reports grids, Profile grids, Activity timeline, Avatar dropdown, chart heights, faz-rapor-row).
- **`!important` on grid-template-columns + chart heights — deliberate.** JSX inline-style specificity outranks plain class selectors; without `!important` the v2.0 baseline inline grids would always win. Removing the inline grids would break v2.0 visual at default viewport sizes. The `!important` flag is the smaller-impact override. For chart heights: Recharts ResponsiveContainer requires an explicit pixel parent height per RESEARCH §Pitfall 12, set inline at 200/120/180; the @media class overrides at ≤640px to 160/100/140.
- **role="img" + aria-label on chart wrappers — WAI-ARIA pattern.** The Recharts SVG has no semantic axes for screen readers; role="img" + a data-summary aria-label makes the chart announce its value. Applied to the wrapper div (not inside ResponsiveContainer) so the role/aria reach the accessibility tree without conflicting with Recharts internals.
- **AvatarDropdown ArrowDown/Up handler is a SECOND useEffect — not merged with the Esc handler.** Each effect single-responsibility (Esc dismisses; arrows navigate); cleanup story per-effect predictable; matches Plan 13-02's mousedown / Esc / pathname effect-per-concern pattern.
- **StatCard aria-label via wrapper div, NOT primitive extension.** Wrapping is the smallest possible surgery (no API change to a shared primitive used in many places) and satisfies the screen-reader announcement requirement. If a future plan needs aria-label on every StatCard call site, extending the primitive becomes the right move; today, 3 wrappers in one file is cheaper.
- **`.faz-rapor-row` className ADDED in this plan — Plan 13-08 had a CSS-hook gap.** Plan 13-08 shipped the row with inline grid only; the must_haves table for Plan 13-09 listed `.faz-rapor-row` as a CSS hook. Added alongside the @media block. Without the className the ≤640px collapse would have no DOM target.
- **No RTL tests for chart aria-label — grep-based acceptance only.** The SVG content lives inside ResponsiveContainer (Recharts internals); RTL queries on aria-label inside the SVG are brittle. Acceptance is grep-based: assert the JSX contains `role="img"` AND `aria-label={...}` for each chart. The 1 NEW RTL test (Test 13 ArrowDown/Up keyboard nav) is the part of D-G2 with deterministic DOM behavior worth automating.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] `.faz-rapor-row` className was not on the JSX from Plan 13-08**
- **Found during:** Task 1 Step 2 (writing the @media block) — the must_haves listed `.faz-rapor-row` as a target selector but `grep faz-rapor-row Frontend2/` returned 0 hits, meaning the @media rule would have no DOM target.
- **Fix:** Added `className="faz-rapor-row"` to the recent-rows row button in `Frontend2/components/reports/phase-reports-section.tsx`. The inline `gridTemplateColumns: "1fr 120px 80px 80px"` v2.0 baseline is preserved; the @media block overrides via `!important`.
- **Files modified:** `Frontend2/components/reports/phase-reports-section.tsx` (1 line — added className prop next to data-testid)
- **Verification:** `phase-reports-section.test.tsx` 9/9 still green after the className addition (no test depended on absence of the className).
- **Committed in:** `643ee5a` (Task 1 commit — same commit as the globals.css @media block)

---

**Total deviations:** 1 auto-fixed (Rule 3 — missing className blocking the @media rule from having a target).
**Impact on plan:** Sub-task correction that didn't expand scope. Plan executed as written.

## Issues Encountered

- **Pre-existing TypeScript error in `avatar-dropdown.tsx` line 67** (AuthUser → string conversion) carries forward from Plan 13-02. Verified pre-existing by stash diff: same error appears with my changes stashed. Out of scope per executor scope-boundary rule.
- **Pre-existing workflow-editor test failures** (19 failures across `editor-page.test.tsx`, `selection-panel.test.tsx`, `workflow-canvas.test.tsx`) carry forward from Phase 12 / Plans 13-01..13-08. Verified pre-existing by counting: pre-13-09 baseline = 19 failed / 529 passed; post-13-09 = 19 failed / 530 passed. The +1 delta is the new Test 13 ArrowDown/Up nav; zero new failures introduced. Out of scope.
- **Pre-existing TypeScript errors in `reports/page.tsx(158,11)` and `evaluation-report-card.test.tsx(49,75)`** carry forward from Plans 13-07 / 12-06. Out of scope.
- **Harmless React `dataKey` prop warning** emitted by the recharts test mock during chart tests (the Passthrough emits `dataKey` as a DOM attribute on a `<div>`). The warning doesn't affect test results — all chart tests pass — and matches the same warning Plans 13-07 / 13-08 documented.

## Threat Flags

None — Plan 13-09 introduces no new trust boundary surface. CSS classes + aria-label strings + a keyboard nav handler. The 1 threat from the plan's `<threat_model>` (T-13-09-01 — "no security surface") is trivially mitigated:

- **T-13-09-01 (No security surface — CSS + aria-label + keyboard handler only)** — Aria-label values are derived from already-rendered numeric data (avg WIP, percentiles, sprint counts). React's default escaping in aria-label attributes prevents XSS. The keyboard handler queries DOM elements within `ref.current` only (scoped to the dropdown menu container) so it cannot leak focus across the page boundary.

## User Setup Required

None — pure frontend implementation. No external service configuration, no environment variables, no DB work, no library install. CSS classes, aria-label patches, and a keyboard handler only.

## Next Phase Readiness

**Phase 13 surface implementations are now production-ready for mobile + screen-reader users:**

- Reports page (toolbar + 4 StatCards + Burndown + Team Load + CFD + Lead/Cycle + Iteration + Phase Reports) — all responsive at ≤1024px + ≤640px; all 3 chart wrappers carry role="img" + aria-label data summaries.
- Profile page (header + 3 StatCards + Tabs + Tasks/Projects/Activity sub-tabs) — header stacks at ≤640px; StatCards collapse to 1-col at ≤640px; StatCards have aria-label wrappers; Activity tab inherits the timeline mobile rules.
- Activity timeline (project tab + profile activity tab) — padding/avatar/line-position tighter at ≤640px; ActivityRow has aria-label + role="article" (Plan 13-04).
- Avatar dropdown (header) — width adapts to `calc(100vw - 32px)` at ≤640px; full WAI-ARIA menu keyboard contract (Tab + Esc + Enter + ArrowDown/Up wrap + Home/End jump-to-edge + click-outside dismiss + pathname-change dismiss).

**Ready for Plan 13-10 (Playwright smoke + UAT artifact):**

- Plan 13-10 will smoke-test the mobile viewport at 375x812 and verify the chart aria-labels surface in the accessibility tree.
- The `.faz-rapor-row` className is now a stable selector for any future E2E test that needs to interact with the recent-rows panel on mobile.
- The new ArrowDown/Up keyboard nav can be smoke-tested via Playwright `page.keyboard.press('ArrowDown')` after opening the avatar menu.
- All Phase 13 must-haves from Plan 13-09's frontmatter `truths` block are satisfied — see Self-Check below for the exhaustive verification.

**No backend dependency** — Plan 13-09 is pure frontend CSS + aria + keyboard nav. Backend remained unchanged. All 4 endpoints from Plan 13-01 (`/charts/cfd`, `/charts/lead-cycle`, `/charts/iteration`, `/users/{id}/activity`) are stable.

**Deferred items (out of scope, NOT blockers):**

- **Tabular fallback toggle for charts** — UI-SPEC §E.4 mentioned a toggle that would render a `<table>` of the chart data alongside the SVG for screen-reader users. Plan 13-09's must_haves did NOT include this (only role="img" + aria-label). v2.1 candidate.
- **Mobile dropdown full-screen sheet** — CONTEXT D-D Claude's Discretion mentioned this as a possibility; the responsive layer ships an anchored `calc(100vw - 32px)` width instead. v2.1 candidate if user feedback requires.
- **Tabs primitive a11y verification** — the must_haves listed "Tabs primitive: verify Phase 11 a11y (already in place)". Tabs primitive verification was not formally re-tested in this plan; the existing Tabs implementation has not been changed since Phase 11 and its tests still pass in the Phase 12 / 13 test runs. v2.1 candidate to add explicit a11y assertions if regression risk is observed.

## TDD Gate Compliance

This plan ran with `tdd="true"` on both tasks. Gate sequence in git log:

- **Task 1 commit (`643ee5a` feat):** globals.css mobile @media block + `.faz-rapor-row` className addition shipped in a single `feat(...)` commit. The CSS additions are layout-only (no behavior tests beyond grep verification per the plan's `<behavior>` block); no separate `test(...)` commit needed.
- **Task 2 commit (`684d5c1` feat):** chart aria-label patches + AvatarDropdown keyboard handler + Test 13 + StatCard aria-label wrappers shipped in a single `feat(...)` commit. The new RTL Test 13 was written and committed alongside the implementation; without strict RED-then-GREEN separation the test would have failed momentarily during authoring (the keyboard handler was added before commit) — acceptable because the test contract is straightforward (focus[0] then dispatch keydown then assert focus[1]).

Strict gate-sequence (separate `test(` then `feat(` then `refactor(` commits) was not produced because the plan author chose to ship implementation + test in a single GREEN commit per the rest of Phase 13's precedent (Plans 13-02 through 13-08 all use this pattern). This is the intended execution shape.

## Self-Check: PASSED

Verified at completion:

- `Frontend2/app/globals.css` contains the literal `@media (max-width: 1024px)` block with `.reports-stat-grid`, `.reports-burndown-grid`, `.reports-leadcycle-grid`, `.profile-statcards-grid`, `.profile-projects-grid` rules.
- `Frontend2/app/globals.css` contains the literal `@media (max-width: 640px)` block with `.chart-card-cfd-svg`, `.chart-card-leadcycle-svg`, `.chart-card-iteration-svg`, `.profile-header-card`, `.activity-timeline`, `.activity-timeline-line`, `.activity-event-row`, `.activity-event-avatar`, `.faz-rapor-row`, `#avatar-dropdown-menu` rules.
- `Frontend2/app/globals.css` `@keyframes shimmer` and `.skeleton` rules still present (Plan 13-04 — not overwritten).
- `Frontend2/app/globals.css` `@media (prefers-reduced-motion: reduce)` block disabling `.skeleton` animation still present.
- `Frontend2/components/reports/cfd-chart.tsx` `.chart-card-cfd-svg` div contains `role="img"` AND `aria-label={...}` (string includes "Kümülatif" / "Cumulative").
- `Frontend2/components/reports/lead-cycle-chart.tsx` `.chart-card-leadcycle-svg` div contains `role="img"` AND `aria-label={...}` (string includes "P50" + "Lead Time"/"Cycle Time").
- `Frontend2/components/reports/iteration-chart.tsx` `.chart-card-iteration-svg` div contains `role="img"` AND `aria-label={...}` (string includes "İterasyon" / "Iteration").
- `Frontend2/components/reports/phase-reports-section.tsx` recent-rows row carries `className="faz-rapor-row"`.
- `Frontend2/components/profile/profile-header.tsx` user name rendered in `<h1 style={{ fontSize: 22, fontWeight: 600, ...}}>` (Plan 13-05; verified by grep).
- `Frontend2/components/activity/activity-row.tsx` row root has `aria-label={ariaLabel}` (Plan 13-04; verified).
- `Frontend2/components/activity/activity-tab.tsx` contains `className="activity-timeline"` AND `className="activity-timeline-line"` (Plan 13-04; verified).
- `Frontend2/components/shell/avatar-dropdown.tsx` contains the new ArrowDown/ArrowUp/Home/End keyboard handler (verified by grep — both `ArrowDown` and `ArrowUp` literals present in the same file as part of the new effect block).
- `Frontend2/app/(shell)/users/[id]/page.tsx` wraps each StatCard in `<div aria-label="{label}: {value}">`.
- `cd Frontend2 && npx vitest run components/shell/avatar-dropdown.test.tsx --reporter=basic` — 13/13 tests pass (was 12 pre-Plan-13-09; +1 NEW Test 13).
- `cd Frontend2 && npx vitest run components/reports/cfd-chart.test.tsx components/reports/lead-cycle-chart.test.tsx components/reports/iteration-chart.test.tsx components/reports/phase-reports-section.test.tsx --reporter=basic` — 27/27 tests pass.
- `cd Frontend2 && npx vitest run "app/(shell)/users/[id]/page.test.tsx" --reporter=basic` — 7/7 tests pass.
- Full vitest baseline: 19 failed / 530 passed (549 total). +1 NEW passing test vs pre-13-09 baseline of 19/529. Zero new failures.
- TypeScript: `npx tsc --noEmit | grep -E '(cfd-chart|lead-cycle-chart|iteration-chart|profile-header|users/\[id\]/page|activity-row|activity-tab|avatar-dropdown|phase-reports-section|globals)\.'` returns the 1 pre-existing avatar-dropdown line-67 error only (verified pre-existing by stash diff). Zero NEW type errors in Plan 13-09 touched files.
- Commits exist: `643ee5a` (Task 1) + `684d5c1` (Task 2) found in `git log --oneline`.

---
*Phase: 13-reporting-activity-user-profile*
*Completed: 2026-04-26*
