"use client"

import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventApi, EventDropArg } from '@fullcalendar/core'
import type { DropArg } from '@fullcalendar/interaction'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { addDays, addWeeks, addMonths, isBefore, parseISO } from 'date-fns'
import { ParentTask } from '@/lib/types'
import { Sprint } from '@/services/sprint-service'
import { taskService } from '@/services/task-service'
import { UndatedTasksSidebar } from './undated-tasks-sidebar'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string
  title: string
  date?: string
  start?: string
  end?: string
  display?: string
  color?: string
  extendedProps?: Record<string, unknown>
}

interface HoverPopover {
  event: EventApi
  position: { x: number; y: number }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BAND_COLORS = ['#DBEAFE', '#D1FAE5', '#FEF3C7', '#FCE7F3', '#EDE9FE']

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-300',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  LOW: 'bg-gray-100 text-gray-600 border-gray-300',
}

// ─── Recurring event expansion ─────────────────────────────────────────────

function expandRecurringTask(
  task: ParentTask,
  viewStart: Date,
  viewEnd: Date
): CalendarEvent[] {
  if (!task.dueDate || !task.isRecurring || !task.recurrenceInterval) return []

  const events: CalendarEvent[] = []
  let current = parseISO(task.dueDate)
  let count = 0
  const maxCount = Math.min(task.recurrenceCount ?? 52, 52)
  const endBound = task.recurrenceEndDate ? parseISO(task.recurrenceEndDate) : null

  while (count < maxCount) {
    if (endBound && isBefore(endBound, current)) break
    if (isBefore(viewEnd, current)) break

    if (!isBefore(current, viewStart)) {
      events.push({
        id: `${task.id}-r${count}`,
        title: task.key + ' ' + task.title,
        date: current.toISOString().split('T')[0],
        extendedProps: { taskId: task.id, priority: task.priority, isRecurring: true },
      })
    }

    switch (task.recurrenceInterval) {
      case 'daily':
        current = addDays(current, 1)
        break
      case 'weekly':
        current = addWeeks(current, 1)
        break
      case 'monthly':
        current = addMonths(current, 1)
        break
      default:
        count = maxCount // break loop for unknown interval
    }
    count++
  }

  return events
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  projectId: string
  tasks: ParentTask[]
  sprints: Sprint[]
}

