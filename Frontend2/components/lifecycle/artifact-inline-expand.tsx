"use client"

// ArtifactInlineExpand (Phase 12 Plan 12-06) — inline expand panel revealed
// when a row in the Artifacts sub-tab is clicked. Hosts:
//   - name Input + status SegmentedControl (Yok / Taslak / Tamam)
//   - note textarea
//   - sorumlu (assignee) dropdown — manager + self stub for now (real
//     /projects/{id}/members endpoint lands in Phase 13; degrades gracefully)
//   - "Dosya Ekle" button + hidden <input type="file" /> (single file per
//     artifact — Phase 9 D-41; Phase 12 D-52 multi-file deferred)
//   - Save / Kapat buttons + AlertBanner for 403 / 413 / generic save errors
//
// Anatomy: 12-UI-SPEC.md §7 ArtifactInlineExpand (lines 1016-1064).
// Visual reference: New_Frontend/src/pages/lifecycle-tab.jsx lines 383-399.
// Decisions consumed: D-52 (row + inline expand), D-53 (assignee dropdown),
//   D-36 (Phase 9 split-URL: PM path vs assignee /mine path), D-41 (single
//   file constraint).
//
// Path selection (T-12-06-01): when `useAuth().user.id === artifact.assigneeId`,
// the assignee /mine path is used; otherwise the PM full path. Backend
// re-validates so a misclassified path is still rejected — defense-in-depth.
//
// Revision NOT sent (T-12-06-03): the PATCH body does not include the
// `revision` field — the backend auto-increments via Phase 9 D-25. This
// applies to PhaseReport too; we keep it consistent here for any future
// Artifact revision tracking.

import * as React from "react"
import { Paperclip, X } from "lucide-react"

