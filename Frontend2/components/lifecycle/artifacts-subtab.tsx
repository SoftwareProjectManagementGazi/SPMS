"use client"

import * as React from "react"
import { FileText, MoreHorizontal, Plus, Sparkles, CheckCircle2 } from "lucide-react"

import {
  Avatar,
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
  useSeedArtifacts,
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
    case "completed":
    case "approved":
      return "var(--status-done)"
    case "in_progress":
      return "var(--status-review)"
    default:
      return "var(--border-strong)"
  }
}

function statusLabel(s: ArtifactStatus, tr: boolean): string {
  switch (s) {
    case "completed":
      return tr ? "Tamamlandı" : "Completed"
    case "approved":
      return tr ? "Onaylandı" : "Approved"
    case "in_progress":
      return tr ? "Devam Ediyor" : "In Progress"
    default:
      return tr ? "Oluşturulmadı" : "Not Created"
  }
}

function statusBg(s: ArtifactStatus): string {
  switch (s) {
    case "completed":
      return "color-mix(in oklch, var(--status-done) 12%, transparent)"
    case "approved":
      return "color-mix(in oklch, var(--primary) 12%, transparent)"
    case "in_progress":
      return "color-mix(in oklch, var(--status-review) 12%, transparent)"
    default:
      return "var(--surface-2)"
  }
}

function statusFg(s: ArtifactStatus): string {
  switch (s) {
    case "completed":
      return "var(--status-done)"
    case "approved":
      return "var(--primary)"
    case "in_progress":
      return "var(--status-review)"
    default:
      return "var(--fg-muted)"
  }
}

