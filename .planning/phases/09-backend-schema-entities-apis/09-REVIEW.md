---
phase: 09-backend-schema-entities-apis
reviewed: 2026-04-21T00:00:00Z
depth: standard
files_reviewed: 75
files_reviewed_list:
  - Backend/alembic/versions/005_phase9_schema.py
  - Backend/app/infrastructure/database/models/audit_log.py
  - Backend/app/infrastructure/database/models/__init__.py
  - Backend/app/api/deps/__init__.py
  - Backend/app/api/deps/auth.py
  - Backend/app/api/deps/user.py
  - Backend/app/api/deps/project.py
  - Backend/app/api/deps/task.py
  - Backend/app/api/deps/team.py
  - Backend/app/api/deps/milestone.py
  - Backend/app/api/deps/artifact.py
  - Backend/app/api/deps/phase_report.py
  - Backend/app/api/dependencies.py
  - Backend/app/domain/exceptions.py
  - Backend/app/domain/entities/project.py
  - Backend/app/domain/entities/task.py
  - Backend/app/domain/entities/team.py
  - Backend/app/domain/entities/process_template.py
  - Backend/app/domain/entities/milestone.py
  - Backend/app/domain/entities/artifact.py
  - Backend/app/domain/entities/phase_report.py
  - Backend/app/domain/repositories/team_repository.py
  - Backend/app/domain/repositories/project_repository.py
  - Backend/app/domain/repositories/task_repository.py
  - Backend/app/domain/repositories/milestone_repository.py
  - Backend/app/domain/repositories/artifact_repository.py
  - Backend/app/domain/repositories/phase_report_repository.py
  - Backend/app/domain/repositories/audit_repository.py
  - Backend/app/infrastructure/database/models/project.py
  - Backend/app/infrastructure/database/models/task.py
  - Backend/app/infrastructure/database/models/team.py
  - Backend/app/infrastructure/database/models/process_template.py
  - Backend/app/infrastructure/database/models/milestone.py
  - Backend/app/infrastructure/database/models/artifact.py
  - Backend/app/infrastructure/database/models/phase_report.py
  - Backend/app/infrastructure/database/repositories/team_repo.py
  - Backend/app/infrastructure/database/repositories/project_repo.py
  - Backend/app/infrastructure/database/repositories/task_repo.py
  - Backend/app/infrastructure/database/repositories/milestone_repo.py
  - Backend/app/infrastructure/database/repositories/artifact_repo.py
  - Backend/app/infrastructure/database/repositories/phase_report_repo.py
  - Backend/app/infrastructure/database/repositories/audit_repo.py
  - Backend/app/application/services/process_config_normalizer.py
  - Backend/app/application/services/artifact_seeder.py
  - Backend/app/application/services/phase_report_pdf.py
  - Backend/app/application/services/idempotency_cache.py
  - Backend/app/application/services/phase_gate_service.py
  - Backend/app/application/dtos/milestone_dtos.py
  - Backend/app/application/dtos/artifact_dtos.py
  - Backend/app/application/dtos/phase_report_dtos.py
  - Backend/app/application/dtos/phase_transition_dtos.py
  - Backend/app/application/dtos/workflow_dtos.py
  - Backend/app/application/dtos/activity_dtos.py
  - Backend/app/application/dtos/user_summary_dtos.py
  - Backend/app/application/dtos/team_dtos.py
  - Backend/app/application/use_cases/manage_milestones.py
  - Backend/app/application/use_cases/manage_artifacts.py
  - Backend/app/application/use_cases/manage_phase_reports.py
  - Backend/app/application/use_cases/execute_phase_transition.py
  - Backend/app/application/use_cases/manage_projects.py
  - Backend/app/application/use_cases/get_project_activity.py
  - Backend/app/application/use_cases/get_user_summary.py
  - Backend/app/application/use_cases/manage_teams.py
  - Backend/app/application/use_cases/apply_process_template.py
  - Backend/app/api/v1/phase_transitions.py
  - Backend/app/api/v1/activity.py
  - Backend/app/api/v1/users.py
  - Backend/app/api/v1/teams.py
  - Backend/app/api/v1/milestones.py
  - Backend/app/api/v1/artifacts.py
  - Backend/app/api/v1/phase_reports.py
  - Backend/app/api/main.py
