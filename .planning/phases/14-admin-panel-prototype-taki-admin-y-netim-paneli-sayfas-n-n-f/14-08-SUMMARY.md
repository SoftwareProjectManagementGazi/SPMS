---
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
plan: 08
subsystem: admin-panel-stats-tab
tags: [admin-panel, stats-tab, recharts, pure-css-bars, lazy-loaded, frontend2, top-30-cap, single-composite-endpoint]
requires:
  - phase: 14-01
    provides: useAdminStats hook (Plan 14-01 — staleTime 60s + refetchOnWindowFocus true per D-W1 stats variant) + admin-stats-service composite reader (single round-trip GET /api/v1/admin/stats per D-A7 with snake→camel mapper) + AdminStats domain shape (activeUsersTrend / methodologyDistribution / projectVelocities) + Backend admin_stats router producing the composite payload
  - phase: 14-02
    provides: AdminLayout wrapper (admin-only route guard via 3-layer admin gate + 8-tab NavTabs strip) + per-surface i18n keys file convention (admin-stats-keys joins admin-users-keys / admin-rbac-keys / admin-projects-keys / admin-workflows-keys / admin-audit-keys) + admin-keys.ts barrel precedent
  - phase: 13
    provides: DataState 3-state primitive (loading/error/empty/children) + Card primitive + Badge primitive (with tone="success"/"danger"/"neutral" + dot variant) + recharts already installed (Phase 13 D-A2 — used by reports tab) + Phase 13 chart pitfalls (Pitfall 3 SSR / Pitfall 4 custom Tooltip / Pitfall 12 explicit container height) carried over verbatim
provides:
  - Frontend2/app/(shell)/admin/stats/page.tsx — /admin/stats (İstatistik) sub-route page (composite useAdminStats reader + 3 next/dynamic chart imports per D-C6 + 2-col top row + full-width velocity row)
  - Frontend2/components/admin/stats/active-users-trend-chart.tsx — recharts AreaChart 30-day trend with --primary stroke + 12% gradient fill + first-non-zero baseline delta Badge (D-X1)
  - Frontend2/components/admin/stats/methodology-bars.tsx — pure-CSS horizontal bars for 5 buckets (scrum/kanban/waterfall/iterative/other) with case-insensitive defensive classifier (D-X3)
  - Frontend2/components/admin/stats/velocity-cards-grid.tsx — 6-column full-width grid + D-X4 defensive client-side slice(0, 30) + truncation notice (D-X4)
  - Frontend2/components/admin/stats/velocity-mini-bar.tsx — pure-CSS per-project mini-card with mono key + big-number progress + 7-bar history with last bar in --primary (D-X3 + verbatim prototype line 471)
  - Frontend2/components/admin/stats/active-users-trend-chart.test.tsx — 5 RTL cases (30-day chrome / empty state / +50% delta / -50% delta / leading-zero baseline skip)
  - Frontend2/lib/i18n/admin-stats-keys.ts — 12 TR/EN parity keys for the Stats tab (UI-SPEC §Surface I lines 490-510)
affects:
  - Plan 14-12 UAT — manual smoke checklist will exercise /admin/stats by toggling locale, forcing empty + populated states via dev DB, and visually comparing to prototype admin.jsx lines 432-475 (verbatim 2-col + 6-col grid layouts)
