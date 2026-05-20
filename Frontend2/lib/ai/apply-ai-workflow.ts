/**
 * Apply AI-generated workflow to backend.
 *
 * Bridges the AI streaming domain (SuggestedNodePayload / SuggestedEdgePayload)
 * to the project's persistent shape (WorkflowConfig / WorkflowNode / WorkflowEdge)
 * and dispatches the matching backend write per user-selected ApplyMode.
 *
 * Modes (per D-01 / §17):
 *   - "replace"      → PATCH /projects/{id}  with process_config.phase_workflow
 *   - "new_project"  → POST /projects        with "<name> (AI önerisi)" + workflow
 *
 * Plan ref: .planning/ai-workflow-generator-plan.md §5.3 + §17 D-01/D-02
 */

import { projectService } from "@/services/project-service"
import type { WorkflowConfig, WorkflowEdge, WorkflowNode } from "@/services/lifecycle-service"
import { unmapWorkflowConfig } from "@/services/lifecycle-service"

import type {
  SuggestedColumnPayload,
  SuggestedEdgePayload,
  SuggestedNodePayload,
} from "./types"

export type ApplyMode = "replace" | "new_project"

export interface ApplyLifecycleArgs {
  mode: ApplyMode
  projectId: number
  projectName: string
  /** Existing process_config so we can splice in only phase_workflow */
  existingProcessConfig: Record<string, unknown>
  nodes: SuggestedNodePayload[]
  edges: SuggestedEdgePayload[]
  methodology: string
}

export interface ApplyTaskStatusArgs {
  mode: ApplyMode
  projectId: number
  projectName: string
  existingProcessConfig: Record<string, unknown>
  columns: SuggestedColumnPayload[]
  methodology: string
}

/**
 * Apply a lifecycle suggestion. Returns the affected project id (existing for
 * replace, new for new_project) so the caller can navigate / show undo info.
 */
export async function applyLifecycleSuggestion(
  args: ApplyLifecycleArgs,
): Promise<{ projectId: number; isNewProject: boolean }> {
  const workflow = aiToWorkflowConfig(args.nodes, args.edges)
  const workflowDTO = unmapWorkflowConfig(workflow)

  if (args.mode === "replace") {
    const nextConfig: Record<string, unknown> = {
      ...args.existingProcessConfig,
      phase_workflow: workflowDTO,
    }
    await projectService.updateProcessConfig(args.projectId, nextConfig)
    return { projectId: args.projectId, isNewProject: false }
  }

  // new_project — clone the source project's process_config and override workflow
  const nextConfig: Record<string, unknown> = {
    ...args.existingProcessConfig,
    phase_workflow: workflowDTO,
    methodology: args.methodology,
  }
  const created = await projectService.create({
    name: `${args.projectName} (AI önerisi)`,
    description: `AI tarafından üretilen ${args.methodology} workflow'u`,
    key: makeProjectKey(args.projectName),
    start_date: todayIso(),
    methodology: args.methodology,
    process_config: nextConfig,
  })
  return { projectId: created.id, isNewProject: true }
}

/**
 * Apply a task-status suggestion. Same shape as lifecycle but encodes columns
 * via the project's board_columns (handled by backend on PATCH).
 *
 * For Wave 5 MVP we route this through the same process_config write path:
 * columns become workflow nodes with x positioned left-to-right (status mode).
 * Backend's normalizer picks them up as board columns when methodology +
 * mode signal kanban-style storage. If your project's wire format differs,
 * adapt this mapper.
 */
