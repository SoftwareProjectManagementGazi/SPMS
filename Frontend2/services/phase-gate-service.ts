// Phase Gate service (Phase 12 Plan 12-01) — POST /projects/{id}/phase-transitions
//
// Threat T-09-08: Idempotency-Key is REQUIRED (no default). Caller MUST
// provide a UUID generated once per Gate panel-open session (CONTEXT D-42).
// Phase 9 backend caches the response 10 min so retries within the window
// return the cached response without re-executing.

import { apiClient } from "@/lib/api-client"

export interface PhaseTransitionExceptionDTO {
  task_id: number
  action: "next" | "backlog" | "stay"
}

export interface PhaseTransitionDTO {
  source_phase_id: string
  target_phase_id: string
  /** Default open-task behavior; per-task overrides land in `exceptions[]`. */
  default_action?: "next" | "backlog" | "stay"
  exceptions?: PhaseTransitionExceptionDTO[]
  /** Required only when sequential-locked criteria are unmet. */
  allow_override?: boolean
  note?: string
}

export interface UnmetCriterion {
  check: string
  passed: boolean
  detail?: string
}

export interface PhaseTransitionResultDTO {
  ok?: boolean
  transition_id?: number
  target_phase_id?: string
  target_phase_name?: string
  cycle_number?: number
  override_used?: boolean
  unmet?: UnmetCriterion[]
}

export interface PhaseTransitionResult {
  ok: boolean
  transitionId: number | null
  targetPhaseId: string | null
  targetPhaseName: string | null
  cycleNumber: number | null
  overrideUsed: boolean
  unmet: UnmetCriterion[]
}

function mapResult(d: PhaseTransitionResultDTO): PhaseTransitionResult {
  return {
    ok: d.ok ?? true,
    transitionId: d.transition_id ?? null,
    targetPhaseId: d.target_phase_id ?? null,
    targetPhaseName: d.target_phase_name ?? null,
    cycleNumber: d.cycle_number ?? null,
    overrideUsed: d.override_used ?? false,
    unmet: d.unmet ?? [],
  }
}

export const phaseGateService = {
  /**
   * Execute a phase transition. The `idempotencyKey` parameter is REQUIRED
   * (T-09-08 — never default it; call sites become visible in code review).
   */
  execute: async (
    projectId: number,
    dto: PhaseTransitionDTO,
    idempotencyKey: string,
  ): Promise<PhaseTransitionResult> => {
    const resp = await apiClient.post<PhaseTransitionResultDTO>(
      `/projects/${projectId}/phase-transitions`,
      dto,
      { headers: { "Idempotency-Key": idempotencyKey } },
    )
    return mapResult(resp.data)
  },
}
