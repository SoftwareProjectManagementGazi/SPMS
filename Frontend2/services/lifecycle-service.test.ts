// Unit tests for services/lifecycle-service.ts mapper round-trip
// (Wave 2 W2-C5 — capabilities serialize/deserialize).
//
// These tests guard the contract that:
//   1. mapWorkflowConfig (backend DTO → editor camelCase shape) carries
//      `capabilities` through unchanged so the editor's CapabilitiesPanel
//      can hydrate from process_config.{phase,task}_workflow.capabilities.
//   2. unmapWorkflowConfig (editor → backend DTO) emits `capabilities`
//      so a user toggling enforce_wip_limits actually reaches the backend.
//   3. mapCapabilities ignores unknown keys (forward compatibility — backend
//      may add new capabilities the UI hasn't adopted yet) and rejects
//      non-boolean booleans (defensive against bad fixtures).
//
// Pre-W2-C5: the old mapper SILENTLY DROPPED capabilities, so even though
// W2-C1 made the backend Pydantic round-trip the field, the editor's
// W2-C4 toggle UI was a vitrine (toggles flipped React state but never
// reached the wire). These tests are the regression guard.

import { describe, it, expect } from "vitest"
import {
  mapCapabilities,
  mapWorkflowConfig,
  unmapWorkflowConfig,
  type WorkflowConfig,
  type WorkflowConfigDTO,
} from "./lifecycle-service"

describe("mapCapabilities", () => {
  it("returns {} for null / undefined / non-object", () => {
    expect(mapCapabilities(null)).toEqual({})
    expect(mapCapabilities(undefined)).toEqual({})
    expect(mapCapabilities("string")).toEqual({})
    expect(mapCapabilities(42)).toEqual({})
  })

  it("copies all known boolean flags", () => {
    const result = mapCapabilities({
      enforce_wip_limits: true,
      enforce_sequential_dependencies: false,
      restrict_expired_sprints: true,
      has_recurring: false,
    })
    expect(result).toEqual({
      enforce_wip_limits: true,
      enforce_sequential_dependencies: false,
      restrict_expired_sprints: true,
      has_recurring: false,
    })
  })

  it("preserves initial_node_id (string or null)", () => {
    expect(mapCapabilities({ initial_node_id: "nd_abc1234567" })).toEqual({
      initial_node_id: "nd_abc1234567",
    })
    expect(mapCapabilities({ initial_node_id: null })).toEqual({
      initial_node_id: null,
    })
  })

  it("drops unknown keys (forward-compat)", () => {
    const result = mapCapabilities({
      enforce_wip_limits: true,
      // Hypothetical future engine flag the UI has not adopted yet.
      enforce_kanban_swimlane: true,
      garbage: "ignored",
    })
    expect(result).toEqual({ enforce_wip_limits: true })
  })

  it("rejects non-boolean values for boolean keys", () => {
    const result = mapCapabilities({
      enforce_wip_limits: "true", // string, not boolean
      has_recurring: 1, // number, not boolean
    })
    expect(result).toEqual({})
  })
})

describe("mapWorkflowConfig + unmapWorkflowConfig capabilities round-trip", () => {
  // Helper — minimal valid DTO so we can focus on capabilities.
  const baseDTO: WorkflowConfigDTO = {
    mode: "flexible",
    nodes: [],
    edges: [],
    groups: [],
  }

  it("mapWorkflowConfig hydrates capabilities from the DTO", () => {
    const dto: WorkflowConfigDTO = {
      ...baseDTO,
      capabilities: {
        enforce_wip_limits: true,
        has_recurring: false,
      },
    }
    const config = mapWorkflowConfig(dto)
    expect(config.capabilities).toEqual({
      enforce_wip_limits: true,
      has_recurring: false,
    })
  })

  it("mapWorkflowConfig leaves capabilities undefined when DTO has none", () => {
    const config = mapWorkflowConfig(baseDTO)
    expect(config.capabilities).toBeUndefined()
  })

  it("unmapWorkflowConfig serializes capabilities to the DTO", () => {
    const config: WorkflowConfig = {
      mode: "flexible",
      nodes: [],
      edges: [],
      groups: [],
      capabilities: {
        enforce_wip_limits: true,
        enforce_sequential_dependencies: false,
        has_recurring: true,
      },
    }
    const dto = unmapWorkflowConfig(config)
    expect(dto.capabilities).toEqual({
      enforce_wip_limits: true,
      enforce_sequential_dependencies: false,
      has_recurring: true,
    })
  })

  it("unmapWorkflowConfig leaves capabilities undefined when config has none", () => {
    const config: WorkflowConfig = {
      mode: "flexible",
      nodes: [],
      edges: [],
      groups: [],
    }
    const dto = unmapWorkflowConfig(config)
    expect(dto.capabilities).toBeUndefined()
  })

  it("full round-trip DTO → config → DTO preserves capabilities", () => {
    const dto: WorkflowConfigDTO = {
      mode: "continuous",
      nodes: [],
      edges: [],
      groups: [],
      capabilities: {
        enforce_wip_limits: true,
        enforce_sequential_dependencies: true,
        restrict_expired_sprints: false,
        has_recurring: true,
        initial_node_id: "nd_init00001",
      },
    }
    const roundTripped = unmapWorkflowConfig(mapWorkflowConfig(dto))
    expect(roundTripped.capabilities).toEqual(dto.capabilities)
  })
})
