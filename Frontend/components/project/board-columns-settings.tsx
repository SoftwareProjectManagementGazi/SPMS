"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil, Trash2, Plus, GripVertical, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { boardColumnService, BoardColumn } from "@/services/board-column-service"
import { User } from "@/lib/types"

interface BoardColumnsSettingsProps {
  projectId: string
  currentUser: User | null
}

interface DeleteDialogState {
  open: boolean
  column: BoardColumn | null
}

export function BoardColumnsSettings({ projectId, currentUser }: BoardColumnsSettingsProps) {
  const queryClient = useQueryClient()
  const queryKey = ["project-columns", projectId]

  const isManagerOrAdmin =
    currentUser?.role?.name?.toLowerCase() === "manager" ||
    currentUser?.role?.name?.toLowerCase() === "admin"

  const { data: columns = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => boardColumnService.getColumns(projectId),
  })

  const sortedColumns = [...columns].sort((a, b) => a.order_index - b.order_index)

  // Inline edit state: track which column is being edited and its pending name
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ open: false, column: null })
  const [targetColumnId, setTargetColumnId] = useState<string>("")

  // Add column form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newColumnName, setNewColumnName] = useState("")

  const updateMutation = useMutation({
    mutationFn: ({ columnId, name }: { columnId: number; name: string }) =>
      boardColumnService.updateColumn(projectId, columnId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ columnId, targetId }: { columnId: number; targetId: number }) =>
      boardColumnService.deleteColumn(projectId, columnId, targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setDeleteDialog({ open: false, column: null })
    },
  })

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      boardColumnService.createColumn(projectId, { name, order_index: columns.length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setShowAddForm(false)
      setNewColumnName("")
    },
  })

  function startEdit(column: BoardColumn) {
    setEditingId(column.id)
    setEditingName(column.name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingName("")
  }

  function saveEdit(columnId: number) {
    const trimmed = editingName.trim()
    if (!trimmed) return
    updateMutation.mutate({ columnId, name: trimmed })
  }

  function openDeleteDialog(column: BoardColumn) {
    const otherCols = sortedColumns.filter(c => c.id !== column.id)
    setTargetColumnId(otherCols.length > 0 ? String(otherCols[0].id) : "")
    setDeleteDialog({ open: true, column })
  }

  function handleConfirmDelete() {
    if (!deleteDialog.column || !targetColumnId) return
    deleteMutation.mutate({ columnId: deleteDialog.column.id, targetId: Number(targetColumnId) })
  }

  function handleAddColumn() {
    const trimmed = newColumnName.trim()
    if (!trimmed) return
    createMutation.mutate(trimmed)
  }

  const otherColumnsForDelete = sortedColumns.filter(c => c.id !== deleteDialog.column?.id)

  if (isLoading) {
    return <div className="text-muted-foreground text-sm py-4">Loading columns...</div>
  }

  // Read-only view for non-managers
  if (!isManagerOrAdmin) {
    return (
      <div className="space-y-2">
        {sortedColumns.length === 0 ? (
          <p className="text-muted-foreground text-sm">No columns configured.</p>
        ) : (
          sortedColumns.map(col => (
            <div key={col.id} className="flex items-center gap-3 px-3 py-2 rounded-md border">
              <Badge variant="outline" className="text-xs">
                {col.order_index + 1}
              </Badge>
              <span className="text-sm">{col.name}</span>
            </div>
          ))
        )}
      </div>
    )
  }

  // Editable view for managers/admins
  return (
    <div className="space-y-3">
      {sortedColumns.length === 0 ? (
        <p className="text-muted-foreground text-sm">No columns yet. Add one below.</p>
      ) : (
        sortedColumns.map(col => (
          <div key={col.id} className="flex items-center gap-3 px-3 py-2 rounded-md border">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <Badge variant="outline" className="text-xs shrink-0">
              {col.order_index + 1}
            </Badge>

            {editingId === col.id ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  className="h-7 text-sm"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === "Enter") saveEdit(col.id)
                    if (e.key === "Escape") cancelEdit()
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => saveEdit(col.id)}
                  disabled={updateMutation.isPending}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={cancelEdit}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span
                className="flex-1 text-sm cursor-pointer hover:underline"
                onClick={() => startEdit(col)}
              >
                {col.name}
              </span>
            )}

            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => startEdit(col)}
                title="Rename column"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => openDeleteDialog(col)}
                title="Delete column"
                disabled={sortedColumns.length <= 1}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))
      )}

      {/* Add column */}
      {!showAddForm ? (
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-3.5 w-3.5" />
          Add Column
        </Button>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-md border">
          <Input
            placeholder="Column name"
            value={newColumnName}
            onChange={e => setNewColumnName(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter") handleAddColumn()
              if (e.key === "Escape") {
                setShowAddForm(false)
                setNewColumnName("")
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleAddColumn}
            disabled={createMutation.isPending || !newColumnName.trim()}
          >
            {createMutation.isPending ? "Adding..." : "Add"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowAddForm(false)
              setNewColumnName("")
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Delete column dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={open => setDeleteDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Column: {deleteDialog.column?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.column?.task_count
                ? `There are ${deleteDialog.column.task_count} tasks in this column. Move them to:`
                : "Move any tasks in this column to:"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-2 space-y-2">
            <Label>Target column</Label>
            <Select value={targetColumnId} onValueChange={setTargetColumnId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target column" />
              </SelectTrigger>
              <SelectContent>
                {otherColumnsForDelete.map(col => (
                  <SelectItem key={col.id} value={String(col.id)}>
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending || !targetColumnId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Column"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
