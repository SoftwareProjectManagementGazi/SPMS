"use client"

// ActivitySection — wraps the "Yorumlar" / "Geçmiş" / "Worklog" sub-tabs per
// D-47 + prototype task-detail.jsx:71-75.
//
// Sub-tab chrome is a row of pill-shaped buttons (rounded 4px, accent fill on
// the active one) — NOT the underline Tabs primitive. The previous version
// used <Tabs size="sm"/> which gave the chrome a 2px primary border baseline
// and didn't match the prototype's pill chip aesthetic (triage 1.11 / 2.8).
//
// Worklog is a placeholder tab — surfaces a "Yakında" message until the time-
// tracking integration lands. Keeps prototype parity (3 tabs visible) without
// pretending the feature exists.

import * as React from "react"
import { Card, Section } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { CommentsSection, type Member } from "./comments-section"
import { HistorySection } from "./history-section"
import type { Project } from "@/services/project-service"
import type { UserLite } from "@/lib/audit-formatter"

interface ActivitySectionProps {
  taskId: number
  project: Project
  projectMembers: UserLite[]
}

type SubTabId = "comments" | "history" | "worklog"

export function ActivitySection({
  taskId,
  project,
  projectMembers,
}: ActivitySectionProps) {
  const { language: lang } = useApp()
  const [sub, setSub] = React.useState<SubTabId>("comments")

  // Comments section needs Member[] (same shape as UserLite); re-shape to
  // avoid leaking UserLite into its public API.
  const members: Member[] = React.useMemo(
    () => projectMembers.map((u) => ({ id: u.id, name: u.name })),
    [projectMembers],
  )

  const tabs: Array<{ id: SubTabId; label: string }> = [
    { id: "comments", label: lang === "tr" ? "Yorumlar" : "Comments" },
    { id: "history", label: lang === "tr" ? "Geçmiş" : "History" },
    { id: "worklog", label: lang === "tr" ? "Worklog" : "Worklog" },
  ]

  return (
    <Section
      title={lang === "tr" ? "Aktivite" : "Activity"}
      style={{ marginTop: 20 }}
    >
      <Card padding={0}>
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            gap: 4,
          }}
        >
          {tabs.map((t) => {
            const active = t.id === sub
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSub(t.id)}
                aria-pressed={active}
                style={{
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  borderRadius: 4,
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "var(--accent-fg)" : "var(--fg-muted)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
        <div style={{ padding: 12 }}>
          {sub === "comments" && (
            <CommentsSection taskId={taskId} projectMembers={members} />
          )}
          {sub === "history" && (
            <HistorySection
              taskId={taskId}
              project={project}
              projectMembers={projectMembers}
            />
          )}
          {sub === "worklog" && (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "var(--fg-subtle)",
                fontSize: 12.5,
              }}
            >
              {lang === "tr"
                ? "Worklog yakında — zaman takibi sonraki fazda."
                : "Worklog coming soon — time tracking ships in a later phase."}
            </div>
          )}
        </div>
      </Card>
    </Section>
  )
}
