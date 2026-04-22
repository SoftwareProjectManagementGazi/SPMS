"use client"

// Settings > Kolonlar sub-tab — D-11 + D-12.
//
// Lists project columns (GET /api/v1/projects/{id}/columns, Phase 9) in
// editable rows:
//   - Column name (rename via PATCH /projects/{id}/columns/{col_id} on blur)
//   - WIP limit (number, 0 = no limit) — HIDDEN when methodology === "WATERFALL"
//     per D-12 ("waterfall has phases, not flow")
//   - Task count (read-only)
//
// Commit strategy: native <input onBlur={...}>. The Input primitive wraps
// <input> in a <div> and doesn't forward onBlur, so we use bare <input>
// elements with matching token styling to keep Rule 3 scope boundary
// (no primitive fork in this plan).

import * as React from "react"

import { AlertBanner, Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useToast } from "@/components/toast"
import { apiClient } from "@/lib/api-client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { Project } from "@/services/project-service"

interface BoardColumn {
  id: number
  project_id: number
  name: string
  order_index: number
  wip_limit: number
  task_count: number
}

function useProjectColumns(projectId: number) {
  return useQuery({
    queryKey: ["columns", projectId],
    queryFn: async () => {
      const resp = await apiClient.get<BoardColumn[]>(
        `/projects/${projectId}/columns`
      )
      return resp.data
    },
    // Columns rarely churn during a Settings session — 30s stale is plenty.
    staleTime: 30 * 1000,
  })
}

function backendErrorMessage(err: unknown): string | null {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response
    ?.data?.detail
  return typeof detail === "string" ? detail : null
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "0 8px",
  height: 28,
  fontSize: 13,
  background: "var(--surface)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "inset 0 0 0 1px var(--border)",
  color: "var(--fg)",
  border: "none",
  outline: "none",
  fontFamily: "inherit",
}

/**
 * Stable string summary of the columns list — feeding this string (not the
 * array reference) into useEffect's dep array prevents an OOM feedback loop
 * when useQuery emits fresh array references without data changes.
 */
function serializeColumnsShape(cols: BoardColumn[]): string {
  return cols
    .map((c) => `${c.id}:${c.name}:${c.wip_limit}`)
    .join("|")
}

export function SettingsColumnsSubtab({
  project,
  isArchived,
}: {
  project: Project
  isArchived: boolean
}) {
  const { language: lang } = useApp()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const { data: columns = [], isLoading } = useProjectColumns(project.id)
  const isWaterfall = project.methodology === "WATERFALL"

  // Mirror column name + wip_limit in a per-column draft keyed by col.id so the
  // user can type freely without racing against query refetches.
  const [drafts, setDrafts] = React.useState<
    Record<number, { name: string; wip_limit: number }>
  >({})

  // Sync drafts when the server list's DATA shape changes — the stable string
  // dep prevents re-running on fresh-array-reference renders (which is what
  // triggers an OOM loop when the dep is the columns array itself).
  const columnsShape = serializeColumnsShape(columns)
  React.useEffect(() => {
    const d: Record<number, { name: string; wip_limit: number }> = {}
    columns.forEach((c) => {
      d[c.id] = { name: c.name, wip_limit: c.wip_limit }
    })
    setDrafts(d)
    // columns is read inside the effect but dep-tracked via its serialized
    // shape — this is intentional. See columnsShape comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnsShape])

  async function saveColumn(col: BoardColumn) {
    const draft = drafts[col.id]
    if (!draft) return
    if (draft.name === col.name && draft.wip_limit === col.wip_limit) return
    // Don't send an empty name — Pydantic min_length=1 would 422.
    if (!draft.name.trim()) {
      showToast({
        variant: "error",
        message: lang === "tr" ? "Kolon adı boş olamaz" : "Column name cannot be empty",
      })
      return
    }
    try {
      const patch: { name?: string; wip_limit?: number } = {}
      if (draft.name !== col.name) patch.name = draft.name.trim()
      if (draft.wip_limit !== col.wip_limit) patch.wip_limit = draft.wip_limit
      await apiClient.patch(
        `/projects/${project.id}/columns/${col.id}`,
        patch
      )
      qc.invalidateQueries({ queryKey: ["columns", project.id] })
      showToast({
        variant: "success",
        message: lang === "tr" ? "Kolon güncellendi" : "Column updated",
      })
    } catch (err: unknown) {
      showToast({
        variant: "error",
        message:
          backendErrorMessage(err) ??
          (lang === "tr" ? "Güncellenemedi" : "Update failed"),
      })
    }
  }

  if (isLoading) {
    return (
      <div
        style={{
          padding: 16,
          fontSize: 12,
          color: "var(--fg-muted)",
        }}
      >
        {lang === "tr" ? "Yükleniyor..." : "Loading..."}
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 720,
      }}
    >
      {isArchived && (
        <AlertBanner tone="warning">
          {lang === "tr"
            ? "Arşiv modunda düzenleme devre dışı."
            : "Editing disabled in archive mode."}
        </AlertBanner>
      )}
      {isWaterfall && (
        <AlertBanner tone="info">
          {lang === "tr"
            ? "Waterfall metodolojisinde WIP limitleri gizlidir."
            : "WIP limits are hidden for Waterfall methodology."}
        </AlertBanner>
      )}

      <Card padding={0}>
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--fg-subtle)",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            display: "grid",
            gridTemplateColumns: isWaterfall ? "2fr auto" : "2fr 120px auto",
            gap: 12,
          }}
        >
          <div>{lang === "tr" ? "KOLON ADI" : "COLUMN NAME"}</div>
          {!isWaterfall && (
            <div style={{ textAlign: "left" }}>
              {lang === "tr" ? "WIP LİMİTİ" : "WIP LIMIT"}
            </div>
          )}
          <div style={{ textAlign: "right" }}>
            {lang === "tr" ? "GÖREVLER" : "TASKS"}
          </div>
        </div>

        {columns.length === 0 && (
          <div
            style={{
              padding: 20,
              color: "var(--fg-subtle)",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            {lang === "tr" ? "Kolon tanımlanmamış." : "No columns defined."}
          </div>
        )}

        {columns.map((col) => {
          const draft = drafts[col.id] ?? {
            name: col.name,
            wip_limit: col.wip_limit,
          }
          return (
            <div
              key={col.id}
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
                display: "grid",
                gridTemplateColumns: isWaterfall
                  ? "2fr auto"
                  : "2fr 120px auto",
                gap: 12,
                alignItems: "center",
              }}
            >
              <input
                type="text"
                value={draft.name}
                onChange={(e) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [col.id]: { ...draft, name: e.target.value },
                  }))
                }
                onBlur={() => saveColumn(col)}
                disabled={isArchived}
                style={INPUT_STYLE}
              />
              {!isWaterfall && (
                <input
                  type="number"
                  min={0}
                  value={String(draft.wip_limit)}
                  onChange={(e) => {
                    const parsed = Number(e.target.value)
                    const next =
                      Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
                    setDrafts((prev) => ({
                      ...prev,
                      [col.id]: { ...draft, wip_limit: next },
                    }))
                  }}
                  onBlur={() => saveColumn(col)}
                  disabled={isArchived}
                  placeholder="WIP"
                  style={INPUT_STYLE}
                />
              )}
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                  fontFamily: "var(--font-mono)",
                  textAlign: "right",
                }}
              >
                {col.task_count} {lang === "tr" ? "görev" : "tasks"}
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
