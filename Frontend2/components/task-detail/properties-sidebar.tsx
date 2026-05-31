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
//                          backed by process_config.phase_workflow.nodes
//                          (Workflow Engine V2 — C1 rename; legacy
//                          `workflow` key is read-tolerated.)
//   Etiketler (Labels)   — chips with the human label name (joined via
//                          useProjectLabels). Falls back to "#${id}" only when
//                          the master record hasn't loaded yet.
//   [PhaseStepper]       — below labels when enable_phase_assignment + sub-tasks
//                          (its outer wrapper renders only when the stepper
//                          would actually surface content).

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Avatar, Badge, Card, PriorityChip } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { useProjectLabels } from "@/hooks/use-labels"
import { useSprints } from "@/hooks/use-sprints"
import {
  isCycleFieldEnabled,
  resolveCycleLabel,
} from "@/lib/methodology-matrix"
import type { Project } from "@/services/project-service"
import { taskService, type Task } from "@/services/task-service"
import { useToast } from "@/components/toast"

import { AssigneePicker } from "./assignee-picker"
import { InlineEdit } from "./inline-edit"
import { PhaseStepper } from "./phase-stepper"
import { PriorityPicker } from "./priority-picker"
import { SprintPicker } from "./sprint-picker"
import { StatusPicker } from "./status-picker"
import type { PriorityLevel } from "@/components/primitives"
import type { Sprint } from "@/hooks/use-sprints"

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
    phase_workflow?: { nodes?: Array<{ id?: unknown; name?: unknown }> }
    workflow?: { nodes?: Array<{ id?: unknown; name?: unknown }> }
  }
  const enabled = cfg.enable_phase_assignment === true
  // V2 canonical: phase_workflow; legacy workflow tolerated as fallback.
  const raw = cfg.phase_workflow?.nodes ?? cfg.workflow?.nodes ?? []
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

// Resolve the workflow-editor color token for a status name by reading the
// project's persisted task_workflow JSON. Falls back to the legacy
// tone-based palette when no matching node exists (custom column name, or
// projects that pre-date the color picker).
function resolveStatusColorToken(
  project: Project,
  statusName: string,
): string | null {
  const cfg = (project.processConfig ?? {}) as {
    task_workflow?: { nodes?: Array<{ name?: unknown; color?: unknown }> }
    status_workflow?: { nodes?: Array<{ name?: unknown; color?: unknown }> }
  }
  const nodes =
    cfg.task_workflow?.nodes ?? cfg.status_workflow?.nodes ?? []
  const target = String(statusName ?? "").toLowerCase().trim()
  if (!target) return null
  for (const n of nodes) {
    if (typeof n?.name === "string" && typeof n?.color === "string") {
      if (n.name.toLowerCase().trim() === target) return n.color
    }
  }
  return null
}

// Map the 5-status tone palette to the underlying CSS variable so the
// custom badge below can drive its color from a single source whether
// the project carries a workflow color token or not. Mirrors the tones
// returned by statusTone() above.
const TONE_VAR: Record<Tone, string> = {
  success: "var(--status-done)",
  info: "var(--status-progress)",
  warning: "var(--status-review)",
  danger: "var(--priority-critical)",
  neutral: "var(--fg-muted)",
}

// The badge's base color: workflow JSON token wins; otherwise we fall
// back to the canonical 5-status palette so projects that pre-date the
// color picker still get a sensible hue (done=green, blocked=red, etc.)
function statusBaseColor(
  project: Project,
  columnName: string,
): string {
  const token = resolveStatusColorToken(project, columnName)
  if (token) return `var(--${token})`
  return TONE_VAR[statusTone(columnName)]
}

