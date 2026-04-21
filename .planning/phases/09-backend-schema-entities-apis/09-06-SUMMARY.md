---
phase: 09-backend-schema-entities-apis
plan: "06"
subsystem: backend-entities-schema
tags: [vertical-slice, artifact, seeder, use-case-split, permissions, BACK-05]
dependency_graph:
  requires: ["09-01", "09-02", "09-03", "09-04"]
  provides:
    - "ArtifactStatus enum (NOT_CREATED/IN_PROGRESS/COMPLETED/APPROVED) in artifact.py"
    - "Artifact domain entity with linked_phase_id NODE_ID_REGEX validator (D-22/D-26)"
    - "IArtifactRepository ABC with 7 methods including bulk_create (D-28)"
    - "ArtifactModel ORM with file_id FK to files(id) (D-41)"
    - "SqlAlchemyArtifactRepository with soft-delete"
    - "get_artifact_repo DI factory in deps/artifact.py + legacy shim"
    - "ArtifactSeeder.seed(project_id, template) in application/services"
    - "CreateProjectUseCase extended with optional artifact_repo (D-28/D-29/D-30)"
    - "ArtifactCreateDTO, ArtifactUpdateByAssigneeDTO (3 fields), ArtifactUpdateByManagerDTO (all fields), ArtifactResponseDTO"
    - "6 use cases: Create, UpdateByAssignee, UpdateByManager, Delete, List, Get"
  affects:
    - "Backend/app/domain/entities/artifact.py"
    - "Backend/app/domain/repositories/artifact_repository.py"
    - "Backend/app/infrastructure/database/models/artifact.py"
    - "Backend/app/infrastructure/database/models/__init__.py"
    - "Backend/app/infrastructure/database/repositories/artifact_repo.py"
    - "Backend/app/api/deps/artifact.py"
    - "Backend/app/api/dependencies.py"
    - "Backend/app/application/services/artifact_seeder.py"
    - "Backend/app/application/dtos/artifact_dtos.py"
    - "Backend/app/application/use_cases/manage_artifacts.py"
    - "Backend/app/application/use_cases/manage_projects.py"
tech_stack:
  added: []
  patterns:
    - "Split-by-role DTO pattern: ArtifactUpdateByAssigneeDTO excludes assignee_id at model level (field-level exclusion as first defense); use case permission check (PermissionError if user_id != assignee_id) is second defense"
    - "ArtifactSeeder service: stateless helper accepting IArtifactRepository, called from CreateProjectUseCase with same AsyncSession for atomic tx (D-28)"
    - "bulk_create flushes (not commits) so outer transaction owns the boundary — seeder failure rolls back Project too"
    - "Optional parameter pattern for backward compat: artifact_repo=None skips seeding; all pre-09-06 callers unchanged"
key_files:
  created:
    - Backend/app/domain/entities/artifact.py
    - Backend/app/domain/repositories/artifact_repository.py
    - Backend/app/infrastructure/database/models/artifact.py
    - Backend/app/infrastructure/database/repositories/artifact_repo.py
    - Backend/app/application/services/artifact_seeder.py
    - Backend/app/application/dtos/artifact_dtos.py
    - Backend/app/application/use_cases/manage_artifacts.py
    - Backend/tests/unit/test_artifact_entity.py
    - Backend/tests/unit/application/test_artifact_seeder.py
    - Backend/tests/unit/application/test_manage_artifacts.py
    - Backend/tests/integration/infrastructure/test_artifact_repo_integration.py
  modified:
    - Backend/app/infrastructure/database/models/__init__.py
    - Backend/app/api/deps/artifact.py
    - Backend/app/api/dependencies.py
    - Backend/app/application/use_cases/manage_projects.py
decisions:
  - "Split-by-role DTO strategy: ArtifactUpdateByAssigneeDTO has NO assignee_id field — field-level exclusion is the first line of defense; UpdateArtifactByAssigneeUseCase PermissionError check is the second (D-36 / T-09-06-01 / T-09-06-02)"
  - "ArtifactSeeder backward compat: CreateProjectUseCase artifact_repo defaults to None so all pre-09-06 callers (API wiring in plans 09-10) are unaffected until they pass artifact_repo"
  - "D-29 methodology-change no-op: no code change needed — ArtifactSeeder only runs on Project CREATE, not on PATCH. D-29 is documented here to prevent Phase 10-12 developers from 'cleaning up' artifacts on template switch"
  - "D-30 edge case: both template=None AND template with empty default_artifacts return [] from seed() without calling bulk_create"
  - "bulk_create flushes not commits: caller owns transaction boundary — if seeder raises, outer async with session.begin() rolls back both Project and all artifact inserts (D-28 atomicity guarantee)"
metrics:
  duration: "6 min"
  completed: "2026-04-21"
  tasks_completed: 2
  files_changed: 15
---

# Phase 09 Plan 06: Artifact Vertical Slice (BACK-05) Summary

