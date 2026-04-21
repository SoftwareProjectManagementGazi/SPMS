---
phase: 09-backend-schema-entities-apis
plan: "08"
subsystem: backend-api
tags: [phase-gate, advisory-lock, idempotency, rate-limit, workflow-validation, pydantic, kahn-algorithm, API-01, API-10]
dependency_graph:
  requires:
    - ["09-04", "09-05", "09-06", "09-07"]
  provides:
    - "idempotency_cache.py: D-50/D-53 in-memory rate limit (10s) + 10min TTL cache keyed by (user_id, project_id, idempotency_key)"
    - "workflow_dtos.py: WorkflowNode/Edge/Group/Config Pydantic with D-55 business rules (unique IDs, edge refs, Kahn cycle detection, group bounds)"
    - "phase_gate_service.py: acquire_project_lock_or_fail using pg_try_advisory_xact_lock with 63-bit hash masking"
    - "phase_transition_dtos.py: PhaseTransitionRequestDTO/ResponseDTO/CriterionResult/TaskException"
    - "execute_phase_transition.py: 7-step atomic use case (lock->load->mode->nodes->criteria->moves->audit)"
    - "audit_repo.py: create_with_metadata for D-08 full envelope (extra_metadata JSONB column)"
    - "phase_transitions.py router: POST /api/v1/projects/{id}/phase-transitions"
    - "22 unit tests + 9 integration tests (7 skip without migration 005)"
  affects:
    - "Backend/app/application/services/idempotency_cache.py"
    - "Backend/app/application/dtos/workflow_dtos.py"
    - "Backend/app/application/services/phase_gate_service.py"
    - "Backend/app/application/dtos/phase_transition_dtos.py"
    - "Backend/app/application/use_cases/execute_phase_transition.py"
    - "Backend/app/domain/repositories/audit_repository.py"
    - "Backend/app/infrastructure/database/repositories/audit_repo.py"
    - "Backend/app/api/v1/phase_transitions.py"
    - "Backend/app/api/main.py"
tech_stack:
  added: []
  patterns:
    - "Error code taxonomy: error_code key in detail body alongside HTTP status (e.g. {error_code: PHASE_GATE_LOCKED, message: ...}) — carry forward to Phase 10-13"
    - "Rate-limit + idempotency order: rate check first -> cache lookup -> cache miss records request -> run use case -> cache store (double-click returns cached, no quota consumed)"
    - "Advisory lock semantics: pg_try_advisory_xact_lock is non-blocking; auto-releases on tx commit/rollback (no manual unlock)"
    - "63-bit hash masking: hash(f'phase_gate:{project_id}') & 0x7FFFFFFFFFFFFFFF — Postgres bigint signed int64 safety"
    - "Kahn's topological sort for cycle detection in sequential-flexible mode: O(V+E), feedback edges exempt from check"
    - "TDD flow: RED commit (test) -> GREEN commit (feat) — both per-task commits preserved in history"
    - "Integration test raw SQL uses bindparams (:key, :pc) not f-string JSON embedding — avoids text() colon-parse error with JSONB literals"
    - "Integration tests skip when migration 005 not applied (same Pitfall 1 pattern as test_milestone_repo_integration.py)"
key_files:
  created:
    - Backend/app/application/services/idempotency_cache.py
    - Backend/app/application/dtos/workflow_dtos.py
    - Backend/app/application/services/phase_gate_service.py
    - Backend/app/application/dtos/phase_transition_dtos.py
    - Backend/app/application/use_cases/execute_phase_transition.py
    - Backend/app/api/v1/phase_transitions.py
    - Backend/tests/unit/application/test_idempotency_cache.py
    - Backend/tests/unit/application/test_workflow_validation.py
    - Backend/tests/unit/application/test_phase_gate_use_case.py
    - Backend/tests/integration/api/test_phase_transitions_api.py
    - Backend/tests/integration/api/test_workflow_validation_api.py
  modified:
    - Backend/app/domain/repositories/audit_repository.py
    - Backend/app/infrastructure/database/repositories/audit_repo.py
    - Backend/app/api/main.py
