"use client"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { TaskHeader } from "@/components/task-detail/task-header"
import { TaskContent } from "@/components/task-detail/task-content"
import { TaskSidebar } from "@/components/task-detail/task-sidebar"
import { parentTasks, subTasks } from "@/lib/mock-data"

export default function TaskDetailPage() {
  const params = useParams()
  const taskKey = params.taskKey as string

  const allTasks = [...parentTasks, ...subTasks]
  let task = allTasks.find((t) => t.key === taskKey)

  if (task && "parentTaskId" in task) {
    const parentTask = parentTasks.find((pt) => pt.id === task.parentTaskId)
    if (parentTask) {
      task.project = parentTask.project
    }
  }

  if (!task) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Task Not Found</h1>
            <p className="text-muted-foreground">The task {taskKey} does not exist.</p>
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
