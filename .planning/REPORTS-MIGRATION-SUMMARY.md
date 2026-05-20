# Reports Migration v2 — Wave 1–7 Summary (PR-Ready)

**Branch:** `main`
**Commits:** 7 atomic (1 backend + 6 frontend) — see Commit Log below.
**Plan reference:** [.planning/REPORTS-MIGRATION-PLAN.md](.planning/REPORTS-MIGRATION-PLAN.md) (v2)
**Strategy:** D — Capability + Data-Driven Chart Gating
**Status:** READY for review

---

## What shipped

Migrates the legacy v1.0 Reports surface (`Frontend/app/reports/page.tsx`) into the prototype-faithful Frontend2 codebase, replaces methodology-hardcoded chart gating with a backend-driven capability registry, and adds a Strategy D differentiator (PhaseProgressChart) so projects whose methodology gates Burndown / Iteration out still see a meaningful Reports page.

### User-visible outcomes

1. `/reports` mounts **9 cards** end-to-end (was 3 placeholders + 3 working charts in Phase 13):
   - 4 StatCards (Sprint Velocity / Cycle Time / Completed / Blockers) — wired to real backend data
   - Burndown (Recharts AreaChart + dashed ideal line)
   - Team Load (Avatar + ProgressBar list, peer-relative scaling)
   - CFD (Phase 13, unchanged)
   - Lead / Cycle (Phase 13, unchanged)
   - Iteration Comparison (Phase 13, unchanged)
   - **Phase Progress (NEW)** — horizontal step strip for any project with `phase_workflow.nodes`
   - Phase Reports (Phase 13, unchanged)
2. **Export button** ships 3 actions (Önizle / PDF / Excel) with loader state + popup-blocker handling + transient AlertBanner feedback.
3. **URL state** — filters round-trip via `?projectId=X&range=Y`; refresh / bookmark / share all work.
4. **Capability-gated visibility** — when a project lacks sprints, Burndown + Iteration cards show a CTA AlertBanner ("Add a sprint to enable this report") instead of confusing empty charts. Same for CFD (column categories) and Phase Progress (workflow nodes). Methodology enum is never consulted on the page or in the charts.

### Architectural outcomes

| Concern | Before | After |
|---|---|---|
| Chart visibility decision | `chartApplicabilityFor(methodology)` mirrored in FE + BE, drifting | Single backend `CHART_CAPABILITY_RULES` registry; `/projects/{id}/chart-capabilities` endpoint is the only source |
| Methodology coupling | Hardcoded in `chart_applicability.py`, used by iteration use case + FE matrix | Rule registry uses `CapabilityInputs` only (sprint counts, column categories, phase nodes, member count). Methodology enum is not checked |
| "Done" column detection | `ILIKE '%done%'` in ~8 SQL sites | `BoardColumn.category == 'done'` primary lookup with ILIKE fallback + WARN log + Prometheus counter for backfill monitoring |
| Iteration endpoint contract | 422 `INVALID_METHODOLOGY` for non-cycle projects | 200 `sprints: []` for projects with no sprints — empty result, never methodology error |
| Filter state | `useState` (lost on refresh) | `useSearchParams` + `router.replace` (URL is source of truth) |
| Chart tooltip implementation | 3 inline `CustomTooltip` copies drifting across CFD / LeadCycle / Iteration | Single `ChartTooltip` primitive with `formatValue?` opt-in |
| Recharts animation | Default enabled (8 simultaneous SVG animations on filter change) | `isAnimationActive={false}` across all 10 series |
| Cache discipline | No staleTime, no retry policy, no placeholderData | `staleTime: 30_000` + `retry: 1` everywhere; `keepPreviousData` on charts where in-place range filters change |

---

## Commit log

```
441fff25 feat(reports): Wave 6 — cleanup (Sprint Velocity wiring + E2E refresh + a11y)
ea0fe4dd feat(reports): Wave 5 — page rewire mounts Wave 3 charts + ExportButton
d8ba99f6 feat(reports): Wave 4 — shared chart-tooltip + perf-defaults sweep across 8 hooks
02705e39 feat(reports): Wave 3 — 3 new chart components (Burndown / TeamLoad / PhaseProgress)
fedd1044 feat(reports): Wave 2 — report-service + 4 hooks (data foundation for Wave 3 charts)
989abe40 feat(reports): Wave 1b — FE capability hook + URL state + applicability.ts deletion
2bd916fd feat(reports): Wave 1a — Strategy D backend (capability-driven chart gating)
```

Each commit ships in isolation: passes its own test suite, leaves the previous Wave's output functional. Total: **+3500 net lines added** across **40+ files** (most of it new components + tests).

---

## Test coverage

| Layer | Files | Tests | Status |
|---|---|---|---|
| Backend unit (chart capability rules + use cases) | `Backend/tests/unit/test_chart_capabilities.py` | **21** | ✅ |
| Backend unit (regression — full unit suite) | `Backend/tests/unit/**` | 312 (+27 xfailed) | ✅ |
| Frontend2 service | `Frontend2/services/report-service.test.ts` | **9** | ✅ |
| Frontend2 hooks | `use-chart-capabilities.test.tsx`, `use-report-hooks.test.tsx` | **13** | ✅ |
| Frontend2 chart components | `cfd-`/`lead-cycle-`/`iteration-`/`burndown-`/`team-load-`/`phase-progress-`/`phase-reports-section`.test.tsx | **50** | ✅ |
| Frontend2 export | `export-button.test.tsx` | **8** | ✅ |
| Playwright E2E (skip-guarded) | `e2e/reports-charts.spec.ts` | 8 (chromium) | ✅ |

