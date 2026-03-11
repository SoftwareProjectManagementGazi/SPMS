# Codebase Concerns

**Analysis Date:** 2026-03-11

---

## Tech Debt

**Hardcoded Default Credentials in Config:**
- Issue: `config.py` has hardcoded fallback values for all secrets including `JWT_SECRET = "supersecretkey"` and `DB_PASSWORD = "secretpassword"`. These are used if no `.env` is present.
- Files: `Backend/app/infrastructure/config.py`
- Impact: Any deployment without a proper `.env` will use weak, public-knowledge secrets. JWT tokens signed with `"supersecretkey"` can be forged by anyone who reads the source code.
- Fix approach: Remove all default values for security-sensitive fields so Pydantic raises a validation error on startup if they are missing. Keep non-sensitive defaults (e.g., `DB_PORT = "5432"`) only.

**SQLAlchemy `echo=True` Left Enabled:**
- Issue: The database engine is created with `echo=True`, which logs every SQL statement to stdout.
- Files: `Backend/app/infrastructure/database/database.py` (line 6), with comment `# Set to False in production`
- Impact: Verbose SQL logs leak query structure, table names, and data snippets into any log aggregation system. Significant performance overhead at scale.
- Fix approach: Change to `echo=False` or make it configurable via `settings.DEBUG` env var.

**`UserListDTO` Defined Inline in Router:**
- Issue: `UserListDTO` is defined directly in `auth.py` (the API router) rather than in `auth_dtos.py`. A commented-out import at the top of the file signals this was a workaround.
- Files: `Backend/app/api/v1/auth.py` (lines 18-23)
- Impact: DTOs defined in routers cannot be reused by other use-cases or tests. Violates the clean architecture boundary.
- Fix approach: Move `UserListDTO` to `Backend/app/application/dtos/auth_dtos.py`.

**`manage_projects.py` Uses `model_copy` on a Pydantic Domain Entity:**
- Issue: `UpdateProjectUseCase` calls `project.model_copy(update=update_data)` on a Pydantic domain entity. This Pydantic v2 method creates a copy without persisting back to the ORM session, and the `update` repo method must re-fetch the entity by ID anyway.
- Files: `Backend/app/application/use_cases/manage_projects.py` (lines 61-62)
- Impact: Creates a transient in-memory copy that is immediately thrown away; the repo `update` method silently ignores the passed entity's `columns` and `key` fields (hardcoded field list at lines 107-111 of `project_repo.py`).
- Fix approach: Pass only the raw `update_data` dict to the repo, or use a dedicated `ProjectUpdateDTO` passed directly to the repository.

**`taskService` Has Duplicate `getByProjectId` and `getTasksByProject` Methods:**
- Issue: `taskService` in `task-service.ts` exposes both `getByProjectId` and `getTasksByProject`. Both call the same endpoint (`/tasks/project/{projectId}`) and return the same type.
- Files: `Frontend/services/task-service.ts` (lines 132-150)
- Impact: Callers use different methods inconsistently (the project detail page uses `getTasksByProject`), creating confusion and split cache keys.
- Fix approach: Remove `getByProjectId` and consolidate all callers to `getTasksByProject`.

**`taskService.createTask` and `taskService.create` Both Exist:**
- Issue: `task-service.ts` exposes both `create` (typed) and `createTask` (accepts `any`). `createTask` sends to `/tasks` (no trailing slash) while `create` sends to `/tasks/` (with trailing slash), which may fail depending on server redirect settings.
- Files: `Frontend/services/task-service.ts` (lines 137-160)
- Impact: Inconsistent API call targets and two untyped surface areas. `createTask` accepts `any`, bypassing TypeScript's safety.
- Fix approach: Delete `createTask`, standardize on `create` with the trailing-slash URL.

**`project-service.ts` Returns a Placeholder Manager Object:**
- Issue: The `mapProjectResponseToProject` mapper creates a hardcoded `placeholderLead` object with name `"Project Manager"` and email `"manager@example.com"` because the list endpoint does not return manager details.
- Files: `Frontend/services/project-service.ts` (lines 33-54)
- Impact: The project list and detail views always show "Project Manager" as lead instead of the real name. Acknowledged with a `// TODO` comment.
- Fix approach: Expand the `ProjectResponseDTO` on the backend to include a nested `manager` object with name and avatar, similar to how `assignee` is nested in task responses.

