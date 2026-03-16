"use client"

import * as React from "react"
import { toast } from "sonner"
import { CalendarIcon, UserPlus, X, Plus } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { ParentTask, TaskPriority } from "@/lib/types"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { taskService } from "@/services/task-service"
import { userService } from "@/services/user-service"
import { projectService } from "@/services/project-service"
import { authService } from "@/services/auth-service"
import sprintService from "@/services/sprint-service"
import taskDependencyService from "@/services/task-dependency-service"
import Link from "next/link"

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-500 hover:bg-red-600",
  HIGH: "bg-orange-500 hover:bg-orange-600",
  MEDIUM: "bg-yellow-500 hover:bg-yellow-600",
  LOW: "bg-blue-500 hover:bg-blue-600",
}

interface TaskSidebarProps {
  task: ParentTask
}

export function TaskSidebar({ task }: TaskSidebarProps) {
  const queryClient = useQueryClient()
  const [assigneeOpen, setAssigneeOpen] = React.useState(false)
  const [depPopoverOpen, setDepPopoverOpen] = React.useState(false)

  // Recurrence dialog state
  const [showRecurDialog, setShowRecurDialog] = React.useState(false)
  const [pendingUpdate, setPendingUpdate] = React.useState<Record<string, unknown> | null>(null)
  const [selectedScope, setSelectedScope] = React.useState<"all" | "this">("all")

  // 1. Current user (for role-based rendering)
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: authService.getCurrentUser,
  })

  const isManagerOrAdmin =
    currentUser?.role?.name === "Manager" || currentUser?.role?.name === "Admin"

  // 2. Project details (for columns/status)
  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ["project", task.projectId],
    queryFn: () => projectService.getById(task.projectId),
    enabled: !!task.projectId,
  })

  // 3. Users
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: userService.getAll,
  })

  // 4. Sprints for this project
  const { data: sprints = [] } = useQuery({
    queryKey: ["sprints", task.projectId],
    queryFn: () => sprintService.list(Number(task.projectId)),
    enabled: !!task.projectId,
  })

  // 5. Dependencies
  const { data: deps } = useQuery({
    queryKey: ["dependencies", task.id],
    queryFn: () => taskDependencyService.list(Number(task.id)),
    enabled: !!task.id,
  })

  // 6. Project tasks for dependency search
  const { data: projectTasksRaw = [] } = useQuery({
    queryKey: ["project-tasks-list", task.projectId],
    queryFn: () => taskService.getByProjectId(task.projectId),
    enabled: !!task.projectId,
  })

  // 7. Watch status query
  const { data: watchStatusData } = useQuery({
    queryKey: ["watch-status", task.id],
    queryFn: () => taskService.getWatchStatus(Number(task.id)),
    enabled: !!task.id,
  })

  const isWatching = watchStatusData?.is_watching ?? false

  const watchTaskMutation = useMutation({
    mutationFn: () => taskService.watchTask(Number(task.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watch-status", task.id] })
      toast.success("Görev izlemeye alındı")
    },
    onError: () => toast.error("İzleme eklenemedi"),
  })

  const unwatchTaskMutation = useMutation({
    mutationFn: () => taskService.unwatchTask(Number(task.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watch-status", task.id] })
      toast.success("Görev izlemesi kaldırıldı")
    },
    onError: () => toast.error("İzleme kaldırılamadı"),
  })

  // 8. Update mutation
  const updateTaskMutation = useMutation({
    mutationFn: (data: any) => taskService.updateTask(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", task.id] })
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] })
      queryClient.invalidateQueries({ queryKey: ["myTasks"] })
      if (task.parentTaskId) {
        queryClient.invalidateQueries({ queryKey: ["task", task.parentTaskId] })
      }
      toast.success("Task updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update task")
    },
  })

  // 8. Dependency mutations
  const addDepMutation = useMutation({
    mutationFn: (dependsOnId: number) => taskDependencyService.add(Number(task.id), dependsOnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dependencies", task.id] })
      setDepPopoverOpen(false)
      toast.success("Dependency added")
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to add dependency"),
  })

  const removeDepMutation = useMutation({
    mutationFn: (depId: number) => taskDependencyService.remove(Number(task.id), depId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dependencies", task.id] }),
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to remove dependency"),
  })

  // Intercept field save: if recurring task, show scope dialog
  const handleFieldUpdate = (fields: Record<string, unknown>) => {
    if (task.isRecurring) {
      setPendingUpdate(fields)
      setSelectedScope("all")
      setShowRecurDialog(true)
    } else {
      updateTaskMutation.mutate(fields)
    }
  }

  const handleStatusChange = (columnIdString: string) => {
    handleFieldUpdate({ column_id: parseInt(columnIdString) })
  }

  const handleAssigneeChange = (userId: string) => {
    handleFieldUpdate({ assignee_id: parseInt(userId) })
    setAssigneeOpen(false)
  }

  const handlePriorityChange = (priority: TaskPriority) => {
    handleFieldUpdate({ priority })
  }

  const handleDateChange = (date: Date | undefined) => {
    handleFieldUpdate({ due_date: date ? date.toISOString() : null })
  }

  // Column/Status list
  const columns = project?.columns || []

  const currentColumnId = React.useMemo(() => {
    if (task.columnId) return task.columnId.toString()
    if (columns.length > 0) {
      const taskStatusNorm = task.status.toLowerCase().replace(/[^a-z0-9]/g, "")
      const match = columns.find(
        (c) => c.name.toLowerCase().replace(/[^a-z0-9]/g, "") === taskStatusNorm
      )
      if (match) return match.id.toString()
      if (taskStatusNorm === "todo") return columns[0].id.toString()
    }
    return undefined
  }, [task.columnId, task.status, columns])

  // Filter out current task from dependency search
  const searchableTasks = projectTasksRaw.filter((t) => t.id !== task.id)

  const blockedByIds = new Set(deps?.blocked_by?.map((d) => d.task_id) ?? [])
  const blocksIds = new Set(deps?.blocks?.map((d) => d.depends_on_id) ?? [])
  const alreadyLinked = new Set([...blockedByIds, ...blocksIds])

  // Only show watch toggle for non-assignees
  const showWatchToggle =
    currentUser !== undefined && currentUser?.id !== task.assignee?.id

  return (
    <div className="space-y-4">

      {/* WATCH TOGGLE — visible only for non-assignees */}
      {showWatchToggle && (
        <div className="mb-4">
          <Button
            variant={isWatching ? "secondary" : "outline"}
            size="sm"
            className="w-full"
            onClick={() =>
              isWatching ? unwatchTaskMutation.mutate() : watchTaskMutation.mutate()
            }
            disabled={watchTaskMutation.isPending || unwatchTaskMutation.isPending}
          >
            {isWatching ? "İzlemeyi Bırak" : "Görevi İzle"}
          </Button>
        </div>
      )}

      {/* STATUS */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Durum</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Select onValueChange={handleStatusChange} value={currentColumnId}>
            <SelectTrigger className="w-full font-medium">
              <SelectValue placeholder={task.status.toUpperCase().replace("-", " ")} />
            </SelectTrigger>
            <SelectContent>
              {isProjectLoading ? (
                <SelectItem value="loading" disabled>Durumlar yükleniyor...</SelectItem>
              ) : columns.length === 0 ? (
                <SelectItem value="empty" disabled>Herhangi bir durum bulunamadı</SelectItem>
              ) : (
                columns.map((col) => (
                  <SelectItem key={col.id} value={col.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-slate-500" />
                      {col.name}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* ASSIGNEE */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Atanan Kişi</CardTitle>
        </CardHeader>
        <CardContent>
          <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2 bg-transparent">
                {task.assignee ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.assignee.avatar} />
                      <AvatarFallback>{task.assignee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{task.assignee.name}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span className="text-muted-foreground">Atanmamış</span>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-64" align="start">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandList>
                  <CommandEmpty>Kullanıcı bulunamadı.</CommandEmpty>
                  <CommandGroup>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.name}
                        onSelect={() => handleAssigneeChange(user.id)}
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        {user.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* PRIORITY & DETAILS */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Detaylar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Öncelik</span>
            <Select onValueChange={(v) => handlePriorityChange(v as TaskPriority)} defaultValue={task.priority}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                  <SelectItem key={p} value={p}>
                    <Badge className={priorityColors[p] || "bg-slate-500"}>{p}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Puanlar</span>
            <Badge variant="secondary">{task.points}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* DATES */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tarihler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <span className="text-muted-foreground text-sm">Bitiş Tarihi</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {task.dueDate ? format(new Date(task.dueDate), "PPP") : "Set due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={task.dueDate ? new Date(task.dueDate) : undefined}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* SPRINT */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Sprint</CardTitle>
        </CardHeader>
        <CardContent>
          {isManagerOrAdmin ? (
            <Select
              value={task.sprintId != null ? String(task.sprintId) : ""}
              onValueChange={(val) =>
                handleFieldUpdate({ sprint_id: val ? Number(val) : null })
              }
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="No sprint (backlog)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No sprint (backlog)</SelectItem>
                {sprints.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm">
              {sprints.find((s) => s.id === task.sprintId)?.name ?? "Backlog"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* DEPENDENCIES */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Dependencies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Blocks */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Blocks</p>
            {deps?.blocks?.length === 0 && (
              <p className="text-xs text-muted-foreground">None</p>
            )}
            {deps?.blocks?.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-1 text-sm">
                <Link
                  href={`/tasks/${d.depends_on_id}`}
                  className="text-primary hover:underline truncate"
                >
                  {d.depends_on_key} — {d.depends_on_title}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={() => removeDepMutation.mutate(d.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Is blocked by */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Is blocked by</p>
            {deps?.blocked_by?.length === 0 && (
              <p className="text-xs text-muted-foreground">None</p>
            )}
            {deps?.blocked_by?.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-1 text-sm">
                <Link
                  href={`/tasks/${d.task_id}`}
                  className="text-primary hover:underline truncate"
                >
                  {d.depends_on_key} — {d.depends_on_title}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={() => removeDepMutation.mutate(d.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add dependency */}
          <Popover open={depPopoverOpen} onOpenChange={setDepPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="mr-2 h-3 w-3" />
                Add dependency
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-72" align="start">
              <Command>
                <CommandInput placeholder="Search tasks..." />
                <CommandList>
                  <CommandEmpty>No tasks found.</CommandEmpty>
                  <CommandGroup>
                    {searchableTasks
                      .filter((t) => !alreadyLinked.has(Number(t.id)))
                      .map((t) => (
                        <CommandItem
                          key={t.id}
                          value={t.title}
                          onSelect={() => addDepMutation.mutate(Number(t.id))}
                        >
                          <span className="font-mono text-xs text-muted-foreground mr-2">
                            {t.key}
                          </span>
                          <span className="truncate">{t.title}</span>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* RECURRENCE (only for recurring tasks) */}
      {task.isRecurring && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recurrence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Interval:</span>
              <Badge variant="secondary" className="capitalize">
                {task.recurrenceInterval ?? "—"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Ends:</span>
              {task.recurrenceEndDate ? (
                <span className="text-xs">On {format(new Date(task.recurrenceEndDate), "PPP")}</span>
              ) : task.recurrenceCount ? (
                <span className="text-xs">After {task.recurrenceCount} times</span>
              ) : (
                <span className="text-xs">Never</span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => updateTaskMutation.mutate({ is_recurring: false })}
            >
              Stop recurring
            </Button>
          </CardContent>
        </Card>
      )}

      {/* RECURRENCE SCOPE DIALOG */}
      <Dialog open={showRecurDialog} onOpenChange={setShowRecurDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit recurring task</DialogTitle>
            <DialogDescription>
              This is a recurring task. How should this change be applied?
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={selectedScope}
            onValueChange={(v) => setSelectedScope(v as "all" | "this")}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="scope-all" />
              <Label htmlFor="scope-all">This and all future tasks (default)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="this" id="scope-this" />
              <Label htmlFor="scope-this">Only this task</Label>
            </div>
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecurDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingUpdate) {
                  updateTaskMutation.mutate({ ...pendingUpdate, apply_to: selectedScope })
                }
                setShowRecurDialog(false)
                setPendingUpdate(null)
              }}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
