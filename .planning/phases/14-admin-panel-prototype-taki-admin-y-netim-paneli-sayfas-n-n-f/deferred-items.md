# Phase 14 — Deferred Items (out-of-scope discoveries during execution)

> Discoveries made during plan execution that are NOT directly caused by the
> current task's changes. Logged here for visibility; NOT fixed in this plan.

## Plan 14-01 (Wave 0)

### Pre-existing TypeScript build error in app/(shell)/reports/page.tsx

**Discovered during:** Plan 14-01 final `npm run build` smoke check.

**Symptom:**
```
./app/(shell)/reports/page.tsx:158:11
Type error: Type '"warning"' is not assignable to type
  '"neutral" | "primary" | "success" | "danger" | "info"'.
```

**Origin:** Phase 13 Plan 13-08 (`5b647890 feat(13-08): PhaseReportsSection`).
The StatCard `tone="warning"` value was added when StatCard's tone enum did
NOT include "warning". Subsequent StatCard refactor narrowed the union.

**Why deferred:**
- Out of scope for Plan 14-01 — not introduced by Wave 0 code.
- The Plan 14-01 unit + integration tests pass; only the final `next build`
  type-checker catches it because `npm run build` runs strict type-check
  across the entire app tree.
- `npm run lint` shows ~115 pre-existing problems across the codebase from
  Phases 11-13; Plan 14-01 introduced minor `any` warnings on error handlers
  consistent with existing hook patterns (use-projects.ts uses `unknown` but
  many other hooks use `any` — no project-wide convention enforced).

**Action item:** A future cleanup phase or a Phase 14-02 follow-up plan should
fix the StatCard tone usage in reports/page.tsx (rename to "neutral" or extend
the StatCard tone enum to include "warning").

## Plan 14-09 (Wave 3)

### Pre-existing TypeError on test_project_workflow_patch.py 422-path tests

**Discovered during:** Plan 14-09 full integration regression run
(`cd Backend && python -m pytest -q tests/integration/`).

**Symptom (3 failures):**
```
tests/integration/api/test_project_workflow_patch.py::test_patch_with_legacy_n1_id_returns_422 — FAILED
tests/integration/api/test_project_workflow_patch.py::test_patch_with_zero_initial_returns_422 — FAILED
tests/integration/api/test_project_workflow_patch.py::test_patch_with_zero_final_returns_422 — FAILED

E   TypeError: Object of type ValueError is not JSON serializable
```

**Origin:** Phase 12 Plan 12-10 added Pydantic `WorkflowConfig` validation on
the project PATCH endpoint. When the validation rejects a payload, the raised
`ValueError` is bubbling up into Starlette's JSONResponse render, which then
fails to serialize because the exception object itself is in the response body
(not converted to a 422 detail string first).

**Verification this is pre-existing:** Confirmed by running the same tests on
the immediate parent of Plan 14-09's first commit (HEAD `98e9b6be` —
`feat(14-09): enrich task_repo + project_repo audit emissions per D-D2`,
which only touches audit metadata writes, not the WorkflowConfig validator
or the PATCH endpoint exception handler). All 3 failed pre-Plan-14-09
edits as well — the failures persist after `git stash` of all Task 2 edits.

**Why deferred:**
- Out of scope for Plan 14-09 — Plan 14-09 only touches audit_log emission
  in repositories + use cases, never the project PATCH endpoint, never
  Pydantic validation surface, never JSONResponse error handling.
- The Plan 14-09 baseline gate test (`test_activity.py + test_user_activity.py`)
  is green (21/21). The new test (`test_audit_log_enrichment.py`) is green
  (3/3). No regression introduced.

**Action item:** Audit `app/api/v1/projects.py` PATCH handler for missing
`try/except ValidationError → HTTPException(422, detail=str(e))` translation,
or wire a global exception handler for `ValueError` raised inside Pydantic
validators. Likely a 1-2 line fix in the project router. Belongs in a
Phase 14-12 cleanup plan or a separate bug-fix plan.

