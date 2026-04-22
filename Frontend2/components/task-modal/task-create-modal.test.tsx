import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { fireEvent, waitFor, act } from "@testing-library/react"
import { useTaskModal, type TaskModalDefaults } from "@/context/task-modal-context"
import { TaskModalProvider as ModalDomProvider } from "./task-modal-provider"

// ---- Service mocks (kept side-effect-free; React Query calls them) -----------
vi.mock("@/services/project-service", () => {
  const scrum = {
    id: 1,
    key: "MOB",
    name: "Mobile",
    description: null,
    startDate: "2026-01-01",
    endDate: null,
    status: "ACTIVE",
    methodology: "SCRUM",
    processTemplateId: 1,
    managerId: 1,
    managerName: "Ada",
    managerAvatar: null,
    progress: 0,
    columns: ["todo", "progress", "review", "done"],
    processConfig: {
      schema_version: 1,
      workflow: {
        mode: "flexible",
        nodes: [{ id: "n1", name: "Analiz" }, { id: "n2", name: "Tasarım" }],
        edges: [],
        groups: [],
      },
      enable_phase_assignment: true,
      backlog_definition: "cycle_null",
      cycle_label: null,
    },
    createdAt: "2026-01-01T00:00:00Z",
  }
  const kanban = { ...scrum, id: 2, key: "WEB", name: "Web", methodology: "KANBAN",
    processConfig: { ...scrum.processConfig, enable_phase_assignment: false } }
  return {
    projectService: {
      getAll: vi.fn().mockResolvedValue([scrum, kanban]),
      getById: vi.fn().mockImplementation(async (id: number) => id === 1 ? scrum : kanban),
      create: vi.fn(),
      updateStatus: vi.fn(),
      getActivity: vi.fn(),
      getProcessTemplates: vi.fn(),
      getTaskStats: vi.fn(),
    },
  }
})

vi.mock("@/services/task-service", () => {
  const { taskService: _s } = { taskService: null }
  void _s
  return {
    taskService: {
      getByProject: vi.fn().mockResolvedValue([]),
      getMyTasks: vi.fn(),
      search: vi.fn(),
      getById: vi.fn(),
      getHistory: vi.fn(),
      create: vi.fn().mockResolvedValue({
        id: 999, key: "MOB-99", title: "New", description: "", status: "todo",
        priority: "medium", assigneeId: null, reporterId: 1, parentTaskId: null,
        projectId: 1, cycleId: null, phaseId: null, points: null, start: null,
        due: null, labels: [], watcherCount: 0, type: "task", createdAt: "2026-04-22",
      }),
      patchField: vi.fn(),
      update: vi.fn(),
      addWatcher: vi.fn(),
      removeWatcher: vi.fn(),
      listDependencies: vi.fn(),
      addDependency: vi.fn(),
      removeDependency: vi.fn(),
    },
  }
})

vi.mock("@/services/label-service", () => ({
  labelService: {
    getByProject: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  },
}))

// ---- Test helpers ------------------------------------------------------------
function TriggerOpen({ defaults }: { defaults?: TaskModalDefaults }) {
  const { openTaskModal } = useTaskModal()
  // open once after mount
  React.useEffect(() => { openTaskModal(defaults) }, [])  // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("TaskCreateModal", () => {
  it("renders and disables submit until title + project are set", async () => {
    const { findByText, getByRole } = renderWithProviders(
      <ModalDomProvider>
        <TriggerOpen />
      </ModalDomProvider>
    )
    // Modal title visible
    await findByText(/Görev Oluştur|Create Task/)
    // Oluştur / Create submit button present and disabled
    const submit = getByRole("button", { name: /^(Oluştur|Create)$/ }) as HTMLButtonElement
    expect(submit.disabled).toBe(true)
  })

  it("closes on Escape", async () => {
    const { findByText, queryByText } = renderWithProviders(
      <ModalDomProvider>
        <TriggerOpen />
      </ModalDomProvider>
    )
    await findByText(/Görev Oluştur|Create Task/)
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" })
    })
    await waitFor(() => {
      expect(queryByText(/Görev Oluştur|Create Task/)).toBeNull()
    })
  })

  it("enables submit once title and project are filled", async () => {
    const { findByText, getByRole, getAllByRole, findByPlaceholderText } = renderWithProviders(
      <ModalDomProvider>
        <TriggerOpen />
      </ModalDomProvider>
    )
    await findByText(/Görev Oluştur|Create Task/)

    // Wait for the project list to actually populate (async useProjects resolves)
    await waitFor(() => {
      const opts = document.querySelectorAll('select[aria-label="Proje"] option')
      expect(opts.length).toBeGreaterThan(1)
    })

    // The first combobox is the Project select
    const selects = getAllByRole("combobox") as HTMLSelectElement[]
    const projectSelect = selects[0]
    await act(async () => {
      fireEvent.change(projectSelect, { target: { value: "1" } })
    })
    expect(projectSelect.value).toBe("1")

    // Title input identified by placeholder
    const titleInput = (await findByPlaceholderText(/Kısa, net başlık|Short, clear title/)) as HTMLInputElement
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: "Hello task" } })
    })
    expect(titleInput.value).toBe("Hello task")

    await waitFor(() => {
      const submit = getByRole("button", { name: /^(Oluştur|Create)$/ }) as HTMLButtonElement
      expect(submit.disabled).toBe(false)
    })
  })

  it("hides cycle field entirely when selected project is KANBAN", async () => {
    const { findByText, queryByText, getAllByRole } = renderWithProviders(
      <ModalDomProvider>
        <TriggerOpen />
      </ModalDomProvider>
    )
    await findByText(/Görev Oluştur|Create Task/)

    // Select the KANBAN project (id=2)
    const selects = getAllByRole("combobox") as HTMLSelectElement[]
    const projectSelect = selects[0]
    await act(async () => {
      fireEvent.change(projectSelect, { target: { value: "2" } })
    })

    // Cycle labels (Sprint / Faz / İterasyon) must not be present
    await waitFor(() => {
      expect(queryByText(/^Sprint$/)).toBeNull()
      expect(queryByText(/^Faz$/)).toBeNull()
      expect(queryByText(/^İterasyon$/)).toBeNull()
    })
  })

  it("reveals Parent Task select when task type switches to subtask", async () => {
    const { findByText, queryByText, getAllByRole } = renderWithProviders(
      <ModalDomProvider>
        <TriggerOpen defaults={{ defaultProjectId: 1 }} />
      </ModalDomProvider>
    )
    await findByText(/Görev Oluştur|Create Task/)

    // Initially no Parent Task label
    expect(queryByText(/Ana Görev|Parent Task/)).toBeNull()

    // Click the "Alt Görev" / "Subtask" segmented option
    const subtaskBtn = Array.from(document.querySelectorAll("button"))
      .find(b => /Alt Görev|Subtask/i.test(b.textContent ?? "")) as HTMLButtonElement | undefined
    expect(subtaskBtn).toBeTruthy()
    await act(async () => {
      subtaskBtn!.click()
    })

    // Parent Task label now visible
    await waitFor(() => {
      expect(queryByText(/Ana Görev|Parent Task/)).not.toBeNull()
    })
  })
})
