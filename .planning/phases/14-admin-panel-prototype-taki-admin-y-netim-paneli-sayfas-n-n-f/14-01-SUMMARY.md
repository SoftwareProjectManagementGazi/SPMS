---
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
plan: 01
subsystem: admin-panel-infra
tags: [admin-panel, clean-architecture, audit-log, rbac-deferred, frontend2, papaparse]
provides:
  - papaparse@^5.5.3 + @types/papaparse installed
  - ConfirmDialog tone prop (primary | danger | warning, backward-compat default)
  - NavTabs primitive (Link-based, usePathname-driven active detection with Pitfall 4 guard)
  - Modal primitive (overlay + panel + ModalHeader/Body/Footer slots)
  - Shared MoreMenu primitive (consumed by Plans 14-02/03/05/06/07)
  - Admin lib utilities (permissions-static / audit-field-labels / csv-parse / csv-export)
  - Backend ProjectJoinRequest vertical slice (entity / repo ABC + impl / 4 use cases / router / migration 006)
  - Backend admin user/audit/stats/summary slices (DTOs / 9 use cases / 4 routers / config TTL)
  - Audit repo extended with get_global_audit (Pitfall 6 truncated flag) + active_users_trend
  - Project repo extended with methodology_distribution + list_recent_projects
  - 4 admin services (admin-join-request / admin-user / admin-audit / admin-stats)
  - 12 admin TanStack Query hooks (incl. optimistic update on approve/reject/bulk)
affects:
  - Wave 2 plans 14-02 through 14-08 (consumes services + hooks + primitives)
  - Wave 3 plans 14-09, 14-10 (audit-log enrichment + frontend mapper extension)
tech-stack:
  added:
    - papaparse@^5.5.3 (CSV parser for bulk-invite client preview)
    - "@types/papaparse@^5.5.2 (satisfies plan's ^5.3.16)"
  patterns:
    - Wave 0 fat-infra (Phase 12 D-02 / Phase 13 D-01 reuse)
    - Snake → camel mapper at service boundary; audit_log.metadata stays snake (Pitfall 2)
    - DI by ABC injection; helper closures at router boundary for role-table coupling avoidance
    - Optimistic update with snapshot-and-revert (D-W2)
    - Idempotent Alembic helpers (_table_exists, _index_exists copied verbatim from 005)
key-files:
  created:
    - Frontend2/components/primitives/nav-tabs.tsx (Link-based tab strip, Pitfall 4 guard)
    - Frontend2/components/primitives/modal.tsx (overlay + panel + slots)
    - Frontend2/components/admin/shared/more-menu.tsx (shared 3-dot dropdown)
    - Frontend2/lib/admin/permissions-static.ts (14×4 tri-state matrix, v3.0 placeholder)
    - Frontend2/lib/admin/audit-field-labels.ts (TR/EN field-name dict)
    - Frontend2/lib/admin/csv-parse.ts (papaparse wrapper + 500-row cap)
    - Frontend2/lib/admin/csv-export.ts (anchor-based download trigger)
    - Frontend2/services/admin-{join-request,user,audit,stats}-service.ts
    - Frontend2/hooks/use-{pending-join-requests,approve-join-request,reject-join-request,admin-users,invite-user,bulk-invite,deactivate-user,reset-password,change-role,bulk-action,admin-audit,admin-stats}.ts
    - Backend/app/domain/entities/project_join_request.py
    - Backend/app/domain/repositories/project_join_request_repository.py
    - Backend/app/infrastructure/database/models/project_join_request.py
    - Backend/app/infrastructure/database/repositories/project_join_request_repo.py
    - Backend/app/api/deps/project_join_request.py
    - Backend/app/application/dtos/{project_join_request,admin_user,admin_audit,admin_stats}_dtos.py
    - "Backend/app/application/use_cases/{create,approve,reject,list_pending}_join_request.py"
    - Backend/app/application/use_cases/{invite_user,bulk_invite_user,deactivate_user,reset_user_password,change_user_role,bulk_action_user,get_global_audit,get_admin_stats,generate_admin_summary_pdf}.py
    - Backend/app/api/v1/{admin_join_requests,admin_users,admin_audit,admin_stats,admin_summary}.py
    - Backend/alembic/versions/006_phase14_admin_panel.py
    - "5 frontend test files + 6 backend integration test files"
  modified:
    - Frontend2/components/projects/confirm-dialog.tsx (added optional tone prop)
    - Frontend2/components/primitives/index.ts (barrel export NavTabs + Modal)
    - Frontend2/package.json + Frontend2/package-lock.json
    - Backend/app/domain/repositories/audit_repository.py (added get_global_audit + active_users_trend ABCs)
    - Backend/app/domain/repositories/project_repository.py (added methodology_distribution + list_recent_projects)
    - Backend/app/infrastructure/database/repositories/audit_repo.py (50k cap + asyncpg-safe trend SQL)
    - Backend/app/infrastructure/database/repositories/project_repo.py (composite stats reads)
    - Backend/app/infrastructure/database/models/__init__.py (registered ProjectJoinRequestModel)
    - Backend/app/infrastructure/config.py (added INVITE_TOKEN_TTL_DAYS = 7)
    - Backend/app/api/dependencies.py (legacy shim re-export)
    - Backend/app/api/main.py (5 admin router includes)
    - Backend/app/domain/exceptions.py (JoinRequestNotFoundError + JoinRequestInvalidStateError)
