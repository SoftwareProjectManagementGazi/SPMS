// Phase 11 D-16 / D-42 — single source of truth for methodology-driven defaults.
// Every consumer (Task Create Modal, Backlog query builder, Properties sidebar cycle row,
// Settings > General defaults) reads from this module. No other file duplicates these tables.

export type Methodology =
  | "SCRUM"
  | "KANBAN"
  | "WATERFALL"
  | "ITERATIVE"
  | "INCREMENTAL"
  | "EVOLUTIONARY"
  | "RAD"

/** Backlog definition IDs stored in project.process_config.backlog_definition */
export type BacklogDefinition = "cycle_null" | "leftmost_column" | "phase_null_or_first" | "custom"

export const BACKLOG_DEFINITION_BY_METHODOLOGY: Record<Methodology, BacklogDefinition> = {
  SCRUM: "cycle_null",
  KANBAN: "leftmost_column",
  WATERFALL: "phase_null_or_first",
  ITERATIVE: "cycle_null",
  INCREMENTAL: "cycle_null",
  EVOLUTIONARY: "cycle_null",
  RAD: "cycle_null",
}

export interface CycleLabelSpec {
  tr: string
  en: string
}

/** null === field is hidden entirely (Kanban); per D-45 */
export const CYCLE_LABEL_BY_METHODOLOGY: Record<Methodology, CycleLabelSpec | null> = {
  SCRUM: { tr: "Sprint", en: "Sprint" },
  KANBAN: null,
  WATERFALL: { tr: "Faz", en: "Phase" },
  ITERATIVE: { tr: "İterasyon", en: "Iteration" },
  INCREMENTAL: { tr: "Artım", en: "Increment" },
  EVOLUTIONARY: { tr: "Evrim", en: "Evolution" },
  RAD: { tr: "İterasyon", en: "Iteration" },
}

/** Scrum is the only methodology with a working cycle data source in Phase 11 (D-44). */
export const CYCLE_FIELD_ENABLED_IN_PHASE_11: Record<Methodology, boolean> = {
  SCRUM: true,
  KANBAN: false,   // hidden entirely
  WATERFALL: false, // uses phase field instead — cycle row hidden per D-44
  ITERATIVE: false, // shown but disabled — helper "Faz 12'de aktive edilecek"
  INCREMENTAL: false,
  EVOLUTIONARY: false,
  RAD: false,
}

interface ProjectLite {
  methodology: string
  columns?: string[]
  processConfig?: Record<string, unknown> | null
}

/**
 * Resolve the Axios query params for the backlog list endpoint based on the
 * project's methodology and its process_config override.
 * Returns a params object to be merged into `apiClient.get('/tasks/project/:id', { params })`.
 */
export function resolveBacklogFilter(project: ProjectLite): Record<string, unknown> {
  const m = project.methodology as Methodology
  const cfg = (project.processConfig ?? {}) as { backlog_definition?: BacklogDefinition }
  const def = cfg.backlog_definition ?? BACKLOG_DEFINITION_BY_METHODOLOGY[m] ?? "cycle_null"

  switch (def) {
    case "cycle_null":
      // Scrum / Iterative / Incremental / Evolutionary / RAD — tasks not yet in a cycle
      return { cycle_id: null }
    case "leftmost_column":
      // Kanban — tasks in the first column
      return { status: project.columns?.[0] ?? "backlog" }
    case "phase_null_or_first":
      // Waterfall — tasks unassigned to a phase, OR in the first lifecycle phase
      return { phase_id: null }
    case "custom":
      // User override; no automatic filter — caller must pass additional params
      return { in_backlog: true }
    default:
      return { cycle_id: null }
  }
}

/**
 * Resolve the cycle label shown in Task Create Modal, Properties sidebar, Settings > General.
 * Returns null when the field should be hidden (Kanban only per D-45).
 */
export function resolveCycleLabel(
  project: ProjectLite,
  lang: "tr" | "en"
): string | null {
  const m = project.methodology as Methodology
  const cfg = (project.processConfig ?? {}) as { cycle_label?: string | null }
  if (cfg.cycle_label && cfg.cycle_label.trim()) return cfg.cycle_label // user override
  const spec = CYCLE_LABEL_BY_METHODOLOGY[m]
  return spec ? spec[lang] : null
}

/**
 * Phase 11 data-source gating for the cycle field in the Task modal.
 * When disabled, the field renders disabled with helper text "Faz 12'de aktive edilecek" (D-44).
 * When hidden (Kanban), resolveCycleLabel returns null and consumers omit the row entirely.
 */
export function isCycleFieldEnabled(methodology: string): boolean {
  return CYCLE_FIELD_ENABLED_IN_PHASE_11[methodology as Methodology] ?? false
}
