"use client"

// HistorySection — renders the Geçmiş sub-tab content using the pure
// audit-formatter module (lib/audit-formatter.ts). Reads the audit log via
// useTaskHistory (Plan 01) and maps each entry to a localized sentence using
// the project's column and phase maps.

import { useTaskHistory } from "@/hooks/use-task-detail"
import { useApp } from "@/context/app-context"
import { Avatar } from "@/components/primitives"
import {
  formatAuditEntry,
  relativeTime,
  type UserLite,
  type AuditEntry,
} from "@/lib/audit-formatter"
import type { Project } from "@/services/project-service"

interface HistorySectionProps {
  taskId: number
  project: Project
  projectMembers: UserLite[]
}

function avatarFromUser(u: UserLite) {
  const initials = u.name.slice(0, 2).toUpperCase()
  return { initials, avColor: ((u.id % 8) + 1) as number }
}

export function HistorySection({
  taskId,
  project,
  projectMembers,
}: HistorySectionProps) {
  const { language: lang } = useApp()
  const { data: entries = [], isLoading } = useTaskHistory(taskId)

  const users = new Map<number, UserLite>(
    projectMembers.map((u) => [u.id, u]),
  )

  // Column map: in this codebase project.columns is already a string[] of
  // display names, so the status code and display value coincide. Passing
  // the array through columnMap lets formatAuditEntry translate in both
  // directions with minimum fuss.
  const columnMap: Record<string, string> = {}
  project.columns.forEach((c) => {
    columnMap[c] = c
  })

  const phaseNodes =
    (
      project.processConfig as {
        workflow?: { nodes?: Array<{ id: string; name: string }> }
      } | null
    )?.workflow?.nodes ?? []
  const phaseMap: Record<string, string> = {}
  phaseNodes.forEach((n) => {
    phaseMap[n.id] = n.name
  })

  if (isLoading) {
    return (
      <div style={{ padding: 16, color: "var(--fg-muted)", fontSize: 12 }}>
        {lang === "tr" ? "Yükleniyor…" : "Loading…"}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          textAlign: "center",
          color: "var(--fg-subtle)",
          fontSize: 12,
        }}
      >
        {lang === "tr" ? "Geçmiş kaydı yok" : "No history"}
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {(entries as AuditEntry[]).map((e, i) => {
        const msg = formatAuditEntry(e, lang, { users, columnMap, phaseMap })
        const u = users.get(e.user_id)
        return (
          <div
            key={`${i}-${e.timestamp}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: 10,
              background: "var(--surface-2)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {u && <Avatar user={avatarFromUser(u)} size={20} />}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--fg)",
                  lineHeight: 1.5,
                }}
              >
                {msg}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                  marginTop: 2,
                }}
              >
                {relativeTime(e.timestamp, lang)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
