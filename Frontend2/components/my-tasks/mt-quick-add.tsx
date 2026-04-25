"use client"

// MTQuickAdd — inline "create a task" row that sits between the Hero and the
// Toolbar on /my-tasks.
//
// Ports the prototype `addTask` UX (lines 145-157, 199 of my-tasks.jsx) into a
// real backend create. Unlike the prototype which only patches localStorage,
// here we hit `POST /tasks` via `useCreateTask`. On success we let the React
// Query invalidation in `useCreateTask` refresh both the project task list AND
// the my-tasks list (the "tasks" key invalidates both).
//
// Empty project list (e.g. user has no project membership) renders the row in
// a disabled visual state with an explanatory hint.

import * as React from "react"
import { Plus } from "lucide-react"

import { Button, PriorityChip } from "@/components/primitives"
import { useCreateTask } from "@/hooks/use-tasks"
import { useToast } from "@/components/toast"
import type { LangCode } from "@/lib/i18n"
import type { Project } from "@/services/project-service"
import type { Task } from "@/services/task-service"

export interface MTQuickAddProps {
  lang: LangCode
  projects: Project[]
  /**
   * Optional callback fired AFTER the create resolves. Useful for tests + for
   * scrolling the list back to the top when a new row appears.
   */
  onAdded?: (task: Task) => void
}

type Priority = Task["priority"]

const PRIORITIES: Priority[] = ["critical", "high", "medium", "low"]

function priorityLabel(p: Priority, lang: LangCode): string {
  if (p === "critical") return lang === "tr" ? "Kritik" : "Critical"
  if (p === "high") return lang === "tr" ? "Yüksek" : "High"
  if (p === "medium") return lang === "tr" ? "Orta" : "Medium"
  return lang === "tr" ? "Düşük" : "Low"
}

export function MTQuickAdd({ lang, projects, onAdded }: MTQuickAddProps) {
  const createTask = useCreateTask()
  const { showToast } = useToast()
  const [title, setTitle] = React.useState("")
  // Selected project id. `null` means "user hasn't picked yet OR projects not
  // loaded yet" — derive the effective project on the fly so we don't need a
  // setState-in-effect to sync with async-loaded projects.
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | null>(
    null
  )
  const projectId =
    selectedProjectId != null
      ? selectedProjectId
      : (projects[0]?.id ?? null)
  const [priority, setPriority] = React.useState<Priority>("medium")
  const [due, setDue] = React.useState<string>("")

  const canSubmit =
    title.trim().length > 0 && projectId != null && !createTask.isPending

  const handleSubmit = React.useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!canSubmit || projectId == null) return
      try {
        const created = await createTask.mutateAsync({
          project_id: projectId,
          title: title.trim(),
          priority,
          due: due ? due : null,
        })
        // Reset form to the same project so the user can keep adding rapid-fire.
        setTitle("")
        setDue("")
        setPriority("medium")
        if (onAdded) onAdded(created)
        showToast({
          message: lang === "tr" ? "Görev eklendi" : "Task added",
          variant: "success",
        })
      } catch {
        showToast({
          message:
            lang === "tr" ? "Görev eklenemedi" : "Could not add task",
          variant: "error",
        })
      }
    },
    [
      canSubmit,
      createTask,
      projectId,
      title,
      priority,
      due,
      onAdded,
      lang,
      showToast,
    ]
  )

  // Cycle through the 4 priorities when the chip is clicked. Faster than a
  // dropdown for what is fundamentally a 4-choice control.
  const cyclePriority = React.useCallback(() => {
    const idx = PRIORITIES.indexOf(priority)
    setPriority(PRIORITIES[(idx + 1) % PRIORITIES.length])
  }, [priority])

  return (
    <form
      data-testid="mt-quick-add"
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "inset 0 0 0 1px var(--border), var(--inset-card)",
      }}
    >
      <Plus
        size={14}
        style={{ color: "var(--fg-subtle)", flexShrink: 0 }}
        aria-hidden
      />

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={
          lang === "tr"
            ? "Hızlıca görev ekle…"
            : "Quickly add a task…"
        }
        aria-label={lang === "tr" ? "Görev başlığı" : "Task title"}
        disabled={createTask.isPending || projectId == null}
        style={{
          flex: 1,
          minWidth: 0,
          height: 28,
          background: "transparent",
          border: 0,
          fontSize: 13,
          color: "var(--fg)",
        }}
      />

      <select
        value={projectId ?? ""}
        onChange={(e) => setSelectedProjectId(Number(e.target.value))}
        disabled={projects.length === 0 || createTask.isPending}
        aria-label={lang === "tr" ? "Proje" : "Project"}
        style={{
          height: 28,
          padding: "0 8px",
          fontSize: 12.5,
          background: "var(--surface-2)",
          color: "var(--fg)",
          border: 0,
          borderRadius: "var(--radius-sm)",
          boxShadow: "inset 0 0 0 1px var(--border)",
        }}
      >
        {projects.length === 0 && (
          <option value="">
            {lang === "tr" ? "Proje yok" : "No projects"}
          </option>
        )}
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={cyclePriority}
        title={priorityLabel(priority, lang)}
        aria-label={
          lang === "tr"
            ? `Öncelik: ${priorityLabel(priority, lang)}`
            : `Priority: ${priorityLabel(priority, lang)}`
        }
        disabled={createTask.isPending}
        style={{
          height: 28,
          display: "inline-flex",
          alignItems: "center",
          padding: "0 8px",
          background: "var(--surface-2)",
          color: "var(--fg)",
          border: 0,
          borderRadius: "var(--radius-sm)",
          boxShadow: "inset 0 0 0 1px var(--border)",
          cursor: createTask.isPending ? "not-allowed" : "pointer",
        }}
      >
        <PriorityChip
          level={priority}
          lang={lang}
          withLabel={false}
          style={{ marginRight: 4 }}
        />
        <span style={{ fontSize: 12.5 }}>{priorityLabel(priority, lang)}</span>
      </button>

      <input
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        disabled={createTask.isPending}
        aria-label={lang === "tr" ? "Bitiş tarihi" : "Due date"}
        style={{
          height: 28,
          padding: "0 8px",
          fontSize: 12.5,
          background: "var(--surface-2)",
          color: "var(--fg)",
          border: 0,
          borderRadius: "var(--radius-sm)",
          boxShadow: "inset 0 0 0 1px var(--border)",
        }}
      />

      <Button
        type="submit"
        variant="primary"
        size="sm"
        disabled={!canSubmit}
        aria-label={lang === "tr" ? "Görev ekle" : "Add task"}
      >
        {lang === "tr" ? "Ekle" : "Add"}
      </Button>
    </form>
  )
}
