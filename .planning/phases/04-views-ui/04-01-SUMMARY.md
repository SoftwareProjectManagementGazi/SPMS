---
phase: 04-views-ui
plan: "01"
subsystem: backend-columns-sprints
tags: [board-columns, sprints, kanban, api, frontend]
dependency_graph:
  requires: []
  provides:
    - IBoardColumnRepository interface
    - SqlAlchemyBoardColumnRepository
    - BoardColumnDTO, CreateColumnDTO, UpdateColumnDTO
    - ListColumnsUseCase, CreateColumnUseCase, UpdateColumnUseCase, DeleteColumnUseCase, SeedDefaultColumnsUseCase
    - GET/POST/PATCH/DELETE /api/v1/projects/{id}/columns endpoints
    - CloseSprintUseCase
    - PATCH /sprints/{id}/close endpoint
    - DELETE /sprints/{id}?move_tasks_to=N endpoint
    - taskService.patchTask for partial PATCH updates
  affects:
    - Backend/app/api/main.py (new router registered)
    - Backend/app/api/dependencies.py (get_board_column_repo added)
    - Backend/app/domain/repositories/sprint_repository.py (move_tasks_to_sprint added)
    - Backend/app/infrastructure/database/repositories/sprint_repo.py (implementation added)
    - Backend/app/application/dtos/project_dtos.py (default columns changed)
tech_stack:
  added: []
  patterns:
    - IBoardColumnRepository ABC with 6 abstract methods
    - Hard delete for board columns (no soft-delete — reference data pattern)
    - is_deleted == False for task count filtering (consistent with task_repo pattern)
    - move_tasks_to_sprint on ISprintRepository for bulk task reassignment
    - incomplete_only flag uses ilike('%done%') column name matching
key_files:
  created:
    - Backend/app/domain/repositories/board_column_repository.py
    - Backend/app/application/dtos/board_column_dtos.py
    - Backend/app/infrastructure/database/repositories/board_column_repo.py
    - Backend/app/application/use_cases/manage_board_columns.py
    - Backend/app/api/v1/board_columns.py
  modified:
    - Backend/app/api/dependencies.py
    - Backend/app/api/main.py
    - Backend/app/application/use_cases/manage_sprints.py
    - Backend/app/api/v1/sprints.py
    - Backend/app/domain/repositories/sprint_repository.py
    - Backend/app/infrastructure/database/repositories/sprint_repo.py
    - Frontend/services/task-service.ts
    - Backend/app/application/dtos/project_dtos.py
decisions:
  - "move_tasks_to_sprint added to ISprintRepository interface (not as inline SQLAlchemy in use case) for Clean Architecture consistency"
  - "DeleteColumnUseCase uses isinstance check to access session directly — columns repo has no task-moving method on its interface"
  - "Sprint incomplete detection uses ilike('%done%') column name — simpler than last-column-by-order_index approach, acceptable per plan"
  - "DeleteSprintUseCase now checks sprint existence before task move to avoid orphan task updates"
  - "CloseSprintUseCase: incomplete_only=True (preferred approach from plan) — only moves tasks not in Done columns"
  - "Board column router registered under /api/v1/projects prefix so full path is /api/v1/projects/{id}/columns"
metrics:
  duration_minutes: 4
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_created: 5
  files_modified: 8
---

# Phase 4 Plan 01: Backend Foundation for Views & UI Summary

**One-liner:** Board column CRUD API with sprint close/delete task reassignment and frontend patchTask for lightweight partial updates.

## What Was Built

### Task 1: Board Column Repository Interface, DTOs, SQLAlchemy Repo, Use Cases

**`Backend/app/domain/repositories/board_column_repository.py`**
- `IBoardColumnRepository` ABC with 6 methods: `get_by_project`, `get_by_id`, `create`, `update`, `delete`, `count_tasks`
- `get_by_project` returns columns ordered by `order_index ASC`
- `count_tasks` counts non-deleted tasks (`is_deleted == False`) per column

**`Backend/app/application/dtos/board_column_dtos.py`**
- `BoardColumnDTO`: full column shape with `task_count` computed field
- `CreateColumnDTO`: name (1-50 chars), order_index (ge=0)
- `UpdateColumnDTO`: optional name/order_index for patch operations
- `DeleteColumnRequestDTO`: `move_tasks_to_column_id` required field

**`Backend/app/infrastructure/database/repositories/board_column_repo.py`**
- `SqlAlchemyBoardColumnRepository` implementing all 6 interface methods
- Hard delete (`session.delete(model)`) — no soft-delete for reference data
- `count_tasks` uses `func.count()` with `is_deleted == False` filter

