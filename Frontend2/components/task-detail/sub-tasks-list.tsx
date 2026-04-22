"use client"

// SubTasksList — rich-row list under the main description (D-37). Each row
// is clickable and routes to its sub-task detail page. The "Ekle" action
// opens the global TaskCreateModal preset for a sub-task with parent pre-filled.

import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Avatar,
  Badge,
  Button,
  Card,
  Section,
  StatusDot,
  type StatusValue,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useTaskModal } from "@/context/task-modal-context"
import type { Task } from "@/services/task-service"

interface SubTasksListProps {
  parent: Task
  subtasks: Task[]
}

// Task.status is a free-form string (backend-controlled column). StatusDot only
// understands its 5 canonical values — fall back to "todo" for anything else
// so the dot still renders instead of throwing.
function toStatusValue(s: string): StatusValue {
  const norm = s.toLowerCase() as StatusValue
  if (
    norm === "todo" ||
    norm === "progress" ||
    norm === "review" ||
    norm === "done" ||
    norm === "blocked"
  ) {
    return norm
  }
  if (norm === "in_progress") return "progress"
  return "todo"
}

function avatarFor(assigneeId: number | null) {
  if (assigneeId == null) return null
  return {
    initials: `#${assigneeId}`.slice(0, 2).toUpperCase(),
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
        {subtasks.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: "var(--fg-subtle)",
              fontSize: 12,
            }}
          >
            {lang === "tr" ? "Alt görev yok" : "No sub-tasks"}
          </div>
        ) : (
          subtasks.map((st, i) => {
            const av = avatarFor(st.assigneeId)
            const isDone = st.status.toLowerCase() === "done"
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
                  gridTemplateColumns: "80px 1fr auto 90px 22px",
                  padding: "10px 16px",
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
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--fg-muted)",
                  }}
                >
                  {st.key}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    color: isDone ? "var(--fg-muted)" : "var(--fg)",
                    textDecoration: isDone ? "line-through" : "none",
                    minWidth: 0,
                  }}
                >
                  <StatusDot status={toStatusValue(st.status)} />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {st.title}
                  </span>
                </span>
                <Badge size="xs" tone="neutral">
                  {st.status}
                </Badge>
                <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>
                  {st.due
                    ? new Date(st.due).toLocaleDateString(
                        lang === "tr" ? "tr-TR" : "en-US",
                        { month: "short", day: "numeric" },
                      )
                    : "—"}
                </span>
                {av ? (
                  <Avatar user={av} size={20} />
                ) : (
                  <span />
                )}
              </div>
            )
          })
        )}
      </Card>
    </Section>
  )
}
