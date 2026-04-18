"use client"
import { TrendingUp, FolderKanban, CheckCircle2, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from "@tanstack/react-query"
import { subDays } from "date-fns"
import Link from "next/link"
import { projectService } from "@/services/project-service"
import { reportService } from "@/services/report-service"
import { TeamPerformanceTable } from "@/components/reports/team-performance-table"

const methodologyColors: Record<string, string> = {
  scrum: "bg-blue-100 text-blue-700",
  kanban: "bg-purple-100 text-purple-700",
  waterfall: "bg-green-100 text-green-700",
}

export function ManagerView() {
  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ["projects"],
    queryFn: projectService.getAll,
  })

  const totalProjects = projects?.length ?? 0
  const defaultProjectId = projects && projects.length > 0 ? Number(projects[0].id) : null

  const { data: summaryData } = useQuery({
    queryKey: ["reports", "summary", defaultProjectId],
    queryFn: () => reportService.getSummary({
      projectId: defaultProjectId!,
      assigneeIds: [],
      dateFrom: subDays(new Date(), 30).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
    }),
    enabled: !!defaultProjectId,
  })

  const { data: performanceData, isLoading: perfLoading, isError: perfError } = useQuery({
    queryKey: ["reports", "performance", "dashboard", defaultProjectId],
    queryFn: () => reportService.getPerformance({
      projectId: defaultProjectId!,
      assigneeIds: [],
      dateFrom: subDays(new Date(), 30).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
    }),
    enabled: !!defaultProjectId,
  })

  const metrics = [
    { title: "Toplam Projeler", value: totalProjects, icon: FolderKanban, color: "text-blue-600" },
    { title: "Aktif Görevler", value: summaryData?.active_tasks ?? "-", icon: TrendingUp, color: "text-orange-600" },
    { title: "Tamamlanan Görevler", value: summaryData?.completed_tasks ?? "-", icon: CheckCircle2, color: "text-green-600" },
  ]

  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 text-red-600 rounded-md">
        Projeler yüklenemedi. Lütfen daha sonra tekrar deneyin.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Proje Portföyü Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Proje Portföyü</CardTitle>
        </CardHeader>
        <CardContent>
          {!projects || projects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Henüz proje bulunmuyor.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proje Adı</TableHead>
                  <TableHead>Metodoloji</TableHead>
                  <TableHead>Yönetici</TableHead>
                  <TableHead>Bitiş Tarihi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{project.key}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={methodologyColors[project.methodology] ?? "bg-gray-100 text-gray-700"}
                        variant="secondary"
                      >
                        {project.methodology.charAt(0).toUpperCase() + project.methodology.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={project.lead.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {project.lead.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{project.lead.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
    </div>
  )
}
