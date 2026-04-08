---
plan: "06-01"
phase: "06-reporting-analytics"
type: execute
title: "Backend Reporting Data Endpoints"
wave: 1
depends_on: []
requirements: [REPT-01, REPT-02, REPT-04]
files_modified:
  - Backend/app/application/dtos/report_dtos.py
  - Backend/app/domain/repositories/report_repository.py
  - Backend/app/infrastructure/database/repositories/report_repo.py
  - Backend/app/application/use_cases/generate_reports.py
  - Backend/app/api/v1/reports.py
  - Backend/app/api/dependencies.py
  - Backend/app/api/main.py
autonomous: true
must_haves:
  truths:
    - "GET /api/v1/reports/summary returns active and completed task counts for a project"
    - "GET /api/v1/reports/burndown returns daily remaining-task series for an active or specified sprint"
    - "GET /api/v1/reports/velocity returns completed points per sprint (or per week if no sprints)"
    - "GET /api/v1/reports/distribution returns task counts grouped by status or priority"
    - "GET /api/v1/reports/performance returns per-member metrics including on-time delivery rate"
    - "All endpoints filter by project_id (required), assignee_ids, date_from, date_to"
    - "Non-members receive HTTP 403 on all report endpoints; admins bypass"
  artifacts:
    - path: "Backend/app/application/dtos/report_dtos.py"
      provides: "All response DTOs for reporting endpoints"
      contains: "SummaryDTO"
    - path: "Backend/app/domain/repositories/report_repository.py"
      provides: "IReportRepository abstract interface"
      contains: "class IReportRepository"
    - path: "Backend/app/infrastructure/database/repositories/report_repo.py"
      provides: "SQL aggregation queries for all 5 data endpoints"
      contains: "class SqlAlchemyReportRepository"
    - path: "Backend/app/application/use_cases/generate_reports.py"
      provides: "Use case classes delegating to IReportRepository"
      contains: "class GetSummaryUseCase"
    - path: "Backend/app/api/v1/reports.py"
      provides: "FastAPI router with 5 GET data endpoints"
      contains: "router = APIRouter()"
  key_links:
    - from: "Backend/app/api/v1/reports.py"
      to: "Backend/app/application/use_cases/generate_reports.py"
      via: "use case instantiation in each endpoint"
      pattern: "UseCase\\(report_repo\\)"
    - from: "Backend/app/api/main.py"
      to: "Backend/app/api/v1/reports.py"
      via: "app.include_router"
      pattern: 'include_router.*reports.*prefix="/api/v1/reports"'
    - from: "Backend/app/api/dependencies.py"
      to: "Backend/app/infrastructure/database/repositories/report_repo.py"
      via: "get_report_repo dependency"
      pattern: "def get_report_repo"
---

## Objective

Create all backend reporting data endpoints following Clean Architecture. Five GET endpoints under `/api/v1/reports/` provide aggregated data for charts and performance metrics. All endpoints accept common filter query params (project_id required, assignee_ids/date_from/date_to optional) and enforce project membership via `get_project_member` dependency.

Purpose: Frontend charts (Plan 03) and manager dashboard (Plan 04) consume these endpoints. Without them, no reporting data is available.

Output: 7 files — DTOs, domain interface, SQL repo, use cases, router, dependency registration, main.py router registration.

## Tasks