---

## Known Bugs

**Tests Reference Non-Existent `status_id` Field on `Task` Entity:**
- Symptoms: Integration tests create `Task(status_id=1)` but the `Task` domain entity (`domain/entities/task.py`) has no `status_id` field. The field is `column_id`. Tests likely fail or silently ignore the unknown kwarg.
- Files: `Backend/tests/integration/api/test_auth_rbac.py` (lines 96, 129)
- Trigger: Running `pytest tests/integration/api/test_auth_rbac.py` — the task creation inside `test_delete_other_user_task_in_other_project` and `test_access_my_tasks` will pass unexpected kwargs to Pydantic, which silently drops unknown fields by default, causing tasks to have no `column_id`.
- Workaround: Replace `status_id=1` with `column_id=<valid_column_id>`, but this requires a board column to exist first, which requires creating a project with columns.

**Dashboard `ManagerView` and `MemberView` Use Static Mock Data:**
- Symptoms: The main dashboard always shows the same 3 mock projects and 4 mock tasks regardless of what is in the database.
- Files: `Frontend/components/dashboard/manager-view.tsx` (line 8), `Frontend/components/dashboard/member-view.tsx` (line 12)
- Trigger: Any logged-in user viewing the `/` (home) page.
- Workaround: None. The dashboard metrics and task lists are not connected to the live API.

**`Settings` Page Imports `currentUser` from Mock Data:**
- Symptoms: The Settings page always shows the mock user "Ahmet Yılmaz" with hardcoded email/avatar, not the authenticated user.
- Files: `Frontend/app/settings/page.tsx` (line 10)
- Trigger: Any user navigating to `/settings`.
- Workaround: None — form inputs are uncontrolled and the "Save Changes" button has no handler.

**`Task Activity` Section in Task Detail Always Shows Mock Data:**
- Symptoms: The activity feed on the task detail page renders hardcoded activities from `mock-data.ts`, not real comments or logs from the API.
- Files: `Frontend/components/task-detail/task-content.tsx` (line 13)
- Trigger: Viewing any task's detail page.
- Workaround: None.

**Project Board View Is a Flat Card Grid, Not a Kanban Board:**
- Symptoms: The "Board" tab in `app/projects/[id]/page.tsx` renders all tasks as a flat responsive card grid, not sorted into columns. The "List", "Timeline", and "Settings" tabs show a "coming soon" placeholder.
- Files: `Frontend/app/projects/[id]/page.tsx` (lines 155-190)
- Trigger: Clicking "Board" tab on any project.
- Workaround: None.

**Reports Page Is Entirely Stubbed Out:**
- Symptoms: All four chart panels display "Chart visualization coming soon".
- Files: `Frontend/app/reports/page.tsx`
- Trigger: Navigating to `/reports`.
- Workaround: None.

---

## Security Considerations

**JWT Secret Has a Weak Hardcoded Default:**
- Risk: If the application is deployed without setting `JWT_SECRET` in the environment, tokens are signed with `"supersecretkey"`, allowing anyone with source code access to forge valid tokens.
- Files: `Backend/app/infrastructure/config.py` (line 11)
- Current mitigation: None. Comment says `# Change in production`.
- Recommendations: Remove the default value entirely; make `JWT_SECRET` a required field with no fallback.

**All Seeded Users Have the Password `"123456"`:**
- Risk: The database seeder creates 8 users including admin and project managers all with the trivially guessable password `"123456"`.
- Files: `Backend/app/infrastructure/database/seeder.py` (line 158)
- Current mitigation: Passwords are bcrypt-hashed, so they are safe from direct DB read.
- Recommendations: Replace the hardcoded seeder password with a randomly generated one logged once at seed time, or require callers to supply it via an env var.

**No Authorization Checks on Task Endpoints (Only Authentication):**
- Risk: Any authenticated user can read, update, or delete any task regardless of whether they are a member of the task's project. `delete_task` passes `current_user.id` to `DeleteTaskUseCase`, but that use case only checks task existence — it does not validate that the caller is a member of the task's project.
- Files: `Backend/app/api/v1/tasks.py` (lines 80-91), `Backend/app/application/use_cases/manage_tasks.py` (lines 182-192)
- Current mitigation: None. RBAC integration tests expect HTTP 403, but the implementation returns 200 (delete succeeds) or 404 (task not found).
- Recommendations: In `DeleteTaskUseCase.execute`, verify that `user_id` is either the task's assignee/reporter or a member of the task's project before deleting.

