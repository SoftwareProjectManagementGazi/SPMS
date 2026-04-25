// Pure BFS helper (Phase 12 Plan 12-01).
//
// This module has ZERO React imports so it stays unit-testable in vitest
// without jsdom. The React consumers live in
// Frontend2/components/workflow-editor/workflow-canvas-inner.tsx and
// Frontend2/components/lifecycle/lifecycle-tab.tsx.
//
// Algorithm reference: 12-RESEARCH.md §Pattern A (lines 477-549).
// Backend parity: GetNodeStatesUseCase (Backend phase 9 graph_traversal helper).

export type NodeState = "active" | "past" | "future" | "unreachable"

// Node shape tolerates both snake_case (read straight from backend payload before
// the service-layer mapper) and camelCase (post-mapper). The pure helper does not
// care which side called it; both keys are checked at every read.
export interface GraphNode {
  id: string
  isInitial?: boolean
  isFinal?: boolean
  isArchived?: boolean
  is_archived?: boolean
  is_initial?: boolean
  is_final?: boolean
}

export interface GraphEdge {
  source: string
  target: string
  type?: string
  bidirectional?: boolean
}

export interface GraphWorkflow {
  mode: string
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface PhaseTransitionEntry {
  extra_metadata: { source_phase_id: string; target_phase_id: string }
}

export interface ComputeNodeStatesInput {
  workflow: GraphWorkflow
  /** Sorted oldest -> newest. Caller is responsible for ordering. */
  phaseTransitions: PhaseTransitionEntry[]
}

function isInitial(n: GraphNode): boolean {
  return Boolean(n.isInitial ?? n.is_initial)
}

function isArchived(n: GraphNode): boolean {
  return Boolean(n.isArchived ?? n.is_archived)
}

/**
 * computeNodeStates — pure BFS that classifies every workflow node into
 * active/past/future/unreachable.
 *
 *   active      = head of an uncompleted forward chain OR feedback target
 *   past        = node ever visited by a transition that has since left it
 *   future      = forward-reachable from any active node, but never visited
 *   unreachable = neither active, past, nor reachable from an active node
 *                 (also includes archived nodes regardless of edges)
 *
 * Sequential modes (sequential-locked, continuous) collapse parallel actives
 * to exactly one — the most-recent transition target.
 */
export function computeNodeStates(input: ComputeNodeStatesInput): Map<string, NodeState> {
  const result = new Map<string, NodeState>()
  const { workflow, phaseTransitions } = input
  const activeIds = new Set<string>()
  const visitedHistory = new Set<string>()

  // Adjacency: forward + bidirectional reverse
  const adj = new Map<string, string[]>()
  for (const e of workflow.edges) {
    if (!adj.has(e.source)) adj.set(e.source, [])
    adj.get(e.source)!.push(e.target)
    if (e.bidirectional) {
      if (!adj.has(e.target)) adj.set(e.target, [])
      adj.get(e.target)!.push(e.source)
    }
  }

  // Replay transitions to derive active set + history
  for (const t of phaseTransitions) {
    visitedHistory.add(t.extra_metadata.source_phase_id)
    visitedHistory.add(t.extra_metadata.target_phase_id)
    activeIds.delete(t.extra_metadata.source_phase_id)
    activeIds.add(t.extra_metadata.target_phase_id)
  }

  // No transitions yet -> first isInitial node is active
  if (phaseTransitions.length === 0) {
    const initial = workflow.nodes.find(isInitial)
    if (initial && !isArchived(initial)) {
      activeIds.add(initial.id)
    }
  }

  // Forward reachability BFS from any active node
  const reachable = new Set<string>(activeIds)
  const queue: string[] = [...activeIds]
  while (queue.length) {
    const id = queue.shift()!
    for (const next of adj.get(id) ?? []) {
      if (!reachable.has(next)) {
        reachable.add(next)
        queue.push(next)
      }
    }
  }

  // Classify
  for (const node of workflow.nodes) {
    if (isArchived(node)) {
      result.set(node.id, "unreachable")
      continue
    }
    if (activeIds.has(node.id)) result.set(node.id, "active")
    else if (visitedHistory.has(node.id)) result.set(node.id, "past")
    else if (reachable.has(node.id)) result.set(node.id, "future")
    else result.set(node.id, "unreachable")
  }

  // Sequential modes: collapse to exactly 1 active
  if (
    (workflow.mode === "sequential-locked" || workflow.mode === "continuous") &&
    activeIds.size > 1 &&
    phaseTransitions.length
  ) {
    const latest = phaseTransitions[phaseTransitions.length - 1].extra_metadata.target_phase_id
    for (const id of activeIds) {
      if (id !== latest) result.set(id, "past")
    }
  }

  return result
}