key-decisions:
  - "INVITE_TOKEN_TTL_DAYS placed in app/infrastructure/config.py — actual project layout has no app/core/ directory (plan referenced an idealized path)"
  - "Plan frontmatter says '14 hooks'; files_modified list and final commit ship 12 hooks (matches the 12 endpoint surfaces)"
  - "Toast contract uses variant: 'success'|'error'|'warning'|'info' NOT tone:; plan pseudocode used tone:'danger' which was a planning artifact"
  - "Project repo methodology_distribution + list_recent_projects added at ABC level with default empty implementations so test fakes don't need to implement them"
  - "_get_base_query()'s joinedload requires .unique() — added defensively to list_recent_projects (Rule 1 fix)"
  - "active_users_trend SQL uses arithmetic interval (:days * INTERVAL '1 day') instead of string-concat to satisfy asyncpg type binding (Rule 1 fix)"
  - "ApproveJoinRequestUseCase rolls back to status='pending' on team_repo failure; repo.update_status('pending', ...) clears reviewed_by + reviewed_at"
duration: 90min
completed: 2026-04-27
---

# Phase 14 Plan 14-01: Wave 0 Fat Infrastructure Summary

**Stood up the entire admin-panel infrastructure (Backend ProjectJoinRequest vertical slice + Backend admin user/audit/stats/summary endpoints + Frontend services/hooks/primitives/lib utilities) in one heavy plan so Wave 2 surface plans (14-02..14-08) consume pre-built scaffolding without re-deriving CONTEXT/RESEARCH decisions.**

## Performance

- **Duration:** ~90 min (4 atomic commits)
- **Tasks:** 4 / 4 complete
- **Files modified:** 60+ (new + extended) across Frontend2 and Backend
- **Tests added:** 24 frontend (vitest + RTL) + 34 backend (pytest async) = 58 tests
- **All tests pass:** ✅

## Task Commits

1. **Task 1: Frontend Wave-0 primitives + admin lib utilities** — `0e1a94b2`
2. **Task 2: ProjectJoinRequest backend vertical slice** — `185db363`
3. **Task 3: Admin user/audit/stats/summary backend slices + alembic upgrade** — `3f61dee0`
4. **Task 4: Admin services + 12 hooks + optimistic update tests** — `d1654642`

## Test Commands That Proved Each Must-Have Truth

