// Wave 2 W2-C8 — Settings > Kolonlar subtab engine field expansion tests.
//
// Covers the new BoardColumn engine fields surfaced in the table:
//   - category dropdown (todo / in_progress / done)
//   - is_initial + is_terminal checkboxes
//   - max_duration_days number input (empty → null)
//   - entry_policy + exit_policy dropdowns
//   - multi-initial AlertBanner warning (mirrors W2-C6 senior review #4)
//
// Each test asserts either rendering presence OR that a change triggers a
// PATCH /api/v1/projects/{pid}/columns/{cid} with the expected partial
// body. The mock is keyed at @/lib/api-client so the entire HTTP layer is
// stubbed (same pattern as settings-tab.test.tsx).

import * as React from "react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { fireEvent, waitFor, act } from "@testing-library/react"

import { renderWithProviders } from "@/test/helpers/render-with-providers"
import { mockProjects } from "@/test/fixtures/projects"
import { SettingsColumnsSubtab } from "./settings-columns-subtab"

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

import { apiClient } from "@/lib/api-client"

const COLUMNS_FIXTURE = [
  {
    id: 1,
    project_id: 1,
    name: "Backlog",
    order_index: 0,
    wip_limit: 0,
    task_count: 3,
    category: "todo" as const,
    is_initial: true,
    is_terminal: false,
    max_duration_days: null,
    entry_policy: "any" as const,
    exit_policy: "any" as const,
  },
  {
    id: 2,
    project_id: 1,
    name: "In Progress",
    order_index: 1,
    wip_limit: 3,
    task_count: 2,
    category: "in_progress" as const,
    is_initial: false,
    is_terminal: false,
    max_duration_days: 7,
    entry_policy: "edges_only" as const,
    exit_policy: "edges_only" as const,
  },
  {
    id: 3,
    project_id: 1,
    name: "Done",
    order_index: 2,
    wip_limit: 0,
    task_count: 5,
    category: "done" as const,
    is_initial: false,
    is_terminal: true,
    max_duration_days: null,
    entry_policy: "any" as const,
    exit_policy: "terminal_lock" as const,
  },
]

function setupColumns(cols: typeof COLUMNS_FIXTURE) {
  ;(apiClient.get as any).mockResolvedValue({ data: cols })
  ;(apiClient.patch as any).mockResolvedValue({ data: {} })
}

