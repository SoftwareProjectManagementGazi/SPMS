---
phase: 09-backend-schema-entities-apis
plan: "03"
subsystem: backend-test-foundations
tags: [domain-exceptions, test-factories, authenticated-client, wave-0]
dependency_graph:
  requires: []
  provides:
    - "PhaseGateLockedError, CriteriaUnmetError, PhaseGateNotApplicableError, ArchivedNodeReferenceError, CrossProjectPhaseReferenceError, WorkflowValidationError, ProcessConfigSchemaError (all in app/domain/exceptions.py)"
    - "tests/factories/ package — make_user, make_project, make_team, make_process_template, make_milestone, make_artifact, make_phase_report"
    - "authenticated_client(role=...) pytest fixture in tests/conftest.py"
  affects:
    - "Backend/app/domain/exceptions.py (appended)"
    - "Backend/tests/conftest.py (appended)"
    - "Backend/tests/factories/ (new package)"
tech_stack:
  added: []
  patterns:
    - "module-level make_<entity>(**overrides) factory pattern with incremental counter for unique defaults"
    - "late import pattern in milestone/artifact/phase_report factories (graceful pre-entity ImportError)"
    - "asynccontextmanager builder returned from pytest_asyncio fixture for authenticated_client"
key_files:
  created:
    - Backend/app/domain/exceptions.py    # (appended — 7 new Phase 9 exception classes)
    - Backend/tests/unit/test_domain_exceptions_phase9.py
    - Backend/tests/factories/__init__.py
    - Backend/tests/factories/user_factory.py
    - Backend/tests/factories/project_factory.py
    - Backend/tests/factories/team_factory.py
    - Backend/tests/factories/process_template_factory.py
    - Backend/tests/factories/milestone_factory.py
    - Backend/tests/factories/artifact_factory.py
    - Backend/tests/factories/phase_report_factory.py
  modified:
    - Backend/tests/conftest.py           # authenticated_client fixture + _make_test_jwt appended
decisions:
  - "Email domain for test factories: EmailStr (Pydantic v2) rejects .local TLD as reserved; use @testexample.com for all generated test emails"
  - "authenticated_client uses module-level app import (not a fixture) consistent with existing client fixture pattern in root conftest.py"
  - "authenticated_client wraps db_session dependency override so all requests within the async context manager share the same transactional session (rolls back after test)"
  - "Late imports in milestone/artifact/phase_report factories: avoids ImportError before plans 09-05/06/07 land the entities; factories gracefully fail at call time not import time"
  - "process_template_factory does NOT pass cycle_label_tr/cycle_label_en to ProcessTemplate constructor — these columns land via plan 09-04 migration, not yet in entity; passed via **extra when needed"
metrics:
  duration: "4 min"
  completed: "2026-04-21"
  tasks_completed: 2
  files_changed: 11
---

# Phase 09 Plan 03: Domain Exceptions + Test Factories + Authenticated Client Summary

**One-liner:** 7 Phase 9 domain exceptions with structured attributes appended to DomainError hierarchy, 7 entity test factories under tests/factories/, and `authenticated_client(role=...)` transactional fixture in root conftest.

## What Was Built

### Task 09-03-01: Phase 9 Domain Exceptions (TDD)

Seven new exception classes appended to `Backend/app/domain/exceptions.py`:

| Class | HTTP Status | Key Attribute | Decision Ref |
|-------|------------|---------------|--------------|
| `PhaseGateLockedError(project_id)` | 409 | `.project_id` | D-01/D-02 |
| `CriteriaUnmetError(unmet=[...])` | 422 | `.unmet_criteria` (list of criterion dicts) | D-03/D-05 |
| `PhaseGateNotApplicableError(mode)` | 400 | `.mode` | D-07 |
| `ArchivedNodeReferenceError(node_id, reason)` | 400 | `.node_id`, `.reason` | D-19/D-21 |
| `CrossProjectPhaseReferenceError(project_id, referenced_node)` | 400 | `.project_id`, `.referenced_node` | D-20 |
| `WorkflowValidationError(errors=[...])` | 422 | `.errors` (list of validation failure dicts) | D-54/D-55 |
| `ProcessConfigSchemaError(from_version, to_version)` | 500 | `.from_version`, `.to_version` | Pitfall 4 |

All inherit from `DomainError`. Smoke test file covers 14 test cases (7 per-class + 7 parametrized inheritance checks). All 14 pass.

**Router mapping guidance (plans 09-08/09/10):**
```python
except PhaseGateLockedError:         # -> 409, detail={"project_id": e.project_id}
except CriteriaUnmetError:           # -> 422, detail={"unmet": e.unmet_criteria}
except PhaseGateNotApplicableError:  # -> 400, detail={"mode": e.mode}
except ArchivedNodeReferenceError:   # -> 400, detail={"node_id": e.node_id}
except CrossProjectPhaseReferenceError: # -> 400
except WorkflowValidationError:      # -> 422, detail={"errors": e.errors}
except ProcessConfigSchemaError:     # -> 500 (internal)
```

