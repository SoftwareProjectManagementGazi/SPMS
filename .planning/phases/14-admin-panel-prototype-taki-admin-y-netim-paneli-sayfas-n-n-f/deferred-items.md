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
