// Pure convex-hull-plus-padding helper (Phase 12 Plan 12-01).
//
// This module has ZERO React imports so it stays unit-testable in vitest
// without jsdom. The React consumer is
// Frontend2/components/workflow-editor/group-cloud-node.tsx (read-only baseline
// in this plan; full editor wiring lands in Plan 12-08).
//
// Strategy: the user-facing requirement (CONTEXT D-22) is a "smooth thought-
// bubble" group visual. The 12-01 baseline implements the simpler convex-hull
// + padding fallback explicitly approved by 12-UI-SPEC.md line 1262 ("convex-
// hull + padding as the simpler baseline"). Smoothing is achieved by:
//   1. Inflating each node into 4 corner samples (140x60 PhaseNode geometry)
//   2. Running Graham scan O(n log n) on the inflated cloud
//   3. Emitting the SVG path d-string with cubic-bezier `Q` smoothing between
//      consecutive hull vertices for a soft cloud-like silhouette
//
// Performance budget (12-SPEC.md): <=16 ms median for 50-node fixture.

export interface Point {
  x: number
  y: number
}

const NODE_WIDTH = 140
const NODE_HEIGHT = 60

/**
 * computeHull — returns an SVG path d-string enclosing the given node positions
 * with the supplied padding. Returns "" for inputs with fewer than 2 points.
 *
 * The path always opens with `M`, contains smoothed `Q` bezier segments, and
 * closes with `Z`.
 */
