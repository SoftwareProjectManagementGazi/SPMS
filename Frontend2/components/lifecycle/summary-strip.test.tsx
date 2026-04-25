// Unit tests for components/lifecycle/summary-strip.tsx (Phase 12 Plan 12-02).
//
// 4 RTL cases per 12-02-PLAN.md task 2 <behavior> Tests 1-4:
//   1. Default render — Badge + ProgressBar + active-phase index + buttons
//   2. workflow.mode === 'continuous' hides "Sonraki Faza Geç"
//   3. useTransitionAuthority returns false hides "Sonraki Faza Geç"
//   4. "Düzenle" navigates to /workflow-editor?projectId=...

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SummaryStrip } from "./summary-strip"
import * as transitionAuthorityHook from "@/hooks/use-transition-authority"
import type { WorkflowConfig, WorkflowMode } from "@/services/lifecycle-service"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

vi.mock("@/hooks/use-transition-authority", () => ({
  useTransitionAuthority: vi.fn(),
}))

const pushMock = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

const mockedTransitionAuthority = vi.mocked(transitionAuthorityHook)

const baseProject = {
  id: 7,
  managerId: 1,
  methodology: "SCRUM",
  processConfig: null,
}

function makeWorkflow(mode: WorkflowMode): WorkflowConfig {
  return {
    mode,
    nodes: [
      { id: "n1", name: "Başlatma", x: 0, y: 0, isInitial: true },
      { id: "n2", name: "Yürütme", x: 0, y: 0 },
      { id: "n3", name: "Kapanış", x: 0, y: 0, isFinal: true },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2", type: "flow" },
      { id: "e2", source: "n2", target: "n3", type: "flow" },
    ],
    groups: [],
  }
}

const activePhase = { id: "n2", name: "Yürütme", x: 0, y: 0 }

beforeEach(() => {
  vi.clearAllMocks()
  pushMock.mockReset()
  mockedTransitionAuthority.useTransitionAuthority.mockReturnValue(true)
})

describe("SummaryStrip", () => {
  it("Test 1: default render shows Badge + ProgressBar + active-phase index + both buttons", () => {
    render(
      <SummaryStrip
        project={baseProject as never}
        workflow={makeWorkflow("flexible")}
        activePhase={activePhase as never}
        phaseProgress={60}
        openTasksRemaining={3}
        onOpenGate={vi.fn()}
      />,
    )
    // Badge shows "2/3 — Yürütme" (1-based index)
    expect(screen.getByText(/2\/3.*Yürütme/)).toBeInTheDocument()
    // Progress mono percentage
    expect(screen.getByText(/60/)).toBeInTheDocument()
    // 3 kalan
    expect(screen.getByText(/3.*kalan/)).toBeInTheDocument()
    // Both action buttons rendered
    expect(screen.getByRole("button", { name: /Sonraki Faza Geç/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Düzenle/ })).toBeInTheDocument()
  })

  it("Test 2: workflow.mode === 'continuous' hides 'Sonraki Faza Geç' button", () => {
    render(
      <SummaryStrip
        project={baseProject as never}
        workflow={makeWorkflow("continuous")}
        activePhase={activePhase as never}
        phaseProgress={50}
        openTasksRemaining={5}
        onOpenGate={vi.fn()}
      />,
    )
    expect(screen.queryByRole("button", { name: /Sonraki Faza Geç/ })).not.toBeInTheDocument()
    // "Düzenle" still visible
    expect(screen.getByRole("button", { name: /Düzenle/ })).toBeInTheDocument()
  })

  it("Test 3: useTransitionAuthority false hides 'Sonraki Faza Geç' button", () => {
    mockedTransitionAuthority.useTransitionAuthority.mockReturnValue(false)
    render(
      <SummaryStrip
        project={baseProject as never}
        workflow={makeWorkflow("flexible")}
        activePhase={activePhase as never}
        phaseProgress={50}
        openTasksRemaining={2}
        onOpenGate={vi.fn()}
      />,
    )
    expect(screen.queryByRole("button", { name: /Sonraki Faza Geç/ })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Düzenle/ })).toBeInTheDocument()
  })

  it("Test 4: 'Düzenle' click calls router.push with /workflow-editor?projectId=...", async () => {
    render(
      <SummaryStrip
        project={baseProject as never}
        workflow={makeWorkflow("flexible")}
        activePhase={activePhase as never}
        phaseProgress={50}
        openTasksRemaining={0}
        onOpenGate={vi.fn()}
      />,
    )
    const editBtn = screen.getByRole("button", { name: /Düzenle/ })
    await userEvent.click(editBtn)
    expect(pushMock).toHaveBeenCalled()
    const target = String(pushMock.mock.calls[0][0])
    expect(target).toContain("/workflow-editor")
    expect(target).toContain("projectId=7")
  })

  it("Test 5: clicking 'Sonraki Faza Geç' triggers onOpenGate callback", async () => {
    const onOpenGate = vi.fn()
    render(
      <SummaryStrip
        project={baseProject as never}
        workflow={makeWorkflow("flexible")}
        activePhase={activePhase as never}
        phaseProgress={50}
        openTasksRemaining={2}
        onOpenGate={onOpenGate}
      />,
    )
    const gateBtn = screen.getByRole("button", { name: /Sonraki Faza Geç/ })
    await userEvent.click(gateBtn)
    expect(onOpenGate).toHaveBeenCalled()
  })

  // Phase 12 Plan 12-10 — LIFE-01 UAT fix
  it("Test 6: empty workflow renders Şablon Yükle + Workflow Editörünü Aç CTAs", () => {
    const emptyWorkflow: WorkflowConfig = {
      mode: "flexible",
      nodes: [],
      edges: [],
      groups: [],
    }
    render(
      <SummaryStrip
        project={baseProject as never}
        workflow={emptyWorkflow}
        activePhase={null}
        phaseProgress={0}
        openTasksRemaining={0}
        onOpenGate={vi.fn()}
      />,
    )
    // Empty-state container with the dual CTAs
    expect(screen.getByTestId("summary-strip-empty")).toBeInTheDocument()
    expect(
      screen.getByText(/Bu projede henüz iş akışı tanımlı değil/),
    ).toBeInTheDocument()
    // PresetMenu trigger renders the "Şablon Yükle" label.
    expect(
      screen.getByRole("button", { name: /Şablon Yükle/ }),
    ).toBeInTheDocument()
    // Primary "Workflow Editörünü Aç" deep-link button
    expect(
      screen.getByRole("button", { name: /Workflow Editörünü Aç/ }),
    ).toBeInTheDocument()
    // Gate / Edit buttons must NOT render when nodes is empty
    expect(
      screen.queryByRole("button", { name: /Sonraki Faza Geç/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /^Düzenle$/ }),
    ).not.toBeInTheDocument()
  })

  it("Test 7: empty workflow Workflow Editörünü Aç click routes to /workflow-editor", async () => {
    const emptyWorkflow: WorkflowConfig = {
      mode: "flexible",
      nodes: [],
      edges: [],
      groups: [],
    }
    render(
      <SummaryStrip
        project={baseProject as never}
        workflow={emptyWorkflow}
        activePhase={null}
        phaseProgress={0}
        openTasksRemaining={0}
        onOpenGate={vi.fn()}
      />,
    )
    const openEditor = screen.getByRole("button", {
      name: /Workflow Editörünü Aç/,
    })
    await userEvent.click(openEditor)
    expect(pushMock).toHaveBeenCalled()
    const target = String(pushMock.mock.calls[0][0])
    expect(target).toContain("/workflow-editor")
    expect(target).toContain("projectId=7")
  })
})
