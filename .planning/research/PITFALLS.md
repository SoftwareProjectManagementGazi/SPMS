# Domain Pitfalls

**Domain:** Software Project Management System — Frontend Overhaul & Backend Expansion (v2.0)
**Researched:** 2026-04-20
**Confidence:** HIGH (based on code review + documented patterns)

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or major regression.

---

### Pitfall 1: CSS Token Namespace Collision Between Two Design Systems

**What goes wrong:** The existing frontend uses shadcn/ui with Tailwind CSS variables (oklch-based, `--primary`, `--background`, `--foreground` etc. in `globals.css`). The new prototype uses a completely different token set (`--bg`, `--bg-2`, `--surface`, `--surface-2`, `--fg`, `--fg-muted`, `--primary` with *different values*). Both define `--primary`, `--ring`, `--border`, and status/priority tokens but with different oklch values and different naming conventions. Running both simultaneously causes silent visual regressions.

**Why it happens:** Both systems use CSS custom properties at `:root` scope. The new prototype uses `--bg` while old uses `--background`. Both use `--primary` but old is `oklch(0.55 0.22 264)` (blue-ish) vs new `oklch(0.60 0.17 40)` (terracotta). Shared token names with different values will produce unpredictable results when components from both systems coexist.

**Consequences:**
- Colors break silently (no build error, just wrong visual output)
- Dark mode breaks differently per system (`data-mode="dark"` vs `.dark` class)
- Debug is extremely painful because CSS variable conflicts don't show in console errors

**Prevention:**
1. Namespace new tokens: prefix all new design tokens with `--sp-` (e.g., `--sp-bg`, `--sp-surface`, `--sp-primary`)
2. Scope new styles under a wrapper class (e.g., `.spms-v2`) rather than `:root` during transition
3. Choose ONE theme switching mechanism early: either `data-mode` attribute (prototype) or `.dark` class (shadcn/Tailwind)
4. Create a token mapping document that maps old tokens to new before any conversion work

**Detection:** Visual regression testing. Any component rendered with wrong colors = token collision. Add a Storybook or test page that renders one component from each system side-by-side.

**Phase:** Must resolve in Phase 1 (Design System Unification) before any component conversion begins.

---

### Pitfall 2: Hydration Mismatch from Inline-Style-Heavy Components

**What goes wrong:** The prototype components (primitives.jsx) use 100% inline styles with dynamic CSS variable references (`var(--fg-muted)`, `color-mix(in oklch, ...)`). When converting to Next.js Server Components, inline styles with dynamic values that depend on client state (theme, density, brand colors) will cause hydration mismatches because server doesn't know client preferences.

**Why it happens:** The prototype stores theme/density/brand preferences in `localStorage` and applies them via `document.documentElement.style.setProperty()`. In SSR, the server renders with default values. The client then applies user preferences, causing a flash and hydration error: "Text content does not match server-rendered HTML."

**Consequences:**
- React 19 strict hydration errors (breaks the page, not just a warning)
- Flash of unstyled/wrong-styled content (FOUC)
- Components using `color-mix()` with CSS variables may render blank on server if CSS engine doesn't support them during SSR

**Prevention:**
1. All converted components that depend on theme tokens must be Client Components (`'use client'`)
2. Use CSS variables as-is in stylesheets (not inline computed values) — let the browser resolve at paint time
3. For theme initialization: inject a blocking `<script>` in `<head>` that reads `localStorage` and sets `data-mode`/`data-density` attributes BEFORE React hydrates (zero-flicker pattern)
4. Never compute `color-mix()` in JavaScript — keep it purely in CSS where the browser handles it
5. SVG charts that reference CSS variables: render as Client Components with `dynamic(() => import(...), { ssr: false })`

**Detection:** Run `next dev` and check console for hydration warnings. Any text like "Hydration failed because the initial UI does not match" = this pitfall.

**Phase:** Phase 2 (Component Conversion). Every converted component must be tested for SSR compatibility.

---

