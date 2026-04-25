"use client"

// ArtifactsSubTab (Phase 12 Plan 12-06) — last sub-tab of the LifecycleTab,
// replacing the Plan 12-04 placeholder. Lists project artifacts as a 5-column
// row table with click-to-expand inline editor (ArtifactInlineExpand).
//
// Anatomy: 12-UI-SPEC.md §3 + §7 (lines 380-440 + 1016-1064).
// Visual reference: New_Frontend/src/pages/lifecycle-tab.jsx lines 340-406.
// Decisions consumed:
//   - D-52 row table + inline expand
//   - D-53 single-assignee dropdown sourced from project members (stub for
//     now — manager + self until /projects/{id}/members lands)
//   - D-54 PM with transition-authority can delete `not-created` artifacts
//     directly; in-progress (`draft`) artifacts surface a soft-warning
//     ConfirmDialog before delete; methodology change is a no-op on existing
//     artifacts (Phase 9 D-29 preserved — frontend never duplicates cascade
//     logic).
//   - D-40 permission gate via useTransitionAuthority — Add / Sil hidden
//     when authority returns false.
//
// CRUD: optimistic via Plan 12-01 hooks (useArtifacts /
// useUpdateArtifact[Mine] / useDeleteArtifact / useCreateArtifact /
// useUploadArtifactFile). Phase 11 D-38 cancelQueries + setQueryData +
// rollback + invalidate pattern is encapsulated inside the hooks.

import * as React from "react"
import { FileText, MoreHorizontal, Plus } from "lucide-react"

