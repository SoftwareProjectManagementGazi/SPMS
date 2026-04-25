"use client"

// CommentsSection — flat comment thread with @-mention dropdown + edit/delete
// of own comments (D-46, no time constraint). Renders inside ActivitySection's
// "Yorumlar" sub-tab (D-47).
//
// XSS mitigation (T-11-09-01): the comment body is user-supplied HTML stored
// on the backend as-is. Phase 11 strips all tags on render (text-only display)
// so stored HTML cannot execute. Mention tokens display as plain text
// (@Name + nbsp preserved via whiteSpace:pre-wrap). Richer rendering with
// DOMPurify is documented as the future upgrade path.
//
// Toast is read via useToast() inside the component — there is no standalone
// showToast export in this codebase (same adaptation as 11-02 / 11-08).

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import DOMPurify from "isomorphic-dompurify"
import { Avatar, Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { commentService, type Comment } from "@/services/comment-service"
import { useToast } from "@/components/toast"
import { relativeTime } from "@/lib/audit-formatter"
import { ConfirmDialog } from "@/components/projects/confirm-dialog"

export interface Member {
  id: number
  name: string
}

interface CommentsSectionProps {
  taskId: number
  projectMembers: Member[]
}

// Sanitize a comment body to a plain-text string suitable for rendering as a
// React text child. We use DOMPurify with ALLOWED_TAGS=[] so the result is
// guaranteed text-only — handles every edge case the previous regex couldn't
// (nested `<<script>>script>`, attribute payloads, multi-line tags, etc.).
//
// React's text-child escaping then turns any remaining `<` / `>` into entities
// at render time, so a legitimate code-snippet comment like "if (a < b) { ... }"
// surfaces verbatim instead of getting eaten by the previous regex.
function stripHtml(s: string | null | undefined): string {
  if (s == null) return ""
  return DOMPurify.sanitize(String(s), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

function avatarFromMember(id: number, name?: string) {
  const initials = (name ?? `#${id}`).slice(0, 2).toUpperCase()
  return { initials, avColor: ((id % 8) + 1) as number }
}

export function CommentsSection({
  taskId,
  projectMembers,
}: CommentsSectionProps) {
  const { language: lang } = useApp()
  const { user } = useAuth()
  const { showToast } = useToast()
  const qc = useQueryClient()

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => commentService.getByTask(taskId),
  })

  const [body, setBody] = React.useState("")
  // Composer collapse — prototype task-detail.jsx:79-85 shows a placeholder
  // div until the user clicks; only then does the textarea + Vazgeç/Gönder
  // affordance expand. Triage 1.8.
  const [composerOpen, setComposerOpen] = React.useState(false)
  const [mentionOpen, setMentionOpen] = React.useState(false)
  const [mentionQuery, setMentionQuery] = React.useState("")
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editDraft, setEditDraft] = React.useState("")
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // AuthUser.id is a string in this codebase — normalize to number for the
  // backend-owned authorId comparisons.
  const currentUserId = user?.id != null ? Number(user.id) : null

  const create = useMutation({
    mutationFn: (b: string) => commentService.create(taskId, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", taskId] })
      setBody("")
      setComposerOpen(false)
    },
    onError: () =>
      showToast({
        variant: "error",
        message:
          lang === "tr" ? "Yorum eklenemedi" : "Failed to post comment",
      }),
  })

  const update = useMutation({
    mutationFn: ({ id, b }: { id: number; b: string }) =>
      commentService.update(id, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", taskId] })
      setEditingId(null)
    },
    onError: () =>
      showToast({
        variant: "error",
        message:
          lang === "tr"
            ? "Yorum güncellenemedi"
            : "Failed to update comment",
      }),
  })

  const remove = useMutation({
    mutationFn: (id: number) => commentService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", taskId] })
      setDeleteId(null)
    },
    onError: () =>
      showToast({
        variant: "error",
        message:
          lang === "tr" ? "Yorum silinemedi" : "Failed to delete comment",
      }),
  })

  function onBodyChange(v: string) {
    setBody(v)
    // Detect `@` char at caret — simple matcher: last `@` segment before caret.
    const caret = textareaRef.current?.selectionStart ?? v.length
    const before = v.slice(0, caret)
    const atIdx = before.lastIndexOf("@")
    if (atIdx >= 0 && !/[\s\n]/.test(before.slice(atIdx + 1))) {
      setMentionQuery(before.slice(atIdx + 1).toLowerCase())
      setMentionOpen(true)
    } else {
      setMentionOpen(false)
    }
  }

  function insertMention(m: Member) {
    const caret = textareaRef.current?.selectionStart ?? body.length
    const before = body.slice(0, caret)
    const atIdx = before.lastIndexOf("@")
    if (atIdx < 0) return
    // Plain-text mention token — previously inserted as raw HTML
    // `<span class="mention" ...>` which (a) leaked unsanitized member names
    // into the DOM if a name contained `<` / `>` and (b) showed visible
    // markup in the textarea. Backend mention parsing keys off the literal
    // "@Name" string; the render-side DOMPurify pass strips anything else.
    const token = `@${m.name} `
    const next = before.slice(0, atIdx) + token + body.slice(caret)
    setBody(next)
    setMentionOpen(false)
  }

  const filteredMembers = mentionQuery
    ? projectMembers.filter((m) =>
        m.name.toLowerCase().includes(mentionQuery),
      )
    : projectMembers.slice(0, 6)

  const currentUserAvatar = user
    ? avatarFromMember(Number(user.id) || 0, user.name)
    : null

  const placeholderText =
    lang === "tr"
      ? "Yorum yaz… @ ile birinden bahset"
      : "Write a comment… @ to mention"

  return (
    <div>
      {/* Composer — collapsed placeholder by default, expands on click into a
          textarea + Vazgeç/Gönder bar. Mirrors prototype task-detail.jsx:79-85
          where the surface-2 inset box reads as a sit-up affordance and only
          becomes a real input once the user opts in. */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: composerOpen ? "flex-start" : "center",
          position: "relative",
        }}
      >
        {currentUserAvatar && <Avatar user={currentUserAvatar} size={26} />}
        <div style={{ flex: 1, position: "relative" }}>
          {!composerOpen ? (
            <button
              type="button"
              onClick={() => {
                setComposerOpen(true)
                // Focus the textarea once it mounts. setTimeout(0) gives React
                // one paint to swap the JSX before we reach for the ref.
                setTimeout(() => textareaRef.current?.focus(), 0)
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: 12,
                fontSize: 12.5,
                color: "var(--fg-subtle)",
                background: "var(--surface-2)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "inset 0 0 0 1px var(--border)",
                border: "none",
                cursor: "text",
              }}
            >
              {placeholderText}
            </button>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                placeholder={placeholderText}
                rows={3}
                autoFocus
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 13,
                  lineHeight: 1.5,
                  background: "var(--surface-2)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "inset 0 0 0 1px var(--border)",
                  color: "var(--fg)",
                  resize: "vertical",
                  border: "none",
                  // outline intentionally NOT set inline so :focus-visible ring paints (a11y).
                  fontFamily: "inherit",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 6,
                  gap: 6,
                }}
              >
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setBody("")
                    setComposerOpen(false)
                  }}
                >
                  {lang === "tr" ? "Vazgeç" : "Cancel"}
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => create.mutate(body)}
                  disabled={!body.trim() || create.isPending}
                >
                  {lang === "tr" ? "Gönder" : "Send"}
                </Button>
              </div>
            </>
          )}
          {composerOpen && mentionOpen && filteredMembers.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% - 40px)",
                left: 0,
                background: "var(--surface)",
                boxShadow: "var(--shadow-lg)",
                borderRadius: "var(--radius-sm)",
                padding: 4,
                zIndex: 50,
                minWidth: 200,
              }}
            >
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => insertMention(m)}
                  className="hover-row"
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    // UI-sweep: standardized at "6px 10px" per UI-SPEC §158 ContextMenu spec.
                    padding: "6px 10px",
                    fontSize: 12,
                    background: "transparent",
                    border: "none",
                    color: "var(--fg)",
                    cursor: "pointer",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  @{m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {comments.length === 0 ? (
          <div
            style={{
              padding: 16,
              textAlign: "center",
              color: "var(--fg-subtle)",
              fontSize: 12,
            }}
          >
            {lang === "tr" ? "Yorum yok" : "No comments"}
          </div>
        ) : (
          comments.map((c: Comment) => {
            const isMine = currentUserId != null && currentUserId === c.authorId
            if (c.deleted) {
              return (
                <div
                  key={c.id}
                  style={{
                    padding: "8px 12px",
                    background: "var(--surface-2)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 12.5,
                    color: "var(--fg-subtle)",
                    fontStyle: "italic",
                  }}
                >
                  {lang === "tr" ? "Silindi" : "Deleted"}
                </div>
              )
            }
            const av = avatarFromMember(c.authorId, c.authorName)
            return (
              <div key={c.id} style={{ display: "flex", gap: 10 }}>
                <Avatar user={av} size={26} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--fg)",
                      }}
                    >
                      {c.authorName ||
                        `${lang === "tr" ? "Kullanıcı" : "User"} #${c.authorId}`}
                    </span>
                    <span
                      style={{ fontSize: 11, color: "var(--fg-subtle)" }}
                    >
                      {relativeTime(c.createdAt, lang)}
                    </span>
                    {isMine && editingId !== c.id && (
                      <div
                        style={{
                          marginLeft: "auto",
                          display: "flex",
                          gap: 4,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(c.id)
                            setEditDraft(c.body)
                          }}
                          style={{
                            fontSize: 11,
                            background: "transparent",
                            border: "none",
                            color: "var(--fg-muted)",
                            cursor: "pointer",
                          }}
                        >
                          {lang === "tr" ? "Düzenle" : "Edit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(c.id)}
                          style={{
                            fontSize: 11,
                            background: "transparent",
                            border: "none",
                            color: "var(--fg-muted)",
                            cursor: "pointer",
                          }}
                        >
                          {lang === "tr" ? "Sil" : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                  {editingId === c.id ? (
                    <div style={{ marginTop: 6 }}>
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          fontSize: 13,
                          background: "var(--surface-2)",
                          borderRadius: "var(--radius-sm)",
                          boxShadow: "inset 0 0 0 1px var(--border)",
                          color: "var(--fg)",
                          resize: "vertical",
                          border: "none",
                          // outline intentionally NOT set inline so :focus-visible ring paints (a11y).
                          fontFamily: "inherit",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          justifyContent: "flex-end",
                          marginTop: 6,
                        }}
                      >
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          {lang === "tr" ? "Vazgeç" : "Cancel"}
                        </Button>
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() =>
                            update.mutate({ id: c.id, b: editDraft })
                          }
                          disabled={!editDraft.trim() || update.isPending}
                        >
                          {lang === "tr" ? "Kaydet" : "Save"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // T-11-09-01 XSS mitigation: strip HTML before rendering.
                    // Line breaks and mention tokens display as plain text.
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: "var(--fg)",
                        marginTop: 4,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {stripHtml(c.body)}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title={lang === "tr" ? "Yorum silinsin mi?" : "Delete comment?"}
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
    </div>
  )
}
