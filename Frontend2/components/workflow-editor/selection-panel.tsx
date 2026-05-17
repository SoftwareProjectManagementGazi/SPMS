"use client"

// SelectionPanel (Phase 12 Plan 12-07) — right-panel section that branches
// off the current `selected.type` (node / edge / group / null).
//
// Plan 12-07 ships the structural rendering for all 4 branches with field
// inputs that pipe edits through onWorkflowChange (which sets dirty=true at
// the parent). Plan 12-08 wires inline-edit on the canvas + keyboard +
// context menu actions; this panel is where right-side property edits land.

import * as React from "react"
import { ArrowRight, Trash2 } from "lucide-react"
import {
  AlertBanner,
  Button,
  Input,
  SegmentedControl,
  Toggle,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type {
  ColumnCategory,
  EntryPolicy,
  ExitPolicy,
  WorkflowConfig,
  WorkflowEdge,
  WorkflowEdgeType,
  WorkflowGroup,
  WorkflowNode,
} from "@/services/lifecycle-service"
import { ColorSwatch } from "./color-swatch"

export type SelectionType = "node" | "edge" | "group"

export interface EditorSelection {
  type: SelectionType
  id: string
}

/**
 * Wave 2 W2-C6 — per-field patch shape forwarded by `NodeEditor` when the
 * editor is in `status` mode and the selected node maps to a BoardColumn
 * (id `col_<N>`). The editor-page handler fires
 * `PATCH /projects/{pid}/columns/{cid}` with this body so the BoardColumn
 * row stays in sync independently of the workflow JSON save flow.
 *
 * `is_initial` is INCLUDED here even though the toggle also lives on the
 * workflow node — it is the single field the backend uses to derive
 * `WorkflowConfig.capabilities.initial_node_id`, so the PATCH must reach
 * the BoardColumn before the next refetch resolves the displayed id.
 */
export interface ColumnEngineFieldsPatch {
  category?: ColumnCategory
  is_initial?: boolean
  is_terminal?: boolean
  max_duration_days?: number | null
  entry_policy?: EntryPolicy
  exit_policy?: ExitPolicy
}

export interface SelectionPanelProps {
  workflow: WorkflowConfig
  selected: EditorSelection | null
  onWorkflowChange: (next: WorkflowConfig) => void
  /** Editor mode — drives status-only field affordances (e.g. horizontal
   * Initial/Final checkboxes per prototype). */
  editorMode?: "lifecycle" | "status"
  /** Wave 2 W2-C6 — status-mode side-effect for BoardColumn engine fields.
   *  Called with the numeric column id parsed from `col_<N>` and the per-field
   *  patch produced by an engine-field edit. Lifecycle-mode nodes (no `col_`
   *  prefix) never trigger this callback. */
  onColumnEngineFieldsChange?: (
    columnId: number,
    patch: ColumnEngineFieldsPatch,
  ) => void
}

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--fg-subtle)",
  letterSpacing: 0.6,
  textTransform: "uppercase",
  marginBottom: 10,
}

const FIELD_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "var(--fg-muted)",
  marginBottom: 4,
}

const FIELD_ROW: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginBottom: 10,
}

const TOGGLE_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  fontSize: 12,
  color: "var(--fg)",
  marginBottom: 8,
}

// Wave 2 W2-C6 — engine-field <select> shape. Native <select> chosen over
// SegmentedControl because the policy enums grow (initial_only adds a 3rd
// option) and the prototype right-panel reserves segmented controls for
// 2-3 option edge-type toggles only.
const SELECT_STYLE: React.CSSProperties = {
  width: "100%",
  height: 28,
  padding: "0 8px",
  fontSize: 12,
  background: "var(--surface)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "inset 0 0 0 1px var(--border)",
  color: "var(--fg)",
  border: 0,
  fontFamily: "inherit",
}

const ENGINE_SECTION_STYLE: React.CSSProperties = {
  borderTop: "1px solid var(--border)",
  paddingTop: 10,
  marginTop: 10,
}

const ENGINE_HINT_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: "var(--fg-subtle)",
  marginTop: -4,
  marginBottom: 8,
  lineHeight: 1.4,
}

