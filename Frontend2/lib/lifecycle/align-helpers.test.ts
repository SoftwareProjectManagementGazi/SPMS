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
  it("snaps every node so bottom edges share the same y", () => {
    const out = alignBottom(FIVE_NODES)
    const bottoms = out.map((n) => n.y + 60) // default height
    const first = bottoms[0]
    for (const b of bottoms) {
      expect(b).toBe(first)
    }
  })
})

describe("centerVertical", () => {
  it("aligns vertical centers of every node to the average center", () => {
    const out = centerVertical(FIVE_NODES)
    const centers = out.map((n) => n.y + 30) // default height/2
    const first = centers[0]
    for (const c of centers) {
      expect(Math.abs(c - first)).toBeLessThan(0.001)
    }
  })
})

describe("centerHorizontal", () => {
  it("aligns horizontal centers of every node to the average center", () => {
    const out = centerHorizontal(FIVE_NODES)
    const centers = out.map((n) => n.x + 70) // default width/2
    const first = centers[0]
    for (const c of centers) {
      expect(Math.abs(c - first)).toBeLessThan(0.001)
    }
  })
})
