"use client"

// MTQuickAdd — inline "create a task" row that sits between the Hero and the
// Toolbar on /my-tasks.
//
// Ports the prototype `addTask` UX (my-tasks-parts.jsx 274-330) into a real
// backend create. Unlike the prototype which only patches localStorage, here
// we hit POST /tasks via useCreateTask. The query invalidation in the hook
// refreshes both the project task list AND the my-tasks list (the "tasks"
// key invalidates both).
//
// UI/UX decisions matching the prototype (UAT round 8 fixes):
//   - Project picker uses MTPicker with project colour dot + project key in
//     compact label form (instead of a native <select>).
//   - Priority chip opens a 4-option MTPicker popover (instead of cycling
//     through priorities on click).
//   - The form gets a focus animation: a 3px glow ring + 1px lift on focus,
//     mirroring my-tasks-parts.jsx 288-298.
//   - Padding is asymmetric: 8px 10px 8px 14px so the leftmost Plus icon has
//     more breathing room than the rightmost Add button.
//   - Empty project list (e.g. user has no project membership) renders the
//     row visually disabled.

import * as React from "react"
import { Plus } from "lucide-react"

import { Button, PriorityChip } from "@/components/primitives"
import { useCreateTask } from "@/hooks/use-tasks"
import { useToast } from "@/components/toast"
import type { LangCode } from "@/lib/i18n"
import type { Project } from "@/services/project-service"
import type { Task } from "@/services/task-service"

import { MTPicker, type MTPickerOption } from "./mt-picker"

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

// Same 8-bucket modulo as TaskRow / Avatar — keeps the project colour stable
// regardless of where it surfaces.
function projectColor(projectId: number): string {
  return `var(--av-${(projectId % 8) + 1})`
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
  const [focused, setFocused] = React.useState(false)

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

  const projectOptions = React.useMemo<MTPickerOption[]>(
    () =>
      projects.map((p) => ({
        id: String(p.id),
        label: p.name,
        sub: p.key,
        dot: projectColor(p.id),
      })),
    [projects]
  )

  const priorityOptions = React.useMemo<MTPickerOption[]>(
    () =>
      PRIORITIES.map((p) => ({
        id: p,
        label: priorityLabel(p, lang),
        icon: <PriorityChip level={p} lang={lang} withLabel={false} />,
      })),
    [lang]
  )

  return (
    <form
      data-testid="mt-quick-add"
      onSubmit={handleSubmit}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        // Only collapse the focus ring when focus leaves the form entirely.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false)
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        // Asymmetric padding (prototype my-tasks-parts.jsx:288): plus-icon side
        // breathes a bit more than the submit button side.
        padding: "8px 10px 8px 14px",
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: focused
          ? "0 0 0 3px color-mix(in oklch, var(--primary) 15%, transparent), 0 2px 8px oklch(0 0 0 / 0.05), inset 0 0 0 1px var(--primary)"
          : "inset 0 0 0 1px var(--border), var(--inset-card)",
        transform: focused ? "translateY(-1px)" : "translateY(0)",
        transition:
          "box-shadow 0.18s ease, transform 0.18s ease",
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

      <MTPicker
        value={projectId != null ? String(projectId) : ""}
        onChange={(id) => setSelectedProjectId(Number(id))}
        options={projectOptions}
        compactLabel="sub"
        ariaLabel={lang === "tr" ? "Proje" : "Project"}
        disabled={projects.length === 0 || createTask.isPending}
        minWidth={92}
      />

      <MTPicker
        value={priority}
        onChange={(id) => setPriority(id as Priority)}
        options={priorityOptions}
        ariaLabel={
          lang === "tr"
            ? `Öncelik: ${priorityLabel(priority, lang)}`
            : `Priority: ${priorityLabel(priority, lang)}`
        }
        disabled={createTask.isPending}
        minWidth={120}
      />

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
