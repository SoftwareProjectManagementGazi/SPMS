"use client"

import { use, useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Plus, Calendar, User as UserIcon, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { projectService } from "@/services/project-service"
import { taskService } from "@/services/task-service"
import { authService } from "@/services/auth-service"
import sprintService from "@/services/sprint-service"
import { ParentTask } from "@/lib/types"
import { format } from "date-fns"
import { CreateTaskModal } from "@/components/create-task-modal"
import { TypeToConfirmDialog } from "@/components/ui/confirm-dialog"
import { MembersTab } from "@/components/project/members-tab"
import { BoardTab } from "@/components/project/board-tab"
import { ListTab } from "@/components/project/list-tab"
import { BoardColumnsSettings } from "@/components/project/board-columns-settings"

// Dynamic imports for heavy/SSR-incompatible tabs
const CalendarTab = dynamic(
  () => import("@/components/project/calendar-tab").then(m => ({ default: m.CalendarTab })),
  { ssr: false }
)

const GanttTab = dynamic(
  () => import("@/components/project/gantt-tab").then(m => ({ default: m.GanttTab })),
  { ssr: false }
)

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // View persistence: restore last-used tab from localStorage
  const [activeView, setActiveView] = useState<string>(() => {
    if (typeof window === "undefined") return "board"
    return localStorage.getItem(`project-view-${id}`) ?? "board"
  })

  function handleViewChange(value: string) {
    setActiveView(value)
    if (typeof window !== "undefined") {
      localStorage.setItem(`project-view-${id}`, value)
    }
  }

  // Paginated task list state
  const PAGE_SIZE = 20
  const [page, setPage] = useState(1)
  const [allTasks, setAllTasks] = useState<ParentTask[]>([])
  const [taskTotal, setTaskTotal] = useState(0)

  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.getById(id),
  })

  const { data: taskPage, isLoading: isTasksLoading } = useQuery({
    queryKey: ["project-tasks-paginated", id, page],
    queryFn: () => taskService.getByProjectPaginated(id, page, PAGE_SIZE),
    enabled: !!id,
    staleTime: 30_000,
  })

  // Append new page to accumulated task list
  useEffect(() => {
    if (taskPage) {
      if (page === 1) {
        setAllTasks(taskPage.items)
      } else {
        setAllTasks(prev => [...prev, ...taskPage.items])
      }
      setTaskTotal(taskPage.total)
    }
  }, [taskPage, page])

  // Reset to page 1 when project changes
  useEffect(() => {
    setPage(1)
    setAllTasks([])
    setTaskTotal(0)
  }, [id])

  // Re-sync activeView when id changes (different project)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setActiveView(localStorage.getItem(`project-view-${id}`) ?? "board")
    }
  }, [id])

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: authService.getCurrentUser,
  })

  const { data: sprints = [] } = useQuery({
    queryKey: ["project-sprints", id],
    queryFn: () => sprintService.list(Number(id)),
    enabled: !!id,
  })

  const handleDeleteProject = async () => {
    try {
      await projectService.deleteProject(id)
      router.push("/projects")
    } catch {
      // Error is logged by apiClient interceptor
    }
  }

  if (isProjectLoading) {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (projectError || !project) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <h2 className="text-xl font-semibold">Proje bulunamadı</h2>
          <p className="text-muted-foreground">
            Aradığınız proje mevcut değil veya projeyi görüntüleme izniniz yok.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Geri Dön
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Project Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant="outline" className="text-sm font-normal uppercase">
                {project.key}
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              {project.description || "No description provided."}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {project.startDate ? format(new Date(project.startDate), "PPP") : "TBD"}
                </span>
                {project.endDate && (
                  <>
                    <span>-</span>
                    <span>{format(new Date(project.endDate), "PPP")}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                <span>Lider: {project.lead?.name || "Unassigned"}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setIsCreateTaskOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Görev Oluştur
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
                <DropdownMenuItem>Edit Project</DropdownMenuItem>
                <DropdownMenuItem>Manage Team</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/projects/${id}/sprints`)}>
                  Manage Phases
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Project Content Tabs — controlled with localStorage persistence */}
        <Tabs value={activeView} onValueChange={handleViewChange} className="w-full">
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Board tab: full Kanban with DnD */}
          <TabsContent value="board" className="mt-6">
            <div className="rounded-xl border bg-card shadow-sm p-4">
              {isTasksLoading && allTasks.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : allTasks.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <p className="text-xl font-semibold">Henüz bir görev yok.</p>
                  <p className="text-muted-foreground">Yeni bir görev oluşturarak projene başla.</p>
                  <Button variant="outline" onClick={() => setIsCreateTaskOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Görev Oluştur
                  </Button>
                </div>
              ) : (
                <BoardTab projectId={id} tasks={allTasks} />
              )}
            </div>
          </TabsContent>

          {/* List tab: sortable/filterable task table with Load More */}
          <TabsContent value="list" className="mt-6">
            <div className="rounded-xl border bg-card shadow-sm p-4">
              <ListTab
                tasks={allTasks}
                total={taskTotal}
                page={page}
                onLoadMore={() => setPage(p => p + 1)}
                isLoading={isTasksLoading}
              />
            </div>
          </TabsContent>

          {/* Timeline tab: Gantt chart */}
          <TabsContent value="timeline" className="mt-6">
            <div className="rounded-xl border bg-card shadow-sm p-4">
              <GanttTab tasks={allTasks} />
            </div>
          </TabsContent>

          {/* Calendar tab */}
          <TabsContent value="calendar" className="mt-6">
            <div className="rounded-xl border bg-card shadow-sm p-4">
              <CalendarTab projectId={id} tasks={allTasks} sprints={sprints} />
            </div>
          </TabsContent>

          {/* Members tab */}
          <TabsContent value="members" className="mt-6">
            <MembersTab projectId={id} currentUser={currentUser ?? null} />
          </TabsContent>

          {/* Settings tab — Board Columns configuration */}
          <TabsContent value="settings" className="mt-6">
            <div className="rounded-xl border bg-card shadow-sm p-4 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Board Columns</h3>
                <BoardColumnsSettings
                  projectId={id}
                  currentUser={currentUser ?? null}
                  isProjectManager={!!currentUser && !!project && currentUser.id === project.lead?.id}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Task Modal */}
        <CreateTaskModal
          open={isCreateTaskOpen}
          onOpenChange={setIsCreateTaskOpen}
          defaultProjectId={id}
        />

        {/* Delete Project Dialog */}
        <TypeToConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Project"
          description="This action cannot be undone. All tasks will be deleted."
          confirmText={project.name}
          onConfirm={handleDeleteProject}
        />
      </div>
    </AppShell>
  )
}
