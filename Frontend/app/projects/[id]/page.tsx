"use client"

import { use, useState } from "react"
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
import { format } from "date-fns"
// YENİ: Modal import edildi
import { CreateTaskModal } from "@/components/create-task-modal"

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  // YENİ: Modal kontrol state'i
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)

  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getById(id)
  })

  const { data: tasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskService.getTasksByProject(id),
    enabled: !!id
  })

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
          <h2 className="text-xl font-semibold">Project not found</h2>
          <p className="text-muted-foreground">The project you are looking for does not exist or you don't have permission to view it.</p>
          <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
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
                        <span>Lead: {project.lead?.name || "Unassigned"}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-2">
                {/* DÜZELTME: Buton onClick ile modalı açıyor */}
                <Button onClick={() => setIsCreateTaskOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
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
                        <DropdownMenuItem className="text-destructive">Archive Project</DropdownMenuItem>
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
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="board" className="mt-6">
                {isTasksLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : !tasks || tasks.length === 0 ? (
                    <Card className="border-dashed">
                        <CardHeader className="text-center py-12">
                            <CardTitle>No tasks yet</CardTitle>
                            <CardDescription>
                                Get started by creating your first task for this project.
                            </CardDescription>
                            <div className="pt-4">
                                {/* DÜZELTME: Buton onClick ile modalı açıyor */}
                                <Button variant="outline" onClick={() => setIsCreateTaskOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Task
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {tasks.map(task => (
                           // Not: Board görünümü için burası geçicidir, listelenmesi yeterli şu an.
                           <Card 
                                key={task.id} 
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => router.push(`/tasks/${task.id}`)}
                           >
                               <CardHeader className="pb-2">
                                   <div className="flex justify-between items-start">
                                       {/* HATA DÜZELTİLDİ: 'critical' -> 'CRITICAL' */}
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
                                           <Badge variant="outline" className="font-mono text-[10px]">{task.points} pts</Badge>
                                       )}
                                   </div>
                               </CardContent>
                           </Card>
                       ))}
                   </div>
                )}
            </TabsContent>
            
            <TabsContent value="list">
                <div className="py-12 text-center text-muted-foreground">List view coming soon...</div>
            </TabsContent>
        </Tabs>
        
        {/* YENİ: Create Task Modal Entegrasyonu */}
        <CreateTaskModal 
            open={isCreateTaskOpen} 
            onOpenChange={setIsCreateTaskOpen}
            defaultProjectId={id}
        />
      </div>
    </AppShell>
  )
}