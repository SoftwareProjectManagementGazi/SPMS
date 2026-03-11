# Phase 1: Foundation & Security Hardening - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix architecture violations, patch the critical RBAC authorization bug, and establish data infrastructure (soft delete, indexes, versioning, audit trail). No new user-facing features. This phase makes the codebase clean and the database ready for all subsequent phases.

Requirements in scope: ARCH-01 through ARCH-10, DATA-01 through DATA-05, SEC-02, SEC-03, SAFE-02, SAFE-03.

</domain>

<decisions>
## Implementation Decisions

### RBAC Enforcement (ARCH-10)
- Membership check lives in a reusable **FastAPI dependency function** (`get_project_member`) — injected via `Depends()` per endpoint, consistent with the existing `Depends(get_current_user)` pattern
- **Admin role bypasses** the membership check — admins can access any project's tasks
- Non-members receive **HTTP 403 Forbidden** (not 404) — authenticated but unauthorized
- Membership check applies to **all task operations** including reads (GET) — non-members cannot see a project's tasks at all
- Rule: if user is a member of project X, they can access all of project X's tasks; if not a member, all access is blocked

### Startup Validation & Secrets (ARCH-07, ARCH-08)
- App **crashes at startup** (startup event) if JWT_SECRET or DB_PASSWORD equal their known insecure defaults
- "Insecure" defined as: JWT_SECRET == `"supersecretkey"` OR DB_PASSWORD == `"secretpassword"` — reject the exact known default values
- SQLAlchemy `echo` controlled by **existing `settings.DEBUG` env var** (`echo=settings.DEBUG`) — one flag controls all debug output
- CORS allowed origins configured via **`CORS_ORIGINS` environment variable** (comma-separated), parsed from `.env` — flexible across dev/staging/prod environments

