"use client"

// InlineEdit — generic click-to-edit wrapper for Task Properties sidebar rows
// (D-38). Wraps a display value; on click, becomes an editor via render-prop.
//
// Edit lifecycle:
//   view      → click display → edit with draft-state copy of value
//   edit      → Enter or commit()   → optimistic PATCH /api/v1/tasks/{id}
//   edit      → Escape or cancel()  → drop draft, return to view mode
//   mutation error → roll back cache → error toast → stay in view mode
//
// TanStack Query optimistic pattern matches useUpdateTask from 11-01
// (cancelQueries → setQueryData → rollback on error → invalidate on settle).
// We do NOT reuse useUpdateTask directly because the PATCH body shape for
// InlineEdit is a single {[field]: value} object, while useUpdateTask takes
// {field, value} mutation args; the cache key shape is also slightly different
// (tasks/{id} single-task cache, not tasks/project/{pid} list).
//
// Pattern:
//   <InlineEdit
//     taskId={t.id} field="title" value={t.title}
//     renderDisplay={v => <span>{v}</span>}
//     renderEditor={(draft, setDraft, commit, cancel) => (
//       <input value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} />
//     )}
//   />

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { taskService, type Task } from "@/services/task-service"
import { useToast } from "@/components/toast"
import { useApp } from "@/context/app-context"

interface InlineEditProps<V> {
  taskId: number
  field: string
  value: V
  renderDisplay: (value: V) => React.ReactNode
  renderEditor: (
    draft: V,
    setDraft: (v: V) => void,
    commit: () => void,
    cancel: () => void,
  ) => React.ReactNode
  disabled?: boolean
}

export function InlineEdit<V>({
  taskId,
  field,
  value,
  renderDisplay,
  renderEditor,
  disabled,
}: InlineEditProps<V>) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState<V>(value)
  const qc = useQueryClient()
  const { language: lang } = useApp()
  const { showToast } = useToast()

  // Keep draft in sync with incoming value (e.g. query invalidation updates the row).
  React.useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  const mutate = useMutation({
    mutationFn: (newVal: V) =>
      taskService.patchField(taskId, field, newVal as unknown),
    onMutate: async (newVal) => {
      await qc.cancelQueries({ queryKey: ["tasks", taskId] })
      const prev = qc.getQueryData<Task>(["tasks", taskId])
      if (prev) {
        qc.setQueryData<Task>(["tasks", taskId], {
          ...prev,
          [field]: newVal,
        } as Task)
      }
      return { prev }
    },
    onError: (_err, _newVal, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks", taskId], ctx.prev)
      showToast({
        variant: "error",
        message:
          lang === "tr"
            ? "Kaydedilemedi. Lütfen tekrar deneyin."
            : "Failed to save. Please try again.",
      })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks", taskId] })
    },
  })

  const commit = React.useCallback(() => {
    if (draft !== value) {
      mutate.mutate(draft)
    }
    setEditing(false)
  }, [draft, value, mutate])

  const cancel = React.useCallback(() => {
    setDraft(value)
    setEditing(false)
  }, [value])

  if (!editing || disabled) {
    return (
      <button
        type="button"
        onClick={() => !disabled && setEditing(true)}
        disabled={disabled}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: disabled ? "default" : "pointer",
          color: "var(--fg)",
          textAlign: "left",
          width: "100%",
          font: "inherit",
        }}
      >
        {renderDisplay(value)}
      </button>
    )
  }

  // Edit mode: capture Enter/Escape via key bubble from the editor input.
  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault()
          cancel()
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          commit()
        }
      }}
      style={{
        outline: "2px solid var(--ring)",
        outlineOffset: 1,
        borderRadius: 4,
      }}
    >
      {renderEditor(draft, setDraft, commit, cancel)}
    </div>
  )
}
