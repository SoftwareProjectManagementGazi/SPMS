# Phase 14: Admin Panel — Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** ~95-110 new/modified files (12 plans)
**Analogs found:** 92 / 100 (8 flagged "no exact analog — closest reference for code style: …")

> Companion to `14-CONTEXT.md`, `14-RESEARCH.md`, `14-UI-SPEC.md`. Per-file pattern assignments grouped by Plan number, then by layer (Backend Domain → Backend Infra → Backend Application → Backend API → Backend Tests → Frontend services/hooks → Frontend libs → Frontend primitives → Frontend route pages → Frontend components → Frontend tests → E2E). Excerpts cite real lines from the analog file the planner should imitate. Every divergence (locale boundary, audit emission, RBAC defer, snake_case keys) is called out under "Caveats."
>
> **Snake_case discipline:** Backend ALWAYS ships `extra_metadata.task_title` (snake_case) and frontend `activity-row.tsx` reads `md.task_key` directly per Phase 13 D-D4 + Pitfall 2 — DO NOT camelCase audit metadata in Phase 14.

---

## File Classification

### Plan 14-01 — Wave 0 Fat Shared Infra (BACKEND + FRONTEND, ~30-35 files)

#### Backend Domain (Plan 14-01)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Backend/app/domain/entities/project_join_request.py` (NEW) | entity | n/a | `Backend/app/domain/entities/password_reset_token.py` (lean Pydantic+ConfigDict) and `Backend/app/domain/entities/team.py` (Optional fields + is_deleted absence — join requests are immutable lifecycle rows) | Pydantic BaseModel + `model_config = ConfigDict(from_attributes=True)` + Literal status enum. Fields: id, project_id, requested_by_user_id, target_user_id, status (`pending|approved|rejected|cancelled`), note, reviewed_by_admin_id, reviewed_at, created_at, updated_at. | Use `Literal["pending","approved","rejected","cancelled"]` per RESEARCH §Code Example 2 lines 1043–1058 — NOT a Python Enum (entity stays pure Pydantic). |
| `Backend/app/domain/repositories/project_join_request_repository.py` (NEW) | repository interface | n/a | `Backend/app/domain/repositories/password_reset_repository.py` (3 abstract methods, no extras) and `Backend/app/domain/repositories/audit_repository.py` lines 1–82 (signature shape + Tuple[List, int] for paginated reads) | abc.ABC with `create / get_by_id / list_by_status / update_status` per RESEARCH §Code Example 2 lines 1063–1085. `list_by_status` returns `Tuple[List[ProjectJoinRequest], int]`. | DIP — domain has ZERO sqlalchemy imports. Status param typed as `JoinRequestStatus` Literal (re-export from entity). |
| `Backend/app/domain/repositories/audit_repository.py` (EXTEND) | repository interface | n/a | same file (existing 11 abstract methods) | Add `get_global_audit(date_from, date_to, actor_id, action_prefix, limit, offset) -> Tuple[List[dict], int]` after line 82. Mirrors signature of existing `get_global_activity` (line 73) but with explicit filters + 50k cap awareness. | Same abc.ABC pattern; D-Z2 says backend returns `total = min(actual, 50000)` + `truncated: bool` — encode in dict, not in interface signature. |

#### Backend Infrastructure (Plan 14-01)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Backend/app/infrastructure/database/models/project_join_request.py` (NEW) | SQLAlchemy ORM model | n/a | `Backend/app/infrastructure/database/models/password_reset_token.py` (Mapped/mapped_column + ForeignKey ON DELETE) and `Backend/app/infrastructure/database/models/team.py` (composite ON DELETE behaviors) | `Base + TimestampedMixin` (created_at + updated_at automatic). FK: `project_id` ON DELETE CASCADE; `requested_by_user_id`, `target_user_id`, `reviewed_by_admin_id` ON DELETE SET NULL (preserve historical record per CONTEXT D-A1). Status as `String(20)` with default `"pending"`. | DB column status uses VARCHAR(20), NOT a Postgres enum type — keeps migration simple + matches `projects.status` precedent (Phase 9 BACK-01). |
| `Backend/app/infrastructure/database/repositories/project_join_request_repo.py` (NEW) | repository impl + mapper | CRUD | `Backend/app/infrastructure/database/repositories/team_repo.py` (`SqlAlchemyTeamRepository` lines 12–115 — `_to_entity` helper, `_get_base_query` filter, `add_member` + IntegrityError handling for idempotent inserts, async session.commit/flush pattern) | `_to_entity(model) → ProjectJoinRequest.model_validate(model)`. `list_by_status` does paginated SELECT + COUNT — mirror `audit_repo.get_global_activity` lines 200–255 for the (items, total) tuple shape. `update_status` reads model, mutates, commits — pattern from `team_repo.soft_delete` lines 90–97. | When approving, the repo MUST call `team_repo.add_member(team_id, target_user_id)` via injected dependency OR the use case orchestrates both — planner picks (recommend use-case orchestration). Audit row written by use case, not repo. |
| `Backend/app/infrastructure/database/repositories/audit_repo.py` (EXTEND) | repository impl | aggregation read | same file (existing `get_global_activity` lines 199–255 — same JOIN-on-users + mappings().all() projection pattern) | Add `get_global_audit(...)` method that takes filters and applies WHERE clauses dynamically. Reuse the projection block (lines 237–254) verbatim. For `action_prefix` filter use `AuditLogModel.action.like(f"{prefix}%")`. For `extra_metadata` filters use `AuditLogModel.extra_metadata["key"].astext == value` (line 71 reference). | **Pitfall 7 / 8** (RESEARCH §pitfalls): Python attr is `extra_metadata`; DB column is literally `metadata`. ALWAYS use `["key"].astext` for JSONB filters. **D-Z2:** Cap items returned at 50k; return `truncated=True` boolean alongside total when actual count > 50k. |
| `Backend/app/api/deps/project_join_request.py` (NEW) | DI factory | n/a | `Backend/app/api/deps/audit.py` (full file, 18 lines) and `Backend/app/api/deps/password_reset.py` (full file, 18 lines) | Module-level `get_project_join_request_repo(session=Depends(get_db_session)) → IProjectJoinRequestRepository` returning `SqlAlchemyProjectJoinRequestRepository(session)`. Add `__all__` export. Re-export from `Backend/app/api/dependencies.py` (legacy shim — append at line 40-ish) per existing pattern. | None — boilerplate one-liner DI. |

