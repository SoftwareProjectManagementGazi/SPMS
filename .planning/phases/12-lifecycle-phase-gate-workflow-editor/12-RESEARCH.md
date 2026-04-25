# Phase 12: Lifecycle, Phase Gate & Workflow Editor — Research

**Researched:** 2026-04-25
**Domain:** React Flow integration / lifecycle UI / pure-logic graph algorithms / additive backend Pydantic
**Confidence:** HIGH on the locked decisions (CONTEXT/SPEC/UI-SPEC are mature); MEDIUM on Frontend2-side library availability (verified directly from `Frontend2/package.json` + filesystem); HIGH on Next.js 16 lazy-loading semantics (verified against `Frontend2/node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` + `.../03-api-reference/04-functions/use-router.md` per Frontend2/AGENTS.md instruction).

## Summary

Phase 12 has three independent surfaces that share one ~20-25 file Plan-01 infra layer: the **LifecycleTab** (4 sub-tabs + summary strip + read-only canvas + inline Phase Gate), the **Settings > Yaşam Döngüsü criteria editor**, and the standalone **`/workflow-editor?projectId=X` page**. CONTEXT.md (D-01..D-60), SPEC.md (LIFE-01..07 + EDIT-01..07), and UI-SPEC.md collectively lock 95% of "how": React Flow library choice, edge dasharrays, oklch token palette, copywriting tables, file map, primitives reuse, and the additive backend schema policy. The key research domains the planner needs are: **React Flow custom-renderer plumbing** (4-way handles, parent-child grouping, dynamic-import in Next.js 16, default-visual disabling), **concave-hull algorithm** for the smooth group cloud (D-22), **frontend pure-logic libraries** (BFS traversal, 5-rule validator, cycle counter aggregation), and **the additive backend change** (`bidirectional` + `is_all_gate` Pydantic fields, no normalizer migration per SPEC).

The SPEC explicitly **overrides** CONTEXT D-04 (manual UAT + per-plan unit/integration; **no E2E**) and CONTEXT D-18 (additive Pydantic field defaults + seeder update only — **no `_migrate_v1_to_v2`, no `CURRENT_SCHEMA_VERSION` bump, no Alembic migration**). Both overrides are documented in the SPEC's Background paragraph and re-confirmed in the Acceptance Criteria. Plan ordering must respect: (a) Plan 01 ships shared infra (canvas primitive, all 7 services, all 9 hooks, 5 pure-logic libs, `use-transition-authority`); (b) backend additive change ships before any UI write of the new edge fields; (c) LifecycleTab plans (12-02..06) deliver the user-visible "must ship" path before the editor plans (12-07..10), per CONTEXT D-01.

**Primary recommendation:** Plan 01 (shared infra + `WorkflowCanvas` primitive + pure-logic libs + backend additive change) is the critical path. Every subsequent plan consumes its outputs. Treat Plan 01 as a single bulk file-creation task with comprehensive vitest coverage of `graph-traversal.ts` + `workflow-validators.ts` + `cloud-hull.ts` + `align-helpers.ts`; Plans 02..10 then become thin UI layers on stable foundations.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Phase transition execution + criteria evaluation + audit log | API / Backend (Phase 9 already shipped) | — | `ExecutePhaseTransitionUseCase` is the single source of truth; frontend is purely UX over the existing endpoint. SPEC re-affirms "no new entities". |
| `bidirectional` + `is_all_gate` edge field validation | API / Backend (Pydantic + use case) | — | Domain rule enforcement happens in `WorkflowEdge` Pydantic model + `ExecutePhaseTransitionUseCase`. Frontend writes the booleans; backend treats them as authority. |
| Workflow JSON storage (`process_config` JSONB) | Database / Storage | API (Pydantic on read) | JSONB column already exists; SPEC requires zero migration. Pydantic `default=False` on the new fields applies on read for any pre-existing edge that lacks them. |
| BFS-driven node state computation (`active`/`past`/`future`/`unreachable`) | Browser / Client (pure JS) | — | EDIT-04 explicitly mandates a frontend pure function. Backend already validates separately for transition execution. No backend dependency. |
| Workflow validation (5 rules) | Browser / Client (pure JS) | API (final authority on save) | Live UX feedback is FE; persistent validation is BE. Backend Pydantic re-runs on PATCH (Phase 9 D-54/D-55). Both must agree. |
| Cycle counter aggregation (×N badges) | Browser / Client (pure JS) | API (audit log raw entries) | EDIT-06 derives `Map<nodeId, count>` from `GET /activity?type[]=phase_transition` — no new endpoint per CONTEXT D-11. |
| Concave-hull / smooth-cloud rendering | Browser / Client (SVG) | — | Pure visual; nothing to persist beyond `parentId` + `groups[]` already in workflow JSON. |
| File upload for artifacts | API (existing Phase 3 + Phase 9 D-41) | Browser / Client (FormData) | Reuse Phase 3 file upload machinery. Single file per artifact (multi-file deferred). |
| PDF generation | API (Phase 9 D-58 fpdf2 sync) | Browser / Client (Blob download) | LIFE-07 reuses Phase 9 endpoint as-is; FE is a download trigger + 30s rate-limit toast. |
| Idempotency-Key generation | Browser / Client (`crypto.randomUUID()`) | API (10-min cache) | Phase Gate retries cache in BE per Phase 9 D-50; FE generates UUID once per gate-expand session per CONTEXT D-42. |
| Permission gating (Admin / PM / Team Lead) | Browser / Client (`use-transition-authority` hook) | API (per-route auth) | Composed permission hook reads `useAuth()` + `GET /users/me/led-teams` (Phase 9 D-17). Backend re-checks. |
| Dirty-save guard | Browser / Client (`beforeunload` + Next.js router intercept) | — | Pure client UX; no backend involvement. Reuses ConfirmDialog (Phase 10 D-25). |
| Static asset / CDN | CDN / Static | — | Out of scope — no static asset changes. |

## Standard Stack

### Core (verified against `Frontend2/package.json`)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.2.4 (already installed) [VERIFIED: `Frontend2/package.json:35`] | App router framework | Already the project's framework. Frontend2/AGENTS.md mandates reading `node_modules/next/dist/docs/` before writing code. |
| `react` | 19.2.4 (already installed) [VERIFIED: `Frontend2/package.json:36`] | UI framework | Already the project's framework. React Flow v12 supports React 19 [CITED: reactflow.dev migrate-to-v12]. |
| `@xyflow/react` | **NEW** — pin to latest stable (12.10.x) [CITED: npmjs.com/package/@xyflow/react] | Graph editor plumbing (DnD, pan/zoom, minimap, controls) | User-locked choice (CONTEXT D-05). Use plumbing only; all visuals are custom (CONTEXT D-08). |
| `@tanstack/react-query` | 5.99.2 (already installed) [VERIFIED: `Frontend2/package.json:18`] | Cache + optimistic + invalidation | Phase 10/11 standard. |
| `axios` | 1.15.1 (already installed) [VERIFIED: `Frontend2/package.json:25`] | HTTP client | Phase 10 standard via `lib/api-client.ts`. |
| `lucide-react` | 1.8.0 (already installed) [VERIFIED: `Frontend2/package.json:30`] | Icons | Frontend2 standard. Replaces prototype `Icons.*`. |
| `clsx` | 2.1.1 (already installed) [VERIFIED] | className composition | Standard utility. |
| `vitest` | 1.6.0 (already installed) [VERIFIED] | Unit + bench | Vitest's `bench` API is the path for the BFS 100-node benchmark assertion. |
| `@testing-library/react` | 16.3.2 (already installed) [VERIFIED] | RTL component tests | Phase 10/11 standard. |
| `pydantic` | already installed (Backend) | Edge model validators | Add `bidirectional: bool = False` + `is_all_gate: bool = False` defaults. |

**Version verification commands:**
```bash
# Frontend
npm view @xyflow/react version  # confirm latest stable before Plan 01 install
# Backend (no new deps)
```

### Supporting (no new deps unless flagged)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `concaveman` | 2.0.0 [CITED: npmjs.com/package/concaveman] | Concave hull algorithm | **OPTIONAL** — only if convex-hull-plus-padding fallback feels too "box-y". UI-SPEC + CONTEXT both endorse the convex-hull-plus-padding baseline as v1. ~3KB gzipped, MIT license. [ASSUMED: ~3KB based on UI-SPEC line 1775; verify with `npm view concaveman` + Bundlephobia before adopting] |
| `d3-curve` (transitive via Phase 11 d3 use) | already installed transitively | SVG path smoothing | Use `curveCardinalClosed.tension(0.5)` for the cloud smoothing baseline (UI-SPEC line 1265). [ASSUMED: d3-curve is transitively present via Phase 11 — verify with `npm ls d3-curve` before relying on it] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@xyflow/react` | Custom SVG (prototype's pattern) | User explicitly chose React Flow (CONTEXT D-05). Custom SVG gives 100% control but no minimap/pan/zoom/DnD plumbing. |
| `concaveman` | Custom Graham-scan + padding | UI-SPEC recommends Graham-scan baseline (~80 LOC, no new dep). Concaveman as upgrade path. |
| `d3-curve` smoothing | Catmull-Rom hand-rolled | d3-curve is already in Phase 11 deps. Hand-rolling Catmull-Rom is ~30 LOC but adds maintenance. |
| Cycle detection in `workflow-validators.ts` | DFS + visited-set | Backend already uses Kahn's topological sort (`workflow_dtos.py:88-104`). Reuse the algorithm shape on FE for parity (CONTEXT D-19 rule 5). |

**Installation (Plan 01 only):**
```bash
cd Frontend2 && npm install @xyflow/react@latest
# concaveman optional — defer to plan-checkpoint feedback
```

## Architecture Patterns

### System Architecture Diagram

```
              ┌──────────────────────────────────────────────┐
              │  /projects/[id]?tab=lifecycle  (LifecycleTab) │
              │  /projects/[id]?tab=settings&sub=lifecycle    │
              │  /workflow-editor?projectId=X                  │
              └─────────────┬────────────────────────────────┘
                             │  TanStack Query
                             ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  Frontend2 PHASE 12 PLAN 01 SHARED INFRA                          │
   │                                                                    │
   │  services/      (HTTP layer — axios wrappers)                       │
   │   ├─ lifecycle-service.ts                                            │
   │   ├─ phase-gate-service.ts          (POST /phase-transitions)        │
   │   ├─ milestone-service.ts                                            │
   │   ├─ artifact-service.ts                                             │
   │   ├─ phase-report-service.ts        (PDF Blob)                       │
   │   └─ led-teams-service.ts                                            │
   │                                                                    │
   │  hooks/         (TanStack Query layer — cache + invalidation)        │
   │   ├─ use-milestones / use-artifacts / use-phase-reports              │
   │   ├─ use-phase-transitions  (Idempotency-Key state)                   │
   │   ├─ use-transition-authority  (Admin OR PM OR LedTeam — staleTime 5min)│
   │   ├─ use-led-teams                                                    │
   │   ├─ use-cycle-counters  (derives Map<nodeId,count> from /activity)    │
   │   ├─ use-editor-history  (in-mem undo/redo stack)                       │
   │   └─ use-criteria-editor  (local state + dirty + PATCH)                │
   │                                                                    │
   │  lib/lifecycle/  (PURE FUNCTIONS — zero React, zero HTTP)             │
   │   ├─ graph-traversal.ts     computeNodeStates()                       │
   │   ├─ workflow-validators.ts validateWorkflow()    (5 rules)            │
   │   ├─ cloud-hull.ts          computeHull()         (concave-hull)        │
   │   ├─ align-helpers.ts       5 align functions                           │
   │   └─ shortcuts.ts           keyboard map + Cmd/Ctrl detection            │
   │                                                                    │
   │  components/workflow-editor/ (REACT FLOW shell — dynamic-imported)     │
   │   ├─ workflow-canvas.tsx    <ReactFlow nodeTypes={...} edgeTypes={...} │
   │   ├─ phase-node.tsx         140×60 oklch div + 4-way handles            │
   │   ├─ phase-edge.tsx         SVG path with 3 dasharrays                  │
   │   └─ group-cloud-node.tsx   custom node-type = "group", concave-hull SVG│
   └─────────────┬─────────────────────────────────────────────────────┘
                 │
                 ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  Backend (Phase 9 SHIPPED + Phase 12 ADDITIVE CHANGE)             │
   │                                                                    │
   │  application/dtos/workflow_dtos.py                                   │
   │   └─ WorkflowEdge: + bidirectional: bool = False                      │
   │                    + is_all_gate: bool = False                         │
   │                                                                    │
   │  application/use_cases/execute_phase_transition.py                    │
   │   └─ honor bidirectional + is_all_gate in transition validation        │
   │                                                                    │
   │  infrastructure/database/seeder.py                                     │
   │   └─ emit edges with new fields (defaults false)                        │
   │                                                                    │
   │  NO NEW MIGRATION. NO CURRENT_SCHEMA_VERSION BUMP. NO _migrate_v1_to_v2 │
   └─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