**One-liner:** Artifact entity + ORM + repo + DTOs + split-by-role use cases (D-36) + ArtifactSeeder integrated into CreateProjectUseCase for atomic default-artifact seeding (D-28).

## What Was Built

### Task 09-06-01: Artifact entity + ORM + repo + DI factory (TDD)

**`Backend/app/domain/entities/artifact.py`**:

| Symbol | Purpose |
|--------|---------|
| `ArtifactStatus(str, Enum)` | NOT_CREATED / IN_PROGRESS / COMPLETED / APPROVED — stored as VARCHAR(20) |
| `Artifact(BaseModel)` | Domain entity with `linked_phase_id: Optional[str]` (D-26 nullable) and `file_id: Optional[int]` (D-41 FK files) |
| `@field_validator("linked_phase_id")` | Reuses NODE_ID_REGEX from task.py (D-22) — rejects malformed phase references (T-09-06-03) |

**`Backend/app/domain/repositories/artifact_repository.py`** — `IArtifactRepository` ABC with 7 methods: `create`, `bulk_create`, `get_by_id`, `list_by_project`, `list_by_phase`, `update`, `delete`. `bulk_create` signature documented as "used by ArtifactSeeder inside Project create tx".

**`Backend/app/infrastructure/database/models/artifact.py`** — `ArtifactModel` ORM matching migration 005 DDL. FK columns: `project_id → projects(id) ON DELETE CASCADE`, `assignee_id → users(id)`, `file_id → files(id)`. Soft-delete via `is_deleted + deleted_at`.

**`Backend/app/infrastructure/database/repositories/artifact_repo.py`** — `SqlAlchemyArtifactRepository` mirroring milestone_repo pattern:
- `create`: flush + get_by_id (returns refreshed entity)
- `bulk_create`: `add_all` → flush (no commit); entity list returned from in-memory ORM objects (D-28 tx boundary preserved)
- `list_by_phase(project_id, None)`: returns project-scoped artifacts (linked_phase_id IS NULL)
- `delete`: soft-delete sets `is_deleted=True` + `deleted_at`

**DI factory**: `get_artifact_repo` in `deps/artifact.py` + explicit re-export in `dependencies.py` shim. Both import paths point to the same function object (verified by `assert get_artifact_repo is legacy`).

**Tests (8 passing)**: entity defaults, nullable phase_id, valid format, 4 bad formats (parametrized), all enum values.

### Task 09-06-02: ArtifactSeeder + use cases + CreateProjectUseCase extension (TDD)

**`Backend/app/application/services/artifact_seeder.py`** — `ArtifactSeeder`:
- Accepts `IArtifactRepository` (injected, not instantiated internally — follows DI rule)
- `seed(project_id, template)`: maps `template.default_artifacts` entries to `Artifact` objects; calls `bulk_create` in same session
- Returns `[]` immediately if `template is None` (D-30 custom workflow)
- Returns `[]` if `template.default_artifacts` is empty or None (D-30 variant)
- Propagates `bulk_create` exceptions to caller for transaction rollback (D-28 atomicity)

**`Backend/app/application/use_cases/manage_projects.py`** — `CreateProjectUseCase` extension:
- New `artifact_repo: Optional[IArtifactRepository] = None` param in `__init__`
- D-28 seed call inserted BEFORE recurring tasks seeding (after `project_repo.create`)
- Conditional: `if self.artifact_repo is not None and template is not None` — skips gracefully if repo absent or custom workflow
- D-29 comment: documents that PATCH (methodology change) does NOT trigger re-seeding; this code path only executes on CREATE

**`Backend/app/application/dtos/artifact_dtos.py`** — 4 DTOs:

| DTO | Fields | Purpose |
|-----|--------|---------|
| `ArtifactCreateDTO` | project_id, name, status, assignee_id, linked_phase_id, note, file_id | Full create |
| `ArtifactUpdateByAssigneeDTO` | status, note, file_id (ONLY) | D-36 assignee scope — `assignee_id` absent at model level |
| `ArtifactUpdateByManagerDTO` | name, status, assignee_id, linked_phase_id, note, file_id | D-36 manager scope — all fields allowed |
| `ArtifactResponseDTO` | id + all display fields | `from_attributes=True` |

**`Backend/app/application/use_cases/manage_artifacts.py`** — 6 use cases:

| Use Case | Key Behavior |
|----------|-------------|
| `CreateArtifactUseCase` | Validates linked_phase_id in project workflow (D-19) |
| `UpdateArtifactByAssigneeUseCase` | `PermissionError` if `user_id != artifact.assignee_id` (T-09-06-02) |
| `UpdateArtifactByManagerUseCase` | All fields allowed incl. `assignee_id`; re-validates phase_id if changing |
| `DeleteArtifactUseCase` | Delegates to `repo.delete` (soft-delete) |
| `ListArtifactsUseCase` | `phase_id=None + include_phase_none=False` → `list_by_project`; otherwise `list_by_phase` |
| `GetArtifactUseCase` | Single artifact by id |

