"use client"

// SprintsSubTab — sprint yönetimi için Yaşam Döngüsü altsekmesi.
// Yalnızca SCRUM metodolojisindeki projelerde görünür.
// Özellikler: sprint listesi, oluşturma formu, kapatma ve silme (görev taşıma ile).

import * as React from "react"
import { Plus, X } from "lucide-react"

import { Badge, Button, Section } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import {
  useSprints,
  useCreateSprint,
  useActivateSprint,
  useCloseSprint,
  useDeleteSprint,
  type Sprint,
} from "@/hooks/use-sprints"
import type { Project } from "@/services/project-service"

interface SprintsSubTabProps {
  project: Project
}

type SprintStatus = "planned" | "active" | "closed"

function getStatus(sprint: Sprint): SprintStatus {
  if (sprint.is_active) return "active"
  const today = new Date()
  if (sprint.end_date && new Date(sprint.end_date) < today) return "closed"
  const started = sprint.start_date && new Date(sprint.start_date) <= today
  const notEnded = !sprint.end_date || new Date(sprint.end_date) >= today
  if (started && notEnded) return "active"
  return "planned"
}

const inputStyle: React.CSSProperties = {
  height: 32,
  padding: "0 8px",
  fontSize: 13,
  background: "var(--surface-2)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "inset 0 0 0 1px var(--border)",
  color: "var(--fg)",
  width: "100%",
  border: "none",
  fontFamily: "var(--font-sans)",
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  paddingRight: 28,
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
}

const labelStyle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: "var(--fg-muted)",
  display: "block",
  marginBottom: 4,
}

function statusBadgeTone(status: SprintStatus): "success" | "primary" | "neutral" {
  if (status === "active") return "success"
  if (status === "planned") return "primary"
  return "neutral"
}

function formatDate(d: string | null, lang: "tr" | "en") {
  if (!d) return null
  const date = new Date(d)
  return date.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// ---- Confirm Dialog ----------------------------------------------------------

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  sprints: Sprint[]
  currentSprintId: number
  confirmLabel: string
  destructive?: boolean
  pending?: boolean
  lang: "tr" | "en"
  onConfirm: (targetId: number | null) => void
  onCancel: () => void
}

