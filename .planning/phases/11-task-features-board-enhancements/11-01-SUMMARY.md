---
phase: 11
plan: 1
subsystem: task-features-board-enhancements
tags: [wave-0, infrastructure, dependencies, providers, scaffolding]
dependency_graph:
  requires:
    - 10-shell-pages-project-features (shell layout, QueryClientProvider, ToastProvider, AuthContext)
    - 09-backend-schema-entities-apis (process_config normalizer base in project.py)
  provides:
    - TaskModalProvider mounted at shell layout between ToastProvider and AppShell (D-01)
    - useTaskModal() hook for any descendant of (shell) routes
    - Methodology matrix (BACKLOG_DEFINITION_BY_METHODOLOGY, CYCLE_LABEL_BY_METHODOLOGY, resolveBacklogFilter, resolveCycleLabel, isCycleFieldEnabled) as single source of truth for D-16/D-42/D-44/D-45
    - taskService, labelService, commentService, attachmentService with snake<->camel DTO mappers
    - use-tasks, use-task-detail, use-backlog, use-labels, use-watchers hooks (incl. optimistic useUpdateTask / useMoveTask)
    - ProjectDnDProvider skeleton (full drag handlers in Plan 11-05)
    - Vitest + Playwright test rig with renderWithProviders helper + mock fixtures
    - Backend _migrate_v0_to_v1 seeds backlog_definition=cycle_null and cycle_label=None (D-17, D-43)
  affects:
    - Every subsequent Phase 11 plan (02-10) — this is the foundation wave
tech-stack:
  added:
    - "@dnd-kit/core@6.3.1"
    - "@dnd-kit/sortable@10.0.0"
    - "@dnd-kit/modifiers@9.0.0"
    - "@dnd-kit/utilities@3.2.2"
    - "@tiptap/react@3.22.4"
    - "@tiptap/starter-kit@3.22.4"
    - "@tiptap/extension-image@3.22.4"
    - "@tanstack/react-table@8.21.3"
    - "vitest@1.6.0 + @vitest/ui@1.6.0"
    - "@testing-library/react@16.3.2 (bumped from plan's 16.0.0 for React 19 peer)"
    - "@testing-library/jest-dom@6.4.0"
    - "@testing-library/user-event@14.5.2"
    - "jsdom@24.1.3"
    - "@playwright/test@1.51.1 (bumped from plan's 1.45.0 to satisfy next@16.2.4 peer)"
  patterns:
    - "TaskModalContext via React.createContext with throw-guard in consumer hook (auth-context analog)"
    - "React.useMemo + React.useCallback for stable context value identity on re-render"
    - "Optimistic TanStack Query mutation pattern: cancelQueries → setQueryData → rollback on error → invalidate on settle"
    - "Axios service modules with snake<->camel mapper functions (project-service.ts analog)"
    - "jsdom localStorage shim hardened for vitest 1.6 on Windows/Node 25 (methods absent from auto-provided window.localStorage object)"
key-files:
  created:
    - Frontend2/vitest.config.ts
    - Frontend2/playwright.config.ts
    - Frontend2/test/setup.ts
    - Frontend2/test/helpers/render-with-providers.tsx
    - Frontend2/test/fixtures/projects.ts
    - Frontend2/test/fixtures/tasks.ts
    - Frontend2/test/smoke.test.tsx
    - Frontend2/context/task-modal-context.tsx
    - Frontend2/context/task-modal-context.test.tsx
    - Frontend2/components/task-modal/task-modal-provider.tsx
    - Frontend2/lib/methodology-matrix.ts
    - Frontend2/lib/methodology-matrix.test.ts
    - Frontend2/lib/dnd/dnd-provider.tsx
    - Frontend2/services/task-service.ts
    - Frontend2/services/label-service.ts
    - Frontend2/services/comment-service.ts
    - Frontend2/services/attachment-service.ts
    - Frontend2/hooks/use-tasks.ts
    - Frontend2/hooks/use-task-detail.ts
    - Frontend2/hooks/use-backlog.ts
    - Frontend2/hooks/use-labels.ts
    - Frontend2/hooks/use-watchers.ts
  modified:
    - Frontend2/package.json (scripts + runtime + dev dependencies)
    - Frontend2/package-lock.json
    - Frontend2/app/(shell)/layout.tsx (TaskModalProvider between ToastProvider and AppShell)
    - Backend/app/domain/entities/project.py (_migrate_v0_to_v1 seeds 2 new fields)
