"use client"

import { useEffect, useRef, useState } from 'react'
import { Draggable } from '@fullcalendar/interaction'
import { ParentTask } from '@/lib/types'

interface Props {
  tasks: ParentTask[]
}

const PRIORITY_BADGE_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-gray-100 text-gray-600',
}

export function UndatedTasksSidebar({ tasks }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')

  const undated = tasks.filter(t => !t.dueDate)
  const filtered = undated.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.key.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (!containerRef.current) return
    const draggable = new Draggable(containerRef.current, {
      itemSelector: '.undated-task-item',
      eventData: (el: HTMLElement) => ({
        id: el.dataset.taskId!,
        title: el.dataset.taskTitle!,
      }),
    })
    return () => {
      draggable.destroy()
    }
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search undated tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Task list */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-2 min-h-0"
      >
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {undated.length === 0 ? 'All tasks have due dates.' : 'No matches.'}
          </p>
        ) : (
          filtered.map(task => (
            <div
              key={task.id}
              className="undated-task-item cursor-grab active:cursor-grabbing p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors select-none"
              data-task-id={task.id}
              data-task-title={task.title}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-muted-foreground shrink-0">
                  {task.key}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGE_COLORS[task.priority] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {task.priority}
                </span>
              </div>
              <p className="text-xs line-clamp-1 text-foreground">{task.title}</p>
            </div>
          ))
        )}
      </div>

      {undated.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Drag a task onto the calendar to set its due date
        </p>
      )}
    </div>
  )
}
