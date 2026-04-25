// Unit tests for components/lifecycle/phase-gate-expand.tsx (Phase 12 Plan 12-02).
//
// 12 RTL cases per 12-02-PLAN.md task 1 <behavior> Tests 1-12 covering:
//   - Happy path submit
//   - 422 CriteriaUnmet inline list
//   - 409 Locked + Tekrar Dene re-fires same Idempotency-Key
//   - 429 Rate-Limit countdown disables submit
//   - 400 Wrong-mode safety-net AlertBanner
//   - Override flow (sequential-locked + unmet → "Zorla Geç" relabel)
//   - Idempotency-Key reuse on retry within session
//   - Idempotency-Key new on panel reopen
//   - 500-char note limit disables submit
//   - LIFE-03 zero-task branch ("Uygulanamaz" + info AlertBanner)
//   - Open-tasks SegmentedControl + exceptions Collapsible
//   - "Kriterleri düzenle →" deep link

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PhaseGateExpand } from "./phase-gate-expand"
import * as authContext from "@/context/auth-context"
import * as ledTeamsHook from "@/hooks/use-led-teams"
import * as phaseGateServiceModule from "@/services/phase-gate-service"
import * as taskServiceModule from "@/services/task-service"
import type { WorkflowMode } from "@/services/lifecycle-service"

// -----------------------------------------------------------------------------
// Module mocks
// -----------------------------------------------------------------------------

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

vi.mock("@/context/auth-context", () => ({
  useAuth: vi.fn(),
}))

vi.mock("@/hooks/use-led-teams", () => ({
  useLedTeams: vi.fn(),
}))

vi.mock("@/services/phase-gate-service", () => ({
  phaseGateService: {
    execute: vi.fn(),
  },
}))

vi.mock("@/services/task-service", () => ({
  taskService: {
    getByProject: vi.fn().mockResolvedValue([]),
  },
}))

const pushMock = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

const showToastMock = vi.fn()
vi.mock("@/components/toast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}))

const mockedAuth = vi.mocked(authContext)
const mockedLedTeams = vi.mocked(ledTeamsHook)
const mockedPhaseGateExecute = vi.mocked(phaseGateServiceModule.phaseGateService.execute)
const mockedTaskGetByProject = vi.mocked(taskServiceModule.taskService.getByProject)
// Aliases preserved for the existing test bodies that reference the previous names
const mockedPhaseGateService = { execute: mockedPhaseGateExecute }
const mockedTaskService = { getByProject: mockedTaskGetByProject }

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

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

function authAdmin() {
  mockedAuth.useAuth.mockReturnValue({
    user: { id: "1", name: "Admin", email: "a@b.co", role: { name: "Admin" } },
    token: "x",
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  })
  mockedLedTeams.useLedTeams.mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof ledTeamsHook.useLedTeams>)
}

const baseProject = {
  id: 1,
  managerId: 1,
  methodology: "SCRUM",
  processConfig: null,
}

const currentPhase = { id: "execution", name: "Yürütme", x: 0, y: 0 }
const nextPhase = { id: "review", name: "İzleme", x: 0, y: 0 }

interface SetupOpts {
  mode?: WorkflowMode
  totalTasks?: number
  doneTasks?: number
  manualCriteria?: string[]
}

function setupTasks(total: number, done: number) {
  const out = Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    project_id: 1,
    title: `Görev ${i + 1}`,
    status: i < done ? "done" : "todo",
    priority: "medium",
    description: null,
  }))
  mockedTaskService.getByProject.mockResolvedValue(out as never)
  return out
}