## Plan 14-10 (Wave 3)

### Pre-existing workflow-editor + selection-panel + workflow-canvas test failures

**Discovered during:** Plan 14-10 full Frontend2 vitest regression run
(`cd Frontend2 && npm run test -- --run`).

**Symptom (19 failures across 3 files):**
- `components/workflow-editor/editor-page.test.tsx` — 16 failures (Test 6 / 7 /
  8 / 9 / 10 / 11 / 12 / 13 / 14 / 15 / 16 / 17 / 18 / 19 / 20 / 21).
- `components/workflow-editor/selection-panel.test.tsx` — 1 failure (Test 5).
- `components/workflow-editor/workflow-canvas.test.tsx` — 2 failures
  (readOnly forwarding for ReactFlow lock props).

**Verification this is pre-existing:** Confirmed by running the same suites
on the parent of Plan 14-10's first commit (HEAD before `e2376bac`).
`git stash` of all Plan 14-10 edits + re-running yielded the SAME 19
failures. Plan 14-10 does NOT touch any workflow-editor / selection-panel
/ workflow-canvas file.

**Origin:** Likely Phase 12 / Phase 13 workflow-editor plans + ReactFlow
upgrade drift. The same `Cannot find module 'reactflow'` / `ReactFlowProvider`
hydration errors appear in the test transcript. Pre-existing TS errors
(captured during Plan 14-10 `tsc --noEmit`) confirm separate root causes:
`milestones-subtab.test.tsx`, `editor-page.test.tsx`, `phase-edge.test.tsx`,
`use-transition-authority.test.tsx`, `lib/api-client.test.ts`.

**Why deferred:**
- Out of scope for Plan 14-10 — Plan 14-10 only touches
  `Frontend2/lib/audit-event-mapper.ts`, `Frontend2/lib/activity/event-meta.ts`,
  `Frontend2/components/activity/activity-row.tsx` and their `.test.ts(x)`
  pairs. None of these files import from or are imported by the workflow-editor
  surface. Plan 14-10 unit + RTL tests are green: 40/40 mapper + 18/18
  activity-row = 58/58 green for files this plan owns.
- `npm run build` exits 0 — production build green.

**Action item:** A future workflow-editor stabilization plan should: (a) audit
`reactflow` import paths and version pins, (b) fix the `Position` type-mismatch
TS errors in `phase-edge.test.tsx`, (c) clean up the
`use-transition-authority.test.tsx` `UseQueryResult` type-cast, (d) update
`milestones-subtab.test.tsx` spread-arg fixture. Not blocking Plan 14-10
ship.

## Plan 14-12 (Wave 4 — Phase Gate)

### Pre-existing Backend unit-test failures (11 total)

**Discovered during:** Plan 14-12 Task 2 final smoke run
(`cd Backend && python -m pytest -q`).

**Symptom (11 failures across 5 files; all in `tests/unit/`, not `tests/integration/`):**

```
tests/unit/application/test_manage_phase_reports.py::test_cycle_number_auto_calc_from_audit
tests/unit/application/test_manage_phase_reports.py::test_cycle_number_explicit_override
tests/unit/application/test_phase_gate_use_case.py::test_transition_success_no_criteria
tests/unit/application/test_phase_gate_use_case.py::test_criteria_unmet_raises_422_without_override
tests/unit/application/test_phase_gate_use_case.py::test_override_allowed_in_sequential_locked
tests/unit/application/test_phase_gate_use_case.py::test_open_tasks_move_to_next_with_exceptions
tests/unit/application/test_register_user.py::test_register_user_success
tests/unit/application/test_register_user.py::test_register_user_already_exists
tests/unit/infrastructure/test_task_repo_soft_delete.py::test_update_task_writes_audit_row
tests/unit/infrastructure/test_task_repo_soft_delete.py::test_update_task_no_audit_row_for_unchanged_fields
tests/unit/test_deps_package_structure.py::test_stub_submodules_exist
```

