---
phase: "06-reporting-analytics"
plan: "06-03"
subsystem: "frontend-reports"
tags: [frontend, reports, charts, recharts, tanstack-query, export]
dependency_graph:
  requires: ["06-01"]
  provides: [reports-page, report-service, chart-components, export-button, filter-bar]
  affects: [frontend/app/reports, frontend/services, frontend/components/reports]
tech_stack:
  added: []
  patterns: [recharts-area-bar-pie-charts, tanstack-query-filter-params, blob-download, shadcn-tabs-toggle, shadcn-dropdown-menu]
key_files:
  created:
    - Frontend/services/report-service.ts
    - Frontend/components/reports/filter-bar.tsx
    - Frontend/components/reports/sprint-burndown-chart.tsx
    - Frontend/components/reports/task-distribution-chart.tsx
    - Frontend/components/reports/velocity-trend-chart.tsx
    - Frontend/components/reports/export-button.tsx
  modified:
    - Frontend/app/reports/page.tsx
decisions:
  - "Team Performance panel left as placeholder (Yakında...) — wired in Plan 06-04"
  - "distLoading combines both status and priority distribution query loading states for single TaskDistributionChart isLoading prop"
  - "Export blob download via anchor element + URL.createObjectURL — standard browser download pattern"
  - "extra param typed as Record<string,string> in getBurndown to avoid TypeScript union type error in buildParams"
metrics:
  duration_minutes: 30
  completed_date: "2026-04-08"
  tasks_completed: 2
  files_created: 7
---

# Phase 06 Plan 03: Frontend Reports Page with Charts and Filters Summary

## One-liner

Functional `/reports` page with recharts AreaChart/PieChart/BarChart panels, a Turkish-language global filter bar, and PDF/Excel export button replacing the 4-panel stub.

## What Was Built

### Task 1 — Report service and filter bar component (commit c8dfae57)

Created `Frontend/services/report-service.ts` with 7 API methods covering all reporting endpoints (`getSummary`, `getBurndown`, `getVelocity`, `getDistribution`, `getPerformance`, `exportPdf`, `exportExcel`). Defined full TypeScript interface set: `ReportFilters`, `BurndownData`, `VelocityData`, `DistributionData`, `PerformanceData`, `SummaryData`, `MemberPerformance`. All API calls use `apiClient.get()` with a shared `buildParams()` helper that maps filter state to query parameters.

Created `Frontend/components/reports/filter-bar.tsx` with three filter controls: project selector (shadcn Select), assignee multi-select (shadcn DropdownMenuCheckboxItem), and date range picker (shadcn Popover with two `<input type="date">` fields). All labels in Turkish ("Proje", "Atanan", "Tarih Aralığı"). The assignee query is disabled until a project is selected (`enabled: !!filters.projectId`).

### Task 2 — Chart components, export button, and reports page rewrite (commit 9ac868f5)

**SprintBurndownChart**: recharts AreaChart with full state machine — loading (Skeleton), error (banner), data (chart), empty-with-last-sprint (blurred overlay + "Aktif sprint bulunmuyor." + "Yeni Sprint Başlat" + "Son Sprinti Göster"), empty-no-sprint (icon only). Uses `useState(false)` for `showLastSprint` toggle.

**TaskDistributionChart**: recharts PieChart donut (innerRadius=55, outerRadius=85) wrapped in shadcn Tabs with "Durum" / "Öncelik" tab switching. Independent `DistributionPieChart` sub-component handles loading/error/empty/data states for each tab. COLORS array uses CSS custom properties (`hsl(var(--chart-1..5))`).

**VelocityTrendChart**: recharts BarChart with `completed_count` dataKey, loading/error/empty/data states, all in Turkish.

**ExportButton**: DropdownMenu with PDF/Excel items, `isExporting` state switches button to Loader2 spinner + "İndiriliyor...", blob download via `URL.createObjectURL`, sonner toasts on success/error. Filename format: `SPMS_Report_[ProjectKey]_[YYYY-MM-DD].{pdf,xlsx}`.

**reports/page.tsx**: Full rewrite — `useState<ReportFilters>` with 30-day default range, `useEffect` to auto-set first project as default, 4 independent `useQuery` hooks (burndown, distribution-status, distribution-priority, velocity) all with `enabled: !!filters.projectId`. Team Performance panel is intentional placeholder ("Yakında...") — wired in Plan 06-04.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error in buildParams extra argument**
- **Found during:** Task 2 TypeScript check
- **Issue:** `const extra = sprintId ? { sprint_id: String(sprintId) } : {}` — union type `{ sprint_id: string } | {}` not assignable to `Record<string, string> | undefined`
- **Fix:** Changed to `const extra: Record<string, string> = sprintId ? { sprint_id: String(sprintId) } : {}`
- **Files modified:** Frontend/services/report-service.ts
- **Commit:** 9ac868f5

**2. [Rule 2 - Missing critical functionality] Added explicit TypeScript types for iteration parameters**
- **Found during:** Task 2 TypeScript check
- **Issue:** `project` and `member` parameters in `.map()` and `.find()` typed as implicit `any` (same pattern exists in manager-view.tsx, member-view.tsx, etc.)
- **Fix:** Added `Project` type import and explicit type annotations on iteration parameters in filter-bar.tsx and reports/page.tsx
- **Files modified:** Frontend/components/reports/filter-bar.tsx, Frontend/app/reports/page.tsx
- **Commit:** 9ac868f5

## Known Stubs

- **Team Performance panel** (`Frontend/app/reports/page.tsx`, line 129–139): Shows "Yakında..." placeholder — intentional per plan spec. Plan 06-04 (`team-performance-manager-dashboard`) wires this panel with real `reportService.getPerformance()` data and the `TeamPerformanceTable` component.

## Self-Check: PASSED

All 7 files confirmed present on disk. Both task commits (c8dfae57, 9ac868f5) confirmed in git log.
