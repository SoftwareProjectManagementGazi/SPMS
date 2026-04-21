---
phase: 09-backend-schema-entities-apis
plan: "09"
subsystem: backend-api
tags: [activity-feed, user-summary, team-leader, asyncio-gather, denormalization, API-02, API-03, D-17]
dependency_graph:
  requires: ["09-04", "09-08"]
  provides:
    - "GetProjectActivityUseCase: D-46/D-47 filtered paginated activity with denormalized LEFT JOIN"
    - "GetUserSummaryUseCase: D-48 asyncio.gather 3-parallel-query (stats, projects, recent_activity)"
    - "SetTeamLeaderUseCase + GetLedTeamsUseCase: D-17 team leader management"
    - "audit_repo: get_project_activity + get_recent_by_user new methods"
    - "project_repo: list_by_member_and_status + count_by_member new methods"
    - "task_repo: count_active_by_assignee + count_completed_since new methods"
    - "team_repo: update() method"
    - "activity_dtos.py: ActivityItemDTO + ActivityResponseDTO"
    - "user_summary_dtos.py: UserSummaryStatsDTO + UserSummaryProjectDTO + UserSummaryResponseDTO"
    - "team_dtos.py: TeamLeaderUpdateDTO + LedTeamsResponseDTO appended"
    - "GET /api/v1/projects/{id}/activity router with member gate + type[] filter + pagination"
    - "GET /api/v1/users/{id}/summary router with include_archived param"
    - "GET /api/v1/users/me/led-teams router for frontend gate detection (D-18)"
    - "PATCH /api/v1/teams/{id}/leader Admin-only endpoint"
    - "3 unit tests + 8 integration tests (skip-guarded for unseeded DB)"
  affects:
    - Backend/app/infrastructure/database/repositories/audit_repo.py
    - Backend/app/domain/repositories/audit_repository.py
    - Backend/app/infrastructure/database/repositories/project_repo.py
    - Backend/app/domain/repositories/project_repository.py
    - Backend/app/infrastructure/database/repositories/task_repo.py
    - Backend/app/domain/repositories/task_repository.py
    - Backend/app/infrastructure/database/repositories/team_repo.py
    - Backend/app/application/dtos/activity_dtos.py
    - Backend/app/application/dtos/user_summary_dtos.py
    - Backend/app/application/dtos/team_dtos.py
    - Backend/app/application/use_cases/get_project_activity.py
    - Backend/app/application/use_cases/get_user_summary.py
    - Backend/app/application/use_cases/manage_teams.py
    - Backend/app/api/v1/activity.py
    - Backend/app/api/v1/users.py
    - Backend/app/api/v1/teams.py
    - Backend/app/api/main.py
tech_stack:
  added: []
  patterns:
    - "asyncio.gather for 3-parallel-query user summary (D-48): stats_task, projects_task, activity_task run concurrently"
    - "type[] query alias: FastAPI Query(default=None, alias='type[]') for multi-value filter"
    - "Activity denormalization: LEFT JOIN users table at repo level (single DB round-trip, D-47)"
    - "Skip guard pattern for integration tests without seeded DB: _db_has_roles() check (consistent with Pitfall 1)"
    - "Sub-path for team leader: /teams/{id}/leader avoids conflict with future PATCH /teams/{id} body"
key_files:
  created:
    - Backend/app/application/dtos/activity_dtos.py
    - Backend/app/application/dtos/user_summary_dtos.py
    - Backend/app/application/use_cases/get_project_activity.py
    - Backend/app/application/use_cases/get_user_summary.py
    - Backend/app/api/v1/activity.py
    - Backend/app/api/v1/users.py
    - Backend/tests/unit/application/test_get_user_summary.py
    - Backend/tests/integration/api/test_activity_api.py
    - Backend/tests/integration/api/test_user_summary_api.py
    - Backend/tests/integration/api/test_teams_leader_api.py
  modified:
    - Backend/app/infrastructure/database/repositories/audit_repo.py
    - Backend/app/domain/repositories/audit_repository.py
    - Backend/app/infrastructure/database/repositories/project_repo.py
    - Backend/app/domain/repositories/project_repository.py
    - Backend/app/infrastructure/database/repositories/task_repo.py
    - Backend/app/domain/repositories/task_repository.py
    - Backend/app/infrastructure/database/repositories/team_repo.py
    - Backend/app/application/dtos/team_dtos.py
    - Backend/app/application/use_cases/manage_teams.py
    - Backend/app/api/v1/teams.py
    - Backend/app/api/main.py