**Verification this is pre-existing:** `git stash` of all working-directory
changes (CLAUDE.md, debug.md) + re-running `python -m pytest tests/unit/`
yielded the SAME 11 failures (146 passed). Plan 14-12 touches ZERO Backend
files (only `Frontend2/e2e/*.spec.ts` + `.planning/*` markdown), so this
suite cannot have been broken by this plan.

**Origin (likely):** Multiple sources — phase-gate use case + manage_phase_reports
hint at Phase 12 or Phase 13 unit-test drift. `test_register_user` likely
breaks because the unit test mocks an older repo signature that has since
been updated. `test_deps_package_structure` is asserting an empty `__all__`
in a module that has since exported `get_milestone_repo`.

**Why deferred:**
- Out of scope for Plan 14-12 — Plan 14-12 is the phase gate (e2e specs +
  UAT checklist + VALIDATION.md flip). Zero Backend touch.
- The Backend INTEGRATION suite (`tests/integration/`) — the actual contract
  for /admin/* endpoints — passes 162/165 (3 pre-existing
  test_project_workflow_patch.py failures from Phase 12, already documented
  above under Plan 14-09's deferred entry).
- The Plan 14-12 success_criteria explicitly states "modulo the 3 pre-existing
  test_project_workflow_patch.py failures from Phase 12" — these unit failures
  are an additional pre-existing set that surfaces only when running the full
  pytest suite (not the integration-only smoke).

**Action item:** A future Backend test stabilization plan should:
(a) Update `test_register_user.py` to match current `IUserRepository` signature.
(b) Fix `test_phase_gate_use_case.py` mock fixtures (4 failures suggest a
    common ProjectPhase / phase-gate-criteria contract drift).
(c) Update `test_manage_phase_reports.py` cycle-number computation against
    current audit-log-driven derivation.
(d) Reconcile `test_task_repo_soft_delete.py` audit-row expectations with
    Plan 14-09's enriched audit emission semantics (this is likely the most
    cleanly-related issue — the unit test predates the enrichment).
(e) Update `test_deps_package_structure.py::test_stub_submodules_exist` to
    expect `get_milestone_repo` in `app.api.deps.milestone.__all__`.
Not blocking Plan 14-12 phase-gate ship.

## Plan 14-13 (Cluster A — UAT 401 fix)

### Pre-existing workflow-editor test failures

**Discovered during:** Plan 14-13 final regression `npx vitest run` (full
Frontend2 suite).

**Symptom:** 19 tests failing across 3 files:
- `components/workflow-editor/editor-page.test.tsx` (16 cases — Tests 6–21)
- `components/workflow-editor/selection-panel.test.tsx` (1 case — Test 5)
- `components/workflow-editor/workflow-canvas.test.tsx` (2 cases — readOnly forwards)

**Origin:** Pre-existing — verified by checking out `c3147c31` (the
commit BEFORE Plan 14-13 started) and running the same suite: same 19
failures, same files. Plan 14-13 did NOT touch `components/workflow-editor/`
or any of its dependencies.

**Scope decision:** OUT-OF-SCOPE per Plan 14-13's `must_haves.truths` (which
covers admin downloads only — 3 endpoints, 1 helper, 1 layout test mock
swap). Rule 1/2/3 auto-fix is bounded to issues "DIRECTLY caused by the
current task's changes."

**Verification (Plan 14-13 scope only):** `npx vitest run components/admin
lib/admin "app/(shell)/admin"` reports 12/12 files / 57/57 tests green;
`npm run build` succeeds.

**Action item:** A future workflow-editor stabilization plan should
investigate whether these failures correspond to a React 19 / Next 16
upgrade, a `@xyflow/react@12.10.2` API drift, or a TanStack Query v5
contract change. The failures predate Phase 14 entirely (Plan 14-13 is the
last gap-closure plan in the phase).