### Task 09-03-02: Test Factories + authenticated_client (TDD)

**Factory package** `Backend/tests/factories/` — import pattern:
```python
from tests.factories.user_factory import make_user
from tests.factories.project_factory import make_project
from tests.factories.team_factory import make_team
from tests.factories.process_template_factory import make_process_template
# Late-import factories (safe to import; fail only at call time if entity missing):
from tests.factories.milestone_factory import make_milestone    # needs plan 09-05
from tests.factories.artifact_factory import make_artifact      # needs plan 09-06
from tests.factories.phase_report_factory import make_phase_report  # needs plan 09-07
```

**Default behaviors:**
- `make_user()` → `User(email="user{n}@testexample.com", is_active=True)`
- `make_project()` → `Project(methodology=SCRUM, process_config={schema_version:1, workflow:{mode:"flexible", nodes:[src,tgt], edges:[flow]}})`
- `make_team()` → `Team(name="Team {n}", owner_id=1)` — `leader_id` passed via kwargs until plan 09-04 adds the field
- `make_process_template()` → `ProcessTemplate(name="TestTemplate{n}")`

**authenticated_client fixture** — async context manager builder:
```python
async def test_something(authenticated_client):
    async with authenticated_client(role="admin") as client:
        r = await client.get("/api/v1/projects")
        assert r.status_code == 200
```

**Key design choices:**
- `db_session` transactional rollback — users created inside `authenticated_client` are rolled back after each test (T-09-03-04)
- `app.dependency_overrides[get_db_session]` set inside the context manager so all requests share the test session
- JWT generated via `jose.jwt.encode({"sub": email}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)` — same secret as production but ephemeral (T-09-03-01)

**Pre-existing assumption:** `app` (FastAPI instance) and `db_session` (transactional session) fixtures are available — confirmed present in root `tests/conftest.py` and `tests/integration/conftest.py`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pydantic EmailStr rejects `.local` TLD**
- **Found during:** Task 2, verifying `make_user()` with `user1@test.local`
- **Issue:** Pydantic v2 `EmailStr` validation rejects `.local` as a special-use/reserved TLD per RFC 6761
- **Fix:** Changed default email template from `@test.local` to `@testexample.com` in both `user_factory.py` and the `authenticated_client` fixture in `conftest.py`
- **Files modified:** `Backend/tests/factories/user_factory.py`, `Backend/tests/conftest.py`
- **Commit:** d21d724

**2. [Rule 2 - Correctness] authenticated_client does not take `app` as fixture parameter**
- **Found during:** Task 2, reading existing root conftest pattern
- **Issue:** Plan's fixture signature `async def authenticated_client(app, db_session)` assumes `app` is a pytest fixture, but the root conftest imports `app` as a module-level variable (same pattern as `client` fixture)
- **Fix:** Changed `authenticated_client(db_session)` only; references module-level `app` import directly, consistent with existing `client` fixture
- **Files modified:** `Backend/tests/conftest.py`
- **Commit:** d21d724

## Known Stubs

None. All factories produce complete entities (Pydantic validators enforce required fields). The `make_milestone`, `make_artifact`, and `make_phase_report` factories deliberately defer entity import until the entity module exists — this is intentional design (late import), not a stub.

## Threat Flags

No new network endpoints, auth paths, or schema changes introduced in this plan. All changes are test infrastructure only.

**T-09-03-01 mitigation documented:** `_make_test_jwt` docstring notes ephemeral token + gitignored `.env` secret. No CI deployment active.

**T-09-03-02 mitigation confirmed:** Smoke test `test_criteria_unmet_error_exposes_unmet_criteria` explicitly asserts `.unmet_criteria` attribute name.

## Self-Check: PASSED

Files created/exist:
- Backend/app/domain/exceptions.py — FOUND (17 exception classes: 10 original + 7 new)
- Backend/tests/unit/test_domain_exceptions_phase9.py — FOUND
- Backend/tests/factories/__init__.py — FOUND
- Backend/tests/factories/user_factory.py — FOUND
- Backend/tests/factories/project_factory.py — FOUND
- Backend/tests/factories/team_factory.py — FOUND
- Backend/tests/factories/process_template_factory.py — FOUND
- Backend/tests/factories/milestone_factory.py — FOUND
- Backend/tests/factories/artifact_factory.py — FOUND
- Backend/tests/factories/phase_report_factory.py — FOUND
- Backend/tests/conftest.py — FOUND (authenticated_client at line 124)

Commits verified:
- 9a289f9 feat(09-03): add Phase 9 domain exceptions + smoke tests — FOUND
- d21d724 feat(09-03): add test factories + authenticated_client fixture — FOUND