#### Backend Application (Plan 14-01)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Backend/app/application/dtos/project_join_request_dtos.py` (NEW) | DTO | n/a | `Backend/app/application/dtos/activity_dtos.py` (full file — Pydantic + ConfigDict + List/Optional shape) | `CreateJoinRequestDTO`, `JoinRequestResponseDTO` (id + project + requested_by + target_user nested objects + status + note + created_at), `JoinRequestListDTO` (items + total). Snake_case fields throughout. | Project + user nested objects use small inline Pydantic submodels OR re-use existing `UserListDTO` shape (id/email/username/avatar_url) — planner picks; recommend INLINE submodels for tighter coupling. |
| `Backend/app/application/dtos/admin_user_dtos.py` (NEW) | DTO | n/a | `Backend/app/application/dtos/auth_dtos.py` for `EmailStr` + Pydantic password validators (existing pattern); `Backend/app/application/dtos/activity_dtos.py` for response shape | `InviteUserRequestDTO`, `InviteUserResponseDTO`, `BulkInviteRowDTO` (single row Pydantic — RESEARCH §Pitfall 5: "single source of truth = Pydantic DTO; client validator imitates"), `BulkInviteRequestDTO` (rows: List[BulkInviteRowDTO], max 500), `BulkInviteResponseDTO` (successful + failed lists), `RoleChangeRequestDTO`, `BulkActionRequestDTO`. | Use Pydantic `EmailStr` for email field. Role field: `Literal["Admin","Project Manager","Member"]` — case-insensitive normalization happens in use case, not DTO. **D-B4:** max 500 rows enforced via Pydantic `Field(max_items=500)`. |
| `Backend/app/application/dtos/admin_audit_dtos.py` (NEW) | DTO | n/a | `Backend/app/application/dtos/activity_dtos.py` lines 1–30 (verbatim shape) | Reuse `ActivityItemDTO` shape (12 fields ending with `metadata: Optional[Dict[str, Any]]`). Add wrapper `AdminAuditResponseDTO {items, total, truncated: bool}` to surface D-Z2 50k-cap signal. | **Backward compat (D-D6):** `metadata` field stays optional/nullable; old audit rows render via fallback path on the frontend. |
| `Backend/app/application/dtos/admin_stats_dtos.py` (NEW) | DTO | n/a | `Backend/app/application/dtos/chart_dtos.py` (Phase 13 — composite payload pattern) | `AdminStatsResponseDTO` per RESEARCH §D-A7 lines 107–113: `active_users_trend: List[{date, count}]`, `methodology_distribution: Dict[str, int]`, `project_velocities: List[{project_id, key, name, progress, velocity_history}]`. | Composite payload — single endpoint, single response. NOT N+1 separate endpoints. |
| `Backend/app/application/use_cases/create_join_request.py` (NEW) | use case | write + audit | `Backend/app/application/use_cases/manage_teams.py` (member-add use cases — repo + audit emission pattern) | `CreateJoinRequestUseCase.execute(project_id, requested_by_user_id, target_user_id, note)` → repo.create + audit_repo.create_with_metadata(entity_type="project_join_request", action="created", metadata={project_id, project_key, project_name, target_user_email,...}). | DIP: NO sqlalchemy imports; inject `IProjectJoinRequestRepository` + `IAuditRepository` + `IProjectRepository` (for project name/key lookup). Audit metadata enrichment is part of Plan 14-01 scaffolding (consumed by Plan 14-09). |
| `Backend/app/application/use_cases/approve_join_request.py` (NEW) | use case | write + side-effect + audit | `Backend/app/application/use_cases/execute_phase_transition.py` (multi-repo orchestration + audit emit + transactional intent) | Orchestrates: (a) fetch request, (b) update status to approved, (c) call `team_repo.add_member(team_id, target_user_id)` (idempotent — `team_repo.add_member` lines 65–75 already handles IntegrityError), (d) emit audit `project_join_request.approved`. | **Atomic intent:** if step (c) fails, rollback step (b). Use single async session via DI. |
| `Backend/app/application/use_cases/reject_join_request.py` (NEW) | use case | write + audit | same as approve, simpler | Update status + audit emit. No team membership change. | None — symmetric with approve. |
| `Backend/app/application/use_cases/list_pending_join_requests.py` (NEW) | use case | read | `Backend/app/application/use_cases/get_global_activity.py` (full file, 22 lines — minimal repo wrapper) | Wrap `repo.list_by_status("pending", limit, offset)` → `JoinRequestListDTO`. | DIP only. |
| `Backend/app/application/use_cases/invite_user.py` (NEW) | use case | write + email + audit | `Backend/app/application/use_cases/request_password_reset.py` (token creation + email send pattern) | Create user with `is_active=False` + random hashed password + `PasswordResetToken` (TTL 7 days from new `INVITE_TOKEN_TTL_DAYS` setting per CONTEXT discretion / RESEARCH Runtime State Inventory line 850) + send Phase 5 invite email. Audit `user.invited` with metadata. | **D-B2:** REUSES Phase 2 `PasswordResetToken` entity verbatim — no new token entity. **TTL:** 7d for invites vs 24h for resets — read from `app/core/config.py` extension. |
| `Backend/app/application/use_cases/bulk_invite_user.py` (NEW) | use case | bulk write + per-row report | `Backend/app/application/use_cases/manage_teams.py` member-add use case (per-item loop pattern) | Iterate `BulkInviteRowDTO` list; for each row call `InviteUserUseCase.execute` in a try/except; collect (user_id, status, error?) per row; return `{successful, failed}`. | **D-B4:** Skip-invalid + commit-valid strategy. **Per-user transaction** per RESEARCH §Don't Hand-Roll line 832 ("per-user transaction acceptable"). 500-row hard cap (Pydantic field validation). |
| `Backend/app/application/use_cases/deactivate_user.py` (NEW) | use case | write + audit | `Backend/app/application/use_cases/update_user_profile.py` (single field flip pattern) | Toggle `users.is_active` on/off; emit audit `user.deactivated` or `user.activated` with metadata `{user_id, user_email, requested_by_admin_id}`. | None. |
| `Backend/app/application/use_cases/reset_user_password.py` (NEW) | use case | write + email + audit | `Backend/app/application/use_cases/request_password_reset.py` (full file — token creation + email send) | Identical to user-initiated `/auth/forgot-password` flow but admin-triggered. 24h TTL token + Phase 5 reset email. Audit `auth.password_reset_requested` with `metadata.requested_by_admin_id`. | **D-B3:** REUSES Phase 2 PasswordResetToken; the audit row distinguishes admin-triggered via metadata field. |
| `Backend/app/application/use_cases/change_user_role.py` (NEW) | use case | write + audit | `Backend/app/application/use_cases/manage_projects.py` (single field update + audit emit pattern) | Read user, validate new role ∈ {Admin, Project Manager, Member}, update `users.role_id` → `roles.name` lookup, emit audit `user.role_changed` with `metadata {target_role, source_role, requested_by_admin_id}`. | **D-A2:** Role enum unchanged from Phase 9. NO new role entity (RBAC deferred). System-wide flip only. |
| `Backend/app/application/use_cases/bulk_action_user.py` (NEW) | use case | bulk write + per-user report | `Backend/app/application/use_cases/bulk_invite_user.py` (sister use case, same shape) | Per-user transaction per RESEARCH §Don't Hand-Roll. Returns `[(user_id, status, error?)]`. Audit row per user. | **D-B7:** Atomic intent at the per-user level (NOT bulk all-or-none). |
| `Backend/app/application/use_cases/get_global_audit.py` (NEW) | use case | read | `Backend/app/application/use_cases/get_global_activity.py` (full file, 22 lines — minimal repo wrapper + DTO conversion) | Wrap `audit_repo.get_global_audit(filters, limit, offset)` → `AdminAuditResponseDTO` with `truncated` flag. | DIP. |
| `Backend/app/application/use_cases/get_admin_stats.py` (NEW) | use case | read + asyncio.gather | `Backend/app/application/use_cases/get_user_summary.py` (full file — `asyncio.gather` of 3 independent reads, then assemble composite DTO) | Three async tasks in parallel: (a) `audit_repo.active_users_trend(days=30)`, (b) `project_repo.methodology_distribution()`, (c) `project_repo.list_recent + project_iteration aggregation` (Phase 13 reuse). Assemble `AdminStatsResponseDTO`. | **D-X2:** Active users SQL is on-the-fly; document scaling cliff in code comment. **D-X4:** Cap velocity list at top 30 by recent activity (DoS guard). |
| `Backend/app/application/use_cases/generate_admin_summary_pdf.py` (NEW) | use case | read + PDF gen | Phase 12 fpdf2 pattern in `Backend/app/api/v1/reports.py` lines 180–247 (FPDF setup + UNICODE_FONT + A4 layout + StreamingResponse) | Compose 1-page admin summary: user count + delta, project count, top 5 most-active projects, top 5 most-active users (per CONTEXT D-B6 / Discretion). Returns `BytesIO` for `StreamingResponse`. | **D-B6:** Rate-limited 30s same as Phase 12 D-58 — apply slowapi `@limiter.limit("1/30seconds")` decorator at router level (NOT in use case). |
| `Backend/app/api/dependencies.py` (EXTEND legacy shim) | wiring | n/a | same file lines 22–39 (existing `from app.api.deps.X import get_X_repo  # noqa: F401` pattern) | Append `from app.api.deps.project_join_request import get_project_join_request_repo  # noqa: F401`. | None. |

#### Backend API (Plan 14-01)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Backend/app/api/v1/admin_join_requests.py` (NEW) | router | RW | `Backend/app/api/v1/admin_settings.py` (full file, 33 lines — APIRouter + `Depends(require_admin)` on every handler + DI inject + use case execute) | 4 endpoints: `GET /admin/join-requests?status=pending&limit&offset` (admin list), `POST /admin/join-requests/{id}/approve`, `POST /admin/join-requests/{id}/reject`, `POST /projects/{id}/join-requests` (PM-side create). Last endpoint uses `require_project_transition_authority` (Phase 9 D-15) instead of `require_admin`. | The PM-side create endpoint sits under `/projects/{id}/...` namespace; planner registers it on the existing projects router OR a separate `project_join_requests.py` module — preferred: existing projects router for proximity to Team/membership endpoints. |
| `Backend/app/api/v1/admin_users.py` (NEW) | router | RW | `Backend/app/api/v1/admin_settings.py` + `Backend/app/api/v1/users.py` (existing user endpoints — UserListDTO shape) | 7 endpoints: `POST /admin/users` (invite), `PATCH /admin/users/{id}/role`, `PATCH /admin/users/{id}/deactivate`, `POST /admin/users/{id}/password-reset`, `POST /admin/users/bulk-invite`, `POST /admin/users/bulk-action`, `GET /admin/users.csv`. EVERY handler `Depends(require_admin)`. | **D-W3:** CSV export = `StreamingResponse` with `Content-Disposition: attachment; filename="users-{date}.csv"` and UTF-8 BOM (`U+FEFF` prefix for Excel). Mirror `Backend/app/api/v1/reports.py` line 246. |
| `Backend/app/api/v1/admin_audit.py` (NEW) | router | read | `Backend/app/api/v1/activity.py` (full file — `Depends(require_admin)`, `type[]` Query alias pattern, paginated DTO response) and RESEARCH §Pattern 5 lines 757–807 (verbatim skeleton) | 2 endpoints: `GET /admin/audit?date_from&date_to&actor_id&action_prefix&limit=50&offset=0` and `GET /admin/audit.json` (filter-aware JSON-array stream). | **D-Z2:** Default `limit=50, ge=1, le=100`. **D-B8:** JSON export hard-capped 50k rows; recommend JSON-array (not NDJSON) for ≤10k rows. |
| `Backend/app/api/v1/admin_stats.py` (NEW) | router | read | `Backend/app/api/v1/charts.py` (Phase 13 — composite read endpoint, admin-conditional gating via `Depends(require_admin)`) | `GET /admin/stats` returns `AdminStatsResponseDTO`. Single endpoint = single use case = composite payload. | **D-X2:** TanStack Query `staleTime: 60s` on the frontend; backend has no internal cache layer in v2.0. |
| `Backend/app/api/v1/admin_summary.py` (NEW) | router | read + PDF | `Backend/app/api/v1/reports.py` lines 240–256 (StreamingResponse PDF download with rate limit) | `GET /admin/summary.pdf` → calls `GenerateAdminSummaryPDFUseCase` → `StreamingResponse(BytesIO(pdf_bytes), media_type="application/pdf")`. | **D-B6:** Rate-limit `@limiter.limit("1/30seconds")` per Phase 12 D-58. |
| `Backend/app/api/main.py` (EXTEND) | wiring | n/a | same file lines 156–177 (existing router include pattern) | Append 5 new admin router includes after line 158 (`admin_settings_router_module`): `admin_join_requests`, `admin_users`, `admin_audit`, `admin_stats`, `admin_summary` — all with prefix `/api/v1` and tag `Admin`. | The `process_templates` router stays unchanged (workflows tab READS from it). |

#### Backend Migration (Plan 14-01)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Backend/alembic/versions/006_phase14_admin_panel.py` (NEW) | migration | n/a | `Backend/alembic/versions/005_phase9_schema.py` (full upgrade/downgrade idempotent helpers + `_table_exists`/`_column_exists`/`_index_exists` utilities lines 39–97) | Single new table `project_join_requests` (id, project_id FK CASCADE, requested_by_user_id FK SET NULL, target_user_id FK SET NULL, status VARCHAR(20) DEFAULT 'pending', note TEXT, reviewed_by_admin_id FK SET NULL, reviewed_at, created_at, updated_at). Indexes: `(status, created_at DESC)` for pending list query. | **Idempotent:** copy `_table_exists` + `_index_exists` helpers verbatim from 005 lines 43–97. **D-A2:** NO RBAC tables — keep migration tight. |

#### Backend Tests (Plan 14-01)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Backend/tests/integration/test_create_join_request.py` (NEW) | integration test | n/a | `Backend/tests/integration/test_user_activity.py` (Phase 12 D-09 in-memory fakes pattern, full file — `FakePrivacyFilteredAuditRepo` shape lines 31–78) | In-memory `FakeProjectJoinRequestRepository` + `FakeAuditRepository`. Test create + capture audit emission + assert metadata fields. | Phase 12 D-09 in-memory fakes — NO database in unit tests. Use `pytest.mark.asyncio`. |
| `Backend/tests/integration/test_approve_join_request.py` (NEW) | integration test | n/a | same | Add fake `team_repo` to verify `add_member` is called on approve. | Atomic intent — assert that an `add_member` failure leaves status as `pending` (rollback semantic). |
| `Backend/tests/integration/test_admin_users_crud.py` (NEW) | integration test | n/a | `Backend/tests/integration/test_activity.py` (full file — `authenticated_client(role="admin")` fixture, 401/403 assertions for non-admin) | Cover 7 endpoints. Each: admin-200, member-403, unauthenticated-401. Bulk-invite: feed mixed valid/invalid CSV, assert `successful + failed` lists. | **Pitfall 5:** Test that the same bad CSV row fails identically against both client validator (UI test) and server-side Pydantic. |
| `Backend/tests/integration/test_admin_audit_get_global.py` (NEW) | integration test | n/a | `Backend/tests/integration/test_activity.py` (admin-only access pattern) + `test_user_activity.py` (filter assertions) | Test filters: date range, actor, action_prefix. **Test 50k cap behavior** — seed > 50k rows via fake repo and assert `truncated=True` per Pitfall 6. | Test JSONB filter syntax via `extra_metadata.project_id` filter — assert non-zero hit count (Pitfall 7 mitigation). |
| `Backend/tests/integration/test_admin_stats.py` (NEW) | integration test | n/a | `Backend/tests/integration/test_charts.py` (Phase 13 — composite read with multiple sub-queries) | Validate composite response shape: 3 keys + correct types + correct counts. | None. |
| `Backend/tests/integration/test_generate_admin_summary_pdf.py` (NEW) | integration test | n/a | `Backend/tests/integration/test_charts.py` for setup; `Backend/app/api/v1/reports.py` PDF byte assertions inferred | Assert response has `Content-Type: application/pdf` + `Content-Disposition: attachment` + body starts with `%PDF`. | Skip if Unicode font not available locally — use Helvetica fallback (line 192). |

