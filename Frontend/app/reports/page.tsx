"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { subDays } from "date-fns"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, ListTodo, TrendingUp, Users } from "lucide-react"
import { reportService, ReportFilters } from "@/services/report-service"
import { projectService } from "@/services/project-service"
import { TeamPerformanceTable } from "@/components/reports/team-performance-table"
import { FilterBar } from "@/components/reports/filter-bar"
import { SprintBurndownChart } from "@/components/reports/sprint-burndown-chart"
import { TaskDistributionChart } from "@/components/reports/task-distribution-chart"
import { VelocityTrendChart } from "@/components/reports/velocity-trend-chart"
import { ExportButton } from "@/components/reports/export-button"

export default function ReportsPage() {
  const defaultDateFrom = subDays(new Date(), 30).toISOString().split("T")[0];
  const defaultDateTo = new Date().toISOString().split("T")[0];

  const [filters, setFilters] = useState<ReportFilters>({
    projectId: null,
    assigneeIds: [],
    dateFrom: defaultDateFrom,
    dateTo: defaultDateTo,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: projectService.getAll,
  });

  useEffect(() => {
    if (projects && projects.length > 0 && filters.projectId === null) {
      setFilters((prev) => ({ ...prev, projectId: Number(projects[0].id) }));
    }
  }, [projects, filters.projectId]);

  const { data: burndownData, isLoading: burndownLoading, isError: burndownError } = useQuery({
    queryKey: ["reports", "burndown", filters],
    queryFn: () => reportService.getBurndown(filters),
    enabled: !!filters.projectId,
  });

  const { data: statusDistData, isLoading: distStatusLoading, isError: distStatusError } = useQuery({
    queryKey: ["reports", "distribution-status", filters],
    queryFn: () => reportService.getDistribution(filters, "status"),
    enabled: !!filters.projectId,
  });

  const { data: priorityDistData, isLoading: distPriorityLoading } = useQuery({
    queryKey: ["reports", "distribution-priority", filters],
    queryFn: () => reportService.getDistribution(filters, "priority"),
    enabled: !!filters.projectId,
  });

  const { data: velocityData, isLoading: velocityLoading, isError: velocityError } = useQuery({
    queryKey: ["reports", "velocity", filters],
    queryFn: () => reportService.getVelocity(filters),
    enabled: !!filters.projectId,
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["reports", "summary", filters],
    queryFn: () => reportService.getSummary(filters),
    enabled: !!filters.projectId,
  });

  const { data: performanceData, isLoading: perfLoading, isError: perfError } = useQuery({
    queryKey: ["reports", "performance", filters],
    queryFn: () => reportService.getPerformance(filters),
    enabled: !!filters.projectId,
  });

  const handleLeaderboardRowClick = (userId: number) => {
    setFilters((prev) => ({ ...prev, assigneeIds: [userId] }));
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Raporlar</h1>
            <p className="text-muted-foreground">Projeleriniz için analiz ve içgörüler</p>
          </div>
          <ExportButton filters={filters} disabled={!filters.projectId} />
        </div>

        {/* Filter bar */}
        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            {
              label: "Toplam Görev",
              value: summaryData?.total_tasks,
              icon: <ListTodo className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Tamamlanan",
              value: summaryData?.completed_tasks,
              icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
            },
            {
              label: "Tamamlanma Oranı",
              value: summaryData ? `${summaryData.completion_rate.toFixed(1)}%` : undefined,
              icon: <TrendingUp className="h-4 w-4 text-primary" />,
            },
            {
              label: "Aktif Sprint",
              value: burndownData?.sprint_name || (burndownData ? "—" : undefined),
              icon: <Users className="h-4 w-4 text-muted-foreground" />,
            },
          ].map(({ label, value, icon }) => (
            <Card key={label} className="shadow-sm">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-medium">{label}</span>
                  {icon}
                </div>
                {summaryLoading ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{value ?? "—"}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart grid: 2×2 — chart components self-wrap in Card */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SprintBurndownChart
            data={burndownData}
            isLoading={burndownLoading}
            isError={burndownError}
            projectId={filters.projectId}
          />

          <TaskDistributionChart
            statusData={statusDistData}
            priorityData={priorityDistData}
            isLoading={distStatusLoading || distPriorityLoading}
            isError={distStatusError}
          />

          <VelocityTrendChart
            data={velocityData}
            isLoading={velocityLoading}
            isError={velocityError}
          />

          {/* Team Performance — no self-wrapping, needs its own Card */}
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
        </div>
      </div>
    </AppShell>
  )
}
