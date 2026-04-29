---
phase: 15-rbac-redesign-and-phase-14-deferred-cleanup
plan: 04
subsystem: rbac
tags: [permissions, rbac, alembic, sqlalchemy, pydantic, fastapi, postgres, jwt]

# Dependency graph
requires:
  - phase: 14-admin-panel-prototype
    provides: project_join_requests table baseline (Migration 006); admin panel scaffolding
  - phase: 15-rbac-redesign-and-phase-14-deferred-cleanup (Plans 15-01..15-03)
    provides: Wave 0 TIDY baseline — requires_db marker, permitted_client groundwork, audit infra
provides:
  - Permission and RolePermission domain entities (Pydantic v2 BaseModel, ConfigDict from_attributes=True)
  - IPermissionRepository / IRolePermissionRepository / IRoleRepository ABCs (Pitfall 12 — IRoleRepository NEW)
  - SqlAlchemy*Repository implementations (LSP-compliant)
  - PermissionModel + RolePermissionModel ORM (VARCHAR(16) + CHECK over native ENUM per Pitfall 1)
  - Migration 007 with 38-permission seed (12 system + 26 project) + matrix bootstrap (PM 23 / Member 5 / Admin 0 / Guest 0)
  - 4 new domain exceptions (RoleNotFoundError, SystemRoleProtectedError, RoleNameInvalidError, PermissionDeniedError)
  - User entity gains permissions: list[str] = [] (Pitfall 18 — JWT claim, no DB persist)
  - permitted_client pytest fixture with sorted permissions claim (Pitfall 14)
  - DI factories (get_role_repo / get_permission_repo / get_role_permission_repo)
  - [BLOCKING] Schema push gate satisfied — Plan 15-05 unblocked