// PillBadgeButton — pill-shaped trigger that opens a popover picker.
// Shared between the Status field and the Sprint/Cycle field so both
// sidebar rows feel identical. Built from scratch (not the Badge
// primitive) because:
//   * The dot needs to be a tone DARKER than the label/text (UAT: "noktanın
//     rengi labelın rengine göre bir tık koyu olsun"). Badge's `dot` prop
//     paints the dot in the same tone color as the text.
//   * The element is a <button>, not a <span>, so it owns its own click
//     semantics + keyboard focus + cursor without needing an overlay
//     trick to capture clicks.
// Color recipe matches the prior Badge tint palette so the visual
// continuity with priority chips / badge tones is preserved: 14% tint
// background, 30% tint border, 70%-black dot.
interface PillBadgeButtonProps {
  label: string
  baseColor: string
  /** Render the leading dot. Status uses it (workflow-color indicator);
   *  Sprint omits it (no per-sprint color taxonomy). */
  showDot?: boolean
  onClick: () => void
  ariaExpanded: boolean
  ariaLabel: string
  /** Render as ghost (outline-only) instead of tinted background — used
   *  for the Sprint "unassigned" affordance so it visually de-emphasises
   *  while staying clickable. */
  ghost?: boolean
}

const PillBadgeButton = React.forwardRef<
  HTMLButtonElement,
  PillBadgeButtonProps
