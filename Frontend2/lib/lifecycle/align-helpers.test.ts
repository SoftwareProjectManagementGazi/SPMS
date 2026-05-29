// Unit tests for Frontend2/lib/lifecycle/align-helpers.ts (Phase 12 Plan 12-01).
//
// 5 cases per 12-01-PLAN.md task 1 <behavior> block — one for each align
// function applied to a 5-node input.

import { describe, it, expect } from "vitest"
import {
  distributeHorizontal,
  alignTop,
  alignBottom,
  centerVertical,
  centerHorizontal,
} from "./align-helpers"

const FIVE_NODES = [
  { id: "n1", x: 0, y: 100 },
  { id: "n2", x: 200, y: 50 },
  { id: "n3", x: 350, y: 150 },
  { id: "n4", x: 700, y: 80 },
  { id: "n5", x: 1000, y: 120 },
]

describe("distributeHorizontal", () => {
  it("evenly spaces 5 nodes between leftmost and rightmost", () => {
    const out = distributeHorizontal(FIVE_NODES)
    const sorted = [...out].sort((a, b) => a.x - b.x)
    const gaps = sorted.slice(1).map((n, i) => n.x - sorted[i].x)
    const first = gaps[0]
    for (const g of gaps) {
      expect(Math.abs(g - first)).toBeLessThan(0.001)
    }
    // Endpoints preserved
    expect(sorted[0].x).toBe(0)
    expect(sorted[sorted.length - 1].x).toBe(1000)
  })
})

describe("alignTop", () => {
  it("snaps every node to the minimum y of the selection", () => {
    const out = alignTop(FIVE_NODES)
    const minY = Math.min(...FIVE_NODES.map((n) => n.y))
    for (const n of out) {
      expect(n.y).toBe(minY)
    }
  })
})

describe("alignBottom", () => {
  it("snaps every node so bottom edges share the bottommost bottom (max y+h)", () => {
    const out = alignBottom(FIVE_NODES)
    // Anchor = the bottommost original bottom edge (max y+height), independently
    // computed — so a min/max (or any wrong-anchor) regression diverges. Mutual
    // equality alone passed even if the anchor were the wrong edge.
    const expected = Math.max(...FIVE_NODES.map((n) => n.y + 60))
    expect(expected).toBe(210)
    for (const n of out) {
      expect(n.y + 60).toBe(expected)
    }
  })
})

describe("centerVertical", () => {
  it("aligns vertical centers of every node to the average center", () => {
    const out = centerVertical(FIVE_NODES)
    // Anchor = the AVERAGE of the original centers (independently computed), so a
    // min/first/wrong-anchor regression is caught — mutual equality alone wasn't.
    const expected =
      FIVE_NODES.reduce((a, n) => a + (n.y + 30), 0) / FIVE_NODES.length
    expect(expected).toBe(130)
    for (const n of out) {
      expect(Math.abs(n.y + 30 - expected)).toBeLessThan(0.001)
    }
  })
})

describe("centerHorizontal", () => {
  it("aligns horizontal centers of every node to the average center", () => {
    const out = centerHorizontal(FIVE_NODES)
    const expected =
      FIVE_NODES.reduce((a, n) => a + (n.x + 70), 0) / FIVE_NODES.length
    expect(expected).toBe(520)
    for (const n of out) {
      expect(Math.abs(n.x + 70 - expected)).toBeLessThan(0.001)
    }
  })
})