### Pitfall 3: React 18 Prototype to React 19 Runtime — Silent API Breaks

**What goes wrong:** The prototype runs React 18.3.1 (UMD via CDN). The target Next.js 16 app uses React 19.2.0. React 19 removes `ReactDOM.render`, removes String Refs, changes how `ref` forwarding works (no more `forwardRef` wrapper needed), and removes UMD builds entirely. Converted components may silently break.

**Why it happens:** The prototype uses React 18 global `React.useState`, `React.useEffect` patterns. React 19 changes ref behavior: `ref` is now a regular prop and `forwardRef` is deprecated. Any prototype component that passes refs or uses legacy patterns will need adaptation.

**Consequences:**
- Components that forward refs via old pattern will emit deprecation warnings or break
- Any use of `defaultProps` (deprecated in React 19) silently stops working
- `useEffect` cleanup timing changes can cause race conditions in converted components

**Prevention:**
1. Never copy-paste prototype JSX directly — always review for React 19 compatibility
2. Replace all `forwardRef` wrappers with direct `ref` prop acceptance
3. Replace `defaultProps` with JS default parameters
4. Test every converted component in isolation before integration

**Detection:** React DevTools warnings, TypeScript compiler errors (if types are current), console deprecation messages.

**Phase:** Phase 2 (Component Conversion). Each component conversion should validate against React 19 API.

---

### Pitfall 4: process_config JSON Schema Evolution Without Versioning

**What goes wrong:** The `projects.process_config` column is a JSONB blob with no schema version field. Adding new properties (groups, edge types, phase_completion_criteria) to this JSON will break existing projects that have the old shape. Querying/reading the field without version-aware parsing causes runtime crashes.

**Why it happens:** v1.0 stores `process_config` with a shape like `{columns: [...], behavioral_flags: {...}}`. v2.0 wants to add `{workflow: {nodes: [...], edges: [...], groups: [...]}, phase_completion_criteria: {...}, edge_types: [...]}`. Old projects won't have these fields. Code that assumes new fields exist will throw `KeyError` or `TypeError`.

**Consequences:**
- Existing project detail pages crash when accessing new nested fields
- Migration scripts that naively `UPDATE process_config = ...` destroy existing customizations
- Queries using JSONB operators (`->>`, `@>`) on new fields return NULL for old projects

**Prevention:**
1. Add a `schema_version` field to process_config: `{"v": 2, ...}`
2. Write a domain-layer normalizer/migrator function that upgrades old shapes to new on-read (not via DB migration)
3. All code accessing process_config must use safe access with defaults: `config.get("workflow", {}).get("nodes", [])`
4. NEVER alter existing process_config data in a migration — only add new columns or default new fields
5. Create a `ProcessConfigV2` Pydantic model with proper Optional fields and validation

**Detection:** Load any existing project after schema expansion — if it crashes or shows blank workflow, this pitfall was hit.

**Phase:** Phase 3 (Backend Expansion). Must be resolved before any workflow editor or phase gate feature ships.

---

### Pitfall 5: Phase Gate Race Condition — Concurrent Status Updates Bypass Gate

**What goes wrong:** Two users simultaneously complete the last tasks in a phase. Both check "are all tasks done?" — both see YES — both trigger phase transition. Result: duplicate audit log entries, double notifications, or worse — the phase advances past one stage (skipping a gate check).

**Why it happens:** The existing `version` column provides optimistic locking for individual records, but phase gate logic spans multiple records (all tasks in a phase). There's no transaction-level lock for the gate evaluation. Current code uses `session.flush()` + `session.commit()` per operation without a distributed lock.

