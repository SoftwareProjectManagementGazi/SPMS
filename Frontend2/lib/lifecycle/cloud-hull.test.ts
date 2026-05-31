// Unit tests for Frontend2/lib/lifecycle/cloud-hull.ts (Phase 12 Plan 12-01).
//
// 5 cases per 12-01-PLAN.md task 1 <behavior> block:
//   - empty input returns ""
//   - 1-point input returns ""
//   - 2-point input returns a non-empty path d-string
//   - 5-point cluster returns a closed path (starts with M, ends with Z)
//   - hull is non-degenerate (path contains at least one Q segment)

import { describe, it, expect } from "vitest"
import { buildGroupCloudData, computeHull, grahamScan } from "./cloud-hull"

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

describe("buildGroupCloudData — node-local projection (Tema 1)", () => {
  // Children placed FAR from the origin so an offset/distortion regression
  // (absolute childPositions/hullPath, or a default 600x200 viewBox) would be
  // obvious: the local hull must still start at (0,0).
  const children = [
    { x: 400, y: 300 },
    { x: 560, y: 480 },
  ]
  // minX=400 minY=300 maxX=560 maxY=480; padding 16; NODE 140x60.
  const EXPECTED_WIDTH = 560 - 400 + 140 + 32 // 332
  const EXPECTED_HEIGHT = 480 - 300 + 60 + 32 // 272

  it("positions the node at (minX - padding, minY - padding)", () => {
    const cloud = buildGroupCloudData(children, 16)
    expect(cloud.position).toEqual({ x: 384, y: 284 })
  })

  it("translates children into the node-local frame (first child → (padding,padding))", () => {
    const cloud = buildGroupCloudData(children, 16)
    expect(cloud.childPositions[0]).toEqual({ x: 16, y: 16 })
    expect(cloud.childPositions[1]).toEqual({ x: 176, y: 196 })
  })

  it("derives width/height as span + NODE box + 2*padding", () => {
    const cloud = buildGroupCloudData(children, 16)
    expect(cloud.width).toBe(EXPECTED_WIDTH)
    expect(cloud.height).toBe(EXPECTED_HEIGHT)
  })

  it("keeps EVERY hull coordinate inside the local [0,width] x [0,height] box (no offset)", () => {
    const cloud = buildGroupCloudData(children, 16)
    // Path coords come in (x,y) pairs: M x y, then Q cx cy ex ey ...
    const nums = (cloud.hullPath.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
    expect(nums.length).toBeGreaterThan(0)
    expect(nums.length % 2).toBe(0)
    nums.forEach((v, i) => {
      if (i % 2 === 0) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(cloud.width)
      } else {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(cloud.height)
      }
    })
  })

  it("is translation-invariant: shifting all children only shifts position", () => {
    const base = buildGroupCloudData(children, 16)
    const shifted = buildGroupCloudData(
      children.map((p) => ({ x: p.x + 1000, y: p.y + 500 })),
      16,
    )
    expect(shifted.position).toEqual({
      x: base.position.x + 1000,
      y: base.position.y + 500,
    })
    expect(shifted.width).toBe(base.width)
    expect(shifted.height).toBe(base.height)
    expect(shifted.hullPath).toBe(base.hullPath)
    expect(shifted.childPositions).toEqual(base.childPositions)
  })

  it("empty input returns zero geometry", () => {
    expect(buildGroupCloudData([], 16)).toEqual({
      position: { x: 0, y: 0 },
      width: 0,
      height: 0,
      childPositions: [],
      hullPath: "",
    })
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