>(function PillBadgeButton(
  { label, baseColor, showDot = true, onClick, ariaExpanded, ariaLabel, ghost = false },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      // The picker's click-outside listener (document-level mousedown)
      // would otherwise fire BEFORE this button's click handler when the
      // picker is open. That sequence — outside-close, then re-open via
      // toggle — left the picker stuck open after a second badge click.
      // Stopping propagation at mousedown keeps the trigger click isolated
      // from the dismissal handler.
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onClick}
      aria-haspopup="listbox"
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: showDot ? 5 : 0,
        height: 20,
        padding: "0 8px",
        fontSize: 11.5,
        fontWeight: 500,
        lineHeight: 1,
        borderRadius: 999,
        background: ghost
          ? "transparent"
          : `color-mix(in oklch, ${baseColor} 14%, transparent)`,
        color: baseColor,
        boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${baseColor} 30%, transparent)`,
        border: 0,
        cursor: "pointer",
        font: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      {showDot && (
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            // "Bir tık koyu" — same hue, ~30% darker in OKLCH so the dot
            // pops against the 14% tinted background without losing its
            // identity. Mirrors StatusPicker.darkDotColor.
            background: `color-mix(in oklch, ${baseColor} 70%, black)`,
            flexShrink: 0,
          }}
        />
      )}
      <span style={{ fontSize: 11.5 }}>{label}</span>
    </button>
  )
})

// Status badge + StatusPicker popover. Replaces the previous native
// <select> overlay which felt jarringly OS-native inside a styled
// sidebar. Behaviour contract:
//   * One click on the badge opens the picker directly (no intermediate
//     edit state).
//   * Selecting a row commits via TanStack mutation + closes the picker.
//   * Esc / click-outside dismisses without committing.
//   * The badge label preserves the column name's original casing
//     (uses project.boardColumns[i].name, not the lowercased task.status
//     normalisation key).
//   * Badge background / text colors track the workflow editor color
//     token; the dot is rendered one shade darker.
interface StatusInlineSelectProps {
  task: Task
  project: Project
}

function StatusInlineSelect({ task, project }: StatusInlineSelectProps) {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const { language: lang } = useApp()
  const [open, setOpen] = React.useState(false)

  // Match by lowercase because task.status is normalised by mapTask, but
  // the user-visible label uses the column's ORIGINAL casing.
  const currentColumn = project.boardColumns.find(
    (c) => c.name.toLowerCase() === task.status.toLowerCase(),
  )
  const displayLabel = currentColumn?.name || task.status || "—"
  const baseColor = statusBaseColor(project, displayLabel)

  const mutation = useMutation({
    mutationFn: (columnId: number) =>
      taskService.patchField(task.id, "column_id", columnId),
    onMutate: async (columnId) => {
      await qc.cancelQueries({ queryKey: ["tasks", task.id] })
      const prev = qc.getQueryData<Task>(["tasks", task.id])
      if (prev) {
        const nextCol = project.boardColumns.find((c) => c.id === columnId)
        qc.setQueryData<Task>(["tasks", task.id], {
          ...prev,
          // Optimistic flip — write the lowercased status the same way
          // mapTask normalises it, so the badge re-renders against the
          // matching column instantly.
          status: nextCol?.name?.toLowerCase() ?? prev.status,
        })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks", task.id], ctx.prev)
      showToast({
        variant: "error",
        message:
          lang === "tr"
            ? "Durum güncellenemedi"
            : "Failed to update status",
      })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks", task.id] })
    },
  })

  // Empty boardColumns → static badge, no picker (rare; happens when a
  // legacy project has no persisted columns yet).
  if (project.boardColumns.length === 0) {
    return (
      <PillBadgeButton
        label={displayLabel}
        baseColor={baseColor}
        onClick={() => {}}
        ariaExpanded={false}
        ariaLabel={lang === "tr" ? "Görev durumu" : "Task status"}
      />
    )
  }

  const ariaLabel = lang === "tr" ? "Görev durumu" : "Task status"
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <PillBadgeButton
        label={displayLabel}
        baseColor={baseColor}
        onClick={() => setOpen((v) => !v)}
        ariaExpanded={open}
        ariaLabel={ariaLabel}
      />
      {open && (
        <StatusPicker
          columns={project.boardColumns}
          selectedColumnId={currentColumn?.id ?? null}
          resolveColor={(name) => resolveStatusColorToken(project, name)}
          onSelect={(columnId) => {
            setOpen(false)
            if (columnId !== currentColumn?.id) {
              mutation.mutate(columnId)
            }
          }}
          onCancel={() => setOpen(false)}
          align="start"
        />
      )}
    </div>
  )
}

// SprintInlineSelect — pill button + SprintPicker popover. Twin of
// StatusInlineSelect; shares the PillBadgeButton trigger (with showDot
// off — sprints don't have a per-row colour taxonomy) and mirrors the
// open/close + optimistic mutation lifecycle.
//
// Three render states:
//   * Disabled (cycle field is non-Scrum + non-Waterfall in Phase 11) →
//     informational placeholder, no picker.
//   * Assigned (task has a sprint) → tinted info pill with the sprint
//     name; clicking opens the picker.
//   * Unassigned (no sprint, but the field is editable) → ghost pill
//     with a muted "Ata" call-to-action; same picker on click.
interface SprintInlineSelectProps {
  task: Task
  project: Project
  sprints: Sprint[]
  cycleLabel: string
  /** When false AND not Waterfall, the cycle field is intentionally
   *  inert (Phase 11 hides cycle ops for non-Scrum methodologies). */
  cycleEnabled: boolean
}

function SprintInlineSelect({
  task,
  project,
  sprints,
  cycleLabel,
  cycleEnabled,
}: SprintInlineSelectProps) {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const { language: lang } = useApp()
  const [open, setOpen] = React.useState(false)

  const isInert = !cycleEnabled && project.methodology !== "WATERFALL"

  const currentSprint = sprints.find((s) => s.id === task.cycleId) ?? null
  const assigned = task.cycleId != null
  const displayLabel = assigned
    ? (currentSprint?.name ?? `${cycleLabel} #${task.cycleId}`)
    : lang === "tr"
      ? `${cycleLabel} ata`
      : `Assign ${cycleLabel.toLowerCase()}`

  const mutation = useMutation({
    mutationFn: (sprintId: number | null) =>
      taskService.patchField(task.id, "cycle_id", sprintId),
    onMutate: async (sprintId) => {
      await qc.cancelQueries({ queryKey: ["tasks", task.id] })
      const prev = qc.getQueryData<Task>(["tasks", task.id])
      if (prev) {
        qc.setQueryData<Task>(["tasks", task.id], {
          ...prev,
          cycleId: sprintId,
        })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks", task.id], ctx.prev)
      showToast({
        variant: "error",
        message:
          lang === "tr"
            ? `${cycleLabel} güncellenemedi`
            : `Failed to update ${cycleLabel.toLowerCase()}`,
      })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks", task.id] })
    },
  })

  // Inert state: the cycle field isn't actionable in this methodology.
  // Render the same helper text the prior InlineEdit-driven layout used
  // so the row doesn't lose its informational value.
  if (isInert) {
    return (
      <span style={{ color: "var(--fg-subtle)", fontSize: 12 }}>
        {lang === "tr"
          ? "Faz 12'de aktive edilecek"
          : "Activated in Phase 12"}
      </span>
    )
  }

  const ariaLabel = lang === "tr" ? `${cycleLabel} seç` : `Select ${cycleLabel.toLowerCase()}`
  const baseColor = assigned
    ? "var(--status-progress)"
    : "var(--fg-subtle)"

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <PillBadgeButton
        label={displayLabel}
        baseColor={baseColor}
        showDot={false}
        ghost={!assigned}
        onClick={() => setOpen((v) => !v)}
        ariaExpanded={open}
        ariaLabel={ariaLabel}
      />
      {open && (
        <SprintPicker
          sprints={sprints}
          selectedSprintId={task.cycleId}
          onSelect={(sprintId) => {
            setOpen(false)
            if (sprintId !== task.cycleId) {
              mutation.mutate(sprintId)
            }
          }}
          onCancel={() => setOpen(false)}
          align="start"
        />
      )}
    </div>
  )
}