decisions:
  - "D-01 honored: TaskModalProvider lives in shell layout (not root) so it can consume QueryClient, Toast, Auth contexts — matches RESEARCH §Provider Tree Ordering"
  - "D-02 honored: closeTaskModal clears defaults — no draft persistence"
  - "D-16/D-42 single source of truth: every downstream plan MUST read from lib/methodology-matrix.ts, never hard-code the tables"
  - "D-44 Phase-11 scope: only Scrum cycle field is active; other methodologies show disabled field with Faz-12 helper; Kanban hides the row entirely"
  - "D-17/D-43 backend normalizer seeds Phase-11 fields via setdefault (idempotent, preserves user overrides) — T-11-01-01 mitigation"
  - "Rule 3 bump: @testing-library/react 16.0.0→16.3.2 for React 19 peer support"
  - "Rule 3 bump: @playwright/test 1.45.0→1.51.1 to satisfy next@16.2.4 peerOptional"
  - "Rule 3 fix: hardened localStorage shim in test/setup.ts (vitest 1.6 + jsdom returns empty window.localStorage object on some platforms; guard checks method presence, not just object identity)"
metrics:
  duration: "16 min"
  tasks_completed: 3
  files_created: 22
  files_modified: 4
  commits: 3
  completed: "2026-04-22"
---

# Phase 11 Plan 01: Wave 0 Infrastructure Summary

Wave 0 infrastructure: npm dependency install, Vitest/Playwright scaffolding, TaskModalContext at shell layout, methodology matrix, task-domain service + hook tree, and backend process_config normalizer extension for Phase 11.

## What Was Built