Frontend2/
├── app/(shell)/workflow-editor/
│   ├── page.tsx                    # NEW — reads ?projectId=X, viewport gate
│   └── loading.tsx                 # OPTIONAL — Next.js loading file
├── app/(shell)/projects/[id]/page.tsx  # MODIFIED — mount real LifecycleTab
├── components/lifecycle/             # NEW
│   ├── lifecycle-tab.tsx
│   ├── summary-strip.tsx
│   ├── mini-metric.tsx
│   ├── overview-subtab.tsx
│   ├── milestones-subtab.tsx
│   ├── history-subtab.tsx
│   ├── artifacts-subtab.tsx
│   ├── phase-gate-expand.tsx
│   ├── evaluation-report-card.tsx
│   ├── criteria-editor-panel.tsx
│   └── viewport-fallback.tsx (only used by /workflow-editor)
├── components/workflow-editor/       # NEW
│   ├── editor-page.tsx
│   ├── workflow-canvas.tsx          # dynamic-imported
│   ├── phase-node.tsx
│   ├── phase-edge.tsx
│   ├── all-gate-pill.tsx
│   ├── cycle-counter-badge.tsx
│   ├── group-cloud-node.tsx
│   ├── bottom-toolbar.tsx
│   ├── right-panel.tsx
│   ├── flow-rules.tsx
│   ├── selection-panel.tsx
│   ├── validation-panel.tsx
│   ├── shortcuts-panel.tsx
│   ├── context-menu.tsx
│   ├── canvas-skeleton.tsx
│   ├── mode-banner.tsx
│   ├── minimap-wrapper.tsx
│   ├── color-swatch.tsx
│   └── tooltip.tsx                  # NEW lightweight wrapper
├── lib/lifecycle/                    # NEW PURE-LOGIC LIBS
│   ├── graph-traversal.ts
│   ├── workflow-validators.ts
│   ├── cloud-hull.ts
│   ├── align-helpers.ts
│   └── shortcuts.ts
├── hooks/                            # NEW (alongside existing)
│   ├── use-milestones.ts
│   ├── use-artifacts.ts
│   ├── use-phase-reports.ts
│   ├── use-phase-transitions.ts
│   ├── use-transition-authority.ts
│   ├── use-led-teams.ts
│   ├── use-cycle-counters.ts
│   ├── use-editor-history.ts
│   └── use-criteria-editor.ts
└── services/                         # NEW (alongside existing)
    ├── lifecycle-service.ts
    ├── phase-gate-service.ts
    ├── milestone-service.ts
    ├── artifact-service.ts
    ├── phase-report-service.ts
    └── led-teams-service.ts
```

### Pattern 1: Custom React Flow Renderer (Pretend the Library Has No Defaults)

**What:** Override every default visual via custom `nodeTypes` + `edgeTypes`. React Flow becomes pure plumbing.

**When to use:** Phase 12 — UI-SPEC mandates 1:1 prototype reproduction.

**Example:**

```tsx
// components/workflow-editor/workflow-canvas.tsx
"use client"
import { ReactFlow, Background, Controls, MiniMap, type NodeTypes, type EdgeTypes } from "@xyflow/react"
import "@xyflow/react/dist/style.css"  // base CSS — overridden via inline style + className
import { PhaseNode } from "./phase-node"
import { PhaseEdge } from "./phase-edge"
import { GroupCloudNode } from "./group-cloud-node"

// CRITICAL: define nodeTypes/edgeTypes OUTSIDE the component to avoid re-renders
// [CITED: reactflow.dev/api-reference/react-flow — "define nodeTypes outside"]
const NODE_TYPES: NodeTypes = { phase: PhaseNode, group: GroupCloudNode }
const EDGE_TYPES: EdgeTypes = { phase: PhaseEdge }

export function WorkflowCanvas({ workflow, readOnly, ...callbacks }) {
  return (
    <ReactFlow
      nodes={workflow.nodes}
      edges={workflow.edges}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      // Defaults disabled:
      defaultEdgeOptions={{ type: "phase" }}     // never fall through to React Flow's default
      proOptions={{ hideAttribution: true }}      // no "React Flow" watermark
      // Read-only locks:
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly}
      edgesUpdatable={!readOnly}
      {...callbacks}
    >
      <Background variant="dots" gap={20} color="color-mix(in oklch, var(--border-strong) 50%, transparent)" />
      {!readOnly && <Controls /* themed via CSS variables */ />}
      <MiniMap /* themed via CSS variables */ />
    </ReactFlow>
  )
}
```

**Pitfalls (verified, see Pitfalls section):** Defining `NODE_TYPES`/`EDGE_TYPES` inside the component re-renders the canvas every keystroke [CITED: reactflow.dev/api-reference/react-flow]. To hide a handle, use `visibility: hidden` or `opacity: 0` — NEVER `display: none` (React Flow needs the dimensions for connection logic) [CITED: github.com/xyflow/xyflow/discussions/2698].

### Pattern 2: 4-Way Handles per Node (CONTEXT D-12)

**What:** Each node exposes 8 handles total (4 positions × 2 directions). React Flow allows multiple `id`s at the same `position`.

**When to use:** Required for V-Model vertical verification edges + Spiral feedback loops.

**Example:**

```tsx
// components/workflow-editor/phase-node.tsx
import { Handle, Position } from "@xyflow/react"

export function PhaseNode({ data, selected }: NodeProps) {
  return (
    <div style={{ /* 140×60 oklch styling per UI-SPEC line 1184 */ }}>
      {/* 4-way handles — 8 ids total */}
      <Handle type="source" id="top-source" position={Position.Top} />
      <Handle type="target" id="top-target" position={Position.Top} />
      <Handle type="source" id="right-source" position={Position.Right} />
      <Handle type="target" id="right-target" position={Position.Right} />
      <Handle type="source" id="bottom-source" position={Position.Bottom} />
      <Handle type="target" id="bottom-target" position={Position.Bottom} />
      <Handle type="source" id="left-source" position={Position.Left} />
      <Handle type="target" id="left-target" position={Position.Left} />
      {/* node body */}
    </div>
  )
}
```

**Default visibility:** hidden until node hover (CSS `opacity: 0` + `:hover .react-flow__handle { opacity: 1 }`).

### Pattern 3: Dynamic Import with `ssr: false` (Next.js 16)

**What:** React Flow depends on `window`, `ResizeObserver`, `getBoundingClientRect`. Must defer to client.

**When to use:** Every entry point that mounts `WorkflowCanvas`.

**Example:**

```tsx
// app/(shell)/workflow-editor/page.tsx  OR  components/lifecycle/lifecycle-tab.tsx
"use client"
import dynamic from "next/dynamic"
import { CanvasSkeleton } from "@/components/workflow-editor/canvas-skeleton"