key-decisions:
  - "Error code taxonomy: error_code key added alongside HTTP status in detail body (e.g., {error_code: PHASE_GATE_LOCKED, message: ...}). Standardized for Phase 10-13 to use consistently."
  - "Criteria evaluation shape: 3 auto checks (all_tasks_done, no_critical_tasks, no_blockers); manual items always unmet unless allow_override. Future phases extend _evaluate_criteria with more checks."
  - "Rate-limit + idempotency order: rate check first -> cache lookup -> cache miss records request -> run use case -> cache store. Ensures double-click returns cached response without consuming rate quota."
  - "Advisory lock semantics: pg_try_advisory_xact_lock non-blocking; auto-releases at tx commit/rollback (no manual unlock needed)."
  - "Integration tests use bindparams (:key, :pc with CAST(:pc AS jsonb)) for JSONB inserts — text() colons in raw JSON literals are mis-parsed as bind parameters."
  - "Integration tests skip when migration 005 not applied — consistent with Pitfall 1 pattern from plans 09-05/06/07."
  - "Test node ID fix: nd_Arc0000001 (nd_ + 10 chars) used for archived node test instead of nd_Archived001 (nd_ + 11 chars) which fails NODE_ID_REGEX."

requirements-completed: [API-01, API-10]

duration: 7min
completed: "2026-04-21"
---

# Phase 09 Plan 08: Phase Gate Transition + Workflow Validation (API-01/API-10) Summary

**Phase Gate endpoint (POST /api/v1/projects/{id}/phase-transitions) with pg_advisory_xact_lock, rate limiting, idempotency, criteria evaluation, open-task moves, and D-08 audit envelope; plus WorkflowConfig Pydantic validation with Kahn's cycle detection for sequential-flexible mode.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-21T15:22:36Z
- **Completed:** 2026-04-21T15:29:29Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- `ExecutePhaseTransitionUseCase` implements D-01..D-12 in a single atomic AsyncSession: advisory lock acquisition, project load with process_config normalization, mode guard for continuous workflows, archived node validation, criteria evaluation, bulk task moves with per-task exceptions, and full D-08 audit envelope insertion.
- `WorkflowConfig` Pydantic model enforces all 4 D-55 business rules: unique node IDs, edge source/target reference non-archived nodes, cycle detection via Kahn's algorithm for sequential-flexible flow edges (feedback edges exempt), and group bounds (width/height > 0, x/y >= 0).
- `idempotency_cache` module provides D-50/D-53 in-memory rate limit (10s per user+project) and 10-minute TTL response cache keyed by (user_id, project_id, idempotency_key), with `cleanup_expired()` callable for APScheduler cron (T-09-08-11).
- Router returns standardized `error_code` in HTTP detail body (PHASE_GATE_LOCKED=409, CRITERIA_UNMET=422, PHASE_GATE_NOT_APPLICABLE=400, ARCHIVED_NODE_REF=400, not found=404, rate limit=429) — error code taxonomy documented for Phase 10-13.
- 22 unit tests + 9 integration tests (7 skipped without migration 005, 2 smoke tests always run).

## Task Commits

Each task was committed atomically using TDD (RED then GREEN):

1. **Task 09-08-01 RED: Failing unit tests** - `33cd4b5` (test)
2. **Task 09-08-01 GREEN: Idempotency cache + WorkflowConfig DTOs + Phase Gate service/use case** - `5342a53` (feat)
3. **Task 09-08-02 RED: Failing integration tests** - `b0bf9e8` (test)
4. **Task 09-08-02 GREEN: Phase transitions router + main.py mount** - `0c227c4` (feat)

## Files Created/Modified