function renderPanel(opts: SetupOpts = {}) {
  const mode: WorkflowMode = opts.mode ?? "flexible"
  const total = opts.totalTasks ?? 10
  const done = opts.doneTasks ?? 10
  setupTasks(total, done)
  const manual = opts.manualCriteria ?? []
  const onClose = vi.fn()
  const utils = render(
    wrap(
      <PhaseGateExpand
        project={{ ...baseProject, processConfig: { workflow: { mode, nodes: [], edges: [] } } } as never}
        workflowMode={mode}
        currentPhase={currentPhase as never}
        nextPhase={nextPhase as never}
        criteria={{
          auto: { all_tasks_done: true, no_critical_tasks: true, no_blockers: true },
          manual,
        }}
        onClose={onClose}
      />,
    ),
  )
  return { ...utils, onClose }
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  authAdmin()
  pushMock.mockReset()
  showToastMock.mockReset()
  mockedPhaseGateService.execute.mockReset()
  // Provide a deterministic UUID so we can assert reuse semantics.
  let counter = 0
  vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(
    () => `uuid-${++counter}` as `${string}-${string}-${string}-${string}-${string}`,
  )
})

describe("PhaseGateExpand", () => {
  it("Test 1: happy path — submit POST sends transition + closes panel", async () => {
    mockedPhaseGateService.execute.mockResolvedValue({
      ok: true,
      transitionId: 99,
      targetPhaseId: "review",
      targetPhaseName: "İzleme",
      cycleNumber: 1,
      overrideUsed: false,
      unmet: [],
    })
    const { onClose } = renderPanel()
    const submit = await screen.findByRole("button", { name: /Faz Geçişini Onayla/ })
    await userEvent.click(submit)
    await waitFor(() => {
      expect(mockedPhaseGateService.execute).toHaveBeenCalledTimes(1)
    })
    const [projectId, dto, idempotencyKey] = mockedPhaseGateService.execute.mock.calls[0]
    expect(projectId).toBe(1)
    expect(dto.source_phase_id).toBe("execution")
    expect(dto.target_phase_id).toBe("review")
    expect(idempotencyKey).toBe("uuid-1")
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it("Test 2: 422 CriteriaUnmet renders per-criterion failure list", async () => {
    const err = {
      response: {
        status: 422,
        data: {
          error_code: "CRITERIA_UNMET",
          unmet: [
            { check: "all_tasks_done", passed: false, detail: "3 açık görev" },
          ],
        },
      },
    }
    mockedPhaseGateService.execute.mockRejectedValue(err)
    renderPanel()
    const submit = await screen.findByRole("button", { name: /Faz Geçişini Onayla/ })
    await userEvent.click(submit)
    await waitFor(() => {
      expect(screen.getByText(/Bazı kriterler karşılanmadı/)).toBeInTheDocument()
    })
    expect(screen.getByText(/all_tasks_done/)).toBeInTheDocument()
    expect(screen.getByText(/3 açık görev/)).toBeInTheDocument()
  })

  it("Test 3: 409 Locked renders Tekrar Dene + retry uses SAME Idempotency-Key", async () => {
    const err = {
      response: { status: 409, data: { error_code: "PHASE_GATE_LOCKED" } },
    }
    mockedPhaseGateService.execute.mockRejectedValue(err)
    renderPanel()
    const submit = await screen.findByRole("button", { name: /Faz Geçişini Onayla/ })
    await userEvent.click(submit)
    await waitFor(() => {
      expect(screen.getByText(/Başka bir kullanıcı aynı anda/)).toBeInTheDocument()
    })
    const retryBtn = screen.getByRole("button", { name: /Tekrar Dene/ })
    // Provide success on retry to confirm execute called twice
    mockedPhaseGateService.execute.mockResolvedValueOnce({
      ok: true,
      transitionId: 100,
      targetPhaseId: "review",
      targetPhaseName: "İzleme",
      cycleNumber: 1,
      overrideUsed: false,
      unmet: [],
    })
    await userEvent.click(retryBtn)
    await waitFor(() => {
      expect(mockedPhaseGateService.execute).toHaveBeenCalledTimes(2)
    })
    const key1 = mockedPhaseGateService.execute.mock.calls[0][2]
    const key2 = mockedPhaseGateService.execute.mock.calls[1][2]
    expect(key1).toBe(key2) // SAME idempotency key on retry within session
  })

  it("Test 4: 429 Rate-Limit shows countdown toast + disables submit", async () => {
    const err = {
      response: { status: 429, data: { retry_after_seconds: 30 } },
    }
    mockedPhaseGateService.execute.mockRejectedValue(err)
    renderPanel()
    const submit = await screen.findByRole("button", { name: /Faz Geçişini Onayla/ })
    await userEvent.click(submit)
    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalled()
    })
    // Toast was a "wait N seconds" warning
    const lastCall = showToastMock.mock.calls[showToastMock.mock.calls.length - 1][0]
    expect(lastCall.message).toMatch(/saniye bekleyin/)
    // Submit is disabled while countdown is active
    const disabledSubmit = screen.getByRole("button", { name: /Faz Geçişini Onayla/ }) as HTMLButtonElement
    expect(disabledSubmit.disabled).toBe(true)
  })

  it("Test 5: 400 Wrong-mode renders safety-net AlertBanner", async () => {
    const err = {
      response: { status: 400, data: { error_code: "INVALID_MODE" } },
    }
    mockedPhaseGateService.execute.mockRejectedValue(err)
    renderPanel()
    const submit = await screen.findByRole("button", { name: /Faz Geçişini Onayla/ })
    await userEvent.click(submit)
    await waitFor(() => {
      expect(screen.getByText(/Sürekli akış \(Kanban\) modunda Phase Gate kullanılamaz/)).toBeInTheDocument()
    })
  })

  it("Test 6: override flow — sequential-locked + unmet criteria → checkbox + 'Zorla Geç'", async () => {
    renderPanel({ mode: "sequential-locked", totalTasks: 5, doneTasks: 1 })
    // Override checkbox should be present
    const checkbox = await screen.findByRole("checkbox", { name: /Kriterler karşılanmadan geçilsin/ })
    expect(checkbox).toBeInTheDocument()
    // Submit currently shows the standard label (disabled because criteria unmet in locked mode)
    expect(screen.queryByRole("button", { name: /^Zorla Geç$/ })).not.toBeInTheDocument()
    // Toggling the checkbox relabels the button
    await userEvent.click(checkbox)
    const forceBtn = await screen.findByRole("button", { name: /Zorla Geç/ })
    expect(forceBtn).toBeInTheDocument()
    // Submitting sends allow_override: true
    mockedPhaseGateService.execute.mockResolvedValue({
      ok: true,
      transitionId: 101,
      targetPhaseId: "review",
      targetPhaseName: "İzleme",
      cycleNumber: 1,
      overrideUsed: true,
      unmet: [],
    })
    await userEvent.click(forceBtn)
    await waitFor(() => {
      expect(mockedPhaseGateService.execute).toHaveBeenCalled()
    })
    const dto = mockedPhaseGateService.execute.mock.calls[0][1]
    expect(dto.allow_override).toBe(true)
  })

  it("Test 7: Idempotency-Key reuse on retry — same key across multiple submits in one session", async () => {
    const err = { response: { status: 409, data: { error_code: "PHASE_GATE_LOCKED" } } }
    mockedPhaseGateService.execute.mockRejectedValue(err)
    renderPanel()
    const submit = await screen.findByRole("button", { name: /Faz Geçişini Onayla/ })
    await userEvent.click(submit)
    await waitFor(() => expect(mockedPhaseGateService.execute).toHaveBeenCalledTimes(1))
    const retry1 = await screen.findByRole("button", { name: /Tekrar Dene/ })
    await userEvent.click(retry1)
    await waitFor(() => expect(mockedPhaseGateService.execute).toHaveBeenCalledTimes(2))
    const retry2 = await screen.findByRole("button", { name: /Tekrar Dene/ })
    await userEvent.click(retry2)
    await waitFor(() => expect(mockedPhaseGateService.execute).toHaveBeenCalledTimes(3))
    const k1 = mockedPhaseGateService.execute.mock.calls[0][2]
    const k2 = mockedPhaseGateService.execute.mock.calls[1][2]
    const k3 = mockedPhaseGateService.execute.mock.calls[2][2]
    expect(k1).toBe(k2)
    expect(k2).toBe(k3)
  })

  it("Test 8: new Idempotency-Key on panel reopen (unmount + remount)", async () => {
    mockedPhaseGateService.execute.mockResolvedValue({
      ok: true,
      transitionId: 1,
      targetPhaseId: "review",
      targetPhaseName: "İzleme",
      cycleNumber: 1,
      overrideUsed: false,
      unmet: [],
    })
    const { unmount } = renderPanel()
    const submit1 = await screen.findByRole("button", { name: /Faz Geçişini Onayla/ })
    await userEvent.click(submit1)
    await waitFor(() => expect(mockedPhaseGateService.execute).toHaveBeenCalledTimes(1))
    const k1 = mockedPhaseGateService.execute.mock.calls[0][2]
    unmount()
    // Reopen — fresh mount uses a new UUID
    renderPanel()
    const submit2 = await screen.findByRole("button", { name: /Faz Geçişini Onayla/ })
    await userEvent.click(submit2)
    await waitFor(() => expect(mockedPhaseGateService.execute).toHaveBeenCalledTimes(2))
    const k2 = mockedPhaseGateService.execute.mock.calls[1][2]
    expect(k1).not.toBe(k2)
  })

  it("Test 9: note 500-char limit disables submit + counter shows red border", async () => {
    renderPanel()
    const textarea = await screen.findByPlaceholderText(/Geçiş notu/) as HTMLTextAreaElement
    // 501 chars
    const longNote = "a".repeat(501)
    fireEvent.change(textarea, { target: { value: longNote } })
    const submit = screen.getByRole("button", { name: /Faz Geçişini Onayla/ }) as HTMLButtonElement
    expect(submit.disabled).toBe(true)
    expect(screen.getByText(/501\/500/)).toBeInTheDocument()
  })

  it("Test 10: LIFE-03 zero-task branch — auto criteria show 'Uygulanamaz' + info banner", async () => {
    renderPanel({ totalTasks: 0, doneTasks: 0 })
    await waitFor(() => {
      expect(screen.getAllByText(/Uygulanamaz/).length).toBeGreaterThan(0)
    })
    expect(screen.getByText(/Bu fazda henüz görev yok/)).toBeInTheDocument()
  })

  it("Test 11: open-tasks SegmentedControl + 'Farklı davranış gerekli?' Collapsible", async () => {
    renderPanel({ totalTasks: 5, doneTasks: 2 })
    // 3 open tasks → SegmentedControl visible
    await waitFor(() => {
      expect(screen.getByText(/Açık Görevler/)).toBeInTheDocument()
    })
    expect(screen.getByText(/Sonraki faza taşı/)).toBeInTheDocument()
    expect(screen.getByText(/Backlog'a taşı/)).toBeInTheDocument()
    expect(screen.getByText(/Bu fazda bırak/)).toBeInTheDocument()
    // Collapsible label includes count
    expect(screen.getByText(/Farklı davranış gerekli\?.*3 görev/)).toBeInTheDocument()
  })

  it("Test 12: 'Kriterleri düzenle →' link calls router.push with deep-link query", async () => {
    renderPanel({ manualCriteria: ["Faz çıktıları gözden geçirildi"] })
    const link = await screen.findByText(/Kriterleri düzenle/)
    await userEvent.click(link)
    expect(pushMock).toHaveBeenCalled()
    const target = pushMock.mock.calls[0][0]
    expect(String(target)).toContain("/projects/1")
    expect(String(target)).toContain("tab=settings")
    expect(String(target)).toContain("sub=lifecycle")
    expect(String(target)).toContain("phase=execution")
  })
})
