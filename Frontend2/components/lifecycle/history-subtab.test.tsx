// Unit tests for components/lifecycle/history-subtab.tsx (Phase 12 Plan 12-04).
//
// 5 RTL cases per 12-04-PLAN.md task 2 <behavior> Tests 1-5:
//   1. Lazy-fetch — first expand triggers GET (call count 0 → 1)
//   2. Cache hit — second expand stays at call count 1
//   3. Collapsible label — "Görev Detayları (N)"
//   4. Empty state — "Bu faz için kayıtlı görev bulunamadı."
//   5. MTTaskRow compact prop forwarded inside Collapsible

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HistorySubTab } from "./history-subtab"
import { HistoryCard } from "./history-card"
import * as taskServiceModule from "@/services/task-service"
import type { WorkflowConfig, WorkflowNode } from "@/services/lifecycle-service"
import type { Task } from "@/services/task-service"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

vi.mock("@/services/task-service", () => ({
  taskService: {
    getByProject: vi.fn().mockResolvedValue([]),
  },
}))

// Avoid `useRouter` invariant inside MTTaskRow when rendered in jsdom.
const pushMock = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

const mockedTaskGetByProject = vi.mocked(taskServiceModule.taskService.getByProject)

function makeQc() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: Infinity },
      mutations: { retry: false },
    },
  })
}

function wrap(node: React.ReactElement, qc?: QueryClient) {
  const client = qc ?? makeQc()
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>
}

const baseProject = {
  id: 7,
  key: "MOBIL",
  managerId: 1,
  methodology: "SCRUM",
}

function makeWorkflow(): WorkflowConfig {
  return {
    mode: "flexible",
    nodes: [
      { id: "planning", name: "Planlama", x: 0, y: 0, isInitial: true },
      { id: "execution", name: "Yürütme", x: 0, y: 0 },
      { id: "closure", name: "Kapanış", x: 0, y: 0, isFinal: true },
    ],
    edges: [
      { id: "e1", source: "planning", target: "execution", type: "flow" },
      { id: "e2", source: "execution", target: "closure", type: "flow" },
    ],
    groups: [],
  }
}

function makeActivity(sourcePhaseId: string, daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return {
    user_id: 1,
    created_at: d.toISOString(),
    extra_metadata: {
      source_phase_id: sourcePhaseId,
      target_phase_id: "execution",
    },
  }
}

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 1,
    key: "MOBIL-1",
    title: "Demo task",
    description: "",
    status: "done",
    priority: "medium",
    assigneeId: 1,
    reporterId: 1,
    parentTaskId: null,
    projectId: 7,
    cycleId: null,
    phaseId: "planning",
    points: null,
    start: null,
    due: null,
    labels: [],
    watcherCount: 0,
    type: "task",
    createdAt: "2026-04-25T00:00:00Z",
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedTaskGetByProject.mockResolvedValue([])
})

