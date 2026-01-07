"use client"
import { use } from "react"
import { AppShell } from "@/components/app-shell"
import { TaskHeader } from "@/components/task-detail/task-header"
import { TaskContent } from "@/components/task-detail/task-content"
import { TaskSidebar } from "@/components/task-detail/task-sidebar"
import { taskService } from "@/services/task-service"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: task, isLoading, error } = useQuery({
      queryKey: ['task', id],
      queryFn: () => taskService.getById(id)
  })

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (error || !task) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Task Not Found</h1>
            <p className="text-muted-foreground">The task with ID {id} does not exist or could not be loaded.</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <TaskHeader task={task} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <TaskContent task={task} />
          <TaskSidebar task={task} />
        </div>
      </div>
    </AppShell>
  )
}