findings:
  critical: 3
  warning: 9
  info: 6
  total: 18
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-04-21T00:00:00Z
**Depth:** standard
**Files Reviewed:** 75
**Status:** issues_found

## Summary

This phase implements a substantial set of new backend capabilities: Alembic migration 005, three new ORM models (milestones, artifacts, phase_reports), the Phase Gate use case with advisory locks, idempotency caching, PDF export, activity feed, user summary, template application, and all associated DI wiring.

The architecture is largely well-structured and follows Clean Architecture conventions. The critical issues are: (1) task moves in the phase-transition use case mutate in-memory Task entities without persisting the changes to the database, silently producing zero effect; (2) `GetLedTeamsUseCase` reaches directly into infrastructure at the use-case layer, violating the Dependency Inversion Principle and bypassing the repository abstraction; and (3) the `__all__` list in `auth.py` is defined twice using `+= ` reassignment, which silently produces an undefined-behavior-class issue in some Python import contexts. Beyond these, there are several warnings around missing authorization, missing commits on repository write paths, inconsistent UTC usage, and a TOCTOU race on artifact updates.

---

## Critical Issues

### CR-01: Phase transition task moves never persist to the database

**File:** `Backend/app/application/use_cases/execute_phase_transition.py:187-198`

**Issue:** `_apply_task_moves` loops over `Task` Pydantic domain entities, mutates their `phase_id` and `sprint_id` fields, then calls `await self.session.flush()`. However, these are plain Pydantic objects — not SQLAlchemy ORM instances tracked by the session. The `flush()` has no tracked objects to send to the DB, so zero UPDATE statements are issued. The endpoint returns a non-zero `moved_count` but the database is not changed.

The correct approach is to update the SQLAlchemy `TaskModel` rows directly (bulk UPDATE or individual `setattr` on the ORM model), not the domain entity copies returned by `task_repo.list_by_project_and_phase`.

**Fix:**
```python
# In _apply_task_moves, replace the entity loop with a direct ORM bulk update:
from sqlalchemy import update as sa_update
from app.infrastructure.database.models.task import TaskModel

# Collect IDs by action
move_to_next_ids = []
move_to_backlog_ids = []
for t in tasks:
    eff_action = exc_map.get(t.id, action)
    if eff_action == "move_to_next":
        move_to_next_ids.append(t.id)
    elif eff_action == "move_to_backlog":
        move_to_backlog_ids.append(t.id)

if move_to_next_ids:
    await self.session.execute(
        sa_update(TaskModel)
        .where(TaskModel.id.in_(move_to_next_ids))
        .values(phase_id=target_phase_id)
    )
if move_to_backlog_ids:
    await self.session.execute(
        sa_update(TaskModel)
        .where(TaskModel.id.in_(move_to_backlog_ids))
        .values(phase_id=None, sprint_id=None)
    )
moved = len(move_to_next_ids) + len(move_to_backlog_ids)
await self.session.flush()
return moved
```

---

### CR-02: DIP violation — `GetLedTeamsUseCase` imports and queries infrastructure directly

**File:** `Backend/app/application/use_cases/manage_teams.py:83-89`

**Issue:** The use case imports `TeamProjectModel` (an SQLAlchemy ORM model from the infrastructure layer) and executes a raw SQLAlchemy `select()` through `self.team_repo.session`. This is a direct violation of the Dependency Inversion Principle: the Application layer must not depend on Infrastructure. It also bypasses the repository abstraction and leaks session access from the repository into the use case. If the team repository ever changes its underlying storage mechanism, this use case would break silently.

```python
# Current — violates DIP:
from app.infrastructure.database.models.team import TeamProjectModel
from sqlalchemy import select
stmt = select(TeamProjectModel.project_id).where(...)
result = await self.team_repo.session.execute(stmt)
```

**Fix:** Add a method to `ITeamRepository` (and its implementation) that encapsulates this query:

