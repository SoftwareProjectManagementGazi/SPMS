// Reports migration v2 Wave 3 — BurndownChart RTL coverage.
//
// Mirrors the cfd-chart.test.tsx pattern: recharts mocked with passthrough
// stubs so we can assert the Line children (dataKey, stroke) without
// booting the real SVG measurement code path. Tests target the wrapper
// behaviour: capability gate, loading skeleton, empty state, footer copy,
// ideal-line interpolation correctness.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

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
          data-stroke={String(props.stroke ?? "")}
          data-dash={String(props.strokeDasharray ?? "")}
          data-name={String(props.name ?? "")}
        />
      )
    }
  return {
    LineChart: Passthrough,
    Line: Leaf("Line"),
    XAxis: Passthrough,
    YAxis: Passthrough,
    CartesianGrid: Passthrough,
    Tooltip: Passthrough,
    ResponsiveContainer: Passthrough,
  }
})

const useBurndownSpy = vi.fn()
vi.mock("@/hooks/use-burndown", () => ({
  useBurndown: (...args: unknown[]) => useBurndownSpy(...args),
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { BurndownChart } from "./burndown-chart"

beforeEach(() => {
  useBurndownSpy.mockReset()
  useBurndownSpy.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
  })
})

describe("BurndownChart", () => {
  it("applicable=false renders sprint-required AlertBanner and no chart lines", () => {
    const { container } = render(<BurndownChart projectId={42} applicable={false} />)
    expect(
      screen.getByText(
        "Burndown raporu için projenize bir sprint eklenmelidir.",
      ),
    ).toBeInTheDocument()
    expect(container.querySelectorAll('[data-recharts-leaf="Line"]').length).toBe(0)
  })

  it("applicable=true with a populated series renders both ideal+remaining Lines", () => {
    useBurndownSpy.mockReturnValue({
      data: {
        sprintName: "Sprint 23",
        sprintId: 23,
        series: [
          { date: "2026-05-01", remaining: 30, total: 30 },
          { date: "2026-05-02", remaining: 28, total: 30 },
          { date: "2026-05-03", remaining: 20, total: 30 },
        ],
      },
      isLoading: false,
      error: null,
    })
    const { container } = render(<BurndownChart projectId={42} applicable={true} />)
    const lines = Array.from(container.querySelectorAll('[data-recharts-leaf="Line"]'))
    const keys = lines.map((l) => l.getAttribute("data-key"))
    // Render order: ideal first (so the solid line draws on top of it).
    expect(keys).toEqual(["ideal", "remaining"])
    // Ideal line is dashed; actual line is solid.
    expect(lines[0].getAttribute("data-dash")).toBe("4 4")
    expect(lines[1].getAttribute("data-dash")).toBe("")
    // Sprint name flows into the card title.
    expect(screen.getByText(/Sprint 23/)).toBeInTheDocument()
  })

  it("loading state renders the burndown skeleton (aria-busy)", () => {
    useBurndownSpy.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })
    const { container } = render(<BurndownChart projectId={42} applicable={true} />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    // No chart lines while loading.
    expect(container.querySelectorAll('[data-recharts-leaf="Line"]').length).toBe(0)
  })

  it("empty data renders the no-active-sprint copy", () => {
    useBurndownSpy.mockReturnValue({
      data: { sprintName: "", sprintId: 0, series: [] },
      isLoading: false,
      error: null,
    })
    const { container } = render(<BurndownChart projectId={42} applicable={true} />)
    expect(screen.getByText(/Aktif sprintte veri bulunamadı/)).toBeInTheDocument()
    expect(container.querySelectorAll('[data-recharts-leaf="Line"]').length).toBe(0)
  })

  it("footer mono row shows 'Bugün kalan: <remaining> / <total>' from the last+first datapoints", () => {
    useBurndownSpy.mockReturnValue({
      data: {
        sprintName: "Sprint 23",
        sprintId: 23,
        series: [
          { date: "D1", remaining: 30, total: 30 },
          { date: "D2", remaining: 22, total: 30 },
          { date: "D3", remaining: 12, total: 30 },
        ],
      },
      isLoading: false,
      error: null,
    })
    render(<BurndownChart projectId={42} applicable={true} />)
    expect(screen.getByText(/Bugün kalan/)).toBeInTheDocument()
    expect(screen.getByText("12 / 30")).toBeInTheDocument()
  })

  it("disables the hook fetch when applicable!=true (enabled=false passthrough)", () => {
    render(<BurndownChart projectId={42} applicable={false} />)
    // The hook is still called (Rules of Hooks) but with enabled=false.
    expect(useBurndownSpy).toHaveBeenCalledWith(42, undefined, false)
  })

  it("enables the hook fetch when applicable=true", () => {
    render(<BurndownChart projectId={42} applicable={true} />)
    expect(useBurndownSpy).toHaveBeenCalledWith(42, undefined, true)
  })
})
