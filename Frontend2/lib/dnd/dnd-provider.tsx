"use client"
import * as React from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
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
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
      <DragOverlay>{renderGhost(activeId)}</DragOverlay>
    </DndContext>
  )
}