const WorkflowCanvas = dynamic(
  () => import("@/components/workflow-editor/workflow-canvas").then(m => m.WorkflowCanvas),
  { ssr: false, loading: () => <CanvasSkeleton /> }
)
// [CITED: Frontend2/node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md lines 39, 64-72]
```

**Pitfall:** `ssr: false` is "not allowed with `next/dynamic` in Server Components" [CITED: lazy-loading.md line 95]. The page or wrapper component MUST start with `"use client"`. Phase 11 D-36 already established this pattern for TipTap.

### Pattern 4: Theming Default Controls + MiniMap via CSS Variables (CONTEXT D-25)

**What:** React Flow's `<Controls/>` + `<MiniMap/>` ship default styles in `@xyflow/react/dist/style.css`. Override via class names that target `.react-flow__controls`, `.react-flow__minimap`, etc., using `var(--surface)`, `var(--border)`, `var(--shadow-lg)`.

**When to use:** Editor canvas only (read-only canvas in LifecycleTab can keep simpler defaults).

```css
/* In a scoped CSS module or globals.css addition (UI-SPEC says no global token additions, so use a scoped module) */
.workflowCanvasShell .react-flow__controls {
  background: var(--surface);
  box-shadow: var(--shadow-lg), inset 0 0 0 1px var(--border);
  border-radius: var(--radius-sm);
}
.workflowCanvasShell .react-flow__controls-button {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  color: var(--fg-muted);
}
```

### Pattern 5: Optimistic Update with Rollback (Phase 11 D-38 reuse)

```tsx
// hooks/use-milestones.ts  (mirror Phase 11 use-tasks pattern from hooks/use-tasks.ts:36-58)
export function useUpdateMilestone(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto) => milestoneService.update(dto),
    onMutate: async (dto) => {
      const key = ["milestones", projectId] as const
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData(key)
      qc.setQueryData(key, (old) => /* optimistic merge */)
      return { prev }
    },
    onError: (_err, _vars, ctx) => { if (ctx?.prev) qc.setQueryData(["milestones", projectId], ctx.prev) },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["milestones", projectId] }) },
  })
}
```

### Anti-Patterns to Avoid

- **Inline `nodeTypes`/`edgeTypes`** — re-renders the canvas every parent render [CITED: reactflow.dev/api-reference/react-flow]. Define at module top.
- **`display: none` on hidden handles** — breaks connection logic [CITED: github.com/xyflow/xyflow/discussions/2698].
- **Static import of React Flow** — SSR `ReferenceError: window is not defined`. Always `dynamic({ ssr: false })`.
- **Re-implementing the 3-role permission check per surface** — single source of truth = `use-transition-authority.ts` (CONTEXT D-03 + D-40).
- **Mutating workflow JSON directly in TanStack cache** — always go through PATCH + invalidate; cache mutations from React Flow's onChange handlers must NOT touch `qc.setQueryData(['project', id])` mid-edit.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph DnD + pan/zoom + minimap | Custom SVG event handlers | `@xyflow/react` (CONTEXT D-05) | Edge cases: pinch zoom, trackpad inertia, viewport transforms — months of engineering. |
| Cycle detection on flow edges | DFS visited-set | Backend uses Kahn's topological sort (`workflow_dtos.py:88-104`). Mirror in `workflow-validators.ts` for FE/BE parity. | Algorithm parity reduces "frontend says OK, backend says cycle" mismatches. |
| Concave hull from scratch | Convex hull (Graham scan) + padding | UI-SPEC line 1264-1267 endorses convex-hull-plus-padding baseline (~80 LOC). Upgrade to `concaveman` only if visual feels box-y. | Concave hulls are a research field; baseline is sufficient for ≤50 nodes. |
| ConfirmDialog | New dialog | Reuse `Frontend2/components/projects/confirm-dialog.tsx` [VERIFIED at this path] | Phase 10 D-25 already shipped. |
| Toast | New toast container | Reuse `Frontend2/components/toast/index.tsx::ToastProvider + useToast()` [VERIFIED at this path] | Phase 10 D-07 already shipped. |
| Idempotency-Key generator | UUID library | `crypto.randomUUID()` (Web Crypto API, available in all modern browsers and Node 18+) | No dep needed. |
| File upload | New upload helper | Reuse Phase 3 file-upload machinery (Phase 9 D-41 `Artifact.file_id`) | CONTEXT D-52. |
| PDF generation | Client-side PDF | Phase 9 D-58 fpdf2 sync endpoint | Reuse the existing `/phase-reports/{id}/pdf` Blob endpoint. |
| Auto-layout (dagre/ELK) | Full force-directed layout | Grid-snap + 5 align helpers (CONTEXT D-28) | Full auto-layout deferred to v2.1. |

**Key insight:** The Frontend2 stack is mature — the ONLY new dependency is `@xyflow/react`. Everything else (auth context, ConfirmDialog, ToastProvider, axios+interceptors, TanStack Query patterns, useApp/i18n, primitives) already ships from Phases 8/10/11.

## Runtime State Inventory

> Phase 12 is **additive** to existing Phase 9 backend. There is no rename/refactor work, BUT the schema additivity rule means we must verify that pre-existing in-memory and DB-stored workflows behave correctly with the new optional fields.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `process_config` JSONB column on `projects` table contains workflows whose `edges[i]` lack `bidirectional` and `is_all_gate`. Pydantic `default=False` applies on read. **No data migration needed** because Pydantic supplies defaults at validation time. | None — verified via `_normalize_process_config` lazy normalization on read (`Backend/app/domain/entities/project.py:110`). |
| Live service config | None | None. |
| OS-registered state | None | None. |
| Secrets/env vars | None new. Existing `NEXT_PUBLIC_API_URL` continues to be used. | None. |
| Build artifacts | New `@xyflow/react` will be installed via `npm install`. Existing `Frontend2/.next/` build cache should be cleaned on first build to avoid stale chunk metadata. | `rm -rf Frontend2/.next/` once after Plan 01 install. |

**Nothing found in 4 of 5 categories** — explicitly verified, not skipped. The only state surface is the JSONB column, and Pydantic defaults handle it without action.

## Common Pitfalls

### Pitfall 1: React Flow re-render storm from inline `nodeTypes`/`edgeTypes`
**What goes wrong:** Canvas re-mounts on every parent render. State (selected, dirty, undo stack) resets.
**Why it happens:** Inline `nodeTypes={{ phase: PhaseNode }}` creates a new object reference each render; React Flow detects the change and remounts.
**How to avoid:** Define `NODE_TYPES` and `EDGE_TYPES` as module-top constants. [CITED: reactflow.dev/api-reference/react-flow]
**Warning signs:** Canvas flickers on every keystroke in the right-panel Field; selection lost on type change.

### Pitfall 2: SSR `ReferenceError: window is not defined` on the editor route
**What goes wrong:** Static import of React Flow at the page boundary crashes the SSR build.
**Why it happens:** React Flow accesses `window` and `ResizeObserver` at module scope.
**How to avoid:** `dynamic({ ssr: false, loading: <CanvasSkeleton/> })` [CITED: Frontend2/node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md lines 64-72]. The wrapper component must include `"use client"`.
**Warning signs:** Build error during `next build`. Phase 11 D-36 TipTap pattern is precedent.

### Pitfall 3: 4-way handle ID collisions
**What goes wrong:** `<Handle id="top" />` on two different edges connected at the top; React Flow can't disambiguate, edges render at wrong endpoints.
**Why it happens:** Handle IDs must be unique per node and per direction. Both source and target handle at the same position need different IDs.
**How to avoid:** Use the `{position}-{direction}` convention from CONTEXT D-12 (e.g., `top-source`, `top-target`). React Flow allows multiple Handle components at the same Position with different IDs.
**Warning signs:** Edges snapping to unexpected handles after refresh.

### Pitfall 4: `display: none` on hidden handles breaks edge creation
**What goes wrong:** Hidden handles report `width: 0, height: 0`, breaking the edge-drag preview.
**Why it happens:** React Flow uses `getBoundingClientRect()` to compute connection geometry.
**How to avoid:** Use `visibility: hidden` or `opacity: 0` instead of `display: none` [CITED: github.com/xyflow/xyflow/discussions/2698].
**Warning signs:** Cannot drag from hidden handles.

### Pitfall 5: ResizeObserver loop error
**What goes wrong:** Console warning "ResizeObserver loop completed with undelivered notifications" floods the dev console.
**Why it happens:** React Flow + a custom node that resizes during render trigger a feedback loop.
**How to avoid:** Don't conditionally change node dimensions during render. PhaseNode is fixed 140×60 — keep it that way.
**Warning signs:** Console spam during canvas mount.

### Pitfall 6: Edge re-render storm when changing one edge property
**What goes wrong:** Selecting an edge re-renders all 50 edges because React Flow passes a new array reference.
**Why it happens:** Without `React.memo`, every edge component re-runs whenever the edges array changes.
**How to avoid:** Wrap `PhaseEdge` in `React.memo` with shallow prop comparison. Same for `PhaseNode`. [CITED: github.com/xyflow/xyflow/issues/4983]
**Warning signs:** Frame time creeps above 16ms during interaction in 50-node workflows.

### Pitfall 7: Cloud-hull O(n²) baseline at 50 nodes
**What goes wrong:** Concave hull recompute on every drag frame drops below 60fps.
**Why it happens:** Some concave-hull algorithms are O(n log n) (concaveman) but naive variants are O(n²).
**How to avoid:** Start with **convex hull (Graham scan, O(n log n)) + padding** as the baseline (UI-SPEC line 1264). Benchmark `cloud-hull.ts` with vitest `bench` against a 50-node fixture before deciding to upgrade to `concaveman`. Target: ≤16ms per recompute.
**Warning signs:** Frame drop during 50-node drag tests.

### Pitfall 8: Custom edge mid-point label positioning miscompute
**What goes wrong:** Label pill placed at the geometric midpoint of the bezier control polygon (`(sx+tx)/2, (sy+ty)/2`) drifts off the actual curve when the bezier has high curvature.
**Why it happens:** The control polygon midpoint ≠ the t=0.5 point on a cubic Bézier curve.
**How to avoid:** For Phase 12, the prototype's simple midpoint approximation is fine because all edges are roughly horizontal. If labels start to look off, use React Flow's `getBezierPath()` helper to get the t=0.5 point. [CITED: reactflow.dev/learn/customization/custom-edges]
**Warning signs:** Label drift on highly curved edges (rare in practice for Phase 12).

### Pitfall 9: JSONB read normalization with mode='before' Pydantic validators
**What goes wrong:** Existing in-memory or in-DB workflows lacking `bidirectional` / `is_all_gate` fail validation if the field has no default.
**Why it happens:** Without `default=False`, Pydantic raises a missing-field error on the first read.
**How to avoid:** Specify `default=False` directly on the `bidirectional` and `is_all_gate` fields in `Backend/app/application/dtos/workflow_dtos.py:24-29`. Pydantic populates the missing field automatically on every read path.
**Warning signs:** 500 errors on `GET /projects/{id}` for projects seeded before Phase 12.

### Pitfall 10: Seeder vs migration mismatch
**What goes wrong:** Test rows seeded by Phase 9 lack the new fields; tests pass; production rows seeded by Phase 12 have the fields; if a future Plan re-asserts the schema_version, the additive defaults silently mask a migration bug.
**Why it happens:** SPEC explicitly forbids `_migrate_v1_to_v2`. Pydantic defaults handle the gap.
**How to avoid:** Add a backend integration test in Plan 09 that creates a workflow without the fields, reads it via the entity, and asserts the defaulted booleans are visible. Document the test as the long-term canary. (See Validation Architecture section.)
**Warning signs:** Tests pass on freshly-seeded test DB but fail on a long-lived dev DB.

### Pitfall 11: Order of plan dependencies
**What goes wrong:** Plan 09 (workflow editor save) ships before Plan 08 (canvas primitive) → save flow has nothing to save.
**Why it happens:** Forgetting that the canvas primitive in Plan 01 is a *header*, but the editor wiring lives in plans 07-09.
**How to avoid:** Plan 01 ships the WorkflowCanvas primitive in **read-only mode only** (used by LifecycleTab). Plan 07 starts the editor mode. Plan 08 adds canvas DnD/edit interactions. Plan 09 wires save flow. Plan 10 adds preset templates + final polish.
**Warning signs:** Plan 02 (Phase Gate UI) blocks because `use-transition-authority` was scheduled into Plan 03 instead of Plan 01.

### Pitfall 12: Text-only beforeunload dialog (browser-controlled)
**What goes wrong:** Custom message in `beforeunload` event ignored by all modern browsers; only the generic "Leave site?" prompt shows.
**Why it happens:** Browsers strip custom messages for security since 2017+.
**How to avoid:** UI-SPEC line 729 already documents this: "browser-controlled, T() not available". The Next.js router-intercept ConfirmDialog handles in-app navigation; `beforeunload` only handles browser close/refresh.
**Warning signs:** Custom Turkish message expected to appear in the browser dialog.

### Pitfall 13: `crypto.randomUUID()` in old-Safari fallback
**What goes wrong:** Safari < 15.4 lacks `crypto.randomUUID()`.
**Why it happens:** API was added in Safari 15.4 (March 2022).
**How to avoid:** Frontend2 already targets modern browsers; v2.0 has no Safari < 15.4 support contract. Document the assumption and fall through to a fallback only if a SoT review surfaces it. Optional fallback:
```ts
const newUuid = () => (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)
```
**Warning signs:** Phase Gate retries fail on old Safari with `crypto.randomUUID is not a function`.

## Code Examples

### Pattern A: Pure BFS for `computeNodeStates` (EDIT-04)

```ts
// lib/lifecycle/graph-traversal.ts
export type NodeState = "active" | "past" | "future" | "unreachable"

