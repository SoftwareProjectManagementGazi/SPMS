# Phase 15: RBAC Yeniden Tasarımı & Phase 14 Deferred Items Cleanup — Research

**Researched:** 2026-04-29
**Domain:** RBAC redesign (FastAPI + SQLAlchemy + Pydantic v2 + Alembic + Postgres ENUM + JWT claim) × Frontend RBAC UI (Next.js 16 + React 19 + TanStack Query v5 + lucide-react + oklch tokens) × Test infra cleanup (pytest hooks, vitest @xyflow/react harness, Pydantic v2 ValidationError → 422)
**Confidence:** HIGH for codebase patterns and existing infrastructure (every analog cited inline); MEDIUM for external library specifics (TanStack v5 optimistic mutation revert, FastAPI Depends ordering, PostgreSQL ENUM idempotency); HIGH for downstream contract risk (Phase 14-11 D-D2 regression guard).

## Summary

Phase 15 has two legs that share **zero database / use-case dependencies** and one shared baseline gate (Wave 0 TIDY ⇒ Wave 1+ RBAC). Build order per CONTEXT D-4.6 is fixed: TIDY first (Plans 15-01 → 15-03), then RBAC (Plans 15-04 → 15-12). The TIDY leg unblocks the regression baseline so RBAC plans can detect their own regressions; without it, the 19 + 11 + 3 pre-existing failures (Frontend workflow-editor + Backend unit + Backend integration `test_project_workflow_patch.py`) make every future "is this green?" answer ambiguous.

The RBAC leg lands as a **Clean Architecture vertical slice** that exactly mirrors Phase 14 14-01's "fat-infra Wave 0" pattern: domain entities → ORM models → repositories → use cases → DTOs → API routers + DI wiring → migration → tests. The novelties versus Phase 14 are five: (1) PostgreSQL ENUM column `permissions.scope` with idempotent migration, (2) JWT claim extension to carry `permissions[]` (~200-400B per typical user, comfortably below the 8KB header floor), (3) `require_permission(key)` decorator yan yana with existing `require_project_transition_authority` (Phase 9 D-15) and `get_project_member` (2-tier check D-1.13), (4) `permitted_client(perms=[...])` test fixture extending Phase 14 14-01's `authenticated_client` factory, (5) frontend `<RequirePermission perm='...'>` guard with hook + early-return composition. Every novelty has an established precedent inside this codebase already.

**Primary recommendation:** Plan 15-04 (Wave 1 fat infra) MUST be the structural twin of Plan 14-01 — the existing 14-01 PLAN.md sets the size, ordering, and test-first cadence. Subsequent plans (15-05..15-12) are surface plans that consume Plan 15-04's primitives, exactly as Phase 14 Plans 14-03..14-08 consumed Plan 14-01. Resist the temptation to inflate Plan 15-04 with use cases or routers — keep it pure infra (entities + repos + ORM + migration + DI + permitted_client fixture). Use cases and routers belong in 15-05 / 15-06, where they can be test-driven against the now-stable infra.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Permission storage (rows) | Database (Postgres `permissions`/`role_permissions`) | — | Source of truth; matrix UI reads from API which reads from these tables (D-1.8) |
| Permission scope metadata | Database (`permissions.scope` ENUM) | API (DTO surface) | Scope is data, not code — frontend reads via `GET /api/v1/admin/permissions` (D-3.5) |
| Permission check at request time | API / Backend Server (`Depends(require_permission(key))`) | Frontend Server (Client-side `<RequirePermission/>`) | Authoritative enforcement is server-side. Client guard is UX hide-only; tampering bypassable on client (cross-file rule line 417 in CONTEXT.md) |
| JWT claim composition | API (login/register handler) | — | Claim built once at login; passed through to client; client never composes it |
| JWT claim consumption | Frontend Client (`useAuth().permissions`) | Backend (decode in `get_current_user`) | Both sides decode the same JWT — frontend for UI, backend for `_has_permission` |
| Role CRUD use cases | Application (Backend use cases) | API (router thin shell) | Per Clean Architecture; routers wire DI only, no business logic |
| Role/permission audit emission | Application (use cases call `audit_repo.create_with_metadata`) | Database (audit_log row) | Reuses Phase 9 D-09 `extra_metadata` JSONB infra |
| Permission Matrix optimistic UI | Frontend Client (TanStack Query `onMutate`/`onError`) | API (PATCH /admin/permissions/matrix) | Client owns the rollback; server is the eventual-consistency authority (D-1.12) |
| Self-edit prevention | Backend (use case raises) + Frontend (button disabled) | — | Defense in depth — backend authoritative, frontend cosmetic (D-2.9) |
| System role protection | Backend (`is_system_role` check + 422) | Frontend (Düzenle/Sil butonları disabled) | Backend authoritative; frontend cosmetic. Hardcoded name guard rejected (kırılgan) (D-2.3) |
| Member fallback on role delete | Application (single transaction in `DeleteRoleUseCase`) | Database (UPDATE users + DELETE roles) | One transaction = atomic; no orphan users (D-2.2) |
| Custom role icon/color storage | Database (`roles.icon_key`, `roles.color_token` VARCHAR nullable) | Frontend (Modal picker) | Picker writes literal token names to DB; frontend reads via service (D-2.8) |
| Permission scope badge render | Frontend Client (`<PermissionScopeBadge/>`) | API (scope field in `GET /admin/permissions`) | Computed at render time from server-provided scope value (D-3.4) |
| TIDY-04 ReactFlowProvider test wrap | Test harness (vitest.setup or test wrapper helper) | — | Production code has the Provider already (`workflow-canvas-inner.tsx:129`) — the bug is that test mocks bypass it (D-4.1) |
| TIDY-03 ValidationError → 422 | API router (`projects.py` PATCH handler) | — | Pydantic v2 idiomatic translation, single edit site (D-4.3) |
| TIDY-05 requires_db skip | Test framework (`conftest.py` `pytest_collection_modifyitems`) | — | Hook fires before tests run; DB probe gates marker-tagged tests (D-4.4) |

## Standard Stack

> All versions verified against `Backend/requirements.txt` and `Frontend2/package.json` on 2026-04-29.

### Core (already shipped in repo — version-locked baseline)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | shipped | API framework | Phase 1 baseline; `Depends()` is the DI primitive used 200+ times across this codebase |
| SQLAlchemy 2.x async | shipped | ORM | Used by every repository in `Backend/app/infrastructure/database/`; `AsyncSession` pattern uniform |
| Pydantic v2 | shipped | DTOs + validation | All DTOs in `Backend/app/application/dtos/` use `BaseModel` + `ConfigDict(from_attributes=True)` |
| Alembic | shipped | Migrations | 6 migrations exist (`001_*` → `006_phase14_admin_panel.py`); idempotent helper functions established |
| python-jose | shipped | JWT encode/decode | Used in `Backend/app/api/deps/auth.py:32` (`jwt.decode`) and login handler |
| pytest + pytest-asyncio | shipped | Test framework | Async mode auto; `Backend/tests/conftest.py` is the canonical fixture file |
| httpx + ASGITransport | shipped | Integration test HTTP client | `authenticated_client` factory uses this pattern |
| Next.js | 16.2.4 | Frontend framework | App Router with `(shell)` / `(auth)` route groups; "this is NOT the Next.js you know" per `Frontend2/AGENTS.md` |
| React | 19.2.4 | UI library | Server vs Client Components — every interactive RBAC component MUST use `"use client"` directive |
| TanStack Query | 5.99.2 | Server-state caching | All hooks under `Frontend2/hooks/`; v5 optimistic mutation API uses `onMutate` / `onError` / `onSettled` |
| @xyflow/react | 12.10.2 | Workflow canvas (TIDY-04 only) | Production wraps `<ReactFlowProvider>` already; test harness needs it for non-mocked tests |
| lucide-react | 1.8.0 | Icons | 8 icons selected for picker: `User`, `Briefcase`, `ShieldCheck`, `Star`, `Eye`, `Settings`, `Globe`, `Award` (D-2.8) |
| vitest | 1.6.0 | Frontend test runner | Already configured in `Frontend2/vitest.config.ts` |
| @testing-library/react | 16.3.2 | RTL | Existing matrix-card / role-card tests use this |

### NEW for Phase 15 (no external library additions — every Phase 15 capability is built from existing primitives)

| Capability | Built On Top Of | Why Existing Stack Suffices |
|------------|-----------------|-----------------------------|
| `Permission` entity | `pydantic.BaseModel` + `ConfigDict(from_attributes=True)` | Same pattern as `Role` entity (`Backend/app/domain/entities/role.py:1-9`) |
| `IPermissionRepository` ABC | `abc.ABC` + `@abstractmethod` | Same pattern as 18 existing repositories |
| ENUM column | `sa.Enum` SQLAlchemy + native PostgreSQL | Phase 9 migration helper `_enum_value_exists` exists at `005_phase9_schema.py:69-84` (forward-compatible note about extending enums) |
| `require_permission` decorator | `fastapi.Depends` factory pattern | `require_admin` at `Backend/app/api/deps/auth.py:53-60` is the analog |
| `<RequirePermission/>` guard | React conditional render + custom hook | `useAuth()` (`auth-context.tsx:16`) is the analog for context-derived gating |
| Optimistic matrix mutation | TanStack Query `useMutation` `onMutate`/`onError` | Phase 14 D-W2 already established the pattern |

**Installation:** None — zero new dependencies. Verify by running `cd Backend && python -m pip list` and `cd Frontend2 && npm list --depth=0` before Plan 15-04 starts.

**Version verification (run before Plan 15-04):**
```bash
cd Backend && python -c "import alembic, sqlalchemy, pydantic, jose; print('alembic', alembic.__version__); print('sqla', sqlalchemy.__version__); print('pydantic', pydantic.VERSION); print('jose ok')"
cd Frontend2 && node -e "console.log(require('./package.json').dependencies)"
```

## Architecture Patterns

### System Architecture Diagram (RBAC enforcement chain)

```
                       ┌─────────────────────────────┐
   Login              │  POST /api/v1/auth/login    │
       │              │  → builds JWT with claim:   │
       ▼              │     {sub, permissions:[...]}│
   Frontend           └──────────────┬──────────────┘
   ──────────                        │
   localStorage                      ▼
   AUTH_TOKEN_KEY        ┌────────────────────────┐
   (Phase 10 D-03)       │  JWT (access token)    │
       │                 └───────────┬────────────┘
       ▼                             │
   AuthContext                       ▼
   useAuth().permissions ◀ ─ ─ ─ ─ ─ ╳ (no DB hit; claim-only)
       │                             │
       ▼                             │
   <RequirePermission perm='X'>      │
   (hook + early return)             │
       │                             │
       ▼                             │
   Renders children                  │
   only if hasPermission(X)          │
                                     │
   Frontend mutation                 │
   ──────────────────                │
   PATCH /admin/permissions/matrix   │
       │ Authorization: Bearer JWT   │
       ▼                             │
   FastAPI router                    ▼
   ──────────────                ┌───────────────────────────┐
   @router.patch(...)            │  get_current_user         │
   async def update_matrix(      │  (jose.jwt.decode)        │
       _user: User =             │  Builds in-memory User    │
         Depends(                │  with .permissions[] from │
           require_permission(   │  JWT claim (no DB hit)    │
             'permission.matrix.update'))                    │
       ...                       └─────────────┬─────────────┘
                                               │
                                               ▼
                                  ┌────────────────────────────┐
                                  │  require_permission(key)   │
                                  │  → _has_permission(user, key) │
                                  │  → return user OR raise    │
                                  │     HTTPException(403,     │
                                  │     {error_code:           │
                                  │      PERMISSION_DENIED,    │
                                  │      missing_permission})  │
                                  └─────────────┬──────────────┘
                                                │
   For mutation endpoints (D-1.14 Hibrit):      │
   yan yana checks layered onto same handler    │
                                                ▼
                          ┌─────────────────────────────────┐
                          │  get_project_member  (membership)│  ← Phase 9
                          │  OR require_project_transition_  │
                          │     authority(project_id)        │  ← Phase 9 D-15
                          └─────────────────────────────────┘
                                                │
                                                ▼
                          ┌─────────────────────────────────┐
                          │  Use case .execute(...)          │
                          │  ↓ writes audit row via         │
                          │  audit_repo.create_with_metadata │
                          │  (entity_type='role', action=    │
                          │  'created', extra_metadata={...})│
                          └─────────────────────────────────┘
                                                │
                                                ▼
                          ┌─────────────────────────────────┐
                          │  audit_log row (Phase 9 D-09)    │
                          │  with rbac.* SemanticEventType   │
                          │  rendered in Activity / Admin    │
                          │  Audit table via Phase 13/14     │
                          │  audit-event-mapper              │
                          └─────────────────────────────────┘
```

### Recommended Project Structure (Phase 15 NEW files only)

