"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
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
import { projects, users, parentTasks } from "@/lib/mock-data"

interface CreateTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const priorityColors = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-slate-400 text-white",
}

export function CreateTaskModal({ open, onOpenChange }: CreateTaskModalProps) {
  const [taskType, setTaskType] = React.useState<string>("task")
  const [isRecurring, setIsRecurring] = React.useState(false)
  const [dueDate, setDueDate] = React.useState<Date>()
  const [selectedProject, setSelectedProject] = React.useState<string>("")
  const [priority, setPriority] = React.useState<string>("")
  const [assignee, setAssignee] = React.useState<string>("")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Top Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
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
                  <SelectItem value="sub-task">Sub-Task (Alt Görev)</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Info */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="Enter task title" />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Describe the task in detail..." className="min-h-[100px] resize-none" />
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {(["critical", "high", "medium", "low"] as const).map((p) => (
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
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
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
              <Input type="number" placeholder="0" min={0} max={100} />
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

          {/* Parent Task - Only show for Sub-Task */}
          {taskType === "sub-task" && (
            <div className="space-y-2">
              <Label>Parent Task (Ana Görev)</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent task" />
                </SelectTrigger>
                <SelectContent>
                  {parentTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      <span className="font-mono text-xs text-muted-foreground mr-2">{task.key}</span>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
