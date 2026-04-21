---
phase: 10-shell-pages-project-features
plan: "02"
subsystem: backend
tags: [activity-feed, global-activity, seeder, d-28, d-36, clean-architecture]
dependency_graph:
  requires:
    - 09-backend-schema-entities-apis (IAuditRepository, AuditLogModel, MilestoneModel, ArtifactModel, ProcessTemplateModel, TeamModel)
  provides:
    - GET /api/v1/activity (global activity feed, D-28)
    - GetGlobalActivityUseCase (application layer, zero SQLAlchemy)
    - Updated seeder with varied project statuses, process_template_id, process_config, team.leader_id, milestones, artifacts (D-36)
  affects:
    - Dashboard ActivityFeed widget (consumes GET /api/v1/activity)
    - Phase 10 UI testing with realistic seeded data
tech_stack:
  added: []
  patterns:
    - Clean Architecture 4-layer (Domain → Application → Infrastructure → API)
    - Strategy pattern via IAuditRepository abstraction (no SQLAlchemy in use case)
    - FastAPI Depends injection (get_audit_repo, get_current_user)
key_files:
  created:
    - Backend/app/application/use_cases/get_global_activity.py
  modified:
    - Backend/app/domain/repositories/audit_repository.py
    - Backend/app/infrastructure/database/repositories/audit_repo.py
    - Backend/app/api/v1/activity.py
    - Backend/app/infrastructure/database/seeder.py
decisions:
  - "[10-02] GET /activity placed before /projects/{project_id}/activity in router — global route registered first, no ambiguity since project route uses /projects/ prefix"
  - "[10-02] seed_teams() adds one team per project; leader_id = manager user (deterministic, not random) — ensures require_project_transition_authority checks work in Phase 10 UI"
  - "[10-02] MilestoneModel uses `name` + `target_date` fields (not `title`/`due_date` as plan suggested) — adapted to actual model schema from BACK-04"
  - "[10-02] ArtifactModel has no `artifact_type` column — omitted from artifact seeds (ArtifactModel fields: name, status, project_id only required)"
  - "[10-02] Seeder seed_projects() now returns (projects_map, created_projects) tuple — seed_data caller updated accordingly"
metrics:
  duration_seconds: 248
  duration_display: "~4 min"
  completed_date: "2026-04-21"
  tasks_completed: 2
  files_modified: 5
  files_created: 1
---

# Phase 10 Plan 02: Global Activity Endpoint + Seeder D-36 Update Summary

**One-liner:** GET /api/v1/activity global feed (no project filter) wired through Clean Architecture layers, plus seeder updated with varied project statuses, process_template_id links, team leaders, milestones, and artifacts per D-36.

## What Was Built

### Task 1 — Global Activity: Domain + Infrastructure + Use Case

**Layer 1 — Domain** (`Backend/app/domain/repositories/audit_repository.py`):
- Added `get_global_activity(limit, offset) -> Tuple[List[dict], int]` as `@abstractmethod` to `IAuditRepository`
- Signature mirrors `get_project_activity` but without `project_id` or filter params (D-28)

**Layer 2 — Infrastructure** (`Backend/app/infrastructure/database/repositories/audit_repo.py`):
- Implemented `get_global_activity()` in `SqlAlchemyAuditRepository`
- Copies `get_project_activity` SQL pattern but removes all WHERE conditions — queries the full `audit_log` table
- LEFT JOIN on `users` for `user_name` + `user_avatar` denormalization

**Layer 3 — Application** (`Backend/app/application/use_cases/get_global_activity.py`):
- New `GetGlobalActivityUseCase` — imports only from `app.domain` and `app.application`
- Zero SQLAlchemy imports — Clean Architecture DIP maintained
- Delegates to `audit_repo.get_global_activity()` and returns `ActivityResponseDTO`

### Task 2 — Route + Seeder