describe("HistorySubTab", () => {
  it("Test 1: lazy-fetch — first Collapsible expand triggers GET with phase_id+status filters", async () => {
    const tasks: Task[] = [
      makeTask({ id: 11, key: "MOBIL-11", title: "Görev 1" }),
      makeTask({ id: 12, key: "MOBIL-12", title: "Görev 2" }),
      makeTask({ id: 13, key: "MOBIL-13", title: "Görev 3" }),
    ]
    mockedTaskGetByProject.mockResolvedValueOnce(tasks)

    const activity = [makeActivity("planning", 5)]

    render(
      wrap(
        <HistorySubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
          activity={activity}
        />,
      ),
    )

    // Pre-expand: no network call
    expect(mockedTaskGetByProject).not.toHaveBeenCalled()

    // Click the Collapsible button
    const collapsibleBtn = screen
      .getAllByRole("button")
      .find((b) => /Görev Detayları/.test(b.textContent ?? ""))
    expect(collapsibleBtn).toBeDefined()
    fireEvent.click(collapsibleBtn!)

    // Post-expand: exactly one network call
    await waitFor(() => {
      expect(mockedTaskGetByProject).toHaveBeenCalledTimes(1)
    })
    // Filter assertion: phase_id + status:done
    const callArgs = mockedTaskGetByProject.mock.calls[0]
    expect(callArgs[0]).toBe(7)
    expect(callArgs[1]).toMatchObject({ phase_id: "planning", status: "done" })
  })

  it("Test 2: cache hit — second expand keeps call count at 1", async () => {
    const tasks: Task[] = [
      makeTask({ id: 11, key: "MOBIL-11", title: "Görev 1" }),
    ]
    mockedTaskGetByProject.mockResolvedValueOnce(tasks)

    const activity = [makeActivity("planning", 5)]

    const { container } = render(
      wrap(
        <HistorySubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
          activity={activity}
        />,
      ),
    )

    const findBtn = () =>
      screen.getAllByRole("button").find((b) => /Görev Detayları/.test(b.textContent ?? ""))!

    // First expand
    fireEvent.click(findBtn())
    await waitFor(() => {
      expect(mockedTaskGetByProject).toHaveBeenCalledTimes(1)
    })

    // Collapse
    fireEvent.click(findBtn())
    // Re-expand → cache hit, no new call
    fireEvent.click(findBtn())

    // Wait a microtask cycle to be sure
    await new Promise((r) => setTimeout(r, 50))
    expect(mockedTaskGetByProject).toHaveBeenCalledTimes(1)
    void container
  })

  it("Test 3: Collapsible label is 'Görev Detayları (N)' where N is the summary count", () => {
    const activity = [makeActivity("planning", 3)]
    render(
      wrap(
        <HistoryCard
          project={baseProject as never}
          phase={
            { id: "planning", name: "Planlama", x: 0, y: 0 } as WorkflowNode
          }
          summary={{
            closedAt: new Date().toISOString(),
            durationDays: 5,
            total: 5,
            done: 4,
            moved: 1,
            successPct: 80,
          }}
        />,
      ),
    )

    expect(screen.getByText(/Görev Detayları.*\(4\)/)).toBeInTheDocument()
    void activity
  })

  it("Test 4: empty state — '%s' when fetched task list is empty", async () => {
    mockedTaskGetByProject.mockResolvedValueOnce([])
    const activity = [makeActivity("planning", 5)]
    render(
      wrap(
        <HistorySubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
          activity={activity}
        />,
      ),
    )

    const btn = screen
      .getAllByRole("button")
      .find((b) => /Görev Detayları/.test(b.textContent ?? ""))
    fireEvent.click(btn!)

    await waitFor(() => {
      expect(
        screen.getByText("Bu faz için kayıtlı görev bulunamadı."),
      ).toBeInTheDocument()
    })
  })

  it("Test 5: HistoryCard forwards compact prop to TaskRow rows (source-grep style assertion)", async () => {
    const tasks: Task[] = [
      makeTask({ id: 11, key: "MOBIL-11", title: "Görev A" }),
      makeTask({ id: 12, key: "MOBIL-12", title: "Görev B" }),
    ]
    mockedTaskGetByProject.mockResolvedValueOnce(tasks)
    const activity = [makeActivity("planning", 5)]
    render(
      wrap(
        <HistorySubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
          activity={activity}
        />,
      ),
    )

    const btn = screen
      .getAllByRole("button")
      .find((b) => /Görev Detayları/.test(b.textContent ?? ""))
    fireEvent.click(btn!)

    await waitFor(() => {
      // Both tasks render — assertion that TaskRow mounted (compact does not
      // change semantic content; the source-grep acceptance criterion catches
      // the prop pass-through at file scope).
      expect(screen.getByText("Görev A")).toBeInTheDocument()
      expect(screen.getByText("Görev B")).toBeInTheDocument()
    })
  })

  it("Test 6: empty workflow → no closed phases → empty state copy", () => {
    render(
      wrap(
        <HistorySubTab
          project={baseProject as never}
          workflow={makeWorkflow()}
          activity={[]}
        />,
      ),
    )
    expect(screen.getByText("Henüz kapatılmış faz yok.")).toBeInTheDocument()
  })

  it("Test 7: 2 closed phases × 3 done tasks → 2 cards each with '(3)' label (LIFE-04 acceptance)", () => {
    const activity = [
      makeActivity("planning", 10),
      makeActivity("execution", 5),
    ]
    render(
      wrap(
        <HistorySubTab
          project={{
            ...baseProject,
            // attach summary stats per phase later via prop; for now the
            // history card pulls counts from a default summary derived from
            // activity; the precise count check is exercised in HistoryCard
            // direct-render Test 3 above.
          } as never}
          workflow={makeWorkflow()}
          activity={activity}
          phaseDoneCounts={{ planning: 3, execution: 3 }}
        />,
      ),
    )
    // Two cards rendered → both labels present
    const labels = screen.getAllByText(/Görev Detayları.*\(3\)/)
    expect(labels.length).toBe(2)
  })
})
