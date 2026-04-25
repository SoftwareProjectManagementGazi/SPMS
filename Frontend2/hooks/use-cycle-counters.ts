// Cycle-counter hook (Phase 12 Plan 12-01) — derives a Map<nodeId, count>
// from the project's phase_transition activity feed. Consumed by both the
// LifecycleTab read-only canvas and the Workflow Editor (CONTEXT D-11,
// EDIT-06).
//
// The endpoint is read-only (Phase 9 D-46 already enforces project
// membership server-side, so threat T-12-01-01 = accept), and aggregation
// is pure client-side over the activity entries.

import { useQuery } from "@tanstack/react-query"
import {
  lifecycleService,
  type PhaseTransitionEntry,
} from "@/services/lifecycle-service"

/**
 * Pure helper — exported separately so unit tests don't need a TanStack
 * QueryClient mounted. Group activity entries by `extra_metadata.source_phase_id`
 * and return the count of closures (= transitions LEAVING that node).
 */
export function buildCycleMap(
  activity: PhaseTransitionEntry[] | null | undefined,
): Map<string, number> {
  const out = new Map<string, number>()
  if (!activity || activity.length === 0) return out
  for (const entry of activity) {
    const source = entry.extra_metadata?.source_phase_id
    if (!source) continue
    out.set(source, (out.get(source) ?? 0) + 1)
  }
  return out
}

export function useCycleCounters(projectId: number | null | undefined) {
  return useQuery({
    queryKey: ["cycle-counters", projectId],
    queryFn: () => lifecycleService.getPhaseTransitions(projectId!),
    enabled: !!projectId,
    select: buildCycleMap,
  })
}
