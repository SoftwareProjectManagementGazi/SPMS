"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, Badge, ProgressBar, AvatarStack } from "@/components/primitives"
import { useUpdateProjectStatus } from "@/hooks/use-projects"
import { useToast } from "@/components/toast"
import { ConfirmDialog } from "./confirm-dialog"
import type { Project } from "@/services/project-service"
import { useApp } from "@/context/app-context"

const STATUS_STRIP: Record<string, string> = {
  ACTIVE: "var(--primary)",
  COMPLETED: "var(--status-done)",
  ON_HOLD: "var(--status-review)",
  ARCHIVED: "var(--fg-muted)",
}

const STATUS_BADGE_TONE: Record<string, "success" | "info" | "warning" | "neutral"> = {
  ACTIVE: "success",
  COMPLETED: "info",
  ON_HOLD: "warning",
  ARCHIVED: "neutral",
}

const STATUS_LABEL_TR: Record<string, string> = {
  ACTIVE: "Aktif",
  COMPLETED: "Tamamlandı",
  ON_HOLD: "Askıda",
  ARCHIVED: "Arşiv",
}

interface MenuAction {
  label: string
  targetStatus: string
}

function getMenuActions(status: string, language: string): MenuAction[] {
  if (status === "ARCHIVED") {
    return [{ label: language === 'tr' ? "Aktif Et" : "Reactivate", targetStatus: "ACTIVE" }]
  }
  return [
    { label: language === 'tr' ? "Tamamla" : "Complete", targetStatus: "COMPLETED" },
    { label: language === 'tr' ? "Askıya Al" : "Put On Hold", targetStatus: "ON_HOLD" },
    { label: language === 'tr' ? "Arşivle" : "Archive", targetStatus: "ARCHIVED" },
  ]
}