```
Backend/
├── alembic/versions/
│   └── 007_phase15_rbac.py                     # NEW (D-1.8) idempotent migration
├── app/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── permission.py                   # NEW Permission entity
│   │   │   └── role_permission.py              # NEW (optional; junction may live as repo-only)
│   │   └── repositories/
│   │       ├── permission_repository.py        # NEW IPermissionRepository
│   │       ├── role_permission_repository.py   # NEW IRolePermissionRepository
│   │       └── role_repository.py              # NEW IRoleRepository (currently absent — see Pitfall 12)
│   ├── application/
│   │   ├── dtos/
│   │   │   ├── role_dtos.py                    # NEW
│   │   │   └── permission_dtos.py              # NEW
│   │   └── use_cases/
│   │       ├── create_role.py                  # NEW
│   │       ├── update_role.py                  # NEW
│   │       ├── delete_role.py                  # NEW (Member fallback transaction)
│   │       ├── list_permissions.py             # NEW
│   │       ├── get_permission_matrix.py        # NEW
│   │       └── update_permission_matrix.py     # NEW
│   ├── infrastructure/database/
│   │   ├── models/
│   │   │   ├── permission.py                   # NEW PermissionModel
│   │   │   └── role_permission.py              # NEW RolePermissionModel
│   │   └── repositories/
│   │       ├── permission_repo.py              # NEW SqlAlchemyPermissionRepository
│   │       ├── role_permission_repo.py         # NEW SqlAlchemyRolePermissionRepository
│   │       └── role_repo.py                    # NEW SqlAlchemyRoleRepository
│   └── api/
│       ├── deps/
│       │   ├── auth.py                         # MODIFIED: add require_permission, _has_permission
│       │   └── role.py                         # NEW: get_role_repo, get_permission_repo, get_role_permission_repo
│       └── v1/
│           ├── admin_roles.py                  # NEW CRUD router
│           └── admin_permissions.py            # NEW list + matrix router
├── tests/
│   ├── conftest.py                             # MODIFIED: permitted_client fixture + pytest_collection_modifyitems
│   └── integration/
│       ├── admin/
│       │   ├── test_admin_roles.py             # NEW
│       │   ├── test_admin_permissions.py       # NEW
│       │   └── test_admin_role_permission_matrix.py  # NEW
│       └── test_rbac_audit_emission.py         # NEW

Frontend2/
├── services/
│   └── admin-rbac-service.ts                   # NEW (roles + perms + matrix CRUD)
├── hooks/
│   ├── use-roles.ts                            # NEW
│   ├── use-permissions.ts                      # NEW
│   ├── use-permission-matrix.ts                # NEW
│   ├── use-create-role.ts                      # NEW
│   ├── use-update-role.ts                      # NEW
│   ├── use-delete-role.ts                      # NEW
│   └── use-update-permission-cell.ts           # NEW (optimistic mutation D-1.12)
├── components/
│   ├── auth/
│   │   ├── require-permission.tsx              # NEW <RequirePermission/> guard
│   │   └── use-has-permission.ts               # NEW hook composition
│   └── admin/
│       ├── roles/
│       │   ├── role-create-modal.tsx           # NEW
│       │   ├── role-edit-modal.tsx             # NEW
│       │   ├── role-delete-confirm.tsx         # NEW
│       │   ├── new-role-modal-trigger.tsx      # NEW (replaces NewRolePlaceholderCard)
│       │   ├── role-icon-picker.tsx            # NEW (8 lucide icons)
│       │   └── role-color-swatch.tsx           # NEW (6 oklch tokens)
│       └── permissions/
│           └── permission-scope-badge.tsx      # NEW (system / project chip D-3.4)
├── lib/admin/
│   └── role-validation.ts                      # NEW (D-2.6 name validator)
└── e2e/
    ├── admin-rbac-roles-crud.spec.ts           # NEW
    ├── admin-rbac-matrix.spec.ts               # NEW
    ├── admin-rbac-self-edit.spec.ts            # NEW
    └── admin-rbac-guest-readonly.spec.ts       # NEW
```

### Pattern 1: Fat-Infra Wave 0 — Plan 15-04

**What:** A single plan ships ALL the building blocks (entities, repos, ORM, migration, DI factories, test fixture extension) before any use case or router lands. Phase 14 14-01 established this pattern.
**When to use:** Vertical slice with multiple layers; downstream plans need a stable infra to test against.
**Example:** `.planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/14-01-PLAN.md` — single plan, ~30 files, lands all admin-side infra (admin_user_dtos, change_user_role.py, bulk_action_user.py, invite_user.py, plus authenticated_client fixture). Phase 14 plans 14-02..14-08 then ride that infra.
**Plan 15-04 mirror:** ~10-15 files (Permission/RolePermission entities + 3 repos + 3 ORM models + Alembic 007 + permitted_client fixture). NO use cases yet (those go to 15-05).

### Pattern 2: 2-tier Permission Check (Hibrit per D-1.14)

**What:** Mutation endpoints get TWO sequential `Depends()` checks — first the global perm, then the project-scoped membership/leadership.
**When to use:** Every POST/PATCH/DELETE endpoint that operates within a project context (tasks, projects, comments, milestones, artifacts, phase_reports, workflow, lifecycle).
**Example:** Phase 9 D-15 already established the second tier. Phase 15 adds the first tier:
```python
# Source: Backend/app/api/deps/auth.py:53-60 (require_admin pattern, MODIFIED for Phase 15)
def require_permission(key: str):
    """Returns a Depends-compatible callable that checks JWT permissions[]."""
    async def _checker(current_user: User = Depends(get_current_user)) -> User:
        if not _has_permission(current_user, key):
            raise HTTPException(
                status_code=403,
                detail={
                    "error_code": "PERMISSION_DENIED",
                    "missing_permission": key,
                    "message": f"Bu işlem için {key} yetkisi gerekir",
                },
            )
        return current_user
    return _checker

def _has_permission(user: User, key: str) -> bool:
    """Admin super-role short-circuit + claim lookup (no DB hit). D-1.5 + D-1.10."""
    if _is_admin(user):
        return True
    return key in (user.permissions or [])
```

Endpoint usage (yan yana):
```python
# Phase 15 mutation endpoint (D-1.13, D-3.2, D-3.3)
@router.post("/projects/{project_id}/milestones")
async def create_milestone(
    project_id: int,
    dto: MilestoneCreateDTO,
    _perm: User = Depends(require_permission("milestone.create")),  # Phase 15 NEW (tier 1)
    _auth: User = Depends(require_project_transition_authority),    # Phase 9 D-15 (tier 2)
    repo: IMilestoneRepository = Depends(get_milestone_repo),
):
    ...
```