#### Frontend Services + Hooks (Plan 14-01)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Frontend2/services/admin-join-request-service.ts` (NEW) | service | RW | `Frontend2/services/profile-service.ts` (snake_case → camelCase mapper pattern lines 56–71 + service object lines 116–166) and RESEARCH §Common Op 1 lines 970–1016 (verbatim service shape) | Snake → camel mapper for nested `requestedBy`/`targetUser` (RESEARCH lines 996–1005 maps `requested_by` → `requestedBy`). 3 methods: `listPending`, `approve`, `reject`. | **Snake_case discipline:** keys staying snake (`created_at`, `id`) vs camelized (`requestedBy`) — match Phase 13 profile-service. |
| `Frontend2/services/admin-user-service.ts` (NEW) | service | RW | `Frontend2/services/profile-service.ts` (mapper + service object) and RESEARCH §Pattern 4 lines 689–723 (verbatim invite shape) | 7 methods: `invite`, `bulkInvite`, `deactivate`, `resetPassword`, `changeRole`, `bulkAction`, `list`, `exportCsv`. CSV export uses anchor tag download trigger (D-W3 server-side). | **D-W3:** CSV export = anchor `<a href={url} download>` simulation; do NOT load CSV bytes into JS memory. Open URL via `window.location` or hidden link click. |
| `Frontend2/services/admin-audit-service.ts` (NEW) | service | read | `Frontend2/services/activity-service.ts` (full file — `buildActivityQuery` manual-pair builder + paginated response) | Reuse `ActivityItem` shape + add `truncated: boolean` to response. Filter params: `date_from`, `date_to`, `actor_id`, `action_prefix`, `limit`, `offset`. | **Pitfall 6:** Frontend MUST read `truncated` and render AlertBanner above the table when true. |
| `Frontend2/services/admin-stats-service.ts` (NEW) | service | read | `Frontend2/services/chart-service.ts` (Phase 13 — composite payload reader, snake → camel for nested objects) | Single `getStats()` returning composite `{activeUsersTrend, methodologyDistribution, projectVelocities}`. Snake → camel for nested keys. | None. |
| `Frontend2/hooks/use-pending-join-requests.ts` (NEW) | hook | read | `Frontend2/hooks/use-user-summary.ts` (full file, 18 lines — minimal `useQuery` + staleTime) and RESEARCH §Common Op 1 lines 1019–1031 (verbatim) | `useQuery` with `queryKey: ["admin","join-requests","pending",{limit}]`, `staleTime: 30 * 1000` (D-W1), `refetchOnWindowFocus: true`. | None. |
| `Frontend2/hooks/use-approve-join-request.ts` (NEW) | hook | mutation | `Frontend2/hooks/use-projects.ts` lines 44–58 (`useUpdateProjectStatus` — mutation + invalidate + onSettled) | `useMutation` with `mutationFn: adminJoinRequestService.approve`, `onSettled: invalidate ["admin","join-requests"]`. **Optimistic update** per CONTEXT D-W2. | **D-W2:** Optimistic update on approve/reject for snappy UX. Failure → revert + Toast retry. |
| `Frontend2/hooks/use-reject-join-request.ts` (NEW) | hook | mutation | same as approve | symmetric | symmetric |
| `Frontend2/hooks/use-admin-users.ts` (NEW) | hook | read | `Frontend2/hooks/use-projects.ts` `useProjects` lines 6–11 + `useProjectMembers` lines 31–42 (filtered list pattern) | `queryKey: ["admin","users",{role,status,q}]`. Filter params encoded into key for cache distinction. | None. |
| `Frontend2/hooks/use-invite-user.ts` (NEW) | hook | mutation | `Frontend2/hooks/use-projects.ts` `useCreateProject` lines 61–69 + RESEARCH §Pattern 4 lines 727–747 (verbatim) | `useMutation` + `onSuccess: invalidate ["admin","users"] + Toast`. Pattern verbatim from RESEARCH. | **Pitfall 2:** Use Toast `tone: "success"` with the email that was invited. Use Toast `tone: "danger"` with `err?.response?.data?.detail` on error. |
| `Frontend2/hooks/use-bulk-invite.ts` (NEW) | hook | mutation | same `useInviteUser` shape but takes a `BulkInviteRequest` and returns the `{successful, failed}` summary | `useMutation` with `onSuccess` showing summary modal (Plan 14-03). | **D-B4:** Final summary modal pattern — caller renders the modal, hook just returns the data. |
| `Frontend2/hooks/use-deactivate-user.ts` (NEW) | hook | mutation | `Frontend2/hooks/use-projects.ts` `useUpdateProjectStatus` (single-field flip + invalidate) | `onSettled` invalidate `["admin","users"]`. | None. |
| `Frontend2/hooks/use-reset-password.ts` (NEW) | hook | mutation | same shape as `useInviteUser` | Toast on success: "Şifre sıfırlama bağlantısı gönderildi: {email}". | None. |
| `Frontend2/hooks/use-change-role.ts` (NEW) | hook | mutation | same shape | Optimistic update per CONTEXT D-W2 only for bulk-role-change; single-user is confirmation toast. | None. |
| `Frontend2/hooks/use-bulk-action.ts` (NEW) | hook | mutation | same shape, batched | Optimistic per D-W2. Show summary toast `{success_count}/{total}` after server response. | None. |
| `Frontend2/hooks/use-admin-audit.ts` (NEW) | hook | read | `Frontend2/hooks/use-user-activity.ts` (full file — filter param pattern + `refetchOnWindowFocus`) | `queryKey: ["admin","audit",filter]`. Filter object encoded into key for cache distinction. | None. |
| `Frontend2/hooks/use-admin-stats.ts` (NEW) | hook | read | `Frontend2/hooks/use-user-summary.ts` (minimal useQuery + staleTime) | `staleTime: 60 * 1000` per CONTEXT Discretion (active users compute is expensive). | None. |

#### Frontend Libs + Primitives (Plan 14-01)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Frontend2/lib/admin/permissions-static.ts` (NEW) | utility | pure constant | `Frontend2/lib/methodology-matrix.ts` (constant table + helper, role-match) | Static map: 14 permission rows × 4 role columns (Admin/PM/Member/Guest) per UI-SPEC §Permissions surface. Each cell is a tri-state: `"granted" | "denied" | "n/a"`. | **D-A3:** This is a placeholder for v3.0. Toggle interactions disabled in UI. |
| `Frontend2/lib/admin/audit-field-labels.ts` (NEW) | utility | pure mapping | `Frontend2/lib/methodology-matrix.ts` (constant table + locale lookup) | TR/EN dict: `{due_date: {tr:"son tarih", en:"due date"}, priority: {...}, story_points: {...}, ...}`. Helper `getFieldLabel(name, lang)`. | **D-D4:** Fold into ActivityRow's render branches; OCP — extend the map without touching the renderer. |
| `Frontend2/lib/admin/csv-parse.ts` (NEW) | utility | pure parsing | RESEARCH §Don't Hand-Roll line 824 (papaparse@^5.5.3 chosen) — no existing analog | Wrap papaparse with `parseBulkInviteCsv(file: File): Promise<BulkInviteRow[]>`. Validate per row: email regex, role enum, name length. Return `{rows, errors}`. | **Pitfall 5:** Validation rules MUST mirror backend Pydantic exactly. Recommend extracting JSON schema from Pydantic at build time OR keeping the validators trivially symmetric and unit-testing both sides with the same fixture. |
| `Frontend2/lib/admin/csv-export.ts` (NEW) | utility | nav | no analog — closest reference for code style: `Frontend2/services/profile-service.ts` lines 153–166 (apiClient.get returning data — but this util just creates an anchor) | `downloadCsv(url: string, filename?: string)`: create hidden `<a href={url} download={filename}>`, click, remove. **NO** in-browser CSV assembly per D-W3. | None. |
| `Frontend2/components/primitives/nav-tabs.tsx` (NEW) | primitive | nav | `Frontend2/components/primitives/tabs.tsx` (full file, 92 lines — visual API + PAD_MAP/FONT_MAP + active state styling) and RESEARCH §Pattern 1 lines 494–555 (verbatim implementation) | Wraps Next `<Link>` instead of `<button onClick>`. Active detection via `usePathname()` with **special-case `/admin` overview guard** per RESEARCH line 524–527. | **Pitfall 4:** `/admin` (Overview) tab MUST NOT show active when on `/admin/users`. Test all 8 paths via unit test. **AGENTS.md "This is NOT the Next.js you know":** read `Frontend2/node_modules/next/dist/docs/` for `usePathname` and `Link` API before coding. |
| `Frontend2/components/primitives/modal.tsx` (NEW) | primitive | overlay | `Frontend2/components/projects/confirm-dialog.tsx` (overlay + panel + ESC handler — full file, 38 lines) and RESEARCH §Pattern 2 lines 569–625 (verbatim) | `Modal + ModalHeader + ModalBody + ModalFooter` slot pattern. Z-index 1000. ESC + click-outside dismiss. | **Reuse — not duplicate:** ConfirmDialog stays separate (different ergonomics — title/body/buttons hard-coded). Modal is for AddUser / BulkInvite / AuditFilter / PendingRequests. |
| `Frontend2/components/primitives/index.ts` (EXTEND barrel export) | wiring | n/a | same file (existing 19 named export blocks, lines 5–60) | Append `export { NavTabs } from "./nav-tabs"; export type { NavTabItem, NavTabsProps } from "./nav-tabs";` AND `export { Modal, ModalHeader, ModalBody, ModalFooter } from "./modal"; export type { ModalProps } from "./modal";`. | None. |
| `Frontend2/components/projects/confirm-dialog.tsx` (EXTEND with `tone` prop) | primitive | overlay | same file (full existing — 38 lines) and RESEARCH §Pattern 3 lines 637–678 (verbatim diff) | Add optional `tone?: "primary" | "danger" | "warning"` (default `"primary"`). Switch icon (AlertTriangle for danger, AlertCircle for warning) and Button variant. | **Backward compat:** Phase 10/11/12 callers (no `tone` prop) → defaults to `"primary"` → renders identically. Verify by NOT modifying any existing call site. |

---

