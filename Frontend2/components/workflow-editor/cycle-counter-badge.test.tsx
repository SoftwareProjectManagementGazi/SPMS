// Unit tests for components/workflow-editor/cycle-counter-badge.tsx
// (Phase 12 Plan 12-01).
//
// 3 cases per 12-01-PLAN.md task 3 <behavior> Tests 13-15.
// Visibility rule: DOM-absent when count < 2 (Pitfall 16).

import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { CycleCounterBadge } from "./cycle-counter-badge"

vi.mock("@/context/app-context", () => ({
  useApp: () => ({ language: "tr" }),
}))

describe("CycleCounterBadge", () => {
  it("count===0 renders nothing (DOM-absent)", () => {
    const { container } = render(<CycleCounterBadge count={0} />)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByText(/×/)).toBeNull()
  })

  it("count===1 renders nothing (single-cycle projects stay clean)", () => {
    const { container } = render(<CycleCounterBadge count={1} />)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByText(/×/)).toBeNull()
  })

  it("count===3 renders the ×3 badge", () => {
    render(<CycleCounterBadge count={3} />)
    expect(screen.getByText(/×3/)).toBeTruthy()
  })
})