affects: [15-05, 15-06, 15-07, 15-08, 15-09, 15-10, 15-11, 15-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fat-infra Wave pattern (Plan 15-04 mirrors Phase 14 14-01) — domain entities + ABCs + ORM + repo impls + DI factories + migration in a single bootstrap plan"
    - "VARCHAR(N) + CheckConstraint over native PostgreSQL ENUM (Pitfall 1) — easier idempotent ALTER without CREATE TYPE / ALTER TYPE complexity"
    - "Idempotent Alembic migration helpers (_table_exists / _column_exists / _index_exists copied verbatim from 005_phase9_schema.py)"
    - "ON CONFLICT DO NOTHING / WHERE NOT EXISTS guards on every INSERT seed (Pitfall 8 replay safety)"
    - "Composite-PK junction table mirroring TeamProjectModel (role_id, permission_id) with CASCADE FKs"
    - "permitted_client fixture pattern (D-1.15) — JWT claim isolation from live role_permissions matrix; sorted alphabetically for deterministic assertions (Pitfall 14)"

key-files:
  created:
    - "Backend/app/domain/entities/permission.py — Permission(BaseModel) with Literal['system','project'] scope"
    - "Backend/app/domain/entities/role_permission.py — RolePermission(BaseModel) junction"
    - "Backend/app/domain/repositories/permission_repository.py — IPermissionRepository ABC"
    - "Backend/app/domain/repositories/role_permission_repository.py — IRolePermissionRepository ABC"
    - "Backend/app/domain/repositories/role_repository.py — IRoleRepository ABC (NEW per Pitfall 12)"
    - "Backend/app/infrastructure/database/models/permission.py — PermissionModel ORM (VARCHAR(16) + CHECK)"
    - "Backend/app/infrastructure/database/models/role_permission.py — RolePermissionModel junction (composite PK + CASCADE)"
    - "Backend/app/infrastructure/database/repositories/permission_repo.py — SqlAlchemyPermissionRepository"
    - "Backend/app/infrastructure/database/repositories/role_permission_repo.py — SqlAlchemyRolePermissionRepository"
    - "Backend/app/infrastructure/database/repositories/role_repo.py — SqlAlchemyRoleRepository"
    - "Backend/app/api/deps/role.py — DI factories"
    - "Backend/alembic/versions/007_phase15_rbac.py — idempotent migration with 38-perm seed + matrix bootstrap"
    - "Backend/tests/unit/test_permission_entity.py — 5 unit tests"
    - "Backend/tests/integration/test_migration_007_idempotency.py — 4 integration tests (requires_db)"
    - "Backend/tests/integration/test_permitted_client_fixture.py — 2 integration tests (requires_db)"
  modified:
    - "Backend/app/domain/entities/role.py — added is_system_role / icon_key / color_token"
    - "Backend/app/domain/entities/user.py — added permissions: list[str] = [] claim field (Pitfall 18)"
    - "Backend/app/domain/exceptions.py — added 4 RBAC domain exceptions"
    - "Backend/app/infrastructure/database/models/role.py — added is_system_role / icon_key / color_token columns (legacy Column() style preserved)"
    - "Backend/app/infrastructure/database/models/__init__.py — registered PermissionModel + RolePermissionModel for Base.metadata.create_all (Pitfall 22)"
    - "Backend/alembic/env.py — registered new ORM modules for autogen safety"
    - "Backend/tests/conftest.py — extended _make_test_jwt with permissions kwarg + added permitted_client fixture"

key-decisions:
  - "VARCHAR(16) + CheckConstraint over native PostgreSQL ENUM for permissions.scope (Pitfall 1) — avoids CREATE TYPE / ALTER TYPE complexity in idempotent migrations"
  - "IRoleRepository ABC created NEW (Pitfall 12) — Phase 14 used a duck-typed callable; Plan 15-05 will migrate change_user_role.py to consume the proper ABC"
  - "Admin gets 0 explicit role_permissions rows (D-1.5 super-role) — _has_permission short-circuits via _is_admin in Plan 15-06; even if matrix wiped, super-role kicks in (T-15-04 last-admin lockout mitigation)"
  - "Guest gets 0 role_permissions rows (D-2.4) — salt okunur misafir hesabı, no granted perms"
  - "PM matrix = 23 perms (13 base + 10 LIFE-related) — PM intentionally lacks artifact.delete (does not delete others' files); has comment.edit/delete (moderation)"
  - "Member matrix = 5 perms (task.create/change_assignee/change_status + comment.create + artifact.create) — regular contributor, no admin-of-others (D-3.1)"
  - "User entity permissions field is claim-only (Pitfall 18) — populated by get_current_user from JWT in Plan 15-06, NEVER persisted to DB; default empty list defends against None"
  - "permitted_client fixture sorts permissions alphabetically (Pitfall 14) — deterministic test assertions across runs"

patterns-established:
  - "Fat-infra Wave 1 bootstrap: domain + ABCs + ORM + impls + DI + migration in a single plan (mirrors Phase 14 14-01)"
  - "Idempotent Alembic migration with information_schema / pg_indexes guard helpers + ON CONFLICT DO NOTHING / WHERE NOT EXISTS for every INSERT seed"
  - "Composite-PK junction model + CASCADE FKs (mirrors TeamProjectModel/TeamMemberModel)"
  - "Pydantic v2 entity with Literal[…] type for enum-style fields (rejected at construction with ValidationError)"
  - "JWT-driven permissions claim: Pitfall 14 (sorted alphabetically) + Pitfall 18 (default empty list)"

requirements-completed: [RBAC-01]

# Metrics
duration: 8min
completed: 2026-04-29
---

# Phase 15 Plan 04: Wave 1 RBAC Fat-Infra Bootstrap Summary

**Pure-Clean-Architecture RBAC foundation: domain entities + 3 repository ABCs + 3 ORM models + 3 SqlAlchemy repo impls + DI factories + idempotent Alembic Migration 007 with 38-permission seed (12 system + 26 project) and matrix bootstrap (PM 23 / Member 5 / Admin 0 / Guest 0); BLOCKING schema push verified replay-safe.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-29T01:17:55Z
- **Completed:** 2026-04-29T01:25:30Z
- **Tasks:** 3
- **Files created:** 15
- **Files modified:** 7
- **Commits:** 4 (1 RED test + 3 feat tasks)

## Accomplishments

- **Domain layer:** Permission/RolePermission entities, 3 repository ABCs (IPermissionRepository, IRolePermissionRepository, IRoleRepository), 4 new exceptions (RoleNotFoundError, SystemRoleProtectedError, RoleNameInvalidError, PermissionDeniedError); Role entity gains is_system_role/icon_key/color_token; User entity gains permissions: list[str] claim field
- **Infrastructure layer:** PermissionModel (VARCHAR(16) + CHECK), RolePermissionModel (composite PK + CASCADE FKs + granted_at), 3 SqlAlchemy repos with mapper helpers + ON CONFLICT DO NOTHING + ILIKE case-insensitive lookups; DI factories in Backend/app/api/deps/role.py
- **Migration 007:** Idempotent (replay-safe per Pitfall 8); 38 permissions seeded (26 project + 12 admin.*), 4 system roles flagged, role_permissions matrix bootstrapped, Guest role inserted; **schema pushed twice — both runs exit 0**
- **Test infrastructure:** permitted_client pytest fixture (D-1.15) with sorted permissions claim (Pitfall 14); _make_test_jwt accepts optional permissions kwarg
- **Verification:** All 11 Plan 15-04 tests pass; 162 unit tests + 27 xfailed in broader suite — no regressions
- **DIP preserved:** `Backend/app/domain/` contains zero SQLAlchemy/FastAPI imports

## Task Commits

Each task was committed atomically (sequential mode, normal git commits with hooks):

1. **Task 1 (RED): Failing test for Permission entity** — `e4fe454a` (test)
2. **Task 1 (GREEN): Domain layer (entities + ABCs + exceptions)** — `f676977b` (feat)
3. **Task 2: Infrastructure layer (ORM + repos + DI + permitted_client)** — `88ab9306` (feat)
4. **Task 3: Migration 007 + idempotency + permitted_client tests + schema push** — `cd587004` (feat)

_TDD: Task 1 follows the RED→GREEN cycle. Task 2 verifies via smoke imports. Task 3 verifies via integration tests + BLOCKING `alembic upgrade head` ×2._

## Files Created/Modified

**Created (15 files):**
- Domain entities: `Backend/app/domain/entities/permission.py`, `Backend/app/domain/entities/role_permission.py`
- Domain repositories: `Backend/app/domain/repositories/permission_repository.py`, `Backend/app/domain/repositories/role_permission_repository.py`, `Backend/app/domain/repositories/role_repository.py`
- ORM models: `Backend/app/infrastructure/database/models/permission.py`, `Backend/app/infrastructure/database/models/role_permission.py`
- Repo impls: `Backend/app/infrastructure/database/repositories/permission_repo.py`, `Backend/app/infrastructure/database/repositories/role_permission_repo.py`, `Backend/app/infrastructure/database/repositories/role_repo.py`
- DI: `Backend/app/api/deps/role.py`
- Migration: `Backend/alembic/versions/007_phase15_rbac.py`
- Tests: `Backend/tests/unit/test_permission_entity.py`, `Backend/tests/integration/test_migration_007_idempotency.py`, `Backend/tests/integration/test_permitted_client_fixture.py`

**Modified (7 files):**
- `Backend/app/domain/entities/role.py` — added is_system_role/icon_key/color_token (D-2.3, D-2.8)
- `Backend/app/domain/entities/user.py` — added permissions: list[str] = [] (Pitfall 18)
- `Backend/app/domain/exceptions.py` — added 4 RBAC domain exceptions
- `Backend/app/infrastructure/database/models/role.py` — added 3 columns (Column() legacy style preserved)
- `Backend/app/infrastructure/database/models/__init__.py` — registered new ORM models for Base.metadata
- `Backend/alembic/env.py` — registered new ORM modules for autogen
- `Backend/tests/conftest.py` — extended _make_test_jwt + added permitted_client fixture

## Decisions Made

All decisions inherited from CONTEXT (D-1.5, D-1.8, D-1.13, D-1.15, D-2.3, D-2.4, D-2.6, D-3.5) and RESEARCH (Pattern 1, Pattern 4 alternative, Pattern 5; Pitfalls 1, 8, 12, 14, 18, 22). No new architectural decisions made during execution.

Notable design points reaffirmed:
- **VARCHAR(16) + CHECK over native ENUM** (Pitfall 1) — easier idempotent migration, no CREATE TYPE / ALTER TYPE pain
- **Admin = 0 explicit perms** (D-1.5 super-role) — defends against last-admin lockout (T-15-04)
- **PM 23 / Member 5** matrix bootstrap — PM lacks artifact.delete (no other-user-file deletion), has comment.edit/delete (moderation); Member is contributor-only

## Deviations from Plan

None — plan executed exactly as written.

The plan also enumerated several "missing imports" that needed to be added in the conftest.py extension (`pytest_asyncio`, `asynccontextmanager`, `AsyncClient`, `ASGITransport`, `app`, `get_db_session`). When inspecting the existing conftest.py, all of these were already present from Plan 09-03 baseline, so no new imports were required for Task 2.

One minor proactive addition (NOT a deviation — within plan scope per ABC contract): registered `PermissionModel` + `RolePermissionModel` in:
1. `Backend/app/infrastructure/database/models/__init__.py` — needed for `Base.metadata.create_all()` to pick them up in test fixtures (Pitfall 22 directly mandates this)
2. `Backend/alembic/env.py` — needed for autogen safety on future migrations

Both additions are pure registration glue — no new behavior — and align with the plan's intent to land "all the building blocks" for Plan 15-05.

## Issues Encountered

None. The plan was thorough and the patterns from PATTERNS.md were directly applicable. The only surprise was that `alembic upgrade head` cleanly handled both runs (first applies migration, second is no-op at head — exactly what idempotency demands), confirming the design.

## User Setup Required

None — no external service configuration required. The migration runs against the existing PostgreSQL instance configured by `settings.DATABASE_URL`.

## Verification Evidence

```
$ cd Backend && alembic upgrade head
INFO  [alembic.runtime.migration] Running upgrade 006_phase14_admin_panel -> 007_phase15_rbac
$ find Backend -name __pycache__ -type d -exec rm -rf {} + 2>/dev/null
$ cd Backend && alembic upgrade head
(no-op — at head)
$ cd Backend && python -m pytest tests/unit/test_permission_entity.py tests/integration/test_migration_007_idempotency.py tests/integration/test_permitted_client_fixture.py -q
...........                                                              [100%]
11 passed in 0.55s
```

**Schema state confirmed:**
- TOTAL_PERMS=38 (SYSTEM=12, PROJECT=26)
- PM_PERMS=23, MEMBER_PERMS=5, ADMIN_PERMS=0, GUEST_PERMS=0
- SYS_ROLES=['Admin', 'Project Manager', 'Member', 'Guest'] (all is_system_role=true)

## Next Phase Readiness

**Wave 1 unblocked.** Plan 15-05 can now:
- Inject `IRoleRepository` / `IPermissionRepository` / `IRolePermissionRepository` ABCs into use cases
- Migrate `change_user_role.py` from duck-typed callable to proper ABC (Pitfall 12 closure)
- Begin building RBAC use cases on stable infra

Plan 15-06 can now compose JWT permissions claim via `list_by_role`. Plan 15-07 can migrate `require_admin → require_permission`. Plan 15-08 can add hibrit perm DSL on mutation endpoints. Frontend Plans 15-09..15-12 can call backend APIs (Plan 15-06+) against this schema.

## TDD Gate Compliance

Plan 15-04 frontmatter declares `type: execute` (not `type: tdd`), but Task 1 follows TDD with explicit RED→GREEN gates:
- RED commit: `e4fe454a` (`test(15-04): add failing test for Permission entity`)
- GREEN commit: `f676977b` (`feat(15-04): add RBAC domain layer ...`)

Tasks 2 and 3 use smoke-import + integration-test verification rather than TDD (consistent with infrastructure plans where the test contracts are integration-level migrations and fixtures, not pure unit behavior).

## Self-Check: PASSED

All claimed files exist on disk and all 4 commits are present in git history.

---
*Phase: 15-rbac-redesign-and-phase-14-deferred-cleanup*
*Plan: 04*
*Completed: 2026-04-29*