| Truth | Test Command | Result |
|-------|--------------|--------|
| papaparse + @types installed | `cd Frontend2 && node -e "require('papaparse')"` | ✅ |
| ConfirmDialog backward compat + tone variants | `cd Frontend2 && npx vitest run confirm-dialog.test.tsx` | ✅ 5/5 |
| NavTabs Pitfall 4 guard | `cd Frontend2 && npx vitest run nav-tabs.test.tsx` | ✅ 5/5 |
| MoreMenu shared primitive | `cd Frontend2 && npx vitest run more-menu.test.tsx` | ✅ 7/7 |
| ProjectJoinRequest entity + repo (DIP) + atomic rollback | `cd Backend && python -m pytest -q tests/integration/test_create_join_request.py tests/integration/test_approve_join_request.py` | ✅ 7/7 |
| Alembic 006 idempotent + project_join_requests table created | `cd Backend && alembic upgrade head` then sqlalchemy inspect | ✅ |
| Admin user CRUD + 500-row cap + access matrix | `cd Backend && python -m pytest -q tests/integration/test_admin_users_crud.py` | ✅ 11/11 |
| Audit 50k cap (Pitfall 6) + filter contracts | `cd Backend && python -m pytest -q tests/integration/test_admin_audit_get_global.py` | ✅ 8/8 |
| Admin stats composite shape + 30-cap | `cd Backend && python -m pytest -q tests/integration/test_admin_stats.py` | ✅ 5/5 |
| Admin summary PDF + access matrix | `cd Backend && python -m pytest -q tests/integration/test_generate_admin_summary_pdf.py` | ✅ 3/3 |
| Snake → camel mapper + service contracts | `cd Frontend2 && npx vitest run admin-join-request-service.test.ts` | ✅ 4/4 |
| Optimistic update on approve (D-W2) | `cd Frontend2 && npx vitest run use-approve-join-request.test.tsx` | ✅ 3/3 |

## Wave 0 Deliverables for 14-VALIDATION.md

| 14-VALIDATION row | Status |
|------------------|--------|
| 14-01-T1 (papaparse + ConfirmDialog tone + NavTabs + Modal + MoreMenu + admin lib) | ✅ green |
| 14-01-T2 (ProjectJoinRequest vertical slice + DIP + atomic approve rollback) | ✅ green |
| 14-01-T3 (admin user/audit/stats/summary + alembic upgrade + Pitfalls 6+7) | ✅ green |
| 14-01-T4 (4 admin services + 12 hooks + optimistic update + revert-on-error) | ✅ green |

Wave 0 Requirements checklist (from 14-VALIDATION.md lines 86-99):

- [x] `cd Frontend2 && npm install papaparse@^5.5.3 @types/papaparse@^5.3.16`
- [x] `Frontend2/vitest.config.ts` already exists
- [x] `Frontend2/components/primitives/nav-tabs.tsx`
- [x] `Frontend2/components/primitives/modal.tsx`
- [x] `Frontend2/components/projects/confirm-dialog.tsx` extended with `tone` prop
- [x] `Frontend2/components/admin/shared/more-menu.tsx`
- [x] `Frontend2/services/admin-{join-request,user,audit,stats}-service.ts`
- [x] `Backend/alembic/versions/006_phase14_admin_panel.py` + alembic upgrade head executed
- [x] `Backend/app/domain/entities/project_join_request.py`
- [x] `Backend/app/domain/repositories/project_join_request_repository.py`

## Snake_case-vs-camelCase Decisions (Pitfall 2 discipline)

