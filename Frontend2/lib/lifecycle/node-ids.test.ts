// Unit tests for Frontend2/lib/lifecycle/node-ids.ts
// (Phase 12 Plan 12-10 — Bug X UAT fix).
//
// Pure unit tests — no React, no jsdom, no QueryClient. Vitest runs the file
// directly against the pure node-ids module.

import { describe, it, expect } from "vitest"
import {
  newNodeId,
  newEdgeId,
  newGroupId,
  regenerateInvalidNodeIds,
  NODE_ID_REGEX,
} from "./node-ids"
import type { WorkflowConfig } from "@/services/lifecycle-service"

describe("node-ids — newNodeId", () => {
  it("produces ids matching ^nd_[a-z0-9]{10}$", () => {
    for (let i = 0; i < 100; i++) {
      const id = newNodeId()
      expect(NODE_ID_REGEX.test(id)).toBe(true)
    }
  })

  it("returns unique values across many calls (low collision)", () => {
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      seen.add(newNodeId())
    }
    // 200 calls × 36^10 alphabet should never collide except astronomically.
    expect(seen.size).toBeGreaterThan(190)
  })
})

describe("node-ids — newEdgeId / newGroupId", () => {
  it("newEdgeId starts with ed_", () => {
    expect(newEdgeId().startsWith("ed_")).toBe(true)
  })
  it("newGroupId starts with gr_", () => {
    expect(newGroupId().startsWith("gr_")).toBe(true)
  })
})

describe("node-ids — regenerateInvalidNodeIds", () => {
  it("returns the same reference when every id is valid", () => {
    const wf: WorkflowConfig = {
      mode: "flexible",
      nodes: [
        { id: "nd_aaaaaaaaaa", name: "A", x: 0, y: 0 },
        { id: "nd_bbbbbbbbbb", name: "B", x: 100, y: 0 },
      ],
      edges: [
        { id: "e1", source: "nd_aaaaaaaaaa", target: "nd_bbbbbbbbbb", type: "flow" },
      ],
      groups: [],
    }
    expect(regenerateInvalidNodeIds(wf)).toBe(wf)
  })

  it("rewrites invalid node IDs and updates edge source/target", () => {
    const wf: WorkflowConfig = {
      mode: "flexible",
      nodes: [
        { id: "n1", name: "A", x: 0, y: 0 },
        { id: "n2", name: "B", x: 100, y: 0 },
      ],
      edges: [{ id: "e1", source: "n1", target: "n2", type: "flow" }],
      groups: [],
    }
    const next = regenerateInvalidNodeIds(wf)
    expect(next).not.toBe(wf)
    for (const n of next.nodes) {
      expect(NODE_ID_REGEX.test(n.id)).toBe(true)
    }
    // Edges must reference the NEW ids — the originals are gone.
    const newIds = new Set(next.nodes.map((n) => n.id))
    for (const e of next.edges) {
      expect(newIds.has(e.source)).toBe(true)
      expect(newIds.has(e.target)).toBe(true)
    }
  })

  it("rewrites group children references for invalid IDs", () => {
    const wf: WorkflowConfig = {
      mode: "flexible",
      nodes: [
        { id: "bad-1", name: "A", x: 0, y: 0 },
        { id: "nd_validone1", name: "B", x: 100, y: 0 },
      ],
      edges: [],
      groups: [{ id: "g1", name: "G", children: ["bad-1", "nd_validone1"] }],
    }
    const next = regenerateInvalidNodeIds(wf)
    const validIds = new Set(next.nodes.map((n) => n.id))
    for (const c of next.groups![0].children) {
      expect(validIds.has(c)).toBe(true)
    }
    // The previously-valid ID must be preserved (not regenerated).
    expect(validIds.has("nd_validone1")).toBe(true)
  })

  it("preserves valid IDs when only some are invalid", () => {
    const wf: WorkflowConfig = {
      mode: "flexible",
      nodes: [
        { id: "nd_aaaaaaaaaa", name: "A", x: 0, y: 0 },
        { id: "n2", name: "B", x: 100, y: 0 },
      ],
      edges: [],
      groups: [],
    }
    const next = regenerateInvalidNodeIds(wf)
    expect(next.nodes[0].id).toBe("nd_aaaaaaaaaa")
    expect(NODE_ID_REGEX.test(next.nodes[1].id)).toBe(true)
  })
})
