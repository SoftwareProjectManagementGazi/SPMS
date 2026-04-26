"use client"

// Phase 13 Plan 13-04 Task 1 — ActivityEmpty (UI-SPEC §C.4 + D-F4).
//
// Two distinguished empty states:
//   - filtered = true  → "Bu filtreyle eşleşen olay yok." muted text only.
//   - filtered = false → "Henüz aktivite yok." + ghost Button "Bir görev oluştur"
//                        which mounts the Phase 11 TaskCreateModal via
//                        `useTaskModal().openTaskModal({})`.
//
// The TaskModal context is provided at shell layout level and is therefore
// always available on the project Activity tab. On the user-profile Activity
// tab (Plan 13-06) the same provider tree mounts because /users/[id] also
// lives under (shell). If a future caller mounts ActivityEmpty outside the
// shell tree, useTaskModal would throw — but no such call site exists today.
// Optional-chaining the call defensively keeps the component crash-free if
// the provider ever becomes optional.

import * as React from "react"

import { Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useTaskModal } from "@/context/task-modal-context"

export interface ActivityEmptyProps {
  /** True when a filter is active and yielded zero matches. */
  filtered: boolean
}

export function ActivityEmpty({ filtered }: ActivityEmptyProps) {
  const { language } = useApp()
  const T = (tr: string, en: string) => (language === "tr" ? tr : en)

  // Defensive: the hook throws when called outside TaskModalProvider. Catching
  // the throw keeps the component renderable in stand-alone test harnesses.
  let openTaskModal: ((d?: { defaultProjectId?: number }) => void) | undefined
  try {
    openTaskModal = useTaskModal().openTaskModal
  } catch {
    openTaskModal = undefined
  }

  if (filtered) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "var(--fg-muted)",
          fontSize: 13,
        }}
      >
        {T("Bu filtreyle eşleşen olay yok.", "No events match this filter.")}
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        color: "var(--fg-muted)",
        fontSize: 13,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        {T("Henüz aktivite yok.", "No activity yet.")}
      </div>
      {openTaskModal && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openTaskModal!({})}
        >
          {T("Bir görev oluştur", "Create a task")}
        </Button>
      )}
    </div>
  )
}