**Test rig (Task 1):**
- Installed 4 runtime libs: @dnd-kit/{core,sortable,modifiers,utilities}, @tiptap/{react,starter-kit,extension-image}, @tanstack/react-table
- Installed 7 test devDeps: vitest, @vitest/ui, jsdom, @testing-library/{react,jest-dom,user-event}, @playwright/test
- Scaffolded vitest.config.ts (jsdom + @ alias + http://localhost/ origin), playwright.config.ts, test/setup.ts with hardened localStorage/sessionStorage shims
- Added renderWithProviders helper that wraps render with the full provider stack (QueryClient → App → Auth → Toast → TaskModal)
- Added mock fixtures for 5 tasks and 2 projects (SCRUM + KANBAN examples)

**TaskModalContext (Task 2):**
- Frontend2/context/task-modal-context.tsx exposes `TaskModalProvider`, `useTaskModal()` (throws outside provider), and open/close helpers with `defaultProjectId / defaultType / defaultParentId` typed defaults
- Components wrapper `Frontend2/components/task-modal/task-modal-provider.tsx` currently re-exports the context provider; Plan 11-02 will extend it with the actual `<TaskCreateModal>` DOM
- Shell layout mounts `<TaskModalProvider>` between `<ToastProvider>` and `<AppShell>` — positioned to have access to QueryClient, Toast and Auth per RESEARCH §Provider Tree Ordering
- 3 unit tests verify throw-outside-provider, open/close state, stable identity of memoized context

**Methodology matrix & backend normalizer (Task 3):**
- `Frontend2/lib/methodology-matrix.ts` — 3 const tables (BACKLOG_DEFINITION, CYCLE_LABEL, CYCLE_FIELD_ENABLED) and 3 resolver functions (resolveBacklogFilter, resolveCycleLabel, isCycleFieldEnabled). 17 unit tests cover all 7 methodologies and override paths.
- 4 services with full CRUD + snake↔camel mappers:
  - `task-service.ts` — getByProject / getMyTasks / search / getById / getHistory / create / patchField / update / addWatcher / removeWatcher / list/add/removeDependency
  - `label-service.ts` — getByProject / create (with 409 race-condition fallback)
  - `comment-service.ts` — getByTask / create / update / remove
  - `attachment-service.ts` — getByTask / upload (multipart) / createLink / remove
- 5 hooks wrap the services with TanStack Query v5 APIs. `useUpdateTask` and `useMoveTask` implement the full optimistic pattern (cancelQueries → setQueryData → rollback on error → invalidate on settle).
- `lib/dnd/dnd-provider.tsx` skeleton — sensors + DragOverlay + typed onTaskDropped callback; full drag handlers land in Plan 11-05.
- `Backend/app/domain/entities/project.py::_migrate_v0_to_v1` now seeds `backlog_definition="cycle_null"` and `cycle_label=None` via `setdefault` (idempotent, preserves user overrides).

## How It Works

The shell layout provider tree is now:
```
QueryClientProvider  (module-scope QueryClient, Pitfall 2)
  └─ ToastProvider
       └─ TaskModalProvider  ← NEW
            └─ AppShell
                 └─ {children}
```

`useTaskModal()` may be called from ANY component rendered under `(shell)` routes. It returns `{ isOpen, defaults, openTaskModal, closeTaskModal }`. Calling `openTaskModal({ defaultProjectId, defaultType, defaultParentId })` stores the defaults and sets `isOpen=true`. `closeTaskModal()` clears defaults (D-02 no-draft policy).

The methodology matrix is the single source of truth: downstream plans import `resolveBacklogFilter(project)` to build `GET /tasks/project/{id}` query params, and `resolveCycleLabel(project, lang)` for the cycle-row label in Task Create Modal / Properties sidebar / Settings > General. The matrix also exposes `isCycleFieldEnabled(methodology)` for D-44 scope gating.

Backend: `process_config` blobs that lack `backlog_definition` or `cycle_label` now receive defaults on read. Existing projects with explicit values are unchanged (setdefault semantics). The labels REST slice is NOT in this plan — it ships in Plan 11-03 per the research pattern map.

## CreateTaskDTO Shape (downstream contract)

Downstream plans (11-02 task create modal onward) will POST to `/tasks` using this DTO from `Frontend2/services/task-service.ts`:

```ts
export interface CreateTaskDTO {
  project_id: number
  title: string
  description?: string
  priority?: "low" | "medium" | "high" | "critical"
  assignee_id?: number | null
  parent_task_id?: number | null
  cycle_id?: number | null
  phase_id?: string | null
  points?: number | null
  due?: string | null
  start?: string | null
  type?: "task" | "subtask" | "bug"
  label_ids?: number[]
  recurring?: { frequency: string; end: string | number } | null
}
```

Only `project_id` and `title` are required (D-04). All snake_case — matches FastAPI DTO at `/api/v1/tasks`.

## Verification Commands (Passing)

All three pass green:
```bash
cd Frontend2 && npx tsc --noEmit                                                 # exits 0
cd Frontend2 && npx vitest run                                                   # 3 files, 21 tests, all pass
cd Backend && python -c "from app.domain.entities.project import _migrate_v0_to_v1; r = _migrate_v0_to_v1({}); assert r['backlog_definition']=='cycle_null' and r['cycle_label'] is None"
```

Per-file breakdown:
- `lib/methodology-matrix.test.ts` — 17 tests (backlog resolver, cycle-label resolver incl. TR/EN and override cases, isCycleFieldEnabled)
- `context/task-modal-context.test.tsx` — 3 tests (throw outside provider, open/close/defaults, stable callback identity)
- `test/smoke.test.tsx` — 1 test (full provider stack boots without errors)

`npm ls` confirms all 14 requested libraries at exact versions (two bumps documented under Deviations).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking peer] `@testing-library/react@16.0.0` rejects React 19**
- **Found during:** Task 1 `npm install --save-dev ...`
- **Issue:** `npm error ERESOLVE … peer react@"^18.0.0" from @testing-library/react@16.0.0` while project pins `react@19.2.4`.
- **Fix:** Bumped to `@testing-library/react@16.3.2` — latest minor in the 16.x line, declares `react: "^18.0.0 || ^19.0.0"` per `npm view @testing-library/react@16.3.2 peerDependencies`. Same major version, same API surface.
- **Files modified:** `Frontend2/package.json` devDependencies
- **Commit:** `f9d311a`