**Consequences:**
- Duplicate phase transitions in audit_log (confusing history)
- Phase skipping: Phase A -> Phase C (skips B's gate criteria)
- Race window is small but grows with team size and automation (CI webhooks updating task status)

**Prevention:**
1. Use `SELECT ... FOR UPDATE` on the project row before evaluating gate criteria (pessimistic row lock)
2. Wrap the entire "check criteria + advance phase + write audit" in a single transaction
3. Add a `phase_transition_lock` advisory lock per project: `pg_advisory_xact_lock(project_id)`
4. Make the gate check idempotent: if phase already advanced, return early without error
5. Add a `transition_id` (UUID) to audit entries — dedup on this if concurrent attempts succeed

**Detection:** Load test with 5+ concurrent task-complete requests on the same project's final phase task. Check audit_log for duplicate `phase_transition` entries.

**Phase:** Phase 4 (Phase Gate System). Must be designed into the gate API from day one, not bolted on later.

---

### Pitfall 6: Adding Milestone/Artifact/PhaseReport Entities — Circular Import and DI Explosion

**What goes wrong:** Each new entity in the Clean Architecture requires: domain entity, repository interface, SQLAlchemy model, repository implementation, DTOs, use case, API route, DI registration in `dependencies.py`. The current `dependencies.py` is already 220+ lines with 15+ factory functions. Adding 3 more entities (Milestone, Artifact, PhaseReport) without restructuring creates unmanageable dependency injection and circular import risk.

**Why it happens:** The project uses FastAPI `Depends()` for DI with one flat file (`dependencies.py`) registering everything. New entities that reference each other (PhaseReport references Milestone, Artifact links to Phase) create bi-directional imports at the model layer. SQLAlchemy relationships between new and existing models (e.g., `PhaseReport.project_id -> projects.id`) require careful import ordering.

**Consequences:**
- `ImportError: cannot import name 'X' from partially initialized module` — circular dependency at startup
- `dependencies.py` becomes 400+ lines, impossible to reason about
- Forgetting one DI registration = runtime error only discovered when that specific endpoint is hit

**Prevention:**
1. Split `dependencies.py` into sub-modules: `deps/auth.py`, `deps/project.py`, `deps/workflow.py`
2. Use SQLAlchemy string-based relationship targets (`relationship("MilestoneModel")`) to avoid model import circles
3. Add all new models to `models/__init__.py` imports BEFORE creating relationships
4. Create a checklist for each new entity: Entity -> Repository Interface -> Model -> Repository Impl -> DTO -> Use Case -> Route -> DI Registration -> Integration Test
5. For inter-entity relationships: always use `ForeignKey` pointing TO the existing table (unidirectional), lazy-load the reverse

**Detection:** App fails to start (`uvicorn` crashes with import error). Or worse: starts fine but specific routes return 500 because DI can't resolve a dependency.

**Phase:** Phase 3 (Backend Expansion). Restructure DI before adding entities.

---

## Moderate Pitfalls

---

### Pitfall 7: Custom SVG Charts (CFD, Histogram) — SSR Crash in Next.js

**What goes wrong:** The prototype's `WorkflowCanvas` and chart components render SVG directly with dynamic dimensions, mouse events, and CSS variable references. In Next.js App Router, these crash on the server because they may reference `window`, `document`, or browser-only APIs for measurement.

**Prevention:**
1. All custom SVG chart components must be Client Components (`'use client'`)
2. For charts needing initial dimensions, use `useRef` + `ResizeObserver` instead of reading `window.innerWidth`
3. Use `dynamic(() => import('./Chart'), { ssr: false })` for charts that absolutely cannot render server-side
4. Wrap any `getBoundingClientRect()` or `getComputedStyle()` calls in `useEffect`
5. The existing `recharts` dependency already handles SSR — use it for standard charts, custom SVG only for truly custom visualizations (CFD, workflow canvas)

**Phase:** Phase 5 (Reporting). Test each chart in SSR mode before merging.

---

### Pitfall 8: Graph Traversal Performance — Active Phase Computation at Scale

**What goes wrong:** The workflow editor stores nodes/edges in `process_config` JSON. Computing "active phase" requires traversing the graph (finding reachable nodes from completed ones). With larger workflows (15+ nodes, complex edge types), this becomes expensive if done per-request.

**Prevention:**
1. Cache computed `active_phase` on the project record — only recompute on state transitions (not on every GET)
2. Limit workflow size: max 20 nodes, max 50 edges (enforce at validation layer)
3. Keep traversal in Python (simple adjacency list), not PostgreSQL recursive CTEs — the workflow graphs are small enough that application-level BFS/DFS is simpler and faster than a DB roundtrip
4. For the "sequential-locked" mode: the computation is O(1) — just find the first incomplete phase by order. Only "flexible" mode needs real traversal
5. Add an index on `(project_id, phase_id)` for tasks table to make criteria queries fast

**Phase:** Phase 4 (Phase Gate System). Design caching strategy before implementing the traversal logic.

---

### Pitfall 9: Parallel Frontend Build — Routing Conflicts and Auth Token Sharing

**What goes wrong:** During transition, both the old frontend (shadcn/Tailwind pages) and new pages (inline-style components) coexist. They share the same Next.js app. Route conflicts occur when new pages shadow existing ones. Both read JWT from the same localStorage key but may have different auth state management.

**Prevention:**
1. Use a `/v2/` route prefix for all new pages during development — merge into main routes only after old pages are removed
2. Keep ONE `AuthContext` and ONE `apiClient` — never duplicate the auth/API layer
3. The new pages consume the SAME services layer (`/services/*.ts`) — do not create parallel API services
4. Use feature flags (server-side via `SystemConfig` table) to switch routes: `if (featureFlag.v2Dashboard) route('/v2/dashboard')` else route('/dashboard')`
5. Ensure both old and new pages handle the same 401 redirect flow (current `apiClient` interceptor)

**Phase:** Phase 2 (Component Conversion). Establish routing strategy in first PR before any page conversion.

---

### Pitfall 10: Alembic Migration Ordering with JSONB Default Values

**What goes wrong:** Adding new JSONB columns with `server_default` to existing tables causes Alembic autogenerate to produce broken migration code. The project already uses manual migrations (`migration_005.py`) with idempotent checks, but new developers might try autogenerate and get invalid SQL.

**Prevention:**
1. Continue the established pattern: always write manual migrations with idempotent `_table_exists`/`_column_exists` checks
2. For new JSONB columns: use `server_default=text("'{}'::jsonb")` not `server_default={}` (the Python dict breaks autogenerate)
3. Never add `server_default` to JSONB columns via Alembic autogenerate — always manual
4. New entities (Milestone, Artifact, PhaseReport) need a single migration file that creates all 3 tables together (avoids FK ordering issues)
5. Test migrations on a fresh database AND on a populated database (existing projects must survive)

**Phase:** Phase 3 (Backend Expansion). First task should be writing and testing the migration script.

---

### Pitfall 11: Optimistic Locking Not Enforced in Phase Transitions

**What goes wrong:** The existing code increments `model.version` but never checks if the version matches before updating. This means the "optimistic lock" is tracked but not enforced — concurrent updates still overwrite each other silently.

**Prevention:**
1. For phase gate transitions: add `WHERE version = :expected_version` to the UPDATE query
2. If version mismatch: raise `HTTPException(409, "Conflict — record was modified concurrently")`
3. Frontend must handle 409 by re-fetching and showing user a merge prompt or retry
4. Particularly critical for `process_config` updates (workflow editor saves) where two users editing simultaneously would lose changes

**Phase:** Phase 4 (Phase Gate System). Enforce locking before building gate logic on top.

---

### Pitfall 12: In-Memory Lockout Store + New Frontend Sessions

**What goes wrong:** The existing tech debt (in-memory lockout store) means failed login attempts reset on server restart. With the frontend overhaul adding new login/auth flows, the lockout state is unreliable. If a new Phase Gate system also has "lock project during transition" semantics, in-memory storage will fail.

**Prevention:**
1. Migrate lockout to Redis or PostgreSQL BEFORE adding Phase Gate locking
2. If Redis is too heavy for a 2-person team: use a simple `login_attempts` table with `(user_id, attempt_count, locked_until)` columns
3. Do NOT build phase gate locks on top of in-memory state — use `pg_advisory_lock` for phase transitions

**Phase:** Phase 1 or Phase 3. Must be resolved before Phase Gate implementation.

---

### Pitfall 13: Integration Tests on Main DB — New Entity Tests Pollute Data

**What goes wrong:** The test infrastructure uses the main `DATABASE_URL` with transaction rollback for isolation. But adding 3 new entity types (Milestone, Artifact, PhaseReport) that have FKs to existing tables means tests need real project/task data to exist. The rollback strategy works per-test but shared fixtures across tests create ordering dependencies.

**Prevention:**
1. Each test should create its own fixtures (project, user, etc.) within the transaction — never rely on seeded data
2. Add a `create_test_project()` helper that creates a full project with members in one call
3. For phase gate tests: create helper that sets up a complete workflow (project + phases + tasks in specific states)
4. Long-term: switch to a dedicated `spms_test` database created in CI/Docker setup

**Phase:** Phase 3 (Backend Expansion). Create test helpers before writing entity tests.

---

## Minor Pitfalls

---

### Pitfall 14: Prototype Uses Global Variable Scope — Not Module-Safe

**What goes wrong:** The prototype declares all components as global variables (`const Avatar = ...`, `const WorkflowCanvas = ...`) loaded via `<script type="text/babel">`. These are NOT ES modules. Direct copy-paste into Next.js without adding `import`/`export` statements and removing global `React.*` destructuring will fail.

**Prevention:**
1. Every converted file needs: `import React from 'react'` (or named imports from React 19)
2. Remove all `const { useState, useEffect, ... } = React;` lines — use direct imports
3. Add `export default` or named exports to each component
4. Remove all reliance on script load ordering (the prototype depends on `primitives.jsx` loading before `pages/*.jsx`)

**Phase:** Phase 2 (Component Conversion). Mechanical but error-prone — establish conversion template in first PR.

---

### Pitfall 15: oklch() Color Format Browser Support

**What goes wrong:** The new design system uses `oklch()` extensively including `color-mix(in oklch, ...)`. While modern browsers support this (Chrome 111+, Safari 15.4+, Firefox 113+), SSR-rendered HTML sent to older browsers or PDF export engines may render blank or fallback colors.

**Prevention:**
1. Test on target browsers (the project says "responsive web" — ensure minimum browser versions are defined)
2. For PDF export (existing feature): the fpdf2 library renders its own — ensure chart data is passed as values, not as rendered SVG with CSS variables
3. Consider a `@supports` fallback for the 3-4 critical brand colors only
4. Document minimum browser requirement: Chrome 111+/Safari 15.4+/Firefox 113+

**Phase:** Phase 2 (Component Conversion). Non-blocking but should be documented.

---

### Pitfall 16: JWT in localStorage + New Frontend Pages = XSS Attack Surface Growth

**What goes wrong:** Every new page/component added to the frontend increases the attack surface for XSS. The more complex the UI (especially workflow editor with user-generated content in node labels, edge labels), the more opportunities for stored XSS that can steal the JWT from localStorage.

**Prevention:**
1. Sanitize ALL user-provided text before rendering in SVG (node names, edge labels)
2. Never use `dangerouslySetInnerHTML` for any user content
3. For workflow editor: validate node/edge names against a whitelist of safe characters
4. Consider moving JWT to HttpOnly cookie in this milestone (it's listed as "v2 candidate" in Out of Scope — worth reconsidering)
5. Add Content-Security-Policy headers that restrict inline scripts

**Phase:** All phases. Security review before each phase ships.

---

### Pitfall 17: TanStack Query Cache Invalidation for New Entities

**What goes wrong:** The existing frontend uses TanStack Query for server state. Adding new entities (Milestones, Phase Reports) with relationships to Projects/Tasks means cache invalidation becomes complex. Updating a task's phase should invalidate: task list, project detail, phase report, milestone progress.

**Prevention:**
1. Define query key hierarchy early: `['projects', projectId, 'milestones']`, `['projects', projectId, 'phases', phaseId, 'report']`
2. Use `queryClient.invalidateQueries({ queryKey: ['projects', projectId] })` (prefix matching) to cascade invalidations
3. Never cache Phase Gate state — always refetch on critical operations (phase transitions must show fresh state)
4. For workflow editor: use optimistic updates for node position changes, but NOT for structural changes (add/remove node)

**Phase:** Phase 3+ (whenever new entities get frontend pages). Design query key strategy first.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Design System Unification | Token collision between old and new (Pitfall 1) | Namespace new tokens, single theme mechanism |
| Component Conversion | Hydration mismatches (Pitfall 2), React 18->19 breaks (Pitfall 3), Global scope (Pitfall 14) | All dynamic-style components as Client Components, conversion template |
| Backend Entity Expansion | DI explosion (Pitfall 6), Migration JSONB (Pitfall 10), Test pollution (Pitfall 13) | Split dependencies.py, manual migrations, test helpers |
| Phase Gate System | Race conditions (Pitfall 5), Locking not enforced (Pitfall 11), In-memory lockout (Pitfall 12) | Advisory locks, enforce version checks, move to persistent store |
| Workflow Editor | process_config schema (Pitfall 4), Graph perf (Pitfall 8) | Schema versioning, cached active_phase |
| Reporting/Charts | SVG SSR crash (Pitfall 7) | dynamic import with ssr:false |
| Routing/Auth | Route conflicts (Pitfall 9), JWT XSS surface (Pitfall 16) | /v2/ prefix, shared auth context |
| All Phases | Cache invalidation (Pitfall 17) | Query key hierarchy, prefix invalidation |

---

## Integration-Specific Warnings

### The "Two Frontends" Transition Period

The biggest meta-risk is operating two styling philosophies simultaneously during the transition:

1. **Old system:** shadcn/ui + Tailwind CSS + className-based + `globals.css` CSS variables
2. **New system:** Custom primitives + inline styles + CSS variables + `color-mix()` functions

**The danger period** is when both coexist in the same app. A single misplaced CSS variable override in the global scope can break 50+ components silently.

**Recommended strategy:**
- Phase 1: Establish the new token system as authoritative, scoped under a wrapper
- Phase 2: Convert new pages using new system, old pages remain untouched
- Phase 3: After all new pages work, migrate old pages to new system (or decide to keep shadcn for admin-only pages)
- Never: Mix shadcn components inside new-system pages or vice versa in the same component

### Backend Expansion Integration Order

Adding entities to the existing Clean Architecture must follow dependency order:

```
1. Migration (schema) — tables must exist first
2. Domain Entity (Pydantic model) — no deps on infra
3. Repository Interface (abstract) — no deps on infra
4. SQLAlchemy Model — depends on Base, FK targets
5. Repository Implementation — depends on Model + Interface
6. DTOs — depends on Domain Entity
7. Use Case — depends on Repository Interface + DTOs
8. API Route — depends on Use Case + DTOs
9. DI Registration — depends on all above
10. Frontend Service — depends on API contract
11. Frontend Page — depends on Service + Components
```

Skipping steps or doing them out of order = runtime errors that only surface at integration time.

---

## Sources

- Next.js Hydration Error Documentation: https://nextjs.org/docs/messages/react-hydration-error
- React 19 Upgrade Guide: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- Alembic Cookbook (JSONB handling): https://alembic.sqlalchemy.org/en/latest/cookbook.html
- PostgreSQL Advisory Locks: https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS
- Next.js CSS Styling Guide: https://nextjs.org/docs/app/building-your-application/styling
- Migrating Legacy Front-Ends to Next.js (strategy): https://medium.com/@sir.raminyavari/a-scalable-strategy-for-migrating-legacy-front-ends-to-next-js-d87b27830aca
- Database Design for Audit Logging: https://www.red-gate.com/blog/database-design-for-audit-logging/
- Recharts SSR Issue #301: https://github.com/recharts/recharts/issues/301
- Clean Architecture in FastAPI: https://fueled.com/blog/clean-architecture-with-fastapi/