- `Backend/app/application/services/idempotency_cache.py` — D-50/D-53 in-memory rate limit + 10min TTL cache
- `Backend/app/application/dtos/workflow_dtos.py` — WorkflowNode/Edge/Group/Config with D-55 Pydantic business rules; imports NODE_ID_REGEX from domain.entities.task (single source of truth, D-22)
- `Backend/app/application/services/phase_gate_service.py` — acquire_project_lock_or_fail with pg_try_advisory_xact_lock + 63-bit hash masking
- `Backend/app/application/dtos/phase_transition_dtos.py` — PhaseTransitionRequestDTO, ResponseDTO, CriterionResult, TaskException
- `Backend/app/application/use_cases/execute_phase_transition.py` — 7-step atomic use case (D-01..D-12)
- `Backend/app/domain/repositories/audit_repository.py` — added create_with_metadata abstract method
- `Backend/app/infrastructure/database/repositories/audit_repo.py` — implemented create_with_metadata using extra_metadata column (Pitfall 7)
- `Backend/app/api/v1/phase_transitions.py` — POST /projects/{id}/phase-transitions router
- `Backend/app/api/main.py` — mounted phase_transitions.router at /api/v1
- `Backend/tests/unit/application/test_idempotency_cache.py` — 6 tests (rate limit + TTL cache)
- `Backend/tests/unit/application/test_workflow_validation.py` — 9 tests (D-55 all 4 business rules)
- `Backend/tests/unit/application/test_phase_gate_use_case.py` — 7 tests (D-01..D-12 use case)
- `Backend/tests/integration/api/test_phase_transitions_api.py` — 7 integration tests with migration-005 skip guard
- `Backend/tests/integration/api/test_workflow_validation_api.py` — 2 smoke tests

## Decisions Made

