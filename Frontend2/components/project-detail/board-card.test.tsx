import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent } from "@testing-library/react"
import { DndContext } from "@dnd-kit/core"
import { SortableContext } from "@dnd-kit/sortable"

import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { mockTasks, type MockTask } from "@/test/fixtures/tasks"
import { BoardCard, BoardCardGhost } from "./board-card"
import type { Task } from "@/services/task-service"

// Mock next/navigation router so click-to-navigate tests can assert the push call
const pushSpy = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
}))

function taskFromMock(m: MockTask): Task {
  return {
    id: m.id,
    key: m.key,
    title: m.title,
    description: m.description,
    status: m.status,
    priority: m.priority,
    assigneeId: m.assignee_id,
    reporterId: m.reporter_id,
    parentTaskId: m.parent_task_id,
    projectId: m.project_id,
    cycleId: m.cycle_id,
    phaseId: m.phase_id,
    points: m.points,
    start: m.start,
    due: m.due,
    labels: m.labels,
    watcherCount: m.watcher_count,
    type: m.type,
    createdAt: "2026-01-01T00:00:00Z",
  }
}

const PHASE_NODES = [
  { id: "n1", name: "Analiz" },
  { id: "n2", name: "Tasarım" },
  { id: "n3", name: "Geliştirme" },
]

function wrap(ui: React.ReactElement, ids: number[]) {
  // useSortable requires a SortableContext (and DndContext) ancestor to register.
  return (
    <DndContext>
      <SortableContext items={ids}>{ui}</SortableContext>
    </DndContext>
  )
}

describe("BoardCard", () => {
  beforeEach(() => {
    pushSpy.mockClear()
  })

  it("renders task.key and task.title", () => {
    const task = taskFromMock(mockTasks[0])
    const { getByText } = renderWithProviders(
      wrap(
        <BoardCard
          task={task}
          columnId="todo"
          projectId={1}
          densityMode="rich"
          phaseNodes={PHASE_NODES}
          enablePhaseBadge={false}
        />,
        [task.id]
      )
    )
    expect(getByText("MOBIL-1")).toBeInTheDocument()
    expect(getByText("Auth akışı")).toBeInTheDocument()
  })

  it("Compact mode hides priority label and points/due row", () => {
    const task = taskFromMock(mockTasks[0])
    const { queryByText } = renderWithProviders(
      wrap(
        <BoardCard
          task={task}
          columnId="todo"
          projectId={1}
          densityMode="compact"
          phaseNodes={PHASE_NODES}
          enablePhaseBadge={false}
        />,
        [task.id]
      )
    )
    // points chip (the number "5") is only shown in rich mode
    expect(queryByText("5")).toBeNull()
    // Priority chip label ("Yüksek") appears only in rich mode
    expect(queryByText(/Yüksek/)).toBeNull()
  })

  it("Rich mode shows priority label + points", () => {
    const task = taskFromMock(mockTasks[0])
    const { getByText } = renderWithProviders(
      wrap(
        <BoardCard
          task={task}
          columnId="todo"
          projectId={1}
          densityMode="rich"
          phaseNodes={PHASE_NODES}
          enablePhaseBadge={false}
        />,
        [task.id]
      )
    )
    // Points rendered as a mono badge
    expect(getByText("5")).toBeInTheDocument()
    // Priority label in Turkish (AppProvider defaults language to "tr")
    expect(getByText(/Yüksek/)).toBeInTheDocument()
  })

  it("renders phase badge when enablePhaseBadge=true and task has phase", () => {
    const task = taskFromMock(mockTasks[0]) // phaseId: "n1"
    const { getByText } = renderWithProviders(
      wrap(
        <BoardCard
          task={task}
          columnId="todo"
          projectId={1}
          densityMode="rich"
          phaseNodes={PHASE_NODES}
          enablePhaseBadge
        />,
        [task.id]
      )
    )
    expect(getByText("Analiz")).toBeInTheDocument()
  })

  it("does NOT render phase badge when enablePhaseBadge=false", () => {
    const task = taskFromMock(mockTasks[0])
    const { queryByText } = renderWithProviders(
      wrap(
        <BoardCard
          task={task}
          columnId="todo"
          projectId={1}
          densityMode="rich"
          phaseNodes={PHASE_NODES}
          enablePhaseBadge={false}
        />,
        [task.id]
      )
    )
    expect(queryByText("Analiz")).toBeNull()
  })

  it("clicking the card calls router.push('/projects/{pid}/tasks/{tid}')", () => {
    const task = taskFromMock(mockTasks[0])
    const { getByText } = renderWithProviders(
      wrap(
        <BoardCard
          task={task}
          columnId="todo"
          projectId={42}
          densityMode="rich"
          phaseNodes={PHASE_NODES}
          enablePhaseBadge={false}
        />,
        [task.id]
      )
    )
    fireEvent.click(getByText("Auth akışı"))
    expect(pushSpy).toHaveBeenCalledWith("/projects/42/tasks/101")
  })

  it("renders a bug icon for task.type='bug'", () => {
    const bugTask = taskFromMock(mockTasks[2]) // type: "bug"
    const { container } = renderWithProviders(
      wrap(
        <BoardCard
          task={bugTask}
          columnId="review"
          projectId={1}
          densityMode="rich"
          phaseNodes={PHASE_NODES}
          enablePhaseBadge={false}
        />,
        [bugTask.id]
      )
    )
    // lucide Bug renders an <svg class="lucide-bug ...">
    const svg = container.querySelector("svg.lucide-bug")
    expect(svg).not.toBeNull()
  })
})

describe("BoardCardGhost", () => {
  it("renders task.key and task.title without draggable listeners", () => {
    const task = taskFromMock(mockTasks[0])
    const { getByText, container } = renderWithProviders(<BoardCardGhost task={task} />)
    expect(getByText("MOBIL-1")).toBeInTheDocument()
    expect(getByText("Auth akışı")).toBeInTheDocument()
    // No aria-pressed/role="button" since it's pointerEvents:none
    const root = container.firstChild as HTMLElement
    expect(root.style.pointerEvents).toBe("none")
  })
})
