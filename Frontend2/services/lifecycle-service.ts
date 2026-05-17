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

/**
 * Wave 2 W2-C6 — BoardColumn engine field enums. These mirror the backend
 * `ColumnCategory`, `EntryPolicy`, `ExitPolicy` enums introduced in alembic
 * migration 013 and round-trip through `PATCH /projects/{pid}/columns/{cid}`
 * in status mode. In lifecycle mode the same shape is serialized into the
 * `phase_workflow.nodes[i]` JSON object (W2-C7 wires the lifecycle write).
 */
export type ColumnCategory = "todo" | "in_progress" | "done"
export type EntryPolicy = "any" | "edges_only" | "initial_only"
export type ExitPolicy = "any" | "edges_only" | "terminal_lock"

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
  // Wave 2 W2-C6 — engine fields. Mirrored on BoardColumn for status-mode
  // nodes; embedded in `phase_workflow.nodes[i]` JSON for lifecycle-mode.
  category?: ColumnCategory
  isTerminal?: boolean
  maxDurationDays?: number | null
  entryPolicy?: EntryPolicy
  exitPolicy?: ExitPolicy
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
  /** React Flow handle ids — preserved so a user-drawn edge keeps its
   * source/target dot regardless of which handle the user dragged from. */
  sourceHandle?: string
  targetHandle?: string
}

export interface WorkflowGroup {
  id: string
  name: string
  color?: string
  children: string[]
}

/**
 * Wave 2 W2-C5 — engine capability toggles that ride alongside the
 * workflow graph. Backend `WorkflowConfig` Pydantic accepts these as
 * `capabilities` (W2-C1) so the mapper round-trips them as a passthrough
 * object — the UI surface (CapabilitiesPanel, W2-C4) is the source of
 * truth for which keys exist.
 *
 * `initial_node_id` is read-only display info — derived server-side from
 * whichever node carries `is_initial=true`. We carry it through so a
 * refetched payload can show the resolved value, but the editor never
 * writes a custom value here (the toggle UI does not expose it).
 */
export interface WorkflowCapabilities {
  enforce_wip_limits?: boolean
  enforce_sequential_dependencies?: boolean
  restrict_expired_sprints?: boolean
  has_recurring?: boolean
  initial_node_id?: string | null
}

