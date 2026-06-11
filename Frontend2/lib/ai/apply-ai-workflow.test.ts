// Unit tests for the AI task-status apply path. The kanban board reads
// board_columns, so the apply must do real column CRUD — these tests pin
// that contract (reuse-by-name, create-before-delete, task move target,
// derived-node JSONB shape).

import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPatch = vi.fn()
const mockDelete = vi.fn()
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
    patch: (...a: unknown[]) => mockPatch(...a),
    delete: (...a: unknown[]) => mockDelete(...a),
  },
}))

const mockUpdateProcessConfig = vi.fn()
const mockCreateProject = vi.fn()
vi.mock("@/services/project-service", () => ({
  projectService: {
    updateProcessConfig: (...a: unknown[]) => mockUpdateProcessConfig(...a),
    create: (...a: unknown[]) => mockCreateProject(...a),
  },
}))

import { applyTaskStatusSuggestion } from "./apply-ai-workflow"
import type { SuggestedColumnPayload } from "./types"

function col(p: Partial<SuggestedColumnPayload> & { id: string; label: string }): SuggestedColumnPayload {
  return {
    description: "",
    color: "status-todo",
    wip_limit: null,
    is_initial: false,
    is_final: false,
    is_special: false,
    ...p,
  }
}

describe("applyTaskStatusSuggestion (replace)", () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    mockPatch.mockReset()
    mockDelete.mockReset()
    mockUpdateProcessConfig.mockReset()
    mockCreateProject.mockReset()
  })

  it("syncs real board columns: reuse by name, create new, delete stale (tasks → first column), persist col_* edges", async () => {
    mockGet.mockResolvedValue({
      data: [
        { id: 1, name: "Yapılacak" },
        { id: 2, name: "Devam Ediyor" },
        { id: 3, name: "Bitti" },
      ],
    })
    mockPost
      .mockResolvedValueOnce({ data: { id: 10 } }) // Backlog
      .mockResolvedValueOnce({ data: { id: 11 } }) // Tamamlandı
    mockPatch.mockResolvedValue({ data: {} })
    mockDelete.mockResolvedValue({ data: {} })
    mockUpdateProcessConfig.mockResolvedValue({})

    const result = await applyTaskStatusSuggestion({
      mode: "replace",
      projectId: 42,
      projectName: "P",
      existingProcessConfig: {
        schema_version: 2,
        phase_workflow: { mode: "flexible", nodes: [], edges: [], groups: [] },
        task_workflow: {
          edges: [],
          capabilities: { enforce_wip_limits: true },
        },
      },
      columns: [
        col({ id: "c1", label: "Backlog", is_initial: true }),
        // trailing space + lowercase — must still match existing "Yapılacak"
        col({ id: "c2", label: "yapılacak ", wip_limit: 2 }),
        col({ id: "c3", label: "Tamamlandı", is_final: true, wip_limit: 4 }),
        col({ id: "sp", label: "Özel Kova", is_special: true }),
      ],
      methodology: "KANBAN",
    })

    expect(result).toEqual({ projectId: 42, isNewProject: false })
    expect(mockGet).toHaveBeenCalledWith("/projects/42/columns")

    // Created: Backlog (order 0, initial/todo) + Tamamlandı (order 2, done).
    expect(mockPost).toHaveBeenCalledTimes(2)
    expect(mockPost).toHaveBeenNthCalledWith(1, "/projects/42/columns", {
      name: "Backlog",
      order_index: 0,
      category: "todo",
      is_initial: true,
      is_terminal: false,
    })
    expect(mockPost).toHaveBeenNthCalledWith(2, "/projects/42/columns", {
      name: "Tamamlandı",
      order_index: 2,
      category: "done",
      is_initial: false,
      is_terminal: true,
    })

    // Reused "Yapılacak" patched into slot 1 with its wip limit; created
    // "Tamamlandı" got its wip via a follow-up patch (create DTO has none).
    expect(mockPatch).toHaveBeenCalledWith("/projects/42/columns/1", {
      order_index: 1,
      wip_limit: 2,
      category: "in_progress",
      is_initial: false,
      is_terminal: false,
    })
    expect(mockPatch).toHaveBeenCalledWith("/projects/42/columns/11", {
      wip_limit: 4,
    })

    // Stale columns 2 & 3 deleted, tasks moved to the FIRST suggested
    // column (Backlog → id 10).
    expect(mockDelete).toHaveBeenCalledTimes(2)
    expect(mockDelete).toHaveBeenCalledWith(
      "/projects/42/columns/2?move_tasks_to_column_id=10",
    )
    expect(mockDelete).toHaveBeenCalledWith(
      "/projects/42/columns/3?move_tasks_to_column_id=10",
    )

    // JSONB: NO nodes (derived from board_columns), col_* linear edges in
    // AI order, capabilities preserved, rest of config spliced through.
    expect(mockUpdateProcessConfig).toHaveBeenCalledTimes(1)
    const [pid, cfg] = mockUpdateProcessConfig.mock.calls[0] as [
      number,
      {
        schema_version: number
        task_workflow: {
          nodes: unknown[]
          edges: Array<{ source: string; target: string }>
          capabilities?: Record<string, unknown>
        }
      },
    ]
    expect(pid).toBe(42)
    expect(cfg.schema_version).toBe(2)
    expect(cfg.task_workflow.nodes).toEqual([])
    expect(cfg.task_workflow.edges.map((e) => `${e.source}>${e.target}`)).toEqual([
      "col_10>col_1",
      "col_1>col_11",
    ])
    expect(cfg.task_workflow.capabilities).toEqual({
      enforce_wip_limits: true,
    })
  })

  it("creation happens before deletion (board never empties; move target exists)", async () => {
    const order: string[] = []
    mockGet.mockResolvedValue({ data: [{ id: 1, name: "Eski" }] })
    mockPost.mockImplementation(async () => {
      order.push("post")
      return { data: { id: 50 } }
    })
    mockDelete.mockImplementation(async () => {
      order.push("delete")
      return { data: {} }
    })
    mockPatch.mockResolvedValue({ data: {} })
    mockUpdateProcessConfig.mockResolvedValue({})

    await applyTaskStatusSuggestion({
      mode: "replace",
      projectId: 7,
      projectName: "P",
      existingProcessConfig: {},
      columns: [col({ id: "a", label: "Yeni", is_initial: true, is_final: true })],
      methodology: "SCRUM",
    })

    expect(order).toEqual(["post", "delete"])
    expect(mockDelete).toHaveBeenCalledWith(
      "/projects/7/columns/1?move_tasks_to_column_id=50",
    )
  })

  it("throws when the suggestion has no applicable (non-special) columns", async () => {
    await expect(
      applyTaskStatusSuggestion({
        mode: "replace",
        projectId: 1,
        projectName: "P",
        existingProcessConfig: {},
        columns: [col({ id: "s", label: "Özel", is_special: true })],
        methodology: "SCRUM",
      }),
    ).rejects.toThrow()
    expect(mockGet).not.toHaveBeenCalled()
    expect(mockUpdateProcessConfig).not.toHaveBeenCalled()
  })
})

