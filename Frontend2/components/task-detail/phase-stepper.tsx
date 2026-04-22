"use client"

// PhaseStepper — TASK-04 horizontal chevron row in the Properties sidebar.
// Renders only when:
//   - project.process_config.enable_phase_assignment = true
//   - task has at least one sub-task
//   - project.process_config.workflow.nodes is non-empty
//
// Counts sub-tasks per phase node; highlights the phase with the most.
// Spec: UI-SPEC §10 PhaseStepper (lines 628-646).

import { ChevronRight } from "lucide-react"
import type { Project } from "@/services/project-service"
import type { Task } from "@/services/task-service"

interface PhaseStepperProps {
  project: Project
  subtasks: Task[]
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

export function PhaseStepper({ project, subtasks }: PhaseStepperProps) {
  const { enabled, nodes } = readPhaseConfig(project)

  if (!enabled || subtasks.length === 0 || nodes.length === 0) return null

  const counts = new Map<string, number>()
  for (const st of subtasks) {
    if (st.phaseId) counts.set(st.phaseId, (counts.get(st.phaseId) ?? 0) + 1)
  }

  // Phase with the most sub-tasks (ties go to first match in workflow order).
  let maxId: string | null = null
  let maxN = 0
  for (const node of nodes) {
    const n = counts.get(node.id) ?? 0
    if (n > maxN) {
      maxN = n
      maxId = node.id
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        flexWrap: "wrap",
        marginTop: 8,
      }}
      data-testid="phase-stepper"
    >
      {nodes.map((node, i) => {
        const n = counts.get(node.id) ?? 0
        const isMax = node.id === maxId && maxN > 0
        const isLast = i === nodes.length - 1
        return (
          <div
            key={node.id}
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                borderRadius: 999,
                background: isMax ? "var(--primary)" : "var(--surface-2)",
                color: isMax ? "var(--primary-fg)" : "var(--fg-muted)",
                boxShadow: isMax
                  ? "0 1px 3px oklch(0.60 0.17 40 / 0.3)"
                  : "inset 0 0 0 1px var(--border)",
                fontSize: 11,
                fontWeight: 600,
                opacity: n === 0 ? 0.5 : 1,
              }}
            >
              <span>{node.name}</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: isMax
                    ? "color-mix(in oklch, var(--primary-fg) 25%, transparent)"
                    : "var(--surface)",
                  color: isMax ? "var(--primary-fg)" : "var(--fg-muted)",
                  fontSize: 10,
                  fontWeight: 600,
                  boxShadow: isMax
                    ? "none"
                    : "inset 0 0 0 1px var(--border)",
                }}
              >
                {n}
              </span>
            </div>
            {!isLast && <ChevronRight size={10} color="var(--fg-subtle)" />}
          </div>
        )
      })}
    </div>
  )
}