### Plan 14-02 — Admin Layout + Overview tab (~8-10 files)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Frontend2/app/(shell)/admin/layout.tsx` (NEW) | route layout | n/a | `Frontend2/app/(shell)/layout.tsx` (full file, 30 lines — shell layout pattern) for the wrapper shape; `Frontend2/components/dashboard/activity-feed.tsx` lines 74–86 for `<DataState/>` consumption pattern | Client component (`"use client"`). Reads `useAuth()` → check `isLoading` first, then `role`. If unauthenticated → `router.replace("/auth/login?next=/admin")`. If !admin → `router.replace("/dashboard")` + Toast. Renders `<PageHeader>` (Shield icon + "Yönetim Konsolu" + Rapor al / Denetim günlüğü buttons) + `<NavTabs tabs={[...8 tabs]}/>` + `{children}`. | **Pitfall 3:** Check `isLoading` FIRST before role check. **Pitfall 10:** Plan 14-02 acceptance includes `Frontend2/middleware.ts` matcher edit (see below). **AGENTS.md:** Verify Next 16 app-router layout API in local docs. |
| `Frontend2/middleware.ts` (EXTEND) | middleware | n/a | same file (full existing, 23 lines) | Append `'/admin/:path*'` to the `matcher` array on line 15. | **Pitfall 10:** Without this, `/admin/*` is accessible without login (brief flash of admin content for unauthenticated users). |
| `Frontend2/app/(shell)/admin/page.tsx` (NEW — Overview tab content) | route page | read | `Frontend2/app/(shell)/users/[id]/page.tsx` (full file, 220 lines — shell page composition + DataState + StatCard grid + Tabs primitive) | Compose: 5 StatCards row (uses `Frontend2/components/dashboard/stat-card.tsx` verbatim) + Pending Join Requests panel (top 5 + "Tümünü gör" modal) + Role distribution chart + Recent admin events list (uses extended ActivityRow with `variant="admin-table"` from Plan 14-10). | **CONTEXT D-C6:** Overview is the default sub-tab — its bundle should stay small. Lazy-load chart components via Next dynamic imports per CONTEXT line 156. |
| `Frontend2/components/admin/overview/stat-cards.tsx` (NEW) | component | read | `Frontend2/app/(shell)/users/[id]/page.tsx` lines 158–198 (3-StatCard grid pattern with aria-label wrappers) | 5-card grid. Cards: Users / Active Projects / Pending / Templates / Storage per CONTEXT phase boundary line 13. | None. |
| `Frontend2/components/admin/overview/pending-requests-card.tsx` (NEW) | component | RW | `Frontend2/components/dashboard/activity-feed.tsx` (DataState empty/loading + scrollable list pattern) | Top-5 list + "Tümünü gör" button → opens `<PendingRequestsModal/>`. Each row: Avatar + project + target user + Approve / Reject buttons (uses `useApproveJoinRequest` + `useRejectJoinRequest` from Plan 14-01 hooks). | **D-W2:** Optimistic update on approve/reject. |
| `Frontend2/components/admin/overview/role-distribution.tsx` (NEW) | component | read | `Frontend2/components/dashboard/methodology-card.tsx` (existing donut/pie chart wrapper — recharts) | Donut chart of role counts from admin user list aggregate. | None. |
| `Frontend2/components/admin/overview/recent-admin-events.tsx` (NEW) | component | read | `Frontend2/components/dashboard/activity-feed.tsx` (full file — DataState + scrollable list) | Last 10 admin-relevant events from audit. Uses `<ActivityRow variant="admin-table"/>` (Plan 14-10 will deliver the variant). | Plan 14-02 stubs `variant="admin-table"` — Plan 14-10 fills in the render branches. |
| `Frontend2/components/admin/overview/pending-requests-modal.tsx` (NEW) | component | RW | `Frontend2/components/projects/confirm-dialog.tsx` overlay + Plan 14-01 `<Modal/>` primitive | Use `<Modal width={680}>` + `<ModalHeader>Tüm Bekleyen Talepler</ModalHeader>` + paginated list + `<ModalFooter>Kapat</ModalFooter>`. | None. |

---

### Plan 14-03 — `/admin/users` (Kullanıcılar tab, ~10-12 files)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Frontend2/app/(shell)/admin/users/page.tsx` (NEW) | route page | RW | `Frontend2/app/(shell)/users/[id]/page.tsx` (composition pattern) + `Frontend2/app/(shell)/projects/page.tsx` (table + filter pattern — needs verification but well-established) | Compose `<UsersToolbar/>` + `<UsersTable/>` + `<UserBulkBar/>` + modals. localStorage filter persistence per CONTEXT D-C5 (`spms.admin.users.filter`). | **Phase 11 D-21 localStorage pattern** referenced in CONTEXT. |
| `Frontend2/components/admin/users/users-toolbar.tsx` (NEW) | component | nav | `Frontend2/components/projects/project-card.tsx` lines 168–197 (3-dot MoreH menu) for the action buttons row pattern | Search input + role filter SegmentedControl + 3 buttons (Add User / Bulk Invite / CSV Export). | None. |
| `Frontend2/components/admin/users/users-table.tsx` (NEW) | component | read | `Frontend2/components/dashboard/portfolio-table.tsx` (existing table — needs verification) | Columns: checkbox / Avatar+name / email / role badge / status badge / last_active / MoreH. | None. |
| `Frontend2/components/admin/users/user-row.tsx` (NEW) | component | nav | `Frontend2/components/projects/project-card.tsx` lines 167–197 (MoreH menu pattern verbatim) | Each row exposes MoreH with Deactivate / Reset password / Role change / Delete. | None. |
| `Frontend2/components/admin/users/user-row-actions.tsx` (NEW) | component | RW | `Frontend2/components/projects/project-card.tsx` lines 167–197 (verbatim) — RESEARCH §Don't Hand-Roll line 830 ("Build `Frontend2/components/admin/more-menu.tsx` once, reuse 5 places") | If planner builds the shared `more-menu.tsx` primitive, lift this from project-card and reuse here. Otherwise inline. | Recommend **shared `more-menu.tsx`** under `components/admin/` — 5 reuse sites planned (Users, Projects, Templates, Pending request, Audit). |
| `Frontend2/components/admin/users/user-bulk-bar.tsx` (NEW) | component | RW | no exact analog — closest style: `Frontend2/components/dashboard/portfolio-table.tsx` (table toolbar pattern) | Sticky bar showing "{N} kullanıcı seçildi" + Bulk Deactivate / Bulk Role Change buttons. | **D-W2:** Bulk actions use optimistic updates. |
| `Frontend2/components/admin/users/add-user-modal.tsx` (NEW) | component | RW | Plan 14-01 `<Modal/>` primitive + `Frontend2/services/admin-user-service.ts` `useInviteUser` | Form: email + role + name (optional). On submit: `useInviteUser.mutate()` → close + Toast. | **Pydantic mirror:** validate email + role enum on the client matching backend DTO (Pitfall 5). |
| `Frontend2/components/admin/users/bulk-invite-modal.tsx` (NEW) | component | RW | Plan 14-01 `<Modal/>` + `Frontend2/lib/admin/csv-parse.ts` | File picker → preview table (rows + per-row validation status) → Submit calls `useBulkInvite.mutate()` → final summary modal. | **D-B4:** 500-row cap on client AND server. **Pitfall 5:** preview validation must match server validation exactly. |
| `Frontend2/components/admin/users/users-table.test.tsx` (NEW) | RTL test | n/a | `Frontend2/components/lifecycle/evaluation-report-card.test.tsx` (Phase 12 RTL pattern with vi.mock for hooks) | Test: row render / bulk select / MoreH actions trigger correct hooks. | None. |
| `Frontend2/components/admin/users/add-user-modal.test.tsx` (NEW) | RTL test | n/a | same | Test: form submit / validation errors / Toast on success. | None. |

---

### Plan 14-04 — `/admin/roles` + `/admin/permissions` placeholder tabs (~4-6 files)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Frontend2/app/(shell)/admin/roles/page.tsx` (NEW) | route page | read | `Frontend2/app/(shell)/users/[id]/page.tsx` (composition shape) | Static 3-column grid: Admin / PM / Member cards (real user counts from `useAdminUsers()` aggregate) + Guest disabled card + "Yeni rol oluştur" disabled card. Card descriptions per CONTEXT D-A5 (system-wide vs project-scoped clarification). | **D-Y1:** Display-only. **Disabled cards:** `cursor: not-allowed` + tooltip "v3.0'da gelecek". |
| `Frontend2/components/admin/roles/role-card.tsx` (NEW) | component | read | `Frontend2/components/dashboard/stat-card.tsx` (Card + tone slot pattern) | Card with role icon + name + description + user count + (Düzenle button — disabled with tooltip). | **D-A4:** Düzenle button disabled. |
| `Frontend2/components/admin/roles/new-role-placeholder-card.tsx` (NEW) | component | n/a | `Frontend2/components/dashboard/stat-card.tsx` (Card primitive) | Dashed-border placeholder with v3.0 badge + tooltip. | **D-A4:** click-handler no-op. |
| `Frontend2/app/(shell)/admin/permissions/page.tsx` (NEW) | route page | read | `Frontend2/app/(shell)/users/[id]/page.tsx` (page composition) | Permission Matrix grid 14×4 with disabled toggles + "v3.0" badge in card header + page-level AlertBanner per CONTEXT D-A3. | **D-A3:** Toggles `disabled` AND `aria-disabled="true"` AND tooltip. Multiple defenses against accidental click handlers in v3.0. |
| `Frontend2/components/admin/permissions/permission-matrix-card.tsx` (NEW) | component | read | `Frontend2/components/primitives/toggle.tsx` (existing) for the disabled toggle render; `Frontend2/lib/admin/permissions-static.ts` (Plan 14-01) for the data | Read-only matrix render. Each cell shows tri-state via Badge tone (`success` / `danger` / `neutral`). | None. |
| `Frontend2/components/admin/permissions/permission-row.tsx` (NEW) | component | read | same | Table row: permission name + 4 disabled toggles. | None. |

---

### Plan 14-05 — `/admin/projects` (Projeler tab, ~5-7 files)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Frontend2/app/(shell)/admin/projects/page.tsx` (NEW) | route page | RW | `Frontend2/app/(shell)/projects/page.tsx` (existing project list page) | Reuse existing `useProjects()` hook + add `include_archived=true` query param. Per-row MoreH = Archive (existing endpoint) + Delete (existing soft-delete). | **D-B5:** NO transfer-ownership menu item. Only Archive + Delete. |
| `Frontend2/components/admin/projects/admin-projects-table.tsx` (NEW) | component | read | `Frontend2/components/dashboard/portfolio-table.tsx` (existing project table) | Columns: key / name / methodology / lead / tasks / progress / created. CSV export server-side. | None. |
| `Frontend2/components/admin/projects/admin-project-row.tsx` (NEW) | component | nav | `Frontend2/components/projects/project-card.tsx` lines 167–197 (MoreH pattern) | Single row + actions via `<UserRowActions/>` reuse OR shared `more-menu.tsx`. | None. |
| `Frontend2/components/admin/projects/admin-project-row-actions.tsx` (NEW) | component | RW | same | MoreH with Archive + Delete. ConfirmDialog `tone="danger"` for Delete. | **Plan 14-01:** Uses extended ConfirmDialog `tone="danger"` (RESEARCH §Pattern 3). |

