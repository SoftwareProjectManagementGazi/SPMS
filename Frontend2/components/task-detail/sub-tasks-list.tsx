"use client"

// SubTasksList — rich-row list under the main description (D-37). Each row
// is clickable and routes to its sub-task detail page. The "Ekle" action
// opens the global TaskCreateModal preset for a sub-task with parent pre-filled.
//
// Layout matches the prototype task-detail.jsx:54-65 exactly:
//   80px (mono key) | 20px (checkbox) | 1fr (title) | 90px (Badge dot) | 22px (avatar)
//
// The 90px status column is FIXED-width so the badge doesn't grow with text
// length — which had previously made "in_progress" badges visibly wider than
// "todo" ones (UAT round 7). The Badge text is the localized human label
// (Yapılacak / Devam ediyor / İncelemede / Tamamlandı / Engellendi), and the
// tone tracks the canonical 5-status scheme (success / info / warning /
// danger / neutral) instead of the previous always-neutral.

import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Avatar,
  Badge,
  Button,
  Card,
  Section,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useTaskModal } from "@/context/task-modal-context"
import type { Task } from "@/services/task-service"

interface SubTasksListProps {
  parent: Task
  subtasks: Task[]
}

type CanonicalStatus = "todo" | "progress" | "review" | "done" | "blocked"

function canonical(status: string | null | undefined): CanonicalStatus {
  const s = String(status ?? "").toLowerCase()
  if (s === "progress" || s === "in_progress" || s === "doing") return "progress"
  if (s === "review" || s === "in_review") return "review"
  if (s === "done" || s === "completed" || s === "closed") return "done"
  if (s === "blocked") return "blocked"
  return "todo"
}

const STATUS_LABEL: Record<CanonicalStatus, { tr: string; en: string }> = {
  todo: { tr: "Yapılacak", en: "To do" },
  progress: { tr: "Devam ediyor", en: "In progress" },
  review: { tr: "İncelemede", en: "Review" },
  done: { tr: "Tamamlandı", en: "Done" },
  blocked: { tr: "Engellendi", en: "Blocked" },
}

const STATUS_TONE: Record<
  CanonicalStatus,
  "success" | "info" | "warning" | "danger" | "neutral"
> = {
  todo: "neutral",
  progress: "info",
  review: "warning",
  done: "success",
  blocked: "danger",
}

function avatarFor(assigneeId: number | null, name?: string | null) {
  if (assigneeId == null) return null
  // Prefer real username initials; fall back to id-derived 2-char hash so the
  // avatar still renders something rather than blanking out.
  const source = (name && name.trim()) || `#${assigneeId}`
  const initials = source.slice(0, 2).toUpperCase()
  return {
    initials,
    avColor: ((assigneeId % 8) + 1) as number,
  }
}

export function SubTasksList({ parent, subtasks }: SubTasksListProps) {
  const { language: lang } = useApp()
  const router = useRouter()
  const { openTaskModal } = useTaskModal()

  const onAdd = () =>
    openTaskModal({
      defaultType: "subtask",
      defaultParentId: parent.id,
      defaultProjectId: parent.projectId,
    })

  return (
    <Section
      title={lang === "tr" ? "Alt Görevler" : "Sub-tasks"}
      action={
        <Button
          size="xs"
          variant="ghost"
          icon={<Plus size={12} />}
          onClick={onAdd}
        >
          {lang === "tr" ? "Ekle" : "Add"}
        </Button>
      }
      style={{ marginTop: 20 }}
    >
      <Card padding={0}>
        {subtasks.map((st, i) => {
          const status = canonical(st.status)
          const isDone = status === "done"
          const av = avatarFor(st.assigneeId, st.assigneeName)
          const label =
            lang === "tr" ? STATUS_LABEL[status].tr : STATUS_LABEL[status].en
          return (
            <div
              key={st.id}
              role="button"
              tabIndex={0}
              onClick={() =>
                router.push(`/projects/${parent.projectId}/tasks/${st.id}`)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  router.push(`/projects/${parent.projectId}/tasks/${st.id}`)
                }
              }}
              style={{
                display: "grid",
                // Prototype task-detail.jsx:57 — 5 fixed columns + 1 flexible
                // title. Status badge column is a hard 90px so "in_progress"
                // and "todo" badges line up vertically across rows.
                gridTemplateColumns: "80px 20px 1fr 90px 22px",
                padding: "10px 14px",
                alignItems: "center",
                gap: 10,
                borderBottom:
                  i < subtasks.length - 1
                    ? "1px solid var(--border)"
                    : "none",
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              <span
                className="mono"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--fg-muted)",
                }}
              >
                {st.key}
              </span>
              {/* Read-only checkbox mirroring the prototype — clicking it
                  navigates to the row's task page (the row's onClick handles
                  this) rather than mutating status from the parent task. */}
              <input
                type="checkbox"
                checked={isDone}
                readOnly
                tabIndex={-1}
                aria-label={
                  isDone
                    ? lang === "tr"
                      ? "Tamamlandı"
                      : "Done"
                    : lang === "tr"
                      ? "Bekliyor"
                      : "Pending"
                }
                style={{
                  width: 14,
                  height: 14,
                  cursor: "pointer",
                  accentColor: "var(--status-done)",
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <span
                style={{
                  color: isDone ? "var(--fg-muted)" : "var(--fg)",
                  textDecoration: isDone ? "line-through" : "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {st.title}
              </span>
              {/* Fixed-width status cell so the Badge anchors at the same
                  visual position regardless of label length. */}
              <span style={{ display: "inline-flex" }}>
                <Badge size="xs" tone={STATUS_TONE[status]} dot>
                  {label}
                </Badge>
              </span>
              {av ? <Avatar user={av} size={20} /> : <span />}
            </div>
          )
        })}
      </Card>
    </Section>
  )
}
