---
phase: 15-rbac-redesign-and-phase-14-deferred-cleanup
plan: 01
subsystem: testing

tags: [vitest, tanstack-query-v5, react-flow, mocks, typescript, harness]

# Dependency graph
requires:
  - phase: 12-workflow-editor
    provides: Original editor-page / selection-panel / workflow-canvas / phase-edge tests written in Phase 12 plans 12-01..12-10
  - phase: 13-tanstack-v5-uplift
    provides: TanStack Query v5 UseQueryResult shape change (isLoading -> isPending) + signature drift surfaced by tests after the bump
provides:
  - Green Frontend2 vitest baseline for the workflow-editor surface (96/96 across 14 test files)
  - Stable @xyflow/react vi.mock template (ReactFlowProvider + useReactFlow + applyNode/EdgeChanges) used by 3 test files
  - Stable @tanstack/react-query vi.mock template (useQueryClient + useQuery returning a frozen v5 UseQueryResult) for editor-page-style consumers
  - vi.hoisted pattern for stable empty-reference fixtures (cycleMap + transitionsQuery) that prevent useMemo/useEffect dep churn -> infinite render loops
  - tsc --noEmit clean for the seven Plan 15-01 test files
affects:
  - 15-04-rbac-routes
  - 15-05-rbac-pm-elevation
  - All future Phase 15 RBAC plans (a green vitest baseline is required so regressions are detectable)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vi.hoisted-backed stable references for vi.mock factories — prevents JS-heap-OOM render loops when production code depends on referential stability"
    - "TanStack v5 UseQueryResult cast — `as unknown as ReturnType<typeof hook>` instead of typing the partial v5 shape"
    - "@xyflow/react v12 mock surface — ReactFlowProvider + useReactFlow are mandatory; edgesUpdatable was renamed edgesReconnectable"

key-files:
  created: []
  modified:
    - Frontend2/components/workflow-editor/editor-page.test.tsx
    - Frontend2/components/workflow-editor/selection-panel.test.tsx
    - Frontend2/components/workflow-editor/workflow-canvas.test.tsx
    - Frontend2/components/workflow-editor/phase-edge.test.tsx
    - Frontend2/components/lifecycle/milestones-subtab.test.tsx
    - Frontend2/hooks/use-transition-authority.test.tsx
    - Frontend2/lib/api-client.test.ts

key-decisions:
  - "Followed plan intent (extend mocks, fix v5 cast, fix spread-arg, fix lib/api-client) but adjusted specific keys to match actual failures discovered by running the tests — the plan's stated `ReactFlowProvider+useReactFlow only` was incomplete; the dominant editor-page failure was a missing useQuery export."
  - "Used vi.hoisted for stable empty-Map/empty-frozen-array references rather than module-scope `const` — vitest hoists vi.mock factories above other module statements so naive const declarations would TDZ-error at hoist time."
  - "Fixed TanStack v5 type drift via `as unknown as ReturnType<typeof hook>` cast instead of writing the full 22-field v5 UseQueryResult shape — minimum-surgery TS satisfaction."

patterns-established:
  - "vitest @xyflow/react mock template: ReactFlowProvider passthrough, useReactFlow stub returning {zoomIn, zoomOut, fitView}, ReactFlow capture-handler stub, applyNode/EdgeChanges identity passthrough, Position string-literal map, marker/path stub set."
  - "vitest @tanstack/react-query mock template: useQueryClient stub + useQuery returning a vi.hoisted frozen v5 UseQueryResult ({data: frozen [], isPending: false, isError: false, isSuccess: true, error: null})."
  - "vi.fn signature pattern: `vi.fn<[arg: T], R>(...)` — explicit tuple+return generic args so `mockFn(arg)` type-checks against typed mocked imports (avoids TS2554/TS2556)."

requirements-completed: [TIDY-04]

# Metrics
duration: 35min
completed: 2026-04-29
---

# Phase 15 Plan 01: TIDY-04 workflow-editor harness fix Summary

