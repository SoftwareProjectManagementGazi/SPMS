// Criteria editor hook (Phase 12 Plan 12-01) — local-state holder for the
// Settings > Yaşam Döngüsü criteria editor (Plan 12-03 consumer).
//
// Maintains per-phase drafts keyed by phase_id (sourced from
// project.process_config.workflow.nodes). Mirrors the
// settings-columns-subtab.tsx draft + commit-on-blur pattern but indexed
// by phase id instead of column id.
//
// Save flow: caller decides when to PATCH `/projects/{id}` with the rolled
// up `phase_completion_criteria` map. Hook only owns the in-memory drafts.

import * as React from "react"

export interface PhaseCriteria {
  auto: {
    all_tasks_done: boolean
    no_critical_tasks: boolean
    no_blockers: boolean
  }
  manual: string[]
}

const EMPTY_CRITERIA: PhaseCriteria = {
  auto: {
    all_tasks_done: false,
    no_critical_tasks: false,
    no_blockers: false,
  },
  manual: [],
}

export interface CriteriaEditorState {
  activePhaseId: string | null
  setActivePhaseId: (id: string | null) => void
  drafts: Record<string, PhaseCriteria>
  /** Get the draft for a phase (returns the empty default if none exists). */
  getDraft: (phaseId: string) => PhaseCriteria
  setDraft: (phaseId: string, draft: PhaseCriteria) => void
  /** Whether any draft has diverged from the initial value. */
  dirty: boolean
  /** Reset all drafts to the initial value (caller-supplied map). */
  reset: () => void
}

interface InitialMap {
  [phaseId: string]: PhaseCriteria
}

export function useCriteriaEditor(
  initialDrafts: InitialMap = {},
  initialActive: string | null = null,
): CriteriaEditorState {
  const initialRef = React.useRef<InitialMap>(initialDrafts)
  const [activePhaseId, setActivePhaseId] = React.useState<string | null>(
    initialActive,
  )
  const [drafts, setDrafts] = React.useState<InitialMap>(initialDrafts)

  const getDraft = React.useCallback(
    (phaseId: string): PhaseCriteria => {
      return drafts[phaseId] ?? EMPTY_CRITERIA
    },
    [drafts],
  )

  const setDraft = React.useCallback((phaseId: string, draft: PhaseCriteria) => {
    setDrafts((prev) => ({ ...prev, [phaseId]: draft }))
  }, [])

  const reset = React.useCallback(() => {
    setDrafts(initialRef.current)
  }, [])

  // Dirty when any draft differs from its initial counterpart (shallow JSON
  // compare is acceptable — the criteria object is small).
  const dirty = React.useMemo(() => {
    const initialKeys = new Set(Object.keys(initialRef.current))
    const draftKeys = new Set(Object.keys(drafts))
    if (initialKeys.size !== draftKeys.size) return true
    for (const k of draftKeys) {
      const a = initialRef.current[k]
      const b = drafts[k]
      if (JSON.stringify(a) !== JSON.stringify(b)) return true
    }
    return false
  }, [drafts])

  return {
    activePhaseId,
    setActivePhaseId,
    drafts,
    getDraft,
    setDraft,
    dirty,
    reset,
  }
}
