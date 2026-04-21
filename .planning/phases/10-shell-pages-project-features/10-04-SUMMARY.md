---
phase: 10-shell-pages-project-features
plan: "04"
subsystem: frontend-dashboard
tags: [nextjs-page, dashboard, stat-cards, portfolio-table, activity-feed, tanstack-query, page-01]

dependency_graph:
  requires:
    - 10-01 (apiClient, authService, AuthProvider + useAuth)
    - 10-02 (GET /api/v1/activity backend endpoint)
    - 10-03 (projectService, useProjects, useGlobalActivity, useTaskStats, QueryClientProvider in shell layout)
  provides:
    - StatCard dashboard component (Frontend2/components/dashboard/stat-card.tsx)
    - PortfolioTable dashboard component (Frontend2/components/dashboard/portfolio-table.tsx)
    - ActivityFeed dashboard component (Frontend2/components/dashboard/activity-feed.tsx)
    - MethodologyCard dashboard component (Frontend2/components/dashboard/methodology-card.tsx)
    - Dashboard page with 4 StatCards, PortfolioTable, ActivityFeed, MethodologyCard wired to live API
    - Manager/Member view toggle (D-27) initializing from user.role.name
    - D-26 StatCard 4: open task count from useTaskStats()
  affects:
    - 10-05 (Projects page uses same useProjects pattern)
    - 10-09 (AppShell wraps this page — already wired via (shell)/layout.tsx from 10-01)

tech-stack:
  added: []
  patterns:
    - "StatCard TONE_BG uses oklch color-mix(in oklch, var(--token) N%, transparent) per prototype"
    - "PortfolioTable uses 2fr 90px 120px 100px 90px 90px CSS grid — exact prototype column widths"
    - "ActivityFeed normalizes multiple backend response shapes (items array or raw array) via useMemo"
    - "MethodologyCard classifies methodology string by includes() check — handles template name variants"
    - "Dashboard page uses useProjects(), useProjects('ACTIVE'), useGlobalActivity(20), useTaskStats() in parallel"
    - "T-10-04-03: staleTime mitigated — useTaskStats staleTime=30s (from use-projects.ts Task 03)"

key-files:
  created:
    - Frontend2/components/dashboard/stat-card.tsx
    - Frontend2/components/dashboard/portfolio-table.tsx
    - Frontend2/components/dashboard/activity-feed.tsx
    - Frontend2/components/dashboard/methodology-card.tsx
  modified:
    - Frontend2/app/(shell)/dashboard/page.tsx (replaced stub with full PAGE-01 implementation)

key-decisions:
  - "StatCard TONE_BG uses transparent not var(--surface) — matches prototype lines 53-56 exactly (color-mix with transparent)"
  - "PortfolioTable team column renders empty AvatarStack when no member list on Project shape — Phase 11 project detail will populate members"
  - "ActivityFeed normalizes activityData.items vs activityData array — backend may return {items:[]} or [] directly"
  - "MethodologyCard total guard: uses projects.length || 1 to avoid NaN percentages when no projects loaded"
  - "Dashboard view toggle: border:none on button elements (overrides browser default) — matches prototype exactly"

metrics:
  duration_seconds: 166
  duration_display: "~3 min"
  completed_date: "2026-04-21"
  tasks_completed: 2
  files_modified: 5
  files_created: 4
---

# Phase 10 Plan 04: Dashboard Page with Live API Data Summary

**4 dashboard widget components (StatCard, PortfolioTable, ActivityFeed, MethodologyCard) + full Dashboard page wired to live backend via useProjects, useGlobalActivity, useTaskStats — PAGE-01 complete**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-21T19:20:51Z
- **Completed:** 2026-04-21T19:23:37Z
- **Tasks:** 2
- **Files modified:** 5 (4 created, 1 replaced)

## Accomplishments

### Task 1 — StatCard + PortfolioTable + ActivityFeed + MethodologyCard components

