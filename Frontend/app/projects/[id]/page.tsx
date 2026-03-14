"use client"

import { use, useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Plus, Calendar, User as UserIcon, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { ParentTask } from "@/lib/types"
import { format } from "date-fns"
// YENİ: Modal import edildi
import { CreateTaskModal } from "@/components/create-task-modal"
import { TypeToConfirmDialog } from "@/components/ui/confirm-dialog"
import { MembersTab } from "@/components/project/members-tab"

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  // YENİ: Modal kontrol state'i
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Paginated task list state
  const PAGE_SIZE = 20
  const [page, setPage] = useState(1)
  const [allTasks, setAllTasks] = useState<ParentTask[]>([])
  const [taskTotal, setTaskTotal] = useState(0)

  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getById(id)
  })

  const { data: taskPage, isLoading: isTasksLoading } = useQuery({
    queryKey: ['project-tasks-paginated', id, page],
    queryFn: () => taskService.getByProjectPaginated(id, page, PAGE_SIZE),
    enabled: !!id,
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

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
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
          <p className="text-muted-foreground">Aradığınız proje mevcut değil veya projeyi görüntüleme izniniz yok.</p>
          <Button variant="outline" onClick={() => window.history.back()}>Geri Dön</Button>
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
                        <span>{project.startDate ? format(new Date(project.startDate), "PPP") : "TBD"}</span>
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
                {/* DÜZELTME: Buton onClick ile modalı açıyor */}
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

        {/* Project Content Tabs */}
        <Tabs defaultValue="board" className="w-full">
            <TabsList>
                <TabsTrigger value="board">Board</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="board" className="mt-6">
                {isTasksLoading && allTasks.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : allTasks.length === 0 ? (
                    <Card className="border-dashed">
                        <CardHeader className="text-center py-12">
                            <CardTitle>Henüz bir görev yok.</CardTitle>
                            <CardDescription>
                                Yeni bir görev oluşturarak projene başla.
                            </CardDescription>
                            <div className="pt-4">
                                <Button variant="outline" onClick={() => setIsCreateTaskOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Görev Oluştur
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>
                ) : (
                   <>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {allTasks.map(task => (
                             <Card
                                  key={task.id}
                                  className="cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => router.push(`/tasks/${task.id}`)}
                             >
                                 <CardHeader className="pb-2">
                                     <div className="flex justify-between items-start">
                                         <Badge variant={task.priority === 'CRITICAL' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
                                             {task.priority}
                                         </Badge>
                                         <span className="text-xs text-muted-foreground font-mono">{task.key}</span>
                                     </div>
                                     <CardTitle className="text-base mt-2 line-clamp-2">{task.title}</CardTitle>
                                 </CardHeader>
                                 <CardContent>
                                     <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                         <div className="flex items-center gap-1">
                                              <Avatar className="h-5 w-5">
                                                  <AvatarImage src={task.assignee?.avatar} />
                                                  <AvatarFallback className="text-[10px]">{task.assignee?.name?.charAt(0) || "?"}</AvatarFallback>
                                              </Avatar>
                                              <span>{task.assignee?.name || "Unassigned"}</span>
                                         </div>
                                         {task.points && (
                                             <Badge variant="outline" className="font-mono text-[10px]">{task.points} puan</Badge>
                                         )}
                                     </div>
                                 </CardContent>
                             </Card>
                         ))}
                     </div>
                     {allTasks.length < taskTotal && (
                       <div className="flex justify-center mt-4">
                         <Button
                           variant="outline"
                           onClick={() => setPage(p => p + 1)}
                           disabled={isTasksLoading}
                         >
                           {isTasksLoading ? 'Loading...' : `Load more (${taskTotal - allTasks.length} remaining)`}
                         </Button>
                       </div>
                     )}
                   </>
                )}
            </TabsContent>
            
            <TabsContent value="list">
                <div className="py-12 text-center text-muted-foreground">Liste görünümü yakında ..</div>
            </TabsContent>

            <TabsContent value="members" className="mt-6">
                <MembersTab projectId={id} currentUser={currentUser ?? null} />
            </TabsContent>
        </Tabs>
        
        {/* YENİ: Create Task Modal Entegrasyonu */}
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