describe("applyTaskStatusSuggestion (new_project)", () => {
  beforeEach(() => {
    mockCreateProject.mockReset()
    mockUpdateProcessConfig.mockReset()
  })

  it("passes column names to the create DTO and strips stale task workflow keys", async () => {
    mockCreateProject.mockResolvedValue({ id: 99 })

    const result = await applyTaskStatusSuggestion({
      mode: "new_project",
      projectId: 42,
      projectName: "Kaynak",
      existingProcessConfig: {
        schema_version: 2,
        task_workflow: { edges: [{ source: "col_1", target: "col_2" }] },
        status_workflow: { edges: [] },
      },
      columns: [
        col({ id: "a", label: "Hazır", is_initial: true }),
        col({ id: "b", label: "Bitti", is_final: true }),
        col({ id: "s", label: "Özel", is_special: true }),
      ],
      methodology: "KANBAN",
    })

    expect(result).toEqual({ projectId: 99, isNewProject: true })
    expect(mockCreateProject).toHaveBeenCalledTimes(1)
    const dto = mockCreateProject.mock.calls[0][0] as {
      columns: string[]
      process_config: Record<string, unknown>
      methodology: string
    }
    expect(dto.columns).toEqual(["Hazır", "Bitti"])
    expect(dto.methodology).toBe("KANBAN")
    // Stale col_* refs from the SOURCE project must not leak into the clone.
    expect(dto.process_config.task_workflow).toBeUndefined()
    expect(dto.process_config.status_workflow).toBeUndefined()
    expect(dto.process_config.schema_version).toBe(2)
  })
})
