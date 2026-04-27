// Phase 14 Plan 14-08 Task 1 — ActiveUsersTrendChart RTL tests.
//
// Verifies the 3 acceptance cases per <behavior>:
//   1. trend.length === 30 → Card chrome renders (title + subtitle + delta
//      Badge); aria-label on the chart container is present.
//   2. trend.length === 0 → empty-state copy rendered; no Badge present.
//   3. Delta computation: first non-zero=10, last=15 → Badge text contains
//      "+50%".
//
// Recharts is NOT stubbed — the chart renders into jsdom which means the
// internal SVG renders but ResponsiveContainer's measurement returns 0x0 in
// jsdom. We don't assert on the SVG path itself; we verify the Card chrome
// (title / subtitle / delta Badge / aria-label) which IS deterministic.
// Pattern matches Phase 13 chart RTL tests (lead-cycle-chart was structured
// the same way).

import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

// ---- useApp mock (TR locale matches prototype default) ----
vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

// SUT — imported AFTER mocks
import { ActiveUsersTrendChart } from "./active-users-trend-chart"

// ---------------------------------------------------------------------------
// jsdom shim for Recharts ResponsiveContainer — without an explicit size,
// recharts bails out of rendering its inner chart in jsdom. This shim makes
// the container report a real size so the SVG actually mounts.
// ---------------------------------------------------------------------------

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 600,
  })
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 180,
  })
  // Recharts reads getBoundingClientRect on its container too.
  Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      x: 0,
      y: 0,
      width: 600,
      height: 180,
      top: 0,
      right: 600,
      bottom: 180,
      left: 0,
      toJSON: () => ({}),
    }),
  })
})

// Helper — generate N days of trend points with a controlled curve.
function makeTrend(
  values: number[],
  startDate = "2026-04-01",
): { date: string; count: number }[] {
  const start = new Date(startDate)
  return values.map((count, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return {
      date: d.toISOString().slice(0, 10),
      count,
    }
  })
}

describe("ActiveUsersTrendChart", () => {
  it("renders Card chrome with 30 mock data points", () => {
    const trend = makeTrend(
      Array.from({ length: 30 }, (_, i) => 10 + i), // 10..39
    )
    render(<ActiveUsersTrendChart trend={trend} />)

    // Title + subtitle (TR locale per useApp mock).
    expect(screen.getByText("Aktif kullanıcı eğilimi")).toBeTruthy()
    expect(screen.getByText("Son 30 gün")).toBeTruthy()

    // Chart container has the role="img" + aria-label slot.
    const chartContainer = screen.getByRole("img")
    expect(chartContainer).toBeTruthy()
    expect(
      chartContainer.getAttribute("aria-label"),
    ).toContain("Aktif kullanıcı eğilimi")
  })

  it("renders empty state when trend is empty", () => {
    render(<ActiveUsersTrendChart trend={[]} />)

    // Empty-state copy from admin-stats-keys (TR).
    expect(screen.getByText("Son 30 günde aktivite yok.")).toBeTruthy()

    // No chart container in empty state.
    expect(screen.queryByRole("img")).toBeNull()

    // No delta Badge in empty state — Badge is suppressed.
    expect(screen.queryByText(/^\+\d+%/)).toBeNull()
    expect(screen.queryByText(/^-\d+%/)).toBeNull()
  })

  it("computes delta percentage correctly: first=10 last=15 → +50%", () => {
    const trend = makeTrend([10, 12, 13, 14, 15])
    render(<ActiveUsersTrendChart trend={trend} />)

    // Badge text should contain "+50%" (positive delta → tone=success).
    expect(screen.getByText("+50%")).toBeTruthy()

    // Title still present alongside the Badge.
    expect(screen.getByText("Aktif kullanıcı eğilimi")).toBeTruthy()
  })

  it("computes negative delta correctly: first=20 last=10 → -50%", () => {
    const trend = makeTrend([20, 18, 15, 12, 10])
    render(<ActiveUsersTrendChart trend={trend} />)

    expect(screen.getByText("-50%")).toBeTruthy()
  })

  it("skips leading zero days when computing delta baseline", () => {
    // Leading 3 zeros → first non-zero baseline = 4. last=8 → +100%.
    const trend = makeTrend([0, 0, 0, 4, 5, 6, 7, 8])
    render(<ActiveUsersTrendChart trend={trend} />)

    expect(screen.getByText("+100%")).toBeTruthy()
  })
})