export function SelectionPanel({
  workflow,
  selected,
  onWorkflowChange,
  editorMode = "lifecycle",
  onColumnEngineFieldsChange,
}: SelectionPanelProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  if (!selected) {
    return (
      <div>
        <div style={TITLE_STYLE}>{T("Seçim", "Selection")}</div>
        <div
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            lineHeight: 1.5,
          }}
        >
          {T(
            "Bir düğüm veya bağlantı seçin.",
            "Select a node or edge.",
          )}
        </div>
      </div>
    )
  }

  if (selected.type === "node") {
    const node = workflow.nodes.find((n) => n.id === selected.id)
    if (!node) {
      return (
        <div>
          <div style={TITLE_STYLE}>{T("Seçim", "Selection")}</div>
          <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
            {T("Düğüm bulunamadı.", "Node not found.")}
          </div>
        </div>
      )
    }
    return (
      <NodeEditor
        node={node}
        workflow={workflow}
        onWorkflowChange={onWorkflowChange}
        editorMode={editorMode}
        onColumnEngineFieldsChange={onColumnEngineFieldsChange}
        T={T}
      />
    )
  }

  if (selected.type === "edge") {
    const edge = workflow.edges.find((e) => e.id === selected.id)
    if (!edge) {
      return (
        <div>
          <div style={TITLE_STYLE}>{T("Seçim", "Selection")}</div>
          <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
            {T("Bağlantı bulunamadı.", "Edge not found.")}
          </div>
        </div>
      )
    }
    return (
      <EdgeEditor
        edge={edge}
        workflow={workflow}
        onWorkflowChange={onWorkflowChange}
        T={T}
      />
    )
  }

  // group
  const group = (workflow.groups ?? []).find((g) => g.id === selected.id)
  if (!group) {
    return (
      <div>
        <div style={TITLE_STYLE}>{T("Seçim", "Selection")}</div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
          {T("Grup bulunamadı.", "Group not found.")}
        </div>
      </div>
    )
  }
  return (
    <GroupEditor
      group={group}
      workflow={workflow}
      onWorkflowChange={onWorkflowChange}
      T={T}
    />
  )
}

// ===========================================================================
// Node editor (UI-SPEC §597-613)
// ===========================================================================

/**
 * Wave 2 W2-C6 — derive the BoardColumn primary key from a status-mode node
 * id. Mirrors the same regex used in `editor-page.colIdFromNodeId` so the
 * panel can decide whether to fire `onColumnEngineFieldsChange` without an
 * extra editor-page round trip. Returns `null` for lifecycle-mode node ids
 * (e.g. `nd_<uuid>`) which guarantees the side-effect skips silently when
 * the node does not back a BoardColumn row.
 */
function colIdFromNodeId(nodeId: string): number | null {
  const m = nodeId.match(/^col_(\d+)$/)
  return m ? parseInt(m[1], 10) : null
}

