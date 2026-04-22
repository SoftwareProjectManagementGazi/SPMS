"use client"

// ActivitySection — wraps the "Yorumlar" / "Geçmiş" sub-tabs per D-47.
// Worklog is explicitly deferred (documented decision). Yorumlar is the
// default active sub-tab to match the prototype.

import * as React from "react"
import { Card, Section, Tabs } from "@/components/primitives"
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

export function ActivitySection({
  taskId,
  project,
  projectMembers,
}: ActivitySectionProps) {
  const { language: lang } = useApp()
  const [sub, setSub] = React.useState<"comments" | "history">("comments")

  // CommentsSection needs Member[] (same shape as UserLite); re-shape to
  // avoid leaking UserLite into its public API.
  const members: Member[] = React.useMemo(
    () => projectMembers.map((u) => ({ id: u.id, name: u.name })),
    [projectMembers],
  )

  return (
    <Section
      title={lang === "tr" ? "Aktivite" : "Activity"}
      style={{ marginTop: 20 }}
    >
      <Card padding={0}>
        <div
          style={{
            padding: "8px 12px 0",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Tabs
            size="sm"
            tabs={[
              {
                id: "comments",
                label: lang === "tr" ? "Yorumlar" : "Comments",
              },
              {
                id: "history",
                label: lang === "tr" ? "Geçmiş" : "History",
              },
            ]}
            active={sub}
            onChange={(id: string) => setSub(id as "comments" | "history")}
          />
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
        </div>
      </Card>
    </Section>
  )
}
