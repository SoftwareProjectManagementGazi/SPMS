// Phase 13 Plan 13-07 Task 1 — RTL coverage for CFDChart.
//
// Tests 1–6 from the plan's <behavior> block:
//   1. Methodology gate — non-Kanban → AlertBanner with TR copy, no chart SVG.
//   2. Methodology applicable — Kanban → 4 stacked Area bands rendered.
//   3. Loading state — useCFD isLoading=true → CFDSkeleton (aria-busy="true").
//   4. Empty state — useCFD returns days=[] → DataState empty fallback.
//   5. Per-card range picker — click 7-day chip → useCFD called with range=7.
//   6. Footer mono row — avgWip + avgCompletionPerDay rendered with values.
//
// Recharts is mocked with passthrough stubs so the test focuses on the
// wrapper logic. The recharts SVG geometry is NOT the test target — the
// chart card behaviour around methodology gating, loading/empty states,
// range overrides, and footer composition is.

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// Recharts mocks — stub each export with a passthrough wrapper so we can
// count Area children without booting the real SVG measurement code path.
vi.mock("recharts", () => {
  const Passthrough = ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-recharts-stub {...(rest as Record<string, unknown>)}>
      {children}
    </div>
  )
  // Area / Bar are leaves with attributes — emit a div carrying the dataKey
  // so tests can grep the SVG payload via DOM attributes.
  const Leaf = (name: string) =>
    function StubLeaf(props: Record<string, unknown>) {
      return (
        <div
          data-recharts-leaf={name}
          data-key={String(props.dataKey ?? "")}
          data-stack={String(props.stackId ?? "")}
          data-fill={String(props.fill ?? "")}
          data-stroke={String(props.stroke ?? "")}
          data-name={String(props.name ?? "")}
        />
      )
    }
  return {
    AreaChart: Passthrough,
    Area: Leaf("Area"),
    BarChart: Passthrough,
    Bar: Leaf("Bar"),
    XAxis: Passthrough,
    YAxis: Passthrough,
    Tooltip: Passthrough,
    ResponsiveContainer: Passthrough,
  }
})

// useCFD mock — controlled per-test return value.
const useCFDSpy = vi.fn()
vi.mock("@/hooks/use-cfd", () => ({
  useCFD: (...args: unknown[]) => useCFDSpy(...args),
}))

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

import { CFDChart } from "./cfd-chart"

beforeEach(() => {
  useCFDSpy.mockReset()
  // Default to a benign loaded state so callers only need to override.
  useCFDSpy.mockReturnValue({
    data: { days: [], avgWip: 0, avgCompletionPerDay: 0 },
    isLoading: false,
    error: null,
  })
})

describe("CFDChart", () => {
  it("Test 1: methodology gate — non-Kanban renders AlertBanner, no chart", () => {
    render(<CFDChart projectId={42} globalRange={30} applicable={false} />)
    expect(
      screen.getByText(
        "Kümülatif Akış Diyagramı yalnızca Kanban projeleri için geçerlidir.",
      ),
    ).toBeInTheDocument()
    // No Area children rendered (4 would mean the chart fired)
    expect(document.querySelectorAll('[data-recharts-leaf="Area"]').length).toBe(0)
  })

  it("Test 2: applicable=true with data renders 4 stacked Area bands (todo/progress/review/done)", () => {
    useCFDSpy.mockReturnValue({
      data: {
        days: Array.from({ length: 30 }, (_, i) => ({
          date: `D${i + 1}`,
          todo: 1,
          progress: 1,
          review: 1,
          done: 1,
        })),
        avgWip: 4.5,
        avgCompletionPerDay: 8.0,
      },
      isLoading: false,
      error: null,
    })
    const { container } = render(
      <CFDChart projectId={42} globalRange={30} applicable={true} />,
    )
    const areas = container.querySelectorAll('[data-recharts-leaf="Area"]')
    expect(areas.length).toBe(4)
    const keys = Array.from(areas).map((a) => a.getAttribute("data-key"))
    expect(keys).toEqual(["todo", "progress", "review", "done"])
    const stacks = Array.from(areas).map((a) => a.getAttribute("data-stack"))
    // All 4 areas share stackId="1" for the cumulative effect.
    expect(stacks.every((s) => s === "1")).toBe(true)
  })

  it("Test 3: loading state shows CFDSkeleton with aria-busy", () => {
    useCFDSpy.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })
    const { container } = render(
      <CFDChart projectId={42} globalRange={30} applicable={true} />,
    )
    const busy = container.querySelector('[aria-busy="true"]')
    expect(busy).not.toBeNull()
  })

  it("Test 4: empty state — days=[] → DataState empty fallback (no Area bands)", () => {
    useCFDSpy.mockReturnValue({
      data: { days: [], avgWip: 0, avgCompletionPerDay: 0 },
      isLoading: false,
      error: null,
    })
    const { container } = render(
      <CFDChart projectId={42} globalRange={30} applicable={true} />,
    )
    // DataState empty fallback short-circuits the children, so no Area renders.
    expect(container.querySelectorAll('[data-recharts-leaf="Area"]').length).toBe(0)
  })

  it("Test 5: per-card range picker overrides the global range", () => {
    useCFDSpy.mockReturnValue({
      data: { days: [{ date: "D1", todo: 0, progress: 0, review: 0, done: 0 }], avgWip: 0, avgCompletionPerDay: 0 },
      isLoading: false,
      error: null,
    })
    render(<CFDChart projectId={42} globalRange={30} applicable={true} />)
    // Initial render — useCFD called with globalRange=30.
    const lastCall = (range: number) =>
      useCFDSpy.mock.calls.some((c) => c[1] === range)
    expect(lastCall(30)).toBe(true)
    // Click the 7-day chip in the per-card picker.
    fireEvent.click(screen.getByRole("button", { name: "7 gün" }))
    expect(useCFDSpy.mock.calls.at(-1)?.[1]).toBe(7)
  })

  it("Test 6: footer mono row shows avgWip + avgCompletionPerDay values", () => {
    useCFDSpy.mockReturnValue({
      data: {
        days: [{ date: "D1", todo: 1, progress: 0, review: 0, done: 0 }],
        avgWip: 4.5,
        avgCompletionPerDay: 8.0,
      },
      isLoading: false,
      error: null,
    })
    render(<CFDChart projectId={42} globalRange={30} applicable={true} />)
    expect(screen.getByText(/Ort\. WIP/)).toBeInTheDocument()
    expect(screen.getByText("4.5")).toBeInTheDocument()
    expect(screen.getByText(/Ort\. Tamamlanma/)).toBeInTheDocument()
    expect(screen.getByText("8")).toBeInTheDocument()
  })
})
