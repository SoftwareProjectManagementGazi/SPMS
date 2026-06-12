"use client"

// Canvas editor for ProcessTemplate lifecycle workflows — edits
// process_templates.default_workflow via PATCH /process-templates/{id}.
// Projects deep-copy this graph at create/apply time, so saving here never
// touches existing projects; only future template uses pick up the edits.
// Reuses the project editor's building blocks without modifying
// editor-page.tsx. Project-only machinery (status mode, columns, cycle
// counters, AI modal) is absent — templates don't execute.
// Built-ins and non-admins get a read-only canvas (backend 403s mirror this).

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
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
  Lock,
} from "lucide-react"

import {
  AlertBanner,
  Badge,
  Button,
  Card,
  Input,
} from "@/components/primitives"
import { Tooltip } from "@/components/workflow-editor/tooltip"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/toast"
import { useEditorHistory } from "@/hooks/use-editor-history"
import {
  alignBottom,
  alignTop,
  centerHorizontal,
  centerVertical,
  distributeHorizontal,
  type AlignNode,
} from "@/lib/lifecycle/align-helpers"
import { matchesShortcut, KEYBOARD_SHORTCUTS } from "@/lib/lifecycle/shortcuts"
import { buildGroupCloudData, type Point } from "@/lib/lifecycle/cloud-hull"
import {
  newNodeId,
  newEdgeId,
  newGroupId,
  regenerateInvalidNodeIds,
} from "@/lib/lifecycle/node-ids"
import { resolvePreset, type PresetId } from "@/lib/lifecycle/presets"
import {
  projectService,
  type ProcessTemplateDetail,
} from "@/services/project-service"
import {
  mapWorkflowConfig,
  unmapWorkflowConfig,
  type WorkflowConfig,
  type WorkflowConfigDTO,
  type WorkflowEdge,
  type WorkflowNode,
} from "@/services/lifecycle-service"

import { WorkflowCanvas, type CanvasControlsHandle } from "./workflow-canvas"
import { computeDragMembershipChanges } from "./workflow-canvas-inner"
import { RightPanel } from "./right-panel"
import type { WorkflowCapabilities } from "./capabilities-panel"
import { BottomToolbar } from "./bottom-toolbar"
import { ModeBanner } from "./mode-banner"
import { ContextMenu, type ContextMenuItem } from "./context-menu"
import { DirtySaveDialog } from "./dirty-save-dialog"
import { PresetMenu, detectCurrentPresetId } from "./preset-menu"

export interface TemplateEditorPageProps {
  templateId: number
}

const EMPTY_WORKFLOW: WorkflowConfig = {
  mode: "flexible",
  nodes: [],
  edges: [],
  groups: [],
}

interface ContextMenuState {
  position: { x: number; y: number }
  items: ContextMenuItem[]
  target:
    | { type: "canvas"; flowPos?: Point }
    | { type: "node"; nodeId: string }
    | { type: "edge"; edgeId: string }
    | { type: "group"; groupId: string }
}

interface SaveErrorState {
  kind: "403" | "404" | "422" | "network"
  message?: string
}

function readTemplateWorkflow(t: ProcessTemplateDetail): WorkflowConfig {
  const wf = t.default_workflow
  if (!wf || typeof wf !== "object") return EMPTY_WORKFLOW
  return mapWorkflowConfig(wf as unknown as WorkflowConfigDTO)
}

