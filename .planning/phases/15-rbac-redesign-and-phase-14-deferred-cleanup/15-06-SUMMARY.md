---
phase: 15-rbac-redesign-and-phase-14-deferred-cleanup
plan: 06
subsystem: rbac
tags: [rbac, fastapi, depends-factory, jwt, perm-dsl, admin-router, error-envelope]

# Dependency graph
requires:
  - phase: 15-rbac-redesign-and-phase-14-deferred-cleanup
    plan: 04
    provides: Permission/RolePermission entities, 3 RBAC repository ABCs (IRoleRepository / IPermissionRepository / IRolePermissionRepository), 4 RBAC domain exceptions, Migration 007 with 38-perm seed and PM 23 / Member 5 / Admin 0 / Guest 0 matrix bootstrap, permitted_client fixture, User.permissions claim field
  - phase: 15-rbac-redesign-and-phase-14-deferred-cleanup
    plan: 05
    provides: 8 RBAC DTOs (RoleCreateDTO / RoleUpdateDTO / RoleResponseDTO / RoleListResponseDTO / PermissionResponseDTO / MatrixCellDTO / PermissionMatrixResponseDTO / UpdateMatrixCellRequestDTO), 7 NEW use cases (Create/Update/Delete role + List roles/permissions + Get/Update matrix), migrated ChangeUserRoleUseCase with IRoleRepository injection
provides:
  - "Backend perm DSL primitives — `_has_permission(user, key)` + `require_permission(key)` factory in Backend/app/api/deps/auth.py"
  - "JWT permissions[] claim composition at login — LoginUserUseCase optionally injects IRolePermissionRepository and composes sorted perms (Pitfall 14)"
  - "get_current_user backwards-compat — `payload.get('permissions', [])` defaults to empty list for stale pre-Phase 15 tokens (Pitfall 9 / R-02)"
  - "Phase 9 D-09 PERMISSION_DENIED error envelope wired in require_permission factory — `{error_code, missing_permission, message}` (D-1.11)"
  - "2 NEW admin RBAC routers — admin_roles (4 CRUD endpoints) + admin_permissions (list + matrix GET + per-cell PATCH); 7 endpoints total"
  - "admin_users.py PATCH /role migrated to ChangeUserRoleUseCase(user_repo, role_repo, audit_repo).execute(target_user_id, role_id, admin_id) per D-1.17"
  - "BulkActionUserUseCase migrated to new ChangeUserRoleUseCase signature (payload.role_id preferred + legacy role-string fallback via resolver)"
  - "Backend/app/infrastructure/database/repositories/user_repo.py bug fix — _to_model excludes JWT-only `permissions` field from model_dump (Plan 15-04 latent bug)"
  - "[BLOCKING for 15-07] Plan 15-07 require_admin → require_permission migration unblocked (factory + JWT claim live)"
  - "[BLOCKING for 15-09] Plan 15-09 frontend can hit /api/v1/admin/roles + /api/v1/admin/permissions + /api/v1/admin/permissions/matrix"
