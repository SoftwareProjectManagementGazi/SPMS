"use client"
import * as React from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"

interface ProjectDnDProviderProps {
  projectId: number
  onTaskDropped: (taskId: number, sourceColumnId: string, targetColumnId: string) => void
  renderGhost: (taskId: number | null) => React.ReactNode
  children: React.ReactNode
}

export function ProjectDnDProvider({
  onTaskDropped,
  renderGhost,
  children,
}: ProjectDnDProviderProps) {
  const [activeId, setActiveId] = React.useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const sourceColumnId = active.data.current?.columnId as string | undefined
    const targetColumnId = over.data.current?.columnId as string | undefined
    if (!targetColumnId || !sourceColumnId || sourceColumnId === targetColumnId) return
    onTaskDropped(Number(active.id), sourceColumnId, targetColumnId)
  }

  return (
    // closestCorners (the @dnd-kit kanban recommendation) instead of the
    // default rectIntersection: rectIntersection requires the dragged card to
    // physically overlap a droppable, so drops onto empty/sparse columns were
    // frequently missed and `over` resolved to an underlying card. closestCorners
    // always picks the nearest droppable to the pointer; both columns and cards
    // expose `columnId`, so handleDragEnd resolves the target column either way.
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>{renderGhost(activeId)}</DragOverlay>
    </DndContext>
  )
}
