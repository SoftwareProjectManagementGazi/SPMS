"use client"

// PropertiesSidebar — the 300px right column on the Task Detail page (D-38).
// Every MetaRow uses <InlineEdit> for click-to-edit optimistic PATCH.
//
// Rows (top to bottom, matching UI-SPEC §7 + §9 + prototype task-detail.jsx
// 113-135):
//   Durum     (Status)   — dropdown of project.columns; Badge tone tracks the
//                          5-status palette (done=success, progress=info,
//                          review=warning, blocked=danger, todo=neutral).
//   Atanan    (Assignee) — number input (user id); real member picker in Plan 09
//   Bildiren  (Reporter) — read-only avatar + name (PATCH not implemented in
//                          backend for reporter_id; surfaces who created the
//                          task per prototype task-detail.jsx:118).
//   Öncelik   (Priority) — 4-option select
//   Puan      (Points)   — number input
//   Bitiş     (Due)      — date input
//   {Cycle}              — hidden for Kanban (per resolveCycleLabel), disabled
//                          for non-Scrum methodologies in Phase 11 (D-44).
//                          When set, displays as a tone="info" Badge to match
//                          the prototype's "Sprint 7" pill.
//   Faz       (Phase)    — conditional on enable_phase_assignment, select
//                          backed by process_config.workflow.nodes
//   Etiketler (Labels)   — chips with the human label name (joined via
//                          useProjectLabels). Falls back to "#${id}" only when
//                          the master record hasn't loaded yet.
//   [PhaseStepper]       — below labels when enable_phase_assignment + sub-tasks
//                          (its outer wrapper renders only when the stepper
//                          would actually surface content).

import * as React from "react"
import { Avatar, Badge, Card, PriorityChip } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useProjectLabels } from "@/hooks/use-labels"
import {
  isCycleFieldEnabled,
  resolveCycleLabel,
} from "@/lib/methodology-matrix"
import type { Project } from "@/services/project-service"
import type { Task } from "@/services/task-service"

import { InlineEdit } from "./inline-edit"
import { PhaseStepper } from "./phase-stepper"

// Shared editor input style — single inset ring, terse padding.
const editorStyle: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: 12,
  width: "100%",
  background: "var(--surface-2)",
  borderRadius: "var(--radius-sm)",
  boxShadow: "inset 0 0 0 1px var(--border)",
  color: "var(--fg)",
  border: "none",
  // outline intentionally NOT set inline so :focus-visible ring (globals.css)
  // paints for keyboard users (a11y).
  font: "inherit",
}

interface MetaRowProps {
  label: string
  children: React.ReactNode
}
function MetaRow({ label, children }: MetaRowProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "100px 1fr",
        padding: "6px 16px",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
      }}
    >
      <div style={{ color: "var(--fg-subtle)", fontWeight: 500 }}>{label}</div>
      <div>{children}</div>
    </div>
  )
}

interface PhaseNode {
  id: string
  name: string
}
function readPhaseConfig(
  project: Project,
): { enabled: boolean; nodes: PhaseNode[] } {
  const cfg = (project.processConfig ?? {}) as {
    enable_phase_assignment?: boolean
    workflow?: { nodes?: Array<{ id?: unknown; name?: unknown }> }
  }
  const enabled = cfg.enable_phase_assignment === true
  const raw = cfg.workflow?.nodes ?? []
  const nodes: PhaseNode[] = raw
    .filter(
      (n): n is { id: string; name: string } =>
        typeof n?.id === "string" && typeof n?.name === "string",
    )
    .map((n) => ({ id: n.id, name: n.name }))
  return { enabled, nodes }
}

// Map canonical status → Badge tone. Coerce loose backend strings (uppercase
// "DONE", legacy "in_progress") via the same rules as resolveStatus / coerce
// elsewhere. Defaults to neutral so an unknown column doesn't crash the row.
type Tone = "neutral" | "info" | "success" | "warning" | "danger"
function statusTone(raw: string): Tone {
  const s = String(raw ?? "").toLowerCase()
  if (s === "done" || s === "completed" || s === "closed") return "success"
  if (s === "progress" || s === "in_progress" || s === "doing") return "info"
  if (s === "review" || s === "in_review") return "warning"
  if (s === "blocked") return "danger"
  return "neutral"
}

interface PropertiesSidebarProps {
  task: Task
  project: Project
  subtasks: Task[]
}

