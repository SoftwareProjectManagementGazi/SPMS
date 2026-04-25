// Unit tests for Frontend2/lib/lifecycle/graph-traversal.ts (Phase 12 Plan 12-01).
//
// Six cases per 12-01-PLAN.md task 1 <behavior> block:
//   1. Linear chain A->B->C with one transition A->B
//   2. Disconnected node D with no transitions
//   3. Bidirectional A<->B with two transitions back-and-forth
//   4. V-Model parallel actives in flexible mode
//   5. Same V-Model in sequential-locked mode -> exactly 1 active
//   6. Archived node returns 'unreachable' regardless of edges

import { describe, it, expect } from "vitest"
import {
  computeNodeStates,
  type ComputeNodeStatesInput,
  type GraphWorkflow,
} from "./graph-traversal"

function transition(source: string, target: string) {
  return { extra_metadata: { source_phase_id: source, target_phase_id: target } }
}

describe("computeNodeStates — linear chain", () => {
  it("A->B->C with transition A->B yields {A:past, B:active, C:future}", () => {
    const input: ComputeNodeStatesInput = {
      workflow: {
        mode: "flexible",
        nodes: [
          { id: "A", isInitial: true },
          { id: "B" },
          { id: "C", isFinal: true },
        ],
        edges: [
          { source: "A", target: "B", type: "flow" },
          { source: "B", target: "C", type: "flow" },
        ],
      },
      phaseTransitions: [transition("A", "B")],
    }
    const states = computeNodeStates(input)
    expect(states.get("A")).toBe("past")
    expect(states.get("B")).toBe("active")
    expect(states.get("C")).toBe("future")
  })
})

describe("computeNodeStates — disconnected node", () => {
  it("D with no edges and no transitions returns 'unreachable'", () => {
    const input: ComputeNodeStatesInput = {
      workflow: {
        mode: "flexible",
        nodes: [
          { id: "A", isInitial: true },
          { id: "D" },
        ],
        edges: [],
      },
      phaseTransitions: [],
    }
    const states = computeNodeStates(input)
    expect(states.get("D")).toBe("unreachable")
  })
})

describe("computeNodeStates — bidirectional edge", () => {
  it("A<->B with transitions A->B then B->A yields B:past, A:active", () => {
    const input: ComputeNodeStatesInput = {
      workflow: {
        mode: "flexible",
        nodes: [
          { id: "A", isInitial: true },
          { id: "B", isFinal: true },
        ],
        edges: [{ source: "A", target: "B", type: "flow", bidirectional: true }],
      },
      phaseTransitions: [transition("A", "B"), transition("B", "A")],
    }
    const states = computeNodeStates(input)
    expect(states.get("B")).toBe("past")
    expect(states.get("A")).toBe("active")
  })
})

// V-Model fixture (ported from New_Frontend/src/data.jsx EXTRA_LIFECYCLES.v-model)
const V_MODEL_WORKFLOW: GraphWorkflow = {
  mode: "flexible",
  nodes: [
    { id: "n1", isInitial: true },
    { id: "n2" },
    { id: "n3" },
    { id: "n4" },
    { id: "n5" },
    { id: "n6" },
    { id: "n7", isFinal: true },
  ],
  edges: [
    { source: "n1", target: "n2", type: "flow" },
    { source: "n2", target: "n3", type: "flow" },
    { source: "n3", target: "n4", type: "flow" },
    { source: "n4", target: "n5", type: "flow" },
    { source: "n5", target: "n6", type: "flow" },
    { source: "n6", target: "n7", type: "flow" },
    { source: "n3", target: "n5", type: "verification" },
    { source: "n2", target: "n6", type: "verification" },
    { source: "n1", target: "n7", type: "verification" },
  ],
}

describe("computeNodeStates — parallel actives (flexible)", () => {
  it("V-Model with parallel transitions yields >1 active", () => {
    // Simulate transitions ending at both n3 (Module Design) and n5 (Unit Test)
    const input: ComputeNodeStatesInput = {
      workflow: V_MODEL_WORKFLOW,
      phaseTransitions: [
        transition("n1", "n2"),
        transition("n2", "n3"),
        // Branch: separate verification path activates n5 directly without
        // closing n3
        transition("n4", "n5"),
      ],
    }
    const states = computeNodeStates(input)
    const activeCount = Array.from(states.values()).filter((s) => s === "active").length
    expect(activeCount).toBeGreaterThan(1)
    // Both n3 (last touched on main flow) and n5 should remain active because
    // neither has a closing forward transition leaving it.
    expect(states.get("n3")).toBe("active")
    expect(states.get("n5")).toBe("active")
  })
})

describe("computeNodeStates — sequential-locked collapses to single active", () => {
  it("same V-Model fixture in sequential-locked mode keeps only the latest target", () => {
    const lockedWorkflow: GraphWorkflow = { ...V_MODEL_WORKFLOW, mode: "sequential-locked" }
    const input: ComputeNodeStatesInput = {
      workflow: lockedWorkflow,
      phaseTransitions: [
        transition("n1", "n2"),
        transition("n2", "n3"),
        transition("n4", "n5"),
      ],
    }
    const states = computeNodeStates(input)
    const activeCount = Array.from(states.values()).filter((s) => s === "active").length
    expect(activeCount).toBe(1)
    // Most-recent target = n5
    expect(states.get("n5")).toBe("active")
    // n3 should have been demoted to 'past'
    expect(states.get("n3")).toBe("past")
  })
})

describe("computeNodeStates — archived node", () => {
  it("isArchived=true forces 'unreachable' regardless of edges", () => {
    const input: ComputeNodeStatesInput = {
      workflow: {
        mode: "flexible",
        nodes: [
          { id: "A", isInitial: true },
          { id: "B", isArchived: true },
          { id: "C", isFinal: true },
        ],
        edges: [
          { source: "A", target: "B", type: "flow" },
          { source: "B", target: "C", type: "flow" },
        ],
      },
      phaseTransitions: [],
    }
    const states = computeNodeStates(input)
    expect(states.get("B")).toBe("unreachable")
  })

  it("snake_case is_archived=true is also honored", () => {
    const input: ComputeNodeStatesInput = {
      workflow: {
        mode: "flexible",
        nodes: [
          { id: "A", isInitial: true },
          { id: "B", is_archived: true },
        ],
        edges: [{ source: "A", target: "B", type: "flow" }],
      },
      phaseTransitions: [],
    }
    const states = computeNodeStates(input)
    expect(states.get("B")).toBe("unreachable")
  })
})