import {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { ConfirmDialog } from "@/components/projects/confirm-dialog"
import {
  useArtifacts,
  useCreateArtifact,
  useDeleteArtifact,
} from "@/hooks/use-artifacts"
import { useTransitionAuthority } from "@/hooks/use-transition-authority"
import type { Artifact, ArtifactStatus } from "@/services/artifact-service"
import type { WorkflowConfig } from "@/services/lifecycle-service"

import { ArtifactInlineExpand } from "./artifact-inline-expand"

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface ArtifactsSubTabProject {
  id: number
  managerId?: number | null
  manager_id?: number | null
  methodology?: string
}

export interface ArtifactsSubTabProps {
  project: ArtifactsSubTabProject
  workflow: WorkflowConfig
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function statusDotColor(s: ArtifactStatus): string {
  switch (s) {
    case "done":
      return "var(--status-done)"
    case "draft":
      return "var(--status-review)"
    default:
      return "var(--border-strong)"
  }
}

function statusLabel(s: ArtifactStatus, tr: boolean): string {
  switch (s) {
    case "done":
      return tr ? "Tamamlandı" : "Done"
    case "draft":
      return tr ? "Taslak" : "Draft"
    default:
      return tr ? "Oluşturulmadı" : "Not Created"
  }
}

function formatUpdatedAt(iso: string, tr: boolean): string {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString(tr ? "tr-TR" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

const GRID =
  "2fr 120px 150px 100px 40px"

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function ArtifactsSubTab({ project, workflow }: ArtifactsSubTabProps) {
  void workflow // workflow reserved for future per-phase artifact filtering
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  const isTr = language === "tr"

  const { data: artifacts = [] } = useArtifacts(project.id)
  const create = useCreateArtifact(project.id)
  const remove = useDeleteArtifact(project.id)
  const canEdit = useTransitionAuthority(
    project as { id: number; managerId?: number | null; manager_id?: number | null },
  )

  const [expandedId, setExpandedId] = React.useState<number | null>(null)
  const [adding, setAdding] = React.useState(false)
  const [newName, setNewName] = React.useState("")

  // Soft-warning delete state — for `draft` artifacts ConfirmDialog appears
  // before the DELETE; for `not-created` artifacts the DELETE is direct.
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<number | null>(
    null,
  )
  const [openKebabId, setOpenKebabId] = React.useState<number | null>(null)

  const kebabRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    if (openKebabId == null) return
    const handler = (e: MouseEvent) => {
      const root = kebabRef.current
      if (!root) return
      if (!root.contains(e.target as Node)) {
        setOpenKebabId(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [openKebabId])

  const draftArtifactToDelete = React.useMemo(
    () => artifacts.find((a) => a.id === confirmDeleteId) ?? null,
    [artifacts, confirmDeleteId],
  )

  // Click-Sil flow:
  //   - Status 'not-created' → fire DELETE directly (no confirmation)
  //   - Status 'draft' or 'done' → open soft-warning ConfirmDialog
  const initiateDelete = (artifact: Artifact) => {
    setOpenKebabId(null)
    if (artifact.status === "not-created") {
      void remove.mutateAsync(artifact.id)
      return
    }
    setConfirmDeleteId(artifact.id)
  }

  const confirmDelete = async () => {
    if (confirmDeleteId == null) return
    try {
      await remove.mutateAsync(confirmDeleteId)
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const handleCustomAdd = async () => {
    const name = newName.trim()
    if (!name) return
    try {
      await create.mutateAsync({
        name,
        status: "not-created",
        assignee_id: null,
      })
      setAdding(false)
      setNewName("")
    } catch {
      // Hook handles invalidation; keep the form open so user can retry.
    }
  }

  const doneCount = artifacts.filter((a) => a.status === "done").length

  return (
    <div>
      {/* Section header — count + Add button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>
          {T("Artefaktlar", "Artifacts")} ({artifacts.length})
        </div>
        <span style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>
          {doneCount}/{artifacts.length} {T("tamamlandı", "completed")}
        </span>
        <div style={{ flex: 1 }} />
        {canEdit && !adding && (
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus size={12} />}
            onClick={() => setAdding(true)}
          >
            {T("Yeni Artefakt Ekle", "Add Custom Artifact")}
          </Button>
        )}
      </div>

      {/* Inline custom-add row — same spirit as MilestoneInlineAddRow but
          name-only (no chip picker) per Plan 12-06 action step 2. */}
      {adding && canEdit && (
        <Card padding={14} style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <Input
              placeholder={T("Artefakt adı…", "Artifact name…")}
              size="md"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Button
              size="sm"
              variant="primary"
              disabled={!newName.trim() || create.isPending}
              onClick={handleCustomAdd}
            >
              {T("Kaydet", "Save")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false)
                setNewName("")
              }}
            >
              {T("İptal", "Cancel")}
            </Button>
          </div>
        </Card>
      )}

      {/* Row table */}
      {artifacts.length === 0 && !adding ? (
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
            "Bu metodoloji için tanımlı artefakt bulunamadı.",
            "No artifacts defined for this methodology.",
          )}
        </div>
      ) : (
        <Card padding={0}>
          {/* Header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
              padding: "10px 14px",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              color: "var(--fg-subtle)",
              fontWeight: 600,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div>{T("Artefakt", "Artifact")}</div>
            <div>{T("Durum", "Status")}</div>
            <div>{T("Güncelleme", "Updated")}</div>
            <div>{T("Sorumlu", "Owner")}</div>
            <div />
          </div>

          {artifacts.map((a) => {
            const isExpanded = expandedId === a.id
            const isKebabOpen = openKebabId === a.id
            return (
              <React.Fragment key={a.id}>
                <div
                  role="button"
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: GRID,
                    padding: "10px 14px",
                    alignItems: "center",
                    fontSize: 12.5,
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    background: isExpanded
                      ? "var(--surface-2)"
                      : "transparent",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <FileText
                      size={13}
                      style={{ color: "var(--fg-muted)" }}
                    />
                    <span style={{ fontWeight: 500 }}>{a.name}</span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: statusDotColor(a.status),
                      }}
                    />
                    <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                      {statusLabel(a.status, isTr)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>
                    {formatUpdatedAt(a.updatedAt, isTr)}
                  </div>
                  <div>
                    {a.assigneeId != null ? (
                      <Avatar
                        user={{
                          initials: `U${a.assigneeId}`,
                          avColor: ((a.assigneeId - 1) % 8) + 1,
                        }}
                        size={20}
                      />
                    ) : (
                      <span style={{ color: "var(--fg-subtle)" }}>—</span>
                    )}
                  </div>
                  <div
                    ref={isKebabOpen ? kebabRef : null}
                    style={{ position: "relative" }}
                  >
                    {canEdit && (
                      <button
                        type="button"
                        aria-label={T("Daha Fazla", "More")}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenKebabId(isKebabOpen ? null : a.id)
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--fg-subtle)",
                          padding: 2,
                        }}
                      >
                        <MoreHorizontal size={13} />
                      </button>
                    )}
                    {isKebabOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: "calc(100% + 4px)",
                          right: 0,
                          minWidth: 120,
                          zIndex: 50,
                          background: "var(--surface)",
                          borderRadius: "var(--radius-sm)",
                          boxShadow:
                            "var(--shadow-md), inset 0 0 0 1px var(--border-strong)",
                          padding: 4,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => initiateDelete(a)}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            padding: "6px 10px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 12.5,
                            color: "var(--priority-critical)",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          {T("Sil", "Delete")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <ArtifactInlineExpand
                    artifact={a}
                    project={project}
                    onClose={() => setExpandedId(null)}
                  />
                )}
              </React.Fragment>
            )
          })}
        </Card>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title={T("Artefaktı Sil", "Delete Artifact")}
        body={T(
          draftArtifactToDelete
            ? `Bu artefakt taslak durumunda. ${draftArtifactToDelete.name} silinsin mi?`
            : "Bu artefakt taslak durumunda. Silmek istediğinize emin misiniz?",
          draftArtifactToDelete
            ? `This artifact is in draft state. Delete ${draftArtifactToDelete.name}?`
            : "This artifact is in draft state. Are you sure you want to delete it?",
        )}
        confirmLabel={T("Sil", "Delete")}
        cancelLabel={T("İptal", "Cancel")}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
