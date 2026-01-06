"use client"
import { TrendingUp, FolderKanban, CheckCircle2, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { projects, parentTasks } from "@/lib/mock-data"

const methodologyColors = {
  scrum: "bg-blue-100 text-blue-700",
  kanban: "bg-purple-100 text-purple-700",
  waterfall: "bg-green-100 text-green-700",
}

export function ManagerView() {
  const totalProjects = projects.length
  const activeTasks = parentTasks.filter((t) => t.status !== "done").length
  const completedTasks = parentTasks.filter((t) => t.status === "done").length
  const sprintVelocity = 42

  const metrics = [
    { title: "Total Projects", value: totalProjects, icon: FolderKanban, color: "text-blue-600" },
    { title: "Active Tasks", value: activeTasks, icon: TrendingUp, color: "text-orange-600" },
    { title: "Phase Velocity", value: sprintVelocity, icon: Zap, color: "text-purple-600" },
    { title: "Completed Tasks", value: completedTasks, icon: CheckCircle2, color: "text-green-600" },
  ]

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Project Portfolio Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Project Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Methodology</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="w-[200px]">Progress</TableHead>
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
                    <Badge className={methodologyColors[project.methodology]} variant="secondary">
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
                  <TableCell className="text-sm">{project.endDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress value={project.progress} className="h-2 flex-1" />
                      <span className="text-sm font-medium w-10">{project.progress}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