export function computeHull(points: Point[], padding: number = 16): string {
  if (!points || points.length < 2) return ""

  const inflated = inflateCorners(points, padding)
  const hull = grahamScan(inflated)
  if (hull.length < 3) {
    // Two-point case: degenerate hull is a line — emit a thin closed path so
    // tests can still check the M..Z envelope without breaking.
    if (hull.length === 2) {
      const [a, b] = hull
      return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`
    }
    return ""
  }

  return smoothHullPath(hull)
}

/**
 * Geometry for a React-Flow group-cloud node, derived from the ABSOLUTE
 * positions of its child phase nodes. `childPositions` and `hullPath` are in
 * the NODE-LOCAL frame (origin = the node's top-left), so the consumer renders
 * them inside `viewBox="0 0 width height"` with NO offset and NO distortion.
 */
export interface GroupCloudGeometry {
  /** Absolute canvas position of the group node's top-left (its origin). */
  position: { x: number; y: number }
  /** Node-local width — exactly spans the local hull's x-extent [0, width]. */
  width: number
  /** Node-local height — exactly spans the local hull's y-extent [0, height]. */
  height: number
  /** Child positions translated into the node-local frame (origin-relative). */
  childPositions: Point[]
  /** Smoothed hull d-string in the node-local frame (within [0,w]×[0,h]). */
  hullPath: string
}

/**
 * buildGroupCloudData — derive a group-cloud node's geometry from the ABSOLUTE
 * positions of its child phase nodes.
 *
 * Why local-frame output: React Flow translates a node's entire content by its
 * `position`, and GroupCloudNode renders the hull inside `viewBox="0 0 w h"`.
 * If childPositions/hullPath were absolute, the hull would be drawn at
 * `position + abs` (≈ 2·min) and squashed by a mismatched viewBox. By emitting
 * a local frame that starts at (0,0), the rendered hull lands exactly where the
 * nodes are, at 1:1 scale.
 *
 * Geometry: origin = (minX - padding, minY - padding); local = abs - origin.
 * computeHull inflates each local point by `padding` + the NODE_WIDTH/HEIGHT
 * box, so the local hull spans exactly [0, width] × [0, height] where
 *   width  = (maxX - minX) + NODE_WIDTH  + 2*padding
 *   height = (maxY - minY) + NODE_HEIGHT + 2*padding
 *
 * Lives here (not in the editor) because NODE_WIDTH/NODE_HEIGHT are
 * module-private to this file. Empty input → zero geometry.
 */
export function buildGroupCloudData(
  absChildPositions: Point[],
  padding: number = 16,
): GroupCloudGeometry {
  if (!absChildPositions || absChildPositions.length === 0) {
    return {
      position: { x: 0, y: 0 },
      width: 0,
      height: 0,
      childPositions: [],
      hullPath: "",
    }
  }

  const xs = absChildPositions.map((p) => p.x)
  const ys = absChildPositions.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)

  const originX = minX - padding
  const originY = minY - padding

  const childPositions: Point[] = absChildPositions.map((p) => ({
    x: p.x - originX,
    y: p.y - originY,
  }))

  return {
    position: { x: originX, y: originY },
    width: maxX - minX + NODE_WIDTH + 2 * padding,
    height: maxY - minY + NODE_HEIGHT + 2 * padding,
    childPositions,
    hullPath: computeHull(childPositions, padding),
  }
}

/**
 * Expand each node position into the four corners of its bounding box
 * (inflated by `padding`). Sampling corners — not just centers — produces a
 * tighter hull around the actual visible PhaseNode rectangles.
 */
function inflateCorners(points: Point[], padding: number): Point[] {
  const out: Point[] = []
  for (const p of points) {
    out.push({ x: p.x - padding, y: p.y - padding })
    out.push({ x: p.x + NODE_WIDTH + padding, y: p.y - padding })
    out.push({ x: p.x + NODE_WIDTH + padding, y: p.y + NODE_HEIGHT + padding })
    out.push({ x: p.x - padding, y: p.y + NODE_HEIGHT + padding })
  }
  return out
}

/**
 * Standard Graham scan — O(n log n). Returns the convex hull as a list of
 * Points in counter-clockwise order. Reference algorithm.
 */
export function grahamScan(points: Point[]): Point[] {
  if (points.length < 3) return points.slice()

  // Find pivot — lowest-y, then lowest-x for ties
  let pivotIdx = 0
  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    const piv = points[pivotIdx]
    if (p.y < piv.y || (p.y === piv.y && p.x < piv.x)) {
      pivotIdx = i
    }
  }
  const pivot = points[pivotIdx]

  // Sort remaining by polar angle relative to pivot
  const rest = points.filter((_, i) => i !== pivotIdx)
  rest.sort((a, b) => {
    const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x)
    const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x)
    if (angleA !== angleB) return angleA - angleB
    // tie: closer point first
    const dA = (a.x - pivot.x) ** 2 + (a.y - pivot.y) ** 2
    const dB = (b.x - pivot.x) ** 2 + (b.y - pivot.y) ** 2
    return dA - dB
  })

  // Build hull
  const stack: Point[] = [pivot]
  for (const p of rest) {
    while (stack.length >= 2 && cross(stack[stack.length - 2], stack[stack.length - 1], p) <= 0) {
      stack.pop()
    }
    stack.push(p)
  }
  return stack
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

/**
 * Emit a smoothed SVG path enclosing the hull. Uses quadratic-bezier (`Q`)
 * segments anchored on midpoints between consecutive hull vertices — a
 * standard "rounded-polygon" technique that produces cloud-like contours
 * without adding a d3-shape dependency.
 */
function smoothHullPath(hull: Point[]): string {
  const n = hull.length
  if (n < 3) return ""

  const mid = (a: Point, b: Point): Point => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  })

  // Start at the midpoint between the last and first vertex; each Q control
  // is the corner vertex, and each end point is the midpoint to the next.
  const start = mid(hull[n - 1], hull[0])
  const parts: string[] = [`M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`]
  for (let i = 0; i < n; i++) {
    const ctrl = hull[i]
    const next = hull[(i + 1) % n]
    const end = mid(ctrl, next)
    parts.push(
      `Q ${ctrl.x.toFixed(2)} ${ctrl.y.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    )
  }
  parts.push("Z")
  return parts.join(" ")
}
