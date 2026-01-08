"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, Clock, AlertTriangle, Loader2, Folder } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { activities } from "@/lib/mock-data"
import type { ParentTask, SubTask } from "@/lib/types"
import { useQuery } from "@tanstack/react-query"
import { taskService } from "@/services/task-service"

const statusColors: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700",
  "in-progress": "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-slate-400 text-white",
}

// --- 1. Helper: Hiyerarşi Oluşturma ---
function buildTaskHierarchy(tasks: ParentTask[]) {
  const taskMap = new Map<string, ParentTask>();
  const roots: ParentTask[] = [];

  // Mevcut taskları map'e ekle
  tasks.forEach((t) => {
    taskMap.set(t.id, { ...t, subTasks: [] });
  });

  // İlişkileri kur
  tasks.forEach((t) => {
    const currentTask = taskMap.get(t.id)!;

    if (t.parentTaskId) {
      let parent = taskMap.get(t.parentTaskId);

      // Ghost Parent Oluşturma
      if (!parent && t.parentSummary) {
        parent = {
          id: t.parentSummary.id,
          key: t.parentSummary.key,
          title: t.parentSummary.title,
          status: t.parentSummary.status,
          projectId: t.parentSummary.projectId,
          isGhost: true,
          assignee: null,
          parentTaskId: null,
          subTasks: [],
          // GHOST FIX: Proje ismini çocuktan alıyoruz (child task'ta project objesi dolu gelir)
          project: t.project || { id: t.parentSummary.projectId, name: "Unknown Project" },
          priority: "medium",
          description: "",
          points: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          reporter: {} as any,
          dueDate: null,
          isRecurring: false,
          loggedTime: 0,
          estimatedTime: 0,
          labels: []
        };
        taskMap.set(parent.id, parent);
        roots.push(parent);
      }

      if (parent) {
        parent.subTasks.push(currentTask as unknown as SubTask);
      } else {
        roots.push(currentTask);
      }
    } else {
      roots.push(currentTask);
    }
  });

  return roots;
}

// --- 2. Helper: Projeye Göre Gruplama ---
interface ProjectGroup {
    id: string;
    name: string;
    tasks: ParentTask[];
}

function groupTasksByProject(roots: ParentTask[]): ProjectGroup[] {
    const groups = new Map<string, ProjectGroup>();

    roots.forEach(task => {
        // Proje ID ve ismini güvenli şekilde alıyoruz
        const projectId = task.projectId || task.project?.id?.toString() || "unknown";
        const projectName = task.project?.name || "Other Projects";

        if (!groups.has(projectId)) {
            groups.set(projectId, {
                id: projectId,
                name: projectName,
                tasks: []
            });
        }
        groups.get(projectId)!.tasks.push(task);
    });

    return Array.from(groups.values());
}

// --- Bileşenler ---

function TaskRow({ task }: { task: ParentTask }) {
  // DÜZELTME 1: Subtaskler varsayılan olarak kapalı (collapsed) gelsin
  const [expanded, setExpanded] = React.useState(false)
  
  const completedSubTasks = task.subTasks.filter((st) => st.status === "done").length
  const totalSubTasks = task.subTasks.length
  const progress = totalSubTasks > 0 ? Math.round((completedSubTasks / totalSubTasks) * 100) : 0

  return (
    <div className="border-b border-border last:border-0">
      {/* DÜZELTME 3: Parent Tasklar grileşmemeli (Opacity kaldırıldı) */}
      <div className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-6 w-6 shrink-0", totalSubTasks === 0 && "opacity-0 pointer-events-none")}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        <div className="flex-1 min-w-0">
          <Link href={`/tasks/${task.id}`} className="group block">
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
            <span className="text-xs text-muted-foreground">
                {task.isGhost ? "Context Task (Parent)" : "Parent Task"}
            </span>
            {totalSubTasks > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedSubTasks}/{totalSubTasks} sub-tasks
              </span>
            )}
          </div>
        </div>

        <div className="w-32 hidden sm:block">
          <Progress value={progress} className="h-2" />
        </div>

        <Badge className={statusColors[task.status] || "bg-gray-100"} variant="secondary">
          {task.status === "in-progress" ? "In Progress" : task.status === "todo" ? "To Do" : task.status}
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
  // Statü kontrolü (null safety)
  const safeStatus = subTask.status || "todo";

  return (
    <Link
      href={`/tasks/${subTask.id}`}
      className="flex items-center gap-4 py-3 px-4 pl-14 hover:bg-accent/50 border-b border-border/50 last:border-0 group transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground group-hover:text-primary">{subTask.key}</span>
          <span className="text-sm truncate group-hover:text-primary">{subTask.title}</span>
        </div>
        <span className="text-xs text-muted-foreground">Sub-Task (Alt Görev)</span>
      </div>

      {/* Subtask Statusu Eklendi */}
      <Badge className={statusColors[safeStatus] || "bg-gray-100"} variant="secondary">
        {safeStatus === "in-progress" ? "In Progress" : safeStatus === "todo" ? "To Do" : safeStatus.replace("-", " ")}
      </Badge>

      {subTask.assignee && (
        <Avatar className="h-6 w-6">
          <AvatarImage src={subTask.assignee.avatar || "/placeholder.svg"} />
          <AvatarFallback>
            {subTask.assignee.name ? subTask.assignee.name.substring(0, 2).toUpperCase() : "??"}
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

  // 1. Hiyerarşiyi Kur
  const hierarchicalTasks = React.useMemo(() => {
    if (!myTasks) return [];
    return buildTaskHierarchy(myTasks);
  }, [myTasks]);

  // 2. Projelere Göre Grupla
  const groupedTasks = React.useMemo(() => {
      return groupTasksByProject(hierarchicalTasks);
  }, [hierarchicalTasks]);

  const overdueTasks = myTasks ? myTasks.filter((t) => {
    if (!t.dueDate) return false
    return new Date(t.dueDate) < new Date() && t.status !== "done"
  }) : []

  if (isLoading) {
    return (
        <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 text-red-600 rounded-md">
          Error loading tasks.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main Task List (Grouped by Project) */}
      <div className="lg:col-span-2 space-y-6">
        
        {groupedTasks.length === 0 ? (
             <Card className="shadow-sm">
                <CardContent className="p-12 text-center text-muted-foreground">
                    <p>You have no tasks assigned yet.</p>
                </CardContent>
             </Card>
        ) : (
            // DÜZELTME 2: Her proje ayrı bir kartta ve başlık "Other Tasks" değil
            groupedTasks.map((group) => (
                <Card key={group.id} className="shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/20 py-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4 text-muted-foreground" />
                                <CardTitle className="text-lg">{group.name}</CardTitle>
                            </div>
                            <Badge variant="outline" className="bg-background">
                                {group.tasks.length} {group.tasks.length === 1 ? 'Task' : 'Tasks'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {group.tasks.map((task) => (
                            <TaskRow key={task.id} task={task} />
                        ))}
                    </CardContent>
                </Card>
            ))
        )}
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
                    {activity.user.name.substring(0, 2).toUpperCase()}
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
                    <p className="text-xs text-red-600 mt-1">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
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