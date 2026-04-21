---
phase: 09-backend-schema-entities-apis
plan: "04"
subsystem: backend-entities-schema
tags: [entities, pydantic, schema-version, team-leader, permissions, BACK-01, BACK-02, BACK-03]
dependency_graph:
  requires: ["09-01", "09-02", "09-03"]
  provides:
    - "ProjectStatus enum (ACTIVE/COMPLETED/ON_HOLD/ARCHIVED) in app/domain/entities/project.py"
    - "_normalize_process_config, CURRENT_SCHEMA_VERSION=1, _MIGRATIONS chain in project.py"
    - "Project.status + Project.process_template_id fields"
    - "Task.phase_id + NODE_ID_REGEX + @field_validator in app/domain/entities/task.py"
    - "Team.leader_id in app/domain/entities/team.py"
    - "ProjectModel.status + ProjectModel.process_template_id ORM columns"
    - "TaskModel.phase_id ORM column"
    - "TeamModel.leader_id ORM column"
    - "ProcessTemplateModel: default_artifacts, default_phase_criteria, default_workflow, cycle_label_tr, cycle_label_en columns"
    - "ProcessTemplate entity: 5 new optional fields"
    - "ITeamRepository: user_leads_any_team_on_project + get_teams_led_by abstract methods"
    - "SqlAlchemyTeamRepository: both new methods implemented"
    - "IProjectRepository + SqlAlchemyProjectRepository: list_by_status"
    - "ITaskRepository + SqlAlchemyTaskRepository: list_by_project_and_phase"
    - "require_project_transition_authority DI helper in deps/auth.py"
    - "process_config_normalizer.py batch migration service"
  affects:
    - "Backend/app/domain/entities/project.py"
    - "Backend/app/domain/entities/task.py"
    - "Backend/app/domain/entities/team.py"
    - "Backend/app/domain/entities/process_template.py"
    - "Backend/app/infrastructure/database/models/project.py"
    - "Backend/app/infrastructure/database/models/task.py"
    - "Backend/app/infrastructure/database/models/team.py"
    - "Backend/app/infrastructure/database/models/process_template.py"
    - "Backend/app/domain/repositories/team_repository.py"
    - "Backend/app/domain/repositories/project_repository.py"
    - "Backend/app/domain/repositories/task_repository.py"
    - "Backend/app/infrastructure/database/repositories/team_repo.py"
    - "Backend/app/infrastructure/database/repositories/project_repo.py"
    - "Backend/app/infrastructure/database/repositories/task_repo.py"
    - "Backend/app/api/deps/auth.py"
    - "Backend/app/api/dependencies.py"
tech_stack:
  added: []
  patterns:
    - "@model_validator(mode='before') for dual-input normalization (dict AND SQLAlchemy ORM object)"
    - "Migration chain pattern: _MIGRATIONS dict keyed by from-version, _MAX_MIGRATION_ITERATIONS guard"
    - "Pydantic @field_validator for regex-based format enforcement (NODE_ID_REGEX)"
    - "EXISTS-style limit(1) join query for efficient permission check"
key_files:
  created:
    - Backend/app/application/services/process_config_normalizer.py
    - Backend/tests/unit/application/test_process_config_normalizer.py
    - Backend/tests/unit/test_project_entity.py
    - Backend/tests/unit/test_task_entity.py
    - Backend/tests/unit/test_team_entity.py
    - Backend/tests/integration/infrastructure/test_team_leader_repo.py
  modified:
    - Backend/app/domain/entities/project.py
    - Backend/app/domain/entities/task.py
    - Backend/app/domain/entities/team.py
    - Backend/app/domain/entities/process_template.py
    - Backend/app/infrastructure/database/models/project.py
    - Backend/app/infrastructure/database/models/task.py
    - Backend/app/infrastructure/database/models/team.py
    - Backend/app/infrastructure/database/models/process_template.py
    - Backend/app/domain/repositories/team_repository.py
    - Backend/app/domain/repositories/project_repository.py
    - Backend/app/domain/repositories/task_repository.py
    - Backend/app/infrastructure/database/repositories/team_repo.py
    - Backend/app/infrastructure/database/repositories/project_repo.py
    - Backend/app/infrastructure/database/repositories/task_repo.py
    - Backend/app/api/deps/auth.py
    - Backend/app/api/dependencies.py