export function CalendarTab({ projectId, tasks, sprints }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const calendarRef = useRef<FullCalendar>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [hoverPopover, setHoverPopover] = useState<HoverPopover | null>(null)

  // ── View window (updated on datesSet) ──
  const viewWindowRef = useRef<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(),
  })

  // ── Build event arrays ──────────────────────────────────────────────────────

  const { start: viewStart, end: viewEnd } = viewWindowRef.current

  // 1. Task events (non-recurring tasks with dueDate)
  const taskEvents: CalendarEvent[] = tasks
    .filter(t => t.dueDate && !t.isRecurring)
    .map(t => ({
      id: t.id,
      title: t.key + ' ' + t.title,
      date: t.dueDate!.split('T')[0],
      extendedProps: { taskId: t.id, priority: t.priority },
    }))

  // 2. Recurring task instances — expanded for current view window
  const recurringEvents: CalendarEvent[] = tasks
    .filter(t => t.isRecurring)
    .flatMap(t => expandRecurringTask(t, viewStart, viewEnd))

  // 3. Sprint background bands
  const sprintBands: CalendarEvent[] = sprints
    .filter(s => s.start_date && s.end_date)
    .map((s, idx) => ({
      id: 'sprint-' + s.id,
      title: s.name,
      start: s.start_date!,
      end: s.end_date!,
      display: 'background',
      color: BAND_COLORS[idx % BAND_COLORS.length],
    }))

  const allEvents = [...taskEvents, ...recurringEvents, ...sprintBands]

  // ── Handlers ───────────────────────────────────────────────────────────────

  const invalidateTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['project-tasks-paginated', projectId] })
  }, [queryClient, projectId])

  const handleEventDrop = useCallback(
    async (info: EventDropArg) => {
      // Skip background events (sprint bands)
      if (info.event.display === 'background') return
      try {
        await taskService.patchTask(info.event.id, { due_date: info.event.startStr })
        invalidateTasks()
      } catch {
        info.revert()
      }
    },
    [invalidateTasks]
  )

  const handleDrop = useCallback(
    async (info: DropArg) => {
      const taskId = (info.draggedEl as HTMLElement).dataset.taskId
      if (!taskId) return
      try {
        await taskService.patchTask(taskId, { due_date: info.dateStr })
        invalidateTasks()
      } catch {
        // silently fail — task stays in sidebar
      }
    },
    [invalidateTasks]
  )

  const handleEventClick = useCallback(
    (info: { event: EventApi }) => {
      // Skip sprint background bands
      if (info.event.display === 'background') return
      // Recurring events have id like "taskId-r0" — navigate to the base task
      const rawId = info.event.id
      const taskId = rawId.includes('-r') ? rawId.split('-r')[0] : rawId
      router.push('/tasks/' + taskId)
    },
    [router]
  )

  const handleEventMouseEnter = useCallback(
    (info: { event: EventApi; jsEvent: MouseEvent }) => {
      if (info.event.display === 'background') return
      setHoverPopover({
        event: info.event,
        position: { x: info.jsEvent.clientX, y: info.jsEvent.clientY },
      })
    },
    []
  )

  const handleEventMouseLeave = useCallback(() => {
    setHoverPopover(null)
  }, [])

  const handleEventDragStart = useCallback(() => {
    setHoverPopover(null)
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Toggle button above the calendar, aligned right */}
      <div className="flex justify-end">
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded border bg-background hover:bg-accent/50 transition-colors"
          title={sidebarOpen ? 'Hide undated tasks' : 'Show undated tasks'}
        >
          {sidebarOpen ? '→ Hide undated' : '← Undated tasks'}
        </button>
      </div>

      <div className="flex gap-4 h-full">
      {/* Calendar area */}
      <div className="flex-1 min-w-0">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          timeZone="UTC"
          editable={true}
          droppable={true}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek',
          }}
          events={allEvents}
          eventDrop={handleEventDrop}
          drop={handleDrop}
          eventClick={handleEventClick}
          eventMouseEnter={handleEventMouseEnter}
          eventMouseLeave={handleEventMouseLeave}
          eventDragStart={handleEventDragStart}
          datesSet={arg => {
            viewWindowRef.current = { start: arg.start, end: arg.end }
          }}
          height="auto"
        />
      </div>

      {/* Undated tasks sidebar */}
      {sidebarOpen && (
        <aside className="w-72 flex flex-col border rounded-lg p-3 bg-card shrink-0">
          <h3 className="font-semibold text-sm mb-3 text-foreground">
            Undated Tasks ({tasks.filter(t => !t.dueDate).length})
          </h3>
          <UndatedTasksSidebar tasks={tasks} />
        </aside>
      )}
      </div>

      {/* Hover popover — rendered in portal to avoid layout reflow */}
      {hoverPopover && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-50 bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 min-w-48 max-w-64 pointer-events-none"
          style={{
            left: hoverPopover.position.x + 12,
            top: hoverPopover.position.y - 8,
          }}
        >
          <p className="font-medium text-sm line-clamp-2 mb-1">
            {hoverPopover.event.title}
          </p>
          {hoverPopover.event.extendedProps?.priority && (
            <span
              className={`inline-block text-xs px-1.5 py-0.5 rounded border font-medium mb-1 ${PRIORITY_COLORS[hoverPopover.event.extendedProps.priority as string] ?? ''}`}
            >
              {hoverPopover.event.extendedProps.priority as string}
            </span>
          )}
          {hoverPopover.event.startStr && (
            <p className="text-xs text-muted-foreground">
              Due: {hoverPopover.event.startStr}
            </p>
          )}
          {hoverPopover.event.extendedProps?.isRecurring && (
            <p className="text-xs text-muted-foreground mt-0.5">↺ Recurring</p>
          )}
        </div>,
        document.body
      )}
    </div>
  )  // end outer space-y-2
}
