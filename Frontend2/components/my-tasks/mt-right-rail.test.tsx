import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { MTRightRail } from "./mt-right-rail"
import type { Task } from "@/services/task-service"
import type { MyTasksStore } from "@/hooks/use-my-tasks-store"

function task(overrides: Partial<Task>): Task {
  return {
    id: 1,
    key: "MOBIL-1",
    title: "Sample task",
    description: "",
    status: "todo",
    priority: "medium",
    assigneeId: 1,
    reporterId: 1,
    parentTaskId: null,
    projectId: 1,
    cycleId: null,
    phaseId: null,
    points: 3,
    start: null,
    due: null,
    labels: [],
    watcherCount: 0,
    type: "task",
    createdAt: "2026-04-01T00:00:00Z",
    ...overrides,
  }
}

const EMPTY_STORE: MyTasksStore = {
  overrides: {},
  extras: [],
  starred: [],
  completedAt: {},
}

describe("MTRightRail", () => {
  it("renders a 7-day heatmap with the correct day labels (TR)", () => {
    const now = new Date(2026, 3, 25) // Saturday 25 April 2026
    const { getAllByText } = render(
      <MTRightRail
        lang="tr"
        store={EMPTY_STORE}
        allTasks={[]}
        nowRef={now}
      />
    )
    expect(getAllByText("Pt")[0]).toBeInTheDocument()
    expect(getAllByText("Pz")[0]).toBeInTheDocument()
  })

  it("renders the focus timer placeholder", () => {
    const { getByText } = render(
      <MTRightRail
        lang="tr"
        store={EMPTY_STORE}
        allTasks={[]}
        nowRef={new Date(2026, 3, 25)}
      />
    )
    expect(getByText("24:32")).toBeInTheDocument()
    expect(getByText("/ 50:00")).toBeInTheDocument()
    expect(getByText("Duraklat")).toBeInTheDocument()
    expect(getByText("Bitir")).toBeInTheDocument()
  })

  it("renders the recently completed list when store has completedAt entries", () => {
    const now = new Date(2026, 3, 25)
    const tasks = [
      task({ id: 1, title: "Done task A", status: "done" }),
      task({ id: 2, title: "Done task B", status: "done" }),
    ]
    const store: MyTasksStore = {
      ...EMPTY_STORE,
      completedAt: {
        1: new Date(2026, 3, 24).toISOString(),
        2: new Date(2026, 3, 23).toISOString(),
      },
    }
    const { getByText } = render(
      <MTRightRail
        lang="tr"
        store={store}
        allTasks={tasks}
        nowRef={now}
      />
    )
    expect(getByText("Done task A")).toBeInTheDocument()
    expect(getByText("Done task B")).toBeInTheDocument()
    expect(getByText("Yakın zamanda biten")).toBeInTheDocument()
  })

  it("does NOT render the recently-completed card when completedAt is empty", () => {
    const { queryByText } = render(
      <MTRightRail
        lang="tr"
        store={EMPTY_STORE}
        allTasks={[]}
        nowRef={new Date(2026, 3, 25)}
      />
    )
    expect(queryByText("Yakın zamanda biten")).toBeNull()
  })

  it("renders the quote card", () => {
    const { getByText } = render(
      <MTRightRail
        lang="en"
        store={EMPTY_STORE}
        allTasks={[]}
        nowRef={new Date(2026, 3, 25)}
      />
    )
    expect(
      getByText(/A to-do list breathes/i)
    ).toBeInTheDocument()
  })
})