**`Backend/app/application/use_cases/manage_board_columns.py`**
- `ListColumnsUseCase`: fetches columns + task_count per column
- `CreateColumnUseCase`: assigns order_index (provided or max+1)
- `UpdateColumnUseCase`: patches name/order_index, raises ValueError for missing column
- `DeleteColumnUseCase`: moves tasks via bulk UPDATE, then hard deletes column
- `SeedDefaultColumnsUseCase`: inserts 5 defaults ["Backlog", "Todo", "In Progress", "In Review", "Done"] at order_index 0-4

### Task 2: Board Column Router, Sprint Close/Delete, Frontend patchTask

**`Backend/app/api/v1/board_columns.py`**
- `GET /{project_id}/columns` — any project member
- `POST /{project_id}/columns` — manager or admin only
- `PATCH /{project_id}/columns/{col_id}` — manager or admin only
- `DELETE /{project_id}/columns/{col_id}?move_tasks_to_column_id={id}` — manager or admin only
- Registered in `main.py` under `/api/v1/projects` prefix

**`Backend/app/domain/repositories/sprint_repository.py`**
- Added `move_tasks_to_sprint(from_sprint_id, to_sprint_id, incomplete_only)` abstract method

**`Backend/app/infrastructure/database/repositories/sprint_repo.py`**
- Implemented `move_tasks_to_sprint`: bulk UPDATE with optional done-column filtering via `ilike('%done%')`

**`Backend/app/application/use_cases/manage_sprints.py`**
- `CloseSprintUseCase`: marks sprint `is_active=False`, moves incomplete tasks to target sprint/backlog
- `DeleteSprintUseCase`: updated to accept `move_tasks_to_sprint_id`, moves ALL tasks before delete

**`Backend/app/api/v1/sprints.py`**
- `PATCH /sprints/{sprint_id}/close` — body: `{ move_tasks_to_sprint_id: int | null }`
- `DELETE /sprints/{sprint_id}?move_tasks_to=N` — optional query param

**`Frontend/services/task-service.ts`**
- `patchTask(taskId, partial)` — uses `apiClient.patch` (not `.put`) for partial updates
- Accepts `Partial<{ column_id, due_date, sprint_id }>` for DnD drag events

**`Backend/app/application/dtos/project_dtos.py`**
- `ProjectCreateDTO.columns` default changed from `[]` to `["Backlog", "Todo", "In Progress", "In Review", "Done"]`

## Key Decisions Made

1. **Sprint done detection:** Uses `ilike('%done%')` column name matching (preferred approach from plan). Simpler than last-column-by-order_index and handles multiple done variants.

2. **move_tasks_to_sprint on interface:** Added to `ISprintRepository` interface rather than inline SQLAlchemy in the use case — maintains Clean Architecture, no framework imports in use cases.

3. **DeleteColumnUseCase task movement:** Uses `isinstance(self.column_repo, SqlAlchemyBoardColumnRepository)` to access the session for bulk UPDATE. The `IBoardColumnRepository` interface doesn't expose a task-moving method (not its responsibility), so the use case accesses the concrete impl directly for this cross-aggregate operation.

4. **Hard delete for columns:** Board columns use hard delete (no `TimestampedMixin`) — reference data with no audit value, consistent with Phase 3 pattern for task_dependencies.

5. **Router prefix:** Board column router registered under `/api/v1/projects` so full paths become `/api/v1/projects/{project_id}/columns`.

## Interface Contracts Produced

### BoardColumnDTO
```python
class BoardColumnDTO(BaseModel):
    id: int
    project_id: int
    name: str
    order_index: int
    wip_limit: int = 0
    task_count: int = 0  # computed
```

### patchTask signature
```typescript
patchTask: async (
    taskId: string,
    partial: Partial<{ column_id: number; due_date: string | null; sprint_id: number | null }>
): Promise<ParentTask>
```

### CloseSprintUseCase
```python
CloseSprintUseCase.execute(sprint_id: int, move_tasks_to_sprint_id: Optional[int] = None) -> SprintResponseDTO
```

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `Backend/app/domain/repositories/board_column_repository.py` — created
- [x] `Backend/app/application/dtos/board_column_dtos.py` — created
- [x] `Backend/app/infrastructure/database/repositories/board_column_repo.py` — created
- [x] `Backend/app/application/use_cases/manage_board_columns.py` — created
- [x] `Backend/app/api/v1/board_columns.py` — created
- [x] 4 column routes: `['/{project_id}/columns', '/{project_id}/columns', '/{project_id}/columns/{col_id}', '/{project_id}/columns/{col_id}']`
- [x] `CloseSprintUseCase` and `DeleteSprintUseCase` importable
- [x] `patchTask` uses `apiClient.patch`
- [x] `ProjectCreateDTO` default has 5 columns
- [x] Commits: `004ebe3` (Task 1), `d8cb5b2` (Task 2)

## Self-Check: PASSED
