"use client"

// OverviewSubTab (Phase 12 Plan 12-04) — first sub-tab of the LifecycleTab.
// Ports the prototype `OverviewSubTab` ~200 lines verbatim into TypeScript +
// Frontend2 primitives + i18n.
//
// Anatomy: 12-UI-SPEC.md §2 + §3 (lines 280-345 copy table; lines 798-818
// MiniMetric reference).
// Visual reference: New_Frontend/src/pages/lifecycle-tab.jsx lines 130-204.
// Decisions consumed: D-43 (zero-task `---`), D-48 (Overview port + 200-line
// budget), D-59 (Kanban variant — 3 MiniMetrics).
//
// Wiring:
//   - phaseStats derived from tasks.filter(t => t.phaseId === activePhase.id)
//   - When phaseStats.total === 0, all 4 metric values become the literal
//     string '---' (LIFE-03). MiniMetric handles the mono/grey rendering.
//   - Kanban variant: 3 MiniMetrics (Lead / Cycle / WIP). Lead/Cycle are
//     placeholder em-dashes for now; computed from tasks lifecycle later.
//   - 2-column Card layout below: Faz Özeti + Yaklaşan Teslimler.
//   - Yaklaşan Teslimler reads tasks with `due` set; can also be augmented
//     with milestones via the optional `milestones` prop.

import * as React from "react"
import { AlertCircle } from "lucide-react"

import {
  Avatar,
  Badge,
  Card,
  ProgressBar,
  StatusDot,
} from "@/components/primitives"
import { useApp } from "@/context/app-context"
import type { Task } from "@/services/task-service"
import type {
  WorkflowConfig,
  WorkflowNode,
} from "@/services/lifecycle-service"
import { MiniMetric } from "./mini-metric"

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface OverviewSubTabProject {
  id: number
  methodology?: string
}

export interface OverviewMilestone {
  id: number
  name: string
  /** ISO date string (YYYY-MM-DD or full ISO). */
  targetDate: string
  status?: string
}

