import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, waitFor } from "@testing-library/react"

import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { mockProjects } from "@/test/fixtures/projects"
import { SettingsTab } from "./settings-tab"

// Stub the underlying HTTP client: the Genel sub-tab PATCHes via
// projectService which wraps apiClient.patch. Mocking the client at one
// level keeps the test stable.
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

describe("SettingsTab", () => {
  it("renders 3 sub-tab buttons (Kolonlar removed 2026-05-18 — column management lives in workflow editor status mode)", () => {
    const { getByText, queryByText } = renderWithProviders(
      <SettingsTab project={mockProjects[0]} isArchived={false} />
    )
    expect(getByText("Genel")).toBeInTheDocument()
    expect(getByText("İş Akışı")).toBeInTheDocument()
    expect(getByText("Yaşam Döngüsü")).toBeInTheDocument()
    // Kolonlar sub-tab intentionally absent — duplicated workflow editor's
    // status mode and split column CRUD across two surfaces.
    expect(queryByText("Kolonlar")).toBeNull()
  })

  it("defaults to the Genel sub-tab and shows Proje Adı / Backlog Tanımı fields", () => {
    const { getByText } = renderWithProviders(
      <SettingsTab project={mockProjects[0]} isArchived={false} />
    )
    expect(getByText("Proje Adı")).toBeInTheDocument()
    expect(getByText("Backlog Tanımı")).toBeInTheDocument()
    expect(getByText("Döngü Etiketi")).toBeInTheDocument()
  })

  it("switches to İş Akışı and shows both editor link buttons (lifecycle + status)", () => {
    const { getByText } = renderWithProviders(
      <SettingsTab project={mockProjects[0]} isArchived={false} />
    )
    fireEvent.click(getByText("İş Akışı"))
    expect(getByText("Yaşam Döngüsü Editörü")).toBeInTheDocument()
    expect(getByText("Görev Durumları (Kolonlar)")).toBeInTheDocument()
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
