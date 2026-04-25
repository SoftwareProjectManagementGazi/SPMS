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
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Copy, Save, Undo2, Redo2 } from "lucide-react"

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
  computeHull,
  type Point,
} from "@/lib/lifecycle/cloud-hull"
import { projectService, type Project } from "@/services/project-service"
import {
  mapWorkflowConfig,
  unmapWorkflowConfig,
  type WorkflowConfig,
  type WorkflowConfigDTO,
  type WorkflowEdge,
  type WorkflowNode,
} from "@/services/lifecycle-service"

import { WorkflowCanvas } from "./workflow-canvas"
import { RightPanel } from "./right-panel"
import { BottomToolbar } from "./bottom-toolbar"
import { ModeBanner } from "./mode-banner"
import { MinimapWrapper } from "./minimap-wrapper"
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

export interface EditorPageProps {
  project: Project
}

interface ProcessConfigShape {
  workflow?: WorkflowConfigDTO
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
  if (!cfg || !cfg.workflow) {
    return { mode: "flexible", nodes: [], edges: [], groups: [] }
  }
  return mapWorkflowConfig(cfg.workflow)
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

  // Working-copy workflow + dirty flag.
  const initialWorkflow = React.useMemo(() => readWorkflow(project), [project])
  const [workflow, setWorkflow] = React.useState<WorkflowConfig>(initialWorkflow)
  const [dirty, setDirty] = React.useState(false)
  const [selected, setSelected] = React.useState<{
    type: "node" | "edge" | "group"
    id: string
  } | null>(null)
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

  const history = useEditorHistory()
  const cycleQuery = useCycleCounters(project.id)
  const cycleMap: Map<string, number> = cycleQuery.data ?? new Map()

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

  // BFS-driven node states (EDIT-04 / EDIT-05) — empty transitions list for
  // the editor (transitions are read by LifecycleTab; Editor focuses on
  // structural state). Plan 12-09 may inject phase_transitions for parity.
  const nodeStates = React.useMemo(
    () =>
      computeNodeStates({
        workflow: {
          mode: workflow.mode,
          nodes: workflow.nodes,
          edges: workflow.edges,
        },
        phaseTransitions: [],
      }),
    [workflow.mode, workflow.nodes, workflow.edges],
  )

  const modeRaw = searchParams.get("mode")
  const mode: EditorMode = modeRaw === "status" ? "status" : "lifecycle"

