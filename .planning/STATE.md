---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
stopped_at: Completed 05-01-PLAN.md — Phase 5 schema foundation (NotificationType enum, notification_preferences, task_watchers)
last_updated: "2026-03-16T07:42:26.170Z"
last_activity: 2026-03-15 — Phase 4 plan 02 complete (CalendarTab, UndatedTasksSidebar, GanttTab)
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 33
  completed_plans: 28
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
stopped_at: Phase 4 approved and closed — Kanban DnD polish, blank-tab fix, list/gantt/members improvements, Edit Project, Manage Team
last_updated: "2026-03-15T13:00:00.000Z"
last_activity: 2026-03-15 — Phase 4 closed (UAT + post-UAT bug fixes approved). Ready for Phase 5 (Notifications)
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 27
  completed_plans: 27
  percent: 96
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
stopped_at: Completed 04-02-PLAN.md — CalendarTab + UndatedTasksSidebar + GanttTab
last_updated: "2026-03-15T07:47:00.000Z"
last_activity: 2026-03-15 — Phase 4 plan 02 complete (CalendarTab VIEW-02, GanttTab VIEW-03)
progress:
  [██████████] 96%
  completed_phases: 3
  total_plans: 26
  completed_plans: 24
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
stopped_at: "Completed Phase 03 — all 8 plans done, verification passed 5/5, all 11 TASK requirements satisfied"
last_updated: "2026-03-14T00:00:00Z"
last_activity: 2026-03-14 — Phase 3 complete (sprints, comments, attachments, dependencies, recurring tasks, pagination, frontend wiring)
progress:
  total_phases: 7
  completed_phases: 3
  total_plans: 22
  completed_plans: 22
  percent: 64
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11)

**Core value:** Ekiplerin farklı proje yönetim metodolojilerine uygun şekilde projelerini ve görevlerini tek platformda takip edebilmesi.
**Current focus:** Phase 2 Wave 1 — test scaffolds complete, ready for implementation plans (02-02 onward)

## Current Position

Phase: 4 IN PROGRESS — 04-02 complete, next: 04-03 (project page integration)
Status: Phase 4 plan 02 complete. CalendarTab (VIEW-02) and GanttTab (VIEW-03) built.
Last activity: 2026-03-15 — Phase 4 plan 02 complete (CalendarTab, UndatedTasksSidebar, GanttTab)

Progress: [████████░░] 67% (3/7 phases complete + Phase 4 in progress: 2/4 plans done)

## Performance Metrics

**Velocity:**
- Total plans completed: 7 (6 Phase 1 + 1 Phase 2)
- Phase 1 total plans: 6/6
- Phase 2 total plans: 2/8

**By Phase:**

