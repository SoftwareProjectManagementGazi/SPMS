"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, ChevronDown, ChevronRight } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import sprintService, { Sprint } from "@/services/sprint-service"
import { User } from "@/lib/types"

interface SprintsListProps {
  projectId: string
  currentUser: User | null
}

type SprintStatus = "Planned" | "Active" | "Closed"

function getSprintStatus(sprint: Sprint): SprintStatus {
  if (sprint.is_active) return "Active"
  const today = new Date()
  if (sprint.start_date && new Date(sprint.start_date) > today) return "Planned"
  return "Closed"
}

function statusBadgeVariant(status: SprintStatus): "outline" | "default" | "secondary" {
  switch (status) {
    case "Active":
      return "default"
    case "Planned":
      return "outline"
    case "Closed":
      return "secondary"
  }
}

interface DialogState {
  open: boolean
  sprint: Sprint | null
}

export function SprintsList({ projectId, currentUser }: SprintsListProps) {
  const queryClient = useQueryClient()
  const queryKey = ["project-sprints", projectId]

  const { data: sprints = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => sprintService.list(Number(projectId)),
  })

  // Create phase form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newStartDate, setNewStartDate] = useState("")
  const [newEndDate, setNewEndDate] = useState("")

  // Dialog states
  const [closeDialog, setCloseDialog] = useState<DialogState>({ open: false, sprint: null })
  const [deleteDialog, setDeleteDialog] = useState<DialogState>({ open: false, sprint: null })
  const [targetSprintId, setTargetSprintId] = useState<string>("backlog")

  const createMutation = useMutation({
    mutationFn: (data: { project_id: number; name: string; start_date?: string; end_date?: string }) =>
      sprintService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setShowCreateForm(false)
      setNewName("")
      setNewStartDate("")
      setNewEndDate("")
    },
  })

  const closeMutation = useMutation({
    mutationFn: ({ sprintId, targetId }: { sprintId: number; targetId: number | null }) =>
      sprintService.close(sprintId, targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setCloseDialog({ open: false, sprint: null })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ sprintId, targetId }: { sprintId: number; targetId: number | null }) =>
      sprintService.deleteWithMove(sprintId, targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setDeleteDialog({ open: false, sprint: null })
    },
  })

  function handleCreate() {
    if (!newName.trim()) return
    createMutation.mutate({
      project_id: Number(projectId),
      name: newName.trim(),
      start_date: newStartDate || undefined,
      end_date: newEndDate || undefined,
    })
  }

  function openCloseDialog(sprint: Sprint) {
    setTargetSprintId("backlog")
    setCloseDialog({ open: true, sprint })
  }

  function openDeleteDialog(sprint: Sprint) {
    setTargetSprintId("backlog")
    setDeleteDialog({ open: true, sprint })
  }

  function resolveTargetId(): number | null {
    if (targetSprintId === "backlog") return null
    return Number(targetSprintId)
  }

  function handleConfirmClose() {
    if (!closeDialog.sprint) return
    closeMutation.mutate({ sprintId: closeDialog.sprint.id, targetId: resolveTargetId() })
  }

  function handleConfirmDelete() {
    if (!deleteDialog.sprint) return
    deleteMutation.mutate({ sprintId: deleteDialog.sprint.id, targetId: resolveTargetId() })
  }

  const otherSprintsForClose = sprints.filter(s => s.id !== closeDialog.sprint?.id)
  const otherSprintsForDelete = sprints.filter(s => s.id !== deleteDialog.sprint?.id)

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading phases...</div>
  }

  return (
    <div className="space-y-6">
      {/* Create phase form toggle */}
      <div>
        {!showCreateForm ? (
          <Button variant="outline" onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Phase
          </Button>
        ) : (
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold text-sm">New Phase</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="phase-name">Name</Label>
                <Input
                  id="phase-name"
                  placeholder="Phase name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phase-start">Start Date</Label>
                <Input
                  id="phase-start"
                  type="date"
                  value={newStartDate}
                  onChange={e => setNewStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phase-end">End Date</Label>
                <Input
                  id="phase-end"
                  type="date"
                  value={newEndDate}
                  onChange={e => setNewEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={createMutation.isPending || !newName.trim()}
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewName("")
                  setNewStartDate("")
                  setNewEndDate("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sprint list */}
      {sprints.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground border rounded-lg border-dashed">
          No phases yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {sprints.map(sprint => {
            const status = getSprintStatus(sprint)
            return (
              <div key={sprint.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{sprint.name}</span>
                      <Badge variant={statusBadgeVariant(status)}>{status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sprint.start_date && sprint.end_date
                        ? `${format(new Date(sprint.start_date), "MMM d, yyyy")} — ${format(new Date(sprint.end_date), "MMM d, yyyy")}`
                        : sprint.start_date
                        ? `From ${format(new Date(sprint.start_date), "MMM d, yyyy")}`
                        : "No dates set"}
                    </div>
                    {sprint.goal && (
                      <div className="text-sm text-muted-foreground italic">{sprint.goal}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {status !== "Closed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCloseDialog(sprint)}
                      >
                        Close Phase
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(sprint)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {/* Progress bar — visual indicator; tasks count not available per-sprint without extra API call */}
                <div className="mt-3">
                  <Progress value={status === "Closed" ? 100 : status === "Active" ? 50 : 0} className="h-1.5" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Close phase dialog */}
      <AlertDialog open={closeDialog.open} onOpenChange={open => setCloseDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Phase: {closeDialog.sprint?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Closing this phase will mark it as complete. Where should any remaining tasks go?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-2 space-y-2">
            <Label>Move remaining tasks to</Label>
            <Select value={targetSprintId} onValueChange={setTargetSprintId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog (no phase)</SelectItem>
                {otherSprintsForClose.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} disabled={closeMutation.isPending}>
              {closeMutation.isPending ? "Closing..." : "Close Phase"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete phase dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Phase: {deleteDialog.sprint?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Where should the tasks in this phase go?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-2 space-y-2">
            <Label>Move tasks to</Label>
            <Select value={targetSprintId} onValueChange={setTargetSprintId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog (no phase)</SelectItem>
                {otherSprintsForDelete.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Phase"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