export function TemplateEditorPage({ templateId }: TemplateEditorPageProps) {
  const router = useRouter()
  const qc = useQueryClient()
  const { language } = useApp()
  const { hasPermission } = useAuth()
  const { showToast } = useToast()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  // ---------------------------- Template load ----------------------------

  const [template, setTemplate] = React.useState<ProcessTemplateDetail | null>(
    null,
  )
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  // Template meta fields (name required by the PATCH contract).
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")

  const [workflow, setWorkflowState] = React.useState<WorkflowConfig>(
    EMPTY_WORKFLOW,
  )
  const [capabilities, setCapabilities] = React.useState<WorkflowCapabilities>(
    {},
  )

  // Fetch once; the route remounts with key={templateId} on template switch.
  React.useEffect(() => {
    let cancelled = false
    projectService
      .getProcessTemplateById(templateId)
      .then((t) => {
        if (cancelled) return
        if (!t) {
          setLoadError(T("Şablon bulunamadı.", "Template not found."))
          setLoading(false)
          return
        }
        setTemplate(t)
        setName(t.name)
        setDescription(t.description ?? "")
        const wf = readTemplateWorkflow(t)
        setWorkflowState(wf)
        setCapabilities((wf.capabilities ?? {}) as WorkflowCapabilities)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response
            ?.data?.detail ??
          (err as Error)?.message ??
          T("Şablon yüklenemedi.", "Template could not be loaded.")
        setLoadError(String(detail))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [templateId, T])

  // Built-ins are editable too — only the admin gate applies (matches the
  // backend, which blocks built-in DELETE but allows PATCH).
  const isAdmin = hasPermission("admin.access")
  const canEdit = template !== null && isAdmin

  // ----------------------------- Editor state ----------------------------

  const [dirty, setDirty] = React.useState(false)
  const [selected, setSelected] = React.useState<{
    type: "node" | "edge" | "group"
    id: string
  } | null>(null)
  // Multi-select — phase node ids only.
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [zoom, setZoom] = React.useState(1)
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(
    null,
  )
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<SaveErrorState | null>(null)
  // Dirty-guard router intercept (Geri button).
  const [pendingNavigation, setPendingNavigation] = React.useState<
    string | null
  >(null)
  // Click-flow edge creation ("Bağlantı" button).
  const [edgeCreateState, setEdgeCreateState] = React.useState<
    null | { phase: "pick-source" } | { phase: "pick-target"; sourceId: string }
  >(null)

  const history = useEditorHistory()
  const canvasControlsRef = React.useRef<CanvasControlsHandle | null>(null)

  // One drag = one undo entry: snapshot at drag start, push once at drag stop.
  const dragStartSnapshotRef = React.useRef<WorkflowConfig | null>(null)
  const isDraggingRef = React.useRef<boolean>(false)
  const movedDuringDragRef = React.useRef(false)

  // Live mirror so deferred closures push the current snapshot to history.
  const workflowRef = React.useRef(workflow)
  React.useLayoutEffect(() => {
    workflowRef.current = workflow
  }, [workflow])

  // Single mutation entry point — history push + dirty.
  const commitWorkflow = React.useCallback(
    (next: WorkflowConfig) => {
      history.push(workflowRef.current)
      setWorkflowState(next)
      setDirty(true)
    },
    [history],
  )

  // SelectionPanel inputs have no disabled prop — gate panel mutations so a
  // read-only viewer can't dirty local state.
  const canEditRef = React.useRef(canEdit)
  React.useLayoutEffect(() => {
    canEditRef.current = canEdit
  })

  const handleWorkflowChange = React.useCallback(
    (next: WorkflowConfig) => {
      if (!canEditRef.current) return
      commitWorkflow(next)
    },
    [commitWorkflow],
  )

  const handleCapabilitiesChange = React.useCallback(
    (patch: WorkflowCapabilities) => {
      if (!canEditRef.current) return
      // Toggles are trivially reversible — kept out of the undo stack.
      setCapabilities((prev) => ({ ...prev, ...patch }))
      setDirty(true)
    },
    [],
  )

  const applyPreset = React.useCallback(
    (id: PresetId) => {
      const next = regenerateInvalidNodeIds(resolvePreset(id))
      commitWorkflow(next)
      setSelected(null)
    },
    [commitWorkflow],
  )

  // ------------------------ Inline edit propagation ----------------------

  const renameNode = React.useCallback(
    (nodeId: string, nextName: string) => {
      const wf = workflowRef.current
      commitWorkflow({
        ...wf,
        nodes: wf.nodes.map((n) =>
          n.id === nodeId ? { ...n, name: nextName } : n,
        ),
      })
    },
    [commitWorkflow],
  )

  const relabelEdge = React.useCallback(
    (edgeId: string, nextLabel: string) => {
      const wf = workflowRef.current
      commitWorkflow({
        ...wf,
        edges: wf.edges.map((e) =>
          e.id === edgeId ? { ...e, label: nextLabel } : e,
        ),
      })
    },
    [commitWorkflow],
  )

  // ---------------------- workflow → RFNode/RFEdge -----------------------
  // React Flow controlled-state, same as the project editor: rfNodes/rfEdges
  // are state so RF applies per-frame changes itself; workflow stays the
  // save-side source of truth, synced at drag-stop / remove / commit.
  // Templates don't execute: no node states, no cycle counters.

  const renameNodeRef = React.useRef(renameNode)
  const relabelEdgeRef = React.useRef(relabelEdge)
  React.useLayoutEffect(() => {
    renameNodeRef.current = renameNode
    relabelEdgeRef.current = relabelEdge
  })

  const projectRfNodes = React.useCallback(
    (wf: WorkflowConfig, sel: typeof selected, edit: boolean): RFNode[] => {
      const nodePositions = new Map<string, Point>()
      for (const n of wf.nodes) nodePositions.set(n.id, { x: n.x, y: n.y })
      const out: RFNode[] = []
      for (const g of wf.groups ?? []) {
        const childPositions: Point[] = (g.children ?? [])
          .map((id) => nodePositions.get(id))
          .filter((p): p is Point => p != null)
        if (childPositions.length === 0) continue
        const cloud = buildGroupCloudData(childPositions, 16)
        out.push({
          id: g.id,
          type: "groupCloud",
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
        out.push({
          id: n.id,
          type: "phase",
          // Absolute positions; group membership lives in the data model,
          // not RF parentId.
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
            state: "default",
            cycleCount: 0,
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
              onLabelChange: (next: string) =>
                relabelEdgeRef.current(e.id, next),
            },
          }) as RFEdge,
      ),
    [],
  )

  const [rfNodes, setRfNodes] = React.useState<RFNode[]>([])
  const [rfEdges, setRfEdges] = React.useState<RFEdge[]>([])

  // Drag-stop writes positions back into workflow; skip the next projection
  // so identical data doesn't churn the arrays.
  const skipNextProjectRef = React.useRef(false)

  React.useEffect(() => {
    if (skipNextProjectRef.current) {
      skipNextProjectRef.current = false
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- RF controlled-state parity with editor-page.tsx
    setRfNodes(projectRfNodes(workflow, selected, canEdit))
  }, [workflow, selected, canEdit, projectRfNodes])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- RF controlled-state parity with editor-page.tsx
    setRfEdges(projectRfEdges(workflow, selected, canEdit))
  }, [workflow, selected, canEdit, projectRfEdges])

  // ------------------- Editable React Flow callbacks ---------------------

  const handleNodesChange = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (changes: any[]) => {
      setRfNodes((prev) => {
        let next = applyNodeChanges(changes, prev)
        // Live cloud morph during drags.
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
            if (n.type !== "groupCloud") return n
            const g = groups.find((gg) => gg.id === n.id)
            if (!g) return n
            if (!g.children.some((cid) => movedIds.has(cid))) return n
            const childPositions: Point[] = g.children
              .map((cid) => positions.get(cid))
              .filter((p): p is Point => p != null)
            if (childPositions.length === 0) return n
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

      if (isDraggingRef.current) {
        for (const ch of changes) {
          if (ch.type === "position" && ch.position) {
            movedDuringDragRef.current = true
            break
          }
        }
      }

      // Outside a drag, position changes and removals commit to workflow.
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
      if (!canEdit) return
      const source = String(params.source ?? "")
      const target = String(params.target ?? "")
      if (!source || !target || source === target) return
      // Directional dedup: a second A->B is blocked, B->A stays valid.
      if (
        workflow.edges.some((e) => e.source === source && e.target === target)
      ) {
        showToast({
          variant: "warning",
          message: T("Bu bağlantı zaten var", "This connection already exists"),
        })
        return
      }
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
    [canEdit, workflow, commitWorkflow, showToast, T],
  )

  const handleNodeDragStart = React.useCallback(() => {
    if (!isDraggingRef.current) {
      dragStartSnapshotRef.current = workflow
      isDraggingRef.current = true
    }
  }, [workflow])

  const handleNodeDragStop = React.useCallback(
    (
      _e: React.MouseEvent,
      node: { id: string; position: { x: number; y: number } },
    ) => {
      const snapshot = dragStartSnapshotRef.current
      const moved = movedDuringDragRef.current
      dragStartSnapshotRef.current = null
      isDraggingRef.current = false
      movedDuringDragRef.current = false

      if (!moved) return

      const finalPositions = new Map<string, { x: number; y: number }>()
      for (const n of rfNodes) {
        if (n.type === "phase") {
          finalPositions.set(n.id, { x: n.position.x, y: n.position.y })
        }
      }

      // Resolve group membership for every moved node (multi-select drags
      // report only one node).
      const positions = new Map<string, Point>()
      for (const n of workflow.nodes) {
        positions.set(n.id, finalPositions.get(n.id) ?? { x: n.x, y: n.y })
      }
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
            ? {
                ...g,
                children: g.children.filter((cid) => !leaving.includes(cid)),
              }
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

      if (snapshot) history.push(snapshot)
      skipNextProjectRef.current = true
      setWorkflowState({ ...workflow, nodes: nextNodes, groups: nextGroups })
      setDirty(true)
    },
    [workflow, history, rfNodes, selectedIds],
  )

  // ----------------------- Context menu helpers --------------------------

  const buildNodeItems = React.useCallback(
    (): ContextMenuItem[] => [
      { id: "group", label: T("Grupla", "Group") },
      { id: "duplicate", label: T("Çoğalt", "Duplicate"), shortcut: "⌘D" },
      { id: "edit-name", label: T("Adı düzenle", "Edit name") },
      { id: "delete", label: T("Sil", "Delete"), shortcut: "⌫", danger: true },
    ],
    [T],
  )

  const buildEdgeItems = React.useCallback(
    (): ContextMenuItem[] => [
      {
        id: "toggle-bidir",
        label: T("Çift yönlü yap/kaldır", "Toggle bidirectional"),
      },
      { id: "toggle-allgate", label: T("Hepsi yap", "Make all-gate") },
      { id: "edit-label", label: T("Etiketi düzenle", "Edit label") },
      { id: "delete", label: T("Sil", "Delete"), danger: true },
    ],
    [T],
  )

  const buildGroupItems = React.useCallback(
    (): ContextMenuItem[] => [
      { id: "ungroup", label: T("Grubu çöz", "Ungroup") },
      { id: "edit-name", label: T("Adı düzenle", "Edit name") },
      { id: "delete", label: T("Sil", "Delete"), danger: true },
    ],
    [T],
  )

  const buildCanvasItems = React.useCallback(
    (): ContextMenuItem[] => [
      { id: "add-node", label: T("Buraya düğüm ekle", "Add node here") },
    ],
    [T],
  )

  const handleNodeContextMenu = React.useCallback(
    (e: React.MouseEvent, node: { id: string }) => {
      e.preventDefault()
      if (!canEdit) return
      const isGroup = (workflow.groups ?? []).some((g) => g.id === node.id)
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        items: isGroup ? buildGroupItems() : buildNodeItems(),
        target: isGroup
          ? { type: "group", groupId: node.id }
          : { type: "node", nodeId: node.id },
      })
    },
    [canEdit, workflow.groups, buildGroupItems, buildNodeItems],
  )

  const handleEdgeContextMenu = React.useCallback(
    (e: React.MouseEvent, edge: { id: string }) => {
      e.preventDefault()
      if (!canEdit) return
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        items: buildEdgeItems(),
        target: { type: "edge", edgeId: edge.id },
      })
    },
    [canEdit, buildEdgeItems],
  )

  const handlePaneContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!canEdit) return
      const screen = { x: e.clientX, y: e.clientY }
      const flowPos =
        canvasControlsRef.current?.screenToFlowPosition(screen) ?? screen
      setContextMenu({
        position: screen,
        items: buildCanvasItems(),
        target: { type: "canvas", flowPos },
      })
    },
    [canEdit, buildCanvasItems],
  )

  // ----------------------- Bulk + utility actions ------------------------

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
      if (
        workflow.edges.some((e) => e.source === sourceId && e.target === nodeId)
      ) {
        showToast({
          variant: "warning",
          message: T("Bu bağlantı zaten var", "This connection already exists"),
        })
        setEdgeCreateState(null)
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
      // Copies spawn loose; a carried parentId would dangle.
      parentId: undefined,
    }
    commitWorkflow({ ...workflow, nodes: [...workflow.nodes, copy] })
    setSelected({ type: "node", id: copy.id })
  }, [selected, workflow, commitWorkflow])

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

  const handleAlign = React.useCallback(
    (
      action:
        | "distribute-h"
        | "align-top"
        | "align-bottom"
        | "center-v"
        | "center-h",
    ) => {
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

  const handleContextMenuSelect = React.useCallback(
    (id: string) => {
      const cm = contextMenu
      if (!cm) return
      if (cm.target.type === "canvas" && id === "add-node") {
        addNodeAtPosition(cm.target.flowPos ?? { x: 80, y: 80 })
      } else if (cm.target.type === "node") {
        if (id === "delete") {
          setSelected({ type: "node", id: cm.target.nodeId })
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
        const edgeId = cm.target.edgeId
        if (id === "delete") {
          setSelected({ type: "edge", id: edgeId })
          setTimeout(() => deleteSelection(), 0)
        } else if (id === "toggle-bidir") {
          commitWorkflow({
            ...workflow,
            edges: workflow.edges.map((e) =>
              e.id === edgeId ? { ...e, bidirectional: !e.bidirectional } : e,
            ),
          })
        } else if (id === "toggle-allgate") {
          commitWorkflow({
            ...workflow,
            edges: workflow.edges.map((e) =>
              e.id === edgeId ? { ...e, isAllGate: !e.isAllGate } : e,
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

  // ------------------------------ Save flow ------------------------------

  const save = React.useCallback(async (): Promise<boolean> => {
    if (!template) return false
    if (!name.trim()) {
      showToast({
        variant: "warning",
        message: T("Şablon adı boş olamaz", "Template name cannot be empty"),
      })
      return false
    }
    setSaving(true)
    setSaveError(null)
    try {
      const dto = unmapWorkflowConfig(workflow)
      await projectService.updateProcessTemplate(template.id, {
        name: name.trim(),
        description: description.trim() || null,
        default_workflow: {
          ...dto,
          // Backend requires color on every node; default it so legacy rows
          // without one stay saveable.
          nodes: dto.nodes.map((n) => ({
            ...n,
            color: n.color ?? "status-todo",
          })),
          capabilities,
        } as unknown as Record<string, unknown>,
      })
      showToast({
        variant: "success",
        message: T("Şablon kaydedildi", "Template saved"),
      })
      setDirty(false)
      history.clear()
      qc.invalidateQueries({ queryKey: ["process-templates"] })
      return true
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { detail?: unknown } }
      }
      const status = e?.response?.status
      const detail = e?.response?.data?.detail
      const detailMessage =
        typeof detail === "string"
          ? detail
          : ((detail as { message?: string } | undefined)?.message ?? "")
      if (status === 422) {
        setSaveError({ kind: "422", message: detailMessage })
        showToast({
          variant: "error",
          message: detailMessage
            ? T(
                `Doğrulama hatası: ${detailMessage}`,
                `Validation error: ${detailMessage}`,
              )
            : T("Doğrulama hatası", "Validation error"),
        })
      } else if (status === 403) {
        setSaveError({ kind: "403", message: detailMessage })
        showToast({
          variant: "error",
          message: T(
            "Bu şablonu düzenleme yetkiniz yok",
            "You don't have permission to edit this template",
          ),
        })
      } else if (status === 404) {
        setSaveError({ kind: "404" })
        showToast({
          variant: "error",
          message: T("Şablon bulunamadı", "Template not found"),
        })
      } else {
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
    template,
    name,
    description,
    workflow,
    capabilities,
    history,
    qc,
    showToast,
    T,
  ])

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

  // -------------------------- Keyboard shortcuts -------------------------

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName?.toLowerCase()
        if (tag === "input" || tag === "textarea" || target.isContentEditable) {
          return
        }
      }
      // Open overlays own the keyboard; a context menu lets only Esc through.
      if (pendingNavigation !== null) return
      if (contextMenu !== null && !matchesShortcut(e, KEYBOARD_SHORTCUTS.esc)) {
        return
      }
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.save)) {
        e.preventDefault()
        if (canEdit && !saving) void save()
        return
      }
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.undo)) {
        e.preventDefault()
        if (!canEdit) return
        const prev = history.undo(workflow)
        if (prev) setWorkflowState(prev)
        return
      }
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.redo)) {
        e.preventDefault()
        if (!canEdit) return
        const next = history.redo(workflow)
        if (next) setWorkflowState(next)
        return
      }
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.addNode)) {
        e.preventDefault()
        if (canEdit) {
          addNodeAtPosition({
            x: 200 + Math.random() * 80,
            y: 100 + Math.random() * 60,
          })
        }
        return
      }
      if (
        e.key === "Delete" ||
        (e.key === "Backspace" && !e.metaKey && !e.ctrlKey)
      ) {
        e.preventDefault()
        if (canEdit) deleteSelection()
        return
      }
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.fit)) {
        e.preventDefault()
        canvasControlsRef.current?.fitView()
        return
      }
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.esc)) {
        e.preventDefault()
        setSelected(null)
        setContextMenu(null)
        cancelAddEdge()
        return
      }
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.group)) {
        if (canEdit && selected?.type === "group") {
          e.preventDefault()
          ungroup(selected.id)
        }
        return
      }
      if (matchesShortcut(e, KEYBOARD_SHORTCUTS.duplicate)) {
        if (canEdit && selected?.type === "node") {
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
    duplicateSelection,
    canEdit,
    saving,
    save,
    cancelAddEdge,
    pendingNavigation,
    contextMenu,
  ])

  // -------------------------------- Render -------------------------------

  const backHref = "/admin/workflows"
  const canSave = canEdit && dirty && name.trim().length > 0 && !saving

  if (loading) {
    return (
      <div
        style={{ padding: 20, textAlign: "center", color: "var(--fg-muted)" }}
      >
        {T("Yükleniyor…", "Loading…")}
      </div>
    )
  }

  if (loadError || !template) {
    return (
      <Card padding={40}>
        <div style={{ textAlign: "center", color: "var(--fg-muted)" }}>
          {loadError ?? T("Şablon bulunamadı.", "Template not found.")}
        </div>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={14} />}
            onClick={() => router.push(backHref)}
          >
            {T("Geri", "Back")}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 16,
      }}
    >
      {/* Header — same hierarchy as the project editor */}
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
            {T("Şablon Tasarımcısı", "Template Designer")}
          </h1>
          <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}>
            <span style={{ fontWeight: 500 }}>{template.name}</span>
            {" · "}
            <span>{T("Süreç Şablonu", "Process Template")}</span>
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
            onClick={() => safePush(backHref)}
          >
            {T("Geri", "Back")}
          </Button>
          <Tooltip
            text={
              !canEdit
                ? T("Düzenleme yetkiniz yok.", "You don't have edit permission.")
                : T("Kaydet", "Save")
            }
          >
            <Button
              variant="primary"
              size="sm"
              icon={<Save size={14} />}
              disabled={!canSave}
              onClick={() => {
                void save()
              }}
            >
              {saving ? T("Kaydediliyor…", "Saving…") : T("Kaydet", "Save")}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Read-only banner */}
      {!canEdit && (
        <AlertBanner tone="info">
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Lock size={13} />
            {T(
              "Şablon düzenlemek için yönetici yetkisi gerekir.",
              "Editing templates requires admin access.",
            )}
          </span>
        </AlertBanner>
      )}

      {saveError?.kind === "422" && saveError.message ? (
        <AlertBanner tone="warning">
          {T("Doğrulama hatası: ", "Validation error: ")}
          {saveError.message}
        </AlertBanner>
      ) : null}

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
            ? T(
                "Kaynak düğümü seçin (Esc iptal eder).",
                "Pick a source node (Esc to cancel).",
              )
            : T(
                "Hedef düğümü seçin (Esc iptal eder).",
                "Pick a target node (Esc to cancel).",
              )}
        </AlertBanner>
      ) : null}

      {/* Template meta: name + description */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          padding: "10px 12px",
          background: "var(--surface)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "inset 0 0 0 1px var(--border)",
        }}
      >
        <div style={{ width: 280 }}>
          <label
            htmlFor="template-name-input"
            style={{
              display: "block",
              fontSize: 11.5,
              fontWeight: 600,
              marginBottom: 4,
              color: "var(--fg-muted)",
            }}
          >
            {T("Şablon adı", "Template name")}
          </label>
          <Input
            id="template-name-input"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setDirty(true)
            }}
            disabled={!canEdit}
            required
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="template-desc-input"
            style={{
              display: "block",
              fontSize: 11.5,
              fontWeight: 600,
              marginBottom: 4,
              color: "var(--fg-muted)",
            }}
          >
            {T("Açıklama", "Description")}
          </label>
          <Input
            id="template-desc-input"
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setDirty(true)
            }}
            disabled={!canEdit}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Toolbar — no mode switch: templates carry only the lifecycle graph,
          task-status flows are derived per-project from board columns */}
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
        {canEdit && (
          <PresetMenu
            currentPresetId={detectCurrentPresetId(workflow)}
            dirty={dirty}
            onApply={applyPreset}
          />
        )}
        <div style={{ flex: 1 }} />
        <Button
          variant="ghost"
          size="sm"
          icon={<Undo2 size={14} />}
          disabled={!canEdit || !history.canUndo}
          onClick={() => {
            const prev = history.undo(workflow)
            if (prev) setWorkflowState(prev)
          }}
          title={T("Geri Al", "Undo")}
        >
          {T("Geri Al", "Undo")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Redo2 size={14} />}
          disabled={!canEdit || !history.canRedo}
          onClick={() => {
            const next = history.redo(workflow)
            if (next) setWorkflowState(next)
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
          {Math.round(zoom * 100)}%
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

      {/* Body: canvas + right panel, same envelope as the project editor */}
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
              setSelected({ type: "edge", id: String(edge.id) })
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
              setSelected(null)
              setContextMenu(null)
              setEdgeCreateState(null)
            }}
            onSelectionChange={handleSelectionChange}
            onZoomChange={setZoom}
          />
          {canEdit && (
            <BottomToolbar
              onAddNode={() =>
                addNodeAtPosition({
                  x: 80 + Math.random() * 200,
                  y: 80 + Math.random() * 100,
                })
              }
              onAddEdge={startAddEdge}
              onGroup={() => {
                if (selected?.type === "group") {
                  ungroup(selected.id)
                } else if (selectedIds.length >= 1) {
                  groupSelection(selectedIds)
                } else if (selected?.type === "node") {
                  groupSelection([selected.id])
                }
              }}
              onAlign={handleAlign}
              // AI öner is project-bound; absent on the template surface.
            />
          )}
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
          editorMode="lifecycle"
          capabilities={capabilities}
          onCapabilitiesChange={handleCapabilitiesChange}
          canEdit={canEdit}
        />
      </div>

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
