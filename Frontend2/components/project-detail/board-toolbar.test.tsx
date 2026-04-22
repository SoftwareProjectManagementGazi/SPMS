import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { fireEvent } from "@testing-library/react"

import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { mockProjects } from "@/test/fixtures/projects"
import { BoardToolbar } from "./board-toolbar"
import { ProjectDetailProvider } from "./project-detail-context"

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}))

function wrap(projectId: number, ui: React.ReactElement) {
  return (
    <ProjectDetailProvider projectId={projectId}>{ui}</ProjectDetailProvider>
  )
}

describe("BoardToolbar", () => {
  it("renders search input + density SegmentedControl", () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      wrap(mockProjects[0].id, <BoardToolbar project={mockProjects[0]} />)
    )
    expect(getByPlaceholderText("Filtrele…")).toBeInTheDocument()
    expect(getByText("Sıkı")).toBeInTheDocument()
    expect(getByText("Detaylı")).toBeInTheDocument()
  })

  it("shows the Phase filter button when enable_phase_assignment=true", () => {
    const { getByText } = renderWithProviders(
      wrap(mockProjects[0].id, <BoardToolbar project={mockProjects[0]} />)
    )
    // mockProjects[0] has enable_phase_assignment=true
    expect(getByText("Faz")).toBeInTheDocument()
  })

  it("HIDES the Phase filter button when enable_phase_assignment=false", () => {
    // mockProjects[1] is Kanban with enable_phase_assignment=false
    const { queryByText } = renderWithProviders(
      wrap(mockProjects[1].id, <BoardToolbar project={mockProjects[1]} />)
    )
    expect(queryByText("Faz")).toBeNull()
  })

  it("typing in the search input updates ProjectDetailContext.searchQuery", () => {
    const { getByPlaceholderText } = renderWithProviders(
      wrap(mockProjects[0].id, <BoardToolbar project={mockProjects[0]} />)
    )
    const input = getByPlaceholderText("Filtrele…") as HTMLInputElement
    fireEvent.change(input, { target: { value: "bug" } })
    expect(input.value).toBe("bug")
  })
})
