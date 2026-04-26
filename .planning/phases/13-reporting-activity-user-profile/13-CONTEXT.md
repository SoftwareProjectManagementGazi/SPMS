# Phase 13: Reporting, Activity & User Profile - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver four user-facing surfaces in v2.0:

1. **Reports page advanced charts** (REPT-01..04) — global `/reports` page with project picker; CFD (Kanban-only), Lead/Cycle Time histograms with P50/P85/P95 (all methodologies), Iteration Comparison grouped bar chart (Scrum/Iterative-only), and "Faz Raporları" aggregate section.
2. **ProjectDetail Activity tab** (PROF-01) — full vertical timeline content replacing the Phase 11 stub (`activity-stub-tab.tsx`) with event icons, date grouping, type/user filters, and pagination.
3. **User Profile page** (PROF-02..04) — `/users/[id]` route with header, 3 StatCards, and Tasks/Projects/Activity tabs.
4. **Header avatar dropdown** (PROF-03) — top-right avatar in `header.tsx` with Profilim/Ayarlar/Admin Paneli/Dil/Çıkış Yap menu, **replacing** Phase 8 D-04 `SidebarUserMenu`.

**Scope (v2.0 requirements):** REPT-01..04 + PROF-01..04 (8 total, ~10 plans).

**Backend (NEW work in this phase):**
- 3 chart aggregation endpoints: `GET /api/v1/projects/{id}/charts/cfd?range=7|30|90`, `GET /charts/lead-cycle?range=…`, `GET /charts/iteration?count=…`.
- 1 user activity feed endpoint: `GET /api/v1/users/{id}/activity?type[]=…&date_from=…&limit=&offset=` — filtered by viewer's project memberships (privacy-correct).
- DTOs and integration tests for all four endpoints.

**NOT in scope:**
- Inline profile editing (Düzenle button → existing `/settings`; new edit UI is OUT).
- New Settings tabs or fields (avatar upload remains in Phase 10 D-32 Profil sub-tab).
- Real-time activity stream (WebSocket/poll out per PROJECT.md; refresh = `refetchOnWindowFocus` only).
- Notifications/email surface changes (Phase 5 / v1.0 already shipped; Phase 13 does not touch).
- Burndown chart redesign — existing v1.0 burndown is **kept on the global Reports page** alongside the new charts (NOT replaced; CFD is methodology-gated to Kanban only).
- Per-team burndown / per-user burndown (out of scope; future phase).
- Custom date range picker beyond presets (Q2 2026 chip is decorative; range options = 7d/30d/90d on charts).
- AI-powered insights / chart recommendations (v3.0 per PROJECT.md).
- Theme switching inside avatar dropdown (theme button stays in header — only Dil moves into the dropdown).
- Mobile push notifications, redesigned dashboard (out of scope — v3.0 / v2.1 candidates).

**Cross-phase contracts:**
- REPLACES Phase 11 `activity-stub-tab.tsx` with the real ActivityTab.
- REPLACES Phase 8 D-04 `SidebarUserMenu` (collapsed sidebar user menu) with header avatar dropdown.
- REUSES Phase 12 `EvaluationReportCard` inline-expand for Phase Reports section row click.
- REUSES Phase 12 `phase-report-service.ts` + `use-phase-reports.ts` (no new service; just extends call sites).
- REUSES Phase 11 D-32 `MTTaskRow compact` for User Profile Tasks tab.
- REUSES Phase 10 D-26 `ActivityFeed` compact widget (dashboard) — no changes to that surface.
- REUSES Phase 10 `ProjectCard` for User Profile Projects tab.
- REUSES Phase 10 D-09 `useAuth().logout` for sign-out flow.
- EXTENDS the `Avatar` primitive (Phase 8 D-02) with an optional `href` prop so any rendered avatar (MTTaskRow, activity row, member lists, project cards, comments) navigates to `/users/[id]` on click.

</domain>

<decisions>
## Implementation Decisions

### Quality Bar (META — applies to every plan)

- **D-00:** [informational] **Prototype-first execution; deliberate-improvement-only deviations.** Every Phase 13 page MUST port the prototype's elements verbatim into TypeScript + i18n + token-driven styles. Allowed deviations are improvements made for genuine prototype gaps (empty/error states, mobile layout, accessibility, edge cases) — each must be (a) called out by name in PLAN.md as an intentional improvement, (b) justified ("prototype shows X but lacks Y because…"), and (c) reviewed before merge. **No silent re-derivations.** Prototype source files: `New_Frontend/src/pages/activity-tab.jsx`, `user-profile.jsx`, `misc.jsx` (ReportsPage section), `shell.jsx` (avatar menu). User-stated quality bar at discuss: "I don't want any sloppy plan or execution, need this done CAREFULLY. Use prototypes all elements in related pages. AND improve design when [it] didn't [meet] enough."

### Plan Decomposition & Build Order

