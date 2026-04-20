---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: MVP
status: Milestone complete — v1.0 shipped
stopped_at: Milestone v1.0 archived on 2026-04-20
last_updated: "2026-04-20T16:45:00.000Z"
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 43
  completed_plans: 43
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Ekiplerin farklı proje yönetim metodolojilerine uygun şekilde projelerini ve görevlerini tek platformda takip edebilmesi.
**Current focus:** v1.0 shipped — planning next milestone

## Current Position

Phase: 07 (process-models-adaptation-integrations) — EXECUTING
Plan: 5 of 5

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
| Phase 05-notifications P02 | 2 | 2 tasks | 6 files |
| Phase 05-notifications P03 | 5 | 2 tasks | 12 files |
| Phase 05-notifications P04 | 10 | 2 tasks | 7 files |
| Phase 05-notifications P05 | 10 | 2 tasks | 5 files |
| Phase 05 P06 | 3 | 2 tasks | 6 files |
| Phase 05-notifications P07 | 3 | 2 tasks | 3 files |
| Phase 06-reporting-analytics P01 | 4 | 2 tasks | 7 files |
| Phase 06-reporting-analytics P02 | 240 | 2 tasks | 9 files |
| Phase 06-reporting-analytics P03 | 30 | 2 tasks | 7 files |
| Phase 06-reporting-analytics P04 | 20 | 2 tasks | 4 files |
| Phase 07 P01 | 160 | 2 tasks | 13 files |
| Phase 07-process-models-adaptation-integrations P02 | 126 | 2 tasks | 9 files |
| Phase 07 P03 | 237 | 2 tasks | 11 files |
| Phase 07 P04 | 3 | 2 tasks | 9 files |
| Phase 07-process-models-adaptation-integrations P05 | 5 | 2 tasks | 9 files |

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
- [Phase 05-02]: INotificationService abstraction: API callers use notify(); switching to WebSocket replaces only PollingNotificationService
- [Phase 05-02]: PollingNotificationService: self-suppression (actor_id == user_id) prevents noisy self-notifications; per-type in_app defaults to True
- [Phase 05-03]: purge_old_read uses Python timedelta cutoff for portability; SMTP_HOST guard silently skips email in dev; scheduler is module-level singleton; get_tasks_approaching_deadline casts to ::date for same-day matching
- [Phase 05-04]: Fixed-path routes (mark-all-read, clear-read) registered before parametric routes in notifications.py — prevents FastAPI path param conflict
- [Phase 05-04]: delete_task pre-fetches task entity and watchers before DeleteTaskUseCase — CASCADE delete removes watcher rows during deletion
- [Phase 05-04]: asyncio.gather for concurrent admin fan-out in project endpoints — avoids sequential blocking for N admins
- [Phase 05-notifications]: 05-05: Used apiClient (axios) for notification-service matching project-wide pattern; pollInterval false on server for SSR safety; toast suppressed on initial load via prevUnreadCount ref
- [Phase 05-06]: 05-06: useEffect used for data accumulation (React Query v5 — no onSuccess in useQuery)
- [Phase 05-06]: 05-06: Watch toggle hidden for assignees; watch endpoints in tasks.py via direct SQLAlchemy (no new repository)
- [Phase 05-07]: migration_004.py is the canonical name — 004_phase5_schema.py invalid (starts with digit); BackgroundTasks is a FastAPI special param not a Depends(); email preference defaults True when pref row absent
- [Phase 06-reporting-analytics]: [06-01]: Inline _check_project_membership() helper in reports.py — project_id is query param on all report endpoints, not path param; existing get_project_member Depends() reads path param
- [Phase 06-reporting-analytics]: [06-01]: TaskExportRowDTO included in IReportRepository.get_tasks_for_export() — Plan 02 (export) can use it without interface changes
- [Phase 06-reporting-analytics]: [06-01]: Burndown audit log query casts done column IDs to strings (AuditLogModel.new_value is TEXT) per Pitfall 4 pattern
- [Phase 06-02]: weasyprint lazily imported inside export_pdf endpoint body to avoid ImportError at startup if system pango/cairo libs are missing
- [Phase 06-02]: get_tasks_for_export uses table aliases for assignee_user and reporter_user since both join to same users table
- [Phase 06-02]: _parse_assignee_ids helper defined at module level in reports.py and reused across all 7 endpoints
- [Phase 06-reporting-analytics]: Team Performance panel left as placeholder (Yakında...) in Plan 06-03 — wired to real data in Plan 06-04
- [Phase 06-reporting-analytics]: distLoading combines both status and priority distribution query loading states for single TaskDistributionChart isLoading prop
- [Phase 06-04]: report-service.ts created in Plan 04 due to parallel execution — identical to Plan 03's output; no conflict if both create it
- [Phase 06-04]: Manager dashboard defaultProjectId uses projects[0].id (most recently returned) — consistent with CONTEXT.md 'most recently active project' pattern
- [Phase 07]: migration_005 uses AUTOCOMMIT pattern for ALTER TYPE ADD VALUE (same as migration_004)
- [Phase 07]: ProjectCreateDTO.columns default changed from English hardcoded to [] — Plan 03 template seeding provides methodology-appropriate columns
- [Phase 07]: ProcessTemplateModel and SystemConfigModel have no TimestampedMixin — hard delete and no lifecycle tracking appropriate for these tables
- [Phase 07-02]: require_admin placed after _is_admin and get_current_user in dependencies.py to avoid Python forward-reference NameError at import time
- [Phase 07-02]: system_config_service uses module-level asyncio.Lock double-checked locking for zero-restart config cache invalidation
- [Phase 07-02]: UpdateProcessTemplateUseCase uses model_copy(update=...) for partial update, preserving fields not in DTO
- [Phase 07]: Sprint archival on SCRUM departure uses is_active=False — Sprint entity has is_active:bool, not status:str
- [Phase 07]: Integration events use asyncio.create_task (fire-and-forget); webhook_url stripped from all GET responses via _sanitize_process_config (EXT-04)
- [Phase 07]: _fire_integration_event uses lazy imports inside function body to avoid circular import between tasks.py and projects.py
- [Phase 07]: SystemConfigProvider wraps app inside AuthProvider so config is globally available to sidebar and all pages
- [Phase 07]: Sidebar reads reporting_module_enabled !== 'false' so missing config key defaults to enabled
- [Phase 07]: Methodology type updated to include iterative as fourth union member — frontend-only enum change
- [Phase 07-process-models-adaptation-integrations]: Task 1 (ITERATIVE card + Turkish columns + process_config) was already committed on main as 7d9d0789 before this agent ran — rebase onto main was performed to pick up that work cleanly
- [Phase 07-process-models-adaptation-integrations]: WIP badge shows task count / wip_limit with amber at limit, red at 2+ over; reports.page.tsx uses reporting_module_enabled !== 'false' pattern (missing key = enabled)

### Pending Todos

None.

### Blockers/Concerns

- RESOLVED: Task endpoints RBAC enforcement — fixed in Plan 01-03 (ARCH-10)
- RESOLVED: JWT_SECRET and DB_PASSWORD hardcoded defaults — startup validation added in Plan 01-03 (ARCH-08)
- RESOLVED: Dashboard, Settings, Task Activity mock data — fixed in Plan 01-06 (ARCH-09)
- RESOLVED: Integration tests status_id field — fixed in Plan 01-01
- Note: tests/integration/conftest.py uses main spms_db directly (not a test DB) — DB must be running before integration tests

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-04-20:

| Category | Item | Status |
|----------|------|--------|
| uat_gaps | Phase 06: 06-HUMAN-UAT.md | passed (0 pending) |
| verification | Phase 04: 04-VERIFICATION.md | human_needed |
| verification | Phase 06: 06-VERIFICATION.md | human_needed |

Note: UI overhaul planned for next milestone — Phase 04/06 human verification deferred intentionally.

## Session Continuity

Last session: 2026-04-20T16:45:00.000Z
Stopped at: Milestone v1.0 archived — all 7 phases, 43 plans complete
Resume file: None
