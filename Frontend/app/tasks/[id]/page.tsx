"use client"
import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { TaskHeader } from "@/components/task-detail/task-header"
import { TaskContent } from "@/components/task-detail/task-content"
import { TaskSidebar } from "@/components/task-detail/task-sidebar"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { taskService } from "@/services/task-service"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Trash2 } from "lucide-react"

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data: task, isLoading, error } = useQuery({
      queryKey: ['task', id],
      queryFn: () => taskService.getTask(id)
  })

  const handleDeleteTask = async () => {
    try {
      await taskService.deleteTask(id)
      router.back()
    } catch {
      // Error is logged by apiClient interceptor
    }
  }

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
            <h1 className="text-2xl font-bold">Görev Bulunamadı</h1>
            <p className="text-muted-foreground">ID {id} olan görev mevcut değil veya yüklenemedi.</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <TaskHeader task={task} />
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Task
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <TaskContent task={task} />
          <TaskSidebar task={task} />
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Task"
        description="Are you sure you want to delete this task?"
        confirmLabel="Delete Task"
        destructive
        onConfirm={handleDeleteTask}
      />
    </AppShell>
  )
}