function methodologyLabel(m: string | undefined, tr: boolean): string {
  switch ((m ?? "").toUpperCase()) {
    case "SCRUM":
      return "Scrum"
    case "KANBAN":
      return "Kanban"
    case "WATERFALL":
      return tr ? "Şelale" : "Waterfall"
    default:
      return m ?? ""
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

const GRID = "2fr 140px 130px 90px 40px"

// ----------------------------------------------------------------------------
// Progress bar
// ----------------------------------------------------------------------------

function ArtifactProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 180 }}>
      <div
        style={{
          flex: 1,
          height: 5,
          borderRadius: 999,
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 999,
            background: allDone ? "var(--status-done)" : "var(--primary)",
            transition: "width 0.35s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 11.5, color: allDone ? "var(--status-done)" : "var(--fg-muted)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}>
        {allDone && <CheckCircle2 size={11} />}
        {done}/{total}
      </span>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Empty state
// ----------------------------------------------------------------------------

function ArtifactsEmptyState({
  methodology,
  canEdit,
  seeding,
  onSeed,
  onAdd,
  isTr,
}: {
  methodology: string | undefined
  canEdit: boolean
  seeding: boolean
  onSeed: () => void
  onAdd: () => void
  isTr: boolean
}) {
  const hasTemplate = ["SCRUM", "KANBAN", "WATERFALL"].includes(
    (methodology ?? "").toUpperCase(),
  )
  const T = (tr: string, en: string) => (isTr ? tr : en)

  return (
    <Card padding={0}>
      <div
        style={{
          padding: "36px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FileText size={20} style={{ color: "var(--fg-subtle)" }} />
        </div>

        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>
            {T("Henüz artefakt yok", "No artifacts yet")}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-muted)", maxWidth: 320 }}>
            {hasTemplate
              ? T(
                  `${methodologyLabel(methodology, isTr)} metodolojisi için standart artefaktları tek tıkla ekleyebilir veya özel artefakt oluşturabilirsiniz.`,
                  `Add standard ${methodologyLabel(methodology, isTr)} artifacts in one click, or create a custom one.`,
                )
              : T(
                  "Projeye artefakt ekleyerek teslimat belgelerinizi takip edin.",
                  "Track your deliverables by adding artifacts to the project.",
                )}
          </div>
        </div>

        {canEdit && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {hasTemplate && (
              <Button
                size="sm"
                variant="primary"
                icon={<Sparkles size={13} />}
                disabled={seeding}
                onClick={onSeed}
              >
                {seeding
                  ? T("Ekleniyor…", "Adding…")
                  : T(
                      `${methodologyLabel(methodology, isTr)} Şablonunu Uygula`,
                      `Apply ${methodologyLabel(methodology, isTr)} Template`,
                    )}
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus size={12} />}
              onClick={onAdd}
            >
              {T("Özel Artefakt Ekle", "Add Custom Artifact")}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function ArtifactsSubTab({ project, workflow }: ArtifactsSubTabProps) {
  void workflow
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  const isTr = language === "tr"

  const { data: artifacts = [] } = useArtifacts(project.id)
  const create = useCreateArtifact(project.id)
  const remove = useDeleteArtifact(project.id)
  const seed = useSeedArtifacts(project.id)
  const canEdit = useTransitionAuthority(
    project as { id: number; managerId?: number | null; manager_id?: number | null },
  )

  const [expandedId, setExpandedId] = React.useState<number | null>(null)
  const [adding, setAdding] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<number | null>(null)
  const [openKebabId, setOpenKebabId] = React.useState<number | null>(null)

  const kebabRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    if (openKebabId == null) return
    const handler = (e: MouseEvent) => {
      if (!kebabRef.current?.contains(e.target as Node)) setOpenKebabId(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [openKebabId])

  const artifactToDelete = React.useMemo(
    () => artifacts.find((a) => a.id === confirmDeleteId) ?? null,
    [artifacts, confirmDeleteId],
  )

  const initiateDelete = (artifact: Artifact) => {
    setOpenKebabId(null)
    if (artifact.status === "not_created") {
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
      await create.mutateAsync({ name, status: "not_created", assignee_id: null })
      setAdding(false)
      setNewName("")
    } catch {
      // keep form open on error
    }
  }

  const handleSeed = () => {
    void seed.mutateAsync()
  }

  const doneCount = artifacts.filter(
    (a) => a.status === "completed" || a.status === "approved",
  ).length

  // ---- Empty state ----
  if (artifacts.length === 0 && !adding) {
    return (
      <>
        <ArtifactsEmptyState
          methodology={project.methodology}
          canEdit={canEdit}
          seeding={seed.isPending}
          onSeed={handleSeed}
          onAdd={() => setAdding(true)}
          isTr={isTr}
        />
      </>
    )
  }

  return (
    <div>
      {/* ---- Header ---- */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>
          {T("Artefaktlar", "Artifacts")}
          <span style={{ fontWeight: 400, color: "var(--fg-muted)", marginLeft: 6, fontSize: 13 }}>
            ({artifacts.length})
          </span>
        </div>

        {/* Progress bar */}
        <ArtifactProgressBar done={doneCount} total={artifacts.length} />

        <div style={{ flex: 1 }} />

        {canEdit && !adding && (
          <div style={{ display: "flex", gap: 6 }}>
            {["SCRUM", "KANBAN", "WATERFALL"].includes(
              (project.methodology ?? "").toUpperCase(),
            ) && (
              <Button
                size="sm"
                variant="ghost"
                icon={<Sparkles size={12} />}
                disabled={seed.isPending}
                onClick={handleSeed}
              >
                {T("Şablonu Uygula", "Apply Template")}
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus size={12} />}
              onClick={() => setAdding(true)}
            >
              {T("Artefakt Ekle", "Add Artifact")}
            </Button>
          </div>
        )}
      </div>

      {/* ---- Inline add row ---- */}
      {adding && canEdit && (
        <Card padding={14} style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <Input
              placeholder={T("Artefakt adı…", "Artifact name…")}
              size="md"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCustomAdd()
                if (e.key === "Escape") { setAdding(false); setNewName("") }
              }}
              style={{ width: "100%" }}
              autoFocus
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Button size="sm" variant="primary" disabled={!newName.trim() || create.isPending} onClick={handleCustomAdd}>
              {T("Kaydet", "Save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewName("") }}>
              {T("İptal", "Cancel")}
            </Button>
          </div>
        </Card>
      )}

      {/* ---- Row table ---- */}
      <Card padding={0}>
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID,
            padding: "10px 14px",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.5,
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
                  background: isExpanded ? "var(--surface-2)" : "transparent",
                  transition: "background 0.15s",
                }}
              >
                {/* Name */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={13} style={{ color: "var(--fg-muted)", flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{a.name}</span>
                  {a.fileId != null && (
                    <span
                      title={T("Dosya bağlı", "File attached")}
                      style={{ fontSize: 10, color: "var(--primary)", marginLeft: 2 }}
                    >
                      📎
                    </span>
                  )}
                </div>

                {/* Status badge */}
                <div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 500,
                      background: statusBg(a.status),
                      color: statusFg(a.status),
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: statusDotColor(a.status),
                        flexShrink: 0,
                      }}
                    />
                    {statusLabel(a.status, isTr)}
                  </span>
                </div>

                {/* Updated at */}
                <div style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>
                  {formatUpdatedAt(a.updatedAt, isTr)}
                </div>

                {/* Assignee */}
                <div>
                  {a.assigneeId != null ? (
                    <Avatar
                      user={{
                        initials: `U${a.assigneeId}`,
                        avColor: ((a.assigneeId - 1) % 8) + 1,
                      }}
                      size={20}
                      href={`/users/${a.assigneeId}`}
                    />
                  ) : (
                    <span style={{ color: "var(--fg-subtle)", fontSize: 12 }}>—</span>
                  )}
                </div>

                {/* Kebab */}
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
                        borderRadius: "var(--radius-sm)",
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
                        boxShadow: "var(--shadow-md), inset 0 0 0 1px var(--border-strong)",
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

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title={T("Artefaktı Sil", "Delete Artifact")}
        body={T(
          artifactToDelete
            ? `"${artifactToDelete.name}" silinsin mi? Bu işlem geri alınamaz.`
            : "Bu artefaktı silmek istediğinize emin misiniz?",
          artifactToDelete
            ? `Delete "${artifactToDelete.name}"? This cannot be undone.`
            : "Are you sure you want to delete this artifact?",
        )}
        confirmLabel={T("Sil", "Delete")}
        cancelLabel={T("İptal", "Cancel")}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