export async function applyTaskStatusSuggestion(
  args: ApplyTaskStatusArgs,
): Promise<{ projectId: number; isNewProject: boolean }> {
  // Normalize column ids to backend's required ^nd_[A-Za-z0-9_-]{10}$ format
  const colIdMap = new Map<string, string>()
  for (const c of args.columns) {
    colIdMap.set(c.id, normalizeNodeId(c.id))
  }

  // Map columns → status-mode nodes laid out horizontally
  const nodes: WorkflowNode[] = args.columns.map((c, idx) => ({
    id: colIdMap.get(c.id) ?? c.id,
    name: c.label,
    description: c.description,
    x: 60 + idx * 220,
    y: 200,
    color: c.color,
    isInitial: c.is_initial,
    isFinal: c.is_final,
    wipLimit: c.wip_limit ?? null,
  }))

  // Status-mode workflows are typically linear flow edges; we synthesize them
  // from the column order to keep the persisted shape valid.
  const edges: WorkflowEdge[] = []
  const mainCols = args.columns.filter((c) => !c.is_special)
  for (let i = 0; i < mainCols.length - 1; i++) {
    const src = colIdMap.get(mainCols[i].id) ?? mainCols[i].id
    const tgt = colIdMap.get(mainCols[i + 1].id) ?? mainCols[i + 1].id
    edges.push({
      id: `e_${src}_${tgt}`,
      source: src,
      target: tgt,
      type: "flow",
    })
  }

  const workflow: WorkflowConfig = {
    mode: "flexible",
    nodes,
    edges,
  }
  const workflowDTO = unmapWorkflowConfig(workflow)

  // Task-status canonical field is `task_workflow` (Wave 2 W2-C5 rename;
  // older payloads still carry `status_workflow` as a read-side fallback).
  // Writing to `task_workflow` is what makes the editor's status-mode canvas
  // pick up the new shape — `phase_workflow` only drives lifecycle mode.
  if (args.mode === "replace") {
    const nextConfig: Record<string, unknown> = {
      ...args.existingProcessConfig,
      task_workflow: workflowDTO,
    }
    await projectService.updateProcessConfig(args.projectId, nextConfig)
    return { projectId: args.projectId, isNewProject: false }
  }

  const nextConfig: Record<string, unknown> = {
    ...args.existingProcessConfig,
    task_workflow: workflowDTO,
    methodology: args.methodology,
  }
  const created = await projectService.create({
    name: `${args.projectName} (AI önerisi)`,
    description: `AI tarafından üretilen ${args.methodology} görev durumu workflow'u`,
    key: makeProjectKey(args.projectName),
    start_date: todayIso(),
    methodology: args.methodology,
    process_config: nextConfig,
  })
  return { projectId: created.id, isNewProject: true }
}

// ---------------------------------------------------------------------------
// Helpers — CreateProjectDTO required-field synthesis (new_project mode)
// ---------------------------------------------------------------------------

/**
 * Backend POST /projects requires a project `key` — short uppercase identifier
 * usually 3-5 chars. We derive a deterministic-ish key from the project name
 * (consonants only, uppercased, capped at 4 chars) plus a 3-char timestamp
 * suffix so back-to-back AI applies don't collide on the same key.
 */
function makeProjectKey(name: string): string {
  // Strip everything non-alphanumeric, take first 4 letters of consonants
  const consonants = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/[AEIOU]/g, "")
    .slice(0, 4)
  // Fallback: if name was all vowels/punct (very unlikely) use "AI"
  const prefix = consonants || "AI"
  // 3-char base36 suffix from current ms timestamp for uniqueness
  const suffix = Date.now().toString(36).slice(-3).toUpperCase()
  return `${prefix}${suffix}`
}

