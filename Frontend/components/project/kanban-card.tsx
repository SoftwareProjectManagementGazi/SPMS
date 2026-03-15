"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ParentTask, TaskPriority } from '@/lib/types'

const priorityBorderColor: Record<TaskPriority, string> = {
  CRITICAL: 'border-l-red-500',
  HIGH: 'border-l-orange-500',
  MEDIUM: 'border-l-yellow-400',
  LOW: 'border-l-gray-300',
}

interface KanbanCardProps {
  task: ParentTask
  compact?: boolean
  overlay?: boolean
}

export function KanbanCard({ task, compact = false, overlay = false }: KanbanCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const baseClass = `border-l-4 rounded bg-card shadow-sm select-none ${priorityBorderColor[task.priority]}`
  const cursorClass = overlay ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing'

  if (overlay) {
    // DragOverlay: render without drag listeners to avoid double-registration
    return (
      <div className={`${baseClass} ${cursorClass} rotate-2 shadow-lg`}>
        {compact ? (
          <div className="p-2 flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground shrink-0">{task.key}</span>
            <span className="text-sm line-clamp-1">{task.title}</span>
          </div>
        ) : (
          <RichContent task={task} />
        )}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${baseClass} ${cursorClass}`}
    >
      {compact ? (
        <div className="p-2 flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground shrink-0">{task.key}</span>
          <span className="text-sm line-clamp-1">{task.title}</span>
        </div>
      ) : (
        <RichContent task={task} />
      )}
    </div>
  )
}

function RichContent({ task }: { task: ParentTask }) {
  return (
    <div className="p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-mono text-muted-foreground">{task.key}</span>
        <Badge
          className={`text-[10px] uppercase border ${
            task.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 border-red-300' :
            task.priority === 'HIGH'     ? 'bg-orange-100 text-orange-700 border-orange-300' :
            task.priority === 'MEDIUM'   ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                           'bg-gray-100 text-gray-600 border-gray-300'
          }`}
        >
          {task.priority}
        </Badge>
      </div>
      <p className="text-sm font-medium line-clamp-2">{task.title}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Avatar className="h-5 w-5">
            <AvatarImage src={task.assignee?.avatar} />
            <AvatarFallback className="text-[10px]">
              {task.assignee?.name?.[0] ?? '?'}
            </AvatarFallback>
          </Avatar>
          <span className="truncate max-w-[80px]">
            {task.assignee?.name ?? 'Unassigned'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {task.isRecurring && (
            <span title="Recurring" className="text-xs">
              ↺
            </span>
          )}
          {task.dueDate && (
            <span>{format(new Date(task.dueDate), 'MMM d')}</span>
          )}
          {task.points > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {task.points}p
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
