import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, waitFor } from "@testing-library/react"

import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { mockTasks, type MockTask } from "@/test/fixtures/tasks"
import { mockProjects } from "@/test/fixtures/projects"
import type { Task } from "@/services/task-service"
import type { Project } from "@/services/project-service"

import { ListTab } from "./list-tab"
import { ProjectDetailProvider } from "./project-detail-context"

// Mock next/navigation router for row-click navigation assertion.
const pushSpy = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
}))

// Mock apiClient to return fixture tasks so useTasks resolves synchronously
// enough to be awaitable with waitFor.
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.startsWith("/tasks/project/")) {
        // Return snake_case TaskResponseDTO shape (task-service mapTask expects it)
        return Promise.resolve({
          data: mockTasks.filter((t) => t.project_id === 1).map((t) => ({
            id: t.id,
            key: t.key,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            assignee_id: t.assignee_id,
            reporter_id: t.reporter_id,
            parent_task_id: t.parent_task_id,
            project_id: t.project_id,
            cycle_id: t.cycle_id,
            phase_id: t.phase_id,
            points: t.points,
            start: t.start,
            due: t.due,
            labels: t.labels,
            watcher_count: t.watcher_count,
            type: t.type,
            created_at: "2026-01-01T00:00:00Z",
          })),
        })
      }
      return Promise.resolve({ data: [] })
    }),
  },
}))

function wrap(projectId: number, ui: React.ReactElement) {
  return <ProjectDetailProvider projectId={projectId}>{ui}</ProjectDetailProvider>
}

// Project with enable_phase_assignment=false (for column gating test)
const PROJECT_NO_PHASE: Project = {
  ...mockProjects[1], // Kanban, enable_phase_assignment=false
  id: 1, // override to match mockTasks which all have project_id=1
}

describe("ListTab", () => {
  beforeEach(() => {
    pushSpy.mockClear()
  })

  it("renders header row with 7 Turkish columns when enable_phase_assignment=false", async () => {
    const { getByText, queryByText } = renderWithProviders(
      wrap(1, <ListTab project={PROJECT_NO_PHASE} />)
    )
    await waitFor(() => getByText("ANAHTAR"))
    expect(getByText("ANAHTAR")).toBeInTheDocument()
    expect(getByText("BAŞLIK")).toBeInTheDocument()
    expect(getByText("DURUM")).toBeInTheDocument()
    expect(getByText("ÖNCELİK")).toBeInTheDocument()
    expect(getByText("ATANAN")).toBeInTheDocument()
    expect(getByText("BİTİŞ")).toBeInTheDocument()
    expect(getByText("SP")).toBeInTheDocument()
    // Phase column should be absent when flag is false
    expect(queryByText("FAZ")).toBeNull()
  })

  it("shows Phase column when project.processConfig.enable_phase_assignment === true", async () => {
    // mockProjects[0] has enable_phase_assignment=true
    const { getByText } = renderWithProviders(
      wrap(1, <ListTab project={mockProjects[0]} />)
    )
    await waitFor(() => getByText("FAZ"))
    expect(getByText("FAZ")).toBeInTheDocument()
  })

  it("clicking a row navigates to /projects/{id}/tasks/{taskId}", async () => {
    const { getByText } = renderWithProviders(
      wrap(1, <ListTab project={PROJECT_NO_PHASE} />)
    )
    // Wait for data to load
    await waitFor(() => getByText("Auth akışı"))
    // Click a cell in the MOBIL-1 row
    fireEvent.click(getByText("MOBIL-1"))
    expect(pushSpy).toHaveBeenCalledWith("/projects/1/tasks/101")
  })

  it("applies default sort Priority desc → critical-priority (MOBIL-3) shows before high (MOBIL-1)", async () => {
    const { container, getByText } = renderWithProviders(
      wrap(1, <ListTab project={PROJECT_NO_PHASE} />)
    )
    // Wait for the bug task (critical priority) to render
    await waitFor(() => getByText("Hata: token expires"))
    // Find all cells with data-task-id attribute; cells of the same row share
    // the same data-task-id so we de-duplicate preserving first-seen order.
    const cells = Array.from(
      container.querySelectorAll<HTMLElement>("[data-task-id]")
    )
    const order = cells.map((c) => Number(c.dataset.taskId))
    const uniqueOrder: number[] = []
    for (const id of order) {
      if (!uniqueOrder.includes(id)) uniqueOrder.push(id)
    }
    // Default sort: critical (103) before high (101).
    expect(uniqueOrder[0]).toBe(103)
    expect(uniqueOrder[1]).toBe(101)
  })

  it("renders a Bug icon for type='bug' tasks in the Title cell", async () => {
    const { container, getByText } = renderWithProviders(
      wrap(1, <ListTab project={PROJECT_NO_PHASE} />)
    )
    // Wait for task data (MOBIL-3 is the bug task in mockTasks[2])
    await waitFor(() => getByText("Hata: token expires"))
    // lucide Bug renders a <svg class="lucide-bug ...">
    const bugIcon = container.querySelector("svg.lucide-bug")
    expect(bugIcon).not.toBeNull()
  })
})