---

### Plan 14-06 — `/admin/workflows` (Şablonlar tab, ~4-5 files)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Frontend2/app/(shell)/admin/workflows/page.tsx` (NEW) | route page | read | `Frontend2/app/(shell)/projects/page.tsx` (list page composition) | Card grid reading `GET /api/v1/process-templates`. Reuses existing `useProcessTemplates()` from `Frontend2/hooks/use-projects.ts` lines 113–119. | None — Phase 14 doesn't modify the process-templates endpoint. |
| `Frontend2/components/admin/workflows/admin-template-card.tsx` (NEW) | component | nav | `Frontend2/components/projects/project-card.tsx` (full structure — Card + MoreH pattern) | Card per template + MoreH = Edit (router.push to `/workflow-editor?templateId={id}`), Clone, Delete (ConfirmDialog `tone="danger"`). | None. |
| `Frontend2/components/admin/workflows/template-row-actions.tsx` (NEW) | component | RW | `Frontend2/components/projects/project-card.tsx` lines 167–197 | Uses shared `more-menu.tsx` if built; otherwise inline. | None. |

---

### Plan 14-07 — `/admin/audit` (Audit tab, ~8-10 files)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Frontend2/app/(shell)/admin/audit/page.tsx` (NEW) | route page | read | `Frontend2/app/(shell)/users/[id]/page.tsx` (?tab= URL pattern is replaced here by query-param filters per CONTEXT D-C5) | Reads filters from `useSearchParams()`; renders `<AdminAuditToolbar/>` + `<AdminAuditTable/>` + `<AdminAuditPagination/>`. | **D-Z2:** Pagination via offset, page size 25/50/100. **Pitfall 6:** Render AlertBanner on `truncated=true`. |
| `Frontend2/components/admin/audit/admin-audit-toolbar.tsx` (NEW) | component | nav | `Frontend2/components/projects/project-card.tsx` MoreH + Plan 14-01 `<Modal/>` primitive | "Filtre" button opens `<AuditFilterModal/>`. "JSON İndir" calls `csv-export.ts` for server endpoint. Active filter chips inline. | **Discretion (CONTEXT):** Default = anchored popover for Filter; planner picks. |
| `Frontend2/components/admin/audit/audit-filter-modal.tsx` (NEW) | component | RW | Plan 14-01 `<Modal/>` primitive + `Frontend2/components/primitives/input.tsx` | Form: date range pickers + actor selector + action prefix dropdown. On submit: `router.replace` with new query params. | None. |
| `Frontend2/components/admin/audit/admin-audit-table.tsx` (NEW) | component | read | `Frontend2/components/dashboard/activity-feed.tsx` (DataState + scrollable list) | Columns: Time / Actor / Action / Detay (uses `<ActivityRow variant="admin-table"/>` from Plan 14-10). | **D-Z1:** NO `risk` column. Detay column carries Jira-style human-readable line. |
| `Frontend2/components/admin/audit/admin-audit-row.tsx` (NEW — table-row variant) | component | read | `Frontend2/components/activity/activity-row.tsx` (full existing — Plan 14-10 will add `variant="admin-table"` variant) | Compact single-line render — no avatar bubble, time on right, Detay column shows the Jira-style metadata line. | **Pitfall 1 / 9:** Plan 14-10 must extend the mapper + chip function in lockstep. |
| `Frontend2/components/admin/audit/admin-audit-pagination.tsx` (NEW) | component | nav | `Frontend2/components/dashboard/portfolio-table.tsx` (existing table) | Page-size selector (25/50/100) + Sayfa N / M + Prev/Next. Resets offset to 0 on filter change. | **Pitfall 6:** Use capped `total` for math; render AlertBanner separately when `truncated`. |

---

### Plan 14-08 — `/admin/stats` (İstatistik tab, ~6-8 files)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Frontend2/app/(shell)/admin/stats/page.tsx` (NEW) | route page | read | `Frontend2/app/(shell)/reports/page.tsx` (existing reports route — needs verification but Phase 13 chart compositions are the model) | Reads `useAdminStats()`; lazily mounts 3 chart components via Next dynamic import (CONTEXT D-C6). | **D-X2/X4:** Stats refresh policy `staleTime: 60s` per CONTEXT Discretion. |
| `Frontend2/components/admin/stats/active-users-trend-chart.tsx` (NEW) | component | read | `Frontend2/components/dashboard/methodology-card.tsx` (existing recharts wrapper) | recharts `<LineChart>` over 30-day window. Tooltip shows daily count per CONTEXT Discretion. | **D-X2:** Document scaling cliff in code comment (~10k events/day breaks compute). |
| `Frontend2/components/admin/stats/methodology-bars.tsx` (NEW) | component | read | `Frontend2/components/dashboard/methodology-card.tsx` (recharts BarChart pattern) | Bar chart of methodology distribution. | None. |
| `Frontend2/components/admin/stats/velocity-cards-grid.tsx` (NEW) | component | read | `Frontend2/components/dashboard/portfolio-table.tsx` (grid of project cards — needs verification) | Grid of mini-bar velocity cards (top 30 projects). | **D-X4:** Top 30 cap. |
| `Frontend2/components/admin/stats/velocity-mini-bar.tsx` (NEW) | component | read | `Frontend2/components/primitives/progress-bar.tsx` (existing) | Single project's velocity history mini bar chart. | None. |

---

### Plan 14-09 — Backend Audit-Log Enrichment Cross-Cutting (~7-9 files)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Backend/app/infrastructure/database/repositories/task_repo.py` (PATCH) | repository (PATCH audit emission) | write + audit | same file existing audit emission sites + `Backend/app/infrastructure/database/repositories/audit_repo.py` line 71 (`extra_metadata["key"].astext` syntax) | At each `audit_repo.create_with_metadata` call, populate `metadata` with `{task_id, task_key, task_title, project_id, project_key, project_name, field_name, old_value_label, new_value_label}` per CONTEXT D-D2. For `column_id` changes, look up `BoardColumn.name` at write time. | **Pitfall 8:** Python attr `extra_metadata`; DB column `metadata`. **D-D6:** Old rows graceful-degrade — DON'T backfill. **Pitfall 1:** New metadata fields must NOT shadow old branch logic in mapper. |
| `Backend/app/infrastructure/database/repositories/project_repo.py` (PATCH) | repository (PATCH) | write + audit | same as task_repo | Status / archive / methodology change → enriched metadata. | None. |
| `Backend/app/application/use_cases/manage_comments.py` (PATCH) | use case (PATCH) | write + audit | existing audit_repo callers | Comment events: `{task_id, task_key, task_title, comment_id, comment_excerpt (160-char with ellipsis)}`. | **D-D2 NEVER** store full comment body in audit_log (PII guardrail). |
| `Backend/app/application/use_cases/manage_milestones.py` (PATCH) | use case (PATCH) | write + audit | same | `{milestone_id, milestone_title, project_id, project_key, status_old?, status_new?}`. | None. |
| `Backend/app/application/use_cases/manage_artifacts.py` (PATCH) | use case (PATCH) | write + audit | same | `{artifact_id, artifact_name, project_id, project_key, status_old?, status_new?}`. | None. |
| `Backend/app/application/use_cases/manage_phase_reports.py` (PATCH) | use case (PATCH) | write + audit | same | `{report_id, project_id, project_key, source_phase_id, source_phase_name}`. | None. |
| `Backend/tests/integration/test_audit_log_enrichment.py` (NEW) | integration test | n/a | `Backend/tests/integration/test_user_activity.py` (in-memory fakes) + `test_audit_event_mapper.py` (existing — verifies mapping integrity) | Seed pre-Phase-14 audit_log rows + post-enrichment rows. Assert both render via formatter; assert backward compat fallback path works (D-D6). | **D-D6:** Backward compat is the headline assertion. |

---

### Plan 14-10 — Frontend Jira-style Audit Render Cross-Cutting (~6-8 files)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Frontend2/lib/audit-event-mapper.ts` (EXTEND) | utility | pure mapping | same file (full existing — 109 lines) and RESEARCH §Common Op 3 lines 1090–1169 (verbatim diff) | Add 13 NEW SemanticEventType members per CONTEXT D-D3. Extend `mapAuditToSemantic` with new branches AFTER existing ones. Extend `semanticToFilterChip` with new `"admin"` chip + status-chip routing per RESEARCH lines 1152–1167. | **Pitfall 1:** Order branches AFTER existing (phase_transition stays first). **Pitfall 9:** EVERY new SemanticEventType MUST have a chip mapping — TypeScript exhaustiveness via `assertNever`. |
| `Frontend2/lib/activity/event-meta.ts` (EXTEND) | utility | pure constant | same file (full existing — 97 lines) | Add 13 new entries to `eventMeta` map: `{Icon, color, verb: (lang) => string}`. Localized verbs TR + EN per CONTEXT D-D4. | **OCP:** Extend the table; never modify the consumer (activity-row). |
| `Frontend2/components/activity/activity-row.tsx` (EXTEND with `variant="admin-table"` + 5 new render branches) | component | read | same file (full existing — 256 lines) | Add `variant?: "default" | "admin-table"` prop. Add 5 new conditional render branches per CONTEXT D-D4: `task_field_updated`, `project_archived` / `project_status_changed`, `comment_edited` / `comment_deleted`, `user_*` lifecycle, `project_join_request_*`. | **Pitfall 2:** Read snake_case keys directly via `md.task_key as string` (matches existing line 74-76 pattern). DO NOT introduce a camelCase mapper. **D-D5:** `admin-table` variant = single line, no avatar bubble, time on right. |
| `Frontend2/lib/audit-event-mapper.test.ts` (NEW or EXTEND) | unit test | n/a | `Backend/tests/integration/test_audit_event_mapper.py` (Phase 13 backend test — mirror logic on FE) — closest reference for unit test scope is `Frontend2/hooks/use-editor-history.test.ts` for vitest pattern | Test all 13 NEW SemanticEventType mappings + chip mapping + backward-compat fallback for missing metadata. | **Pitfall 1 + 9:** Both must be covered. |
| `Frontend2/components/activity/activity-row.test.tsx` (NEW or EXTEND) | RTL test | n/a | `Frontend2/components/lifecycle/evaluation-report-card.test.tsx` (Phase 12 RTL pattern) | Test each new render branch + admin-table variant compact layout. | **Cross-phase regression:** Test that EXISTING `task_status_changed` still renders correctly with non-extended payload (Pitfall 1 warning sign). |

---