// PriorityInlineSelect — PriorityChip trigger + PriorityPicker popover.
// Third sibling of StatusInlineSelect / SprintInlineSelect; the chip stays
// the user's primary signal because the bar count maps to severity (low=1
// → critical=4) better than a generic dot pill. The chip lives inside a
// transparent <button> wrapper that adds the hover + focus affordance
// and stops mousedown propagation so the picker's click-outside listener
// doesn't race with the trigger toggle.
interface PriorityInlineSelectProps {
  task: Task
}

function PriorityInlineSelect({ task }: PriorityInlineSelectProps) {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const { language: lang } = useApp()
  const [open, setOpen] = React.useState(false)

  const mutation = useMutation({
    mutationFn: (level: PriorityLevel) =>
      taskService.patchField(task.id, "priority", level),
    onMutate: async (level) => {
      await qc.cancelQueries({ queryKey: ["tasks", task.id] })
      const prev = qc.getQueryData<Task>(["tasks", task.id])
      if (prev) {
        qc.setQueryData<Task>(["tasks", task.id], {
          ...prev,
          priority: level,
        })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks", task.id], ctx.prev)
      showToast({
        variant: "error",
        message:
          lang === "tr"
            ? "Öncelik güncellenemedi"
            : "Failed to update priority",
      })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks", task.id] })
    },
  })

  const ariaLabel = lang === "tr" ? "Öncelik" : "Priority"
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        // Same race-prevention trick used by PillBadgeButton: keep the
        // trigger click from waking the picker's document-level dismissal
        // handler when the picker is already open.
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 6px",
          margin: "-2px -6px",
          background: "transparent",
          border: 0,
          borderRadius: "var(--radius-sm)",
          cursor: "pointer",
          font: "inherit",
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background =
            "var(--surface-2)"
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background =
            "transparent"
        }}
      >
        <PriorityChip level={task.priority} lang={lang} />
      </button>
      {open && (
        <PriorityPicker
          selected={task.priority}
          onSelect={(level) => {
            setOpen(false)
            if (level !== task.priority) {
              mutation.mutate(level)
            }
          }}
          onCancel={() => setOpen(false)}
          align="start"
        />
      )}
    </div>
  )
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
  const { data: sprints = [] } = useSprints(cycleEnabled ? project.id : null)
  const labelById = React.useMemo(() => {
    const m = new Map<number, string>()
    for (const l of projectLabels) m.set(l.id, l.name)
    return m
  }, [projectLabels])

  // Avatar initials. Prefer a real name string if the caller has one, else
  // fall back to the legacy "#1"-style hash so something always renders.
  // `avatarUrl` is forwarded raw to the Avatar primitive (which resolves it).
  const userAvatar = (
    id: number | null,
    name?: string | null,
    avatarUrl?: string | null,
  ) =>
    id != null
      ? {
          initials: ((name && name.trim()) || `#${id}`).slice(0, 2).toUpperCase(),
          avColor: ((id % 8) + 1) as number,
          avatarUrl: avatarUrl ?? null,
        }
      : null

  // PhaseStepper renders null when conditions aren't met. Detecting this
  // mirror-side keeps the wrapper div from leaving an empty 6/16 padding
  // strip in the sidebar. Triage 5.12.
  const phaseStepperVisible =
    phaseEnabled && subtasks.length > 0 && phaseNodes.length > 0

  // Assignee picker — managed locally because the AssigneePicker pushes the
  // new value AND dismisses in a single onSelect call, which the generic
  // InlineEdit's setDraft → commit dance can't represent without racing on
  // the closure-captured draft.
  const qc = useQueryClient()
  const { showToast } = useToast()
  const [assigneeOpen, setAssigneeOpen] = React.useState(false)
  const assignMutation = useMutation({
    mutationFn: (assigneeId: number | null) =>
      taskService.patchField(task.id, "assignee_id", assigneeId),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ["tasks", task.id] })
      const prev = qc.getQueryData<Task>(["tasks", task.id])
      if (prev) {
        qc.setQueryData<Task>(["tasks", task.id], {
          ...prev,
          assigneeId: next,
        })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks", task.id], ctx.prev)
      showToast({
        variant: "error",
        message:
          lang === "tr"
            ? "Atama kaydedilemedi"
            : "Failed to save assignee",
      })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks", task.id] })
    },
  })

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
        {/* Görev Durumu (Task Status) — custom inline-select with the
            workflow editor's color token applied to the badge. The label
            IS the affordance: clicking it opens the dropdown directly (no
            intermediate "click-to-edit" state, no second click to expand
            the picker). Selecting an option commits and immediately
            re-renders as the badge. See StatusInlineSelect above. */}
        <MetaRow label={lang === "tr" ? "Görev Durumu" : "Task Status"}>
          <StatusInlineSelect task={task} project={project} />
        </MetaRow>

        {/* Assignee — searchable popover backed by useProjectMembers (Phase
            12 round 13). Replaces the previous "type a numeric user id"
            input which forced the user to know an internal id. Managed here
            (not via InlineEdit) because AssigneePicker pushes the chosen id
            AND dismisses in a single onSelect call — the generic InlineEdit
            commit closure would race on stale draft state. */}
        <MetaRow label={lang === "tr" ? "Atanan" : "Assignee"}>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setAssigneeOpen((v) => !v)}
              aria-haspopup="dialog"
              aria-expanded={assigneeOpen}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                width: "100%",
                padding: 0,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--fg)",
                font: "inherit",
                textAlign: "left",
              }}
            >
              {task.assigneeId != null ? (
                <>
                  {(() => {
                    const av = userAvatar(
                      task.assigneeId,
                      task.assigneeName,
                      task.assigneeAvatarUrl,
                    )
                    // M-T1 — no `href` here: this Avatar sits INSIDE the
                    // picker-toggle <button>, and an <a> nested in a <button> is
                    // invalid HTML (React 19 hydration warning + inconsistent
                    // click target). The avatar is now a plain visual; the row
                    // itself opens the AssigneePicker.
                    return av ? <Avatar user={av} size={20} /> : null
                  })()}
                  <span style={{ fontSize: 12.5 }}>
                    {task.assigneeName?.trim() ||
                      `${lang === "tr" ? "Kullanıcı" : "User"} #${task.assigneeId}`}
                  </span>
                </>
              ) : (
                <span style={{ color: "var(--fg-subtle)" }}>
                  {lang === "tr" ? "Atanmamış" : "Unassigned"}
                </span>
              )}
            </button>
            {assigneeOpen && (
              <AssigneePicker
                projectId={project.id}
                value={task.assigneeId}
                onSelect={(id) => {
                  setAssigneeOpen(false)
                  if (id !== task.assigneeId) {
                    assignMutation.mutate(id)
                  }
                }}
                onCancel={() => setAssigneeOpen(false)}
              />
            )}
          </div>
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
                  {/* Phase 13 Plan 13-03 (D-D4) — reporter Avatar links to profile. */}
                  {av && (
                    <Avatar
                      user={av}
                      size={20}
                      href={`/users/${task.reporterId}`}
                    />
                  )}
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

        {/* Öncelik (Priority) — PriorityChip trigger + PriorityPicker
            popover. Same single-click → pick → close UX as the Status
            and Sprint rows; the bar icon stays the dominant visual. */}
        <MetaRow label={lang === "tr" ? "Öncelik" : "Priority"}>
          <PriorityInlineSelect task={task} />
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

        {/* Cycle — hidden for Kanban (cycleLabel null). For Scrum / Waterfall
            the SprintInlineSelect renders the picker; for everything else
            the component surfaces the Phase 12 placeholder copy instead of
            an unclickable pill. */}
        {cycleLabel && (
          <MetaRow label={cycleLabel}>
            <SprintInlineSelect
              task={task}
              project={project}
              sprints={sprints}
              cycleLabel={cycleLabel}
              cycleEnabled={cycleEnabled}
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
