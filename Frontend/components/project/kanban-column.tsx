"use client"

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
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
    <div
      className={`flex flex-col w-72 shrink-0 rounded-lg border overflow-hidden transition-colors duration-150 ${
        isOver ? 'border-primary/60 ring-2 ring-primary/20' : 'border-border'
      }`}
    >
      {/* Column header — lives outside the scroll area so it's always visible */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-card shrink-0">
        <h3 className="font-semibold text-sm">{column.name}</h3>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
          {column.wip_limit > 0 && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                tasks.length >= column.wip_limit + 2
                  ? "border-red-500 text-red-700 bg-red-50"
                  : tasks.length >= column.wip_limit
                    ? "border-amber-500 text-amber-700 bg-amber-50"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {tasks.length >= column.wip_limit && (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {tasks.length} / {column.wip_limit}
            </Badge>
          )}
        </div>
      </div>

      {/* Droppable card list — scrolls independently, fills remaining column height */}
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2 flex-1 overflow-y-auto min-h-0 p-2 transition-colors duration-150 ${
            isOver ? 'bg-primary/5' : 'bg-muted/30'
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
