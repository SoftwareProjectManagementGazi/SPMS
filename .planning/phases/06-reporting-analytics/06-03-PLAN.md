---
plan: "06-03"
phase: "06-reporting-analytics"
type: execute
title: "Frontend Reports Page with Charts and Filters"
wave: 2
depends_on: ["06-01"]
requirements: [REPT-01, REPT-02, REPT-03]
files_modified:
  - Frontend/services/report-service.ts
  - Frontend/components/reports/filter-bar.tsx
  - Frontend/components/reports/sprint-burndown-chart.tsx
  - Frontend/components/reports/task-distribution-chart.tsx
  - Frontend/components/reports/velocity-trend-chart.tsx
  - Frontend/components/reports/export-button.tsx
  - Frontend/app/reports/page.tsx
autonomous: true
must_haves:
  truths:
    - "Reports page at /reports displays 4 chart panels (Sprint Burndown, Task Distribution, Velocity Trend, Team Performance placeholder) with real data from API"
    - "Global filter bar at top allows selecting project (mandatory, defaults to most recently active), assignees (multi-select), and date range (defaults to last 30 days)"
    - "Changing any filter refetches all chart data simultaneously; each panel shows Skeleton while loading"
    - "Export button opens dropdown with PDF and Excel options; shows spinner during generation; triggers automatic file download"
    - "All UI text is in Turkish per CONTEXT.md decision"
    - "Task Distribution panel has Status/Priority toggle that redraws the donut chart"
    - "Sprint Burndown shows empty state overlay when no active sprint exists"
  artifacts:
    - path: "Frontend/services/report-service.ts"
      provides: "API client methods for all 7 report endpoints"
      contains: "getBurndown"
    - path: "Frontend/components/reports/filter-bar.tsx"
      provides: "Global filter bar with project select, assignee multi-select, date range picker"
      contains: "FilterBar"
    - path: "Frontend/components/reports/sprint-burndown-chart.tsx"
      provides: "recharts AreaChart with empty state overlay"
      contains: "SprintBurndownChart"
    - path: "Frontend/components/reports/task-distribution-chart.tsx"
      provides: "recharts PieChart donut with Status/Priority toggle"
      contains: "TaskDistributionChart"
    - path: "Frontend/components/reports/velocity-trend-chart.tsx"
      provides: "recharts BarChart for velocity trend"
      contains: "VelocityTrendChart"
    - path: "Frontend/components/reports/export-button.tsx"
      provides: "Dropdown button with PDF/Excel export and loading state"
      contains: "ExportButton"
    - path: "Frontend/app/reports/page.tsx"
      provides: "Full reports page replacing stub, wiring filter state to charts"
      contains: "Raporlar"
  key_links:
    - from: "Frontend/app/reports/page.tsx"
      to: "Frontend/services/report-service.ts"
      via: "useQuery with filter params"
      pattern: "reportService"
    - from: "Frontend/app/reports/page.tsx"
      to: "Frontend/components/reports/filter-bar.tsx"
      via: "FilterBar component with onFilterChange callback"
      pattern: "FilterBar"
    - from: "Frontend/services/report-service.ts"
      to: "/api/v1/reports/"
      via: "apiClient.get() calls"
      pattern: "apiClient\\.get.*reports"
---

## Objective

Replace the 4-panel "coming soon" stub at `/reports` with a fully functional reports page. A global filter bar controls all chart data. Each chart panel fetches its data independently via TanStack Query. The export button triggers PDF/Excel downloads from the backend.

Purpose: Delivers REPT-01 (graphical charts), REPT-02 (filterable reports), and REPT-03 (export trigger) on the frontend.

Output: 7 new/replaced frontend files — report service, 4 chart components, filter bar, export button, page rewrite.

## Tasks