**Tests (9 passing)**: 4 seeder tests (create-from-defaults, none-template, empty-defaults, propagate-failure) + 5 manage_artifacts tests (assignee 3-field update, assignee blocked on other, DTO excludes assignee_id, manager reassign, delete).

**Integration test file**: 3 tests (create+get, bulk_create all-or-nothing, list_by_phase None returns project-scoped). Requires live DB.

## Security Posture

### Threat Register Coverage

| Threat | Mitigation | Location |
|--------|-----------|---------|
| T-09-06-01: Assignee reassigns own artifact | `ArtifactUpdateByAssigneeDTO` has NO `assignee_id` field (field-level); use case defence-in-depth guard also present | artifact_dtos.py + manage_artifacts.py |
| T-09-06-02: Non-assignee updates via assignee endpoint | `PermissionError` if `user_id != artifact.assignee_id` | UpdateArtifactByAssigneeUseCase |
| T-09-06-03: Malformed linked_phase_id (SQL/XSS payload) | `@field_validator` enforces NODE_ID_REGEX in both entity AND DTO (defence-in-depth) | artifact.py + artifact_dtos.py |
| T-09-06-04: Orphaned artifacts if Project insert fails | `bulk_create` flushes not commits; outer `async with session.begin()` owns rollback | artifact_repo.py + artifact_seeder.py |
| T-09-06-06: Methodology change clears artifacts | D-29 no-op: seeder only called from CREATE, not PATCH | manage_projects.py comment + this SUMMARY |

## Architecture Notes

### Split-by-role DTO Strategy (D-36)

The role-based update split uses **two defenses**:

1. **Field-level exclusion** (first defense): `ArtifactUpdateByAssigneeDTO` does not declare `assignee_id` in `model_fields`. Any caller that tries to pass `assignee_id` gets a Pydantic validation error before the use case runs.

2. **Use case permission check** (second defense): `UpdateArtifactByAssigneeUseCase` raises `PermissionError` if `user_id != artifact.assignee_id`. This guards against code that bypasses DTO validation (e.g., tests, programmatic callers).

The router layer (09-10) will enforce which endpoint each role may call. This creates **three independent layers** for D-36 enforcement.

### ArtifactSeeder Integration (D-28)

`CreateProjectUseCase` receives `artifact_repo: Optional[IArtifactRepository] = None`. When `None` (all pre-09-06 callers), the seeder is skipped and existing behavior is preserved. When provided, `ArtifactSeeder` runs inside the same `AsyncSession` — no separate commit, so Project + Artifact inserts are atomic.

The seeder is a separate class (not inlined into the use case) per SRP — keeping `CreateProjectUseCase` clean and making `ArtifactSeeder` independently testable.

### D-29 Rationale (for Phase 10-12 developers)

When a project's `process_template_id` is changed via PATCH, existing artifacts are **NOT** cleared or re-seeded. This is intentional:
- Artifacts are work products tied to a project, not methodology metadata
- User may have already assigned people, attached files, and updated status — clearing would destroy work
- The new template's `default_artifacts` are a starting point suggestion, not a hard requirement
- **Do NOT add cascade-on-template-change logic in future plans**

### D-30 Edge Cases

Both `template=None` (custom workflow, no template selected) and a template with `default_artifacts=[]` (template explicitly has no defaults) return `[]` from `seed()` without calling `bulk_create`. This is tested by two separate unit tests (`test_seed_empty_when_template_none` and `test_seed_empty_when_default_artifacts_empty`).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All new fields are wired end-to-end (entity → ORM → repo → DTOs → use cases → DI factory). The Alembic migration 005 (plan 09-01) already created the `artifacts` table; the ORM model activates it in SQLAlchemy's metadata on this plan.

## Self-Check: PASSED

Files created/exist:
- Backend/app/domain/entities/artifact.py — FOUND
- Backend/app/domain/repositories/artifact_repository.py — FOUND
- Backend/app/infrastructure/database/models/artifact.py — FOUND
- Backend/app/infrastructure/database/repositories/artifact_repo.py — FOUND
- Backend/app/api/deps/artifact.py — FOUND (get_artifact_repo)
- Backend/app/application/services/artifact_seeder.py — FOUND
- Backend/app/application/dtos/artifact_dtos.py — FOUND
- Backend/app/application/use_cases/manage_artifacts.py — FOUND
- Backend/tests/unit/test_artifact_entity.py — FOUND
- Backend/tests/unit/application/test_artifact_seeder.py — FOUND
- Backend/tests/unit/application/test_manage_artifacts.py — FOUND
- Backend/tests/integration/infrastructure/test_artifact_repo_integration.py — FOUND

Commits verified:
- 63b2982 feat(09-06): Artifact entity + ORM model + repo + DI factory (BACK-05) — FOUND
- 987ee44 feat(09-06): ArtifactSeeder + use cases + CreateProjectUseCase extension (BACK-05/D-28/D-36) — FOUND
