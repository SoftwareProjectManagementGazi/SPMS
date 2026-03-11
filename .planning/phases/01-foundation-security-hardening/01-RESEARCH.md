# Phase 1: Foundation & Security Hardening - Research

**Researched:** 2026-03-11
**Domain:** FastAPI / SQLAlchemy / Next.js security hardening, data infrastructure, RBAC, Clean Architecture
**Confidence:** HIGH (all findings based on direct codebase inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**RBAC Enforcement (ARCH-10)**
- Membership check lives in a reusable FastAPI dependency function (`get_project_member`) — injected via `Depends()` per endpoint, consistent with the existing `Depends(get_current_user)` pattern
- Admin role bypasses the membership check — admins can access any project's tasks
- Non-members receive HTTP 403 Forbidden (not 404) — authenticated but unauthorized
- Membership check applies to all task operations including reads (GET) — non-members cannot see a project's tasks at all
- Rule: if user is a member of project X, they can access all of project X's tasks; if not a member, all access is blocked

**Startup Validation & Secrets (ARCH-07, ARCH-08)**
- App crashes at startup (startup event) if JWT_SECRET or DB_PASSWORD equal their known insecure defaults
- "Insecure" defined as: JWT_SECRET == `"supersecretkey"` OR DB_PASSWORD == `"secretpassword"` — reject the exact known default values
- SQLAlchemy `echo` controlled by existing `settings.DEBUG` env var (`echo=settings.DEBUG`) — one flag controls all debug output
- CORS allowed origins configured via `CORS_ORIGINS` environment variable (comma-separated), parsed from `.env` — flexible across dev/staging/prod environments

**Soft Delete (DATA-04)**
- Soft delete added to: Tasks, Projects, Users, Comments, Files, Labels, Sprints — all main tables except Notifications
- Notifications use hard delete (ephemeral, no recovery needed)
- Soft-deleted entities are hidden from all queries — filtered out at repository layer, not visible to any role
- Existing task–label associations remain intact when a label is soft-deleted (the label row still exists in DB with `is_deleted=true`; deleted labels just don't appear in the "available labels" picker)
- Implementation: add `is_deleted: bool = false` + `deleted_at: DateTime nullable` columns

**Audit Trail (DATA-02)**
- Granularity: field-level diff — audit log stores old_value/new_value per changed field
- Tables audited: Tasks and Projects only (the core accountability entities)
- Logic lives in repository layer — repo reads current entity before update, diffs fields, writes to `audit_log` table. Use cases stay clean.
- Audit log schema: `entity_type`, `entity_id`, `field_name`, `old_value`, `new_value`, `user_id`, `action` (created/updated/deleted), `timestamp`

**Data Infrastructure (DATA-01, DATA-03, DATA-05)**
- Versioning (DATA-01): add `version: int` + `updated_at` fields — applied via shared `TimestampedMixin` on all main tables
- Recurring task schema (DATA-03): schema-only in Phase 1 — add `recurrence_interval`, `recurrence_end_date`, `recurrence_count` columns to tasks table. No endpoint or business logic wired until Phase 3.
- Indexes (DATA-05): add indexes on `tasks.project_id`, `tasks.assignee_id`, `tasks.parent_task_id`, `projects.manager_id`

**Dashboard & API Wiring (ARCH-09, ARCH-03)**
- Settings page: wire to real user profile data via `GET /auth/me` — replace mock profile fields with live data
- Task Activity feed: wire to audit log table (available once audit trail is implemented in this phase)
- Dashboard — Member view: show personal sprint board; fall back to "my assigned tasks + status" if sprint board not yet built
- Dashboard — Manager view: show project list + task counts. Full team stats (performance metrics, sprint progress) are deferred to Phase 6 — only lay the data infrastructure groundwork here
- Project manager DTO (ARCH-03): add nested manager fields (`manager_id`, `manager_name`, `manager_avatar`) to `ProjectResponseDTO` — one API call, no separate `/users/{id}` fetch from frontend. Follows existing pattern (task DTO already embeds assignee data).

**Error Codes & Architecture Cleanup (SEC-02, ARCH-01 through ARCH-06)**
- All endpoints return standard HTTP codes: 400, 401, 403, 404, 500 — no custom non-standard codes
- `UserListDTO` moved from `auth.py` router to `application/dtos/auth_dtos.py` (ARCH-02)
- Duplicate service methods merged: `taskService.getByProjectId` / `getTasksByProject` → single method; `create` / `createTask` → single method (ARCH-01)
- `project_repo.update()` refactored from hardcoded field list to dynamic DTO-based field mapping (ARCH-06)
- Double round-trip eliminated: `task_repo.create` returns the full entity directly; no follow-up `get_by_id` call (ARCH-04, ARCH-05)

**Session Timeout (SAFE-02)**
- No proactive countdown or auto-refresh
- When JWT expires, next API request returns 401; frontend intercepts and redirects to login with a "Session expired" message
- Simple, matches current architecture (no refresh token endpoint in scope)

### Claude's Discretion
- Exact `audit_log` table DDL and migration tooling approach (Alembic vs raw SQL)
- SAFE-03 log monitoring infrastructure design (structure of integration hook)
- Exact error message text for startup validation failure
- Which specific dashboard stats are surfaced in Manager view Phase 1 baseline (beyond project list + task counts)

### Deferred Ideas (OUT OF SCOPE)
- Full Manager dashboard stats (team performance metrics, sprint velocity, burndown charts) — Phase 6 (Reporting & Analytics)
- Sprint board full implementation for Member view — Phase 3 (Project & Task Completion)
- Task Activity feed advanced filtering and pagination — Phase 3
- HttpOnly cookie JWT storage (XSS risk mitigation) — noted in PROJECT.md as v2 revisit item
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ARCH-01 | Merge duplicate task service methods (`getByProjectId`/`getTasksByProject`, `create`/`createTask`) | Confirmed duplication exists in `manage_tasks.py` — `ListProjectTasksUseCase` and `GetTaskUseCase` call different repo methods; mapper function `map_task_to_response_dto` already extracted and can be reused |
| ARCH-02 | Move `UserListDTO` from `auth.py` router to `application/dtos/auth_dtos.py` | Confirmed: `UserListDTO` defined twice — once in `auth.py` (inline class) and once already in `auth_dtos.py` (lines 32-35). The router class shadows the DTO file class. Solution: remove inline class from `auth.py`, import from `auth_dtos.py` |
| ARCH-03 | Replace placeholder "Project Manager" object in `project-service.ts` with nested manager DTO | Confirmed: `mapProjectResponseToProject()` in `project-service.ts` creates a `placeholderLead` hardcoded to "Project Manager". Need `manager_name` and `manager_avatar` added to `ProjectResponseDTO` and corresponding manager joinedload in `project_repo` |
| ARCH-04 | Eliminate `task_repo.create` → use case → `get_by_id` double round-trip | Confirmed: `task_repo.create()` calls `get_by_id(model.id)` internally (line 128). `CreateTaskUseCase.execute()` then calls `get_by_id` again (line 120). Two round-trips for one create. Fix: `task_repo.create()` should load relationships itself and return the full entity |
| ARCH-05 | Eliminate `task_repo.update` → use case → `get_by_id` double round-trip | Confirmed: `task_repo.update()` calls `get_by_id(task_id)` at end (line 162). `UpdateTaskUseCase.execute()` calls `get_by_id` again after (line 179). Fix: use case should trust the full entity returned by `task_repo.update()` |
| ARCH-06 | Refactor `project_repo.update()` from hardcoded field list to dynamic DTO-based mapping | Confirmed: `project_repo.update()` hardcodes `model.name = project.name`, `model.description = ...`, etc. (lines 107–112). Should use `ProjectUpdateDTO.model_dump(exclude_unset=True)` and iterate |
| ARCH-07 | Control SQLAlchemy `echo=True` via `settings.DEBUG` | Confirmed: `database.py` line 6 has `echo=True` hardcoded. `Settings` class has no `DEBUG` field. Need to add `DEBUG: bool = False` to `Settings` and wire `echo=settings.DEBUG` |
| ARCH-08 | Remove hardcoded JWT/DB defaults; crash on startup if insecure values detected | Confirmed: `config.py` has `JWT_SECRET: str = "supersecretkey"` and `DB_PASSWORD: str = "secretpassword"`. Need FastAPI lifespan startup validator |
| ARCH-09 | Wire Dashboard, Settings page, and Task Activity to real API | Confirmed: `settings/page.tsx` imports from `@/lib/mock-data`. `manager-view.tsx` imports `projects, parentTasks` from `@/lib/mock-data`. `member-view.tsx` imports `activities` from mock-data for the activity feed. MemberView task list already uses `taskService.getMyTasks` (live). |
| ARCH-10 | Add project membership check to all task endpoints; block non-members with 403 | Confirmed: `tasks.py` router has 6 endpoints — all use `get_current_user` but none check project membership. `project_repo` already has `get_by_id_and_user()` that checks membership. Need new `get_project_member` dependency |
| DATA-01 | Add `version: int` and `updated_at` fields to all main tables via shared `TimestampedMixin` | Confirmed: `base.py` only has `declarative_base()`. `TaskModel` already has `updated_at` but not `version`. `ProjectModel` has no `updated_at` or `version`. Need `TimestampedMixin` in `base.py` applied to all main models |
| DATA-02 | Add field-level audit trail for Tasks and Projects | Confirmed: `LogModel` exists but uses `action + changes(JSON)` structure. Need separate `audit_log` table with `entity_type`, `entity_id`, `field_name`, `old_value`, `new_value`, `user_id`, `action`, `timestamp`. Write diff logic in `task_repo.update()` and `project_repo.update()` |
| DATA-03 | Add recurring task schema columns to tasks table (schema-only) | Confirmed: `TaskModel` has `is_recurring: bool` but lacks `recurrence_interval`, `recurrence_end_date`, `recurrence_count`. Schema-only addition, no business logic |
| DATA-04 | Add soft delete (`is_deleted`, `deleted_at`) to all main tables except Notifications | Confirmed: no model has `is_deleted` or `deleted_at`. Need to add to: Tasks, Projects, Users, Comments, Files, Labels, Sprints. All repo `get_*` queries must filter `is_deleted == False`. Delete methods must set `is_deleted=True` instead of hard-deleting |
| DATA-05 | Add DB indexes on `tasks.project_id`, `tasks.assignee_id`, `tasks.parent_task_id`, `projects.manager_id` | Confirmed: `TaskModel.project_id` and `assignee_id` have no explicit `index=True`. `parent_task_id` has no index. `ProjectModel.manager_id` has no index. Note: `id` fields have `index=True` already |
| SEC-02 | All endpoints return standard HTTP error codes (400, 401, 403, 404, 500) | Confirmed: Most endpoints already map exceptions to standard codes. RBAC 403 gap is the main missing piece (ARCH-10). Delete endpoints need review to ensure 404 on missing resource |
| SEC-03 | Strict CORS — only allowlisted origins accepted | Confirmed: `main.py` hardcodes `["http://localhost:3000", "http://127.0.0.1:3000"]`. Must move to `CORS_ORIGINS` env var, parsed from comma-separated string in `Settings` |
| SAFE-02 | Session timeout: JWT expiry → 401 → frontend redirects to login with "Session expired" message | Confirmed: backend already returns 401 on expired JWT. Frontend `api-client.ts` (or similar) needs to intercept 401 and show "Session expired" before redirecting to login |
| SAFE-03 | Log monitoring infrastructure hook (integration-ready structure) | No existing structured logging infrastructure found. Need a logging utility/middleware that emits structured log events, designed for future integration with monitoring tools (Sentry, Datadog, etc.) |
</phase_requirements>

---

## Summary

This phase is purely corrective and infrastructural — no new user-facing features. The work falls into five clusters: (1) critical security fixes (RBAC enforcement, startup secret validation, CORS hardening), (2) architecture cleanup (duplicate method removal, double round-trips, DTO migration, dynamic field mapping), (3) data infrastructure additions (soft delete, versioning mixin, audit log, recurring task schema, indexes), (4) frontend wiring to replace mock data, and (5) session expiry handling.

The codebase follows Clean Architecture strictly: Domain entities → Application use cases/DTOs → Infrastructure repositories → API routers. All fixes must respect these layer boundaries. The existing `Depends(get_current_user)` pattern in `dependencies.py` is the template for the new `get_project_member` dependency. The `TimestampedMixin` pattern from SQLAlchemy declarative base is the right approach for shared columns across models.

No migration framework (Alembic) is currently configured. The project uses `Base.metadata.create_all` for test setup and `init.sql` for initial schema. For Phase 1 schema changes, the recommended approach is to update SQLAlchemy models (which drives test DB creation) and maintain `init.sql` in sync — or introduce Alembic (Claude's discretion). Given the number of schema changes (soft delete on 7 tables, versioning mixin, audit_log table, 4 new task columns, 4 new indexes), Alembic is strongly recommended.

**Primary recommendation:** Implement changes in dependency order: TimestampedMixin first (everything else builds on it), then soft delete, then audit log, then RBAC, then startup validation, then CORS env var, then architecture cleanup, then frontend wiring last.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | Already installed | Web framework, dependency injection | Project's existing framework |
| SQLAlchemy (async) | Already installed | ORM with async support | Project's existing ORM |
| Pydantic v2 / pydantic-settings | Already installed | Settings, DTOs, validation | Project's existing validation layer |
| python-jose | Already installed | JWT encode/decode | Project's existing JWT library |
| pytest + pytest-asyncio | Already installed | Test framework | Project's existing test setup |
| httpx | Already installed | Async HTTP client for integration tests | Project's existing test client |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Alembic | 1.x (new addition) | Database migrations | Managing schema changes (adding columns, tables, indexes) without dropping/recreating |
| logging (stdlib) | Built-in | Structured log emission for SAFE-03 | Structured JSON logging to stdout for monitoring hook |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Alembic migrations | Updating init.sql + `create_all` | init.sql approach loses migration history and can't safely run on existing DBs; Alembic is standard practice |
| stdlib logging | structlog | structlog provides better JSON output but is an extra dependency; stdlib is sufficient for Phase 1 monitoring hook |

**Installation (if Alembic chosen):**
```bash
pip install alembic
cd Backend
alembic init alembic
```

---

## Architecture Patterns

### Recommended Project Structure (additions)

```
Backend/app/
├── api/
│   ├── dependencies.py          # ADD: get_project_member() dependency
│   ├── main.py                  # MODIFY: CORS from env, startup validator, logging middleware
│   └── v1/
│       └── tasks.py             # MODIFY: inject get_project_member on all 6 endpoints
├── application/
│   └── dtos/
│       └── auth_dtos.py         # MODIFY: ensure UserListDTO is canonical here (ARCH-02)
│       └── project_dtos.py      # MODIFY: add manager_name, manager_avatar to ProjectResponseDTO
├── domain/
│   └── repositories/
│       └── audit_repository.py  # NEW: IAuditRepository interface
├── infrastructure/
│   ├── config.py                # MODIFY: add DEBUG, CORS_ORIGINS; add startup validator
│   └── database/
│       ├── models/
│       │   ├── base.py          # MODIFY: add TimestampedMixin
│       │   ├── task.py          # MODIFY: soft delete, version, recurrence columns
│       │   ├── project.py       # MODIFY: soft delete, updated_at, version
│       │   ├── user.py          # MODIFY: soft delete columns
│       │   ├── comment.py       # MODIFY: soft delete columns
│       │   ├── file.py          # MODIFY: soft delete columns
│       │   ├── label.py         # MODIFY: soft delete columns
│       │   └── sprint.py        # MODIFY: soft delete columns
│       ├── repositories/
│       │   ├── task_repo.py     # MODIFY: audit diff in update(), soft delete, fix round-trips
│       │   ├── project_repo.py  # MODIFY: audit diff in update(), soft delete, dynamic update, manager joinedload
│       │   ├── user_repo.py     # MODIFY: soft delete filter
│       │   └── audit_repo.py    # NEW: SqlAlchemyAuditRepository
│       └── models/
│           └── audit_log.py     # NEW: AuditLogModel
Frontend/
├── services/
│   └── project-service.ts       # MODIFY: consume manager_name/manager_avatar from DTO
├── app/
│   ├── settings/page.tsx        # MODIFY: replace mock-data import with authService.getCurrentUser()
│   └── page.tsx                 # already uses authService (no change needed)
├── components/dashboard/
│   ├── manager-view.tsx         # MODIFY: replace mock-data with projectService.getAll()
│   └── member-view.tsx          # MODIFY: replace mock activities with audit log API call
└── lib/
    └── api-client.ts            # MODIFY: intercept 401 for session expiry redirect (SAFE-02)
```

### Pattern 1: FastAPI Dependency for RBAC (ARCH-10)

**What:** A `get_project_member` dependency function that verifies the current user is a member of the target project before the endpoint handler executes.

**When to use:** All 6 task endpoints in `tasks.py`. The dependency receives `project_id` from the path parameter and `current_user` from the existing `get_current_user` dependency.

**Example:**
```python
# In app/api/dependencies.py
async def get_project_member(
    project_id: int,
    current_user: User = Depends(get_current_user),
    project_repo: IProjectRepository = Depends(get_project_repo),
) -> User:
    # Admin bypass — admins can access any project
    if current_user.role and current_user.role.name.lower() == "admin":
        return current_user

    project = await project_repo.get_by_id_and_user(project_id, current_user.id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this project")
    return current_user
```

**Endpoint injection (tasks.py):**
```python
@router.get("/project/{project_id}", response_model=List[TaskResponseDTO])
async def list_project_tasks(
    project_id: int,
    task_repo: ITaskRepository = Depends(get_task_repo),
    current_user: User = Depends(get_project_member),  # replaces get_current_user
):
    ...
```

Note: The `get_task` (`GET /{task_id}`), `update_task`, and `delete_task` endpoints need the project_id resolved from the task first, or the dependency must accept an optional `project_id` with a fallback lookup. The cleanest approach: for task-level endpoints without `project_id` in path, resolve project_id from the existing task inside the use case, or add a pre-check inside the use case.

### Pattern 2: TimestampedMixin for Shared Columns (DATA-01, DATA-04)

**What:** A SQLAlchemy mixin added to `base.py` that provides `version`, `updated_at`, `is_deleted`, `deleted_at` to all main models via multiple inheritance.

**When to use:** All models except `NotificationModel` (hard delete) and association tables (`project_members`, `task_labels`).

**Example:**
```python
# In app/infrastructure/database/models/base.py
from sqlalchemy import Column, Integer, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class TimestampedMixin:
    version = Column(Integer, default=1, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
```

**Applied to models:**
```python
class TaskModel(TimestampedMixin, Base):  # mixin before Base
    __tablename__ = "tasks"
    ...
```

Note: `TaskModel` already has `updated_at` — the mixin replaces the existing column definition.

### Pattern 3: Audit Log Write in Repository Layer (DATA-02)

**What:** Before executing an update, the repository reads the current state, diffs changed fields against the DTO, and writes one row per changed field to `audit_log`.

**When to use:** `task_repo.update()` and `project_repo.update()`.

**Example pattern:**
```python
# In task_repo.update()
async def update(self, task_id: int, update_data: Dict[str, Any], user_id: int) -> Task:
    # 1. Fetch current state
    stmt = self._get_base_query().where(TaskModel.id == task_id)
    result = await self.session.execute(stmt)
    model = result.unique().scalar_one_or_none()
    if not model:
        raise Exception(f"Task {task_id} not found")

    # 2. Diff and write audit entries
    audit_entries = []
    for field, new_value in update_data.items():
        old_value = getattr(model, field, None)
        if old_value != new_value:
            audit_entries.append(AuditLogModel(
                entity_type="task",
                entity_id=task_id,
                field_name=field,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(new_value) if new_value is not None else None,
                user_id=user_id,
                action="updated",
            ))

    # 3. Apply update
    for key, value in update_data.items():
        if hasattr(model, key):
            setattr(model, key, value)
    model.version = (model.version or 0) + 1

    # 4. Persist
    self.session.add_all(audit_entries)
    await self.session.flush()
    await self.session.commit()
    return await self.get_by_id(task_id)
```

### Pattern 4: Startup Validator (ARCH-08)

**What:** Validation logic in the FastAPI lifespan function that crashes the application if insecure default secrets are detected.

**Example:**
```python
# In app/api/main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate secrets before any other startup logic
    if settings.JWT_SECRET == "supersecretkey":
        raise RuntimeError("STARTUP FAILED: JWT_SECRET is set to the insecure default value. Set a secure value in .env")
    if settings.DB_PASSWORD == "secretpassword":
        raise RuntimeError("STARTUP FAILED: DB_PASSWORD is set to the insecure default value. Set a secure value in .env")

    # Existing: seed data
    async with AsyncSessionLocal() as session:
        await seed_data(session)
    yield
```

### Pattern 5: Soft Delete Filter in Repository (DATA-04)

**What:** All `get_*` queries must filter `is_deleted == False`. Delete operations set `is_deleted=True` and `deleted_at=func.now()` instead of issuing a SQL DELETE.

**Example:**
```python
# In task_repo.py — modify _get_base_query
def _get_base_query(self):
    return select(TaskModel).where(TaskModel.is_deleted == False).options(...)

# Soft delete operation
async def delete(self, task_id: int) -> bool:
    stmt = select(TaskModel).where(TaskModel.id == task_id, TaskModel.is_deleted == False)
    result = await self.session.execute(stmt)
    model = result.scalar_one_or_none()
    if model:
        model.is_deleted = True
        model.deleted_at = func.now()
        await self.session.commit()
        return True
    return False
```

### Anti-Patterns to Avoid

- **Putting audit logic in use cases:** Keep use cases clean. Audit writes belong in the repository layer as a cross-cutting concern on update operations.
- **Adding `is_deleted` filter at the API layer:** Filter at the repository/query level so all callers (use cases, tests) automatically get the correct behavior.
- **Creating a new `get_project_member` that re-implements membership logic:** Reuse the existing `project_repo.get_by_id_and_user()` which already performs the manager_id OR members check.
- **Adding `CORS_ORIGINS` parsing logic inside the router file:** Parse and validate in `Settings` (infrastructure config layer); `main.py` reads `settings.cors_origins_list`.
- **Calling `get_by_id` after `update` in both the repo AND the use case:** Consolidate — the repo's `update` method should be the single place the full entity is fetched and returned.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DB schema migrations | Raw ALTER TABLE scripts | Alembic | Alembic tracks migration history, handles rollback, generates migration scripts from model diffs — critical when multiple Phase 1 schema changes land on an existing DB |
| JWT validation | Custom token parsing | `python-jose` (already in use) | Already handles algorithm validation, expiry, signature verification |
| Pydantic settings parsing | Custom env var reader | `pydantic-settings` `BaseSettings` (already in use) | Already handles `.env` file loading, type coercion, validation |
| CORS header handling | Manual middleware | FastAPI `CORSMiddleware` (already in use) | Handles preflight OPTIONS, wildcard vs. specific origins, credentials |
| Password hashing | Custom hash function | `passlib[bcrypt]` (already in use) | bcrypt with work factor, salting already handled |

**Key insight:** The project's existing stack handles all standard security and data access concerns correctly. Phase 1 is about configuring and connecting existing tools, not building new infrastructure from scratch.

---

## Common Pitfalls

### Pitfall 1: task_id Endpoints Without project_id in Path

**What goes wrong:** `GET /tasks/{task_id}`, `PUT /tasks/{task_id}`, `DELETE /tasks/{task_id}` don't have `project_id` as a path parameter. Injecting `get_project_member(project_id)` directly doesn't work.

**Why it happens:** The RBAC dependency was designed around the project-scoped list endpoint. Single-task endpoints are identified by task ID alone.

**How to avoid:** For task-level endpoints, resolve the project from the task inside the use case (or a pre-check before the use case runs). The membership check for these endpoints can be: fetch the task → check that `task.project_id` is in a project the user is a member of. This can be done as a helper function or by passing `current_user` to the use cases and performing the check there.

**Warning signs:** Dependency injection error on startup if you try to inject `get_project_member` on a route without `project_id` in the path.

### Pitfall 2: SQLAlchemy Async + `onupdate` for `is_deleted` Timestamp

**What goes wrong:** SQLite (used in some tests) doesn't support `server_default=func.now()` the same way as PostgreSQL. Setting `deleted_at` using `onupdate=func.now()` won't fire on a soft-delete (we're not calling `.update()` in the SQL sense; we're setting attributes).

**Why it happens:** `onupdate` only fires when SQLAlchemy emits an UPDATE statement via the ORM's change tracking for the `updated_at` column on record change. For `deleted_at`, we must set it manually: `model.deleted_at = datetime.utcnow()`.

**How to avoid:** Set `deleted_at` explicitly in Python code during soft delete, not via `server_default` or `onupdate`.

### Pitfall 3: version Increment Conflicts

**What goes wrong:** If `version` is incremented in Python (e.g., `model.version += 1`) and two concurrent requests update the same record, one will silently overwrite the other's version.

**Why it happens:** Phase 1 versioning is a schema foundation, not optimistic locking enforcement. The version column is additive for now.

**How to avoid:** In Phase 1, increment version in the repository update method. Document that full optimistic concurrency locking is a Phase 3+ concern. Don't expose `version` to client-facing DTOs unless required by the requirements (it's not in Phase 1 success criteria).

### Pitfall 4: `project_repo.get_by_id_and_user` Doesn't Check Admin

**What goes wrong:** The existing `get_by_id_and_user` checks `manager_id == user_id OR members.any(user_id)`. An admin user who is neither manager nor member will get `None` returned, causing the new `get_project_member` dependency to incorrectly return 403 for admins.

**Why it happens:** Admin bypass is a locked decision (CONTEXT.md), but `get_by_id_and_user` doesn't implement it.

**How to avoid:** The `get_project_member` dependency must check the user's role BEFORE calling `get_by_id_and_user`. If `current_user.role.name.lower() == "admin"`, return immediately without the membership check.

### Pitfall 5: CORS_ORIGINS Parsing Edge Cases

**What goes wrong:** Comma-separated `CORS_ORIGINS` env var may include spaces (`"http://localhost:3000, http://staging.example.com"`) or be empty.

**Why it happens:** Environment variable formatting varies by operator.

**How to avoid:** Parse in `Settings` using a `@validator` or `@field_validator` that strips whitespace and filters empty strings:
```python
@property
def cors_origins_list(self) -> list[str]:
    return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
```
Fall back to `["http://localhost:3000"]` in development if the env var is absent.

### Pitfall 6: Existing Test Uses `status_id` Field That Doesn't Exist

**What goes wrong:** `test_auth_rbac.py` creates `Task(... status_id=1)` but the `Task` entity and `TaskModel` have no `status_id` field — status is derived from `column_id` and the board column's name.

**Why it happens:** The test was written against a different schema design and never updated.

**How to avoid:** Fix the test during this phase — replace `status_id=1` with a valid approach (either omit it, or create a board column and use `column_id`). This is noted in STATE.md as a known broken test.

### Pitfall 7: Audit Log Needs user_id but Update Use Case Doesn't Always Have It

**What goes wrong:** The audit log requires `user_id`. Currently `task_repo.update()` takes `(task_id, update_data: Dict)` — no user_id. The use case has the user_id (from `current_user.id`) but doesn't pass it to the repo.

**Why it happens:** The repo was designed before audit was a requirement.

**How to avoid:** Add `user_id: int` parameter to `task_repo.update()` and `project_repo.update()` signatures. Update all callers (use cases) to pass the current user's ID.

---

## Code Examples

### AuditLogModel (new table)

```python
# Source: direct design based on CONTEXT.md audit schema spec
# app/infrastructure/database/models/audit_log.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base

class AuditLogModel(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)       # "task" or "project"
    entity_id = Column(Integer, nullable=False, index=True)
    field_name = Column(String(100), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(50), nullable=False)            # "created", "updated", "deleted"
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("UserModel", backref="audit_logs")
```

### Settings with CORS and DEBUG (ARCH-07, ARCH-08, SEC-03)

```python
# app/infrastructure/config.py
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    DB_USER: str = "admin"
    DB_PASSWORD: str = "secretpassword"
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "spms_db"

    JWT_SECRET: str = "supersecretkey"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    DEBUG: bool = False
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
```

### Frontend Settings Page — Replace Mock Data (ARCH-09)

The settings page currently does:
```typescript
import { currentUser } from "@/lib/mock-data"
```
Replace with:
```typescript
// Use authService.getCurrentUser() (already used in app/page.tsx)
// Pattern already established — settings/page.tsx just needs the same pattern
const [user, setUser] = React.useState(null)
React.useEffect(() => {
  authService.getCurrentUser().then(setUser)
}, [])
```

### Frontend Manager Dashboard — Replace Mock Data (ARCH-09)

`manager-view.tsx` currently imports from `mock-data`. Replace with `projectService.getAll()` using React Query (the same pattern already used in `projects/page.tsx` with `useProjects()`). A new `useProjects` hook or direct `useQuery` call suffices.

### 401 Intercept for Session Expiry (SAFE-02)

In the API client (`Frontend/lib/api-client.ts` or equivalent), add a response interceptor:
```typescript
// On 401 response:
if (response.status === 401) {
  // Store "session expired" flag
  localStorage.setItem("session_expired", "true")
  window.location.href = "/login"
}
// On login page render, check flag and show message
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded CORS origins in `main.py` | `CORS_ORIGINS` env var parsed at startup | This phase | Enables per-environment configuration without code changes |
| `echo=True` hardcoded | `echo=settings.DEBUG` | This phase | Prevents query log spam in production |
| Inline `UserListDTO` in router | Canonical DTO in `auth_dtos.py` | This phase | Clean Architecture layer boundary respected |
| Hard delete for all entities | Soft delete on all main entities | This phase | Enables recovery and audit; permanent delete reserved for admin |
| No RBAC on task endpoints | Project membership enforced via `Depends(get_project_member)` | This phase | Closes critical authorization vulnerability |

**Deprecated/outdated:**
- `LogModel` (the existing `logs` table): The existing `LogModel` uses a different schema (`project_id`, `changes: JSON`). The new `audit_log` table specified in CONTEXT.md has a different, more granular schema. These two can coexist in Phase 1 — the new `audit_log` table is additive. The existing `LogModel` may be retired in a later phase or repurposed for system-level logs.

---

## Open Questions

1. **Alembic vs manual migration for Phase 1 schema changes**
   - What we know: No Alembic is configured. Schema is managed via `init.sql` and `create_all`. There are ~15+ schema changes in this phase (new columns across 7 tables, 1 new table, 4 indexes).
   - What's unclear: Whether the target deployment environment has an existing database with data that would be affected.
   - Recommendation: Introduce Alembic now. The volume of changes makes manual SQL fragile. Create initial migration from current `init.sql` state, then add a Phase 1 migration.

2. **task-level endpoints (GET/PUT/DELETE /{task_id}) and project membership check**
   - What we know: These endpoints have no `project_id` in path. The `get_project_member` dependency needs `project_id`.
   - What's unclear: Whether to resolve project_id from the task inside a separate pre-check dependency, or enforce membership inside the use case.
   - Recommendation: Add a `get_task_project_member` dependency variant that fetches the task first, extracts `project_id`, then calls `get_by_id_and_user`. Or enforce inside use cases for non-list endpoints.

3. **Audit log endpoint for Task Activity feed**
   - What we know: The CONTEXT.md says to wire the Task Activity feed to the audit log table once implemented.
   - What's unclear: Whether a new `GET /api/v1/tasks/{task_id}/activity` endpoint is needed, or if a generic `GET /api/v1/audit?entity_type=task&entity_id=X` is better.
   - Recommendation: Add a task-scoped activity endpoint `GET /api/v1/tasks/{task_id}/activity` for Phase 1 simplicity. Generic audit endpoint is Phase 3+ scope.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest + pytest-asyncio |
| Config file | `Backend/pytest.ini` (exists) |
| Quick run command | `cd Backend && python -m pytest tests/unit -x -q` |
| Full suite command | `cd Backend && python -m pytest tests/ -x` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-10 | Non-member gets 403 on any task endpoint for a project they don't belong to | integration | `pytest tests/integration/api/test_auth_rbac.py -x` | Partial (test exists but uses `status_id=1` which is broken — needs fix in Wave 0) |
| ARCH-10 | Admin can access any project's tasks regardless of membership | integration | `pytest tests/integration/api/test_rbac_tasks.py -x` | No — Wave 0 |
| ARCH-08 | App refuses to start when JWT_SECRET equals default value | unit | `pytest tests/unit/test_startup_validation.py -x` | No — Wave 0 |
| ARCH-07 | SQLAlchemy echo is False when DEBUG=False | unit | `pytest tests/unit/test_config.py -x` | No — Wave 0 |
| DATA-04 | Soft-deleted tasks do not appear in list queries | unit | `pytest tests/unit/infrastructure/test_task_repo_soft_delete.py -x` | No — Wave 0 |
| DATA-02 | Updating a task's title writes an audit_log row with old/new value | integration | `pytest tests/integration/infrastructure/test_audit_log.py -x` | No — Wave 0 |
| DATA-05 | DB indexes exist on task and project columns | integration | `pytest tests/integration/infrastructure/test_indexes.py -x` | No — Wave 0 |
| SAFE-02 | Frontend redirects to login with "Session expired" on 401 | manual | N/A — frontend behavior | manual only |
| SEC-03 | CORS rejects requests from non-allowlisted origins | integration | `pytest tests/integration/api/test_cors.py -x` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `cd Backend && python -m pytest tests/unit -x -q`
- **Per wave merge:** `cd Backend && python -m pytest tests/ -x`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/integration/api/test_rbac_tasks.py` — covers ARCH-10 admin bypass and per-endpoint 403 checks
- [ ] `tests/unit/test_startup_validation.py` — covers ARCH-08 startup crash on insecure defaults
- [ ] `tests/unit/test_config.py` — covers ARCH-07 DEBUG flag controlling echo
- [ ] `tests/unit/infrastructure/test_task_repo_soft_delete.py` — covers DATA-04 filter behavior
- [ ] `tests/integration/infrastructure/test_audit_log.py` — covers DATA-02 field-level diff writes
- [ ] `tests/integration/infrastructure/test_indexes.py` — covers DATA-05 index existence
- [ ] `tests/integration/api/test_cors.py` — covers SEC-03 CORS rejection
- [ ] Fix existing broken test: `tests/integration/api/test_auth_rbac.py` — remove `status_id=1` (field doesn't exist)

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — all findings based on reading actual source files
  - `Backend/app/api/dependencies.py` — existing `get_current_user` pattern
  - `Backend/app/api/main.py` — hardcoded CORS, lifespan pattern
  - `Backend/app/infrastructure/config.py` — insecure defaults confirmed
  - `Backend/app/infrastructure/database/database.py` — `echo=True` confirmed
  - `Backend/app/infrastructure/database/models/base.py` — plain `declarative_base()` confirmed, no mixin
  - `Backend/app/infrastructure/database/models/task.py` — missing columns confirmed
  - `Backend/app/infrastructure/database/models/project.py` — missing columns confirmed
  - `Backend/app/infrastructure/database/repositories/task_repo.py` — double round-trip confirmed
  - `Backend/app/infrastructure/database/repositories/project_repo.py` — hardcoded field update confirmed
  - `Backend/app/application/use_cases/manage_tasks.py` — duplicate round-trip confirmed
  - `Backend/app/api/v1/auth.py` — inline UserListDTO confirmed (ARCH-02)
  - `Backend/app/api/v1/tasks.py` — no membership check confirmed (ARCH-10)
  - `Frontend/services/project-service.ts` — placeholder manager confirmed (ARCH-03)
  - `Frontend/app/settings/page.tsx` — mock-data import confirmed (ARCH-09)
  - `Frontend/components/dashboard/manager-view.tsx` — mock-data confirmed
  - `Frontend/components/dashboard/member-view.tsx` — activities from mock-data confirmed
  - `Backend/tests/integration/api/test_auth_rbac.py` — broken `status_id=1` confirmed
  - `Backend/pytest.ini` — test framework configuration confirmed

### Secondary (MEDIUM confidence)
- SQLAlchemy async documentation patterns (mixin pattern, `onupdate` behavior) — based on training knowledge, well-established patterns
- FastAPI `Depends()` patterns for RBAC — based on training knowledge and project's own existing pattern

### Tertiary (LOW confidence)
- Alembic recommendation — based on best practice judgment; project has no existing Alembic setup to confirm compatibility with current async SQLAlchemy engine configuration

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — project stack inspected directly from requirements.txt and source files
- Architecture: HIGH — all patterns derived from existing codebase, not assumptions
- Pitfalls: HIGH — each pitfall traced to specific code locations and confirmed by reading source
- Test infrastructure: HIGH — pytest.ini, conftest.py, and existing tests read directly

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable framework versions, low churn expected)