tech-stack:
  added: []
  patterns:
    - "Composite endpoint single-round-trip pattern (D-A7) — page reads useAdminStats() once and slices the AdminStats payload into 3 sub-charts. Avoids the N-network-calls failure mode where each chart fetches its own slice independently. The composite payload also amortizes the cost of admin auth + cache headers across all 3 charts."
    - "next/dynamic chart components with ssr:false + DataState loading fallback (D-C6) — all 3 chart components are imported at module top via dynamic() so that the recharts geometry + the AreaChart graph (~30KB gzipped) is only paid for when the user actually navigates to /admin/stats. The /admin Overview bundle stays small. Chart components themselves don't need to be 'use client' just for the dynamic import — the directive is independent — but they happen to be 'use client' anyway because recharts uses browser-only DOM measurement (Pitfall 3)."
    - "Pure-CSS horizontal bar charts where simple proportions suffice (UI-SPEC §Spacing line 38 + UI-SPEC line 38) — methodology-bars and velocity-mini-bar both use flex/grid layouts with width-as-percentage divs instead of recharts geometry. Saves bundle weight AND avoids the recharts ResponsiveContainer 0-size race (Pitfall 12). Pattern is reusable for any 'stack-of-percentages' visualization."
    - "Defensive case-insensitive bucket classifier (methodology-bars.classify) — backend's ProjectMethodology enum may evolve (Iterative was added recently per D-X3 plan note); the classifier folds variants like 'SCRUM'/'Scrum'/'scrum' into the canonical key, and any unknown value lands in 'other' instead of disappearing from the chart. Future-proofs the visualization without a backend coordination requirement."
    - "First-non-zero baseline for delta-percent computation — naive (last/first - 1) divides by zero on a leading-zero window. Searching for the first non-zero point as the baseline avoids the divide-by-zero AND is more meaningful UX-wise (the user wants to see growth from when activity actually started)."
    - "Defensive client-side cap on velocity grid (D-X4) — backend already caps at top 30 by recent activity (Plan 14-01) but the page does a second-layer slice(0, 30) to protect against accidental dev-time payload bloat. When the slice triggers (truncated=true), a localized caption explains why."
    - "7-bar slice convention on velocity history — backend may send up to 8+ sprint velocities; mini-bar pins the visualization to the LAST 7 bars per the prototype (admin.jsx line 471). The LAST bar is always in var(--primary), others in var(--border-strong) — visually anchors 'where we are now' against the trend."
    - "Big-number progress typography (UI-SPEC §Typography line 121) — 20px / 600 / -0.5 letter-spacing / tabular-nums. Reused from the prototype's velocity card (line 468). Pattern works for any single-metric KPI display where readability of large numerals matters."
    - "Custom recharts Tooltip + role='img' aria-label on the chart container (Pitfall 4 + Phase 13 a11y precedent) — recharts' default tooltip fights theme tokens; custom Tooltip uses var(--surface) bg + var(--border) border + var(--shadow-lg). Container has role='img' + aria-label so screen readers get a meaningful description without re-implementing the SVG description tree."
    - "DataState 'allEmpty' branch — page-level emptyFallback fires when ALL 3 sub-payloads are empty (no audit_log activity AND no methodology distribution AND no project velocities). Any one populated still shows the data. Avoids the 'page renders 3 empty cards' degraded state in favor of a single 'no data yet' message for brand-new orgs."
key-files:
  created:
    - Frontend2/app/(shell)/admin/stats/page.tsx (124 lines — composite page reader + 3 next/dynamic chart imports + 2-col top row + full-width velocity row + DataState all-empty branch)
    - Frontend2/components/admin/stats/active-users-trend-chart.tsx (220 lines — recharts AreaChart + custom Tooltip + first-non-zero baseline delta + role="img" aria-label)
    - Frontend2/components/admin/stats/methodology-bars.tsx (172 lines — pure-CSS horizontal bars + 5-bucket defensive classifier + skip-empty rows for iterative/other)
    - Frontend2/components/admin/stats/velocity-cards-grid.tsx (90 lines — 6-col grid + D-X4 client-side slice(0, 30) + truncation notice + empty branch)
    - Frontend2/components/admin/stats/velocity-mini-bar.tsx (123 lines — mono key + big-number progress + 7-bar history with last-bar primary + flat-zero defensive empty)
    - Frontend2/components/admin/stats/active-users-trend-chart.test.tsx (137 lines — 5 RTL cases incl. delta computation correctness + leading-zero baseline skip)
    - Frontend2/lib/i18n/admin-stats-keys.ts (118 lines — 12 keys with TR + EN parity = 24 string values, covering UI-SPEC §Surface I lines 490-510)
  modified:
    - .planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/14-VALIDATION.md (rows 14-08-T1 + 14-08-T2 marked ✅ green)