### Soft Delete (DATA-04)
- Soft delete added to: **Tasks, Projects, Users, Comments, Files, Labels, Sprints** — all main tables except Notifications
- Notifications use hard delete (ephemeral, no recovery needed)
- Soft-deleted entities are **hidden from all queries** — filtered out at repository layer, not visible to any role
- Existing task–label associations remain intact when a label is soft-deleted (the label row still exists in DB with `is_deleted=true`; deleted labels just don't appear in the "available labels" picker)
- Implementation: add `is_deleted: bool = false` + `deleted_at: DateTime nullable` columns

### Audit Trail (DATA-02)
- Granularity: **field-level diff** — audit log stores old_value/new_value per changed field
- Tables audited: **Tasks and Projects only** (the core accountability entities)
- Logic lives in **repository layer** — repo reads current entity before update, diffs fields, writes to `audit_log` table. Use cases stay clean.
- Audit log schema: `entity_type`, `entity_id`, `field_name`, `old_value`, `new_value`, `user_id`, `action` (created/updated/deleted), `timestamp`

### Data Infrastructure (DATA-01, DATA-03, DATA-05)
- **Versioning** (DATA-01): add `version: int` + `updated_at` fields — applied via shared `TimestampedMixin` on all main tables
- **Recurring task schema** (DATA-03): schema-only in Phase 1 — add `recurrence_interval`, `recurrence_end_date`, `recurrence_count` columns to tasks table. No endpoint or business logic wired until Phase 3.
- **Indexes** (DATA-05): add indexes on `tasks.project_id`, `tasks.assignee_id`, `tasks.parent_task_id`, `projects.manager_id`

### Dashboard & API Wiring (ARCH-09, ARCH-03)
- **Settings page**: wire to real user profile data via `GET /auth/me` — replace mock profile fields with live data
- **Task Activity feed**: wire to audit log table (available once audit trail is implemented in this phase)
- **Dashboard — Member view**: show personal sprint board; fall back to "my assigned tasks + status" if sprint board not yet built
- **Dashboard — Manager view**: show project list + task counts. Full team stats (performance metrics, sprint progress) are deferred to Phase 6 — only lay the data infrastructure groundwork here
- **Project manager DTO** (ARCH-03): add nested manager fields (`manager_id`, `manager_name`, `manager_avatar`) to `ProjectResponseDTO` — one API call, no separate `/users/{id}` fetch from frontend. Follows existing pattern (task DTO already embeds assignee data).

### Error Codes & Architecture Cleanup (SEC-02, ARCH-01 through ARCH-06)
- All endpoints return standard HTTP codes: 400, 401, 403, 404, 500 — no custom non-standard codes
- `UserListDTO` moved from `auth.py` router to `application/dtos/auth_dtos.py` (ARCH-02)
- Duplicate service methods merged: `taskService.getByProjectId` / `getTasksByProject` → single method; `create` / `createTask` → single method (ARCH-01)
- `project_repo.update()` refactored from hardcoded field list to dynamic DTO-based field mapping (ARCH-06)
- Double round-trip eliminated: `task_repo.create` returns the full entity directly; no follow-up `get_by_id` call (ARCH-04, ARCH-05)

### Session Timeout (SAFE-02)
- No proactive countdown or auto-refresh
- When JWT expires, next API request returns 401; frontend intercepts and redirects to login with a "Session expired" message
- Simple, matches current architecture (no refresh token endpoint in scope)

### Claude's Discretion
- Exact `audit_log` table DDL and migration tooling approach (Alembic vs raw SQL)
- SAFE-03 log monitoring infrastructure design (structure of integration hook)
- Exact error message text for startup validation failure
- Which specific dashboard stats are surfaced in Manager view Phase 1 baseline (beyond project list + task counts)

</decisions>

<specifics>
## Specific Ideas

- Labels soft-deleted but task-label associations preserved — deleted label name/color still renders on existing tasks
- Manager dashboard: build the data infrastructure now, full stats wiring is Phase 6 scope
- Sprint board for Member view is preferred if infrastructure allows; assigned tasks list is the fallback
- Nested manager DTO follows the same pattern as the existing assignee embedding in TaskResponseDTO

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/api/dependencies.py` — existing `get_current_user` dependency: new `get_project_member(project_id, current_user)` follows same Depends() pattern
- `app/application/dtos/auth_dtos.py` — destination for `UserListDTO` migration (ARCH-02)
- `app/infrastructure/database/models/base.py` — plain `declarative_base()`: add `TimestampedMixin` here for shared `version`, `updated_at`, `is_deleted`, `deleted_at` fields
- `app/infrastructure/database/models/task.py` — already has `updated_at`; needs `is_deleted`, `deleted_at`, `version`, recurrence columns
- `app/infrastructure/database/repositories/task_repo.py` — repo layer is where audit diff logic goes (before update, read current → diff → write log)
- `app/infrastructure/config.py` — `Settings(BaseSettings)`: add `CORS_ORIGINS: str` and `DEBUG: bool = False`; add startup validator
- `app/infrastructure/database/database.py` — `echo=True` → `echo=settings.DEBUG`

### Established Patterns
- FastAPI `Depends()` for DI — all new auth/permission checks follow this pattern
- Clean Architecture layers: Domain → Application → Infrastructure → API — all fixes must respect layer boundaries
- `ProjectResponseDTO` already exists in `application/dtos/project_dtos.py` — extend it with nested manager fields
- `TaskResponseDTO` already embeds `assignee` (nested object) — same pattern for manager in ProjectResponseDTO

### Integration Points
- `app/api/v1/tasks.py` — all 6 task endpoints need the new `get_project_member` dependency injected
- `app/api/main.py` — CORS middleware configuration goes here; startup validation event hook goes here
- `Frontend/services/project-service.ts` — update to consume nested manager fields from updated ProjectResponseDTO
- `Frontend/app/dashboard` — wire ManagerView and MemberView to real API endpoints
- `Frontend/app/settings` — wire to `GET /auth/me`

</code_context>

<deferred>
## Deferred Ideas

- Full Manager dashboard stats (team performance metrics, sprint velocity, burndown charts) — Phase 6 (Reporting & Analytics)
- Sprint board full implementation for Member view — Phase 3 (Project & Task Completion)
- Task Activity feed advanced filtering and pagination — Phase 3
- HttpOnly cookie JWT storage (XSS risk mitigation) — noted in PROJECT.md as v2 revisit item

</deferred>

---

*Phase: 01-foundation-security-hardening*
*Context gathered: 2026-03-11*
