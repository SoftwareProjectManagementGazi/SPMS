"use client"

import * as React from "react"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner" 

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { taskService, CreateTaskDTO } from "@/services/task-service"
import { userService } from "@/services/user-service"
import { projectService } from "@/services/project-service" 
import { TaskPriority } from "@/lib/types"

interface CreateTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultProjectId?: string 
}

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-slate-400 text-white",
}

export function CreateTaskModal({ open, onOpenChange, defaultProjectId }: CreateTaskModalProps) {
  const queryClient = useQueryClient()
  
  // --- FORM STATE ---
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [taskType, setTaskType] = React.useState<string>("task")
  const [isRecurring, setIsRecurring] = React.useState(false)
  const [dueDate, setDueDate] = React.useState<Date>()
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(defaultProjectId || "")
  const [priority, setPriority] = React.useState<TaskPriority>("MEDIUM")
  const [assigneeId, setAssigneeId] = React.useState<string>("")
  const [parentTaskId, setParentTaskId] = React.useState<string>("")
  const [points, setPoints] = React.useState<string>("")

  // --- DATA FETCHING ---
  
  // 1. Projeleri Çek
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
    enabled: open 
  })

  // 2. Kullanıcıları Çek
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
    enabled: open
  })

  // 3. Parent Taskları Çek
  const { data: parentTasks = [], isLoading: isLoadingParents } = useQuery({
    queryKey: ['project-tasks', selectedProjectId],
    queryFn: () => taskService.getByProjectId(selectedProjectId),
    enabled: open && taskType === "sub-task" && !!selectedProjectId
  })

  // --- MUTATION ---
  const createTaskMutation = useMutation({
    mutationFn: (dto: CreateTaskDTO) => taskService.create(dto),
    onSuccess: () => {
      toast.success("Task created successfully")
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      onOpenChange(false)
      resetForm()
    },
    onError: (error) => {
      toast.error("Failed to create task")
      console.error(error)
    }
  })

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setTaskType("task")
    setPriority("MEDIUM")
    setAssigneeId("")
    setDueDate(undefined)
    setPoints("")
    if (!defaultProjectId) setSelectedProjectId("")
  }

  const handleSubmit = () => {
    if (!selectedProjectId) {
      toast.error("Please select a project")
      return
    }
    if (!title) {
      toast.error("Please enter a title")
      return
    }

    const payload: CreateTaskDTO = {
      title,
      description,
      priority,
      project_id: parseInt(selectedProjectId),
      // DÜZELTME: 'status' alanı kaldırıldı. 
      // Backend column_id gelmezse varsayılan olarak null kaydeder ve "todo" olarak gösterir.
      
      // Opsiyonel alanlar
      assignee_id: assigneeId && assigneeId !== "0" ? parseInt(assigneeId) : undefined,
      parent_task_id: taskType === "sub-task" && parentTaskId ? parseInt(parentTaskId) : undefined,
      due_date: dueDate ? dueDate.toISOString() : undefined,
      points: points ? parseInt(points) : undefined,
    }

    createTaskMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New {taskType === "sub-task" ? "Sub-Task" : "Task"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Top Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select 
                value={selectedProjectId} 
                onValueChange={setSelectedProjectId}
                disabled={!!defaultProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      <span className="font-mono text-xs text-muted-foreground mr-2">{project.key}</span>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Task Type</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="sub-task">Sub-Task</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Info */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input 
              placeholder="Enter task title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              placeholder="Describe the task in detail..." 
              className="min-h-[100px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Parent Task Selection */}
          {taskType === "sub-task" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label className="text-blue-600">Parent Task</Label>
              <Select value={parentTaskId} onValueChange={setParentTaskId} disabled={!selectedProjectId}>
                <SelectTrigger className="border-blue-200 bg-blue-50">
                  <SelectValue placeholder={selectedProjectId ? "Select parent task" : "Select a project first"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingParents ? (
                    <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading tasks...
                    </div>
                  ) : parentTasks.length > 0 ? (
                    parentTasks.map((task: any) => (
                      <SelectItem key={task.id} value={task.id}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{task.key}</span>
                        {task.title}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">No tasks found in this project</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                    <SelectItem key={p} value={p}>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("capitalize", priorityColors[p])}>{p}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Unassigned</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name?.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {user.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Points</Label>
              <Input 
                type="number" 
                placeholder="0" 
                min={0} 
                max={100}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
              />
              <Label htmlFor="recurring" className="font-normal">
                Is Recurring
              </Label>
            </div>

            {isRecurring && (
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={createTaskMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createTaskMutation.isPending}>
            {createTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}