**Restored green Frontend2 vitest baseline for the workflow-editor surface — 19 originally-failing tests + 4 TS-error files brought to 96/96 pass + tsc-clean by extending the @xyflow/react and @tanstack/react-query mocks to match production hook usage post-Triage #3, plus TanStack v5 UseQueryResult cast and vi.fn signature fixes for typed-mock spread arguments.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-04-29T00:18Z
- **Completed:** 2026-04-29T00:53Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- All 16 editor-page.test.tsx tests pass (was 16/16 failing on `useQuery is not defined on the @tanstack/react-query mock`)
- selection-panel.test.tsx Test 5 fixed — split the combined `Başlatma → Yürütme` regex into two text assertions to match the new EdgeEditor split DOM
- workflow-canvas.test.tsx 2 readOnly tests fixed — added ReactFlowProvider + useReactFlow + renamed `edgesUpdatable` → `edgesReconnectable` to match React Flow v12
- phase-edge.test.tsx tsc-clean — replaced string-literal `"right"`/`"left"` with `Position.Right`/`Position.Left` enum members, removed now-unused `@ts-expect-error` directives
- use-transition-authority.test.tsx tsc-clean — renamed `isLoading: false` → `isPending: false` in 6 useLedTeams.mockReturnValue blocks; added `as unknown as ReturnType<...>` cast
- milestones-subtab.test.tsx tsc-clean — declared `transitionAuthorityMock` with explicit `vi.fn<[project: unknown], boolean>` generic args
- lib/api-client.test.ts tsc-clean — typed the spy variable as `MockInstance<[message?: unknown, ...optionalParams: unknown[]], void>` and updated the mock interceptor's `error` param to return `Promise<unknown>`
- Plan verification command passes: `cd Frontend2 && npx vitest run components/workflow-editor/ components/lifecycle/milestones-subtab.test.tsx lib/api-client.test.ts` exits 0 with 96/96 tests green

## Task Commits

Each task was committed atomically (sequential mode, hooks-on, no `--no-verify`):

1. **Task 1: Extend @xyflow/react vi.mock + fix Position type drift across 3 workflow-editor test files** — `3096eeb6` (test)
2. **Task 2: Fix UseQueryResult v5 cast + spread-arg fixture + lib/api-client TS error** — `675f2b6a` (test)

_Note: STATE.md / ROADMAP.md not touched per orchestrator's wave-end ownership._

## Files Created/Modified

- `Frontend2/components/workflow-editor/editor-page.test.tsx` — added `useQuery` to `@tanstack/react-query` mock; added `ReactFlowProvider` + `useReactFlow` to `@xyflow/react` mock; vi.hoisted stable empty cycleMap + frozen v5 UseQueryResult; added Project.boardColumns/taskCount/taskDoneCount fields; updated Test 6 to drop the long-removed Çoğalt header button assertion; vi.fn signature fix for mockUseTransitionAuthority.
- `Frontend2/components/workflow-editor/selection-panel.test.tsx` — split Test 5's `getByText(/Başlatma → Yürütme/)` into two separate text assertions because EdgeEditor renders source + arrow icon + target across separate divs.
- `Frontend2/components/workflow-editor/workflow-canvas.test.tsx` — added ReactFlowProvider + useReactFlow; renamed `edgesUpdatable` → `edgesReconnectable` (React Flow v12 prop rename).
- `Frontend2/components/workflow-editor/phase-edge.test.tsx` — replaced `"right"`/`"left"` string literals with `Position.Right`/`Position.Left` enum members; removed unused `@ts-expect-error` directives.
- `Frontend2/components/lifecycle/milestones-subtab.test.tsx` — declared `transitionAuthorityMock` with `vi.fn<[project: unknown], boolean>(() => true)` (was TS2556 spread-arg).
- `Frontend2/hooks/use-transition-authority.test.tsx` — renamed `isLoading: false` → `isPending: false` in 6 useLedTeams.mockReturnValue blocks; added `as unknown as ReturnType<typeof ledTeamsHook.useLedTeams>` cast.
- `Frontend2/lib/api-client.test.ts` — imported `MockInstance` type, typed `consoleErrorSpy` against it, typed mock interceptor's `error` handler return as `Promise<unknown>` so `.catch(...)` chains type-check.

## Decisions Made

- **Plan literal acceptance vs. real failure modes:** The plan's task 1.1 listed `ReactFlowProvider` + `useReactFlow` as the missing keys for editor-page.test.tsx, but running the test revealed the dominant failure was `useQuery is not defined on the @tanstack/react-query mock` (Phase 13 D-D2 contract drift). Followed the plan's intent (extend mocks to match production) and added BOTH missing surfaces. Documented as Rule 1 (auto-fix bug) deviation.

