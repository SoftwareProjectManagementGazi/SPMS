// Unit tests for components/lifecycle/mini-metric.tsx (Phase 12 Plan 12-04).
//
// 3 RTL cases per 12-04-PLAN.md task 1 <behavior> Tests 1-3:
//   1. value rendering — given numeric value, font-size 18, weight 600
//   2. label rendering — given label, font-size 10.5, color var(--fg-muted)
//   3. LIFE-03 zero-task `---` mono branch — value === '---' → mono font + grey color

import * as React from "react"
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MiniMetric } from "./mini-metric"

describe("MiniMetric", () => {
  it("Test 1: renders given numeric value with weight 600 + 18px", () => {
    render(<MiniMetric label="Toplam" value={42} />)
    const valueEl = screen.getByText("42")
    expect(valueEl).toBeInTheDocument()
    expect(valueEl.style.fontSize).toBe("18px")
    expect(valueEl.style.fontWeight).toBe("600")
  })

  it("Test 2: renders given label at 10.5px in --fg-muted", () => {
    render(<MiniMetric label="Tamamlanan" value={14} />)
    const labelEl = screen.getByText("Tamamlanan")
    expect(labelEl).toBeInTheDocument()
    expect(labelEl.style.fontSize).toBe("10.5px")
    expect(labelEl.style.color).toContain("--fg-muted")
  })

  it("Test 3: LIFE-03 — value === '---' renders in mono font + --fg-subtle (regardless of color/mono props)", () => {
    render(<MiniMetric label="Toplam" value="---" color="var(--status-done)" />)
    const valueEl = screen.getByText("---")
    expect(valueEl).toBeInTheDocument()
    // Mono font applied even when caller passes a color override
    expect(valueEl.style.fontFamily).toContain("--font-mono")
    // Grey color overrides the color prop
    expect(valueEl.style.color).toContain("--fg-subtle")
  })

  it("Test 3b: explicit mono prop also enables mono font", () => {
    render(<MiniMetric label="İlerleme" value="%93" mono />)
    const valueEl = screen.getByText("%93")
    expect(valueEl).toBeInTheDocument()
    expect(valueEl.style.fontFamily).toContain("--font-mono")
  })
})
