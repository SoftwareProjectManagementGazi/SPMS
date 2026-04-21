---
phase: 09-backend-schema-entities-apis
plan: "05"
subsystem: backend-milestone-slice
tags: [milestone, jsonb, gin-index, pydantic, clean-architecture, BACK-04]
dependency_graph:
  requires: ["09-01", "09-02", "09-03", "09-04"]
  provides:
    - "Milestone Pydantic entity + MilestoneStatus enum in app/domain/entities/milestone.py"
    - "IMilestoneRepository ABC (6 abstract methods) in app/domain/repositories/milestone_repository.py"
    - "MilestoneModel ORM with JSONB linked_phase_ids in app/infrastructure/database/models/milestone.py"
    - "SqlAlchemyMilestoneRepository with GIN-backed list_by_phase (.contains) and soft-delete"
    - "MilestoneCreateDTO, MilestoneUpdateDTO, MilestoneResponseDTO in app/application/dtos/milestone_dtos.py"
    - "5 use cases: CreateMilestoneUseCase, UpdateMilestoneUseCase, DeleteMilestoneUseCase, ListMilestonesUseCase, GetMilestoneUseCase"
    - "get_milestone_repo DI factory — importable from both app.api.deps.milestone and legacy app.api.dependencies"
  affects:
    - "Backend/app/domain/entities/milestone.py"
    - "Backend/app/domain/repositories/milestone_repository.py"
    - "Backend/app/infrastructure/database/models/milestone.py"
    - "Backend/app/infrastructure/database/models/__init__.py"
    - "Backend/app/infrastructure/database/repositories/milestone_repo.py"
    - "Backend/app/application/dtos/milestone_dtos.py"
    - "Backend/app/application/use_cases/manage_milestones.py"
    - "Backend/app/api/deps/milestone.py"
tech_stack:
  added: []
  patterns:
    - "MilestoneModel.linked_phase_ids.contains([phase_id]) — JSONB @> containment (GIN-indexed, Pitfall 6 avoided)"
    - "list(dict.fromkeys(ids)) — order-preserving deduplication for linked_phase_ids (D-24)"
    - "NODE_ID_REGEX reused from task.py in DTO @field_validator (D-22 format validation)"
    - "_validate_phase_ids_against_workflow() helper — pure async function shared by Create/Update use cases"
    - "Migration-005 skip guard pattern — reused from test_migration_005.py for integration tests"
key_files:
  created:
    - Backend/app/domain/entities/milestone.py
    - Backend/app/domain/repositories/milestone_repository.py
    - Backend/app/infrastructure/database/models/milestone.py
    - Backend/app/infrastructure/database/repositories/milestone_repo.py
    - Backend/app/application/dtos/milestone_dtos.py
    - Backend/app/application/use_cases/manage_milestones.py
    - Backend/tests/unit/test_milestone_entity.py
    - Backend/tests/unit/application/test_manage_milestones.py
    - Backend/tests/integration/infrastructure/test_milestone_repo_integration.py
  modified:
    - Backend/app/infrastructure/database/models/__init__.py
    - Backend/app/api/deps/milestone.py
decisions:
  - "MilestoneStatus enum co-located in milestone.py per Claude's Discretion (follows existing pattern: Methodology in project.py, TaskPriority in task.py)"
  - "linked_phase_ids dedupe uses list(dict.fromkeys(...)) — preserves insertion order, O(n) time"
  - "list_by_phase uses .contains([phase_id]) not .op('@>')(cast([phase_id], JSONB)) — SQLAlchemy JSONB .contains() translates directly to Postgres @> operator for GIN index utilization"
  - "Validation split: format regex in DTO @field_validator (fast, no DB), existence/archived check in use case (requires project lookup)"
  - "Empty linked_phase_ids bypasses workflow validation (D-24) — ProjectRepository not called"
  - "Use cases NOT wrapped in permission checks — router plan 09-10 adds require_project_transition_authority per D-35"
  - "Integration tests use db_session (from integration conftest), not async_session (undefined in that scope)"
  - "Integration tests skip when migration 005 not applied — same guard pattern as test_migration_005.py (Pitfall 1)"
metrics:
  duration: "7 min"
  completed: "2026-04-21"
  tasks: 2
  files: 11
---

# Phase 09 Plan 05: Milestone Vertical Slice (BACK-04) Summary

**One-liner:** Milestone Clean Architecture vertical slice — Pydantic entity + MilestoneStatus enum, IMilestoneRepository ABC, MilestoneModel ORM with JSONB linked_phase_ids, SqlAlchemyMilestoneRepository with GIN-backed list_by_phase and soft-delete, 5 use cases with D-19/D-21 workflow node validation, DI factory with legacy shim compatibility.

## What Was Built

### Task 09-05-01: Entity + ORM + Repository Interface + Impl + DI Factory (TDD)

**`Backend/app/domain/entities/milestone.py`**