- **D-01:** [informational] **By-feature vertical slicing — 4 slices + 1 shared infra plan + 1 E2E plan = 10 plans.** Strawman ordering (planner refines):
  1. **Plan 13-01 — Shared infra (fat plan, Phase 12 D-02 pattern):** Backend (3 chart endpoints + `/users/{id}/activity` + DTOs + integration tests) + frontend (`chart-service.ts`, `use-cfd.ts`, `use-lead-cycle.ts`, `use-iteration.ts`, `use-user-activity.ts`, `profile-service.ts`, `use-user-summary.ts`, `npm install <chart-lib>`, `<DataState/>` 3-state primitive, base `<ChartCard/>` shell, `<AvatarDropdown/>` component scaffolding, `extendAvatarHref` patch). ~25-30 files.
  2. **Plan 13-02 — Header avatar dropdown + sidebar refactor:** Replace `SidebarUserMenu` in `Frontend2/components/sidebar.tsx` with the existing nav block; mount `<AvatarDropdown/>` in `Frontend2/components/header.tsx` top-right; wire `useAuth().logout` → push `/auth/login`; click-outside + Esc + nav-away dismiss; admin-conditional Admin Paneli item; Dil toggle inside dropdown; theme button stays in header. RTL tests for menu items + admin gating + dismiss behaviors. ~6-8 files.
  3. **Plan 13-03 — Cross-site avatar links + `<DataState/>` adoption:** Patch every `Avatar` consumer (MTTaskRow, activity rows, comments, project member lists, board cards, header initials in dropdown header) to forward an optional `href` prop linking to `/users/[id]`. Adopt `<DataState/>` primitive in already-shipped surfaces that need a refresh (dashboard ActivityFeed empty state). Cross-cutting touch-up. ~10-15 files.
  4. **Plan 13-04 — ProjectDetail Activity tab (full):** Build `<ActivityTab projectId={id} variant="full"/>` consuming `/projects/{id}/activity` with `type[]` + `user_id` + `limit/offset`; SegmentedControl filter (Tümü/Oluşturma/Durum/Atama/Yorum/Yaşam Döngüsü); user avatar filter row (clickable Avatars); date-aware grouping (Today/Yesterday/This Week/exact-date for >7 days); 30 + Daha fazla yükle; localStorage filter persistence per project (`spms.activity.filter.{projectId}`); event type → icon/color/label map for 10 types (6 prototype + milestone_created/updated, artifact_status_changed, phase_report_created); comment body up to 160 chars + ellipsis; clickable task/phase references; replace `activity-stub-tab.tsx`. ~5-7 files.
  5. **Plan 13-05 — User profile page route + Tasks tab:** New route `Frontend2/app/(shell)/users/[id]/page.tsx`; profile header (Avatar 64px + ring/`Sen` Badge if self + name/role/email + 3 stats inline + `Düzenle` → `/settings` if self); 3 StatCards row (Atanan Görevler/Tamamlanan/Projeler); Tabs primitive with badges (tasks count active, projects total, activity); Tasks tab content with prototype filter (Aktif/Tamamlanan/Tümü) + group-by-project rendered via project header card + `MTTaskRow density="compact"` rows; uses `/users/{id}/summary` for stats and `/tasks?assignee_id={id}` for task list; respects "any authenticated user sees any profile" rule. ~6-8 files.
  6. **Plan 13-06 — Profile Projects + Activity tabs:** Projects tab = grid of `ProjectCard` reused from `/projects` page; Activity tab = `<ActivityTab userId={id} variant="full"/>` consuming new `/users/{id}/activity` endpoint (privacy-filtered by viewer's project memberships); deep-link via `?tab=tasks|projects|activity` query param. ~3-5 files.
  7. **Plan 13-07 — Reports page CFD + Lead/Cycle Time charts:** Refactor `Frontend2/app/(shell)/reports/page.tsx`: top toolbar with project picker + global date-range filter (last 7d/30d/90d/Q-current with per-chart override), keep v1.0 4 StatCards + Burndown + Team Load (existing prototype layout untouched), add CFD card (Kanban-only — gated; show methodology-not-applicable AlertBanner for non-Kanban) + Lead/Cycle Time pair (all methodologies, with P50/P85/P95 markers); chart cards use `<ChartCard/>` shell + `<DataState/>` primitive; chart-shape skeletons during loading (animated shimmer); methodology gating per D-A4. ~6-9 files.
  8. **Plan 13-08 — Iteration Comparison + Faz Raporları section:** Iteration Comparison card (Scrum/Iterative-only — gated) below Lead/Cycle row, last N=4 sprints default with N override (3/4/6); Faz Raporları section with 2 sub-tabs (Aktif + Tamamlanan / Arşivlenmiş) each containing project + phase picker on top + recent across-projects rows below; click a row → inline expand using Phase 12 `EvaluationReportCard` (read-only mode); empty state inline message + `Yaşam Döngüsü → Geçmiş` deep link. ~5-7 files.
  9. **Plan 13-09 — Mobile breakpoints + accessibility polish + cross-cutting:** Apply Phase 11 D-54 1024px collapse pattern to Reports grid + Profile 3-col → 1fr; add ≤640px specific layouts (chart heights tighter, profile header stacked, activity rows denser); a11y for charts (`aria-label` per data point + tabular fallback toggle), avatar dropdown (Tab focus, Arrow nav within menu, Enter activates), tabs primitive (existing — verify Phase 11 a11y), date pickers; cross-page testing pass. ~8-10 files.
  10. **Plan 13-10 — E2E smoke + UAT artifact (Phase 11 D-50 pattern):** Playwright smoke specs (charts render with mock data, activity tab loads + filter persists, profile loads with own/other user, avatar dropdown logout flow, phase reports section opens) ships with defensive skip-guards (no test-DB seeder yet). Manual UAT checklist artifact (`13-UAT-CHECKLIST.md`, ~15-20 rows for REPT-01..04 + PROF-01..04) for `/gsd-verify-work 13` pass. ~3-4 files.

### Charts — Reports Page (REPT-01..03)

- **D-A1:** **Global `/reports` page + project picker at top.** Single `Frontend2/app/(shell)/reports/page.tsx` with project dropdown sourced from `GET /projects?status=ACTIVE,COMPLETED`. Charts re-fetch on selection. Aggregates (Faz Raporları section) span all accessible projects.
- **D-A2:** **Lightweight charting library — researcher picks (recharts vs visx vs nivo) based on bundle / React 19 / Next 16 compatibility.** Constraint: chart container visuals (card padding, header layout, legend chips, footer mono metrics) MUST match the prototype `New_Frontend/src/pages/misc.jsx` ReportsPage chart cards. Library handles geometry + tooltip polish only; tokens (oklch color-mix, font-mono, --status-* / --priority-* / --primary) drive every visible style. Inline custom SVG retained for the existing Burndown card (don't refactor working code).
- **D-A3:** **3 new backend chart endpoints.** Clean Architecture vertical slice each (Domain queries, Application use cases, API routers, integration tests). One use case per endpoint (Single Responsibility per CLAUDE.md §4.1):
  - `GET /api/v1/projects/{id}/charts/cfd?range=7|30|90` → `{ days: [{ date, todo, progress, review, done }, …], avg_wip, avg_completion_per_day }`. SQL: aggregate audit_log status_changes per day per status_id; project-member gate via `Depends(get_project_member)`.
  - `GET /api/v1/projects/{id}/charts/lead-cycle?range=7|30|90` → `{ lead: { avg_days, p50, p85, p95, buckets: [{ range, count }] }, cycle: { … } }`. SQL: compute lead_time = done.timestamp - created.timestamp, cycle_time = done.timestamp - in_progress.timestamp from audit_log; bucket into prototype's 5 ranges (0-1d/1-3d/3-5d/5-10d/10d+).
  - `GET /api/v1/projects/{id}/charts/iteration?count=3|4|6` → `{ sprints: [{ id, name, planned, completed, carried }, …] }`. SQL: query last N sprints + count tasks per sprint by initial vs final status.
  - All endpoints honor v1.0 SEC-09 RBAC (project member only) + Phase 9 error taxonomy (`error_code`).
- **D-A4:** **Strict methodology gating per roadmap text.** Frontend-side check on `project.methodology`:
  - **CFD** = Kanban-only. Other methodologies show an inline AlertBanner (info tone): "Kümülatif Akış Diyagramı yalnızca Kanban projeleri için geçerlidir."
  - **Iteration Comparison** = Scrum + Iterative + Incremental + Evolutionary + RAD (any methodology with cycle entities). Other methodologies hide the card entirely (no AlertBanner — gate by simple conditional render).
  - **Lead/Cycle Time** = all methodologies. Always rendered.
  - **Burndown** (existing v1.0) = stays on the page for Scrum projects (current behavior preserved). No methodology change.

### Charts — Time-Range Filtering (D-G1)

- **D-A5:** **Global page-level filter + per-chart override.** Top of `/reports` page renders a `<DateRangeFilter/>` chip strip (Last 7d / Last 30d / Last 90d / This Quarter — with the prototype Q2 2026 button as the "This Quarter" option). All charts read this global value as their default range. Each chart card has a small SegmentedControl in its header that, when adjusted, overrides the global value FOR THAT CARD ONLY (does not write back to global). Iteration Comparison's range UI is N=3/4/6 sprints (different unit) — independent SegmentedControl in its card header.
- **D-A6:** **Range UI defaults:** Global = Last 30d; CFD card override = 30d (matches global on init); Lead/Cycle = global default; Iteration = 4 sprints (prototype default).

### Activity Tab (PROF-01)

- **D-B1:** **10 event types — prototype 6 + lifecycle 4.** Surfaced in timeline + filter SegmentedControl:
  - Prototype 6: `task_created`, `task_status_changed`, `task_assigned`, `comment_created`, `task_deleted`, `phase_transition`.
  - Lifecycle 4: `milestone_created`, `milestone_updated`, `artifact_status_changed`, `phase_report_created`.
  - Filter SegmentedControl options: Tümü / Oluşturma (task_created) / Durum (task_status_changed) / Atama (task_assigned) / Yorum (comment_created) / Yaşam Döngüsü (phase_transition + the 4 lifecycle types). Other audit_log action types are silently ignored on render.
- **D-B2:** **30 + Daha fazla yükle button** (prototype line 184). Initial fetch `limit=30 offset=0`; click button → next 30 (`limit=30 offset=30`, accumulate). No infinite scroll. No pagination controls.
- **D-B3:** **Refresh = TanStack `refetchOnWindowFocus: true` only.** No polling; no manual refresh button. When user re-focuses the tab, query refetches automatically.
- **D-B4:** **Single `<ActivityTab projectId? userId? variant />` component.** Component routes its query based on which prop is set:
  - `projectId` → `GET /api/v1/projects/{id}/activity` (existing Phase 9 D-46/47 endpoint).
  - `userId` → `GET /api/v1/users/{id}/activity` (NEW Phase 13 endpoint, see D-A3 / Backend Extension).
  - Mutually exclusive (TypeScript discriminated union).
  - `variant="full"` (default) = vertical timeline; `variant="compact"` = simple list (matches prototype line 77-97).
- **D-B5:** **Date-aware grouping.** Today / Yesterday / This Week / then exact date `15 Nis 2026` for events older than 7 days. Localized via `useApp().language`.
- **D-B6:** **Comment body preview = full body up to 160 chars + ellipsis.** Renders inside a tinted block (`background: var(--surface-2)` + inset shadow border, prototype line 171-175). Click event row → navigate to task-detail#comments anchor.
- **D-B7:** **Filter persistence in localStorage per project.** Key: `spms.activity.filter.{projectId}` for project tab; `spms.activity.filter.user.{userId}` for user profile activity tab. Stores `{ type, userIdFilter, showCount }`. Phase 11 D-21 density-mode pattern (per-project localStorage). On profile re-mount the filter is rehydrated.
- **D-B8:** **Compact variant reused on dashboard?** No — dashboard already uses Phase 10 D-26 `ActivityFeed`. The Phase 13 `<ActivityTab variant="compact"/>` is reserved for future compact placements. Phase 13 ships only the `variant="full"` site of the component.

### User Profile (PROF-02)

- **D-C1:** **Read-only profile + `Düzenle` → `/settings` (prototype line 47).** No inline edit UI; the existing Phase 10 D-32 Settings page owns all profile editing.
- **D-C2:** **Privacy: any authenticated user sees any profile (full).** Backend `/users/{id}/summary` returns the full payload regardless of viewer. Tasks tab queries `/tasks?assignee_id={id}` (no viewer filter — assigned tasks visible to all). Projects tab queries the user's project memberships (visible to all). The activity tab is the ONLY surface that filters by viewer's project visibility — see D-C7.
- **D-C3:** **Route shape: `/users/[id]` only.** Avatar dropdown "Profilim" resolves client-side to `/users/{currentUser.id}`. Same Next.js route handles self + other; component reads `userId === currentUser.id` to render the `Sen` badge + Düzenle button.
- **D-C4:** **Tasks tab: prototype filter + group-by-project (lines 65-101).** `SegmentedControl` (Aktif / Tamamlanan / Tümü); inside each filter, tasks rendered grouped by project — each project shows a header card (color dot + key + name + count badge) and below it `MTTaskRow density="compact"` rows. Click row → navigate to `/projects/[projectId]/tasks/[taskId]` (Phase 11 task detail route).
- **D-C5:** **Projects tab reuses Phase 10 ProjectCard.** Renders a 3-column grid (matches `/projects` list); cards link to `/projects/[id]`. No new variant.
- **D-C6:** **Self-profile cues: ring on Avatar AND `Sen`/`You` Badge** (prototype line 38-39). Both. Strong self-identification. Other users' profiles get neither.
- **D-C7:** **Activity tab on profile: `/users/{id}/activity` filtered by viewer's project memberships.** New backend endpoint (Phase 13 scope). Backend joins audit_log → projects user has membership in → returns only events the viewer is allowed to see. Filters: `type[]` + `date_from/to` + `limit/offset`. Privacy-correct: a non-member never sees task events from a project they can't access.
- **D-C8:** **3 StatCards on profile header.** Atanan Görevler (active count) / Tamamlanan (done count + percentage rate) / Projeler (total count + lead count). Sourced from `/users/{id}/summary` stats. Reuses existing `StatCard` component from `Frontend2/components/dashboard/stat-card.tsx`.

### Header Avatar Dropdown (PROF-03)

- **D-D1:** **Header-only avatar dropdown — replaces Phase 8 D-04 SidebarUserMenu.** Mount `<AvatarDropdown/>` in `Frontend2/components/header.tsx` top-right (between language toggle and end of header). Remove `SidebarUserMenu` from `Frontend2/components/sidebar.tsx`; the sidebar footer area becomes a pure nav region (or empty) per prototype `shell.jsx` lines 100-155 reading.
- **D-D2:** **5 menu items (user-customized):**
  1. Profilim → `/users/{currentUser.id}`
  2. Ayarlar → `/settings`
  3. Admin Paneli → `/admin` (visible only when `useAuth().user.role === 'Admin'`)
  4. Dil → in-menu submenu/toggle for TR/EN (replaces or supplements the existing header language button — see Claude's Discretion below)
  5. Çıkış Yap → `useAuth().logout()` → `router.push('/auth/login')`
  Theme toggle stays as a header button (NOT moved into dropdown).
- **D-D3:** **Sign-out target: `/auth/login` cleanly.** Phase 10 D-09 `useAuth().logout()` clears localStorage token; `router.push('/auth/login')` immediately after. No success toast (cleanest UX).
- **D-D4:** **All site-wide Avatar primitives clickable → `/users/[id]`.** Extend `Frontend2/components/primitives/avatar.tsx` with optional `href` prop. Patch every consumer (MTTaskRow assignee column, ActivityTab actor, project member lists, comment author, board card assignee, AvatarStack rows) to forward `href={`/users/${user.id}`}` when a user id is present. Plan 13-03 owns this cross-cutting patch.
- **D-D5:** **Dropdown header = mini profile card** (matches prototype `shell.jsx` lines 100-110): Avatar 32px + name (font-weight 600) + role Badge (tone by role) + email row (small, fg-muted). Dropdown total width ~260px.
- **D-D6:** **Initials fallback = first letter of first + last name** ("Yusuf Bayrakcı" → "YB"). Phase 8 D-02 Avatar primitive already implements this; verify no regression.
- **D-D7:** **Dismiss = click-outside + Esc + nav-away** (full robustness): document `mousedown` listener (Phase 8 D-04 pattern) + `keydown` Escape + Next.js `router.events`-equivalent (Next.js 16 has no `router.events`; use a `usePathname()` effect that closes the menu when pathname changes).
- **D-D8:** **Open trigger:** click on header avatar OR keyboard Enter when avatar focused. Tab-focusable; `aria-haspopup="menu"`; `aria-expanded` toggled.

### Faz Raporları Section (REPT-04)

- **D-E1:** **Hybrid layout — picker + recent rows, inside a 2-tab outer Tabs primitive.** Section structure on the global `/reports` page:
  - Outer `<Tabs/>` with two tabs: "Aktif + Tamamlanan" (default) and "Arşivlenmiş".
  - Each tab's content: top row = project picker + phase picker (cascading); below = "Son raporlar" list of rows (5 most recent across all projects in that tab's status set).
  - Picking project + phase auto-loads the chosen phase's `PhaseReport` row (or empty state per D-E4).
  - The recent rows list is independent of the picker — clicking a row also expands its report inline.
- **D-E2:** **Click row → inline expand using Phase 12 EvaluationReportCard (read-only mode).** Reuses existing component from `Frontend2/components/lifecycle/evaluation-report-card.tsx`. Inline expand renders the metrics/issues/lessons/recommendations + PDF download button (Phase 12 D-58 path). Card is read-only on the Reports page; PM editing happens only from the project's Lifecycle > Geçmiş tab.
- **D-E3:** **Visibility rule: 2-tab split based on project status.**
  - Tab 1 "Aktif + Tamamlanan" pulls projects with `status IN (ACTIVE, COMPLETED)`.
  - Tab 2 "Arşivlenmiş" pulls projects with `status=ARCHIVED`.
  - Source endpoint: `GET /projects?status=ACTIVE,COMPLETED,ARCHIVED` (filter applied client-side per tab) OR two queries with the existing status filter (Phase 10 D-26 already supports `?status=`). Planner picks based on cache key strategy.
- **D-E4:** **Empty state when picked project+phase has no PhaseReport.** Inline message: "Bu faz için rapor oluşturulmamış. Oluşturmak için projenin Yaşam Döngüsü → Geçmiş sekmesine gidin." + a button "Yaşam Döngüsü'ne git" that deep-links to `/projects/[id]?tab=lifecycle&sub=history`. No inline create from the Reports page (PM-only inline create deferred — see Deferred Ideas).

### Mobile Breakpoints & Responsive (D-G2)

- **D-F1:** **Phase 11 D-54 base pattern + ≤640px additional layouts.** All Phase 13 surfaces respect:
  - **≤1024px:** Reports grid (1.5fr/1fr) collapses to 1fr column-stack; Profile 3-col StatCards collapse to 1fr (or 2-col on tablet); ProjectDetail Activity timeline left-pad reduced; sidebar auto-collapses.
  - **≤640px:** Reports chart heights tighter (CFD = 160px; Lead/Cycle = 120px; Iteration = 140px); Profile header stacks (avatar above name+stats, not side-by-side); Activity timeline event rows compress (avatar 22px instead of 28px, no event meta icon overlap); avatar dropdown width adapts to viewport.
  - Pure CSS classes in `globals.css` — no `useMediaQuery`, no hydration mismatch (matches Phase 11 D-54 implementation).

### Empty / Error / Loading States (D-G3, D-G4)

- **D-F2:** **Standardized 3-state primitive `<DataState/>`** at `Frontend2/components/primitives/data-state.tsx`. Props: `loading?, error?, empty?, children` (slots). Usage:
  ```
  <DataState
    loading={query.isLoading}
    loadingFallback={<ChartSkeleton/>}
    error={query.error}
    errorFallback={<RetryAlert/>}
    empty={!data?.length}
    emptyFallback={<EmptyMessage icon={Icons.Folder}/>}
  >
    <ChartContent data={data}/>
  </DataState>
  ```
  Adopted by every chart card, activity timeline, profile tab content, and Faz Raporları section. ~30 lines of glue code; consistent UX site-wide.
- **D-F3:** **Chart skeletons match chart shape with animated shimmer.** Each chart has its own skeleton component matching the chart's bounding box: CFD = 4-band stacked area shimmer; Lead/Cycle = 5-bar histogram shimmer; Iteration = 3-group bar shimmer. Skeleton lives in the same file as the chart card (`*-skeleton.tsx` or inline). Phase 11 skeleton-shimmer pattern reused (CSS `@keyframes shimmer`).
- **D-F4:** **Activity tab empty state.** When 0 events match the filter: render the prototype's empty message (line 190-194) "Bu filtreyle eşleşen olay yok." with `Icons.Activity` muted. When 0 events total: friendly "Henüz aktivite yok." + small CTA "Bir görev oluştur".

### Backend Additions (NEW endpoints — Phase 13 scope)

- **D-X1:** **`GET /api/v1/projects/{id}/charts/cfd`** — query `range: int = 30` (validated 7|30|90), member-gated. Returns daily snapshot `[{date: ISO, todo: int, progress: int, review: int, done: int}]` for the requested range plus `avg_wip` and `avg_completion_per_day` summary metrics. Use case `GetProjectCFDUseCase` in `Backend/app/application/use_cases/`. SQL: aggregate `audit_log.action='task_status_changed'` rows + current task statuses; computed daily via `generate_series`-style query.
- **D-X2:** **`GET /api/v1/projects/{id}/charts/lead-cycle`** — query `range: int = 30`, member-gated. Returns `{lead: {avg_days, p50, p85, p95, buckets: [{range, count}]}, cycle: {…}}`. Buckets: 0-1d / 1-3d / 3-5d / 5-10d / 10d+ (prototype line 455). Use case `GetProjectLeadCycleUseCase`.
- **D-X3:** **`GET /api/v1/projects/{id}/charts/iteration`** — query `count: int = 4` (validated 3|4|6), member-gated. Scrum/Iterative/Incremental/Evolutionary/RAD methodologies only — non-cycle methodologies return HTTP 422 `INVALID_METHODOLOGY` (similar to Phase 9 error taxonomy). Returns `{sprints: [{id, name, planned: int, completed: int, carried: int}]}` for the last N sprints. Use case `GetProjectIterationUseCase`.
- **D-X4:** **`GET /api/v1/users/{id}/activity`** — query `type[]`, `user_id` (no — viewer is from auth), `date_from/to`, `limit=30`, `offset=0`. Returns `ActivityResponseDTO` (reused from Phase 9). Filtered by VIEWER's project memberships (privacy-correct): backend joins `audit_log` with `team_projects` for the viewer's user_id and includes only audit rows scoped to projects the viewer can see. Use case `GetUserActivityUseCase` in `Backend/app/application/use_cases/`. Pagination capped at 200 (Phase 9 DoS mitigation).
- **D-X5:** **All 4 endpoints follow Phase 9 conventions:**
  - Clean Architecture vertical slice (Domain, Application, Infrastructure, API).
  - DI via `Depends(get_project_member)` or `Depends(get_current_user)`.
  - Page size capped at 200.
  - `error_code` taxonomy on errors.
  - Integration tests in `Backend/tests/integration/` (in-memory fakes per Phase 12 D-09 pattern; no DB dependency).

### Claude's Discretion

- **Chart library specifics** — researcher picks recharts vs visx vs nivo vs another. Constraints: bundle <120KB gzip preferred, React 19 + Next 16 compat, theming via inline style (oklch tokens), zero deps on `style-components`/`emotion`. Document rationale + pinned version.
- **Date range UI primitive** — the global `<DateRangeFilter/>` chip strip. Choose between SegmentedControl reuse (Phase 11 pattern) or new chip-style picker. Both acceptable.
- **Iteration N override** — exact UI for the per-card N=3/4/6 picker. Inline SegmentedControl or dropdown.
- **Dropdown animation** — open/close transition (slide-down 150ms or fade). Match prototype if implemented; otherwise default to fade.
- **Initials avatar background color** — the existing `avColor: 1..8` mapping in `Avatar` primitive already handles this. No change needed.
- **Mobile dropdown behavior** — on ≤640px the avatar dropdown could be a full-screen sheet; default to anchored dropdown (matches desktop) unless the planner finds a UX issue.
- **PDF download from Reports page Faz Raporları rows** — Phase 12 D-58 path is fully wired. Reuse without changes; row's PDF button calls `useDownloadPhaseReportPdf({reportId})`.
- **Dashboard activity feed link to project activity tab** — add a "View all" → `/projects/[id]?tab=activity` link in the dashboard ActivityFeed header? Not strictly Phase 13 scope; planner can add as a small enhancement if it doesn't slip the plan.
- **Tabs query param shape** — `?tab=tasks|projects|activity` on profile, `?tab=charts|reports` on /reports global page. Match Phase 11 D-04 ProjectDetail pattern (`?tab=board|list|...`).
- **Skeleton shimmer keyframe values** — match Phase 11; if no canonical pattern, use 1.5s linear infinite with -200% to 200% gradient.
- **Avatar `href` prop propagation in AvatarStack** — when AvatarStack renders multiple users, each underlying Avatar should still link individually; AvatarStack's overflow chip ("+3") doesn't link.

### Folded Todos

None — `gsd-sdk todo.match-phase 13` is broken in this environment (sdk module missing); STATE.md "Pending Todos" section reads "None within Phase 12" so no Phase 13-relevant pending todos exist as of 2026-04-25 snapshot.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prototype Source Files (design authority — port verbatim per D-00)

- `New_Frontend/src/pages/activity-tab.jsx` (full file, ~200 lines) — **Authoritative for ActivityTab visuals + interactions.** Variant prop, eventMeta map, relTime, group-by-date logic, SegmentedControl filter, user avatar filter row, vertical-line timeline layout, comment-body inline render, status-change badge pair, "Daha fazla yükle" button. Phase 13 ports verbatim into TypeScript + i18n + token styles.
- `New_Frontend/src/pages/user-profile.jsx` (full file, ~120 lines) — **Authoritative for UserProfilePage layout.** Header card with Avatar 64 + ring + role badge + Sen badge + email + 3 inline metrics + Düzenle button; 3 StatCards row; Tabs primitive; Tasks tab with filter + group-by-project + grid rows; Projects tab reusing ProjectCard; Activity tab via `<ActivityTab variant="full"/>`.
- `New_Frontend/src/pages/misc.jsx` lines 356-535 — **Authoritative for ReportsPage layout.** Header (Q2 2026 chip + PDF button); 4 StatCards row; Burndown SVG + Team Load card grid (KEEP unchanged); CFD card with 7/30/90 SegmentedControl + stacked area SVG; Lead/Cycle Time card pair with histograms + percentile mono row; Iteration Comparison grouped bar SVG; Faz Raporları section structure.
- `New_Frontend/src/shell.jsx` lines 100-155 — **Authoritative for AvatarDropdown.** Mini-profile header (Avatar 32 + name + role badge + email), menu items, click-outside dismiss pattern, role-conditional Admin Paneli row.
- `jira_workflow.jpeg` (project root) — Visual reference for Phase 12 (NOT Phase 13). Skip.

### Frontend2 Existing Code (build on top of)

- `Frontend2/components/project-detail/activity-stub-tab.tsx` — Phase 11 stub. Phase 13 REPLACES content (Plan 13-04).
- `Frontend2/components/sidebar.tsx` `SidebarUserMenu` (Phase 8 D-04) — Phase 13 REPLACES with header dropdown (Plan 13-02).
- `Frontend2/components/header.tsx` — Phase 13 MOUNTS `<AvatarDropdown/>` top-right (Plan 13-02).
- `Frontend2/app/(shell)/reports/page.tsx` — Phase 13 REWRITES (Plan 13-07/08).
- `Frontend2/components/my-tasks/task-row.tsx` (Phase 11 D-32) — `<MTTaskRow density="compact"/>` REUSED for Profile Tasks tab (D-C4).
- `Frontend2/components/my-tasks/project-card.tsx` (or wherever Phase 10 ProjectCard lives — verify path) — REUSED for Profile Projects tab (D-C5).
- `Frontend2/components/dashboard/activity-feed.tsx` (Phase 10 D-26) — UNCHANGED on dashboard; not the same component as the new `<ActivityTab variant="full"/>`.
- `Frontend2/components/dashboard/stat-card.tsx` — REUSED for profile header 3 StatCards.
- `Frontend2/components/lifecycle/evaluation-report-card.tsx` (Phase 12 D-57) — REUSED in read-only mode for Faz Raporları section row expand.
- `Frontend2/services/phase-report-service.ts` + `Frontend2/hooks/use-phase-reports.ts` (Phase 12) — REUSED for Faz Raporları section.
- `Frontend2/components/primitives/` — All 16 primitives reused (Tabs, SegmentedControl, Card, Button, AlertBanner, Badge, Avatar, StatusDot, Kbd, ProgressBar, Toggle, Collapsible, Section, Input, PriorityChip, Container).
- `Frontend2/context/auth-context.tsx` `useAuth()` (Phase 10) — Used for `currentUser` in profile, role gating in dropdown, logout.
- `Frontend2/context/app-context.tsx` `useApp()` — Language for i18n.
- `Frontend2/services/project-service.ts` — REUSED for project picker on /reports.
- `Frontend2/services/task-service.ts` — REUSED for profile Tasks tab queries.

### Frontend2 New Files (non-exhaustive — planner may add)

- `Frontend2/app/(shell)/users/[id]/page.tsx` — User profile route.
- `Frontend2/components/profile/profile-header.tsx`, `profile-tasks-tab.tsx`, `profile-projects-tab.tsx`.
- `Frontend2/components/activity/activity-tab.tsx` (canonical), `activity-row.tsx`, `activity-filter.tsx`, `activity-empty.tsx`.
- `Frontend2/components/reports/cfd-chart.tsx`, `lead-cycle-chart.tsx`, `iteration-chart.tsx`, `chart-card.tsx`, `phase-reports-section.tsx`, `date-range-filter.tsx`.
- `Frontend2/components/shell/avatar-dropdown.tsx` (replaces SidebarUserMenu).
- `Frontend2/components/primitives/data-state.tsx` — 3-state primitive.
- `Frontend2/services/chart-service.ts`, `profile-service.ts` (extend or new).
- `Frontend2/hooks/use-cfd.ts`, `use-lead-cycle.ts`, `use-iteration.ts`, `use-user-activity.ts`, `use-user-summary.ts`, `use-project-activity.ts` (refactor existing if duplicated).
- `Frontend2/lib/charts/buckets.ts` — Lead/Cycle bucket constants + percentile helpers.

### Backend Existing (Phase 9 + Phase 12 — already wired)

- `Backend/app/api/v1/activity.py` — `GET /projects/{id}/activity` + `GET /activity` (admin global). Phase 13 ADDS `/users/{id}/activity` to this router (or new file `Backend/app/api/v1/users.py` next to existing `/users/{id}/summary`).
- `Backend/app/api/v1/users.py` — `GET /users/{id}/summary` (Phase 9 API-03). Reused.
- `Backend/app/api/v1/phase_reports.py` — Phase 12 PhaseReport CRUD + PDF.
- `Backend/app/api/v1/projects.py` — Project CRUD with status filter (Phase 10 D-26).

### Backend Extension (Phase 13 NEW)

- **NEW** `Backend/app/api/v1/charts.py` — chart aggregation router (mounted at `/api/v1`); 3 endpoints: cfd / lead-cycle / iteration.
- **NEW** `Backend/app/application/use_cases/get_project_cfd.py`, `get_project_lead_cycle.py`, `get_project_iteration.py`, `get_user_activity.py`.
- **NEW** `Backend/app/application/dtos/chart_dtos.py` — `CFDResponseDTO`, `LeadCycleResponseDTO`, `IterationResponseDTO`.
- **EXTEND** `Backend/app/api/v1/users.py` — add `GET /users/{user_id}/activity` route.
- **EXTEND** `Backend/app/domain/repositories/audit_repository.py` (or task_repository / project_repository) — add aggregation queries for chart data and user-activity privacy filter.
- **EXTEND** `Backend/app/api/deps/` — new `get_chart_repo` if a separate repository emerges.

### Project Context

- `.planning/PROJECT.md` — v2.0 milestone goal, design freeze, 100% prototype-fidelity rule, Out of Scope (real-time WebSocket, etc.).
- `.planning/REQUIREMENTS.md` REPT-01..04 + PROF-01..04 — formal requirements & traceability table.
- `.planning/STATE.md` — Phase 12 plans complete + UAT deferred; no Phase 13 pending todos in current snapshot.
- `.planning/codebase/ARCHITECTURE.md` — Clean Architecture layer rules (Domain → Application → Infrastructure → API; one-way deps).
- `.planning/codebase/CONVENTIONS.md` — Naming (snake_case files / PascalCase classes / I-prefix interfaces / DTO suffix).
- `.planning/codebase/STACK.md` — FastAPI / SQLAlchemy async / Next.js 16 / React 19 / TanStack Query v5 / Tailwind v4.
- `.planning/codebase/TESTING.md` — Pytest + integration test conventions (Phase 11/12 patterns).
- `.planning/phases/09-backend-schema-entities-apis/09-CONTEXT.md` — Phase 9 D-46/47 activity endpoint shape, D-48 user summary shape, error taxonomy. Phase 13 mirrors these patterns.
- `.planning/phases/10-shell-pages-project-features/10-CONTEXT.md` — Phase 10 D-26 ActivityFeed dashboard widget, D-09 useAuth.logout, D-25 ConfirmDialog. Phase 13 reuses.
- `.planning/phases/11-task-features-board-enhancements/11-CONTEXT.md` — Phase 11 D-32 MTTaskRow compact (CRITICAL — Profile Tasks tab dependency), D-21 localStorage per-project pattern, D-54 mobile breakpoint pattern, D-50 E2E with skip-guards.
- `.planning/phases/12-lifecycle-phase-gate-workflow-editor/12-CONTEXT.md` — Phase 12 D-02 fat infra plan, D-04 unit+RTL no-E2E pattern, D-57 EvaluationReportCard auto-prefill, D-58 PDF rate-limit + download pattern, D-09 in-memory fakes for backend integration tests.
- `Frontend2/CLAUDE.md` + `Frontend2/AGENTS.md` — "This is NOT the Next.js you know. Read `node_modules/next/dist/docs/` before writing code. Heed deprecation notices." Phase 13 chart library install + new route both touch this.

### Research Items (for gsd-phase-researcher)

- **Chart library evaluation** — recharts 2.x vs visx 3.x vs nivo 0.85+ vs custom SVG: bundle size after tree-shake, React 19 + Next 16 compat (peer dep + RSC behavior), oklch token support (some lib defaults override; need inline style override), tooltip primitives, animation deltas. Recommend a winner with pinned version.
- **CFD aggregation SQL strategy** — daily snapshot via on-the-fly query vs materialized view vs daily cron. Phase 13 ships on-the-fly first; document scaling cliff (~200 events/day per project breaks at).
- **Lead/Cycle Time computation from audit_log** — confirm audit_log writes `task_status_changed` rows with old/new status_id; compute lead = first 'created' to first 'done' status; cycle = first 'in_progress' to first 'done'. Edge cases: tasks moved back to in_progress after done; tasks with no in_progress event.
- **`/users/{id}/activity` privacy filter SQL** — JOIN audit_log against viewer's project memberships through TeamProjects; correct handling of admin viewers (bypass filter); performance for large projects.
- **Mobile chart sizing** — actual breakpoint values + chart aspect ratios at ≤640px. Fetch existing media queries from `Frontend2/app/globals.css` to understand the established system.
- **DataState primitive design** — confirm a 3-prop slot pattern is idiomatic in TypeScript + React 19 (no `<Suspense/>` swap needed).
- **Cross-page avatar `href` propagation** — list every Avatar consumer (grep `<Avatar`); confirm zero TypeScript regressions when `href` becomes optional.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **All 16 Frontend2 primitives** — Used across every Phase 13 surface. No new primitive needed except `<DataState/>` and `<AvatarDropdown/>`.
- **MTTaskRow compact (Phase 11 D-32)** — Profile Tasks tab uses density="compact". Already supports interactive status, priority chip, due, avatar.
- **ActivityFeed dashboard widget (Phase 10 D-26)** — UNCHANGED. Phase 13 builds a separate `<ActivityTab/>` for the project + profile tabs.
- **EvaluationReportCard (Phase 12 D-57)** — Reused in read-only mode for Faz Raporları row expand.
- **phase-report-service + use-phase-reports (Phase 12)** — Reused.
- **StatCard (dashboard)** — Reused for profile header 3 StatCards.
- **ProjectCard (Phase 10)** — Reused for profile Projects tab.
- **ConfirmDialog (Phase 10 D-25)** — May be needed for sign-out confirm; default = no confirm (cleanest).
- **ToastProvider (Phase 10 D-07)** — Available for chart fetch errors and avatar dropdown actions.
- **useAuth() (Phase 10)** — Provides `currentUser`, `logout()`, role for conditional Admin Paneli.
- **useApp() (Phase 8)** — Language + theme + sidebarCollapsed.
- **TanStack Query v5** — All chart + activity + profile fetches; `refetchOnWindowFocus` per D-B3.

### Established Patterns

- **`"use client"` directive** on every interactive component.
- **Named exports** (`export function X`).
- **`@/` path alias**.
- **Inline styles with CSS tokens** (oklch + var(--*) — preserved everywhere).
- **Service layer + hooks layer** (Phase 10/11 pattern).
- **Optimistic updates** — not needed in Phase 13 (charts are read-only; profile is read-only; avatar dropdown actions are nav-only).
- **Error code taxonomy** — Phase 9 convention reused for new chart endpoints.
- **Schema versioning** — N/A; no JSONB schema bumps in Phase 13.
- **Phase 11 D-21 localStorage per-project pattern** — applied to D-B7 activity filter persistence.
- **Phase 11 D-54 mobile breakpoint pattern** — extended to ≤640px in D-F1.
- **Phase 12 D-02 fat infra plan pattern** — applied to Plan 13-01.
- **Phase 12 D-04 unit + RTL test pattern** — applied to all Phase 13 plans except 13-10 (which adds E2E).

### Integration Points

- **`Frontend2/components/header.tsx`** — MOUNT `<AvatarDropdown/>` top-right (Plan 13-02).
- **`Frontend2/components/sidebar.tsx`** — REMOVE `SidebarUserMenu` (Plan 13-02).
- **`Frontend2/components/project-detail/activity-stub-tab.tsx`** — REPLACE with `<ActivityTab projectId={id} variant="full"/>` (Plan 13-04).
- **`Frontend2/app/(shell)/reports/page.tsx`** — REWRITE (Plan 13-07/08).
- **`Frontend2/app/(shell)/users/[id]/page.tsx`** — NEW route (Plan 13-05).
- **`Frontend2/components/primitives/avatar.tsx`** — EXTEND with optional `href` prop (Plan 13-03).
- **Every existing `<Avatar/>` consumer** — patch to forward `href={`/users/${userId}`}` when user id is available (Plan 13-03 — cross-cutting).
- **`Backend/app/api/v1/users.py`** — ADD `GET /users/{id}/activity` route (Plan 13-01).
- **NEW** `Backend/app/api/v1/charts.py` — 3 endpoints (Plan 13-01).
- **NEW** `Backend/app/application/use_cases/get_project_cfd.py` + `get_project_lead_cycle.py` + `get_project_iteration.py` + `get_user_activity.py` (Plan 13-01).

### Cross-File Dependency Rules

- Chart endpoints (D-X1..3) and `/users/{id}/activity` (D-X4) MUST land before any frontend chart card / profile activity tab consumes them.
- Avatar `href` prop MUST be optional with default behavior unchanged — no consumer can break (D-D4 strict).
- `<DataState/>` primitive MUST be in place before chart skeletons or activity empty states adopt it.
- Phase 12 `EvaluationReportCard` MUST be readable in a non-Lifecycle context (Plan 13-08 verifies — re-render tests in Reports page mount).
- SidebarUserMenu removal MUST be coordinated with header AvatarDropdown mount (single plan, Plan 13-02) to avoid a state where neither exists.
- New chart endpoints MUST honor existing project-member gating + error taxonomy (Phase 9 patterns).
- New `/users/{id}/activity` endpoint MUST filter by VIEWER's project memberships, not target user's (privacy correctness, D-C7).
- Avatar dropdown's "Profilim" link MUST resolve at click-time to `/users/{currentUser.id}` (not server-rendered) — `currentUser` is client-only (`useAuth()`).

</code_context>

<specifics>
## Specific Ideas

- **"Use prototype's all elements in related pages"** (D-00 quality bar, user-stated): Every page MUST mirror the prototype's structure verbatim. The Reports page keeps the v1.0 Burndown + Team Load + 4 StatCards + Q2 2026 chip + PDF button — adds new cards below. The User Profile page mirrors `user-profile.jsx` line by line. The Activity tab mirrors `activity-tab.jsx` line by line. The Avatar dropdown mirrors `shell.jsx` line by line.
- **"Improve design when [it] didn't [meet] enough"** (D-00): Allowed improvements limited to genuine prototype gaps — empty states, error states, mobile ≤640px layouts, accessibility (aria-* + keyboard nav), loading skeletons. Each must be flagged in PLAN.md as an intentional improvement with justification.
- **CFD shows 4 stacked bands** (todo / progress / review / done) per prototype line 426-429. Iteration Comparison shows 3 bars per sprint (planned / completed / carried) per line 489-491. Lead/Cycle shows 5 buckets (0-1d / 1-3d / 3-5d / 5-10d / 10d+) per line 455.
- **Q2 2026 chip is decorative** in the prototype — Phase 13 replaces it with a functional `<DateRangeFilter/>` primitive but visually keeps the chip-style button shape (D-A5).
- **Faz Raporları section uses a 2-tab Tabs primitive** (Aktif+Tamamlanan / Arşivlenmiş) — user-customized refinement of the prototype's flat list (prototype line 519-530). The improvement is justified: archived projects' reports are historical and shouldn't crowd the default view.
- **Avatar dropdown 5 items is user-customized** (Profilim / Ayarlar / Admin Paneli / Dil / Çıkış Yap) — extends prototype's 3 (Profilim/Ayarlar/Çıkış) with admin-conditional Admin Paneli (matches prototype's separate admin link in shell.jsx) and an in-menu Dil toggle (consolidates the duplicate language UI from header buttons).
- **Theme toggle stays in header** — explicitly NOT moved into the avatar dropdown (D-D2). Prototype shows theme as a header button.
- **All site avatars become clickable** — D-D4 is a global enhancement over the prototype, justified: faster navigation to a user's profile from any context (board card, comment, member list, activity row, etc.).
- **Activity tab gets 4 lifecycle event types beyond prototype's 6** (milestone/artifact/phase_report) — D-B1 is a planned extension because Phase 12 introduced these entities and they belong in the project Activity feed. Prototype was written before Phase 12 existed.
- **Comment body in activity timeline = full body up to 160 chars** — D-B6 is prototype-faithful (line 171-175 already shows the inline comment block).
- **Date-aware grouping >7 days = exact date** — D-B5 is an improvement over the prototype's 4 buckets (Today/Yesterday/This Week/Older). Justified: when scrolling back through months of activity, "Older" loses context; exact dates preserve chronology.
- **Mobile ≤640px specific layouts** — D-F1 is an improvement; prototype is desktop-first and breaks below 1024px. v2.0 PROJECT.md "Responsive yapı" requirement justifies the work.
- **`<DataState/>` primitive** — D-F2 is a structural improvement over the prototype's ad-hoc empty/error/loading patterns. Phase 13 standardizes.

</specifics>

<deferred>
## Deferred Ideas

### Pushed to v2.1 / Phase 14+

- **PM-only inline create from Faz Raporları** (D-E4 alternative): No inline create UI on `/reports`; users must navigate to Lifecycle > Geçmiş to create. If demand emerges, a PM-only create form can be added with a single PATCH call.
- **Chart export to PDF/PNG** — current Reports PDF button is the v1.0 placeholder; per-chart export deferred.
- **Custom date-range picker** — beyond Last 7d/30d/90d/Quarter presets; calendar-based custom range deferred. v2.1 candidate.
- **Per-team / per-user burndown charts** on Reports — currently project-scoped; team/user filters deferred.
- **AI insights panel on Reports** — "Velocity dropped 12% — investigate" auto-suggestions. v3.0 (PROJECT.md Out of Scope).
- **Real-time chart updates** — WebSocket-driven live data. v3.0 (PROJECT.md Out of Scope).
- **Profile inline edit (avatar/name/bio)** — D-C1 explicitly out; user must use Settings.
- **Profile activity comments / posts** — social-feed-style profile content. Out of scope.
- **Profile bookmarks / saved views** — out of scope.
- **Avatar status indicator (online/offline)** — presence service required. Out of scope (no real-time per PROJECT.md).
- **Notification badge on header avatar** — wire to bell icon area instead. Phase 5 / v1.0 has notifications; bell icon path is owned there.
- **Mobile full-screen sheet for avatar dropdown** — Claude's Discretion in Phase 13; revisit if user feedback requires.

### Pushed to /gsd-verify-work pass

- Manual UAT click-through against `13-UAT-CHECKLIST.md` (Plan 13-10 artifact, ~15-20 rows for REPT-01..04 + PROF-01..04). To be picked up after Phase 13 plans complete.

### Out of Scope (per PROJECT.md / REQUIREMENTS.md)

- Real-time activity stream / WebSocket / polling beyond `refetchOnWindowFocus`.
- Mobile native push notifications.
- HttpOnly cookie JWT migration (v3.0 ADV-02).
- GraphQL API for charts (v3.0 ADV-03).

### Reviewed Todos (not folded)

None — gsd-sdk todo system unavailable in this environment; STATE.md "Pending Todos" snapshot shows no Phase 13 candidates. If todos surface during planning, fold via `/gsd-add-todo` or note in PLAN.md.

### Cross-phase scope flags (Phase 13+ must address)

- **Test DB seeder** — Phase 11/12 deferred. Phase 13 E2E (Plan 13-10) ships with skip-guards; a dedicated seeder phase would unblock all skip-guards.
- **HttpOnly cookie JWT migration** — v3.0 ADV-02. Phase 13 stays on localStorage tokens.
- **Persistent lockout store** — v3.0 ADV-04. Phase 13 doesn't touch.
- **Chart aggregation performance** — Phase 13 ships on-the-fly SQL. If usage shows slow queries, materialized views or a daily cron job is the v2.1 candidate.
- **Faz Raporları cross-project listing** — current scope = recent rows per status-tab. A full filterable cross-project table (with author, methodology, date sort) is a v2.1 candidate.
- **Activity tab >200-event accepted cap (Plan 13-04 / D-B2)** — Plan 13-04 implements the prototype "30 + Daha fazla yükle" UX as a single backend fetch (`limit=200`) + client-side `showCount` slicing rather than offset-paginated network calls. Justified: the visible UX matches D-B2 verbatim (button cycles 30 → 60 → 90 …) and the 200 cap matches the existing Phase 9 D-46 backend hard limit. Acceptance: plans-checker WARNING logged 2026-04-26 on the divergence from D-B2's literal `offset=30, offset=60, …` request shape. v2.1 candidate: rewire the hook to refetch with growing offset on each button click; add a Test 5b for the 200+ case.
- **Faz Raporları cross-project recent-rows endpoint (Plan 13-08 / D-E1)** — Plan 13-08 ships PhaseReportsSection where the "Son raporlar" panel shows the SELECTED project's reports only. D-E1 envisioned 5-most-recent reports across all projects in the tab's status set as a stand-alone discovery affordance. Gap accepted for v2.0: current backend has no `GET /api/v1/phase-reports?status=…&limit=5` cross-project endpoint, and adding one expands Phase 13 scope past the 10-plan budget. Plan 13-08 SUMMARY documents the gap. v2.1 candidate: add the cross-project endpoint and switch the panel to call it independently of the project picker.

</deferred>

---

*Phase: 13-reporting-activity-user-profile*
*Context gathered: 2026-04-26*