/** ISO date (YYYY-MM-DD) for today — backend `start_date` is a date, not datetime. */
function todayIso(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

// ---------------------------------------------------------------------------
// Mappers — AI streaming payload → persisted WorkflowConfig
// ---------------------------------------------------------------------------

/**
 * Backend's WorkflowNode.validate_id_format (D-22) requires:
 *   ^nd_[A-Za-z0-9_-]{10}$
 *
 * Gemini doesn't reliably emit ids in that exact shape (it might produce
 * "nd_planlama" — 8-char suffix). We normalize every node id to "nd_XXXXXXXXXX"
 * (3 + exactly 10 chars) before sending to backend. We build a mapping from
 * raw → normalized so edge source_id/target_id references stay consistent.
 */
function normalizeNodeId(raw: string): string {
  // Strip an existing nd_ prefix if present (we'll add our own)
  const stripped = raw.replace(/^nd_/i, "")
  // Keep only chars allowed by backend regex: A-Z, a-z, 0-9, _, -
  const sanitized = stripped.replace(/[^A-Za-z0-9_-]/g, "")
  // Take first 10; if shorter, right-pad with deterministic chars so two
  // distinct labels never collide on the same padded id.
  let core = sanitized.slice(0, 10)
  if (core.length < 10) {
    // Use a stable hash-ish suffix from the raw string for determinism.
    let hash = 0
    for (let i = 0; i < raw.length; i++) {
      hash = (hash * 31 + raw.charCodeAt(i)) >>> 0
    }
    const filler = hash.toString(36).padStart(10, "0").slice(0, 10 - core.length)
    core = core + filler
  }
  return `nd_${core}`
}

/**
 * Convert a streamed lifecycle suggestion (nodes + edges) into a domain
 * WorkflowConfig. Initial nodes are computed from "has no incoming flow edge".
 * Node ids are normalized to backend's required format (see normalizeNodeId).
 */
export function aiToWorkflowConfig(
  nodes: SuggestedNodePayload[],
  edges: SuggestedEdgePayload[],
): WorkflowConfig {
  // Build raw-id → normalized-id mapping ONCE; edges read from it.
  const idMap = new Map<string, string>()
  for (const n of nodes) {
    if (!idMap.has(n.id)) {
      idMap.set(n.id, normalizeNodeId(n.id))
    }
  }
  // Ensure mapping is unique (two raw ids could normalize to the same value
  // for degenerate inputs — append a numeric tail to break ties).
  const seen = new Set<string>()
  for (const [raw, normalized] of idMap.entries()) {
    let candidate = normalized
    let counter = 1
    while (seen.has(candidate)) {
      const tail = String(counter).padStart(2, "0")
      candidate = `nd_${candidate.slice(3, 11).slice(0, 8)}${tail}`
      counter++
    }
    seen.add(candidate)
    idMap.set(raw, candidate)
  }

  // Compute initial/final flags from flow-edge topology (backend D-19 rules):
  //   - isInitial = no incoming flow edge
  //   - isFinal   = no outgoing flow edge
  // Feedback / verification edges are intentionally excluded — they curl back
  // but don't move the workflow forward.
  const flowTargets = new Set(
    edges.filter((e) => e.edge_type === "flow").map((e) => idMap.get(e.target_id) ?? e.target_id),
  )
  const flowSources = new Set(
    edges.filter((e) => e.edge_type === "flow").map((e) => idMap.get(e.source_id) ?? e.source_id),
  )

  const wfNodes: WorkflowNode[] = nodes.map((n) => {
    const nid = idMap.get(n.id) ?? n.id
    return {
      id: nid,
      name: n.label,
      description: n.description,
      x: n.x,
      y: n.y,
      color: n.color,
      isInitial: !flowTargets.has(nid),
      isFinal: !flowSources.has(nid),
    }
  })

  // Failsafe — Gemini might return cyclic graphs (Iterative-like) where every
  // node has both an incoming and outgoing flow edge. Backend rule 4 requires
  // at least one isFinal node. If none, mark the last emitted node final.
  // Same for isInitial (rule 2).
  if (!wfNodes.some((n) => n.isInitial) && wfNodes.length > 0) {
    wfNodes[0].isInitial = true
  }
  if (!wfNodes.some((n) => n.isFinal) && wfNodes.length > 0) {
    wfNodes[wfNodes.length - 1].isFinal = true
  }

  const wfEdges: WorkflowEdge[] = edges.map((e, idx) => {
    const src = idMap.get(e.source_id) ?? e.source_id
    const tgt = idMap.get(e.target_id) ?? e.target_id
    return {
      id: `e_${idx}_${src}_${tgt}`,
      source: src,
      target: tgt,
      type: e.edge_type,
      label: e.label ?? undefined,
      bidirectional: e.bidirectional,
      isAllGate: e.is_all_gate,
    }
  })

  return {
    mode: "flexible",
    nodes: wfNodes,
    edges: wfEdges,
  }
}
