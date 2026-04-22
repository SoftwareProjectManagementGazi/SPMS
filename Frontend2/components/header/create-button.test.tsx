import * as React from "react"
import { describe, it, expect } from "vitest"
import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { fireEvent, act, waitFor } from "@testing-library/react"
import { useTaskModal } from "@/context/task-modal-context"
import { CreateButton } from "./create-button"
import { TaskModalProvider } from "@/components/task-modal/task-modal-provider"

// Service mocks — create button triggers useTaskModal which in turn mounts the modal
// (modal calls useProjects/useTasks/useProjectLabels). Keep them side-effect-free.
import { vi } from "vitest"

vi.mock("@/services/project-service", () => ({
  projectService: {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    getActivity: vi.fn(),
    getProcessTemplates: vi.fn(),
    getTaskStats: vi.fn(),
  },
}))
vi.mock("@/services/task-service", () => ({
  taskService: {
    getByProject: vi.fn().mockResolvedValue([]),
    getMyTasks: vi.fn(),
    search: vi.fn(),
    getById: vi.fn(),
    getHistory: vi.fn(),
    create: vi.fn(),
    patchField: vi.fn(),
    update: vi.fn(),
    addWatcher: vi.fn(),
    removeWatcher: vi.fn(),
    listDependencies: vi.fn(),
    addDependency: vi.fn(),
    removeDependency: vi.fn(),
  },
}))
vi.mock("@/services/label-service", () => ({
  labelService: { getByProject: vi.fn().mockResolvedValue([]), create: vi.fn() },
}))

function Probe() {
  const { isOpen } = useTaskModal()
  return <div data-testid="is-open">{isOpen ? "yes" : "no"}</div>
}

describe("CreateButton", () => {
  it("renders with Turkish label 'Oluştur' (default language)", () => {
    const { getByRole } = renderWithProviders(
      <TaskModalProvider>
        <CreateButton />
      </TaskModalProvider>
    )
    const btn = getByRole("button", { name: /Oluştur|Create/ }) as HTMLButtonElement
    expect(btn).toBeTruthy()
    // Should not contain "Yeni proje" / "New project" anymore
    expect(btn.textContent).not.toMatch(/Yeni proje|New project/)
  })

  it("opens the Task Create Modal when clicked", async () => {
    const { getByRole, getByTestId, findByText } = renderWithProviders(
      <TaskModalProvider>
        <Probe />
        <CreateButton />
      </TaskModalProvider>
    )
    expect(getByTestId("is-open").textContent).toBe("no")
    const btn = getByRole("button", { name: /Oluştur|Create/ })
    await act(async () => {
      fireEvent.click(btn)
    })
    await waitFor(() => {
      expect(getByTestId("is-open").textContent).toBe("yes")
    })
    // Modal DOM mounts once opened
    await findByText(/Görev Oluştur|Create Task/)
  })
})
