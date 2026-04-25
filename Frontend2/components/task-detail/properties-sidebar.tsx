"use client"

// PropertiesSidebar — the 300px right column on the Task Detail page (D-38).
// Every MetaRow uses <InlineEdit> for click-to-edit optimistic PATCH.
//
// Rows (top to bottom, matching UI-SPEC §7 + §9):
//   Durum     (Status)   — dropdown of project.columns
//   Atanan    (Assignee) — number input (user id); real member picker in Plan 09
//   Öncelik   (Priority) — 4-option select
//   Puan      (Points)   — number input
//   Bitiş     (Due)      — date input
//   {Cycle}              — hidden for Kanban (per resolveCycleLabel), disabled
//                          for non-Scrum methodologies in Phase 11 (D-44)
//   Faz       (Phase)    — conditional on enable_phase_assignment, select
//                          backed by process_config.workflow.nodes
//   Etiketler (Labels)   — read-only chips for now; full chip picker in Plan 09
//   [PhaseStepper]       — below labels when enable_phase_assignment + sub-tasks
//
// Comments / History / Attachments / Dependencies live in Plan 11-09.

import * as React from "react"
import { Avatar, Badge, Card, PriorityChip } from "@/components/primitives"
import { useApp } from "@/context/app-context"
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
  // outline intentionally NOT set inline so :focus-visible ring paints (a11y).
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

  const assigneeAvatar = (id: number | null) =>
    id != null
      ? {
          initials: `#${id}`.slice(0, 2).toUpperCase(),
          avColor: ((id % 8) + 1) as number,
        }
      : null

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
        {/* Status */}
        <MetaRow label={lang === "tr" ? "Durum" : "Status"}>
          <InlineEdit
            taskId={task.id}
            field="status"
            value={task.status}
            renderDisplay={(v) => (
              <Badge size="xs" dot tone="neutral">
                {v || "—"}
              </Badge>
            )}
            renderEditor={(draft, setDraft, commit) => (
              <select
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                style={editorStyle}
              >
                {(project.columns ?? []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          />
        </MetaRow>

        {/* Assignee */}
        <MetaRow label={lang === "tr" ? "Atanan" : "Assignee"}>
          <InlineEdit
            taskId={task.id}
            field="assignee_id"
            value={task.assigneeId}
            renderDisplay={(v) => {
              const av = assigneeAvatar(v)
              return av ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Avatar user={av} size={20} />
                  <span>
                    {lang === "tr" ? "Kullanıcı" : "User"} #{v}
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

        {/* Cycle — hidden for Kanban (cycleLabel null), disabled with helper for non-Scrum (D-44) */}
        {cycleLabel && (
          <MetaRow label={cycleLabel}>
            <InlineEdit
              taskId={task.id}
              field="cycle_id"
              value={task.cycleId}
              disabled={!cycleEnabled && project.methodology !== "WATERFALL"}
              renderDisplay={(v) => {
                if (v != null) return `#${v}`
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

        {/* Labels (read-only list in this plan; chip picker arrives in 11-09) */}
        <MetaRow label={lang === "tr" ? "Etiketler" : "Labels"}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {(task.labels ?? []).length === 0 ? (
              <span style={{ color: "var(--fg-subtle)" }}>—</span>
            ) : (
              (task.labels ?? []).map((id) => (
                <Badge key={id} size="xs" tone="neutral">
                  #{id}
                </Badge>
              ))
            )}
          </div>
        </MetaRow>

        {/* TASK-04 phase stepper */}
        <div style={{ padding: "6px 16px" }}>
          <PhaseStepper project={project} subtasks={subtasks} />
        </div>
      </div>
    </Card>
  )
}
