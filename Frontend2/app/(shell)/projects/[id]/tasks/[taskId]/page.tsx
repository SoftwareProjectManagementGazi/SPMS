"use client"

// Task Detail page — PAGE-03 final pillar + TASK-04 phase stepper.
// Route: /projects/[id]/tasks/[taskId]
//
// Layout (D-34): 2-column grid (main 1fr + sidebar 300px, 24px gap).
// Stack collapses via CSS (.task-detail-grid) at ≤1024px per D-54.
//
// Next.js 16: client page uses useParams() (plain object) — RESEARCH Pitfall 1.
// No need to await props.params here because "use client" reads the live URL.

import * as React from "react"
import { useParams } from "next/navigation"
import { Bug } from "lucide-react"

import { Card, Section } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useProject } from "@/hooks/use-projects"
import { useTaskDetail } from "@/hooks/use-task-detail"
import { useTasks, useUpdateTask } from "@/hooks/use-tasks"

import { ActivitySection } from "@/components/task-detail/activity-section"
import { AttachmentsSection } from "@/components/task-detail/attachments-section"
import { DependenciesSection } from "@/components/task-detail/dependencies-section"
import { DescriptionEditor } from "@/components/task-detail/description-editor"
import { ParentTaskLink } from "@/components/task-detail/parent-task-link"
import { PropertiesSidebar } from "@/components/task-detail/properties-sidebar"
import { SubTasksList } from "@/components/task-detail/sub-tasks-list"
import { WatcherToggle } from "@/components/task-detail/watcher-toggle"
import type { UserLite } from "@/lib/audit-formatter"

export default function TaskDetailPage() {
  const params = useParams()
  const { language: lang } = useApp()
  const projectId = Number(params.id)
  const taskId = Number(params.taskId)

  const { data: project } = useProject(projectId)
  const { data: task, isLoading } = useTaskDetail(taskId)
  const { data: allTasks = [] } = useTasks(projectId)

  const updateTask = useUpdateTask(taskId)

  // Local description draft — the plain textarea fires on every keystroke,
  // the rich editor fires debounced every 2s (D-36). Both paths go through
  // `handleDescriptionChange` which PATCHes when the value actually changes.
  const [descDraft, setDescDraft] = React.useState("")
  React.useEffect(() => {
    if (task) setDescDraft(task.description ?? "")
  }, [task])

  // Watcher local state — Phase 11 has no backend `is_watching` per-user flag
  // (noted in plan Step 4). Initial state is `false`; onChange syncs after the
  // POST/DELETE succeeds so repeated clicks stay consistent within the session.
  const [isWatching, setIsWatching] = React.useState(false)

  const subtasks = React.useMemo(
    () => allTasks.filter((t) => t.parentTaskId === taskId),
    [allTasks, taskId],
  )

  // Phase 11 has no GET /projects/{id}/members endpoint, so the member pool
  // available here is the project manager (from the project DTO). The full
  // member roster lands in a later phase; for now Activity + History resolve
  // names for the manager only, and unknown user_ids fall through to the
  // "Bilinmeyen kullanıcı" placeholder in formatAuditEntry.
  const projectMembers = React.useMemo<UserLite[]>(() => {
    if (project?.managerId != null) {
      return [
        {
          id: project.managerId,
          name: project.managerName ?? `#${project.managerId}`,
        },
      ]
    }
    return []
  }, [project])

  if (Number.isNaN(projectId) || Number.isNaN(taskId)) {
    return (
      <Card padding={40}>
        <div style={{ textAlign: "center", color: "var(--fg-muted)" }}>
          {lang === "tr" ? "Geçersiz bağlantı." : "Invalid URL."}
        </div>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "var(--fg-muted)",
        }}
      >
        {lang === "tr" ? "Yükleniyor…" : "Loading…"}
      </div>
    )
  }

  if (!task || !project) {
    return (
      <Card padding={40}>
        <div style={{ textAlign: "center", color: "var(--fg-muted)" }}>
          {lang === "tr" ? "Görev bulunamadı." : "Task not found."}
        </div>
      </Card>
    )
  }

  function handleDescriptionChange(next: string) {
    setDescDraft(next)
    if (task && next !== (task.description ?? "")) {
      updateTask.mutate({ field: "description", value: next })
    }
  }

  return (
    <div className="task-detail-grid">
      {/* Main column */}
      <div>
        {/* Parent breadcrumb (D-35) — only when subtask */}
        <ParentTaskLink task={task} project={project} />

        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: 8,
          }}
        >
          {task.type === "bug" && (
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "var(--radius-sm)",
                background:
                  "color-mix(in oklch, var(--priority-critical) 15%, transparent)",
                color: "var(--priority-critical)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Bug size={14} />
            </div>
          )}
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: -0.4,
              lineHeight: 1.3,
              color: "var(--fg)",
              margin: 0,
              flex: 1,
            }}
          >
            {task.title}
          </h1>
        </div>

        {/* Key + type meta line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "var(--fg-muted)",
            marginBottom: 16,
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)" }}>{task.key}</span>
          <span>·</span>
          <span>{task.type}</span>
        </div>

        {/* Watcher toggle row (D-53) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <WatcherToggle
            task={task}
            isWatching={isWatching}
            onChange={setIsWatching}
          />
          <div style={{ flex: 1 }} />
        </div>

        {/* Description (D-36) */}
        <Section title={lang === "tr" ? "Açıklama" : "Description"}>
          <DescriptionEditor
            value={descDraft}
            onChange={handleDescriptionChange}
          />
        </Section>

        {/* Sub-tasks (D-37) */}
        <SubTasksList parent={task} subtasks={subtasks} />

        {/* Activity (D-47) — Yorumlar + Geçmiş sub-tabs.
            Members placeholder: Phase 11 does not add GET /projects/{id}/members;
            the project manager is the only member available from the existing
            project DTO. Extending the member pool belongs to a later plan. */}
        <ActivitySection
          taskId={task.id}
          project={project}
          projectMembers={projectMembers}
        />

        {/* Attachments (D-48) — drag-drop + file list + link references */}
        <AttachmentsSection taskId={task.id} />

        {/* Dependencies (D-49) — type select + task picker + list + navigate */}
        <DependenciesSection taskId={task.id} projectId={project.id} />
      </div>

      {/* Right column — Properties sidebar (D-38 + TASK-04) */}
      <div>
        <PropertiesSidebar
          task={task}
          project={project}
          subtasks={subtasks}
        />
      </div>
    </div>
  )
}