key-decisions:
  - "Bundled page.tsx into Task 2 commit (precedent: Plan 14-07 SUMMARY pattern of bundling cross-task files for buildability) — page.tsx imports velocity-cards-grid via next/dynamic, so a strict Task 1 commit including page.tsx would have created a non-buildable intermediate state. Task 1 ships chart components + i18n + RTL test (all individually buildable); Task 2 ships page.tsx + velocity-cards-grid + velocity-mini-bar in one atomic commit. Net effect: each commit is buildable in isolation. Identical reasoning to Plan 14-07's admin-audit-keys.ts decision."
  - "First-non-zero baseline for delta — naive (last/first - 1) divides by zero on leading-zero windows; the chart computes baseline via trend.find(p => p.count > 0)?.count ?? 0 with a fallback of 0 (no Badge tone applied). Documented inline + covered by RTL Case 5 (leading 3 zeros + 4 → 8 = +100%)."
  - "Methodology bucket includes Iterative + Other — backend's ProjectMethodology enum has 5+ values (D-X3 plan note). The classifier folds Scrum/Kanban/Waterfall/Iterative variants and dumps everything else (Incremental/Evolutionary/RAD/V-Model/Spiral/unknown) into 'other'. Iterative + other rows are SKIPPED from render when their count is 0 — keeps the typical 3-methodology team's card visually clean."
  - "Methodology percentage formatting locale-aware — TR uses '%P' (percent prefix), EN uses 'P%' (percent suffix). Mirrors the prototype's mono caption format (admin.jsx line 454) AND matches Turkish typographic convention. Implemented via lang === 'tr' ? '%' + N : N + '%' inline at the render site."
  - "VelocityMiniBar empty-history branch renders flat-zero 7-bar row instead of 'no data' caption — the surrounding card grid is already a single 'no project velocity' empty state at the parent (VelocityCardsGrid). A brand-new project with no completed sprints still gets a card slot with the project key + 0% progress + flat zero-bar trend, which is more honest than hiding the project entirely. Pattern: defensive zero-render at leaf vs. parent-level empty branch."
  - "VelocityMiniBar bar height min-2% floor — pure 0-height bars are invisible and create a confusing 'gap' in the trend; the floor renders a 2% hairline so the bar is still perceptible. Aesthetic decision documented inline."
  - "Custom Tooltip suffix is the localizable token, NOT the entire phrase — recharts formatter is called with (value, name, props), so the tooltip body assembles {value} {suffix-from-i18n} at render time. Cleaner than passing a full localized template string into the formatter (which would require formatter to call adminStatsT itself, polluting the chart with i18n knowledge)."
  - "DataState all-empty branch over per-card empty branches — when all 3 sub-payloads are empty, the page renders ONE empty fallback (centered 'no project velocity data' message). Any one of the 3 sub-payloads populated still shows the full layout. Decision: better degraded state than rendering 3 empty cards in a 2-col grid which would look like 'something is broken' to the admin."
  - "ssr:false on all 3 dynamic imports — only ActiveUsersTrendChart strictly needs it (recharts SSR breaks). MethodologyBars and VelocityCardsGrid are pure CSS and could SSR fine, but using ssr:false uniformly across the 3 imports keeps the bundle-split symmetry — the entire chart graph is one chunk that mounts on hydration."
  - "Toast / variant contracts unchanged — Plan 14-08 doesn't fire any toasts (no mutations on this surface; reads only). Stats are purely informational; admin actions land via OTHER tabs which mutate audit_log rows that show up here transiently."
patterns-established:
  - "Pattern: Composite endpoint single-round-trip + page-level slicing — the page is the only consumer of useAdminStats(); chart components stay purely visual. Reusable for any admin dashboard surface where multiple charts share a logical 'admin overview' query window."
  - "Pattern: next/dynamic chart import + DataState loading fallback (D-C6) — minimum-bundle pattern for sub-route-only heavy graphs. The /admin Overview bundle stays small; recharts only mounts when /admin/stats is visited."
  - "Pattern: Pure-CSS horizontal bars + percentage labels — flex/grid + width-as-percentage divs replace recharts BarChart for simple proportion visualizations. ~30KB gzipped saved + avoids ResponsiveContainer 0-size race."
  - "Pattern: First-non-zero baseline for delta-percent — robust to leading-zero windows; semantically meaningful (growth from when activity actually started)."
  - "Pattern: Defensive case-insensitive bucket classifier with 'other' fallback — future-proofs visualizations against backend enum evolution; unknown values land in a visible 'other' row instead of disappearing."
  - "Pattern: Bottom-bar-primary + others-muted convention for 'last sample' visualizations — anchors 'where we are now' against trend history. Reused verbatim from prototype admin.jsx line 471."
  - "Pattern: Bundled-cross-task commit for buildability — when Task A's file imports Task B's file via next/dynamic, bundle the importer into Task B's commit so each commit is individually buildable. Plan 14-07 + Plan 14-08 both adopted this."
requirements-completed:
  - D-00
  - D-A7
  - D-C6
  - D-W1
  - D-X1
  - D-X2
  - D-X3
  - D-X4
duration: 9min
completed: 2026-04-27
---

# Phase 14 Plan 14-08: /admin/stats (İstatistik) Tab Summary