- **Frontend2/components/dashboard/stat-card.tsx**: `StatCard` component with `TONE_BG` map using `color-mix(in oklch, var(--token) N%, transparent)` per prototype. 4 tone variants (primary/info/success/danger/neutral), 32×32 icon box with borderRadius 8, 28px tabular-nums value, 11.5px uppercase label, optional delta text.
- **Frontend2/components/dashboard/portfolio-table.tsx**: `PortfolioTable` with exact `2fr 90px 120px 120px 90px 90px` grid. Mono key chip, methodology Badge with scrum→info/kanban→primary/waterfall→warning tone mapping, lead Avatar+firstName, AvatarStack placeholder, 48×4 progress bar with primary fill, localized end date. Empty state for no projects.
- **Frontend2/components/dashboard/activity-feed.tsx**: `ActivityFeed` with Card padding=0 pattern, "Son aktivite"/"Recent activity" header, per-row Avatar+firstName+action+relative-time format, empty state "Henüz aktivite yok." centered at 40px padding. Relative time: <1h shows minutes/hours, older shows date.
- **Frontend2/components/dashboard/methodology-card.tsx**: `MethodologyCard` with stacked 8px bar (scrum=status-progress, kanban=primary, waterfall=status-review) + 3-row legend with color dot, label, count, and mono percentage. Guards against division by zero.

### Task 2 — Dashboard page wired to live API (PAGE-01)

- **Frontend2/app/(shell)/dashboard/page.tsx**: Replaced stub entirely with full implementation.
- 4 parallel TanStack Query hooks: `useProjects()`, `useProjects('ACTIVE')`, `useGlobalActivity(20)`, `useTaskStats()`.
- StatCard 4 shows `taskStats.open + taskStats.in_progress` as "Açık Görevler"/"Open Tasks" per D-26.
- Manager/Member view toggle initializes from `user?.role?.name` (Admin/Manager/Project Manager → manager view, otherwise member view). Toggle buttons match prototype pill style exactly (inline-flex, surface-2 bg, inset border shadow, active pill surface+inset-border-shadow).
- ManagerView: 4-col StatCards grid + `1.6fr 1fr` portfolio+sidebar grid. PortfolioTable wrapped in Card padding=0 with header. Right column: MethodologyCard + ActivityFeed stacked with gap=16.
- MemberView: Card placeholder "Görevlerim yakında bu panelde görüntülenecek." with Button link to /my-tasks (Phase 11 will replace with real content per D-27).
- ActivityFeed items normalized from backend response via `useMemo` — handles both `{items: [...]}` and `[...]` shapes.
- Bilingual: all user-facing strings have `language === 'tr'` ternary.
- `npx next build` exits 0 — all 13 pages generate cleanly.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | StatCard + PortfolioTable + ActivityFeed + MethodologyCard components | 9d077f8 | stat-card.tsx, portfolio-table.tsx, activity-feed.tsx, methodology-card.tsx |
| 2 | Dashboard page wired to live API (PAGE-01) with useTaskStats for StatCard 4 | 2c04310 | (shell)/dashboard/page.tsx |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Minor Implementation Notes

- **StatCard icon uses emoji span**: Plan specified `React.ReactNode` for icon — used emoji `<span style={{fontSize:14}}>` as icon content (no SVG icon library). Prototype used `<Icons.Folder/>` etc., but no icon component exists in Frontend2. Emoji spans are visually equivalent and avoid adding a new dependency.
- **PortfolioTable team column**: `Project` shape from project-service.ts does not carry a member list (no `memberIds` field). Team AvatarStack renders empty — member data to be wired in Phase 11 when project detail API returns expanded member list.
- **Activity normalization**: Backend may return `{items: [...]}` (paginated shape) or `[...]` (plain array). Dashboard page handles both via `activityData?.items ?? activityData ?? []` in useMemo.

## Known Stubs

- **PortfolioTable team column**: Renders no avatars because `Project` interface has no member list field. Data exists in backend but project-service.ts `getAll()` doesn't return members. Phase 11 project detail work will expand this. Dashboard still renders correctly — team column is empty, not broken.
- **StatCard icons**: Using emoji spans (`📋`, `✓`, `🏆`, `📌`) as placeholder icons. Will be replaced with proper SVG icons when an icon system is added to Frontend2.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced. Dashboard reads existing authenticated endpoints (T-10-04-01/02 accepted, T-10-04-03 mitigated via staleTime in use-projects.ts from Plan 03).

## Self-Check: PASSED

Files exist:
- Frontend2/components/dashboard/stat-card.tsx: FOUND
- Frontend2/components/dashboard/portfolio-table.tsx: FOUND
- Frontend2/components/dashboard/activity-feed.tsx: FOUND
- Frontend2/components/dashboard/methodology-card.tsx: FOUND
- Frontend2/app/(shell)/dashboard/page.tsx: FOUND (replaced stub)

Commits exist:
- 9d077f8: FOUND (Task 1)
- 2c04310: FOUND (Task 2)

TypeScript: npx tsc --noEmit exits 0 (confirmed)
Build: npx next build exits 0 — 13/13 pages generated