describe("SettingsColumnsSubtab — Wave 2 engine fields (W2-C8)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the new engine-field column headers", async () => {
    setupColumns(COLUMNS_FIXTURE)
    const { findByText, getByText } = renderWithProviders(
      <SettingsColumnsSubtab project={mockProjects[0]} isArchived={false} />
    )
    // Wait for the query to resolve and the header row to mount.
    await findByText("KOLON ADI")
    // Engine field headers (Turkish, default language)
    expect(getByText("KATEGORİ")).toBeInTheDocument()
    expect(getByText("BAŞL.")).toBeInTheDocument()
    expect(getByText("TERM.")).toBeInTheDocument()
    expect(getByText("MAKS. GÜN")).toBeInTheDocument()
    expect(getByText("GİRİŞ")).toBeInTheDocument()
    expect(getByText("ÇIKIŞ")).toBeInTheDocument()
  })

  it("renders one category dropdown per column", async () => {
    setupColumns(COLUMNS_FIXTURE)
    const { container, findByText } = renderWithProviders(
      <SettingsColumnsSubtab project={mockProjects[0]} isArchived={false} />
    )
    await findByText("KOLON ADI")
    // 3 fixtures × 3 dropdowns each (category, entry_policy, exit_policy)
    // = 9 <select> elements.
    const selects = container.querySelectorAll("select")
    expect(selects.length).toBe(9)
  })

  it("PATCHes /columns/{id} with new category when dropdown changes", async () => {
    setupColumns(COLUMNS_FIXTURE)
    const { container, findByText } = renderWithProviders(
      <SettingsColumnsSubtab project={mockProjects[0]} isArchived={false} />
    )
    await findByText("KOLON ADI")
    const selects = container.querySelectorAll("select")
    // First column row's first select is the category dropdown.
    // Backlog currently "todo" → switch to "in_progress".
    await act(async () => {
      fireEvent.change(selects[0], { target: { value: "in_progress" } })
    })
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/projects/1/columns/1",
        { category: "in_progress" }
      )
    })
  })

  it("renders multi-initial warning AlertBanner when 2+ columns are is_initial=true", async () => {
    const multiInitial = [
      { ...COLUMNS_FIXTURE[0], is_initial: true },
      { ...COLUMNS_FIXTURE[1], is_initial: true },
      COLUMNS_FIXTURE[2],
    ]
    setupColumns(multiInitial)
    const { findByTestId, getByText } = renderWithProviders(
      <SettingsColumnsSubtab project={mockProjects[0]} isArchived={false} />
    )
    const banner = await findByTestId("multi-initial-warning")
    expect(banner).toBeTruthy()
    expect(banner.textContent).toContain("Backlog")
    expect(banner.textContent).toContain("In Progress")
    // Ensure the explanatory copy lands in the banner (helps catch silent
    // empty-render regressions).
    expect(
      getByText(/Birden fazla kolon başlangıç olarak işaretli/)
    ).toBeInTheDocument()
  })

  it("does NOT render multi-initial warning when only one is_initial=true", async () => {
    setupColumns(COLUMNS_FIXTURE) // only Backlog is_initial=true
    const { queryByTestId, findByText } = renderWithProviders(
      <SettingsColumnsSubtab project={mockProjects[0]} isArchived={false} />
    )
    await findByText("KOLON ADI")
    expect(queryByTestId("multi-initial-warning")).toBeNull()
  })

  it("PATCHes max_duration_days as null when the number input is cleared", async () => {
    setupColumns(COLUMNS_FIXTURE)
    const { container, findByText } = renderWithProviders(
      <SettingsColumnsSubtab project={mockProjects[0]} isArchived={false} />
    )
    await findByText("KOLON ADI")
    // Find the max_duration_days input for column id=2 (currently 7).
    // Row 2 inputs: name (text), wip_limit (number), max_duration_days (number)
    const inputs = container.querySelectorAll('input[type="number"]')
    // Per row: wip_limit + max_duration_days = 2 number inputs.
    // Row index 0=Backlog wip, 1=Backlog maxDur, 2=In Progress wip, 3=In Progress maxDur, ...
    const inProgressMaxDur = inputs[3] as HTMLInputElement
    expect(inProgressMaxDur.value).toBe("7")
    await act(async () => {
      fireEvent.change(inProgressMaxDur, { target: { value: "" } })
      fireEvent.blur(inProgressMaxDur)
    })
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/projects/1/columns/2",
        { max_duration_days: null }
      )
    })
  })

  it("does NOT auto-uncheck other initial columns when a new one is checked", async () => {
    setupColumns(COLUMNS_FIXTURE)
    const { container, findByText } = renderWithProviders(
      <SettingsColumnsSubtab project={mockProjects[0]} isArchived={false} />
    )
    await findByText("KOLON ADI")
    const checkboxes = container.querySelectorAll('input[type="checkbox"]')
    // Per row: is_initial + is_terminal = 2 checkboxes.
    // Row idx: 0=col1 init, 1=col1 term, 2=col2 init, 3=col2 term, 4=col3 init, 5=col3 term
    const col2Init = checkboxes[2] as HTMLInputElement
    expect(col2Init.checked).toBe(false)
    await act(async () => {
      fireEvent.click(col2Init)
    })
    // The PATCH must target col 2 only — column 1 (Backlog, currently initial)
    // must NOT be patched. This proves no auto-uncheck behavior.
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/projects/1/columns/2",
        { is_initial: true }
      )
    })
    const patchCalls = (apiClient.patch as any).mock.calls
    const col1Patches = patchCalls.filter(
      (call: any[]) => call[0] === "/projects/1/columns/1"
    )
    expect(col1Patches.length).toBe(0)
  })

  it("PATCHes entry_policy when the entry policy dropdown changes", async () => {
    setupColumns(COLUMNS_FIXTURE)
    const { container, findByText } = renderWithProviders(
      <SettingsColumnsSubtab project={mockProjects[0]} isArchived={false} />
    )
    await findByText("KOLON ADI")
    const selects = container.querySelectorAll("select")
    // Per row: category, entry_policy, exit_policy = 3 selects.
    // Row 0 (col 1 Backlog): selects 0,1,2. Switch entry_policy (idx 1) to "edges_only".
    await act(async () => {
      fireEvent.change(selects[1], { target: { value: "edges_only" } })
    })
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/projects/1/columns/1",
        { entry_policy: "edges_only" }
      )
    })
  })
})