**Wave 2 surface plan delivers the admin-tier observability tab at /admin/stats with 3 lazy-loaded charts (D-C6) reading the Plan 14-01 composite endpoint payload (D-A7): a 30-day Active Users Trend (recharts AreaChart with --primary stroke + 12% gradient fill — D-X1), a Methodology Distribution bars card (pure-CSS, NO recharts geometry — D-X3), and a top-30 capped Velocity per Project grid (D-X4 client-side slice as second-layer defense over the backend cap). useAdminStats sets staleTime 60s + refetchOnWindowFocus true (D-W1 stats variant — active-users compute is more expensive than the standard 30s admin-data window per D-X2).**

## Performance

- **Duration:** ~9 min (2 atomic commits)
- **Started:** 2026-04-27T08:06:29Z
- **Completed:** 2026-04-27T08:15:30Z (approximate)
- **Tasks:** 2 / 2 complete
- **Files created:** 7 (5 source + 1 RTL test + 1 i18n keys)
- **Files modified:** 1 (14-VALIDATION.md row flips)
- **Lines added:** 1,041 across the 7 new files (commit 1 = 668; commit 2 = 373)
- **Tests added:** 5 RTL cases (active-users-trend-chart)
- **All tests pass:** ✅ (5/5 plan tests)

## Accomplishments

1. **`/admin/stats` is functional end-to-end.** Admin users land on the route via the `/admin` 8-tab NavTabs strip (Plan 14-02), see the 3-chart composition: Active Users Trend (recharts AreaChart) + Methodology Distribution (pure-CSS bars) on a 2/1-fr top row, with the full-width Velocity per Project 6-col grid below. All 3 charts read the single composite useAdminStats() payload (D-A7).
2. **D-C6 enforced — all 3 charts lazy-loaded.** The page.tsx imports active-users-trend-chart, methodology-bars, and velocity-cards-grid via next/dynamic with ssr:false + DataState loading fallback. The /admin Overview bundle isn't taxed by the recharts geometry; the chart graph only mounts when the user navigates to /admin/stats.
3. **D-X1 enforced — Active Users Trend uses recharts AreaChart with --primary stroke + 12% gradient fill.** Verbatim UI-SPEC §Color line 163-164. Custom Tooltip uses var(--surface) bg + var(--border) border (Pitfall 4). role="img" + aria-label on the container (Phase 13 a11y precedent).
4. **D-X3 enforced — Methodology Distribution is pure CSS.** No recharts import in methodology-bars.tsx — verified by grep returning 0. 5-bucket classifier (scrum/kanban/waterfall/iterative/other) with case-insensitive folding so backend enum evolution doesn't drop categories.
5. **D-X4 enforced — Velocity grid has top-30 defensive client-side cap.** velocity-cards-grid.tsx slices to top 30 even though backend already caps; truncation notice rendered when velocities.length > 30.
6. **Verbatim prototype fidelity:** Active users 2/1-fr top row + 6-col velocity grid (UI-SPEC §Spacing lines 82-83) + project-key mono 10.5 + big-number 20px/600/-0.5/tabular-nums + last-bar in --primary all match admin.jsx lines 432-475.

## Task Commits

1. **Task 1 — ActiveUsersTrendChart + MethodologyBars + admin-stats-keys + RTL test (4 files)** — `50e49403` (feat)
2. **Task 2 — page.tsx + VelocityCardsGrid + VelocityMiniBar (3 files, bundled for buildability per Plan 14-07 precedent)** — `4530e1d7` (feat)

**Plan metadata commit:** Pending (this SUMMARY.md + STATE.md + ROADMAP.md + VALIDATION.md update — separate commit per execute-plan workflow).

## Test Commands That Proved Each Must-Have Truth