export interface ComputeNodeStatesInput {
  workflow: { mode: string; nodes: Array<{ id: string; is_archived?: boolean }>; edges: Array<{ source: string; target: string; type: string; bidirectional?: boolean }> }
  phaseTransitions: Array<{ extra_metadata: { source_phase_id: string; target_phase_id: string } }>  // sorted oldest→newest
}

export function computeNodeStates(input: ComputeNodeStatesInput): Map<string, NodeState> {
  const result = new Map<string, NodeState>()
  const { workflow, phaseTransitions } = input
  const activeIds = new Set<string>()
  const visitedHistory = new Set<string>()  // any node ever visited

  // Build adjacency (forward + bidirectional reverse)
  const adj = new Map<string, string[]>()
  for (const e of workflow.edges) {
    if (!adj.has(e.source)) adj.set(e.source, [])
    adj.get(e.source)!.push(e.target)
    if (e.bidirectional) {
      if (!adj.has(e.target)) adj.set(e.target, [])
      adj.get(e.target)!.push(e.source)
    }
  }

  // Replay transitions to derive active set
  for (const t of phaseTransitions) {
    visitedHistory.add(t.extra_metadata.source_phase_id)
    visitedHistory.add(t.extra_metadata.target_phase_id)
    activeIds.delete(t.extra_metadata.source_phase_id)
    activeIds.add(t.extra_metadata.target_phase_id)
  }

  // If no transitions yet → first isInitial = active (per SPEC line 78)
  if (phaseTransitions.length === 0) {
    const initial = workflow.nodes.find((n: any) => n.isInitial)
    if (initial) activeIds.add(initial.id)
  }

  // Reachability BFS from any active node (forward only)
  const reachable = new Set<string>(activeIds)
  const queue = [...activeIds]
  while (queue.length) {
    const id = queue.shift()!
    for (const next of adj.get(id) ?? []) {
      if (!reachable.has(next)) {
        reachable.add(next)
        queue.push(next)
      }
    }
  }

  // Classify
  for (const node of workflow.nodes) {
    if (node.is_archived) {
      result.set(node.id, "unreachable")
      continue
    }
    if (activeIds.has(node.id)) result.set(node.id, "active")
    else if (visitedHistory.has(node.id)) result.set(node.id, "past")
    else if (reachable.has(node.id)) result.set(node.id, "future")
    else result.set(node.id, "unreachable")
  }

  // Sequential modes — collapse to exactly 1 active (most-recent target)
  if ((workflow.mode === "sequential-locked" || workflow.mode === "continuous") && activeIds.size > 1 && phaseTransitions.length) {
    const latest = phaseTransitions[phaseTransitions.length - 1].extra_metadata.target_phase_id
    for (const id of activeIds) if (id !== latest) result.set(id, "past")
  }

  return result
}
```

**Edge cases covered:**
- Linear `A → B → C`, transition `A→B`: `{A: past, B: active, C: future}`.
- Disconnected node `D`: not reachable from any active → `unreachable`.
- Bidirectional edge `A ↔ B` with `A→B` then `B→A`: latest target is `A`, so `A` active.
- Cyclic feedback: feedback edges allowed in flexible/sequential-flexible; the BFS uses ALL edges for reachability.
- Parallel actives: V-Model has two actives simultaneously (e.g., "Module Design" + "Unit Test") — the active set retains both because no closing transition has fired for either.
- Performance: O(N + E). For N=100, E≈300 edges: <50ms guaranteed.

### Pattern B: 5-Rule Validator (EDIT-03 rule 5 + general)

```ts
// lib/lifecycle/workflow-validators.ts
export interface ValidationResult { errors: Array<{ rule: number; detail: string }>; warnings: Array<{ rule: number; detail: string }> }

export function validateWorkflow(wf: WorkflowConfig): ValidationResult {
  const errors: Array<{ rule: number; detail: string }> = []
  const warnings: Array<{ rule: number; detail: string }> = []

  // Rule 1: ≥1 node
  if (wf.nodes.length === 0) errors.push({ rule: 1, detail: "At least 1 node required" })

  // Rule 2: unique node IDs
  const ids = wf.nodes.map(n => n.id)
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupes.length) errors.push({ rule: 2, detail: `Duplicate node IDs: ${[...new Set(dupes)].join(", ")}` })

  // Rule 3: edge endpoints reference non-archived nodes (is_all_gate exempts source)
  const active = new Set(wf.nodes.filter(n => !n.is_archived).map(n => n.id))
  for (const e of wf.edges) {
    if (!e.is_all_gate && !active.has(e.source)) errors.push({ rule: 3, detail: `Edge ${e.id}: source '${e.source}' references missing or archived node` })
    if (!active.has(e.target)) errors.push({ rule: 3, detail: `Edge ${e.id}: target '${e.target}' references missing or archived node` })
  }

  // Rule 4: ≥1 isInitial AND ≥1 isFinal
  if (!wf.nodes.some(n => n.isInitial)) errors.push({ rule: 4, detail: "No isInitial node defined" })
  if (!wf.nodes.some(n => n.isFinal)) errors.push({ rule: 4, detail: "No isFinal node defined" })

  // Rule 5: in sequential-locked / sequential-flexible, flow edges must be acyclic (Kahn topo sort)
  if (wf.mode === "sequential-locked" || wf.mode === "sequential-flexible") {
    const flowEdges = wf.edges.filter(e => e.type === "flow")
    if (hasCycle(active, flowEdges)) errors.push({ rule: 5, detail: "Flow edges form a cycle" })
  } else if (wf.mode === "flexible") {
    const flowEdges = wf.edges.filter(e => e.type === "flow")
    if (hasCycle(active, flowEdges)) warnings.push({ rule: 5, detail: "Flow edges form a cycle (warning in flexible mode)" })
  }

  return { errors, warnings }
}

function hasCycle(nodeIds: Set<string>, edges: Array<{ source: string; target: string }>): boolean {
  // Mirror backend Kahn's topological sort (workflow_dtos.py:88-104)
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()
  for (const id of nodeIds) { inDegree.set(id, 0); adj.set(id, []) }
  for (const e of edges) {
    adj.get(e.source)?.push(e.target)
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
  }
  const queue: string[] = [...nodeIds].filter(id => inDegree.get(id) === 0)
  let processed = 0
  while (queue.length) {
    const n = queue.shift()!
    processed++
    for (const m of adj.get(n) ?? []) {
      inDegree.set(m, inDegree.get(m)! - 1)
      if (inDegree.get(m) === 0) queue.push(m)
    }
  }
  return processed !== nodeIds.size
}
```

**FE/BE parity:** identical algorithm to `Backend/app/application/dtos/workflow_dtos.py:88-104`, verified line-by-line.

### Pattern C: Concave Hull Baseline (D-22 cloud cloud)

```ts
// lib/lifecycle/cloud-hull.ts
// Baseline: convex hull (Graham scan O(n log n)) + padding + d3-curve smoothing
import { line, curveCardinalClosed } from "d3-shape"

export function computeHull(points: Array<{ x: number; y: number }>, padding = 16): string {
  if (points.length < 2) return ""
  // Inflate each point into 4 corner samples (top/right/bottom/left of node bbox)
  // Graham scan returns the hull
  const hull = grahamScan(inflateCorners(points, padding))
  // Apply d3-curve cardinal-closed for smooth bezier
  const lineGen = line<typeof hull[0]>().x(p => p.x).y(p => p.y).curve(curveCardinalClosed.tension(0.5))
  return lineGen(hull) ?? ""
}

function inflateCorners(points: Array<{ x: number; y: number }>, padding: number) {
  const out: Array<{ x: number; y: number }> = []
  for (const p of points) {
    out.push({ x: p.x - padding, y: p.y - padding })
    out.push({ x: p.x + 140 + padding, y: p.y - padding })
    out.push({ x: p.x + 140 + padding, y: p.y + 60 + padding })
    out.push({ x: p.x - padding, y: p.y + 60 + padding })
  }
  return out
}

