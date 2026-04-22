import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, renderHook } from "@testing-library/react"

import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { mockProjects } from "@/test/fixtures/projects"
import { ProjectDetailShell } from "./project-detail-shell"
import {
  ProjectDetailProvider,
  useProjectDetail,
} from "./project-detail-context"

// Stub the lazy-loaded settings tab so the suspense path resolves synchronously
// in unit tests — the real sub-tab content is verified by Task 2 tests.
vi.mock("./settings-tab", () => ({
  SettingsTab: () => <div>Settings stub</div>,
}))

describe("ProjectDetailShell", () => {
  it("renders all 8 tabs with Turkish labels by default", () => {
    const { getByText } = renderWithProviders(
      <ProjectDetailShell project={mockProjects[0]} isArchived={false} />
    )
    expect(getByText("Pano")).toBeInTheDocument()
    expect(getByText("Liste")).toBeInTheDocument()
    expect(getByText("Zaman Çizelgesi")).toBeInTheDocument()
    expect(getByText("Takvim")).toBeInTheDocument()
    expect(getByText("Aktivite")).toBeInTheDocument()
    expect(getByText("Yaşam Döngüsü")).toBeInTheDocument()
    expect(getByText("Üyeler")).toBeInTheDocument()
    expect(getByText("Ayarlar")).toBeInTheDocument()
  })

  it("defaults to the Pano (board) tab and shows the plan-05 placeholder", () => {
    const { getByText } = renderWithProviders(
      <ProjectDetailShell project={mockProjects[0]} isArchived={false} />
    )
    expect(getByText(/Pano sekmesi/)).toBeInTheDocument()
  })

  it("shows the Faz 13 stub on the Aktivite tab", () => {
    const { getByText } = renderWithProviders(
      <ProjectDetailShell project={mockProjects[0]} isArchived={false} />
    )
    fireEvent.click(getByText("Aktivite"))
    expect(getByText(/Faz 13'te aktive edilecek/)).toBeInTheDocument()
  })

  it("shows the Faz 12 stub on the Yaşam Döngüsü tab", () => {
    const { getByText } = renderWithProviders(
      <ProjectDetailShell project={mockProjects[0]} isArchived={false} />
    )
    fireEvent.click(getByText("Yaşam Döngüsü"))
    expect(getByText(/Faz 12'de aktive edilecek/)).toBeInTheDocument()
  })

  it("shows the project manager card on the Üyeler tab", () => {
    const { getByText } = renderWithProviders(
      <ProjectDetailShell project={mockProjects[0]} isArchived={false} />
    )
    fireEvent.click(getByText("Üyeler"))
    // mockProjects[0].managerName === "Ayşe"
    expect(getByText("Ayşe")).toBeInTheDocument()
    expect(getByText("Yönetici")).toBeInTheDocument()
  })
})

describe("useProjectDetail", () => {
  it("throws when used outside a ProjectDetailProvider", () => {
    // Silence the error boundary log from renderHook — the thrown error IS the
    // assertion target, React will still warn once.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useProjectDetail())).toThrow(
      /ProjectDetailProvider/
    )
    spy.mockRestore()
  })

  it("exposes searchQuery, densityMode, phaseFilter and their setters", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProjectDetailProvider projectId={42}>{children}</ProjectDetailProvider>
    )
    const { result } = renderHook(() => useProjectDetail(), { wrapper })
    expect(result.current.projectId).toBe(42)
    expect(result.current.searchQuery).toBe("")
    expect(typeof result.current.setSearchQuery).toBe("function")
    expect(result.current.densityMode === "compact" || result.current.densityMode === "rich").toBe(true)
    expect(typeof result.current.setDensityMode).toBe("function")
    expect(result.current.phaseFilter).toBeNull()
    expect(typeof result.current.setPhaseFilter).toBe("function")
  })
})
