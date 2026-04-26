// Phase 13 Plan 13-05 Task 1 — RTL coverage for ProfileTasksTab.
//
// Tests 7-12 from the plan's <behavior> block:
//    7. SegmentedControl has 3 options (Aktif / Tamamlanan / Tümü)
//    8. Aktif filter excludes completed tasks
//    9. Groups by project (2 projects → 2 Card groups)
//   10. Renders TaskRow with density="compact" + showProject={false}
//   11. Row click navigates via the TaskRow stub's data-task-id (TaskRow's own
//       useRouter pattern is owned by Phase 11; the stub asserts the prop wiring)
//   12. Empty state when filter excludes all tasks

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

const useQueryMock = vi.fn()
vi.mock("@tanstack/react-query", () => ({
  useQuery: (opts: unknown) => useQueryMock(opts),
}))

vi.mock("@/services/profile-service", () => ({
  profileService: {
    getUserTasks: vi.fn(),
  },
}))

// TaskRow stub — exposes the props the parent passes (density, projectId).
vi.mock("@/components/my-tasks/task-row", () => ({
  TaskRow: ({ task, density, showProject }: any) => (
    <div
      data-testid="task-row"
      data-density={density}
      data-show-project={String(!!showProject)}
      data-task-id={task.id}
      data-project-id={task.projectId}
    >
      {task.title}
    </div>
  ),
}))

import { ProfileTasksTab } from "./profile-tasks-tab"

function makeTask(overrides: Partial<any> = {}) {
  return {
    id: 1,
    key: "MOBIL-1",
    title: "Sample Task",
    status: "todo",
    priority: "medium" as const,
    assigneeId: 7,
    assigneeName: "Y B",
    reporterId: 1,
    parentTaskId: null,
    projectId: 1,
    cycleId: null,
    phaseId: null,
    points: null,
    start: null,
    due: null,
    labels: [],
    watcherCount: 0,
    type: "task" as const,
    createdAt: new Date().toISOString(),
    projectKey: "MOBIL",
    projectName: "Mobile App",
    ...overrides,
  }
}

beforeEach(() => {
  useQueryMock.mockReset()
})

describe("ProfileTasksTab", () => {
  it("renders the SegmentedControl with 3 options (Aktif / Tamamlanan / Tümü)", () => {
    useQueryMock.mockReturnValue({ data: { tasks: [] }, isLoading: false, error: null })
    render(<ProfileTasksTab userId={7} />)
    expect(screen.getByRole("button", { name: "Aktif" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tamamlanan" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tümü" })).toBeInTheDocument()
  })

  it("filter Aktif excludes completed (status='done') tasks", () => {
    const tasks = [
      makeTask({ id: 1, title: "A", status: "todo" }),
      makeTask({ id: 2, title: "B", status: "progress" }),
      makeTask({ id: 3, title: "C", status: "done" }),
      makeTask({ id: 4, title: "D", status: "review" }),
      makeTask({ id: 5, title: "E", status: "done" }),
    ]
    useQueryMock.mockReturnValue({ data: { tasks }, isLoading: false, error: null })
    render(<ProfileTasksTab userId={7} />)
    // Aktif is the default filter — only 3 active tasks visible.
    expect(screen.getAllByTestId("task-row")).toHaveLength(3)
  })

  it("groups tasks by project (2 distinct projectIds → 2 Card groups)", () => {
    const tasks = [
      makeTask({ id: 1, projectId: 1, projectKey: "MOBIL", projectName: "Mobile App" }),
      makeTask({ id: 2, projectId: 1, projectKey: "MOBIL", projectName: "Mobile App" }),
      makeTask({ id: 3, projectId: 2, projectKey: "WEB", projectName: "Website" }),
    ]
    useQueryMock.mockReturnValue({ data: { tasks }, isLoading: false, error: null })
    render(<ProfileTasksTab userId={7} />)
    // Project group headers — name appears in the strip
    expect(screen.getByText("Mobile App")).toBeInTheDocument()
    expect(screen.getByText("Website")).toBeInTheDocument()
    // Both keys are rendered (mono labels)
    expect(screen.getByText("MOBIL")).toBeInTheDocument()
    expect(screen.getByText("WEB")).toBeInTheDocument()
  })

  it("renders TaskRow with density='compact' and showProject=false", () => {
    const tasks = [makeTask({ id: 1, projectId: 1 })]
    useQueryMock.mockReturnValue({ data: { tasks }, isLoading: false, error: null })
    render(<ProfileTasksTab userId={7} />)
    const row = screen.getByTestId("task-row")
    expect(row.getAttribute("data-density")).toBe("compact")
    expect(row.getAttribute("data-show-project")).toBe("false")
  })

  it("clicking Tümü filter shows all tasks (active + completed)", () => {
    const tasks = [
      makeTask({ id: 1, status: "todo" }),
      makeTask({ id: 2, status: "done" }),
      makeTask({ id: 3, status: "done" }),
    ]
    useQueryMock.mockReturnValue({ data: { tasks }, isLoading: false, error: null })
    render(<ProfileTasksTab userId={7} />)
    fireEvent.click(screen.getByRole("button", { name: "Tümü" }))
    expect(screen.getAllByTestId("task-row")).toHaveLength(3)
  })

  it("renders empty state when filter excludes all tasks", () => {
    const tasks = [
      makeTask({ id: 1, status: "done" }),
      makeTask({ id: 2, status: "done" }),
    ]
    useQueryMock.mockReturnValue({ data: { tasks }, isLoading: false, error: null })
    render(<ProfileTasksTab userId={7} />)
    // Aktif filter (default) → 0 visible → empty fallback
    expect(screen.getByText("Bu filtreyle görev bulunamadı.")).toBeInTheDocument()
  })
})