```python
# In app/domain/repositories/team_repository.py:
@abstractmethod
async def get_project_ids_for_teams(self, team_ids: List[int]) -> List[int]:
    """Return all project_ids linked to the given team_ids."""
    ...

# In manage_teams.py GetLedTeamsUseCase.execute():
project_ids = set(await self.team_repo.get_project_ids_for_teams([t.id for t in teams]))
```

---

### CR-03: `__all__` redefined with `+=` in `auth.py` — late imports may be excluded from `__all__`

**File:** `Backend/app/api/deps/auth.py:63` and `107`

**Issue:** `__all__` is declared at line 63, then extended at line 107 with `__all__ = __all__ + [...]` (typed `# type: ignore`). The `from app.api.deps.auth import *` in `app/api/deps/__init__.py` runs at module import time. Because the second `__all__` assignment occurs after the late imports at lines 69-72 (`IProjectRepository`, `ITeamRepository`, `get_project_repo`, `get_team_repo`), those late imports are not themselves in `__all__` but the newly added function `require_project_transition_authority` is. However the pattern of defining `__all__` twice and then combining is fragile: if a star-import is processed before the module finishes loading (e.g., circular import), the second `__all__` extension may not be visible. More critically, the late imports at lines 69-72 are module-level side effects that create a partial import state.

**Fix:** Consolidate all imports and the single `__all__` definition at the top of the module, eliminating the split-definition pattern:

```python
# Move all imports to the top, define __all__ once at the bottom:
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.team_repository import ITeamRepository
from app.api.deps.project import get_project_repo
from app.api.deps.team import get_team_repo

# ... all function definitions ...

__all__ = [
    "oauth2_scheme", "get_db", "get_current_user", "_is_admin",
    "require_admin", "require_project_transition_authority",
]
```

---

## Warnings

### WR-01: GET /users/{user_id}/summary has no self-or-admin authorization check

**File:** `Backend/app/api/v1/users.py:18-34`

**Issue:** Any authenticated user can query the summary for any `user_id`. The comment in the file acknowledges this: "Authorization: any authenticated user (T-09-09-02 accepted — admin/self use only; hardening deferred per SUMMARY.md)". The summary includes `recent_activity` (via audit log) and `project_count`, which are sensitive. The code comment says this is deliberately deferred, but there is no corresponding TODO/issue, making it easy to miss.

**Fix:** Add a guard before the use-case call:
```python
if current_user.id != user_id and not _is_admin(current_user):
    raise HTTPException(status_code=403, detail="Can only view your own summary")
```
Or at minimum add a `# TODO(SECURITY)` marker pointing to the tracked issue.

---

### WR-02: `milestone_repo.update` and `artifact_repo.update` flush but never commit — data may silently roll back

**File:** `Backend/app/infrastructure/database/repositories/milestone_repo.py:73-74`
**File:** `Backend/app/infrastructure/database/repositories/artifact_repo.py:79-81`

**Issue:** Both `update` methods call `await self.session.flush()` but not `await self.session.commit()`. In the FastAPI/SQLAlchemy async pattern used by this project (where the session is created per-request and commits are explicit), a `flush` without a `commit` means the changes are sent to the DB within the transaction but will be rolled back when the session is closed at end of request. This is inconsistent with `create` methods (which in milestone_repo delegate to `get_by_id` after flush, triggering another flush path) and `delete` methods (which also only flush).

The `phase_report_repo.update` has the same issue (line 78). Compare with `team_repo.update` which commits explicitly (line 140).

**Fix:** Add `await self.session.commit()` after `await self.session.flush()` in each `update` and `delete` method, consistent with how `team_repo` handles this. Alternatively, move commit responsibility to the use case and document it uniformly.

---

### WR-03: TOCTOU race on artifact assignee-only update — authorization check is not atomic

**File:** `Backend/app/application/use_cases/manage_artifacts.py:63-71`

**Issue:** `UpdateArtifactByAssigneeUseCase.execute` fetches the artifact in one query, checks `existing.assignee_id != user_id`, then updates it in a separate query. Between the check and the update, another concurrent request (e.g., a manager using `UpdateArtifactByManagerUseCase`) could change the `assignee_id`. In the worst case a user who was just removed as assignee can still complete their update window. This is a classic TOCTOU on a soft authorization check.