// Standard Graham scan — ~30 LOC, well-known reference impl
function grahamScan(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> { /* ... */ }
```

**Bench target (vitest `bench`):** 50-node fixture × 100 runs → median <16ms.

### Pattern D: `use-transition-authority` Hook (D-03)

```ts
// hooks/use-transition-authority.ts
import { useAuth } from "@/context/auth-context"
import { useLedTeams } from "./use-led-teams"

export function useTransitionAuthority(project: { id: number; manager_id?: number | null } | null | undefined) {
  const { user } = useAuth()
  const { data: ledTeams } = useLedTeams()
  if (!user || !project) return false
  if (user.role === "Admin") return true
  if (project.manager_id === user.id) return true
  return Boolean(ledTeams?.some(t => t.project_ids?.includes(project.id)))
}
```

```ts
// hooks/use-led-teams.ts
export function useLedTeams() {
  return useQuery({
    queryKey: ["users", "me", "led-teams"],
    queryFn: ledTeamsService.getMine,
    staleTime: 5 * 60 * 1000,  // 5 min — roles don't change often (CONTEXT D-03)
  })
}
```

### Pattern E: Phase Gate Mutation with Idempotency-Key (D-42)

```ts
// hooks/use-phase-transitions.ts
export function usePhaseTransition(projectId: number) {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const [idempotencyKey, setIdempotencyKey] = React.useState<string | null>(null)

  const reset = React.useCallback(() => setIdempotencyKey(null), [])
  const open = React.useCallback(() => setIdempotencyKey(crypto.randomUUID()), [])

  const mutation = useMutation({
    mutationFn: (dto) => phaseGateService.execute(projectId, dto, idempotencyKey!),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] })
      qc.invalidateQueries({ queryKey: ["activity", projectId] })
      showToast({ variant: "success", message: `Geçiş tamam. Aktif faz: ${data.target_phase_name}` })
      reset()
    },
    onError: (err) => {
      // 409 / 422 / 429 / 400 / network — see UI-SPEC Phase Gate copy table
    },
  })
  return { idempotencyKey, open, reset, mutation }
}
```

### Pattern F: Backend Pydantic Additive Change (no migration)

```python
# Backend/app/application/dtos/workflow_dtos.py:24-29 — MODIFIED
class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    type: Literal["flow", "verification", "feedback"] = "flow"
    label: Optional[str] = None
    bidirectional: bool = False        # NEW — Phase 12 D-16
    is_all_gate: bool = False          # NEW — Phase 12 D-17
```

```python
# Backend/app/application/use_cases/execute_phase_transition.py — MODIFIED step 4
# After existing source/target archival check, add a lookup for is_all_gate semantics:
edges = workflow.get("edges", [])
direct_edge = next((e for e in edges if e["source"] == dto.source_phase_id and e["target"] == dto.target_phase_id), None)
reverse_edge = next((e for e in edges if e["source"] == dto.target_phase_id and e["target"] == dto.source_phase_id and e.get("bidirectional")), None)
all_gate_edge = next((e for e in edges if e.get("is_all_gate") and e["target"] == dto.target_phase_id), None)
if not (direct_edge or reverse_edge or all_gate_edge):
    raise ArchivedNodeReferenceError(
        node_id=dto.target_phase_id,
        reason="No edge connects source to target (direct, bidirectional, or is_all_gate)"
    )
