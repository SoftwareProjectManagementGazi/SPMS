"use client"

// TaskGroupList — renders the filtered/sorted task list, optionally grouped.
//
// When `groupBy === "none"`, the rows are wrapped in a single Card with bottom
// borders. When grouping is active, one Card per group with a sticky uppercase
// header inside. The groupKey mapping is:
//   project  → project key (via projectsByKey map)
//   status   → task.status raw string
//   priority → task.priority raw string
//   due      → dueBucket(task.due) output

import * as React from "react"

import { Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { dueBucket } from "@/lib/my-tasks/due-bucket"
import type { Task } from "@/services/task-service"

import { TaskRow } from "./task-row"
import type { GroupBy } from "./task-filter-bar"

interface TaskGroupListProps {
  tasks: Task[]
  groupBy: GroupBy
  starred: number[]
  onToggleStar: (id: number) => void
  compact?: boolean
  projectsByKey?: Map<number, string>
}

export function TaskGroupList({
  tasks,
  groupBy,
  starred,
  onToggleStar,
  compact,
  projectsByKey,
}: TaskGroupListProps) {
  const { language: lang } = useApp()

  if (tasks.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: "center",
          color: "var(--fg-subtle)",
          fontSize: 12.5,
        }}
      >
        {lang === "tr" ? "Görev bulunamadı" : "No tasks found"}
      </div>
    )
  }

  if (groupBy === "none") {
    return (
      <Card padding={0}>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            compact={compact}
            starred={starred.includes(task.id)}
            onToggleStar={() => onToggleStar(task.id)}
            showProject={!!projectsByKey}
            projectKey={projectsByKey?.get(task.projectId)}
          />
        ))}
      </Card>
    )
  }

  // Build group map deterministically — preserve insertion order of first
  // task in each group rather than re-sorting group headers alphabetically.
  const groups = new Map<string, Task[]>()
  for (const task of tasks) {
    let key: string
    if (groupBy === "project") {
      key = projectsByKey?.get(task.projectId) ?? `#${task.projectId}`
    } else if (groupBy === "status") {
      key = task.status
    } else if (groupBy === "priority") {
      key = task.priority
    } else {
      key = dueBucket(task.due)
    }
    const list = groups.get(key)
    if (list) list.push(task)
    else groups.set(key, [task])
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from(groups.entries()).map(([key, list]) => (
        <Card key={key} padding={0}>
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--border)",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--fg-subtle)",
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {key} · {list.length}
          </div>
          {list.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              compact={compact}
              starred={starred.includes(task.id)}
              onToggleStar={() => onToggleStar(task.id)}
              // When grouping by project, the key is already shown in the
              // header — so hide the per-row badge to avoid redundancy.
              showProject={groupBy !== "project" && !!projectsByKey}
              projectKey={projectsByKey?.get(task.projectId)}
            />
          ))}
        </Card>
      ))}
    </div>
  )
}