<task id="06-03-T01" title="Report service and filter bar component">
  <read_first>
    - Frontend/services/notification-service.ts — existing service pattern (apiClient usage, method signatures, type exports)
    - Frontend/lib/api-client.ts — apiClient (axios instance) with baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    - Frontend/services/project-service.ts — getAll() method pattern for fetching projects
    - Frontend/app/reports/page.tsx — current stub (will be fully replaced in T02)
    - .planning/phases/06-reporting-analytics/06-CONTEXT.md — filter bar behavior, default project, Turkish text
    - .planning/phases/06-reporting-analytics/06-UI-SPEC.md — Layout Contract, Filter Bar interaction, Component Inventory
    - .planning/phases/06-reporting-analytics/06-RESEARCH.md — Pattern 6 (TanStack Query with filter params), Pattern 7 (most recently active project)
  </read_first>
  <action>
    **File 1: Create `Frontend/services/report-service.ts`**

    Define TypeScript interfaces matching the backend DTOs:

    ```typescript
    import { apiClient } from '@/lib/api-client';

    // --- Types ---
    export interface ReportFilters {
      projectId: number | null;
      assigneeIds: number[];
      dateFrom: string | null; // ISO date "YYYY-MM-DD"
      dateTo: string | null;
    }

    export interface SummaryData {
      active_tasks: number;
      completed_tasks: number;
      total_tasks: number;
      completion_rate: number;
    }

    export interface BurndownPoint {
      date: string;
      remaining: number;
      total: number;
    }

    export interface BurndownData {
      sprint_name: string;
      sprint_id: number;
      series: BurndownPoint[];
    }

    export interface VelocityPoint {
      label: string;
      completed_count: number;
      completed_points: number;
    }

    export interface VelocityData {
      series: VelocityPoint[];
    }

    export interface DistributionItem {
      label: string;
      count: number;
      color: string | null;
    }

    export interface DistributionData {
      group_by: string;
      items: DistributionItem[];
    }

    export interface MemberPerformance {
      user_id: number;
      full_name: string;
      avatar_path: string | null;
      assigned: number;
      completed: number;
      in_progress: number;
      on_time_pct: number;
    }

    export interface PerformanceData {
      members: MemberPerformance[];
    }

    // --- Helper: build query params from filters ---
    function buildParams(filters: ReportFilters, extra?: Record<string, string>) {
      const params: Record<string, string> = {};
      if (filters.projectId) params.project_id = String(filters.projectId);
      if (filters.assigneeIds.length > 0) params.assignee_ids = filters.assigneeIds.join(',');
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      if (extra) Object.assign(params, extra);
      return params;
    }

    // --- API methods ---
    export const reportService = {
      getSummary: async (filters: ReportFilters): Promise<SummaryData> => {
        const { data } = await apiClient.get('/reports/summary', { params: buildParams(filters) });
        return data;
      },

      getBurndown: async (filters: ReportFilters, sprintId?: number): Promise<BurndownData> => {
        const extra = sprintId ? { sprint_id: String(sprintId) } : {};
        const { data } = await apiClient.get('/reports/burndown', { params: buildParams(filters, extra) });
        return data;
      },

      getVelocity: async (filters: ReportFilters): Promise<VelocityData> => {
        const { data } = await apiClient.get('/reports/velocity', { params: buildParams(filters) });
        return data;
      },

      getDistribution: async (filters: ReportFilters, groupBy: string = 'status'): Promise<DistributionData> => {
        const { data } = await apiClient.get('/reports/distribution', {
          params: buildParams(filters, { group_by: groupBy }),
        });
        return data;
      },

      getPerformance: async (filters: ReportFilters): Promise<PerformanceData> => {
        const { data } = await apiClient.get('/reports/performance', { params: buildParams(filters) });
        return data;
      },

      exportPdf: async (filters: ReportFilters): Promise<Blob> => {
        const { data } = await apiClient.get('/reports/export/pdf', {
          params: buildParams(filters),
          responseType: 'blob',
        });
        return data;
      },

      exportExcel: async (filters: ReportFilters): Promise<Blob> => {
        const { data } = await apiClient.get('/reports/export/excel', {
          params: buildParams(filters),
          responseType: 'blob',
        });
        return data;
      },
    };
    ```

    **File 2: Create `Frontend/components/reports/filter-bar.tsx`**

    ```typescript
    "use client"
    ```

    Props interface:
    ```typescript
    interface FilterBarProps {
      filters: ReportFilters;
      onFiltersChange: (filters: ReportFilters) => void;
    }
    ```

    Component structure:
    - Wrap in `<Card className="p-4 w-full">` per UI-SPEC layout contract.
    - Use `flex flex-wrap gap-4` for filter controls.
    - **Proje select**: shadcn `<Select>` (w-48). Fetch projects via `useQuery({ queryKey: ["projects"], queryFn: projectService.getAll })`. Display project name + key. On change, update `filters.projectId`. Label: "Proje".
    - **Atanan multi-select**: shadcn `<DropdownMenu>` with `<DropdownMenuCheckboxItem>`. Fetch project members via `useQuery({ queryKey: ["project-members", filters.projectId], queryFn: () => projectService.getMembers(filters.projectId!), enabled: !!filters.projectId })`. Display member names with checkboxes. On check/uncheck, update `filters.assigneeIds`. Button label: "Atanan" with count badge if any selected. Placeholder: "Tümü".
    - **Tarih Araligi date range**: Two date inputs (dateFrom, dateTo) inside a shadcn `<Popover>`. Button label: "Tarih Aralığı" showing selected range. Default text: "Son 30 Gün". Use `<input type="date">` for simplicity (no need for calendar picker component).
    - **Default project on mount**: In the page component (not filter bar), use a useEffect to set default project to the first project returned by getAll (sorted by updated_at desc — "most recently active"). Pass this default into FilterBar.

    All text in Turkish: "Proje", "Atanan", "Tarih Aralığı", "Tümü", "Son 30 Gün".
  </action>
  <acceptance_criteria>
    - `test -f Frontend/services/report-service.ts` exits 0
    - `grep -r "reportService" Frontend/services/report-service.ts` exits 0
    - `grep -r "getSummary" Frontend/services/report-service.ts` exits 0
    - `grep -r "getBurndown" Frontend/services/report-service.ts` exits 0
    - `grep -r "getVelocity" Frontend/services/report-service.ts` exits 0
    - `grep -r "getDistribution" Frontend/services/report-service.ts` exits 0
    - `grep -r "getPerformance" Frontend/services/report-service.ts` exits 0
    - `grep -r "exportPdf" Frontend/services/report-service.ts` exits 0
    - `grep -r "exportExcel" Frontend/services/report-service.ts` exits 0
    - `grep -r "ReportFilters" Frontend/services/report-service.ts` exits 0
    - `grep -r "apiClient.get.*reports" Frontend/services/report-service.ts` exits 0
    - `test -f Frontend/components/reports/filter-bar.tsx` exits 0
    - `grep -r "FilterBar" Frontend/components/reports/filter-bar.tsx` exits 0
    - `grep -r "Proje" Frontend/components/reports/filter-bar.tsx` exits 0
    - `grep -r "Atanan" Frontend/components/reports/filter-bar.tsx` exits 0
    - `grep -r "Tarih Aralığı" Frontend/components/reports/filter-bar.tsx` exits 0
    - `grep -r "onFiltersChange" Frontend/components/reports/filter-bar.tsx` exits 0
  </acceptance_criteria>
