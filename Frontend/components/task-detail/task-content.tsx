"use client"

import * as React from "react"
import Link from "next/link"
import { Upload, Send, Pencil, Trash2, Download, File as FileIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { ParentTask } from "@/lib/types"
import { taskService } from "@/services/task-service"
import { projectService } from "@/services/project-service"
import commentService, { Comment } from "@/services/comment-service"
import attachmentService, { Attachment } from "@/services/attachment-service"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"

// ----------------------------------------------------------------
// Utility helpers
// ----------------------------------------------------------------

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ----------------------------------------------------------------
// History entry shape (from audit log)
// ----------------------------------------------------------------

interface HistoryEntry {
  entity_type: string
  entity_id: number
  user_id: number | null
  action: string
  field_name: string | null
  old_value: string | null
  new_value: string | null
  created_at: string
  user?: {
    id: number
    full_name: string
    avatar_path?: string | null
  } | null
}

// ----------------------------------------------------------------
// Status / Priority color maps (kept from original)
// ----------------------------------------------------------------

const statusColors: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700",
  "in-progress": "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
}

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-slate-400 text-white",
}

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------

interface TaskContentProps {
  task: ParentTask
}

// ----------------------------------------------------------------
// Main component
// ----------------------------------------------------------------

export function TaskContent({ task }: TaskContentProps) {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  // Description editing state
  const [description, setDescription] = React.useState(task.description)
  const [isEditing, setIsEditing] = React.useState(false)

  // Active tab state (so we can lazy-load history)
  const [activeTab, setActiveTab] = React.useState<"comments" | "history" | "worklogs">("comments")

  // New comment input state
  const [newComment, setNewComment] = React.useState("")

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = React.useState<number | null>(null)
  const [editingContent, setEditingContent] = React.useState("")

  // Delete confirm state
  const [deleteTargetId, setDeleteTargetId] = React.useState<number | null>(null)

  // Sync description with prop on refresh
  React.useEffect(() => {
    setDescription(task.description)
  }, [task.description])

  // ----------------------------------------------------------------
  // Project members (for (removed) badge)
  // ----------------------------------------------------------------

  const { data: projectMembers = [] } = useQuery({
    queryKey: ["project-members", task.projectId],
    queryFn: () => projectService.getMembers(task.projectId),
    staleTime: 5 * 60 * 1000,
  })

  const memberIdSet = React.useMemo(
    () => new Set(projectMembers.map((m) => m.id)),
    [projectMembers]
  )

  // ----------------------------------------------------------------
  // Description mutation
  // ----------------------------------------------------------------

  const updateTaskMutation = useMutation({
    mutationFn: (newDescription: string) =>
      taskService.updateTask(task.id, { description: newDescription }),
    onSuccess: () => {
      toast.success("Description updated")
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ["task", task.id] })
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] })
      queryClient.invalidateQueries({ queryKey: ["myTasks"] })
    },
    onError: () => {
      toast.error("Failed to update description")
    },
  })

  // ----------------------------------------------------------------
  // Comments queries and mutations
  // ----------------------------------------------------------------

  const taskIdNum = parseInt(task.id, 10)

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", task.id],
    queryFn: () => commentService.list(taskIdNum),
  })

  const createCommentMutation = useMutation({
    mutationFn: (content: string) =>
      commentService.create({ task_id: taskIdNum, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", task.id] })
      setNewComment("")
      toast.success("Comment added")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to add comment")
    },
  })

  const updateCommentMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      commentService.update(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", task.id] })
      setEditingCommentId(null)
      toast.success("Comment updated")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to update comment")
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => commentService.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", task.id] })
      setDeleteTargetId(null)
      toast.success("Comment deleted")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to delete comment")
    },
  })

  // ----------------------------------------------------------------
  // History query
  // ----------------------------------------------------------------

  const { data: history = [] } = useQuery<HistoryEntry[]>({
    queryKey: ["task-history", task.id],
    queryFn: () =>
      apiClient.get(`/tasks/${taskIdNum}/history`).then((r) => r.data),
    enabled: activeTab === "history",
  })

  // ----------------------------------------------------------------
  // Attachments queries and mutations
  // ----------------------------------------------------------------

  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ["attachments", task.id],
    queryFn: () => attachmentService.list(taskIdNum),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => attachmentService.upload(taskIdNum, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", task.id] })
      toast.success("File uploaded")
    },
    onError: (err: any) => {
      toast.error(err.message || err.response?.data?.detail || "Upload failed")
    },
  })

  // ----------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------

  const handleSaveDescription = () => {
    updateTaskMutation.mutate(description)
  }

  const handleSubmitComment = () => {
    const trimmed = newComment.trim()
    if (!trimmed) return
    createCommentMutation.mutate(trimmed)
  }

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
  }

  const handleSaveEdit = () => {
    if (editingCommentId === null) return
    updateCommentMutation.mutate({ id: editingCommentId, content: editingContent })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadMutation.mutate(file)
    e.target.value = ""
  }

  const handleDropZoneClick = () => {
    document.getElementById("attachment-file-input")?.click()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) uploadMutation.mutate(file)
  }

  // ----------------------------------------------------------------
  // Render helpers
  // ----------------------------------------------------------------

  const currentUserId = currentUser ? parseInt(currentUser.id, 10) : null

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Description */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Açıklama</CardTitle>
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
                <Button
                  size="sm"
                  onClick={handleSaveDescription}
                  disabled={updateTaskMutation.isPending}
                >
                  {updateTaskMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                >
                  İptal Et
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
          <CardTitle className="text-base">Ekler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Upload zone */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={handleDropZoneClick}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {uploadMutation.isPending
                ? "Uploading..."
                : "Yüklemek için tıklayın veya dosyaları buraya sürükleyin"}
            </p>
            <input
              id="attachment-file-input"
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* File list */}
          {attachments.length > 0 && (
            <div className="rounded-md border divide-y">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm truncate">{att.file_name}</span>
                  {att.file_size != null && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatBytes(att.file_size)}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(att.uploaded_at)}
                  </span>
                  <a
                    href={attachmentService.downloadUrl(att.id)}
                    download
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Sub-Tasks */}
      {task.subTasks && task.subTasks.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Alt Görevler</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anahtar</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {task.subTasks.map((subTask) => (
                  <TableRow key={subTask.id}>
                    <TableCell>
                      <Link
                        href={`/tasks/${subTask.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {subTask.key}
                      </Link>
                    </TableCell>
                    <TableCell>{subTask.title}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          priorityColors[subTask.priority] || "bg-slate-500"
                        }
                      >
                        {subTask.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusColors[subTask.status] || "bg-gray-100"
                        }
                        variant="secondary"
                      >
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
          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(v as "comments" | "history" | "worklogs")
            }
          >
            <TabsList>
              <TabsTrigger value="comments">Yorumlar</TabsTrigger>
              <TabsTrigger value="history">Geçmiş</TabsTrigger>
              <TabsTrigger value="worklogs">Çalışma Günlükleri</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-4">
          {/* ---- COMMENTS TAB ---- */}
          {activeTab === "comments" && (
            <div className="space-y-4">
              {commentsLoading && (
                <p className="text-sm text-muted-foreground">Loading comments...</p>
              )}

              {!commentsLoading && comments.length === 0 && (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}

              {comments.map((comment) => (
                <div key={comment.id} className="group/comment relative flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                      src={
                        comment.author.avatar_path
                          ? `/api/v1/${comment.author.avatar_path}`
                          : "/placeholder.svg"
                      }
                    />
                    <AvatarFallback>
                      {comment.author.full_name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {comment.author.full_name}
                      </span>
                      {!memberIdSet.has(comment.author.id) && (
                        <Badge
                          variant="outline"
                          className="ml-1 text-xs text-muted-foreground"
                        >
                          (removed)
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                      {comment.is_edited && (
                        <span className="text-xs text-muted-foreground italic">
                          (edited)
                        </span>
                      )}
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="mt-1 space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={updateCommentMutation.isPending}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingCommentId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </div>

                  {/* Author-only edit/delete controls (hover reveal) */}
                  {comment.author.id === currentUserId &&
                    editingCommentId !== comment.id && (
                      <div className="hidden group-hover/comment:flex absolute top-0 right-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleStartEdit(comment)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTargetId(comment.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                </div>
              ))}

              {/* New comment input */}
              <div className="mt-4 flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback>
                    {currentUser?.name?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    className="min-h-[80px]"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        handleSubmitComment()
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="shrink-0 self-end"
                    onClick={handleSubmitComment}
                    disabled={
                      createCommentMutation.isPending || !newComment.trim()
                    }
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ---- HISTORY TAB ---- */}
          {activeTab === "history" && (
            <div className="space-y-1">
              {history.length === 0 && (
                <p className="text-sm text-muted-foreground py-4">
                  No history entries yet.
                </p>
              )}
              {history.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-3 py-2">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback>
                      {entry.user?.full_name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm flex-1 min-w-0">
                    <span className="font-medium">
                      {entry.user?.full_name ?? "System"}
                    </span>
                    {entry.user?.id != null &&
                      !memberIdSet.has(entry.user.id) && (
                        <Badge
                          variant="outline"
                          className="ml-1 text-xs text-muted-foreground"
                        >
                          (removed)
                        </Badge>
                      )}
                    {entry.field_name && (
                      <>
                        {" changed "}
                        <span className="font-medium">{entry.field_name}</span>
                        {": "}
                        <span className="text-muted-foreground line-through">
                          {entry.old_value ?? "—"}
                        </span>
                        {" → "}
                        <span>{entry.new_value ?? "—"}</span>
                      </>
                    )}
                    {!entry.field_name && (
                      <span className="text-muted-foreground ml-1">
                        {entry.action}
                      </span>
                    )}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatRelativeTime(entry.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ---- WORK LOGS TAB ---- */}
          {activeTab === "worklogs" && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Work log tracking is not yet available.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete comment confirmation dialog */}
      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null)
        }}
        title="Delete comment"
        description="Are you sure you want to delete this comment? This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTargetId !== null) {
            deleteCommentMutation.mutate(deleteTargetId)
          }
        }}
      />
    </div>
  )
}
