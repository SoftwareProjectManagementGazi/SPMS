// Unit tests for components/lifecycle/criteria-editor-panel.tsx (Phase 12 Plan 12-03).
//
// 8 RTL cases per 12-03-PLAN.md task 1 <behavior> Tests 1-8 covering:
//   1. Phase picker render with archived suffix
//   2. Auto Toggle persist via PATCH body
//   3. Manual criterion add → save body contains entry
//   4. Manual criterion delete via X button
//   5. Deep-link `?phase=execution` auto-selects + scrollIntoView
//   6. enable_phase_assignment Toggle persists independently of criteria
//   7. Round-trip: save → re-render with new project prop reflects saved state
//   8. Cancel reverts toggles to initial state

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CriteriaEditorPanel } from "./criteria-editor-panel"
import * as transitionAuthorityHook from "@/hooks/use-transition-authority"
import * as apiClientModule from "@/lib/api-client"

// ----------------------------------------------------------------------------
// Module mocks
// ----------------------------------------------------------------------------

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

vi.mock("@/hooks/use-transition-authority", () => ({
  useTransitionAuthority: vi.fn(),
}))

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    patch: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

const showToastMock = vi.fn()
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}))

const useSearchParamsMock = vi.fn()
const useRouterPush = vi.fn()
vi.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParamsMock(),
  // The empty-state branch mounts WorkflowEmptyState → PresetMenu, both of
  // which call useRouter via next/navigation. Mock returns a stable router
  // object so jsdom can render the empty-state.
  useRouter: () => ({ push: useRouterPush, replace: vi.fn(), back: vi.fn() }),
}))

const mockedTransitionAuthority = vi.mocked(transitionAuthorityHook)
const mockedApi = vi.mocked(apiClientModule.apiClient)

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

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

interface CriteriaShape {
  auto: { all_tasks_done: boolean; no_critical_tasks: boolean; no_blockers: boolean }
  manual: string[]
}

interface MockProjectShape {
  id: number
  key: string
  name: string
  description: string | null
  startDate: string
  endDate: string | null
  status: "ACTIVE"
  methodology: string
  processTemplateId: number | null
  managerId: number | null
  managerName: string | null
  managerAvatar: string | null
  progress: number
  columns: string[]
  processConfig: {
    workflow?: {
      mode: string
      nodes: Array<{
        id: string
        name: string
        x: number
        y: number
        is_initial?: boolean
        is_final?: boolean
        is_archived?: boolean
      }>
      edges: Array<{ id: string; source: string; target: string; type: string }>
      groups?: Array<unknown>
    }
    phase_completion_criteria?: Record<string, CriteriaShape>
    enable_phase_assignment?: boolean
  } | null
  createdAt: string
}

