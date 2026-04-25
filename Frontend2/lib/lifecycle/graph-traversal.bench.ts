// Performance bench for Frontend2/lib/lifecycle/graph-traversal.ts (Phase 12 Plan 12-01).
//
// Hard target: BFS for 100-node fixture < 50 ms (12-SPEC.md constraint).
// vitest's `bench` API does not fail on time budget; an explicit
// expect(...).toBeLessThan(50) backstop assertion runs in addition to
// guarantee CI failure on regression.

import { bench, describe, it, expect } from "vitest"
import { computeNodeStates, type ComputeNodeStatesInput } from "./graph-traversal"

// Build a 100-node x ~300-edge fixture: linear chain + ~3 random crosslinks per node.
function build100NodeFixture(): ComputeNodeStatesInput {
  const nodes = Array.from({ length: 100 }, (_, i) => ({
    id: `n${i}`,
    isInitial: i === 0,
    isFinal: i === 99,
  }))

  const edges: ComputeNodeStatesInput["workflow"]["edges"] = []
  // Linear backbone
  for (let i = 0; i < 99; i++) {
    edges.push({ source: `n${i}`, target: `n${i + 1}`, type: "flow" })
  }
  // Pseudo-random crosslinks (deterministic via index hash)
  for (let i = 0; i < 100; i++) {
    for (let k = 0; k < 3; k++) {
      const j = (i * 7 + k * 31 + 11) % 100
      if (j === i) continue
      edges.push({ source: `n${i}`, target: `n${j}`, type: "flow" })
    }
  }

  // Five transitions to give the BFS some history to replay
  const phaseTransitions = [
    { extra_metadata: { source_phase_id: "n0", target_phase_id: "n1" } },
    { extra_metadata: { source_phase_id: "n1", target_phase_id: "n2" } },
    { extra_metadata: { source_phase_id: "n2", target_phase_id: "n3" } },
    { extra_metadata: { source_phase_id: "n3", target_phase_id: "n5" } },
    { extra_metadata: { source_phase_id: "n5", target_phase_id: "n10" } },
  ]

  return {
    workflow: { mode: "flexible", nodes, edges },
    phaseTransitions,
  }
}

const fixture = build100NodeFixture()

describe("graph-traversal benchmark", () => {
  bench(
    "100-node BFS (computeNodeStates)",
    () => {
      computeNodeStates(fixture)
    },
    { time: 1000 },
  )

  // Backstop assertion — vitest `bench` does not fail on time budget alone.
  it("100-node BFS completes under 50 ms median over 100 iterations", () => {
    // Warm-up to amortize JIT
    for (let i = 0; i < 10; i++) computeNodeStates(fixture)
    const start = performance.now()
    for (let i = 0; i < 100; i++) computeNodeStates(fixture)
    const elapsed = (performance.now() - start) / 100
    expect(elapsed).toBeLessThan(50)
  })
})
