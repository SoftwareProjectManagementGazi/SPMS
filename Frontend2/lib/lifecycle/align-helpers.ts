// Pure align helpers (Phase 12 Plan 12-01).
//
// This module has ZERO React imports so it stays unit-testable in vitest
// without jsdom. The React consumer is the bottom toolbar's "Sınıflandır"
// dropdown in Frontend2/components/workflow-editor/bottom-toolbar.tsx (added
// in Plan 12-08).
//
// Reference: CONTEXT D-28. Default node geometry is 140x60 (PhaseNode).

export interface AlignNode {
  id: string
  x: number
  y: number
  width?: number
  height?: number
}

const DEFAULT_W = 140
const DEFAULT_H = 60

function w(n: AlignNode): number {
  return n.width ?? DEFAULT_W
}

function h(n: AlignNode): number {
  return n.height ?? DEFAULT_H
}

/**
 * Distribute the selection horizontally so that gaps between consecutive nodes
 * are equal, preserving the leftmost and rightmost positions. Single-node and
 * 2-node selections are returned unchanged.
 */
export function distributeHorizontal<T extends AlignNode>(nodes: T[]): T[] {
  if (nodes.length < 3) return nodes.map((n) => ({ ...n }))
  const sorted = [...nodes].sort((a, b) => a.x - b.x)
  const left = sorted[0].x
  const right = sorted[sorted.length - 1].x
  const totalSpan = right - left
  const step = totalSpan / (sorted.length - 1)
  const placed = sorted.map((n, i) => ({ ...n, x: left + step * i }))

  // Restore the original input order
  const byId = new Map<string, T>(placed.map((n) => [n.id, n]))
  return nodes.map((orig) => byId.get(orig.id) ?? { ...orig })
}

/**
 * Align all nodes' top edges to the topmost top edge in the selection.
 */
export function alignTop<T extends AlignNode>(nodes: T[]): T[] {
  if (nodes.length === 0) return []
  const top = Math.min(...nodes.map((n) => n.y))
  return nodes.map((n) => ({ ...n, y: top }))
}

/**
 * Align all nodes' bottom edges to the bottommost bottom edge in the selection.
 */
export function alignBottom<T extends AlignNode>(nodes: T[]): T[] {
  if (nodes.length === 0) return []
  const bottom = Math.max(...nodes.map((n) => n.y + h(n)))
  return nodes.map((n) => ({ ...n, y: bottom - h(n) }))
}

/**
 * Center all nodes vertically — every node's vertical center lands on the
 * average vertical center of the selection.
 */
export function centerVertical<T extends AlignNode>(nodes: T[]): T[] {
  if (nodes.length === 0) return []
  const centers = nodes.map((n) => n.y + h(n) / 2)
  const avg = centers.reduce((a, b) => a + b, 0) / centers.length
  return nodes.map((n) => ({ ...n, y: avg - h(n) / 2 }))
}

/**
 * Center all nodes horizontally — every node's horizontal center lands on the
 * average horizontal center of the selection.
 */
export function centerHorizontal<T extends AlignNode>(nodes: T[]): T[] {
  if (nodes.length === 0) return []
  const centers = nodes.map((n) => n.x + w(n) / 2)
  const avg = centers.reduce((a, b) => a + b, 0) / centers.length
  return nodes.map((n) => ({ ...n, x: avg - w(n) / 2 }))
}