export interface OverviewSubTabProps {
  project: OverviewSubTabProject
  workflow: WorkflowConfig
  /** First node with state==='active' from BFS computeNodeStates. */
  activePhase: WorkflowNode | null
  tasks: Task[]
  /** Optional — milestones surfaced under Yaklaşan Teslimler.
   *  Plan 12-05 wires the real milestone fetch; this prop accepts an empty
   *  array for now. */
  milestones?: OverviewMilestone[]
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

interface PhaseStats {
  total: number
  done: number
  inProgress: number
  progress: number
}

function computePhaseStats(tasks: Task[], phaseId: string | null): PhaseStats {
  if (!phaseId) {
    return { total: 0, done: 0, inProgress: 0, progress: 0 }
  }
  const inPhase = tasks.filter((t) => t.phaseId === phaseId)
  const total = inPhase.length
  const done = inPhase.filter((t) => normalizeStatus(t.status) === "done").length
  const inProgress = inPhase.filter(
    (t) => normalizeStatus(t.status) === "progress",
  ).length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0
  return { total, done, inProgress, progress }
}

function normalizeStatus(s: string): string {
  const v = (s ?? "").toLowerCase()
  if (v === "done" || v === "completed" || v === "closed") return "done"
  if (v === "in_progress" || v === "progress" || v === "doing") return "progress"
  if (v === "review" || v === "in_review") return "review"
  if (v === "blocked") return "blocked"
  return "todo"
}

interface PhaseSummaryRow {
  id: string
  name: string
  state: "active" | "past" | "future"
  total: number
  done: number
  progress: number
}

function buildPhaseSummary(
  workflow: WorkflowConfig,
  activePhaseId: string | null,
  tasks: Task[],
): PhaseSummaryRow[] {
  const idx = workflow.nodes.findIndex((n) => n.id === activePhaseId)
  return workflow.nodes
    .filter((n) => !n.isArchived)
    .map((n, i) => {
      const inPhase = tasks.filter((t) => t.phaseId === n.id)
      const total = inPhase.length
      const done = inPhase.filter((t) => normalizeStatus(t.status) === "done").length
      const progress = total > 0 ? Math.round((done / total) * 100) : 0
      const state: "active" | "past" | "future" =
        n.id === activePhaseId
          ? "active"
          : idx >= 0 && i < idx
            ? "past"
            : "future"
      return { id: n.id, name: n.name, state, total, done, progress }
    })
}

interface UpcomingTaskEntry {
  kind: "task"
  id: number
  key: string
  title: string
  due: string
  daysLeft: number
  overdue: boolean
  assigneeId: number | null
}

interface UpcomingMilestoneEntry {
  kind: "milestone"
  id: number
  name: string
  due: string
  daysLeft: number
  overdue: boolean
}

type UpcomingEntry = UpcomingTaskEntry | UpcomingMilestoneEntry

function buildUpcoming(
  tasks: Task[],
  milestones: OverviewMilestone[] | undefined,
): UpcomingEntry[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const taskEntries: UpcomingTaskEntry[] = tasks
    .filter((t) => normalizeStatus(t.status) !== "done" && t.due)
    .map((t) => {
      const due = String(t.due)
      const dueDate = new Date(due)
      const daysLeft = Math.ceil(
        (dueDate.getTime() - today.getTime()) / 86400000,
      )
      return {
        kind: "task" as const,
        id: t.id,
        key: t.key,
        title: t.title,
        due,
        daysLeft,
        overdue: daysLeft < 0,
        assigneeId: t.assigneeId,
      }
    })

  const milestoneEntries: UpcomingMilestoneEntry[] = (milestones ?? [])
    .filter((m) => m.status !== "completed" && m.targetDate)
    .map((m) => {
      const dueDate = new Date(m.targetDate)
      const daysLeft = Math.ceil(
        (dueDate.getTime() - today.getTime()) / 86400000,
      )
      return {
        kind: "milestone" as const,
        id: m.id,
        name: m.name,
        due: m.targetDate,
        daysLeft,
        overdue: daysLeft < 0,
      }
    })

  return [...taskEntries, ...milestoneEntries]
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5)
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function OverviewSubTab({
  project,
  workflow,
  activePhase,
  tasks,
  milestones,
}: OverviewSubTabProps) {
  const { language } = useApp()
  const T = React.useCallback(
    (tr: string, en: string) => (language === "tr" ? tr : en),
    [language],
  )

  const isKanban =
    project.methodology === "KANBAN" || workflow.mode === "continuous"

  const phaseStats = React.useMemo(
    () => computePhaseStats(tasks, activePhase?.id ?? null),
    [tasks, activePhase],
  )
  const isZeroTaskPhase = phaseStats.total === 0

  const phaseSummary = React.useMemo(
    () => buildPhaseSummary(workflow, activePhase?.id ?? null, tasks),
    [workflow, activePhase, tasks],
  )

  const upcoming = React.useMemo(
    () => buildUpcoming(tasks, milestones),
    [tasks, milestones],
  )

  // ----- Kanban variant: 3 MiniMetric (Lead / Cycle / WIP) -----
  // Lead/Cycle are derived placeholders (em-dash) until we wire real metrics.
  // WIP = number of tasks with status === 'progress'.
  const wipCount = React.useMemo(
    () => tasks.filter((t) => normalizeStatus(t.status) === "progress").length,
    [tasks],
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Selected/active phase detail card */}
      {activePhase && (
        <Card padding={14}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {activePhase.name}
            </span>
            <Badge size="xs" tone="primary" dot>
              {T("Aktif", "Active")}
            </Badge>
            {isZeroTaskPhase && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                }}
              >
                <AlertCircle size={11} />
                {T(
                  "Bu fazda henüz görev yok",
                  "No tasks in this phase yet",
                )}
              </span>
            )}
          </div>

