// Lifecycle service (Phase 12 Plan 12-01) — composite read of project +
// activity feed in a single hook-friendly call.
//
// Also exports the canonical Phase 12 type set consumed across all other
// lifecycle services (milestone, artifact, phase-report) and components.
// Snake_case ↔ camelCase boundary mappers live here so the rest of the codebase
// works in camelCase only.

import { apiClient } from "@/lib/api-client"

// ============================================================================
// Canonical Phase 12 domain types — camelCase
// ============================================================================

export type WorkflowMode =
  | "flexible"
  | "sequential-locked"
  | "continuous"
  | "sequential-flexible"

export type WorkflowEdgeType = "flow" | "verification" | "feedback"

export interface WorkflowNode {
  id: string
  name: string
  description?: string
  x: number
  y: number
  color?: string
  isInitial?: boolean
  isFinal?: boolean
  isArchived?: boolean
  parentId?: string
  wipLimit?: number | null
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  type: WorkflowEdgeType
  label?: string
  /** Phase 12 D-16 — reverse transition allowed pair-wise */
  bidirectional?: boolean
  /** Phase 12 D-17 — source-agnostic Jira-style "All" gate */
  isAllGate?: boolean
}

export interface WorkflowGroup {
  id: string
  name: string
  color?: string
  children: string[]
}

export interface WorkflowConfig {
  mode: WorkflowMode
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  groups?: WorkflowGroup[]
}

export interface PhaseTransitionEntry {
  id?: number
  user_id: number
  created_at: string
  extra_metadata: {
    source_phase_id: string
    target_phase_id: string
    cycle_number?: number
    override_used?: boolean
  }
}

// ============================================================================
// DTOs (snake_case — the wire shape)
// ============================================================================

export interface WorkflowNodeDTO {
  id: string
  name: string
  description?: string
  x: number
  y: number
  color?: string
  isInitial?: boolean
  isFinal?: boolean
  is_initial?: boolean
  is_final?: boolean
  is_archived?: boolean
  parentId?: string
  parent_id?: string
  wipLimit?: number | null
  wip_limit?: number | null
}

export interface WorkflowEdgeDTO {
  id: string
  source: string
  target: string
  type?: WorkflowEdgeType
  label?: string | null
  bidirectional?: boolean
  is_all_gate?: boolean
  isAllGate?: boolean
}

export interface WorkflowGroupDTO {
  id: string
  name: string
  color?: string
  children?: string[]
}

export interface WorkflowConfigDTO {
  mode: WorkflowMode
  nodes: WorkflowNodeDTO[]
  edges: WorkflowEdgeDTO[]
  groups?: WorkflowGroupDTO[]
}

// ============================================================================
// Mappers
// ============================================================================

export function mapWorkflowNode(d: WorkflowNodeDTO): WorkflowNode {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    x: d.x,
    y: d.y,
    color: d.color,
    isInitial: d.isInitial ?? d.is_initial,
    isFinal: d.isFinal ?? d.is_final,
    isArchived: d.is_archived,
    parentId: d.parentId ?? d.parent_id,
    wipLimit: d.wipLimit ?? d.wip_limit ?? null,
  }
}

export function mapWorkflowEdge(d: WorkflowEdgeDTO): WorkflowEdge {
  return {
    id: d.id,
    source: d.source,
    target: d.target,
    type: (d.type ?? "flow") as WorkflowEdgeType,
    label: d.label ?? undefined,
    bidirectional: d.bidirectional ?? false,
    isAllGate: d.isAllGate ?? d.is_all_gate ?? false,
  }
}

export function mapWorkflowGroup(d: WorkflowGroupDTO): WorkflowGroup {
  return {
    id: d.id,
    name: d.name,
    color: d.color,
    children: d.children ?? [],
  }
}

export function mapWorkflowConfig(d: WorkflowConfigDTO): WorkflowConfig {
  return {
    mode: d.mode,
    nodes: (d.nodes ?? []).map(mapWorkflowNode),
    edges: (d.edges ?? []).map(mapWorkflowEdge),
    groups: (d.groups ?? []).map(mapWorkflowGroup),
  }
}

// Reverse mappers — written for save flows.

export function unmapWorkflowEdge(e: WorkflowEdge): WorkflowEdgeDTO {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type,
    label: e.label ?? null,
    bidirectional: e.bidirectional ?? false,
    is_all_gate: e.isAllGate ?? false,
  }
}

export function unmapWorkflowConfig(c: WorkflowConfig): WorkflowConfigDTO {
  return {
    mode: c.mode,
    nodes: c.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      description: n.description,
      x: n.x,
      y: n.y,
      color: n.color,
      is_initial: n.isInitial ?? false,
      is_final: n.isFinal ?? false,
      is_archived: n.isArchived ?? false,
      parent_id: n.parentId,
      wip_limit: n.wipLimit ?? null,
    })),
    edges: c.edges.map(unmapWorkflowEdge),
    groups: c.groups,
  }
}

// ============================================================================
// Service
// ============================================================================

export interface LifecycleProjectBundle {
  /** Raw project payload from GET /projects/{id} (untouched — caller owns it). */
  project: Record<string, unknown>
  activity: PhaseTransitionEntry[]
  workflow: WorkflowConfig | null
}

export const lifecycleService = {
  /**
   * Composite read — project + phase_transition activity in one call.
   * Used by LifecycleTab and the Workflow Editor at first paint.
   */
  getProject: async (projectId: number): Promise<LifecycleProjectBundle> => {
    const [projectResp, activityResp] = await Promise.all([
      apiClient.get<Record<string, unknown>>(`/projects/${projectId}`),
      apiClient.get<{ items?: PhaseTransitionEntry[] } | PhaseTransitionEntry[]>(
        `/projects/${projectId}/activity`,
        { params: { "type[]": "phase_transition" } },
      ),
    ])

    const data = activityResp.data
    const activity = Array.isArray(data) ? data : (data.items ?? [])

    const processConfig = (projectResp.data["process_config"] ??
      projectResp.data["processConfig"]) as { workflow?: WorkflowConfigDTO } | null
    const workflow = processConfig?.workflow
      ? mapWorkflowConfig(processConfig.workflow)
      : null

    return {
      project: projectResp.data,
      activity,
      workflow,
    }
  },

  /** Activity feed only — used by the cycle counter hook. */
  getPhaseTransitions: async (projectId: number): Promise<PhaseTransitionEntry[]> => {
    const resp = await apiClient.get<
      { items?: PhaseTransitionEntry[] } | PhaseTransitionEntry[]
    >(`/projects/${projectId}/activity`, {
      params: { "type[]": "phase_transition" },
    })
    return Array.isArray(resp.data) ? resp.data : (resp.data.items ?? [])
  },
}
