import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, waitFor } from "@testing-library/react"

import { MTQuickAdd } from "./mt-quick-add"
import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { mockProjects } from "@/test/fixtures/projects"

// `useCreateTask` -> taskService.create. Mock at the service level so the
// hook's mutation observes a real promise resolution.
const create = vi.fn()
vi.mock("@/services/task-service", () => ({
  taskService: {
    create: (...args: unknown[]) => create(...args),
    getMyTasks: vi.fn().mockResolvedValue([]),
    getByProject: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(null),
    search: vi.fn().mockResolvedValue([]),
    patchField: vi.fn(),
  },
}))

// We need the create() mock to return a Task-shaped object. Build one fresh
// per test to avoid shared mutable state between cases.
function makeTask() {
  return {
    id: 999,
    key: "MOBIL-NEW",
    title: "Yeni iş",
    description: "",
    status: "todo",
    priority: "medium" as const,
    assigneeId: 1,
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
    createdAt: "2026-04-25T00:00:00Z",
  }
}

describe("MTQuickAdd", () => {
  beforeEach(() => {
    create.mockReset()
  })

  it("renders the title input + project select + Add button (TR)", () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <MTQuickAdd lang="tr" projects={mockProjects} />
    )
    expect(
      getByPlaceholderText("Hızlıca görev ekle…")
    ).toBeInTheDocument()
    expect(getByText("Ekle")).toBeInTheDocument()
  })

  it("submits with title + first project on enter", async () => {
    create.mockResolvedValue(makeTask())
    const onAdded = vi.fn()
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <MTQuickAdd
        lang="tr"
        projects={mockProjects}
        onAdded={onAdded}
      />
    )
    const input = getByPlaceholderText("Hızlıca görev ekle…") as HTMLInputElement
    fireEvent.change(input, { target: { value: "Yeni iş" } })
    fireEvent.click(getByText("Ekle"))
    await waitFor(() => expect(create).toHaveBeenCalled())
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: mockProjects[0].id,
        title: "Yeni iş",
        priority: "medium",
        due: null,
      })
    )
    await waitFor(() => expect(onAdded).toHaveBeenCalled())
    // Input should reset after submit.
    expect(input.value).toBe("")
  })

  it("disables submit while title is empty", () => {
    const { getByText } = renderWithProviders(
      <MTQuickAdd lang="tr" projects={mockProjects} />
    )
    const submit = getByText("Ekle").closest("button") as HTMLButtonElement
    expect(submit.disabled).toBe(true)
  })

  it("disables submit when projects array is empty", () => {
    const { getByText } = renderWithProviders(
      <MTQuickAdd lang="tr" projects={[]} />
    )
    const submit = getByText("Ekle").closest("button") as HTMLButtonElement
    expect(submit.disabled).toBe(true)
  })

  it("cycles priority on chip click", () => {
    const { getByText, getByRole } = renderWithProviders(
      <MTQuickAdd lang="tr" projects={mockProjects} />
    )
    // Initial: medium = "Orta"
    expect(getByText("Orta")).toBeInTheDocument()
    // Click priority chip — it cycles critical -> high -> medium -> low.
    // Buttons in the form: priority chip is the one with the "Öncelik:" aria-label prefix.
    const priorityBtn = getByRole("button", {
      name: /Öncelik: Orta/i,
    })
    fireEvent.click(priorityBtn)
    expect(getByText("Düşük")).toBeInTheDocument()
  })
})
