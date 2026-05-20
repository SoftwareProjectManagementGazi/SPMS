// Reports migration v2 Wave 3 — PhaseProgressChart RTL coverage.
//
// No Recharts — the card is built from Card + ProgressBar primitives. Tests
// target observable behaviour: capability gate (workflow-editor CTA copy),
// phase cell rendering, percentage computation (done/total rounding), and
// chevron count (n-1 between n cells).

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

const usePhaseProgressSpy = vi.fn()
vi.mock("@/hooks/use-phase-progress", () => ({
  usePhaseProgress: (...args: unknown[]) => usePhaseProgressSpy(...args),
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { PhaseProgressChart } from "./phase-progress-chart"

beforeEach(() => {
  usePhaseProgressSpy.mockReset()
  usePhaseProgressSpy.mockReturnValue({
    data: { phases: [] },
    isLoading: false,
    error: null,
  })
})

describe("PhaseProgressChart", () => {
  it("applicable=false renders workflow-editor AlertBanner, no cells", () => {
    render(<PhaseProgressChart projectId={42} applicable={false} />)
    expect(
      screen.getByText(/workflow editöründe en az bir faz tanımlayın/),
    ).toBeInTheDocument()
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it("renders one cell per phase with name + done/total counters", () => {
    usePhaseProgressSpy.mockReturnValue({
      data: {
        phases: [
          { id: "design", name: "Design", order: 0, total: 4, done: 4, inProgress: 0, todo: 0 },
          { id: "build",  name: "Build",  order: 1, total: 8, done: 4, inProgress: 3, todo: 1 },
          { id: "ship",   name: "Ship",   order: 2, total: 2, done: 0, inProgress: 1, todo: 1 },
        ],
      },
      isLoading: false,
      error: null,
    })
    render(<PhaseProgressChart projectId={42} applicable={true} />)
    expect(screen.getByText("Design")).toBeInTheDocument()
    expect(screen.getByText("Build")).toBeInTheDocument()
    expect(screen.getByText("Ship")).toBeInTheDocument()
    // done / total counters appear verbatim
    expect(screen.getByText("4 / 4")).toBeInTheDocument()
    expect(screen.getByText("4 / 8")).toBeInTheDocument()
    expect(screen.getByText("0 / 2")).toBeInTheDocument()
  })

  it("percentages are computed and rounded from done / total * 100", () => {
    usePhaseProgressSpy.mockReturnValue({
      data: {
        phases: [
          // 4/4 = 100
          { id: "a", name: "A", order: 0, total: 4, done: 4, inProgress: 0, todo: 0 },
          // 1/3 = 33.333... → rounded to 33
          { id: "b", name: "B", order: 1, total: 3, done: 1, inProgress: 1, todo: 1 },
          // 0/0 (no tasks) → 0
          { id: "c", name: "C", order: 2, total: 0, done: 0, inProgress: 0, todo: 0 },
        ],
      },
      isLoading: false,
      error: null,
    })
    render(<PhaseProgressChart projectId={42} applicable={true} />)
    expect(screen.getByText("100%")).toBeInTheDocument()
    expect(screen.getByText("33%")).toBeInTheDocument()
    // 2 phases with 0% → "0%" appears twice, so use getAllByText
    expect(screen.getAllByText("0%").length).toBe(1)
  })

  it("renders n-1 chevrons between n cells", () => {
    usePhaseProgressSpy.mockReturnValue({
      data: {
        phases: [
          { id: "a", name: "A", order: 0, total: 1, done: 0, inProgress: 0, todo: 1 },
          { id: "b", name: "B", order: 1, total: 1, done: 0, inProgress: 0, todo: 1 },
          { id: "c", name: "C", order: 2, total: 1, done: 0, inProgress: 0, todo: 1 },
        ],
      },
      isLoading: false,
      error: null,
    })
    const { container } = render(
      <PhaseProgressChart projectId={42} applicable={true} />,
    )
    // Lucide renders an <svg class="lucide lucide-chevron-right" ...> per icon.
    const chevrons = container.querySelectorAll("svg.lucide-chevron-right")
    expect(chevrons.length).toBe(2)
  })

  it("loading state renders skeleton placeholders (aria-busy)", () => {
    usePhaseProgressSpy.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })
    const { container } = render(
      <PhaseProgressChart projectId={42} applicable={true} />,
    )
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it("empty phases array with applicable=true shows the no-tasks copy", () => {
    usePhaseProgressSpy.mockReturnValue({
      data: { phases: [] },
      isLoading: false,
      error: null,
    })
    render(<PhaseProgressChart projectId={42} applicable={true} />)
    expect(
      screen.getByText(/Henüz herhangi bir faza atanmış görev yok/),
    ).toBeInTheDocument()
  })

  it("passes enabled=true to the hook only when applicable=true", () => {
    render(<PhaseProgressChart projectId={42} applicable={true} />)
    expect(usePhaseProgressSpy).toHaveBeenCalledWith(42, true)
    usePhaseProgressSpy.mockClear()
    render(<PhaseProgressChart projectId={42} applicable={false} />)
    expect(usePhaseProgressSpy).toHaveBeenCalledWith(42, false)
  })
})