| Truth | Test Command | Result |
|-------|--------------|--------|
| /admin/stats renders the İstatistik tab — 3 charts | `cd Frontend2 && npm run build` (admin/stats in static prerender list) | ✅ |
| Page reads useAdminStats() (Plan 14-01) | `grep -c "useAdminStats"` page.tsx → 2 (import + use) | ✅ |
| Active users trend uses recharts AreaChart with --primary stroke + linearGradient fill | `grep -c "from \"recharts\""` + `grep -c "linearGradient"` + `grep -c "var(--primary)"` active-users-trend-chart.tsx → 1 / 1 / 4 | ✅ |
| Methodology bars are pure CSS divs (NO recharts) | `grep -c "from \"recharts\""` methodology-bars.tsx → 0 | ✅ |
| Velocity per project = grid of mini-bar cards (top 30) | `grep -c "TOP_N_CAP\|slice(0, 30)"` velocity-cards-grid.tsx → 2 | ✅ |
| Velocity mini-bar last bar uses var(--primary) | `grep -c "isLast"` + `grep -c "var(--primary)"` velocity-mini-bar.tsx → 1 / 1 | ✅ |
| Velocity mini-bar other bars use var(--border-strong) | `grep -c "var(--border-strong)"` velocity-mini-bar.tsx → 1 | ✅ |
| Project key mono 10.5 (UI-SPEC §Typography line 124) | `grep -c "var(--font-mono)"` + `grep "10.5"` velocity-mini-bar.tsx → 1 / present | ✅ |
| Big-number progress 20px/600/-0.5 spacing/tabular-nums (UI-SPEC §Typography line 121) | All 4 properties present in velocity-mini-bar.tsx (`fontSize: 20`, `fontWeight: 600`, `letterSpacing: -0.5`, `fontVariantNumeric: "tabular-nums"`) | ✅ |
| All 3 chart components dynamically imported (D-C6) | `grep -c "dynamic(() => import"` page.tsx → 3 | ✅ |
| Page uses gridTemplateColumns "2fr 1fr" (UI-SPEC §Spacing line 82) | `grep -c "2fr 1fr"` page.tsx → 1 | ✅ |
| Velocity grid uses gridTemplateColumns "repeat(6, 1fr)" (UI-SPEC §Spacing line 83) | `grep -c "repeat(6, 1fr)"` velocity-cards-grid.tsx → 1 | ✅ |
| useAdminStats has staleTime 60s + refetchOnWindowFocus true (D-W1 — Plan 14-01) | Verified at hooks/use-admin-stats.ts (already shipped; `staleTime: 60 * 1000` + `refetchOnWindowFocus: true`) | ✅ |
| Active users trend tooltip shows "{date}: {N} aktif kullanıcı" | Custom Tooltip renders `{label}` + value + adminStatsT("admin.stats.tooltip_active_users_suffix", lang) | ✅ |
| Active users trend Badge shows "+P%" delta tone="success" for positive | active-users-trend-chart.tsx: `deltaTone = deltaPct > 0 ? "success" : deltaPct < 0 ? "danger" : "neutral"` + Badge with deltaSign | ✅ |
| Methodology bars colors per UI-SPEC: scrum=--status-progress, kanban=--fg-muted, waterfall=--status-review, iterative=--status-done | COLORS map in methodology-bars.tsx — all 4 token names present | ✅ |
| RTL Case 1 — 30-day mock data renders chrome (title + subtitle + Badge + chart container) | RTL test asserts "Aktif kullanıcı eğilimi" + "Son 30 gün" + role="img" present | ✅ |
| RTL Case 2 — empty trend renders empty-state copy | RTL test asserts "Son 30 günde aktivite yok." present + no role="img" | ✅ |
| RTL Case 3 — first=10 last=15 → Badge "+50%" | RTL test asserts screen.getByText("+50%") | ✅ |
| RTL Case 4 — first=20 last=10 → Badge "-50%" | RTL test asserts screen.getByText("-50%") | ✅ |
| RTL Case 5 — leading-zero baseline skip → first-non-zero=4 last=8 → "+100%" | RTL test asserts screen.getByText("+100%") | ✅ |
| TR + EN parity for all admin-stats-keys | `grep -c "    tr:"` admin-stats-keys.ts → 12; `grep -c "    en:"` → 12 | ✅ |
| Frontend2 build green | `cd Frontend2 && npm run build` exits 0 with /admin/stats in static prerender list | ✅ |
| Plan 14-08 RTL tests pass | `cd Frontend2 && npm run test -- --run active-users-trend-chart.test.tsx` → 5/5 | ✅ |

## Wave 2 Deliverables for 14-VALIDATION.md

| 14-VALIDATION row | Status |
|------------------|--------|
| 14-08-T1 (Stats page + ActiveUsersTrendChart + MethodologyBars lazy-loaded) | ✅ green (`50e49403`) |
| 14-08-T2 (VelocityCardsGrid + VelocityMiniBar — top-30 cap + last-bar primary) | ✅ green (`4530e1d7`) |

## Files Created / Modified

**Created (7 frontend):**

