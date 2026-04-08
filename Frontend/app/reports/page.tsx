"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { subDays } from "date-fns"
import { Users } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterBar } from "@/components/reports/filter-bar"
import { SprintBurndownChart } from "@/components/reports/sprint-burndown-chart"
import { TaskDistributionChart } from "@/components/reports/task-distribution-chart"
import { VelocityTrendChart } from "@/components/reports/velocity-trend-chart"
import { ExportButton } from "@/components/reports/export-button"
import { reportService, ReportFilters } from "@/services/report-service"
import { projectService } from "@/services/project-service"
import { Project } from "@/lib/types"

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    projectId: null,
    assigneeIds: [],
    dateFrom: subDays(new Date(), 30).toISOString().split("T")[0],
    dateTo: new Date().toISOString().split("T")[0],
  });

  // Fetch projects to set default
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: projectService.getAll,
  });

  // Set most recently active project as default on mount
  useEffect(() => {
    if (projects.length > 0 && !filters.projectId) {
      setFilters((prev) => ({
        ...prev,
        projectId: Number(projects[0].id),
      }));
    }
  }, [projects]); // eslint-disable-line react-hooks/exhaustive-deps

  // Find the key of the selected project for export filenames
  const selectedProject = projects.find((p: Project) => Number(p.id) === filters.projectId);
  const projectKey = selectedProject?.key || "REPORT";

  // Independent chart queries
  const {
    data: burndownData,
    isLoading: burndownLoading,
    isError: burndownError,
  } = useQuery({
    queryKey: ["reports", "burndown", filters],
    queryFn: () => reportService.getBurndown(filters),
    enabled: !!filters.projectId,
  });

  const {
    data: statusDistData,
    isLoading: statusDistLoading,
    isError: statusDistError,
  } = useQuery({
    queryKey: ["reports", "distribution-status", filters],
    queryFn: () => reportService.getDistribution(filters, "status"),
    enabled: !!filters.projectId,
  });

  const {
    data: priorityDistData,
    isLoading: priorityDistLoading,
    isError: priorityDistError,
  } = useQuery({
    queryKey: ["reports", "distribution-priority", filters],
    queryFn: () => reportService.getDistribution(filters, "priority"),
    enabled: !!filters.projectId,
  });

  const {
    data: velocityData,
    isLoading: velocityLoading,
    isError: velocityError,
  } = useQuery({
    queryKey: ["reports", "velocity", filters],
    queryFn: () => reportService.getVelocity(filters),
    enabled: !!filters.projectId,
  });

  const distLoading = statusDistLoading || priorityDistLoading;
  const distError = statusDistError || priorityDistError;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page header row */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Raporlar</h1>
            <p className="text-muted-foreground">Projeleriniz için analiz ve içgörüler</p>
          </div>
          <ExportButton
            filters={filters}
            disabled={!filters.projectId}
            projectKey={projectKey}
          />
        </div>

        {/* Global filter bar */}
        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Chart grid: 2x2 */}
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
            isLoading={distLoading}
            isError={distError}
          />
          <VelocityTrendChart
            data={velocityData}
            isLoading={velocityLoading}
            isError={velocityError}
          />
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
  );
}
