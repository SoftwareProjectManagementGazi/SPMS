// Phase 13 Plan 13-08 Task 1 — RTL coverage for IterationChart.
//
// Tests 1–6 from the plan's <behavior> block:
//   1. 3-series grouped bars: 3 Bar components rendered with dataKeys
//      "planned" / "completed" / "carried".
//   2. Bar fills use the 3 token expressions (--status-progress 60% /
//      --status-done 70% / --status-review 60%).
//   3. N override picker (3/4/6): clicking 6 → useIteration called with
//      count=6 on the next render.
//   4. Loading + empty paths via DataState (skeleton + emptyFallback).
//   5. Returns null entirely for non-cycle methodology (D-A4 — applicable=false
//      → no card, no banner).
//   6. Renders for cycle methodologies: applicable=true + valid data → card
//      with title "İterasyon Karşılaştırma".
//
// Recharts is mocked with passthrough stubs (same pattern as cfd-chart.test
// and lead-cycle-chart.test) so the test focuses on the wrapper logic.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

vi.mock("recharts", () => {
  const Passthrough = ({
    children,
    ...rest
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-recharts-stub {...(rest as Record<string, unknown>)}>
      {children}
    </div>
  )
  const Leaf = (name: string) =>
    function StubLeaf(props: Record<string, unknown>) {
      return (
        <div
          data-recharts-leaf={name}
          data-key={String(props.dataKey ?? "")}
          data-fill={String(props.fill ?? "")}
          data-name={String(props.name ?? "")}
        />
      )
    }
  return {
    BarChart: Passthrough,
    Bar: Leaf("Bar"),
    AreaChart: Passthrough,
    Area: Leaf("Area"),
    XAxis: Passthrough,
    YAxis: Passthrough,
    Tooltip: Passthrough,
    ResponsiveContainer: Passthrough,
  }
})

const useIterationSpy = vi.fn()
vi.mock("@/hooks/use-iteration", () => ({
  useIteration: (...args: unknown[]) => useIterationSpy(...args),
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { IterationChart } from "./iteration-chart"

const sampleSprints = (n = 4) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `Sprint ${20 + i}`,
    planned: 30,
    completed: 25,
    carried: 5,
  }))

beforeEach(() => {
  useIterationSpy.mockReset()
  useIterationSpy.mockReturnValue({
    data: { sprints: sampleSprints(4) },
    isLoading: false,
    error: null,
  })
})

describe("IterationChart", () => {
  it("Test 1: renders 3 Bar components with dataKeys planned/completed/carried", () => {
    const { container } = render(
      <IterationChart projectId={42} applicable={true} />,
    )
    const bars = container.querySelectorAll('[data-recharts-leaf="Bar"]')
    expect(bars.length).toBe(3)
    const keys = Array.from(bars).map((b) => b.getAttribute("data-key"))
    expect(keys).toEqual(["planned", "completed", "carried"])
  })

  it("Test 2: Bar fills use the correct oklch token expressions", () => {
    const { container } = render(
      <IterationChart projectId={42} applicable={true} />,
    )
    const bars = container.querySelectorAll('[data-recharts-leaf="Bar"]')
    const fills = Array.from(bars).map((b) => b.getAttribute("data-fill") || "")
    // Planned uses --status-progress 60%
    expect(fills[0]).toContain("--status-progress")
    expect(fills[0]).toContain("60%")
    // Completed uses --status-done 70%
    expect(fills[1]).toContain("--status-done")
    expect(fills[1]).toContain("70%")
    // Carried uses --status-review 60%
    expect(fills[2]).toContain("--status-review")
    expect(fills[2]).toContain("60%")
  })

  it("Test 3: per-card N override (3/4/6) — clicking 6 calls useIteration with count=6", () => {
    render(<IterationChart projectId={42} applicable={true} />)
    // Initial render — useIteration called with count=4 (default per D-A6).
    const initialCallArg = useIterationSpy.mock.calls.at(-1)?.[1]
    expect(initialCallArg).toBe(4)
    // Click the "6" chip in the per-card picker (label is the literal "6").
    fireEvent.click(screen.getByRole("button", { name: "6" }))
    expect(useIterationSpy.mock.calls.at(-1)?.[1]).toBe(6)
  })

  it("Test 4a: loading state shows IterationSkeleton with aria-busy", () => {
    useIterationSpy.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })
    const { container } = render(
      <IterationChart projectId={42} applicable={true} />,
    )
    const busy = container.querySelector('[aria-busy="true"]')
    expect(busy).not.toBeNull()
  })

  it("Test 4b: empty sprints — DataState empty fallback short-circuits the chart", () => {
    useIterationSpy.mockReturnValue({
      data: { sprints: [] },
      isLoading: false,
      error: null,
    })
    const { container } = render(
      <IterationChart projectId={42} applicable={true} />,
    )
    expect(
      container.querySelectorAll('[data-recharts-leaf="Bar"]').length,
    ).toBe(0)
    expect(
      screen.getByText("Henüz tamamlanmış iterasyon yok."),
    ).toBeInTheDocument()
  })

  it("Test 5: returns null for non-cycle methodology (applicable=false → no card, no banner)", () => {
    const { container } = render(
      <IterationChart projectId={42} applicable={false} />,
    )
    // Card is hidden entirely — no title, no AlertBanner.
    expect(container.firstChild).toBeNull()
    expect(screen.queryByText("İterasyon Karşılaştırma")).not.toBeInTheDocument()
  })

  it("Test 6: renders the card for cycle methodologies (applicable=true)", () => {
    render(<IterationChart projectId={42} applicable={true} />)
    expect(screen.getByText("İterasyon Karşılaştırma")).toBeInTheDocument()
  })
})
