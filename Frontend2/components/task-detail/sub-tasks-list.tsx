"use client"

// SubTasksList — rich-row list under the main description (D-37). Each row
// is clickable and routes to its sub-task detail page. The "Ekle" action
// opens the global TaskCreateModal preset for a sub-task with parent pre-filled.
//
// Layout matches prototype task-detail.jsx:54-65 exactly:
//   80px (mono key) | 20px (checkbox) | 1fr (title) | 90px (Badge) | 22px (avatar)
//
// The Badge label shows the RAW backend status string (i.e. whatever the
// project's board column is named — "TODO", "Backlog", "QA", "Done", etc.).
// We deliberately do NOT localise here per UAT round 12: the column name is
// part of project data, not a translation key, and forcing it through a
// canonical {todo, progress, review, done, blocked} mapping caused custom
// columns to show up as "Yapılacak" everywhere.
//
// The TONE is still derived from a canonical mapping so the colour palette
// stays semantic: "done"-shaped statuses paint success, "progress"-shaped
// paint info, etc. Anything outside the canonical 5 falls back to neutral.

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

type Tone = "success" | "info" | "warning" | "danger" | "neutral"

// Coerce a raw backend status string to a Badge tone. Custom column names that
// don't match any canonical bucket fall through to "neutral", which is the
// same fallback Badge would use anyway.
function statusTone(status: string | null | undefined): Tone {
  const s = String(status ?? "").toLowerCase()
  if (s === "done" || s === "completed" || s === "closed") return "success"
  if (s === "progress" || s === "in_progress" || s === "doing") return "info"
  if (s === "review" || s === "in_review") return "warning"
  if (s === "blocked") return "danger"
  return "neutral"
}

function isDoneStatus(status: string | null | undefined): boolean {
  const s = String(status ?? "").toLowerCase()
  return s === "done" || s === "completed" || s === "closed"
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
          const isDone = isDoneStatus(st.status)
          const av = avatarFor(st.assigneeId, st.assigneeName)
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
                // title. Status badge column is a hard 90px so badges line up
                // vertically across rows even when names vary in length.
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
              <div
                className="mono"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--fg-muted)",
                }}
              >
                {st.key}
              </div>
              {/* Read-only checkbox mirroring the prototype — clicking it
                  bubbles to the row's onClick which navigates to the
                  sub-task page; we stopPropagation only so the row doesn't
                  trigger TWICE if the browser sends both. */}
              <input
                type="checkbox"
                checked={isDone}
                readOnly
                tabIndex={-1}
                aria-label={isDone ? "done" : "pending"}
                style={{
                  width: 14,
                  height: 14,
                  cursor: "pointer",
                  accentColor: "var(--status-done)",
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <div
                style={{
                  textDecoration: isDone ? "line-through" : "none",
                  color: isDone ? "var(--fg-muted)" : "var(--fg)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {st.title}
              </div>
              {/* Badge label is the raw backend column name — no
                  localization, no canonical-token fallback. Tone still
                  paints the canonical palette so colour stays semantic. */}
              <Badge size="xs" tone={statusTone(st.status)} dot>
                {st.status || "—"}
              </Badge>
              {/* Phase 13 Plan 13-03 (D-D4) — sub-task assignee Avatar links
                  to profile; row's onClick (navigate to sub-task) keeps
                  working because Avatar Link's stopPropagation fires first. */}
              {av ? (
                <Avatar
                  user={av}
                  size={20}
                  href={st.assigneeId != null ? `/users/${st.assigneeId}` : undefined}
                />
              ) : (
                <span />
              )}
            </div>
          )
        })}
      </Card>
    </Section>
  )
}
