// Usage in parent:
// const GanttTab = dynamic(() => import('./gantt-tab').then(m => ({ default: m.GanttTab })), { ssr: false })
// Required because frappe-gantt accesses DOM on import.

"use client"

import { useEffect, useRef, useState } from 'react'
import { ParentTask } from '@/lib/types'

// TODO (Phase 7): When ParentTask receives a `dependencies: string[]` field
// (list of dependent task IDs), populate ganttTask.dependencies as a
// comma-separated string to render finish-to-start arrows via frappe-gantt.

interface Props {
  tasks: ParentTask[]
}

type ViewMode = 'Day' | 'Week' | 'Month'

// Column widths (px) per view mode — wider in Week/Month so bars are visible
const COLUMN_WIDTH: Record<ViewMode, number> = {
  Day:   38,
  Week: 120,
  Month: 160,
}

export function GanttTab({ tasks }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<unknown>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('Week')

  const undatedCount = tasks.filter(t => !t.dueDate).length

  const ganttTasks = tasks
    .filter(t => t.dueDate != null)
    .map(t => {
      const startStr = t.createdAt.split('T')[0]
      const endRaw = t.dueDate!.split('T')[0]
      // frappe-gantt requires end > start; ensure at least 1 day gap
      let endStr = endRaw
      if (endRaw <= startStr) {
        const d = new Date(startStr)
        d.setDate(d.getDate() + 1)
        endStr = d.toISOString().split('T')[0]
      }
      return {
        id: String(t.id),
        name: t.key + ' ' + t.title,
        start: startStr,
        end: endStr,
        progress: 0,
        dependencies: '',
        custom_class: `priority-${t.priority.toLowerCase()}`,
      }
    })

  useEffect(() => {
    if (!containerRef.current || ganttTasks.length === 0) return
    // Cleanup previous instance
    containerRef.current.innerHTML = ''
    ganttRef.current = null

    // Inject CSS once (package exports field blocks direct subpath import)
    if (!document.getElementById('frappe-gantt-css')) {
      const link = document.createElement('link')
      link.id = 'frappe-gantt-css'
      link.rel = 'stylesheet'
      link.href = '/frappe-gantt.css'
      document.head.appendChild(link)
    }

    // Dynamic import — belt-and-suspenders SSR safety
    import('frappe-gantt').then(({ default: Gantt }) => {
      if (!containerRef.current) return

      ganttRef.current = new Gantt(
        containerRef.current,
        ganttTasks,
        {
          view_mode: viewMode,
          draggable: false,
          date_format: 'YYYY-MM-DD',
          column_width: COLUMN_WIDTH[viewMode],
          // Scroll to where the tasks actually are instead of "today"
          scroll_to: ganttTasks[0]?.start,
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
          {(['Day', 'Week', 'Month'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Gantt chart — let frappe-gantt manage its own horizontal scroll */}
      {ganttTasks.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No tasks with dates to display on the timeline.
        </div>
      ) : (
        <div
          className="w-full rounded border border-border"
          // GPU-composited layer reduces scroll jank
          style={{ transform: 'translateZ(0)', maxHeight: '65vh', overflowY: 'auto' }}
        >
          <div ref={containerRef} className="w-full" />
        </div>
      )}
    </div>
  )
}