**API Route** (`Backend/app/api/v1/activity.py`):
- Added `GET /activity` route with `response_model=ActivityResponseDTO`
- Protected by `get_current_user` Depends (T-10-02-02 spoofing mitigation)
- `limit` capped at 200 via `le=200` Query constraint (T-10-02-04 DoS mitigation)
- `GetGlobalActivityUseCase` injected via `get_audit_repo` Depends

**Seeder** (`Backend/app/infrastructure/database/seeder.py`):
- Added imports: `TeamModel`, `TeamMemberModel`, `TeamProjectModel`, `MilestoneModel`, `ArtifactModel`, `ProcessTemplateModel`, `ProjectStatus`
- `PROJECTS_DATA` — added `status` field: SPMS=ACTIVE, MOB=ACTIVE, DATA=COMPLETED, AI=ON_HOLD (2×ACTIVE, 1×COMPLETED, 1×ON_HOLD per D-36)
- `seed_projects()` — sets `project.status`, `project.process_config` (schema_version:1 base structure), and `process_template_id` via methodology→template name lookup; now returns `(projects_map, created_projects)` tuple
- `seed_teams()` — creates one team per project, assigns `team.leader_id = manager.id`, links team members and `TeamProjectModel` join
- `seed_milestones_and_artifacts()` — adds 3 `MilestoneModel` entries per project (completed/in_progress/pending) and 3 `ArtifactModel` entries per project (completed/in_progress/not_created)

## Commits

| Hash | Message |
|------|---------|
| e1e21ee | feat(10-02): add global activity use case — domain interface + infra + use case |
| bc1bc8c | feat(10-02): wire GET /activity route and update seeder with D-36 fields |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Adaptation] MilestoneModel field names differ from plan**
- **Found during:** Task 2 — reading `Backend/app/infrastructure/database/models/milestone.py`
- **Issue:** Plan used `title` and `due_date` as field names; actual model uses `name` and `target_date`; also `target_date` is a `DateTime` not a `date`
- **Fix:** Used `name` and `target_date` with `datetime.combine()` to convert offset days to datetime
- **Files modified:** `seeder.py` only (no model change needed)

**2. [Rule 1 - Adaptation] ArtifactModel has no `artifact_type` column**
- **Found during:** Task 2 — reading `Backend/app/infrastructure/database/models/artifact.py`
- **Issue:** Plan's ARTIFACT_TEMPLATES included `artifact_type` field; actual `ArtifactModel` has no such column (fields are: `name`, `status`, `project_id`, `assignee_id`, `linked_phase_id`, `note`, `file_id`)
- **Fix:** Omitted `artifact_type` from `ArtifactModel` constructor calls; used only `name`, `status`, `project_id`
- **Files modified:** `seeder.py` only

**3. [Rule 2 - Missing functionality] seed_teams() added (teams not in original seeder)**
- **Found during:** Task 2 — grep confirmed no TeamModel in existing seeder
- **Issue:** Plan specifies `team.leader_id` assignment but no team seeding existed; `leader_id` cannot be set without first creating teams
- **Fix:** Added `seed_teams()` function that creates one `TeamModel` per project, adds `TeamMemberModel` rows for project members, creates `TeamProjectModel` link, and sets `leader_id = manager.id`
- **Files modified:** `seeder.py` (new function + `seed_data` caller)

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: information_disclosure | `Backend/app/api/v1/activity.py` | GET /activity exposes audit_log entries across ALL projects to any authenticated user — accepted per T-10-02-01 (closed system, D-11) |

## Self-Check: PASSED

Files exist:
- Backend/app/application/use_cases/get_global_activity.py: FOUND
- Backend/app/domain/repositories/audit_repository.py: FOUND (get_global_activity @abstractmethod present)
- Backend/app/infrastructure/database/repositories/audit_repo.py: FOUND (get_global_activity implementation present)
- Backend/app/api/v1/activity.py: FOUND (/activity route present)
- Backend/app/infrastructure/database/seeder.py: FOUND (MilestoneModel, ArtifactModel, process_template_id, leader_id all present)

Commits exist:
- e1e21ee: FOUND
- bc1bc8c: FOUND