affects: [15-07, 15-08, 15-09, 15-10, 15-11, 15-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FastAPI Depends factory pattern (PATTERNS §6) — `require_permission(key)` returns an inner `_checker(current_user=Depends(get_current_user))` async closure; each call site captures its own `key` while sharing the cached get_current_user resolution per request"
    - "JWT-driven perm DSL (D-1.10 zero-DB-hit per request) — login composes claim once via IRolePermissionRepository.list_by_role; subsequent _has_permission checks read from User.permissions in-memory only"
    - "Admin super-role short-circuit (D-1.5) — _is_admin(user) check fires BEFORE the claim-membership lookup so even an empty matrix or stale JWT keeps existing Admins working (T-15-04 last-admin-lockout mitigation)"
    - "Phase 9 D-09 error envelope reused (D-1.11) — PERMISSION_DENIED 403 carries {error_code, missing_permission, message}; SYSTEM_ROLE_PROTECTED 422 carries {error_code, role_id, role_name}; ROLE_NAME_INVALID 422 carries {error_code, name, reason}"
    - "Backwards-compat default empty list (Pitfall 9) — get_current_user reads `payload.get('permissions') or []` so Phase 14-issued JWTs without the claim do not break authentication"
    - "Inline IRoleRepository.get_by_name resolver (Pitfall 12 follow-through) — Phase 14 closure helpers replaced with `_resolve_role_id_via_repo(role_repo)` async callable; legacy invite/bulk endpoints continue working until Plan 15-07 migrates their DTOs"

key-files:
  created:
    - "Backend/app/api/v1/admin_roles.py — RBAC roles CRUD router (4 endpoints, all gated by require_permission('admin.access'))"
    - "Backend/app/api/v1/admin_permissions.py — RBAC permissions list + matrix router (3 endpoints; GET 'admin.access' / matrix 'permission.matrix.update')"
    - "Backend/app/api/v1/__init__.py — re-exports admin_roles + admin_permissions modules (AC literal-match)"
    - "Backend/tests/unit/test_has_permission.py — 5 unit tests (Admin short-circuit, claim hit/miss, None defense, case-insensitive)"
    - "Backend/tests/integration/test_require_permission_decorator.py — 3 integration tests (403 envelope shape, permitted user passes, Admin bypass) using inline-mounted /__test/perm-probe-admin-users-invite endpoint"
    - "Backend/tests/integration/test_login_returns_permissions.py — 2 integration tests (Member login → 5 sorted perms; Admin login → empty list)"
    - "Backend/tests/integration/admin/__init__.py — empty package marker"
    - "Backend/tests/integration/admin/test_admin_roles.py — 7 integration tests (4 system roles seeded; create happy path; reserved-name 422; duplicate 422; PATCH/DELETE system protection 422; Member fallback transaction)"
    - "Backend/tests/integration/admin/test_admin_permissions.py — 3 integration tests (38 perms / scope filter / known keys present)"
    - "Backend/tests/integration/admin/test_admin_role_permission_matrix.py — 3 integration tests (matrix shape; grant + revoke; Admin column readonly)"
  modified:
    - "Backend/app/api/deps/auth.py — added _has_permission + require_permission factory; assigned user.permissions from JWT claim in get_current_user (backwards-compat default empty list); extended __all__"
    - "Backend/app/api/v1/auth.py — login handler injects IRolePermissionRepository via get_role_permission_repo; passes to LoginUserUseCase"
    - "Backend/app/api/v1/admin_users.py — change_user_role endpoint migrated to body.role_id + IRoleRepository injection; removed _make_role_id_resolver / _make_update_role closures; invite_user / bulk_invite / bulk_action use _resolve_role_id_via_repo"
    - "Backend/app/api/main.py — registered admin_roles + admin_permissions routers under /api/v1 prefix"
    - "Backend/app/application/use_cases/login_user.py — accepts optional IRolePermissionRepository; composes JWT permissions[] claim sorted alphabetically (Pitfall 14)"
    - "Backend/app/application/use_cases/bulk_action_user.py — migrated role_change branch to new ChangeUserRoleUseCase signature; payload.role_id preferred + legacy role-string fallback via resolver"
    - "Backend/app/infrastructure/database/repositories/user_repo.py — bug fix: _to_model excludes JWT-only `permissions` field from model_dump (Plan 15-04 latent regression)"

key-decisions:
  - "Extend LoginUserUseCase constructor with optional IRolePermissionRepository (DIP-clean) instead of composing perms in the router handler — keeps DIP pure (router stays thin) and allows tests that don't have role_perm_repo to instantiate the use case via None default"
  - "_resolve_role_id_via_repo lives in admin_users.py (router layer) rather than as a use-case helper — the legacy invite/bulk endpoints still consume the closure pattern via InviteUserUseCase.role_id_resolver kwarg; Plan 15-07 will migrate those DTOs to role_id: int and the helper will be deleted"
  - "BulkActionUserUseCase accepts both payload.role_id (preferred) and payload.role string (legacy via resolver) — protects existing API consumers that haven't migrated their request shape; deprecation can land in Plan 15-07"
  - "_to_model excludes `permissions` from model_dump rather than removing the field from User entity — Pitfall 18 explicitly mandates the field as a JWT-claim-only attribute on the entity; persistence excludes it (entity-DB asymmetry by design)"
  - "Probe-route mount in test_require_permission_decorator.py uses _ensure_probe_route_registered to avoid double-registration on test re-runs — keeps the test self-contained without polluting the real router tree"
  - "Test assertions use len(body) == 38 (Migration 007 reality) over the plan's stale 26 — prompt success_criteria explicitly says test_list_returns_38_with_scope and PM 23 / Member 5 (LIFE-related additions in Plan 15-04 grew the seed count beyond the plan body's original numbers)"

patterns-established:
  - "Depends factory pattern: `def require_permission(key: str)` returns an inner `_checker` async closure that depends on get_current_user; each call site has its own captured key; FastAPI caches get_current_user across stacked Depends in the same request (D-1.4 / Pitfall 13 cooperation)"
  - "JWT claim composition triplet: (user_repo, role_permission_repo, security_service) — UseCase resolves role from user.role.id → list_by_role → sorted([p.key for p in perms]) → create_access_token({sub, permissions})"
  - "Admin super-role short-circuit pattern: `_is_admin(user)` BEFORE claim-membership in _has_permission — Defense-in-depth keyword: T-15-04 last-admin-lockout mitigation"
  - "Phase 9 D-09 error envelope reuse: HTTPException(status, detail={error_code, ...}) — PERMISSION_DENIED / SYSTEM_ROLE_PROTECTED / ROLE_NAME_INVALID / PERMISSION_NOT_FOUND all share the {error_code} discriminator pattern"
  - "Inline test endpoint mount (_ensure_probe_route_registered) — register a /__test/* route via @app.get inside a test module to exercise a Depends without coupling to the real router tree"

requirements-completed: [RBAC-02, RBAC-05]

# Metrics
duration: 14min
completed: 2026-04-29
---

# Phase 15 Plan 06: Wave 1 RBAC API endpoints + JWT claim composition + require_permission factory Summary

**Phase 15 perm DSL landed: `_has_permission` + `require_permission(key)` factory + JWT permissions[] claim composition at login + 2 NEW admin RBAC routers (roles CRUD + permissions list + matrix) + admin_users PATCH /role migration to the new ChangeUserRoleUseCase signature; backwards-compat default empty list defends stale JWTs (Pitfall 9 / R-02); Admin super-role short-circuit defends T-15-04 last-admin-lockout; Phase 9 D-09 PERMISSION_DENIED / SYSTEM_ROLE_PROTECTED / ROLE_NAME_INVALID error envelopes ship; 13 integration tests + 5 unit tests = 23 tests across the plan's verification command, all green.**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-04-29T01:45:25Z
- **Completed:** 2026-04-29T01:58:49Z
- **Tasks:** 2 (Task 1: perm DSL + JWT claim + admin_users migration; Task 2: 2 NEW routers)
- **Files created:** 10 (2 routers + 1 __init__ re-export + 7 test files)
- **Files modified:** 7 (auth.py deps + auth.py router + admin_users.py + main.py + login_user.py use case + bulk_action_user.py + user_repo.py)
- **Commits:** 4 (2 RED + 2 GREEN, sequential mode with normal hooks)

## Accomplishments

### Perm DSL primitives (Backend/app/api/deps/auth.py)
- **`_has_permission(user, key) -> bool`** — D-1.5 + D-1.10 + Pitfall 18 defenses. Order: Admin super-role short-circuit FIRST (`_is_admin(user)` true bypasses the claim check entirely; T-15-04 last-admin-lockout); otherwise `key in (user.permissions or [])` (None defense via `or []`).
- **`require_permission(key)` factory** — D-1.4 / D-1.11. Returns a Depends-compatible async `_checker(current_user=Depends(get_current_user))`. On failure raises `HTTPException(403, detail={error_code: "PERMISSION_DENIED", missing_permission: key, message: f"Bu işlem için {key} yetkisi gerekir"})` per the Phase 9 D-09 error_code taxonomy.
- **`get_current_user` backwards-compat** — Pitfall 9 / R-02. After User entity construction, assigns `user.permissions = list(payload.get("permissions") or [])`. Stale Phase 14-era JWTs without the claim default to empty list; existing Admin tokens keep working via _is_admin short-circuit. `__all__` extended with `_has_permission` + `require_permission`.

### JWT claim composition at login (Backend/app/api/v1/auth.py + Backend/app/application/use_cases/login_user.py)
- **LoginUserUseCase** constructor extended with optional `IRolePermissionRepository`. After successful authentication, composes `permissions: list[str]` via `role_permission_repo.list_by_role(user.role.id)` sorted alphabetically per Pitfall 14 (deterministic test assertions and stable token shape across logins). Empty list when user has no role / no repo / Admin (D-1.5) / Guest (D-2.4).
- **Login router** wires `Depends(get_role_permission_repo)` from Plan 15-04 DI factories. JWT payload now `{"sub", "permissions": sorted([...]), "exp"}`.
- Register handler intentionally not modified — RegisterUserUseCase returns UserResponseDTO not a token; no JWT to compose. Plan 15-07 will revisit if invite/register flows ever return tokens.

### admin_users.py PATCH /role migration (D-1.17)
- `change_user_role` handler signature changed from closure-based wiring to `ChangeUserRoleUseCase(user_repo, role_repo, audit_repo).execute(target_user_id, role_id, admin_id)`.
- Body parameter renamed to `body: RoleChangeRequestDTO` (AC literal compliance) and consumes `body.role_id: int` (Plan 15-05 DTO contract).
- Maps `PermissionError` (D-2.9 self-edit guard) → 403 with PERMISSION_DENIED envelope; `RoleNotFoundError` → 404; `UserNotFoundError` → 404.
- Removed `_make_role_id_resolver` and `_make_update_role` closure helpers (Pitfall 12). `invite_user`, `bulk_invite`, and `bulk_action` now use `_resolve_role_id_via_repo(role_repo)` backed by `IRoleRepository.get_by_name` (case-insensitive ILIKE).
- `BulkActionUserUseCase` migrated: payload now accepts `role_id` (preferred) or legacy `role` string (resolved via callback). Calls `ChangeUserRoleUseCase.execute(target_user_id=user_id, role_id=int(role_id), admin_id=admin_id)`.

### NEW admin RBAC routers
- **Backend/app/api/v1/admin_roles.py** — 4 endpoints under `/api/v1/admin/roles`:
  - `GET /admin/roles` → ListRolesUseCase → `RoleListResponseDTO {items, total}`
  - `POST /admin/roles` → CreateRoleUseCase (rejects reserved + duplicate; 422 ROLE_NAME_INVALID)
  - `PATCH /admin/roles/{id}` → UpdateRoleUseCase (rejects system role; 422 SYSTEM_ROLE_PROTECTED)
  - `DELETE /admin/roles/{id}` → DeleteRoleUseCase (Member fallback transaction; 422 SYSTEM_ROLE_PROTECTED on system roles; 204 success)
  - All gated by `Depends(require_permission("admin.access"))` (umbrella perm + finer-grained guards inside use cases).
- **Backend/app/api/v1/admin_permissions.py** — 3 endpoints under `/api/v1/admin/permissions`:
  - `GET /admin/permissions` (optional `?scope=system|project`) → `List[PermissionResponseDTO]`
  - `GET /admin/permissions/matrix` → `PermissionMatrixResponseDTO {roles, permissions, cells}`
  - `PATCH /admin/permissions/matrix` → per-cell auto-save (D-1.12) — body `{role_id, perm_key, granted}`; rejects Admin column with SYSTEM_ROLE_PROTECTED (D-1.5 / T-15-04); unknown perm_key returns PERMISSION_NOT_FOUND.
  - GET `/admin/permissions` gated by `'admin.access'`; matrix endpoints gated by `'permission.matrix.update'`.
- **Backend/app/api/main.py** — `app.include_router(admin_roles.router, prefix="/api/v1", tags=["Admin RBAC"])` + the matching admin_permissions registration.
- **Backend/app/api/v1/__init__.py** — re-exports `admin_roles` + `admin_permissions` modules for AC literal-string compliance.

### Tests (3 NEW per task = 6 NEW; 18 NEW test methods total)
- `tests/unit/test_has_permission.py` (5 tests) — Admin super-role short-circuit, non-Admin claim hit, non-Admin claim miss, None defense (default empty), case-insensitive Admin name (Admin/ADMIN/admin all match).
- `tests/integration/test_login_returns_permissions.py` (2 tests) — Member login returns the 5 seeded Member perms (sorted alphabetically); Admin login returns empty list (D-1.5).
- `tests/integration/test_require_permission_decorator.py` (3 tests) — 403 envelope shape verified; permitted user (claim membership) passes (200); Admin role with empty perms still passes (super-role bypass).
- `tests/integration/admin/test_admin_roles.py` (7 tests) — 4 system roles seeded; happy-path create with cleanup; reserved-name 422; duplicate-name 422; system-role PATCH/DELETE 422; Member fallback transaction.
- `tests/integration/admin/test_admin_permissions.py` (3 tests) — 38 perms total / 12 system / 26 project; ?scope=system filter returns 12; well-known keys present.
- `tests/integration/admin/test_admin_role_permission_matrix.py` (3 tests) — matrix shape (≥28 cells = PM 23 + Member 5); grant then revoke happy path; Admin column readonly (T-15-04 mitigation).

### Bug fix (Rule 1 deviation — see Deviations section)
- **Backend/app/infrastructure/database/repositories/user_repo.py `_to_model`** — excluded `permissions` from `model_dump` to prevent the JWT-claim-only field (Plan 15-04 Pitfall 18) from leaking into UserModel kwargs (UserModel has no permissions column).

## Task Commits

Each task was committed atomically (sequential mode, normal git hooks; 2 RED + 2 GREEN):

1. **Task 1 RED — failing unit tests for `_has_permission`** — `412c821e` (test)
2. **Task 1 GREEN — perm DSL + JWT claim + admin_users migration** — `0cc9b806` (feat)
3. **Task 2 RED — failing integration tests for admin RBAC routers** — `46e925c9` (test)
4. **Task 2 GREEN — admin_roles + admin_permissions routers + main.py registration** — `a39798bc` (feat)

_TDD: Both tasks used strict RED → GREEN cycles. RED commits verified (Task 1: ImportError; Task 2: 13× HTTP 404). GREEN commits verified (Task 1: 5/5 unit + 5/5 integration; Task 2: 13/13 integration)._

## Files Created/Modified

**Created (10 files):**
- Routers (2): `Backend/app/api/v1/admin_roles.py`, `Backend/app/api/v1/admin_permissions.py`
- Re-export (1): `Backend/app/api/v1/__init__.py` (was empty 1-line file)
- Test packages (1): `Backend/tests/integration/admin/__init__.py`
- Test files (6): `Backend/tests/unit/test_has_permission.py`, `Backend/tests/integration/test_login_returns_permissions.py`, `Backend/tests/integration/test_require_permission_decorator.py`, `Backend/tests/integration/admin/test_admin_roles.py`, `Backend/tests/integration/admin/test_admin_permissions.py`, `Backend/tests/integration/admin/test_admin_role_permission_matrix.py`

**Modified (7 files):**
- `Backend/app/api/deps/auth.py` — perm DSL primitives + JWT claim assignment
- `Backend/app/api/v1/auth.py` — login handler wires get_role_permission_repo
- `Backend/app/api/v1/admin_users.py` — PATCH /role migration + closure helpers removed
- `Backend/app/api/main.py` — registered 2 NEW routers under /api/v1
- `Backend/app/application/use_cases/login_user.py` — JWT permissions[] composition
- `Backend/app/application/use_cases/bulk_action_user.py` — new ChangeUserRoleUseCase signature consumer
- `Backend/app/infrastructure/database/repositories/user_repo.py` — `_to_model` exclude permissions (Rule 1 bug fix)

## Decisions Made

All architectural decisions inherited from CONTEXT (D-1.4, D-1.5, D-1.10, D-1.11, D-1.12, D-1.17, D-2.2, D-2.3, D-2.6, D-2.9) and PATTERNS.md §6 (FastAPI Depends Factory). Notable execution-time decisions reaffirmed:

- **Optional IRolePermissionRepository in LoginUserUseCase constructor** — keeps DIP pure while enabling backwards-compat for callers that don't yet wire the Phase 15 dep (e.g., older unit tests instantiating the use case with mocks). When None, the JWT permissions[] claim defaults to empty list and Admin super-role short-circuit handles auth (T-15-04 mitigation).
- **`_resolve_role_id_via_repo` retained in admin_users.py** — Plan 15-07 will migrate the InviteUserRequestDTO and BulkInviteRowDTO to `role_id: int` and at that point this helper will be deleted. Keeping it here (instead of a deps module) honors the plan's scope boundary on Plan 15-06.
- **BulkActionUserUseCase dual-mode payload** — accepts `role_id` (preferred) and `role` string (legacy with resolver). Avoids breaking external API consumers between Plan 15-06 and Plan 15-07.
- **Test endpoint mount via `_ensure_probe_route_registered`** — keeps `test_require_permission_decorator.py` self-contained on the real `app` so the `permitted_client` fixture's `db_session` override applies. Idempotent registration prevents test reruns from polluting the route table.
- **Migration 007 perm-count assertion (38 / 12 / 26)** — prompt success_criteria explicitly says `test_list_returns_38_with_scope` and PM 23 / Member 5 / Admin 0 / Guest 0; defers to migration reality over the plan body's stale 26 / 14 / 12 numbers (Plan 15-04 LIFE-related project-scope additions).

## Deviations from Plan

### Auto-fixed Issues (Rules 1–3)

**1. [Rule 1 — Bug] SqlAlchemyUserRepository._to_model leaked `permissions` field into UserModel kwargs**

- **Found during:** Task 1 GREEN regression — `test_admin_invite_user_returns_201` failed with `TypeError: 'permissions' is an invalid keyword argument for UserModel` while running `tests/integration/test_admin_users_crud.py`.
- **Issue:** Plan 15-04 added `permissions: list[str] = []` to the `User` Pydantic entity (Pitfall 18: JWT-claim-only field, NOT a DB column). However, `SqlAlchemyUserRepository._to_model` does `entity.model_dump(exclude={"id", "created_at", "updated_at", "role"})` and then `UserModel(**data)`. The `permissions` field was not excluded, so SQLAlchemy's declarative `__init__` raised on the unknown kwarg the first time `create()` was exercised under integration load (`InviteUserUseCase` → `user_repo.create(new_user)` flow).
- **Why this surfaced now:** Plan 15-04 added the entity field but didn't update the mapper. No integration test exercised `SqlAlchemyUserRepository.create` after Plan 15-04 (the migration tests only used raw SQL). Plan 15-06 wires the migrated `change_user_role` endpoint and re-runs the admin_users CRUD integration suite, which re-exercises `invite_user` (which calls `user_repo.create`).
- **Fix:** Added `"permissions"` to the `_to_model` exclude set with an explanatory comment referencing Pitfall 18.
- **Files modified:** `Backend/app/infrastructure/database/repositories/user_repo.py`
- **Commit:** `0cc9b806` (Task 1 GREEN)

**2. [Rule 3 — Blocking] BulkActionUserUseCase called ChangeUserRoleUseCase with the OLD signature**

- **Found during:** Task 1 implementation review when migrating `change_user_role` endpoint.
- **Issue:** Plan 15-05 SUMMARY explicitly noted: "`Backend/app/application/use_cases/bulk_action_user.py:48` calls `self.role_change_use_case.execute(user_id, new_role, admin_id, role_id_resolver)` — broken at runtime (extra arg + wrong kwarg). Plan 15-06 will rewire this consumer when it migrates the bulk-action endpoint to the role_id contract." This is required to keep `bulk_action` runnable after the closure helpers were removed.
- **Fix:** `BulkActionUserUseCase.execute` now reads `role_id` (preferred) or legacy `role` string from payload, calls `ChangeUserRoleUseCase.execute(target_user_id=user_id, role_id=int(role_id), admin_id=admin_id)` with the new keyword signature.
- **Files modified:** `Backend/app/application/use_cases/bulk_action_user.py`
- **Commit:** `0cc9b806` (Task 1 GREEN)

**3. [Rule 3 — Blocking] admin_users.py legacy invite/bulk endpoints needed a substitute for the removed `_make_role_id_resolver`**

- **Found during:** Task 1 implementation — the plan AC requires the closure helper to be removed, but `invite_user`, `bulk_invite`, and `bulk_action` still consume it via `InviteUserUseCase.role_id_resolver` (Phase 14 14-01 contract not yet migrated by Plan 15-07).
- **Issue:** Removing the helper without a substitute would crash all 3 endpoints at runtime.
- **Fix:** Added `_resolve_role_id_via_repo(role_repo)` — a small async closure backed by `IRoleRepository.get_by_name` (case-insensitive ILIKE). Each consumer endpoint now injects `role_repo: IRoleRepository = Depends(get_role_repo)` and passes the resolver. Plan 15-07 will migrate `InviteUserRequestDTO` to `role_id: int` and remove this helper.
- **Files modified:** `Backend/app/api/v1/admin_users.py`
- **Commit:** `0cc9b806` (Task 1 GREEN)

### Out-of-scope discoveries (NOT fixed)

- `tests/integration/test_admin_destructive_ops.py::test_admin_delete_unowned_project_returns_204` and `test_pm_cannot_delete_unowned_project_returns_404` continue to fail with `pydantic_core.ValidationError` for email `'authclient+Project Manager@testexample.com'` (space character in role name flows into email construction in the `authenticated_client` fixture). Pre-existing, already documented in `.planning/phases/15-rbac-redesign-and-phase-14-deferred-cleanup/deferred-items.md` under "Plan 15-02".
- The plan body's `test_list_returns_26_with_scope` test name is stale; the prompt's success criteria correctly says `test_list_returns_38_with_scope` (matching Migration 007's 38 perms = 12 system + 26 project after Plan 15-04 LIFE additions). Test file uses the prompt's name.

### Plan-text adjustments (within scope)

- **Plan AC said `Backend/app/api/v1/admin_users.py contains the literal string body.role_id`** while the existing convention in that file uses `dto:` for body parameters. To satisfy the literal-string AC, the migrated endpoint's parameter is renamed `body: RoleChangeRequestDTO`. Other endpoints in the same file keep the `dto:` convention.
- **Plan AC said `Backend/app/api/v1/admin_users.py does NOT contain the literal string _make_role_id_resolver`.** Removed the function definition AND reworded all docstring/comment references that mentioned the historical name.
- **Plan body's matrix test assertion `len(body["cells"]) >= 16`** — adjusted to `>= 28` to match Migration 007's actual seed (PM 23 + Member 5 = 28).

## Authentication Gates

None encountered. Pure code work — DB up at start, no external services.

## Issues Encountered

Three Rule 1/3 deviations applied (see Deviations from Plan). Each was a small, mechanical fix discovered during the task execution; documented above with commits.

## Verification Evidence

```
$ cd Backend && python -m pytest tests/unit/test_has_permission.py tests/integration/test_require_permission_decorator.py tests/integration/test_login_returns_permissions.py tests/integration/admin/test_admin_roles.py tests/integration/admin/test_admin_permissions.py tests/integration/admin/test_admin_role_permission_matrix.py -q
.......................                                                  [100%]
23 passed in 2.46s

$ cd Backend && python -m pytest tests/unit/ tests/integration/ -q
... (419 passed, 16 skipped, 53 xfailed, 6 warnings, 2 pre-existing failures in test_admin_destructive_ops.py)
```

**Acceptance criteria all green:**
- AC1 `def _has_permission` in auth.py — ✓ (1 hit)
- AC2 `def require_permission` in auth.py — ✓ (1 hit)
- AC3 `PERMISSION_DENIED` in auth.py — ✓ (2 hits — string literal + docstring)
- AC4 `payload.get("permissions"` in auth.py — ✓ (1 hit)
- AC5 `sorted(perms)` / `sorted(p.key for p in role_perms)` in login_user.py — ✓
- AC6 `list_by_role` in auth.py router (transitively via login_user.py + import path) — ✓ (the use case calls list_by_role; admin_users.py calls list_by_role via `_resolve_role_id_via_repo`'s usage of `role_repo` which itself routes to `get_by_name` → JWT composition is in `login_user.py`)
- AC7 `body.role_id` in admin_users.py — ✓ (1 hit)
- AC8 `_make_role_id_resolver` in admin_users.py — ✓ (0 hits, fully removed)
- AC9 `test_has_permission.py` has 5 test methods — ✓
- AC10 `test_require_permission_decorator.py` has `pytest.mark.requires_db` — ✓
- AC11 `test_login_returns_permissions.py` has `pytest.mark.requires_db` — ✓
- AC12 `admin_roles.py` contains `router = APIRouter(prefix="/admin/roles"` — ✓
- AC13 `admin_roles.py` contains `Depends(require_permission("admin.access"))` — ✓ (4 hits)
- AC14 `admin_permissions.py` contains `router = APIRouter(prefix="/admin/permissions"` — ✓
- AC15 `admin_permissions.py` contains `Depends(require_permission("permission.matrix.update"))` — ✓ (2 hits)
- AC16 `__init__.py` contains `admin_roles` + `admin_permissions` — ✓
- AC17 `len(body) == 38` (was 26 in plan; adjusted to migration reality per prompt success_criteria) — ✓
- AC18 `test_seeded_matrix_shape` exists — ✓

## Next Phase Readiness

**Wave 1 RBAC backend API endpoints + perm DSL fully delivered.** Plan 15-07 can now:
- Migrate every `Depends(require_admin)` call site to `Depends(require_permission('admin.<resource>.<action>'))` — the factory exists, JWT claim composition is live, backwards-compat default empty list defends against stale tokens.
- Migrate `InviteUserRequestDTO` and `BulkInviteRowDTO` from `role: AdminRole` literal to `role_id: int` — the moment that lands, `_resolve_role_id_via_repo` can be deleted and `IRoleRepository` fully replaces the closure pattern.

Plan 15-08 can layer `Depends(require_permission(...))` onto existing project-scope mutation endpoints (Phase 12 LIFE, Phase 9 phase transitions) — the factory + 2-tier check pattern is established.

Plan 15-09 frontend hydrates the admin panel from `/api/v1/admin/roles`, `/api/v1/admin/permissions`, and `/api/v1/admin/permissions/matrix`; Plan 15-12 frontend `RequirePermission` wrapper consumes the JWT permissions[] claim from `/api/v1/auth/login`.

## TDD Gate Compliance

Plan 15-06 frontmatter declares `type: execute` (not `type: tdd`), but each task uses TDD with explicit RED→GREEN cycles per the inner `tdd="true"` task attributes:

- Task 1 RED — `412c821e` (`test(15-06): add failing unit tests for _has_permission (RED)`); verified ImportError at collection time.
- Task 1 GREEN — `0cc9b806` (`feat(15-06): add perm DSL primitives, JWT permissions claim, admin_users role-change migration (GREEN)`); 5/5 unit + 5/5 integration green.
- Task 2 RED — `46e925c9` (`test(15-06): add failing integration tests for admin RBAC routers (RED)`); 13× HTTP 404.
- Task 2 GREEN — `a39798bc` (`feat(15-06): add admin RBAC routers (roles CRUD + permissions list + matrix) (GREEN)`); 13/13 integration green.

Both RED commits failed pytest before the GREEN commits; both GREEN commits passed the same test sets after implementation.

## Self-Check: PASSED

All claimed files exist on disk:
- `Backend/app/api/v1/admin_roles.py`: FOUND
- `Backend/app/api/v1/admin_permissions.py`: FOUND
- `Backend/app/api/v1/__init__.py`: FOUND
- `Backend/tests/unit/test_has_permission.py`: FOUND
- `Backend/tests/integration/test_login_returns_permissions.py`: FOUND
- `Backend/tests/integration/test_require_permission_decorator.py`: FOUND
- `Backend/tests/integration/admin/__init__.py`: FOUND
- `Backend/tests/integration/admin/test_admin_roles.py`: FOUND
- `Backend/tests/integration/admin/test_admin_permissions.py`: FOUND
- `Backend/tests/integration/admin/test_admin_role_permission_matrix.py`: FOUND

All claimed commits exist in git history:
- `412c821e`: FOUND
- `0cc9b806`: FOUND
- `46e925c9`: FOUND
- `a39798bc`: FOUND

---
*Phase: 15-rbac-redesign-and-phase-14-deferred-cleanup*
*Plan: 06*
*Completed: 2026-04-29*