**Fix:** Add an atomic "check-and-update" using a conditional WHERE clause at the DB level:
```python
# In artifact_repo, add a method:
async def update_if_assignee(self, artifact_id: int, user_id: int, patch: dict) -> Optional[Artifact]:
    stmt = (
        select(ArtifactModel)
        .where(ArtifactModel.id == artifact_id)
        .where(ArtifactModel.assignee_id == user_id)
        .where(ArtifactModel.is_deleted == False)
    )
    # ... then apply patch only on the found row
```

---

### WR-04: `_authorize_transition` in milestones/artifacts/phase_reports directly instantiates `SqlAlchemyTeamRepository` — DIP violation in API layer

**File:** `Backend/app/api/v1/milestones.py:58-59`
**File:** `Backend/app/api/v1/artifacts.py:43-44`
**File:** `Backend/app/api/v1/phase_reports.py:50-51`

**Issue:** All three `_authorize_transition` helper functions import `SqlAlchemyTeamRepository` from infrastructure and instantiate it directly using `milestone_repo.session`. This bypasses the DI system: it accesses a private implementation detail (`.session`) of the repository, creates an additional repository object not tracked by FastAPI's dependency graph, and tightly couples the router to the infrastructure implementation. If the team repository is ever replaced or mocked in tests, this inline instantiation will not be substituted.

Additionally, `milestone_repo.session` may not exist on all possible `IMilestoneRepository` implementations (it is a concrete attribute of `SqlAlchemyMilestoneRepository`).

**Fix:** Use the existing `require_project_transition_authority` dependency for all three routers, passing `project_id` as a path parameter. For POST endpoints where `project_id` is in the request body, restructure the route to accept `project_id` as both a path param and body field, or use a custom dependency that reads the body early.

---

### WR-05: `process_config_normalizer.py` calls `project_repo.get_all()` — method not defined in `IProjectRepository`

**File:** `Backend/app/application/services/process_config_normalizer.py:18`

**Issue:** `migrate_all_projects_to_current_schema` calls `await project_repo.get_all()` with no arguments, but `IProjectRepository.get_all` (defined in `project_repository.py:22`) takes a required `manager_id: int` parameter. The call will raise `TypeError` at runtime. The repository implementation signature is `async def get_all(self, manager_id: int)`.

**Fix:** Either add a `get_all_projects()` abstract method to `IProjectRepository` (no manager filter, admin context), or pass a sentinel value. Given this is an admin script, adding a dedicated `list_all` method is cleaner:
```python
# In IProjectRepository:
@abstractmethod
async def list_all(self) -> List[Project]:
    """Admin: return all non-deleted projects regardless of manager."""
    pass
```

---

### WR-06: `idempotency_cache` module-level mutable dicts are shared across all workers — documented but creates silent correctness risk

**File:** `Backend/app/application/services/idempotency_cache.py:21-22`

**Issue:** `_cache` and `_last_request` are module-level dicts. In a multi-worker deployment (Gunicorn with multiple processes), these are per-process and not shared. A user whose first request hits worker A will pass the rate limit check on worker B immediately. The module docstring documents this, but this also means the idempotency guarantee (preventing duplicate phase transitions) is not reliable in production multi-worker deployments.

**Fix:** The code itself documents Redis as the solution (ADV-04). The immediate risk mitigation is to add a startup assertion or warning log when `WEB_CONCURRENCY > 1` is detected:
```python
import os
import warnings
if int(os.environ.get("WEB_CONCURRENCY", "1")) > 1:
    warnings.warn(
        "idempotency_cache is in-memory only and not shared across workers. "
        "Phase Gate idempotency is not guaranteed in multi-worker deployments.",
        stacklevel=2,
    )
```

---

### WR-07: `datetime.utcnow()` used inconsistently — naive vs. timezone-aware mismatch

**File:** `Backend/app/infrastructure/database/repositories/team_repo.py:97`
**File:** `Backend/app/infrastructure/database/repositories/project_repo.py:163`
**File:** `Backend/app/infrastructure/database/repositories/task_repo.py:267`
**File:** `Backend/app/infrastructure/database/repositories/milestone_repo.py:72, 83`
**File:** `Backend/app/infrastructure/database/repositories/artifact_repo.py:79, 90`
**File:** `Backend/app/infrastructure/database/repositories/phase_report_repo.py:77, 88`