</task>

<task id="06-03-T02" title="Chart components, export button, and reports page rewrite">
  <read_first>
    - Frontend/services/report-service.ts — report service created in T01 (types and API methods)
    - Frontend/components/reports/filter-bar.tsx — filter bar created in T01
    - Frontend/app/reports/page.tsx — current stub to be fully replaced
    - .planning/phases/06-reporting-analytics/06-UI-SPEC.md — Layout Contract, Interaction Contracts, States Required, Color section (chart palette), Copywriting Contract
    - .planning/phases/06-reporting-analytics/06-RESEARCH.md — Pattern 4 (recharts chart code), Pitfall 5 (ResponsiveContainer height), Pitfall 6 (velocity X-axis overflow), Pitfall 7 (multi-select debounce)
    - .planning/phases/06-reporting-analytics/06-CONTEXT.md — burndown empty state, task distribution toggle, velocity auto-detect, export UX
  </read_first>
  <action>
    **File 1: Create `Frontend/components/reports/sprint-burndown-chart.tsx`**

    Props: `{ data: BurndownData | undefined; isLoading: boolean; isError: boolean; projectId: number | null }`

    Component:
    - Loading state: `<Skeleton className="w-full h-64" />`
    - Error state: Card with "Veriler yüklenemedi. Sayfayı yenileyin." text
    - Empty state (data.series is empty or undefined):
      - If data exists with sprint_name but empty series (last sprint exists): render the blurred overlay pattern from UI-SPEC:
        - Container: `relative` div
        - Behind: a placeholder chart area with `blur-sm opacity-40` (can show a static placeholder or nothing)
        - Overlay: `absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card/80`
          - `<BarChart3 className="h-10 w-10 text-muted-foreground" />`
          - `<p className="text-sm text-muted-foreground text-center">Aktif sprint bulunmuyor.</p>`
          - `<Button variant="default">Yeni Sprint Başlat</Button>` — link to `/projects/[id]/sprints` (use projectId from props)
          - `<Button variant="outline">Son Sprinti Göster</Button>` — local state toggle that removes overlay to show the last sprint chart data
      - If no sprint data at all: only icon + "Aktif sprint bulunmuyor." text, no buttons.
    - Data state: recharts AreaChart inside a `div` with explicit `style={{ width: "100%", height: 220 }}` (Pitfall 5).
      ```tsx
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.series}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="remaining" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1) / 0.15)" />
        </AreaChart>
      </ResponsiveContainer>
      ```
    - Card wrapper: `<Card className="shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Sprint Burndown</CardTitle></CardHeader><CardContent className="h-64">...</CardContent></Card>`

    **File 2: Create `Frontend/components/reports/task-distribution-chart.tsx`**

    Props: `{ statusData: DistributionData | undefined; priorityData: DistributionData | undefined; isLoading: boolean; isError: boolean }`

    Component:
    - Uses shadcn `<Tabs defaultValue="status">` with `<TabsList><TabsTrigger value="status">Durum</TabsTrigger><TabsTrigger value="priority">Öncelik</TabsTrigger></TabsList>`.
    - Active tab state determines which data to render.
    - Loading/Error/Empty states same as burndown.
    - Empty text: "Bu dönem için veri bulunamadı."
    - Data state: recharts PieChart (donut) with innerRadius={55} outerRadius={85}.
      ```tsx
      const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]
      ```
      Map items to `<Cell>` with color from item.color CSS variable if available, else COLORS array fallback.
    - Wrap in `div` with height 220 (Pitfall 5).
    - Card title: "Görev Dağılımı" with `<PieChart>` lucide icon.

    **File 3: Create `Frontend/components/reports/velocity-trend-chart.tsx`**

    Props: `{ data: VelocityData | undefined; isLoading: boolean; isError: boolean }`

    Component:
    - Loading/Error/Empty states.
    - Empty text: "Bu dönem için veri bulunamadı."
    - Data state: recharts BarChart.
      ```tsx
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.series}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="completed_count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      ```
    - Wrap in height-220 div. Card title: "Velocity Trendi" with `<TrendingUp>` icon.

    **File 4: Create `Frontend/components/reports/export-button.tsx`**

    Props: `{ filters: ReportFilters; disabled?: boolean }`

    Component:
    - Uses shadcn `<DropdownMenu>`.
    - Trigger button: `<Button variant="default" disabled={isExporting} className="min-w-[120px]">`. 
      - Default state: `<Download className="h-4 w-4 mr-2" />` + "Dışa Aktar" + `<ChevronDown>`.
      - Exporting state: `<Loader2 className="h-4 w-4 mr-2 animate-spin" />` + "İndiriliyor..."
    - Dropdown items:
      - "PDF olarak indir" — calls `reportService.exportPdf(filters)`, triggers blob download
      - "Excel olarak indir" — calls `reportService.exportExcel(filters)`, triggers blob download
    - Download helper: create an anchor element, set href to `URL.createObjectURL(blob)`, set download attribute to filename, click, revoke URL.
    - Filename construction: `SPMS_Report_${projectKey}_${new Date().toISOString().split('T')[0]}.pdf` (or .xlsx). Get projectKey from a prop or context.
    - On success: `toast.success("Rapor indirildi.")` via sonner.
    - On error: `toast.error("Rapor oluşturulamadı. Lütfen tekrar deneyin.")` via sonner.
    - Set `isExporting` state to true during generation, false after success or error.

    **File 5: Rewrite `Frontend/app/reports/page.tsx`**

    Full replacement of the stub. Structure per UI-SPEC Layout Contract:

    ```tsx
    "use client"

    import { useState, useEffect } from "react"
    import { useQuery } from "@tanstack/react-query"
    import { subDays } from "date-fns"
    import { AppShell } from "@/components/app-shell"
    import { FilterBar } from "@/components/reports/filter-bar"
    import { SprintBurndownChart } from "@/components/reports/sprint-burndown-chart"
    import { TaskDistributionChart } from "@/components/reports/task-distribution-chart"
    import { VelocityTrendChart } from "@/components/reports/velocity-trend-chart"
    import { ExportButton } from "@/components/reports/export-button"
    import { reportService, ReportFilters } from "@/services/report-service"
    import { projectService } from "@/services/project-service"
    ```

    Page component:
    - `filters` state: `useState<ReportFilters>({ projectId: null, assigneeIds: [], dateFrom: subDays(new Date(), 30).toISOString().split('T')[0], dateTo: new Date().toISOString().split('T')[0] })`
    - Default project: fetch projects via useQuery, use useEffect to set `filters.projectId` to the first project's ID (most recently updated = first in list).
    - 4 independent useQuery hooks for chart data, all with `enabled: !!filters.projectId`:
      - `["reports", "burndown", filters]` → `reportService.getBurndown(filters)`
      - `["reports", "distribution-status", filters]` → `reportService.getDistribution(filters, "status")`
      - `["reports", "distribution-priority", filters]` → `reportService.getDistribution(filters, "priority")`
      - `["reports", "velocity", filters]` → `reportService.getVelocity(filters)`
    - NOTE: Team Performance data query will be added in Plan 04 (this plan provides the 4th panel as a placeholder card for now, titled "Takım Performansı" with "Yakında..." text — replaced in Plan 04).

    Layout JSX:
    ```tsx
    <AppShell>
      <div className="space-y-6">
        {/* Page header row */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Raporlar</h1>
            <p className="text-muted-foreground">Projeleriniz için analiz ve içgörüler</p>
          </div>
          <ExportButton filters={filters} disabled={!filters.projectId} />
        </div>

        {/* Global filter bar */}
        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Chart grid: 2x2 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SprintBurndownChart data={burndownData} isLoading={burndownLoading} isError={burndownError} projectId={filters.projectId} />
          <TaskDistributionChart statusData={statusDistData} priorityData={priorityDistData} isLoading={distLoading} isError={distError} />
          <VelocityTrendChart data={velocityData} isLoading={velocityLoading} isError={velocityError} />
          {/* Team Performance panel — placeholder until Plan 04 */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Takım Performansı
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              Yakında...
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
    ```

    All text in Turkish per CONTEXT.md locked decision.
  </action>
  <acceptance_criteria>
    - `test -f Frontend/components/reports/sprint-burndown-chart.tsx` exits 0
    - `test -f Frontend/components/reports/task-distribution-chart.tsx` exits 0
    - `test -f Frontend/components/reports/velocity-trend-chart.tsx` exits 0
    - `test -f Frontend/components/reports/export-button.tsx` exits 0
    - `grep -r "SprintBurndownChart" Frontend/components/reports/sprint-burndown-chart.tsx` exits 0
    - `grep -r "TaskDistributionChart" Frontend/components/reports/task-distribution-chart.tsx` exits 0
    - `grep -r "VelocityTrendChart" Frontend/components/reports/velocity-trend-chart.tsx` exits 0
    - `grep -r "ExportButton" Frontend/components/reports/export-button.tsx` exits 0
    - `grep -r "Aktif sprint bulunmuyor" Frontend/components/reports/sprint-burndown-chart.tsx` exits 0
    - `grep -r "Yeni Sprint Başlat" Frontend/components/reports/sprint-burndown-chart.tsx` exits 0
    - `grep -r "Son Sprinti Göster" Frontend/components/reports/sprint-burndown-chart.tsx` exits 0
    - `grep -r "Durum" Frontend/components/reports/task-distribution-chart.tsx` exits 0
    - `grep -r "Öncelik" Frontend/components/reports/task-distribution-chart.tsx` exits 0
    - `grep -r "Görev Dağılımı" Frontend/components/reports/task-distribution-chart.tsx` exits 0
    - `grep -r "Velocity Trendi" Frontend/components/reports/velocity-trend-chart.tsx` exits 0
    - `grep -r "Dışa Aktar" Frontend/components/reports/export-button.tsx` exits 0
    - `grep -r "İndiriliyor" Frontend/components/reports/export-button.tsx` exits 0
    - `grep -r "Rapor indirildi" Frontend/components/reports/export-button.tsx` exits 0
    - `grep -r "Raporlar" Frontend/app/reports/page.tsx` exits 0
    - `grep -r "Projeleriniz için analiz ve içgörüler" Frontend/app/reports/page.tsx` exits 0
    - `grep -r "FilterBar" Frontend/app/reports/page.tsx` exits 0
    - `grep -r "SprintBurndownChart" Frontend/app/reports/page.tsx` exits 0
    - `grep -r "TaskDistributionChart" Frontend/app/reports/page.tsx` exits 0
    - `grep -r "VelocityTrendChart" Frontend/app/reports/page.tsx` exits 0
    - `grep -r "ExportButton" Frontend/app/reports/page.tsx` exits 0
    - `grep -r "reportService" Frontend/app/reports/page.tsx` exits 0
    - `grep -r "AreaChart" Frontend/components/reports/sprint-burndown-chart.tsx` exits 0
    - `grep -r "PieChart" Frontend/components/reports/task-distribution-chart.tsx` exits 0
    - `grep -r "BarChart" Frontend/components/reports/velocity-trend-chart.tsx` exits 0
    - `grep "coming soon" Frontend/app/reports/page.tsx` exits 1 (stub text removed)
  </acceptance_criteria>
</task>

## Verification

After both tasks complete:
1. `/reports` page renders with filter bar and 3 live chart panels + 1 placeholder
2. No "coming soon" text remains in page.tsx
3. All Turkish text matches the Copywriting Contract in UI-SPEC
4. Export button triggers download with correct filenames
5. `cd Frontend && npx next build` compiles without errors
