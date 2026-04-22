"use client"

// ParentTaskLink — Jira epic-link style breadcrumb shown ABOVE the task title
// when task.parentTaskId is set (D-35). Structure:
//   [Folder icon] [project name] [ChevronRight] [parent key + parent title]
//
// Fetches the parent task lazily via taskService.getById — TanStack Query
// deduplicates with any other consumer that already has the parent cached.

import Link from "next/link"
import { ChevronRight, Folder } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { taskService, type Task } from "@/services/task-service"
import type { Project } from "@/services/project-service"
import { useApp } from "@/context/app-context"

interface ParentTaskLinkProps {
  task: Task
  project: Project
}

export function ParentTaskLink({ task, project }: ParentTaskLinkProps) {
  const { language: lang } = useApp()
  const parentId = task.parentTaskId
  const { data: parent } = useQuery({
    queryKey: ["tasks", parentId],
    queryFn: () => taskService.getById(parentId!),
    enabled: parentId != null,
  })

  if (parentId == null) return null

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: "var(--fg-muted)",
        marginBottom: 12,
      }}
    >
      <Folder size={13} />
      <Link
        href={`/projects/${project.id}`}
        style={{ color: "var(--fg-muted)", textDecoration: "none" }}
      >
        {project.name}
      </Link>
      <ChevronRight size={11} />
      {parent ? (
        <Link
          href={`/projects/${project.id}/tasks/${parent.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--fg-muted)",
            textDecoration: "none",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)" }}>{parent.key}</span>
          <span>{parent.title}</span>
        </Link>
      ) : (
        <span style={{ color: "var(--fg-subtle)" }}>
          {lang === "tr" ? "Ana görev yükleniyor…" : "Loading parent…"}
        </span>
      )}
    </div>
  )
}
