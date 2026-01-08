"use client"

import * as React from "react"
import Link from "next/link"
import { Upload, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { activities } from "@/lib/mock-data"
import type { ParentTask } from "@/lib/types" // SubTask çıkarıldı çünkü detay görünümü için ParentTask (Full Data) gerekli
import { taskService } from "@/services/task-service"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner" // Toast bildirimi için (opsiyonel)

// DÜZELTME: Index signature eklendi
const statusColors: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700",
  "in-progress": "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
}

// DÜZELTME: Anahtarlar büyük harf yapıldı (TaskPriority uyumu için)
const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-slate-400 text-white",
}

interface TaskContentProps {
  // DÜZELTME: | SubTask kaldırıldı. Bu bileşen detay sayfası içindir ve description gerektirir.
  task: ParentTask 
}

export function TaskContent({ task }: TaskContentProps) {
  // task.description ParentTask içinde mevcut olduğu için artık hata vermez
  const queryClient = useQueryClient()
  const [description, setDescription] = React.useState(task.description)
  const [isEditing, setIsEditing] = React.useState(false)

  // 1. Mutation Tanımla
  const updateTaskMutation = useMutation({
    mutationFn: (newDescription: string) => 
        taskService.updateTask(task.id, { description: newDescription }),
    onSuccess: () => {
        toast.success("Description updated")
        setIsEditing(false)
        // Veriyi tazelemek için:
        queryClient.invalidateQueries({ queryKey: ['task', task.id] })
    },
    onError: () => {
        toast.error("Failed to update description")
    }
  })

  // Description güncelleme fonksiyonu (Backend'e kaydetme eklenecek)
  const handleSaveDescription = () => {
      // 2. Mutation'ı Tetikle
      updateTaskMutation.mutate(description)
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveDescription} disabled={updateTaskMutation.isPending}>
                  {updateTaskMutation.isPending ? "Saving..." : "Save"}
                 </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p
              className="text-sm text-muted-foreground cursor-pointer hover:bg-accent/50 p-2 rounded -m-2 whitespace-pre-wrap"
              onClick={() => setIsEditing(true)}
            >
              {description || "Click to add description..."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Attachments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Drop files here or click to upload</p>
          </div>
        </CardContent>
      </Card>

      {/* Related Sub-Tasks */}
      {/* ParentTask içinde subTasks her zaman array olarak tanımlı olduğu için optional chain'e gerek yok ama güvenlik için tutabiliriz */}
      {task.subTasks && task.subTasks.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sub-Tasks (Alt Görevler)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {task.subTasks.map((subTask) => (
                  <TableRow key={subTask.id}>
                    <TableCell>
                      <Link href={`/tasks/${subTask.id}`} className="font-mono text-xs text-primary hover:underline">
                        {subTask.key}
                      </Link>
                    </TableCell>
                    <TableCell>{subTask.title}</TableCell>
                    <TableCell>
                      <Badge className={priorityColors[subTask.priority] || "bg-slate-500"}>{subTask.priority}</Badge>
                    </TableCell>
                    <TableCell>
                        {/* Status stringine göre renk seçimi */}
                      <Badge className={statusColors[subTask.status] || "bg-gray-100"} variant="secondary">
                        {subTask.status === "in-progress"
                          ? "In Progress"
                          : subTask.status === "todo"
                            ? "To Do"
                            : subTask.status.replace("-", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Activity Stream */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="worklogs">Work Logs</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {activities
              .filter((a) => a.taskId === task.id)
              .map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={activity.user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {activity.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{activity.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{activity.content}</p>
                  </div>
                </div>
              ))}
          </div>

          {/* New Comment */}
          <div className="mt-6 flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea placeholder="Add a comment..." className="min-h-[80px]" />
              <Button size="icon" className="shrink-0 self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}