### Plan 14-11 — Avatar Dropdown Verify + Header `Rapor al` / `Denetim günlüğü` (~3-4 files)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Frontend2/components/header/avatar-dropdown.tsx` (VERIFY no change OR minor edits) | component | nav | same file (Phase 13 already wired the Admin Paneli link) | Verify the `/admin` link works post-implementation. No code edits expected unless guard logic needs hardening. | **CONTEXT:** Phase 14 just verifies; don't refactor. |
| `Frontend2/app/(shell)/admin/layout.tsx` (PATCH if header buttons live in admin layout) | route layout | nav | same file (Plan 14-02 created it) | Wire `Rapor al` button → `csv-export.downloadCsv("/api/v1/admin/summary.pdf", "admin-summary.pdf")`. Wire `Denetim günlüğü` button → `router.push("/admin/audit")`. | **D-B6:** Rate-limit handled server-side; client just downloads. |

---

### Plan 14-12 — E2E Smoke + UAT Artifact (~4-5 files)

| New / Modified File | Role | Data Flow | Closest Analog | Pattern Notes | Caveats |
|---------------------|------|-----------|----------------|---------------|---------|
| `Frontend2/e2e/admin-route-guard.spec.ts` (NEW) | e2e test | n/a | `Frontend2/e2e/profile-page.spec.ts` (Phase 13 — skip-guard pattern lines 17–36 verbatim) | Test: hit `/admin/users` with no cookie → redirect to `/auth/login?next=/admin/users`. Hit `/admin/users` as member → redirect to `/dashboard` + Toast. Hit `/admin/users` as admin → renders. | **Pitfall 10:** Most-critical assertion. |
| `Frontend2/e2e/admin-overview.spec.ts` (NEW) | e2e test | n/a | same | StatCards render + Pending Requests section render. | None. |
| `Frontend2/e2e/admin-users-crud.spec.ts` (NEW) | e2e test | n/a | same + `Frontend2/e2e/task-create.spec.ts` (form submission pattern) | Open Add User modal → submit → assert Toast. | Skip-guarded per Phase 11 D-50. |
| `Frontend2/e2e/admin-audit-filter.spec.ts` (NEW) | e2e test | n/a | same | Open Filter modal → set date range → assert URL query params updated. | None. |
| `Frontend2/e2e/admin-stats-render.spec.ts` (NEW) | e2e test | n/a | `Frontend2/e2e/reports-charts.spec.ts` (Phase 13 — recharts render verification) | Assert 3 charts mount without crash. | Skip-guarded. |
| `.planning/phases/14-.../14-UAT-CHECKLIST.md` (NEW) | artifact | n/a | `.planning/phases/13-.../13-UAT-CHECKLIST.md` (Phase 13 13-10 pattern) | ~25-30 rows for all 8 tabs + admin-only route guard + invite/reset email delivery + bulk CSV happy/error paths. | **/gsd-verify-work** picks this up post-merge. |

---

## Shared Patterns (cross-cutting reuse)

### S1. Backend admin endpoint shape (used in every plan 14-01 router)

**Source:** `Backend/app/api/v1/admin_settings.py` (full file, 33 lines)
**Apply to:** `admin_join_requests.py`, `admin_users.py`, `admin_audit.py`, `admin_stats.py`, `admin_summary.py`

```python
from fastapi import APIRouter, Depends
from app.api.deps.auth import require_admin
from app.api.deps.X import get_X_repo
from app.application.use_cases.X import XUseCase
from app.application.dtos.X_dtos import XResponseDTO
from app.domain.entities.user import User

router = APIRouter()

@router.get("/", response_model=XResponseDTO)
async def get_X(
    admin: User = Depends(require_admin),  # SECURITY GATE — every endpoint
    repo=Depends(get_X_repo),
):
    uc = XUseCase(repo)
    return await uc.execute()
```

**Caveats:** EVERY admin handler MUST include `Depends(require_admin)` — RESEARCH Anti-Pattern §line 812. Plan 14-12 E2E test asserts 403 for non-admin on every endpoint.

---

### S2. Backend use case + audit emission pattern (Plan 14-09 + Plan 14-01 use cases)

**Source:** `Backend/app/infrastructure/database/repositories/audit_repo.py` lines 76–103 (`create_with_metadata`)
**Apply to:** every use case that mutates state (invite_user, deactivate_user, change_user_role, approve_join_request, etc.)

```python
# Inside use case execute():
await self.audit_repo.create_with_metadata(
    entity_type="user",  # or "project_join_request", "project", "task", ...
    entity_id=user.id,
    action="invited",  # or "approved", "role_changed", ...
    user_id=requesting_admin.id,
    metadata={
        "user_id": user.id,
        "user_email": user.email,
        "target_role": new_role,
        "source_role": old_role,
        "requested_by_admin_id": requesting_admin.id,
        # ... per CONTEXT D-D2 enrichment scope
    },
    field_name="role",  # or other primary field
    old_value=old_role,
    new_value=new_role,
)
```

**Caveats:** Python attr is `extra_metadata`; this method takes a dict literally named `metadata` (constructor param). Pitfall 8.

---

### S3. Frontend service snake → camel mapper

**Source:** `Frontend2/services/profile-service.ts` lines 56–71 (`mapSummary`)
**Apply to:** every new service in Plan 14-01 (admin-join-request, admin-user, admin-audit, admin-stats)

```typescript
interface XResponseDTO {  // mirrors backend snake_case shape
  id: number
  full_name: string
  created_at: string
}
export interface X {  // camelCase domain shape
  id: number
  fullName: string
  createdAt: string
}
function mapX(d: XResponseDTO): X {
  return { id: d.id, fullName: d.full_name, createdAt: d.created_at }
}
```

**Caveats:** **EXCEPTION:** `audit_log.metadata` payload stays snake_case all the way to `activity-row.tsx` (Pitfall 2 — recommended path b). DO NOT camelCase audit metadata.

---

### S4. Frontend mutation hook + Toast

**Source:** `Frontend2/hooks/use-projects.ts` lines 44–58 (`useUpdateProjectStatus`) + RESEARCH §Pattern 4 lines 727–747 (`useInviteUser` verbatim)
**Apply to:** every mutation hook in Plan 14-01

```typescript
export function useX() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: adminXService.X,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin", "X"] })
      showToast({ tone: "success", message: `OK: ${data.something}` })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "İşlem başarısız"
      showToast({ tone: "danger", message: msg })
    },
  })
}
```

**Caveats:** Use **`onSettled`** (not `onSuccess`) when invalidation must happen on both success AND error — see `useUpdateProjectStatus` lines 50–55 for rationale ("if the mutation failed because the project no longer exists, the stale list needs to go away").

---

### S5. Admin-only route guard (Plan 14-02 layout + middleware combo)

**Sources:**
- `Frontend2/middleware.ts` (full file, 23 lines) — server-edge gate
- `Frontend2/context/auth-context.tsx` `useAuth().isLoading + .role` — client gate
- `Frontend2/components/dashboard/activity-feed.tsx` lines 74–86 (DataState consumption) — loading state pattern

**Apply to:** `Frontend2/app/(shell)/admin/layout.tsx` only

```typescript
"use client"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { DataState } from "@/components/primitives"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return  // PITFALL 3 — wait for auth hydration FIRST
    if (!user) {
      router.replace(`/auth/login?next=${pathname}`)
      return
    }
    if (user.role?.name?.toLowerCase() !== "admin") {
      router.replace("/dashboard")
      // Toast.danger("Bu sayfaya erişim yetkiniz yok")
    }
  }, [isLoading, user, pathname, router])

  if (isLoading) return <DataState loading>{null}</DataState>
  if (!user || user.role?.name?.toLowerCase() !== "admin") return null  // about to redirect

  return (
    <>
      {/* PageHeader + NavTabs + children */}
    </>
  )
}
```

**Caveats:** **Pitfall 3 + 10:** Both middleware (cookie check) and layout (role check) are required. Neither alone is sufficient.

---

### S6. CSV / PDF / JSON download trigger (server-side per D-W3)

**Source:** `Backend/app/api/v1/reports.py` lines 240–247 (`StreamingResponse` + Content-Disposition)
**Apply to:** `/admin/users.csv`, `/admin/audit.json`, `/admin/summary.pdf`

```python
# Backend: server-side rendering, NEVER client-side
return StreamingResponse(
    io.BytesIO(content_bytes),
    media_type="text/csv",  # or "application/pdf", "application/json"
    headers={"Content-Disposition": f'attachment; filename="{filename}"'},
)
```

```typescript
// Frontend: trigger via anchor — NO in-browser CSV/PDF assembly
function downloadCsv(url: string, filename?: string) {
  const a = document.createElement("a")
  a.href = url
  if (filename) a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
```

**Caveats:** **D-W3:** UTF-8 BOM (`U+FEFF`) prefix for CSV — Excel-friendly encoding.

---

### S7. Backend integration test in-memory fake repo pattern (Phase 12 D-09)

**Source:** `Backend/tests/integration/test_user_activity.py` lines 31–78 (`FakePrivacyFilteredAuditRepo`)
**Apply to:** every Plan 14-01 + 14-09 test file

```python
class FakeXRepository:
    def __init__(self, items: List[X]):
        self._items = items
        self.last_call: Optional[dict] = None  # capture for assertion

    async def list_by_status(self, status, limit=50, offset=0):
        self.last_call = {"status": status, "limit": limit, "offset": offset}
        filtered = [i for i in self._items if i.status == status]
        return filtered[offset:offset+limit], len(filtered)


@pytest.mark.asyncio
async def test_X():
    fake_repo = FakeXRepository(items=[...])
    use_case = XUseCase(fake_repo)
    result = await use_case.execute(...)
    assert result.total == ...
    assert fake_repo.last_call["status"] == "pending"
```

**Caveats:** **Phase 12 D-09:** No database in unit tests — fakes only. Authenticated-client fixture for E2E-style integration (see `test_activity.py` lines 13–24 for `authenticated_client(role="admin")` usage).

---

### S8. Idempotent Alembic migration (helper functions)

**Source:** `Backend/alembic/versions/005_phase9_schema.py` lines 39–97 (idempotent helpers `_table_exists`, `_column_exists`, `_index_exists`, `_enum_value_exists`)
**Apply to:** `Backend/alembic/versions/006_phase14_admin_panel.py`

```python
def _table_exists(table_name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=:t"
        ),
        {"t": table_name},
    )
    return result.scalar() > 0

# In upgrade():
if not _table_exists("project_join_requests"):
    op.create_table(...)
if not _index_exists("ix_project_join_requests_status_created"):
    op.create_index(...)
```

**Caveats:** Migration MUST be re-runnable. Copy the helpers VERBATIM from 005 — DO NOT regenerate. This pattern was hardened across phases 1-9.

---

## No Analog Found (closest reference for code style)