- `Frontend2/app/(shell)/admin/stats/page.tsx` (124 lines) — `"use client"` page reading useAdminStats() (Plan 14-01 composite endpoint per D-A7) + 3 next/dynamic chart imports per D-C6 (ssr:false + DataState loading fallback). 2-column top row (gridTemplateColumns "2fr 1fr" gap:20 — UI-SPEC §Spacing line 82) for Active users + Methodology; full-width row below for Velocity grid. DataState handles loading / error / all-empty branch (when all 3 sub-payloads are empty, single emptyFallback fires).
- `Frontend2/components/admin/stats/active-users-trend-chart.tsx` (220 lines) — recharts AreaChart with linearGradient fill (id="activeUsersTrendGradient", 0% --primary 12% → 100% transparent — verbatim UI-SPEC §Color line 163-164). Custom Tooltip per Pitfall 4 + role="img" + aria-label on container per Pitfall 12. First-non-zero baseline delta computation: `trend.find(p => p.count > 0)?.count ?? 0` baseline; deltaTone = success/danger/neutral; deltaSign = "+" or empty. Badge suppressed when trend.length === 0 (empty-state branch shows localized copy instead).
- `Frontend2/components/admin/stats/methodology-bars.tsx` (172 lines) — pure-CSS bars (verified: NO recharts import — `grep "from \"recharts\""` returns 0). 5-bucket canonical classifier (scrum/kanban/waterfall/iterative/other) with case-insensitive `m.includes("scrum")`-style matching so backend enum evolution doesn't drop categories. Color tokens per UI-SPEC §Color line 180-181: scrum=--status-progress / kanban=--fg-muted / waterfall=--status-review / iterative=--status-done / other=--fg-subtle. Iterative + other rows skipped when count===0 (keeps the typical 3-methodology team's card visually clean). Locale-aware percentage formatting: TR=%P, EN=P%.
- `Frontend2/components/admin/stats/velocity-cards-grid.tsx` (90 lines) — full-width Card wrapping a 6-col grid (gridTemplateColumns "repeat(6, 1fr)" gap:10 — UI-SPEC §Spacing line 83 + verbatim prototype admin.jsx line 464). D-X4 defensive client-side `velocities.slice(0, TOP_N_CAP)` with TOP_N_CAP=30. When `velocities.length > TOP_N_CAP` the truncation notice ("İlk 30 aktif proje gösteriliyor.") renders below the grid. Empty branch (top30.length === 0) shows the localized "Hiç proje velocity verisi yok." copy.
- `Frontend2/components/admin/stats/velocity-mini-bar.tsx` (123 lines) — pure-CSS per-project mini-card matching prototype admin.jsx lines 466-475 verbatim. Project key chip (mono 10.5 — UI-SPEC §Typography line 124, prototype line 467; truncated with ellipsis on overflow). Big-number progress (20px / 600 / -0.5 letter-spacing / tabular-nums — UI-SPEC §Typography line 121, prototype line 468). 7-bar velocity history (last 7 sliced if longer) with the LAST bar in var(--primary) and others in var(--border-strong) — verbatim prototype line 471. Defensive: empty velocityHistory renders flat 7-bar zero row; >7 entries get sliced to last 7; progress clamped to [0, 1] before percentage rendering; bar height min-2% floor so empty bars are still perceptible as a hairline.
- `Frontend2/components/admin/stats/active-users-trend-chart.test.tsx` (137 lines) — 5 RTL cases per <behavior>: (1) 30-day chrome render with title/subtitle/role="img"/aria-label; (2) empty trend renders empty-state copy + no chart container + no Badge; (3) first=10 last=15 → "+50%"; (4) first=20 last=10 → "-50%"; (5) leading-zero baseline skip — first 3 zeros + 4 → 8 = "+100%". Recharts is NOT mocked; jsdom shim (offsetWidth/offsetHeight/getBoundingClientRect overrides) makes ResponsiveContainer measure non-zero so the SVG actually mounts.
- `Frontend2/lib/i18n/admin-stats-keys.ts` (118 lines) — 12 keys with TR + EN parity (24 string values). Categories: Active users trend (3) + Methodology distribution title + 5 row labels + Velocity title + truncation notice + 2 empty states. Per-surface barrel convention from Plan 14-02 (joins admin-users-keys / admin-rbac-keys / admin-projects-keys / admin-workflows-keys / admin-audit-keys). adminStatsT(key, lang) helper with defensive fallback (missing EN → TR; missing key → key string for visible bug surfacing).

**Modified (1):**

- `.planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/14-VALIDATION.md` — rows 14-08-T1 + 14-08-T2 marked ✅ green (was ⬜ pending).