function makeProject(overrides: Partial<MockProjectShape> = {}): MockProjectShape {
  return {
    id: 7,
    key: "MOBIL",
    name: "Mobil Bankacılık 3.0",
    description: null,
    startDate: "2026-01-01",
    endDate: null,
    status: "ACTIVE",
    methodology: "SCRUM",
    processTemplateId: 1,
    managerId: 1,
    managerName: "Ayşe",
    managerAvatar: null,
    progress: 40,
    columns: [],
    processConfig: {
      workflow: {
        mode: "flexible",
        nodes: [
          { id: "planning", name: "Planlama", x: 0, y: 0, is_initial: true },
          { id: "execution", name: "Yürütme", x: 200, y: 0 },
          { id: "closure", name: "Kapanış", x: 400, y: 0, is_final: true },
        ],
        edges: [],
        groups: [],
      },
      phase_completion_criteria: {},
      enable_phase_assignment: false,
    },
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  showToastMock.mockReset()
  mockedTransitionAuthority.useTransitionAuthority.mockReturnValue(true)
  // Default — no query params
  useSearchParamsMock.mockReturnValue(new URLSearchParams())
  mockedApi.patch.mockResolvedValue({ data: {} })
})

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("CriteriaEditorPanel", () => {
  it("Test 1 — phase picker renders with archived suffix", () => {
    const project = makeProject({
      processConfig: {
        workflow: {
          mode: "flexible",
          nodes: [
            { id: "planning", name: "Planlama", x: 0, y: 0, is_initial: true },
            { id: "execution", name: "Yürütme", x: 0, y: 0 },
            { id: "legacy", name: "Eski Aşama", x: 0, y: 0, is_archived: true },
          ],
          edges: [],
        },
        phase_completion_criteria: {},
        enable_phase_assignment: false,
      },
    })
    render(wrap(<CriteriaEditorPanel project={project as never} isArchived={false} />))
    expect(screen.getByText("Planlama")).toBeInTheDocument()
    expect(screen.getByText("Yürütme")).toBeInTheDocument()
    // Archived row shows the (Arşiv) suffix
    expect(screen.getByText(/Eski Aşama/)).toBeInTheDocument()
    expect(screen.getByText(/\(Arşiv\)/)).toBeInTheDocument()
  })

  it("Test 2 — toggling all_tasks_done ON and clicking Save sends PATCH body with criteria", async () => {
    const user = userEvent.setup()
    const project = makeProject()
    render(wrap(<CriteriaEditorPanel project={project as never} isArchived={false} />))

    // Click "Yürütme" in the picker.
    await user.click(screen.getByText("Yürütme"))

    // Click the all_tasks_done Toggle (label "Tüm görevler tamamlandı").
    const labelEl = screen.getByText("Tüm görevler tamamlandı")
    const toggleRow = labelEl.closest("[data-criteria-row]") as HTMLElement
    expect(toggleRow).toBeTruthy()
    const toggle = toggleRow.querySelector('[role="switch"]') as HTMLElement
    await user.click(toggle)

    // Click Save (Kaydet).
    await user.click(screen.getByRole("button", { name: "Kaydet" }))

    await waitFor(() => {
      expect(mockedApi.patch).toHaveBeenCalled()
    })
    const [, body] = mockedApi.patch.mock.calls[0] as [string, { process_config: { phase_completion_criteria: Record<string, CriteriaShape> } }]
    expect(body.process_config.phase_completion_criteria.execution.auto.all_tasks_done).toBe(true)
  })

  it("Test 3 — adding a manual criterion 'QA imza' and saving sends it in PATCH body", async () => {
    const user = userEvent.setup()
    const project = makeProject()
    render(wrap(<CriteriaEditorPanel project={project as never} isArchived={false} />))

    await user.click(screen.getByText("Yürütme"))
    const input = screen.getByPlaceholderText("Yeni kriter ekle…") as HTMLInputElement
    await user.type(input, "QA imza")
    await user.click(screen.getByRole("button", { name: "Ekle" }))

    expect(screen.getByText("QA imza")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Kaydet" }))

    await waitFor(() => {
      expect(mockedApi.patch).toHaveBeenCalled()
    })
    const [, body] = mockedApi.patch.mock.calls[0] as [string, { process_config: { phase_completion_criteria: Record<string, CriteriaShape> } }]
    expect(body.process_config.phase_completion_criteria.execution.manual).toContain("QA imza")
  })

  it("Test 4 — clicking X on an existing manual entry removes it", async () => {
    const user = userEvent.setup()
    const project = makeProject({
      processConfig: {
        workflow: {
          mode: "flexible",
          nodes: [
            { id: "planning", name: "Planlama", x: 0, y: 0, is_initial: true },
            { id: "execution", name: "Yürütme", x: 0, y: 0 },
            { id: "closure", name: "Kapanış", x: 0, y: 0, is_final: true },
          ],
          edges: [],
        },
        phase_completion_criteria: {
          execution: {
            auto: { all_tasks_done: false, no_critical_tasks: false, no_blockers: false },
            manual: ["Paydaş onayı alındı"],
          },
        },
        enable_phase_assignment: false,
      },
    })
    render(wrap(<CriteriaEditorPanel project={project as never} isArchived={false} />))

    await user.click(screen.getByText("Yürütme"))
    expect(screen.getByText("Paydaş onayı alındı")).toBeInTheDocument()

    const removeBtn = screen.getByLabelText("Kriteri sil")
    await user.click(removeBtn)

    expect(screen.queryByText("Paydaş onayı alındı")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Kaydet" }))
    await waitFor(() => {
      expect(mockedApi.patch).toHaveBeenCalled()
    })
    const [, body] = mockedApi.patch.mock.calls[0] as [string, { process_config: { phase_completion_criteria: Record<string, CriteriaShape> } }]
    expect(body.process_config.phase_completion_criteria.execution.manual).not.toContain(
      "Paydaş onayı alındı",
    )
  })

  it("Test 5 — deep-link ?phase=execution auto-selects and scrolls", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("phase=execution"))
    const scrollSpy = vi.fn()
    // jsdom: scrollIntoView isn't natively defined on Element.prototype
    Element.prototype.scrollIntoView = scrollSpy as unknown as Element["scrollIntoView"]

    const project = makeProject()
    render(wrap(<CriteriaEditorPanel project={project as never} isArchived={false} />))

    // The Yürütme phase row should be selected (background = var(--accent))
    await waitFor(() => {
      const row = screen.getByText("Yürütme").closest("button") as HTMLButtonElement
      expect(row?.style.background).toContain("--accent")
    })

    // scrollIntoView should be invoked once for the deep-link target
    await waitFor(
      () => {
        expect(scrollSpy).toHaveBeenCalled()
      },
      { timeout: 500 },
    )
  })

  it("Test 6 — enable_phase_assignment Toggle persists independently of phase_completion_criteria", async () => {
    const user = userEvent.setup()
    const existingCriteria: CriteriaShape = {
      auto: { all_tasks_done: true, no_critical_tasks: false, no_blockers: false },
      manual: ["existing"],
    }
    const project = makeProject({
      processConfig: {
        workflow: {
          mode: "flexible",
          nodes: [
            { id: "planning", name: "Planlama", x: 0, y: 0, is_initial: true },
            { id: "execution", name: "Yürütme", x: 0, y: 0 },
            { id: "closure", name: "Kapanış", x: 0, y: 0, is_final: true },
          ],
          edges: [],
        },
        phase_completion_criteria: { execution: existingCriteria },
        enable_phase_assignment: false,
      },
    })

    render(wrap(<CriteriaEditorPanel project={project as never} isArchived={false} />))

    // The enable_phase_assignment Toggle is the FIRST role="switch" — in the
    // outer Card before the picker.
    const toggles = screen.getAllByRole("switch")
    const epaToggle = toggles[0]
    await user.click(epaToggle)

    await waitFor(() => {
      expect(mockedApi.patch).toHaveBeenCalled()
    })
    const [, body] = mockedApi.patch.mock.calls[0] as [string, { process_config: { enable_phase_assignment: boolean; phase_completion_criteria: Record<string, CriteriaShape> } }]
    expect(body.process_config.enable_phase_assignment).toBe(true)
    expect(body.process_config.phase_completion_criteria).toEqual({ execution: existingCriteria })
  })

  it("Test 7 — round-trip: re-rendering with saved state reflects toggles + manual list", async () => {
    const project = makeProject({
      processConfig: {
        workflow: {
          mode: "flexible",
          nodes: [
            { id: "planning", name: "Planlama", x: 0, y: 0, is_initial: true },
            { id: "execution", name: "Yürütme", x: 0, y: 0 },
            { id: "closure", name: "Kapanış", x: 0, y: 0, is_final: true },
          ],
          edges: [],
        },
        phase_completion_criteria: {
          execution: {
            auto: { all_tasks_done: true, no_critical_tasks: true, no_blockers: false },
            manual: ["Saved item"],
          },
        },
        enable_phase_assignment: false,
      },
    })

    render(wrap(<CriteriaEditorPanel project={project as never} isArchived={false} />))

    await userEvent.setup().click(screen.getByText("Yürütme"))
    // Saved manual entry visible.
    expect(screen.getByText("Saved item")).toBeInTheDocument()
    // Two of the three auto-toggles should be ON (aria-checked=true).
    const autoSection = screen.getByText("Tüm görevler tamamlandı").closest("[data-criteria-section]") as HTMLElement
    const switches = autoSection.querySelectorAll('[role="switch"]')
    const checkedCount = Array.from(switches).filter(
      (n) => n.getAttribute("aria-checked") === "true",
    ).length
    expect(checkedCount).toBe(2)
  })

  it("Test 8 — clicking İptal reverts toggles to initial state and dirty=false", async () => {
    const user = userEvent.setup()
    const project = makeProject()
    render(wrap(<CriteriaEditorPanel project={project as never} isArchived={false} />))

    await user.click(screen.getByText("Yürütme"))
    const labelEl = screen.getByText("Tüm görevler tamamlandı")
    const toggleRow = labelEl.closest("[data-criteria-row]") as HTMLElement
    const toggle = toggleRow.querySelector('[role="switch"]') as HTMLElement

    // Toggle ON → revert via İptal → state should be back to false
    await user.click(toggle)
    expect(toggle.getAttribute("aria-checked")).toBe("true")

    await user.click(screen.getByRole("button", { name: "İptal" }))
    expect(toggle.getAttribute("aria-checked")).toBe("false")
  })

  // Phase 12 Plan 12-10 — LIFE-01 UAT fix: empty workflow shows CTAs.
  it("Test 9 — empty workflow shows Şablon Yükle + Workflow Editörünü Aç CTAs", () => {
    const project = makeProject({
      processConfig: {
        workflow: {
          mode: "flexible",
          nodes: [], // empty triggers the empty-state branch
          edges: [],
          groups: [],
        },
        phase_completion_criteria: {},
        enable_phase_assignment: false,
      },
    })
    render(wrap(<CriteriaEditorPanel project={project as never} isArchived={false} />))
    expect(screen.getByTestId("workflow-empty-state")).toBeInTheDocument()
    // The Şablon Yükle PresetMenu trigger must render the TR copy.
    expect(
      screen.getByRole("button", { name: /Şablon Yükle/ }),
    ).toBeInTheDocument()
    // Primary "Workflow Editörünü Aç" button must render the TR copy.
    expect(
      screen.getByRole("button", { name: /Workflow Editörünü Aç/ }),
    ).toBeInTheDocument()
    // The dead-end AlertBanner must no longer render.
    expect(
      screen.queryByText(/Bu projede aktif workflow tanımlanmamış/),
    ).not.toBeInTheDocument()
  })
})