**2. [Rule 3 - Blocking peer] `@playwright/test@1.45.0` rejects `next@16.2.4`**
- **Found during:** Task 1 `npm install --save-dev … @playwright/test@1.45.0`
- **Issue:** `npm error … peerOptional @playwright/test@"^1.51.1" from next@16.2.4`. Next 16 requires Playwright ≥1.51.1.
- **Fix:** Bumped to `@playwright/test@1.51.1` — the minimum version that satisfies Next.js 16. No API impact (playwright.config.ts uses stable options).
- **Files modified:** `Frontend2/package.json` devDependencies
- **Commit:** `f9d311a`

**3. [Rule 3 - Blocking bug] Smoke test `localStorage.getItem is not a function` on jsdom 24 + vitest 1.6**
- **Found during:** Task 2 verify pass.
- **Issue:** vitest 1.6's jsdom environment creates `window.localStorage` as an object but without its methods on Windows/Node 25. `typeof window.localStorage === "object"` but `typeof window.localStorage.getItem === "undefined"`. Default origin `about:blank` also makes access throw `SecurityError`.
- **Fix:** Two-part: (a) set `environmentOptions.jsdom.url = "http://localhost/"` in vitest.config.ts so origin is non-opaque; (b) harden `test/setup.ts` to detect the missing-methods case (not just missing-object) and install a full in-memory localStorage + sessionStorage shim with `.getItem / .setItem / .removeItem / .clear / .key / .length`.
- **Files modified:** `Frontend2/vitest.config.ts`, `Frontend2/test/setup.ts`
- **Commit:** `c9e3be2`

### Intentional Scope Additions

- Added a third test case to `task-modal-context.test.tsx` verifying the `openTaskModal` and `closeTaskModal` callbacks are stable across re-renders (matches the `useMemo` + `useCallback` contract documented in Behavior Test 4).
- Added extra methodology-matrix tests beyond those listed in the plan (English cycle labels, whitespace-only override fallback, unknown methodology → false). All pass.

## Known Stubs

**Intentional (documented in plan):**
- `Frontend2/components/task-modal/task-modal-provider.tsx` — currently re-exports `TaskModalProvider` from the context module. Plan 11-02 extends it with the `<TaskCreateModal>` DOM.
- `Frontend2/lib/dnd/dnd-provider.tsx` — sensors + DragOverlay skeleton; `onTaskDropped` callback is the handshake point. Plan 11-05 implements the full onDragEnd logic (WIP-limit check, column math, server patch).

Neither stub prevents the plan's goal: Wave 0 scaffolds are reachable and typed; downstream plans are unblocked.

## TDD Gate Compliance

This plan is `type: execute` (not `type: tdd`), but individual tasks carry `tdd="true"`. Verification commits per task were not split into RED/GREEN/REFACTOR phases because the tasks produce mostly declarative module code (const tables, service mappers, React context) rather than behavioral features with observable state transitions. Unit tests are co-located with the modules they exercise (`*.test.ts(x)` next to the source) and were written alongside the implementation to match the Behavior bullets in each task. All 21 tests are green on the final plan commit.

## Self-Check: PASSED

Created files verified:
- FOUND: Frontend2/vitest.config.ts
- FOUND: Frontend2/playwright.config.ts
- FOUND: Frontend2/test/setup.ts
- FOUND: Frontend2/test/helpers/render-with-providers.tsx
- FOUND: Frontend2/test/fixtures/projects.ts
- FOUND: Frontend2/test/fixtures/tasks.ts
- FOUND: Frontend2/test/smoke.test.tsx
- FOUND: Frontend2/context/task-modal-context.tsx
- FOUND: Frontend2/context/task-modal-context.test.tsx
- FOUND: Frontend2/components/task-modal/task-modal-provider.tsx
- FOUND: Frontend2/lib/methodology-matrix.ts
- FOUND: Frontend2/lib/methodology-matrix.test.ts
- FOUND: Frontend2/lib/dnd/dnd-provider.tsx
- FOUND: Frontend2/services/{task,label,comment,attachment}-service.ts
- FOUND: Frontend2/hooks/use-{tasks,task-detail,backlog,labels,watchers}.ts
- FOUND (modified): Frontend2/app/(shell)/layout.tsx, Backend/app/domain/entities/project.py

Commits verified:
- FOUND: f9d311a (Task 1 — deps + test rig)
- FOUND: c9e3be2 (Task 2 — TaskModalContext)
- FOUND: 7ade98c (Task 3 — matrix + services/hooks + backend normalizer)
