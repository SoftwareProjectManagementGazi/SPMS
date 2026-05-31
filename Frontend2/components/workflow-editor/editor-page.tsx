"use client"

// EditorPage (Phase 12 Plan 12-07 + Plan 12-08).
//
// Plan 12-07 shipped: header + top toolbar + 2-col body grid + ModeBanner +
// BottomToolbar + MinimapWrapper + WorkflowCanvas mount with empty data.
//
// Plan 12-08 wires:
//   1. workflow → React Flow nodes/edges conversion (so the canvas now
//      actually renders the project's nodes + edges, including group cloud
//      backdrops).
//   2. Editable callbacks: onNodesChange / onEdgesChange / onConnect /
//      onNodeDrag (live cloud morph) / onNodeDragStop (drop-association
//      policy) / onEdgeDoubleClick (inline label edit) / pane + node + edge
//      context menus.
//   3. Undo/redo via useEditorHistory + Cmd/Ctrl+Z + Cmd/Ctrl+Shift+Z
//      shortcuts. Stack `history.clear()` is exposed to Plan 12-09's save
//      success handler via the imperative ref pattern.
//   4. ContextMenu mounting + selection-aware items (node / edge / group /
//      canvas).
//   5. All 8 core keyboard shortcuts (CONTEXT D-35): Cmd+S, Cmd+Z,
//      Cmd+Shift+Z, N, Delete/Backspace, Cmd+A, F, Esc.
//   6. Bottom toolbar Sınıflandır align dropdown wired to the 5 align
//      helpers from Plan 12-01.
//   7. Inline edit propagation: PhaseNode/PhaseEdge double-click writes back
//      via onNameChange / onLabelChange callbacks attached to each node's
//      data prop.
//
// URL persistence: ?mode=lifecycle|status — switching modes calls
// router.replace so the next reload resumes on the same mode. When dirty is
// true, the dirty-save guard (Plan 12-09) intercepts before switching.

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge as RFEdge,
  type Node as RFNode,
} from "@xyflow/react"
import {
  ArrowLeft,
  Save,
  Undo2,
  Redo2,
  Maximize,
  Minus,
  Plus,
  GitBranch,
  Workflow,
} from "lucide-react"

import {
  AlertBanner,
  Badge,
  Button,
  SegmentedControl,
} from "@/components/primitives"
import { Tooltip } from "@/components/workflow-editor/tooltip"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import { useTransitionAuthority } from "@/hooks/use-transition-authority"
import { useEditorHistory } from "@/hooks/use-editor-history"
import { useCycleCounters } from "@/hooks/use-cycle-counters"
import { computeNodeStates } from "@/lib/lifecycle/graph-traversal"
import {
  alignBottom,
  alignTop,
  centerHorizontal,
  centerVertical,
  distributeHorizontal,
  type AlignNode,
} from "@/lib/lifecycle/align-helpers"
import { matchesShortcut, KEYBOARD_SHORTCUTS } from "@/lib/lifecycle/shortcuts"
import {
  buildGroupCloudData,
  type Point,
} from "@/lib/lifecycle/cloud-hull"
import {
  computeDragMembershipChanges,
} from "./workflow-canvas-inner"
import { projectService, type Project } from "@/services/project-service"
import { apiClient } from "@/lib/api-client"
import {
  lifecycleService,
  mapWorkflowConfig,
  unmapWorkflowConfig,
  type PhaseTransitionEntry,
  type WorkflowConfig,
  type WorkflowConfigDTO,
  type WorkflowEdge,
  type WorkflowNode,
} from "@/services/lifecycle-service"

import { WorkflowCanvas, type CanvasControlsHandle } from "./workflow-canvas"
import { RightPanel } from "./right-panel"
import type { WorkflowCapabilities } from "./capabilities-panel"
import type { ColumnEngineFieldsPatch } from "./selection-panel"
import { BottomToolbar } from "./bottom-toolbar"
import { AIWorkflowModal } from "@/components/ai-workflow/ai-workflow-modal"
import { ModeBanner } from "./mode-banner"
import { ContextMenu, type ContextMenuItem } from "./context-menu"
import { DirtySaveDialog } from "./dirty-save-dialog"
import { PresetMenu, detectCurrentPresetId } from "./preset-menu"
import { resolvePreset, type PresetId } from "@/lib/lifecycle/presets"
import {
  newNodeId,
  newEdgeId,
  newGroupId,
  regenerateInvalidNodeIds,
} from "@/lib/lifecycle/node-ids"

export type EditorMode = "lifecycle" | "status"

/** Extract the numeric board-column ID from a status-node id (e.g. "col_42" → 42). */
function colIdFromNodeId(nodeId: string): number | null {
  const m = nodeId.match(/^col_(\d+)$/)
  return m ? parseInt(m[1], 10) : null
}

export interface EditorPageProps {
  project: Project
}

interface ProcessConfigShape {
  /** Workflow Engine V2 (C1 rename): canonical phase workflow key. */
  phase_workflow?: WorkflowConfigDTO
  /** Legacy V1 key — accepted on read only so freshly-migrated projects
   *  whose payload still carries the old shape (e.g. due to a stale browser
   *  cache or in-flight request) keep working. WRITES always emit
   *  `phase_workflow`. */
  workflow?: WorkflowConfigDTO
  /** Wave 2 W2-C5 — canonical task-status workflow key. WRITES always emit
   *  `task_workflow` (Wave 1 C10 began the rename; W2-C5 completes it). */
  task_workflow?: WorkflowConfigDTO
  /** Legacy Wave 1 transitional key — accepted on READ only so projects
   *  persisted before W2-C5 still load. Cleanup deferred to Wave 3. */
  status_workflow?: WorkflowConfigDTO
  statusWorkflow?: WorkflowConfigDTO
}

interface ContextMenuState {
  position: { x: number; y: number }
  items: ContextMenuItem[]
  /** What the menu is targeting — drives onSelect routing. */
  target:
    | { type: "canvas"; flowPos?: Point }
    | { type: "node"; nodeId: string }
    | { type: "edge"; edgeId: string }
    | { type: "group"; groupId: string }
}

function readWorkflow(project: Project): WorkflowConfig {
  const cfg = (project.processConfig ?? null) as ProcessConfigShape | null
  // V2 canonical key is `phase_workflow`; tolerate legacy `workflow` on read so
  // stale-cache clients don't crash. WRITES emit phase_workflow exclusively.
  const wf = cfg?.phase_workflow ?? cfg?.workflow
  if (!cfg || !wf) {
    return { mode: "flexible", nodes: [], edges: [], groups: [] }
  }
  return mapWorkflowConfig(wf)
}

/**
 * Wave 2 W2-C4/W2-C5 — read capabilities for a given mode from the persisted
 * process_config payload. Returns an empty object when the legacy row has
 * no capabilities sub-object so toggles default to `false` (a no-op for
 * the engine, matching the backend normalizer's defaults).
 *
 * NOTE: capabilities is hosted on `WorkflowConfigDTO` since W2-C1 and the
 * mapper now round-trips it (W2-C5). We still read the raw DTO here
 * because the editor maintains capabilities in a separate state slice
 * (`lifecycleCapabilities` / `statusCapabilities`) — see W2-C4's rationale
 * around concurrent toggle merges without touching the workflow graph.
 *
 * Read-side dual-key fallback for status mode: `task_workflow` (Wave 2
 * canonical) → `status_workflow` (Wave 1 legacy) → `statusWorkflow` (older
 * camelCase test fixtures). Cleanup of the legacy keys lands in Wave 3.
 */
function readCapabilities(
  project: Project,
  mode: "lifecycle" | "status",
): Record<string, unknown> {
  const cfg = (project.processConfig ?? null) as ProcessConfigShape | null
  if (!cfg) return {}
  const dto =
    mode === "status"
      ? cfg.task_workflow ?? cfg.statusWorkflow ?? cfg.status_workflow
      : cfg.phase_workflow ?? cfg.workflow
  const caps = (dto as { capabilities?: unknown } | undefined)?.capabilities
  if (!caps || typeof caps !== "object") return {}
  return caps as Record<string, unknown>
}

/**
 * Triage #1 — read the project's task-status workflow if it exists; otherwise
 * synthesize a 4-node default (Yapılacak → Yapılıyor → İncelemede → Bitti) so
 * the canvas has something to render the first time the user enters status
 * mode. The save flow persists whatever shape the user produces back into
 * `processConfig.task_workflow` (Wave 2 W2-C5 canonical; Wave 1 C10 started
 * the rename from the legacy `status_workflow`).
 *
 * Read-side fallback chain: task_workflow → statusWorkflow → status_workflow.
 * Cleanup of the legacy keys deferred to Wave 3.
 */
// Wave 2 follow-up (2026-05-18) — derive status-mode nodes from BoardColumn
// entities. Plan Q1 decision (workflow-engine-design.md §3) is BoardColumn
// yerinde + JSON edges: the source of truth for status-mode nodes is the
// board_columns table, while edges/groups/capabilities live in JSONB.
// Without this derivation, ?mode=status renders an empty canvas because the
// W1-C2 migration seeds task_workflow with {edges:[], groups:[], capabilities}
// — no `nodes` field — so mapWorkflowConfig returned an empty workflow.
function deriveStatusNodesFromColumns(
  boardColumns: { id: number; name: string }[],
): WorkflowNode[] {
  return boardColumns.map((col, idx) => {
    const isFirst = idx === 0
    const isLast = idx === boardColumns.length - 1
    return {
      id: `col_${col.id}`,
      name: col.name,
      x: 60 + idx * 200,
      y: 120,
      color: isFirst
        ? "status-todo"
        : isLast
          ? "status-done"
          : "status-progress",
      isInitial: isFirst || undefined,
      isFinal: isLast || undefined,
    }
  })
}

