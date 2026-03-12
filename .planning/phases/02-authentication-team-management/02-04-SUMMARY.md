---
phase: 02-authentication-team-management
plan: 04
subsystem: team-management
tags: [teams, use-cases, repository, api-router, clean-architecture, auth-02]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [team-management-api, team-use-cases, team-repository]
  affects: [Backend/app/api/main.py, Backend/app/api/dependencies.py]
tech_stack:
  added: []
  patterns: [clean-architecture, tdd, repository-pattern, fastapi-depends]
key_files:
  created:
    - Backend/app/application/use_cases/manage_teams.py
    - Backend/app/infrastructure/database/repositories/team_repo.py
    - Backend/app/api/v1/teams.py
  modified:
    - Backend/app/api/dependencies.py
    - Backend/app/api/main.py
    - Backend/app/domain/repositories/user_repository.py
    - Backend/app/infrastructure/database/repositories/user_repo.py
    - Backend/tests/unit/application/test_manage_teams.py
decisions:
  - "UserListDTO.username maps to User.full_name — no separate username column exists, full_name is used as display identifier in search results"
  - "add_member is idempotent via IntegrityError catch-and-rollback at repository layer — use cases call it without duplicate-check logic"
  - "list_by_user uses two separate queries (owner + member) merged in Python — avoids complex UNION SQL while keeping clean repository interface"
  - "search_by_email_or_name added to IUserRepository and SqlAlchemyUserRepository — required by teams search-and-add flow, capped at 20 results"
metrics:
  duration_seconds: 198
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_created: 3
  files_modified: 5
---

# Phase 2 Plan 4: Team Management (Use Cases, Repository, API Router) Summary

**One-liner:** Full Clean Architecture team management stack — CreateTeamUseCase, AddTeamMemberUseCase, RemoveTeamMemberUseCase, SqlAlchemyTeamRepository, and /api/v1/teams router with 5 endpoints.

## What Was Built

Implemented AUTH-02 (team management) as a complete Clean Architecture vertical slice:

**Use Cases (`manage_teams.py`):**
- `CreateTeamUseCase` — creates team, sets `owner_id = current_user.id`
- `AddTeamMemberUseCase` — validates ownership (403), validates target user (404), then delegates to repo
- `RemoveTeamMemberUseCase` — validates ownership (403), then delegates to repo
- `ListTeamsUseCase` — returns all teams where user is owner or member

**Repository (`team_repo.py`):**
- `SqlAlchemyTeamRepository` implementing all 7 `ITeamRepository` methods
- `create()`: INSERT + flush/commit + re-fetch
- `get_by_id()`: SELECT with `is_deleted=False` filter
- `list_by_user()`: two queries (owner + member) merged in Python with deduplication
- `add_member()`: INSERT with IntegrityError catch for idempotent duplicate handling
- `remove_member()`: DELETE via `sqlalchemy.delete()`
- `get_members()`: SELECT user_ids for a team
- `soft_delete()`: sets `is_deleted=True` and `deleted_at=datetime.utcnow()`

**API Router (`teams.py`):**
- `GET /api/v1/teams` — list current user's teams
- `POST /api/v1/teams` — create team (HTTP 201, returns TeamResponseDTO)
- `POST /api/v1/teams/{team_id}/members` — add member (HTTP 204, 403 for non-owner)
- `DELETE /api/v1/teams/{team_id}/members/{user_id}` — remove member (HTTP 204, 403 for non-owner)
- `GET /api/v1/teams/users/search?q=` — search users by email or name for invite

**Infrastructure changes:**
- `get_team_repo` dependency added to `dependencies.py`
- `teams_router` registered in `main.py` under `/api/v1` prefix
- `search_by_email_or_name` added to `IUserRepository` interface and `SqlAlchemyUserRepository`

## Tests

5 unit tests (TDD) — all pass:
- `test_create_team_sets_owner` — PASSED
- `test_add_member_success` — PASSED
- `test_add_duplicate_member_ignored_or_raises` — PASSED
- `test_remove_member_success` — PASSED
- `test_only_owner_can_add_member` — PASSED

## Commits

| Hash | Message |
|------|---------|
| 22c4e37 | test(02-04): add failing tests for team management use cases (RED) |
| eae245d | feat(02-04): implement team use cases and SqlAlchemyTeamRepository (GREEN) |
| 7239840 | feat(02-04): add teams API router and wire into main.py |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Added search_by_email_or_name to IUserRepository**
- **Found during:** Task 2
- **Issue:** `teams.py` search endpoint calls `user_repo.search_by_email_or_name(q)`, but this method was absent from both the interface and implementation
- **Fix:** Added abstract method to `IUserRepository`, implemented in `SqlAlchemyUserRepository` using case-insensitive ILIKE on `email` and `full_name`, limited to 20 results
- **Files modified:** `Backend/app/domain/repositories/user_repository.py`, `Backend/app/infrastructure/database/repositories/user_repo.py`

**2. [Rule 1 - Bug] UserListDTO.username mapped from User.full_name**
- **Found during:** Task 2
- **Issue:** `UserListDTO` has `username` and `avatar_url` fields; `User` entity has `full_name` and `avatar` — no direct `from_attributes` mapping works
- **Fix:** Explicit manual mapping in the search endpoint handler — `username=u.full_name`, `avatar_url=u.avatar`
- **Files modified:** `Backend/app/api/v1/teams.py`

## Self-Check: PASSED

| Item | Status |
|------|--------|
| Backend/app/application/use_cases/manage_teams.py | FOUND |
| Backend/app/infrastructure/database/repositories/team_repo.py | FOUND |
| Backend/app/api/v1/teams.py | FOUND |
| commit 22c4e37 (RED tests) | FOUND |
| commit eae245d (use cases + repo) | FOUND |
| commit 7239840 (router + wiring) | FOUND |
