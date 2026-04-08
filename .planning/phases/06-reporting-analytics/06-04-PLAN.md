---
plan: "06-04"
phase: "06-reporting-analytics"
type: execute
title: "Team Performance Table and Manager Dashboard"
wave: 3
depends_on: ["06-01", "06-03"]
requirements: [REPT-04, REPT-05]
files_modified:
  - Frontend/components/reports/team-performance-table.tsx
  - Frontend/app/reports/page.tsx
  - Frontend/components/dashboard/manager-view.tsx
autonomous: true
must_haves:
  truths:
    - "Team Performance leaderboard table shows Avatar, Name, Atanan, Tamamlanan, Zamanında %, Devam Eden columns with real data"
    - "Leaderboard table columns are sortable by clicking column headers"
    - "Clicking a leaderboard row sets the Assignee filter on the reports page and all charts update"
    - "On-time % column shows inline mini progress bar with color thresholds (teal >= 80%, amber 50-79%, red < 50%)"
    - "Manager dashboard shows real Active Tasks and Completed Tasks counts (not '-' placeholders)"
    - "Manager dashboard has Takım Performansı section below Project Portfolio with top 5 members"
    - "Manager dashboard has 'Tüm Raporları Gör' link to /reports"
  artifacts:
    - path: "Frontend/components/reports/team-performance-table.tsx"
      provides: "Reusable leaderboard table component used in both /reports and manager dashboard"
      contains: "TeamPerformanceTable"
    - path: "Frontend/app/reports/page.tsx"
      provides: "Reports page with Team Performance panel wired (replacing placeholder from Plan 03)"
      contains: "TeamPerformanceTable"
    - path: "Frontend/components/dashboard/manager-view.tsx"
      provides: "Manager dashboard with real task counts and leaderboard section"
      contains: "Takım Performansı"
  key_links:
    - from: "Frontend/components/reports/team-performance-table.tsx"
      to: "Frontend/services/report-service.ts"
      via: "MemberPerformance type import"
      pattern: "MemberPerformance"
    - from: "Frontend/app/reports/page.tsx"
      to: "Frontend/components/reports/team-performance-table.tsx"
      via: "TeamPerformanceTable component rendering"
      pattern: "TeamPerformanceTable"
    - from: "Frontend/components/dashboard/manager-view.tsx"
      to: "Frontend/services/report-service.ts"
      via: "useQuery for summary and performance data"
      pattern: "reportService"
---

## Objective

Build the reusable TeamPerformanceTable component used on both `/reports` and the manager dashboard. Wire it into the reports page (replacing the Plan 03 placeholder). Upgrade manager-view.tsx with real task count metrics and a "Takım Performansı" leaderboard section showing top 5 members.

Purpose: Delivers REPT-04 (user performance metrics visible in leaderboard) and REPT-05 (manager dashboard with real data and performance summary).

Output: 1 new component, 2 modified files.

## Tasks