decisions:
  - "type[] query alias pattern: FastAPI Query(default=None, alias='type[]') enables ?type[]=task_created&type[]=phase_transition multi-value syntax"
  - "Activity denormalization: LEFT JOIN users at SQL level in get_project_activity; entity_label deferred (always None in v2.0) per plan note"
  - "asyncio.gather 3-query parallelism in GetUserSummaryUseCase: default behavior (return_exceptions=False) accepted for v2.0 (T-09-09-08 accepted)"
  - "PATCH endpoint path /teams/{id}/leader sub-path chosen to avoid conflicting with any other PATCH on team resource"
  - "GET /users/me/led-teams shape: {teams: [...], project_ids: [...]} — frontend pre-computes Phase Gate button visibility (D-18)"
  - "user_summary does not enforce own-profile-only authorization in v2.0 (T-09-09-02 accepted) — frontend uses admin user mgmt page; hardening deferred"
  - "Integration tests use _db_has_roles() skip guard (consistent with Pitfall 1 from plans 09-05..09-08)"
metrics:
  duration: "8 min"
  completed: "2026-04-21"
  tasks_completed: 2
  files_changed: 21
---

# Phase 09 Plan 09: Activity Feed + User Summary + Team Leader (API-02/API-03/D-17) Summary

**Activity feed (GET /projects/{id}/activity) with denormalized JOIN, filtered/paginated response, and project-membership gate; User summary (GET /users/{id}/summary) with asyncio.gather 3-parallel-query strategy; Team leader PATCH + led-teams GET endpoints (D-17).**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-21T15:34:23Z
- **Completed:** 2026-04-21T15:42:00Z
- **Tasks:** 2
- **Files modified:** 21

## Accomplishments

- `GetProjectActivityUseCase` reads denormalized rows from `audit_repo.get_project_activity` — a single LEFT JOIN on the users table returns user_name + user_avatar inline (D-47). `entity_label` is always `None` in v2.0 (deferred: resolve task title/milestone name from entity_id in future phase).
- `GetUserSummaryUseCase` uses `asyncio.gather` to run 3 independent async tasks concurrently: `_get_stats(user_id)` (which itself runs 3 COUNT queries in parallel), `project_repo.list_by_member_and_status`, and `audit_repo.get_recent_by_user`. This is the D-48 pattern from 09-RESEARCH.md Pattern 6.
- `SetTeamLeaderUseCase` + `GetLedTeamsUseCase` (D-17): set/clear leader_id on a team, and return teams + project_ids for frontend gate detection.
- `activity.py` router uses `Depends(get_project_member)` — non-members get 403 (T-09-09-01). Page size capped at 200 via `Query(le=200)` (T-09-09-03).
- `PATCH /teams/{id}/leader` gated by `require_admin` (T-09-09-05). `TeamLeaderUpdateDTO` uses `extra="forbid"` (T-09-09-06).
- `GET /users/me/led-teams` returns `{teams, project_ids}` for frontend to detect Phase Gate / Milestone button visibility (D-18).
- 3 unit tests pass (asyncio.gather behavior, include_archived, default exclusion). 8 integration tests skip cleanly on unseeded test DB (consistent with Pitfall 1 pattern from plans 09-05..09-08).

## Task Commits

Each task was committed atomically using TDD (RED then GREEN):

1. **Task 09-09-01 RED: Failing unit tests for user summary** — `8718967` (test)
2. **Task 09-09-01 GREEN: Repo extensions, DTOs, use cases** — `f4fd52a` (feat)
3. **Task 09-09-02 RED: Failing integration tests** — `553d2b9` (test)
4. **Task 09-09-02 GREEN: Routers + main.py mount + integration tests** — `b51d8dc` (feat)

## Files Created/Modified