- **vi.hoisted vs. module-scope const:** Vitest hoists `vi.mock` factories above other top-level statements; a naive `const STABLE_EMPTY_QUERY = ...` declared above `vi.mock(...)` would TDZ-error inside the hoisted factory. Used `vi.hoisted(() => ({ STABLE_EMPTY_QUERY: ... }))` so the constant is created in the hoisted scope and the factory closure captures the post-hoist value.

- **TanStack v5 cast strategy:** Plan task 2.1 suggested writing the full v5 UseQueryResult shape (8+ fields). Instead used `as unknown as ReturnType<typeof hook>` — same TS-clean result, ~6× less code per call site.

- **`useAuth.isLoading` not renamed:** Plan acceptance criterion required removing every `isLoading: false` from use-transition-authority.test.tsx, but `useAuth` returns `AuthContext.isLoading` (NOT a TanStack field) — that name stays. Strict-literal acceptance interpreted as scoped to TanStack mocks only.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] editor-page.test.tsx required `useQuery` mock, not just `ReactFlowProvider`/`useReactFlow`**
- **Found during:** Task 1 (running editor-page.test.tsx after first edits)
- **Issue:** Plan task 1.1 said the missing keys were ReactFlowProvider + useReactFlow. Running the test revealed all 16 failures throw `[vitest] No "useQuery" export is defined on the "@tanstack/react-query" mock` — editor-page.tsx:307 calls `useQuery({queryKey: ["phase-transitions", ...], ...})` (Triage #3) but the existing `@tanstack/react-query` mock at lines 56-58 only exposed `useQueryClient`. Adding ReactFlowProvider/useReactFlow alone would not have moved the needle.
- **Fix:** Added `useQuery: () => STABLE_EMPTY_QUERY` to the `@tanstack/react-query` mock factory; STABLE_EMPTY_QUERY is a vi.hoisted frozen `{data: frozen [], isPending: false, isError: false, isSuccess: true, error: null}`. ALSO added the plan's listed ReactFlowProvider + useReactFlow defensively — production wraps `<ReactFlowProvider>` (workflow-canvas-inner.tsx:129) and is reachable via the dynamic-imported canvas path, so they are correct surface for the mock to expose.
- **Files modified:** Frontend2/components/workflow-editor/editor-page.test.tsx
- **Verification:** `npx vitest run components/workflow-editor/editor-page.test.tsx` 16/16 pass.
- **Committed in:** 3096eeb6 (Task 1 commit)

**2. [Rule 3 - Blocking] Infinite render loop / JS-heap-OOM after adding useQuery mock**
- **Found during:** Task 1 (first re-run of editor-page.test.tsx after adding useQuery mock)
- **Issue:** Initial `useQuery: () => ({ data: undefined, ... })` returned a fresh result-object every render. The editor's `transitions = transitionsQuery.data ?? []` produced a new `[]` reference each render → invalidated `nodeStates` useMemo dep array → triggered setRfNodes useEffect → re-render → loop. Worker terminated with `ERR_WORKER_OUT_OF_MEMORY` after 334s. Same root cause for `useCycleCounters` mock returning `new Map()` each call.
- **Fix:** Wrapped both stub return values in `vi.hoisted(() => ({ STABLE_EMPTY_QUERY, STABLE_EMPTY_CYCLE_MAP }))` so the mock factory captures stable references. Reused the same Map and the same frozen object on every call.
- **Files modified:** Frontend2/components/workflow-editor/editor-page.test.tsx
- **Verification:** Test run completes in 647ms (was 334s + crash); 16/16 pass.
- **Committed in:** 3096eeb6 (Task 1 commit)

**3. [Rule 1 - Bug] Test 6 "Çoğalt" assertion stale (production drift)**
- **Found during:** Task 1 (after the OOM was fixed, 15/16 passed; Test 6 failed on `getByText("Çoğalt")`)
- **Issue:** Header was redesigned at some point — "Çoğalt" was demoted to context-menu-only (editor-page.tsx:830), header now exposes only "Geri" + "Kaydet". Test still asserted on Çoğalt as a header button.
- **Fix:** Removed the `getByText("Çoğalt")` assertion from Test 6; updated the test name to drop "Çoğalt".
- **Files modified:** Frontend2/components/workflow-editor/editor-page.test.tsx
- **Verification:** Test 6 passes; rest of Test 6 assertions (Geri + Kaydet ×N) match production.
- **Committed in:** 3096eeb6 (Task 1 commit)

**4. [Rule 1 - Bug] mockProject TS error — Project type added 3 fields after fixture was written**
- **Found during:** Task 1 (tsc --noEmit on editor-page.test.tsx)
- **Issue:** TS2739 — fixture missing `boardColumns`, `taskCount`, `taskDoneCount` (added to Project type via project-service.ts:93,98,99 after the fixture was written; tests were not consuming them, but tsc complained).
- **Fix:** Added minimal-shape defaults — `boardColumns: [], taskCount: 0, taskDoneCount: 0`.
- **Files modified:** Frontend2/components/workflow-editor/editor-page.test.tsx
- **Verification:** tsc --noEmit clean for editor-page.test.tsx.
- **Committed in:** 3096eeb6 (Task 1 commit)

**5. [Rule 1 - Bug] workflow-canvas.test.tsx — `edgesUpdatable` renamed to `edgesReconnectable`**
- **Found during:** Task 1 (after adding ReactFlowProvider, the `edgesUpdatable` assertion still failed: expected 'false', got 'undefined')
- **Issue:** Plan task 1.3 spec said "verify the readOnly prop is forwarded through the mock". After the mock was extended with ReactFlowProvider, the actual remaining failure was that production passes `edgesReconnectable={!readOnly}` (workflow-canvas-inner.tsx:149), not `edgesUpdatable` — React Flow v12 renamed the prop. The test mock was capturing `edgesUpdatable` which is no longer received.
- **Fix:** Renamed the mock parameter and TS type to `edgesReconnectable`; kept the data-attribute name `data-edges-updatable` so the test assertion does not need to change.
- **Files modified:** Frontend2/components/workflow-editor/workflow-canvas.test.tsx
- **Verification:** All 7 workflow-canvas tests pass.
- **Committed in:** 3096eeb6 (Task 1 commit)

**6. [Rule 1 - Bug] selection-panel.test.tsx — Test 5 regex doesn't span split DOM**
- **Found during:** Task 1 (running selection-panel test)
- **Issue:** Plan acknowledged "Test 5 fix" but didn't specify what. EdgeEditor (selection-panel.tsx:413-437) renders source name in one div, an SVG arrow icon, then target name in another div — `getByText(/Başlatma → Yürütme/)` matches no text node because the names are in separate elements.
- **Fix:** Split the regex assertion into two `getByText("Başlatma")` + `getByText("Yürütme")` assertions.
- **Files modified:** Frontend2/components/workflow-editor/selection-panel.test.tsx
- **Verification:** Test 5 passes.
- **Committed in:** 3096eeb6 (Task 1 commit)

**7. [Rule 3 - Blocking] vi.fn signature requires explicit tuple+return generics**
- **Found during:** Task 2 (after spread-arg fix, tsc still complained TS2554 0 vs 1 args at editor-page.test.tsx:37 and milestones-subtab.test.tsx:40)
- **Issue:** `vi.fn(() => true)` infers `Mock<[], boolean>` (zero args). When the mock factory passes `(project)` to it, TS errors: "Expected 0 arguments, but got 1".
- **Fix:** Declared with explicit `vi.fn<[project: unknown], boolean>(() => true)` so the mock has the right call signature.
- **Files modified:** Frontend2/components/workflow-editor/editor-page.test.tsx, Frontend2/components/lifecycle/milestones-subtab.test.tsx
- **Verification:** tsc --noEmit clean.
- **Committed in:** 3096eeb6 + 675f2b6a (split — editor-page.test.tsx fix added in task 2 commit because the spread-fix was in task 1).

**8. [Rule 3 - Blocking] api-client.test.ts spy type — vi.spyOn generic resolves to wrong overload**
- **Found during:** Task 2 (multiple TS errors during fix iterations)
- **Issue:** `ReturnType<typeof vi.spyOn>` resolves to a generic `MockInstance<unknown[], unknown>` that does not accept assignment from `vi.spyOn(console, "error")`. Trying explicit generics `vi.spyOn<typeof console, "error">` hits the *Properties* overload (accessType-required) instead of the *Methods* overload, producing TS2344. Tried multiple fix approaches before settling on importing `MockInstance` from vitest and typing the variable directly.
- **Fix:** `import type { MockInstance } from "vitest"`; declare `let consoleErrorSpy: MockInstance<[message?: unknown, ...optionalParams: unknown[]], void>`. Also typed mock interceptor's `error` handler return as `Promise<unknown>` so the test bodies' `.catch(...)` chains type-check (was TS2571 ×5).
- **Files modified:** Frontend2/lib/api-client.test.ts
- **Verification:** tsc --noEmit clean for api-client.test.ts; tests still 5/5 pass at runtime.
- **Committed in:** 675f2b6a (Task 2 commit)

---

**Total deviations:** 8 auto-fixed (5× Rule 1 production-drift / contract-drift bugs, 3× Rule 3 blocking-issue type/runtime fixes)
**Impact on plan:** All 8 auto-fixes were strictly required to deliver the plan's must_have truths (19 tests green + tsc-clean + verification command exits 0). The plan's task lists captured the right *intent* but underspecified the actual failure modes; running the tests surfaced precise root causes that the plan would have missed. No scope creep — every change kept production code untouched and was contained to the seven test files in `files_modified`.

## Issues Encountered

- **Initial test run hit OOM after the first edit:** Adding `useQuery` to the @tanstack/react-query mock without stable references caused the editor's `nodeStates` useMemo + `setRfNodes` useEffect to fire on every render with new dep references. The vitest worker exhausted JS heap after ~334s. Diagnosed by reading the editor's data flow + dep arrays, fixed by introducing `vi.hoisted` stable references for both `STABLE_EMPTY_QUERY` (frozen v5 UseQueryResult) and `STABLE_EMPTY_CYCLE_MAP` (single Map instance).
- **Plan path drift:** Plan frontmatter listed `Frontend2/components/workflow-editor/use-transition-authority.test.tsx` but the file actually lives at `Frontend2/hooks/use-transition-authority.test.tsx`. Located the real file via `Glob` and proceeded with the correct path. (No plan edit; tracked in this summary.)

## User Setup Required

None — test-only changes; no external services configured.

## Next Phase Readiness

- Frontend2 vitest baseline is GREEN for the workflow-editor + lifecycle/milestones-subtab + lib/api-client surface (96/96 tests across 14 test files).
- Plan 15-04+ (RBAC routes / role gates / etc.) can now detect their own regressions against this clean baseline — the original blocker for CONTEXT D-4.6 ("can't tell if Phase 15 RBAC plans regress anything") is removed for this surface.
- `npx tsc --noEmit` still has 14 unrelated errors in other test files (criteria-editor-panel.test.tsx, artifacts-subtab.test.tsx, evaluation-report-card.test.tsx, admin/layout.test.tsx, admin/download-authenticated.test.ts) — those are SCOPE BOUNDARY out-of-scope per Plan 15-01 (its files_modified list excludes them) and are pre-existing drift to be tracked under future TIDY plans.
- Patterns established in this plan (vi.hoisted stable refs for vi.mock, full @xyflow/react mock surface, TanStack v5 `as unknown as` cast, `vi.fn<[arg], R>` typed signature) are reusable templates for any future test that mocks the same modules.

---
*Phase: 15-rbac-redesign-and-phase-14-deferred-cleanup*
*Completed: 2026-04-29*

## Self-Check: PASSED

- FOUND: `.planning/phases/15-rbac-redesign-and-phase-14-deferred-cleanup/15-01-SUMMARY.md`
- FOUND commit `3096eeb6` (Task 1 — extend @xyflow/react + @tanstack/react-query mocks)
- FOUND commit `675f2b6a` (Task 2 — TanStack v5 cast + spread-arg + api-client TS errors)
- FOUND modified files (verified via `git status --short`):
  - `Frontend2/components/workflow-editor/editor-page.test.tsx`
  - `Frontend2/components/workflow-editor/selection-panel.test.tsx`
  - `Frontend2/components/workflow-editor/workflow-canvas.test.tsx`
  - `Frontend2/components/workflow-editor/phase-edge.test.tsx`
  - `Frontend2/components/lifecycle/milestones-subtab.test.tsx`
  - `Frontend2/hooks/use-transition-authority.test.tsx`
  - `Frontend2/lib/api-client.test.ts`
- Verification command result: `cd Frontend2 && npx vitest run components/workflow-editor/ components/lifecycle/milestones-subtab.test.tsx lib/api-client.test.ts` → 14/14 files, 96/96 tests passed.