  const handleModeChange = React.useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("mode", next)
      router.replace(`/workflow-editor?${params.toString()}`)
    },
    [router, searchParams],
  )

  // Single mutation entry point — pushes the OLD workflow to the history
  // stack first, then commits the new one + sets dirty=true.
  const commitWorkflow = React.useCallback(
    (next: WorkflowConfig) => {
      history.push(workflow)
      setWorkflow(next)
      setDirty(true)
    },
    [history, workflow],
  )

  const handleWorkflowChange = React.useCallback(
    (next: WorkflowConfig) => commitWorkflow(next),
    [commitWorkflow],
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
      commitWorkflow({
        ...workflow,
        nodes: workflow.nodes.map((n) =>
          n.id === nodeId ? { ...n, name: nextName } : n,
        ),
      })
    },
    [workflow, commitWorkflow],
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

  // ---------------------- Canvas selection mapping ----------------------

  const setNodeSelected = React.useCallback(
    (id: string) => setSelected({ type: "node", id }),
    [],
  )
  const setEdgeSelected = React.useCallback(
    (id: string) => setSelected({ type: "edge", id }),
    [],
  )

  // ---------------------- workflow → RFNode/RFEdge ----------------------

  const rfNodes = React.useMemo(() => {
    const groupChildren = new Map<string, string[]>()
    for (const g of workflow.groups ?? []) {
      groupChildren.set(g.id, g.children ?? [])
    }
    const nodePositions = new Map<string, Point>()
    for (const n of workflow.nodes) {
      nodePositions.set(n.id, { x: n.x, y: n.y })
    }
    const out: Array<{
      id: string
      type: string
      position: { x: number; y: number }
      data: Record<string, unknown>
      selected?: boolean
      parentId?: string
    }> = []

    // Group nodes first so React Flow renders them as backdrops.
    for (const g of workflow.groups ?? []) {
      const childPositions: Point[] = (g.children ?? [])
        .map((id) => nodePositions.get(id))
        .filter((p): p is Point => p != null)
      if (childPositions.length === 0) continue
      const minX = Math.min(...childPositions.map((p) => p.x))
      const minY = Math.min(...childPositions.map((p) => p.y))
      out.push({
        id: g.id,
        type: "group",
        position: { x: minX - 32, y: minY - 32 },
        data: {
          childPositions,
          hullPath: computeHull(childPositions, 16),
          name: g.name,
          color: g.color,
          selected: selected?.type === "group" && selected.id === g.id,
        },
      })
    }
    for (const n of workflow.nodes) {
      const isSel = selected?.type === "node" && selected.id === n.id
      const state = nodeStates.get(n.id) ?? "default"
      out.push({
        id: n.id,
        type: "phase",
        position: { x: n.x, y: n.y },
        parentId: n.parentId,
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
          cycleCount: cycleMap.get(n.id) ?? 0,
          editMode: canEdit,
          onNameChange: (next: string) => renameNode(n.id, next),
        },
      })
    }
    return out
    // groupChildren omitted from deps — only used inside the loop above
    // and reflects workflow.groups directly.
  }, [
    workflow.nodes,
    workflow.groups,
    nodeStates,
    cycleMap,
    canEdit,
    selected,
    renameNode,
  ])

  const rfEdges = React.useMemo(() => {
    return workflow.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "phase",
      selected: selected?.type === "edge" && selected.id === e.id,
      data: {
        type: e.type,
        label: e.label,
        bidirectional: e.bidirectional,
        isAllGate: e.isAllGate,
        editMode: canEdit,
        onLabelChange: (next: string) => relabelEdge(e.id, next),
      },
    }))
  }, [workflow.edges, selected, canEdit, relabelEdge])

  // -------------------- Editable React Flow callbacks --------------------

  // onNodesChange/onEdgesChange — accept React Flow's deltas and apply them.
  // We translate position changes into workflow.nodes mutations; selection
  // changes into selected state. Add/remove changes are forwarded through.
  //
  // Phase 12 Plan 12-10 (Bug 2 UAT fix) — coalesce per-frame drag positions
  // into a single history entry. While `isDraggingRef.current === true`,
  // position changes update local state via setWorkflow directly (no
  // history push). The single push happens in onNodeDragStop using the
  // snapshot captured by onNodeDragStart. Non-position changes (e.g.,
  // remove) still flow through commitWorkflow to keep their history entry.
  const handleNodesChange = React.useCallback(
    (changes: Array<Record<string, unknown>>) => {
      let positionOnly = true
      let nextWorkflow: WorkflowConfig | null = null
      for (const ch of changes) {
        if (ch.type === "position" && ch.position) {
          const id = String(ch.id ?? "")
          const pos = ch.position as { x: number; y: number }
          if (!nextWorkflow) nextWorkflow = { ...workflow }
          nextWorkflow.nodes = nextWorkflow.nodes.map((n) =>
            n.id === id ? { ...n, x: pos.x, y: pos.y } : n,
          )
        } else if (ch.type === "remove") {
          positionOnly = false
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
        }
      }
      if (!nextWorkflow) return
      // While a drag is in progress AND every change in this batch is a
      // pure position delta, bypass history.push by writing local state
      // directly. The `setDirty(true)` is preserved so the toolbar Badge
      // and dirty-save guard still see uncommitted work.
      if (isDraggingRef.current && positionOnly) {
        setWorkflow(nextWorkflow)
        setDirty(true)
        return
      }
      commitWorkflow(nextWorkflow)
    },
    [workflow, commitWorkflow],
  )

  const handleEdgesChange = React.useCallback(
    (changes: Array<Record<string, unknown>>) => {
      let nextWorkflow: WorkflowConfig | null = null
      for (const ch of changes) {
        if (ch.type === "remove") {
          const id = String(ch.id ?? "")
          if (!nextWorkflow) nextWorkflow = { ...workflow }
          nextWorkflow.edges = nextWorkflow.edges.filter((e) => e.id !== id)
        }
      }
      if (nextWorkflow) commitWorkflow(nextWorkflow)
    },
    [workflow, commitWorkflow],
  )

  const handleConnect = React.useCallback(
    (params: Record<string, unknown>) => {
      const source = String(params.source ?? "")
      const target = String(params.target ?? "")
      if (!source || !target || source === target) return
      const newEdge: WorkflowEdge = {
        id: newEdgeId(),
        source,
        target,
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

  // Live cloud morph during drag — NO debounce per CONTEXT D-23.
  const handleNodeDrag = React.useCallback(
    (_e: React.MouseEvent, node: { id: string; position: { x: number; y: number } }) => {
      // Find the parent group(s) whose children include the dragged node.
      const groups = workflow.groups ?? []
      const affected = groups.filter((g) => g.children.includes(node.id))
      if (affected.length === 0) return
      // Update the node's position in our local state immediately so the
      // hull recompute sees the new layout. We don't push to history per
      // frame — only on drag stop (handleNodesChange already routes
      // position-only batches around commitWorkflow during a drag).
      setWorkflow((prev) => {
        return {
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === node.id
              ? { ...n, x: node.position.x, y: node.position.y }
              : n,
          ),
        }
      })
    },
    [workflow.groups],
  )

  // Drop-association policy: if the dragged node was in a parent group and
  // ended outside the group's hull, drop the parentId association.
  //
  // Phase 12 Plan 12-10 (Bug 2 UAT fix) — also responsible for committing
  // the SINGLE history entry for the entire drag using the snapshot taken
  // by handleNodeDragStart. The drop-association branch may further
  // mutate the workflow; in that case we run history.push BEFORE the
  // mutation so the snapshot points to the original pre-drag state.
  const handleNodeDragStop = React.useCallback(
    (_e: React.MouseEvent, node: { id: string; position: { x: number; y: number } }) => {
      const snapshot = dragStartSnapshotRef.current
      // Reset drag refs FIRST so any state mutations below take the
      // non-drag (commitWorkflow → history.push) path.
      dragStartSnapshotRef.current = null
      isDraggingRef.current = false

      // Push the single history entry for the whole drag, only when the
      // node actually moved (skips no-op clicks / cancel-drags).
      if (snapshot) {
        const beforeNode = snapshot.nodes.find((n) => n.id === node.id)
        const afterNode = workflow.nodes.find((n) => n.id === node.id)
        const moved =
          beforeNode &&
          afterNode &&
          (beforeNode.x !== afterNode.x || beforeNode.y !== afterNode.y)
        if (moved) {
          history.push(snapshot)
          setDirty(true)
        }
      }

      const movedNode = workflow.nodes.find((n) => n.id === node.id)
      if (!movedNode || !movedNode.parentId) return
      const parentGroup = (workflow.groups ?? []).find(
        (g) => g.id === movedNode.parentId,
      )
      if (!parentGroup) return
      const childPositions = parentGroup.children
        .filter((cid) => cid !== node.id)
        .map((cid) => {
          const n = workflow.nodes.find((m) => m.id === cid)
          return n ? { x: n.x, y: n.y } : null
        })
        .filter((p): p is Point => p != null)
      // If hull would be empty (single child), drop the association too.
      if (childPositions.length < 2) {
        // We just pushed the move-only snapshot to history above; for the
        // additional drop-association mutation, write directly to state so
        // a *single* drag still produces *one* undo entry.
        setWorkflow({
          ...workflow,
          nodes: workflow.nodes.map((n) =>
            n.id === node.id ? { ...n, parentId: undefined } : n,
          ),
        })
        setDirty(true)
        return
      }
      // We don't compute precise point-in-polygon here — drop association
      // when the new position is more than 64px from the parent group's
      // child centroid. This keeps Plan 12-08 simple; Plan 12-10's perf
      // pass can swap in the polygon helper if needed.
      const cx =
        childPositions.reduce((s, p) => s + p.x, 0) / childPositions.length
      const cy =
        childPositions.reduce((s, p) => s + p.y, 0) / childPositions.length
      const dx = node.position.x - cx
      const dy = node.position.y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 240) {
        setWorkflow({
          ...workflow,
          nodes: workflow.nodes.map((n) =>
            n.id === node.id ? { ...n, parentId: undefined } : n,
          ),
          groups: (workflow.groups ?? []).map((g) =>
            g.id === parentGroup.id
              ? { ...g, children: g.children.filter((cid) => cid !== node.id) }
              : g,
          ),
        })
        setDirty(true)
      }
    },
    [workflow, history],
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
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        items: buildCanvasItems(),
        target: { type: "canvas", flowPos: { x: e.clientX, y: e.clientY } },
      })
    },
    [buildCanvasItems],
  )

  // -------------------- Bulk + utility actions ------------------------

  const addNodeAtPosition = React.useCallback(
    (pos: Point) => {
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
    [workflow, commitWorkflow, T],
  )

  const deleteSelection = React.useCallback(() => {
    if (!selected) return
    if (selected.type === "node") {
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
  }, [selected, workflow, commitWorkflow])

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
    }
    commitWorkflow({ ...workflow, nodes: [...workflow.nodes, copy] })
    setSelected({ type: "node", id: copy.id })
  }, [selected, workflow, commitWorkflow])

  const groupSelection = React.useCallback(
    (nodeIds: string[]) => {
      if (nodeIds.length < 1) return
      const id = newGroupId()
      const groups = [...(workflow.groups ?? [])]
      groups.push({
        id,
        name: T("Yeni Grup", "New Group"),
        color: "primary",
        children: nodeIds,
      })
      commitWorkflow({
        ...workflow,
        groups,
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
      // Apply to all nodes if no multi-selection. Single-selected node alone
      // is a no-op for align actions.
      const targets: AlignNode[] = workflow.nodes.map((n) => ({
        id: n.id,
        x: n.x,
        y: n.y,
      }))
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
    [workflow, commitWorkflow],
  )

  // Context menu action router.
  const handleContextMenuSelect = React.useCallback(
    (id: string) => {
      const cm = contextMenu
      if (!cm) return
      if (cm.target.type === "canvas" && id === "add-node") {
        addNodeAtPosition(cm.target.flowPos ?? { x: 80, y: 80 })
      } else if (cm.target.type === "node") {
        if (id === "delete") {
          setSelected({ type: "node", id: cm.target.nodeId })
          // Defer one tick so setSelected commits before deleteSelection reads.
          setTimeout(() => deleteSelection(), 0)
        } else if (id === "duplicate") {
          setSelected({ type: "node", id: cm.target.nodeId })
          setTimeout(() => duplicateSelection(), 0)
        } else if (id === "group") {
          groupSelection([cm.target.nodeId])
        } else if (id === "edit-name") {
          setSelected({ type: "node", id: cm.target.nodeId })
        }
      } else if (cm.target.type === "edge") {
        if (id === "delete") {
          setSelected({ type: "edge", id: cm.target.edgeId })
          setTimeout(() => deleteSelection(), 0)
        } else if (id === "toggle-bidir") {
          commitWorkflow({
            ...workflow,
            edges: workflow.edges.map((e) =>
              e.id === cm.target.edgeId
                ? { ...e, bidirectional: !e.bidirectional }
                : e,
            ),
          })
        } else if (id === "toggle-allgate") {
          commitWorkflow({
            ...workflow,
            edges: workflow.edges.map((e) =>
              e.id === cm.target.edgeId
                ? { ...e, isAllGate: !e.isAllGate }
                : e,
            ),
          })
        } else if (id === "edit-label") {
          setSelected({ type: "edge", id: cm.target.edgeId })
        }
      } else if (cm.target.type === "group") {
        if (id === "ungroup") {
          ungroup(cm.target.groupId)
        } else if (id === "delete") {
          setSelected({ type: "group", id: cm.target.groupId })
          setTimeout(() => deleteSelection(), 0)
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
      const nextProcessConfig = {
        ...currentPC,
        // Serialize camelCase -> snake_case at the wire boundary (Pitfall 21).
        // unmapWorkflowConfig handles bidirectional/is_all_gate, is_initial,
        // is_final, is_archived, parent_id, wip_limit conversions.
        workflow: unmapWorkflowConfig(workflow),
      }
      await projectService.updateProcessConfig(project.id, nextProcessConfig)
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
  }, [project.id, project.processConfig, workflow, history, qc, showToast, T])

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
        addNodeAtPosition({ x: 200 + Math.random() * 80, y: 100 + Math.random() * 60 })
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
      // Cmd/Ctrl+A — select all (we set selected to null since multi-select
      // tracking is React Flow internal; future Plan 12-10 may expose it).
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.selectAll)) {
        e.preventDefault()
        return
      }
      // F — fit view (handled by React Flow internally; we just preventDefault).
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.fit)) {
        e.preventDefault()
        return
      }
      // Esc — deselect + close context menu.
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.esc)) {
        e.preventDefault()
        setSelected(null)
        setContextMenu(null)
        return
      }
      // Cmd/Ctrl+G — group/ungroup current selection.
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.group)) {
        e.preventDefault()
        if (selected?.type === "group") {
          ungroup(selected.id)
        } else if (selected?.type === "node") {
          groupSelection([selected.id])
        }
        return
      }
      // Cmd/Ctrl+D — duplicate current selection.
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.duplicate)) {
        e.preventDefault()
        duplicateSelection()
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
  ])

  // Mode SegmentedControl options (TR + EN per UI-SPEC §549-550)
  const MODE_OPTIONS = React.useMemo(
    () => [
      { id: "lifecycle", label: T("Yaşam Döngüsü", "Lifecycle") },
      { id: "status", label: T("Görev Durumları", "Task Statuses") },
    ],
    [T],
  )

  return (
    <div
      style={{
        padding: 24,
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
          <Button
            variant="ghost"
            size="sm"
            icon={<Copy size={14} />}
            disabled
            title={T("Çoğalt — yakında", "Duplicate — soon")}
          >
            {T("Çoğalt", "Duplicate")}
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
        <span
          style={{ height: 18, width: 1, background: "var(--border)" }}
          aria-hidden
        />
        <PresetMenu
          currentPresetId={detectCurrentPresetId(workflow)}
          dirty={dirty}
          onApply={applyPreset}
        />
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
      </div>

      {/* Body row: canvas + right panel */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          borderRadius: "var(--radius)",
          boxShadow: "inset 0 0 0 1px var(--border)",
          background: "var(--surface)",
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
            showMiniMap={false}
            onNodeClick={(_e, node) =>
              setNodeSelected(String(node.id))
            }
            onEdgeClick={(_e, edge) =>
              setEdgeSelected(String(edge.id))
            }
            onNodesChange={handleNodesChange as never}
            onEdgesChange={handleEdgesChange as never}
            onConnect={handleConnect as never}
            onNodeDragStart={handleNodeDragStart as never}
            onNodeDrag={handleNodeDrag as never}
            onNodeDragStop={handleNodeDragStop as never}
            onPaneContextMenu={handlePaneContextMenu as never}
            onNodeContextMenu={handleNodeContextMenu as never}
            onEdgeContextMenu={handleEdgeContextMenu as never}
          />
          <BottomToolbar
            onAddNode={() =>
              addNodeAtPosition({ x: 80 + Math.random() * 200, y: 80 + Math.random() * 100 })
            }
            onGroup={() => {
              if (selected?.type === "node") {
                groupSelection([selected.id])
              } else if (selected?.type === "group") {
                ungroup(selected.id)
              }
            }}
            onAlign={handleAlign}
          />
          <MinimapWrapper />
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
    </div>
  )
}