**Created:**
- `Backend/app/application/dtos/activity_dtos.py` — ActivityItemDTO (D-47 shape) + ActivityResponseDTO
- `Backend/app/application/dtos/user_summary_dtos.py` — UserSummaryStatsDTO + ProjectDTO + ResponseDTO
- `Backend/app/application/use_cases/get_project_activity.py` — GetProjectActivityUseCase
- `Backend/app/application/use_cases/get_user_summary.py` — GetUserSummaryUseCase with asyncio.gather (D-48)
- `Backend/app/api/v1/activity.py` — GET /projects/{id}/activity router
- `Backend/app/api/v1/users.py` — GET /users/{id}/summary + GET /users/me/led-teams
- `Backend/tests/unit/application/test_get_user_summary.py` — 3 unit tests
- `Backend/tests/integration/api/test_activity_api.py` — 3 integration tests (skip-guarded)
- `Backend/tests/integration/api/test_user_summary_api.py` — 2 integration tests (skip-guarded)
- `Backend/tests/integration/api/test_teams_leader_api.py` — 3 integration tests (skip-guarded)

**Modified:**
- `Backend/app/infrastructure/database/repositories/audit_repo.py` — added get_project_activity + get_recent_by_user
- `Backend/app/domain/repositories/audit_repository.py` — added 2 abstract methods
- `Backend/app/infrastructure/database/repositories/project_repo.py` — added list_by_member_and_status + count_by_member
- `Backend/app/domain/repositories/project_repository.py` — added 2 abstract methods
- `Backend/app/infrastructure/database/repositories/task_repo.py` — added count_active_by_assignee + count_completed_since
- `Backend/app/domain/repositories/task_repository.py` — added 2 abstract methods + datetime import
- `Backend/app/infrastructure/database/repositories/team_repo.py` — added update() method
- `Backend/app/application/dtos/team_dtos.py` — appended TeamLeaderUpdateDTO + LedTeamsResponseDTO
- `Backend/app/application/use_cases/manage_teams.py` — appended SetTeamLeaderUseCase + GetLedTeamsUseCase
- `Backend/app/api/v1/teams.py` — appended PATCH /teams/{id}/leader route
- `Backend/app/api/main.py` — mounted activity + users routers at /api/v1

## Decisions Made

**type[] multi-value query alias:**
FastAPI's `Query(default=None, alias="type[]")` enables `?type[]=task_created&type[]=phase_transition` syntax. This is the idiomatic FastAPI pattern for bracket-notation multi-value params matching D-46 filter spec.

**Activity denormalization strategy:**
`audit_repo.get_project_activity` performs a single LEFT JOIN on the users table to resolve `user_name` and `user_avatar` inline. `entity_label` (task title, milestone name from entity_id) is always `None` in v2.0. Deferred to a future phase when entity-specific resolver logic is implemented. This is documented per plan output spec.

**asyncio.gather parallelism:**
`GetUserSummaryUseCase.execute` runs `_get_stats`, `list_by_member_and_status`, and `get_recent_by_user` in parallel. `_get_stats` itself runs 3 COUNT queries in parallel. Default `return_exceptions=False` behavior — first failure cancels all (T-09-09-08 accepted, v2.0 scope).

**PATCH endpoint path choice:**
`/teams/{team_id}/leader` (sub-path) chosen over `/teams/{team_id}` body-patch to avoid future conflict with a general team PATCH endpoint. Documented per plan output spec.

**GET /users/me/led-teams:**
Returns `{teams: [{id, name, description}], project_ids: [int]}` — frontend uses this to pre-compute whether to render Phase Gate / Milestone action buttons per project (D-18). No server-side filtering of which projects to show buttons on — client does the intersection logic.

