"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { subDays } from "date-fns"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, BarChart3, PieChart, TrendingUp } from "lucide-react"
import { reportService, ReportFilters } from "@/services/report-service"
import { projectService } from "@/services/project-service"
import { TeamPerformanceTable } from "@/components/reports/team-performance-table"

export default function ReportsPage() {
  const defaultDateFrom = subDays(new Date(), 30).toISOString().split("T")[0];
  const defaultDateTo = new Date().toISOString().split("T")[0];

  const [filters, setFilters] = useState<ReportFilters>({
    projectId: null,
    assigneeIds: [],
    dateFrom: defaultDateFrom,
    dateTo: defaultDateTo,
  });

  // Fetch all projects and default to the first one
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: projectService.getAll,
  });

  useEffect(() => {
    if (projects && projects.length > 0 && filters.projectId === null) {
      setFilters((prev) => ({ ...prev, projectId: Number(projects[0].id) }));
    }
  }, [projects, filters.projectId]);

  // Burndown data
  const { data: burndownData, isLoading: burndownLoading, isError: burndownError } = useQuery({
    queryKey: ["reports", "burndown", filters],
    queryFn: () => reportService.getBurndown(filters),
    enabled: !!filters.projectId,
  });

  // Distribution status data
  const { data: statusDistData, isLoading: distStatusLoading, isError: distStatusError } = useQuery({
    queryKey: ["reports", "distribution-status", filters],
    queryFn: () => reportService.getDistribution(filters, "status"),
    enabled: !!filters.projectId,
  });

  // Distribution priority data
  const { data: priorityDistData, isLoading: distPriorityLoading } = useQuery({
    queryKey: ["reports", "distribution-priority", filters],
    queryFn: () => reportService.getDistribution(filters, "priority"),
    enabled: !!filters.projectId,
  });

  // Velocity data
  const { data: velocityData, isLoading: velocityLoading, isError: velocityError } = useQuery({
    queryKey: ["reports", "velocity", filters],
    queryFn: () => reportService.getVelocity(filters),
    enabled: !!filters.projectId,
  });

  // Performance data (Team Performance panel — Plan 04)
  const { data: performanceData, isLoading: perfLoading, isError: perfError } = useQuery({
    queryKey: ["reports", "performance", filters],
    queryFn: () => reportService.getPerformance(filters),
    enabled: !!filters.projectId,
  });

  const handleLeaderboardRowClick = (userId: number) => {
    setFilters((prev) => ({
      ...prev,
      assigneeIds: [userId],
    }));
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page header row */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Raporlar</h1>
            <p className="text-muted-foreground">Projeleriniz için analiz ve içgörüler</p>
          </div>
        </div>

        {/* Chart grid: 2x2 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Sprint Burndown Panel */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Sprint Burndown
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              {burndownLoading ? (
                <Skeleton className="w-full h-full" />
              ) : burndownError ? (
                <p className="text-sm text-destructive">Veriler yüklenemedi. Sayfayı yenileyin.</p>
              ) : !burndownData?.series?.length ? (
                <p className="text-sm">Bu dönem için veri bulunamadı.</p>
              ) : (
                <p className="text-sm">{burndownData.sprint_name}</p>
              )}
            </CardContent>
          </Card>

          {/* Task Distribution Panel */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Görev Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              {distStatusLoading || distPriorityLoading ? (
                <Skeleton className="w-full h-full" />
              ) : distStatusError ? (
                <p className="text-sm text-destructive">Veriler yüklenemedi. Sayfayı yenileyin.</p>
              ) : !statusDistData?.items?.length ? (
                <p className="text-sm">Bu dönem için veri bulunamadı.</p>
              ) : (
                <p className="text-sm">{statusDistData.items.length} durum</p>
              )}
            </CardContent>
          </Card>

          {/* Velocity Trend Panel */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Velocity Trendi
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              {velocityLoading ? (
                <Skeleton className="w-full h-full" />
              ) : velocityError ? (
                <p className="text-sm text-destructive">Veriler yüklenemedi. Sayfayı yenileyin.</p>
              ) : !velocityData?.series?.length ? (
                <p className="text-sm">Bu dönem için veri bulunamadı.</p>
              ) : (
                <p className="text-sm">{velocityData.series.length} sprint</p>
              )}
            </CardContent>
          </Card>

          {/* Team Performance Panel — Plan 04 */}
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
