import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, waitFor } from "@testing-library/react"

import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { mockProjects } from "@/test/fixtures/projects"
import { SettingsTab } from "./settings-tab"

// Stub the underlying HTTP client: the Genel sub-tab PATCHes via
// projectService which wraps apiClient.patch, and the Kolonlar sub-tab
// fetches /projects/{id}/columns via apiClient.get directly. Mocking the
// client at one level keeps the test stable.
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

describe("SettingsTab", () => {
  it("renders 4 sub-tab buttons", () => {
    const { getByText } = renderWithProviders(
      <SettingsTab project={mockProjects[0]} isArchived={false} />
    )
    expect(getByText("Genel")).toBeInTheDocument()
    expect(getByText("Kolonlar")).toBeInTheDocument()
    expect(getByText("İş Akışı")).toBeInTheDocument()
    expect(getByText("Yaşam Döngüsü")).toBeInTheDocument()
  })

  it("defaults to the Genel sub-tab and shows Proje Adı / Backlog Tanımı fields", () => {
    const { getByText } = renderWithProviders(
      <SettingsTab project={mockProjects[0]} isArchived={false} />
    )
    expect(getByText("Proje Adı")).toBeInTheDocument()
    expect(getByText("Backlog Tanımı")).toBeInTheDocument()
    expect(getByText("Döngü Etiketi")).toBeInTheDocument()
  })

  it("switches to Kolonlar and renders the column header row", async () => {
    const { getByText } = renderWithProviders(
      <SettingsTab project={mockProjects[0]} isArchived={false} />
    )
    fireEvent.click(getByText("Kolonlar"))
    // Kolonlar header appears once the loading state resolves.
    await waitFor(() => {
      expect(getByText("KOLON ADI")).toBeInTheDocument()
    })
    // mockProjects[0] is SCRUM — WIP column visible.
    expect(getByText("WIP LİMİTİ")).toBeInTheDocument()
  })

  it("hides the WIP limit column for Waterfall projects", async () => {
    const waterfallProject = {
      ...mockProjects[0],
      methodology: "WATERFALL",
    }
    const { getByText, queryByText } = renderWithProviders(
      <SettingsTab project={waterfallProject} isArchived={false} />
    )
    fireEvent.click(getByText("Kolonlar"))
    await waitFor(() => {
      expect(getByText("KOLON ADI")).toBeInTheDocument()
    })
    expect(queryByText("WIP LİMİTİ")).toBeNull()
    expect(
      getByText(/Waterfall metodolojisinde WIP limitleri gizlidir/)
    ).toBeInTheDocument()
  })

  it("switches to İş Akışı and shows the editor link button", () => {
    const { getByText } = renderWithProviders(
      <SettingsTab project={mockProjects[0]} isArchived={false} />
    )
    fireEvent.click(getByText("İş Akışı"))
    expect(getByText("Workflow Editörünü Aç")).toBeInTheDocument()
  })

  it("renders the CriteriaEditorPanel on the Yaşam Döngüsü sub-tab (replaces the Faz 12 stub)", async () => {
    const { getByText, queryByText } = renderWithProviders(
      <SettingsTab project={mockProjects[0]} isArchived={false} />
    )
    fireEvent.click(getByText("Yaşam Döngüsü"))
    // Stub copy must be gone (Plan 12-03 acceptance)
    expect(queryByText(/Faz 12'de aktive edilecek/)).toBeNull()
    // CriteriaEditorPanel headers must appear
    await waitFor(() => {
      expect(getByText("Görev–Faz Ataması")).toBeInTheDocument()
    })
    expect(getByText("Faz Seç")).toBeInTheDocument()
  })

  it("preselects the methodology default backlog definition when none is stored", () => {
    const projectNoBacklog = {
      ...mockProjects[0],
      processConfig: { schema_version: 1 },
    }
    // SCRUM → cycle_null → "Döngüye atanmamış"
    const { getByText } = renderWithProviders(
      <SettingsTab project={projectNoBacklog} isArchived={false} />
    )
    // The SegmentedControl renders labels as button text; "Döngüye atanmamış"
    // is the SCRUM default.
    expect(getByText("Döngüye atanmamış")).toBeInTheDocument()
  })
})