export function PropertiesSidebar({
  task,
  project,
  subtasks,
}: PropertiesSidebarProps) {
  const { language: lang } = useApp()
  const cycleLabel = resolveCycleLabel(project, lang)
  const cycleEnabled = isCycleFieldEnabled(project.methodology)
  const { enabled: phaseEnabled, nodes: phaseNodes } = readPhaseConfig(project)
  const { data: projectLabels = [] } = useProjectLabels(project.id)
  const labelById = React.useMemo(() => {
    const m = new Map<number, string>()
    for (const l of projectLabels) m.set(l.id, l.name)
    return m
  }, [projectLabels])

  // Avatar initials. Prefer a real name string if the caller has one, else
  // fall back to the legacy "#1"-style hash so something always renders.
  const userAvatar = (id: number | null, name?: string | null) =>
    id != null
      ? {
          initials: ((name && name.trim()) || `#${id}`).slice(0, 2).toUpperCase(),
          avColor: ((id % 8) + 1) as number,
        }
      : null

  // PhaseStepper renders null when conditions aren't met. Detecting this
  // mirror-side keeps the wrapper div from leaving an empty 6/16 padding
  // strip in the sidebar. Triage 5.12.
  const phaseStepperVisible =
    phaseEnabled && subtasks.length > 0 && phaseNodes.length > 0

  return (
    <Card padding={0}>
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--fg-subtle)",
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {lang === "tr" ? "Özellikler" : "Properties"}
      </div>
      <div style={{ padding: "8px 0" }}>
        {/* Status — Badge tone tracks the 5-status palette per prototype
            (task-detail.jsx:116). The InlineEdit binds to `column_id` (the
            actual TaskUpdateDTO field) but uses `task.status` for the read-
            mode label since the backend computes the status string from the
            column's name. Picking a column from the editor sends the
            numeric id, which the backend can persist; sending the raw status
            string would silently drop because TaskUpdateDTO has no such
            field. Triage round 11 — properties save fix. */}
        <MetaRow label={lang === "tr" ? "Durum" : "Status"}>
          {project.boardColumns.length > 0 ? (
            <InlineEdit
              taskId={task.id}
              field="column_id"
              value={
                // Resolve the current column_id from the task's status name.
                // Falls back to null when no column matches (custom backend
                // value or an empty board).
                project.boardColumns.find(
                  (c) => c.name.toLowerCase() === task.status.toLowerCase(),
                )?.id ?? null
              }
              renderDisplay={() => (
                <Badge size="xs" dot tone={statusTone(task.status)}>
                  {task.status || "—"}
                </Badge>
              )}
              renderEditor={(draft, setDraft, commit) => (
                <select
                  autoFocus
                  value={draft ?? ""}
                  onChange={(e) =>
                    setDraft(e.target.value ? Number(e.target.value) : null)
                  }
                  onBlur={commit}
                  style={editorStyle}
                >
                  {project.boardColumns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            />
          ) : (
            <Badge size="xs" dot tone={statusTone(task.status)}>
              {task.status || "—"}
            </Badge>
          )}
        </MetaRow>

        {/* Assignee */}
        <MetaRow label={lang === "tr" ? "Atanan" : "Assignee"}>
          <InlineEdit
            taskId={task.id}
            field="assignee_id"
            value={task.assigneeId}
            renderDisplay={(v) => {
              const av = userAvatar(v, task.assigneeName)
              return av ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Avatar user={av} size={20} />
                  <span style={{ fontSize: 12.5 }}>
                    {(task.assigneeName?.trim() ||
                      `${lang === "tr" ? "Kullanıcı" : "User"} #${v}`)}
                  </span>
                </div>
              ) : (
                <span style={{ color: "var(--fg-subtle)" }}>
                  {lang === "tr" ? "Atanmamış" : "Unassigned"}
                </span>
              )
            }}
            renderEditor={(draft, setDraft, commit) => (
              <input
                autoFocus
                type="number"
                value={draft ?? ""}
                onChange={(e) =>
                  setDraft(e.target.value ? Number(e.target.value) : null)
                }
                onBlur={commit}
                style={editorStyle}
                placeholder="user id"
              />
            )}
          />
        </MetaRow>

        {/* Reporter — read-only avatar+id row matching prototype
            task-detail.jsx:118. PATCH for reporter_id is not implemented at
            the API layer (and rarely needed — reporter is set on create), so
            this stays display-only. */}
        <MetaRow label={lang === "tr" ? "Bildiren" : "Reporter"}>
          {task.reporterId != null ? (
            (() => {
              const av = userAvatar(task.reporterId)
              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {av && <Avatar user={av} size={20} />}
                  <span style={{ fontSize: 12.5 }}>
                    {lang === "tr" ? "Kullanıcı" : "User"} #{task.reporterId}
                  </span>
                </div>
              )
            })()
          ) : (
            <span style={{ color: "var(--fg-subtle)" }}>
              {lang === "tr" ? "—" : "—"}
            </span>
          )}
        </MetaRow>

        {/* Priority */}
        <MetaRow label={lang === "tr" ? "Öncelik" : "Priority"}>
          <InlineEdit
            taskId={task.id}
            field="priority"
            value={task.priority}
            renderDisplay={(v) => <PriorityChip level={v} lang={lang} />}
            renderEditor={(draft, setDraft, commit) => (
              <select
                autoFocus
                value={draft}
                onChange={(e) =>
                  setDraft(e.target.value as typeof draft)
                }
                onBlur={commit}
                style={editorStyle}
              >
                <option value="low">{lang === "tr" ? "Düşük" : "Low"}</option>
                <option value="medium">
                  {lang === "tr" ? "Orta" : "Medium"}
                </option>
                <option value="high">
                  {lang === "tr" ? "Yüksek" : "High"}
                </option>
                <option value="critical">
                  {lang === "tr" ? "Kritik" : "Critical"}
                </option>
              </select>
            )}
          />
        </MetaRow>

        {/* Points */}
        <MetaRow label={lang === "tr" ? "Puan" : "Points"}>
          <InlineEdit
            taskId={task.id}
            field="points"
            value={task.points}
            renderDisplay={(v) => (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {v ?? "—"}
              </span>
            )}
            renderEditor={(draft, setDraft, commit) => (
              <input
                autoFocus
                type="number"
                value={draft ?? ""}
                onChange={(e) =>
                  setDraft(e.target.value ? Number(e.target.value) : null)
                }
                onBlur={commit}
                style={{
                  ...editorStyle,
                  width: 60,
                  fontFamily: "var(--font-mono)",
                }}
              />
            )}
          />
        </MetaRow>

        {/* Due */}
        <MetaRow label={lang === "tr" ? "Bitiş" : "Due"}>
          <InlineEdit
            taskId={task.id}
            field="due"
            value={task.due}
            renderDisplay={(v) =>
              v
                ? new Date(v).toLocaleDateString(
                    lang === "tr" ? "tr-TR" : "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )
                : "—"
            }
            renderEditor={(draft, setDraft, commit) => (
              <input
                autoFocus
                type="date"
                value={draft ?? ""}
                onChange={(e) => setDraft(e.target.value || null)}
                onBlur={commit}
                style={editorStyle}
              />
            )}
          />
        </MetaRow>

        {/* Cycle — hidden for Kanban (cycleLabel null), disabled with helper for non-Scrum (D-44).
            Display surfaces the cycle as a tone="info" Badge to mirror the
            prototype's "Sprint 7" pill (task-detail.jsx:122). */}
        {cycleLabel && (
          <MetaRow label={cycleLabel}>
            <InlineEdit
              taskId={task.id}
              field="cycle_id"
              value={task.cycleId}
              disabled={!cycleEnabled && project.methodology !== "WATERFALL"}
              renderDisplay={(v) => {
                if (v != null) {
                  return (
                    <Badge size="xs" tone="info">
                      {cycleLabel} #{v}
                    </Badge>
                  )
                }
                if (!cycleEnabled && project.methodology !== "WATERFALL") {
                  return (
                    <span style={{ color: "var(--fg-subtle)" }}>
                      {lang === "tr"
                        ? "Faz 12'de aktive edilecek"
                        : "Activated in Phase 12"}
                    </span>
                  )
                }
                return <span style={{ color: "var(--fg-subtle)" }}>—</span>
              }}
              renderEditor={(draft, setDraft, commit) => (
                <input
                  autoFocus
                  type="number"
                  value={draft ?? ""}
                  onChange={(e) =>
                    setDraft(e.target.value ? Number(e.target.value) : null)
                  }
                  onBlur={commit}
                  style={editorStyle}
                />
              )}
            />
          </MetaRow>
        )}

        {/* Phase (conditional on enable_phase_assignment) */}
        {phaseEnabled && (
          <MetaRow label={lang === "tr" ? "Faz" : "Phase"}>
            <InlineEdit
              taskId={task.id}
              field="phase_id"
              value={task.phaseId}
              renderDisplay={(v) => {
                if (!v)
                  return <span style={{ color: "var(--fg-subtle)" }}>—</span>
                const name = phaseNodes.find((n) => n.id === v)?.name ?? v
                return (
                  <Badge size="xs" tone="neutral">
                    {name}
                  </Badge>
                )
              }}
              renderEditor={(draft, setDraft, commit) => (
                <select
                  autoFocus
                  value={draft ?? ""}
                  onChange={(e) => setDraft(e.target.value || null)}
                  onBlur={commit}
                  style={editorStyle}
                >
                  <option value="">—</option>
                  {phaseNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              )}
            />
          </MetaRow>
        )}

        {/* Labels — chip per label.name (resolved via useProjectLabels). When
            the master record hasn't streamed in yet we still surface the id
            as a "#3" badge so the user sees something is there. */}
        <MetaRow label={lang === "tr" ? "Etiketler" : "Labels"}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {(task.labels ?? []).length === 0 ? (
              <span style={{ color: "var(--fg-subtle)" }}>—</span>
            ) : (
              (task.labels ?? []).map((id) => (
                <Badge key={id} size="xs" tone="neutral">
                  {labelById.get(id) ?? `#${id}`}
                </Badge>
              ))
            )}
          </div>
        </MetaRow>

        {/* TASK-04 phase stepper — only render the wrapper when the stepper
            itself would surface content (triage 5.12). Avoids an empty
            6/16 padding strip dangling under Labels for plain Kanban tasks. */}
        {phaseStepperVisible && (
          <div style={{ padding: "6px 16px" }}>
            <PhaseStepper project={project} subtasks={subtasks} />
          </div>
        )}
      </div>
    </Card>
  )
}
