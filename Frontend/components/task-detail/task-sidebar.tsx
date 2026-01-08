"use client"

import * as React from "react"
import { CalendarIcon, UserPlus } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
// DÜZELTME 1: SubTask tipi çıkarıldı, detay görünümü için ParentTask (Full Data) gerekli
import type { ParentTask, TaskPriority } from "@/lib/types" 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { taskService } from "@/services/task-service"
import { userService } from "@/services/user-service"
import { projectService } from "@/services/project-service"

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-500 hover:bg-red-600",
  HIGH: "bg-orange-500 hover:bg-orange-600",
  MEDIUM: "bg-yellow-500 hover:bg-yellow-600",
  LOW: "bg-blue-500 hover:bg-blue-600",
}

interface TaskSidebarProps {
  // DÜZELTME 1: Sadece ParentTask (Full Task) kabul ediliyor
  task: ParentTask
}

export function TaskSidebar({ task }: TaskSidebarProps) {
  const queryClient = useQueryClient()
  const [assigneeOpen, setAssigneeOpen] = React.useState(false)

  // 1. Proje Detaylarını Çek (Columns/Status için)
  const { data: project, isLoading: isProjectLoading } = useQuery({
      queryKey: ['project', task.projectId],
      // DÜZELTME 2: getProject -> getById
      queryFn: () => projectService.getById(task.projectId), 
      enabled: !!task.projectId
  });

  // 2. Kullanıcıları Çek
  const { data: users = [] } = useQuery({
      queryKey: ['users'],
      queryFn: userService.getAll
  });

  // 3. Update Mutation
  const updateTaskMutation = useMutation({
      mutationFn: (data: any) => taskService.updateTask(task.id, data),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['task', task.id] })
          queryClient.invalidateQueries({ queryKey: ['project-tasks'] })
      }
  });

  const handleStatusChange = (columnIdString: string) => {
      updateTaskMutation.mutate({ column_id: parseInt(columnIdString) })
  }

  const handleAssigneeChange = (userId: string) => {
      updateTaskMutation.mutate({ assignee_id: parseInt(userId) })
      setAssigneeOpen(false)
  }

  const handlePriorityChange = (priority: TaskPriority) => {
      updateTaskMutation.mutate({ priority })
  }

  const handleDateChange = (date: Date | undefined) => {
      updateTaskMutation.mutate({ due_date: date ? date.toISOString() : null })
  }

  // Column/Status Listesi
  const columns = project?.columns || [] 

  return (
    <div className="space-y-4">
      
      {/* STATUS SELECTION */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Select 
            onValueChange={handleStatusChange} 
            defaultValue={columns.find((c) => c.name.toLowerCase().replace(" ", "-") === task.status)?.id.toString()}
          >
            <SelectTrigger className="w-full font-medium">
              <SelectValue placeholder={task.status.toUpperCase().replace("-", " ")} />
            </SelectTrigger>
            <SelectContent>
              {isProjectLoading ? (
                  <SelectItem value="loading" disabled>Loading statuses...</SelectItem>
              ) : columns.length === 0 ? (
                  <SelectItem value="empty" disabled>No statuses found</SelectItem>
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

      {/* ASSIGNEE SELECTION */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Assignee</CardTitle>
        </CardHeader>
        <CardContent>
            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2 bg-transparent">
                  {task.assignee ? (
                    <>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar} />
                        <AvatarFallback>{task.assignee.name.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{task.assignee.name}</span>
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
                          onSelect={() => handleAssigneeChange(user.id)}
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.substring(0,2)}</AvatarFallback>
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
          <CardTitle className="text-sm font-medium text-muted-foreground">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Priority</span>
            <Select onValueChange={(v) => handlePriorityChange(v as TaskPriority)} defaultValue={task.priority}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(p => (
                        <SelectItem key={p} value={p}>
                            <Badge className={priorityColors[p] || "bg-slate-500"}>{p}</Badge>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Points</span>
            <Badge variant="secondary">{task.points}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* DATES */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dates</CardTitle>
        </CardHeader>
        <CardContent>
             <div className="space-y-2">
                <span className="text-muted-foreground text-sm">Due Date</span>
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

    </div>
  )
}