"use client"

import { useState, useMemo, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ParentTask } from '@/lib/types'
import { boardColumnService, BoardColumn } from '@/services/board-column-service'
import sprintService, { Sprint } from '@/services/sprint-service'
import { taskService } from '@/services/task-service'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'

interface BoardTabProps {
  projectId: string
  tasks: ParentTask[]
}

export function BoardTab({ projectId, tasks }: BoardTabProps) {
  const queryClient = useQueryClient()

  const [compact, setCompact] = useState(false)
  const [activeTask, setActiveTask] = useState<ParentTask | null>(null)
  const [activeColumnIndex, setActiveColumnIndex] = useState(0)
  const [activeSprintId, setActiveSprintId] = useState<number | 'all' | 'backlog'>('all')
  const [sprintDefaultSet, setSprintDefaultSet] = useState(false)
  // Optimistic move: show task in destination column immediately before server confirms
  const [pendingMove, setPendingMove] = useState<{ taskId: string; destColId: string } | null>(null)

  // Fetch board columns
  const { data: columns, isLoading: isColumnsLoading } = useQuery<BoardColumn[]>({
    queryKey: ['project-columns', projectId],
    queryFn: () => boardColumnService.getColumns(Number(projectId)),
  })

  // Fetch sprints for filter dropdown
  const { data: sprints } = useQuery<Sprint[]>({
    queryKey: ['project-sprints', projectId],
    queryFn: () => sprintService.list(Number(projectId)),
  })

  // Set default sprint to active sprint on first load
  useEffect(() => {
    if (sprints && !sprintDefaultSet) {
      const activeSprint = sprints.find((s: Sprint) => s.is_active)
      if (activeSprint) {
        setActiveSprintId(activeSprint.id)
      }
      setSprintDefaultSet(true)
    }
  }, [sprints, sprintDefaultSet])

  // Sensors: PointerSensor with distance constraint so single clicks pass through to onClick
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Mutation: update task column on drop
  const mutation = useMutation({
    mutationFn: ({ taskId, columnId }: { taskId: string; columnId: number }) =>
      taskService.patchTask(taskId, { column_id: columnId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks-paginated', projectId] })
    },
    onError: () => {
      toast.error('Failed to move task. Please try again.')
    },
  })

  // Sprint filtering
  const filteredTasks = useMemo(() => {
    if (activeSprintId === 'all') return tasks
    if (activeSprintId === 'backlog') return tasks.filter(t => t.sprintId === null)
    return tasks.filter(t => t.sprintId === activeSprintId)
  }, [tasks, activeSprintId])

  // Group tasks by column — applies pendingMove optimistically so the card
  // appears in the destination column immediately without waiting for the server.
  const tasksByColumn = useMemo((): Record<string, ParentTask[]> => {
    const map: Record<string, ParentTask[]> = {}
    if (!columns) return map
    columns.forEach((col: BoardColumn) => { map[String(col.id)] = [] })
    filteredTasks.forEach(task => {
      const colId = task.columnId ?? String(columns[0]?.id ?? '')
      const effectiveColId =
        pendingMove?.taskId === task.id ? pendingMove.destColId : colId
      if (effectiveColId && map[effectiveColId] !== undefined) {
        map[effectiveColId].push(task)
      } else if (columns[0]) {
        map[String(columns[0].id)].push(task)
      }
    })
    return map
  }, [filteredTasks, columns, pendingMove])

  // Helper: find the column id for a given task id (reads pre-move state)
  function getColumnIdForTask(taskId: string): string | undefined {
    if (!columns) return undefined
    for (const col of columns) {
      const colId = String(col.id)
      if ((tasksByColumn[colId] ?? []).some((t: ParentTask) => t.id === taskId)) {
        return colId
      }
    }
    return undefined
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === String(event.active.id))
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const overId = String(over.id)
    const destColId = overId.startsWith('col-')
      ? overId.replace('col-', '')
      : getColumnIdForTask(overId)

    const srcColId = getColumnIdForTask(String(active.id))

    if (!destColId || srcColId === destColId) return

    // Drag-to-done warning: check if destination is last column (Done)
    if (columns) {
      const sortedCols = [...columns].sort((a, b) => a.order_index - b.order_index)
      const lastCol = sortedCols[sortedCols.length - 1]
      if (lastCol && String(lastCol.id) === destColId) {
        toast.warning('Moving task to Done. Ensure all dependencies are resolved.', {
          duration: 3000,
        })
      }
    }

    const taskId = String(active.id)
    // Optimistic: move card to new column immediately (no teleport on server response)
    setPendingMove({ taskId, destColId })
    mutation.mutate({ taskId, columnId: Number(destColId) }, {
      onSettled: () => setPendingMove(null),
    })
  }

  const sortedColumns = useMemo(
    () => (columns ? [...columns].sort((a, b) => a.order_index - b.order_index) : []),
    [columns]
  )

  if (isColumnsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!columns || columns.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No board columns configured for this project.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Sprint filter */}
        <Select
          value={String(activeSprintId)}
          onValueChange={(val) => {
            if (val === 'all') setActiveSprintId('all')
            else if (val === 'backlog') setActiveSprintId('backlog')
            else setActiveSprintId(Number(val))
          }}
        >
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Sprint" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sprints</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
            {(sprints ?? []).map((sprint: Sprint) => (
              <SelectItem key={sprint.id} value={String(sprint.id)}>
                {sprint.name}
                {sprint.is_active && ' (Active)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Compact/Rich toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCompact(c => !c)}
        >
          {compact ? 'Rich View' : 'Compact View'}
        </Button>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        autoScroll={{
          threshold: { x: 0.15, y: 0.2 },
          acceleration: 8,
          interval: 5,
        }}
      >
        {/* Mobile layout: single column with tab strip */}
        <div className="block sm:hidden">
          <div className="flex overflow-x-auto gap-1 pb-2 mb-3">
            {sortedColumns.map((col, idx) => (
              <button
                key={col.id}
                onClick={() => setActiveColumnIndex(idx)}
                className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeColumnIndex === idx
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>
          {sortedColumns[activeColumnIndex] && (
            <KanbanColumn
              column={sortedColumns[activeColumnIndex]}
              tasks={tasksByColumn[String(sortedColumns[activeColumnIndex].id)] ?? []}
              compact={compact}
            />
          )}
        </div>

        {/* Desktop layout: all columns in a horizontally scrollable container with fixed height */}
        <div className="hidden sm:flex gap-3 overflow-x-auto pb-3 h-[70vh] min-h-[400px]">
          {sortedColumns.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasksByColumn[String(col.id)] ?? []}
              compact={compact}
            />
          ))}
        </div>

        {/* DragOverlay: ghost card following cursor */}
        <DragOverlay>
          {activeTask ? (
            <KanbanCard task={activeTask} compact={compact} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