| File | Role | Reason | Closest Style Reference |
|------|------|--------|-------------------------|
| `Frontend2/lib/admin/permissions-static.ts` | placeholder constant | New shape (RBAC matrix) — no existing matrix in codebase | `Frontend2/lib/methodology-matrix.ts` (constant table + locale lookup) |
| `Frontend2/lib/admin/audit-field-labels.ts` | TR/EN field name dict | New shape | `Frontend2/lib/methodology-matrix.ts` (constant table + locale helper) |
| `Frontend2/lib/admin/csv-parse.ts` | papaparse wrapper | papaparse is new install (Plan 14-01) | None — pattern is "wrap library + validators". Closest: `Frontend2/lib/api-client.ts` for the wrapper-around-library style |
| `Frontend2/lib/admin/csv-export.ts` | anchor download trigger | New shape | None — trivial DOM utility |
| `Frontend2/components/primitives/nav-tabs.tsx` | Link-based tab strip | New primitive (D-C4) | `Frontend2/components/primitives/tabs.tsx` (visual API verbatim) |
| `Frontend2/components/primitives/modal.tsx` | base modal primitive | New primitive (RESEARCH Pattern 2) | `Frontend2/components/projects/confirm-dialog.tsx` (overlay + ESC handler) |
| `Frontend2/components/admin/users/user-bulk-bar.tsx` | sticky bulk-action bar | New shape | `Frontend2/components/dashboard/portfolio-table.tsx` (table toolbar) |
| `Frontend2/components/admin/more-menu.tsx` (recommended shared component) | reusable MoreH | RESEARCH §Don't Hand-Roll line 830 — recommended shared lift | `Frontend2/components/projects/project-card.tsx` lines 167–197 (verbatim source) |

---

## Pattern Excerpts (1 representative block per layer — paste verbatim into per-task `<read_first>` and `<action>` blocks)

### EXCERPT-A: Backend Domain — repository interface (paste into Plan 14-01 ProjectJoinRequest task `<action>`)

**Source: `Backend/app/domain/repositories/password_reset_repository.py` (full)** — adapt to ProjectJoinRequest

```python
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from app.domain.entities.project_join_request import ProjectJoinRequest, JoinRequestStatus


class IProjectJoinRequestRepository(ABC):
    @abstractmethod
    async def create(self, request: ProjectJoinRequest) -> ProjectJoinRequest: ...

    @abstractmethod
    async def get_by_id(self, request_id: int) -> Optional[ProjectJoinRequest]: ...

    @abstractmethod
    async def list_by_status(
        self, status: JoinRequestStatus, limit: int = 50, offset: int = 0
    ) -> Tuple[List[ProjectJoinRequest], int]: ...

    @abstractmethod
    async def update_status(
        self, request_id: int, status: JoinRequestStatus,
        reviewed_by_admin_id: Optional[int] = None,
    ) -> Optional[ProjectJoinRequest]: ...
```

---

### EXCERPT-B: Backend Infrastructure — DI factory (paste into every new admin DI factory)

**Source: `Backend/app/api/deps/audit.py` (full file, 18 lines)**

```python
"""ProjectJoinRequest repository DI factory.

Mirrors `app/api/deps/audit.py`. Re-exported from `app.api.dependencies` for
backward compat (BACK-07 split).
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session
from app.domain.repositories.project_join_request_repository import IProjectJoinRequestRepository
from app.infrastructure.database.repositories.project_join_request_repo import SqlAlchemyProjectJoinRequestRepository


def get_project_join_request_repo(
    session: AsyncSession = Depends(get_db_session),
) -> IProjectJoinRequestRepository:
    return SqlAlchemyProjectJoinRequestRepository(session)


__all__ = ["get_project_join_request_repo"]
```

---

### EXCERPT-C: Backend Application — use case (paste into invite_user / approve_join_request `<action>`)

**Source: `Backend/app/application/use_cases/get_global_activity.py` (full file)** — adapt for write+audit

```python
"""Plan 14-01 — InviteUserUseCase. Email-invite flow per CONTEXT D-B2.

REUSES Phase 2 PasswordResetToken entity + Phase 5 email infrastructure.
NEVER import sqlalchemy or app.infrastructure here — Clean Architecture DIP.
"""
from datetime import datetime, timedelta
import secrets

from app.domain.entities.user import User
from app.domain.repositories.user_repository import IUserRepository
from app.domain.repositories.password_reset_repository import IPasswordResetRepository
from app.domain.repositories.audit_repository import IAuditRepository
from app.application.dtos.admin_user_dtos import InviteUserRequestDTO, InviteUserResponseDTO
from app.application.ports.email_port import IEmailService  # Phase 5
from app.infrastructure.config import settings


class InviteUserUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        token_repo: IPasswordResetRepository,
        audit_repo: IAuditRepository,
        email_service: IEmailService,
    ):
        self.user_repo = user_repo
        self.token_repo = token_repo
        self.audit_repo = audit_repo
        self.email_service = email_service

    async def execute(
        self, dto: InviteUserRequestDTO, requesting_admin_id: int,
    ) -> InviteUserResponseDTO:
        # 1. Create user, is_active=False, random password
        user = await self.user_repo.create(...)

        # 2. Mint invite token (7-day TTL per discretion)
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=settings.INVITE_TOKEN_TTL_DAYS)
        await self.token_repo.create(user.id, hash_token(token), expires_at)

        # 3. Send Phase 5 invite email with set-password link
        await self.email_service.send_invite_email(user.email, token)

        # 4. Audit emission with enriched metadata (Plan 14-09 ready)
        await self.audit_repo.create_with_metadata(
            entity_type="user", entity_id=user.id, action="invited",
            user_id=requesting_admin_id,
            metadata={
                "user_id": user.id, "user_email": user.email,
                "target_role": dto.role, "requested_by_admin_id": requesting_admin_id,
            },
        )

        return InviteUserResponseDTO(
            user_id=user.id, email=user.email, invite_token_expires_at=expires_at,
        )
```

---

### EXCERPT-D: Backend API — admin router (paste into admin_*.py routers)

**Source: `Backend/app/api/v1/admin_settings.py` (full file)**

```python
from fastapi import APIRouter, Depends

from app.api.deps.auth import require_admin
from app.api.deps.project_join_request import get_project_join_request_repo
from app.application.use_cases.list_pending_join_requests import ListPendingJoinRequestsUseCase
from app.application.dtos.project_join_request_dtos import JoinRequestListDTO
from app.domain.entities.user import User

router = APIRouter()


@router.get("/admin/join-requests", response_model=JoinRequestListDTO)
async def list_pending_join_requests(
    status: str = "pending",
    limit: int = 50,
    offset: int = 0,
    admin: User = Depends(require_admin),  # SECURITY GATE
    repo=Depends(get_project_join_request_repo),
):
    uc = ListPendingJoinRequestsUseCase(repo)
    return await uc.execute(status=status, limit=limit, offset=offset)
```

---

### EXCERPT-E: Backend Migration — idempotent table create (paste into 006_phase14_admin_panel.py)

**Source: `Backend/alembic/versions/005_phase9_schema.py` lines 43–97 (helpers) + line 182–227 (table create pattern)**

```python
"""Phase 14 schema: project_join_requests table.

Revision ID: 006_phase14
Revises: 005_phase9
Create Date: 2026-04-27
"""
from alembic import op
import sqlalchemy as sa

revision = "006_phase14"
down_revision = "005_phase9"
branch_labels = None
depends_on = None


def _table_exists(table_name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=:t"
        ),
        {"t": table_name},
    )
    return result.scalar() > 0


def _index_exists(index_name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM pg_indexes "
            "WHERE schemaname='public' AND indexname=:n"
        ),
        {"n": index_name},
    )
    return result.scalar() > 0


def upgrade() -> None:
    if not _table_exists("project_join_requests"):
        op.create_table(
            "project_join_requests",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "project_id", sa.Integer(),
                sa.ForeignKey("projects.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "requested_by_user_id", sa.Integer(),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column(
                "target_user_id", sa.Integer(),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column(
                "status", sa.String(20),
                nullable=False, server_default="pending",
            ),
            sa.Column("note", sa.Text(), nullable=True),
            sa.Column(
                "reviewed_by_admin_id", sa.Integer(),
                sa.ForeignKey("users.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_at", sa.DateTime(timezone=True),
                server_default=sa.text("now()"), nullable=False,
            ),
            sa.Column(
                "updated_at", sa.DateTime(timezone=True),
                server_default=sa.text("now()"), nullable=False,
            ),
        )
    if not _index_exists("ix_project_join_requests_status_created"):
        op.create_index(
            "ix_project_join_requests_status_created",
            "project_join_requests",
            ["status", sa.text("created_at DESC")],
        )


def downgrade() -> None:
    op.drop_index("ix_project_join_requests_status_created")
    op.drop_table("project_join_requests")
```

---

### EXCERPT-F: Frontend service — snake → camel mapper (paste into all 4 admin services)

**Source: `Frontend2/services/profile-service.ts` lines 56–71 + lines 116–166** + RESEARCH §Common Op 1 lines 970–1016

```typescript
import { apiClient } from "@/lib/api-client"

export interface PendingJoinRequest {
  id: number
  project: { id: number; key: string; name: string }
  requestedBy: { id: number; full_name: string; avatar_url: string | null }
  targetUser: { id: number; full_name: string; avatar_url: string | null }
  note: string | null
  created_at: string
}

interface PendingJoinRequestDTO {
  id: number
  project: { id: number; key: string; name: string }
  requested_by: { id: number; full_name: string; avatar_url: string | null }
  target_user: { id: number; full_name: string; avatar_url: string | null }
  note: string | null
  created_at: string
}

interface PendingResponseDTO {
  items: PendingJoinRequestDTO[]
  total: number
}

function mapPending(d: PendingJoinRequestDTO): PendingJoinRequest {
  return {
    id: d.id,
    project: d.project,
    requestedBy: d.requested_by,
    targetUser: d.target_user,
    note: d.note,
    created_at: d.created_at,
  }
}

export const adminJoinRequestService = {
  listPending: async (limit = 5, offset = 0) => {
    const resp = await apiClient.get<PendingResponseDTO>(
      "/admin/join-requests",
      { params: { status: "pending", limit, offset } },
    )
    return { items: resp.data.items.map(mapPending), total: resp.data.total }
  },
  approve: async (id: number) => apiClient.post(`/admin/join-requests/${id}/approve`),
  reject: async (id: number) => apiClient.post(`/admin/join-requests/${id}/reject`),
}
```

---

### EXCERPT-G: Frontend hook — TanStack Query mutation (paste into all admin mutation hooks)

**Source: `Frontend2/hooks/use-projects.ts` lines 44–58** + RESEARCH §Pattern 4 lines 727–747

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adminUserService } from "@/services/admin-user-service"
import { useToast } from "@/components/toast"

export function useInviteUser() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: adminUserService.invite,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
      showToast({ tone: "success", message: `Davet gönderildi: ${data.email}` })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Davet gönderilemedi"
      showToast({ tone: "danger", message: msg })
    },
  })
}
```

---

### EXCERPT-H: Frontend primitive — NavTabs (paste into Plan 14-01 nav-tabs.tsx)

**Source: `Frontend2/components/primitives/tabs.tsx` (full file, 92 lines)** + RESEARCH §Pattern 1 lines 494–555

```typescript
"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "./badge"