export interface WorkflowConfig {
  mode: WorkflowMode
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  groups?: WorkflowGroup[]
  /** Wave 2 W2-C5 — round-tripped through map/unmap so the editor's
   *  CapabilitiesPanel can hydrate from the persisted shape and the save
   *  handler can serialize back without a separate state slice. */
  capabilities?: WorkflowCapabilities
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
  // Wave 2 W2-C6 — engine field wire shape (snake_case canonical, camelCase
  // tolerated on the READ side so a stale browser cache still hydrates).
  category?: ColumnCategory
  is_terminal?: boolean
  isTerminal?: boolean
  max_duration_days?: number | null
  maxDurationDays?: number | null
  entry_policy?: EntryPolicy
  entryPolicy?: EntryPolicy
  exit_policy?: ExitPolicy
  exitPolicy?: ExitPolicy
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
  source_handle?: string | null
  sourceHandle?: string | null
  target_handle?: string | null
  targetHandle?: string | null
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
  /** Wave 2 W2-C5 — backend `WorkflowConfig.capabilities` (W2-C1). The DTO
   *  uses the snake_case keys exactly as the backend Pydantic model expects,
   *  so map/unmap pass the object through unchanged (no key translation
   *  required — see Pitfall 21 vs. node/edge keys that DO get re-cased). */
  capabilities?: WorkflowCapabilities
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
    // Wave 2 W2-C6 — engine fields. `??` on the optional camelCase fallback
    // keeps undefined when neither key is present so the editor can treat
    // "missing" distinctly from "explicitly null" (max_duration_days only).
    category: d.category,
    isTerminal: d.isTerminal ?? d.is_terminal,
    maxDurationDays: d.maxDurationDays ?? d.max_duration_days ?? null,
    entryPolicy: d.entryPolicy ?? d.entry_policy,
    exitPolicy: d.exitPolicy ?? d.exit_policy,
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
    sourceHandle: d.sourceHandle ?? d.source_handle ?? undefined,
    targetHandle: d.targetHandle ?? d.target_handle ?? undefined,
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

/**
 * Wave 2 W2-C5 — pass-through copy of the backend `capabilities` sub-object.
 * Backend keys are already snake_case (`enforce_wip_limits`,
 * `enforce_sequential_dependencies`, `restrict_expired_sprints`,
 * `has_recurring`, `initial_node_id`) and we keep them as-is so the
 * CapabilitiesPanel can dispatch single-key patches without a translation
 * layer. Unknown keys are dropped to keep the editor immune to backend
 * additions until the UI explicitly adopts them.
 */
export function mapCapabilities(raw: unknown): WorkflowCapabilities {
  if (!raw || typeof raw !== "object") return {}
  const r = raw as Record<string, unknown>
  const out: WorkflowCapabilities = {}
  if (typeof r.enforce_wip_limits === "boolean")
    out.enforce_wip_limits = r.enforce_wip_limits
  if (typeof r.enforce_sequential_dependencies === "boolean")
    out.enforce_sequential_dependencies = r.enforce_sequential_dependencies
  if (typeof r.restrict_expired_sprints === "boolean")
    out.restrict_expired_sprints = r.restrict_expired_sprints
  if (typeof r.has_recurring === "boolean")
    out.has_recurring = r.has_recurring
  if (typeof r.initial_node_id === "string" || r.initial_node_id === null)
    out.initial_node_id = r.initial_node_id as string | null
  return out
}

export function mapWorkflowConfig(d: WorkflowConfigDTO): WorkflowConfig {
  return {
    mode: d.mode,
    nodes: (d.nodes ?? []).map(mapWorkflowNode),
    edges: (d.edges ?? []).map(mapWorkflowEdge),
    groups: (d.groups ?? []).map(mapWorkflowGroup),
    // Wave 2 W2-C5 — round-trip capabilities so the editor's CapabilitiesPanel
    // can hydrate from `process_config.{phase,task}_workflow.capabilities`.
    capabilities: d.capabilities !== undefined
      ? mapCapabilities(d.capabilities)
      : undefined,
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
    source_handle: e.sourceHandle ?? null,
    target_handle: e.targetHandle ?? null,
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
      // Wave 2 W2-C6 — engine fields snake_case serialization. `category`
      // stays undefined when unset so the backend Pydantic model can apply
      // its own default; `max_duration_days` explicitly emits null so a
      // user-cleared input is persisted as "unbounded" rather than dropped.
      category: n.category,
      is_terminal: n.isTerminal ?? false,
      max_duration_days: n.maxDurationDays ?? null,
      entry_policy: n.entryPolicy,
      exit_policy: n.exitPolicy,
    })),
    edges: c.edges.map(unmapWorkflowEdge),
    groups: c.groups,
    // Wave 2 W2-C5 — emit capabilities so toggle changes from
    // CapabilitiesPanel reach the backend. Keys are already snake_case
    // (no translation needed). Omit the field when the editor never
    // hydrated one so legacy projects stay untouched on a no-op save.
    capabilities: c.capabilities,
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

    interface RawActivityItem {
      id?: number
      user_id?: number
      metadata?: Record<string, unknown>
      extra_metadata?: Record<string, unknown>
      timestamp?: string
      created_at?: string
    }
    const data = activityResp.data as { items?: RawActivityItem[]; total?: number } | RawActivityItem[]
    const rawItems = Array.isArray(data) ? data : (data.items ?? [])
    const activity: PhaseTransitionEntry[] = rawItems.map((item) => ({
      id: item.id,
      user_id: item.user_id ?? 0,
      created_at: item.timestamp ?? item.created_at ?? "",
      extra_metadata: (item.extra_metadata ?? item.metadata ?? {}) as PhaseTransitionEntry["extra_metadata"],
    }))

    // Workflow Engine V2 (commit C1): canonical key is `phase_workflow`. The
    // legacy `workflow` is read as fallback so a stale-cache browser hitting a
    // freshly-migrated backend still renders (backend's dual-key tolerance only
    // covers the WRITE path; on the READ side we just emit V2).
    //
    // Wave 2 W2-C5 — task workflow canonical key is `task_workflow`. Wave 1 C10
    // half-renamed the field so the legacy `status_workflow` is kept here as a
    // READ-side fallback for projects persisted before the rename completed.
    // The WRITE path (editor-page save handler) emits `task_workflow` only.
    // Cleanup of the legacy key is deferred to Wave 3 once all persisted rows
    // are confirmed migrated.
    const processConfig = (projectResp.data["process_config"] ??
      projectResp.data["processConfig"]) as {
        phase_workflow?: WorkflowConfigDTO
        workflow?: WorkflowConfigDTO
        task_workflow?: WorkflowConfigDTO
        status_workflow?: WorkflowConfigDTO
      } | null
    const phaseWorkflow =
      processConfig?.phase_workflow ?? processConfig?.workflow
    const workflow = phaseWorkflow
      ? mapWorkflowConfig(phaseWorkflow)
      : null

    return {
      project: projectResp.data,
      activity,
      workflow,
    }
  },

  /** Activity feed only — used by the cycle counter hook. */
  getPhaseTransitions: async (projectId: number): Promise<PhaseTransitionEntry[]> => {
    // Raw shape returned by ActivityItemDTO (Backend activity_dtos.py):
    //   - field is `metadata`  (not `extra_metadata`)
    //   - field is `timestamp` (not `created_at`)
    interface RawActivityItem {
      id?: number
      user_id?: number
      metadata?: Record<string, unknown>
      extra_metadata?: Record<string, unknown>
      timestamp?: string
      created_at?: string
    }
    const resp = await apiClient.get<
      { items?: RawActivityItem[]; total?: number } | RawActivityItem[]
    >(`/projects/${projectId}/activity`, {
      params: { "type[]": "phase_transition" },
    })
    const raw = Array.isArray(resp.data) ? resp.data : (resp.data.items ?? [])
    return raw.map((item) => ({
      id: item.id,
      user_id: item.user_id ?? 0,
      created_at: item.timestamp ?? item.created_at ?? "",
      extra_metadata: (item.extra_metadata ?? item.metadata ?? {}) as PhaseTransitionEntry["extra_metadata"],
    }))
  },
}
