// Performance bench for Frontend2/lib/lifecycle/cloud-hull.ts (Phase 12 Plan 12-01).
//
// Hard target: cloud-hull recompute median <= 16 ms / frame for 50-node
// fixture (12-SPEC.md constraint, 60fps drag at 50 nodes). vitest's
// `bench` API does not fail on time budget; the explicit
// expect(...).toBeLessThanOrEqual(16) backstop assertion runs in addition.

import { bench, describe, it, expect } from "vitest"
import { computeHull, type Point } from "./cloud-hull"

function build50PointFixture(): Point[] {
  const out: Point[] = []
  for (let i = 0; i < 50; i++) {
    // Pseudo-random spread but deterministic
    const col = i % 10
    const row = Math.floor(i / 10)
    out.push({
      x: 50 + col * 180 + ((i * 13) % 30),
      y: 80 + row * 160 + ((i * 7) % 25),
    })
  }
  return out
}

const fixture = build50PointFixture()

describe("cloud-hull benchmark", () => {
  bench(
    "50-node hull recompute (computeHull)",
    () => {
      computeHull(fixture, 16)
    },
    { time: 1000 },
  )

  it("50-node hull recompute median <= 16 ms over 100 iterations", () => {
    // Warm-up
    for (let i = 0; i < 10; i++) computeHull(fixture, 16)
    const start = performance.now()
    for (let i = 0; i < 100; i++) computeHull(fixture, 16)
    const elapsed = (performance.now() - start) / 100
    expect(elapsed).toBeLessThanOrEqual(16)
  })
})
