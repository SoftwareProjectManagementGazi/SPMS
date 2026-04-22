import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { DndContext } from "@dnd-kit/core"

import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { mockTasks, type MockTask } from "@/test/fixtures/tasks"
import { BoardColumn } from "./board-column"
import type { Task } from "@/services/task-service"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
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

function wrap(ui: React.ReactElement) {
  return <DndContext>{ui}</DndContext>
}

const PHASE_NODES = [
  { id: "n1", name: "Analiz" },
  { id: "n2", name: "Tasarım" },
]

describe("BoardColumn", () => {
  it("renders column name + empty state when tasks is []", () => {
    const { getByText } = renderWithProviders(
      wrap(
        <BoardColumn
          columnId="todo"
          columnName="Yapılacak"
          wipLimit={5}
          tasks={[]}
          projectId={1}
          densityMode="rich"
          phaseNodes={PHASE_NODES}
          enablePhaseBadge={false}
        />
      )
    )
    expect(getByText("Yapılacak")).toBeInTheDocument()
    expect(getByText("Bu kolonda görev yok")).toBeInTheDocument()
    // Count badge shows "0/5" when wipLimit > 0
    expect(getByText("0/5")).toBeInTheDocument()
  })

  it("shows plain count (no /limit) when wipLimit=0", () => {
    const tasks = [taskFromMock(mockTasks[0])]
    const { getByText, queryByText } = renderWithProviders(
      wrap(
        <BoardColumn
          columnId="progress"
          columnName="Devam Eden"
          wipLimit={0}
          tasks={tasks}
          projectId={1}
          densityMode="rich"
          phaseNodes={PHASE_NODES}
          enablePhaseBadge={false}
        />
      )
    )
    expect(getByText("1")).toBeInTheDocument()
    // No "1/N" string rendered when limit is disabled
    expect(queryByText("1/0")).toBeNull()
  })

  it("renders the WIP AlertBanner when tasks.length > wipLimit (D-20)", () => {
    // Build 4 distinct tasks (reusing mocks and bumping ids)
    const tasks = [0, 1, 2, 3].map((i) => ({
      ...taskFromMock(mockTasks[0]),
      id: 1000 + i,
      key: `X-${i}`,
    }))
    const { getByText } = renderWithProviders(
      wrap(
        <BoardColumn
          columnId="progress"
          columnName="Devam Eden"
          wipLimit={3}
          tasks={tasks}
          projectId={1}
          densityMode="rich"
          phaseNodes={PHASE_NODES}
          enablePhaseBadge={false}
        />
      )
    )
    expect(getByText(/WIP limiti aşıldı/)).toBeInTheDocument()
    // Count shows 4/3 with danger tone (assert text, tone is visual)
    expect(getByText("4/3")).toBeInTheDocument()
  })

  it("does NOT render the WIP banner when tasks.length === wipLimit (at-limit, not over)", () => {
    const tasks = [0, 1, 2].map((i) => ({
      ...taskFromMock(mockTasks[0]),
      id: 2000 + i,
      key: `Y-${i}`,
    }))
    const { queryByText, getByText } = renderWithProviders(
      wrap(
        <BoardColumn
          columnId="progress"
          columnName="Devam Eden"
          wipLimit={3}
          tasks={tasks}
          projectId={1}
          densityMode="rich"
          phaseNodes={PHASE_NODES}
          enablePhaseBadge={false}
        />
      )
    )
    expect(queryByText(/WIP limiti aşıldı/)).toBeNull()
    expect(getByText("3/3")).toBeInTheDocument()
  })
})