<task type="auto">
  <name>Task 1: Domain contracts — report DTOs and IReportRepository interface</name>
  <files>Backend/app/application/dtos/report_dtos.py, Backend/app/domain/repositories/report_repository.py</files>
  <read_first>
    - Backend/app/application/dtos/notification_dtos.py — DTO pattern (Pydantic BaseModel with ConfigDict)
    - Backend/app/domain/repositories/notification_repository.py — interface pattern (ABC with abstract methods)
    - Backend/app/infrastructure/database/models/task.py — TaskModel fields: due_date, assignee_id, sprint_id, column_id, points, task_key, priority, reporter_id, created_at, updated_at
    - Backend/app/infrastructure/database/models/sprint.py — SprintModel fields: start_date, end_date, is_active, name, project_id
    - Backend/app/infrastructure/database/models/board_column.py — BoardColumnModel fields: name, project_id, order_index
    - Backend/app/infrastructure/database/models/audit_log.py — AuditLogModel fields: entity_type, entity_id, field_name, old_value, new_value, user_id, action, timestamp
  </read_first>
  <action>
    Create `Backend/app/application/dtos/report_dtos.py` with these Pydantic models (all using `model_config = ConfigDict(from_attributes=True)`):

    ```python
    from pydantic import BaseModel, ConfigDict
    from typing import List, Optional
    from datetime import date, datetime

    class SummaryDTO(BaseModel):
        model_config = ConfigDict(from_attributes=True)
        active_tasks: int
        completed_tasks: int
        total_tasks: int
        completion_rate: float  # percentage 0-100

    class BurndownPointDTO(BaseModel):
        date: str  # ISO date string "YYYY-MM-DD"
        remaining: int
        total: int

    class BurndownDTO(BaseModel):
        sprint_name: str
        sprint_id: int
        series: List[BurndownPointDTO]

    class VelocityPointDTO(BaseModel):
        label: str  # sprint name or "W14" week label
        completed_count: int
        completed_points: int

    class VelocityDTO(BaseModel):
        series: List[VelocityPointDTO]

    class DistributionItemDTO(BaseModel):
        label: str  # status name or priority name
        count: int
        color: Optional[str] = None  # CSS variable hint

    class DistributionDTO(BaseModel):
        group_by: str  # "status" or "priority"
        items: List[DistributionItemDTO]

    class MemberPerformanceDTO(BaseModel):
        user_id: int
        full_name: str
        avatar_path: Optional[str] = None
        assigned: int
        completed: int
        in_progress: int
        on_time_pct: float  # 0-100, 1 decimal

    class PerformanceDTO(BaseModel):
        members: List[MemberPerformanceDTO]

    class TaskExportRowDTO(BaseModel):
        task_key: Optional[str]
        title: str
        status: Optional[str]  # column name
        assignee: Optional[str]  # full_name
        priority: Optional[str]
        sprint: Optional[str]  # sprint name
        points: Optional[int]
        created_at: Optional[datetime]
        due_date: Optional[datetime]
        updated_at: Optional[datetime]
        reporter: Optional[str]  # full_name
    ```

    Create `Backend/app/domain/repositories/report_repository.py` with:

    ```python
    from abc import ABC, abstractmethod
    from typing import List, Optional
    from datetime import date
    from app.application.dtos.report_dtos import (
        SummaryDTO, BurndownDTO, VelocityDTO,
        DistributionDTO, PerformanceDTO, TaskExportRowDTO,
    )

    class IReportRepository(ABC):
        @abstractmethod
        async def get_summary(self, project_id: int, assignee_ids: Optional[List[int]], date_from: Optional[date], date_to: Optional[date]) -> SummaryDTO: ...

        @abstractmethod
        async def get_burndown(self, project_id: int, sprint_id: Optional[int]) -> BurndownDTO: ...

        @abstractmethod
        async def get_velocity(self, project_id: int, date_from: Optional[date], date_to: Optional[date]) -> VelocityDTO: ...

        @abstractmethod
        async def get_distribution(self, project_id: int, group_by: str, assignee_ids: Optional[List[int]], date_from: Optional[date], date_to: Optional[date]) -> DistributionDTO: ...

        @abstractmethod
        async def get_performance(self, project_id: int, assignee_ids: Optional[List[int]], date_from: Optional[date], date_to: Optional[date]) -> PerformanceDTO: ...

        @abstractmethod
        async def get_tasks_for_export(self, project_id: int, assignee_ids: Optional[List[int]], date_from: Optional[date], date_to: Optional[date]) -> List[TaskExportRowDTO]: ...
    ```
  </action>
  <verify>
    <automated>cd Backend && python3 -c "from app.application.dtos.report_dtos import SummaryDTO, BurndownDTO, VelocityDTO, DistributionDTO, PerformanceDTO, TaskExportRowDTO; print('OK')"</automated>
  </verify>
  <done>report_dtos.py contains SummaryDTO, BurndownDTO, VelocityDTO, DistributionDTO, PerformanceDTO, MemberPerformanceDTO, TaskExportRowDTO. report_repository.py contains IReportRepository ABC with 6 abstract methods (get_summary, get_burndown, get_velocity, get_distribution, get_performance, get_tasks_for_export).</done>
  <acceptance_criteria>
    - `grep -r "class SummaryDTO" Backend/app/application/dtos/report_dtos.py` exits 0
    - `grep -r "class BurndownDTO" Backend/app/application/dtos/report_dtos.py` exits 0
    - `grep -r "class VelocityDTO" Backend/app/application/dtos/report_dtos.py` exits 0
    - `grep -r "class DistributionDTO" Backend/app/application/dtos/report_dtos.py` exits 0
    - `grep -r "class PerformanceDTO" Backend/app/application/dtos/report_dtos.py` exits 0
    - `grep -r "class MemberPerformanceDTO" Backend/app/application/dtos/report_dtos.py` exits 0
    - `grep -r "class TaskExportRowDTO" Backend/app/application/dtos/report_dtos.py` exits 0
    - `grep -r "class IReportRepository" Backend/app/domain/repositories/report_repository.py` exits 0
    - `grep -r "async def get_summary" Backend/app/domain/repositories/report_repository.py` exits 0
    - `grep -r "async def get_burndown" Backend/app/domain/repositories/report_repository.py` exits 0
    - `grep -r "async def get_velocity" Backend/app/domain/repositories/report_repository.py` exits 0
    - `grep -r "async def get_distribution" Backend/app/domain/repositories/report_repository.py` exits 0
    - `grep -r "async def get_performance" Backend/app/domain/repositories/report_repository.py` exits 0
    - `grep -r "async def get_tasks_for_export" Backend/app/domain/repositories/report_repository.py` exits 0
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: SQL report repo, use cases, router, and wiring</name>
  <files>Backend/app/infrastructure/database/repositories/report_repo.py, Backend/app/application/use_cases/generate_reports.py, Backend/app/api/v1/reports.py, Backend/app/api/dependencies.py, Backend/app/api/main.py</files>
  <read_first>
    - Backend/app/application/dtos/report_dtos.py — DTOs created in Task 1
    - Backend/app/domain/repositories/report_repository.py — interface created in Task 1
    - Backend/app/infrastructure/database/repositories/audit_repo.py — existing repo pattern (SqlAlchemy async session usage)
    - Backend/app/infrastructure/database/repositories/task_repo.py — existing query patterns (select, join, where, group_by)
    - Backend/app/application/use_cases/manage_notifications.py — use case class pattern (constructor takes repo, execute method)
    - Backend/app/api/v1/notifications.py — router pattern (APIRouter, Depends, endpoint functions)
    - Backend/app/api/dependencies.py — dependency injection pattern (get_*_repo functions)
    - Backend/app/api/main.py — router registration pattern (include_router)
    - Backend/app/infrastructure/database/models/task.py — TaskModel relationships and columns
    - Backend/app/infrastructure/database/models/audit_log.py — AuditLogModel columns (new_value is Text type)
    - Backend/app/infrastructure/database/models/board_column.py — BoardColumnModel.name for ilike('%done%')
    - Backend/app/infrastructure/database/models/sprint.py — SprintModel.is_active, start_date, end_date
  </read_first>
  <action>
    **File 1: `Backend/app/infrastructure/database/repositories/report_repo.py`**

    Create `SqlAlchemyReportRepository(IReportRepository)` with `__init__(self, session: AsyncSession)`.

    **get_summary()**:
    - Count tasks WHERE project_id matches, deleted_at IS NULL, optionally filtered by assignee_ids and created_at between date_from/date_to.
    - "Done" tasks: column_id IN (SELECT id FROM board_columns WHERE project_id=X AND name ILIKE '%done%'). Use `BoardColumnModel.name.ilike("%done%")` — Phase 4 established pattern.
    - active_tasks = total - completed. completion_rate = (completed/total)*100 rounded to 1 decimal, or 0 if total=0.

    **get_burndown()**:
    - If sprint_id is None, find the active sprint (is_active=True) for the project. If no active sprint, find the most recent sprint by end_date DESC.
    - If still no sprint, return BurndownDTO with empty series and sprint_name="" and sprint_id=0.
    - Get done column IDs for the project (ilike '%done%').
    - Get total task count for the sprint (TaskModel.sprint_id == sprint.id, deleted_at IS NULL).
    - For each day from sprint.start_date to min(sprint.end_date, date.today()):
      Query AuditLogModel: entity_type='task', field_name='column_id', new_value IN [str(cid) for cid in done_col_ids] (CRITICAL: cast column IDs to strings per Pitfall 4), func.date(timestamp) <= current_day. Count distinct entity_id values (to avoid double-counting).
      remaining = total - done_by_day.
    - Return BurndownDTO with sprint_name, sprint_id, and series.

    **get_velocity()**:
    - Get all sprints for the project ordered by start_date.
    - If sprints exist: for each sprint, count tasks in done columns and sum their points. Label = sprint.name[:12] (truncate per Pitfall 6).
    - If no sprints: group tasks by calendar week (use func.extract('week', TaskModel.updated_at)). Label = "W{week_number}". Filter to tasks in done columns updated within date_from..date_to.
    - Return VelocityDTO with series.

    **get_distribution()**:
    - If group_by == "status": join TaskModel with BoardColumnModel, GROUP BY board_columns.name. Count tasks per column. Assign color hints: 'done' columns get '--status-done', columns with 'progress' get '--status-progress', others get '--status-todo'.
    - If group_by == "priority": GROUP BY TaskModel.priority. Map priority enum values to labels. Assign color hints: CRITICAL='--priority-critical', HIGH='--priority-high', MEDIUM='--priority-medium', LOW='--priority-low'.
    - Apply assignee_ids and date_from/date_to filters. Filter deleted_at IS NULL.
    - Return DistributionDTO.

    **get_performance()**:
    - Get done column IDs for the project (ilike '%done%').
    - For each member (assignee) with tasks in this project:
      - assigned: COUNT tasks WHERE assignee_id = member AND deleted_at IS NULL
      - completed: COUNT tasks WHERE assignee_id = member AND column_id IN done_col_ids AND updated_at BETWEEN date_from AND date_to
      - in_progress: COUNT tasks WHERE assignee_id = member AND column_id NOT IN done_col_ids AND deleted_at IS NULL
      - on_time: For each completed task: if due_date exists, check updated_at.date() <= due_date. If no due_date but sprint exists, check updated_at.date() <= sprint.end_date. Exclude tasks with neither.
      - on_time_pct = round((on_time_count / completed) * 100, 1) if completed > 0 else 0.0
    - Join with UserModel to get full_name and avatar_path.
    - Return PerformanceDTO.

    **get_tasks_for_export()**:
    - SELECT tasks joined with board_columns (for status name), users (assignee full_name, reporter full_name), sprints (sprint name).
    - Filter by project_id, assignee_ids, date_from/date_to on created_at. Filter deleted_at IS NULL.
    - Return List[TaskExportRowDTO].

    **File 2: `Backend/app/application/use_cases/generate_reports.py`**

    Create thin use case classes (each takes IReportRepository in constructor, has async execute() method):
    - `GetSummaryUseCase` — delegates to `repo.get_summary()`
    - `GetBurndownUseCase` — delegates to `repo.get_burndown()`
    - `GetVelocityUseCase` — delegates to `repo.get_velocity()`
    - `GetDistributionUseCase` — delegates to `repo.get_distribution()`
    - `GetPerformanceUseCase` — delegates to `repo.get_performance()`

    **File 3: `Backend/app/api/v1/reports.py`**

    Create FastAPI router with 5 GET endpoints. Import `_is_admin` from `app.api.dependencies`.

    All endpoints share these params: `project_id: int`, `assignee_ids: Optional[str] = Query(None)`, `date_from: Optional[date] = Query(None)`, `date_to: Optional[date] = Query(None)`, `current_user: User = Depends(get_current_user)`, `project_repo: IProjectRepository = Depends(get_project_repo)`, `report_repo: IReportRepository = Depends(get_report_repo)`.

    Extract helper `_parse_assignee_ids(assignee_ids: Optional[str]) -> Optional[List[int]]` — splits comma-separated string to int list, returns None if empty.

    Each endpoint: parse assignee_ids, check membership (inline: if not admin, call project_repo.get_by_id_and_user, raise 403 if None), instantiate use case, execute, return.

    Endpoints:
    - `GET /summary` — response_model=SummaryDTO
    - `GET /burndown` — response_model=BurndownDTO, extra param: sprint_id: Optional[int] = Query(None)
    - `GET /velocity` — response_model=VelocityDTO
    - `GET /distribution` — response_model=DistributionDTO, extra param: group_by: str = Query("status")
    - `GET /performance` — response_model=PerformanceDTO

    **File 4: Modify `Backend/app/api/dependencies.py`**

    Add import at top: `from app.domain.repositories.report_repository import IReportRepository`

    Add dependency function after get_notification_service:
    ```python
    def get_report_repo(session: AsyncSession = Depends(get_db)) -> IReportRepository:
        from app.infrastructure.database.repositories.report_repo import SqlAlchemyReportRepository
        return SqlAlchemyReportRepository(session)
    ```

    **File 5: Modify `Backend/app/api/main.py`**

    Add import: `from app.api.v1 import reports`
    Add after line 146: `app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])`
  </action>
  <verify>
    <automated>cd Backend && python3 -c "from app.api.v1.reports import router; print('OK')"</automated>
  </verify>
  <done>SqlAlchemyReportRepository implements all 6 IReportRepository methods. 5 use case classes exist. reports.py router has 5 GET endpoints. get_report_repo registered in dependencies.py. Router registered in main.py at /api/v1/reports.</done>
  <acceptance_criteria>
    - `grep -r "class SqlAlchemyReportRepository" Backend/app/infrastructure/database/repositories/report_repo.py` exits 0
    - `grep -r "ilike.*done" Backend/app/infrastructure/database/repositories/report_repo.py` exits 0
    - `grep -r "str(c" Backend/app/infrastructure/database/repositories/report_repo.py` exits 0
    - `grep -r "class GetSummaryUseCase" Backend/app/application/use_cases/generate_reports.py` exits 0
    - `grep -r "class GetBurndownUseCase" Backend/app/application/use_cases/generate_reports.py` exits 0
    - `grep -r "class GetVelocityUseCase" Backend/app/application/use_cases/generate_reports.py` exits 0
    - `grep -r "class GetDistributionUseCase" Backend/app/application/use_cases/generate_reports.py` exits 0
    - `grep -r "class GetPerformanceUseCase" Backend/app/application/use_cases/generate_reports.py` exits 0
    - `grep -r "router = APIRouter" Backend/app/api/v1/reports.py` exits 0
    - `grep -r 'def get_summary' Backend/app/api/v1/reports.py` exits 0
    - `grep -r 'def get_burndown' Backend/app/api/v1/reports.py` exits 0
    - `grep -r 'def get_velocity' Backend/app/api/v1/reports.py` exits 0
    - `grep -r 'def get_distribution' Backend/app/api/v1/reports.py` exits 0
    - `grep -r 'def get_performance' Backend/app/api/v1/reports.py` exits 0
    - `grep -r "get_report_repo" Backend/app/api/dependencies.py` exits 0
    - `grep -r 'include_router.*reports' Backend/app/api/main.py` exits 0
    - `grep -r 'prefix="/api/v1/reports"' Backend/app/api/main.py` exits 0
  </acceptance_criteria>
</task>

## Verification

After both tasks complete:
1. `cd Backend && python3 -c "from app.api.v1.reports import router; from app.application.dtos.report_dtos import SummaryDTO, BurndownDTO, VelocityDTO, DistributionDTO, PerformanceDTO; print('All imports OK')"` — validates the full import chain
2. All 5 data endpoints are registered under `/api/v1/reports/`
3. `get_report_repo` dependency exists in dependencies.py
4. Router is registered in main.py with correct prefix