import {
  AlertBanner,
  Avatar,
  Badge,
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

// Initials helper — derive 2-letter initials from a name.
function initialsOf(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
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

  // Local state seeded from the artifact.
  const [name, setName] = React.useState(artifact.name)
  const [status, setStatus] = React.useState<ArtifactStatus>(artifact.status)
  const [note, setNote] = React.useState(artifact.note ?? "")
  const [assigneeId, setAssigneeId] = React.useState<number | null>(
    artifact.assigneeId,
  )
  const [assigneeOpen, setAssigneeOpen] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  // Path selection (Phase 9 D-36 + T-12-06-01). Compute once per render.
  const userId = user ? Number(user.id) : null
  const isAssignee =
    userId != null && artifact.assigneeId != null && userId === artifact.assigneeId

  const updatePm = useUpdateArtifact(project.id)
  const updateMine = useUpdateArtifactMine(project.id)
  const upload = useUploadArtifactFile(project.id)

  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const dropdownRef = React.useRef<HTMLDivElement | null>(null)

  // Click-outside dismiss for the assignee dropdown.
  React.useEffect(() => {
    if (!assigneeOpen) return
    const handler = (e: MouseEvent) => {
      const root = dropdownRef.current
      if (!root) return
      if (!root.contains(e.target as Node)) {
        setAssigneeOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [assigneeOpen])

  // Source assignee options from the project's manager + current user. The
  // real /projects/{id}/members endpoint lands in Phase 13; this stub keeps
  // the picker visible without throwing.
  const assigneeOptions: AssigneeOption[] = React.useMemo(() => {
    const opts: AssigneeOption[] = []
    const managerId = project.managerId ?? project.manager_id
    if (managerId != null) {
      opts.push({
        id: managerId,
        name: T("Proje Yöneticisi", "Project Manager"),
        initials: "PY",
        avColor: 1,
      })
    }
    if (user) {
      const uid = Number(user.id)
      if (!opts.find((o) => o.id === uid)) {
        opts.push({
          id: uid,
          name: user.name ?? T("Ben", "Me"),
          initials: initialsOf(user.name ?? "Me"),
          avColor: 2,
        })
      }
    }
    return opts
  }, [project.managerId, project.manager_id, user, T])

  const currentAssignee =
    assigneeOptions.find((o) => o.id === assigneeId) ?? null

  // ---- handlers ----

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    // T-12-06 + Phase 9 D-41: single-file constraint — only [0] consumed.
    const file = files[0]
    setErrorMsg(null)
    try {
      await upload.mutateAsync({ id: artifact.id, file })
      showToast({ variant: "success", message: T("Dosya yüklendi", "File uploaded") })
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status
      if (status === 413) {
        setErrorMsg(
          T(
            "Dosya boyutu sınırı aşıldı (max 10MB).",
            "File size limit exceeded (max 10MB).",
          ),
        )
      } else {
        setErrorMsg(T("Dosya yüklenemedi.", "File upload failed."))
      }
    } finally {
      // Reset native input so the same file can be re-selected after an error.
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const onSave = async () => {
    setErrorMsg(null)
    try {
      if (isAssignee) {
        // Assignee path — D-36 split URL. assignee_id excluded by DTO shape.
        await updateMine.mutateAsync({
          id: artifact.id,
          dto: { status, note },
        })
      } else {
        // PM path — full payload including assignee_id.
        await updatePm.mutateAsync({
          id: artifact.id,
          dto: {
            name,
            status,
            note,
            assignee_id: assigneeId,
          },
        })
      }
      showToast({
        variant: "success",
        message: T("Artefakt güncellendi", "Artifact updated"),
      })
      onClose()
    } catch (err: unknown) {
      const code = (err as { response?: { status?: number } })?.response?.status
      if (code === 403) {
        setErrorMsg(
          T(
            "Yetki: yalnızca atanmış kullanıcı veya proje yöneticisi düzenleyebilir.",
            "Permission denied: only the assignee or project manager can edit.",
          ),
        )
      } else {
        setErrorMsg(T("Kaydedilemedi.", "Save failed."))
      }
    }
  }

  const saving = updatePm.isPending || updateMine.isPending

  return (
    <div
      style={{
        padding: 16,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-2)",
      }}
    >
      {/* 2-column grid: name + status SegmentedControl (UI-SPEC line 1042) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <Input
          placeholder={T("Artefakt adı", "Artifact name")}
          size="md"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%" }}
          disabled={isAssignee}
        />
        <SegmentedControl
          value={status}
          onChange={(v) => setStatus(v as ArtifactStatus)}
          options={[
            { id: "not-created", label: T("Yok", "None") },
            { id: "draft", label: T("Taslak", "Draft") },
            { id: "done", label: T("Tamam", "Done") },
          ]}
        />
      </div>

      {/* Note textarea full width */}
      <textarea
        rows={2}
        placeholder={T("Not ekleyin…", "Add a note…")}
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
          marginBottom: 10,
          color: "var(--fg)",
        }}
      />

      {/* Sorumlu dropdown + Dosya Ekle button row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--fg-muted)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {T("Sorumlu", "Assignee")}:
        </span>
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setAssigneeOpen((v) => !v)}
            disabled={isAssignee}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
              background: "var(--surface)",
              boxShadow: "inset 0 0 0 1px var(--border)",
              cursor: isAssignee ? "not-allowed" : "pointer",
              fontSize: 12.5,
              color: "var(--fg)",
              opacity: isAssignee ? 0.6 : 1,
            }}
          >
            {currentAssignee ? (
              <>
                {/* Phase 13 Plan 13-03 (D-D4) — current-assignee Avatar links
                    to profile. The picker trigger button still toggles the
                    dropdown when the user clicks the surrounding chrome (name
                    text, caret) — Avatar's stopPropagation only short-circuits
                    clicks on the avatar circle itself. The dropdown OPTION
                    Avatars below are intentionally NOT linked (RESEARCH
                    §Pattern 3 — picker option buttons stay non-nav). */}
                <Avatar
                  user={{
                    initials: currentAssignee.initials,
                    avColor: currentAssignee.avColor,
                  }}
                  size={18}
                  href={currentAssignee.id != null ? `/users/${currentAssignee.id}` : undefined}
                />
                <span>{currentAssignee.name}</span>
              </>
            ) : (
              <span style={{ color: "var(--fg-subtle)" }}>
                {T("Sorumlu seçin", "Select assignee")}
              </span>
            )}
            <span style={{ color: "var(--fg-subtle)", marginLeft: 4 }}>▾</span>
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
                boxShadow:
                  "var(--shadow-md), inset 0 0 0 1px var(--border-strong)",
                padding: 6,
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              <div
                role="button"
                onClick={() => {
                  setAssigneeId(null)
                  setAssigneeOpen(false)
                }}
                style={{
                  padding: "6px 8px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: 12.5,
                  color: "var(--fg-muted)",
                }}
              >
                {T("(Boş)", "(None)")}
              </div>
              {assigneeOptions.length === 0 ? (
                <div
                  style={{
                    padding: 8,
                    fontSize: 12,
                    color: "var(--fg-subtle)",
                    textAlign: "center",
                  }}
                >
                  {T("Atanabilir kullanıcı yok.", "No assignable users.")}
                </div>
              ) : (
                assigneeOptions.map((o) => (
                  <div
                    key={o.id}
                    role="button"
                    onClick={() => {
                      setAssigneeId(o.id)
                      setAssigneeOpen(false)
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      fontSize: 12.5,
                      color: "var(--fg)",
                      background:
                        assigneeId === o.id
                          ? "color-mix(in oklch, var(--primary) 8%, transparent)"
                          : "transparent",
                    }}
                  >
                    <Avatar
                      user={{ initials: o.initials, avColor: o.avColor }}
                      size={20}
                    />
                    <span>{o.name}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <input
          ref={fileRef}
          type="file"
          style={{ display: "none" }}
          onChange={onFileChange}
        />
        <Button
          size="sm"
          variant="secondary"
          icon={<Paperclip size={12} />}
          disabled={upload.isPending}
          onClick={() => fileRef.current?.click()}
        >
          {upload.isPending
            ? T("Yükleniyor…", "Uploading…")
            : T("Dosya Ekle", "Attach File")}
        </Button>
        {artifact.fileId != null && (
          <Badge size="xs" tone="info" dot>
            {T("Dosya bağlı", "File attached")}
          </Badge>
        )}
      </div>

      {errorMsg && (
        <div style={{ marginBottom: 10 }}>
          <AlertBanner
            tone={errorMsg.includes("max 10MB") ? "danger" : "warning"}
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

      <div style={{ display: "flex", gap: 6 }}>
        <Button
          size="sm"
          variant="primary"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? T("Kaydediliyor…", "Saving…") : T("Kaydet", "Save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          {T("Kapat", "Close")}
        </Button>
      </div>
    </div>
  )
}
