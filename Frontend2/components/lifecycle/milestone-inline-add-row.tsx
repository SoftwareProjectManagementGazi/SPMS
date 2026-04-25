"use client"

// MilestoneInlineAddRow (Phase 12 Plan 12-05) — inline-add Card revealed when
// the user clicks "Ekle" on the Milestones sub-tab.
//
// Anatomy: 12-UI-SPEC.md §6 lines 988-1014 — Card padding 14, marginBottom 12,
//   2-col grid `1fr 140px` for name + date + full-width chip picker for
//   `linked_phase_ids` + bottom 2 Buttons (Kaydet / İptal).
// Visual reference: New_Frontend/src/pages/lifecycle-tab.jsx lines 224-233.
// Decisions consumed: D-49 (inline-add row reveal pattern), D-50 (chip picker
//   multi-select sourced from non-archived workflow.nodes; empty linked_phase_ids
//   accepted per Phase 9 D-24).
//
// CONTEXT note: Both create AND edit consume this same component. Pass
// `initial` to seed the inputs from an existing milestone; the parent owns
// the onSave handler that decides POST vs PATCH.

import * as React from "react"
import { Plus, X } from "lucide-react"

import { Badge, Button, Card, Input } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { WorkflowConfig, WorkflowNode } from "@/services/lifecycle-service"

// Re-export the canonical Phase 12 milestone create DTO shape.
export interface MilestoneCreateDraft {
  name: string
  target_date: string
  linked_phase_ids: string[]
}

export interface MilestoneInlineAddRowProps {
  workflow: WorkflowConfig
  /** Optional seed when editing an existing milestone. */
  initial?: Partial<MilestoneCreateDraft>
  /** Promise so the caller can await the mutation result before closing the row. */
  onSave: (draft: MilestoneCreateDraft) => Promise<void> | void
  onCancel: () => void
}

export function MilestoneInlineAddRow({
  workflow,
  initial,
  onSave,
  onCancel,
}: MilestoneInlineAddRowProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const [name, setName] = React.useState(initial?.name ?? "")
  const [targetDate, setTargetDate] = React.useState(initial?.target_date ?? "")
  const [linkedPhaseIds, setLinkedPhaseIds] = React.useState<string[]>(
    initial?.linked_phase_ids ?? [],
  )
  const [chipOpen, setChipOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // Click-outside dismiss for the chip-picker dropdown (Phase 8 SidebarUserMenu
  // pattern — document mousedown listener gated on chipOpen).
  const dropdownRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    if (!chipOpen) return
    const handler = (e: MouseEvent) => {
      const root = dropdownRef.current
      if (!root) return
      if (!root.contains(e.target as Node)) {
        setChipOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [chipOpen])

  // Non-archived workflow nodes are the chip-picker options (D-50).
  const phaseOptions = React.useMemo(
    () => workflow.nodes.filter((n) => !n.isArchived),
    [workflow.nodes],
  )

  const phaseById = React.useMemo(() => {
    const m = new Map<string, WorkflowNode>()
    for (const n of workflow.nodes) m.set(n.id, n)
    return m
  }, [workflow.nodes])

  const togglePhase = (id: string) => {
    setLinkedPhaseIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  // Save button enable: requires name + targetDate. Empty linked_phase_ids
  // is explicitly allowed per Phase 9 D-24 (project-wide milestone).
  const canSave = name.trim().length > 0 && targetDate.length > 0 && !submitting

  const handleSave = async () => {
    if (!canSave) return
    setSubmitting(true)
    try {
      await onSave({
        name: name.trim(),
        target_date: targetDate,
        linked_phase_ids: linkedPhaseIds,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card padding={14} style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 140px",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <Input
          placeholder={T("Kilometre taşı adı…", "Milestone name…")}
          size="md"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%" }}
        />
        <Input
          type="date"
          size="md"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      {/* Chip picker — full width row */}
      <div ref={dropdownRef} style={{ position: "relative", marginBottom: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 6,
            minHeight: 32,
            padding: "4px 8px",
            background: "var(--surface)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "inset 0 0 0 1px var(--border)",
            cursor: "pointer",
          }}
          onClick={() => setChipOpen((v) => !v)}
        >
          {linkedPhaseIds.length === 0 ? (
            <span style={{ color: "var(--fg-subtle)", fontSize: 12.5 }}>
              {T(
                "Faz bağlamak için seçin (opsiyonel)",
                "Select phases to link (optional)",
              )}
            </span>
          ) : (
            linkedPhaseIds.map((id) => {
              const node = phaseById.get(id)
              if (!node) return null
              return (
                <Badge key={id} size="xs" tone="primary">
                  <span>{node.name}</span>
                  <span
                    role="button"
                    aria-label={T("Çıkar", "Remove")}
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePhase(id)
                    }}
                    style={{
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      marginLeft: 4,
                    }}
                  >
                    <X size={10} />
                  </span>
                </Badge>
              )
            })
          )}
          <span style={{ flex: 1 }} />
          <span
            style={{
              color: "var(--fg-subtle)",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <Plus size={12} />
          </span>
        </div>

        {chipOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 50,
              background: "var(--surface)",
              borderRadius: "var(--radius-sm)",
              boxShadow:
                "var(--shadow-md), inset 0 0 0 1px var(--border-strong)",
              padding: 6,
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {phaseOptions.length === 0 ? (
              <div
                style={{
                  padding: 8,
                  fontSize: 12,
                  color: "var(--fg-subtle)",
                  textAlign: "center",
                }}
              >
                {T("Seçilecek faz yok.", "No phases available.")}
              </div>
            ) : (
              phaseOptions.map((node) => {
                const selected = linkedPhaseIds.includes(node.id)
                return (
                  <div
                    key={node.id}
                    role="button"
                    onClick={() => togglePhase(node.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      fontSize: 12.5,
                      color: "var(--fg)",
                      background: selected
                        ? "color-mix(in oklch, var(--primary) 8%, transparent)"
                        : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      readOnly
                      style={{ pointerEvents: "none" }}
                    />
                    <span>{node.name}</span>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <Button
          size="sm"
          variant="primary"
          disabled={!canSave}
          onClick={handleSave}
        >
          {T("Kaydet", "Save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {T("İptal", "Cancel")}
        </Button>
      </div>
    </Card>
  )
}