**Issue:** All soft-delete and update paths use `datetime.utcnow()` which returns a timezone-naive datetime. The DB columns are declared `DateTime(timezone=True)` (timezone-aware). PostgreSQL will accept naive datetimes by treating them as UTC, but Python comparison against timezone-aware datetimes (e.g., those returned from the DB) will raise `TypeError: can't compare offset-naive and offset-aware datetimes`. Python 3.12 also emits a DeprecationWarning for `datetime.utcnow()`.

**Fix:** Replace with `datetime.now(UTC)`:
```python
from datetime import datetime, timezone
# Replace all:
#   datetime.utcnow()
# With:
#   datetime.now(timezone.utc)
```

---

### WR-08: `apply_process_template.py` uses `asyncio.sleep(1)` inside a per-project advisory lock retry loop — blocks the event loop

**File:** `Backend/app/application/use_cases/apply_process_template.py:65`

**Issue:** `await asyncio.sleep(1)` in an async context inside an event-loop-based server is acceptable for non-blocking wait, but the outer `for _ in range(5)` retry with 1-second sleep means a single `ApplyProcessTemplateUseCase` call with N projects and lock contention can block for up to `N * 5` seconds of wall time on the event loop. `pg_try_advisory_xact_lock` semantics mean the lock is released at transaction commit — if the competing transaction commits within the next 5s, the retry will succeed. However, the `asyncio.sleep` between retries does NOT release the current DB connection back to the pool; the session/connection is held open for the entire retry duration. Under load this will exhaust the connection pool.

**Fix:** Use `pg_advisory_xact_lock` (blocking form) with a statement timeout, or move the retry to the caller. If keeping the non-blocking retry, release and re-acquire the session per retry, or document that this endpoint must be called with a long connection timeout and is not safe for high-concurrency use.

---

### WR-09: `audit_repo.get_project_activity` filters on `entity_id = project_id` and `entity_type = "project"` — phase_transition events for tasks in that project are excluded

**File:** `Backend/app/infrastructure/database/repositories/audit_repo.py:120-121`

**Issue:** The activity feed hardcodes `entity_type == "project"` and `entity_id == project_id`. Phase-transition audit rows are correctly written with `entity_type="project"`, but task audit rows (`entity_type="task"`) are excluded. The API documentation (D-46) says the activity feed should show task state changes as well. This means task creation, task updates, and task column moves are invisible in the project activity feed.

**Fix:** Either expand the query to include task audit rows for tasks belonging to the project, or add a JOIN/subquery:
```python
# Option: include task events for tasks in this project
from app.infrastructure.database.models.task import TaskModel
# ... add OR condition:
conditions = [
    or_(
        and_(AuditLogModel.entity_type == "project", AuditLogModel.entity_id == project_id),
        and_(
            AuditLogModel.entity_type == "task",
            AuditLogModel.entity_id.in_(
                select(TaskModel.id).where(TaskModel.project_id == project_id)
            )
        )
    )
]
```
If the intent is genuinely project-level-only, the API contract should be updated to reflect this limitation.

---

## Info

### IN-01: `_to_http` in `phase_reports.py` drops the `reason` field from `ArchivedNodeReferenceError`

**File:** `Backend/app/api/v1/phase_reports.py:59-61`

**Issue:** The `_to_http` helper for phase_reports omits `e.reason` from the error detail:
```python
return HTTPException(400, detail={"error_code": "ARCHIVED_NODE_REF", "node_id": e.node_id})
```
The equivalent helpers in `milestones.py` and `artifacts.py` include `"reason": e.reason`. This inconsistency means callers get less debug information from the phase_reports endpoint.

**Fix:**
```python
return HTTPException(
    400,
    detail={"error_code": "ARCHIVED_NODE_REF", "node_id": e.node_id, "reason": e.reason},
)
```

---

### IN-02: `ArtifactCreateDTO` validator method named `v` — cryptic name, not self-documenting