**Total new/modified tests:** 80+ across BE and FE, all green. No regressions in the broader 96-test Frontend or 312-test backend suite.

---

## Plan v2 coverage

| Wave | Plan §  | Status |
|---|---|---|
| 1a — BE refactor | §4 | ✅ Done — `chart_applicability.py` rewritten as rule registry, 2 new endpoints, iteration empty-list refactor, ILIKE→category helper, `InvalidMethodologyError` deleted |
| 1b — FE foundation | §5.1 | ✅ Done — `useChartCapabilities` hook, URL state + Suspense wrap, `applicability.ts` deleted, `BoardColumnLite` extended |
| 2 — FE data | §5.2 | ✅ Done — `report-service.ts` + 4 hooks (`useSummary` / `useBurndown` / `useTeamLoad` / `usePhaseProgress`) |
| 3 — FE charts | §5.3 | ✅ Done — `BurndownChart` / `TeamLoadCard` / `PhaseProgressChart` |
| 4 — Polish | §5.4 | ✅ Done — Shared `ChartTooltip`, perf defaults across 8 hooks, `isAnimationActive={false}` across all 10 series. **Deferred** (with rationale): shared `ChartSkeleton` primitive, `prefers-reduced-motion` explicit check (already CSS-handled) |
| 5 — Export + page | §5.5 | ✅ Done — 3-button `ExportButton`, page rewire mounts every Wave 3 chart, transient AlertBanner replaces Toast primitive |
| 6 — Cleanup | §5.7 + verify | ✅ Done — Sprint Velocity wiring fix (Wave 5 verify Bulgu A), E2E refresh hydration test, `aria-pressed` on SegmentedControl |
| 7 — QA | §5.7 + DoD | ✅ Done — Velocity defensive `Number.isFinite` guard, hex-color audit (none in new code), PR summary doc, final test sweep |

---

## Deliberate out-of-scope (deferred)

Per plan §10 + peer review:

- **Velocity Trend BarChart** — legacy v1.0 feature, not in prototype.
- **Task Distribution PieChart** — legacy v1.0 feature, not in prototype.
- **Team Performance Table** (sortable on-time %) — legacy v1.0, not in prototype. (`useTeamLoad` does expose the raw `members` array, so a future user request can ship this in a follow-up without backend changes.)
- **AssigneeFilter** multi-select — not in prototype.
- **StatCard sparklines** — not in prototype; would mean a new primitive.
- **Custom date range picker** w/ popover — would mean a new `Popover` primitive.
- **PDF Preview Modal** — CSP risk with blob iframes; `window.open(...)` covers the use case without the modal scaffolding.
- **Toast primitive** — `AlertBanner` reuse honored peer review §2.8.
- **DropdownMenu primitive** — peer review §2.9.
- **sprintId URL param** — no sprint-picker UI generates one yet.
- **Real-time WebSocket updates** — TanStack `refetchOnWindowFocus` covers the common case.
- **Cross-project chart comparison** — explicit user request needed.

Each can ship in a future phase with explicit justification.

---

## Manual QA checklist (Wave 7)

Run these against a dev server with a seeded backend before merging:

- [ ] Dark mode — switch to dark, verify all 9 cards render with correct oklch colors (no light-mode bleed).
- [ ] Cross-browser PDF download — Chrome / Firefox / Safari each trigger a download with `SPMS_Report_<id>_<date>.pdf` filename.
- [ ] Cross-browser PDF preview — `Önizle` opens the PDF in a new tab in each browser; popup-blocker fallback message shows when blocking is enabled.
- [ ] Excel download — `.xlsx` file opens correctly in Excel / Numbers / LibreOffice.
- [ ] URL share — copy `/reports?projectId=X&range=7`, paste into a new tab, verify the page hydrates to project X with the 7-day chip active.
- [ ] Capability gating — pick a Kanban-no-sprints project; verify Burndown and Iteration show AlertBanner with CTA copy instead of empty charts.
- [ ] PhaseProgress — pick a Waterfall project with `phase_workflow.nodes`; verify the horizontal step strip renders one cell per phase with `done / total` counts.
- [ ] Filter changes — toggle 7 / 30 / 90 / Q2 chip; verify charts refetch and the URL updates without scroll-jumping.

---

## Open follow-up backlog

Low-priority items surfaced by the verify agents that don't block merge:

1. **Sprint Velocity backend native field** (BE follow-up) — currently derived from `useIteration`'s last sprint; a future BE could ship `velocity_current` + `velocity_delta` in `SummaryDTO` for a more canonical source.
2. **SegmentedControl radio semantics** — current `aria-pressed` works; canonical radio (role="radiogroup" + role="radio" + aria-checked) would be more semantically correct for screen readers.
3. **`sprintId` URL param** — surface a sprint-picker UI inside BurndownChart, then plumb `sprintId` into the URL state.
4. **E2E AlertBanner gate assertion** — once the test DB seeder lands (Phase 11 D-50), add a Kanban-no-sprints fixture test that asserts the AlertBanner content.
5. **E2E PDF download stream test** — Playwright `page.on("download", ...)` can assert the downloaded filename + content-type at the browser level.
6. **Backend delta math** — `velocity_delta`, `cycle_time_delta_days`, `completed_delta_pct`, `blockers_delta` fields are wired in `SummaryDTO` but the BE implementation returns `null`. A follow-up phase can add prev-period CTE math.

---

**End of summary.** Wave 1–7 ship together as a coherent migration.