function readStatusWorkflow(project: Project): WorkflowConfig {
  const cfg = (project.processConfig ?? null) as ProcessConfigShape | null
  const dto = cfg?.task_workflow ?? cfg?.statusWorkflow ?? cfg?.status_workflow

  const hasColumns =
    Array.isArray(project.boardColumns) && project.boardColumns.length > 0

  if (dto) {
    const mapped = mapWorkflowConfig(dto)
    // JSONB carries edges/groups/capabilities; nodes derived from
    // board_columns so renames/reorders made via Settings>Columns show up
    // here without an extra round-trip.
    if (mapped.nodes.length === 0 && hasColumns) {
      return {
        ...mapped,
        nodes: deriveStatusNodesFromColumns(project.boardColumns),
      }
    }
    return mapped
  }

  // No persisted task_workflow at all — derive from columns when available,
  // otherwise fall back to the canned 4-node default so the canvas is never
  // empty.
  if (hasColumns) {
    return {
      mode: "continuous",
      nodes: deriveStatusNodesFromColumns(project.boardColumns),
      edges: [],
      groups: [],
    }
  }
  return DEFAULT_STATUS_WORKFLOW
}

const DEFAULT_STATUS_WORKFLOW: WorkflowConfig = {
  mode: "continuous",
  nodes: [
    {
      id: "nd_status_todo",
      name: "Yapılacak",
      x: 60,
      y: 120,
      color: "status-todo",
      isInitial: true,
    },
    {
      id: "nd_status_prog",
      name: "Yapılıyor",
      x: 240,
      y: 120,
      color: "status-progress",
    },
    {
      id: "nd_status_revw",
      name: "İncelemede",
      x: 420,
      y: 120,
      color: "status-review",
    },
    {
      id: "nd_status_done",
      name: "Bitti",
      x: 600,
      y: 120,
      color: "status-done",
      isFinal: true,
    },
  ],
  edges: [
    { id: "es_1", source: "nd_status_todo", target: "nd_status_prog", type: "flow" },
    { id: "es_2", source: "nd_status_prog", target: "nd_status_revw", type: "flow" },
    { id: "es_3", source: "nd_status_revw", target: "nd_status_done", type: "flow" },
  ],
  groups: [],
}

// Phase 12 Plan 12-10 (Bug X UAT fix) — node-id helpers live in the pure
// module Frontend2/lib/lifecycle/node-ids.ts so they stay unit-testable
// without jsdom and so non-React consumers (criteria-editor-panel inline
// preset apply path) can import them without pulling the editor's React
// tree. See Backend/app/domain/entities/task.py NODE_ID_REGEX for the
// authoritative D-22 contract.

// SaveError shape — mirror of the 5-error matrix from CONTEXT D-32 / UI-SPEC.
interface SaveErrorState {
  kind: "409" | "422" | "rate-limited" | "network"
  detail?: unknown
  countdown?: number
}

