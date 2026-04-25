// Unit tests for hooks/use-cycle-counters.ts (Phase 12 Plan 12-01).
//
// 3 cases per 12-01-PLAN.md task 2 <behavior> Tests 1-3. Tests target the
// pure `buildCycleMap` helper directly — no TanStack mounting required for
// the aggregation case.

import { describe, it, expect } from "vitest"
import { buildCycleMap } from "./use-cycle-counters"
import type { PhaseTransitionEntry } from "@/services/lifecycle-service"

function entry(source: string, target: string): PhaseTransitionEntry {
  return {
    user_id: 1,
    created_at: "2026-04-25T00:00:00Z",
    extra_metadata: { source_phase_id: source, target_phase_id: target },
  }
}

describe("buildCycleMap", () => {
  it("3 transitions all sourcing from 'risk-analysis' produce { 'risk-analysis': 3 }", () => {
    const activity = [
      entry("risk-analysis", "development"),
      entry("risk-analysis", "evaluation"),
      entry("risk-analysis", "planning"),
    ]
    const map = buildCycleMap(activity)
    expect(map.get("risk-analysis")).toBe(3)
    expect(map.size).toBe(1)
  })

  it("empty activity feed returns an empty Map", () => {
    expect(buildCycleMap([]).size).toBe(0)
    expect(buildCycleMap(null).size).toBe(0)
    expect(buildCycleMap(undefined).size).toBe(0)
  })

  it("mixed source phases count correctly per-phase", () => {
    const activity = [
      entry("planning", "execution"),
      entry("execution", "review"),
      entry("execution", "review"),
      entry("review", "execution"),
    ]
    const map = buildCycleMap(activity)
    expect(map.get("planning")).toBe(1)
    expect(map.get("execution")).toBe(2)
    expect(map.get("review")).toBe(1)
  })
})
