---
phase: 03-project-task-completion
plan: "05"
subsystem: task-backend
tags: [pagination, search, task-key, recurring-tasks, task-dependencies, audit-history]
dependency_graph:
  requires: [03-02]
  provides: [task-pagination, task-search, task-key-generation, task-dependencies, recurring-task-generation, task-history-endpoint]
  affects: [task-repo, manage-tasks, tasks-router]
tech_stack:
  added: [python-dateutil]
  patterns: [paginated-response, generic-dto, atomic-sequence-increment, series-id-pattern]
key_files:
  created:
    - Backend/app/infrastructure/database/repositories/task_dependency_repo.py
    - Backend/app/application/use_cases/manage_task_dependencies.py
  modified:
    - Backend/app/infrastructure/database/repositories/task_repo.py
    - Backend/app/application/use_cases/manage_tasks.py
    - Backend/app/application/dtos/task_dtos.py
    - Backend/app/api/v1/tasks.py
    - Backend/app/api/dependencies.py
    - Backend/app/domain/exceptions.py
    - Backend/app/domain/entities/task.py
decisions:
  - "[03-05]: /search endpoint placed before /{task_id} in router to avoid path param conflict"
  - "[03-05]: update_series() uses due_date >= utcnow() to only apply to future instances"
  - "[03-05]: ListDependenciesUseCase enriches each dependency with depends_on_key/title via task_repo lookup"
  - "[03-05]: get_project_member used for /search (project_id as query param) — dependency reads it from query string"
metrics:
  duration: "5 minutes"
  completed_date: "2026-03-14"
  tasks_completed: 2
  files_modified: 9
---

# Phase 03 Plan 05: Task Extensions — Pagination, Search, Dependencies, Recurring Summary

**One-liner:** Extended task system with atomic task_key generation via task_seq, paginated list, similarity search, audit history endpoint, circular-safe task dependencies, and recurring next-instance auto-creation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Task repo + task key generation + pagination + similarity search | 3fe1847 | task_repo.py, manage_tasks.py, task_dtos.py, task.py |
| 2 | Dependency use cases + repo + recurring logic + tasks router extensions | 02c86af | task_dependency_repo.py, manage_task_dependencies.py, tasks.py, dependencies.py, exceptions.py |

## What Was Built

### Task 1: Pagination, Search, Key Generation

**task_repo.py additions:**
- `generate_task_key(project_id, project_key)` — atomic `UPDATE ... RETURNING task_seq` to avoid race conditions
- `get_all_by_project_paginated(project_id, page, page_size)` — returns `(List[Task], total)` using count subquery
- `search_by_title(project_id, words)` — OR ilike conditions, limit 5
- `update_series(series_id, fields)` — bulk UPDATE for apply_to=all support
- Updated `create()` to atomically generate and store `task_key` after flush
- Updated `_to_entity()` to include `task_key`, `series_id`, and all recurrence fields

**task_dtos.py additions:**
- `PaginatedResponse[T]` generic Pydantic model with `items/total/page/page_size`
- `task_key` field added to `TaskResponseDTO`
- Recurring fields (`recurrence_interval`, `recurrence_end_date`, `recurrence_count`) added to `TaskCreateDTO`

**manage_tasks.py additions:**
- `STOP_WORDS` constant and `extract_search_words()` helper
- `ListProjectTasksPaginatedUseCase` returning `PaginatedResponse`
- `SearchSimilarTasksUseCase` — calls extract_search_words, returns max 5 results
- `map_task_to_response_dto()` updated to use `task.task_key` with fallback to computed key
- `CreateTaskUseCase` generates `series_id = uuid4()` for recurring tasks

**task.py domain entity:**
- Added `task_key`, `series_id`, `recurrence_interval`, `recurrence_end_date`, `recurrence_count` fields

### Task 2: Dependencies + Recurring Logic + Router Extensions

**task_dependency_repo.py (new):**
- `SqlAlchemyTaskDependencyRepository` with `add()`, `remove()`, `list_for_task()`
- `add()` enforces no self-dependency, no direct circular dependency (reverse pair check)
- IntegrityError on UniqueConstraint violation re-raised as `DependencyAlreadyExistsError`
- `list_for_task()` returns `{"blocks": [...], "blocked_by": [...]}` by querying both directions

**manage_task_dependencies.py (new):**
- `AddDependencyUseCase`, `RemoveDependencyUseCase`, `ListDependenciesUseCase`
- `ListDependenciesUseCase.execute()` enriches each dependency with `depends_on_key` and `depends_on_title` by fetching the related task

**exceptions.py:** Added `DependencyAlreadyExistsError`

**manage_tasks.py recurring logic:**
- `_check_recurrence_should_continue(task)` — checks `recurrence_end_date` and `recurrence_count`
- `_create_next_recurrence_instance(task, task_repo)` — creates next task with same `series_id`, incremented due date, `sprint_id=None`
- `UpdateTaskUseCase.execute()` accepts `apply_to: str = "this"` param
  - `apply_to="all"`: calls `task_repo.update_series(series_id, fields)` before individual update
  - After update: checks if column changed to done/completed/closed → triggers `_create_next_recurrence_instance`

**tasks.py router extensions:**
- `GET /project/{id}` → changed to `PaginatedResponse` with `page`/`page_size` query params
- `GET /search` → placed before `/{task_id}` to avoid routing conflict; uses `project_id` + `q` query params
- `GET /{task_id}/history` → delegates to `audit_repo.get_by_entity("task", task_id)`
- `GET /{task_id}/dependencies` → `ListDependenciesUseCase`
- `POST /{task_id}/dependencies` → `AddDependencyUseCase`; 409 on duplicate, 400 on circular
- `DELETE /{task_id}/dependencies/{dependency_id}` → `RemoveDependencyUseCase`
- `PUT /{task_id}` extended with `apply_to` query param

**dependencies.py:** Added `get_dependency_repo` factory function

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Task domain entity missing recurrence and key fields**
- **Found during:** Task 1
- **Issue:** `Task` domain entity had no `task_key`, `series_id`, or recurrence fields, but the plan required these to be stored/retrieved
- **Fix:** Added all fields to `Task` entity with `Optional` typing so existing code is unaffected
- **Files modified:** `Backend/app/domain/entities/task.py`
- **Commit:** 3fe1847

**2. [Rule 2 - Missing Critical Functionality] /search endpoint routing conflict**
- **Found during:** Task 2
- **Issue:** `/search` endpoint added after `/{task_id}` would cause FastAPI to match "search" as a task_id integer (and fail)
- **Fix:** Moved `/search` endpoint to appear before `/{task_id}` in the router
- **Files modified:** `Backend/app/api/v1/tasks.py`
- **Commit:** 02c86af

## Self-Check: PASSED

- FOUND: task_dependency_repo.py
- FOUND: manage_task_dependencies.py
- FOUND: 03-05-SUMMARY.md
- FOUND commit: 3fe1847 (Task 1)
- FOUND commit: 02c86af (Task 2)
