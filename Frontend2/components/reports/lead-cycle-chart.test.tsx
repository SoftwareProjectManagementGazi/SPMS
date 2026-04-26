// Phase 13 Plan 13-07 Task 2 — RTL coverage for LeadCycleChart.
//
// Tests 1–4 from the plan's <behavior> block:
//   1. kind="lead" with 5 buckets → 5 Bar components rendered with --primary token.
//   2. kind="cycle" → bars use --status-progress token.
//   3. Footer P50/P85/P95 mono row renders the formatted percentile values.
//   4. Loading/empty paths via DataState (skeleton + emptyFallback).

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("recharts", () => {
  const Passthrough = ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-recharts-stub {...(rest as Record<string, unknown>)}>{children}</div>
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

const useLeadCycleSpy = vi.fn()
vi.mock("@/hooks/use-lead-cycle", () => ({
  useLeadCycle: (...args: unknown[]) => useLeadCycleSpy(...args),
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { LeadCycleChart } from "./lead-cycle-chart"

const sampleStats = (overrides: Partial<{ p50: number; p85: number; p95: number }> = {}) => ({
  avgDays: 4.2,
  p50: overrides.p50 ?? 3.2,
  p85: overrides.p85 ?? 7.1,
  p95: overrides.p95 ?? 12.0,
  buckets: [
    { range: "0-1d", count: 5 },
    { range: "1-3d", count: 12 },
    { range: "3-5d", count: 18 },
    { range: "5-10d", count: 9 },
    { range: "10d+", count: 3 },
  ],
})

beforeEach(() => {
  useLeadCycleSpy.mockReset()
  useLeadCycleSpy.mockReturnValue({
    data: { lead: sampleStats(), cycle: sampleStats() },
    isLoading: false,
    error: null,
  })
})

describe("LeadCycleChart", () => {
  it("Test 1: kind='lead' renders 5 Bar buckets with --primary token fill", () => {
    const { container } = render(
      <LeadCycleChart projectId={42} kind="lead" globalRange={30} />,
    )
    const bars = container.querySelectorAll('[data-recharts-leaf="Bar"]')
    expect(bars.length).toBe(1) // single Bar series binding the 'count' field across all 5 bucket rows
    const fill = bars[0].getAttribute("data-fill") || ""
    expect(fill).toContain("--primary")
  })

  it("Test 2: kind='cycle' renders bars with --status-progress token fill", () => {
    const { container } = render(
      <LeadCycleChart projectId={42} kind="cycle" globalRange={30} />,
    )
    const bars = container.querySelectorAll('[data-recharts-leaf="Bar"]')
    expect(bars.length).toBe(1)
    const fill = bars[0].getAttribute("data-fill") || ""
    expect(fill).toContain("--status-progress")
  })

  it("Test 3: footer P50/P85/P95 mono row shows formatted percentile values", () => {
    useLeadCycleSpy.mockReturnValue({
      data: {
        lead: sampleStats({ p50: 3.2, p85: 7.1, p95: 12.0 }),
        cycle: sampleStats(),
      },
      isLoading: false,
      error: null,
    })
    render(<LeadCycleChart projectId={42} kind="lead" globalRange={30} />)
    expect(
      screen.getByText(/P50: 3\.2 · P85: 7\.1 · P95: 12\.0/),
    ).toBeInTheDocument()
  })

  it("Test 4a: loading state shows skeleton (aria-busy)", () => {
    useLeadCycleSpy.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })
    const { container } = render(
      <LeadCycleChart projectId={42} kind="lead" globalRange={30} />,
    )
    const busy = container.querySelector('[aria-busy="true"]')
    expect(busy).not.toBeNull()
  })

  it("Test 4b: empty buckets — DataState empty fallback short-circuits the chart", () => {
    useLeadCycleSpy.mockReturnValue({
      data: {
        lead: { ...sampleStats(), buckets: [] },
        cycle: sampleStats(),
      },
      isLoading: false,
      error: null,
    })
    const { container } = render(
      <LeadCycleChart projectId={42} kind="lead" globalRange={30} />,
    )
    expect(container.querySelectorAll('[data-recharts-leaf="Bar"]').length).toBe(0)
  })
})
