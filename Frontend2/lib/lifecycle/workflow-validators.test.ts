// Unit tests for Frontend2/lib/lifecycle/workflow-validators.ts (Phase 12 Plan 12-01).
//
// 12 cases per 12-01-PLAN.md task 1 <behavior> block:
//   - 5 rules x ok/fail = 10 cases
//   - rule 3 is_all_gate exemption case
//   - rule 5 flexible-mode warning case

import { describe, it, expect } from "vitest"
import {
  validateWorkflow,
  hasCycle,
  type ValidatorWorkflow,
} from "./workflow-validators"

function baseWorkflow(overrides: Partial<ValidatorWorkflow> = {}): ValidatorWorkflow {
  return {
    mode: "flexible",
    nodes: [
      { id: "A", isInitial: true },
      { id: "B" },
      { id: "C", isFinal: true },
    ],
    edges: [
      { id: "e1", source: "A", target: "B", type: "flow" },
      { id: "e2", source: "B", target: "C", type: "flow" },
    ],
    ...overrides,
  }
}

describe("Rule 1 — at least 1 node", () => {
  it("OK: workflow with nodes returns no rule-1 errors", () => {
    const result = validateWorkflow(baseWorkflow())
    expect(result.errors.find((e) => e.rule === 1)).toBeUndefined()
  })
  it("FAIL: empty nodes array returns rule-1 error", () => {
    const result = validateWorkflow({ mode: "flexible", nodes: [], edges: [] })
    expect(result.errors.some((e) => e.rule === 1)).toBe(true)
  })
})

describe("Rule 2 — unique node IDs", () => {
  it("OK: unique IDs return no rule-2 errors", () => {
    const result = validateWorkflow(baseWorkflow())
    expect(result.errors.find((e) => e.rule === 2)).toBeUndefined()
  })
  it("FAIL: duplicate IDs return a rule-2 error", () => {
    const result = validateWorkflow(
      baseWorkflow({
        nodes: [
          { id: "A", isInitial: true },
          { id: "A" },
          { id: "C", isFinal: true },
        ],
      }),
    )
    const r2 = result.errors.find((e) => e.rule === 2)
    expect(r2).toBeDefined()
    expect(r2!.detail).toContain("A")
  })
})

describe("Rule 3 — edge endpoints reference existing non-archived nodes", () => {
  it("OK: all endpoints valid returns no rule-3 errors", () => {
    const result = validateWorkflow(baseWorkflow())
    expect(result.errors.filter((e) => e.rule === 3)).toHaveLength(0)
  })
  it("FAIL: edge target references missing node returns rule-3 error", () => {
    const result = validateWorkflow(
      baseWorkflow({
        edges: [
          { id: "e1", source: "A", target: "B", type: "flow" },
          { id: "e2", source: "B", target: "MISSING", type: "flow" },
        ],
      }),
    )
    expect(result.errors.some((e) => e.rule === 3 && e.detail.includes("MISSING"))).toBe(true)
  })
  it("FAIL: edge source references archived node returns rule-3 error", () => {
    const result = validateWorkflow(
      baseWorkflow({
        nodes: [
          { id: "A", isInitial: true, isArchived: true },
          { id: "B" },
          { id: "C", isFinal: true },
        ],
      }),
    )
    expect(result.errors.some((e) => e.rule === 3)).toBe(true)
  })
  it("EXEMPTION: is_all_gate=true edge with archived/missing source is NOT flagged", () => {
    const result = validateWorkflow(
      baseWorkflow({
        edges: [
          { id: "e1", source: "A", target: "B", type: "flow" },
          { id: "e2", source: "B", target: "C", type: "flow" },
          // All-gate edge with phantom source — should be exempt
          { id: "e3", source: "ANY", target: "C", type: "flow", isAllGate: true },
        ],
      }),
    )
    // The phantom source 'ANY' should be exempt; only target gets checked
    const sourceErrors = result.errors.filter(
      (e) => e.rule === 3 && e.detail.includes("ANY"),
    )
    expect(sourceErrors).toHaveLength(0)
  })
})

describe("Rule 4 — at least 1 isInitial AND at least 1 isFinal", () => {
  it("OK: workflow with both initial and final returns no rule-4 errors", () => {
    const result = validateWorkflow(baseWorkflow())
    expect(result.errors.filter((e) => e.rule === 4)).toHaveLength(0)
  })
  it("FAIL: workflow with no isInitial returns a rule-4 error", () => {
    const result = validateWorkflow(
      baseWorkflow({
        nodes: [{ id: "A" }, { id: "C", isFinal: true }],
      }),
    )
    expect(
      result.errors.some((e) => e.rule === 4 && e.detail.includes("isInitial")),
    ).toBe(true)
  })
  it("FAIL: workflow with no isFinal returns a rule-4 error", () => {
    const result = validateWorkflow(
      baseWorkflow({
        nodes: [{ id: "A", isInitial: true }, { id: "B" }, { id: "C" }],
      }),
    )
    expect(
      result.errors.some((e) => e.rule === 4 && e.detail.includes("isFinal")),
    ).toBe(true)
  })
})

