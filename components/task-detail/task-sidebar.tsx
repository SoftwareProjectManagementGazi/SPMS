"use client"

import * as React from "react"
import { CalendarIcon, UserPlus, Plus } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { users } from "@/lib/mock-data"
import type { ParentTask, TaskStatus, User, SubTask } from "@/lib/types"

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: "todo", label: "To Do", color: "bg-slate-500" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-500" },
  { value: "done", label: "Done", color: "bg-green-500" },
]

const priorityColors = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-slate-400 text-white",
}

interface TaskSidebarProps {
  task: ParentTask | SubTask
}

export function TaskSidebar({ task }: TaskSidebarProps) {
  const [status, setStatus] = React.useState<TaskStatus>(task.status)
  const [assignee, setAssignee] = React.useState<User | null>(task.assignee)
  const [assigneeOpen, setAssigneeOpen] = React.useState(false)
  const [dueDate, setDueDate] = React.useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined)

  const timeProgress =
    "estimatedTime" in task && task.estimatedTime > 0 && "loggedTime" in task
      ? Math.round((task.loggedTime / task.estimatedTime) * 100)
      : 0

  return (
    <div className="space-y-4">
      {/* Status */}
      <Card className="shadow-sm">
        <CardContent className="pt-4">
          <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
            <SelectTrigger
              className={cn(
                "w-full font-medium",
                status === "todo" && "bg-slate-100 border-slate-300",
                status === "in-progress" && "bg-blue-100 border-blue-300 text-blue-700",
                status === "done" && "bg-green-100 border-green-300 text-green-700",
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", option.color)} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* People */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">People</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Assignee */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Assignee</label>
            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2 bg-transparent">
                  {assignee ? (
                    <>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={assignee.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {assignee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span>{assignee.name}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span className="text-muted-foreground">Unassigned</span>
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-64" align="start">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandList>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.name}
                          onSelect={() => {
                            setAssignee(user)
                            setAssigneeOpen(false)
                          }}
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {user.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Reporter */}
          {"reporter" in task && task.reporter && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Reporter</label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2 px-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.reporter.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {task.reporter.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span>{task.reporter.name}</span>
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-64">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={task.reporter.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {task.reporter.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{task.reporter.name}</h4>
                      <p className="text-sm text-muted-foreground">{task.reporter.email}</p>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">{task.reporter.role}</p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Priority</span>
            <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Points</span>
            <Badge variant="secondary">{task.points}</Badge>
          </div>
          {"labels" in task && task.labels && (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Labels</span>
              <div className="flex flex-wrap gap-1">
                {task.labels.map((label) => (
                  <Badge key={label} variant="outline" className="text-xs">
                    {label}
                  </Badge>
                ))}
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dates */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Created</span>
            <span>{task.createdAt}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Updated</span>
            <span>{task.updatedAt}</span>
          </div>
          <div className="space-y-2">
            <span className="text-muted-foreground">Due Date</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Set due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Time Tracking */}
      {"loggedTime" in task && typeof task.estimatedTime === "number" && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Time Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={timeProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{task.loggedTime}h logged</span>
              <span>{task.estimatedTime}h estimated</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