**Error code taxonomy (Claude's Discretion resolved):**
Added `error_code` key in HTTP detail body alongside status for all domain exceptions from this router. Future plans (Phase 10-13) must follow the same convention: all domain exception -> HTTPException translations include `{"error_code": "SCREAMING_SNAKE_CASE", ...}` in the detail body for client-side programmatic error handling.

**Criteria evaluation shape:**
`_evaluate_criteria` supports 3 auto checks: `all_tasks_done`, `no_critical_tasks`, `no_blockers`. Manual items are always returned as unmet — require user confirmation via `allow_override=True` or external signoff. Extend `_evaluate_criteria` in future plans when new criteria types are needed.

**Rate-limit + idempotency order (documented for consistency):**
`check_rate_limit` -> `lookup (idempotency)` -> `record_request` -> use case -> `store (idempotency)`. This ensures: (1) if rate-limited, no DB hit; (2) if idempotent, no rate quota consumed; (3) rate window starts only on cache-miss executions.

**Advisory lock semantics:**
`pg_try_advisory_xact_lock` is non-blocking (returns False immediately if lock held). Lock auto-releases at transaction commit or rollback — no explicit unlock needed. The D-10 single-atomic-session guarantee is satisfied by FastAPI's session lifecycle (commit on return, rollback on exception).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test node ID nd_Archived001 (11 chars) to nd_Arc0000001 (10 chars)**
- **Found during:** Task 09-08-01, GREEN phase run
- **Issue:** Test node ID `nd_Archived001` = `nd_` + 11 chars, fails NODE_ID_REGEX which requires exactly 10 URL-safe chars after `nd_`. DTO validator rejected it before use case was even called, making the test impossible.
- **Fix:** Renamed to `nd_Arc0000001` (`nd_` + 10 chars) in both the project fixture and the DTO argument.
- **Files modified:** `Backend/tests/unit/application/test_phase_gate_use_case.py`
- **Committed in:** `5342a53`

**2. [Rule 1 - Bug] Fixed integration test raw SQL JSONB injection causing SQLAlchemy bind parameter parse error**
- **Found during:** Task 09-08-02, first GREEN test run
- **Issue:** `sqlalchemy.text()` with embedded JSON literals containing `:` characters (e.g., `"schema_version":1`) caused SQLAlchemy to parse `:1`, `:schema_version` etc. as bind parameters, raising `StatementError: A value is required for bind parameter`.
- **Fix:** Rewrote seed helper to use `bindparams` (`CAST(:pc AS jsonb)`) with `json.dumps()` for the process_config value. Added migration-005 skip guards consistent with Pitfall 1 from plans 09-05/06/07.
- **Files modified:** `Backend/tests/integration/api/test_phase_transitions_api.py`
- **Committed in:** `0c227c4`

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes were necessary for test correctness. No scope creep.

## Issues Encountered

- Integration tests initially tried ORM `ProjectModel` insertion which failed with `NoReferencedTableError: could not find table 'process_templates'` — the test DB (created via `Base.metadata.create_all`) doesn't resolve FK ordering correctly for this relationship. Resolved by using raw SQL with bindparams instead, consistent with the pattern used by all other Phase 9 integration tests.

## Known Stubs

None. All Phase Gate features are wired end-to-end. The integration tests skip when migration 005 is not applied (documented as a known dev-environment limitation, not a code stub).

## Threat Flags

No new threat surface beyond the plan's threat_model. All T-09-08-* threats addressed per plan:

| Threat | Component | Mitigation |
|--------|-----------|------------|
| T-09-08-01: DoS via advisory lock spam | idempotency_cache.py | 10s rate limit per (user_id, project_id) |
| T-09-08-02: Cross-user idempotency cache collision | idempotency_cache.py | Cache key = (user_id, project_id, idempotency_key) — user_id is first element |
| T-09-08-04: Forged source_phase_id | execute_phase_transition.py | Validates against project.process_config.workflow.nodes (D-19) |
| T-09-08-05: Non-member triggers transition | phase_transitions.py | require_project_transition_authority gates endpoint |
| T-09-08-06: Concurrent transitions leave inconsistent state | phase_gate_service.py | pg_try_advisory_xact_lock; audit+moves in single tx (D-10) |
| T-09-08-08: Int64 overflow in advisory lock key | phase_gate_service.py | hash(...) & 0x7FFFFFFFFFFFFFFF mask |
| T-09-08-09: Cycle detection DoS in sequential-flexible | workflow_dtos.py | Kahn's O(V+E) rejects cycles at Pydantic validation time |
| T-09-08-11: Unbounded idempotency cache growth | idempotency_cache.py | cleanup_expired() callable via APScheduler; documented in service docstring |

## Self-Check: PASSED

Files created/exist:
- Backend/app/application/services/idempotency_cache.py — FOUND (check_rate_limit, record_request, lookup, store, cleanup_expired, reset_for_tests)
- Backend/app/application/dtos/workflow_dtos.py — FOUND (WorkflowNode, WorkflowEdge, WorkflowGroup, WorkflowConfig, _has_cycle)
- Backend/app/application/services/phase_gate_service.py — FOUND (acquire_project_lock_or_fail, _lock_key)
- Backend/app/application/dtos/phase_transition_dtos.py — FOUND (PhaseTransitionRequestDTO, ResponseDTO, CriterionResult, TaskException)
- Backend/app/application/use_cases/execute_phase_transition.py — FOUND (ExecutePhaseTransitionUseCase)
- Backend/app/domain/repositories/audit_repository.py — FOUND (create_with_metadata abstract method)
- Backend/app/infrastructure/database/repositories/audit_repo.py — FOUND (create_with_metadata implementation)
- Backend/app/api/v1/phase_transitions.py — FOUND (@router.post /projects/{project_id}/phase-transitions)
- Backend/app/api/main.py — FOUND (phase_transitions router mounted)

Commits verified:
- 33cd4b5 test(09-08): add failing RED tests — FOUND
- 5342a53 feat(09-08): idempotency cache, WorkflowConfig DTOs, phase gate service and use case — FOUND
- b0bf9e8 test(09-08): add RED integration tests — FOUND
- 0c227c4 feat(09-08): phase-transitions router + main.py mount + integration tests — FOUND

## Next Phase Readiness

- Phase Gate endpoint fully operational and ready for frontend Phase 12 consumption
- WorkflowConfig Pydantic validators ready for re-use in plan 09-10 PATCH /projects/{id} workflow update endpoint
- Error code taxonomy established — Phase 10-13 router plans should use same pattern
- Idempotency cache cleanup deferred to v3.0 ADV-04 (Redis) per plan; APScheduler hook documented in service

---
*Phase: 09-backend-schema-entities-apis*
*Completed: 2026-04-21*