| Phase | Plans | Status |
|-------|-------|--------|
| 01 - Foundation & Security Hardening | 6/6 | All plans done |
| 02 - Authentication & Team Management | 2/8 | In progress |
| Phase 02 P03 | 15 | 2 tasks | 5 files |
| Phase 02 P04 | 198 | 2 tasks | 8 files |
| Phase 02 P05 | 4 | 2 tasks | 14 files |
| Phase 02 P06 | 18 | 2 tasks | 6 files |
| Phase 02 P07 | 3 | 2 tasks | 4 files |
| Phase 03-project-task-completion P01 | 2 | 2 tasks | 9 files |
| Phase 03-project-task-completion P02 | 220 | 2 tasks | 14 files |
| Phase 03-project-task-completion P03 | 291 | 2 tasks | 13 files |
| Phase 03-project-task-completion P04 | 233 | 2 tasks | 11 files |
| Phase 03-project-task-completion P05 | 5 | 2 tasks | 9 files |
| Phase 03-project-task-completion P06 | 15 | 2 tasks | 4 files |
| Phase 03-project-task-completion P07 | 4 | 2 tasks | 8 files |
| Phase 03 P08 | 185 | 2 tasks | 3 files |
| Phase 04-views-ui P01 | 4 | 2 tasks | 13 files |
| Phase 04-views-ui P03 | 4 | 2 tasks | 5 files |
| Phase 04-views-ui P04 | 202 | 2 tasks | 6 files |
| Phase 04-views-ui P05 | 1 | 1 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Phase 1 bundles all ARCH + DATA + SEC-02/SEC-03 + SAFE-02/SAFE-03 to eliminate blockers before any new feature work
- [Roadmap]: RBAC bug (ARCH-10) is treated as a Phase 1 blocker — no new endpoints ship until authorization is enforced on existing ones
- [Roadmap]: Phase 7 combines PROC + ADAPT + EXT as the extensibility layer; all three depend on stable task/view infrastructure from earlier phases
- [01-01]: Use pytest.mark.xfail (not skip) so all stubs appear in collection and satisfy Nyquist rule
- [01-01]: Anaconda3 base env is the functional pytest runtime — ScriptSecureProje_env lacks pytest_asyncio
- [01-02]: TimestampedMixin applied to 7 models (Tasks, Projects, Users, Comments, Files, Labels, Sprints) — NotificationModel excluded (hard delete per CONTEXT.md)
- [01-02]: AuditLogModel has no TimestampedMixin — it is immutable append-only; no soft-delete, no version tracking
- [01-02]: Migration 001_phase1_schema.py is hand-written and fully idempotent via information_schema checks
- [01-02]: Alembic env.py uses async_engine_from_config + run_sync pattern for asyncpg compatibility
- [01-03]: Admin bypass uses role.name.lower() == 'admin' — case-insensitive role check in get_project_member and get_task_project_member
- [01-03]: Create task endpoint uses inline membership check since project_id is in DTO body, not URL path — no path-param variant needed
- [01-03]: _validate_startup_secrets() extracted as standalone function to enable unit testing without triggering DB seed in lifespan
- [Phase 01]: Soft-delete implemented at repository layer per Clean Architecture — use cases stay clean
- [Phase 01]: deleted_at set via datetime.utcnow() in Python code, not via server_default or onupdate (Pitfall 2)
- [Phase 01]: project_repo.update() uses dynamic field mapping via updatable_fields list (ARCH-06 resolved)
- [01-05]: UserListDTO defined only in auth_dtos.py; routers must import, never redefine inline
- [01-05]: manager_name/manager_avatar added to Project domain entity so model_validate() works via from_attributes without custom router mapping
- [01-05]: task_repo.create() uses _get_base_query() inline after flush+commit — single round-trip, no internal get_by_id delegation
- [01-06]: AUTH_TOKEN_KEY = 'auth_token' (not 'jwt_token') — localStorage key for JWT
- [01-06]: init.sql is now single source of truth for fresh DB schema; Alembic migration remains for existing DBs
- [01-06]: Activity endpoint returns raw audit log fields (no formal DTO) — sufficient for Phase 1
- [01-06]: logs table replaced by audit_log throughout (seeder, init.sql, models)
- [02-01]: No app imports in stub files — stubs assert False immediately, no use-case or repo imports needed (avoids import errors from not-yet-existing modules)
- [02-01]: Async unit stubs use @pytest.mark.asyncio; sync integration stubs use plain def — mirrors Phase 1 pattern
- [02-02]: No TimestampedMixin on PasswordResetTokenModel — append-only reference data per CONTEXT.md
- [02-02]: Config lives at Backend/app/infrastructure/config.py (not app/core/config.py) — SMTP fields added there
- [02-02]: Dual migration files: standard Alembic in alembic/versions/ + async helper in app/infrastructure/database/migrations/
- [Phase 02-03]: password_hash field name used (not hashed_password) — matched to actual User entity definition
- [Phase 02-03]: Authenticated avatar serving via /auth/avatar/{filename} with no StaticFiles mount — enforces JWT gate
- [Phase 02-03]: Avatar paths stored as relative strings (uploads/avatars/uuid.ext) not absolute paths
- [Phase 02]: UserListDTO.username maps to User.full_name — no separate username column, full_name is display identifier in search results
- [Phase 02]: add_member is idempotent via IntegrityError catch-and-rollback at repository layer (SqlAlchemyTeamRepository)
- [Phase 02-05]: In-memory dict (_lockout_store) used for lockout state — restarts clear state (intentional for dev)
- [Phase 02-05]: slowapi Limiter at app.state.limiter with key_func=get_remote_address; request: Request is first param on rate-limited endpoints (slowapi requirement)
- [Phase 02-05]: update_password() added to IUserRepository interface and SqlAlchemyUserRepository to support password reset confirm flow
- [Phase 02-06]: mapUserResponseToUser extracted as module-level function in auth-service.ts for reuse across updateProfile and uploadAvatar
- [Phase 02-06]: User.role type is { name: string } — description field stripped from mapper to match existing type definition
- [Phase 02-06]: ConfirmDialog/TypeToConfirmDialog use controlled open state — callers manage open prop, no internal trigger
- [Phase 02]: Teams nav added to sidebar.tsx not layout.tsx — sidebar is where all nav items live in this project's AppShell architecture
- [Phase 03-01]: [03-01]: Unit stubs use @pytest.mark.asyncio + async def; integration stubs use plain sync def — mirrors Phase 1/2 pattern
- [Phase 03-01]: [03-01]: No app imports in any stub files — avoids import errors from not-yet-existing modules
- [Phase 03-01]: [03-01]: All 40 tests marked xfail(strict=False) so they appear in collection without failing the suite
- [Phase 03-project-task-completion]: [03-02]: task_dependencies uses hard delete only — no TimestampedMixin per research (no audit value for dependency records)
- [Phase 03-project-task-completion]: [03-02]: Migration 003 backfills task_key = project.key || '-' || task.id for all existing tasks
- [Phase 03-project-task-completion]: [03-02]: Dual migration file pattern maintained: alembic/versions/ for CLI, migrations/ for async lifespan
- [Phase 03-03]: POST /sprints uses inline project membership check (project_id in body) rather than get_sprint_project_member dependency
- [Phase 03-03]: pg_insert with on_conflict_do_nothing() for idempotent project member add
- [Phase 03-04]: [03-04]: POST /comments/ uses inline project membership check (task_id in body) rather than get_task_project_member path-param dependency
- [Phase 03-04]: [03-04]: UploadAttachment raises ValueError for validation; router translates to HTTP 400 (blocked extension) or HTTP 413 (>25MB)
- [Phase 03-project-task-completion]: [03-05]: /search endpoint placed before /{task_id} in router to avoid FastAPI path param conflict
- [Phase 03-project-task-completion]: [03-05]: update_series() applies to future instances only (due_date >= utcnow())
- [Phase 03-project-task-completion]: [03-06]: getMembers() added to projectService immediately (plan 03-07 can skip adding it; 03-06 uses it first)
- [Phase 03-project-task-completion]: [03-06]: History tab uses enabled: activeTab === 'history' to lazy-load audit log only when tab is visible
- [Phase 03-project-task-completion]: [03-06]: currentUserId derived via parseInt(currentUser.id, 10) — AuthContext.user.id is string, CommentAuthor.id is number
- [Phase 03-project-task-completion]: currentUser fetched inside task-sidebar.tsx via useQuery to avoid breaking existing caller interface
- [Phase 03-project-task-completion]: sprintId/recurrenceInterval/recurrenceEndDate/recurrenceCount added to ParentTask type and task-service mapper
- [Phase 03-project-task-completion]: [03-08]: getByProjectId backward-compat via Array.isArray guard; getByProjectPaginated is opt-in paginated method
- [Phase 03-project-task-completion]: [03-08]: similar task debounce uses useRef timeout, 600ms, stop-word filtered, cleared on unmount
- [Phase 03-project-task-completion]: [03-08]: Board tab uses allTasks accumulation — page 1 replaces, subsequent pages append
- [Phase 04-views-ui]: [04-01]: move_tasks_to_sprint added to ISprintRepository interface for Clean Architecture — no SQLAlchemy in use cases
- [Phase 04-views-ui]: [04-01]: Sprint done detection uses ilike('%done%') column name matching — simpler than last-column-by-order_index
- [Phase 04-views-ui]: [04-01]: Board column router registered under /api/v1/projects prefix — full path /api/v1/projects/{id}/columns
- [Phase 04-views-ui]: [04-01]: ProjectCreateDTO columns default changed from [] to 5 named defaults — all new projects auto-get columns
- [Phase 04-views-ui]: [04-02]: frappe-gantt TypeScript types not available on npm; created lib/frappe-gantt.d.ts module declaration file
- [Phase 04-views-ui]: [04-02]: Dependency arrows deferred to Phase 7 — ParentTask type has no dependency IDs field; dependencies: '' with TODO comment
- [Phase 04-views-ui]: [04-02]: Recurring event expansion done client-side using date-fns; cap at min(recurrenceCount, 52) and view window end
- [Phase 04-views-ui]: [04-02]: frappe-gantt Gantt constructor called via dynamic import() inside useEffect for belt-and-suspenders SSR safety; parent must wrap with dynamic({ ssr: false })
- [Phase 04-views-ui]: [04-03]: onSuccess removed from useQuery in React Query v5; sprint default uses useEffect + sprintDefaultSet flag
- [Phase 04-views-ui]: [04-03]: drag-to-done warning is generic toast (no dependency IDs on ParentTask); deferred dependency check to Phase 7
- [Phase 04-views-ui]: [04-03]: DragOverlay uses overlay=true prop on KanbanCard to skip drag listeners and prevent double sensor registration
- [Phase 04-views-ui]: [04-04]: Progress bars show approximate values (0/50/100%) based on sprint status — no per-sprint task count on DTO without extra API calls
- [Phase 04-views-ui]: [04-04]: Multi-select filter uses DropdownMenuCheckboxItem pattern; client-side sort+filter over full accumulated task array via useMemo
- [Phase 04-views-ui]: Sprint query placed after currentUser query — consistent grouping with other project-scoped queries; enabled: !!id guard prevents query firing with undefined id
- [Phase 05-01]: Legacy PROJECT_UPDATE enum value kept; PROJECT_UPDATED added as new canonical value — both coexist to avoid breaking existing notification rows
- [Phase 05-01]: Alembic autocommit_block() used for ALTER TYPE ADD VALUE DDL; async lifespan migration uses engine.execution_options(isolation_level=AUTOCOMMIT)
- [Phase 05-01]: notification_preferences uses TimestampedMixin (lifecycle-tracked); task_watchers has no mixin (ephemeral join table)

### Pending Todos

None.

### Blockers/Concerns

- RESOLVED: Task endpoints RBAC enforcement — fixed in Plan 01-03 (ARCH-10)
- RESOLVED: JWT_SECRET and DB_PASSWORD hardcoded defaults — startup validation added in Plan 01-03 (ARCH-08)
- RESOLVED: Dashboard, Settings, Task Activity mock data — fixed in Plan 01-06 (ARCH-09)
- RESOLVED: Integration tests status_id field — fixed in Plan 01-01
- Note: tests/integration/conftest.py uses main spms_db directly (not a test DB) — DB must be running before integration tests

## Session Continuity

Last session: 2026-03-16T07:42:16.336Z
Stopped at: Completed 05-01-PLAN.md — Phase 5 schema foundation (NotificationType enum, notification_preferences, task_watchers)
Resume file: None
