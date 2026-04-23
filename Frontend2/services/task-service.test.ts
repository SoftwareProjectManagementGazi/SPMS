import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the api-client module BEFORE importing the service so the service's
// bound `apiClient.get` reference picks up the mock.
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from "@/lib/api-client"
import { taskService } from "./task-service"

const apiGet = apiClient.get as unknown as ReturnType<typeof vi.fn>

function rawTaskDTO(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    key: "SPMS-1",
    title: "Seed task",
    description: "",
    status: "todo",
    priority: "medium",
    assignee_id: null,
    reporter_id: null,
    parent_task_id: null,
    project_id: 42,
    cycle_id: null,
    phase_id: null,
    points: null,
    start: null,
    due: null,
    labels: [],
    watcher_count: 0,
    type: "task",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("taskService.getByProject", () => {
  beforeEach(() => {
    apiGet.mockReset()
  })

  it("unwraps PaginatedResponse{items,total,page,page_size} from the backend", async () => {
    apiGet.mockResolvedValue({
      data: {
        items: [rawTaskDTO({ id: 10 }), rawTaskDTO({ id: 11 })],
        total: 2,
        page: 1,
        page_size: 20,
      },
    })

    const tasks = await taskService.getByProject(42)

    expect(Array.isArray(tasks)).toBe(true)
    expect(tasks).toHaveLength(2)
    expect(tasks[0]!.id).toBe(10)
    expect(tasks[1]!.id).toBe(11)
  })

  it("accepts a bare array for backward compatibility with existing test mocks", async () => {
    apiGet.mockResolvedValue({
      data: [rawTaskDTO({ id: 99 })],
    })

    const tasks = await taskService.getByProject(42)

    expect(tasks).toHaveLength(1)
    expect(tasks[0]!.id).toBe(99)
  })

  it("returns an empty array when the response is neither an array nor a paginated envelope", async () => {
    apiGet.mockResolvedValue({ data: null })

    const tasks = await taskService.getByProject(42)

    expect(tasks).toEqual([])
  })

  it("maps snake_case backend fields to camelCase frontend fields", async () => {
    apiGet.mockResolvedValue({
      data: {
        items: [
          rawTaskDTO({
            id: 7,
            assignee_id: 3,
            parent_task_id: 5,
            cycle_id: 2,
            phase_id: "nd_phase_1",
            watcher_count: 4,
            created_at: "2026-04-20T10:00:00Z",
          }),
        ],
        total: 1,
        page: 1,
        page_size: 20,
      },
    })

    const [task] = await taskService.getByProject(42)

    expect(task).toMatchObject({
      id: 7,
      assigneeId: 3,
      parentTaskId: 5,
      cycleId: 2,
      phaseId: "nd_phase_1",
      watcherCount: 4,
      createdAt: "2026-04-20T10:00:00Z",
    })
  })
})