**File:** `Backend/app/application/dtos/artifact_dtos.py:27-29` and `49-51`
**File:** `Backend/app/application/dtos/phase_report_dtos.py:31-34`
**File:** `Backend/app/application/dtos/phase_transition_dtos.py:23-26`

**Issue:** Multiple DTOs define their `@field_validator` methods as `v` or `v(cls, x)` — single-letter names. Pydantic requires the method name to be unique within a class and uses it only as a hook; the name has no functional impact. However this makes the code harder to read and search, and is inconsistent with the `validate_phase_id_format` naming used in entity validators.

**Fix:** Rename to descriptive names: `validate_linked_phase_id`, `validate_phase_id`, etc.

---

### IN-03: `manage_teams.py` imports `fastapi.HTTPException` in Application layer — layer boundary violation

**File:** `Backend/app/application/use_cases/manage_teams.py:6`

**Issue:** `from fastapi import HTTPException` is imported in the Application layer. The Application layer must not depend on web framework types. `AddTeamMemberUseCase` and `RemoveTeamMemberUseCase` raise `HTTPException` directly. This means the use cases are only usable in a FastAPI context and cannot be tested or reused without a FastAPI dependency.

**Fix:** Replace `HTTPException` raises with domain exceptions, and let the router translate them:
```python
# In manage_teams.py:
from app.domain.exceptions import DomainError  # or create TeamNotFoundError, etc.
raise DomainError("Team not found")  # instead of HTTPException(404, ...)
```

---

### IN-04: `phase_report_pdf.py` hardcodes Turkish text — not externalized for i18n

**File:** `Backend/app/application/services/phase_report_pdf.py:59-120`

**Issue:** Strings like `"Faz Degerlendirme Raporu"`, `"Proje:"`, `"Dongu:"`, `"Ozet Metrikler"`, `"Toplam Gorev"`, `"Tamamlanan"` are hardcoded in the rendering function with no i18n mechanism. The `_safe()` function already handles font-level encoding, but if the system is ever extended to support English PDFs (per `cycle_label_en` in ProcessTemplate), the strings need to be parameterized.

**Fix:** Extract strings into a locale dict or pass a `locale` parameter to `render_pdf`. At minimum, add a TODO comment pointing to the `cycle_label_en/tr` fields in ProcessTemplate as the planned internationalization source.

---

### IN-05: `apply_process_template.py` silently swallows all exceptions into the `failed` list

**File:** `Backend/app/application/use_cases/apply_process_template.py:91-92`

**Issue:** The broad `except Exception as e: failed.append(...)` catches every exception including programming errors (AttributeError, NameError, etc.) and wraps them into the `failed` list with only `str(e)`. This makes debugging failed template applications difficult in production — the true exception type is lost.

**Fix:** Log the exception at ERROR level before adding to failed list:
```python
import logging
logger = logging.getLogger(__name__)
except Exception as e:
    logger.exception("Template apply failed for project %s", pid)
    failed.append({"project_id": pid, "error": str(e)})
```

---

### IN-06: `task_repo.py` `_to_entity` constructs subtask entities with a hardcoded `status` field that does not exist on the `Task` entity

**File:** `Backend/app/infrastructure/database/repositories/task_repo.py:78-80`

**Issue:** When building subtask entities, the mapper sets `status=sub.column.name.lower().replace(" ", "-") if sub.column else "todo"`. However, the `Task` Pydantic entity has no `status` field — it has `column_id` and derives state from the column. The extra `status=` kwarg is passed to `Task(...)` which uses `model_config = ConfigDict(from_attributes=True)` without `extra="allow"`, so Pydantic will raise a `ValidationError` or silently ignore the field depending on Pydantic v2 default settings (which default to `extra="ignore"`). Either the field is being silently dropped (dead code) or it is causing a masked error.

**Fix:** Remove the `status=` argument from the subtask `Task(...)` construction since `Task` has no such field:
```python
sub_entity = Task(
    id=sub.id,
    title=sub.title,
    priority=sub.priority,
    project_id=sub.project_id,
    column=sub.column,
    assignee=sub.assignee,
    parent=None,
    subtasks=[]
)
```

---

_Reviewed: 2026-04-21T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