- **Backend ALWAYS ships snake_case** — `audit_log.extra_metadata.task_title`, `extra_metadata.project_key`, `extra_metadata.requested_by_admin_id`. The audit_repo writes raw dicts; the AdminAuditItemDTO `metadata: Optional[Dict]` field surfaces the dict as-is.
- **Frontend admin-* services apply snake → camel mapping ONLY at the boundary AND only on top-level keys per service shape** — e.g., `admin-join-request-service.mapPending` camelCases `requestedBy` / `targetUser` but preserves `full_name` / `avatar_url` inside the user object AND keeps `created_at` snake at the top level (matches profile-service.ts shape).
- **EXCEPTION — audit_log metadata stays snake_case ALL THE WAY** — frontend `activity-row.tsx` reads `md.task_key`, `md.project_name`, etc. directly. DO NOT add a camelCase mapper for audit metadata anywhere.
- **admin-stats-service.mapStats** is the one place that camelizes nested arrays — `project_velocities[].velocity_history` becomes `projectVelocities[].velocityHistory` because the chart consumer prefers camelCase prop names.

## Migration 006 Applied Confirmation

```
$ cd Backend && alembic upgrade head
INFO  [alembic.runtime.migration] Running upgrade 005_phase9 -> 006_phase14_admin_panel,
      Phase 14 admin panel schema: project_join_requests table only.

$ python -c "from sqlalchemy import inspect ...; assert 'project_join_requests' in tables"
True
```

## Hand-off Notes for Wave 2 Plans (14-02..14-08)

**No further infra setup needed.** Surface plans should consume:

- **Plan 14-02 (Admin layout + Overview)** uses NavTabs (8 tabs), Modal (Pending Requests modal), usePendingJoinRequests + useApproveJoinRequest + useRejectJoinRequest hooks. Middleware matcher edit + admin layout race-safe guard owned by Plan 14-02 (Pitfalls 3 + 10). PageHeader Rapor al / Denetim günlüğü buttons wired in Plan 14-11.
- **Plan 14-03 (Users tab)** uses MoreMenu (per-row), Modal (Add User + Bulk Invite + summary), useAdminUsers + useInviteUser + useBulkInvite + useDeactivateUser + useResetPassword + useChangeRole + useBulkAction. csv-parse for client preview + csv-export for server CSV download.
- **Plan 14-04 (Roles + Permissions placeholder)** uses permissions-static + Toggle primitive (disabled state).
- **Plan 14-05 (Projects tab)** uses MoreMenu (Archive + Delete only — D-B5 NO transfer-ownership) + ConfirmDialog `tone="danger"` for Delete.
- **Plan 14-06 (Workflows tab)** uses MoreMenu (Edit / Clone / Delete) + ConfirmDialog `tone="danger"`.
- **Plan 14-07 (Audit tab)** uses Modal (Filter modal), useAdminAudit (read), csv-export for /admin/audit.json. Pitfall 6 truncated flag → AlertBanner above table.
- **Plan 14-08 (Stats tab)** uses useAdminStats. Lazy-load chart components (D-C6).

**Backend admin endpoints reachable + tested:**
- GET /admin/join-requests, POST /admin/join-requests/{id}/{approve|reject}, POST /projects/{id}/join-requests
- POST /admin/users, POST /admin/users/bulk-invite, PATCH /admin/users/{id}/role, PATCH /admin/users/{id}/deactivate, POST /admin/users/{id}/password-reset, POST /admin/users/bulk-action, GET /admin/users.csv
- GET /admin/audit, GET /admin/audit.json
- GET /admin/stats
- GET /admin/summary.pdf

## Decisions & Deviations

### Auto-fixed Issues (Rule 1 — bug fixes)

1. **[Rule 1 - Bug] Test email literals contained markdown obfuscation pattern**
   - Found during: Task 3 first test run (test_admin_users_crud.py)
   - Issue: 15 occurrences of `[email protected]` (with embedded U+0020 space) — markdown email-link obfuscation that EmailStr rejected with "must have @-sign"
   - Fix: Replaced all 15 occurrences with realistic `*@testexample.com` emails per the project convention (CLAUDE.md: "EmailStr rejects .local TLD — use @testexample.com")
   - Files modified: Backend/tests/integration/test_admin_users_crud.py
   - Commit: 3f61dee0