export interface NavTabItem {
  id: string
  href: string
  label: string
  icon?: React.ReactNode
  badge?: number | string
}

export interface NavTabsProps {
  tabs: NavTabItem[]
  size?: "sm" | "md" | "lg"
}

const PAD_MAP = { sm: "6px 10px", md: "8px 14px", lg: "10px 16px" }
const FONT_MAP = { sm: 12, md: 13, lg: 14 }

export function NavTabs({ tabs, size = "md" }: NavTabsProps) {
  const pathname = usePathname()
  return (
    <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)" }}>
      {tabs.map((tab) => {
        // PITFALL 4 — /admin (Overview) active only when no other tab matches
        const isActive = pathname === tab.href ||
          (tab.href === "/admin" && pathname.startsWith("/admin/") &&
           !tabs.some(t => t.href !== "/admin" && pathname.startsWith(t.href)))
        return (
          <Link
            key={tab.id}
            href={tab.href}
            style={{
              padding: PAD_MAP[size],
              fontSize: FONT_MAP[size],
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--fg)" : "var(--fg-muted)",
              borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: -1,
              display: "inline-flex", alignItems: "center", gap: 6,
              textDecoration: "none", transition: "color 0.12s",
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && (
              <Badge size="xs" tone={isActive ? "primary" : "neutral"}>{tab.badge}</Badge>
            )}
          </Link>
        )
      })}
    </div>
  )
}
```

---

### EXCERPT-I: Frontend route layout — admin guard (paste into Plan 14-02 layout.tsx)

**Source: `Frontend2/app/(shell)/layout.tsx` + Frontend2/app/(shell)/users/[id]/page.tsx lines 94–113 (loading + 404 path)** + RESEARCH §Pattern S5 above

```typescript
"use client"
import * as React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { DataState } from "@/components/primitives"
import { NavTabs } from "@/components/primitives/nav-tabs"
import { Shield } from "lucide-react"
import { Button } from "@/components/primitives/button"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace(`/auth/login?next=${pathname}`)
      return
    }
    if (user.role?.name?.toLowerCase() !== "admin") {
      router.replace("/dashboard")
    }
  }, [isLoading, user, pathname, router])

  if (isLoading) return <DataState loading>{null}</DataState>
  if (!user || user.role?.name?.toLowerCase() !== "admin") return null

  const ADMIN_TABS = [
    { id: "overview", href: "/admin", label: "Genel" },
    { id: "users", href: "/admin/users", label: "Kullanıcılar" },
    { id: "roles", href: "/admin/roles", label: "Roller" },
    { id: "permissions", href: "/admin/permissions", label: "İzin Matrisi" },
    { id: "projects", href: "/admin/projects", label: "Projeler" },
    { id: "workflows", href: "/admin/workflows", label: "Şablonlar" },
    { id: "audit", href: "/admin/audit", label: "Audit" },
    { id: "stats", href: "/admin/stats", label: "İstatistik" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={20} />
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Yönetim Konsolu</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" size="sm">Rapor al</Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/audit")}>
            Denetim günlüğü
          </Button>
        </div>
      </header>
      <NavTabs tabs={ADMIN_TABS} />
      {children}
    </div>
  )
}
```

---

### EXCERPT-J: Frontend audit-event-mapper extension (paste into Plan 14-10 mapper)

**Source: `Frontend2/lib/audit-event-mapper.ts` (full)** + RESEARCH §Common Op 3 lines 1090–1169

```typescript
export type SemanticEventType =
  // Existing 10 (Phase 13) — UNCHANGED
  | "task_created" | "task_status_changed" | "task_assigned"
  | "comment_created" | "task_deleted" | "phase_transition"
  | "milestone_created" | "milestone_updated"
  | "artifact_status_changed" | "phase_report_created"
  // NEW Phase 14 (D-D3) — 13 additions
  | "task_field_updated"
  | "project_archived" | "project_status_changed"
  | "comment_edited" | "comment_deleted"
  | "user_invited" | "user_deactivated" | "user_activated"
  | "user_role_changed" | "user_password_reset_requested"
  | "project_join_request_created"
  | "project_join_request_approved" | "project_join_request_rejected"

export type ActivityFilterChip =
  | "create" | "status" | "assign" | "comment" | "lifecycle" | "admin" | "all"

export function mapAuditToSemantic(item: ActivityItem): SemanticEventType | null {
  // ... existing branches preserved verbatim — phase_transition stays first ...

  // NEW Phase 14 — order MATTERS (Pitfall 1: AFTER existing branches)
  if (item.entity_type === "task" && item.action === "updated") {
    if (item.field_name === "column_id") return "task_status_changed"   // existing
    if (item.field_name === "assignee_id") return "task_assigned"        // existing
    if (item.field_name) return "task_field_updated"                     // NEW catch-all
  }
  if (item.entity_type === "project" && item.action === "archived") return "project_archived"
  if (item.entity_type === "project" && item.action === "updated" && item.field_name === "status")
    return "project_status_changed"
  if (item.entity_type === "comment" && item.action === "updated") return "comment_edited"
  if (item.entity_type === "comment" && item.action === "deleted") return "comment_deleted"
  if (item.entity_type === "user") {
    if (item.action === "invited") return "user_invited"
    if (item.action === "deactivated") return "user_deactivated"
    if (item.action === "activated") return "user_activated"
    if (item.action === "role_changed") return "user_role_changed"
    if (item.action === "password_reset_requested") return "user_password_reset_requested"
  }
  if (item.entity_type === "project_join_request") {
    if (item.action === "created") return "project_join_request_created"
    if (item.action === "approved") return "project_join_request_approved"
    if (item.action === "rejected") return "project_join_request_rejected"
  }
  return null
}

// PITFALL 9 — every new SemanticEventType MUST have a chip mapping
export function semanticToFilterChip(t: SemanticEventType): ActivityFilterChip {
  if (t === "task_created") return "create"
  if (t === "task_status_changed" || t === "task_field_updated" ||
      t === "project_status_changed" || t === "project_archived") return "status"
  if (t === "task_assigned") return "assign"
  if (t === "comment_created") return "comment"
  if (t === "phase_transition" || t === "milestone_created" ||
      t === "milestone_updated" || t === "artifact_status_changed" ||
      t === "phase_report_created") return "lifecycle"
  // NEW Phase 14 — admin chip covers user_* + project_join_request_* + comment edited/deleted
  if (t === "user_invited" || t === "user_deactivated" || t === "user_activated" ||
      t === "user_role_changed" || t === "user_password_reset_requested" ||
      t === "project_join_request_created" || t === "project_join_request_approved" ||
      t === "project_join_request_rejected" ||
      t === "comment_edited" || t === "comment_deleted") return "admin"
  return "all"
}
```

---

### EXCERPT-K: Backend integration test in-memory fake (paste into all Plan 14-01 + 14-09 test files)

**Source: `Backend/tests/integration/test_user_activity.py` lines 31–138 (full pattern)**

```python
"""Plan 14-01 — InviteUserUseCase tests (in-memory fakes per Phase 12 D-09)."""
from typing import List, Optional
import pytest
from app.application.use_cases.invite_user import InviteUserUseCase


class FakeUserRepository:
    def __init__(self):
        self._users: List = []
        self._next_id = 1

    async def create(self, **kwargs):
        user = type("User", (), {**kwargs, "id": self._next_id})()
        self._next_id += 1
        self._users.append(user)
        return user


class FakeAuditRepository:
    def __init__(self):
        self.calls: List[dict] = []

    async def create_with_metadata(self, **kwargs):
        self.calls.append(kwargs)


class FakeEmailService:
    def __init__(self):
        self.sent: List[tuple] = []

    async def send_invite_email(self, email: str, token: str):
        self.sent.append((email, token))


@pytest.mark.asyncio
async def test_invite_user_writes_audit_with_enriched_metadata():
    user_repo = FakeUserRepository()
    audit_repo = FakeAuditRepository()
    email = FakeEmailService()
    token_repo = ...  # similar fake

    uc = InviteUserUseCase(user_repo, token_repo, audit_repo, email)
    result = await uc.execute(
        dto=InviteUserRequestDTO(email="new@example.com", role="Member"),
        requesting_admin_id=1,
    )

    assert result.user_id == 1
    assert result.email == "new@example.com"
    # Audit emission contract
    assert len(audit_repo.calls) == 1
    call = audit_repo.calls[0]
    assert call["entity_type"] == "user"
    assert call["action"] == "invited"
    assert call["metadata"]["target_role"] == "Member"
    assert call["metadata"]["requested_by_admin_id"] == 1
    # Email contract
    assert len(email.sent) == 1
    assert email.sent[0][0] == "new@example.com"
```

---

### EXCERPT-L: E2E test skip-guard (paste into all 14-12 specs)

**Source: `Frontend2/e2e/profile-page.spec.ts` lines 17–36 (full pattern)**

```typescript
import { test, expect } from "@playwright/test"

test.describe("Admin route guard @phase-14", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "chromium-only for Phase 14",
  )

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin").catch(() => {})
    const apiOk = await page
      .evaluate(async () => {
        try {
          const r = await fetch("/api/v1/health")
          return r.ok
        } catch {
          return false
        }
      })
      .catch(() => false)
    test.skip(!apiOk, "no seeded test backend (Phase 11 D-50 skip-guard)")
  })

  test("/admin redirects unauthenticated users to /auth/login", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/admin/users")
    await expect(page).toHaveURL(/\/auth\/login/)
    expect(page.url()).toContain("next=%2Fadmin%2Fusers")
  })
})
```

---

## Metadata

**Analog search scope:** `Frontend2/components/{primitives,projects,dashboard,activity,header}`, `Frontend2/services`, `Frontend2/hooks`, `Frontend2/app/(shell)/**`, `Frontend2/lib`, `Frontend2/middleware.ts`, `Frontend2/e2e`, `Backend/app/{api,application,domain,infrastructure}`, `Backend/alembic/versions`, `Backend/tests/integration`, `.planning/phases/13-.../13-PATTERNS.md` (format reference).

**Files scanned:** ~85 read end-to-end or in targeted ranges; ~40 globbed for inventory.

**Pattern extraction date:** 2026-04-27

**Cross-phase pattern lineage:**
- Backend admin endpoint shape: Phase 7 `admin_settings.py` (CONTEXT D-A6 reuse)
- Backend in-memory fake tests: Phase 12 D-09
- Frontend service mapper: Phase 13 D-X1 (`profile-service.ts`)
- Frontend mutation hook + Toast: Phase 10 D-25 + Phase 11
- Admin route guard combo (middleware + layout): Phase 13 D-D2 partial; Phase 14 closes the loop
- Idempotent migration helpers: Phase 9 (005)
- ConfirmDialog tone extension: Phase 10 D-25 + Phase 14 D-A3
- ActivityRow + audit-event-mapper extension: Phase 13 D-D + Phase 14 D-D1..6
