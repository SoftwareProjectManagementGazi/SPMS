"use client"

// WatcherToggle — D-53. "Takip et" / "Takipte" toggle + watcher_count Badge.
//
// The initial `isWatching` prop comes from the caller — v2.0 Phase 11 has no
// backend endpoint telling the current user whether they already watch a given
// task. The page ships `false` as the placeholder (Plan 09 may introduce
// `is_watching` on the Task entity). The POST/DELETE still fire correctly.

import { Eye } from "lucide-react"
import { Badge, Button } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useAddWatcher, useRemoveWatcher } from "@/hooks/use-watchers"
import type { Task } from "@/services/task-service"

interface WatcherToggleProps {
  task: Task
  isWatching: boolean
  onChange?: (next: boolean) => void
}

export function WatcherToggle({
  task,
  isWatching,
  onChange,
}: WatcherToggleProps) {
  const { language: lang } = useApp()
  const addW = useAddWatcher(task.id)
  const removeW = useRemoveWatcher(task.id)

  const handleClick = () => {
    if (isWatching) {
      removeW.mutate(undefined, {
        onSuccess: () => onChange?.(false),
      })
    } else {
      addW.mutate(undefined, {
        onSuccess: () => onChange?.(true),
      })
    }
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <Button
        size="sm"
        variant={isWatching ? "primary" : "secondary"}
        icon={<Eye size={13} />}
        onClick={handleClick}
        disabled={addW.isPending || removeW.isPending}
        style={
          isWatching
            ? {
                background:
                  "color-mix(in oklch, var(--primary) 12%, transparent)",
                color: "var(--primary)",
                boxShadow: "inset 0 0 0 1px var(--primary)",
              }
            : undefined
        }
      >
        {isWatching
          ? lang === "tr"
            ? "Takipte"
            : "Watching"
          : lang === "tr"
            ? "Takip et"
            : "Watch"}
      </Button>
      <Badge size="xs" tone="neutral">
        {task.watcherCount}
      </Badge>
    </div>
  )
}