| Symbol | Purpose |
|--------|---------|
| `MilestoneStatus(str, Enum)` | PENDING/IN_PROGRESS/COMPLETED/DELAYED — co-located with entity per project convention |
| `Milestone(BaseModel)` | id, project_id, name, description, target_date, status, linked_phase_ids, version, created_at, updated_at, is_deleted; `model_config = ConfigDict(from_attributes=True)` |

**`Backend/app/domain/repositories/milestone_repository.py`**

6-method ABC: `create`, `get_by_id`, `list_by_project`, `list_by_phase` (D-38 GIN doc), `update`, `delete` (soft).

**`Backend/app/infrastructure/database/models/milestone.py`**

`MilestoneModel(Base)` with `__tablename__ = "milestones"`. JSONB column:
```python
linked_phase_ids = Column(JSONB, nullable=False, server_default="[]")
```
GIN index `ix_milestones_linked_phase_ids_gin` created by migration 005 (not by ORM metadata).

**`Backend/app/infrastructure/database/repositories/milestone_repo.py`**

`SqlAlchemyMilestoneRepository` key behaviors:

| Method | Implementation Notes |
|--------|---------------------|
| `_to_model` | `list(dict.fromkeys(ids))` dedupes linked_phase_ids in-place (D-24), preserves order |
| `list_by_phase` | `.where(MilestoneModel.linked_phase_ids.contains([phase_id]))` — JSONB `@>` containment (GIN-indexed, Pitfall 6 avoided) |
| `delete` | Soft-delete: `is_deleted=True`, `deleted_at=datetime.utcnow()` — no SQL DELETE |
| `create` | `add → flush → get_by_id` re-fetch pattern (consistent with user_repo.py) |
| `_base_query` | Filters `is_deleted == False` on every read method (T-09-05-06 mitigation) |

**`Backend/app/api/deps/milestone.py`** — `get_milestone_repo` populated (replaces empty stub from 09-02). `__all__ = ["get_milestone_repo"]` ensures star-import from `deps/__init__.py` picks it up, and the legacy `app.api.dependencies` shim re-exports it transparently.

**Tests (3 passing):** `test_defaults`, `test_status_enum_values`, `test_linked_phase_ids_dedupe_in_repo_helper`

### Task 09-05-02: DTOs + Use Cases + Tests (TDD)

**`Backend/app/application/dtos/milestone_dtos.py`**

| DTO | Key Features |
|-----|-------------|
| `MilestoneCreateDTO` | project_id+name required; linked_phase_ids default []; NODE_ID_REGEX @field_validator |
| `MilestoneUpdateDTO` | All fields Optional (PATCH semantics); validator skips None linked_phase_ids |
| `MilestoneResponseDTO` | `model_config = ConfigDict(from_attributes=True)`; mirrors entity fields |

**`Backend/app/application/use_cases/manage_milestones.py`**

5 use case classes + 1 helper:

```
_validate_phase_ids_against_workflow(phase_ids, project_id, project_repo)
  → empty list → return immediately (D-24, no DB lookup)
  → project not found → raise ProjectNotFoundError
  → node not in workflow.nodes → raise ArchivedNodeReferenceError(reason="non-existent in project workflow")
  → node.is_archived == True → raise ArchivedNodeReferenceError(reason="archived")

CreateMilestoneUseCase   — validates phase_ids, creates entity, returns ResponseDTO
UpdateMilestoneUseCase   — re-validates phase_ids if updated, applies patch via model_dump(exclude_unset=True)
DeleteMilestoneUseCase   — delegates to repo.delete (soft), returns bool
ListMilestonesUseCase    — dispatches to list_by_project or list_by_phase based on phase_id param
GetMilestoneUseCase      — single milestone fetch, returns None-safe ResponseDTO
```

**Tests (8 unit + 3 integration):**

Unit tests (8 passing): create with valid phase_id, reject missing node, reject archived node, reject nonexistent project, empty phase_ids bypass (assert_not_awaited), delete True, list routes to list_by_project, list routes to list_by_phase.

Integration tests (3, skip when migration 005 not applied): roundtrip create/fetch, list_by_phase functional correctness, soft-delete verification.

## Validation Split (Architecture Decision)

The D-19/D-21 validation is deliberately split across two layers:

| Layer | What It Validates | Why |
|-------|------------------|-----|
| DTO `@field_validator` | Format: `nd_` prefix + exactly 10 URL-safe chars (NODE_ID_REGEX) | Fast, no DB, catches typos at API boundary |
| Use case `_validate_phase_ids_against_workflow` | Existence in `project.process_config.workflow.nodes` + not archived | Requires project lookup; only runs when phase_ids provided |

## JSONB Containment Query Pattern

