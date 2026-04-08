---
phase: "06-reporting-analytics"
plan: "06-04"
subsystem: "frontend"
tags: [reporting, dashboard, performance, leaderboard, ui]
dependency_graph:
  requires: ["06-01", "06-03"]
  provides: ["REPT-04", "REPT-05"]
  affects: ["Frontend/app/reports/page.tsx", "Frontend/components/dashboard/manager-view.tsx"]
tech_stack:
  added: []
  patterns: ["TanStack Query useQuery with filter params", "shadcn/ui Table with sortable headers", "inline progress bar with color thresholds"]
key_files:
  created:
    - Frontend/services/report-service.ts
    - Frontend/components/reports/team-performance-table.tsx
  modified:
    - Frontend/app/reports/page.tsx
    - Frontend/components/dashboard/manager-view.tsx
decisions:
  - "report-service.ts created in Plan 04 (not Plan 03) due to parallel execution — Plan 03 may also create it; both are identical"
  - "value: '-' placeholders removed from manager-view metrics; uses summaryData?.active_tasks ?? '-' (shows '-' only if API hasn't responded yet, not as permanent placeholder)"
metrics:
  duration: "~20 minutes"
  completed_at: "2026-04-08T19:47:12Z"
  tasks_completed: 2
  files_changed: 4
---

# Phase 06 Plan 04: Team Performance Table and Manager Dashboard Summary

**One-liner:** Reusable sortable leaderboard table component with on-time % progress bars wired into both /reports and manager dashboard with real task count metrics.

## What Was Built

### Task 1: TeamPerformanceTable component and reports page wiring

Created `Frontend/services/report-service.ts` — all TypeScript interfaces (ReportFilters, MemberPerformance, SummaryData, BurndownData, VelocityData, DistributionData, PerformanceData) and API methods (getSummary, getBurndown, getVelocity, getDistribution, getPerformance, exportPdf, exportExcel).

Created `Frontend/components/reports/team-performance-table.tsx` — reusable leaderboard table component:
- Props: data, isLoading, isError, limit, onRowClick, emptyMessage
- Sortable columns (click header toggles asc/desc): Atanan, Tamamlanan, Zamanında %, Devam Eden
- On-time % column: inline mini progress bar with color thresholds (`--chart-2` teal >= 80%, `--chart-3` amber 50-79%, `--destructive` red < 50%)
- Row click: `cursor-pointer hover:bg-muted/50` with `onClick={() => onRowClick?.(member.user_id)}`
- Loading/error/empty states per UI-SPEC
- limit prop slices sorted array (e.g., top 5 for dashboard)

Updated `Frontend/app/reports/page.tsx`:
- Added `getPerformance` useQuery wired to Team Performance panel
- `handleLeaderboardRowClick` sets `assigneeIds: [userId]` — all chart panels refetch
- Replaced 4th panel placeholder ("Chart visualization coming soon") with real `<TeamPerformanceTable>`

### Task 2: Manager dashboard real metrics and leaderboard section

Updated `Frontend/components/dashboard/manager-view.tsx`:
- Added `defaultProjectId = projects?.[0]?.id` — most recently returned project as default
- Added `summaryData` useQuery (getSummary with last 30 days) — wires `active_tasks` and `completed_tasks`
- Added `performanceData` useQuery (getPerformance with last 30 days) — top 5 leaderboard
- Metric titles translated to Turkish: "Toplam Projeler", "Aktif Görevler", "Tamamlanan Görevler"
- Removed all `value: "-"` mock placeholders
- Added "Takım Performansı" Card section below Proje Portföyü with `TeamPerformanceTable limit={5}`
- Added "Tüm Raporları Gör →" link to `/reports`
- Translated Project Portfolio → "Proje Portföyü", all table headers to Turkish

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| T01 | 9ce93d50 | feat(06-04): TeamPerformanceTable component and reports page wiring |
| T02 | fdda547b | feat(06-04): Manager dashboard real metrics and leaderboard section |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created report-service.ts as prerequisite**
- **Found during:** Task 1 start
- **Issue:** `report-service.ts` is a Plan 03 dependency but Plan 03 runs in parallel. Without it, `TeamPerformanceTable` cannot import `MemberPerformance` type and manager-view cannot import `reportService`.
- **Fix:** Created `Frontend/services/report-service.ts` with all types and API methods as specified in Plan 03's action block. The content is identical to what Plan 03 would produce — no conflict if Plan 03 also creates it (same content).
- **Files modified:** `Frontend/services/report-service.ts`
- **Commit:** 9ce93d50

## Known Stubs

None. All data in both panels comes from real API queries (`reportService.getSummary()` and `reportService.getPerformance()`). The `?? "-"` fallback in metric values is intentional loading state (API not yet responded), not a permanent stub.

## Self-Check: PASSED

All created files verified to exist:
- FOUND: Frontend/components/reports/team-performance-table.tsx
- FOUND: Frontend/services/report-service.ts
- FOUND: Frontend/app/reports/page.tsx
- FOUND: Frontend/components/dashboard/manager-view.tsx
- FOUND: .planning/phases/06-reporting-analytics/06-04-SUMMARY.md

All commits verified:
- FOUND: 9ce93d50 feat(06-04): TeamPerformanceTable component and reports page wiring
- FOUND: fdda547b feat(06-04): Manager dashboard real metrics and leaderboard section