<task id="06-04-T01" title="TeamPerformanceTable component and reports page wiring">
  <read_first>
    - Frontend/services/report-service.ts — MemberPerformance type, reportService.getPerformance(), ReportFilters type
    - Frontend/app/reports/page.tsx — current state from Plan 03 (has placeholder Card for Team Performance)
    - Frontend/components/reports/filter-bar.tsx — to understand filter state shape and onFiltersChange pattern
    - .planning/phases/06-reporting-analytics/06-UI-SPEC.md — Leaderboard Table interaction (sort, row click, on-time progress bar, color thresholds), States Required
    - .planning/phases/06-reporting-analytics/06-CONTEXT.md — Team Performance columns, leaderboard row click behavior, Turkish column names
  </read_first>
  <action>
    **File 1: Create `Frontend/components/reports/team-performance-table.tsx`**

    Props interface:
    ```typescript
    interface TeamPerformanceTableProps {
      data: MemberPerformance[];
      isLoading: boolean;
      isError: boolean;
      limit?: number;             // Limit rows shown (e.g., 5 for dashboard)
      onRowClick?: (userId: number) => void;  // Click handler for filter integration
      emptyMessage?: string;
    }
    ```

    Component:
    - Uses shadcn Table, TableHeader, TableRow, TableHead, TableBody, TableCell.
    - Uses shadcn Avatar, AvatarImage, AvatarFallback for avatar column.
    - Loading state: `<Skeleton className="w-full h-64" />`
    - Error state: "Veriler yüklenemedi. Sayfayı yenileyin."
    - Empty state: props.emptyMessage or "Bu proje için henüz performans verisi yok."

    **Sortable columns:**
    - Local state: `sortField` (default: "completed") and `sortDir` (default: "desc").
    - Click column header → toggle sort. Active sort column header shows `ChevronUp` or `ChevronDown` icon in `text-primary` color.
    - Sort the data array via `useMemo` based on sortField/sortDir.
    - If `limit` prop is set, slice sorted array to first N rows.

    **Column definitions (all headers in Turkish):**

    | Header | Field | Rendering |
    |--------|-------|-----------|
    | (no header) | avatar_path + full_name initials | `<Avatar className="h-7 w-7"><AvatarImage src={member.avatar_path ? `/api/v1/auth/avatar/${member.avatar_path.split('/').pop()}` : "/placeholder.svg"} /><AvatarFallback>{initials}</AvatarFallback></Avatar>` |
    | Ad | full_name | `<span className="font-medium">{member.full_name}</span>` |
    | Atanan | assigned | Plain number |
    | Tamamlanan | completed | Plain number |
    | Zamanında % | on_time_pct | **Inline mini progress bar**: `<div className="flex items-center gap-2"><div className="h-2 w-24 bg-muted rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${member.on_time_pct}%` }} /></div><span className="text-xs w-10 text-right">{member.on_time_pct}%</span></div>`. Bar fill color: `hsl(var(--chart-2))` (teal) if >= 80, `hsl(var(--chart-3))` (amber) if >= 50, `hsl(var(--destructive))` if < 50. |
    | Devam Eden | in_progress | Plain number |

    **Row click:**
    - Each `<TableRow>` has `className="cursor-pointer hover:bg-muted/50"` and `onClick={() => onRowClick?.(member.user_id)}`.
    - Touch target: ensure row height >= 44px for accessibility.

    Export the component as named export: `export function TeamPerformanceTable(props: TeamPerformanceTableProps)`.

    **File 2: Modify `Frontend/app/reports/page.tsx`**

    Replace the placeholder Card (4th panel in the grid, the one with "Takım Performansı" and "Yakında...") with the real TeamPerformanceTable.

    Add a new useQuery for performance data:
    ```typescript
    const { data: performanceData, isLoading: perfLoading, isError: perfError } = useQuery({
      queryKey: ["reports", "performance", filters],
      queryFn: () => reportService.getPerformance(filters),
      enabled: !!filters.projectId,
    });
    ```

    Add a row click handler that updates the assignee filter:
    ```typescript
    const handleLeaderboardRowClick = (userId: number) => {
      setFilters(prev => ({
        ...prev,
        assigneeIds: [userId],  // Set single assignee — all 4 charts refetch
      }));
    };
    ```

    Replace the placeholder Card with:
    ```tsx
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Takım Performansı
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TeamPerformanceTable
          data={performanceData?.members ?? []}
          isLoading={perfLoading}
          isError={perfError}
          onRowClick={handleLeaderboardRowClick}
        />
      </CardContent>
    </Card>
    ```

    Add import: `import { TeamPerformanceTable } from "@/components/reports/team-performance-table"`
  </action>
  <acceptance_criteria>
    - `test -f Frontend/components/reports/team-performance-table.tsx` exits 0
    - `grep -r "TeamPerformanceTable" Frontend/components/reports/team-performance-table.tsx` exits 0
    - `grep -r "export function TeamPerformanceTable" Frontend/components/reports/team-performance-table.tsx` exits 0
    - `grep -r "Atanan" Frontend/components/reports/team-performance-table.tsx` exits 0
    - `grep -r "Tamamlanan" Frontend/components/reports/team-performance-table.tsx` exits 0
    - `grep -r "Zamanında" Frontend/components/reports/team-performance-table.tsx` exits 0
    - `grep -r "Devam Eden" Frontend/components/reports/team-performance-table.tsx` exits 0
    - `grep -r "onRowClick" Frontend/components/reports/team-performance-table.tsx` exits 0
    - `grep -r "sortField" Frontend/components/reports/team-performance-table.tsx` exits 0
    - `grep -r "cursor-pointer" Frontend/components/reports/team-performance-table.tsx` exits 0
    - `grep -r "on_time_pct" Frontend/components/reports/team-performance-table.tsx` exits 0
    - `grep -r "TeamPerformanceTable" Frontend/app/reports/page.tsx` exits 0
    - `grep -r "getPerformance" Frontend/app/reports/page.tsx` exits 0
    - `grep -r "handleLeaderboardRowClick" Frontend/app/reports/page.tsx` exits 0
    - `grep "Yakında" Frontend/app/reports/page.tsx` exits 1 (placeholder removed)
  </acceptance_criteria>
</task>

<task id="06-04-T02" title="Manager dashboard real metrics and leaderboard section">
  <read_first>
    - Frontend/components/dashboard/manager-view.tsx — current file with mock "-" metrics and Project Portfolio table
    - Frontend/services/report-service.ts — reportService.getSummary() and reportService.getPerformance() methods, SummaryData type
    - Frontend/components/reports/team-performance-table.tsx — TeamPerformanceTable component created in T01
    - Frontend/services/project-service.ts — projectService.getAll() already used in manager-view.tsx
    - .planning/phases/06-reporting-analytics/06-CONTEXT.md — Manager Dashboard section (wire metrics, add leaderboard, Turkish text)
    - .planning/phases/06-reporting-analytics/06-UI-SPEC.md — Manager Dashboard Layout Contract
  </read_first>
  <action>
    **Modify `Frontend/components/dashboard/manager-view.tsx`**

    **1. Wire real task count metrics:**

    The current `metrics` array has:
    ```typescript
    { title: "Active Tasks", value: "-", icon: TrendingUp, color: "text-orange-600" },
    { title: "Completed Tasks", value: "-", icon: CheckCircle2, color: "text-green-600" },
    ```

    Replace with real data. Add a useQuery that fetches summary for all user's projects. Since the manager dashboard shows aggregate counts, use the first project's summary as a starting point, or (better) sum across all projects. The simplest approach: fetch summary for each project and sum.

    However, for simplicity and performance, fetch summary for the most recently active project (consistent with reports page behavior):

    ```typescript
    const defaultProjectId = projects?.[0]?.id ?? null;
    
    const { data: summaryData } = useQuery({
      queryKey: ["reports", "summary", defaultProjectId],
      queryFn: () => reportService.getSummary({
        projectId: defaultProjectId!,
        assigneeIds: [],
        dateFrom: subDays(new Date(), 30).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
      }),
      enabled: !!defaultProjectId,
    });
    ```

    Update metrics array:
    ```typescript
    const metrics = [
      { title: "Toplam Projeler", value: totalProjects, icon: FolderKanban, color: "text-blue-600" },
      { title: "Aktif Görevler", value: summaryData?.active_tasks ?? "-", icon: TrendingUp, color: "text-orange-600" },
      { title: "Tamamlanan Görevler", value: summaryData?.completed_tasks ?? "-", icon: CheckCircle2, color: "text-green-600" },
    ]
    ```

    Change metric titles to Turkish: "Total Projects" → "Toplam Projeler", "Active Tasks" → "Aktif Görevler", "Completed Tasks" → "Tamamlanan Görevler".

    Add imports:
    ```typescript
    import { reportService } from "@/services/report-service"
    import { TeamPerformanceTable } from "@/components/reports/team-performance-table"
    import { subDays } from "date-fns"
    import Link from "next/link"
    ```

    **2. Add "Takım Performansı" leaderboard section:**

    Add a useQuery for performance data:
    ```typescript
    const { data: performanceData, isLoading: perfLoading, isError: perfError } = useQuery({
      queryKey: ["reports", "performance", "dashboard", defaultProjectId],
      queryFn: () => reportService.getPerformance({
        projectId: defaultProjectId!,
        assigneeIds: [],
        dateFrom: subDays(new Date(), 30).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
      }),
      enabled: !!defaultProjectId,
    });
    ```

    Add below the Project Portfolio `</Card>` (inside the outer `<div className="space-y-6">`):
    ```tsx
    {/* Takım Performansı Section */}
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Takım Performansı</CardTitle>
          <Link href="/reports" className="text-primary text-sm hover:underline">
            Tüm Raporları Gör →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <TeamPerformanceTable
          data={performanceData?.members ?? []}
          isLoading={perfLoading}
          isError={perfError}
          limit={5}
          emptyMessage="Bu proje için henüz performans verisi yok."
        />
      </CardContent>
    </Card>
    ```

    **3. Update error message to Turkish:**
    Change "Projeler yüklenemedi. Lütfen daha sonra tekrar deneyin." — already in Turkish, keep as-is.
    Change "No projects found." to "Henüz proje bulunmuyor."

    **4. Update Project Portfolio header to Turkish:**
    Change `<CardTitle>Project Portfolio</CardTitle>` to `<CardTitle>Proje Portföyü</CardTitle>`.

    **5. Update table headers to Turkish:**
    Change "Project Name" → "Proje Adı", "Methodology" → "Metodoloji", "Manager" → "Yönetici", "End Date" → "Bitiş Tarihi".
  </action>
  <acceptance_criteria>
    - `grep -r "Aktif Görevler" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep -r "Tamamlanan Görevler" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep -r "Toplam Projeler" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep "Active Tasks" Frontend/components/dashboard/manager-view.tsx` exits 1 (English metric label removed)
    - `grep "Completed Tasks" Frontend/components/dashboard/manager-view.tsx` exits 1 (English metric label removed)
    - `grep 'value: "-"' Frontend/components/dashboard/manager-view.tsx` exits 1 (mock "-" values removed)
    - `grep -r "summaryData" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep -r "reportService" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep -r "Takım Performansı" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep -r "Tüm Raporları Gör" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep -r "TeamPerformanceTable" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep -r "limit={5}" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep -r 'href="/reports"' Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep -r "Proje Portföyü" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep -r "Proje Adı" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep -r "Metodoloji" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep -r "Yönetici" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep -r "Bitiş Tarihi" Frontend/components/dashboard/manager-view.tsx` exits 0
    - `grep "Project Portfolio" Frontend/components/dashboard/manager-view.tsx` exits 1 (English removed)
  </acceptance_criteria>
</task>

## Verification

After both tasks complete:
1. `/reports` page has all 4 panels with real data (no placeholders)
2. Team Performance table is sortable and clickable
3. Manager dashboard shows real numbers for Active/Completed Tasks
4. Manager dashboard has "Takım Performansı" section with top 5 members and "Tüm Raporları Gör" link
5. All text in Turkish throughout both pages
6. `cd Frontend && npx next build` compiles without errors
