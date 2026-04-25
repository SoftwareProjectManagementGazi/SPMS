"use client"

// HistoryCard (Phase 12 Plan 12-04) — single past-phase card hosting the
// 4-MiniMetric strip, optional note quotation, and the lazy-fetch
// "Görev Detayları" Collapsible.
//
// Anatomy: 12-UI-SPEC.md §3 HistoryCard (lines 820-859).
// Visual reference: New_Frontend/src/pages/lifecycle-tab.jsx lines 280-329.
// Decisions consumed: D-55 (MTTaskRow compact reuse), D-56 (lazy-fetch on
// expand), Plan 12-06 will land the EvaluationReport "Rapor" Button.
//
// LIFE-04 contract:
//   - The Collapsible state controls a TanStack Query `enabled: open` flag
//     in `useTasks(projectId, { phase_id, status: 'done' }, { enabled: open })`.
//   - First expand → query runs once → tasks render via TaskRow compact.
//   - Subsequent expand of the same Collapsible → TanStack cache hit, no
//     second network call (assertion verified in history-subtab.test.tsx).
//   - The Collapsible label is "Görev Detayları (N)" where N is
//     `closedTasks.length` once loaded; before first open, N falls back to
//     `summary.done`.

import * as React from "react"

import { Badge, Card } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useTasks } from "@/hooks/use-tasks"
import { TaskRow } from "@/components/my-tasks/task-row"
import type { Task } from "@/services/task-service"
import type { WorkflowNode } from "@/services/lifecycle-service"
import { MiniMetric } from "./mini-metric"

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface PhaseSummary {
  closedAt: string
  durationDays: number
  total: number
  done: number
  moved: number
  successPct: number
  note?: string
}

export interface HistoryCardProject {
  id: number
  key?: string
}

export interface HistoryCardProps {
  project: HistoryCardProject
  phase: WorkflowNode
  summary: PhaseSummary
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function HistoryCard({ project, phase, summary }: HistoryCardProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const [open, setOpen] = React.useState(false)

  // Lazy-fetch via TanStack Query: query only runs once `open === true`.
  // Cache key includes phase_id so each closed-phase Collapsible has its own
  // memoized result. The filters object is memoized so re-renders during the
  // expand/collapse cycle keep the same cache key (TanStack hashes on value,
  // but explicit memo guarantees referential stability for any future
  // queryKeyHashFn override).
  const filters = React.useMemo(
    () => ({ phase_id: phase.id, status: "done" }),
    [phase.id],
  )
  const { data: closedTasks = [], isLoading } = useTasks(
    open ? project.id : null,
    filters,
  )

  // The N in "Görev Detayları (N)" — once loaded, prefers actual fetched
  // count; before first open, uses summary.done as the optimistic estimate.
  const taskCount = open ? closedTasks.length : summary.done

  const closedAtLabel = formatDate(summary.closedAt, language)

  return (
    <Card padding={14}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{phase.name}</span>
            <Badge size="xs" tone="neutral">
              {summary.durationDays} {T("gün", "days")}
            </Badge>
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-muted)",
              marginTop: 2,
            }}
          >
            {closedAtLabel}
          </div>
        </div>
        {/* Plan 12-06 will add a "Rapor" Button + EvaluationReportCard here. */}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginTop: 12,
        }}
      >
        <MiniMetric
          label={T("Toplam", "Total")}
          value={summary.total === 0 ? "---" : summary.total}
        />
        <MiniMetric
          label={T("Tamamlanan", "Done")}
          value={summary.total === 0 ? "---" : summary.done}
          color="var(--status-done)"
        />
        <MiniMetric
          label={T("Taşınan", "Carried")}
          value={summary.total === 0 ? "---" : summary.moved}
          color="var(--status-review)"
        />
        <MiniMetric
          label={T("Başarı", "Success")}
          value={summary.total === 0 ? "---" : `%${summary.successPct}`}
          mono
        />
      </div>

      {summary.note && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "var(--fg-muted)",
            fontStyle: "italic",
            padding: "8px 10px",
            background: "var(--surface-2)",
            borderRadius: 6,
          }}
        >
          &quot;{summary.note}&quot;
        </div>
      )}

      {/* Lazy-fetch Collapsible (LIFE-04). Local impl rather than the
          primitive so the chevron + label can co-host the dynamic count. */}
      <div
        style={{
          marginTop: 12,
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{
            width: "100%",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <ChevronRight open={open} />
          <span style={{ flex: 1 }}>
            {T("Görev Detayları", "Task Details")} ({taskCount})
          </span>
        </button>
        {open && (
          <div
            style={{
              padding: "0 0 10px 0",
              borderTop: "1px solid var(--border)",
            }}
          >
            {isLoading ? (
              <SkeletonRows />
            ) : closedTasks.length === 0 ? (
              <div
                style={{
                  padding: "16px 14px",
                  textAlign: "center",
                  color: "var(--fg-subtle)",
                  fontSize: 12,
                }}
              >
                {T(
                  "Bu faz için kayıtlı görev bulunamadı.",
                  "No tasks recorded for this phase.",
                )}
              </div>
            ) : (
              closedTasks.map((t: Task) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  compact
                  starred={false}
                  onToggleStar={() => undefined}
                />
              ))
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function ChevronRight({ open }: { open: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 13,
        transform: open ? "rotate(90deg)" : "none",
        transition: "transform 0.15s",
        color: "var(--fg-subtle)",
        fontSize: 12,
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      ▶
    </span>
  )
}

function SkeletonRows() {
  return (
    <div style={{ padding: "8px 14px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            height: 24,
            background: "var(--surface-2)",
            borderRadius: 4,
            marginBottom: 6,
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  )
}

function formatDate(iso: string, language: string): string {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return iso
  }
}