function MoveConfirmDialog({
  open,
  title,
  description,
  sprints,
  currentSprintId,
  confirmLabel,
  destructive,
  pending,
  lang,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [target, setTarget] = React.useState<string>("backlog")
  const others = sprints.filter((s) => s.id !== currentSprintId)

  if (!open) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "oklch(0 0 0 / 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-xl)",
          width: 420,
          maxWidth: "calc(100vw - 32px)",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)" }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 16 }}>{description}</p>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>{lang === "tr" ? "Görevleri taşı:" : "Move tasks to:"}</label>
          <select value={target} onChange={(e) => setTarget(e.target.value)} style={selectStyle}>
            <option value="backlog">{lang === "tr" ? "Backlog (sprint yok)" : "Backlog (no sprint)"}</option>
            {others.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            {lang === "tr" ? "Vazgeç" : "Cancel"}
          </Button>
          <Button
            size="sm"
            variant={destructive ? "danger" : "primary"}
            disabled={pending}
            onClick={() => onConfirm(target === "backlog" ? null : Number(target))}
          >
            {pending ? (lang === "tr" ? "İşleniyor..." : "Processing...") : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---- Main Component ----------------------------------------------------------

export function SprintsSubTab({ project }: SprintsSubTabProps) {
  const { language: lang } = useApp()
  const T = (tr: string, en: string) => (lang === "tr" ? tr : en)

  const { data: sprints = [], isLoading } = useSprints(project.id)
  const createSprint = useCreateSprint(project.id)
  const activateSprint = useActivateSprint(project.id)
  const closeSprint = useCloseSprint(project.id)
  const deleteSprint = useDeleteSprint(project.id)

  // Create form
  const [showForm, setShowForm] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [newGoal, setNewGoal] = React.useState("")
  const [newStart, setNewStart] = React.useState("")
  const [newEnd, setNewEnd] = React.useState("")

  // Dialogs
  const [closeDialog, setCloseDialog] = React.useState<Sprint | null>(null)
  const [deleteDialog, setDeleteDialog] = React.useState<Sprint | null>(null)

  function handleCreate() {
    if (!newName.trim()) return
    createSprint.mutate(
      {
        project_id: project.id,
        name: newName.trim(),
        goal: newGoal.trim() || undefined,
        start_date: newStart || undefined,
        end_date: newEnd || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false)
          setNewName("")
          setNewGoal("")
          setNewStart("")
          setNewEnd("")
        },
      },
    )
  }

  function handleClose(targetId: number | null) {
    if (!closeDialog) return
    closeSprint.mutate(
      { sprintId: closeDialog.id, moveTasksToSprintId: targetId },
      { onSuccess: () => setCloseDialog(null) },
    )
  }

  function handleDelete(targetId: number | null) {
    if (!deleteDialog) return
    deleteSprint.mutate(
      { sprintId: deleteDialog.id, moveTasksTo: targetId },
      { onSuccess: () => setDeleteDialog(null) },
    )
  }

  if (isLoading) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center", color: "var(--fg-muted)", fontSize: 13 }}>
        {T("Yükleniyor...", "Loading...")}
      </div>
    )
  }

  return (
    <Section>
      {/* Create button / form */}
      {!showForm ? (
        <div style={{ marginBottom: 16 }}>
          <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>
            <Plus size={14} style={{ marginRight: 6 }} />
            {T("Sprint Oluştur", "Create Sprint")}
          </Button>
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: "var(--radius)",
            padding: 16,
            marginBottom: 16,
            boxShadow: "inset 0 0 0 1px var(--border)",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 13, display: "block", marginBottom: 12 }}>
            {T("Yeni Sprint", "New Sprint")}
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{T("Ad", "Name")} *</label>
              <input
                style={inputStyle}
                placeholder={T("Sprint adı", "Sprint name")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{T("Hedef", "Goal")}</label>
              <input
                style={inputStyle}
                placeholder={T("Sprint hedefi (isteğe bağlı)", "Sprint goal (optional)")}
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>{T("Başlangıç", "Start")}</label>
              <input type="date" style={inputStyle} value={newStart} onChange={(e) => setNewStart(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>{T("Bitiş", "End")}</label>
              <input type="date" style={inputStyle} value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              size="sm"
              variant="primary"
              disabled={!newName.trim() || createSprint.isPending}
              onClick={handleCreate}
            >
              {createSprint.isPending ? T("Oluşturuluyor...", "Creating...") : T("Oluştur", "Create")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowForm(false)
                setNewName("")
                setNewGoal("")
                setNewStart("")
                setNewEnd("")
              }}
            >
              {T("Vazgeç", "Cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Sprint list */}
      {sprints.length === 0 ? (
        <div
          style={{
            padding: "40px 24px",
            textAlign: "center",
            color: "var(--fg-muted)",
            fontSize: 13,
            borderRadius: "var(--radius)",
            border: "1.5px dashed var(--border)",
          }}
        >
          {T("Henüz sprint yok. Bir sprint oluşturarak başlayın.", "No sprints yet. Create one to get started.")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sprints.map((sprint) => {
            const status = getStatus(sprint)
            const start = formatDate(sprint.start_date, lang)
            const end = formatDate(sprint.end_date, lang)
            return (
              <div
                key={sprint.id}
                style={{
                  background: "var(--surface)",
                  borderRadius: "var(--radius)",
                  padding: "14px 16px",
                  boxShadow: "inset 0 0 0 1px var(--border)",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{sprint.name}</span>
                    <Badge tone={statusBadgeTone(status)}>
                      {status === "active"
                        ? T("Aktif", "Active")
                        : status === "planned"
                        ? T("Planlandı", "Planned")
                        : T("Kapalı", "Closed")}
                    </Badge>
                  </div>
                  {(start || end) && (
                    <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                      {start && end
                        ? `${start} — ${end}`
                        : start
                        ? `${T("Başlangıç:", "From:")} ${start}`
                        : `${T("Bitiş:", "To:")} ${end}`}
                    </div>
                  )}
                  {sprint.goal && (
                    <div style={{ fontSize: 12, color: "var(--fg-subtle)", marginTop: 2, fontStyle: "italic" }}>
                      {sprint.goal}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {status === "planned" && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={activateSprint.isPending}
                      onClick={() => activateSprint.mutate(sprint.id)}
                    >
                      {T("Başlat", "Start")}
                    </Button>
                  )}
                  {status !== "closed" && (
                    <Button size="sm" variant="secondary" onClick={() => setCloseDialog(sprint)}>
                      {T("Kapat", "Close")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteDialog(sprint)}
                    style={{ color: "var(--priority-critical)" }}
                  >
                    {T("Sil", "Delete")}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Close dialog */}
      {closeDialog && (
        <MoveConfirmDialog
          open
          title={T(`Sprinti Kapat: ${closeDialog.name}`, `Close Sprint: ${closeDialog.name}`)}
          description={T(
            "Bu sprint kapatılacak. Tamamlanmamış görevler nereye taşınsın?",
            "This sprint will be closed. Where should remaining tasks go?",
          )}
          sprints={sprints}
          currentSprintId={closeDialog.id}
          confirmLabel={T("Spriniti Kapat", "Close Sprint")}
          pending={closeSprint.isPending}
          lang={lang}
          onConfirm={handleClose}
          onCancel={() => setCloseDialog(null)}
        />
      )}

      {/* Delete dialog */}
      {deleteDialog && (
        <MoveConfirmDialog
          open
          title={T(`Spriniti Sil: ${deleteDialog.name}`, `Delete Sprint: ${deleteDialog.name}`)}
          description={T(
            "Bu işlem geri alınamaz. Bu sprintteki görevler nereye taşınsın?",
            "This cannot be undone. Where should the tasks in this sprint go?",
          )}
          sprints={sprints}
          currentSprintId={deleteDialog.id}
          confirmLabel={T("Sil", "Delete")}
          destructive
          pending={deleteSprint.isPending}
          lang={lang}
          onConfirm={handleDelete}
          onCancel={() => setDeleteDialog(null)}
        />
      )}
    </Section>
  )
}