const CONFIRM_TITLE_TR: Record<string, string> = {
  COMPLETED: "Bu projeyi Tamamlamak istediğinize emin misiniz?",
  ON_HOLD: "Bu projeyi Askıya almak istediğinize emin misiniz?",
  ARCHIVED: "Bu projeyi Arşivlemek istediğinize emin misiniz?",
  ACTIVE: "Bu projeyi yeniden aktifleştirmek istediğinize emin misiniz?",
}
const CONFIRM_BODY_TR = "Bu işlem daha sonra proje durumu değiştirilerek geri alınabilir."

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter()
  const { language } = useApp()
  const { showToast } = useToast()
  const { mutate: updateStatus } = useUpdateProjectStatus()

  const [menuOpen, setMenuOpen] = React.useState(false)
  const [pendingStatus, setPendingStatus] = React.useState<string | null>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Click-outside to close menu
  React.useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleConfirm = () => {
    if (!pendingStatus) return
    updateStatus(
      { id: project.id, status: pendingStatus },
      {
        onSuccess: () => {
          showToast({
            message: language === 'tr'
              ? `${project.name} · durum güncellendi.`
              : `${project.name} · status updated.`,
            variant: 'success',
          })
        },
        onError: (err: unknown) => {
          // Distinguish permission (403), missing-row (404), and generic errors
          // so the user knows whether to retry, refresh, or contact an admin.
          const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } }
          const status = axiosErr?.response?.status
          const detail = axiosErr?.response?.data?.detail
          let message: string
          if (status === 403) {
            message = language === 'tr'
              ? 'Bu projeyi değiştirme yetkiniz yok. Yalnızca proje yöneticisi veya admin yapabilir.'
              : 'You do not have permission to modify this project. Only the project manager or an admin can.'
          } else if (status === 404) {
            message = language === 'tr'
              ? 'Proje bulunamadı — liste yenilendi, lütfen tekrar deneyin.'
              : 'Project not found — the list was refreshed, please try again.'
          } else if (typeof detail === 'string' && detail.length > 0) {
            message = detail
          } else {
            message = language === 'tr'
              ? 'Bir şeyler ters gitti. Lütfen tekrar deneyin.'
              : 'Something went wrong. Please try again.'
          }
          showToast({ message, variant: 'error' })
        },
      }
    )
    setPendingStatus(null)
  }

  const isArchived = project.status === 'ARCHIVED'
  const menuActions = getMenuActions(project.status, language)

  // Build avatar list from manager info if available
  // AvatarUser requires initials — derive from managerName (first letters of words)
  const managerAvatars = project.managerName
    ? [{
        id: project.managerId ?? 0,
        initials: project.managerName
          .split(' ')
          .slice(0, 2)
          .map(w => w[0]?.toUpperCase() ?? '')
          .join(''),
        avColor: 1,
      }]
    : []

  return (
    <>
      <Card
        interactive
        padding={0}
        style={{
          opacity: isArchived ? 0.6 : 1,
          position: "relative",
          // Fill the grid row (align-items: stretch is the default) and let
          // the body flex so the progress + footer block can sink to the
          // bottom regardless of description length.
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={() => router.push(`/projects/${project.id}`)}
      >
        {/* Top status strip */}
        <div style={{ height: 4, background: STATUS_STRIP[project.status] ?? "var(--primary)",
          borderRadius: "var(--radius) var(--radius) 0 0" }} />

        {/* 3-dot overflow menu trigger — stop propagation to prevent card nav */}
        <div ref={menuRef} style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}
          onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4,
              borderRadius: 4, color: "var(--fg-muted)", display: "flex", alignItems: "center" }}>
            {/* MoreH icon (3 horizontal dots) */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="13" cy="8" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4,
              minWidth: 140, background: "var(--surface)", borderRadius: 8,
              boxShadow: "var(--shadow-lg)", padding: 4, zIndex: 100,
              border: "1px solid var(--border)" }}>
              {menuActions.map(action => (
                <button
                  key={action.targetStatus}
                  onClick={() => { setMenuOpen(false); setPendingStatus(action.targetStatus) }}
                  style={{ display: "block", width: "100%", textAlign: "left",
                    background: "none", border: "none", cursor: "pointer",
                    padding: "8px 10px", borderRadius: 5, fontSize: 12.5,
                    color: "var(--fg)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Card body — flex column that fills the card so the footer can
            anchor to the bottom of the card rather than the end of content. */}
        <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Top row: key + name | methodology badge + status badge.
              paddingRight leaves a clear zone for the absolutely-positioned
              3-dot overflow menu (top:8, right:8) so badges don't collide. */}
          <div style={{ display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", gap: 8, paddingRight: 28 }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600,
                color: "var(--fg-muted)", background: "var(--surface-2)",
                padding: "2px 6px", borderRadius: 4, marginRight: 6 }}>
                {project.key}
              </span>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>
                {project.name}
              </span>
            </div>
            <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
              <Badge size="xs" tone="neutral">{project.methodology}</Badge>
              <Badge size="xs" tone={STATUS_BADGE_TONE[project.status] ?? "neutral"} dot>
                {language === 'tr' ? (STATUS_LABEL_TR[project.status] ?? project.status) : project.status}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div style={{ fontSize: 12.5, color: "var(--fg-muted)", lineHeight: 1.5,
              marginTop: 8, overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {project.description}
            </div>
          )}

          {/* Progress — marginTop: auto pushes this block (and the footer
              that follows) to the bottom of the flex-stretched body, so
              1-line and 2-line description cards share the same footer Y. */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto", paddingTop: 14 }}>
            <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
              {language === 'tr' ? 'İlerleme' : 'Progress'}
            </span>
            <div style={{ flex: 1 }}>
              <ProgressBar value={project.progress * 100} />
            </div>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600,
              color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>
              {Math.round(project.progress * 100)}%
            </span>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <AvatarStack users={managerAvatars} max={4} size={22} />
              <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                {language === 'tr' ? 'görev' : 'tasks'}
              </span>
            </div>
            {project.endDate && (
              <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
                {new Date(project.endDate).toLocaleDateString(
                  language === 'tr' ? 'tr-TR' : 'en-US',
                  { month: 'short', day: 'numeric' }
                )}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Confirmation dialog (D-25) */}
      <ConfirmDialog
        open={!!pendingStatus}
        title={language === 'tr'
          ? (CONFIRM_TITLE_TR[pendingStatus ?? ''] ?? '')
          : `Change status to ${pendingStatus}?`}
        body={language === 'tr'
          ? CONFIRM_BODY_TR
          : "This action can be reversed by changing the project status later."}
        confirmLabel={language === 'tr' ? "Onayla" : "Confirm"}
        cancelLabel={language === 'tr' ? "İptal" : "Cancel"}
        onConfirm={handleConfirm}
        onCancel={() => setPendingStatus(null)}
      />
    </>
  )
}