```

```python
# Backend/app/infrastructure/database/seeder.py — MODIFIED (around lines 274-290)
# When seeding the waterfall + scrum + kanban + v-model + spiral templates' default_workflow.edges,
# emit each edge with explicit defaults:
"edges": [
    {"id": "e1", "source": "req", "target": "design", "type": "flow", "label": None,
     "bidirectional": False, "is_all_gate": False},
    # ...same for every other seeded edge
]
```

**No `_migrate_v1_to_v2` is added.** **No `CURRENT_SCHEMA_VERSION` bump.** Existing JSONB rows lacking the fields are read correctly because Pydantic defaults apply on every validation pass (`@model_validator(mode='before')` in Project entity).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `phaseMap = { initiation: 0, planning: 1, ... }` (prototype lifecycle-tab.jsx:17) | Pure BFS via `computeNodeStates()` (EDIT-04) | Phase 12 | Methodology-agnostic; supports parallel actives, feedback loops, archived nodes. |
| 2-handle horizontal nodes (prototype workflow-editor.jsx:91-92) | 4-way (8-handle) node design (CONTEXT D-12) | Phase 12 | Required for V-Model vertical edges + Spiral feedback loops. |
| Sharp dashed-rectangle group (prototype workflow-editor.jsx:50-58) | Smooth concave-hull cloud (CONTEXT D-22) | Phase 12 | Live morph during drag; matches user-requested "thought bubble" aesthetic. |
| Sequential-locked + flexible only | + sequential-flexible mode (Phase 9 backend; Phase 12 UI surfaces) | Phase 12 | V-Model and modified Waterfall workflows now expressible. |
| Single active phase | Parallel actives in flexible / sequential-flexible (D-10) | Phase 12 | V-Model "Module Design" + "Unit Test" simultaneous. |
| `_migrate_v1_to_v2` schema migration | **Pure additive Pydantic defaults** (SPEC override of CONTEXT D-18) | Phase 12 | Zero migration risk; zero downtime. |
| Phase Gate via /api/projects/{id}/transitions plus polling | Optimistic + 409 + refetch (D-44) | Phase 9/12 | No WebSocket dependency. |

**Deprecated/outdated:**
- `parentNode` prop on React Flow nodes — renamed to `parentId` in v11.11.0 [CITED: reactflow.dev sub-flows]. Use `parentId` for all new code.
- `reactflow` package — renamed to `@xyflow/react` in v12 [CITED: reactflow.dev/learn/troubleshooting/migrate-to-v12].

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `concaveman` is ~3KB gzipped and MIT licensed | Standard Stack — Supporting | UI-SPEC says ~3KB; verify `npm view concaveman license` + Bundlephobia before adding. Risk: bundle bloat, license incompatibility. |
| A2 | `d3-curve` is transitively present via Phase 11 d3 deps | Standard Stack — Supporting | If not present, must `npm install d3-shape` (~5KB) or hand-roll Catmull-Rom. Verify with `npm ls d3-shape`. |
| A3 | React Flow v12.10.x is the latest stable as of plan execution | Standard Stack — Core | Versions may shift; pin during Plan 01 install. |
| A4 | `crypto.randomUUID()` is available in target browsers (Safari ≥15.4) | Code Examples — Pattern E + Pitfall 13 | If a user runs old Safari, Phase Gate retries break. Mitigation: optional fallback shown in Pitfall 13. |
| A5 | Phase 9 audit log entries with `extra_metadata.source_phase_id` are sorted oldest→newest by the activity endpoint | Code Examples — Pattern A | If sort order differs, BFS replay produces wrong active set. Verify in `use-cycle-counters` integration test by asserting `activity[0].created_at < activity[N-1].created_at`. |
| A6 | The Phase 9 endpoint shape `extra_metadata.source_phase_id` matches the frontend assumption | Activity Feed Aggregation | If the field is named differently (e.g., `source_phase` vs `source_phase_id`), aggregation returns 0 for every node. Verify by adding an integration test that POSTs a transition and asserts the audit_log row has the expected key. |
| A7 | `Frontend2/components/projects/confirm-dialog.tsx` is the canonical ConfirmDialog (UI-SPEC says `components/toast/confirm-dialog.tsx` "verify path during plan") | Don't Hand-Roll table | Path differs from UI-SPEC line 88; need to confirm in Plan 01. The actual location verified during research is `Frontend2/components/projects/confirm-dialog.tsx`. |

## Open Questions (RESOLVED)

1. **Concave-hull vs convex-hull-plus-padding final choice**
   - What we know: UI-SPEC + CONTEXT both endorse convex-hull-plus-padding as v1; concaveman is an upgrade option.
   - What's unclear: Whether the convex-hull baseline produces a "thought bubble" feel at small node counts (3-5 nodes) — the visual difference between convex and concave hulls vanishes for small clusters.
   - Recommendation: Ship the convex-hull baseline. Capture screenshots of 3 / 8 / 20 / 50-node groups during plan-checkpoint; if any look "boxy", swap in concaveman in Plan 09 polish.
   - **RESOLVED:** Ship convex-hull-plus-padding baseline in Plan 12-01. Capture screenshots during Plan 12-08 cloud morph implementation. Upgrade to `concaveman` (~3 KB gzipped, ISC license) only if convex-hull visual leaves "ear-shaped" gaps when grouping >=4 nodes — that decision is taken by visual inspection during Plan 12-10 polish, not as a separate plan.

2. **Concrete React Flow version pin**
   - What we know: latest stable is in the 12.x line; v12.10.1 was released Feb 2026 [CITED: web search 2026-04-25].
   - What's unclear: Whether a 12.11+ release lands between research and execution. Phase 9 / Phase 11 already pinned other deps to specific versions.
   - Recommendation: Plan 01 task: "Run `npm view @xyflow/react version` immediately before install; record exact version in Plan 01 acceptance notes."
   - **RESOLVED:** Plan 12-01 Task 1 first step runs `npm view @xyflow/react version` and pins the latest stable 12.x release. As of 2026-04-25, latest stable is 12.10.x. The plan explicitly does NOT hard-pin a version in advance — pin time is at install time so we always get the latest patch.

3. **`Frontend2/components/projects/confirm-dialog.tsx` path vs UI-SPEC `components/toast/confirm-dialog.tsx`**
   - What we know: research confirmed the ConfirmDialog actually lives at `Frontend2/components/projects/confirm-dialog.tsx` (verified file read).
   - What's unclear: Whether UI-SPEC line 88 is wrong about the path or whether a parallel ConfirmDialog also exists in `components/toast/`.
   - Recommendation: Plan 01 task: import from `Frontend2/components/projects/confirm-dialog.tsx`; if a `components/toast/confirm-dialog.tsx` is later found, harmonize and remove the duplicate.
   - **RESOLVED:** The component lives at `Frontend2/components/projects/confirm-dialog.tsx` (verified file path 2026-04-25). UI-SPEC line 88 reference to `components/toast/confirm-dialog.tsx` is an editorial slip and is corrected here. Plans 02 / 05 / 06 / 09 / 10 import from `@/components/projects/confirm-dialog`. No need to relocate the component — keep the existing path.

4. **Whether `task-row.tsx` (MTTaskRow compact, Phase 11 D-32) accepts a `compact` prop or a different mode flag**
   - What we know: SPEC LIFE-04 says reuse "MTTaskRow compact" for History task details.
   - What's unclear: Whether the existing component accepts a `compact?: boolean` prop, a `density="compact"` mode, or requires a new wrapper.
   - Recommendation: Plan 04 (History sub-tab) starts with reading `Frontend2/components/my-tasks/task-row.tsx`; if a compact mode doesn't exist, add a small `compact` prop in the same plan (one-line conditional on padding/font-size).
   - **RESOLVED:** Plan 12-04 Task 1 begins with reading `Frontend2/components/my-tasks/task-row.tsx`. If a `compact` mode does not yet exist, the plan adds an optional prop `compact?: boolean` to MTTaskRow with a documented size delta (see `12-UI-SPEC.md` line 1380 for the History compact spec). The plan ships the prop addition as the first edit in Task 1 so subsequent History rendering can use it. No separate primitive plan is needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend2 build | ✓ (assumed; project already builds) | — | — |
| npm | Plan 01 install | ✓ | — | — |
| `@xyflow/react` | Workflow Editor | ✗ — NEW INSTALL | — | None — required by EDIT-01..06 |
| `next` 16 | Frontend2 | ✓ | 16.2.4 | — |
| `react` 19 | Frontend2 | ✓ | 19.2.4 | — |
| `vitest` | Pure-logic + RTL tests | ✓ | 1.6.0 | — |
| `pytest` | Backend tests | ✓ (Phase 9 establishes) | — | — |
| `crypto.randomUUID()` (Web Crypto API) | Idempotency-Key | ✓ in modern browsers + Node 18+ | — | Math.random fallback (Pitfall 13) |
| `concaveman` | Cloud hull (optional) | ✗ | — | Convex-hull-plus-padding baseline (recommended default) |
| `d3-shape` (curve smoothing) | Cloud hull | [ASSUMED present transitively] — verify with `npm ls d3-shape` | — | Hand-rolled Catmull-Rom (~30 LOC) |

**Missing dependencies with no fallback:** None — all blockers have a viable path.

**Missing dependencies with fallback:**
- `concaveman` → use convex-hull-plus-padding baseline (UI-SPEC endorsement)
- `d3-shape` → hand-roll smoothing if not transitively installed

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Frontend framework | Vitest 1.6.0 + @testing-library/react 16.3.2 [VERIFIED: `Frontend2/package.json:64-65`] |
| Frontend config file | `Frontend2/vitest.config.ts` (assumed present from Phase 11) |
| Frontend quick run command | `cd Frontend2 && npm run test -- <pattern>` |
| Frontend full suite command | `cd Frontend2 && npm test` |
| Backend framework | pytest (Phase 9 baseline) |
| Backend full suite command | `cd Backend && python -m pytest` |
| Phase gate | Full Frontend2 + Backend suite green before `/gsd-verify-work` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIFE-01 | Criteria editor save round-trip | RTL component + integration | `npm run test -- criteria-editor-panel` | ❌ Wave 0 (`Frontend2/__tests__/criteria-editor-panel.test.tsx`) |
| LIFE-01 | `enable_phase_assignment` toggle PATCH | RTL component | same | ❌ Wave 0 |
| LIFE-02 | Phase Gate happy path (auto criteria pass) | RTL component | `npm run test -- phase-gate-expand` | ❌ Wave 0 |
| LIFE-02 | Phase Gate sequential-locked override flow | RTL component | same | ❌ Wave 0 |
| LIFE-02 | Phase Gate 409 / 422 / 429 error matrix | RTL component | same | ❌ Wave 0 |
| LIFE-02 | Idempotency-Key generated once per session | RTL component | same | ❌ Wave 0 |
| LIFE-02 | Backend `bidirectional` + `is_all_gate` honored in transition validation | Backend pytest integration | `pytest tests/test_execute_phase_transition.py::test_all_gate_allows_any_source` | ❌ Wave 0 (`Backend/tests/test_execute_phase_transition.py`) |
| LIFE-03 | Zero-task phase metric `---` | RTL component (snapshot) | `npm run test -- mini-metric` | ❌ Wave 0 |
| LIFE-03 | Zero-task gate "Uygulanamaz" criteria + info banner | RTL component | `npm run test -- phase-gate-expand` | shared file |
| LIFE-04 | History Collapsible lazy-fetch on first expand | RTL component | `npm run test -- history-subtab` | ❌ Wave 0 |
| LIFE-04 | Subsequent expands hit TanStack cache (no second network) | RTL component | same | shared |
| LIFE-05 | Milestone CRUD optimistic + rollback | RTL component | `npm run test -- milestones-subtab` | ❌ Wave 0 |
| LIFE-05 | Timeline Gantt renders milestone flag lines | RTL component | `npm run test -- timeline-tab` | ✓ existing Phase 11 (extend) |
| LIFE-06 | Artifact inline expand + status SegmentedControl save | RTL component | `npm run test -- artifacts-subtab` | ❌ Wave 0 |
| LIFE-06 | File upload single-file constraint | RTL component | same | shared |
| LIFE-07 | Evaluation Report auto-prefill | RTL component | `npm run test -- evaluation-report-card` | ❌ Wave 0 |
| LIFE-07 | PDF Blob download trigger | RTL component | same | shared |
| LIFE-07 | Save 30s rate-limit countdown | RTL component | same | shared |
| EDIT-01 | Edge type SegmentedControl writes back to workflow | RTL component | `npm run test -- selection-panel` | ❌ Wave 0 |
| EDIT-01 | Stroke dasharray matches type (visual snapshot OK) | RTL component | `npm run test -- phase-edge` | ❌ Wave 0 |
| EDIT-02 | Group create via 5 entry points | RTL component | `npm run test -- group-cloud-node` | ❌ Wave 0 |
| EDIT-02 | Cloud-hull recompute on drag | vitest bench | `npm run test -- cloud-hull.bench` | ❌ Wave 0 |
| EDIT-02 | Drop-association policy (drag node out of group) | RTL component | shared `group-cloud-node` | shared |
| EDIT-03 | sequential-flexible mode validator (rule 5) | unit (pure) | `npm run test -- workflow-validators` | ❌ Wave 0 |
| EDIT-03 | sequential-flexible feedback transition allowed | Backend pytest | `pytest tests/test_execute_phase_transition.py::test_sequential_flexible_feedback` | shared backend file |
| EDIT-04 | `computeNodeStates` linear / disconnected / cyclic / parallel-actives | unit (pure) | `npm run test -- graph-traversal` | ❌ Wave 0 |
| EDIT-04 | `computeNodeStates` 100-node benchmark <50ms | vitest bench | `npm run test -- graph-traversal.bench` | shared |
| EDIT-05 | Multiple actives ring rendering | RTL component | `npm run test -- workflow-canvas` | ❌ Wave 0 |
| EDIT-06 | Cycle counter aggregation `Map<nodeId,count>` | unit (pure) | `npm run test -- use-cycle-counters` (or pure helper) | ❌ Wave 0 |
| EDIT-06 | Badge visible only when count ≥ 2 | RTL component | `npm run test -- cycle-counter-badge` | ❌ Wave 0 |
| EDIT-07 | Preset replace ConfirmDialog + canvas swap | RTL component | `npm run test -- editor-page` | ❌ Wave 0 |
| Backend additive | Pre-existing edges read with default `bidirectional=False, is_all_gate=False` | pytest integration | `pytest tests/test_workflow_edge_defaults.py` | ❌ Wave 0 |
| Backend additive | Seeder emits new fields explicitly | pytest integration | `pytest tests/test_seeder.py::test_workflow_edges_have_v2_fields` | ❌ Wave 0 (extend if exists) |
| Pure logic | `align-helpers.ts` 5 functions | unit | `npm run test -- align-helpers` | ❌ Wave 0 |
| Pure logic | `cloud-hull.ts` baseline + bench | unit + bench | `npm run test -- cloud-hull` | ❌ Wave 0 |
| Pure logic | `shortcuts.ts` Cmd/Ctrl detection | unit | `npm run test -- shortcuts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test -- <changed-file-pattern>` (Vitest is sub-second per file)
- **Per wave merge:** `npm test` (full Frontend2 suite) + `pytest` (full Backend suite)
- **Phase gate:** Full Frontend2 + Backend suites green; manual UAT click-through checklist (14 rows) signed off before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `Frontend2/__tests__/lib/lifecycle/graph-traversal.test.ts` — 6 cases (linear, disconnected, cyclic, parallel-actives, sequential-locked-collapse, archived-skip)
- [ ] `Frontend2/__tests__/lib/lifecycle/graph-traversal.bench.ts` — 100-node fixture <50ms
- [ ] `Frontend2/__tests__/lib/lifecycle/workflow-validators.test.ts` — 5 rules × ok/fail = 10 cases
- [ ] `Frontend2/__tests__/lib/lifecycle/cloud-hull.test.ts` + `cloud-hull.bench.ts` — 50-node fixture ≤16ms
- [ ] `Frontend2/__tests__/lib/lifecycle/align-helpers.test.ts` — 5 align functions
- [ ] `Frontend2/__tests__/lib/lifecycle/shortcuts.test.ts` — Cmd/Ctrl detection across `navigator.platform` mocks
- [ ] `Frontend2/__tests__/hooks/use-cycle-counters.test.ts` — aggregation pure helper
- [ ] `Frontend2/__tests__/hooks/use-transition-authority.test.tsx` — 3-role composition mock
- [ ] `Frontend2/__tests__/components/lifecycle/phase-gate-expand.test.tsx` — error matrix + override + idempotency
- [ ] `Frontend2/__tests__/components/lifecycle/criteria-editor-panel.test.tsx` — save round-trip
- [ ] `Frontend2/__tests__/components/lifecycle/milestones-subtab.test.tsx` — optimistic + rollback
- [ ] `Frontend2/__tests__/components/lifecycle/history-subtab.test.tsx` — lazy-fetch
- [ ] `Frontend2/__tests__/components/lifecycle/artifacts-subtab.test.tsx` — inline expand
- [ ] `Frontend2/__tests__/components/lifecycle/evaluation-report-card.test.tsx` — auto-prefill + PDF + save
- [ ] `Frontend2/__tests__/components/workflow-editor/phase-node.test.tsx` — state ring rendering
- [ ] `Frontend2/__tests__/components/workflow-editor/phase-edge.test.tsx` — 3 dasharray + bidirectional + all-gate
- [ ] `Frontend2/__tests__/components/workflow-editor/group-cloud-node.test.tsx` — 5 group entry points + drop-association
- [ ] `Frontend2/__tests__/components/workflow-editor/cycle-counter-badge.test.tsx` — visibility rule
- [ ] `Frontend2/__tests__/components/workflow-editor/editor-page.test.tsx` — preset replace flow
- [ ] `Backend/tests/test_execute_phase_transition.py::test_all_gate_allows_any_source`
- [ ] `Backend/tests/test_execute_phase_transition.py::test_bidirectional_pair_wise`
- [ ] `Backend/tests/test_execute_phase_transition.py::test_sequential_flexible_feedback`
- [ ] `Backend/tests/test_workflow_edge_defaults.py` — pre-existing edges read with defaulted booleans
- [ ] `Backend/tests/test_seeder.py::test_workflow_edges_have_v2_fields` — seeder emits new fields

*(Existing Phase 11 test infra covers TanStack provider mounting, vitest config, jsdom env. Phase 12 reuses without changes.)*

## Pitfalls / Landmines

1. **React Flow re-render storm from inline `nodeTypes`/`edgeTypes`** — define constants at module top.
2. **SSR `ReferenceError: window`** — `dynamic({ ssr: false })` mandatory; wrapper has `"use client"`.
3. **4-way handle ID collisions** — `{position}-{direction}` convention.
4. **`display: none` on hidden handles breaks edge creation** — use `visibility: hidden` or `opacity: 0`.
5. **ResizeObserver loop error** — keep node dimensions fixed during render (140×60).
6. **Edge re-render storm on selection** — `React.memo` on `PhaseEdge` and `PhaseNode`.
7. **Cloud-hull O(n²) baseline at 50 nodes** — bench against 16ms; concaveman as upgrade path.
8. **Custom edge mid-point label drift** — fine for prototype shapes; use `getBezierPath()` t=0.5 if needed.
9. **JSONB read normalization** — Pydantic `default=False` is the entire defense.
10. **Seeder vs migration mismatch** — add a long-term canary integration test (Wave 0).
11. **Order of plan dependencies** — Plan 01 ships shared infra; backend additive change in Plan 09 BEFORE save UI in Plan 10.
12. **Custom message in `beforeunload`** — browser-controlled; use ConfirmDialog for in-app navigation.
13. **`crypto.randomUUID()` on Safari < 15.4** — fallback documented; Frontend2 modern-browser policy.
14. **Methodology field hard-block at FE** — D-60 read-only; Settings > General must remove the editable input.
15. **`is_all_gate` source bypass in validation rule 3** — frontend validator must exempt `is_all_gate=true` edges from the "source must be active" check (already encoded in Pattern B).
16. **`use-cycle-counters` empty-result handling** — when there are zero `phase_transition` entries (brand-new project), return an empty Map and short-circuit the badge rendering. Don't crash on `undefined.groupBy`.
17. **Permission hook + suspense** — `useTransitionAuthority` calls `useLedTeams()` which is a TanStack Query hook. While loading, return `false` (deny). Don't suspend the entire LifecycleTab.
18. **TanStack Query key for `/activity` endpoint** — must include `projectId` AND filter `type[]=phase_transition` in the key (e.g., `["activity", projectId, { type: ["phase_transition"] }]`) to avoid cache collisions with future activity-tab consumers.
19. **Sequential-locked mode collapses parallel actives** — the BFS function must demote secondary actives to "past" only in `sequential-locked` and `continuous` modes (Pattern A).
20. **`workflow.mode === "continuous"` hides Phase Gate button at TWO levels** — `SummaryStrip` hides the trigger AND `PhaseGateExpand` 400 handler shows the AlertBanner safety net (UI-SPEC line 493).
21. **`is_archived` vs `isArchived` field naming** — backend uses snake_case (`is_archived`, `is_all_gate`); frontend should map to camelCase (`isArchived`, `isAllGate`) at the service layer to avoid case-mismatch bugs (Phase 10 service-mapping pattern from `services/project-service.ts:50-72`).
22. **React Flow's `parentId` ordering requirement** — parent nodes must appear before their children in the `nodes` array [CITED: reactflow.dev sub-flows]. The save flow must topologically order nodes by parent depth before PATCH.

## Plan-by-Plan Sketch

The 10 plans below match CONTEXT D-01 sequencing with refinements drawn from this research. Each plan's headline is followed by the key files it ships and the key tests that demonstrate its acceptance.

### Plan 12-01: Shared Infra (foundation — ~22 files)

**Headline:** Ship every reusable infra piece + the read-only `WorkflowCanvas` so subsequent plans can compose without blocking.

**Key files:**
- `Frontend2/services/lifecycle-service.ts`, `phase-gate-service.ts`, `milestone-service.ts`, `artifact-service.ts`, `phase-report-service.ts`, `led-teams-service.ts` (6 services)
- `Frontend2/hooks/use-milestones.ts`, `use-artifacts.ts`, `use-phase-reports.ts`, `use-phase-transitions.ts`, `use-transition-authority.ts`, `use-led-teams.ts`, `use-cycle-counters.ts`, `use-editor-history.ts`, `use-criteria-editor.ts` (9 hooks)
- `Frontend2/lib/lifecycle/graph-traversal.ts`, `workflow-validators.ts`, `cloud-hull.ts`, `align-helpers.ts`, `shortcuts.ts` (5 pure-logic libs)
- `Frontend2/components/workflow-editor/workflow-canvas.tsx`, `phase-node.tsx`, `phase-edge.tsx`, `group-cloud-node.tsx`, `canvas-skeleton.tsx`, `cycle-counter-badge.tsx`, `tooltip.tsx`, `all-gate-pill.tsx` (8 React Flow renderer files — read-only mode operational; editor-mode wired in Plan 12-07)
- npm install `@xyflow/react`

**Key tests:**
- All 5 pure-logic test files + bench (graph-traversal, workflow-validators, cloud-hull, align-helpers, shortcuts)
- `use-transition-authority.test.tsx` (3-role composition)
- `phase-node.test.tsx` (state ring rendering)
- `phase-edge.test.tsx` (3 dasharrays + bidirectional + all-gate)
- `cycle-counter-badge.test.tsx` (visibility rule)
- `workflow-canvas.test.tsx` (read-only renders without errors; `nodeTypes` + `edgeTypes` are module-top constants)

### Plan 12-02: Phase Gate Inline Expand + use-transition-authority Wiring

**Headline:** Phase Gate panel renders, submits, and handles the full error matrix; `use-transition-authority` gates the trigger button.

**Key files:**
- `Frontend2/components/lifecycle/phase-gate-expand.tsx`
- `Frontend2/components/lifecycle/summary-strip.tsx`
- `Frontend2/components/lifecycle/mini-metric.tsx`
- (Replaces lifecycle-stub-tab.tsx with a thin LifecycleTab placeholder that contains only summary-strip + Phase Gate expand for now; rest comes in Plans 03-06.)

**Key tests:**
- `phase-gate-expand.test.tsx` — 6 cases: happy path (auto pass), 422 unmet, 409 lock, 429 countdown, 400 wrong-mode, override flow
- `summary-strip.test.tsx` — button visibility (continuous mode hides; permission false hides)
- `phase-gate-expand.test.tsx::idempotency` — UUID generated once per open; preserved across retry; cleared on close

### Plan 12-03: Settings > Yaşam Döngüsü Criteria Editor

**Headline:** Replace the Phase 11 D-11 stub with the real criteria editor + `enable_phase_assignment` toggle.

**Key files:**
- `Frontend2/components/lifecycle/criteria-editor-panel.tsx`
- MODIFY `Frontend2/components/project-detail/settings-tab.tsx` (replace `sub === "lifecycle"` AlertBanner)
- MODIFY `Frontend2/components/project-detail/settings-general-subtab.tsx` (methodology read-only + tooltip per D-60)

**Key tests:**
- `criteria-editor-panel.test.tsx` — phase picker, auto toggles, manual add/delete, save round-trip
- `criteria-editor-panel.test.tsx::deep-link` — `?phase={id}` auto-scrolls + selects
- `settings-general-subtab.test.tsx::methodology-read-only` — tooltip content, no PATCH

### Plan 12-04: Lifecycle Overview + History Sub-tabs

**Headline:** First two sub-tabs of the LifecycleTab: Overview (4 MiniMetrics + Phase Summary) and History (per-card Collapsible with lazy-fetch).

**Key files:**
- `Frontend2/components/lifecycle/lifecycle-tab.tsx` (mounts the Tabs primitive + summary strip + canvas + sub-tab routing)
- `Frontend2/components/lifecycle/overview-subtab.tsx`
- `Frontend2/components/lifecycle/history-subtab.tsx`
- `Frontend2/app/(shell)/projects/[id]/page.tsx` MODIFIED (mount `<LifecycleTab/>` real)

**Key tests:**
- `lifecycle-tab.test.tsx` — sub-tab switching; canvas mounts in read-only mode
- `overview-subtab.test.tsx` — Kanban variant (3 metrics) vs default (4 metrics); `phaseStats.total === 0` shows `---` (LIFE-03)
- `history-subtab.test.tsx` — lazy-fetch on first expand; second expand hits cache (network mock asserts only 1 GET)

### Plan 12-05: Milestones Sub-tab + Timeline Gantt Integration

**Headline:** Milestones list + inline add row + edit/delete + flag lines on the Phase 11 Timeline tab Gantt.

**Key files:**
- `Frontend2/components/lifecycle/milestones-subtab.tsx`
- MODIFY `Frontend2/components/project-detail/timeline-tab.tsx` (accept `milestones` prop; render flag lines; click → popover)
- MODIFY `Frontend2/app/(shell)/projects/[id]/page.tsx` (pass milestones to TimelineTab)

**Key tests:**
- `milestones-subtab.test.tsx` — optimistic create + rollback on 422; ConfirmDialog on delete; chip picker multi-select
- `timeline-tab.test.tsx::milestones` — flag line rendering at correct x-position; popover content
- `milestones-subtab.test.tsx::project-wide` — empty `linked_phase_ids` accepted (Phase 9 D-24)

### Plan 12-06: Artifacts Sub-tab + Evaluation Report (LIFE-06 + LIFE-07)

**Headline:** Artifact row table with inline expand + Evaluation Report card on History entries.

**Key files:**
- `Frontend2/components/lifecycle/artifacts-subtab.tsx`
- `Frontend2/components/lifecycle/evaluation-report-card.tsx`

**Key tests:**
- `artifacts-subtab.test.tsx` — inline expand; status SegmentedControl (Yok/Taslak/Tamam); single file upload; PM delete only on `not-created` artifacts
- `artifacts-subtab.test.tsx::file-upload-413` — error AlertBanner
- `evaluation-report-card.test.tsx` — auto-prefill from server response; PDF Blob download with filename pattern; 30s rate-limit countdown; save 409 reload AlertBanner

### Plan 12-07: Workflow Editor Page Shell + Viewport Gate

**Headline:** Standalone `/workflow-editor?projectId=X` page renders the editor shell (header + toolbar + 2-col body grid) with the canvas in editable mode for the first time.

**Key files:**
- `Frontend2/app/(shell)/workflow-editor/page.tsx` (NEW route — reads `?projectId=X`, redirects if missing, viewport-fallback if <1024px)
- `Frontend2/components/workflow-editor/editor-page.tsx`
- `Frontend2/components/workflow-editor/right-panel.tsx`
- `Frontend2/components/workflow-editor/flow-rules.tsx`
- `Frontend2/components/workflow-editor/selection-panel.tsx`
- `Frontend2/components/workflow-editor/validation-panel.tsx`
- `Frontend2/components/workflow-editor/shortcuts-panel.tsx`
- `Frontend2/components/workflow-editor/bottom-toolbar.tsx`
- `Frontend2/components/workflow-editor/mode-banner.tsx`
- `Frontend2/components/workflow-editor/minimap-wrapper.tsx`
- `Frontend2/components/workflow-editor/color-swatch.tsx`
- `Frontend2/components/lifecycle/viewport-fallback.tsx`

**Key tests:**
- `editor-page.test.tsx` — header + toolbar + grid render; mode toggle persists in `?mode=`
- `editor-page.test.tsx::viewport-fallback` — at <1024px, fallback message renders, canvas does NOT mount
- `editor-page.test.tsx::missing-projectId` — redirects to `/projects`
- `flow-rules.test.tsx` — 4 mode options select; `setDirty(true)` fires
- `selection-panel.test.tsx` — node selection shows Field components; edge selection shows SegmentedControl

### Plan 12-08: Editor Interactivity (DnD + Group + Edit + Undo/Redo + Context Menu)

**Headline:** Wire the editable side of WorkflowCanvas — node drag, edge create, group create (5 ways), inline edit (double-click), keyboard shortcuts, undo/redo stack, context menu.

**Key files:**
- MODIFY `Frontend2/components/workflow-editor/workflow-canvas.tsx` — flip to editable mode wiring
- MODIFY `Frontend2/components/workflow-editor/phase-node.tsx` — inline name edit
- MODIFY `Frontend2/components/workflow-editor/phase-edge.tsx` — inline label edit
- MODIFY `Frontend2/components/workflow-editor/group-cloud-node.tsx` — drag-association policy
- `Frontend2/components/workflow-editor/context-menu.tsx`
- (Hooks `use-editor-history.ts` was shipped in Plan 01)

**Key tests:**
- `group-cloud-node.test.tsx` — 5 group creation entry points (drag-rect, multi-select+button, drop-into-group, mixed-select+button, context menu); drop-association on drag-out
- `context-menu.test.tsx` — right-click + Shift+F10 opens; arrow nav; Esc closes
- `editor-history.test.ts` — undo/redo across each mutation type; cleared on save
- `workflow-canvas.test.tsx::keyboard` — N adds node, ⌫ deletes, Cmd+G groups, arrow keys move

### Plan 12-09: Backend Additive Change + Editor Save Flow

**Headline:** Backend WorkflowEdge + ExecutePhaseTransitionUseCase + seeder; frontend save flow with full error matrix + dirty-save guard.

**Key files (Backend):**
- MODIFY `Backend/app/application/dtos/workflow_dtos.py` — add `bidirectional` + `is_all_gate` defaults
- MODIFY `Backend/app/application/use_cases/execute_phase_transition.py` — honor both fields
- MODIFY `Backend/app/infrastructure/database/seeder.py` — emit fields explicitly
- (Optionally extend `Backend/tests/test_seeder.py` if it exists)

**Key files (Frontend):**
- Wire save in `Frontend2/components/workflow-editor/editor-page.tsx`
- Dirty-save guard in `editor-page.tsx` (router intercept + beforeunload)

**Key tests:**
- `Backend/tests/test_execute_phase_transition.py::test_all_gate_allows_any_source` — is_all_gate=True edge with target=N → transition from random non-archived node succeeds
- `Backend/tests/test_execute_phase_transition.py::test_bidirectional_pair_wise` — A↔B + B↔C does NOT imply A→C transition
- `Backend/tests/test_workflow_edge_defaults.py` — read a workflow whose edges lack the new fields; assert `bidirectional == False`, `is_all_gate == False`
- `Backend/tests/test_seeder.py::test_workflow_edges_have_v2_fields` — newly-seeded projects have both fields populated explicitly
- `Frontend2/__tests__/components/workflow-editor/editor-page.test.tsx::save-flow` — 200 success, 422 validation panel, 409 reload AlertBanner, 429 countdown, network toast
- `editor-page.test.tsx::dirty-save-guard` — router.push triggers ConfirmDialog if dirty; beforeunload listener attached/detached

### Plan 12-10: Preset Templates + Cycle Counter Wiring + Polish

**Headline:** Incremental/Evolutionary/RAD preset templates; verify cycle counter visible end-to-end; final UAT pass.

**Key files:**
- `Frontend2/lib/lifecycle/presets.ts` (NEW — 9 entries: Scrum/Waterfall/Kanban/Iterative/V-Model/Spiral/Incremental/Evolutionary/RAD)
- MODIFY `Frontend2/components/workflow-editor/editor-page.tsx` — Şablon Yükle dropdown + ConfirmDialog
- Verify `use-cycle-counters` invalidation on phase transition
- Manual UAT click-through against the 14-row checklist

**Key tests:**
- `presets.test.ts` — each of the 9 presets passes `validateWorkflow()` with zero errors
- `editor-page.test.tsx::preset-replace` — ConfirmDialog if dirty; canvas swaps; save succeeds
- `cycle-counter.test.tsx::end-to-end` — load V-Model project, run 3 transitions on the same phase, badge shows ×3

## Sources

### Primary (HIGH confidence)

- `Frontend2/node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` — `dynamic({ssr: false})` semantics, `"use client"` requirement.
- `Frontend2/node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md` — `router.push`/`router.replace` API, no built-in `events` (must compose via `usePathname` + `useSearchParams` for navigation events).
- `Frontend2/package.json` — verified versions of every existing dependency (next 16.2.4, react 19.2.4, @tanstack/react-query 5.99.2, axios 1.15.1, lucide-react 1.8.0, vitest 1.6.0, @testing-library/react 16.3.2).
- `Frontend2/components/primitives/index.ts` + 17 individual primitive files — verified API surface of all 16 (+1) primitives.
- `Frontend2/components/projects/confirm-dialog.tsx` — verified ConfirmDialog API and location (Phase 10 D-25).
- `Frontend2/components/toast/index.tsx` — verified ToastProvider + useToast API (Phase 10 D-07).
- `Frontend2/lib/api-client.ts` — verified axios + interceptor patterns.
- `Frontend2/services/project-service.ts` + `hooks/use-tasks.ts` — service+hook patterns from Phase 10/11.
- `Backend/app/application/dtos/workflow_dtos.py` — verified WorkflowEdge / WorkflowConfig / `_has_cycle` Kahn's topo sort baseline.
- `Backend/app/application/use_cases/execute_phase_transition.py` — verified Phase Gate use case structure (steps 1-7).
- `Backend/app/infrastructure/database/seeder.py` (lines 270-292) — verified seeder edge-emission shape.
- `Backend/app/application/services/process_config_normalizer.py` — verified Phase 9 normalizer pattern (used as the pattern reference, NOT extended in Phase 12).
- `New_Frontend/src/pages/workflow-editor.jsx` — verified prototype WorkflowCanvas, PhaseNode, PhaseEdge, Field, ValidationItem visual contract.
- `.planning/phases/12-lifecycle-phase-gate-workflow-editor/12-CONTEXT.md` — D-01..D-60 user-locked decisions.
- `.planning/phases/12-lifecycle-phase-gate-workflow-editor/12-SPEC.md` — 14 falsifiable LIFE/EDIT requirements + acceptance criteria + the 2 SPEC overrides over CONTEXT.
- `.planning/phases/12-lifecycle-phase-gate-workflow-editor/12-UI-SPEC.md` — locked design contract (visual + copy + states).

### Secondary (MEDIUM confidence — verified against official sources)

- [reactflow.dev Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes) — custom node renderer pattern, `nodeTypes` definition outside component, multiple Handle ids per Position.
- [reactflow.dev Custom Edges](https://reactflow.dev/learn/customization/custom-edges) — custom edge renderer + `BaseEdge` + `getBezierPath()` mid-point sampling.
- [reactflow.dev Sub Flows](https://reactflow.dev/learn/layouting/sub-flows) — `parentId` (renamed from `parentNode` v11.11.0), parent ordering requirement.
- [reactflow.dev Migrate to v12](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) — package rename `reactflow` → `@xyflow/react`, React 19 support.
- [github.com/xyflow/xyflow discussions/2698](https://github.com/xyflow/xyflow/discussions/2698) — `display: none` vs `visibility: hidden` for handles.
- [github.com/xyflow/xyflow issues/4983](https://github.com/xyflow/xyflow/issues/4983) — `React.memo` requirement on custom nodes for non-changed re-render avoidance.
- [npmjs.com/package/@xyflow/react](https://www.npmjs.com/package/@xyflow/react) — latest stable v12.10.1 (Feb 2026).
- [npmjs.com/package/concaveman](https://www.npmjs.com/package/concaveman) — concaveman 2.0.0, `@types/concaveman` available, ~40 dependents.

### Tertiary (LOW confidence — needs validation in Plan 01)

- Concaveman exact gzipped size — UI-SPEC says ~3KB; verify with Bundlephobia or `pkg-size` during Plan 01 install.
- d3-shape transitive presence — needs `npm ls d3-shape` in Plan 01.
- Whether `@xyflow/react` has a known incompatibility with React 19.2.4 specifically (search results confirm React 19 support generically; no issue specific to .2.4 minor was found). Run a smoke render in Plan 07 first-paint test before relying on it.

## Metadata

**Confidence breakdown:**
- Standard stack — HIGH — all versions verified directly from `Frontend2/package.json`; React Flow latest verified via web search Apr 2026.
- Architecture (Plan 01 layout, file map, pure-logic libs) — HIGH — locked by CONTEXT + SPEC + UI-SPEC.
- Pitfalls — HIGH — verified against official React Flow docs + GitHub discussions/issues.
- Concave-hull algorithm — MEDIUM — convex-hull-plus-padding baseline endorsed by UI-SPEC; concaveman as fallback assumes ~3KB which needs Bundlephobia confirmation.
- Backend additive change — HIGH — confirmed against actual Pydantic model file (workflow_dtos.py:24-29) and use case (execute_phase_transition.py).
- Validation Architecture (Wave 0 file list) — HIGH — locked against the 14 requirements; each test file is a falsifiable target the planner can convert to validation_files entries.

**Research date:** 2026-04-25
**Valid until:** ~2026-05-25 (30 days). React Flow's release cadence is monthly; pin the version in Plan 01 install task and re-research if a major (v13) lands.