**No Rate Limiting on Auth Endpoints:**
- Risk: `/api/v1/auth/login` and `/api/v1/auth/register` have no rate limiting. Brute-force and credential-stuffing attacks are unrestricted.
- Files: `Backend/app/api/v1/auth.py`, `Backend/app/api/main.py`
- Current mitigation: None.
- Recommendations: Add `slowapi` or a reverse-proxy (nginx/Cloudflare) rate limit to auth endpoints.

**CORS Allows All Methods and Headers from Localhost Origins:**
- Risk: `allow_methods=["*"]` and `allow_headers=["*"]` are overly permissive. In production, this should be scoped to the actual required methods and headers.
- Files: `Backend/app/api/main.py` (lines 31-37)
- Current mitigation: `allow_origins` is restricted to `localhost:3000` only, limiting exposure to local dev.
- Recommendations: Lock down `allow_methods` and `allow_headers` when moving to a production domain.

**JWT Stored in `localStorage` (XSS Risk):**
- Risk: Tokens stored in `localStorage` are accessible to any JavaScript running in the page, including injected scripts from XSS attacks.
- Files: `Frontend/lib/api-client.ts`, `Frontend/services/auth-service.ts`
- Current mitigation: None specific to XSS.
- Recommendations: Consider `HttpOnly` cookie-based token storage as a more XSS-resistant alternative.

---

## Performance Bottlenecks

**N+1 Eager Load Pattern on Every Task Query:**
- Problem: `_get_base_query()` in `SqlAlchemyTaskRepository` uses multiple nested `joinedload` and `selectinload` calls (project + project columns, column, assignee + role, parent + parent project + parent column, subtasks + subtask column + subtask assignee + subtask project). Every task list query loads this full object graph.
- Files: `Backend/app/infrastructure/database/repositories/task_repo.py` (lines 90-117)
- Cause: The task response DTO requires deeply nested data; the repository loads everything upfront in a single query strategy, which generates complex JOIN SQL.
- Improvement path: Add pagination to list endpoints and consider flattening the task DTO for list views (summary view vs. detail view), using a lighter query for the list.

**Task `create` Issues Two DB Round-Trips:**
- Problem: `CreateTaskUseCase.execute` creates a task via `task_repo.create(task)` then immediately calls `task_repo.get_by_id(created_task.id)` to reload the full object graph.
- Files: `Backend/app/application/use_cases/manage_tasks.py` (lines 107-121), `Backend/app/infrastructure/database/repositories/task_repo.py` (lines 119-128)
- Cause: `task_repo.create` itself already calls `get_by_id` internally (line 128 of `task_repo.py`), meaning a single task creation triggers two full eager-load queries.
- Improvement path: Have `task_repo.create` return the fully loaded entity and remove the redundant `get_by_id` call from the use case.

**Task `update` Also Issues Two DB Round-Trips:**
- Problem: `UpdateTaskUseCase.execute` calls `task_repo.update()` then immediately calls `task_repo.get_by_id()` again for the full object. `task_repo.update` itself commits and then the use case also calls `get_by_id`.
- Files: `Backend/app/application/use_cases/manage_tasks.py` (lines 176-180), `Backend/app/infrastructure/database/repositories/task_repo.py` (lines 150-162)
- Improvement path: Have `task_repo.update` return the fully loaded entity and eliminate the second `get_by_id` call in the use case.

**No Database Indexes on Frequently Queried Columns:**
- Problem: `tasks.project_id`, `tasks.assignee_id`, and `tasks.parent_task_id` have foreign key constraints but are not explicitly indexed. `TODO.md` marks this as `[DELAYED]`.
- Files: `Backend/app/infrastructure/database/models/task.py`, `TODO.md` (line 25)
- Cause: Indexes were deferred during initial development.
- Improvement path: Add `index=True` to `project_id`, `assignee_id`, and `parent_task_id` columns in `TaskModel`, and `manager_id` in `ProjectModel`.