describe("Rule 5 — flow-edge acyclicity by mode", () => {
  it("OK: sequential-locked acyclic returns no rule-5 errors", () => {
    const result = validateWorkflow(baseWorkflow({ mode: "sequential-locked" }))
    expect(result.errors.filter((e) => e.rule === 5)).toHaveLength(0)
  })
  it("FAIL: sequential-locked with cycle returns rule-5 error", () => {
    const result = validateWorkflow(
      baseWorkflow({
        mode: "sequential-locked",
        edges: [
          { id: "e1", source: "A", target: "B", type: "flow" },
          { id: "e2", source: "B", target: "C", type: "flow" },
          { id: "e3", source: "C", target: "A", type: "flow" }, // creates cycle
        ],
      }),
    )
    expect(result.errors.some((e) => e.rule === 5)).toBe(true)
  })
  it("FAIL: sequential-flexible mode with cycle returns rule-5 error (Plan 12-09 EDIT-03)", () => {
    // Plan 12-09: explicit sequential-flexible coverage. Per CONTEXT D-55 rule 3,
    // sequential-flexible mode also requires acyclic flow edges (feedback edges
    // are exempt). This case mirrors the sequential-locked cycle case but for
    // sequential-flexible mode to lock in EDIT-03 parity.
    const result = validateWorkflow(
      baseWorkflow({
        mode: "sequential-flexible",
        edges: [
          { id: "e1", source: "A", target: "B", type: "flow" },
          { id: "e2", source: "B", target: "C", type: "flow" },
          { id: "e3", source: "C", target: "A", type: "flow" }, // creates cycle
        ],
      }),
    )
    expect(result.errors.some((e) => e.rule === 5)).toBe(true)
  })
  it("OK: sequential-flexible with feedback-typed cycle returns no rule-5 error (EDIT-03)", () => {
    // sequential-flexible permits feedback edges that close a cycle.
    const result = validateWorkflow(
      baseWorkflow({
        mode: "sequential-flexible",
        edges: [
          { id: "e1", source: "A", target: "B", type: "flow" },
          { id: "e2", source: "B", target: "C", type: "flow" },
          { id: "e3", source: "C", target: "A", type: "feedback" }, // exempt
        ],
      }),
    )
    expect(result.errors.filter((e) => e.rule === 5)).toHaveLength(0)
  })
  it("WARN: flexible mode with cycle returns rule-5 WARNING (not error)", () => {
    const result = validateWorkflow(
      baseWorkflow({
        mode: "flexible",
        edges: [
          { id: "e1", source: "A", target: "B", type: "flow" },
          { id: "e2", source: "B", target: "C", type: "flow" },
          { id: "e3", source: "C", target: "A", type: "flow" }, // creates cycle
        ],
      }),
    )
    expect(result.errors.filter((e) => e.rule === 5)).toHaveLength(0)
    expect(result.warnings.some((w) => w.rule === 5)).toBe(true)
  })
  it("OK: feedback edges DO NOT trigger rule 5 even in sequential modes", () => {
    const result = validateWorkflow(
      baseWorkflow({
        mode: "sequential-locked",
        edges: [
          { id: "e1", source: "A", target: "B", type: "flow" },
          { id: "e2", source: "B", target: "C", type: "flow" },
          // Feedback edge — not a flow edge, exempt from rule 5
          { id: "e3", source: "C", target: "A", type: "feedback" },
        ],
      }),
    )
    expect(result.errors.filter((e) => e.rule === 5)).toHaveLength(0)
  })
})

describe("hasCycle (Kahn topological sort)", () => {
  it("returns false for empty graph", () => {
    expect(hasCycle(new Set(), [])).toBe(false)
  })
  it("returns false for acyclic linear chain", () => {
    expect(
      hasCycle(new Set(["A", "B", "C"]), [
        { source: "A", target: "B" },
        { source: "B", target: "C" },
      ]),
    ).toBe(false)
  })
  it("returns true for triangle cycle", () => {
    expect(
      hasCycle(new Set(["A", "B", "C"]), [
        { source: "A", target: "B" },
        { source: "B", target: "C" },
        { source: "C", target: "A" },
      ]),
    ).toBe(true)
  })
})