decisions:
  - "ProjectStatus enum co-located in project.py per Claude's Discretion (follows existing pattern: Methodology in project.py, TaskPriority in task.py)"
  - "Normalizer dual-input: @model_validator(mode='before') handles dict (DTO/API) and SQLAlchemy ORM object via __table__ attribute check (Pitfall 5 resolved)"
  - "_migrate_v0_to_v1 contract: renames methodology->methodology_legacy, seeds 7 D-33 default keys, bumps schema_version to 1"
  - "Team.leader_id is organizational (D-13), NOT project-level — project scope comes from TeamProjects join in user_leads_any_team_on_project"
  - "require_project_transition_authority wired in deps/auth.py; backward-compat re-export added to app.api.dependencies shim"
  - "ProcessTemplate entity file already existed; 5 new fields added as Optional[] to preserve backward compat with existing rows pre-migration"
  - "phase_id added to task_repo _to_entity() manual mapping dict to ensure it round-trips through ORM correctly"
metrics:
  duration: "7 min"
  completed: "2026-04-21"
  tasks_completed: 2
  files_changed: 22
---

# Phase 09 Plan 04: Entity + Schema Extension (BACK-01/02/03) Summary

**One-liner:** ProjectStatus enum + schema_version normalizer (BACK-01/03), Task.phase_id with D-22 regex (BACK-02), Team.leader_id (D-13), ITeamRepository leadership methods (D-16), and require_project_transition_authority DI helper (D-15).

## What Was Built

### Task 09-04-01: Project + ProcessTemplate Entity + ORM Extensions (TDD)

**`Backend/app/domain/entities/project.py`** — Full rewrite with Phase 9 additions:

| Symbol | Purpose |
|--------|---------|
| `ProjectStatus(str, Enum)` | BACK-01/D-34: ACTIVE/COMPLETED/ON_HOLD/ARCHIVED; stored VARCHAR(20) |
| `CURRENT_SCHEMA_VERSION = 1` | Current target for lazy normalizer |
| `_MAX_MIGRATION_ITERATIONS = 20` | Pitfall 4: infinite loop guard |
| `_migrate_v0_to_v1(config)` | Renames `methodology`→`methodology_legacy`, seeds all 7 D-33 keys |
| `_MIGRATIONS = {0: _migrate_v0_to_v1}` | Migration chain; extend by adding key when bumping version |
| `_normalize_process_config(config)` | Pure function: migrates dict to current version; idempotent; raises ProcessConfigSchemaError on gap |
| `Project.status` | Default `ProjectStatus.ACTIVE`; Pydantic rejects invalid enum values |
| `Project.process_template_id` | `Optional[int]` FK reference (D-45) |
| `@model_validator(mode="before") normalize_process_config` | Triggered on every Project construction; handles both dict and ORM object input (Pitfall 5) |

**ORM Models:**
- `ProjectModel`: added `status = Column(String(20), server_default="ACTIVE", index=True)` and `process_template_id = Column(Integer, ForeignKey("process_templates.id"), nullable=True, index=True)`
- `ProcessTemplateModel`: added `default_artifacts`, `default_phase_criteria`, `default_workflow` (JSONB), `cycle_label_tr`, `cycle_label_en` (String(50))
- `ProcessTemplate entity`: same 5 fields as `Optional[]` for backward compat

**`process_config_normalizer.py`**: `async def migrate_all_projects_to_current_schema(project_repo)` — batch admin helper for eager migration.

**Tests (11 passing):**
- 7 normalizer tests: legacy→v1 migration, idempotency, empty dict, None, unknown gap, forgot-to-bump-version (Pitfall 4), Pydantic integration
- 4 project entity tests: status default, invalid status rejection, all enum values, process_template_id acceptance

### Task 09-04-02: Task + Team + Repository + Auth DI Extensions (TDD)

**`Backend/app/domain/entities/task.py`:**
- Added `NODE_ID_REGEX = re.compile(r"^nd_[A-Za-z0-9_-]{10}$")` at module level
- Added `phase_id: Optional[str] = None` field
- Added `@field_validator("phase_id")` enforcing D-22 format (prefix `nd_` + exactly 10 URL-safe chars)

**`Backend/app/domain/entities/team.py`:**
- Added `leader_id: Optional[int] = None` (D-13 — organizational, not project-scoped)

**ORM Models:**
- `TaskModel`: `phase_id = Column(String(20), nullable=True, index=True)` after `column_id`
- `TeamModel`: `leader_id = Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True, index=True)` after `owner_id`

**Repository Extensions:**