function NodeEditor({
  node,
  workflow,
  onWorkflowChange,
  editorMode,
  onColumnEngineFieldsChange,
  T,
}: {
  node: WorkflowNode
  workflow: WorkflowConfig
  onWorkflowChange: (next: WorkflowConfig) => void
  editorMode: "lifecycle" | "status"
  onColumnEngineFieldsChange?: (
    columnId: number,
    patch: ColumnEngineFieldsPatch,
  ) => void
  T: (tr: string, en: string) => string
}) {
  // Wave 2 W2-C6 — status-mode column id resolved once per render. `null`
  // for lifecycle nodes (W2-C7 will write to workflow JSON only) so the
  // updateNode side-effect skips the PATCH dispatch without a branch.
  const columnId = editorMode === "status" ? colIdFromNodeId(node.id) : null

  // Wave 2 W2-C6 — extract engine-field deltas out of an arbitrary node
  // patch and forward them to `onColumnEngineFieldsChange` as snake_case so
  // the editor-page handler can dispatch a single PATCH per change. We
  // translate only the keys the BoardColumn endpoint accepts; descriptive
  // fields like `name`/`color`/`description` keep their existing save path
  // (workflow JSON serialization at save time).
  //
  // `is_initial` is forwarded even though the workflow node still owns the
  // canonical `isInitial` toggle — the BoardColumn row drives the backend's
  // capabilities.initial_node_id derivation, so the PATCH must reach it
  // before the next refetch resolves the displayed id.
  const dispatchColumnPatch = React.useCallback(
    (patch: Partial<WorkflowNode>) => {
      if (columnId === null || !onColumnEngineFieldsChange) return
      const dbPatch: ColumnEngineFieldsPatch = {}
      if (patch.category !== undefined) dbPatch.category = patch.category
      if (patch.isInitial !== undefined) dbPatch.is_initial = patch.isInitial
      if (patch.isTerminal !== undefined) dbPatch.is_terminal = patch.isTerminal
      if (patch.maxDurationDays !== undefined)
        dbPatch.max_duration_days = patch.maxDurationDays
      if (patch.entryPolicy !== undefined) dbPatch.entry_policy = patch.entryPolicy
      if (patch.exitPolicy !== undefined) dbPatch.exit_policy = patch.exitPolicy
      if (Object.keys(dbPatch).length > 0) {
        onColumnEngineFieldsChange(columnId, dbPatch)
      }
    },
    [columnId, onColumnEngineFieldsChange],
  )

  const updateNode = React.useCallback(
    (patch: Partial<WorkflowNode>) => {
      onWorkflowChange({
        ...workflow,
        nodes: workflow.nodes.map((n) =>
          n.id === node.id ? { ...n, ...patch } : n,
        ),
      })
      // Status-mode side-effect — keep BoardColumn engine fields in sync.
      // Lifecycle-mode (columnId === null) is fire-skip; W2-C7 will route
      // those edits straight into the workflow JSON serializer.
      dispatchColumnPatch(patch)
    },
    [node.id, workflow, onWorkflowChange, dispatchColumnPatch],
  )

  // Wave 2 W2-C6 — multi-initial detection. Senior review #4 resolution:
  // we WARN about a duplicate initial flag instead of auto-unchecking the
  // other columns. Backend validation lands in Wave 3 (currently only the
  // migration backfill enforces a single initial column at seed time).
  const otherInitialNodes = React.useMemo(() => {
    if (editorMode !== "status" || !node.isInitial) return []
    return workflow.nodes.filter((n) => n.id !== node.id && n.isInitial)
  }, [editorMode, node.id, node.isInitial, workflow.nodes])

  const removeNode = React.useCallback(() => {
    onWorkflowChange({
      ...workflow,
      nodes: workflow.nodes.filter((n) => n.id !== node.id),
      edges: workflow.edges.filter(
        (e) => e.source !== node.id && e.target !== node.id,
      ),
      groups: (workflow.groups ?? []).map((g) => ({
        ...g,
        children: g.children.filter((cid) => cid !== node.id),
      })),
    })
  }, [node.id, workflow, onWorkflowChange])

  return (
    <div>
      <div style={TITLE_STYLE}>{T("Seçim", "Selection")}</div>
      <div style={FIELD_ROW}>
        <span style={FIELD_LABEL}>{T("Ad", "Name")}</span>
        <Input
          value={node.name}
          onChange={(e) => updateNode({ name: e.target.value })}
          size="sm"
          style={{ width: "100%" }}
        />
      </div>
      <div style={FIELD_ROW}>
        <span style={FIELD_LABEL}>{T("Açıklama", "Description")}</span>
        <textarea
          value={node.description ?? ""}
          onChange={(e) => updateNode({ description: e.target.value })}
          rows={2}
          style={{
            width: "100%",
            background: "var(--surface)",
            color: "var(--fg)",
            borderRadius: "var(--radius-sm)",
            border: 0,
            // outline intentionally NOT set inline so :focus-visible ring paints (a11y).
            boxShadow: "inset 0 0 0 1px var(--border)",
            padding: "6px 8px",
            fontSize: 12,
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      </div>
      <div style={FIELD_ROW}>
        <span style={FIELD_LABEL}>{T("Renk", "Color")}</span>
        <ColorSwatch
          value={node.color ?? "status-todo"}
          onChange={(token) => updateNode({ color: token })}
        />
      </div>
      <div style={FIELD_ROW}>
        <span style={FIELD_LABEL}>{T("WIP", "WIP")}</span>
        <Input
          type="number"
          value={node.wipLimit != null ? String(node.wipLimit) : ""}
          onChange={(e) => {
            const raw = e.target.value
            const parsed = raw === "" ? null : Number(raw)
            updateNode({
              wipLimit: parsed == null || Number.isNaN(parsed) ? null : parsed,
            })
          }}
          size="sm"
          style={{ width: 80 }}
        />
      </div>
      {editorMode === "status" ? (
        // Status mode: prototype-faithful inline horizontal Initial/Final
        // checkboxes (gap=6) so two flags read like a single grouping.
        <div
          style={{
            display: "flex",
            gap: 6,
            fontSize: 12,
            color: "var(--fg)",
            marginBottom: 8,
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={Boolean(node.isInitial)}
              onChange={(e) => updateNode({ isInitial: e.target.checked })}
            />
            {T("Başlangıç", "Initial")}
          </label>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={Boolean(node.isFinal)}
              onChange={(e) => updateNode({ isFinal: e.target.checked })}
            />
            {T("Bitiş", "Final")}
          </label>
        </div>
      ) : (
        <>
          <div style={TOGGLE_ROW}>
            <span>{T("Başlangıç düğümü", "Initial node")}</span>
            <Toggle
              on={Boolean(node.isInitial)}
              onChange={(v) => updateNode({ isInitial: v })}
              size="sm"
            />
          </div>
          <div style={TOGGLE_ROW}>
            <span>{T("Bitiş düğümü", "Final node")}</span>
            <Toggle
              on={Boolean(node.isFinal)}
              onChange={(v) => updateNode({ isFinal: v })}
              size="sm"
            />
          </div>
        </>
      )}
      {/* Wave 2 W2-C6 — multi-initial warning. Senior review #4: surface a
          banner instead of auto-unchecking. Backend Wave 3 will enforce the
          single-initial invariant; this is a UX nudge only. */}
      {editorMode === "status" && otherInitialNodes.length > 0 ? (
        <div style={{ marginBottom: 8 }} data-testid="multi-initial-warning">
          <AlertBanner tone="warning">
            {T(
              `Diğer başlangıç olarak işaretli kolon${otherInitialNodes.length > 1 ? "lar" : ""}: ${otherInitialNodes.map((n) => n.name).join(", ")}. Tek başlangıç önerilir.`,
              `Also marked as initial: ${otherInitialNodes.map((n) => n.name).join(", ")}. A single initial column is recommended.`,
            )}
          </AlertBanner>
        </div>
      ) : null}
      <div style={TOGGLE_ROW}>
        <span>
          {T("Arşivli (yeni geçiş alamaz)", "Archived (no new transitions)")}
        </span>
        <Toggle
          on={Boolean(node.isArchived)}
          onChange={(v) => updateNode({ isArchived: v })}
          size="sm"
        />
      </div>
      {/* Wave 2 W2-C6 — engine field editor. Rendered in both modes per plan
          (lifecycle-mode persistence wires in W2-C7). Status-mode fires
          `onColumnEngineFieldsChange` per field via dispatchColumnPatch. */}
      <div style={ENGINE_SECTION_STYLE}>
        <div style={{ ...TITLE_STYLE, marginBottom: 6 }}>
          {T("Motor Alanları", "Engine Fields")}
        </div>

        <div style={FIELD_ROW}>
          <span style={FIELD_LABEL}>{T("Kategori", "Category")}</span>
          <select
            aria-label={T("Kategori", "Category")}
            value={node.category ?? "todo"}
            onChange={(e) =>
              updateNode({ category: e.target.value as ColumnCategory })
            }
            style={SELECT_STYLE}
          >
            <option value="todo">{T("Yapılacak", "To Do")}</option>
            <option value="in_progress">{T("Yapılıyor", "In Progress")}</option>
            <option value="done">{T("Tamamlandı", "Done")}</option>
          </select>
        </div>

        <div style={TOGGLE_ROW}>
          <span>{T("Terminal düğüm", "Terminal node")}</span>
          <Toggle
            on={Boolean(node.isTerminal)}
            onChange={(v) => updateNode({ isTerminal: v })}
            size="sm"
            aria-label={T("Terminal düğüm", "Terminal node")}
          />
        </div>

        <div style={FIELD_ROW}>
          <span style={FIELD_LABEL}>
            {T("Maks. süre (gün)", "Max duration (days)")}
          </span>
          {/* The Input primitive does not expose `min` (Phase 12 surface area).
              `< 1` and NaN entries are coerced to null below; the backend
              validates the upper bound. Extending the primitive is out of
              scope for W2-C6 — revisit if a designer asks for the spinner
              floor in Wave 3. */}
          <Input
            type="number"
            value={
              node.maxDurationDays != null ? String(node.maxDurationDays) : ""
            }
            placeholder={T("sınırsız", "unbounded")}
            onChange={(e) => {
              const raw = e.target.value
              // Empty input → null (unbounded) per UX spec. We do NOT
              // collapse Number.isNaN/sub-1 values into a noop because the
              // <input type="number"> already rejects most of those; an
              // invalid manual entry round-trips as null which keeps the
              // PATCH idempotent and avoids partial commits.
              const parsed = raw === "" ? null : Number(raw)
              updateNode({
                maxDurationDays:
                  parsed == null || Number.isNaN(parsed) || parsed < 1
                    ? null
                    : parsed,
              })
            }}
            size="sm"
            style={{ width: 110 }}
          />
          <p style={ENGINE_HINT_STYLE}>
            {T(
              "Boş = sınırsız",
              "Empty = unbounded",
            )}
          </p>
        </div>

        <div style={FIELD_ROW}>
          <span style={FIELD_LABEL}>
            {T("Giriş politikası", "Entry policy")}
          </span>
          <select
            aria-label={T("Giriş politikası", "Entry policy")}
            value={node.entryPolicy ?? "any"}
            onChange={(e) =>
              updateNode({ entryPolicy: e.target.value as EntryPolicy })
            }
            style={SELECT_STYLE}
          >
            <option value="any">{T("Serbest", "Any")}</option>
            <option value="edges_only">
              {T("Sadece edge'lerden", "Edges only")}
            </option>
            <option value="initial_only">
              {T("Sadece başlangıçtan", "Initial only")}
            </option>
          </select>
        </div>

        <div style={FIELD_ROW}>
          <span style={FIELD_LABEL}>
            {T("Çıkış politikası", "Exit policy")}
          </span>
          <select
            aria-label={T("Çıkış politikası", "Exit policy")}
            value={node.exitPolicy ?? "any"}
            onChange={(e) =>
              updateNode({ exitPolicy: e.target.value as ExitPolicy })
            }
            style={SELECT_STYLE}
          >
            <option value="any">{T("Serbest", "Any")}</option>
            <option value="edges_only">
              {T("Sadece edge'lerden", "Edges only")}
            </option>
            <option value="terminal_lock">
              {T("Terminal kilit", "Terminal lock")}
            </option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <Button
          variant="ghost"
          size="xs"
          icon={<Trash2 size={12} />}
          onClick={removeNode}
          style={{
            color: "var(--priority-critical)",
            alignSelf: "flex-start",
          }}
        >
          {T("Sil", "Delete")}
        </Button>
      </div>
    </div>
  )
}

// ===========================================================================
// Edge editor (UI-SPEC §615-630)
// ===========================================================================

function EdgeEditor({
  edge,
  workflow,
  onWorkflowChange,
  T,
}: {
  edge: WorkflowEdge
  workflow: WorkflowConfig
  onWorkflowChange: (next: WorkflowConfig) => void
  T: (tr: string, en: string) => string
}) {
  const sourceNode = workflow.nodes.find((n) => n.id === edge.source)
  const targetNode = workflow.nodes.find((n) => n.id === edge.target)

  const updateEdge = React.useCallback(
    (patch: Partial<WorkflowEdge>) => {
      onWorkflowChange({
        ...workflow,
        edges: workflow.edges.map((e) =>
          e.id === edge.id ? { ...e, ...patch } : e,
        ),
      })
    },
    [edge.id, workflow, onWorkflowChange],
  )

  const removeEdge = React.useCallback(() => {
    onWorkflowChange({
      ...workflow,
      edges: workflow.edges.filter((e) => e.id !== edge.id),
    })
  }, [edge.id, workflow, onWorkflowChange])

  const TYPE_OPTIONS = [
    { id: "flow", label: T("Akış", "Flow") },
    { id: "verification", label: T("Doğrulama", "Verify") },
    { id: "feedback", label: T("Geri Bildirim", "Feedback") },
  ]

  return (
    <div>
      <div style={TITLE_STYLE}>{T("Bağlantı", "Edge")}</div>
      {sourceNode && targetNode ? (
        <div
          style={{
            fontSize: 12.5,
            padding: 10,
            background: "var(--surface-2)",
            borderRadius: 6,
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 600 }}>{sourceNode.name}</div>
          <div
            style={{
              color: "var(--fg-muted)",
              marginTop: 4,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <ArrowRight size={12} />
            {targetNode.name}
          </div>
        </div>
      ) : null}
      <div style={FIELD_ROW}>
        <span style={FIELD_LABEL}>{T("Bağlantı Tipi", "Edge Type")}</span>
        <SegmentedControl
          options={TYPE_OPTIONS}
          value={edge.type}
          onChange={(id) => updateEdge({ type: id as WorkflowEdgeType })}
          size="xs"
        />
      </div>
      <div style={FIELD_ROW}>
        <span style={FIELD_LABEL}>{T("Etiket", "Label")}</span>
        <Input
          value={edge.label ?? ""}
          onChange={(e) => updateEdge({ label: e.target.value })}
          placeholder={T("Etiket ekle (opsiyonel)…", "Add label (optional)…")}
          size="sm"
          style={{ width: "100%" }}
        />
      </div>
      <div style={TOGGLE_ROW}>
        <span>{T("Çift yönlü", "Bidirectional")}</span>
        <Toggle
          on={Boolean(edge.bidirectional)}
          onChange={(v) => updateEdge({ bidirectional: v })}
          size="sm"
        />
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--fg-subtle)",
          marginTop: -4,
          marginBottom: 8,
          lineHeight: 1.4,
        }}
      >
        {T(
          "Sadece bu iki düğüm arasında çift yönlü çalışır.",
          "Works only between these two nodes.",
        )}
      </div>
      <div style={TOGGLE_ROW}>
        <span>{T("Hepsi (kaynak fark etmez)", "All (source-agnostic)")}</span>
        <Toggle
          on={Boolean(edge.isAllGate)}
          onChange={(v) => updateEdge({ isAllGate: v })}
          size="sm"
        />
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--fg-subtle)",
          marginTop: -4,
          marginBottom: 8,
          lineHeight: 1.4,
        }}
      >
        {T(
          "Açıkken her aktif düğümden bu hedefe geçişe izin verir.",
          "When on, allows transition to this target from any active node.",
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        <Button
          variant="ghost"
          size="xs"
          icon={<Trash2 size={12} />}
          onClick={removeEdge}
          style={{
            color: "var(--priority-critical)",
            alignSelf: "flex-start",
          }}
        >
          {T("Bağlantıyı sil", "Delete edge")}
        </Button>
      </div>
    </div>
  )
}

// ===========================================================================
// Group editor (UI-SPEC §615 grouping flows)
// ===========================================================================

function GroupEditor({
  group,
  workflow,
  onWorkflowChange,
  T,
}: {
  group: WorkflowGroup
  workflow: WorkflowConfig
  onWorkflowChange: (next: WorkflowConfig) => void
  T: (tr: string, en: string) => string
}) {
  const updateGroup = React.useCallback(
    (patch: Partial<WorkflowGroup>) => {
      onWorkflowChange({
        ...workflow,
        groups: (workflow.groups ?? []).map((g) =>
          g.id === group.id ? { ...g, ...patch } : g,
        ),
      })
    },
    [group.id, workflow, onWorkflowChange],
  )

  const removeGroup = React.useCallback(() => {
    onWorkflowChange({
      ...workflow,
      groups: (workflow.groups ?? []).filter((g) => g.id !== group.id),
    })
  }, [group.id, workflow, onWorkflowChange])

  return (
    <div>
      <div style={TITLE_STYLE}>{T("Grup", "Group")}</div>
      <div style={FIELD_ROW}>
        <span style={FIELD_LABEL}>{T("Ad", "Name")}</span>
        <Input
          value={group.name}
          onChange={(e) => updateGroup({ name: e.target.value })}
          size="sm"
          style={{ width: "100%" }}
        />
      </div>
      <div style={FIELD_ROW}>
        <span style={FIELD_LABEL}>{T("Renk", "Color")}</span>
        <ColorSwatch
          value={group.color ?? "primary"}
          onChange={(token) => updateGroup({ color: token })}
        />
      </div>
      <div style={{ marginTop: 4 }}>
        <Button variant="ghost" size="sm" onClick={removeGroup}>
          {T("Grubu Çöz", "Ungroup")}
        </Button>
      </div>
    </div>
  )
}