## Composite Endpoint Single-Round-Trip Pattern (D-A7)

Plan 14-01 shipped the composite GET /api/v1/admin/stats endpoint. Plan 14-08 is the only consumer.

**Why composite:** 3 charts in a single round trip amortizes admin auth + cache headers. The alternative — 3 independent fetches — would mean 3× the admin-bypass middleware cost AND introduce visible per-chart loading staggers. The composite endpoint also gives the backend the chance to share intermediate computation (the same audit_log scan can power both the active-users trend AND the methodology distribution if it ever needs to).

**Page-level slicing:** The page.tsx is the single useAdminStats() consumer; it slices the AdminStats payload into trend / distribution / velocities and passes each to the corresponding chart component as a prop. Chart components stay purely visual — no hooks, no data fetching, no service imports beyond the i18n keys + primitives.

```typescript
const data = statsQ.data
// ...
<ActiveUsersTrendChart trend={data.activeUsersTrend} />
<MethodologyBars distribution={data.methodologyDistribution} />
<VelocityCardsGrid velocities={data.projectVelocities} />
```

This keeps chart components testable in isolation (no need to mock useAdminStats — the RTL test passes a literal array) and re-usable on hypothetical future surfaces (e.g., a Faz Raporları detail view could mount ActiveUsersTrendChart with project-scoped data without touching the chart code).

## Lazy-Loaded Chart Pattern (D-C6)

All 3 chart components are dynamic-imported at the page boundary:

```typescript
const ActiveUsersTrendChart = dynamic(
  () => import("@/components/admin/stats/active-users-trend-chart")
    .then((m) => m.ActiveUsersTrendChart),
  { ssr: false, loading: () => <DataState loading>{null}</DataState> },
)
```

**Bundle impact:** the recharts AreaChart graph is ~30KB gzipped (Phase 13 D-A2 measured). With the dynamic import, that cost is paid only when the user navigates to /admin/stats — not on the /admin Overview tab where 5 StatCards are already plenty.

**ssr:false on all 3:** strictly speaking, only ActiveUsersTrendChart needs ssr:false (recharts uses browser-only DOM measurement that throws under Node SSR — Pitfall 3). MethodologyBars and VelocityCardsGrid are pure-CSS and would SSR fine. We use ssr:false uniformly across the 3 imports for bundle-split symmetry — the entire chart graph mounts as one chunk on hydration.

## D-X4 Top-30 Cap (Two-Layer Defense)

**Backend (Plan 14-01):** `Backend/app/application/use_cases/get_admin_stats.py` already caps at top 30 by recent activity when assembling project_velocities. This is the primary defense.

**Frontend (Plan 14-08):** `velocity-cards-grid.tsx` does a defensive `velocities.slice(0, TOP_N_CAP)` with TOP_N_CAP=30 as the second layer. When the slice triggers (truncated=true), a localized caption ("İlk 30 aktif proje gösteriliyor." / "Showing top 30 active projects.") is rendered below the grid.

