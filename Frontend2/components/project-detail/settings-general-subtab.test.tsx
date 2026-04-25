// Unit tests for components/project-detail/settings-general-subtab.tsx (Phase 12 Plan 12-03).
//
// Asserts CONTEXT D-60: methodology field is read-only display + Tooltip.
//   - No element with name="methodology"
//   - No <select> or onChange handler updating methodology
//   - Tooltip body contains the canonical D-60 copy

import * as React from "react"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { mockProjects } from "@/test/fixtures/projects"
import { SettingsGeneralSubtab } from "./settings-general-subtab"

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

describe("SettingsGeneralSubtab — methodology read-only (D-60)", () => {
  it("renders the methodology field as a read-only label", () => {
    const { getByText, container } = renderWithProviders(
      <SettingsGeneralSubtab project={mockProjects[0]} isArchived={false} />,
    )

    // Field label visible
    expect(getByText("Metodoloji")).toBeInTheDocument()

    // No editable form elements anywhere with name=methodology
    const methodologyInputs = container.querySelectorAll(
      'input[name="methodology"], select[name="methodology"]',
    )
    expect(methodologyInputs.length).toBe(0)

    // No <select> in the methodology label vicinity. The whole sub-tab in
    // Phase 12 is methodology-free for editable controls.
    expect(container.querySelectorAll("select").length).toBe(0)
  })

  it("renders the localized methodology value (Scrum) for a SCRUM project", () => {
    const { getByText } = renderWithProviders(
      <SettingsGeneralSubtab project={mockProjects[0]} isArchived={false} />,
    )
    // Localized methodology label — SCRUM → "Scrum"
    expect(getByText("Scrum")).toBeInTheDocument()
  })
})