---

## Fragile Areas

**Task Status Is Derived from Column Name String, Not an Enum:**
- Files: `Backend/app/application/use_cases/manage_tasks.py` (lines 19-21, 31-33, 50-53)
- Why fragile: The `status` field in `TaskResponseDTO` is computed by lowercasing and hyphenating the column's `name` string. If a project manager creates a column named "In Review" vs "In-Review" vs "Review", the derived status slug will differ. Frontend components compare these slugs for display logic.
- Safe modification: Any column name change must be tested against frontend status matching logic. Do not rename columns without checking `task-sidebar.tsx` status normalization logic (lines 94-105).
- Test coverage: No unit tests cover the status derivation path.

**`project_repo.update` Silently Ignores Unknown Input:**
- Files: `Backend/app/infrastructure/database/repositories/project_repo.py` (lines 97-119)
- Why fragile: The `update` method manually assigns only `name`, `description`, `start_date`, `end_date`, and `methodology`. Any other fields passed in the `ProjectUpdateDTO` (e.g., `key` or `custom_fields`) are silently dropped. A comment on line 119 acknowledges: `Should ideally raise not found, but repo just returns`.
- Safe modification: When adding new updatable fields to `ProjectUpdateDTO`, you must explicitly add `model.field = project.field` assignments in this method.

**Seeder Runs on Every Application Startup:**
- Files: `Backend/app/api/main.py` (lines 15-19), `Backend/app/infrastructure/database/seeder.py` (lines 107-131)
- Why fragile: The seeder checks for an existing user to skip re-seeding, but this check happens inside `lifespan` on every startup. If the seed check query fails (e.g., tables not yet created), the app startup silently breaks.
- Safe modification: Any changes to seeder data (user passwords, project names, column names) require careful consideration because column names affect task status derivation throughout the system.

**`isAuthenticated()` Checks for Token Presence Only, Not Token Validity:**
- Files: `Frontend/services/auth-service.ts` (lines 69-72), `Frontend/context/auth-context.tsx` (lines 24-39)
- Why fragile: `isAuthenticated` returns `true` if any string exists in `localStorage` under the token key, including expired or malformed tokens. The actual validation only happens when `getCurrentUser()` is called, which then redirects to login on 401. This creates a brief flash of authenticated UI before the redirect.
- Safe modification: Adding token expiry checking to `isAuthenticated` requires parsing the JWT payload client-side.

**`TaskModel.backref="subtasks"` Conflicts with Explicit `subtasks` Field in `Task` Entity:**
- Files: `Backend/app/infrastructure/database/models/task.py` (line 37), `Backend/app/domain/entities/task.py` (line 44)
- Why fragile: SQLAlchemy creates a `subtasks` backref on `TaskModel` from the `parent` relationship, and the `Task` Pydantic entity also declares `subtasks: List['Task']`. The manual `_to_entity` mapper in `task_repo.py` reconciles these, but any future attempt to use `model_validate` directly on a `TaskModel` (as is done for `Project`) would break because Pydantic would try to validate the ORM backref collection.

---

## Scaling Limits

**No Pagination on Any List Endpoint:**
- Current capacity: All tasks or all projects for a user are loaded in a single query.
- Limit: Performance degrades significantly beyond a few hundred tasks per project due to the deep eager-loading strategy.
- Scaling path: Add `limit`/`offset` or cursor-based pagination query parameters to `GET /api/v1/tasks/project/{project_id}` and `GET /api/v1/projects/`.

**In-Memory Seeder with `random.sample` Assigns Members Non-Deterministically:**
- Current capacity: Works with 8 users and 4 projects.
- Limit: On large team sizes, `random.sample(all_users, k=min(len(all_users), random.randint(4, 6)))` produces different results on each fresh seed. Tests that rely on project membership (e.g., "attacker cannot delete owner's project") may be non-deterministic if seeded data is involved.
- Scaling path: Use fixed seed data or explicit member assignment for test reproducibility.

---

## Dependencies at Risk

**`python-jose` for JWT (Maintenance Status):**
- Risk: `python-jose` has had limited maintenance activity. The `cryptography` backend version pinning in `requirements.txt` should be checked.
- Impact: A vulnerability in JWT signing/verification could compromise the entire authentication system.
- Migration plan: Consider migrating to `PyJWT` (actively maintained) which has a similar API.

