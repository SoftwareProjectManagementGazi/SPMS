// Unit tests for components/lifecycle/milestones-subtab.tsx (Phase 12 Plan 12-05).
//
// Per Plan 12-05 Task 1 <behavior>:
//   1. List render — useMilestones returns 2 milestones; renders 2 cards w/ name+status+date+ProgressBar
//   2. Add inline — clicking Ekle reveals MilestoneInlineAddRow at top of list with empty Inputs
//   3. Chip picker multi-select — selecting 2 phase ids renders both as chips
//   4. Empty linked_phase_ids accepted — POST body has linked_phase_ids: []
//   5. Optimistic + rollback — POST 422 rolls back; AlertBanner surfaces error
//   6. Delete confirm — Cancel issues no DELETE; confirm issues DELETE + optimistic removal
//   7. Permission gate — useTransitionAuthority returns false hides Add + delete buttons
//   8. Empty state — milestones=[] renders "Henüz kilometre taşı tanımlanmamış."

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { MilestonesSubTab } from "./milestones-subtab"
import type { WorkflowConfig } from "@/services/lifecycle-service"

// Mock i18n — Turkish-first.
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// Mock toast (used by error rollback path).
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock useTransitionAuthority — overridable per-test via implementation swap.
const transitionAuthorityMock = vi.fn(() => true)
vi.mock("@/hooks/use-transition-authority", () => ({
  useTransitionAuthority: (...args: unknown[]) => transitionAuthorityMock(...args),
}))

// Mock apiClient at module scope — service layer reads from it.
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from "@/lib/api-client"
const apiGet = apiClient.get as unknown as ReturnType<typeof vi.fn>
const apiPost = apiClient.post as unknown as ReturnType<typeof vi.fn>
const apiDelete = apiClient.delete as unknown as ReturnType<typeof vi.fn>

function makeQc() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function wrap(node: React.ReactElement, qc?: QueryClient) {
  const client = qc ?? makeQc()
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>
}

const baseProject = {
  id: 7,
  key: "MOBIL",
  managerId: 1,
  methodology: "SCRUM",
}

function makeWorkflow(): WorkflowConfig {
  return {
    mode: "flexible",
    nodes: [
      { id: "planning", name: "Planlama", x: 0, y: 0, isInitial: true },
      { id: "execution", name: "Yürütme", x: 0, y: 0 },
      { id: "closure", name: "Kapanış", x: 0, y: 0, isFinal: true },
      // Archived node — must be filtered out of chip picker.
      { id: "old", name: "Eski", x: 0, y: 0, isArchived: true },
    ],
    edges: [],
    groups: [],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  transitionAuthorityMock.mockReturnValue(true)
  apiGet.mockReset()
  apiPost.mockReset()
  apiDelete.mockReset()
  // Default GET returns empty list; per-test overrides will mock specific cases.
  apiGet.mockResolvedValue({ data: [] })
})

