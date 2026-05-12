"use client"

import * as React from "react"
import { Paperclip, X, FileCheck, Download } from "lucide-react"

import {
  AlertBanner,
  Avatar,
  Button,
  Input,
  SegmentedControl,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/toast"
import {
  useUpdateArtifact,
  useUpdateArtifactMine,
  useUploadArtifactFile,
} from "@/hooks/use-artifacts"
import { artifactService } from "@/services/artifact-service"
import type { Artifact, ArtifactStatus } from "@/services/artifact-service"

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface ArtifactInlineExpandProject {
  id: number
  managerId?: number | null
  manager_id?: number | null
}

export interface ArtifactInlineExpandProps {
  artifact: Artifact
  project: ArtifactInlineExpandProject
  onClose: () => void
}

interface AssigneeOption {
  id: number
  name: string
  initials: string
  avColor?: number
}

function initialsOf(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// ----------------------------------------------------------------------------
// Section label helper
// ----------------------------------------------------------------------------
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        color: "var(--fg-subtle)",
        marginBottom: 5,
      }}
    >
      {children}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function ArtifactInlineExpand({
  artifact,
  project,
  onClose,
}: ArtifactInlineExpandProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )
  const { user } = useAuth()
  const { showToast } = useToast()

  const [name, setName] = React.useState(artifact.name)
  const [status, setStatus] = React.useState<ArtifactStatus>(artifact.status)
  const [note, setNote] = React.useState(artifact.note ?? "")
  const [assigneeId, setAssigneeId] = React.useState<number | null>(artifact.assigneeId)
  const [assigneeOpen, setAssigneeOpen] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const userId = user ? Number(user.id) : null
  const isAssignee =
    userId != null && artifact.assigneeId != null && userId === artifact.assigneeId

  const updatePm = useUpdateArtifact(project.id)
  const updateMine = useUpdateArtifactMine(project.id)
  const upload = useUploadArtifactFile(project.id)

  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const dropdownRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!assigneeOpen) return
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setAssigneeOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [assigneeOpen])

  const assigneeOptions: AssigneeOption[] = React.useMemo(() => {
    const opts: AssigneeOption[] = []
    const managerId = project.managerId ?? project.manager_id
    if (managerId != null) {
      opts.push({ id: managerId, name: T("Proje Yöneticisi", "Project Manager"), initials: "PY", avColor: 1 })
    }
    if (user) {
      const uid = Number(user.id)
      if (!opts.find((o) => o.id === uid)) {
        opts.push({ id: uid, name: user.name ?? T("Ben", "Me"), initials: initialsOf(user.name ?? "Me"), avColor: 2 })
      }
    }
    return opts
  }, [project.managerId, project.manager_id, user, T])

  const currentAssignee = assigneeOptions.find((o) => o.id === assigneeId) ?? null

  // ---- File download ----
  const [downloading, setDownloading] = React.useState(false)

  const onDownload = async () => {
    if (!hasFile) return
    setDownloading(true)
    try {
      await artifactService.downloadFile(artifact.id, artifact.name)
    } catch {
      setErrorMsg(T("Dosya indirilemedi.", "File download failed."))
    } finally {
      setDownloading(false)
    }
  }

  // ---- File upload ----
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]

    // Client-side size guard: 10 MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(T("Dosya boyutu 10MB sınırını aşıyor.", "File exceeds the 10MB size limit."))
      if (fileRef.current) fileRef.current.value = ""
      return
    }

    setErrorMsg(null)
    try {
      await upload.mutateAsync({ id: artifact.id, file })
      showToast({ variant: "success", message: T("Dosya yüklendi", "File uploaded") })
    } catch (err: unknown) {
      const code = (err as { response?: { status?: number } })?.response?.status
      setErrorMsg(
        code === 413
          ? T("Dosya boyutu sınırı aşıldı (max 10MB).", "File size limit exceeded (max 10MB).")
          : T("Dosya yüklenemedi.", "File upload failed."),
      )
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  // ---- Save ----
  const onSave = async () => {
    setErrorMsg(null)
    try {
      if (isAssignee) {
        await updateMine.mutateAsync({ id: artifact.id, dto: { status, note } })
      } else {
        await updatePm.mutateAsync({
          id: artifact.id,
          dto: { name, status, note, assignee_id: assigneeId },
        })
      }
      showToast({ variant: "success", message: T("Artefakt güncellendi", "Artifact updated") })
      onClose()
    } catch (err: unknown) {
      const code = (err as { response?: { status?: number } })?.response?.status
      setErrorMsg(
        code === 403
          ? T("Yetki yok: yalnızca atanmış kullanıcı veya PM düzenleyebilir.", "Permission denied: only the assignee or PM can edit.")
          : T("Kaydedilemedi.", "Save failed."),
      )
    }
  }

  const saving = updatePm.isPending || updateMine.isPending
  const hasFile = artifact.fileId != null

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-2)",
      }}
    >
      {/* ---- Top strip: progress indicator ---- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          fontSize: 11.5,
          color: "var(--fg-muted)",
        }}
      >
        <span style={{ fontWeight: 600, color: "var(--fg)" }}>{artifact.name}</span>
        <span>·</span>
        <span>{T("Detayları düzenle", "Edit details")}</span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-subtle)", padding: 2 }}
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {/* ---- Row 1: Name + Status ---- */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <SectionLabel>{T("Artefakt Adı", "Artifact Name")}</SectionLabel>
            <Input
              placeholder={T("Artefakt adı", "Artifact name")}
              size="md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%" }}
              disabled={isAssignee}
            />
          </div>
          <div>
            <SectionLabel>{T("Durum", "Status")}</SectionLabel>
            <SegmentedControl
              value={status}
              onChange={(v) => setStatus(v as ArtifactStatus)}
              options={[
                { id: "not_created", label: T("Yok", "None") },
                { id: "in_progress", label: T("Devam", "In Progress") },
                { id: "completed", label: T("Tamam", "Completed") },
                { id: "approved", label: T("Onay", "Approved") },
              ]}
            />
          </div>
        </div>

        {/* ---- Row 2: Note ---- */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>{T("Not", "Note")}</SectionLabel>
          <textarea
            rows={2}
            placeholder={T("Artefakt hakkında not ekleyin…", "Add a note about this artifact…")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              width: "100%",
              resize: "vertical",
              padding: 8,
              background: "var(--surface)",
              border: 0,
              borderRadius: "var(--radius-sm)",
              boxShadow: "inset 0 0 0 1px var(--border)",
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              color: "var(--fg)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* ---- Row 3: Assignee + File ---- */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 14 }}>
          {/* Assignee */}
          <div>
            <SectionLabel>{T("Sorumlu", "Assignee")}</SectionLabel>
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setAssigneeOpen((v) => !v)}
                disabled={isAssignee}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  boxShadow: "inset 0 0 0 1px var(--border)",
                  cursor: isAssignee ? "not-allowed" : "pointer",
                  fontSize: 12.5,
                  color: "var(--fg)",
                  opacity: isAssignee ? 0.6 : 1,
                  border: "none",
                }}
              >
                {currentAssignee ? (
                  <>
                    <Avatar user={{ initials: currentAssignee.initials, avColor: currentAssignee.avColor }} size={18}
                      href={currentAssignee.id != null ? `/users/${currentAssignee.id}` : undefined}
                    />
                    <span>{currentAssignee.name}</span>
                  </>
                ) : (
                  <span style={{ color: "var(--fg-subtle)" }}>{T("Seçin", "Select")}</span>
                )}
                <span style={{ color: "var(--fg-subtle)", marginLeft: 2 }}>▾</span>
              </button>

              {assigneeOpen && !isAssignee && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    minWidth: 180,
                    zIndex: 50,
                    background: "var(--surface)",
                    borderRadius: "var(--radius-sm)",
                    boxShadow: "var(--shadow-md), inset 0 0 0 1px var(--border-strong)",
                    padding: 6,
                    maxHeight: 220,
                    overflowY: "auto",
                  }}
                >
                  <div
                    role="button"
                    onClick={() => { setAssigneeId(null); setAssigneeOpen(false) }}
                    style={{ padding: "6px 8px", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 12.5, color: "var(--fg-muted)" }}
                  >
                    {T("(Boş)", "(None)")}
                  </div>
                  {assigneeOptions.map((o) => (
                    <div
                      key={o.id}
                      role="button"
                      onClick={() => { setAssigneeId(o.id); setAssigneeOpen(false) }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        fontSize: 12.5,
                        color: "var(--fg)",
                        background: assigneeId === o.id ? "color-mix(in oklch, var(--primary) 8%, transparent)" : "transparent",
                      }}
                    >
                      <Avatar user={{ initials: o.initials, avColor: o.avColor }} size={20} />
                      <span>{o.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* File attachment */}
          <div style={{ flex: 1 }}>
            <SectionLabel>{T("Dosya", "File")}</SectionLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input ref={fileRef} type="file" style={{ display: "none" }} onChange={onFileChange} />
              <Button
                size="sm"
                variant={hasFile ? "secondary" : "secondary"}
                icon={hasFile ? <FileCheck size={12} /> : <Paperclip size={12} />}
                disabled={upload.isPending}
                onClick={() => fileRef.current?.click()}
              >
                {upload.isPending
                  ? T("Yükleniyor…", "Uploading…")
                  : hasFile
                    ? T("Dosyayı Değiştir", "Replace File")
                    : T("Dosya Ekle", "Attach File")}
              </Button>

              {hasFile && !upload.isPending && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11.5,
                      color: "var(--primary)",
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: "color-mix(in oklch, var(--primary) 10%, transparent)",
                    }}
                  >
                    <FileCheck size={11} />
                    {T("Dosya bağlı", "File attached")}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Download size={12} />}
                    disabled={downloading}
                    onClick={onDownload}
                  >
                    {downloading ? T("İndiriliyor…", "Downloading…") : T("İndir", "Download")}
                  </Button>
                </div>
              )}

              {upload.isPending && (
                <span style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>
                  {T("Yükleniyor…", "Uploading…")}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 4 }}>
              {T("Maks. 10MB · PDF, DOCX, PNG, vb.", "Max 10MB · PDF, DOCX, PNG, etc.")}
            </div>
          </div>
        </div>

        {/* ---- Error ---- */}
        {errorMsg && (
          <div style={{ marginBottom: 12 }}>
            <AlertBanner
              tone="danger"
              action={
                <Button size="xs" variant="ghost" onClick={() => setErrorMsg(null)}>
                  <X size={11} />
                </Button>
              }
            >
              {errorMsg}
            </AlertBanner>
          </div>
        )}

        {/* ---- Actions ---- */}
        <div style={{ display: "flex", gap: 6 }}>
          <Button size="sm" variant="primary" disabled={saving} onClick={onSave}>
            {saving ? T("Kaydediliyor…", "Saving…") : T("Kaydet", "Save")}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            {T("Kapat", "Close")}
          </Button>
        </div>
      </div>
    </div>
  )
}
