"use client"

// AttachmentsSection — drag-drop file zone, file + link attachment list,
// ConfirmDialog-gated delete per D-48. Uses attachmentService from Plan 01.
//
// Link attachment <a> tags carry rel="noopener noreferrer" per T-11-09-02
// so user-supplied URLs cannot tamper with window.opener of the SPMS tab.

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Paperclip,
  Link2 as LinkIcon,
  Download,
  Trash2,
} from "lucide-react"
import { Avatar, Button, Card, Input, Section } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import {
  attachmentService,
  type Attachment,
} from "@/services/attachment-service"
import { useToast } from "@/components/toast"
import { relativeTime } from "@/lib/audit-formatter"
import { ConfirmDialog } from "@/components/projects/confirm-dialog"

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// Pre-upload validation. Backend re-validates everything (MIME, size, signed
// URL etc.) but client-side checks save the user from waiting for a 5GB MP4
// to fail upload. Limits intentionally match the backend's conservative
// defaults — bumping either side without coordinating will leave a UX gap.
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024 // 25 MB
const ACCEPTED_TYPES = [
  // Images
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // PDFs / docs
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // Plain / structured text
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  "application/xml",
  // Archives
  "application/zip",
  "application/x-tar",
  "application/gzip",
]
// `accept` attribute mirrors ACCEPTED_TYPES + a couple of extension aliases
// for common-but-MIMEless cases (.md, .csv saved without a content-type).
const ACCEPT_ATTR =
  ACCEPTED_TYPES.join(",") + ",.md,.csv,.tsv,.log"

function validateUpload(
  file: File,
  lang: "tr" | "en",
): { ok: true } | { ok: false; reason: string } {
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      reason:
        lang === "tr"
          ? `Dosya çok büyük (${humanSize(file.size)} > ${humanSize(MAX_UPLOAD_BYTES)})`
          : `File too large (${humanSize(file.size)} > ${humanSize(MAX_UPLOAD_BYTES)})`,
    }
  }
  // Empty file.type happens for some bare extensions; allow them through and
  // let the backend decide. We only block when the browser DOES report a MIME
  // and that MIME isn't on the allow-list.
  if (file.type && !ACCEPTED_TYPES.includes(file.type)) {
    return {
      ok: false,
      reason:
        lang === "tr"
          ? `Bu dosya tipi desteklenmiyor (${file.type})`
          : `File type not supported (${file.type})`,
    }
  }
  // Path-traversal guard on the filename. Any `..` segment or path separator
  // is suspicious — safe to reject client-side; the backend should reject
  // again but defense-in-depth never hurts.
  if (/[\\/]|\.\./.test(file.name)) {
    return {
      ok: false,
      reason:
        lang === "tr"
          ? "Dosya adı geçersiz karakter içeriyor"
          : "Filename contains invalid characters",
    }
  }
  return { ok: true }
}

function avatarForUploader(id: number, name?: string) {
  const initials = (name ?? `#${id}`).slice(0, 2).toUpperCase()
  return { initials, avColor: ((id % 8) + 1) as number }
}

interface AttachmentsSectionProps {
  taskId: number
}

