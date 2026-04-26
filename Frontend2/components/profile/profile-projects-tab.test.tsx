// Phase 13 Plan 13-06 Task 1 — RTL coverage for ProfileProjectsTab full impl.
//
// Per Plan 13-06 <behavior> Tests 1-3:
//   1. Renders one ProjectCard per project from useUserSummary().data.projects
//   2. Empty state copy "Henüz proje yok." when projects is empty (D-F2)
//   3. DataState loading branch when isLoading=true
//
// Mocks:
//   - useApp (TR locale so the empty copy literal matches)
//   - useUserSummary (controlled per-test via mockReturnValueOnce)
//   - ProjectCard (data-testid stub so we count cards without booting Phase 10
//     interactive Card chrome — keeps the test scoped to THIS component's
//     contract: render-N-cards + empty + loading)

import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

vi.mock("@/components/projects/project-card", () => ({
  ProjectCard: ({ project }: { project: { id: number; name: string } }) => (
    <div data-testid="project-card" data-project-id={project.id}>
      {project.name}
    </div>
  ),
}))

const mockUseUserSummary = vi.fn()
vi.mock("@/hooks/use-user-summary", () => ({
  useUserSummary: (id: number | null | undefined) => mockUseUserSummary(id),
}))

import { ProfileProjectsTab } from "./profile-projects-tab"

describe("ProfileProjectsTab", () => {
  it("renders one ProjectCard per project (3-col grid)", () => {
    mockUseUserSummary.mockReturnValueOnce({
      data: {
        projects: [
          { id: 1, key: "ALPHA", name: "Alpha", status: "ACTIVE" },
          { id: 2, key: "BETA", name: "Beta", status: "ACTIVE" },
          { id: 3, key: "GAMMA", name: "Gamma", status: "COMPLETED" },
        ],
      },
      isLoading: false,
      error: null,
    })
    render(<ProfileProjectsTab userId={7} />)
    expect(screen.getAllByTestId("project-card")).toHaveLength(3)
  })

  it("renders empty state copy when no projects (D-F2)", () => {
    mockUseUserSummary.mockReturnValueOnce({
      data: { projects: [] },
      isLoading: false,
      error: null,
    })
    render(<ProfileProjectsTab userId={7} />)
    expect(screen.getByText("Henüz proje yok.")).toBeInTheDocument()
    expect(screen.queryByTestId("project-card")).not.toBeInTheDocument()
  })

  it("renders DataState loading fallback when isLoading=true", () => {
    mockUseUserSummary.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      error: null,
    })
    const { container } = render(<ProfileProjectsTab userId={7} />)
    // DataState default loading copy in TR is "Yükleniyor…"
    expect(container.textContent).toContain("Yükleniyor…")
    // Cards must NOT render while loading
    expect(screen.queryByTestId("project-card")).not.toBeInTheDocument()
  })
})
