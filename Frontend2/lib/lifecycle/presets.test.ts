// Unit tests for Frontend2/lib/lifecycle/presets.ts (Phase 12 Plan 12-10).
//
// 11 cases per 12-10-PLAN.md task 1 <behavior> block:
//   - Tests 1-9: each preset (scrum/waterfall/kanban/iterative/vmodel/spiral/
//     incremental/evolutionary/rad) passes validateWorkflow() with zero errors
//   - Test 10: resolvePreset deep-clones the preset (returned value !== source)
//   - Test 11: every preset has a unique deep-clone (no shared nodes/edges
//     references between presets)
//
// Pure unit tests — no React, no jsdom, no QueryClient. Vitest runs the file
// directly against the pure presets module.

import { describe, it, expect } from "vitest"
import { validateWorkflow } from "./workflow-validators"
import {
  PRESETS_BY_ID,
  PRESET_LABELS_TR,
  PRESET_LABELS_EN,
  resolvePreset,
  type PresetId,
} from "./presets"

const ALL_PRESET_IDS: PresetId[] = [
  "scrum",
  "waterfall",
  "kanban",
  "iterative",
  "vmodel",
  "spiral",
  "incremental",
  "evolutionary",
  "rad",
]

describe("presets — each entry passes validateWorkflow with zero errors", () => {
  for (const id of ALL_PRESET_IDS) {
    it(`Test ${id}: PRESETS_BY_ID.${id} passes validateWorkflow`, () => {
      const wf = PRESETS_BY_ID[id]
      expect(wf).toBeDefined()
      const result = validateWorkflow({
        mode: wf.mode,
        nodes: wf.nodes.map((n) => ({
          id: n.id,
          isInitial: n.isInitial,
          isFinal: n.isFinal,
          isArchived: n.isArchived,
        })),
        edges: wf.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.type,
          isAllGate: e.isAllGate,
        })),
      })
      // Plan 12-10 EDIT-07: every preset must satisfy the 5-rule validator
      // with zero errors so users can ship them via "Şablon Yükle" without
      // hitting backend Pydantic validation 422s.
      expect(result.errors).toEqual([])
    })
  }
})

describe("presets — resolvePreset", () => {
  it("Test 10: resolvePreset deep-clones the preset (no shared reference)", () => {
    const cloned = resolvePreset("incremental")
    // Deep equal — same shape
    expect(cloned).toEqual(PRESETS_BY_ID.incremental)
    // Strict not-equal — different reference (deep clone enforced)
    expect(cloned).not.toBe(PRESETS_BY_ID.incremental)
    expect(cloned.nodes).not.toBe(PRESETS_BY_ID.incremental.nodes)
    expect(cloned.edges).not.toBe(PRESETS_BY_ID.incremental.edges)
  })

  it("Test 11: every preset id resolves to a unique deep-cloned object", () => {
    for (const id of ALL_PRESET_IDS) {
      const cloned = resolvePreset(id)
      expect(cloned).not.toBe(PRESETS_BY_ID[id])
      // Mutating the clone must NOT mutate the source preset.
      cloned.nodes.push({
        id: "tampered",
        name: "tampered",
        x: 0,
        y: 0,
      })
      expect(PRESETS_BY_ID[id].nodes.find((n) => n.id === "tampered")).toBeUndefined()
    }
  })
})

describe("presets — labels", () => {
  it("PRESET_LABELS_TR has an entry for every preset id", () => {
    for (const id of ALL_PRESET_IDS) {
      expect(PRESET_LABELS_TR[id]).toBeTruthy()
      expect(typeof PRESET_LABELS_TR[id]).toBe("string")
    }
  })

  it("PRESET_LABELS_EN has an entry for every preset id", () => {
    for (const id of ALL_PRESET_IDS) {
      expect(PRESET_LABELS_EN[id]).toBeTruthy()
      expect(typeof PRESET_LABELS_EN[id]).toBe("string")
    }
  })

  it("PRESET_LABELS_TR.incremental === 'Artırımlı' (EDIT-07)", () => {
    // EDIT-07 SPEC line 91-94: the 3 NEW preset labels are exactly
    // "Artırımlı"/"Evrimsel"/"RAD" in Turkish.
    expect(PRESET_LABELS_TR.incremental).toBe("Artırımlı")
    expect(PRESET_LABELS_TR.evolutionary).toBe("Evrimsel")
    expect(PRESET_LABELS_TR.rad).toBe("RAD")
  })
})

describe("presets — pure module", () => {
  it("PRESETS_BY_ID has exactly 9 entries", () => {
    const keys = Object.keys(PRESETS_BY_ID)
    expect(keys.length).toBe(9)
    expect(new Set(keys)).toEqual(new Set(ALL_PRESET_IDS))
  })
})