**Dual Lock Files (`package-lock.json` and `pnpm-lock.yaml`):**
- Risk: The Frontend directory contains both `package-lock.json` (npm) and `pnpm-lock.yaml` (pnpm). These can diverge, causing different dependency trees depending on which package manager is used.
- Impact: CI/CD or contributor environments may install different dependency versions.
- Migration plan: Choose one package manager, delete the other lockfile, and document the choice in README.

---

## Missing Critical Features

**No Role-Based Access Control (RBAC) Enforcement in Task/Project Endpoints:**
- Problem: The backend stores `role_id` on users and has `Admin`, `Project Manager`, and `Member` roles seeded, but no endpoint checks these roles. Any authenticated user can create, update, or delete any project or task.
- Blocks: Multi-tenant safety; production deployment where members should not have manager-level permissions.

**No Pagination on List Endpoints:**
- Problem: `GET /api/v1/tasks/project/{id}` and `GET /api/v1/projects/` return all records without limit.
- Blocks: Usability and performance at realistic data volumes.

**No File Upload/Download Implementation Despite Model Existing:**
- Problem: `Backend/app/domain/entities/file.py`, `Backend/app/infrastructure/database/models/file.py`, and `Backend/static/uploads/` directory all exist, but there are no file-related API endpoints. The `FileModel` is defined but not served.
- Blocks: Any feature requiring file attachments on tasks.

**No Comment/Notification API Endpoints Despite Models Existing:**
- Problem: `CommentModel`, `NotificationModel`, `LogModel`, and `LabelModel` exist in the database and are populated by the seeder, but there are no API endpoints to read or create them. Task detail activity feed falls back to mock data as a result.
- Blocks: Real activity feeds, audit logs, and in-app notifications.

**Sprint Endpoints Are Missing:**
- Problem: `SprintModel` exists and is populated by the seeder, but there is no `/api/v1/sprints/` router. Sprint assignment on task create/update is accepted by the `TaskCreateDTO` but there is no way to list available sprints for a project.
- Blocks: Sprint planning UI and Scrum board filtering.

---

## Test Coverage Gaps

**No Unit Tests for Any Use Case Except `RegisterUser`:**
- What's not tested: `CreateProjectUseCase`, `UpdateProjectUseCase`, `DeleteProjectUseCase`, `CreateTaskUseCase`, `UpdateTaskUseCase`, `DeleteTaskUseCase`, `LoginUserUseCase`, `GetProjectDetailsUseCase`.
- Files: `Backend/tests/unit/application/` (only `test_register_user.py` present)
- Risk: Business logic regressions (e.g., authorization checks, field validation) would only be caught by integration tests if they exist, or not at all.
- Priority: High

**Integration Tests Reference Non-Existent `status_id` Field, Likely Failing:**
- What's not tested: Task creation via API in `test_delete_other_user_task_in_other_project` and `test_access_my_tasks` — both create `Task(status_id=1)` which is an invalid field.
- Files: `Backend/tests/integration/api/test_auth_rbac.py` (lines 96, 129)
- Risk: These tests likely do not exercise the intended paths because the task is created without a valid column.
- Priority: High

**No Frontend Tests of Any Kind:**
- What's not tested: All React components, custom hooks (`use-projects.ts`, `useLocalStorageState.ts`), and service layer mapping functions.
- Files: Entire `Frontend/` directory — no `*.test.tsx` or `*.spec.ts` files found.
- Risk: UI regressions, API contract mismatches (e.g., `status_id` vs `column_id`), and mapping bugs go undetected.
- Priority: Medium

**No Tests for Repository Layer (Except Basic DB Integration):**
- What's not tested: `SqlAlchemyProjectRepository.update` silently dropping fields, `SqlAlchemyTaskRepository._to_entity` mapper correctness, eager loading behavior.
- Files: `Backend/tests/integration/infrastructure/` (only `test_db_integration.py` and `test_user_repo_integration.py`)
- Risk: Repository-level bugs (e.g., silent field drops in update, incorrect status derivation) are invisible.
- Priority: Medium

---

*Concerns audit: 2026-03-11*