          {isKanban ? (
            // Kanban: 3-metric variant per CONTEXT D-59 + UI-SPEC line 339-344
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              <MiniMetric
                label={T("Ortalama Lead Time", "Avg Lead Time")}
                value="—"
              />
              <MiniMetric
                label={T("Ortalama Cycle Time", "Avg Cycle Time")}
                value="—"
              />
              <MiniMetric label={T("WIP", "WIP")} value={wipCount} mono />
            </div>
          ) : (
            // Default: 4-metric variant
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <MiniMetric
                  label={T("Toplam", "Total")}
                  value={isZeroTaskPhase ? "---" : phaseStats.total}
                />
                <MiniMetric
                  label={T("Tamamlanan", "Done")}
                  value={isZeroTaskPhase ? "---" : phaseStats.done}
                  color="var(--status-done)"
                />
                <MiniMetric
                  label={T("Devam Eden", "Active")}
                  value={
                    isZeroTaskPhase
                      ? "---"
                      : phaseStats.total - phaseStats.done
                  }
                  color="var(--status-progress)"
                />
                <MiniMetric
                  label={T("İlerleme", "Progress")}
                  value={isZeroTaskPhase ? "---" : `%${phaseStats.progress}`}
                  mono
                />
              </div>
              <ProgressBar
                value={isZeroTaskPhase ? 0 : phaseStats.progress}
                style={{ height: 4 }}
              />
            </>
          )}
        </Card>
      )}

      {/* Two-column layout: Faz Özeti + Yaklaşan Teslimler */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {/* Phase summary */}
        <Card padding={0}>
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--border)",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {T("Faz Özeti", "Phase Summary")}
          </div>
          {phaseSummary.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: "var(--fg-subtle)",
                fontSize: 12,
              }}
            >
              {T("Faz tanımı yok.", "No phases defined.")}
            </div>
          ) : (
            phaseSummary.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "12px 1fr 80px 40px",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 14px",
                  borderBottom:
                    i < phaseSummary.length - 1
                      ? "1px solid var(--border)"
                      : "0",
                  background:
                    p.state === "active" ? "var(--accent)" : "transparent",
                }}
              >
                <StatusDot
                  status={
                    p.state === "past"
                      ? "done"
                      : p.state === "active"
                        ? "progress"
                        : "todo"
                  }
                />
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: p.state === "active" ? 600 : 500,
                  }}
                >
                  {p.name}
                </span>
                <ProgressBar
                  value={p.progress}
                  style={{
                    height: 3,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--fg-muted)",
                    textAlign: "right",
                  }}
                >
                  %{p.progress}
                </span>
              </div>
            ))
          )}
        </Card>

        {/* Upcoming deliveries */}
        <Card padding={0}>
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--border)",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {T("Yaklaşan Teslimler", "Upcoming Deliveries")}
          </div>
          {upcoming.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: "var(--fg-subtle)",
                fontSize: 12,
              }}
            >
              {T("Yaklaşan teslim yok", "No upcoming deliveries")}
            </div>
          ) : (
            upcoming.map((u, i) =>
              u.kind === "task" ? (
                <UpcomingRowTask
                  key={`task-${u.id}`}
                  entry={u}
                  isLast={i === upcoming.length - 1}
                  T={T}
                />
              ) : (
                <UpcomingRowMilestone
                  key={`ms-${u.id}`}
                  entry={u}
                  isLast={i === upcoming.length - 1}
                  T={T}
                />
              ),
            )
          )}
        </Card>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Sub-rows
// ----------------------------------------------------------------------------

interface UpcomingRowProps<E> {
  entry: E
  isLast: boolean
  T: (tr: string, en: string) => string
}

function UpcomingRowTask({
  entry,
  isLast,
  T,
}: UpcomingRowProps<UpcomingTaskEntry>) {
  const assigneeAvatar =
    entry.assigneeId != null
      ? {
          initials: `#${entry.assigneeId}`.slice(0, 2).toUpperCase(),
          avColor: ((entry.assigneeId % 8) + 1) as number,
        }
      : null
  const daySuffix = T("g", "d")
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "60px 1fr 22px 50px",
        gap: 8,
        alignItems: "center",
        padding: "10px 14px",
        borderBottom: isLast ? "0" : "1px solid var(--border)",
        fontSize: 12.5,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--fg-muted)",
        }}
      >
        {entry.key}
      </span>
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.title}
      </span>
      {assigneeAvatar ? (
        <Avatar user={assigneeAvatar} size={20} />
      ) : (
        <span style={{ width: 20 }} />
      )}
      <span
        style={{
          textAlign: "right",
          fontSize: 11,
          color: entry.overdue ? "var(--priority-critical)" : "var(--fg-muted)",
          display: "flex",
          alignItems: "center",
          gap: 3,
          justifyContent: "flex-end",
        }}
      >
        {entry.overdue && <AlertCircle size={10} />}
        {entry.overdue
          ? `${-entry.daysLeft}${daySuffix}`
          : `${entry.daysLeft}${daySuffix}`}
      </span>
    </div>
  )
}

function UpcomingRowMilestone({
  entry,
  isLast,
  T,
}: UpcomingRowProps<UpcomingMilestoneEntry>) {
  const daySuffix = T("g", "d")
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "60px 1fr 22px 50px",
        gap: 8,
        alignItems: "center",
        padding: "10px 14px",
        borderBottom: isLast ? "0" : "1px solid var(--border)",
        fontSize: 12.5,
      }}
    >
      <Badge size="xs" tone="primary">
        {T("KT", "MS")}
      </Badge>
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: 500,
        }}
      >
        {entry.name}
      </span>
      <span style={{ width: 20 }} />
      <span
        style={{
          textAlign: "right",
          fontSize: 11,
          color: entry.overdue ? "var(--priority-critical)" : "var(--fg-muted)",
          display: "flex",
          alignItems: "center",
          gap: 3,
          justifyContent: "flex-end",
        }}
      >
        {entry.overdue && <AlertCircle size={10} />}
        {entry.overdue
          ? `${-entry.daysLeft}${daySuffix}`
          : `${entry.daysLeft}${daySuffix}`}
      </span>
    </div>
  )
}
