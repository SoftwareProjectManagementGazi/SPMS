// Pure 5-rule workflow validator (Phase 12 Plan 12-01).
//
// This module has ZERO React imports so it stays unit-testable in vitest
// without jsdom. The React consumers live in the right side panel of
// Frontend2/components/workflow-editor/right-panel.tsx (added in Plan 12-08).
//
// Rules (CONTEXT D-19):
//   1. At least 1 node                                                  [blocking]
//   2. Node IDs unique                                                  [blocking]
//   3. Edge source/target reference existing non-archived nodes
//      (is_all_gate=true exempts source from this check)                [blocking]
//   4. At least 1 isInitial node AND at least 1 isFinal node            [blocking]
//   5. In sequential-locked + sequential-flexible modes: flow edges
//      must form no cycle (Kahn topological sort)                       [blocking]
//      In flexible mode: cycle is a non-blocking warning
//      Feedback + verification edges are exempt regardless of mode.

export interface ValidatorNode {
  id: string
  isInitial?: boolean
  isFinal?: boolean
  isArchived?: boolean
  is_archived?: boolean
  is_initial?: boolean
  is_final?: boolean
}

export interface ValidatorEdge {
  id?: string
  source: string
  target: string
  type?: "flow" | "verification" | "feedback" | string
  isAllGate?: boolean
  is_all_gate?: boolean
}

export interface ValidatorWorkflow {
  mode: string
  nodes: ValidatorNode[]
  edges: ValidatorEdge[]
}

export interface ValidationIssue {
  rule: number
  detail: string
}

export interface ValidationResult {
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

function isAllGate(e: ValidatorEdge): boolean {
  return Boolean(e.isAllGate ?? e.is_all_gate)
}

function isArchived(n: ValidatorNode): boolean {
  return Boolean(n.isArchived ?? n.is_archived)
}

function isInitial(n: ValidatorNode): boolean {
  return Boolean(n.isInitial ?? n.is_initial)
}

function isFinal(n: ValidatorNode): boolean {
  return Boolean(n.isFinal ?? n.is_final)
}

/**
 * validateWorkflow — runs the 5 rules and returns blocking errors plus
 * non-blocking warnings. Pure: no React, no I/O, no global state.
 */
export function validateWorkflow(wf: ValidatorWorkflow): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  // Rule 1: at least 1 node
  if (!wf.nodes || wf.nodes.length === 0) {
    errors.push({ rule: 1, detail: "At least 1 node required" })
  }

  // Rule 2: unique node IDs
  const ids = (wf.nodes ?? []).map((n) => n.id)
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id)
    seen.add(id)
  }
  if (dupes.size > 0) {
    errors.push({
      rule: 2,
      detail: `Duplicate node IDs: ${Array.from(dupes).join(", ")}`,
    })
  }

  // Rule 3: edge source/target reference existing non-archived nodes
  const activeIds = new Set(
    (wf.nodes ?? []).filter((n) => !isArchived(n)).map((n) => n.id),
  )
  for (const e of wf.edges ?? []) {
    const edgeId = e.id ?? `${e.source}->${e.target}`
    // is_all_gate exempts source from this check (source semantically = "any node")
    if (!isAllGate(e) && !activeIds.has(e.source)) {
      errors.push({
        rule: 3,
        detail: `Edge ${edgeId}: source '${e.source}' references missing or archived node`,
      })
    }
    if (!activeIds.has(e.target)) {
      errors.push({
        rule: 3,
        detail: `Edge ${edgeId}: target '${e.target}' references missing or archived node`,
      })
    }
  }

  // Rule 4: at least 1 isInitial AND at least 1 isFinal
  if (!(wf.nodes ?? []).some(isInitial)) {
    errors.push({ rule: 4, detail: "No isInitial node defined" })
  }
  if (!(wf.nodes ?? []).some(isFinal)) {
    errors.push({ rule: 4, detail: "No isFinal node defined" })
  }

  // Rule 5: flow edges must be acyclic in sequential modes; warning in flexible
  const flowEdges = (wf.edges ?? []).filter((e) => (e.type ?? "flow") === "flow")
  const cyclic = hasCycle(activeIds, flowEdges)
  if (wf.mode === "sequential-locked" || wf.mode === "sequential-flexible") {
    if (cyclic) {
      errors.push({
        rule: 5,
        detail: "Flow edges form a cycle (not allowed in sequential modes)",
      })
    }
  } else if (wf.mode === "flexible") {
    if (cyclic) {
      warnings.push({
        rule: 5,
        detail: "Flow edges form a cycle (warning in flexible mode)",
      })
    }
  }

  return { errors, warnings }
}

/**
 * Kahn's topological sort. Returns true iff the graph contains a cycle.
 * Mirrors backend Backend/app/application/dtos/workflow_dtos.py:88-104
 * for FE/BE parity.
 */
export function hasCycle(
  nodeIds: Set<string>,
  edges: Array<{ source: string; target: string }>,
): boolean {
  if (nodeIds.size === 0) return false
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()
  for (const id of nodeIds) {
    inDegree.set(id, 0)
    adj.set(id, [])
  }
  for (const e of edges) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue
    adj.get(e.source)!.push(e.target)
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
  }
  const queue: string[] = []
  for (const id of nodeIds) {
    if ((inDegree.get(id) ?? 0) === 0) queue.push(id)
  }
  let processed = 0
  while (queue.length > 0) {
    const n = queue.shift()!
    processed++
    for (const m of adj.get(n) ?? []) {
      const nextDeg = (inDegree.get(m) ?? 0) - 1
      inDegree.set(m, nextDeg)
      if (nextDeg === 0) queue.push(m)
    }
  }
  return processed !== nodeIds.size
}
