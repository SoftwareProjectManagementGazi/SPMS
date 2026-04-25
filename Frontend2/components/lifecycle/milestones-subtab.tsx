"use client"

// MilestonesSubTab (Phase 12 Plan 12-05) — third sub-tab of the LifecycleTab,
// replacing the Plan 12-04 placeholder. Lists project milestones as cards with
// an inline-add row reveal pattern (D-49) + chip picker (D-50) + ConfirmDialog
// delete (Phase 10 D-25).
//
// Anatomy: 12-UI-SPEC.md §3.6 Milestones Sub-tab + §6 MilestoneInlineAddRow.
// Visual reference: New_Frontend/src/pages/lifecycle-tab.jsx lines 206-267.
// Decisions consumed: D-49 (inline-add reveal), D-50 (chip picker multi-select,
//   empty allowed), D-40 (permission gate via useTransitionAuthority — Add /
//   Edit / Delete buttons hidden when authority returns false).
//
// CRUD: optimistic via Plan 12-01 hooks (useMilestones / useCreateMilestone /
// useUpdateMilestone / useDeleteMilestone) — Phase 11 D-38 cancelQueries +
// setQueryData + rollback + invalidate pattern.
//
// Project-wide milestones are accepted (linked_phase_ids: []) — the component
// does not enforce a min length on the chip picker (Phase 9 D-24).