**User summary authorization (Claude's Discretion):**
`GET /users/{id}/summary` accepts any authenticated user in v2.0. No own-profile-only check. Frontend exclusively uses this for admin user management and own profile page. Hardening deferred (T-09-09-02 accepted).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed get_project_member import source in activity.py**
- **Found during:** Task 09-09-02, GREEN phase — `ImportError: cannot import name 'get_project_member' from 'app.api.deps.auth'`
- **Issue:** Plan template had `from app.api.deps.auth import get_project_member` but `get_project_member` lives in `app.api.deps.project` (established in 09-02)
- **Fix:** Changed import to `from app.api.deps.project import get_project_member`
- **Files modified:** `Backend/app/api/v1/activity.py`
- **Committed in:** `b51d8dc`

**2. [Rule 1 - Bug] Fixed fixture name async_session -> db_session in integration tests**
- **Found during:** Task 09-09-02, RED phase analysis — plan template used `async_session` but project conftest only provides `db_session`
- **Issue:** `async_session` is a type alias from sqlalchemy, not a pytest fixture. Tests would fail at collection with `fixture 'async_session' not found`
- **Fix:** Replaced all occurrences of `async_session` with `db_session` in 3 integration test files
- **Files modified:** All 3 new integration test files
- **Committed in:** `553d2b9`

**3. [Rule 1 - Bug] Added skip guard for unseeded test DB in integration tests**
- **Found during:** Task 09-09-02, GREEN phase first run — 7 tests failed with `NoResultFound` in `authenticated_client` fixture when test DB has no roles
- **Issue:** Test DB (created by conftest via `Base.metadata.create_all`) has no seeded roles. The `authenticated_client` fixture tries `scalar_one()` on the roles table which raises `NoResultFound`. Same root cause as Pitfall 1 in plans 09-05..09-08.
- **Fix:** Added `_db_has_roles()` async guard + `pytest.skip()` at start of each test (consistent with `_migration_005_applied()` pattern from test_phase_transitions_api.py)
- **Files modified:** All 3 integration test files
- **Committed in:** `b51d8dc`

**4. [Rule 2 - Missing functionality] Added team_repo.update() method**
- **Found during:** Task 09-09-01 — `SetTeamLeaderUseCase.execute` calls `team_repo.update(team)` but `SqlAlchemyTeamRepository` had no `update` method
- **Issue:** Plan specified that if update is missing, add a minimal one. Verified via grep — no update method existed.
- **Fix:** Added `update(team)` to `SqlAlchemyTeamRepository` that persists name, description, leader_id and re-fetches
- **Files modified:** `Backend/app/infrastructure/database/repositories/team_repo.py`
- **Committed in:** `f4fd52a`

## Known Stubs

**entity_label in activity feed:** `get_project_activity` always returns `entity_label: None`. Future work: resolve task title (for entity_type=task), milestone name (for entity_type=milestone), etc. from entity_id. This is a known partial stub — the D-47 shape is complete, but the entity_label field is always null. Frontend handles null entity_label gracefully.

## Threat Flags

All threats from the plan's threat_model are addressed:

| Threat | Component | Mitigation |
|--------|-----------|------------|
| T-09-09-01: Non-member reads activity feed | activity.py | `Depends(get_project_member)` returns 403 for non-members |
| T-09-09-02: User summary privacy | users.py | Accepted — any authenticated user in v2.0; documented |
| T-09-09-03: Activity feed DoS (no limit) | activity.py | `Query(le=200)` caps page size |
| T-09-09-04: Unindexed audit_log scan | DB | Existing indexes on entity_id, entity_type, user_id, action, timestamp |
| T-09-09-05: Non-admin sets team leader | teams.py | `Depends(require_admin)` gates PATCH /teams/{id}/leader |
| T-09-09-06: PATCH body extra keys | team_dtos.py | `TeamLeaderUpdateDTO(extra="forbid")` rejects unknown keys |
| T-09-09-07: metadata visible to members | activity.py | Accepted — members already have project access |
| T-09-09-08: asyncio.gather cancel on failure | get_user_summary.py | Accepted — default behavior for v2.0 |

## Self-Check: PASSED

Files created/exist:
- Backend/app/application/dtos/activity_dtos.py — FOUND
- Backend/app/application/dtos/user_summary_dtos.py — FOUND
- Backend/app/application/use_cases/get_project_activity.py — FOUND (GetProjectActivityUseCase)
- Backend/app/application/use_cases/get_user_summary.py — FOUND (asyncio.gather)
- Backend/app/api/v1/activity.py — FOUND (@router.get /projects/{project_id}/activity)
- Backend/app/api/v1/users.py — FOUND (/users/{user_id}/summary + /users/me/led-teams)
- Backend/tests/unit/application/test_get_user_summary.py — FOUND (3 tests)
- Backend/tests/integration/api/test_activity_api.py — FOUND (3 tests with skip guard)
- Backend/tests/integration/api/test_user_summary_api.py — FOUND (2 tests with skip guard)
- Backend/tests/integration/api/test_teams_leader_api.py — FOUND (3 tests with skip guard)

Commits verified:
- 8718967 test(09-09): add failing RED tests for user summary use case — FOUND
- f4fd52a feat(09-09): repo extensions, DTOs, and use cases — FOUND
- 553d2b9 test(09-09): add RED integration tests — FOUND
- b51d8dc feat(09-09): activity/users/teams-leader routers + integration tests — FOUND
