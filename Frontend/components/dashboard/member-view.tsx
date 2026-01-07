"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, Clock, AlertTriangle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { activities, currentUser } from "@/lib/mock-data"
import type { ParentTask, SubTask } from "@/lib/types"
import { useQuery } from "@tanstack/react-query"
import { taskService } from "@/services/task-service"

const statusColors = {
  todo: "bg-slate-100 text-slate-700",
  "in-progress": "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
}
// ... (keep rest of imports and constants)

const priorityColors = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-slate-400 text-white",
}

function TaskRow({ task }: { task: ParentTask }) {
  const [expanded, setExpanded] = React.useState(false)
  const completedSubTasks = task.subTasks.filter((st) => st.status === "done").length
  const totalSubTasks = task.subTasks.length
  const progress = totalSubTasks > 0 ? Math.round((completedSubTasks / totalSubTasks) * 100) : 0

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center gap-4 p-4 hover:bg-accent/50">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        <div className="flex-1 min-w-0">
          <Link href={`/tasks/${task.id}`} className="group">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground group-hover:text-primary group-hover:underline">
                {task.key}
              </span>
              <span className="font-medium truncate group-hover:text-primary group-hover:underline">
                {task.title}
              </span>
              <Badge className={cn("ml-2", priorityColors[task.priority])}>{task.priority}</Badge>
            </div>
          </Link>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-muted-foreground">Parent Task (Ana Görev)</span>
            {totalSubTasks > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedSubTasks}/{totalSubTasks} sub-tasks
              </span>
            )}
          </div>
        </div>

        <div className="w-32">
          <Progress value={progress} className="h-2" />
        </div>

        <Badge className={statusColors[task.status]} variant="secondary">
          {task.status === "in-progress" ? "In Progress" : task.status === "todo" ? "To Do" : "Done"}
        </Badge>
      </div>

      {/* Sub-tasks */}
      {expanded && task.subTasks.length > 0 && (
        <div className="bg-accent/30 border-t border-border">
          {task.subTasks.map((subTask) => (
            <SubTaskRow key={subTask.id} subTask={subTask} />
          ))}
        </div>
      )}
    </div>
  )
}

function SubTaskRow({ subTask }: { subTask: SubTask }) {
  return (
    <Link
      href={`/tasks/${subTask.id}`}
      className="flex items-center gap-4 py-3 px-4 pl-14 hover:bg-accent/50 border-b border-border/50 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{subTask.key}</span>
          <span className="text-sm truncate">{subTask.title}</span>
        </div>
        <span className="text-xs text-muted-foreground">Sub-Task (Alt Görev)</span>
      </div>

      <Badge className={statusColors[subTask.status]} variant="secondary">
        {subTask.status === "in-progress" ? "In Progress" : subTask.status === "todo" ? "To Do" : "Done"}
      </Badge>

      {subTask.assignee && (
        <Avatar className="h-6 w-6">
          <AvatarImage src={subTask.assignee.avatar || "/placeholder.svg"} />
          <AvatarFallback>
            {subTask.assignee.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      )}
    </Link>
  )
}

export function MemberView() {
  const { data: myTasks, isLoading, error } = useQuery({
      queryKey: ['myTasks'],
      queryFn: taskService.getMyTasks
  })

  // TODO: Add overdue tasks logic when backend supports due date filtering or do it client side
  const overdueTasks = myTasks ? myTasks.filter((t) => {
    if (!t.dueDate) return false
    return new Date(t.dueDate) < new Date() && t.status !== "done"
  }) : []

  if (isLoading) {
      return (
          <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  if (error) {
      return <div>Error loading tasks</div>
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main Task List */}
      <div className="lg:col-span-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>My Work - Task Hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!myTasks || myTasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                    You have no tasks assigned.
                </div>
            ) : (
                myTasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Side Widgets */}
      <div className="space-y-6">
        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.slice(0, 4).map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={activity.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {activity.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{" "}
                    <span className="text-muted-foreground">{activity.content}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card className="shadow-sm border-red-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overdue tasks</p>
            ) : (
              <div className="space-y-3">
                {overdueTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-red-600">{task.key}</span>
                      <span className="text-sm font-medium truncate">{task.title}</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">Due: {task.dueDate}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