**Why both:** during dev the backend cap is easy to forget if the velocity computation moves to a different code path. The frontend slice guarantees that even if the backend ships 100 velocities by accident, the user only sees 30 cards + a clear caption. Hostile-payload defense (an attacker who somehow manages to bypass admin auth still can't DoS the browser by sending 10K cards).

## Pure-CSS Bar Charts vs. Recharts

| Component | Library | Why |
|-----------|---------|-----|
| ActiveUsersTrendChart | recharts AreaChart | Time-series visualization with smooth curves over 30 data points. Custom Tooltip + linearGradient fill. recharts is the right tool. |
| MethodologyBars | pure CSS | Simple proportions of a small fixed set (5 buckets). Pure-CSS flex/grid is shorter, faster, and avoids ResponsiveContainer 0-size race. |
| VelocityCardsGrid | pure CSS | Layout-only (6-col grid). No chart geometry. |
| VelocityMiniBar | pure CSS | 7 bars per card × 30 cards = 210 bars total. recharts would be 30 ResponsiveContainers (heavy). Pure-CSS divs with width-as-percentage is dramatically lighter. |

**Rule of thumb established:** use recharts for time-series + tooltips + interactive curves. Use pure CSS for static proportions + simple fixed-N bars. Saves bundle weight AND avoids a class of recharts-specific bugs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Bundled page.tsx into Task 2 commit for buildability**

- **Found during:** Task 1 commit boundary
- **Issue:** Plan 14-08 PLAN.md `<files>` puts `page.tsx` in Task 1 and `velocity-cards-grid.tsx` + `velocity-mini-bar.tsx` in Task 2. But page.tsx imports velocity-cards-grid via next/dynamic — committing page.tsx in Task 1 would create a non-buildable intermediate state at the Task 1 boundary (build would fail with "Cannot find module").
- **Fix:** Bundled page.tsx into the Task 2 commit alongside the velocity components. Each commit is now individually buildable in isolation. Task 1 = chart components + i18n + RTL test (4 files); Task 2 = page.tsx + velocity-cards-grid + velocity-mini-bar (3 files). Net file count is unchanged (7 files total).
- **Files modified:** None beyond plan scope; just commit-boundary placement.
- **Precedent:** Plan 14-07 SUMMARY documents this exact reasoning ("Task 2 commit bundles admin-audit-keys.ts — strict task-by-task ordering would have left Task 2's audit-filter-modal.tsx importing a non-existent admin-audit-keys file at the Task 2 commit boundary").

### Authentication Gates

None — Plan 14-08 is read-only. The admin route guard (Plan 14-02 layout.tsx) gates access via the 3-layer admin gate (server middleware + client role check + backend require_admin); this plan adds no new auth surface.

### Architectural Changes

None.

## Self-Check: PASSED

**Files created (7) — verified via Read tool during execution:**

- ✅ Frontend2/app/(shell)/admin/stats/page.tsx
- ✅ Frontend2/components/admin/stats/active-users-trend-chart.tsx
- ✅ Frontend2/components/admin/stats/methodology-bars.tsx
- ✅ Frontend2/components/admin/stats/velocity-cards-grid.tsx
- ✅ Frontend2/components/admin/stats/velocity-mini-bar.tsx
- ✅ Frontend2/components/admin/stats/active-users-trend-chart.test.tsx
- ✅ Frontend2/lib/i18n/admin-stats-keys.ts

**Commits exist (verified via git log):**

- ✅ `50e49403` — feat(14-08): add ActiveUsersTrendChart + MethodologyBars + admin-stats i18n keys
- ✅ `4530e1d7` — feat(14-08): add /admin/stats page + VelocityCardsGrid + VelocityMiniBar

**Build / test gates:**

- ✅ `cd Frontend2 && npm run build` — exits 0; /admin/stats appears in static prerender route list (23 routes total).
- ✅ `cd Frontend2 && npm run test -- --run active-users-trend-chart.test.tsx` — 5/5 tests pass (Test Files 1 passed; Tests 5 passed).

**Acceptance criteria — Task 1:**

- ✅ Page exists, is client component, uses next dynamic import for ALL 3 chart components.
- ✅ page.tsx layout uses gridTemplateColumns "2fr 1fr" (verbatim UI-SPEC §Spacing line 82).
- ✅ active-users-trend-chart.tsx imports from "recharts".
- ✅ active-users-trend-chart.tsx uses AreaChart with --primary stroke + linearGradient fill.
- ✅ active-users-trend-chart.tsx Badge tone="success" for positive delta, tone="danger" for negative (neutral for zero).
- ✅ methodology-bars.tsx does NOT import recharts (pure CSS per UI-SPEC §Spacing line 38).
- ✅ methodology-bars.tsx COLORS map has scrum→--status-progress AND waterfall→--status-review.
- ✅ active-users-trend-chart.test.tsx asserts delta computation correctness ("+50%" + "-50%" + "+100%" cases).
- ✅ Frontend2/lib/i18n/admin-stats-keys.ts extended with 12 admin.stats.* keys.
- ✅ `cd Frontend2 && npm run test -- --run active-users-trend-chart.test.tsx` exits 0.

**Acceptance criteria — Task 2:**

- ✅ velocity-cards-grid.tsx uses gridTemplateColumns "repeat(6, 1fr)" (verbatim UI-SPEC §Spacing line 83).
- ✅ velocity-cards-grid.tsx uses `slice(0, TOP_N_CAP)` with TOP_N_CAP=30 for D-X4 cap.
- ✅ velocity-mini-bar.tsx last bar uses `var(--primary)` AND `isLast`.
- ✅ velocity-mini-bar.tsx other bars use `var(--border-strong)`.
- ✅ velocity-mini-bar.tsx project key uses mono font + 10.5px.
- ✅ velocity-mini-bar.tsx progress percentage uses 20px + fontWeight 600 + letter-spacing -0.5 + tabular-nums.
- ✅ `cd Frontend2 && npm run build` exits 0.