export function EditorPage({ project }: EditorPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useApp()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  const canEdit = useTransitionAuthority(project)

  // v3.0 Wave 2 — AI Workflow Modal open/close state. Variant determined by
  // current editor `mode` ("lifecycle" → lifecycle AI, "status" → task_status AI).
  const [aiModalOpen, setAiModalOpen] = React.useState(false)

  // Working-copy workflows. We track lifecycle and status flows
  // independently (triage #1) so switching modes shows the right canvas.
  const initialLifecycle = React.useMemo(() => readWorkflow(project), [project])
  const initialStatus = React.useMemo(
    () => readStatusWorkflow(project),
    [project],
  )
  const [lifecycleWorkflow, setLifecycleWorkflow] =
    React.useState<WorkflowConfig>(initialLifecycle)
  const [statusWorkflow, setStatusWorkflow] =
    React.useState<WorkflowConfig>(initialStatus)

  // Wave 2 W2-C4 — working-copy capabilities, kept in a separate state
  // slice per mode so toggles can flip without dirtying the workflow
  // structure (and vice versa). W2-C5 will lift these into the save
  // payload alongside the workflow snapshot.
  const initialLifecycleCaps = React.useMemo(
    () => readCapabilities(project, "lifecycle"),
    [project],
  )
  const initialStatusCaps = React.useMemo(
    () => readCapabilities(project, "status"),
    [project],
  )
  const [lifecycleCapabilities, setLifecycleCapabilities] =
    React.useState<WorkflowCapabilities>(
      initialLifecycleCaps as WorkflowCapabilities,
    )
  const [statusCapabilities, setStatusCapabilities] =
    React.useState<WorkflowCapabilities>(
      initialStatusCaps as WorkflowCapabilities,
    )

  const [dirty, setDirty] = React.useState(false)
  const [selected, setSelected] = React.useState<{
    type: "node" | "edge" | "group"
    id: string
  } | null>(null)
  // T3b — RF multi-selection (box-select / shift-click) as a flat list of
  // PHASE node ids. `onSelectionChange` is the SINGLE writer; group/align
  // consume it for multi-node ops. `selected` (single) stays the RightPanel +
  // selection-ring model, so this is additive and can't desync the panel.
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(
    null,
  )
  // Plan 12-09 — save flow state.
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<SaveErrorState | null>(null)
  // Plan 12-09 — dirty-save router intercept state.
  const [pendingNavigation, setPendingNavigation] = React.useState<string | null>(
    null,
  )
  // Triage #9 — edge-create flow. null = idle. After the user clicks "Bağlantı"
  // we enter "pick-source", then on first node click we capture the source id
  // and switch to "pick-target". The next node click commits the edge.
  const [edgeCreateState, setEdgeCreateState] = React.useState<
    null | { phase: "pick-source" } | { phase: "pick-target"; sourceId: string }
  >(null)

  const history = useEditorHistory()
  const cycleQuery = useCycleCounters(project.id)
  const cycleMap = React.useMemo(
    () => cycleQuery.data ?? new Map<string, number>(),
    [cycleQuery.data],
  )
  const canvasControlsRef = React.useRef<CanvasControlsHandle | null>(null)

  // Phase 12 Plan 12-10 (Bug 2 UAT fix) — drag-history coalescing refs.
  //
  // Before this fix, every per-frame `position` change React Flow dispatched
  // during a node drag pushed an entry onto the undo stack via commitWorkflow.
  // A single 30-frame drag therefore produced ~30 history entries and required
  // 30 Cmd+Z presses to undo one logical move.
  //
  // The fix: capture the workflow ONCE in onNodeDragStart, suppress per-frame
  // history pushes during the drag, then push the captured snapshot ONCE in
  // onNodeDragStop so a single drag becomes a single undo entry. Position
  // changes during drag still update local state (so the canvas + group cloud
  // hulls live-morph) — they just don't touch the history stack.
  const dragStartSnapshotRef = React.useRef<WorkflowConfig | null>(null)
  const isDraggingRef = React.useRef<boolean>(false)

  const modeRaw = searchParams.get("mode")
  const mode: EditorMode = modeRaw === "status" ? "status" : "lifecycle"

  // Active workflow + setter, derived from `mode`. Mutations route to the
  // matching state slice so the other mode is never accidentally clobbered.
  const workflow = mode === "status" ? statusWorkflow : lifecycleWorkflow
  const setWorkflow = React.useCallback(
    (next: WorkflowConfig | ((prev: WorkflowConfig) => WorkflowConfig)) => {
      if (mode === "status") {
        setStatusWorkflow((prev) =>
          typeof next === "function"
            ? (next as (p: WorkflowConfig) => WorkflowConfig)(prev)
            : next,
        )
      } else {
        setLifecycleWorkflow((prev) =>
          typeof next === "function"
            ? (next as (p: WorkflowConfig) => WorkflowConfig)(prev)
            : next,
        )
      }
    },
    [mode],
  )

  // Triage #3 — feed the project's phase_transition activity into
  // computeNodeStates so the canvas can show real active/past/future
  // colouring (instead of every node defaulting to "default"). Status mode
  // doesn't have transitions yet, so we skip the BFS there.
  const transitionsQuery = useQuery({
    queryKey: ["phase-transitions", project.id],
    queryFn: () => lifecycleService.getPhaseTransitions(project.id),
    enabled: !!project.id && mode === "lifecycle",
  })
  const transitions = React.useMemo(
    () => transitionsQuery.data ?? ([] as PhaseTransitionEntry[]),
    [transitionsQuery.data],
  )

  // BFS-driven node states (EDIT-04 / EDIT-05). Memo dependency excludes
  // position fields — node coordinates do not affect reachability, so we
  // pre-compute a structural signature that ignores x/y. This avoids the
  // BFS re-running on every drag frame, which previously cascaded into
  // rfNodes regeneration and contributed to drag flicker.
  const nodeStateSignature = React.useMemo(
    () =>
      [
        workflow.mode,
        workflow.nodes
          .map(
            (n) =>
              `${n.id}|${n.isInitial ? 1 : 0}|${n.isFinal ? 1 : 0}|${
                n.isArchived ? 1 : 0
              }`,
          )
          .join(","),
        workflow.edges
          .map(
            (e) =>
              `${e.source}>${e.target}|${e.bidirectional ? 1 : 0}|${
                e.type ?? "flow"
              }`,
          )
          .join(","),
      ].join("#"),
    [workflow.mode, workflow.nodes, workflow.edges],
  )
  const nodeStates = React.useMemo(
    () =>
      computeNodeStates({
        workflow: {
          mode: workflow.mode,
          nodes: workflow.nodes,
          edges: workflow.edges,
        },
        phaseTransitions: mode === "lifecycle" ? transitions : [],
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- structural sig replaces the array deps on purpose
    [nodeStateSignature, mode, transitions],
  )

  const handleModeChange = React.useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("mode", next)
      router.replace(`/workflow-editor?${params.toString()}`)
    },
    [router, searchParams],
  )

  // M-W5 — mirror the live workflow in a ref so commitWorkflow always pushes the
  // CURRENT snapshot to history, even when invoked from a deferred/stale closure
  // (a context-menu action fired via setTimeout could otherwise capture a
  // pre-drag `workflow` → undo would jump to the wrong position). useLayoutEffect
  // (not useEffect) keeps the ref fresh before any event handler fires; the ref
  // is StrictMode-safe — no functional state updater, so no double history push.
  const workflowRef = React.useRef(workflow)
  React.useLayoutEffect(() => {
    workflowRef.current = workflow
  }, [workflow])

  // Single mutation entry point — pushes the OLD workflow to the history
  // stack first, then commits the new one + sets dirty=true.
  const commitWorkflow = React.useCallback(
    (next: WorkflowConfig) => {
      history.push(workflowRef.current)
      setWorkflow(next)
      setDirty(true)
    },
    [history, setWorkflow],
  )

  const handleWorkflowChange = React.useCallback(
    (next: WorkflowConfig) => commitWorkflow(next),
    [commitWorkflow],
  )

  // Wave 2 W2-C4 — active capabilities slice for the current mode + a
  // single-field patch handler that the CapabilitiesPanel calls per toggle.
  // We shallow-merge so two concurrent toggle flips don't clobber each
  // other; W2-C5 will serialize this snapshot into the PATCH body.
  //
  // Senior review answer #2 (2026-05-17): capability changes share the
  // workflow history stack; pushing `workflow` here keeps undo behavior
  // consistent without a dedicated history slice.
  const capabilities: WorkflowCapabilities =
    mode === "status" ? statusCapabilities : lifecycleCapabilities
  const handleCapabilitiesChange = React.useCallback(
    (patch: WorkflowCapabilities) => {
      // Bug fix 2026-05-18 — capability toggles do NOT push to the undo
      // stack. The old behavior captured a workflow snapshot before
      // mutating the (separate) capability state; pressing Geri Al
      // therefore restored an unchanged workflow while leaving the
      // capability flipped — a visible-but-meaningless undo entry that
      // confused users. The toggle action is trivially reversible (just
      // re-click), so the undo stack only tracks structural workflow
      // edits (nodes/edges/groups) where Geri Al carries real value.
      if (mode === "status") {
        setStatusCapabilities((prev) => ({ ...prev, ...patch }))
      } else {
        setLifecycleCapabilities((prev) => ({ ...prev, ...patch }))
      }
      setDirty(true)
    },
    [mode],
  )

  // Plan 12-10 Task 2 — preset apply handler. Pushes the current workflow
  // onto the undo stack first (commitWorkflow already does this), then
  // swaps the canvas to a deep-cloned copy of the chosen preset and clears
  // the selection so the right panel does not reference a stale node.
  //
  // Phase 12 Plan 12-10 (Bug X UAT fix) — regenerateInvalidNodeIds is the
  // belt-and-suspenders defense against any future preset that ships with
  // bad IDs. The current presets all pass the regex, but this guard means
  // a stale build / partial revert can never push 422-bait into the canvas.
  const applyPreset = React.useCallback(
    (id: PresetId) => {
      const next = regenerateInvalidNodeIds(resolvePreset(id))
      commitWorkflow(next)
      setSelected(null)
    },
    [commitWorkflow],
  )

  // ---------------------- Inline edit propagation -----------------------

  const renameNode = React.useCallback(
    (nodeId: string, nextName: string) => {
      // Status mode: rename the backing board column too (fire-and-forget).
      if (mode === "status") {
        const colId = colIdFromNodeId(nodeId)
        if (colId !== null) {
          void apiClient
            .patch(`/projects/${project.id}/columns/${colId}`, { name: nextName })
            .then(() => qc.invalidateQueries({ queryKey: ["columns", project.id] }))
            .catch(() => {/* column name will re-sync on next project refresh */})
        }
      }
      commitWorkflow({
        ...workflow,
        nodes: workflow.nodes.map((n) =>
          n.id === nodeId ? { ...n, name: nextName } : n,
        ),
      })
    },
    [mode, project.id, workflow, commitWorkflow, qc],
  )

  const relabelEdge = React.useCallback(
    (edgeId: string, nextLabel: string) => {
      commitWorkflow({
        ...workflow,
        edges: workflow.edges.map((e) =>
          e.id === edgeId ? { ...e, label: nextLabel } : e,
        ),
      })
    },
    [workflow, commitWorkflow],
  )

  // Wave 2 W2-C6 — status-mode BoardColumn engine field PATCH side-effect.
  // SelectionPanel.NodeEditor calls this per-field whenever the user edits
  // category / is_initial / is_terminal / max_duration_days / entry_policy /
  // exit_policy. Fire-and-forget (debounce deferred to Wave 3 per plan
  // §"Risk Notları"). On failure we surface a toast but do NOT roll back the
  // local workflow state — the canvas already updated optimistically via
  // updateNode, and the next ["columns", project.id] invalidation will
  // reconcile from the server if the user navigates away.
  const handleColumnEngineFieldsChange = React.useCallback(
    (columnId: number, patch: ColumnEngineFieldsPatch) => {
      void apiClient
        .patch(`/projects/${project.id}/columns/${columnId}`, patch)
        .then(() => qc.invalidateQueries({ queryKey: ["columns", project.id] }))
        .catch(() => {
          showToast({
            variant: "error",
            message: T(
              "Kolon motor alanı kaydedilemedi",
              "Failed to save column engine field",
            ),
          })
        })
    },
    [project.id, qc, showToast, T],
  )

  // ---------------------- Canvas selection mapping ----------------------

  const setEdgeSelected = React.useCallback(
    (id: string) => setSelected({ type: "edge", id }),
    [],
  )

  // ---------------------- workflow → RFNode/RFEdge ----------------------
  //
  // React Flow controlled-state pattern (https://reactflow.dev/learn/concepts/core-concepts).
  // We keep `rfNodes` / `rfEdges` as React state so RF can apply its own
  // change events (dimensions, position, select, …) via `applyNodeChanges`
  // without us re-deriving the entire array on every drag frame. The
  // workflow object stays as the save-side source of truth; we sync it
  // back from rfNodes only at well-defined boundaries (drag-stop, remove,
  // commit). This eliminates the "node not initialized" warning that fires
  // when RF re-adopts mid-drag and momentarily loses `measured` data.

  // Latest-callback refs — projectRfNodes/projectRfEdges read from these so
  // their identity stays empty-deps stable. Otherwise the projection effects
  // would refire on every render because renameNode/relabelEdge close over
  // workflow + commitWorkflow which churn each render.
  const renameNodeRef = React.useRef(renameNode)
  renameNodeRef.current = renameNode
  const relabelEdgeRef = React.useRef(relabelEdge)
  relabelEdgeRef.current = relabelEdge

  const projectRfNodes = React.useCallback(
    (
      wf: WorkflowConfig,
      sel: typeof selected,
      states: Map<string, string>,
      cycles: Map<string, number>,
      edit: boolean,
    ): RFNode[] => {
      const nodePositions = new Map<string, Point>()
      for (const n of wf.nodes) nodePositions.set(n.id, { x: n.x, y: n.y })
      const out: RFNode[] = []
      for (const g of wf.groups ?? []) {
        const childPositions: Point[] = (g.children ?? [])
          .map((id) => nodePositions.get(id))
          .filter((p): p is Point => p != null)
        if (childPositions.length === 0) continue
        // childPositions are ABSOLUTE; buildGroupCloudData returns a node-local
        // frame (position + local childPositions/hullPath + concrete w/h) so the
        // cloud renders 1:1 with no offset or viewBox distortion (Tema 1 fix).
        const cloud = buildGroupCloudData(childPositions, 16)
        out.push({
          id: g.id,
          type: "group",
          position: cloud.position,
          data: {
            childPositions: cloud.childPositions,
            hullPath: cloud.hullPath,
            width: cloud.width,
            height: cloud.height,
            name: g.name,
            color: g.color,
            selected: sel?.type === "group" && sel.id === g.id,
          },
        } as RFNode)
      }
      for (const n of wf.nodes) {
        const isSel = sel?.type === "node" && sel.id === n.id
        const state = states.get(n.id) ?? "default"
        out.push({
          id: n.id,
          type: "phase",
          // Positions are ABSOLUTE everywhere (hull, group backdrop at minX-32,
          // drag-stop write-back). Do NOT set RF `parentId` here: React Flow
          // would treat a child's position as parent-relative and render it
          // offset far outside the group cloud. Group membership lives in
          // workflow.groups[].children + the data-model n.parentId.
          position: { x: n.x, y: n.y },
          selected: isSel,
          data: {
            name: n.name,
            description: n.description,
            color: n.color,
            isInitial: n.isInitial,
            isFinal: n.isFinal,
            isArchived: n.isArchived,
            wipLimit: n.wipLimit,
            state,
            cycleCount: cycles.get(n.id) ?? 0,
            editMode: edit,
            onNameChange: (next: string) => renameNodeRef.current(n.id, next),
          },
        } as RFNode)
      }
      return out
    },
    [],
  )

  const projectRfEdges = React.useCallback(
    (wf: WorkflowConfig, sel: typeof selected, edit: boolean): RFEdge[] =>
      wf.edges.map(
        (e) =>
          ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle ?? "right-source",
            targetHandle: e.targetHandle ?? "left-target",
            type: "phase",
            selected: sel?.type === "edge" && sel.id === e.id,
            data: {
              type: e.type,
              label: e.label,
              bidirectional: e.bidirectional,
              isAllGate: e.isAllGate,
              editMode: edit,
              onLabelChange: (next: string) => relabelEdgeRef.current(e.id, next),
            },
          }) as RFEdge,
      ),
    [],
  )

  const [rfNodes, setRfNodes] = React.useState<RFNode[]>(() =>
    projectRfNodes(initialLifecycle, null, new Map(), new Map(), canEdit),
  )
  const [rfEdges, setRfEdges] = React.useState<RFEdge[]>(() =>
    projectRfEdges(initialLifecycle, null, canEdit),
  )

  // When this ref is true, the next workflow→rfNodes projection is skipped
  // because rfNodes already reflects the change (e.g., drag-stop wrote
  // positions back from rfNodes to workflow). Skipping prevents a one-frame
  // visual blip from re-adoption with the same data.
  const skipNextProjectRef = React.useRef(false)

  // External-source projection effects. Re-run whenever workflow itself
  // (preset apply, undo, mode switch, structural commit) or visual deps
  // change — but never as a side effect of a per-frame drag.
  React.useEffect(() => {
    if (skipNextProjectRef.current) {
      skipNextProjectRef.current = false
      return
    }
    setRfNodes(projectRfNodes(workflow, selected, nodeStates, cycleMap, canEdit))
  }, [workflow, selected, nodeStates, cycleMap, canEdit, projectRfNodes])

  React.useEffect(() => {
    setRfEdges(projectRfEdges(workflow, selected, canEdit))
  }, [workflow, selected, canEdit, projectRfEdges])

  // -------------------- Editable React Flow callbacks --------------------

  // True when at least one position change came through during the active
  // drag. Used at drag-stop to decide whether to push a history snapshot.
  const movedDuringDragRef = React.useRef(false)

  // onNodesChange — apply RF's deltas to local rfNodes via applyNodeChanges
  // so RF can update its measurements / selection / position bookkeeping.
  // We translate "remove" changes into a workflow commit immediately.
  // "position" changes are NOT propagated to workflow during drag — that
  // sync happens once at drag-stop via handleNodeDragStop. Outside a drag
  // (e.g., position changes from align actions), workflow is committed
  // here so the change becomes part of the undo stack.
  const handleNodesChange = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (changes: any[]) => {
      // 1. Apply RF deltas to local state (always).
      setRfNodes((prev) => {
        let next = applyNodeChanges(changes, prev)
        // Live cloud morph: when phase node positions move, recompute the
        // hull on each affected group node so the cloud follows in real time.
        const movedIds = new Set<string>()
        for (const ch of changes) {
          if (ch.type === "position" && ch.position) {
            movedIds.add(String(ch.id))
          }
        }
        if (movedIds.size > 0) {
          const positions = new Map<string, Point>()
          for (const n of next) {
            if (n.type === "phase") {
              positions.set(n.id, { x: n.position.x, y: n.position.y })
            }
          }
          const groups = workflow.groups ?? []
          next = next.map((n) => {
            if (n.type !== "group") return n
            const g = groups.find((gg) => gg.id === n.id)
            if (!g) return n
            if (!g.children.some((cid) => movedIds.has(cid))) return n
            const childPositions: Point[] = g.children
              .map((cid) => positions.get(cid))
              .filter((p): p is Point => p != null)
            if (childPositions.length === 0) return n
            // Same node-local transform as projectRfNodes. Refresh position too:
            // if the dragged child becomes the new min-corner, the origin shifts,
            // so the cloud must follow (the group node is non-interactive —
            // pointerEvents:none — so this per-frame position write can't fight
            // RF's drag transform, which is driving the phase node, not this one).
            const cloud = buildGroupCloudData(childPositions, 16)
            return {
              ...n,
              position: cloud.position,
              data: {
                ...(n.data ?? {}),
                childPositions: cloud.childPositions,
                hullPath: cloud.hullPath,
                width: cloud.width,
                height: cloud.height,
              },
            } as RFNode
          })
        }
        return next
      })

      // 2. Track drag movement for history.
      if (isDraggingRef.current) {
        for (const ch of changes) {
          if (ch.type === "position" && ch.position) {
            movedDuringDragRef.current = true
            break
          }
        }
      }

      // 3. Outside a drag, propagate position changes to workflow via
      //    commitWorkflow (so undo captures them). Inside a drag, defer.
      let nextWorkflow: WorkflowConfig | null = null
      let needsCommit = false
      for (const ch of changes) {
        if (ch.type === "position" && ch.position && !isDraggingRef.current) {
          const id = String(ch.id ?? "")
          const pos = ch.position as { x: number; y: number }
          if (!nextWorkflow) nextWorkflow = { ...workflow }
          nextWorkflow.nodes = nextWorkflow.nodes.map((n) =>
            n.id === id ? { ...n, x: pos.x, y: pos.y } : n,
          )
          needsCommit = true
        } else if (ch.type === "remove") {
          const id = String(ch.id ?? "")
          if (!nextWorkflow) nextWorkflow = { ...workflow }
          nextWorkflow.nodes = nextWorkflow.nodes.filter((n) => n.id !== id)
          nextWorkflow.edges = nextWorkflow.edges.filter(
            (e) => e.source !== id && e.target !== id,
          )
          nextWorkflow.groups = (nextWorkflow.groups ?? []).map((g) => ({
            ...g,
            children: g.children.filter((cid) => cid !== id),
          }))
          needsCommit = true
        }
      }
      if (needsCommit && nextWorkflow) {
        // Skip the next projection because rfNodes already reflects the
        // change via applyNodeChanges above.
        skipNextProjectRef.current = true
        commitWorkflow(nextWorkflow)
      }
    },
    [workflow, commitWorkflow],
  )

  const handleEdgesChange = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (changes: any[]) => {
      setRfEdges((prev) => applyEdgeChanges(changes, prev))
      let nextWorkflow: WorkflowConfig | null = null
      for (const ch of changes) {
        if (ch.type === "remove") {
          const id = String(ch.id ?? "")
          if (!nextWorkflow) nextWorkflow = { ...workflow }
          nextWorkflow.edges = nextWorkflow.edges.filter((e) => e.id !== id)
        }
      }
      if (nextWorkflow) {
        skipNextProjectRef.current = true
        commitWorkflow(nextWorkflow)
      }
    },
    [workflow, commitWorkflow],
  )

  const handleConnect = React.useCallback(
    (params: Record<string, unknown>) => {
      const source = String(params.source ?? "")
      const target = String(params.target ?? "")
      if (!source || !target || source === target) return
      const sourceHandle =
        params.sourceHandle != null ? String(params.sourceHandle) : undefined
      const targetHandle =
        params.targetHandle != null ? String(params.targetHandle) : undefined
      const newEdge: WorkflowEdge = {
        id: newEdgeId(),
        source,
        target,
        sourceHandle,
        targetHandle,
        type: "flow",
        bidirectional: false,
        isAllGate: false,
      }
      commitWorkflow({ ...workflow, edges: [...workflow.edges, newEdge] })
    },
    [workflow, commitWorkflow],
  )

  // Phase 12 Plan 12-10 (Bug 2 UAT fix) — capture the BEFORE-drag snapshot
  // exactly once when React Flow starts dragging a node (or any node within
  // a multi-select drag). This snapshot becomes the SINGLE history entry
  // pushed in handleNodeDragStop, so a 30-frame drag = 1 undo entry.
  const handleNodeDragStart = React.useCallback(
    (_e: React.MouseEvent, _node: { id: string }) => {
      // Re-entrant safety: don't overwrite an in-progress snapshot if a
      // synthetic event somehow fires twice. The matching DragStop will
      // clear it.
      if (!isDraggingRef.current) {
        dragStartSnapshotRef.current = workflow
        isDraggingRef.current = true
      }
    },
    [workflow],
  )


  // Drop-association policy: if the dragged node was in a parent group and
  // ended outside the group's hull, drop the parentId association. Also
  // commits the (single) history entry for the drag and syncs the final
  // positions from rfNodes into workflow — workflow is left untouched
  // during the drag itself, so this is the one and only sync point.
  const handleNodeDragStop = React.useCallback(
    (_e: React.MouseEvent, node: { id: string; position: { x: number; y: number } }) => {
      const snapshot = dragStartSnapshotRef.current
      const moved = movedDuringDragRef.current
      // Reset drag refs FIRST so any state mutations below take the
      // non-drag path.
      dragStartSnapshotRef.current = null
      isDraggingRef.current = false
      movedDuringDragRef.current = false

      if (!moved) return

      // Read final positions from rfNodes (RF has been mutating them via
      // applyNodeChanges throughout the drag). Multi-select drag may have
      // moved more than one node, so we sync every phase position.
      const finalPositions = new Map<string, { x: number; y: number }>()
      for (const n of rfNodes) {
        if (n.type === "phase") {
          finalPositions.set(n.id, { x: n.position.x, y: n.position.y })
        }
      }

      // Drop-association for the whole drag — OUT (leave a cloud) + IN (enter a
      // cloud) for EVERY moved node. In a multi-select drag, RF moves all
      // selected nodes but reports drag-stop for only one, so membership is
      // resolved for the full selectedIds set (T2c), not just the reported node.
      // The decision is delegated to a pure, order-independent helper (unit-
      // tested in workflow-canvas.test.tsx). It rebuilds each group's hull from
      // ABSOLUTE member positions, so the Tema-1 node-local projection change
      // does not affect it.
      const positions = new Map<string, Point>()
      for (const n of workflow.nodes) {
        positions.set(n.id, finalPositions.get(n.id) ?? { x: n.x, y: n.y })
      }
      // The reported node's authoritative drop point (rfNodes can lag a frame).
      positions.set(node.id, node.position)
      const movedIds =
        selectedIds.includes(node.id) && selectedIds.length > 1
          ? selectedIds
          : [node.id]
      const { strip, join } = computeDragMembershipChanges({
        movedIds,
        positions,
        groups: workflow.groups ?? [],
        parentOf: new Map(workflow.nodes.map((n) => [n.id, n.parentId])),
      })

      const nextNodes = workflow.nodes.map((n) => {
        let updated = n
        const p = finalPositions.get(n.id)
        if (p && (p.x !== n.x || p.y !== n.y)) {
          updated = { ...updated, x: p.x, y: p.y }
        }
        // join wins over strip: leave-A + enter-B reassigns parentId A -> B.
        if (join.has(n.id)) {
          updated = { ...updated, parentId: join.get(n.id) }
        } else if (strip.has(n.id)) {
          updated = { ...updated, parentId: undefined }
        }
        return updated
      })
      let nextGroups = workflow.groups ?? []
      if (strip.size > 0) {
        nextGroups = nextGroups.map((g) => {
          const leaving = [...strip]
            .filter(([, gid]) => gid === g.id)
            .map(([nid]) => nid)
          return leaving.length
            ? { ...g, children: g.children.filter((cid) => !leaving.includes(cid)) }
            : g
        })
      }
      if (join.size > 0) {
        nextGroups = nextGroups.map((g) => {
          const joining = [...join]
            .filter(([, gid]) => gid === g.id)
            .map(([nid]) => nid)
            .filter((nid) => !g.children.includes(nid))
          return joining.length
            ? { ...g, children: [...g.children, ...joining] }
            : g
        })
      }

      // Push the BEFORE snapshot to history first so undo restores it.
      if (snapshot) history.push(snapshot)
      // rfNodes already reflects the final positions — skip the next
      // workflow→rfNodes projection so we don't churn the array identity.
      skipNextProjectRef.current = true
      setWorkflow({ ...workflow, nodes: nextNodes, groups: nextGroups })
      setDirty(true)
    },
    [workflow, history, rfNodes, selectedIds],
  )

  // -------------------- Context menu open helpers ----------------------

  const buildNodeItems = React.useCallback((): ContextMenuItem[] => {
    return [
      { id: "group", label: T("Grupla", "Group") },
      { id: "duplicate", label: T("Çoğalt", "Duplicate"), shortcut: "⌘D" },
      { id: "edit-name", label: T("Adı düzenle", "Edit name") },
      {
        id: "delete",
        label: T("Sil", "Delete"),
        shortcut: "⌫",
        danger: true,
      },
    ]
  }, [T])

  const buildEdgeItems = React.useCallback((): ContextMenuItem[] => {
    return [
      {
        id: "toggle-bidir",
        label: T("Çift yönlü yap/kaldır", "Toggle bidirectional"),
      },
      { id: "toggle-allgate", label: T("Hepsi yap", "Make all-gate") },
      { id: "edit-label", label: T("Etiketi düzenle", "Edit label") },
      { id: "delete", label: T("Sil", "Delete"), danger: true },
    ]
  }, [T])

  const buildGroupItems = React.useCallback((): ContextMenuItem[] => {
    return [
      { id: "ungroup", label: T("Grubu çöz", "Ungroup") },
      { id: "edit-name", label: T("Adı düzenle", "Edit name") },
      { id: "delete", label: T("Sil", "Delete"), danger: true },
    ]
  }, [T])

  const buildCanvasItems = React.useCallback((): ContextMenuItem[] => {
    return [
      { id: "add-node", label: T("Buraya düğüm ekle", "Add node here") },
    ]
  }, [T])

  const handleNodeContextMenu = React.useCallback(
    (e: React.MouseEvent, node: { id: string }) => {
      e.preventDefault()
      // Determine if this is a group or a phase node by looking it up.
      const isGroup = (workflow.groups ?? []).some((g) => g.id === node.id)
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        items: isGroup ? buildGroupItems() : buildNodeItems(),
        target: isGroup
          ? { type: "group", groupId: node.id }
          : { type: "node", nodeId: node.id },
      })
    },
    [workflow.groups, buildGroupItems, buildNodeItems],
  )

  const handleEdgeContextMenu = React.useCallback(
    (e: React.MouseEvent, edge: { id: string }) => {
      e.preventDefault()
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        items: buildEdgeItems(),
        target: { type: "edge", edgeId: edge.id },
      })
    },
    [buildEdgeItems],
  )

  const handlePaneContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const screen = { x: e.clientX, y: e.clientY }
      // M-W1 — the menu anchors at the SCREEN point, but "Add node here" must
      // place the node at the matching FLOW (canvas) point, otherwise pan/zoom
      // offsets it. editor-page is outside the ReactFlowProvider, so convert via
      // the canvas controls bridge (falls back to screen coords if unavailable).
      const flowPos =
        canvasControlsRef.current?.screenToFlowPosition(screen) ?? screen
      setContextMenu({
        position: screen,
        items: buildCanvasItems(),
        target: { type: "canvas", flowPos },
      })
    },
    [buildCanvasItems],
  )

  // -------------------- Bulk + utility actions ------------------------

  const startAddEdge = React.useCallback(() => {
    setEdgeCreateState({ phase: "pick-source" })
    showToast({
      variant: "info",
      message: T("Kaynak düğümü seçin", "Pick a source node"),
    })
  }, [showToast, T])

  const cancelAddEdge = React.useCallback(() => {
    setEdgeCreateState(null)
  }, [])

  const handleNodeClickWithEdgeMode = React.useCallback(
    (nodeId: string) => {
      if (!edgeCreateState) {
        setSelected({ type: "node", id: nodeId })
        return
      }
      if (edgeCreateState.phase === "pick-source") {
        setEdgeCreateState({ phase: "pick-target", sourceId: nodeId })
        showToast({
          variant: "info",
          message: T("Hedef düğümü seçin", "Pick a target node"),
        })
        return
      }
      // pick-target — commit
      const sourceId = edgeCreateState.sourceId
      if (nodeId === sourceId) {
        showToast({
          variant: "warning",
          message: T(
            "Kaynak ve hedef aynı olamaz",
            "Source and target must differ",
          ),
        })
        return
      }
      const newEdge: WorkflowEdge = {
        id: newEdgeId(),
        source: sourceId,
        target: nodeId,
        type: "flow",
        bidirectional: false,
        isAllGate: false,
      }
      commitWorkflow({ ...workflow, edges: [...workflow.edges, newEdge] })
      setEdgeCreateState(null)
      setSelected({ type: "edge", id: newEdge.id })
    },
    [edgeCreateState, workflow, commitWorkflow, showToast, T],
  )

  const addNodeAtPosition = React.useCallback(
    async (pos: Point) => {
      if (mode === "status") {
        // Create a real board column, then add the node with its col_* id.
        try {
          const resp = await apiClient.post<{ id: number; name: string }>(
            `/projects/${project.id}/columns`,
            { name: T("Yeni Kolon", "New Column"), order_index: workflow.nodes.length },
          )
          const newCol = resp.data
          const id = `col_${newCol.id}`
          const newNode: WorkflowNode = {
            id,
            name: newCol.name,
            x: pos.x,
            y: pos.y,
            color: "status-todo",
          }
          commitWorkflow({ ...workflow, nodes: [...workflow.nodes, newNode] })
          setSelected({ type: "node", id })
          qc.invalidateQueries({ queryKey: ["columns", project.id] })
        } catch {
          showToast({ variant: "error", message: T("Kolon eklenemedi", "Could not add column") })
        }
        return
      }
      const id = newNodeId()
      const newNode: WorkflowNode = {
        id,
        name: T("Yeni Düğüm", "New Node"),
        x: pos.x,
        y: pos.y,
        color: "status-todo",
      }
      commitWorkflow({ ...workflow, nodes: [...workflow.nodes, newNode] })
      setSelected({ type: "node", id })
    },
    [mode, project.id, workflow, commitWorkflow, T, qc, showToast],
  )

  const deleteSelection = React.useCallback(async () => {
    if (!selected) return
    if (selected.type === "node") {
      if (mode === "status") {
        const colId = colIdFromNodeId(selected.id)
        if (colId !== null) {
          const otherNodes = workflow.nodes.filter((n) => n.id !== selected.id)
          if (otherNodes.length === 0) {
            showToast({
              variant: "warning",
              message: T("Son kolon silinemez", "Cannot delete the last column"),
            })
            return
          }
          // Move tasks to the nearest other column.
          const moveToColId = otherNodes
            .map((n) => colIdFromNodeId(n.id))
            .find((id): id is number => id !== null)
          if (moveToColId == null) return
          try {
            await apiClient.delete(
              `/projects/${project.id}/columns/${colId}?move_tasks_to_column_id=${moveToColId}`,
            )
            qc.invalidateQueries({ queryKey: ["columns", project.id] })
          } catch {
            showToast({ variant: "error", message: T("Kolon silinemedi", "Could not delete column") })
            return
          }
        }
      }
      commitWorkflow({
        ...workflow,
        nodes: workflow.nodes.filter((n) => n.id !== selected.id),
        edges: workflow.edges.filter(
          (e) => e.source !== selected.id && e.target !== selected.id,
        ),
        groups: (workflow.groups ?? []).map((g) => ({
          ...g,
          children: g.children.filter((cid) => cid !== selected.id),
        })),
      })
    } else if (selected.type === "edge") {
      commitWorkflow({
        ...workflow,
        edges: workflow.edges.filter((e) => e.id !== selected.id),
      })
    } else if (selected.type === "group") {
      commitWorkflow({
        ...workflow,
        groups: (workflow.groups ?? []).filter((g) => g.id !== selected.id),
        nodes: workflow.nodes.map((n) =>
          n.parentId === selected.id ? { ...n, parentId: undefined } : n,
        ),
      })
    }
    setSelected(null)
  }, [selected, mode, project.id, workflow, commitWorkflow, qc, showToast, T])

  const duplicateSelection = React.useCallback(() => {
    if (!selected || selected.type !== "node") return
    const orig = workflow.nodes.find((n) => n.id === selected.id)
    if (!orig) return
    const copy: WorkflowNode = {
      ...orig,
      id: newNodeId(),
      name: `${orig.name} (kopya)`,
      x: orig.x + 32,
      y: orig.y + 32,
      // T2b — drop the inherited parentId: the copy is NOT in the source
      // group's `children`, so a carried-over parentId would dangle (node
      // claims a group that doesn't list it → stale on save, ghost membership).
      // It spawns as a fresh loose node; drag it into a cloud to re-associate.
      parentId: undefined,
    }
    commitWorkflow({ ...workflow, nodes: [...workflow.nodes, copy] })
    setSelected({ type: "node", id: copy.id })
  }, [selected, workflow, commitWorkflow])

  // T3b — single writer for selectedIds. RF reports the full selection (nodes +
  // edges) on every change; we keep only PHASE node ids (group cloud nodes are
  // non-interactive and must not be grouped/aligned). Does NOT touch `selected`
  // — that stays driven by click/context-menu so the RightPanel is unaffected.
  const handleSelectionChange = React.useCallback(
    (params: { nodes: Array<{ id: string; type?: string }> }) => {
      setSelectedIds(
        (params.nodes ?? [])
          .filter((n) => n.type === "phase")
          .map((n) => n.id),
      )
    },
    [],
  )

  const groupSelection = React.useCallback(
    (nodeIds: string[]) => {
      if (nodeIds.length < 1) return
      const id = newGroupId()
      // Pull any pre-existing group memberships out of the source groups
      // first, otherwise the old group keeps a dangling `children` entry and
      // its hull stays sized as if the moved node were still inside (visual
      // ghost on the canvas + stale data on save).
      const idSet = new Set(nodeIds)
      const cleanedGroups = (workflow.groups ?? []).map((g) =>
        g.children.some((cid) => idSet.has(cid))
          ? { ...g, children: g.children.filter((cid) => !idSet.has(cid)) }
          : g,
      )
      cleanedGroups.push({
        id,
        name: T("Yeni Grup", "New Group"),
        color: "primary",
        children: nodeIds,
      })
      // Drop groups that have become empty after pulling their members out.
      // An empty group has no hull and is unreachable from the UI.
      const nextGroups = cleanedGroups.filter((g) => g.children.length > 0)
      commitWorkflow({
        ...workflow,
        groups: nextGroups,
        nodes: workflow.nodes.map((n) =>
          nodeIds.includes(n.id) ? { ...n, parentId: id } : n,
        ),
      })
      setSelected({ type: "group", id })
    },
    [workflow, commitWorkflow, T],
  )

  const ungroup = React.useCallback(
    (groupId: string) => {
      commitWorkflow({
        ...workflow,
        groups: (workflow.groups ?? []).filter((g) => g.id !== groupId),
        nodes: workflow.nodes.map((n) =>
          n.parentId === groupId ? { ...n, parentId: undefined } : n,
        ),
      })
    },
    [workflow, commitWorkflow],
  )

  // Align actions wired to bottom-toolbar Sınıflandır dropdown.
  const handleAlign = React.useCallback(
    (
      action:
        | "distribute-h"
        | "align-top"
        | "align-bottom"
        | "center-v"
        | "center-h",
    ) => {
      // T3b — when 2+ nodes are multi-selected, align just those; otherwise
      // fall back to aligning ALL nodes. This is the intent the original
      // comment described ("Apply to all nodes if no multi-selection") but
      // which was unreachable while multi-selection was structurally impossible.
      const selSet = selectedIds.length >= 2 ? new Set(selectedIds) : null
      const targets: AlignNode[] = workflow.nodes
        .filter((n) => !selSet || selSet.has(n.id))
        .map((n) => ({ id: n.id, x: n.x, y: n.y }))
      if (targets.length < 2) return
      let next: AlignNode[] = targets
      if (action === "distribute-h") next = distributeHorizontal(targets)
      else if (action === "align-top") next = alignTop(targets)
      else if (action === "align-bottom") next = alignBottom(targets)
      else if (action === "center-v") next = centerVertical(targets)
      else if (action === "center-h") next = centerHorizontal(targets)
      const byId = new Map(next.map((n) => [n.id, n]))
      commitWorkflow({
        ...workflow,
        nodes: workflow.nodes.map((n) => {
          const a = byId.get(n.id)
          return a ? { ...n, x: a.x, y: a.y } : n
        }),
      })
    },
    [workflow, commitWorkflow, selectedIds],
  )

  // Context menu action router.
  const handleContextMenuSelect = React.useCallback(
    (id: string) => {
      const cm = contextMenu
      if (!cm) return
      if (cm.target.type === "canvas" && id === "add-node") {
        void addNodeAtPosition(cm.target.flowPos ?? { x: 80, y: 80 })
      } else if (cm.target.type === "node") {
        if (id === "delete") {
          setSelected({ type: "node", id: cm.target.nodeId })
          // Defer one tick so setSelected commits before deleteSelection reads.
          setTimeout(() => void deleteSelection(), 0)
        } else if (id === "duplicate") {
          setSelected({ type: "node", id: cm.target.nodeId })
          setTimeout(() => duplicateSelection(), 0)
        } else if (id === "group") {
          groupSelection([cm.target.nodeId])
        } else if (id === "edit-name") {
          setSelected({ type: "node", id: cm.target.nodeId })
        }
      } else if (cm.target.type === "edge") {
        // Capture the discriminated id locally — TS loses the narrowing
        // when `cm.target` is read inside an inner .map() callback.
        const edgeId = cm.target.edgeId
        if (id === "delete") {
          setSelected({ type: "edge", id: edgeId })
          setTimeout(() => void deleteSelection(), 0)
        } else if (id === "toggle-bidir") {
          commitWorkflow({
            ...workflow,
            edges: workflow.edges.map((e) =>
              e.id === edgeId
                ? { ...e, bidirectional: !e.bidirectional }
                : e,
            ),
          })
        } else if (id === "toggle-allgate") {
          commitWorkflow({
            ...workflow,
            edges: workflow.edges.map((e) =>
              e.id === edgeId
                ? { ...e, isAllGate: !e.isAllGate }
                : e,
            ),
          })
        } else if (id === "edit-label") {
          setSelected({ type: "edge", id: edgeId })
        }
      } else if (cm.target.type === "group") {
        if (id === "ungroup") {
          ungroup(cm.target.groupId)
        } else if (id === "delete") {
          setSelected({ type: "group", id: cm.target.groupId })
          setTimeout(() => void deleteSelection(), 0)
        } else if (id === "edit-name") {
          setSelected({ type: "group", id: cm.target.groupId })
        }
      }
      setContextMenu(null)
    },
    [
      contextMenu,
      addNodeAtPosition,
      deleteSelection,
      duplicateSelection,
      groupSelection,
      ungroup,
      commitWorkflow,
      workflow,
    ],
  )

  // ---------------------- Plan 12-09 save flow ------------------------

  // Reusable save function — covers the full 5-error matrix (200/422/409/429/
  // network) per CONTEXT D-32 + UI-SPEC §725-734.
  const save = React.useCallback(async (): Promise<boolean> => {
    setSaving(true)
    setSaveError(null)
    try {
      const currentPC = (project.processConfig ?? {}) as Record<string, unknown>
      // C10 + Wave 2 W2-C5: emit V2 canonical shape. Drop both legacy keys on
      // write so the persisted document is always V2:
      //   - `workflow` → superseded by `phase_workflow` (Wave 1 C10)
      //   - `status_workflow` → superseded by `task_workflow` (Wave 1 C10
      //     started the rename, W2-C5 completes it on the write side)
      // Read-side fallback for `status_workflow` lives in readStatusWorkflow /
      // readCapabilities + lifecycle-service so projects persisted with the
      // legacy key continue to load. Cleanup of the read fallback is deferred
      // to Wave 3 once all rows are migrated.
      const {
        workflow: _legacyWorkflow,
        status_workflow: _legacyStatusWorkflow,
        ...restPC
      } = currentPC as {
        workflow?: unknown
        status_workflow?: unknown
        [k: string]: unknown
      }
      void _legacyWorkflow
      void _legacyStatusWorkflow

      // Wave 2 W2-C5 — merge the working-copy capability slices INTO the
      // serialized workflow DTOs so toggle changes (W2-C4 CapabilitiesPanel)
      // actually reach the backend. unmapWorkflowConfig already round-trips
      // capabilities that live on the WorkflowConfig (W2-C5 mapper change),
      // but the editor maintains capabilities in a separate state slice (so
      // a toggle flip doesn't force a workflow-graph history entry), so we
      // overlay the live slice here at save time. Spread order matters:
      // putting the capability slice LAST means an in-DTO capabilities sub-
      // object (e.g. unchanged from the persisted shape) is overridden by
      // the live state.
      const lifecycleDto = unmapWorkflowConfig(lifecycleWorkflow)
      const taskDto = unmapWorkflowConfig(statusWorkflow)

      const nextProcessConfig = {
        ...restPC,
        // Serialize camelCase -> snake_case at the wire boundary (Pitfall 21).
        // unmapWorkflowConfig handles bidirectional/is_all_gate, is_initial,
        // is_final, is_archived, parent_id, wip_limit conversions.
        // Triage #1 — persist BOTH lifecycle and task workflows so a user
        // who edited only one mode doesn't lose the other.
        // C10 (Workflow Engine V2): canonical key is `phase_workflow`. Backend
        // still accepts legacy `workflow` (dual-key tolerance in manage_projects.py)
        // but new clients emit V2 only.
        phase_workflow: {
          ...lifecycleDto,
          capabilities: lifecycleCapabilities,
        },
        // Wave 2 W2-C5: canonical task workflow key is `task_workflow`. The
        // backend's normalizer accepts both keys (Wave 1 C10's dual-key
        // tolerance lives in manage_projects.py), but new clients emit the
        // V2 canonical name only. The legacy `status_workflow` key is
        // explicitly dropped from the restPC spread above so the persisted
        // document is always V2-canonical post-save.
        task_workflow: {
          ...taskDto,
          capabilities: statusCapabilities,
        },
      }
      await projectService.updateProcessConfig(project.id, nextProcessConfig)

      // Status mode: sync column order_index from node x-positions so the
      // board column order matches whatever the user arranged in the diagram.
      if (mode === "status") {
        const sortedByX = [...statusWorkflow.nodes]
          .filter((n) => n.id.startsWith("col_"))
          .sort((a, b) => a.x - b.x)
        await Promise.all(
          sortedByX.map((n, i) => {
            const colId = colIdFromNodeId(n.id)
            if (colId === null) return Promise.resolve()
            return apiClient
              .patch(`/projects/${project.id}/columns/${colId}`, { order_index: i })
              .catch(() => {/* order sync is best-effort */})
          }),
        )
        qc.invalidateQueries({ queryKey: ["columns", project.id] })
      }

      // 200 success
      showToast({ variant: "success", message: T("Kaydedildi", "Saved") })
      setDirty(false)
      history.clear()
      qc.invalidateQueries({ queryKey: ["project", project.id] })
      return true
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: unknown } }
      const status = e?.response?.status
      if (status === 422) {
        setSaveError({ kind: "422", detail: e.response?.data })
        showToast({
          variant: "error",
          message: T("Doğrulama hatası", "Validation error"),
        })
      } else if (status === 409) {
        setSaveError({ kind: "409" })
      } else if (status === 429) {
        const data = e.response?.data as
          | { retry_after_seconds?: number }
          | undefined
        const seconds = data?.retry_after_seconds ?? 5
        setSaveError({ kind: "rate-limited", countdown: seconds })
        showToast({
          variant: "warning",
          message: T(
            `${seconds} saniye bekleyin`,
            `Wait ${seconds} seconds`,
          ),
        })
      } else {
        // Network error / 5xx / unknown
        setSaveError({ kind: "network" })
        showToast({
          variant: "error",
          message: T("Bağlantı hatası, tekrar dene", "Connection error, retry"),
        })
      }
      return false
    } finally {
      setSaving(false)
    }
  }, [
    mode,
    project.id,
    project.processConfig,
    lifecycleWorkflow,
    statusWorkflow,
    // Wave 2 W2-C5 — capability slices participate in the PATCH body, so
    // they belong in the dep array. Without these, a save fired from a
    // stale callback closure could send pre-toggle capabilities.
    lifecycleCapabilities,
    statusCapabilities,
    history,
    qc,
    showToast,
    T,
  ])

  // Rate-limit countdown ticker — decrements `countdown` every second; clears
  // saveError when it reaches 0 so the Save button is re-enabled.
  React.useEffect(() => {
    if (saveError?.kind !== "rate-limited") return
    const cur = saveError.countdown ?? 0
    if (cur <= 0) {
      setSaveError(null)
      return
    }
    const t = setTimeout(() => {
      setSaveError((prev) =>
        prev?.kind === "rate-limited"
          ? { ...prev, countdown: (prev.countdown ?? 0) - 1 }
          : prev,
      )
    }, 1000)
    return () => clearTimeout(t)
  }, [saveError])

  // beforeunload guard — browser-controlled message per Pitfall 12. The
  // browser shows its generic "Leave site?" dialog when preventDefault is
  // called and dirty is true. Custom messages are NOT supported by modern
  // browsers (security hardening).
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  // safePush — used by all in-app navigations from the editor. Opens the
  // DirtySaveDialog when dirty is true; bypasses straight to router.push
  // when clean. Next.js 16 does not expose router.events, so the wrapping
  // helper is the only available pattern.
  const safePush = React.useCallback(
    (href: string) => {
      if (dirty) {
        setPendingNavigation(href)
      } else {
        router.push(href)
      }
    },
    [dirty, router],
  )

  // ---------------------- Keyboard shortcuts ---------------------------

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when an input/textarea/contenteditable is focused (inline edits).
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName?.toLowerCase()
        if (
          tag === "input" ||
          tag === "textarea" ||
          target.isContentEditable
        ) {
          return
        }
      }
      // M-W3 — overlays own the keyboard. The AI modal + dirty-save dialog have
      // their own Escape handling, so suppress ALL editor shortcuts while either
      // is open (otherwise Delete/N/etc. would mutate the canvas behind the
      // overlay). The context menu is lighter: only Escape passes, to dismiss it
      // via the Esc handler below.
      if (aiModalOpen || pendingNavigation !== null) {
        return
      }
      if (
        contextMenu !== null &&
        !matchesShortcut(e, KEYBOARD_SHORTCUTS.esc)
      ) {
        return
      }
      // Cmd/Ctrl+S — save (Plan 12-09 wires the actual handler)
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.save)) {
        e.preventDefault()
        if (canEdit && !saving) {
          void save()
        }
        return
      }
      // Cmd/Ctrl+Z — undo
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.undo)) {
        e.preventDefault()
        const prev = history.undo(workflow)
        if (prev) setWorkflow(prev)
        return
      }
      // Cmd/Ctrl+Shift+Z — redo
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.redo)) {
        e.preventDefault()
        const next = history.redo(workflow)
        if (next) setWorkflow(next)
        return
      }
      // N — add node at the canvas center.
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.addNode)) {
        e.preventDefault()
        void addNodeAtPosition({ x: 200 + Math.random() * 80, y: 100 + Math.random() * 60 })
        return
      }
      // Delete / Backspace — remove selection.
      if (
        e.key === "Delete" ||
        (e.key === "Backspace" && !e.metaKey && !e.ctrlKey)
      ) {
        e.preventDefault()
        deleteSelection()
        return
      }
      // Cmd/Ctrl+A — left as a no-op so we don't hijack the browser default
      // outside of inputs. Multi-select is exposed via shift-click; binding
      // a fake "select-all" here only deselects, which is worse than nothing.
      // F — fit view: invoke the canvas controls handle.
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.fit)) {
        e.preventDefault()
        canvasControlsRef.current?.fitView()
        return
      }
      // Esc — deselect + close context menu + cancel edge-create.
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.esc)) {
        e.preventDefault()
        setSelected(null)
        setContextMenu(null)
        cancelAddEdge()
        return
      }
      // Cmd/Ctrl+G — group/ungroup current selection.
      // Triage #19: only fire when there is a meaningful selection. Single
      // node "groups" are useless, so require either an existing group
      // (ungroup) or the selection to be the user's only meaningful target.
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.group)) {
        if (selected?.type === "group") {
          e.preventDefault()
          ungroup(selected.id)
        }
        return
      }
      // Cmd/Ctrl+D — duplicate. Skip when nothing useful is selected.
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.duplicate)) {
        if (selected?.type === "node") {
          e.preventDefault()
          duplicateSelection()
        }
        return
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [
    history,
    workflow,
    addNodeAtPosition,
    deleteSelection,
    selected,
    ungroup,
    groupSelection,
    duplicateSelection,
    canEdit,
    saving,
    save,
    cancelAddEdge,
    setWorkflow,
    aiModalOpen,
    pendingNavigation,
    contextMenu,
  ])

  // Mode SegmentedControl options (TR + EN per UI-SPEC §549-550) — icons
  // mirror the prototype's Flow / Workflow glyphs.
  const MODE_OPTIONS = React.useMemo(
    () => [
      {
        id: "lifecycle",
        label: T("Yaşam Döngüsü", "Lifecycle"),
        icon: <GitBranch size={12} />,
      },
      {
        id: "status",
        label: T("Görev Durumları", "Task Statuses"),
        icon: <Workflow size={12} />,
      },
    ],
    [T],
  )

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 16,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: -0.4,
              color: "var(--fg)",
              margin: 0,
            }}
          >
            {T("İş Akışı Tasarımcısı", "Workflow Designer")}
          </h1>
          <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}>
            <span style={{ fontWeight: 500 }}>{project.name}</span>
            {" · "}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              {project.key}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {dirty && (
            <Badge size="xs" tone="warning">
              {T("Kaydedilmemiş", "Unsaved")}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={14} />}
            onClick={() => safePush(`/projects/${project.id}`)}
          >
            {T("Geri", "Back")}
          </Button>
          <Tooltip
            text={
              !canEdit
                ? T(
                    "Düzenleme yetkiniz yok.",
                    "You don't have edit permission.",
                  )
                : saveError?.kind === "rate-limited" && saveError.countdown
                ? T(
                    `${saveError.countdown} saniye bekleyin`,
                    `Wait ${saveError.countdown} seconds`,
                  )
                : T("Kaydet", "Save")
            }
          >
            <Button
              variant="primary"
              size="sm"
              icon={<Save size={14} />}
              disabled={
                !canEdit ||
                saving ||
                (saveError?.kind === "rate-limited" &&
                  (saveError.countdown ?? 0) > 0)
              }
              onClick={() => {
                void save()
              }}
            >
              {saving ? T("Kaydediliyor…", "Saving…") : T("Kaydet", "Save")}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Edge-create guidance banner (triage #9). */}
      {edgeCreateState ? (
        <AlertBanner
          tone="info"
          action={
            <Button variant="ghost" size="sm" onClick={cancelAddEdge}>
              {T("İptal", "Cancel")}
            </Button>
          }
        >
          {edgeCreateState.phase === "pick-source"
            ? T("Kaynak düğümü seçin (Esc iptal eder).", "Pick a source node (Esc to cancel).")
            : T("Hedef düğümü seçin (Esc iptal eder).", "Pick a target node (Esc to cancel).")}
        </AlertBanner>
      ) : null}

      {/* Plan 12-09 — concurrent-edit (409) AlertBanner */}
      {saveError?.kind === "409" && (
        <AlertBanner
          tone="warning"
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                qc.invalidateQueries({ queryKey: ["project", project.id] })
                setSaveError(null)
              }}
            >
              {T("Yenile", "Refresh")}
            </Button>
          }
        >
          {T(
            "Başka bir kullanıcı aynı anda değiştirdi. Yenileyin.",
            "Another user edited concurrently. Refresh.",
          )}
        </AlertBanner>
      )}

      {/* Top toolbar — mode + template + undo/redo + zoom */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          background: "var(--surface)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "inset 0 0 0 1px var(--border)",
        }}
      >
        <SegmentedControl
          options={MODE_OPTIONS}
          value={mode}
          onChange={handleModeChange}
          size="sm"
        />
        {mode === "lifecycle" && (
          <>
            <span
              style={{ height: 18, width: 1, background: "var(--border)" }}
              aria-hidden
            />
            {/* Lifecycle preset'leri (Scrum, Waterfall, V-Model, vb.) yalnızca
                lifecycle modunda anlamlı. Status modunda task-status flow'a
                yüklenmesi semantic olarak yanlış olur (preset'lerin hepsi
                proje yaşam döngüsü, kanban status'u değil). */}
            <PresetMenu
              currentPresetId={detectCurrentPresetId(workflow)}
              dirty={dirty}
              onApply={applyPreset}
            />
          </>
        )}
        <div style={{ flex: 1 }} />
        <Button
          variant="ghost"
          size="sm"
          icon={<Undo2 size={14} />}
          disabled={!history.canUndo}
          onClick={() => {
            const prev = history.undo(workflow)
            if (prev) setWorkflow(prev)
          }}
          title={T("Geri Al", "Undo")}
        >
          {T("Geri Al", "Undo")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Redo2 size={14} />}
          disabled={!history.canRedo}
          onClick={() => {
            const next = history.redo(workflow)
            if (next) setWorkflow(next)
          }}
          title={T("Yinele", "Redo")}
        >
          {T("Yinele", "Redo")}
        </Button>
        <span
          style={{ height: 18, width: 1, background: "var(--border)" }}
          aria-hidden
        />
        <Button
          variant="ghost"
          size="icon"
          icon={<Minus size={14} />}
          onClick={() => canvasControlsRef.current?.zoomOut()}
          title={T("Uzaklaştır", "Zoom out")}
          aria-label={T("Uzaklaştır", "Zoom out")}
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-muted)",
            minWidth: 36,
            textAlign: "center",
          }}
        >
          100%
        </span>
        <Button
          variant="ghost"
          size="icon"
          icon={<Plus size={14} />}
          onClick={() => canvasControlsRef.current?.zoomIn()}
          title={T("Yakınlaştır", "Zoom in")}
          aria-label={T("Yakınlaştır", "Zoom in")}
        />
        <Button
          variant="ghost"
          size="icon"
          icon={<Maximize size={14} />}
          onClick={() => canvasControlsRef.current?.fitView()}
          title={T("Ekrana sığdır", "Fit view")}
          aria-label={T("Ekrana sığdır", "Fit view")}
        />
      </div>

      {/* Body row: canvas + right panel (prototype: grid 1fr 320px under
          a single inset-border + radius envelope, no extra background).
          gridTemplateRows: "minmax(0, 1fr)" pins the single row to the
          parent flex height so RightPanel cannot grow with its content
          and push the canvas off-screen (2026-05-18 UX fix). */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gridTemplateRows: "minmax(0, 1fr)",
          gap: 0,
          flex: 1,
          minHeight: 0,
          borderRadius: "var(--radius)",
          boxShadow: "inset 0 0 0 1px var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            position: "relative",
            minWidth: 0,
            display: "flex",
          }}
        >
          <ModeBanner mode={workflow.mode} />
          <WorkflowCanvas
            nodes={rfNodes as never}
            edges={rfEdges as never}
            readOnly={!canEdit}
            showMiniMap
            controlsRef={canvasControlsRef}
            onNodeClick={(_e, node) =>
              handleNodeClickWithEdgeMode(String(node.id))
            }
            onEdgeClick={(_e, edge) =>
              setEdgeSelected(String(edge.id))
            }
            onNodesChange={handleNodesChange as never}
            onEdgesChange={handleEdgesChange as never}
            onConnect={handleConnect as never}
            onNodeDragStart={handleNodeDragStart as never}
            onNodeDragStop={handleNodeDragStop as never}
            onPaneContextMenu={handlePaneContextMenu as never}
            onNodeContextMenu={handleNodeContextMenu as never}
            onEdgeContextMenu={handleEdgeContextMenu as never}
            onPaneClick={() => {
              // T3a — empty-canvas click clears all transient selection state
              // so the RightPanel + selection ring don't linger on a phantom
              // target (and an in-progress edge-create is cancelled).
              setSelected(null)
              setContextMenu(null)
              setEdgeCreateState(null)
            }}
            onSelectionChange={handleSelectionChange}
          />
          <BottomToolbar
            onAddNode={() =>
              void addNodeAtPosition({ x: 80 + Math.random() * 200, y: 80 + Math.random() * 100 })
            }
            onAddEdge={startAddEdge}
            onGroup={() => {
              // T3b — a selected GROUP ungroups; otherwise group the multi-
              // selection (selectedIds) when present, falling back to the single
              // selected node. Lets box-select → Group bundle every picked node.
              if (selected?.type === "group") {
                ungroup(selected.id)
              } else if (selectedIds.length >= 1) {
                groupSelection(selectedIds)
              } else if (selected?.type === "node") {
                groupSelection([selected.id])
              }
            }}
            onAlign={handleAlign}
            onAISuggest={canEdit ? () => setAiModalOpen(true) : undefined}
          />
          <ContextMenu
            open={contextMenu !== null}
            position={contextMenu?.position ?? { x: 0, y: 0 }}
            items={contextMenu?.items ?? []}
            onSelect={handleContextMenuSelect}
            onClose={() => setContextMenu(null)}
          />
        </div>
        <RightPanel
          workflow={workflow}
          selected={selected}
          onWorkflowChange={handleWorkflowChange}
          editorMode={mode}
          capabilities={capabilities}
          onCapabilitiesChange={handleCapabilitiesChange}
          canEdit={canEdit}
          onColumnEngineFieldsChange={handleColumnEngineFieldsChange}
        />
      </div>

      {/* Plan 12-09 — DirtySaveDialog (router intercept). beforeunload handles
          tab close / refresh in a separate effect with browser-controlled UI. */}
      <DirtySaveDialog
        open={pendingNavigation !== null}
        saving={saving}
        onCancel={() => setPendingNavigation(null)}
        onDiscard={() => {
          setDirty(false)
          if (pendingNavigation) router.push(pendingNavigation)
          setPendingNavigation(null)
        }}
        onSaveAndLeave={async () => {
          const ok = await save()
          if (ok && pendingNavigation) {
            router.push(pendingNavigation)
            setPendingNavigation(null)
          }
        }}
      />

      {/* v3.0 Wave 2 — AI Workflow Modal. Variant follows current editor mode. */}
      <AIWorkflowModal
        open={aiModalOpen}
        variant={mode === "status" ? "task_status" : "lifecycle"}
        contextLabel={project.name}
        existingNodeCount={workflow.nodes.length}
        projectId={project.id}
        existingProcessConfig={(project.processConfig ?? {}) as Record<string, unknown>}
        onClose={() => setAiModalOpen(false)}
        onApplied={({ mode: applyMode, appliedProjectId, isNewProject }) => {
          // Wave 5 — refresh project query so the editor canvas re-renders
          // with the new workflow shape.
          qc.invalidateQueries({ queryKey: ["project", appliedProjectId] })
          qc.invalidateQueries({ queryKey: ["projects"] })

          setAiModalOpen(false)

          if (isNewProject) {
            showToast({
              variant: "success",
              message: T(
                `Yeni proje açıldı: "${project.name} (AI önerisi)"`,
                `New project created: "${project.name} (AI suggestion)"`,
              ),
            })
            // Navigate to the new project's workflow editor — push triggers
            // a fresh mount of EditorPage so local workflow state is reset
            // from the new project's payload.
            router.push(`/workflow-editor?projectId=${appliedProjectId}&mode=${mode}`)
          } else {
            showToast({
              variant: "success",
              message: T("AI workflow uygulandı.", "AI workflow applied."),
            })
            // EditorPage holds workflow in local React state (initialLifecycle)
            // so drag-stop positions survive across re-renders. Cache
            // invalidation refetches the project but EditorPage doesn't
            // re-derive its working copy from the new data. Cleanest reset:
            // a hard reload. Done after a tiny delay so the toast is visible.
            window.setTimeout(() => {
              window.location.reload()
            }, 800)
          }
          // applyMode currently only differentiates the toast copy; both
          // success paths invalidate the project query identically.
          void applyMode
        }}
      />
    </div>
  )
}
