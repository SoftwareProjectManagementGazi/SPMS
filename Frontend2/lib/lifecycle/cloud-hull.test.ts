// Unit tests for Frontend2/lib/lifecycle/cloud-hull.ts (Phase 12 Plan 12-01).
//
// 5 cases per 12-01-PLAN.md task 1 <behavior> block:
//   - empty input returns ""
//   - 1-point input returns ""
//   - 2-point input returns a non-empty path d-string
//   - 5-point cluster returns a closed path (starts with M, ends with Z)
//   - hull is non-degenerate (path contains at least one Q segment)

import { describe, it, expect } from "vitest"
import { computeHull, grahamScan } from "./cloud-hull"

describe("computeHull — degenerate inputs", () => {
  it("empty input returns empty string", () => {
    expect(computeHull([])).toBe("")
  })
  it("single-point input returns empty string", () => {
    expect(computeHull([{ x: 10, y: 10 }])).toBe("")
  })
  it("two-point input returns a non-empty path d-string", () => {
    const d = computeHull([
      { x: 10, y: 10 },
      { x: 200, y: 200 },
    ])
    expect(d.length).toBeGreaterThan(0)
  })
})

describe("computeHull — multi-point", () => {
  it("5-point cluster returns a closed path that starts with M and ends with Z", () => {
    const d = computeHull([
      { x: 60, y: 60 },
      { x: 260, y: 60 },
      { x: 460, y: 60 },
      { x: 60, y: 220 },
      { x: 260, y: 220 },
    ])
    expect(d.startsWith("M")).toBe(true)
    expect(d.endsWith("Z")).toBe(true)
  })

  it("5-point cluster contains smoothing Q segments", () => {
    const d = computeHull([
      { x: 60, y: 60 },
      { x: 260, y: 60 },
      { x: 460, y: 60 },
      { x: 60, y: 220 },
      { x: 260, y: 220 },
    ])
    expect(d).toContain("Q")
  })
})

describe("grahamScan — convex hull invariant", () => {
  it("hull of a square's interior point + 4 corners returns the 4 corners", () => {
    const hull = grahamScan([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
      { x: 50, y: 50 }, // interior — should be excluded
    ])
    expect(hull.length).toBe(4)
  })
})
