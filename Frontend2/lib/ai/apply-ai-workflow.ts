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

import { apiClient } from "@/lib/api-client"
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

/** Mapping target for tasks in a column that the suggestion removes. */
export type ColumnMapTarget = { kind: "column"; aiColumnId: string } | { kind: "backlog" }

export interface ApplyTaskStatusArgs {
  mode: ApplyMode
  projectId: number
  projectName: string
  existingProcessConfig: Record<string, unknown>
  columns: SuggestedColumnPayload[]
  methodology: string
  /** Jira "Associate statuses" karşılığı: silinecek ESKİ kolon id'si →
   *  görevlerinin gideceği yeni AI kolonu ya da backlog. Eşleme verilmeyen
   *  kolonlar ilk önerilen kolona düşer (eski davranış). */
  columnMapping?: Record<number, ColumnMapTarget>
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
 * Apply a task-status suggestion.
 *
 * The kanban board AND the status-mode canvas read columns from the
 * board_columns table (the JSONB task_workflow carries only edges/groups/
 * capabilities; nodes are derived as col_{id}). So the apply must do REAL
 * column CRUD — the old implementation wrote nd_* nodes into task_workflow,
 * which updated the canvas but left the kanban board untouched.
 *
 * Replace mode:
 *   1. Reuse-or-create columns in AI order (matched by name). Creation runs
 *      BEFORE deletion so the board never empties and the move target exists.
 *   2. Delete columns not in the suggestion; their tasks move to the first
 *      suggested column.
 *   3. Persist task_workflow with col_{id} edges and NO nodes (derived).
 */
export async function applyTaskStatusSuggestion(
  args: ApplyTaskStatusArgs,
): Promise<{ projectId: number; isNewProject: boolean }> {
  // Special buckets (backlog/done aggregates) are canvas sugar, not columns.
  const wanted = args.columns.filter((c) => !c.is_special)
  if (wanted.length === 0) {
    throw new Error("AI önerisinde uygulanabilir sütun yok")
  }

  if (args.mode === "replace") {
    const existing = (
      await apiClient.get<Array<{ id: number; name: string }>>(
        `/projects/${args.projectId}/columns`,
      )
    ).data

    const norm = (s: string) => s.trim().toLowerCase()
    const byName = new Map<string, { id: number; name: string }>()
    for (const c of existing) {
      if (!byName.has(norm(c.name))) byName.set(norm(c.name), c)
    }

    const kept = new Set<number>()
    const boardIdByAi = new Map<string, number>()

    for (let i = 0; i < wanted.length; i++) {
      const ai = wanted[i]
      const category = ai.is_final
        ? "done"
        : ai.is_initial
          ? "todo"
          : "in_progress"
      const match = byName.get(norm(ai.label))
      if (match && !kept.has(match.id)) {
        kept.add(match.id)
        boardIdByAi.set(ai.id, match.id)
        await apiClient.patch(
          `/projects/${args.projectId}/columns/${match.id}`,
          {
            order_index: i,
            wip_limit: ai.wip_limit ?? 0,
            category,
            is_initial: ai.is_initial,
            is_terminal: ai.is_final,
          },
        )
      } else {
        const created = await apiClient.post<{ id: number }>(
          `/projects/${args.projectId}/columns`,
          {
            name: ai.label,
            order_index: i,
            category,
            is_initial: ai.is_initial,
            is_terminal: ai.is_final,
          },
        )
        kept.add(created.data.id)
        boardIdByAi.set(ai.id, created.data.id)
        if (ai.wip_limit) {
          // CreateColumnDTO has no wip_limit — set it via PATCH.
          await apiClient.patch(
            `/projects/${args.projectId}/columns/${created.data.id}`,
            { wip_limit: ai.wip_limit },
          )
        }
      }
    }

    // Tasks in dropped columns follow the user's mapping (old column → new
    // column or backlog); unmapped ones default to the first suggested column.
    const fallbackTarget = boardIdByAi.get(wanted[0].id)
    for (const col of existing) {
      if (kept.has(col.id)) continue
      const mapped = args.columnMapping?.[col.id]
      if (mapped?.kind === "backlog") {
        await apiClient.delete(
          `/projects/${args.projectId}/columns/${col.id}?move_tasks_to_backlog=true`,
        )
        continue
      }
      const target =
        (mapped?.kind === "column"
          ? boardIdByAi.get(mapped.aiColumnId)
          : undefined) ?? fallbackTarget
      if (target != null) {
        await apiClient.delete(
          `/projects/${args.projectId}/columns/${col.id}?move_tasks_to_column_id=${target}`,
        )
      }
    }

    // Linear flow edges over the real column ids; nodes stay derived.
    const edges: Array<Record<string, unknown>> = []
    for (let i = 0; i < wanted.length - 1; i++) {
      const src = boardIdByAi.get(wanted[i].id)
      const tgt = boardIdByAi.get(wanted[i + 1].id)
      if (src == null || tgt == null) continue
      edges.push({
        id: `es_ai_${src}_${tgt}`,
        source: `col_${src}`,
        target: `col_${tgt}`,
        type: "flow",
        bidirectional: false,
        is_all_gate: false,
      })
    }
    const prevTaskWf = (
      args.existingProcessConfig as {
        task_workflow?: { capabilities?: Record<string, unknown> }
      }
    ).task_workflow
    const capabilities =
      prevTaskWf && typeof prevTaskWf === "object"
        ? prevTaskWf.capabilities
        : undefined

    const nextConfig: Record<string, unknown> = {
      ...args.existingProcessConfig,
      task_workflow: {
        mode: "flexible",
        nodes: [],
        edges,
        groups: [],
        ...(capabilities ? { capabilities } : {}),
      },
    }
    await projectService.updateProcessConfig(args.projectId, nextConfig)
    return { projectId: args.projectId, isNewProject: false }
  }

  // new_project — columns ride the create DTO (names in order) and the fresh
  // project's canvas derives its nodes from them. The source project's task
  // workflow keys are stripped so stale col_* references don't leak in.
  const {
    task_workflow: _tw,
    status_workflow: _sw,
    statusWorkflow: _swCamel,
    ...restConfig
  } = args.existingProcessConfig as {
    task_workflow?: unknown
    status_workflow?: unknown
    statusWorkflow?: unknown
    [k: string]: unknown
  }
  void _tw
  void _sw
  void _swCamel

  const created = await projectService.create({
    name: `${args.projectName} (AI önerisi)`,
    description: `AI tarafından üretilen ${args.methodology} görev durumu workflow'u`,
    key: makeProjectKey(args.projectName),
    start_date: todayIso(),
    methodology: args.methodology,
    columns: wanted.map((c) => c.label),
    process_config: { ...restConfig, methodology: args.methodology },
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
 * M-L2 — de-duplicate the normalized ids in a raw→normalized id map IN PLACE.
 * Two raw ids whose labels normalize to the same nd_ value would otherwise
 * collide and trip the backend's unique-node-id check (422). On a collision we
 * swap in a numeric-tailed variant so every value stays distinct. Shared by the
 * lifecycle (aiToWorkflowConfig) and task-status (applyTaskStatusSuggestion)
 * paths so both are protected by the same tie-break.
 */
function dedupeNormalizedIds(idMap: Map<string, string>): void {
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
  dedupeNormalizedIds(idMap)

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
