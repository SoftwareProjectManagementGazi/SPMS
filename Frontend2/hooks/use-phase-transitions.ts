// Phase transition hook (Phase 12 Plan 12-01) — TanStack mutation around
// phaseGateService.execute with idempotency-key state management
// (CONTEXT D-42 + RESEARCH §Pattern E).
//
// Idempotency-Key UUID is generated once per Gate panel-open session. The
// hook exposes `open()` (set fresh UUID) and `reset()` (drop UUID after
// success). Retries within 10 minutes hit Phase 9's idempotency cache —
// the backend returns the cached response without re-executing.
//
// Status-aware retry policy mirrors hooks/use-projects.ts:67-71 — never
// retry 409, 422, 429, or 400 (the UI handles each error code distinctly
// per CONTEXT D-41).

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  phaseGateService,
  type PhaseTransitionDTO,
  type PhaseTransitionResult,
} from "@/services/phase-gate-service"

const NO_RETRY_STATUSES = new Set([400, 409, 422, 429])

function newUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function usePhaseTransition(projectId: number) {
  const qc = useQueryClient()
  const [idempotencyKey, setIdempotencyKey] = React.useState<string | null>(null)

  const open = React.useCallback(() => {
    setIdempotencyKey(newUuid())
  }, [])

  const reset = React.useCallback(() => {
    setIdempotencyKey(null)
  }, [])

  const mutation = useMutation<PhaseTransitionResult, unknown, PhaseTransitionDTO>({
    mutationFn: (dto) => {
      if (!idempotencyKey) {
        // Calling submit without open() is a programmer error — fail loudly.
        throw new Error("Idempotency-Key not initialized; call open() before submit")
      }
      return phaseGateService.execute(projectId, dto, idempotencyKey)
    },
    retry: (failureCount, err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status && NO_RETRY_STATUSES.has(status)) return false
      return failureCount < 2
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] })
      qc.invalidateQueries({ queryKey: ["activity", projectId] })
      qc.invalidateQueries({ queryKey: ["cycle-counters", projectId] })
    },
  })

  return { idempotencyKey, open, reset, mutation }
}
