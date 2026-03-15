"use client"

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from '@/components/ui/badge'
import { ParentTask } from '@/lib/types'
import { BoardColumn } from '@/services/board-column-service'
import { KanbanCard } from './kanban-card'

interface KanbanColumnProps {
  column: BoardColumn
  tasks: ParentTask[]
  compact: boolean
}

export function KanbanColumn({ column, tasks, compact }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${column.id}` })

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-sm">{column.name}</h3>
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
          {column.wip_limit > 0 && `/${column.wip_limit}`}
        </Badge>
      </div>

      {/* Droppable area */}
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2 min-h-[100px] p-2 rounded-lg transition-colors ${
            isOver ? 'bg-muted/70 ring-2 ring-primary/30' : 'bg-muted/40'
          }`}
        >
          {tasks.map(t => (
            <KanbanCard key={t.id} task={t} compact={compact} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
