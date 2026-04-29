---
phase: 15-rbac-redesign-and-phase-14-deferred-cleanup
plan: 02
subsystem: testing

tags: [pytest, pydantic-v2, validation-error, value-error, requires-db-marker, phase-12-drift, phase-14-d-d2, audit-metadata]

# Dependency graph
requires:
  - phase: 09-backend-schema-entities-apis
    provides: deps/* sub-modules with __all__ exports (BACK-07 / 09-05/06/07 populated milestone, artifact, phase_report providers)
  - phase: 12-lifecycle-phase-gate-workflow-editor
    provides: ExecutePhaseTransitionUseCase D-16/D-17 edge check, WorkflowConfig D-19 rule 4 zero-initial/zero-final validators, projects.py PATCH 422 path
  - phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
    provides: Plan 14-09 D-D2 enriched audit metadata (project_key + project_name + task_key + task_title snapshots inside AuditLogModel.extra_metadata)
provides:
  - Backend pytest unit baseline restored (157 passed, 0 failed)
  - 3 test_project_workflow_patch.py 422 tests green (legacy_n1_id / zero_initial / zero_final)
  - requires_db marker live (registration + auto-skip when DB unreachable)
  - 46 integration files marker-tagged for `pytest -m 'not requires_db'` developer iter
affects: [phase-15-rbac, plan-15-04+, plan-15-05+ — rely on a clean unit + integration baseline before adding RBAC test fixtures]

# Tech tracking
tech-stack:
  added: []  # No new libraries — surgical edits only
  patterns:
    - "Pydantic v2 ValidationError → 422 envelope normalization (errors(include_context=False) + value_error-only detection → INVALID_WORKFLOW_CONFIG envelope)"
    - "pytest_collection_modifyitems DB-probe auto-skip (Pattern 7 from 15-RESEARCH.md): probe wrapped in try/except so collection NEVER aborts; pool_pre_ping=True for fast-fail"
    - "Module-level pytestmark = pytest.mark.<marker> for blanket marker rollout across a test directory"
    - "Test mock side_effect-list pattern for repos that perform N sequential session.execute() calls"

key-files:
  created:
    - "Backend/tests/integration/test_requires_db_marker.py"
    - ".planning/phases/15-rbac-redesign-and-phase-14-deferred-cleanup/deferred-items.md"
  modified:
    - "Backend/app/api/v1/projects.py"
    - "Backend/tests/conftest.py"
    - "Backend/tests/unit/application/test_register_user.py"
    - "Backend/tests/unit/application/test_phase_gate_use_case.py"
    - "Backend/tests/unit/application/test_manage_phase_reports.py"
    - "Backend/tests/unit/infrastructure/test_task_repo_soft_delete.py"
    - "Backend/tests/unit/test_deps_package_structure.py"
    - "Backend/tests/integration/api/*.py (16 files marker-tagged)"
    - "Backend/tests/integration/infrastructure/*.py (8 files marker-tagged)"
    - "Backend/tests/integration/test_*.py (22 files marker-tagged)"

key-decisions:
  - "Plan 15-02 TIDY-03: chosen envelope strategy is value_error-only detection of e.errors(), so the FE error_code taxonomy (D-32 INVALID_WORKFLOW_CONFIG) gets the stable contract while non-validator validation failures still surface the structured Pydantic .errors() list."
  - "Plan 15-02 TIDY-05: marker rollout via Python script (not sed) — the script broke 7 multi-line `from x import (...)` files and they were repaired via a follow-up paren-depth-aware fix. Documented as Issue #1 below."
  - "Plan 15-02 TIDY-02: realignment-not-replacement for all 5 unit test files. Skip-mark / delete alternatives REJECTED per CONTEXT D-4.2 — every drifted assertion now reflects the production contract."

patterns-established:
  - "Pattern 1: Pydantic v2 ValueError-from-validator → 422 envelope. When an `except (ValidationError, ValueError)` clause needs to surface a stable error_code, inspect e.errors(include_context=False) for `type=='value_error'` to detect custom-validator failures and emit `{error_code, message}` instead of the raw .errors() list."
  - "Pattern 2: requires_db pytest_collection_modifyitems hook. asyncio.run + create_async_engine(pool_pre_ping=True) + try/except wrapping = fast (<100ms on connection-refused) and crash-proof DB probe at collection time."
  - "Pattern 3: Module-level pytestmark for blanket marker assignment. Adding `pytestmark = pytest.mark.<marker>` after the import block applies the marker to every test in the file with one line — no decorator clutter on individual tests."

requirements-completed: [TIDY-02, TIDY-03, TIDY-05]

# Metrics
duration: 11min
completed: 2026-04-29
---

# Phase 15 Plan 15-02: Backend pytest unit drift fix + projects.py PATCH ValueError → 422 + requires_db marker auto-skip Summary

**Backend pytest baseline restored: 11 unit failures cleared (5 files realigned to current production signatures), projects.py PATCH ValueError surfaces a structured 422 envelope (3 integration tests green), and the `requires_db` pytest marker auto-skips DB-bound tests when Postgres is unreachable (46 integration files marker-tagged).**

## Performance

- **Duration:** ~10 min 23 sec
- **Started:** 2026-04-29T00:58:43Z
- **Completed:** 2026-04-29T01:09:06Z
- **Tasks:** 2 (TIDY-02 inline + TIDY-03/TIDY-05 inline)
- **Files modified:** 53 (5 unit tests + 46 integration files marker rollout + projects.py + conftest.py + 1 new marker test)

## Accomplishments

- **TIDY-02:** All 11 backend pytest unit failures resolved — 5 files realigned (no production code touched):
  - `test_register_user.py`: MockUserRepository implements 3 abstract methods Phase 9 added (`update_password`, `search_by_email_or_name`, `get_all_by_role`).
  - `test_phase_gate_use_case.py`: workflow fixture includes a flow edge so Phase 12 D-16/D-17 InvalidTransitionError edge-existence check passes; archived-target test gets its own edge so the archived-node check fires first.
  - `test_manage_phase_reports.py`: `audit_repo.create_with_metadata` mocks are AsyncMock (Plan 14-09 D-D2 added the audit emit inside CreatePhaseReportUseCase).
  - `test_task_repo_soft_delete.py`: `session.execute.side_effect` returns task model on 1st call and project model on 2nd (Plan 14-09 D-D2 added a ProjectModel SELECT for enriched audit metadata); assertions extended to cover the new envelope (project_key, project_name, task_key, task_title, old_value_label, new_value_label).
  - `test_deps_package_structure.py`: stub assertions updated from BACK-07 RED-phase `__all__ == []` to GREEN-phase `["get_<x>_repo"]`.
- **TIDY-03:** projects.py PATCH/PUT handler now catches `(ValidationError, ValueError)` and emits a stable `{error_code: "INVALID_WORKFLOW_CONFIG", message: <cleaned-msg>}` envelope when the failure stems from a Pydantic v2 model_validator-raised ValueError. Three previously-failing integration tests (legacy_n1_id, zero_initial, zero_final) now green; 2 happy-path tests stay green.
- **TIDY-05:** Backend/tests/conftest.py extended with:
  - `pytest_configure` registering the `requires_db` marker.
  - `pytest_collection_modifyitems` hook probing `settings.DATABASE_URL` via `pool_pre_ping=True` and adding skip markers to every `requires_db`-tagged test on probe failure. Probe wrapped in try/except so collection NEVER aborts (T-15-02 Test-01 mitigation).
  - 46 integration files marker-tagged via module-level `pytestmark = pytest.mark.requires_db`.
  - New `tests/integration/test_requires_db_marker.py` exercising marker registration + behavior (2 tests).
  - Developer iter `pytest -m 'not requires_db'` now correctly deselects 245 DB-bound tests; non-DB subset (158 tests) runs in <1s.

## Task Commits

Each task was committed atomically:

1. **Task 1: Realign 5 unit test files (TIDY-02 — 11 failures → 0)** — `fcc1d388` (test)
2. **Task 2: TIDY-03 ValueError → 422 + TIDY-05 requires_db marker auto-skip + 46-file marker rollout** — `cf7097ae` (feat)

_(STATE.md / ROADMAP.md / REQUIREMENTS.md updates intentionally NOT included — orchestrator owns those writes after the wave completes per executor instructions.)_

## Files Created/Modified

### Created

- `Backend/tests/integration/test_requires_db_marker.py` — 2 smoke tests for the `requires_db` marker (registration + behavior).
- `.planning/phases/15-rbac-redesign-and-phase-14-deferred-cleanup/deferred-items.md` — pre-existing test_admin_destructive_ops.py email-validation failure (out of scope; verified not a Plan 15-02 regression via git-stash check).

### Modified

#### Production

- `Backend/app/api/v1/projects.py` — PATCH/PUT update_project except clause widened to `(ValidationError, ValueError)`. Detail computed via `e.errors(include_context=False)` (strips raw exception ctx) with value_error-only branch emitting `INVALID_WORKFLOW_CONFIG` envelope.

#### Test infrastructure

- `Backend/tests/conftest.py` — appended `pytest_configure` (marker registration) + `pytest_collection_modifyitems` (DB probe → auto-skip).

#### Unit tests (TIDY-02 realignment)

- `Backend/tests/unit/application/test_register_user.py`
- `Backend/tests/unit/application/test_phase_gate_use_case.py`
- `Backend/tests/unit/application/test_manage_phase_reports.py`
- `Backend/tests/unit/infrastructure/test_task_repo_soft_delete.py`
- `Backend/tests/unit/test_deps_package_structure.py`

#### Integration test marker rollout (46 files)

- `Backend/tests/integration/test_*.py` (22 files)
- `Backend/tests/integration/api/test_*.py` (16 files)
- `Backend/tests/integration/infrastructure/test_*.py` (8 files)

Each gained a single `pytestmark = pytest.mark.requires_db` line (after the import block) plus an `import pytest` if missing.

## Decisions Made

1. **Envelope detection strategy for TIDY-03:** Chose `value_error-only` detection of `e.errors()` (every entry's `type == 'value_error'`) to decide between the `INVALID_WORKFLOW_CONFIG` envelope and the structured Pydantic `.errors()` list. This preserves the FE D-32 contract (single error_code for FE save-flow toast) while still surfacing field-level errors for non-validator schema failures. Alternative considered & rejected: always emit envelope (loses field-level info for Pydantic schema-shape failures).
2. **`include_context=False` on errors():** Required because Pydantic v2 packs the raw ValueError into `ctx.error`, which JSON cannot serialize. The flag strips that ctx, fixing the latent JSON-serialization bug in the existing TIDY-03 code path. Documented inline.
3. **Conservative marker rollout:** Added `pytestmark = pytest.mark.requires_db` to all 46 non-empty integration test files (including in-memory test files like `test_user_activity.py`), even though some don't strictly need DB. Trade-off: slightly slower iteration loop for "not requires_db" since those marker-tagged files won't run, but the alternative (per-file analysis) risks under-marking and false negatives in the hook. Plan 15-02 D-4.4 says "~40 dosya" so 46 is in range.
4. **No new test infrastructure libraries:** Hook implementation uses only `asyncio` + `sqlalchemy` already present.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pydantic v2 ValidationError.errors() returned non-JSON-serializable ctx field**
- **Found during:** Task 2 (initial verification of test_project_workflow_patch.py)
- **Issue:** After widening the except clause to `(ValidationError, ValueError)` per the plan's literal task 1.6 instructions, the 3 target tests STILL failed — but with a NEW error: `TypeError: Object of type ValueError is not JSON serializable`. Root cause: Pydantic v2 wraps custom-validator-raised `ValueError` into a `ValidationError`, and `.errors()` returns dicts containing `ctx={"error": ValueError(...)}` — the raw exception object that JSONResponse cannot encode.
- **Fix:** Layered two refinements on top of the plan's literal instruction:
  1. `e.errors(include_context=False)` strips `ctx.error`.
  2. When every error entry has `type == 'value_error'` (purely a custom-validator failure), surface the `INVALID_WORKFLOW_CONFIG` envelope per CONTEXT D-4.3 / RESEARCH Pitfall 4. Otherwise return the cleaned errors list.
- **Files modified:** `Backend/app/api/v1/projects.py` (only the except block — surgical extension of the plan's literal patch).
- **Verification:** All 5 test_project_workflow_patch.py tests pass (3 previously-failing + 2 happy-path) → `34 passed, 1 xfailed` on the full plan verification command.
- **Committed in:** `cf7097ae` (Task 2 commit)
- **Documented inline:** the Phase 15 Plan 15-02 TIDY-03 comment block in projects.py covers RESEARCH Pitfall 4 + CONTEXT D-4.3 + the ctx-error wrinkle.

**2. [Rule 3 - Blocking] Marker-rollout script inserted pytestmark inside multi-line `from x import (...)` blocks (7 files)**
- **Found during:** Task 2 (verification of `pytest -m 'not requires_db'` developer-iter command)
- **Issue:** The Python rollout script tracked imports line-by-line and treated `from x import (` as a single-line import, then inserted the marker block before the actual imports closed with `)`. Result: 7 files had `pytestmark = pytest.mark.requires_db` between the opening `(` and the import body, causing collection-time `SyntaxError` and blocking 7 test files.
- **Fix:** Wrote a parenthesis-depth-aware repair script that:
  1. Located and excised the misplaced `\n# Plan 15-02 ... \npytestmark = ...` 3-line block.
  2. Walked the import block tracking paren-depth across continuation lines.
  3. Re-inserted the marker block AFTER the closing `)` of the last multi-line import.
- **Files affected:** `test_admin_audit_serialization.py`, `test_admin_stats_done_columns.py`, `test_approve_join_request.py`, `test_audit_log_enrichment.py`, `test_charts.py`, `test_create_join_request.py`, `test_execute_phase_transition.py`.
- **Verification:** `python -c "import ast; ast.parse(...)"` on each fixed file + `python -m pytest --collect-only -q tests/integration/` → 246 tests collected, 0 errors.
- **Committed in:** `cf7097ae` (Task 2 commit — the corrected files were committed; the broken interim state was never committed).

---

**Total deviations:** 2 auto-fixed (1 Rule-1 bug, 1 Rule-3 blocking)

**Impact on plan:** Both deviations were necessary refinements to the plan's literal patch instructions. The Rule-1 fix in projects.py is the actual root-cause fix the test-driven contract demanded — without it the plan's 422 envelope wouldn't actually serialize. The Rule-3 fix was a tooling defect in the marker rollout, not a plan defect. No scope creep — both stayed within the file boundaries the plan declared.

## Issues Encountered

**Issue 1: Marker rollout regex fragility on multi-line imports.** The first-pass rollout script assumed `from x import y` was always single-line. Repair via paren-depth-aware re-walking — see Deviation #2 above. Lesson for future tooling: a 30-line ast.parse-based locator would have been safer than a regex/line walker.

**Issue 2: Pre-existing test_admin_destructive_ops.py failures (NOT a regression).** During the final regression run, 2 tests in `test_admin_destructive_ops.py` failed with email-validation errors on `'authclient+Project Manager@testexample.com'` (invalid: space in role name). Verified pre-existing via `git stash` regression. Logged to `.planning/phases/15-.../deferred-items.md` for Phase 15 RBAC plans (15-04+) which will likely overhaul role names.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 15-04+ baseline ready:** unit suite green (157 passed); 3 project_workflow_patch tests green; `requires_db` marker live and exercised; developer iter `pytest -m 'not requires_db'` confirmed working.
- **Deferred items captured:** the pre-existing test_admin_destructive_ops.py email-validation failure is documented and traceable to either Plan 15-04+ (if RBAC redesign slugifies role names) or a follow-up Plan 15-XX-TIDY-06.
- **No blockers** for the wave 0b → wave 1 transition.

## Self-Check: PASSED

Verifications run after SUMMARY.md draft:

- `Backend/app/api/v1/projects.py` exists ✓ (modified)
- `Backend/tests/conftest.py` exists ✓ (modified)
- `Backend/tests/integration/test_requires_db_marker.py` exists ✓ (created)
- `.planning/phases/15-rbac-redesign-and-phase-14-deferred-cleanup/deferred-items.md` exists ✓ (created)
- 5 unit test files exist ✓ (modified)
- 46 integration files contain `pytestmark = pytest.mark.requires_db` (verified via grep)
- Commit `fcc1d388` exists in `git log` ✓ (Task 1)
- Commit `cf7097ae` exists in `git log` ✓ (Task 2)
- Verification command `pytest tests/unit/application/test_register_user.py tests/unit/application/test_phase_gate_use_case.py tests/unit/application/test_manage_phase_reports.py tests/unit/infrastructure/test_task_repo_soft_delete.py tests/unit/test_deps_package_structure.py tests/integration/api/test_project_workflow_patch.py tests/integration/test_requires_db_marker.py -q` → `34 passed, 1 xfailed` ✓
- `pytest tests/unit/ -q` → `157 passed, 27 xfailed` (zero regression) ✓
- Acceptance criteria literals all satisfied: `(ValidationError, ValueError)` (1) + `INVALID_WORKFLOW_CONFIG` (3) + `def pytest_configure` + `def pytest_collection_modifyitems` + `requires_db` marker registration string + 46 marker-tagged files (≥10 required) ✓

---
*Phase: 15-rbac-redesign-and-phase-14-deferred-cleanup*
*Plan: 02 — TIDY-02 + TIDY-03 + TIDY-05*
*Completed: 2026-04-29*
