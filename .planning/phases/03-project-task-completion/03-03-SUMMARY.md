---
phase: 03-project-task-completion
plan: "03"
subsystem: backend
tags: [sprint-crud, project-members, use-cases, repositories, fastapi]
dependency_graph:
  requires: [03-02]
  provides: [sprint-crud-api, project-member-management-api]
  affects: [03-07]
tech_stack:
  added: []
  patterns: [clean-architecture, repository-pattern, use-case-pattern, idempotent-insert]
key_files:
  created:
    - Backend/app/application/use_cases/manage_sprints.py
    - Backend/app/infrastructure/database/repositories/sprint_repo.py
    - Backend/app/api/v1/sprints.py
    - Backend/app/application/use_cases/manage_project_members.py
  modified:
    - Backend/app/domain/exceptions.py
    - Backend/app/api/dependencies.py
    - Backend/app/api/main.py
    - Backend/app/domain/repositories/project_repository.py
    - Backend/app/domain/repositories/task_repository.py
    - Backend/app/infrastructure/database/repositories/project_repo.py
    - Backend/app/infrastructure/database/repositories/task_repo.py
    - Backend/app/application/dtos/project_dtos.py
    - Backend/app/api/v1/projects.py
decisions:
  - "[03-03]: POST /sprints uses inline project membership check (project_id in body) rather than get_sprint_project_member dependency which only reads query params"
  - "[03-03]: unassign_incomplete_tasks uses bulk UPDATE via SQLAlchemy core update() — no individual fetch needed"
  - "[03-03]: pg_insert with on_conflict_do_nothing() used for idempotent project member add"
metrics:
  duration_seconds: 291
  completed_date: "2026-03-14"
  tasks_completed: 2
  files_modified: 13
---

# Phase 3 Plan 03: Sprint CRUD and Project Member Management Summary

Sprint CRUD API (4 endpoints at /api/v1/sprints) and Project Member Management API (3 endpoints at /api/v1/projects/{id}/members) implemented as pure backend Clean Architecture layers.

## What Was Built

### Task 1: Sprint Layer
- **manage_sprints.py** — 4 use cases: CreateSprintUseCase, ListSprintsUseCase, UpdateSprintUseCase, DeleteSprintUseCase
- **sprint_repo.py** — SqlAlchemySprintRepository with get_by_id, get_by_project, create (flush+commit+refetch), update (dynamic field mapping), delete (hard delete)
- **sprints.py router** — GET /?project_id=X, POST /, PATCH /{sprint_id}, DELETE /{sprint_id}
- **dependencies.py** — added get_sprint_repo and get_sprint_project_member
- **main.py** — registered sprints router at /api/v1/sprints
- **exceptions.py** — added SprintNotFoundError and UserNotFoundError

### Task 2: Project Member Layer
- **manage_project_members.py** — 3 use cases: AddProjectMemberUseCase, AddTeamToProjectUseCase, RemoveProjectMemberUseCase
- **project_repo.py** — add_member (pg_insert ON CONFLICT DO NOTHING), remove_member (DELETE), get_members (JOIN query with role eager load)
- **task_repo.py** — unassign_incomplete_tasks (bulk UPDATE tasks SET assignee_id=NULL excluding done columns)
- **project_dtos.py** — ProjectMemberDTO (id, full_name, avatar_path, role_name, is_current_member)
- **projects.py** — GET /{id}/members, POST /{id}/members, DELETE /{id}/members/{user_id}

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] POST /sprints inline membership check**
- **Found during:** Task 1
- **Issue:** get_sprint_project_member reads project_id from query param, but POST /sprints receives project_id in request body — dependency would always fail with 422 for POST requests
- **Fix:** POST /create_sprint handler uses get_current_user + inline project_repo.get_by_id_and_user() check using project_id from the DTO body
- **Files modified:** Backend/app/api/v1/sprints.py

**2. [Rule 2 - Missing Critical Functionality] unassign_incomplete_tasks added to ITaskRepository**
- **Found during:** Task 2 — RemoveProjectMemberUseCase requires this operation
- **Issue:** ITaskRepository had no method for bulk-unassigning tasks; adding it to the interface ensures future implementations must provide it
- **Fix:** Added abstract method to ITaskRepository and bulk UPDATE implementation in SqlAlchemyTaskRepository
- **Files modified:** Backend/app/domain/repositories/task_repository.py, Backend/app/infrastructure/database/repositories/task_repo.py

## Self-Check: PASSED

Files verified present:
- Backend/app/application/use_cases/manage_sprints.py — FOUND
- Backend/app/infrastructure/database/repositories/sprint_repo.py — FOUND
- Backend/app/api/v1/sprints.py — FOUND
- Backend/app/application/use_cases/manage_project_members.py — FOUND

Commits: 92382bd (sprint layer), 1482835 (member layer) — both present in git log.

Import verification passed: `Sprint layer imports OK`, `Project member layer imports OK`.