**Key insight:** FastAPI does NOT guarantee execution order between sibling `Depends()` calls (sources: [FastAPI Discussion #6294](https://github.com/fastapi/fastapi/discussions/6294), [tiangolo/fastapi #5317](https://github.com/fastapi/fastapi/issues/5317)). However: (1) both checks are pure boolean gates that raise on failure — order doesn't matter functionally; (2) both call `Depends(get_current_user)` which is cached per-request, so the second one doesn't re-decode the JWT. Verified safe per the `Pitfall: FastAPI Depends ordering` section below.

### Pattern 3: Optimistic Matrix Mutation (D-1.12)

**What:** Client toggles a cell → mutation fires → cache updated immediately → server validates → on error, rollback from snapshot.
**When to use:** Any low-latency CRUD where the user expects no spinner.
**Example (TanStack Query v5 idiomatic per [official docs](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates)):**

```typescript
// Source: TanStack Query v5 official pattern, adapted for matrix per-cell PATCH
// Reference: https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates
export function useUpdatePermissionCell() {
  const queryClient = useQueryClient()
  const { language } = useApp()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: ({ roleId, permKey, granted }: UpdateCellArgs) =>
      adminRbacService.updateCell(roleId, permKey, granted),
    // Optimistic update — runs BEFORE the network call
    onMutate: async ({ roleId, permKey, granted }) => {
      // 1. Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["admin", "permissions", "matrix"] })
      // 2. Snapshot the previous matrix
      const previous = queryClient.getQueryData(["admin", "permissions", "matrix"])
      // 3. Optimistically apply
      queryClient.setQueryData(["admin", "permissions", "matrix"], (old: MatrixData | undefined) => {
        if (!old) return old
        return applyCellUpdate(old, roleId, permKey, granted)
      })
      // 4. Return context with snapshot for rollback
      return { previous }
    },
    onError: (err, _vars, context) => {
      // Roll back to snapshot
      if (context?.previous) {
        queryClient.setQueryData(["admin", "permissions", "matrix"], context.previous)
      }
      showToast(language === "tr" ? "Yetki güncellenemedi" : "Failed to update", "danger")
    },
    onSuccess: () => {
      showToast(language === "tr" ? "Yetki güncellendi" : "Permission updated", "success")
    },
    onSettled: () => {
      // Always invalidate at the end to sync any drift
      queryClient.invalidateQueries({ queryKey: ["admin", "permissions", "matrix"] })
    },
  })
}
```

### Pattern 4: PostgreSQL ENUM Idempotent Creation

**What:** PostgreSQL has no `CREATE TYPE IF NOT EXISTS`. The idiomatic safe pattern is a `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;` block.
**When to use:** Any Alembic migration that creates an ENUM type and may be replayed against an existing DB.
**Example for migration 007:**

```python
# Backend/alembic/versions/007_phase15_rbac.py — ENUM idempotent creation
# Source: PostgreSQL idiom (no CREATE TYPE IF NOT EXISTS); reuses Phase 9 _enum_value_exists helper at 005_phase9_schema.py:69-84

def upgrade() -> None:
    # Reuse the helpers from 005_phase9_schema.py:43-97 (battle-tested across phases 1-9).
    # Idempotency for ENUM creation:
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE permission_scope AS ENUM ('system', 'project');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    # Then use sa.Enum referencing the named type with create_type=False:
    if not _column_exists("permissions", "scope"):
        op.add_column(
            "permissions",
            sa.Column(
                "scope",
                postgresql.ENUM("system", "project", name="permission_scope", create_type=False),
                nullable=False,
                server_default="project",
            ),
        )
```

**Alternative (simpler, used in Phase 9 for `projects.status`):** VARCHAR(16) + CHECK constraint. From `005_phase9_schema.py:161-170`:
```python
op.add_column(
    "projects",
    sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE"),
)
```
This is what Phase 9 actually shipped for `projects.status` — application-level enum (ProjectStatus) with no DB-level enum. Trade-off: less DB-level safety, easier introspection, simpler migration.

**Recommendation for Phase 15 D-3.5:** Use **VARCHAR(16) + CHECK constraint** (mimic Phase 9 patterns). PostgreSQL native ENUM is more correct semantically but Alembic enum migrations are a [known pain point](https://medium.com/makimo-on-software-development/upgrading-postgresqls-enum-type-with-sqlalchemy-using-alembic-migration-881af1e30abe) — adding values requires AUTOCOMMIT outside transaction. Since `permission_scope` only ever has 2 values (`system`, `project`) and the Phase 9 codebase precedent is VARCHAR + app-level Pydantic Literal, Phase 15 should follow suit. Plan 15-04 chooses the implementation; CONTEXT D-3.5 explicitly grants planner discretion ("recommend VARCHAR + CHECK constraint per Phase 9 patterns").

### Pattern 5: `permitted_client` Fixture Composition

**What:** Layer over Phase 14 14-01's `authenticated_client` to inject arbitrary `permissions[]` claims into the test JWT.
**Where to put it:** `Backend/tests/conftest.py` (top-level — unit tests can use it too). CONTEXT D-Discretion explicitly recommends this location.
**Example:**

```python
# Backend/tests/conftest.py — APPEND after authenticated_client (line 178)
@pytest_asyncio.fixture
async def permitted_client(db_session):
    """Like authenticated_client but with explicit JWT permissions[] claim.

    Usage:
        async def test_x(permitted_client):
            async with permitted_client(perms=["admin.users.invite"]) as client:
                r = await client.post("/api/v1/admin/users", ...)
                assert r.status_code == 201
    """
    from sqlalchemy import select
    from app.infrastructure.database.models.role import RoleModel
    from app.infrastructure.database.models.user import UserModel

    @asynccontextmanager
    async def _builder(perms: list[str], role: str = "Member"):
        # Seed a role row matching `role` (or fall back to first available).
        stmt = select(RoleModel).where(RoleModel.name.ilike(role))
        role_row = (await db_session.execute(stmt)).scalar_one_or_none()
        if role_row is None:
            role_row = (await db_session.execute(select(RoleModel).limit(1))).scalar_one()
        user = UserModel(
            email=f"permclient+{hash(tuple(perms))}@testexample.com",
            full_name=f"Test PermClient",
            password_hash="$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa",
            is_active=True,
            role_id=role_row.id,
        )
        db_session.add(user)
        await db_session.flush()
        # Build JWT with permissions[] claim — matches Phase 15 login handler shape (D-1.3)
        payload = {"sub": user.email, "permissions": sorted(perms)}  # alphabetical sort per Discretion
        token = _jose_jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        app.dependency_overrides[get_db_session] = lambda: db_session
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", follow_redirects=True) as client:
            client.headers["Authorization"] = f"Bearer {token}"
            yield client
        app.dependency_overrides.clear()

    return _builder
```

**Why this works without DB seed:** `_has_permission` is a pure JWT claim lookup (D-1.10). The decoded token's `permissions[]` flows through `get_current_user` (which builds the User entity in memory) into `require_permission` — no DB hit on the perms table.

### Pattern 6: ReactFlowProvider Test Wrapper (TIDY-04)

**What:** `@xyflow/react@12.x` requires `<ReactFlowProvider>` to wrap any component using `useReactFlow()`. Production already has this at `Frontend2/components/workflow-editor/workflow-canvas-inner.tsx:129`. The 19 test failures originate from tests that mock `@xyflow/react` but bypass the Provider.
**Investigation:** Reading the existing failing test setup (`editor-page.test.tsx:83-111`) reveals a `vi.mock("@xyflow/react", ...)` that stubs `ReactFlow` but NOT `ReactFlowProvider`. When `editor-page.tsx` lazily imports `workflow-canvas` (which re-exports `WorkflowCanvasInner`), and that component tries to use `useReactFlow()`, the mock returns nothing for the Provider symbol. The 16 test failures are the symptom.
**Solution (per [reactflow.dev/learn/advanced-use/testing](https://reactflow.dev/learn/advanced-use/testing)):** The `vi.mock` block must include a stubbed `ReactFlowProvider` that simply renders children:

```typescript
// Frontend2/components/workflow-editor/editor-page.test.tsx — extend the mock at line 83
vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children, ...handlers }: any) => {
    capturedHandlers.onNodesChange = handlers.onNodesChange
    // ... (existing capture logic)
    return <div data-testid="reactflow">{children}</div>
  },
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="rf-provider">{children}</div>   // NEW — passes through children, no provider semantics needed
  ),
  useReactFlow: () => ({                              // NEW — useReactFlow stub
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    fitView: vi.fn(),
  }),
  Background: () => <div data-testid="bg" />,
  MiniMap: () => <div data-testid="minimap" />,
  Controls: () => <div data-testid="controls" />,
  Handle: () => null,
  Position: { Top: "top", Right: "right", Bottom: "bottom", Left: "left" },
  BaseEdge: () => null,
  EdgeLabelRenderer: () => null,
  getBezierPath: () => ["", 0, 0, 0, 0],
}))
```

**Alternative:** Centralize the mock in `Frontend2/test/setup.ts` (CONTEXT D-4.1 mentions vitest.setup, but the actual file is `test/setup.ts` per `vitest.config.ts:14`). Pros: one place. Cons: tests that DO want a real Provider can't opt out without re-mocking. Recommend per-test mock extension (current pattern) since `editor-page.test.tsx` is the only consumer.

### Pattern 7: pytest_collection_modifyitems with DB Probe (TIDY-05)

**What:** A pytest hook that fires after collection but before tests run. Probe the DB; if unreachable, mark all `requires_db`-tagged tests with `pytest.mark.skip`.
**Hook signature (per [pytest official docs](https://docs.pytest.org/en/stable/how-to/writing_hook_functions.html)):** `pytest_collection_modifyitems(session, config, items)` — pytest only passes the args you list, so `(config, items)` is fine.
**Example:**

```python
# Backend/tests/conftest.py — APPEND after existing fixtures
import pytest

def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "requires_db: marks tests as requiring a live Postgres connection",
    )

def pytest_collection_modifyitems(config, items):
    """Skip @pytest.mark.requires_db tests when the DB is unreachable.

    Fires after collection, before any test runs. Probes the configured
    DATABASE_URL; on connection refused / OperationalError, adds a skip
    marker to every test tagged `requires_db`.
    """
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy.exc import OperationalError
    from app.infrastructure.config import settings

    async def probe() -> bool:
        try:
            engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
            async with engine.connect() as conn:
                await conn.execute(sa.text("SELECT 1"))
            await engine.dispose()
            return True
        except Exception:
            return False

    db_alive = asyncio.run(probe())
    if not db_alive:
        skip_marker = pytest.mark.skip(reason="DB not available (requires_db)")
        for item in items:
            if "requires_db" in item.keywords:
                item.add_marker(skip_marker)
```

**Marker application:** ~40 files in `Backend/tests/integration/` need the marker. Use either:
- (a) Add `@pytest.mark.requires_db` decorator at function level (granular, verbose).
- (b) Add `pytestmark = pytest.mark.requires_db` at module level (covers every test in file). Recommended per CONTEXT D-4.4.

### Anti-Patterns to Avoid

- **Hardcoded role-name guards instead of `is_system_role` boolean** (D-2.3 explicitly rejected this) — kırılgan: a future locale change or rename breaks the guard.
- **Per-layer incremental commits for the 7-layer placeholder defense** (D-2.7) — UI lands in inconsistent intermediate states; tests temporarily red. Atomic commit only.
- **Endpoint-split for bulk-action multi-perm check** (D-1.16) — would break the Phase 14 frontend bulk-action dispatcher. Use case dynamic check is the chosen path.
- **Soft-flag on `role_permissions` row revoke** — explicitly rejected per Discretion: hard-delete; audit_log preserves history.
- **Permission cache (Redis or in-memory)** (D-1.10) — JWT claim is the cache; adding another layer is overengineering.
- **Treating `<RequirePermission/>` as the security boundary** — it's UI hide only; backend `Depends(require_permission)` is authoritative (cross-file rule line 417 in CONTEXT.md).
- **Adding `permissions[]` to `User` entity as a persisted field** — keep it claim-only; entity stays simple. Only `_has_permission` reads it from `user.permissions` (which is JWT-derived in `get_current_user`).
- **Skipping the test fixture `permitted_client` location decision** — recommend top-level `conftest.py`; CONTEXT Discretion endorses.
- **Deleting `Frontend2/lib/admin/permissions-static.ts` during Phase 15** — keep as a legacy import shim until Plan 15-09 audit confirms no consumers remain (deferred deletion = safer).
- **Catching `Exception` instead of specific Pydantic v2 `ValidationError` in TIDY-03** — over-broad catch hides legitimate errors. Catch `ValidationError` and `ValueError` (the bug is `ValueError` raised inside Pydantic validators per the deferred-items.md log line 50).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT encode/decode | Custom JWT impl | `python-jose` already in `Backend/app/api/deps/auth.py:8` | Proven; supports HS256/RS256; testing-fixture friendly |
| ENUM validation | Hand-rolled `if value not in [...]` | Pydantic v2 `Literal["system", "project"]` + `permissions.scope` CHECK constraint | DTO-level + DB-level defense in depth |
| Optimistic mutation rollback | Custom `useState` + manual revert | TanStack v5 `useMutation` `onMutate` returning context for `onError` | Battle-tested by millions of apps; revert pattern handles concurrent toggles correctly |
| ReactFlowProvider testing | Custom mock for every test file | Single `vi.mock("@xyflow/react", () => ({ ReactFlowProvider: ({children}) => children, ... }))` block | Provider passthrough is sufficient when `useReactFlow()` is also mocked |
| Idempotent migration helpers | New `_check_*` helpers | Reuse `_table_exists` / `_column_exists` / `_index_exists` / `_enum_value_exists` from `005_phase9_schema.py:43-97` | Battle-tested across phases 1-9; copy verbatim (per `006_phase14_admin_panel.py:30-58`) |
| Audit row write | Direct `INSERT INTO audit_log` | `audit_repo.create_with_metadata` (Phase 9 D-09) | Already handles `extra_metadata` JSONB column; cross-cutting consistency |
| Test JWT generation | New helper | `_make_test_jwt(email)` at `Backend/tests/conftest.py:121-128` (extend with `permissions=[]` arg) | Already imports jose; aligns with prod token shape |
| Permission key lookup | Custom in-memory map | `set` membership: `key in user.permissions` | `_has_permission` is dead simple; no library needed |
| Role icon picker UI | Generic icon library wrapper | Inline `lucide-react` icon array + 8-button grid (D-2.8) | 8 icons is bounded; library overkill |
| Color swatch chip grid | Custom design system color tokens | 6 oklch tokens already defined in `Frontend2/app/globals.css` per CONTEXT D-2.8 | Uses existing theme; no extra logic |
| Self-edit prevention | Frontend-only disabled button | Backend `if target_user_id == admin_id: raise PermissionError` (D-2.9) + frontend disabled UI | Defense in depth; frontend tampering bypassable |
| Migration ENUM creation | Raw `CREATE TYPE` | `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;` PostgreSQL idiom | PostgreSQL has no `CREATE TYPE IF NOT EXISTS`; idempotent without it |

**Key insight:** Phase 15 should hand-roll **nothing**. Every novelty has a precedent inside the codebase already (the closest analogs are Phase 14 14-01 fat infra, Phase 9 D-09 audit_repo, Phase 9 D-15 require_project_transition_authority, Phase 14 D-W2 optimistic update). The risk is over-engineering, not under-engineering.

## Runtime State Inventory

> Phase 15 has migration + JWT claim addition + Phase 14 placeholder migration → state inventory required.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | (1) `roles` table existing rows (Admin/Project Manager/Member) — 3 rows. Migration 007 sets `is_system_role=true` on these and INSERTs Guest. (2) `users.role_id` already FK'd to roles.id — change_user_role.py migrate (AdminRole literal → role_id int) DOES NOT require a data migration; existing users keep their role_id. (3) Existing JWTs in user localStorage do NOT have permissions[] claim — backwards compat: `get_current_user` defaults `user.permissions = []` if JWT claim missing (Pitfall 18). | Migration 007 SQL UPDATE for is_system_role flip + Guest INSERT; code edit for `get_current_user` default; NO data migration needed for users.role_id. |
| Live service config | None — Phase 15 doesn't touch external services (n8n, Datadog, etc.). | None — verified by grep on integration external service refs. |
| OS-registered state | None — Phase 15 doesn't add scheduled tasks or systemd units. | None. |
| Secrets/env vars | (1) `JWT_SECRET` env var — unchanged (D-1.6 reuses existing 30dk TTL). | None — secret unchanged. |
| Build artifacts | (1) `Frontend2/lib/admin/permissions-static.ts` — Phase 15 sonrasi deprecated; matrix ARTIK backend `/api/v1/admin/permissions`'tan okur. (2) `Backend/__pycache__` — pycache stale after migration 007 changes; safe (pyc auto-regenerates). (3) `Frontend2/.next/` — incremental build cache; rebuilds on first `npm run dev`. | (1) Plan 15-09 keeps file as legacy import shim; deletion deferred to v2.1. (2-3) automatic. |

**Key cross-phase contracts that need explicit migration during Phase 15 (cannot be left to runtime):**

| Contract | Origin | Migration target plan | Risk if missed |
|----------|--------|----------------------|----------------|
| Phase 13 D-D2 avatar-dropdown admin-link gate (`role.name === 'Admin'`) | `Frontend2/components/shell/avatar-dropdown.tsx:73` | Plan 15-11 (D-2.11 perm-based migration) | Custom Admin-equivalent role can't see admin link — UX bug |
| Plan 14-11 contract regression guard (`avatar-dropdown.test.tsx` Test 14) | Phase 14 14-11 PLAN | Plan 15-11 — RTL test update for new gate | False-fail in 14-11's regression suite |
| `change_user_role.py` literal AdminRole | `Backend/app/application/use_cases/change_user_role.py:13` + `Backend/app/application/dtos/admin_user_dtos.py:13` | Plan 15-05 (D-1.17) | Frontend admin user role-change drop-down sends string; needs role_id int |
| Phase 14 14-01 `change_user_role` tests (3 tests with fixed string AdminRole) | Phase 14 14-01 PLAN VALIDATION | Plan 15-05 (synchronous test update) | Tests RED after DTO change |
| `permissions-static.ts` 14 perm key list | `Frontend2/lib/admin/permissions-static.ts:14-29` | Migration 007 seed (D-1.8) — backend hardcoded SQL list | Drift between FE display and BE enforce ⇒ matrix shows perms backend doesn't enforce |

## Common Pitfalls

### Pitfall 1: PostgreSQL ENUM ALTER limitations + autocommit
**What goes wrong:** `ALTER TYPE permission_scope ADD VALUE 'workspace'` inside a transaction block silently succeeds but the new value is unusable until COMMIT — and Alembic migrations run inside an implicit transaction by default.
**Why it happens:** PostgreSQL ENUM mutations require AUTOCOMMIT semantics for the new value to be visible (verified via [Medium: Upgrading PostgreSQL's Enum type with SQLAlchemy](https://medium.com/makimo-on-software-development/upgrading-postgresqls-enum-type-with-sqlalchemy-using-alembic-migration-881af1e30abe)).
**How to avoid:** For Phase 15 D-3.5, recommend **VARCHAR(16) + CHECK constraint** over native ENUM (per "Pattern 4 alternative" above). Phase 9 D-22 enum precedent (`projects.status`) used this approach exactly. If native ENUM is non-negotiable, use the `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;` idiom for CREATE TYPE only — Phase 15 doesn't need to mutate values, just create them once.
**Warning signs:** Migration 007 runs locally but fails on CI, or replays produce "type permission_scope already exists" errors.

### Pitfall 2: JWT claim size growth
**What goes wrong:** A future user with 100+ permissions (custom roles + many perms granted) produces a JWT > 8KB → HTTP 400 from Nginx/Apache default `large_client_header_buffers`.
**Why it happens:** Default HTTP server header limit is 8KB (per [JWT size constraints article](https://www.w3tutorials.net/blog/what-is-the-maximum-size-of-jwt-token/)); each permission key averages ~20 bytes; 100 perms × 20B = 2KB just for the claim, plus signature, header, sub, iat, exp ⇒ ~3-4KB total.
**How to avoid:** D-1.3 caps Phase 15 at 26 perms. Worst case (all 26 granted to a custom role + JWT envelope) = ~700B encoded. Comfortably below 8KB. Stay below 50 distinct perm keys. v3.0 ADV-04 (refresh token) would be the migration if perm count explodes.
**Warning signs:** Login succeeds but next request 400s; HTTP transport error in localStorage debug.

### Pitfall 3: ReactFlowProvider mock missing in vitest harness
**What goes wrong:** Tests using components that nest under `WorkflowCanvasInner` (which mounts `ReactFlowProvider`) crash with "Invalid hook call" or `useReactFlow must be inside a ReactFlowProvider`.
**Why it happens:** Existing `vi.mock("@xyflow/react", ...)` blocks (e.g., `editor-page.test.tsx:83-111`) stub `ReactFlow` but not `ReactFlowProvider`. The actual production code at `workflow-canvas-inner.tsx:129` wraps `<ReactFlowProvider>`. When tests mock the module, the Provider symbol becomes undefined.
**How to avoid:** Add `ReactFlowProvider: ({ children }) => children` and `useReactFlow: () => ({ zoomIn, zoomOut, fitView: vi.fn() })` to every `vi.mock("@xyflow/react", ...)` call. Pattern 6 above shows full snippet. Per CONTEXT D-4.1, this is centralized into vitest.setup but actual setup file path is `Frontend2/test/setup.ts` (verified at `vitest.config.ts:14`).
**Warning signs:** `editor-page.test.tsx` Test 6-21 RED with "Cannot read properties of undefined (reading 'children')" or "Invalid hook call".

### Pitfall 4: Pydantic v2 vs v1 ValidationError shape (TIDY-03)
**What goes wrong:** `e.errors()` shape differs between Pydantic v1 (list of dicts with `loc`/`msg`/`type`) and v2 (list of dicts with `loc`/`msg`/`type`/`input`/`url`). Catching `ValidationError` may work but the error envelope renders differently in tests.
**Why it happens:** This codebase is on Pydantic v2 (per `Backend/requirements.txt`); the existing `projects.py:211-222` already catches `ValidationError` and uses `e.errors()`. The TIDY-03 bug is NOT about the catch — it's about a `ValueError` (NOT `ValidationError`) bubbling up from inside a Pydantic validator. See deferred-items.md line 50: `TypeError: Object of type ValueError is not JSON serializable`.
**How to avoid:** Extend the catch in `projects.py:211` to `except (ValidationError, ValueError) as e:` and convert `ValueError` to a structured detail. Confirm by reading the test at `tests/integration/api/test_project_workflow_patch.py:69-93` — the bad payload includes `n1` IDs (regex-fail) which raises `ValueError` from a custom validator, not Pydantic's auto-validation.
**Warning signs:** 500 response with `Object of type ValueError is not JSON serializable` instead of 422 with structured detail.

### Pitfall 5: Self-edit lockout
**What goes wrong:** A sole admin changes their own role to Member via the matrix UI. Next request comes back 403. No way back into admin panel.
**Why it happens:** No backend guard prevents `target_user_id === admin_id` in `change_user_role`. Frontend "Rolü değiştir" button next to currentUser is the only check.
**How to avoid:** D-2.9 mandates BOTH a frontend disabled state AND a backend `raise PermissionError("Kendi rolünü değiştiremezsin")` when `target_user_id == admin_id`. Plan 15-05 must wire this defensively.
**Warning signs:** UAT script #5 (Self-edit prevented) is the explicit safety net; if it passes, the lockout vector is closed.

### Pitfall 6: Bulk-action multi-perm dispatch races
**What goes wrong:** Bulk-action endpoint is umbrella-perm-gated (`admin.users.bulk` per D-1.16); the use case checks each row's action sub-perm dynamically. If the admin's perms are revoked mid-batch (extremely rare but theoretically possible since revoke is real-time on the server side per CONTEXT D-1.6 ⇒ wait actually revokes are PASSIVE 30dk, so this is N/A), the batch could 50% complete.
**Why it happens:** D-1.6 says revokes are 30dk passive — claim doesn't change mid-request. So this race is impossible at the JWT level.
**How to avoid:** Confirmed safe by D-1.6 + D-1.10 (no real-time revoke). Use case dynamic check is per-action-type, not per-row, so even within a batch the check fires once and either every row passes or every row 403s.
**Warning signs:** None expected; theoretical pitfall closed by D-1.6.

### Pitfall 7: 7-layer atomic commit ordering
**What goes wrong:** Tests for `permission-matrix-card.test.tsx` Case 1-3 expect 56 disabled toggles + v3.0 Badge. Plan 15-10 removes ALL of these in one commit. If only some layers come down, tests RED on the other layers.
**Why it happens:** Test cases are defense-in-depth checks (Case 2 checks ALL 56 toggles disabled; Case 3 checks v3.0 Badge AND Kopyala disabled). Removing toggles disabled but leaving Badge passes Case 2 / fails Case 3.
**How to avoid:** Plan 15-10 MUST update prod code AND test cases in the SAME COMMIT. New test cases assert the OPPOSITE: 56 ENABLED toggles, NO v3.0 Badge, Kopyala ENABLED, AlertBanner with "aktif" copy, no NewRolePlaceholderCard. CONTEXT D-2.7 explicitly forbids per-layer incremental.
**Warning signs:** Plan 15-10 commit shows test files modified ≤ prod files; should be 1:1 or test-files > prod.

### Pitfall 8: Migration 007 idempotency vs seeder.py duplication
**What goes wrong:** `Backend/app/infrastructure/database/seeder.py:300-310` already creates Admin/Project Manager/Member roles. Migration 007 also wants to ensure these exist + flip is_system_role + add Guest. Re-running migration on a seeded DB would duplicate roles if the migration uses unconditional INSERT.
**Why it happens:** Seeder runs on app startup; migration runs separately. Both touch `roles` table.
**How to avoid:** Migration 007 must check `WHERE name=...` before INSERT (Phase 9 005_phase9_schema.py pattern lines 43-97). Use `_table_exists`, `_column_exists` helpers verbatim. For role row inserts: `INSERT ... ON CONFLICT (name) DO UPDATE SET is_system_role=true` (Postgres upsert). For role_permissions seed: `INSERT ... ON CONFLICT (role_id, permission_id) DO NOTHING`.
**Warning signs:** UNIQUE constraint violation on `roles.name` after migration replay; or duplicate role rows after seeder + migration.

### Pitfall 9: Backwards-compatible JWT decode
**What goes wrong:** Existing JWTs in user browsers (issued before Phase 15 deploy) have no `permissions[]` claim. After Phase 15 deploy, `get_current_user` reads `payload.get("permissions")` ⇒ None. `_has_permission` does `key in (user.permissions or [])` ⇒ False. Every existing user is locked out of admin until their JWT expires (30dk).
**Why it happens:** New claim shape can't auto-populate from old token.
**How to avoid:** `get_current_user` defaults `user.permissions = []` AND falls back to role-name check for the Admin super-role: `user.permissions = []` is fine because `_is_admin(user)` short-circuits in `_has_permission` (D-1.5). Non-admin users with old tokens lose mutation perms for ≤30dk. Acceptable per D-1.6 passive revoke. Document this in Plan 15-06 (login handler change is the pivot).
**Warning signs:** UAT immediately after deploy: existing PM users can't create projects for ≤30dk. Mitigation: deploy at low-traffic time; force re-login on the auth service.

### Pitfall 10: `permissions-static.ts` deprecation timing
**What goes wrong:** Plan 15-10 removes the 7-layer defense from PermissionMatrixCard; the matrix data source switches from static to API. If `permissions-static.ts` is deleted in the same plan, other consumers break (audit log if any rendering reuses the AdminRole type).
**Why it happens:** TypeScript types `PermissionKey` and `AdminRole` are exported from this module.
**How to avoid:** Plan 15-09 audits consumers BEFORE Plan 15-10 ships. Keep file as a legacy import shim that re-exports types from a new location. Delete deferred to v2.1. Search for `from "@/lib/admin/permissions-static"` across `Frontend2/` to enumerate.
**Warning signs:** TypeScript compile error in Frontend2 after Plan 15-10 lands. Resolve by leaving the file in place with shim re-exports.

### Pitfall 11: Matrix UI scope badge data dependency
**What goes wrong:** D-3.4 per-row scope badge reads from `permission.scope` ENUM. If `GET /api/v1/admin/permissions` response shape doesn't include scope on every row, badge renders blank.
**Why it happens:** API contract drift between Plan 15-06 (router) and Plan 15-10 (UI consumer).
**How to avoid:** DTO `PermissionDTO` MUST include `scope: Literal["system", "project"]` non-nullable. Plan 15-06 must lock this. Plan 15-10 RTL tests should mock the API response with scope present and assert badge rendering.
**Warning signs:** Matrix UI rendering with 26 rows but no badges; API response inspection reveals missing scope field.

### Pitfall 12: Missing `IRoleRepository` ABC
**What goes wrong:** Phase 14 14-01 created `change_user_role.py` use case but injected `update_role` as a duck-typed callable (lines 24-29) and `role_id_resolver` as a closure argument. There's NO existing `IRoleRepository` interface. Phase 15 needs CRUD on roles ⇒ must create the interface first.
**Why it happens:** Phase 14 explicitly deferred the abstraction (D-A6 says "role lookup is injected as a duck-typed callable so the use case stays free of Role table coupling").
**How to avoid:** Plan 15-04 creates `Backend/app/domain/repositories/role_repository.py` (`IRoleRepository` ABC) + impl. Plan 15-05 migrates `change_user_role.py` to take `IRoleRepository` instead of `update_role` callable + `role_id_resolver` closure. CONTEXT canonical_refs line 310 explicitly lists this as a NEW file.
**Warning signs:** Plan 15-05 starts before Plan 15-04 → use case has nowhere to inject the new role lookups → blocks 15-06.

### Pitfall 13: D-15 + require_permission decorator order
**What goes wrong:** Two `Depends()` declarations on a mutation endpoint (`require_permission(...)`, `require_project_transition_authority`). FastAPI does NOT guarantee execution order between siblings. If the perm check fails AFTER project authority check (which fetches project + does DB query), there's wasted DB work.
**Why it happens:** Per [FastAPI Discussion #6294](https://github.com/fastapi/fastapi/discussions/6294), execution order is implementation-detail; the only guarantee is dependency-of-dependency ordering.
**How to avoid:** Both checks are pure boolean gates. Order doesn't affect correctness — only minor perf. Place `require_permission` FIRST in the parameter list (positional convention) since it's cheap (in-memory claim lookup), so it short-circuits before the DB-heavy `require_project_transition_authority`. Both use `Depends(get_current_user)` which IS cached per-request, so the second call doesn't re-decode JWT.
**Warning signs:** None — functional correctness preserved by failure raising HTTPException. Perf marginally improved by ordering perm-first.

### Pitfall 14: Permissions[] claim sort order in JWTs
**What goes wrong:** Two functionally-equivalent JWTs (same user, same perms) hash differently because `permissions: ["a", "b"]` ≠ `permissions: ["b", "a"]`. Test assertions on token equality break.
**Why it happens:** Python set → list ordering is non-deterministic across runs.
**How to avoid:** Always `sorted(perms)` before encoding. Discretion section recommends alphabetical sort (deterministic, debug-friendly). Plan 15-06 login handler MUST sort. `permitted_client` fixture also sorts (Pattern 5 above).
**Warning signs:** Flaky integration tests where token equality assertions fail intermittently.

### Pitfall 15: TIDY-02 `test_deps_package_structure.py::test_stub_submodules_exist`
**What goes wrong:** The test asserts `milestone_mod.__all__ == []` (line 103), but the actual file has `__all__ = ["get_milestone_repo"]` (verified at `Backend/app/api/deps/milestone.py:13`). Same for `artifact` and `phase_report` modules.
**Why it happens:** Phase 9 09-02 BACK-07 created the deps/ split with empty stubs. Plans 09-05/06/07 populated them. The test was never updated.
**How to avoid:** Plan 15-02 (TIDY-02) edits `test_deps_package_structure.py:103-105` to assert NON-empty `__all__` matching the actual exports (`["get_milestone_repo"]`, `["get_artifact_repo"]`, `["get_phase_report_repo"]`).
**Warning signs:** Test red on first pytest run; verified-pre-existing.

### Pitfall 16: Login event audit_log write missing for permissions[]
**What goes wrong:** Phase 15 doesn't add a login audit row (deferred to v2.1 per CONTEXT). But `_has_permission` test fixtures need to verify a JWT with permissions claim was issued. Without an audit row, hard to test "after admin grants perm X to role R, every R user's next login carries X in claim."
**Why it happens:** Login is not audit-emitting in v2.0.
**How to avoid:** Don't test login itself; test `_has_permission` directly via `permitted_client(perms=[X])`. The fixture bypasses login entirely (encodes JWT directly). Plan 15-12 E2E tests the full login flow but those are skip-guarded.
**Warning signs:** Plan 15-06 trying to add login-audit emission — that's deferred per CONTEXT.

### Pitfall 17: Bulk-action use case advisory_lock interaction
**What goes wrong:** Bulk-action endpoint uses Phase 9 D-08 idempotency-key pattern. If the dynamic perm check (D-1.16) fires inside the use case, and a perm is missing, the use case raises BEFORE acquiring the advisory lock. Idempotency cache may have a stale half-state.
**Why it happens:** Pre-check happens before lock acquisition.
**How to avoid:** Run the dynamic perm check FIRST (in-memory, no DB), THEN acquire lock, THEN execute. CONTEXT D-1.16 says "use case içinde dynamic perm check" — implementation must be at the entry of `execute()`, not buried inside the loop. Plan 15-07 wires this.
**Warning signs:** Idempotency replay returns stale partial state; test for this in `test_admin_bulk_action.py`.

### Pitfall 18: Default value for `user.permissions` when claim absent
**What goes wrong:** A pre-Phase-15 JWT has no `permissions` key. Reading `payload["permissions"]` raises KeyError. `_has_permission(user, key)` then crashes with AttributeError on `user.permissions`.
**Why it happens:** Pydantic User entity expects `permissions: list[str]`; if not set, default to `None` ⇒ iteration fails.
**How to avoid:** `User` entity adds `permissions: list[str] = []` (Pydantic default factory). `get_current_user` reads `payload.get("permissions", [])`. `_has_permission` does `key in (user.permissions or [])` (defense-in-depth against None).
**Warning signs:** AttributeError or KeyError immediately after Phase 15 deploy from users with stale tokens.

### Pitfall 19: SemanticEventType union extension cross-cutting
**What goes wrong:** Adding 5 new `rbac.*` types to the existing 23-member union (Phase 13 10 + Phase 14 13) breaks `semanticToFilterChip` exhaustiveness if a switch/if-chain doesn't have a fallback.
**Why it happens:** TypeScript Literal-union exhaustiveness only checked when explicit `switch` is used; the existing `audit-event-mapper.ts:161-205` uses `if/else` chains with a final `return "all"` ⇒ safe.
**How to avoid:** Plan 15-09 / 15-10 cross-cuts FOUR files for SemanticEventType extension: (1) `audit-event-mapper.ts:30-55` (union add 5 members + map branches); (2) `activity-row.tsx` (new render branches per CONTEXT line 271); (3) `event-meta.ts` (verb formatter for rbac.* labels); (4) `audit-event-mapper.test.ts` (new test cases per chip mapping). Phase 14 14-10 set the cross-cutting precedent (10→23 expansion).
**Warning signs:** TS compile fails on `audit-event-mapper.test.ts` if test file uses exhaustive switch on SemanticEventType.

### Pitfall 20: UseQueryResult type cast in `use-transition-authority.test.tsx`
**What goes wrong:** TIDY-04 D-4.1 mentions `use-transition-authority.test.tsx UseQueryResult cast` as a TS error. TanStack Query v5 changed `UseQueryResult` shape (removed `isIdle`; renamed `isLoading` → `isPending` for new queries). Test fixtures using v4 cast shape break.
**Why it happens:** TanStack v5 contract change.
**How to avoid:** Fix the test fixture to use v5 shape: `{ data, isPending, isError, error, isSuccess }` (not `isLoading`). Reference: [TanStack Query v5 useQuery docs](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).
**Warning signs:** `tsc --noEmit` red on `use-transition-authority.test.tsx`.

## Code Examples

### Example 1: Permission entity (Phase 14 Role analog)
```python
# Backend/app/domain/entities/permission.py
# Source: Mirror of Backend/app/domain/entities/role.py:1-9
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict


class Permission(BaseModel):
    id: Optional[int] = None
    key: str  # 'task.create', 'admin.users.invite', etc. (D-1.2)
    label_tr: str
    label_en: str
    scope: Literal["system", "project"]  # D-3.5
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
```

### Example 2: IPermissionRepository ABC
```python
# Backend/app/domain/repositories/permission_repository.py
# Source: Mirror of Backend/app/domain/repositories/role_repository.py (NEW per Pitfall 12)
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.permission import Permission


class IPermissionRepository(ABC):
    @abstractmethod
    async def list_all(self) -> List[Permission]:
        ...

    @abstractmethod
    async def get_by_key(self, key: str) -> Optional[Permission]:
        ...
```

### Example 3: change_user_role.py migrate (D-1.17)
```python
# Backend/app/application/use_cases/change_user_role.py — Phase 15 migrate
# BEFORE (Phase 14 14-01): AdminRole literal + role_id_resolver closure (lines 30-46)
# AFTER (Phase 15 15-05): role_id: int + IRoleRepository injected
from app.domain.entities.role import Role
from app.domain.entities.user import User
from app.domain.exceptions import UserNotFoundError, RoleNotFoundError
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.role_repository import IRoleRepository  # NEW
from app.domain.repositories.user_repository import IUserRepository


class ChangeUserRoleUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        role_repo: IRoleRepository,    # NEW
        audit_repo: IAuditRepository,
    ):
        self.user_repo = user_repo
        self.role_repo = role_repo
        self.audit_repo = audit_repo

    async def execute(
        self,
        target_user_id: int,
        role_id: int,                  # CHANGED: was AdminRole literal
        admin_id: int,
    ) -> None:
        # D-2.9 self-edit prevention (defansif backstop)
        if target_user_id == admin_id:
            raise PermissionError("Kendi rolünü değiştiremezsin")

        user = await self.user_repo.get_by_id(target_user_id)
        if user is None:
            raise UserNotFoundError(target_user_id)

        target_role = await self.role_repo.get_by_id(role_id)
        if target_role is None:
            raise RoleNotFoundError(role_id)

        source_role_name = user.role.name if user.role else None
        await self.user_repo.update_role(target_user_id, role_id)

        await self.audit_repo.create_with_metadata(
            entity_type="user",
            entity_id=target_user_id,
            action="role_changed",
            user_id=admin_id,
            metadata={
                "user_id": target_user_id,
                "user_email": user.email,
                "source_role": source_role_name,
                "target_role_id": role_id,
                "target_role_name": target_role.name,
                "requested_by_admin_id": admin_id,
            },
        )
```

### Example 4: <RequirePermission/> guard (D-1.7)
```typescript
// Frontend2/components/auth/require-permission.tsx
"use client"
import * as React from "react"
import { useAuth } from "@/context/auth-context"

interface RequirePermissionProps {
  perm: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RequirePermission({ perm, children, fallback = null }: RequirePermissionProps) {
  const { user } = useAuth()
  // _has_permission frontend equivalent: Admin super-role + claim lookup.
  // Mirrors Backend/app/api/deps/auth.py _has_permission for symmetry.
  const isAdmin = user?.role?.name?.toLowerCase() === "admin"
  const hasPermission = isAdmin || (user?.permissions ?? []).includes(perm)
  if (!hasPermission) return <>{fallback}</>
  return <>{children}</>
}
```

### Example 5: TIDY-03 ValidationError → 422 idiomatic Pydantic v2
```python
# Backend/app/api/v1/projects.py:193-222 — Phase 15 TIDY-03 fix
# BEFORE: only catches ValidationError (line 211); misses ValueError raised inside validators
# AFTER: catches BOTH per CONTEXT D-4.3
@router.patch("/{project_id}", response_model=ProjectResponseDTO)
async def update_project(
    project_id: int,
    dto: ProjectUpdateDTO,
    project_repo: IProjectRepository = Depends(get_project_repo),
    # ... (other Depends unchanged)
):
    try:
        use_case = UpdateProjectUseCase(project_repo, sprint_repo)
        project = await use_case.execute(project_id, dto, current_user.id, is_admin=_is_admin(current_user))
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ProjectAccessDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.errors(),
        )
    except ValueError as e:                                        # NEW per TIDY-03
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "INVALID_WORKFLOW_CONFIG",
                "message": str(e),
            },
        )
    # ... (rest unchanged)
```

### Example 6: Migration 007 idempotent skeleton
```python
# Backend/alembic/versions/007_phase15_rbac.py
"""Phase 15 RBAC schema: permissions + role_permissions tables, roles ALTER, perms seed.

Revision ID: 007_phase15_rbac
Revises: 006_phase14_admin_panel
Create Date: 2026-04-29

Covers:
- D-1.8: permissions table + 26 perm seed (14 CRUD + 12 admin.*)
- D-3.5: permissions.scope ENUM('system', 'project') — VARCHAR(16) + CHECK per Pitfall 1
- D-2.3: roles.is_system_role boolean
- D-2.8: roles.icon_key VARCHAR(32) NULLABLE + roles.color_token VARCHAR(64) NULLABLE
- D-2.4: Guest role INSERT
- role_permissions junction table + matrix bootstrap (PM ~13 rows, Member ~3 rows; Admin 0 per super-role D-1.5)

Idempotent: copies _table_exists / _column_exists / _index_exists from 005_phase9_schema.py:43-97.
"""
from alembic import op
import sqlalchemy as sa

revision = "007_phase15_rbac"
down_revision = "006_phase14_admin_panel"
branch_labels = None
depends_on = None


# ---------------------------------------------------------------------------
# Idempotent helpers — copied verbatim from 005_phase9_schema.py:43-97 (Pitfall 8)
# ---------------------------------------------------------------------------

def _table_exists(table_name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name=:t"),
        {"t": table_name},
    )
    return result.scalar() > 0


def _column_exists(table_name: str, column_name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name=:t AND column_name=:c"),
        {"t": table_name, "c": column_name},
    )
    return result.scalar() > 0


def _index_exists(index_name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND indexname=:n"),
        {"n": index_name},
    )
    return result.scalar() > 0


# ---------------------------------------------------------------------------
# 26 permissions seed (D-1.8)
# Source: Frontend2/lib/admin/permissions-static.ts (14 CRUD) + 12 new admin.*
# ---------------------------------------------------------------------------

PERMISSIONS_SEED = [
    # Project lifecycle (project scope)
    ("project.create", "Proje oluştur", "Create project", "project"),
    ("project.edit", "Proje düzenle", "Edit project", "project"),
    ("project.delete", "Proje sil", "Delete project", "project"),
    ("project.archive", "Proje arşivle", "Archive project", "project"),
    # Task lifecycle (project scope)
    ("task.create", "Görev oluştur", "Create task", "project"),
    ("task.change_assignee", "Atanan değiştir", "Change assignee", "project"),
    ("task.change_status", "Durum değiştir", "Change status", "project"),
    ("task.delete", "Görev sil", "Delete task", "project"),
    # Membership (project scope)
    ("member.invite", "Üye davet et", "Invite member", "project"),
    ("member.remove", "Üye çıkar", "Remove member", "project"),
    # Workflow (project scope)
    ("workflow.edit", "Workflow düzenle", "Edit workflow", "project"),
    ("lifecycle.edit", "Yaşam döngüsü düzenle", "Edit lifecycle", "project"),
    ("template.publish", "Şablon yayınla", "Publish template", "project"),
    ("role.assign", "Rol ata", "Assign role", "project"),  # legacy 14th from permissions-static.ts
    # Admin endpoints (system scope) — 12 new per D-1.4
    ("admin.access", "Admin paneli", "Admin panel access", "system"),
    ("admin.users.invite", "Kullanıcı davet et", "Invite user", "system"),
    ("admin.users.deactivate", "Kullanıcı deaktive et", "Deactivate user", "system"),
    ("admin.users.role_change", "Kullanıcı rolü değiştir", "Change user role", "system"),
    ("admin.users.bulk", "Toplu kullanıcı işlemi", "Bulk user action", "system"),
    ("admin.audit.read", "Denetim kaydı oku", "Read audit log", "system"),
    ("admin.audit.export", "Denetim kaydı dışa aktar", "Export audit log", "system"),
    ("admin.stats.read", "İstatistikleri oku", "Read admin stats", "system"),
    ("admin.summary.export", "PDF rapor dışa aktar", "Export PDF summary", "system"),
    ("admin.join_requests.approve", "Katılım isteğini onayla", "Approve join request", "system"),
    ("admin.settings.update", "Ayarları güncelle", "Update settings", "system"),
    ("permission.matrix.update", "İzin matrisi düzenle", "Update permission matrix", "system"),
]


def upgrade() -> None:
    # 1. roles table ALTER — is_system_role, icon_key, color_token
    if not _column_exists("roles", "is_system_role"):
        op.add_column(
            "roles",
            sa.Column("is_system_role", sa.Boolean, nullable=False, server_default=sa.text("false")),
        )
    if not _column_exists("roles", "icon_key"):
        op.add_column("roles", sa.Column("icon_key", sa.String(32), nullable=True))
    if not _column_exists("roles", "color_token"):
        op.add_column("roles", sa.Column("color_token", sa.String(64), nullable=True))

    # Flip is_system_role on the 4 system roles
    op.execute("""
        UPDATE roles SET is_system_role=true
        WHERE LOWER(name) IN ('admin', 'project manager', 'member', 'guest')
    """)

    # Insert Guest if not present (D-2.4)
    op.execute("""
        INSERT INTO roles (name, description, is_system_role)
        SELECT 'Guest', 'Salt okunur misafir hesabı (D-2.4)', true
        WHERE NOT EXISTS (SELECT 1 FROM roles WHERE LOWER(name) = 'guest')
    """)

    # 2. permissions table CREATE
    if not _table_exists("permissions"):
        op.create_table(
            "permissions",
            sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
            sa.Column("key", sa.String(64), unique=True, nullable=False),
            sa.Column("label_tr", sa.String(128), nullable=False),
            sa.Column("label_en", sa.String(128), nullable=False),
            sa.Column(
                "scope",
                sa.String(16),
                nullable=False,
                server_default="project",
            ),
            sa.Column("description", sa.Text, nullable=True),
            sa.CheckConstraint("scope IN ('system', 'project')", name="ck_permissions_scope"),
        )
    if not _index_exists("ix_permissions_key"):
        op.create_index("ix_permissions_key", "permissions", ["key"])

    # Seed 26 permissions (D-1.8)
    for key, label_tr, label_en, scope in PERMISSIONS_SEED:
        op.execute(
            sa.text("""
                INSERT INTO permissions (key, label_tr, label_en, scope)
                VALUES (:key, :tr, :en, :scope)
                ON CONFLICT (key) DO UPDATE SET
                    label_tr=EXCLUDED.label_tr,
                    label_en=EXCLUDED.label_en,
                    scope=EXCLUDED.scope
            """).bindparams(key=key, tr=label_tr, en=label_en, scope=scope)
        )

    # 3. role_permissions junction
    if not _table_exists("role_permissions"):
        op.create_table(
            "role_permissions",
            sa.Column("role_id", sa.Integer, sa.ForeignKey("roles.id", ondelete="CASCADE"), nullable=False),
            sa.Column("permission_id", sa.Integer, sa.ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint("role_id", "permission_id"),
        )
    if not _index_exists("ix_role_permissions_role_id"):
        op.create_index("ix_role_permissions_role_id", "role_permissions", ["role_id"])

    # 4. Bootstrap matrix per D-1.8: PM ~13 rows, Member ~3 rows, Admin 0 (super-role D-1.5), Guest 0 (D-2.4)
    pm_perms = [
        "project.create", "project.edit", "project.archive",
        "task.create", "task.change_assignee", "task.change_status", "task.delete",
        "member.invite", "member.remove", "role.assign",
        "workflow.edit", "lifecycle.edit", "template.publish",
    ]
    member_perms = ["task.create", "task.change_assignee", "task.change_status"]

    for perm_key in pm_perms:
        op.execute(sa.text("""
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p
            WHERE LOWER(r.name) = 'project manager' AND p.key = :pk
            ON CONFLICT (role_id, permission_id) DO NOTHING
        """).bindparams(pk=perm_key))

    for perm_key in member_perms:
        op.execute(sa.text("""
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p
            WHERE LOWER(r.name) = 'member' AND p.key = :pk
            ON CONFLICT (role_id, permission_id) DO NOTHING
        """).bindparams(pk=perm_key))


def downgrade() -> None:
    # Phase 15 downgrade: drop new tables + columns. Existing roles preserved.
    op.drop_table("role_permissions")
    op.drop_index("ix_permissions_key", table_name="permissions")
    op.drop_table("permissions")
    op.drop_column("roles", "color_token")
    op.drop_column("roles", "icon_key")
    op.drop_column("roles", "is_system_role")
```

## State of the Art

| Old Approach (Phase 14) | Current Approach (Phase 15) | When Changed | Impact |
|-------------------------|----------------------------|--------------|--------|
| 14×4 static tri-state matrix in `permissions-static.ts` | 26-perm × N-role matrix served from backend `permissions` table | Phase 15 | matrix is GERÇEK enforce, not vitrin |
| `Depends(require_admin)` umbrella on all admin endpoints | Endpoint-bazli `Depends(require_permission('admin.*'))` | Phase 15 D-1.4 | granular admin perms, custom Admin-equivalent roles possible |
| `change_user_role` AdminRole Literal | `change_user_role` role_id int + IRoleRepository | Phase 15 D-1.17 | dinamik custom roller atanabilir |
| `role.name === 'Admin'` admin-link gate (Phase 13 D-D2) | `_has_permission(user, 'admin.access')` | Phase 15 D-2.11 | custom 'SuperUser' role can have admin.access perm |
| 7-layer placeholder defense (Phase 14 14-04) | 7 layers atomically removed (D-2.7) | Phase 15 Plan 15-10 | matrix gerçek davranır |
| Static AdminRole tip `"Admin" \| "Project Manager" \| "Member"` | dinamik `Role` entity | Phase 15 | custom rolleri mümkün kılar |
| `ValidationError → 422` only (TIDY-03 pre-fix) | `(ValidationError, ValueError) → 422` | Phase 15 D-4.3 | Pydantic validator-raised ValueError'lar artık 500 değil 422 döner |
| 11 unit tests RED (TIDY-02) | All baseline GREEN | Phase 15 D-4.2 | RBAC plans temiz baseline üzerinden çalışır |
| 19 workflow-editor tests RED (TIDY-04) | All GREEN via ReactFlowProvider mock | Phase 15 D-4.1 | regression detection restored |
| Manual `pytest -k 'not test_admin_x'` for missing DB | Auto-skip via `requires_db` marker (TIDY-05) | Phase 15 D-4.4 | dev iter friction kalkar |

**Deprecated/outdated post-Phase 15:**
- `Frontend2/lib/admin/permissions-static.ts` — kept as legacy import shim (Plan 15-09 audits consumers). Deletion deferred to v2.1.
- `AdminRole = Literal["Admin", "Project Manager", "Member"]` — fully replaced by `role_id: int` (Plan 15-05).
- Hardcoded role-name guards anywhere — replaced by `roles.is_system_role` boolean (Plan 15-04).

## Project Constraints (from CLAUDE.md)

| Constraint | Source | Phase 15 Compliance Plan |
|-----------|--------|--------------------------|
| Clean Architecture: Domain → Application → Infrastructure → API | CLAUDE.md §2 | Plan 15-04 stops at Infrastructure (entities + repos + ORM); Plan 15-05 lands Application; Plan 15-06 lands API |
| DIP: `app/application` MUST NOT import `sqlalchemy` or `app.infrastructure` | CLAUDE.md §4.1 | Use cases inject `IRoleRepository` ABC; ORM models stay in infra |
| OCP: Use Strategy Pattern, not `if methodology == ...` | CLAUDE.md §4.1 O | Phase 15 doesn't touch methodology; perm checks are key-based, not type-based |
| ISP: Don't create massive `IProjectRepository` | CLAUDE.md §4.1 I | Three separate ABCs: `IPermissionRepository`, `IRolePermissionRepository`, `IRoleRepository` |
| `app/application/` MUST NOT contain `import sqlalchemy` | CLAUDE.md §4.1 D | Plan 15-05 use cases inject ABCs; verify with `grep -r "sqlalchemy" Backend/app/application/use_cases/` returns 0 hits in new files |
| Audit log per state change | CLAUDE.md §5.C | Every Phase 15 use case writes via `audit_repo.create_with_metadata` (D-1.9 5 new event types) |
| Implementation order: DOMAIN → INFRASTRUCTURE → APPLICATION → API | CLAUDE.md §6 | Plan 15-04 orchestrates this for Permission/RolePermission; subsequent plans for use cases / routers |

**User profile directives (from CLAUDE.md tail):**
- **Frustrations:** "Before modifying any working code, mentally trace what depends on it." → Plan 15-08 (mutation endpoint perm DSL) MUST grep all 8 mutation routers and enumerate every endpoint touched. Plan 15-07 likewise for `require_admin` migration.
- **Frustrations:** "After implementation, double-check wiring (imports, prop names, event handlers, type signatures, async/await, snake_case vs camelCase)." → Plan 15-05 `change_user_role.py` migrate must verify Phase 14 14-01 test mocks update simultaneously (D-1.17).
- **Communication mixed; Decisions deliberate-informed:** Use option-tables in PLAN.md when planner has discretion (e.g., VARCHAR vs ENUM in D-3.5).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Backend Framework | pytest 7.x + pytest-asyncio (autouse) — `Backend/tests/conftest.py` |
| Frontend Framework | vitest 1.6.0 + @testing-library/react 16.3.2 — `Frontend2/vitest.config.ts` |
| E2E Framework | Playwright 1.51 (skip-guarded per Phase 11 D-50) — `Frontend2/playwright.config.ts` |
| Backend Quick run | `cd Backend && python -m pytest tests/unit/ -x` |
| Backend Full suite | `cd Backend && python -m pytest` |
| Frontend Quick run | `cd Frontend2 && npx vitest run components/admin components/auth lib/admin services` |
| Frontend Full suite | `cd Frontend2 && npm run test` |
| E2E Suite | `cd Frontend2 && npx playwright test` (skip-guarded) |
| Smoke build | `cd Frontend2 && npm run build` (catches StatCard tone enum drift, etc.) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RBAC-01 | Permission entity + ABC + ORM exist | unit | `pytest tests/unit/test_permission_entity.py -x` | ❌ Wave 0 (Plan 15-04) |
| RBAC-01 | Migration 007 idempotent | integration | `pytest tests/integration/test_migration_007_idempotency.py -x` | ❌ Wave 0 (Plan 15-04) |
| RBAC-01 | 26 perms seeded with correct scope | integration | `pytest tests/integration/admin/test_admin_permissions.py::test_list_returns_26_with_scope -x` | ❌ Wave 0 (Plan 15-06) |
| RBAC-01 | role_permissions matrix bootstrap (PM 13 / Member 3 / Admin 0 / Guest 0) | integration | `pytest tests/integration/admin/test_admin_role_permission_matrix.py::test_seeded_matrix_shape -x` | ❌ Wave 0 (Plan 15-06) |
| RBAC-02 | `require_permission(key)` raises 403 with PERMISSION_DENIED error_code | integration | `pytest tests/integration/test_require_permission_decorator.py -x` | ❌ Wave 0 (Plan 15-06) |
| RBAC-02 | JWT login returns permissions[] claim | integration | `pytest tests/integration/test_login_returns_permissions.py -x` | ❌ Wave 0 (Plan 15-06) |
| RBAC-02 | `_has_permission(user, key)` Admin super-role short-circuit | unit | `pytest tests/unit/test_has_permission.py -x` | ❌ Wave 0 (Plan 15-06) |
| RBAC-02 | `permitted_client(perms=[...])` fixture works | integration | `pytest tests/integration/test_permitted_client_fixture.py -x` | ❌ Wave 0 (Plan 15-04 fixture + 15-05 first consumer) |
| RBAC-03 | All 14+ require_admin migrate to require_permission | integration | `pytest tests/integration/admin/ -x` (full admin suite green after migration) | partial (existing admin tests need update) |
| RBAC-03 | Bulk-action dynamic perm check raises on missing sub-perm | integration | `pytest tests/integration/admin/test_admin_users_bulk.py::test_dynamic_perm_check_raises -x` | ❌ Wave 0 (Plan 15-07) |
| RBAC-03 | change_user_role.py role_id int contract | integration | `pytest tests/integration/admin/test_admin_users.py::test_role_change_via_role_id -x` | partial (Phase 14 14-01 tests need update) |
| RBAC-04 | Mutation endpoints have perm + membership/leader 2-tier | integration | `pytest tests/integration/api/test_2tier_perm_check.py -x` (one test per endpoint family: tasks/projects/comments/milestones/artifacts/phase_reports/workflow/lifecycle) | ❌ Wave 0 (Plan 15-08) |
| RBAC-04 | rbac.* audit events emit on role/perm changes | integration | `pytest tests/integration/test_rbac_audit_emission.py -x` | ❌ Wave 0 (Plan 15-07) |
| RBAC-05 | CreateRole / UpdateRole / DeleteRole use cases | unit + integration | `pytest tests/unit/application/test_manage_roles.py -x` AND `pytest tests/integration/admin/test_admin_roles.py -x` | ❌ Wave 0 (Plan 15-05/06) |
| RBAC-05 | Member fallback on role delete (single transaction) | integration | `pytest tests/integration/admin/test_admin_roles.py::test_delete_role_migrates_users_to_member -x` | ❌ Wave 0 (Plan 15-05) |
| RBAC-05 | System role 422 SYSTEM_ROLE_PROTECTED on PATCH/DELETE | integration | `pytest tests/integration/admin/test_admin_roles.py::test_system_role_protected -x` | ❌ Wave 0 (Plan 15-06) |
| RBAC-05 | Role name validation (1-50 char, Latin/TR alfabe, reserved names) | unit | `pytest tests/unit/test_role_name_validation.py -x` | ❌ Wave 0 (Plan 15-05) |
| RBAC-05 | Self-edit prevention (target_user_id == admin_id) | unit + integration | `pytest tests/unit/application/test_change_user_role.py::test_self_edit_raises -x` AND integration | ❌ Wave 0 (Plan 15-05) |
| RBAC-06 | useRoles / usePermissions / usePermissionMatrix hooks | unit (vitest) | `npx vitest run hooks/use-roles.test.ts` (and 6 others) | ❌ Wave 0 (Plan 15-09) |
| RBAC-06 | useUpdatePermissionCell optimistic mutation revert on 4xx | unit (vitest) | `npx vitest run hooks/use-update-permission-cell.test.ts` | ❌ Wave 0 (Plan 15-09) |
| RBAC-06 | <RequirePermission perm='X'> hides children when missing | unit (vitest) | `npx vitest run components/auth/require-permission.test.tsx` | ❌ Wave 0 (Plan 15-09) |
| RBAC-06 | useAuth().permissions / hasPermission helper | unit (vitest) | `npx vitest run context/auth-context.test.tsx` (extend Phase 13 test) | partial (existing test needs perms claim update) |
| RBAC-06 | AvatarDropdown admin-link `_has_permission(user, 'admin.access')` | unit (vitest) | `npx vitest run components/shell/avatar-dropdown.test.tsx` (UPDATE Phase 14 14-11 D-D2 regression Test 14) | partial (Phase 14 test exists, needs migration) |
| RBAC-07 | 7-layer atomic removal (NO disabled toggles, NO v3.0 Badge, etc.) | unit (vitest) | `npx vitest run components/admin/permissions/permission-matrix-card.test.tsx` (REWRITE Case 1-3 to assert ENABLED state) | partial (existing test asserts DISABLED, must flip) |
| RBAC-07 | Per-row scope badge (system / project) | unit (vitest) | `npx vitest run components/admin/permissions/permission-row.test.tsx::renders_scope_badge` | ❌ Wave 0 (Plan 15-10) |
| RBAC-07 | Auto-save per cell + Toast | unit (vitest) | `npx vitest run components/admin/permissions/permission-row.test.tsx::onChange_fires_mutation` | ❌ Wave 0 (Plan 15-10) |
| RBAC-08 | Yeni rol oluştur modal (icon picker + color swatch + name validation) | unit (vitest) | `npx vitest run components/admin/roles/role-create-modal.test.tsx` | ❌ Wave 0 (Plan 15-11) |
| RBAC-08 | Rolü düzenle modal disabled for system roles | unit (vitest) | `npx vitest run components/admin/roles/role-edit-modal.test.tsx::system_role_disabled` | ❌ Wave 0 (Plan 15-11) |
| RBAC-08 | Rolü sil ConfirmDialog with Member fallback message | unit (vitest) | `npx vitest run components/admin/roles/role-delete-confirm.test.tsx` | ❌ Wave 0 (Plan 15-11) |
| RBAC-08 | Self-edit UI button disabled | unit (vitest) | `npx vitest run components/admin/users/user-row-actions.test.tsx::self_edit_disabled` | ❌ Wave 0 (Plan 15-11) |
| RBAC-08 | activity-row + audit-event-mapper rbac.* render | unit (vitest) | `npx vitest run lib/audit-event-mapper.test.ts components/activity/activity-row.test.tsx` (UPDATE) | partial (Phase 14 14-10 set the precedent; must extend) |
| RBAC-08 | Playwright E2E specs (skip-guarded) | E2E | `npx playwright test admin-rbac-` | ❌ Wave 0 (Plan 15-12) |
| RBAC-08 | UAT checklist 20-25 rows | manual-only | review `15-UAT-CHECKLIST.md` | ❌ Wave 0 (Plan 15-12) |
| TIDY-01 | StatCard tone="warning" build green | smoke | `cd Frontend2 && npm run build` | ✅ Plan 14-18 may have closed (verify) |
| TIDY-02 | 11 unit tests baseline green | unit | `cd Backend && python -m pytest tests/unit/ -x` | ❌ Wave 0 (Plan 15-02) |
| TIDY-03 | 3 test_project_workflow_patch.py 422 tests green | integration | `cd Backend && python -m pytest tests/integration/api/test_project_workflow_patch.py -x` | ❌ Wave 0 (Plan 15-02) |
| TIDY-04 | 19 workflow-editor tests baseline green | unit (vitest) | `cd Frontend2 && npx vitest run components/workflow-editor/` | ❌ Wave 0 (Plan 15-01) |
| TIDY-05 | requires_db marker auto-skips on absent DB | integration | `pytest tests/integration/test_requires_db_marker.py -x` | ❌ Wave 0 (Plan 15-02) |

### Sampling Rate

- **Per task commit (Backend Wave 0 RBAC):** `cd Backend && python -m pytest tests/unit/ tests/integration/admin/ -x`
- **Per task commit (Frontend Wave 0 RBAC):** `cd Frontend2 && npx vitest run components/admin components/auth lib/admin hooks/use-roles hooks/use-permissions hooks/use-permission-matrix services/admin-rbac-service`
- **Per wave merge:** Full backend pytest + full Frontend2 vitest + `npm run build`
- **Phase gate:** All of the above + Playwright skip-guarded E2E + UAT checklist review

### Wave 0 Gaps (test files / fixtures that must land BEFORE production code)

- [ ] `Backend/tests/conftest.py` — `permitted_client` fixture (~50 lines append after line 178). Plan 15-04.
- [ ] `Backend/tests/conftest.py` — `pytest_collection_modifyitems` + `requires_db` marker. Plan 15-02 (TIDY-05).
- [ ] `Backend/tests/unit/test_permission_entity.py` — entity validation (Wave 0 Plan 15-04).
- [ ] `Backend/tests/unit/test_has_permission.py` — _has_permission Admin super-role + claim lookup (Plan 15-06).
- [ ] `Backend/tests/integration/test_migration_007_idempotency.py` — replay test (Plan 15-04).
- [ ] `Backend/tests/integration/admin/test_admin_roles.py` — CRUD + system protection + Member fallback (Plan 15-05/06).
- [ ] `Backend/tests/integration/admin/test_admin_permissions.py` — list 26 perms with scope (Plan 15-06).
- [ ] `Backend/tests/integration/admin/test_admin_role_permission_matrix.py` — matrix GET + per-cell PATCH (Plan 15-06).
- [ ] `Backend/tests/integration/test_rbac_audit_emission.py` — 5 rbac.* event types fire (Plan 15-07).
- [ ] `Backend/tests/integration/test_require_permission_decorator.py` — decorator returns 403 PERMISSION_DENIED (Plan 15-06).
- [ ] `Backend/tests/integration/api/test_2tier_perm_check.py` — perm + membership/leader sequencing (Plan 15-08).
- [ ] `Backend/tests/integration/test_login_returns_permissions.py` — login response shape carries permissions[] (Plan 15-06).
- [ ] `Frontend2/components/auth/require-permission.test.tsx` — guard hides when perm missing, renders when present (Plan 15-09).
- [ ] `Frontend2/hooks/use-update-permission-cell.test.ts` — optimistic update + revert on 4xx (Plan 15-09).
- [ ] `Frontend2/hooks/use-roles.test.ts`, `use-permissions.test.ts`, `use-permission-matrix.test.ts` — TanStack Query hooks (Plan 15-09).
- [ ] `Frontend2/services/admin-rbac-service.test.ts` — service layer (Plan 15-09).
- [ ] `Frontend2/components/admin/roles/role-create-modal.test.tsx`, `role-edit-modal.test.tsx`, `role-delete-confirm.test.tsx` (Plan 15-11).
- [ ] `Frontend2/components/admin/permissions/permission-scope-badge.test.tsx` (Plan 15-10).
- [ ] **TEST UPDATES (existing files):**
  - `Frontend2/components/admin/permissions/permission-matrix-card.test.tsx` — REWRITE Case 1-3 to assert ENABLED state (Plan 15-10).
  - `Frontend2/components/admin/permissions/permission-row.test.tsx` — REWRITE for active toggle + scope badge (Plan 15-10).
  - `Frontend2/components/admin/roles/role-card.test.tsx` — Guest active read-only assertion (Plan 15-10).
  - `Frontend2/components/admin/roles/new-role-placeholder-card.test.tsx` — RENAME or migrate to `new-role-modal-trigger.test.tsx` (Plan 15-10).
  - `Frontend2/components/shell/avatar-dropdown.test.tsx` — Test 14 migrate to perm-based gate (Plan 15-11).
  - `Backend/tests/unit/test_deps_package_structure.py` — fix `__all__ == []` assertion to `["get_milestone_repo"]` (Plan 15-02 TIDY-02).
  - `Backend/tests/unit/application/test_register_user.py` — IUserRepository.create signature update (Plan 15-02 TIDY-02).
  - `Backend/tests/unit/application/test_phase_gate_use_case.py` — 4 test fixture drift fixes (Plan 15-02 TIDY-02).
  - `Backend/tests/unit/application/test_manage_phase_reports.py` — 2 cycle_number computation update (Plan 15-02 TIDY-02).
  - `Backend/tests/unit/infrastructure/test_task_repo_soft_delete.py` — 2 audit row enrichment update (Plan 15-02 TIDY-02).
  - `Frontend2/components/workflow-editor/editor-page.test.tsx` — extend `vi.mock("@xyflow/react")` with ReactFlowProvider + useReactFlow stubs (Plan 15-01 TIDY-04).
  - `Frontend2/components/workflow-editor/selection-panel.test.tsx` Test 5 — same harness fix (Plan 15-01).
  - `Frontend2/components/workflow-editor/workflow-canvas.test.tsx` — readOnly forwarding (Plan 15-01).
  - `Frontend2/components/workflow-editor/phase-edge.test.tsx` — Position type drift (Plan 15-01).
  - `Frontend2/components/workflow-editor/use-transition-authority.test.tsx` — UseQueryResult v5 cast (Plan 15-01).
  - `Frontend2/components/lifecycle/milestones-subtab.test.tsx` — spread-arg fixture (Plan 15-01).
  - `Frontend2/lib/api-client.test.ts` — TS error fix (Plan 15-01).
  - `Frontend2/lib/audit-event-mapper.test.ts` — extend with 5 rbac.* tests (Plan 15-09).
  - `Frontend2/components/activity/activity-row.test.tsx` — extend with 5 rbac.* render branches (Plan 15-09).
  - `Backend/app/api/v1/projects.py:211` — extend except block (Plan 15-02 TIDY-03 — production fix; tests already exist at `test_project_workflow_patch.py`).

*If no gaps: NOT applicable — Phase 15 is largely greenfield infra; all test files are NEW.*

## Security Domain

> security_enforcement absent in config.json (treat as enabled per default).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing JWT (jose) — no Phase 15 changes (D-1.6 reuses 30dk passive TTL) |
| V3 Session Management | yes | localStorage AUTH_TOKEN_KEY (Phase 10 D-03) — unchanged in Phase 15 |
| V4 Access Control | **YES (PRIMARY)** | `Depends(require_permission(key))` + Phase 9 D-15 + `get_project_member` 2-tier check |
| V5 Input Validation | yes | Pydantic v2 DTOs (`role_dtos.py` validates name 1-50 char, regex `/^[A-Za-zÇĞİÖŞÜçğıöşü0-9 _-]+$/` per D-2.6); reserved system role names rejected |
| V6 Cryptography | yes | jose JWT signing — unchanged. NEVER hand-roll JWT impl |
| V7 Error Handling | yes | Phase 9 D-09 error_code taxonomy + Phase 15 PERMISSION_DENIED, SYSTEM_ROLE_PROTECTED, ROLE_NAME_INVALID, INVALID_WORKFLOW_CONFIG |
| V11 Business Logic | yes | Self-edit prevention (D-2.9 last-admin lockout); system role protection (D-2.3); Member fallback transaction (D-2.2); reserved name validation (D-2.6) |

### Known Threat Patterns for FastAPI + Postgres + Next.js stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection on perm key lookup | Tampering | Parameterized SQLAlchemy queries in repos; never f-string SQL |
| JWT claim tampering | Tampering | jose signature verification + JWT_SECRET kept in env; if claim altered, signature breaks ⇒ 401 |
| Privilege escalation via self-role-change | Elevation | D-2.9 backend `if target_user_id == admin_id: raise PermissionError`; defense in depth with frontend disabled UI |
| Last-admin lockout | DoS | D-2.9 + D-1.5 (Admin super-role); Admin column readonly in matrix; "Sistem" badge on Admin role card |
| Permissions[] claim oversize → 400 Bad Request | DoS | 26 max perms = ~700B JWT; comfortably below 8KB header floor |
| System role rename via PATCH | Tampering | Backend `is_system_role` check raises 422 SYSTEM_ROLE_PROTECTED (D-2.3) |
| Frontend `<RequirePermission/>` removal via DOM tamper | Information disclosure | Backend `Depends(require_permission)` is authoritative — frontend bypass leaks UI but not data |
| Bulk-action partial success | Information disclosure | Per-user audit row written even on failed sub-perm check; admin sees full result map (Phase 14 14-01 D-B7) |
| Race on permission revoke during request | TOCTOU | D-1.6 passive 30dk TTL — no real-time revoke; race not possible at JWT layer |
| Custom role with reserved system name | Tampering | D-2.6 reserved names case-insensitive: `Admin`, `Project Manager`, `Member`, `Guest` rejected at create |
| Migration replay duplicates roles | Data integrity | Migration 007 ON CONFLICT DO NOTHING for INSERT, ON CONFLICT DO UPDATE for is_system_role flip |
| Stale JWT after Phase 15 deploy | Auth disruption | Backwards-compat: `get_current_user` defaults `permissions=[]` (Pitfall 9); existing Admin users keep working via `_is_admin` short-circuit |
| Audit_log injection via metadata | Tampering | `audit_repo.create_with_metadata` accepts dict — JSONB serialization auto-escapes; no SQL injection vector |

## Risk Register

| # | Risk | Severity | Plan(s) Most Affected | Mitigation |
|---|------|---------|----------------------|------------|
| R-01 | Phase 14-11 D-D2 cross-phase contract regression — avatar-dropdown test 14 must migrate to perm-based gate | HIGH | 15-11 | RTL test update is explicit task in Plan 15-11. Verify with `npx vitest run components/shell/avatar-dropdown.test.tsx` after migration. |
| R-02 | JWT permissions[] claim breaks existing localStorage tokens after Phase 15 deploy | MEDIUM | 15-06 | `get_current_user` defaults `permissions=[]` (Pitfall 9). Plan 15-06 ships this defensive default. Existing Admin users unaffected (super-role short-circuit). |
| R-03 | Migration 007 idempotency replay against seeded DB | MEDIUM | 15-04 | `_table_exists` / `_column_exists` / `_index_exists` helpers reused; `INSERT ... ON CONFLICT DO NOTHING` for seed; explicit `test_migration_007_idempotency.py` fires 007 twice and asserts no errors. |
| R-04 | 7-layer atomic commit partial failure leaves UI inconsistent | HIGH | 15-10 | Atomic commit per D-2.7. Test files updated SAME COMMIT. Plan 15-10 verify: `git diff --stat HEAD~1` shows 7 prod files + 4 test files in single commit. |
| R-05 | change_user_role.py migrate breaks Phase 14 14-01 tests | HIGH | 15-05 | D-1.17 explicit: "Phase 14 14-01 testleri update gerekir." Plan 15-05 INCLUDES test update in same commit. Run `pytest tests/integration/admin/test_admin_users.py` post-migration. |
| R-06 | TIDY-04 ReactFlowProvider mock incomplete — 19 failures persist | HIGH | 15-01 | Pattern 6 above shows full mock shape. Verify with `npx vitest run components/workflow-editor/` shows 0 failures. |
| R-07 | Bulk-action dynamic perm check transaction semantics | MEDIUM | 15-07 | Pitfall 17: pre-check before lock. Test in `test_admin_users_bulk.py::test_dynamic_perm_check_pre_lock`. |
| R-08 | Self-edit prevention bypass via API direct call | HIGH | 15-05 | D-2.9 backend `raise PermissionError`; frontend disabled UI is cosmetic. Test in `test_change_user_role.py::test_self_edit_raises`. |
| R-09 | System role lockout via UI tampering | MEDIUM | 15-04 | D-2.3 `is_system_role` boolean check; PATCH/DELETE 422 SYSTEM_ROLE_PROTECTED. Backend authoritative. |
| R-10 | Matrix UI race conditions (rapid toggling same cell) | LOW | 15-10 | TanStack Query `cancelQueries` in `onMutate` prevents stale-closure races. `onSettled` always invalidates. |
| R-11 | Cross-phase audit-event-mapper drift (5 new rbac.* types) | MEDIUM | 15-09 | Plan 15-09 cross-cuts 4 files in single commit (audit-event-mapper.ts, activity-row.tsx, event-meta.ts, audit-event-mapper.test.ts). Phase 14 14-10 set the precedent. |
| R-12 | `permissions-static.ts` accidentally deleted breaks consumers | MEDIUM | 15-09/10 | Plan 15-09 audits `grep -rn "permissions-static" Frontend2/` ⇒ enumerate consumers. Keep file as legacy import shim. Deletion deferred to v2.1. |
| R-13 | Postgres ENUM ALTER limitations | LOW | 15-04 | Pitfall 1: prefer VARCHAR(16) + CHECK constraint per Phase 9 precedent. Discretion grants planner choice; recommendation is VARCHAR. |
| R-14 | TIDY-02 `test_deps_package_structure.py` drift | LOW | 15-02 | Pitfall 15: trivial fix — assert `["get_milestone_repo"]` instead of `[]`. |
| R-15 | TIDY-03 ValidationError vs ValueError catch | LOW | 15-02 | Pitfall 4: extend except clause to `(ValidationError, ValueError)`. Test already exists at `test_project_workflow_patch.py`. |
| R-16 | StatCard `tone="warning"` re-introduction during RBAC modal work | LOW | 15-11 | Discoverable via `npm run build` smoke after Plan 15-11. If RBAC modal uses StatCard with warning, add to enum first. |
| R-17 | FastAPI Depends ordering (perm + project_authority) | LOW | 15-08 | Pitfall 13: order doesn't affect correctness; both raise on failure. Place perm-first for perf. Cached `get_current_user` ensures no double JWT decode. |
| R-18 | Build cache mismatch after migration 007 (egg-info, pycache) | LOW | 15-04 | `python -m pip install -e Backend/` (re-install) + `find Backend -name __pycache__ -exec rm -rf {} +` after migration land. Document in 15-04 PLAN. |
| R-19 | Plan 15-09 rbac.* SemanticEventType union extension breaks `semanticToFilterChip` | MEDIUM | 15-09 | Pitfall 19: existing if/else chain has fallback `return "all"`. Extend with new "rbac" chip OR fold into "admin" chip. Decision in Plan 15-09. |
| R-20 | Test fixture `permitted_client` location ambiguity | LOW | 15-04 | CONTEXT Discretion recommends top-level `Backend/tests/conftest.py`. Plan 15-04 wires there. |
| R-21 | `IRoleRepository` ABC missing — Phase 14 used duck-typed callable | MEDIUM | 15-04 | Pitfall 12: Plan 15-04 creates the ABC. Plan 15-05 migrate `change_user_role.py` to use it. |
| R-22 | Migration 007 ENUM AUTOCOMMIT pitfall | LOW | 15-04 | Pitfall 1: VARCHAR + CHECK avoids this entirely. If native ENUM chosen, use `DO $$ BEGIN ... EXCEPTION END $$` block. |
| R-23 | RoleNotFoundError missing exception class | LOW | 15-05 | Plan 15-05 adds to `Backend/app/domain/exceptions.py`. Mirror `UserNotFoundError`. |

## Implementation Gotchas

### Backend

1. **`User` entity must add `permissions: list[str] = []`** (Pitfall 18). Pydantic default factory or default `[]`. Without this, `get_current_user` default backfill breaks.
2. **`get_current_user` reads `payload.get("permissions", [])`** — defensive default for Pitfall 9 (stale tokens).
3. **`_has_permission` does `key in (user.permissions or [])`** — defense in depth against `user.permissions = None` edge case.
4. **JWT encoding sorts perms alphabetically** (Pitfall 14). `payload = {"sub": ..., "permissions": sorted(perms)}`. Discretion endorses.
5. **Migration 007 reuses Phase 9 helpers verbatim** (Pitfall 8). Copy `_table_exists` / `_column_exists` / `_index_exists` from `005_phase9_schema.py:43-97`.
6. **Migration 007 uses ON CONFLICT for upserts** — perms seed and role_permissions matrix bootstrap.
7. **`permission_scope` recommended VARCHAR(16) + CHECK** (Pitfall 1) — mirrors Phase 9 D-22 `projects.status` precedent.
8. **`require_permission` is a factory returning a Depends-compatible callable** — NOT a decorator at module-eval. Pattern: `Depends(require_permission("admin.users.invite"))`.
9. **`require_permission` placed FIRST in handler signature** (Pitfall 13) — perm check is cheap (in-memory); short-circuit before DB-heavy `require_project_transition_authority`.
10. **`change_user_role.py` migrate destroys role_id_resolver closure** — Plan 15-05 migrate use case + tests + frontend hook + admin user-row-actions in same commit.
11. **`permitted_client` fixture builds JWT directly** — bypasses login endpoint, no DB seed for perms (D-1.10).
12. **`pytest_collection_modifyitems` signature** — pytest only passes args you list (per [pytest docs](https://docs.pytest.org/en/stable/how-to/writing_hook_functions.html)). Use `(config, items)` — skip `session`.
13. **`requires_db` marker probe MUST be sync-safe** — wrap async probe in `asyncio.run(...)`. Probe failures must not abort collection (return False ⇒ skip-mark; never raise).
14. **`UPDATE roles SET is_system_role=true WHERE LOWER(name) IN (...)`** — case-insensitive match. Existing seeder lowercases roles? Verify: `seeder.py:31` shows mixed-case ("Admin", "Project Manager", "Member"). LOWER() in SQL is safe.
15. **Audit emission for rbac.* events** — entity_type='role' or 'role_permission'; action='created' / 'updated' / 'deleted' / 'permission_granted' / 'permission_revoked'. Five distinct entity_type+action combinations map to 5 SemanticEventTypes.
16. **`SqlAlchemyRoleRepository` is NEW** — duck-typed callable in Phase 14 14-01 must be replaced everywhere `change_user_role.py` is wired (`admin_users.py:63-69` `_make_role_id_resolver`). Plan 15-05 cross-cut.
17. **`ChangeUserRoleUseCase.execute` signature changes** — Plan 14-01 testler 3 ayrı test fixed string AdminRole kullanır; tüm 3 testi role_id int ile günceller.
18. **Login handler builds claim** — read user.role.id ⇒ `SELECT permission.key FROM permissions p JOIN role_permissions rp ON ... WHERE rp.role_id = :role_id` ⇒ list of keys ⇒ JWT claim.
19. **Bulk-action use case dynamic check** — at `execute()` entry, before lock, check `_has_permission(user, sub_perm)` for each unique action in batch. If ANY fail, raise PermissionError before any DB work.
20. **Mutation endpoint hibrit DSL is ADDITIVE** — never remove existing `Depends(get_project_member)` or `Depends(require_project_transition_authority)`. Plan 15-08 only ADDS the perm decorator yan yana.

### Frontend

1. **`"use client"` on every interactive component** — `<RequirePermission/>`, role modals, permission-row, permission-matrix-card, etc. (already established).
2. **AuthContext extends with `permissions: string[]` + `hasPermission(key)` helper** (CONTEXT line 403). Update `auth-service.ts` to parse JWT permissions claim. Backwards compat: default `[]` if missing.
3. **`useAuth().permissions` consumed by `<RequirePermission/>` hook composition** — pure React, no library.
4. **Avatar dropdown gate migrate** — `avatar-dropdown.tsx:73` line `const isAdmin = roleName.toLowerCase() === "admin"` ⇒ `const canAccessAdmin = (user?.permissions ?? []).includes("admin.access") || roleName.toLowerCase() === "admin"`. Keep `isAdmin` for role badge tone (line 203). Two booleans, one for link gate, one for badge.
5. **TanStack Query optimistic mutation pattern** (Pattern 3 above) — follow [official docs](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates) verbatim. `onMutate` returns context; `onError` reads context; `onSettled` invalidates.
6. **vitest mock for @xyflow/react MUST include ReactFlowProvider** (Pitfall 3, Pattern 6). Centralize in editor-page.test.tsx (the only consumer).
7. **`milestones-subtab.test.tsx` spread-arg fixture fix** — TanStack v5 hook return shape change broke fixture spreading. Look for `{...mockUseQuery}` patterns; replace with explicit `{ data, isPending, isError }` props.
8. **`use-transition-authority.test.tsx` UseQueryResult cast** — v5 removed `isLoading` ⇒ `isPending`. Change `isLoading: false` → `isPending: false` in mocks.
9. **`phase-edge.test.tsx` Position type drift** — `vi.mock("@xyflow/react", ...)` returns `Position` as plain object `{ Top: "top", ... }`. Production code typed as `Position` enum. Cast or use string literals matching enum values.
10. **Per-row scope badge** — `<PermissionScopeBadge scope={perm.scope} />` reading from API response shape. Test by mocking API to return `[{...perm, scope: 'system'}, {...perm, scope: 'project'}]` and asserting badge text "(system)" / "(project)" in row.
11. **Role create/edit modal** — controlled form via React state, Pydantic-equivalent validation client-side using `lib/admin/role-validation.ts`. Same regex as backend (1-50 char + Latin/TR alfabe + reserved names).
12. **Role delete ConfirmDialog uses `<ConfirmDialog/>` primitive (Phase 10 D-25)** — REUSE, don't build new.
13. **Icon picker is 8-button grid using `lucide-react` icons** — not a separate library. Buttons render the icon; selected state via `aria-pressed`.
14. **Color swatch is 6 chip buttons using inline `background: var(--{token})`** — buttons store their token name as data attribute; on click, write token name to form state.
15. **`<RequirePermission/>` consumers** — wrap nav items, action buttons in admin pages. Server-side perm check is the authoritative; client guard is UX hide.
16. **System role card "Sistem" badge** — render when `role.is_system_role === true`. Read `is_system_role` from `useRoles()` response shape.
17. **Self-edit UI button disabled** — `<button disabled={user.id === currentUser.id}>` next to "Rolü değiştir" in admin user table row.
18. **`useUpdatePermissionCell` Toast i18n** — TR "Yetki güncellendi" / EN "Permission updated"; revert toast TR "Yetki güncellenemedi" / EN "Failed to update".
19. **NewRolePlaceholderCard rename to NewRoleModalTrigger** — file rename; existing test `new-role-placeholder-card.test.tsx` migrates to `new-role-modal-trigger.test.tsx`. Plan 15-10 atomic commit.
20. **AlertBanner content change** — current "v3.0'da gelecek" message ⇒ "RBAC altyapısı aktif". Plan 15-10 i18n key value update (admin-rbac-keys.ts).

### Testing

1. **`permitted_client` fixture is a factory** — returns a callable that takes `perms=[...]` kwarg. Mirrors `authenticated_client` pattern.
2. **Test ordering** — Wave 0 RBAC tests can use `permitted_client` after Plan 15-04 ships fixture. Order: 15-01 (TIDY-04) → 15-02 (TIDY-02/03/05) → 15-03 (TIDY-01 verify) → 15-04 (RBAC infra) → ...
3. **RTL `expect(input).toBeDisabled()`** — works only with native `disabled` attr. Phase 14 14-04 chose `<input type="checkbox" role="switch">` over Toggle primitive specifically for this. Plan 15-10 keeps the underlying input shape (re-purpose with `disabled={false}` + onChange handler).
4. **vitest mock factory style** — `vi.mock("module", () => ({ ... }))` for module-level; `vi.mocked(fn).mockReturnValue(...)` for spy-style.
5. **TanStack Query test setup** — wrap with `<QueryClientProvider client={new QueryClient(...)}>`. See `Frontend2/test/setup.ts` if it has a wrapper helper; may need to add one for hook tests.
6. **DB-required integration tests** must use `pytestmark = pytest.mark.requires_db` at module level (Pitfall 7 per CONTEXT D-4.4).
7. **E2E specs are skip-guarded per Phase 11 D-50** — `test.skip(condition, reason)` at top of describe block. CI runs full; dev iter skip.

## Open Questions

1. **PostgreSQL native ENUM vs VARCHAR + CHECK for `permissions.scope`** (D-3.5 Discretion).
   - What we know: Both work. Phase 9 precedent is VARCHAR. Native ENUM is more correct semantically but Alembic enum migrations are painful.
   - What's unclear: Does the planner want strict DB-level safety or migration simplicity?
   - Recommendation: VARCHAR(16) + CHECK constraint (Pattern 4 alternative). Plan 15-04 picks; explicit Discretion grant in CONTEXT.

2. **Permissions-static.ts deprecation strategy** (Discretion).
   - What we know: File has 14 perm rows + types `PermissionKey` and `AdminRole`. Plan 15-09 audits consumers.
   - What's unclear: Are there any consumers outside `permission-matrix-card.tsx` and `permission-row.tsx`?
   - Recommendation: Plan 15-09 runs `grep -rn "permissions-static" Frontend2/` BEFORE Plan 15-10 ships. If only the matrix files import, file becomes legacy import shim re-exporting types from new `lib/admin/rbac-types.ts`. If wider consumers, keep file in place + redirect data source.

3. **`<RequirePermission/>` guard implementation: HOC vs render-prop vs hook + early return** (Discretion).
   - What we know: Hook + early return is recommended (CONTEXT Discretion). React 19 prefers composition.
   - What's unclear: Server Action permission checks — Phase 15 doesn't use Server Actions, so N/A.
   - Recommendation: Hook + early return per Example 4 above. `useHasPermission(perm)` returns boolean; component conditionally renders children.

4. **Matrix UI per-row scope badge styling** (Discretion).
   - What we know: 3 candidate options — Badge tone='neutral' inline, separate chip, prefix etiketi.
   - What's unclear: Which is consistent with Phase 14 D-D2 metadata badges?
   - Recommendation: `<Badge tone='neutral' size='xs'>(system)</Badge>` inline next to perm key. Mirrors Phase 14 14-09 D-D2 metadata badge convention.

5. **JWT permissions[] claim sorting** (Discretion).
   - What we know: Alphabetical recommended (deterministic, debug-friendly).
   - What's unclear: None.
   - Recommendation: `sorted(perms)` everywhere — login encode + permitted_client fixture.

6. **Idempotency-Key for matrix toggle PATCH** (Discretion).
   - What we know: Phase 9 D-08 idempotency pattern (5dk TTL); UI optimistic update double-click revert may be sufficient.
   - What's unclear: Can rapid toggles produce backend race?
   - Recommendation: NO Idempotency-Key. UI cancelQueries + onMutate snapshot handles double-click. Backend PATCH is idempotent at row level (`{role_id, perm_key, granted}` is the natural key).

7. **role_permissions row delete vs soft-flag on revoke** (Discretion).
   - What we know: Hard-delete recommended (bounded row count, audit_log preserves history).
   - What's unclear: None.
   - Recommendation: Hard-delete. `INSERT INTO role_permissions ON CONFLICT DO NOTHING` for grant; `DELETE FROM role_permissions WHERE role_id=:r AND permission_id=:p` for revoke.

8. **Plan 15-10 SemanticEventType new chip vs fold into existing `admin` chip** (R-19).
   - What we know: Phase 14 14-10 created `admin` chip for 10 admin-side types.
   - What's unclear: Should `rbac.*` 5 new types fold into `admin` (consistency) or get a new `rbac` chip (granularity)?
   - Recommendation: Fold into `admin` chip. Plan 15-09 adds 5 to the existing `if` block at `audit-event-mapper.ts:178-191`. New chip would clutter the SegmentedControl.

9. **Plan 15-04 single plan vs split into 15-04a / 15-04b** (CONTEXT D-01 strawman).
   - What we know: Strawman lists 15-04 as ~10-15 files (Permission entity + 3 repos + 3 ORM + migration + permitted_client fixture).
   - What's unclear: Is this fat enough to risk 14-01 levels of complexity?
   - Recommendation: Single plan. Phase 14 14-01 was ~30 files and shipped fine. Plan 15-04 is half that. Don't fragment.

10. **Login handler perm computation: per-request DB query or denormalized cache?** (Implementation detail).
    - What we know: At login time, fetch `SELECT p.key FROM permissions p JOIN role_permissions rp ON p.id=rp.permission_id WHERE rp.role_id=:role_id` ⇒ build claim.
    - What's unclear: Do we cache per-role perm list in memory?
    - Recommendation: NO cache. Login is rare (once per 30dk per user). DB query is cheap (~26 rows max). Simplicity wins.

## Sources

### Primary (HIGH confidence)

- **CONTEXT.md** — `.planning/phases/15-rbac-redesign-and-phase-14-deferred-cleanup/15-CONTEXT.md` (D-00..D-4.6, canonical_refs, code_context, deferred). Re-read frequently.
- **Phase 14 14-01 PLAN** — `.planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/14-01-PLAN.md` (fat-infra Wave 0 pattern blueprint).
- **Phase 14 deferred-items.md** — `.planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/deferred-items.md` (TIDY-01..05 source of truth, lines 1-329).
- **Phase 9 005_phase9_schema.py** — `Backend/alembic/versions/005_phase9_schema.py:43-97` (idempotent migration helpers).
- **Phase 14 006_phase14_admin_panel.py** — `Backend/alembic/versions/006_phase14_admin_panel.py:30-58` (Phase 9 helper reuse precedent).
- **Phase 9 audit_repository.py** — `Backend/app/domain/repositories/audit_repository.py:38-53` (`create_with_metadata` signature).
- **Phase 9 require_project_transition_authority** — `Backend/app/api/deps/auth.py:75-104` (D-15 yan yana decorator pattern).
- **Phase 14 admin_users.py change_user_role wiring** — `Backend/app/api/v1/admin_users.py:63-91` (`_make_role_id_resolver`, `_make_update_role` closures — Phase 15 replaces).
- **Phase 14 PermissionMatrixCard** — `Frontend2/components/admin/permissions/permission-matrix-card.tsx` (full file; Plan 15-10 atomic uplift target).
- **Phase 14 PermissionRow** — `Frontend2/components/admin/permissions/permission-row.tsx` (toggle activation target).
- **Phase 14 RoleCard** — `Frontend2/components/admin/roles/role-card.tsx` (Guest active read-only target).
- **Phase 13 avatar-dropdown** — `Frontend2/components/shell/avatar-dropdown.tsx:73-339` (D-2.11 admin link gate migrate target).
- **Phase 13 audit-event-mapper** — `Frontend2/lib/audit-event-mapper.ts` (full file; rbac.* extension target).
- **Phase 12 test_project_workflow_patch.py** — `Backend/tests/integration/api/test_project_workflow_patch.py` (3 failing tests TIDY-03 fix targets).
- **Backend/tests/conftest.py** — Lines 1-179 (authenticated_client fixture for permitted_client extension).
- **Backend/app/api/v1/projects.py:193-238** — PATCH handler ValidationError catch site (TIDY-03 extension).
- **Backend/tests/unit/test_deps_package_structure.py:94-105** — TIDY-02 single-test edit target.
- **Frontend2/components/workflow-editor/editor-page.test.tsx:83-111** — vi.mock @xyflow/react extension target (TIDY-04).
- **Frontend2/components/workflow-editor/workflow-canvas-inner.tsx:127-134** — production ReactFlowProvider mount.

### Secondary (MEDIUM confidence — verified via official docs)

- [TanStack Query v5 Optimistic Updates Guide](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates) — onMutate / onError / onSettled pattern.
- [TanStack Query v5 useMutation Reference](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation) — full API.
- [pytest hook writing](https://docs.pytest.org/en/stable/how-to/writing_hook_functions.html) — `pytest_collection_modifyitems` signature.
- [FastAPI Discussion #6294 — Execution order of dependencies](https://github.com/fastapi/fastapi/discussions/6294) — order is implementation detail.
- [FastAPI Issue #5317 — Execution order](https://github.com/fastapi/fastapi/issues/5317) — same.
- [React Flow Testing](https://reactflow.dev/learn/advanced-use/testing) — ReactFlowProvider wrapping in tests.
- [React Flow Migrate to v12](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) — Provider requirement for useReactFlow.
- [PostgreSQL Enum Migration with Alembic — Makimo blog](https://medium.com/makimo-on-software-development/upgrading-postgresqls-enum-type-with-sqlalchemy-using-alembic-migration-881af1e30abe) — ALTER TYPE AUTOCOMMIT pitfall.
- [PostgreSQL Enum Migration — Code, by Kepler](https://code.keplergrp.com/blog/migrating-postgresql-enum-sqlalchemy-alembic) — same caveat.

### Tertiary (LOW confidence — single source, verify before relying)

- JWT size 8KB header limit — derived from [JWT Token Size article on w3tutorials.net](https://www.w3tutorials.net/blog/what-is-the-maximum-size-of-jwt-token/) (verified plausible vs. typical Nginx default `large_client_header_buffers 4 8k`).

## Metadata

**Confidence breakdown:**
- Standard stack & dependencies — HIGH (every version verified against `Backend/requirements.txt` / `Frontend2/package.json` files cited inline).
- Codebase patterns — HIGH (every analog cited with file:line; Phase 14 14-01 / 14-04 / Phase 9 D-15 / Phase 13 D-D2 are concrete precedents).
- TIDY fixes — HIGH (root causes confirmed in code: TIDY-02 `__all__` mismatch verified, TIDY-03 `ValueError vs ValidationError` distinction in test fixture, TIDY-04 production `<ReactFlowProvider>` already present, TIDY-05 hook pattern matches pytest docs).
- External library specifics (TanStack v5 optimistic, FastAPI Depends order, ReactFlow Provider) — MEDIUM (verified via official docs but not exercised in codebase yet).
- PostgreSQL ENUM idempotency — MEDIUM (Phase 9 codebase prefers VARCHAR + CHECK; native ENUM untested in this repo).
- Cross-phase contract risk (Phase 14-11 D-D2 regression) — HIGH (test file Test 14 explicitly noted in CONTEXT, plan 14-11 is logged in deferred-items references).
- JWT claim size projection — MEDIUM (math verified: 26 perms × 20B avg = 520B; comfortably below 8KB; but worst-case behaviors at scale unverified).

**Research date:** 2026-04-29
**Valid until:** 2026-06-15 (~7 weeks). Refresh if @xyflow/react bumps to 13.x or TanStack Query bumps to 6.x or Pydantic bumps to v3.

## RESEARCH COMPLETE
