// Pure node-id helpers (Phase 12 Plan 12-10 — Bug X UAT fix).
//
// Backend D-22 enforces `^nd_[A-Za-z0-9_-]{10}$` on every WorkflowNode.id
// (Backend/app/domain/entities/task.py NODE_ID_REGEX,
// Backend/app/application/dtos/workflow_dtos.py WorkflowNode.validate_id_format).
// This module ships:
//
//   1. NODE_ID_REGEX — FE-tightened to `^nd_[a-z0-9]{10}$` so we never emit
//      uppercase / dash / underscore variants. Backend regex stays broader,
//      so all FE-emitted IDs are accepted.
//
//   2. newNodeId() — generates a fresh `nd_<10>` ID for editor add-node /
//      duplicate / preset-defensive flows.
//
//   3. regenerateInvalidNodeIds(wf) — belt-and-suspenders: if any node id
//      in `wf.nodes` fails the regex, regenerate it AND rewrite every edge
//      source/target + group children reference so the workflow stays
//      internally consistent. Used by the editor's preset-apply path and
//      the WorkflowEmptyState applyPresetInline flow so future preset
//      regressions can never push 422-bait into the canvas.
//
// Pure module (zero React, zero context) so it stays vitest-testable in a
// non-jsdom environment. The React consumer is in
// Frontend2/components/workflow-editor/editor-page.tsx.

import type { WorkflowConfig } from "@/services/lifecycle-service"

const NODE_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789"

/** FE-tightened regex (lowercase + digits only). Backend is broader. */
export const NODE_ID_REGEX = /^nd_[a-z0-9]{10}$/

export function newNodeId(): string {
  let suffix = ""
  for (let i = 0; i < 10; i++) {
    suffix += NODE_ID_ALPHABET[Math.floor(Math.random() * NODE_ID_ALPHABET.length)]
  }
  return `nd_${suffix}`
}

/** Edges have no regex constraint — keep readable form. */
export function newEdgeId(): string {
  return `ed_${Date.now().toString(36).slice(-6)}${Math.random().toString(36).slice(2, 6)}`
}

/** Groups have no regex constraint — keep readable form. */
export function newGroupId(): string {
  return `gr_${Date.now().toString(36).slice(-6)}${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Defensive ID-regeneration pass for preset-apply / import flows.
 *
 * If every node already has a regex-compliant id, returns the input
 * unchanged (referential equality preserved so React memo doesn't churn).
 * Otherwise, returns a new WorkflowConfig with bad IDs replaced and every
 * edge / group reference rewritten to track the new IDs.
 */
export function regenerateInvalidNodeIds(wf: WorkflowConfig): WorkflowConfig {
  const idMap = new Map<string, string>()
  for (const n of wf.nodes) {
    if (!NODE_ID_REGEX.test(n.id)) {
      idMap.set(n.id, newNodeId())
    }
  }
  if (idMap.size === 0) return wf
  return {
    ...wf,
    nodes: wf.nodes.map((n) =>
      idMap.has(n.id) ? { ...n, id: idMap.get(n.id)! } : n,
    ),
    edges: wf.edges.map((e) => ({
      ...e,
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
    })),
    groups: (wf.groups ?? []).map((g) => ({
      ...g,
      children: (g.children ?? []).map((c) => idMap.get(c) ?? c),
    })),
  }
}