import * as React from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import {
  Badge,
  Button,
  Card,
  ProgressBar,
  Section,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { ConfirmDialog } from "@/components/projects/confirm-dialog"
import {
  useCreateMilestone,
  useDeleteMilestone,
  useMilestones,
  useUpdateMilestone,
} from "@/hooks/use-milestones"
import { useTransitionAuthority } from "@/hooks/use-transition-authority"
import type { Milestone } from "@/services/milestone-service"
import type {
  WorkflowConfig,
  WorkflowNode,
} from "@/services/lifecycle-service"

import {
  MilestoneInlineAddRow,
  type MilestoneCreateDraft,
} from "./milestone-inline-add-row"

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface MilestonesSubTabProject {
  id: number
  managerId?: number | null
  manager_id?: number | null
}

export interface MilestonesSubTabProps {
  project: MilestonesSubTabProject
  workflow: WorkflowConfig
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function statusTone(status: string): "neutral" | "info" | "success" {
  const s = (status ?? "").toUpperCase()
  if (s === "COMPLETED" || s === "DONE") return "success"
  if (s === "IN_PROGRESS" || s === "ACTIVE") return "info"
  return "neutral"
}

function statusLabel(status: string, tr: boolean): string {
  const s = (status ?? "").toUpperCase()
  if (s === "COMPLETED" || s === "DONE") return tr ? "Tamamlandı" : "Done"
  if (s === "IN_PROGRESS" || s === "ACTIVE") return tr ? "Devam Ediyor" : "In Progress"
  return tr ? "Bekliyor" : "Pending"
}

function daysFromToday(targetDate: string): number {
  const target = new Date(targetDate).getTime()
  const today = Date.now()
  return Math.ceil((target - today) / 86400000)
}

function formatTargetDate(targetDate: string, tr: boolean): string {
  return new Date(targetDate).toLocaleDateString(tr ? "tr-TR" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// Project-progress derivation when linked phases are present. When
// linkedPhaseIds is empty, return null so the caller renders an em-dash.
function deriveMilestoneProgress(
  milestone: Milestone,
  workflow: WorkflowConfig,
): number | null {
  if (!milestone.linkedPhaseIds || milestone.linkedPhaseIds.length === 0) {
    return null
  }
  // Without per-phase task counts here, we shape the value as a uniform
  // percentage based on milestone status as a graceful fallback. The real
  // per-phase progress lands when Plan 12-06 wires phase-task counts.
  const s = (milestone.status ?? "").toUpperCase()
  if (s === "COMPLETED" || s === "DONE") return 100
  if (s === "IN_PROGRESS" || s === "ACTIVE") return 50
  return 0
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function MilestonesSubTab({
  project,
  workflow,
}: MilestonesSubTabProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  const isTr = language === "tr"

  const { data: milestones = [], isLoading } = useMilestones(project.id)
  const create = useCreateMilestone(project.id)
  const update = useUpdateMilestone(project.id)
  const remove = useDeleteMilestone(project.id)
  const canEdit = useTransitionAuthority(
    project as { id: number; managerId?: number | null; manager_id?: number | null },
  )

  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)

  const phaseById = React.useMemo(() => {
    const m = new Map<string, WorkflowNode>()
    for (const n of workflow.nodes) m.set(n.id, n)
    return m
  }, [workflow.nodes])

  const milestoneToDelete = React.useMemo(
    () => milestones.find((m) => m.id === deletingId) ?? null,
    [milestones, deletingId],
  )

  const handleCreate = React.useCallback(
    async (draft: MilestoneCreateDraft) => {
      try {
        await create.mutateAsync(draft)
        setAdding(false)
      } catch {
        // Rollback already handled by useCreateMilestone onError; keep the row
        // open so the user can correct and retry.
      }
    },
    [create],
  )

  const handleUpdate = React.useCallback(
    async (id: number, draft: MilestoneCreateDraft) => {
      try {
        await update.mutateAsync({
          id,
          dto: {
            name: draft.name,
            target_date: draft.target_date,
            linked_phase_ids: draft.linked_phase_ids,
          },
        })
        setEditingId(null)
      } catch {
        // onError rolls back; keep edit row open.
      }
    },
    [update],
  )

  const handleDeleteConfirm = React.useCallback(async () => {
    if (deletingId == null) return
    try {
      await remove.mutateAsync(deletingId)
    } finally {
      setDeletingId(null)
    }
  }, [deletingId, remove])

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <Section
          title={T("Kilometre Taşları", "Milestones")}
          subtitle={`${milestones.length} ${T("tanımlı", "defined")}`}
        >
          {/* Section requires children — empty fragment keeps layout */}
          <></>
        </Section>
        <div style={{ flex: 1 }} />
        {canEdit && !adding && (
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus size={12} />}
            onClick={() => setAdding(true)}
          >
            {T("Ekle", "Add")}
          </Button>
        )}
      </div>

      {/* Inline add row at the TOP of the list per D-49 */}
      {adding && canEdit && (
        <MilestoneInlineAddRow
          workflow={workflow}
          onSave={handleCreate}
          onCancel={() => setAdding(false)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {milestones.map((ms) => {
          // Edit-in-place: replace the card with the inline-add row seeded
          // from the existing milestone.
          if (editingId === ms.id && canEdit) {
            return (
              <MilestoneInlineAddRow
                key={ms.id}
                workflow={workflow}
                initial={{
                  name: ms.name,
                  target_date: ms.targetDate,
                  linked_phase_ids: ms.linkedPhaseIds ?? [],
                }}
                onSave={(draft) => handleUpdate(ms.id, draft)}
                onCancel={() => setEditingId(null)}
              />
            )
          }

          const status = (ms.status ?? "").toUpperCase()
          const dLeft = daysFromToday(ms.targetDate)
          const overdue = status !== "COMPLETED" && status !== "DONE" && dLeft < 0
          const progress = deriveMilestoneProgress(ms, workflow)

          return (
            <Card
              key={ms.id}
              padding={14}
              style={{
                borderLeft: `3px solid ${
                  overdue ? "var(--priority-critical)" : "var(--primary)"
                }`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}
                  >
                    {ms.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      color: overdue
                        ? "var(--priority-critical)"
                        : "var(--fg-muted)",
                      marginTop: 2,
                    }}
                  >
                    {formatTargetDate(ms.targetDate, isTr)}
                    {status !== "COMPLETED" && status !== "DONE" && (
                      <>
                        {" · "}
                        {overdue
                          ? T(`${-dLeft} gün gecikti`, `${-dLeft}d overdue`)
                          : T(`${dLeft} gün kaldı`, `${dLeft}d left`)}
                      </>
                    )}
                  </div>
                </div>
                <Badge tone={statusTone(ms.status)} dot>
                  {statusLabel(ms.status, isTr)}
                </Badge>
                {canEdit && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      icon={<Pencil size={12} />}
                      title={T("Düzenle", "Edit")}
                      onClick={() => setEditingId(ms.id)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      icon={<Trash2 size={12} />}
                      title={T("Sil", "Delete")}
                      onClick={() => setDeletingId(ms.id)}
                    />
                  </>
                )}
              </div>

              {/* Linked phases preview */}
              {ms.linkedPhaseIds && ms.linkedPhaseIds.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                    marginTop: 8,
                  }}
                >
                  {ms.linkedPhaseIds.map((pid) => {
                    const node = phaseById.get(pid)
                    if (!node) return null
                    return (
                      <Badge key={pid} size="xs" tone="neutral">
                        {node.name}
                      </Badge>
                    )
                  })}
                </div>
              )}

              {/* ProgressBar derived from linked phases */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <ProgressBar value={progress ?? 0} style={{ flex: 1 }} />
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: "var(--fg-muted)",
                  }}
                >
                  {progress != null ? `%${progress}` : "—"}
                </span>
              </div>
            </Card>
          )
        })}

        {!isLoading && milestones.length === 0 && !adding && (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: "var(--fg-subtle)",
              fontSize: 12.5,
              border: "1px dashed var(--border-strong)",
              borderRadius: "var(--radius)",
            }}
          >
            {T(
              "Henüz kilometre taşı tanımlanmamış.",
              "No milestones defined yet.",
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deletingId !== null}
        title={T("Kilometre Taşını Sil", "Delete Milestone")}
        body={T(
          milestoneToDelete
            ? `${milestoneToDelete.name} silinsin mi? Bu işlem geri alınamaz.`
            : "Bu işlem geri alınamaz.",
          milestoneToDelete
            ? `Delete ${milestoneToDelete.name}? This cannot be undone.`
            : "This action cannot be undone.",
        )}
        confirmLabel={T("Sil", "Delete")}
        cancelLabel={T("İptal", "Cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}