export function AttachmentsSection({ taskId }: AttachmentsSectionProps) {
  const { language: lang } = useApp()
  const { user } = useAuth()
  const { showToast } = useToast()
  const qc = useQueryClient()

  const { data: items = [] } = useQuery({
    queryKey: ["attachments", taskId],
    queryFn: () => attachmentService.getByTask(taskId),
  })

  const [dragOver, setDragOver] = React.useState(false)
  const [linkFormOpen, setLinkFormOpen] = React.useState(false)
  const [linkUrl, setLinkUrl] = React.useState("")
  const [linkTitle, setLinkTitle] = React.useState("")
  const [deleteId, setDeleteId] = React.useState<number | null>(null)

  const currentUserId = user?.id != null ? Number(user.id) : null

  const upload = useMutation({
    mutationFn: (file: File) => attachmentService.upload(taskId, file),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["attachments", taskId] }),
    onError: (err: unknown) =>
      showToast({
        variant: "error",
        message:
          (err as { response?: { data?: { detail?: string } } })?.response
            ?.data?.detail ??
          (lang === "tr" ? "Yükleme başarısız" : "Upload failed"),
      }),
  })

  const addLink = useMutation({
    mutationFn: ({ url, title }: { url: string; title?: string }) =>
      attachmentService.createLink(taskId, url, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attachments", taskId] })
      setLinkUrl("")
      setLinkTitle("")
      setLinkFormOpen(false)
    },
    onError: () =>
      showToast({
        variant: "error",
        message:
          lang === "tr" ? "Bağlantı eklenemedi" : "Failed to add link",
      }),
  })

  const remove = useMutation({
    mutationFn: (id: number) => attachmentService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attachments", taskId] })
      setDeleteId(null)
    },
    onError: () =>
      showToast({
        variant: "error",
        message:
          lang === "tr" ? "Silme başarısız" : "Failed to delete attachment",
      }),
  })

  // Run client-side validation before kicking the mutation. Failures surface
  // a toast per offending file; valid files queue normally. Backend still
  // re-validates everything (defense-in-depth) so this is purely a UX win.
  const handleFiles = React.useCallback(
    (files: File[]) => {
      for (const f of files) {
        const verdict = validateUpload(f, lang)
        if (!verdict.ok) {
          showToast({
            variant: "error",
            message: `${f.name}: ${verdict.reason}`,
          })
          continue
        }
        upload.mutate(f)
      }
    },
    [lang, showToast, upload],
  )

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(Array.from(e.target.files ?? []))
    e.target.value = ""
  }

  return (
    <Section
      title={lang === "tr" ? "Ekler" : "Attachments"}
      style={{ marginTop: 20 }}
    >
      <Card padding={0}>
        {/* Drop zone — wrapped in a 16px shell so the dashed area aligns
            visually with the 16-horizontal padding of every list row below
            it. Inner padding stays at 16 so the dashed border has breathing
            room from its label. */}
        <div style={{ padding: 16 }}>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              padding: 20,
              minHeight: 88,
              border: `2px dashed ${dragOver ? "var(--primary)" : "var(--border)"}`,
              borderRadius: "var(--radius-sm)",
              background: dragOver
                ? "color-mix(in oklch, var(--primary) 5%, var(--surface))"
                : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexDirection: "column",
              fontSize: 13,
              color: "var(--fg-muted)",
              transition: "background 0.15s ease, border-color 0.15s ease",
            }}
          >
            <span>
              {lang === "tr"
                ? "Dosya sürükleyin veya tıklayın"
                : "Drag files here or click"}
            </span>
            <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
              {lang === "tr"
                ? `En fazla ${humanSize(MAX_UPLOAD_BYTES)} · resim, PDF, ofis, metin, arşiv`
                : `Up to ${humanSize(MAX_UPLOAD_BYTES)} · image, PDF, office, text, archive`}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <label
                style={{
                  fontSize: 12,
                  color: "var(--primary)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="file"
                  multiple
                  accept={ACCEPT_ATTR}
                  onChange={handleFileInput}
                  style={{ display: "none" }}
                />
                {lang === "tr" ? "Dosya seç" : "Select file"}
              </label>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setLinkFormOpen((v) => !v)}
              >
                {lang === "tr" ? "Bağlantı Ekle" : "Add Link"}
              </Button>
            </div>
          </div>
        </div>

        {linkFormOpen && (
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: 8,
            }}
          >
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://…"
              style={{ flex: 1, display: "flex" }}
            />
            <Input
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder={
                lang === "tr" ? "Başlık (opsiyonel)" : "Title (optional)"
              }
              style={{ flex: 1, display: "flex" }}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                addLink.mutate({
                  url: linkUrl,
                  title: linkTitle || undefined,
                })
              }
              disabled={!linkUrl.trim() || addLink.isPending}
            >
              {lang === "tr" ? "Ekle" : "Add"}
            </Button>
          </div>
        )}

        {/* List — only render the divider + empty placeholder when there is
            content to host. With zero attachments the dropzone alone is the
            section, so we suppress the "Ek yok" row to avoid a redundant
            empty stripe under a freshly-painted dashed area. */}
        {items.length > 0 &&
          items.map((a: Attachment) => {
            const isLink = a.type === "link"
            const canDelete =
              currentUserId != null && currentUserId === a.uploaderId
            const av = avatarForUploader(a.uploaderId, a.uploaderName)
            return (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 16px",
                  borderTop: "1px solid var(--border)",
                  fontSize: 12.5,
                }}
              >
                {isLink ? (
                  <LinkIcon size={14} color="var(--fg-muted)" />
                ) : (
                  <Paperclip size={14} color="var(--fg-muted)" />
                )}
                <span
                  style={{
                    fontWeight: 500,
                    color: "var(--fg)",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isLink && a.linkUrl ? (
                    <a
                      href={a.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--primary)",
                        textDecoration: "none",
                      }}
                    >
                      {a.filename || a.linkUrl}
                    </a>
                  ) : (
                    a.filename
                  )}
                </span>
                {!isLink && (
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      color: "var(--fg-subtle)",
                    }}
                  >
                    {humanSize(a.size)}
                  </span>
                )}
                <Avatar user={av} size={18} />
                <span
                  style={{ fontSize: 11, color: "var(--fg-subtle)" }}
                >
                  {relativeTime(a.uploadedAt, lang)}
                </span>
                {!isLink && (
                  <a
                    href={a.url}
                    download
                    style={{ color: "var(--fg-muted)" }}
                    aria-label="Download"
                  >
                    <Download size={14} />
                  </a>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setDeleteId(a.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--fg-muted)",
                    }}
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}
      </Card>

      <ConfirmDialog
        open={deleteId !== null}
        title={lang === "tr" ? "Eki sil?" : "Delete attachment?"}
        body={
          lang === "tr"
            ? "Bu işlem geri alınamaz."
            : "This action cannot be undone."
        }
        confirmLabel={lang === "tr" ? "Sil" : "Delete"}
        cancelLabel={lang === "tr" ? "Vazgeç" : "Cancel"}
        onConfirm={() => deleteId != null && remove.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Section>
  )
}
