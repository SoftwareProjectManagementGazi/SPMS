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
  Button,
  Input,
  SegmentedControl,
  Toggle,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type {
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

export interface SelectionPanelProps {
  workflow: WorkflowConfig
  selected: EditorSelection | null
  onWorkflowChange: (next: WorkflowConfig) => void
  /** Editor mode — drives status-only field affordances (e.g. horizontal
   * Initial/Final checkboxes per prototype). */
  editorMode?: "lifecycle" | "status"
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

export function SelectionPanel({
  workflow,
  selected,
  onWorkflowChange,
  editorMode = "lifecycle",
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

function NodeEditor({
  node,
  workflow,
  onWorkflowChange,
  editorMode,
  T,
}: {
  node: WorkflowNode
  workflow: WorkflowConfig
  onWorkflowChange: (next: WorkflowConfig) => void
  editorMode: "lifecycle" | "status"
  T: (tr: string, en: string) => string
}) {
  const updateNode = React.useCallback(
    (patch: Partial<WorkflowNode>) => {
      onWorkflowChange({
        ...workflow,
        nodes: workflow.nodes.map((n) =>
          n.id === node.id ? { ...n, ...patch } : n,
        ),
      })
    },
    [node.id, workflow, onWorkflowChange],
  )

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
