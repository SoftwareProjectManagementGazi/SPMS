// Usage in parent:
// const GanttTab = dynamic(() => import('./gantt-tab').then(m => ({ default: m.GanttTab })), { ssr: false })
// Required because frappe-gantt accesses DOM on import.

"use client"

import { useEffect, useRef, useState } from 'react'
import 'frappe-gantt/dist/frappe-gantt.css'
import { ParentTask } from '@/lib/types'

// TODO (Phase 7): When ParentTask receives a `dependencies: string[]` field
// (list of dependent task IDs), populate ganttTask.dependencies as a
// comma-separated string to render finish-to-start arrows via frappe-gantt.

interface Props {
  tasks: ParentTask[]
}

export function GanttTab({ tasks }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<unknown>(null)
  const [viewMode, setViewMode] = useState<'Day' | 'Week'>('Day')

  const undatedCount = tasks.filter(t => !t.dueDate).length

  const ganttTasks = tasks
    .filter(t => t.dueDate != null)
    .map(t => ({
      id: t.id,
      name: t.key + ' ' + t.title,
      start: t.createdAt.split('T')[0], // fallback: no start_date on ParentTask type
      end: t.dueDate!.split('T')[0],
      progress: 0,
      dependencies: '', // Phase 7: populate when task dependency IDs are in ParentTask
      custom_class: `priority-${t.priority.toLowerCase()}`,
    }))

  useEffect(() => {
    if (!containerRef.current || ganttTasks.length === 0) return
    // Cleanup previous instance
    containerRef.current.innerHTML = ''
    ganttRef.current = null

    // Dynamic import — belt-and-suspenders SSR safety
    import('frappe-gantt').then(({ default: Gantt }) => {
      if (!containerRef.current) return
      ganttRef.current = new Gantt(
        containerRef.current,
        ganttTasks,
        {
          view_mode: viewMode,
          draggable: false, // read-only per CONTEXT.md
          date_format: 'YYYY-MM-DD',
          custom_popup_html: (task: any) => `
            <div style="padding:8px;background:white;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.15);min-width:200px;">
              <strong style="font-size:13px;">${task.name}</strong>
              <div style="font-size:11px;color:#666;margin-top:4px;">${task._start} \u2192 ${task._end}</div>
              <a href="/tasks/${task.id}" style="font-size:12px;color:#3b82f6;display:block;margin-top:6px;">View full task \u2192</a>
            </div>
          `,
        }
      )
    })

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ''
      ganttRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ganttTasks.map(t => t.id + t.start + t.end).join(','), viewMode])

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        {undatedCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {undatedCount} task{undatedCount !== 1 ? 's' : ''} without dates not shown.
          </p>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setViewMode('Day')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === 'Day'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('Week')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              viewMode === 'Week'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Gantt chart */}
      {ganttTasks.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No tasks with dates to display on the timeline.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div ref={containerRef} />
        </div>
      )}
    </div>
  )
}
