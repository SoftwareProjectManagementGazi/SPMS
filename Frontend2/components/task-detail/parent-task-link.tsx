"use client"

// ParentTaskLink — Folder + project + chevron + (parent or task.key) breadcrumb
// rendered ABOVE the task title.
//
// Prototype task-detail.jsx:15-19 renders this for EVERY task (not only
// subtasks): the chevron always points to the project, and the rightmost
// segment is the current task's key. When the task is a subtask, the
// rightmost segment swaps in the parent's key + title for an extra hint at
// the epic-link relationship (D-35 hybrid behaviour).
//
// Pre-UAT-round-9 this only rendered when `task.parentTaskId != null`, so
// regular tasks lost the project crumb entirely.

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

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: "var(--fg-muted)",
        marginBottom: 10,
      }}
    >
      <Folder size={13} aria-hidden />
      <Link
        href={`/projects/${project.id}`}
        style={{ color: "var(--fg-muted)", textDecoration: "none" }}
      >
        {project.name}
      </Link>
      <ChevronRight size={11} aria-hidden />
      {parentId != null ? (
        parent ? (
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
        )
      ) : (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--fg-muted)",
          }}
        >
          {task.key}
        </span>
      )}
    </div>
  )
}