```python
# CORRECT (GIN-indexed JSONB @> containment):
MilestoneModel.linked_phase_ids.contains([phase_id])
# Translates to: WHERE linked_phase_ids @> '["nd_abc"]'::jsonb

# WRONG (Pitfall 6 — would bypass GIN index):
MilestoneModel.linked_phase_ids == [phase_id]  # equality, not containment
```

SQLAlchemy's JSONB `.contains()` method maps directly to the `@>` operator, which is covered by the GIN index `ix_milestones_linked_phase_ids_gin` created in migration 005. This enables O(log n) lookups even on large milestone tables.

## Deduplication Strategy (D-24)

```python
entity.linked_phase_ids = list(dict.fromkeys(entity.linked_phase_ids))
```

`dict.fromkeys()` preserves insertion order (Python 3.7+ guarantee) while removing duplicates. Applied in `_to_model` (create path) and `update` method. Empty list `[]` passes through unchanged and bypasses workflow validation entirely.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect fixture name in integration tests**
- **Found during:** Task 09-05-02, running integration tests post-implementation
- **Issue:** Plan template used `async_session` fixture name; the integration conftest defines `db_session`. `async_session` is undefined — tests errored at collection rather than running
- **Fix:** Renamed all `async_session` references to `db_session` throughout `test_milestone_repo_integration.py`
- **Files modified:** `Backend/tests/integration/infrastructure/test_milestone_repo_integration.py`
- **Commit:** d63ef9d

**2. [Rule 2 - Missing Critical Functionality] Added migration-005 skip guards to integration tests**
- **Found during:** Task 09-05-02, first integration test run against live DB (migration 005 not applied)
- **Issue:** Tests failed with `UndefinedColumnError: column "status" of relation "projects"` — DB set up via `Base.metadata.create_all` lacks migration-added columns
- **Fix:** Added `_migration_005_applied()` helper + `pytest.skip()` guard to all 3 tests — consistent with the pattern established in `test_migration_005.py` (09-01-SUMMARY.md documents this as Pitfall 1)
- **Files modified:** `Backend/tests/integration/infrastructure/test_milestone_repo_integration.py`
- **Commit:** d63ef9d

## Known Stubs

None — all fields wired end-to-end. The router layer (CRUD endpoints) is deliberately deferred to plan 09-10 per wave isolation design. DI factory `get_milestone_repo` is populated and importable.

## Threat Flags

All threats from the plan's threat_model are addressed:

| Threat | File | Mitigation Status |
|--------|------|------------------|
| T-09-05-01: Malformed linked_phase_ids strings | milestone_dtos.py | NODE_ID_REGEX @field_validator at DTO boundary; SQLAlchemy parameterized queries |
| T-09-05-02: Cross-project reference | manage_milestones.py | _validate_phase_ids_against_workflow checks project's own workflow nodes |
| T-09-05-03: Archived phase_id storage | manage_milestones.py | node.get("is_archived") check raises ArchivedNodeReferenceError |
| T-09-05-04: list_by_phase table scan | milestone_repo.py | .contains([phase_id]) GIN @> containment |
| T-09-05-05: Delete another project's milestone | deferred | Router plan 09-10 adds require_project_transition_authority (D-35) |
| T-09-05-06: Soft-deleted milestones in results | milestone_repo.py | _base_query filters is_deleted==False on every read |

## Self-Check: PASSED

Files created/exist:
- `Backend/app/domain/entities/milestone.py` — FOUND (Milestone + MilestoneStatus)
- `Backend/app/domain/repositories/milestone_repository.py` — FOUND (IMilestoneRepository, 6 abstract methods)
- `Backend/app/infrastructure/database/models/milestone.py` — FOUND (MilestoneModel, linked_phase_ids JSONB)
- `Backend/app/infrastructure/database/models/__init__.py` — FOUND (MilestoneModel uncommented)
- `Backend/app/infrastructure/database/repositories/milestone_repo.py` — FOUND (SqlAlchemyMilestoneRepository, list_by_phase .contains)
- `Backend/app/application/dtos/milestone_dtos.py` — FOUND (3 DTOs)
- `Backend/app/application/use_cases/manage_milestones.py` — FOUND (5 use case classes + helper)
- `Backend/app/api/deps/milestone.py` — FOUND (get_milestone_repo, __all__)
- `Backend/tests/unit/test_milestone_entity.py` — FOUND (3 tests)
- `Backend/tests/unit/application/test_manage_milestones.py` — FOUND (8 tests)
- `Backend/tests/integration/infrastructure/test_milestone_repo_integration.py` — FOUND (3 tests with skip guards)

Commits verified:
- b285889 feat(09-05): Milestone vertical slice — entity, ORM, repo interface+impl, DI factory (BACK-04) — FOUND
- 8ce81e7 feat(09-05): Milestone DTOs + 5 use cases + unit/integration tests (BACK-04) — FOUND
- d63ef9d fix(09-05): use db_session fixture and add migration-005 skip guards to milestone integration tests — FOUND