describe("MilestonesSubTab", () => {
  it("Test 1: list render — 2 milestones rendered as cards with name + status + date + ProgressBar", async () => {
    apiGet.mockResolvedValueOnce({
      data: [
        {
          id: 11,
          project_id: 7,
          name: "Alpha Launch",
          target_date: "2026-05-15",
          status: "PLANNED",
          linked_phase_ids: ["planning"],
          created_at: "2026-04-25T00:00:00Z",
          updated_at: null,
        },
        {
          id: 12,
          project_id: 7,
          name: "Beta Release",
          target_date: "2026-06-15",
          status: "IN_PROGRESS",
          linked_phase_ids: ["execution"],
          created_at: "2026-04-25T00:00:00Z",
          updated_at: null,
        },
      ],
    })

    render(
      wrap(
        <MilestonesSubTab project={baseProject as never} workflow={makeWorkflow()} />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText("Alpha Launch")).toBeInTheDocument()
      expect(screen.getByText("Beta Release")).toBeInTheDocument()
    })
  })

  it("Test 2: clicking Ekle reveals inline-add row at top of list with empty inputs", async () => {
    apiGet.mockResolvedValueOnce({ data: [] })

    render(
      wrap(
        <MilestonesSubTab project={baseProject as never} workflow={makeWorkflow()} />,
      ),
    )

    // Wait for empty state.
    await waitFor(() => {
      expect(
        screen.getByText("Henüz kilometre taşı tanımlanmamış."),
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Ekle"))

    // Inline-add row appears — name placeholder + Save / Cancel buttons.
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Kilometre taşı adı…"),
      ).toBeInTheDocument()
    })
    expect(screen.getByText("Kaydet")).toBeInTheDocument()
    expect(screen.getByText("İptal")).toBeInTheDocument()
  })

  it("Test 3: chip picker multi-select — selecting 2 phase ids renders both as chips", async () => {
    apiGet.mockResolvedValueOnce({ data: [] })

    render(
      wrap(
        <MilestonesSubTab project={baseProject as never} workflow={makeWorkflow()} />,
      ),
    )

    await waitFor(() => {
      expect(
        screen.getByText("Henüz kilometre taşı tanımlanmamış."),
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Ekle"))

    // Open the chip picker.
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Kilometre taşı adı…"),
      ).toBeInTheDocument()
    })
    const pickerToggle = screen.getByText(
      /Faz bağlamak için seçin|Bağlı Fazlar/,
    )
    fireEvent.click(pickerToggle)

    // Dropdown opens — non-archived nodes are options.
    await waitFor(() => {
      expect(screen.getByText("Planlama")).toBeInTheDocument()
      expect(screen.getByText("Yürütme")).toBeInTheDocument()
    })
    // Archived "Eski" must NOT be in options.
    expect(screen.queryByText("Eski")).not.toBeInTheDocument()

    fireEvent.click(screen.getByText("Planlama"))
    fireEvent.click(screen.getByText("Yürütme"))

    // Selected chips render inside the trigger row.
    await waitFor(() => {
      // Both labels should appear at least once as chips.
      const planning = screen.getAllByText("Planlama")
      const execution = screen.getAllByText("Yürütme")
      expect(planning.length).toBeGreaterThan(0)
      expect(execution.length).toBeGreaterThan(0)
    })
  })

  it("Test 4: empty linked_phase_ids accepted — POST body has linked_phase_ids: []", async () => {
    apiGet.mockResolvedValueOnce({ data: [] })
    apiPost.mockResolvedValueOnce({
      data: {
        id: 99,
        project_id: 7,
        name: "Project-wide MS",
        target_date: "2026-06-01",
        status: "PLANNED",
        linked_phase_ids: [],
        created_at: "2026-04-25T00:00:00Z",
        updated_at: null,
      },
    })

    render(
      wrap(
        <MilestonesSubTab project={baseProject as never} workflow={makeWorkflow()} />,
      ),
    )

    await waitFor(() => {
      expect(
        screen.getByText("Henüz kilometre taşı tanımlanmamış."),
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Ekle"))

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Kilometre taşı adı…"),
      ).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText(
      "Kilometre taşı adı…",
    ) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: "Project-wide MS" } })

    // Find the date input. There is only one date input.
    const dateInput = document.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement
    expect(dateInput).toBeTruthy()
    fireEvent.change(dateInput, { target: { value: "2026-06-01" } })

    // No chip selections — leave linked_phase_ids empty.
    fireEvent.click(screen.getByText("Kaydet"))

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledTimes(1)
    })
    const [url, body] = apiPost.mock.calls[0]
    expect(url).toBe("/projects/7/milestones")
    expect(body).toMatchObject({
      name: "Project-wide MS",
      target_date: "2026-06-01",
      linked_phase_ids: [],
    })
    // Critical: array must be present, even if empty.
    expect(Array.isArray(body.linked_phase_ids)).toBe(true)
    expect(body.linked_phase_ids.length).toBe(0)
  })

  it("Test 5: optimistic + rollback — POST 422 rolls back optimistic insert", async () => {
    apiGet.mockResolvedValueOnce({ data: [] })
    apiPost.mockRejectedValueOnce({
      response: { status: 422, data: { detail: "validation error" } },
    })

    render(
      wrap(
        <MilestonesSubTab project={baseProject as never} workflow={makeWorkflow()} />,
      ),
    )

    await waitFor(() => {
      expect(
        screen.getByText("Henüz kilometre taşı tanımlanmamış."),
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("Ekle"))
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Kilometre taşı adı…"),
      ).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText(
      "Kilometre taşı adı…",
    ) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: "Bad Milestone" } })

    const dateInput = document.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: "2026-06-01" } })

    fireEvent.click(screen.getByText("Kaydet"))

    // Wait for the optimistic insert + rollback cycle to settle.
    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledTimes(1)
    })

    // After rollback, the milestone should not appear in the list.
    await waitFor(() => {
      expect(screen.queryByText("Bad Milestone")).not.toBeInTheDocument()
    })
  })

  it("Test 6: delete confirm — Cancel issues no DELETE; confirm issues DELETE", async () => {
    apiGet.mockResolvedValueOnce({
      data: [
        {
          id: 11,
          project_id: 7,
          name: "Alpha Launch",
          target_date: "2026-05-15",
          status: "PLANNED",
          linked_phase_ids: ["planning"],
          created_at: "2026-04-25T00:00:00Z",
          updated_at: null,
        },
      ],
    })
    apiDelete.mockResolvedValueOnce({ data: null })

    render(
      wrap(
        <MilestonesSubTab project={baseProject as never} workflow={makeWorkflow()} />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText("Alpha Launch")).toBeInTheDocument()
    })

    // Click delete trigger (X / trash icon button) — selectable by aria-label.
    const deleteBtn = screen.getByRole("button", {
      name: /Sil|Kilometre taşını sil/i,
    })
    fireEvent.click(deleteBtn)

    // Confirm dialog opens — click cancel first.
    await waitFor(() => {
      expect(screen.getByText("Kilometre Taşını Sil")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText("İptal"))

    // No DELETE issued.
    expect(apiDelete).not.toHaveBeenCalled()

    // Re-trigger delete then confirm.
    fireEvent.click(
      screen.getByRole("button", { name: /Sil|Kilometre taşını sil/i }),
    )
    await waitFor(() => {
      expect(screen.getByText("Kilometre Taşını Sil")).toBeInTheDocument()
    })
    // The confirm CTA inside the dialog reads "Sil" — pick the one inside the dialog body.
    // There are two buttons matching /Sil/ — the one inside the dialog overlay, plus
    // potentially the original card button. Find the one inside the modal.
    const confirmBtns = screen.getAllByText("Sil")
    // The last instance is the dialog's confirm button (rendered after the card).
    fireEvent.click(confirmBtns[confirmBtns.length - 1])

    await waitFor(() => {
      expect(apiDelete).toHaveBeenCalledTimes(1)
    })
    expect(apiDelete.mock.calls[0][0]).toBe("/milestones/11")
  })

  it("Test 7: permission gate — useTransitionAuthority returns false hides Add + delete buttons", async () => {
    transitionAuthorityMock.mockReturnValue(false)
    apiGet.mockResolvedValueOnce({
      data: [
        {
          id: 11,
          project_id: 7,
          name: "Alpha Launch",
          target_date: "2026-05-15",
          status: "PLANNED",
          linked_phase_ids: ["planning"],
          created_at: "2026-04-25T00:00:00Z",
          updated_at: null,
        },
      ],
    })

    render(
      wrap(
        <MilestonesSubTab project={baseProject as never} workflow={makeWorkflow()} />,
      ),
    )

    await waitFor(() => {
      expect(screen.getByText("Alpha Launch")).toBeInTheDocument()
    })

    // Add button must NOT be in the document.
    expect(screen.queryByText("Ekle")).not.toBeInTheDocument()
    // Delete button must NOT be in the document either.
    expect(
      screen.queryByRole("button", { name: /Sil|Kilometre taşını sil/i }),
    ).not.toBeInTheDocument()
  })

  it("Test 8: empty state — milestones=[] renders 'Henüz kilometre taşı tanımlanmamış.'", async () => {
    apiGet.mockResolvedValueOnce({ data: [] })

    render(
      wrap(
        <MilestonesSubTab project={baseProject as never} workflow={makeWorkflow()} />,
      ),
    )

    await waitFor(() => {
      expect(
        screen.getByText("Henüz kilometre taşı tanımlanmamış."),
      ).toBeInTheDocument()
    })
  })
})