| Interface | New Method | Purpose |
|-----------|-----------|---------|
| `ITeamRepository` | `user_leads_any_team_on_project(user_id, project_id) -> bool` | D-16: EXISTS join with is_deleted filter |
| `ITeamRepository` | `get_teams_led_by(user_id) -> list` | D-16: all teams where leader_id=user_id |
| `IProjectRepository` | `list_by_status(statuses: list) -> list` | API-04: status filter |
| `ITaskRepository` | `list_by_project_and_phase(project_id, phase_id) -> list` | API-05: phase_id filter |

**`SqlAlchemyTeamRepository.user_leads_any_team_on_project`** uses EXISTS-style `.join(TeamProjectModel).limit(1)` for efficient single-row check. Includes `TeamModel.is_deleted == False` guard (T-09-04-07 mitigation).

**`Backend/app/api/deps/auth.py`** — `require_project_transition_authority`:
- Passes if Admin OR `project.manager_id == current_user.id` OR `user_leads_any_team_on_project`
- Returns HTTP 404 if project not found, HTTP 403 for unauthorized
- Re-exported via `app.api.dependencies` shim for backward compat

**Tests (14 passing):**
- 12 task entity tests: 4 valid phase_ids (parametrized), 6 bad phase_ids (parametrized), null allowed, default None
- 2 team entity tests: default None, accepts int

**Integration test file created** (`test_team_leader_repo.py`): 3 tests covering positive/negative leadership checks and get_teams_led_by. Requires live DB to run.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] Added phase_id to task_repo._to_entity() manual mapping**
- **Found during:** Task 2, reviewing task_repo.py _to_entity() which uses explicit dict mapping (not model_validate)
- **Issue:** Without adding `"phase_id": model.phase_id` to the task_data dict in `_to_entity()`, the new field would silently be None for all tasks read from DB even after migration
- **Fix:** Added `"phase_id": model.phase_id` to the manual mapping dict
- **Files modified:** `Backend/app/infrastructure/database/repositories/task_repo.py`
- **Commit:** 6184045

## Known Stubs

None. All new fields are wired end-to-end (entity → ORM model → repository). The Alembic migration (005_phase9_schema.py) was handled in plan 09-01; ORM columns added here will be active once migration runs.

## Threat Flags

All threats from the plan's threat_model are addressed:

| Flag | File | Mitigation |
|------|------|------------|
| T-09-04-01: phase_id SQL injection | task.py | NODE_ID_REGEX @field_validator rejects non-nd_ inputs; SQLAlchemy parameterizes queries |
| T-09-04-03: Team leader wrong project | team_repo.py | EXISTS query joins TeamProjects WHERE project_id condition |
| T-09-04-04: Corrupt process_config DoS | project.py | _MAX_MIGRATION_ITERATIONS=20 raises ProcessConfigSchemaError |
| T-09-04-06: Invalid status enum | project.py | Pydantic enum validation rejects non-ProjectStatus values |
| T-09-04-07: Deleted team grants leadership | team_repo.py | is_deleted==False in both new methods |

## Self-Check: PASSED

Files created/exist:
- Backend/app/domain/entities/project.py — FOUND (ProjectStatus, _normalize_process_config, CURRENT_SCHEMA_VERSION)
- Backend/app/domain/entities/task.py — FOUND (NODE_ID_REGEX, phase_id field, @field_validator)
- Backend/app/domain/entities/team.py — FOUND (leader_id field)
- Backend/app/domain/entities/process_template.py — FOUND (5 new optional fields)
- Backend/app/infrastructure/database/models/project.py — FOUND (status, process_template_id columns)
- Backend/app/infrastructure/database/models/task.py — FOUND (phase_id column)
- Backend/app/infrastructure/database/models/team.py — FOUND (leader_id column)
- Backend/app/infrastructure/database/models/process_template.py — FOUND (5 new JSONB/String columns)
- Backend/app/application/services/process_config_normalizer.py — FOUND
- Backend/app/api/deps/auth.py — FOUND (require_project_transition_authority)
- Backend/tests/unit/application/test_process_config_normalizer.py — FOUND
- Backend/tests/unit/test_project_entity.py — FOUND
- Backend/tests/unit/test_task_entity.py — FOUND
- Backend/tests/unit/test_team_entity.py — FOUND
- Backend/tests/integration/infrastructure/test_team_leader_repo.py — FOUND

Commits verified:
- 30eb3fb feat(09-04): extend Project/ProcessTemplate entities and ORM models (BACK-01/BACK-03) — FOUND
- 6184045 feat(09-04): extend Task/Team entities, repo methods, and auth DI helper (BACK-02/D-13/D-15/D-16) — FOUND
