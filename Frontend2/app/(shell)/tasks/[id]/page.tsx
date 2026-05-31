"use client"

// Task redirect page — /tasks/[id]
// Bildirimlerden gelen task-only navigasyonu için köprü rota.
// taskId ile görevi fetch eder, projectId'yi alır ve
// /projects/{projectId}/tasks/{taskId} adresine yönlendirir.

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useTaskDetail } from "@/hooks/use-task-detail"
import { useApp } from "@/context/app-context"

export default function TaskRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const { language: lang } = useApp()
  const taskId = Number(params.id)
  // Tier 3 — a non-numeric id (e.g. /tasks/abc) leaves useTaskDetail's query
  // disabled, so neither effect below fires and the page hangs on "Yükleniyor…"
  // forever. Treat an invalid id like a fetch error → bounce to /my-tasks.
  const validId = Number.isFinite(taskId)
  const { data: task, isError } = useTaskDetail(taskId)

  React.useEffect(() => {
    if (task) {
      router.replace(`/projects/${task.projectId}/tasks/${task.id}`)
    }
  }, [task, router])

  React.useEffect(() => {
    if (isError || !validId) {
      router.replace("/my-tasks")
    }
  }, [isError, validId, router])

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        color: "var(--fg-muted)",
        fontSize: 14,
      }}
    >
      {lang === "tr" ? "Yükleniyor…" : "Loading…"}
    </div>
  )
}