2. **[Rule 1 - Bug] active_users_trend SQL string-concat failed under asyncpg**
   - Found during: Task 3 test_admin_stats_admin_gets_200 first run
   - Issue: `(:days || ' days')::INTERVAL` requires text input but caller passes int; asyncpg raises DataError type-mismatch
   - Fix: Switched to arithmetic interval `(:days * INTERVAL '1 day')` which accepts int param binding
   - Files modified: Backend/app/infrastructure/database/repositories/audit_repo.py
   - Commit: 3f61dee0

3. **[Rule 1 - Bug] list_recent_projects InvalidRequestError missing .unique()**
   - Found during: Task 3 test_admin_stats_admin_gets_200 second run
   - Issue: `_get_base_query()` eager-loads `ProjectModel.columns` (a collection); SQLAlchemy 2.0 requires `.unique()` before `.scalars().all()` for joined eager loads on collections
   - Fix: Added `.unique()` to the result chain
   - Files modified: Backend/app/infrastructure/database/repositories/project_repo.py
   - Commit: 3f61dee0

### Path Adjustments

- **INVITE_TOKEN_TTL_DAYS placement** — Plan referenced `Backend/app/core/config.py` but the actual codebase has no `app/core/` directory; the existing config singleton lives at `Backend/app/infrastructure/config.py`. Added the field there. Documented in commit message + this Summary.
- **Hook count** — Plan frontmatter mentions "14 hooks" in description text but the `files_modified` list and `key_links` enumerate 12 hook files. Built the 12 files in the file list (matching the 12 admin endpoint surfaces); if Plans 14-02/03 need additional hooks, they own that delta.
- **Toast contract** — Plan pseudocode used `tone: "danger"` but the existing `Frontend2/components/toast/index.tsx` exposes `variant: 'success' | 'error' | 'warning' | 'info'`. Aligned hooks with the real contract; documented in commit message.

### CLAUDE.md Driven Adjustments

- All 9 use cases verified DIP-clean: `grep -rn "import sqlalchemy\|from app.infrastructure" Backend/app/application/use_cases/{join_request,*_user,get_global_audit,get_admin_stats,generate_admin_summary_pdf}.py` returns 0 matches.
- Helper closures (`_make_role_id_resolver`, `_make_toggle_active`, `_make_update_role`) live in `admin_users.py` (router/wiring layer) so use cases stay free of Role table coupling — preserves CLAUDE.md §4.2 DI strategy.
- Migration 006 idempotent helpers copied verbatim from 005 (CLAUDE.md §6 + Pitfall 7 of Phase 9 RESEARCH.md).

### Out-of-Scope Discoveries (deferred-items.md)

- Pre-existing TypeScript build error in `app/(shell)/reports/page.tsx:158` (StatCard `tone="warning"` not in narrowed enum) — origin Phase 13 Plan 13-08, NOT touched by Plan 14-01. Logged in `.planning/phases/14-.../deferred-items.md` for a future cleanup phase. The Plan 14-01 unit + integration tests pass; only the strict end-to-end `next build` typecheck catches the pre-existing error.

## Self-Check: PASSED

- [x] All 4 task commits exist in git log (`0e1a94b2`, `185db363`, `3f61dee0`, `d1654642`)
- [x] All NEW frontend primitives have tests passing (24 tests across 5 files)
- [x] All NEW backend use cases have integration tests passing (34 tests across 6 files)
- [x] `cd Backend && alembic upgrade head` exited 0 — migration 006 applied
- [x] No `import sqlalchemy` / `from app.infrastructure` in Backend/app/application/use_cases/* for any of the 13 admin use case files (4 join-request + 9 admin-user/audit/stats/summary)
- [x] All Wave 0 deliverables checked off in 14-VALIDATION.md
- [x] No new lint errors introduced beyond the pre-existing baseline (some `any` warnings on error handlers consistent with existing hook patterns)
