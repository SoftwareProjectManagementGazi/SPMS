# Phase 15: RBAC Yeniden Tasarımı & Phase 14 Deferred Items Cleanup — Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** ~50 NEW production files + ~28 NEW test files + ~15 EXISTING files (cross-cutting / extension)
**Analogs found:** 18 / 18 cluster categories (every NEW file has at least a partial analog in this codebase — no green-field territory)

> Quality bar reminder (CONTEXT D-00): "I don't want any sloppy plan or execution, need this done CAREFULLY." Every analog cited below carries concrete file:line so the planner copies code verbatim, not vibes.

---

## File Classification

### Backend (Clean Architecture vertical slice — Phase 14 14-01 mirror)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `Backend/app/domain/entities/permission.py` | entity (Pydantic) | n/a (data) | `Backend/app/domain/entities/role.py` | exact |
| `Backend/app/domain/entities/role_permission.py` | entity (junction) | n/a (data) | `Backend/app/domain/entities/role.py` + `Backend/app/infrastructure/database/models/team.py:30-39` (TeamProjectModel junction) | role-match |
| `Backend/app/domain/repositories/permission_repository.py` | repository ABC | CRUD | `Backend/app/domain/repositories/milestone_repository.py` | exact |
| `Backend/app/domain/repositories/role_permission_repository.py` | repository ABC | CRUD (junction) | `Backend/app/domain/repositories/milestone_repository.py` + `Backend/app/domain/repositories/audit_repository.py` (composite shape) | role-match |
| `Backend/app/domain/repositories/role_repository.py` | repository ABC | CRUD | `Backend/app/domain/repositories/milestone_repository.py` | exact |
| `Backend/app/domain/exceptions.py` (extend) | domain exception | n/a | `Backend/app/domain/exceptions.py:14-30, 56-67, 130-152` | exact (extend file in place) |
| `Backend/app/infrastructure/database/models/permission.py` | ORM model | CRUD | `Backend/app/infrastructure/database/models/role.py` (simple) + `Backend/app/infrastructure/database/models/team.py:30-39` (junction) | exact |
| `Backend/app/infrastructure/database/models/role_permission.py` | ORM model (junction) | CRUD | `Backend/app/infrastructure/database/models/team.py:30-39` (TeamProjectModel) | exact |
| `Backend/app/infrastructure/database/repositories/permission_repo.py` | repo impl | CRUD | `Backend/app/infrastructure/database/repositories/milestone_repo.py` | exact |
| `Backend/app/infrastructure/database/repositories/role_permission_repo.py` | repo impl | junction CRUD | `Backend/app/infrastructure/database/repositories/milestone_repo.py` + `Backend/app/api/v1/admin_users.py:63-91` (closure pattern) | role-match |
| `Backend/app/infrastructure/database/repositories/role_repo.py` | repo impl | CRUD | `Backend/app/infrastructure/database/repositories/milestone_repo.py` | exact |
| `Backend/app/application/use_cases/create_role.py` | use case | request-response | `Backend/app/application/use_cases/manage_milestones.py::CreateMilestoneUseCase` | exact |
| `Backend/app/application/use_cases/update_role.py` | use case | request-response | `Backend/app/application/use_cases/manage_milestones.py::UpdateMilestoneUseCase` | exact |
| `Backend/app/application/use_cases/delete_role.py` (Member fallback) | use case (transaction) | request-response | `Backend/app/application/use_cases/change_user_role.py` (cross-aggregate User+Role) + `Backend/app/application/use_cases/manage_milestones.py::DeleteMilestoneUseCase` | role-match |
| `Backend/app/application/use_cases/list_permissions.py` | use case (read) | request-response | `Backend/app/application/use_cases/manage_milestones.py::ListMilestonesUseCase` | exact |
| `Backend/app/application/use_cases/get_permission_matrix.py` | use case (aggregate read) | request-response | `Backend/app/application/use_cases/get_global_audit.py` (DTO assembly) | role-match |
| `Backend/app/application/use_cases/update_permission_matrix.py` | use case (per-cell PATCH) | request-response | `Backend/app/application/use_cases/change_user_role.py` (audit emit + repo write) | role-match |
| `Backend/app/application/use_cases/list_roles.py` | use case (read) | request-response | `Backend/app/application/use_cases/manage_milestones.py::ListMilestonesUseCase` | exact |
| `Backend/app/application/dtos/role_dtos.py` | DTO | n/a | `Backend/app/application/dtos/admin_user_dtos.py` | exact |
| `Backend/app/application/dtos/permission_dtos.py` | DTO | n/a | `Backend/app/application/dtos/admin_user_dtos.py` | exact |
| `Backend/app/api/deps/auth.py` (extend with `_has_permission`, `require_permission`) | DI factory | n/a | `Backend/app/api/deps/auth.py:45-60, 75-104` | exact (extend file in place) |
| `Backend/app/api/deps/role.py` (NEW) | DI factory | n/a | `Backend/app/api/deps/milestone.py` | exact |
| `Backend/app/api/v1/admin_roles.py` | router (CRUD) | request-response | `Backend/app/api/v1/admin_users.py` | exact |
| `Backend/app/api/v1/admin_permissions.py` | router (list + matrix) | request-response | `Backend/app/api/v1/admin_audit.py` | exact |
| `Backend/alembic/versions/007_phase15_rbac.py` | migration (DDL + seed) | DDL | `Backend/alembic/versions/006_phase14_admin_panel.py` + `Backend/alembic/versions/005_phase9_schema.py:43-97` (helpers) | exact |
| `Backend/tests/conftest.py` (APPEND `permitted_client` + `pytest_collection_modifyitems`) | fixture | n/a | `Backend/tests/conftest.py:131-178` (`authenticated_client`) | exact (extend file in place) |
| `Backend/app/api/v1/projects.py:211-222` (TIDY-03) | exception handler | request-response | `Backend/app/api/v1/projects.py:211-222` (existing) | exact (extend in place — add `ValueError` to except tuple) |

### Frontend2 (Next.js 16 + React 19 + TanStack v5)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `Frontend2/services/admin-rbac-service.ts` | service | request-response | `Frontend2/services/admin-user-service.ts` | exact |
| `Frontend2/hooks/use-roles.ts` | hook (useQuery) | request-response | `Frontend2/hooks/use-admin-users.ts` | exact |
| `Frontend2/hooks/use-permissions.ts` | hook (useQuery) | request-response | `Frontend2/hooks/use-admin-users.ts` | exact |
| `Frontend2/hooks/use-permission-matrix.ts` | hook (useQuery) | request-response | `Frontend2/hooks/use-admin-users.ts` | exact |
| `Frontend2/hooks/use-create-role.ts` | hook (useMutation) | request-response | `Frontend2/hooks/use-change-role.ts` | exact |
| `Frontend2/hooks/use-update-role.ts` | hook (useMutation) | request-response | `Frontend2/hooks/use-change-role.ts` | exact |
| `Frontend2/hooks/use-delete-role.ts` | hook (useMutation) | request-response | `Frontend2/hooks/use-change-role.ts` | exact |
| `Frontend2/hooks/use-update-permission-cell.ts` | hook (optimistic mutation) | request-response | `Frontend2/hooks/use-approve-join-request.ts` | exact |
| `Frontend2/components/auth/require-permission.tsx` | guard component | n/a (render) | `Frontend2/components/shell/avatar-dropdown.tsx:327-339` (`{isAdmin && ...}` conditional render) + `Frontend2/hooks/use-transition-authority.ts` (hook composition) | role-match |
| `Frontend2/components/admin/roles/role-create-modal.tsx` | modal | request-response | `Frontend2/components/admin/users/add-user-modal.tsx` | exact |
| `Frontend2/components/admin/roles/role-edit-modal.tsx` | modal | request-response | `Frontend2/components/admin/users/add-user-modal.tsx` | exact |
| `Frontend2/components/admin/roles/role-delete-confirm.tsx` | confirm dialog | n/a | `Frontend2/components/projects/confirm-dialog.tsx` (`tone="danger"`) | exact |
| `Frontend2/components/admin/roles/new-role-modal-trigger.tsx` (rename) | trigger card | n/a | `Frontend2/components/admin/roles/new-role-placeholder-card.tsx` (current; rename + add onClick) | exact |
| `Frontend2/components/admin/roles/role-icon-picker.tsx` | inline picker | n/a | NO close analog — closest non-perfect: lucide-icon array usage in `Frontend2/components/shell/avatar-dropdown.tsx:40-48` | partial |
| `Frontend2/components/admin/roles/role-color-swatch.tsx` | inline swatch | n/a | NO close analog — closest non-perfect: oklch token usage in `Frontend2/app/(shell)/admin/roles/page.tsx:172-174` (color-mix) | partial |
| `Frontend2/components/admin/permissions/permission-scope-badge.tsx` | badge primitive consumer | n/a | `Frontend2/components/shell/avatar-dropdown.tsx:277-281` (Badge tone="neutral" inline) + `Frontend2/components/admin/roles/role-card.tsx:101-104` (warning Badge example) | exact |
| `Frontend2/lib/admin/role-validation.ts` | validation helper | n/a | `Frontend2/components/admin/users/add-user-modal.tsx:35` (EMAIL_RE) — NO existing module-level validation lib; this is NEW pattern | partial |
| `Frontend2/context/auth-context.tsx` (extend `permissions[]` + `hasPermission`) | context provider | n/a | `Frontend2/context/auth-context.tsx:1-80` (current shape) | exact (extend file in place) |
| `Frontend2/lib/audit-event-mapper.ts` (5 new rbac.* members) | type union + mapper | n/a | `Frontend2/lib/audit-event-mapper.ts:30-95` (Phase 14 14-10 added 13 members; Phase 15 adds 5 more) | exact (extend file in place) |
| `Frontend2/components/activity/activity-row.tsx` (5 new render branches) | render branch additions | n/a | Phase 14 14-10 patterns (existing render branches) | exact (extend file in place) |
| `Frontend2/lib/activity/event-meta.ts` (verb formatter) | label dictionary | n/a | Existing verb labels (extend file) | exact |
| `Frontend2/components/shell/avatar-dropdown.tsx:73` (admin-link gate migrate) | conditional render | n/a | `Frontend2/components/shell/avatar-dropdown.tsx:69-73, 327-339` (current `isAdmin` branch) | exact (modify in place) |
| `Frontend2/vitest.setup.ts` → actually `Frontend2/test/setup.ts` (TIDY-04 ReactFlowProvider mock) | test setup | n/a | `Frontend2/components/workflow-editor/editor-page.test.tsx:83-111` (current vi.mock — needs `ReactFlowProvider` + `useReactFlow` additions) | exact (extend in place) |
| `Frontend2/e2e/admin-rbac-*.spec.ts` (5 specs) | E2E test | request-response | `Frontend2/e2e/*.spec.ts` (existing skip-guarded patterns per Phase 11 D-50) | role-match |

---

## Pattern Assignments

### 1. Domain Layer Patterns

#### `Backend/app/domain/entities/permission.py` (entity, n/a)

**Analog:** `Backend/app/domain/entities/role.py` (verbatim shape — copy file, rename class, add fields)

**Full file (lines 1-9):**
```python
from pydantic import BaseModel, ConfigDict
from typing import Optional

class Role(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
```

**What to copy:** Pydantic BaseModel + ConfigDict(from_attributes=True) idiom; Optional[int] for id; str for name. Naming convention is PascalCase class, snake_case file (CONVENTIONS.md).

**What to vary for `Permission`:**
- Class: `Permission`
- Fields: `id: Optional[int]`, `key: str` (e.g., `"task.create"`), `label_tr: Optional[str]`, `label_en: Optional[str]`, `scope: Literal["system", "project"]` (D-3.5)
- Add `from typing import Literal`
- DO NOT add `description` (use `label_tr`/`label_en` for i18n labels)

**What to vary for `RolePermission` (junction entity):**
- Class: `RolePermission`
- Fields: `role_id: int`, `permission_id: int` (no autoincrement id — composite PK per junction convention; mirrors `TeamMemberModel` shape at `team.py:19-27`)

#### `Backend/app/domain/repositories/permission_repository.py` (ABC, CRUD)

**Analog:** `Backend/app/domain/repositories/milestone_repository.py` (verbatim ABC pattern — copy structure, rename methods)

**Full file (lines 1-29):**
```python
"""BACK-04: IMilestoneRepository abstract interface."""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.milestone import Milestone


class IMilestoneRepository(ABC):
    @abstractmethod
    async def create(self, milestone: Milestone) -> Milestone: ...

    @abstractmethod
    async def get_by_id(self, milestone_id: int) -> Optional[Milestone]: ...

    @abstractmethod
    async def list_by_project(self, project_id: int) -> List[Milestone]: ...

    @abstractmethod
    async def list_by_phase(self, project_id: int, phase_id: str) -> List[Milestone]:
        """D-38: GIN-indexed JSONB containment query on linked_phase_ids."""
        ...

    @abstractmethod
    async def update(self, milestone: Milestone) -> Milestone: ...

    @abstractmethod
    async def delete(self, milestone_id: int) -> bool:
        """Soft-delete: sets is_deleted=True + deleted_at. Returns True on success."""
        ...
```

**What to copy:** `ABC` + `@abstractmethod` per method; `async def` everywhere; `Optional[Entity]` returns; ellipsis (`...`) bodies; `from app.domain.entities.X import X` import shape; class name `I<Name>Repository`.

**What to vary for `IPermissionRepository`:**
- `list_by_scope(scope: str) -> List[Permission]` (instead of `list_by_phase`)
- `get_by_key(key: str) -> Optional[Permission]` (extra method — rare lookup)
- `create_many(perms: List[Permission])` (seed support — bulk insert; analog: see `Backend/app/application/use_cases/bulk_invite_user.py` for bulk semantics, but the ABC method itself is just a list-arg variant)
- NO soft-delete (perm rows are bounded 26 — hard delete acceptable per Discretion)

**What to vary for `IRolePermissionRepository` (junction):**
- `get_matrix() -> List[dict]` (or `List[RolePermission]`) — full flat list for matrix UI
- `set_cell(role_id: int, permission_id: int, granted: bool)` — per-cell upsert/delete
- `list_by_role(role_id: int) -> List[Permission]` — used in JWT claim composition during login (returns permissions by joining)
- `delete_by_role(role_id: int) -> int` — used in DeleteRoleUseCase Member fallback (cascades junction rows; returns row count)

**What to vary for `IRoleRepository` (CRITICAL — Pitfall 12 in RESEARCH):**
- `create(role: Role) -> Role`, `get_by_id(role_id: int) -> Optional[Role]`, `get_by_name(name: str) -> Optional[Role]`, `list_all() -> List[Role]`, `update(role: Role) -> Role`, `delete(role_id: int) -> bool`
- Phase 14 14-01 used a duck-typed `update_role` callable (`Backend/app/application/use_cases/change_user_role.py:24-29`); Plan 15-04 creates the proper ABC and Plan 15-05 migrates `change_user_role.py` to consume `IRoleRepository`.

#### `Backend/app/domain/exceptions.py` (extend in place)

**Analog:** `Backend/app/domain/exceptions.py:14-30` (`ProjectAccessDeniedError`) + `:56-67` (`LabelNameAlreadyExistsError`) + `:130-152` (`WorkflowValidationError`)

**Existing exception with attribute pattern (lines 19-30):**
```python
class ProjectAccessDeniedError(DomainError):
    """Raised when a user tries to mutate a project they do not own and are not admin for.

    Router maps to HTTP 403 so the client can distinguish genuine missing rows
    from permission denials (previously both surfaced as 404).
    """
    def __init__(self, project_id: int):
        self.project_id = project_id
        super().__init__(
            f"You do not have permission to modify project {project_id}. "
            "Only the project manager or an admin can perform this action."
        )
```

**What to copy:** Subclass `DomainError`; docstring describes router HTTP mapping; `__init__` takes typed args, stores them as attributes (so router can `e.attr_name` for structured response), calls `super().__init__(message)`.

**What to vary — NEW exceptions to add:**
```python
class RoleNotFoundError(DomainError):
    """Raised when role lookup by id/name fails. Router maps to 404."""
    def __init__(self, role_ref):  # Union[int, str]
        self.role_ref = role_ref
        super().__init__(f"Role '{role_ref}' not found")


class SystemRoleProtectedError(DomainError):
    """D-2.3 — Raised on PATCH/DELETE of a system role (Admin/PM/Member/Guest).
    Router maps to 422 with error_code SYSTEM_ROLE_PROTECTED."""
    def __init__(self, role_id: int, role_name: str):
        self.role_id = role_id
        self.role_name = role_name
        super().__init__(f"System role '{role_name}' (id={role_id}) cannot be modified or deleted")


class RoleNameInvalidError(DomainError):
    """D-2.6 — Raised when role name violates length / regex / reserved-name rules.
    Router maps to 422 with error_code ROLE_NAME_INVALID."""
    def __init__(self, name: str, reason: str):
        self.name = name
        self.reason = reason
        super().__init__(f"Role name '{name}' invalid: {reason}")


class PermissionDeniedError(DomainError):
    """D-1.11 — Raised by use cases that detect missing perms inside execute()
    (e.g., bulk-action dynamic check D-1.16). Router maps to 403 with error_code
    PERMISSION_DENIED + missing_permission attribute."""
    def __init__(self, missing_permission: str):
        self.missing_permission = missing_permission
        super().__init__(f"Permission '{missing_permission}' required")
```

Place at end of file (after `JoinRequestInvalidStateError` at line 211). Do NOT inherit from `ValueError` (only `InvalidMethodologyError` does that, line 170, for a specific reason).

---

### 2. ORM Model Patterns

#### `Backend/app/infrastructure/database/models/permission.py` (model, CRUD)

**Analog:** `Backend/app/infrastructure/database/models/role.py` (simple shape) + `Backend/app/infrastructure/database/models/team.py:9-17` (TimestampedMixin + Mapped/mapped_column modern syntax)

**Existing role model — full file (lines 1-13):**
```python
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.infrastructure.database.models.base import Base

class RoleModel(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String, nullable=True)

    users = relationship("UserModel", back_populates="role")
```

**Modern pattern (preferred for new files) — `team.py:9-17`:**
```python
class TeamModel(Base, TimestampedMixin):
    __tablename__ = "teams"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    leader_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
```

**What to copy:** `Mapped[T]` + `mapped_column(...)` syntax (modern SQLAlchemy 2.x); `Base` inheritance; `__tablename__`; `Optional[T]` for nullable cols; `index=True` for FK columns.

**What to vary for `PermissionModel` (`permission.py`):**
- `__tablename__ = "permissions"`
- `id: Mapped[int] = mapped_column(Integer, primary_key=True)`
- `key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)`
- `label_tr: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)`
- `label_en: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)`
- `scope: Mapped[str] = mapped_column(String(16), nullable=False, server_default="project")` (D-3.5; per RESEARCH Pattern 4 alternative — VARCHAR + CHECK constraint, NOT native ENUM)
- Add CHECK constraint via `__table_args__ = (CheckConstraint("scope IN ('system', 'project')", name="ck_permissions_scope"),)`

#### `Backend/app/infrastructure/database/models/role_permission.py` (junction model)

**Analog:** `Backend/app/infrastructure/database/models/team.py:30-39` (TeamProjectModel — junction with composite PK + CASCADE)

**Full junction model (lines 30-39):**
```python
class TeamProjectModel(Base):
    __tablename__ = "team_projects"
    team_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True
    )
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
```

**What to copy:** Composite PK via two `primary_key=True` columns; `ondelete="CASCADE"` on both FKs; timestamp default `func.now()`; no separate `id` column.

**What to vary for `RolePermissionModel`:**
- `__tablename__ = "role_permissions"`
- `role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)`
- `permission_id: Mapped[int] = mapped_column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)`
- `granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())` (audit-friendly)
- NO `granted: bool` column — presence of row = granted; absence = denied (D-Discretion: "hard-delete on revoke")

#### `Backend/app/infrastructure/database/models/role.py` (extend in place)

**Existing file (full, lines 1-13)** is shown above. Plan 15-04 ALTERs the `roles` table via migration AND extends the ORM model. Add three columns:
```python
is_system_role = Column(Boolean, nullable=False, server_default="false", index=True)  # D-2.3
icon_key = Column(String(32), nullable=True)        # D-2.8 — NULLABLE; system roles have fixed values
color_token = Column(String(64), nullable=True)     # D-2.8 — e.g., "--priority-critical"
```

Keep the existing `users = relationship(...)` line below the new columns. Optional: add `permissions = relationship("PermissionModel", secondary="role_permissions", ...)` for ORM-level convenience (not required if the repo uses explicit JOIN queries).

---

### 3. Repository Implementation Patterns

#### `Backend/app/infrastructure/database/repositories/permission_repo.py` (impl, CRUD)

**Analog:** `Backend/app/infrastructure/database/repositories/milestone_repo.py` (verbatim shape — copy file, rename class, drop soft-delete)

**Full file (lines 1-86) — annotated key passages:**

**Imports + constructor (lines 1-14):**
```python
"""BACK-04 / D-38: SqlAlchemy impl of IMilestoneRepository with GIN-backed JSONB queries."""
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.milestone import Milestone
from app.domain.repositories.milestone_repository import IMilestoneRepository
from app.infrastructure.database.models.milestone import MilestoneModel


class SqlAlchemyMilestoneRepository(IMilestoneRepository):
    def __init__(self, session: AsyncSession):
        self.session = session
```

**Mapper helpers (lines 16-23):**
```python
    def _to_entity(self, model: MilestoneModel) -> Milestone:
        return Milestone.model_validate(model)

    def _to_model(self, entity: Milestone) -> MilestoneModel:
        # D-24: dedupe linked_phase_ids on write, preserve order
        entity.linked_phase_ids = list(dict.fromkeys(entity.linked_phase_ids))
        data = entity.model_dump(exclude={"id", "created_at", "updated_at"})
        return MilestoneModel(**data)
```

**Create + get_by_id (lines 28-41):**
```python
    async def create(self, milestone: Milestone) -> Milestone:
        model = self._to_model(milestone)
        self.session.add(model)
        await self.session.flush()
        refreshed = await self.get_by_id(model.id)
        if refreshed is None:
            raise RuntimeError(f"Milestone {model.id} disappeared after flush")
        return refreshed

    async def get_by_id(self, milestone_id: int) -> Optional[Milestone]:
        stmt = self._base_query().where(MilestoneModel.id == milestone_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None
```

**What to copy:** Class name `SqlAlchemy<X>Repository(I<X>Repository)`; `__init__(self, session: AsyncSession)`; `_to_entity` / `_to_model` private helpers; `Entity.model_validate(model)` for ORM→entity; `entity.model_dump(exclude={"id", "created_at", "updated_at"})` for entity→ORM; `await session.flush()` then `await get_by_id(model.id)` for the create-and-refresh pattern; `scalar_one_or_none()` for nullable get.

**What to vary for `SqlAlchemyPermissionRepository`:**
- DROP `_base_query` filter (no soft-delete column)
- DROP `delete` method (Discretion: hard delete; rely on session.delete())
- ADD `get_by_key(self, key: str)`: `select(PermissionModel).where(PermissionModel.key == key)`
- ADD `list_by_scope(self, scope: str)`: `select(...).where(scope == scope)`
- ADD `create_many(self, perms: List[Permission])` for migration seed (loop session.add)

**What to vary for `SqlAlchemyRolePermissionRepository` (junction):**
- NO mapper helpers — use raw `RolePermissionModel(role_id=..., permission_id=...)` since the entity is bare
- `set_cell(role_id, permission_id, granted)`: if granted, `INSERT ... ON CONFLICT DO NOTHING`; if not granted, `DELETE WHERE role_id=... AND permission_id=...`
- `delete_by_role(role_id: int)`: bulk DELETE used by `DeleteRoleUseCase` for Member fallback

**Cross-aggregate update closure pattern (for `change_user_role.py` Plan 15-05 migrate)** — analog `Backend/app/api/v1/admin_users.py:63-91`:
```python
def _make_role_id_resolver(session: AsyncSession):
    async def resolve(role_name: str) -> Optional[int]:
        stmt = select(RoleModel).where(RoleModel.name.ilike(role_name))
        result = await session.execute(stmt)
        row = result.scalar_one_or_none()
        return row.id if row else None
    return resolve


def _make_update_role(session: AsyncSession):
    async def upd(user_id: int, role_id: Optional[int]) -> None:
        await session.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(role_id=role_id)
        )
        await session.commit()
    return upd
```

Plan 15-05 D-1.17 deletes both these closures (callers consume `IRoleRepository.get_by_id` directly + `IUserRepository.update_role`).

---

### 4. Use Case Patterns

#### `Backend/app/application/use_cases/create_role.py`, `update_role.py`, `delete_role.py`

**Analog:** `Backend/app/application/use_cases/manage_milestones.py` (CreateMilestoneUseCase / UpdateMilestoneUseCase / DeleteMilestoneUseCase — exact same shape)

**Create use case template (lines 71-106 from manage_milestones.py):**
```python
class CreateMilestoneUseCase:
    def __init__(
        self,
        milestone_repo: IMilestoneRepository,
        project_repo: IProjectRepository,
        audit_repo: Optional[IAuditRepository] = None,
    ):
        self.milestone_repo = milestone_repo
        self.project_repo = project_repo
        self.audit_repo = audit_repo

    async def execute(self, dto: MilestoneCreateDTO, user_id: int) -> MilestoneResponseDTO:
        await _validate_phase_ids_against_workflow(
            dto.linked_phase_ids, dto.project_id, self.project_repo
        )
        milestone = Milestone(
            project_id=dto.project_id,
            name=dto.name,
            description=dto.description,
            target_date=dto.target_date,
            status=dto.status,
            linked_phase_ids=dto.linked_phase_ids,
        )
        created = await self.milestone_repo.create(milestone)
        # Plan 14-09 D-D2: enriched audit metadata on create.
        if self.audit_repo is not None:
            metadata = await _build_milestone_audit_metadata(created, self.project_repo)
            await self.audit_repo.create_with_metadata(
                entity_type="milestone",
                entity_id=created.id or 0,
                action="created",
                user_id=user_id,
                metadata=metadata,
                field_name="milestone",
            )
        return MilestoneResponseDTO.model_validate(created)
```

**What to copy:** `__init__` accepts repos as ABC-typed args; `execute(dto, user_id)` signature; entity construction from DTO fields; create-then-audit ordering; `audit_repo.create_with_metadata(entity_type=..., entity_id=..., action=..., user_id=user_id, metadata=...)`; return DTO via `Response.model_validate(created)`.

**What to vary for `CreateRoleUseCase`:**
- Inject `IRoleRepository` (NEW in Plan 15-04) + `IAuditRepository`
- DTO: `RoleCreateDTO` (name, description, icon_key, color_token)
- Validate name (length 1-50, regex Latin/TR + reserved name check) — raise `RoleNameInvalidError` (D-2.6)
- Set `is_system_role=False` (custom role default)
- Audit: `entity_type="role"`, `action="created"`, `metadata={"role_id": created.id, "role_name": created.name}` → semantic event `rbac.role_created` (D-1.9)

**What to vary for `UpdateRoleUseCase`:**
- Inject `IRoleRepository` + `IAuditRepository`
- DTO: `RoleUpdateDTO` (Optional fields — name, description, icon_key, color_token; uses `model_dump(exclude_unset=True)` per `manage_milestones.py:135` pattern)
- Pre-check: load role; if `role.is_system_role`: raise `SystemRoleProtectedError(role.id, role.name)` (D-2.3)
- Audit: action="updated", metadata captures field deltas → semantic event `rbac.role_updated`

**`DeleteRoleUseCase` — CROSS-AGGREGATE TRANSACTION (D-2.2 Member fallback):**

**Analog 1 (audit + cross-aggregate write):** `Backend/app/application/use_cases/change_user_role.py:1-60` (full file shown above; injects user_repo, audit_repo, callable update_role)
**Analog 2 (transactional approach):** Use `IRolePermissionRepository.delete_by_role(role.id)` BEFORE `IUserRepository.bulk_update_role_id(deleted_role_id, member_role_id)` — both calls happen on the same `session` so they share the transaction. The session is committed by the API layer.

**Skeleton (NEW pattern — composite of two analogs):**
```python
class DeleteRoleUseCase:
    def __init__(
        self,
        role_repo: IRoleRepository,
        role_permission_repo: IRolePermissionRepository,
        user_repo: IUserRepository,
        audit_repo: IAuditRepository,
    ):
        self.role_repo = role_repo
        self.role_permission_repo = role_permission_repo
        self.user_repo = user_repo
        self.audit_repo = audit_repo

    async def execute(self, role_id: int, admin_id: int) -> None:
        role = await self.role_repo.get_by_id(role_id)
        if role is None:
            raise RoleNotFoundError(role_id)
        if role.is_system_role:
            raise SystemRoleProtectedError(role_id, role.name)

        # 1. Find Member role for fallback (D-2.2)
        member_role = await self.role_repo.get_by_name("Member")
        if member_role is None:
            raise RoleNotFoundError("Member")  # defensive

        # 2. Migrate users to Member (single transaction — session shared)
        affected_user_ids = await self.user_repo.bulk_update_role_id(
            from_role_id=role_id,
            to_role_id=member_role.id,
        )  # returns list of affected user IDs for audit

        # 3. Delete role_permissions junction rows
        await self.role_permission_repo.delete_by_role(role_id)

        # 4. Delete role
        await self.role_repo.delete(role_id)

        # 5. Audit — one rbac.role_deleted + one user.role_changed per affected user
        await self.audit_repo.create_with_metadata(
            entity_type="role",
            entity_id=role_id,
            action="deleted",
            user_id=admin_id,
            metadata={
                "role_id": role_id,
                "role_name": role.name,
                "affected_user_count": len(affected_user_ids),
                "fallback_role_id": member_role.id,
                "fallback_role_name": "Member",
            },
            field_name="role",
        )
        for uid in affected_user_ids:
            await self.audit_repo.create_with_metadata(
                entity_type="user",
                entity_id=uid,
                action="role_changed",
                user_id=admin_id,
                metadata={"source_role": role.name, "target_role": "Member", "cascade_from_delete_role_id": role_id},
            )
```

**Variation note:** `IUserRepository.bulk_update_role_id` is a NEW method on the existing user repository ABC — Plan 15-04 or 15-05 must add it. Analog: `Backend/app/api/v1/admin_users.py:83-91` `_make_update_role` (closure that does single-user UPDATE; bulk is the fan-out version).

#### `Backend/app/application/use_cases/list_permissions.py` / `list_roles.py`

**Analog:** `Backend/app/application/use_cases/manage_milestones.py::ListMilestonesUseCase` (lines 192-201)

**Existing pattern:**
```python
class ListMilestonesUseCase:
    def __init__(self, milestone_repo: IMilestoneRepository):
        self.milestone_repo = milestone_repo

    async def execute(self, project_id: int, phase_id: Optional[str] = None) -> List[MilestoneResponseDTO]:
        if phase_id is None:
            items = await self.milestone_repo.list_by_project(project_id)
        else:
            items = await self.milestone_repo.list_by_phase(project_id, phase_id)
        return [MilestoneResponseDTO.model_validate(m) for m in items]
```

**Variation:** Pure list use case — no audit, no transaction. `ListPermissionsUseCase.execute()` returns `List[PermissionResponseDTO]`; `ListRolesUseCase.execute()` returns `List[RoleResponseDTO]`. Filter args optional (e.g., `scope: Optional[str] = None`).

#### `Backend/app/application/use_cases/get_permission_matrix.py` / `update_permission_matrix.py`

**Analog 1 (aggregate read shape):** `Backend/app/application/use_cases/get_global_audit.py` — read aggregator that assembles a composite DTO from a single repo call.

**Analog 2 (per-cell write + audit):** `Backend/app/application/use_cases/change_user_role.py` (verbatim — single-row update + audit emit).

**Pattern for `UpdatePermissionMatrixUseCase` (per-cell PATCH D-1.12):**
```python
class UpdatePermissionMatrixUseCase:
    def __init__(
        self,
        role_repo: IRoleRepository,
        perm_repo: IPermissionRepository,
        role_perm_repo: IRolePermissionRepository,
        audit_repo: IAuditRepository,
    ):
        self.role_repo = role_repo
        self.perm_repo = perm_repo
        self.role_perm_repo = role_perm_repo
        self.audit_repo = audit_repo

    async def execute(self, role_id: int, perm_key: str, granted: bool, admin_id: int) -> None:
        # Pre-checks (defensive; use case authoritative beyond router-level checks)
        role = await self.role_repo.get_by_id(role_id)
        if role is None:
            raise RoleNotFoundError(role_id)
        # Optionally guard Admin super-role (matrix readonly per D-1.5/D-2.9):
        if role.name.lower() == "admin":
            raise SystemRoleProtectedError(role_id, role.name)
        perm = await self.perm_repo.get_by_key(perm_key)
        if perm is None:
            raise PermissionDeniedError(perm_key)  # or a more specific NotFound

        await self.role_perm_repo.set_cell(role_id, perm.id, granted)

        await self.audit_repo.create_with_metadata(
            entity_type="role",
            entity_id=role_id,
            action="permission_granted" if granted else "permission_revoked",
            user_id=admin_id,
            metadata={
                "role_id": role_id,
                "role_name": role.name,
                "perm_id": perm.id,
                "perm_key": perm_key,
                "granted": granted,
            },
            field_name="permissions",
        )
```

`GetPermissionMatrixUseCase` is the read counterpart — single repo call returning `MatrixResponseDTO` shaped as `{roles: [...], permissions: [...], cells: [{role_id, permission_id, granted}]}`.

---

### 5. DTO Patterns

#### `Backend/app/application/dtos/role_dtos.py`, `permission_dtos.py`

**Analog:** `Backend/app/application/dtos/admin_user_dtos.py` (Phase 14 Plan 14-01 — verbatim Pydantic v2 shape with field caps and i18n-ready)

**Imports + comment header (lines 1-13):**
```python
"""Phase 14 Plan 14-01 — Admin user-management DTOs (D-A6 / D-B2 / D-B4 / D-B7).

DIP — pure Pydantic; no infrastructure imports. Server-side caps via
`Field(max_length=...)` (Pydantic v2 replaced max_items with max_length for lists).
"""
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# D-A6 role enum — system-wide flat role (NOT per-project; per-project PM-ness
# is managed via Team.leader_id, Phase 9). RBAC integration deferred to v3.0.
AdminRole = Literal["Admin", "Project Manager", "Member"]
```

**Request DTO with validation (lines 16-23):**
```python
class InviteUserRequestDTO(BaseModel):
    email: EmailStr
    role: AdminRole
    name: Optional[str] = Field(default=None, max_length=100)
    team_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
```

**List + total response (lines 102-126):**
```python
class AdminUserListItemDTO(BaseModel):
    """Phase 14 Plan 14-03 — admin-scoped user list row."""
    id: int
    email: str
    full_name: str
    avatar: Optional[str] = None
    is_active: bool = True
    role: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AdminUserListResponseDTO(BaseModel):
    """{items, total} paged shape — Plan 14-03 frontend consumes this."""
    items: List[AdminUserListItemDTO]
    total: int

    model_config = ConfigDict(from_attributes=True)
```

**What to copy:** Module docstring with phase reference + DIP reminder; `BaseModel` + `ConfigDict(from_attributes=True)`; `Field(max_length=...)` on bounded strings; `Optional[T] = None` for optional; `List[T] = Field(default_factory=list, max_length=N)` for capped lists; Literal-typed enum aliases.

**What to vary for `role_dtos.py`:**
```python
ROLE_NAME_RE = r"^[A-Za-zÇĞİÖŞÜçğıöşü0-9 _-]+$"  # D-2.6 Latin + TR + numbers + space _ -
RESERVED_ROLE_NAMES = {"admin", "project manager", "member", "guest"}  # case-insensitive D-2.6


class RoleCreateDTO(BaseModel):
    name: str = Field(min_length=1, max_length=50, pattern=ROLE_NAME_RE)
    description: Optional[str] = Field(default=None, max_length=255)
    icon_key: Optional[str] = Field(default=None, max_length=32)        # D-2.8
    color_token: Optional[str] = Field(default=None, max_length=64)     # D-2.8

    model_config = ConfigDict(from_attributes=True)


class RoleUpdateDTO(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=50, pattern=ROLE_NAME_RE)
    description: Optional[str] = Field(default=None, max_length=255)
    icon_key: Optional[str] = Field(default=None, max_length=32)
    color_token: Optional[str] = Field(default=None, max_length=64)

    model_config = ConfigDict(from_attributes=True)


class RoleResponseDTO(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon_key: Optional[str] = None
    color_token: Optional[str] = None
    is_system_role: bool = False

    model_config = ConfigDict(from_attributes=True)


class RoleListResponseDTO(BaseModel):
    items: List[RoleResponseDTO]
    total: int

    model_config = ConfigDict(from_attributes=True)
```

**Reserved name validation goes in the use case** (`CreateRoleUseCase.execute`) — Pydantic regex covers character set; reserved-name check is business logic. Pattern: `if dto.name.strip().lower() in RESERVED_ROLE_NAMES: raise RoleNameInvalidError(dto.name, "reserved")`.

**What to vary for `permission_dtos.py`:**
```python
PermissionScope = Literal["system", "project"]


class PermissionResponseDTO(BaseModel):
    id: int
    key: str
    label_tr: Optional[str] = None
    label_en: Optional[str] = None
    scope: PermissionScope

    model_config = ConfigDict(from_attributes=True)


class MatrixCellDTO(BaseModel):
    role_id: int
    permission_id: int
    granted: bool


class PermissionMatrixResponseDTO(BaseModel):
    roles: List[RoleResponseDTO]
    permissions: List[PermissionResponseDTO]
    cells: List[MatrixCellDTO]

    model_config = ConfigDict(from_attributes=True)


class UpdateMatrixCellRequestDTO(BaseModel):
    role_id: int
    perm_key: str = Field(min_length=1, max_length=64)
    granted: bool

    model_config = ConfigDict(from_attributes=True)
```

---

### 6. FastAPI Depends Factory Pattern (`require_permission`)

**Analog:** `Backend/app/api/deps/auth.py:53-60` (`require_admin`) + `:75-104` (`require_project_transition_authority`)

**Existing `require_admin` (verbatim — full pattern to mirror):**
```python
def _is_admin(user: User) -> bool:
    """Return True when the user holds the admin role."""
    return (
        user.role is not None
        and user.role.name.lower() == "admin"
    )


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Raises HTTP 403 if the current user is not an admin."""
    if not _is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
```

**What to copy:** Function returns `User` so the endpoint can use it as both gate AND user accessor; raises `HTTPException(403)` on failure; helpers (`_is_admin`) split the boolean test for testability.

**NEW `require_permission` factory (Plan 15-06; goes in same `auth.py` file as extension)** — pattern from RESEARCH.md `## Architecture Patterns ### Pattern 2`:
```python
def _has_permission(user: User, key: str) -> bool:
    """D-1.5 + D-1.10. Admin super-role short-circuit, then JWT-claim lookup.

    Reads user.permissions which is JWT-derived in get_current_user — no DB hit.
    Defends against None via `user.permissions or []` per Pitfall 18.
    """
    if _is_admin(user):
        return True
    return key in (user.permissions or [])


def require_permission(key: str):
    """Returns a Depends-compatible callable that checks JWT permissions[].

    Usage:
        @router.post("/projects/{project_id}/milestones")
        async def create(
            ...,
            _perm: User = Depends(require_permission("milestone.create")),  # tier 1 (Phase 15)
            _auth: User = Depends(require_project_transition_authority),    # tier 2 (Phase 9 D-15)
        ):
            ...
    """
    async def _checker(current_user: User = Depends(get_current_user)) -> User:
        if not _has_permission(current_user, key):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "PERMISSION_DENIED",
                    "missing_permission": key,
                    "message": f"Bu işlem için {key} yetkisi gerekir",
                },
            )
        return current_user
    return _checker
```

**Append to `__all__` (line 63 + line 107):**
```python
__all__ = __all__ + ["_has_permission", "require_permission"]  # type: ignore
```

**Critical:** `User` entity must carry `permissions: list[str] = []` field; `get_current_user` reads `payload.get("permissions", [])` from decoded JWT and assigns it to the User instance before returning. This is a 2-line change in `auth.py:22-42` `get_current_user` — see Pitfall 18 in RESEARCH.

#### `Backend/app/api/deps/role.py` (NEW DI factory file)

**Analog:** `Backend/app/api/deps/milestone.py` (FULL FILE shown earlier — verbatim shape):
```python
"""Milestone DI per D-31 / BACK-07 — populated by plan 09-05."""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database.database import get_db_session
from app.domain.repositories.milestone_repository import IMilestoneRepository
from app.infrastructure.database.repositories.milestone_repo import SqlAlchemyMilestoneRepository


def get_milestone_repo(session: AsyncSession = Depends(get_db_session)) -> IMilestoneRepository:
    return SqlAlchemyMilestoneRepository(session)


__all__ = ["get_milestone_repo"]
```

**What to copy:** docstring with phase reference; one-line import per repo / impl pair; factory takes `session: AsyncSession = Depends(get_db_session)` and returns the ABC type; `__all__` lists the factories.

**What to vary for `role.py`:**
```python
"""Phase 15 RBAC DI factories (Plan 15-04)."""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database.database import get_db_session

from app.domain.repositories.role_repository import IRoleRepository
from app.domain.repositories.permission_repository import IPermissionRepository
from app.domain.repositories.role_permission_repository import IRolePermissionRepository
from app.infrastructure.database.repositories.role_repo import SqlAlchemyRoleRepository
from app.infrastructure.database.repositories.permission_repo import SqlAlchemyPermissionRepository
from app.infrastructure.database.repositories.role_permission_repo import SqlAlchemyRolePermissionRepository


def get_role_repo(session: AsyncSession = Depends(get_db_session)) -> IRoleRepository:
    return SqlAlchemyRoleRepository(session)


def get_permission_repo(session: AsyncSession = Depends(get_db_session)) -> IPermissionRepository:
    return SqlAlchemyPermissionRepository(session)


def get_role_permission_repo(session: AsyncSession = Depends(get_db_session)) -> IRolePermissionRepository:
    return SqlAlchemyRolePermissionRepository(session)


__all__ = ["get_role_repo", "get_permission_repo", "get_role_permission_repo"]
```

---

### 7. Migration Patterns

#### `Backend/alembic/versions/007_phase15_rbac.py`

**Analog 1 (most recent, simplest CREATE TABLE):** `Backend/alembic/versions/006_phase14_admin_panel.py` (full file shown earlier — `project_join_requests` table, idempotent helpers, structured FK definition).

**Analog 2 (idempotent helper bank):** `Backend/alembic/versions/005_phase9_schema.py:43-97` (full helpers — `_table_exists`, `_column_exists`, `_enum_value_exists`, `_index_exists`).

**Idempotent helpers (lines 30-58 from 006_phase14_admin_panel.py — copy verbatim):**
```python
# ---------------------------------------------------------------------------
# Idempotent helpers — copied verbatim from 005_phase9_schema.py lines 43-97.
# DO NOT regenerate — these are battle-tested across phases 1-9.
# ---------------------------------------------------------------------------

def _table_exists(table_name: str) -> bool:
    """Check if a table already exists (PostgreSQL)."""
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
    """Check if an index already exists in the public schema (PostgreSQL)."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM pg_indexes "
            "WHERE schemaname='public' AND indexname=:n"
        ),
        {"n": index_name},
    )
    return result.scalar() > 0
```

**Add `_column_exists` from 005_phase9_schema.py:56-66** (verbatim) — needed for the `roles` table ALTER:
```python
def _column_exists(table_name: str, column_name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
        ),
        {"t": table_name, "c": column_name},
    )
    return result.scalar() > 0
```

**CREATE TABLE pattern (verbatim from 006_phase14_admin_panel.py:65-115 — `project_join_requests`):**
```python
def upgrade() -> None:
    if not _table_exists("project_join_requests"):
        op.create_table(
            "project_join_requests",
            sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
            sa.Column(
                "project_id",
                sa.Integer,
                sa.ForeignKey("projects.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "status",
                sa.String(20),
                nullable=False,
                server_default="pending",
            ),
            sa.Column("note", sa.Text, nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
    if not _index_exists("ix_project_join_requests_status_created"):
        op.create_index(
            "ix_project_join_requests_status_created",
            "project_join_requests",
            ["status", sa.text("created_at DESC")],
        )
```

**What to copy:** revision identifiers (`revision = "007_phase15_rbac"`, `down_revision = "006_phase14_admin_panel"`); `if not _table_exists(...)` guard around `op.create_table`; explicit `sa.Column(...)` per column with `nullable=False/True`; `server_default=...` for default values; `sa.func.now()` for timestamps; `ondelete="CASCADE"` on FKs; index creation in separate `if not _index_exists` block.

**Phase 15 D-3.5 ENUM/CHECK alternative (RESEARCH Pattern 4 + Pitfall 1 — recommendation: VARCHAR + CHECK, NOT native ENUM):**

Per RESEARCH Pitfall 1 + Phase 9 `projects.status` precedent (`005_phase9_schema.py:161-170`), use `String(16) + server_default + CHECK constraint` instead of PostgreSQL ENUM. This avoids the AUTOCOMMIT trap.

```python
# In upgrade() — after CREATE TABLE permissions:
if not _column_exists("permissions", "scope"):
    op.add_column(
        "permissions",
        sa.Column("scope", sa.String(16), nullable=False, server_default="project"),
    )
# CHECK constraint (idempotent via CREATE-IF-NOT-EXISTS pattern via CheckConstraint name)
op.execute("""
    DO $$ BEGIN
        ALTER TABLE permissions ADD CONSTRAINT ck_permissions_scope CHECK (scope IN ('system', 'project'));
    EXCEPTION
        WHEN duplicate_object THEN null;
        WHEN duplicate_table THEN null;
    END $$;
""")
```

**ALTER existing roles table (idempotent — `is_system_role`, `icon_key`, `color_token`):**
```python
if not _column_exists("roles", "is_system_role"):
    op.add_column("roles", sa.Column("is_system_role", sa.Boolean, nullable=False, server_default="false"))
if not _column_exists("roles", "icon_key"):
    op.add_column("roles", sa.Column("icon_key", sa.String(32), nullable=True))
if not _column_exists("roles", "color_token"):
    op.add_column("roles", sa.Column("color_token", sa.String(64), nullable=True))

# Flip is_system_role for the 3 existing system roles + INSERT Guest if absent.
op.execute("""
    UPDATE roles SET is_system_role = true
    WHERE LOWER(name) IN ('admin', 'project manager', 'member')
""")
op.execute("""
    INSERT INTO roles (name, description, is_system_role)
    SELECT 'Guest', 'Read-only system role for stakeholders', true
    WHERE NOT EXISTS (SELECT 1 FROM roles WHERE LOWER(name) = 'guest')
""")
```

**Seed pattern (idempotent INSERT — bulk perms + matrix bootstrap):**
```python
# 26 perms — INSERT ... ON CONFLICT DO NOTHING via WHERE NOT EXISTS
PERMISSIONS_SEED = [
    # 14 from permissions-static.ts (rename to dot.notation per D-1.2)
    ("project.create", "Proje oluştur", "Create project", "project"),
    ("project.edit", "Proje düzenle", "Edit project", "project"),
    # ... (all 14)
    # 12 NEW admin.* perms
    ("admin.access", "Yönetim Paneli erişimi", "Admin Panel access", "system"),
    ("admin.users.invite", "Kullanıcı davet et", "Invite user", "system"),
    # ... (all 12 admin.*)
]
for key, label_tr, label_en, scope in PERMISSIONS_SEED:
    op.execute(sa.text("""
        INSERT INTO permissions (key, label_tr, label_en, scope)
        SELECT :key, :label_tr, :label_en, :scope
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE key = :key)
    """).bindparams(key=key, label_tr=label_tr, label_en=label_en, scope=scope))
```

**downgrade() symmetry** — see `006_phase14_admin_panel.py:128-133` for the verbatim "drop index then table both wrapped in IF EXISTS" pattern.

---

### 8. Test Fixture Extension Pattern

#### `Backend/tests/conftest.py` (APPEND `permitted_client` + `pytest_collection_modifyitems`)

**Analog (full `authenticated_client` lines 121-178):** Already shown earlier in the investigation. Append `permitted_client` AFTER line 178 (top-level conftest, NOT integration/conftest, per CONTEXT D-Discretion).

**Existing `_make_test_jwt` helper (lines 121-128):**
```python
def _make_test_jwt(email: str) -> str:
    """Generate a JWT for a test user email using the real app secret/algorithm."""
    payload = {"sub": email}
    return _jose_jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
```

**Plan 15-04 step 1 — extend the helper with optional `permissions` arg (NOT a new function):**
```python
def _make_test_jwt(email: str, permissions: list[str] | None = None) -> str:
    """Generate a JWT for a test user email using the real app secret/algorithm.

    Phase 15 — accepts optional permissions[] claim (sorted alphabetically per Pitfall 14
    for deterministic test assertions).
    """
    payload: dict = {"sub": email}
    if permissions is not None:
        payload["permissions"] = sorted(permissions)
    return _jose_jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
```

**Plan 15-04 step 2 — append `permitted_client` fixture (after line 178, end of file):**

Pattern verbatim from RESEARCH `## Architecture Patterns ### Pattern 5 permitted_client Fixture Composition` (already concrete code there). Trim to fit conftest:
```python
@pytest_asyncio.fixture
async def permitted_client(db_session):
    """Phase 15 D-1.15 — like authenticated_client but with explicit JWT
    permissions[] claim. No DB seed of role_permissions required (claim-only
    lookup per D-1.10).

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
        stmt = select(RoleModel).where(RoleModel.name.ilike(role))
        role_row = (await db_session.execute(stmt)).scalar_one_or_none()
        if role_row is None:
            role_row = (await db_session.execute(select(RoleModel).limit(1))).scalar_one()
        user = UserModel(
            email=f"permclient+{abs(hash(tuple(sorted(perms))))}@testexample.com",
            full_name="Test PermClient",
            password_hash="$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfa",
            is_active=True,
            role_id=role_row.id,
        )
        db_session.add(user)
        await db_session.flush()
        token = _make_test_jwt(user.email, permissions=perms)
        app.dependency_overrides[get_db_session] = lambda: db_session
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", follow_redirects=True) as client:
            client.headers["Authorization"] = f"Bearer {token}"
            yield client
        app.dependency_overrides.clear()

    return _builder
```

**Critical:** mirror the EXACT pattern of `authenticated_client` (closure factory returning an async context manager). Do NOT introduce `mock.patch`, do NOT seed role_permissions in DB — `_has_permission` reads from JWT only (D-1.10).

#### `pytest_collection_modifyitems` (TIDY-05, Plan 15-02)

**Analog:** No existing `pytest_collection_modifyitems` in this codebase — first instance. Pattern is verbatim from RESEARCH `## Architecture Patterns ### Pattern 7`.

**Where to put it:** Same `Backend/tests/conftest.py`, after the `permitted_client` fixture (or before it — top-level placement is arbitrary, both fixtures and hooks coexist at module scope).

**Pattern** (RESEARCH already gives the full code; copy verbatim):
```python
def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "requires_db: marks tests as requiring a live Postgres connection",
    )

def pytest_collection_modifyitems(config, items):
    """Skip @pytest.mark.requires_db tests when the DB is unreachable."""
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy.exc import OperationalError
    from app.infrastructure.config import settings
    import sqlalchemy as sa

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

**Marker application across ~40 integration test files (Plan 15-02 Task 5+):** Add `pytestmark = pytest.mark.requires_db` at module top (line ~1-5, after imports). Granular `@pytest.mark.requires_db` per-function is rejected per D-4.4.

---

### 9. Pydantic v2 ValidationError → 422 Pattern (TIDY-03)

#### `Backend/app/api/v1/projects.py:211-222` (extend in place)

**Existing pattern (full block — already correct for ValidationError, missing ValueError handling per Pitfall 4):**
```python
    try:
        use_case = UpdateProjectUseCase(project_repo, sprint_repo)
        project = await use_case.execute(project_id, dto, current_user.id, is_admin=_is_admin(current_user))
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ProjectAccessDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        # Phase 12 Plan 12-10 (Bug X + Bug Y UAT fix) — surface WorkflowConfig
        # Pydantic validation failures as 422 (not 500).
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.errors(),
        )
```

**TIDY-03 fix — extend the except tuple per RESEARCH Pitfall 4 + CONTEXT D-4.3:**
```python
    except (ValidationError, ValueError) as e:
        # Phase 12 Plan 12-10 (Bug X + Bug Y) + Phase 15 TIDY-03 (deferred-items.md
        # line 50: ValueError raised inside Pydantic custom validators — 'n1' regex
        # fail bubbled as 500 instead of 422). e.errors() exists on ValidationError;
        # for ValueError fall back to {error_code, message} envelope (Phase 9 D-09 taxonomy).
        if isinstance(e, ValidationError):
            detail = e.errors()
        else:
            detail = {"error_code": "INVALID_WORKFLOW_CONFIG", "message": str(e)}
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )
```

**Verification:** `Backend/tests/integration/api/test_project_workflow_patch.py:69-93` (3 tests: legacy_n1_id / zero_initial / zero_final) ALL pass after this edit per RESEARCH validation table.

---

### 10. TanStack Query Hook Patterns

#### `Frontend2/hooks/use-roles.ts`, `use-permissions.ts`, `use-permission-matrix.ts` (useQuery)

**Analog:** `Frontend2/hooks/use-admin-users.ts` (full file, lines 1-39 already shown earlier).

**Existing pattern (verbatim — copy structure, swap service call):**
```typescript
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import {
  adminUserService,
  type AdminUserListFilter,
} from "@/services/admin-user-service"

export function useAdminUsers(filter: AdminUserListFilter = {}) {
  return useQuery({
    queryKey: ["admin", "users", filter],
    queryFn: () => adminUserService.list(filter),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,  // v5 syntax — Plan 14-18 N-4
  })
}
```

**What to copy:** Named export; `useQuery({...})`; `queryKey: [...]` array starting with stable namespace prefix `["admin", ...]`; `staleTime: 30 * 1000` (or 60s for matrix); v5 `placeholderData: keepPreviousData` (NAMED IMPORT — v4 `keepPreviousData: true` syntax silently no-ops on v5).

**What to vary for Phase 15:**
- `useRoles()` → queryKey `["admin", "roles"]`, queryFn `adminRbacService.listRoles()`, staleTime 60s
- `usePermissions()` → queryKey `["admin", "permissions"]`, queryFn `adminRbacService.listPermissions()`, staleTime 5 min (perms rarely change)
- `usePermissionMatrix()` → queryKey `["admin", "permissions", "matrix"]`, queryFn `adminRbacService.getMatrix()`, staleTime 60s

#### `Frontend2/hooks/use-update-permission-cell.ts` (optimistic mutation D-1.12)

**Analog:** `Frontend2/hooks/use-approve-join-request.ts` (full file, lines 1-64 already shown — RBAC v5 optimistic pattern verbatim).

**Existing pattern (the full optimistic flow — copy and adapt cache shape):**
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adminJoinRequestService, type PendingJoinRequest } from "@/services/admin-join-request-service"
import { useToast } from "@/components/toast"

interface PendingCacheShape {
  items: PendingJoinRequest[]
  total: number
}

const PENDING_QUERY_KEY = ["admin", "join-requests", "pending", { limit: 5 }]

export function useApproveJoinRequest() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: adminJoinRequestService.approve,
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: ["admin", "join-requests", "pending"] })
      const snapshot = qc.getQueryData<PendingCacheShape>(PENDING_QUERY_KEY)
      if (snapshot) {
        qc.setQueryData<PendingCacheShape>(PENDING_QUERY_KEY, {
          items: snapshot.items.filter((r) => r.id !== id),
          total: Math.max(0, snapshot.total - 1),
        })
      }
      return { snapshot }
    },
    onError: (err: any, _id, ctx) => {
      if (ctx?.snapshot) {
        qc.setQueryData(PENDING_QUERY_KEY, ctx.snapshot)
      }
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "Onaylama başarısız"
      showToast({ variant: "error", message: msg })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "join-requests"] })
    },
    onSuccess: () => {
      showToast({ variant: "success", message: "Talep onaylandı" })
    },
  })
}
```

**What to copy (v5 idiom):** `useMutation({mutationFn, onMutate, onError, onSettled, onSuccess})` lifecycle ordering; `await qc.cancelQueries(...)` before `getQueryData` snapshot; return `{snapshot}` from `onMutate` so it's accessible in `onError` as `ctx`; `qc.setQueryData(...)` to apply optimistic update; revert via `qc.setQueryData(KEY, ctx.snapshot)`; `qc.invalidateQueries(...)` in `onSettled` for eventual sync; toast variant strings: `'success' | 'error' | 'warning' | 'info'` (NOT `'tone'`).

**What to vary for `useUpdatePermissionCell`:**
- `mutationFn: ({ roleId, permKey, granted }) => adminRbacService.updateCell(roleId, permKey, granted)`
- `onMutate` cache shape: `MatrixData = { roles, permissions, cells: MatrixCell[] }` — modify `cells` array (find index by `(role_id, permission_id)` and update `granted` flag, or push/remove based on `granted`)
- queryKey: `["admin", "permissions", "matrix"]`
- Success toast: TR/EN — "Yetki güncellendi" / "Permission updated"
- Error toast: "Yetki güncellenemedi" / "Failed to update"

**i18n note:** Match the language pattern from `use-approve-join-request.ts`. Some hooks use plain strings (TR-only); RESEARCH `## Pattern 3` example uses `useApp` for i18n. Pick one approach; recommend i18n via `useApp` for new hooks (Discretion — consistency with Phase 13/14).

#### `Frontend2/hooks/use-create-role.ts`, `use-update-role.ts`, `use-delete-role.ts` (regular mutation)

**Analog:** `Frontend2/hooks/use-change-role.ts` (full file, lines 1-33 already shown — Phase 14 14-01 simple-mutation pattern):
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adminUserService, type AdminRole } from "@/services/admin-user-service"
import { useToast } from "@/components/toast"

export function useChangeRole() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: AdminRole }) =>
      adminUserService.changeRole(userId, role),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onSuccess: () => {
      showToast({ variant: "success", message: "Rol güncellendi" })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "Rol güncellenemedi"
      showToast({ variant: "error", message: msg })
    },
  })
}
```

**What to vary:** Service method (e.g., `adminRbacService.createRole`); queryKey to invalidate (`["admin", "roles"]`); success/error message TR/EN. Skip the `onMutate`/snapshot ceremony — these are not optimistic (D-1.12 ONLY for matrix toggle).

---

### 11. Service Layer Patterns

#### `Frontend2/services/admin-rbac-service.ts`

**Analog:** `Frontend2/services/admin-user-service.ts` (full file, lines 1-141 already shown).

**Existing pattern (key sections):**

**Imports + types (lines 1-72):**
```typescript
import { apiClient } from "@/lib/api-client"

export type AdminRole = "Admin" | "Project Manager" | "Member"

export interface InviteUserRequest {
  email: string
  role: AdminRole
  name?: string
  team_id?: number
}

export interface AdminUserListFilter {
  role?: AdminRole
  status?: "active" | "inactive"
  q?: string
  limit?: number
  offset?: number
}
```

**Service object (lines 78-141):**
```typescript
export const adminUserService = {
  invite: async (req: InviteUserRequest): Promise<InviteUserResponse> => {
    const resp = await apiClient.post<InviteUserResponse>("/admin/users", req)
    return resp.data
  },

  changeRole: async (userId: number, role: AdminRole): Promise<void> => {
    await apiClient.patch(`/admin/users/${userId}/role`, { role })
  },

  list: async (filter?: AdminUserListFilter) => {
    const resp = await apiClient.get("/admin/users", { params: filter })
    return resp.data
  },

  exportCsv: (filter?: AdminUserListFilter): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
    const params = new URLSearchParams()
    // ...
    return `${baseUrl}/admin/users.csv${qs ? "?" + qs : ""}`
  },
}
```

**What to copy:** `import { apiClient } from "@/lib/api-client"`; named TS interfaces for request/response shapes (preferred over inline types); module-scope `export const adminXService = { method: async (args) => apiClient.<verb>(...) }` shape; `resp.data` unwrapping; URL paths use `/admin/...` (the apiClient prepends `/api/v1`).

**What to vary for `admin-rbac-service.ts`:**
```typescript
import { apiClient } from "@/lib/api-client"

export interface Role {
  id: number
  name: string
  description?: string | null
  icon_key?: string | null
  color_token?: string | null
  is_system_role: boolean
}

export interface Permission {
  id: number
  key: string
  label_tr?: string | null
  label_en?: string | null
  scope: "system" | "project"
}

export interface MatrixCell {
  role_id: number
  permission_id: number
  granted: boolean
}

export interface PermissionMatrix {
  roles: Role[]
  permissions: Permission[]
  cells: MatrixCell[]
}

export interface RoleCreateRequest {
  name: string
  description?: string
  icon_key?: string
  color_token?: string
}

export interface RoleUpdateRequest extends Partial<RoleCreateRequest> {}

export const adminRbacService = {
  listRoles: async (): Promise<{ items: Role[]; total: number }> => {
    const r = await apiClient.get("/admin/roles")
    return r.data
  },

  createRole: async (req: RoleCreateRequest): Promise<Role> => {
    const r = await apiClient.post<Role>("/admin/roles", req)
    return r.data
  },

  updateRole: async (id: number, req: RoleUpdateRequest): Promise<Role> => {
    const r = await apiClient.patch<Role>(`/admin/roles/${id}`, req)
    return r.data
  },

  deleteRole: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/roles/${id}`)
  },

  listPermissions: async (): Promise<Permission[]> => {
    const r = await apiClient.get<Permission[]>("/admin/permissions")
    return r.data
  },

  getMatrix: async (): Promise<PermissionMatrix> => {
    const r = await apiClient.get<PermissionMatrix>("/admin/permissions/matrix")
    return r.data
  },

  updateCell: async (
    roleId: number,
    permKey: string,
    granted: boolean,
  ): Promise<void> => {
    await apiClient.patch(`/admin/permissions/matrix`, {
      role_id: roleId,
      perm_key: permKey,
      granted,
    })
  },
}
```

---

### 12. AuthContext Extension Pattern

#### `Frontend2/context/auth-context.tsx` (extend in place — `permissions[]` + `hasPermission`)

**Analog:** `Frontend2/context/auth-context.tsx:1-80` (current file, full source already shown).

**Extension points (line numbers from current file):**

**1. AuthContextType interface (lines 6-12):** Add 2 fields:
```typescript
interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  permissions: string[]                          // Phase 15 D-1.7
  hasPermission: (key: string) => boolean        // Phase 15 D-1.7
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}
```

**2. AuthProvider state + JWT decode (lines 22-25):** Add a `permissions` state derived from the JWT:
```typescript
const [user, setUser] = React.useState<AuthUser | null>(null)
const [token, setToken] = React.useState<string | null>(null)
const [isLoading, setIsLoading] = React.useState(true)
const [permissions, setPermissions] = React.useState<string[]>([])  // NEW Phase 15
```

**3. JWT decode helper (NEW helper at module top — outside the component):**
```typescript
function decodePermissions(token: string | null): string[] {
  if (!token) return []
  try {
    // base64url-decode the payload (no signature verification client-side)
    const payload = JSON.parse(atob(token.split(".")[1]))
    const perms = payload.permissions
    return Array.isArray(perms) ? perms.filter((p: unknown): p is string => typeof p === "string") : []
  } catch {
    return []
  }
}
```

**4. Hydrate on mount (line 28-42 — extend the useEffect):**
```typescript
React.useEffect(() => {
  const stored = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null
  if (stored) {
    setToken(stored)
    setPermissions(decodePermissions(stored))   // NEW
    authService.getCurrentUser()
      .then(setUser)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  } else {
    setIsLoading(false)
  }
}, [])
```

**5. Login handler (lines 44-52 — extend):**
```typescript
const login = React.useCallback(async (email: string, password: string) => {
  const resp = await authService.login({ email, password })
  localStorage.setItem(AUTH_TOKEN_KEY, resp.access_token)
  document.cookie = `auth_session=1; path=/; SameSite=Lax`
  setToken(resp.access_token)
  setPermissions(decodePermissions(resp.access_token))   // NEW
  const me = await authService.getCurrentUser()
  setUser(me)
}, [])
```

**6. Logout (line 54-68 — append `setPermissions([])`):**
```typescript
const logout = React.useCallback(() => {
  // ... existing localStorage/sessionStorage cleanup ...
  setUser(null)
  setToken(null)
  setPermissions([])   // NEW
}, [])
```

**7. hasPermission helper + value (lines 70-73 — extend):**
```typescript
const hasPermission = React.useCallback(
  (key: string) => {
    // D-1.5 Admin super-role short-circuit (mirror backend _is_admin)
    const roleName = (user as { role?: { name?: string } } | null)?.role?.name?.toLowerCase()
    if (roleName === "admin") return true
    return permissions.includes(key)
  },
  [user, permissions],
)

const value = React.useMemo(
  () => ({ user, token, isLoading, permissions, hasPermission, login, logout }),
  [user, token, isLoading, permissions, hasPermission, login, logout],
)
```

**Backwards compat (Pitfall 9):** `decodePermissions(null)` returns `[]`; pre-Phase-15 JWTs without `permissions` claim also yield `[]`. Combined with the Admin role-name short-circuit, existing Admin users keep full access; non-Admin users with stale tokens lose mutation perms for ≤30 min until next login.

---

### 13. AvatarDropdown Gate Migrate Pattern

#### `Frontend2/components/shell/avatar-dropdown.tsx:69-73, 327-339` (modify in place)

**Existing role-name gate (lines 69-73):**
```typescript
const roleName =
  (typeof (user as { role?: unknown })?.role === "string"
    ? ((user as unknown as { role: string }).role)
    : (user as unknown as { role?: { name?: string } } | null)?.role?.name) || ""
const isAdmin = roleName.toLowerCase() === "admin"
```

**Existing conditional render (lines 327-339):**
```typescript
{/* Yönetim Paneli — admin only (D-D2) */}
{isAdmin && (
  <button
    type="button"
    role="menuitem"
    tabIndex={open ? 0 : -1}
    className="hover-row"
    style={menuItemStyle}
    onClick={handleNav("/admin")}
  >
    <Shield size={13} />
    {T("Yönetim Paneli", "Admin Panel")}
  </button>
)}
```

**Plan 15-11 D-2.11 migrate — backwards-compat (`canAccessAdmin`):**
```typescript
// Replace `isAdmin` derivation with a perm-aware variant.
// Phase 15 D-2.11 — perm-based gate `_has_permission(user, 'admin.access')`
// supersedes the role-name check. Fallback to role-name preserves the
// admin-link visibility for stale JWTs without `permissions[]` claim
// (Pitfall 9 backwards-compat: existing Admin users with old tokens see
// the link via _is_admin short-circuit in hasPermission).
const { hasPermission } = useAuth()  // already imports useAuth at line 51
const canAccessAdmin = hasPermission("admin.access")

// Then, replace `{isAdmin && (` at line 328 with:
{canAccessAdmin && (
  <button ...>
    {/* unchanged button body */}
  </button>
)}
```

**Plan 14-11 contract regression test (`avatar-dropdown.test.tsx` Test 14)** — must update in same commit per `Cross-File Dependency Rules` (line 425 of CONTEXT.md):
- Old assertion: mock user with `role: { name: "Admin" }` → "Yönetim Paneli" visible.
- NEW assertion: mock useAuth to return `{ permissions: ["admin.access"], user: {...} }` → "Yönetim Paneli" visible. Mock without `admin.access` → "Yönetim Paneli" hidden.

**Critical preserve:** lines 75-148 (3 dismiss effects: mousedown click-outside, Escape, pathname change) UNCHANGED. Those are Phase 13 D-D7/D-D8 contracts. Only the role gate logic changes.

---

### 14. RequirePermission Guard (NEW component)

#### `Frontend2/components/auth/require-permission.tsx`

**Analog 1 (conditional render):** `Frontend2/components/shell/avatar-dropdown.tsx:327-339` (`{isAdmin && (...)}`)
**Analog 2 (hook composition):** `Frontend2/hooks/use-transition-authority.ts` (full file, 46 lines — uses `useAuth` + boolean composition)

**Pattern (NEW — composes existing patterns):**
```typescript
"use client"

// Phase 15 D-1.7 — UI hide guard for permission-gated children.
//
// Server-side `Depends(require_permission)` is the authoritative defense
// (cross-file rule line 417 in CONTEXT.md). This client guard is a UX hide
// only — tampering bypasses it but the backend rejects the eventual API call.

import * as React from "react"
import { useAuth } from "@/context/auth-context"

interface RequirePermissionProps {
  perm: string
  children: React.ReactNode
  fallback?: React.ReactNode    // optional placeholder; defaults to null (hide)
}

export function RequirePermission({ perm, children, fallback = null }: RequirePermissionProps) {
  const { hasPermission, isLoading } = useAuth()
  if (isLoading) return null     // avoid flicker while AuthContext hydrates
  return hasPermission(perm) ? <>{children}</> : <>{fallback}</>
}
```

**Why `"use client"`:** uses React hooks. Per `Frontend2/AGENTS.md`: "Read the relevant guide in `node_modules/next/dist/docs/` before writing code" — interactive guards need client directive. Per CONTEXT D-Discretion: "hook + early return" preferred over HOC/render-prop.

**Test pattern** — analog `Frontend2/components/admin/users/add-user-modal.test.tsx` for how to mock `useAuth`. Test cases (per VALIDATION.md row RBAC-06):
1. Renders children when `hasPermission` returns true.
2. Renders nothing (or `fallback` if provided) when false.
3. Renders nothing while `isLoading` is true (no flicker).

---

### 15. Modal Patterns (Role CRUD)

#### `Frontend2/components/admin/roles/role-create-modal.tsx`, `role-edit-modal.tsx`

**Analog:** `Frontend2/components/admin/users/add-user-modal.tsx` (full file 1-235 already shown) — exact shape for: `"use client"` directive; `Modal/ModalHeader/ModalBody/ModalFooter` primitive composition; form state via `React.useState`; `useEffect` reset on open; pattern-mirror validation (regex client-side); inline error messages with `role="alert"`; submit handler that calls the mutation hook with `onSuccess: () => onClose()`.

**Existing structure (lines 37-83, 220-232):**
```typescript
export function AddUserModal({ open, onClose }: AddUserModalProps) {
  const { language } = useApp()
  const lang: "tr" | "en" = language === "en" ? "en" : "tr"
  const inviteUser = useInviteUser()

  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<AdminRole>("Member")
  // ...

  React.useEffect(() => {
    if (open) {
      setEmail("")
      setRole("Member")
      // reset on open
    }
  }, [open])

  const handleSubmit = () => {
    setSubmitted(true)
    if (!formValid) return
    inviteUser.mutate(
      { email: emailTrim, role, name: name.trim() || undefined },
      { onSuccess: () => { onClose() } },
    )
  }

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <ModalHeader>{adminUsersT("admin.users.modal_add_title", lang)}</ModalHeader>
      <ModalBody>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
          {/* fields */}
        </form>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>İptal</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!formValid || inviteUser.isPending}>
          Kaydet
        </Button>
      </ModalFooter>
    </Modal>
  )
}
```

**What to copy:** `"use client"`; `{ open, onClose }` props; reset state via `useEffect(..., [open])`; submit handler with `onSuccess: () => onClose()`; ModalFooter with two buttons (ghost İptal + primary submit); `disabled={!formValid || mutation.isPending}`.

**What to vary for `RoleCreateModal`:**
- Fields: `name` (text, validation via `Frontend2/lib/admin/role-validation.ts` — see §17 below), `description` (textarea optional), `icon_key` (use new `<RoleIconPicker/>` primitive — see §16), `color_token` (use new `<RoleColorSwatch/>` primitive — see §16).
- Submit: `useCreateRole().mutate({ name, description, icon_key, color_token }, { onSuccess: onClose })`.
- Width: 480 (verbatim from add-user-modal — D-A2 quality bar consistency).

**What to vary for `RoleEditModal`:**
- Same fields; pre-fill from the role being edited.
- **System role guard (D-2.3):** if `role.is_system_role`, render the modal in disabled mode (all inputs disabled + AlertBanner "Sistem rolleri düzenlenemez"). Closer pattern: `Frontend2/components/admin/roles/role-card.tsx:84-91` `disabled` prop with `cursor: "not-allowed"` + `opacity: 0.6`.

#### `Frontend2/components/admin/roles/role-delete-confirm.tsx`

**Analog:** `Frontend2/components/projects/confirm-dialog.tsx` (full file 1-80 already shown — Phase 14 14-01 added `tone` prop; D-2.2 wants `tone="danger"`).

**Existing API:**
```typescript
interface ConfirmDialogProps {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: "primary" | "danger" | "warning"
  onConfirm: () => void
  onCancel: () => void
}
```

**What to vary for `RoleDeleteConfirm`:**
- Wrap `<ConfirmDialog>` (don't reinvent) with `tone="danger"`.
- Body text composes the affected user count (D-2.2): `"Bu rolü silmek {N} kullanıcıyı Member rolüne taşıyacak. Devam?"` — accept `affectedUserCount` prop and substitute via i18n string template.
- Title: `"Rolü Sil"` / `"Delete Role"`.
- Confirm label: `"Sil"` / `"Delete"`.
- Wire `onConfirm` to `useDeleteRole().mutate(roleId, { onSuccess: onCancel })` (closes the dialog after success).

---

### 16. Role Icon Picker + Color Swatch (NEW primitives — partial analogs)

#### `Frontend2/components/admin/roles/role-icon-picker.tsx` (NEW — no exact analog)

**Closest analog 1:** `Frontend2/components/shell/avatar-dropdown.tsx:40-48` (lucide-react icon import block — 8 named imports):
```typescript
import {
  LogOut, Settings, Shield, Globe, ChevronRight, Check, User,
} from "lucide-react"
```

**Closest analog 2 (selection-state-aware button grid):** `Frontend2/components/admin/users/add-user-modal.tsx:159-178` (the `<select>` dropdown for role — explicit options pattern). Picker is a CSS Grid version of the same idea but with icon buttons.

**Structural delta — the planner must specify (no perfect analog exists in codebase):**
1. **8 lucide-react icons array (D-2.8):**
   ```typescript
   import { User, Briefcase, ShieldCheck, Star, Eye, Settings, Globe, Award } from "lucide-react"
   const ICONS = [
     { key: "user", Icon: User },
     { key: "briefcase", Icon: Briefcase },
     { key: "shield-check", Icon: ShieldCheck },
     { key: "star", Icon: Star },
     { key: "eye", Icon: Eye },
     { key: "settings", Icon: Settings },
     { key: "globe", Icon: Globe },
     { key: "award", Icon: Award },
   ] as const
   ```
2. **Props:** `{ value: string | null; onChange: (key: string) => void }`.
3. **Layout:** CSS Grid 4 columns × 2 rows; each cell is a button with `aria-pressed={value === key}`; selected button gets a token-driven border (e.g., `boxShadow: "inset 0 0 0 2px var(--accent)"`).
4. **Button:** size 32×32 px (consistent with avatar-dropdown trigger 28 px + a touch larger for tap target); icon centered at 18 px.
5. **A11y:** `role="radiogroup"`; each button `role="radio"` + `aria-checked={value === key}` + `aria-label={icon.key}`.

#### `Frontend2/components/admin/roles/role-color-swatch.tsx` (NEW — no exact analog)

**Closest analog:** `Frontend2/app/(shell)/admin/roles/page.tsx:170-178` (RoleCard with token-based icon background `color-mix(in oklch, var(--priority-critical) 18%, transparent)`):
```typescript
<RoleCard
  id="admin"
  icon={<ShieldCheck size={16} aria-hidden="true" />}
  iconBgColor="color-mix(in oklch, var(--priority-critical) 18%, transparent)"
  iconColor="var(--priority-critical)"
  ...
/>
```

**Structural delta:**
1. **6 oklch token preset (D-2.8 default; planner alternative allowed):**
   ```typescript
   const COLOR_TOKENS = [
     "--priority-critical",
     "--status-progress",
     "--fg-muted",
     "--info",
     "--warning",
     "--status-todo",
   ] as const
   ```
2. **Props:** `{ value: string | null; onChange: (token: string) => void }`.
3. **Layout:** 6 round chips (24-32 px), inline-flex with gap 8.
4. **Each chip:** `background: var(${token})`; selected chip gets a 2 px ring via `boxShadow: "0 0 0 2px var(--accent), 0 0 0 4px var(--accent-fg)"` for visibility against any swatch color.
5. **A11y:** `role="radiogroup"`; `aria-checked={value === token}`; `aria-label={token.replace("--", "")}`.

#### `Frontend2/components/admin/permissions/permission-scope-badge.tsx` (D-3.4)

**Analog:** `Frontend2/components/shell/avatar-dropdown.tsx:277-281` (Badge tone="neutral" inline) + `Frontend2/components/admin/roles/role-card.tsx:101-104` (Badge tone="warning" inline).

**Existing usages:**
```typescript
{roleName && (
  <Badge size="xs" tone={roleTone}>
    {roleName}
  </Badge>
)}
```
```typescript
<Badge tone="warning" size="xs">
  {adminRbacT("admin.roles.v3_badge_label", language)}
</Badge>
```

**Pattern (NEW — thin wrapper around Badge primitive):**
```typescript
"use client"

import { Badge } from "@/components/primitives"
import { useApp } from "@/context/app-context"
import { adminRbacT } from "@/lib/i18n/admin-rbac-keys"

interface PermissionScopeBadgeProps {
  scope: "system" | "project"
}

export function PermissionScopeBadge({ scope }: PermissionScopeBadgeProps) {
  const { language } = useApp()
  const label = scope === "system"
    ? adminRbacT("admin.permissions.scope_system", language)  // (sistem) / (system)
    : adminRbacT("admin.permissions.scope_project", language) // (proje) / (project)
  return (
    <Badge size="xs" tone="neutral">
      {label}
    </Badge>
  )
}
```

**Per Discretion:** "tone='neutral' inline (consistent with Phase 14 D-D2 metadata badges)" — don't reinvent badge tones.

---

### 17. Role Validation Library (NEW partial)

#### `Frontend2/lib/admin/role-validation.ts` (D-2.6)

**Closest analog:** `Frontend2/components/admin/users/add-user-modal.tsx:35` (single `EMAIL_RE` regex) + `Backend/app/application/dtos/admin_user_dtos.py:13` (Pydantic Literal). NO existing client-side validation library exists; this is a NEW pattern.

**Structural delta — single source of truth must mirror backend Pydantic regex per CONTEXT D-2.6:**
```typescript
// Phase 15 D-2.6 — role-name client-side validator. Mirror of the backend
// Pydantic regex at Backend/app/application/dtos/role_dtos.py — single source
// of truth on the wire (Pitfall 5 csv-parse.ts pattern). Belt-and-suspenders
// here for snappy UX.

export const ROLE_NAME_RE = /^[A-Za-zÇĞİÖŞÜçğıöşü0-9 _-]+$/
export const ROLE_NAME_MIN = 1
export const ROLE_NAME_MAX = 50
export const RESERVED_ROLE_NAMES = ["admin", "project manager", "member", "guest"] as const

export type RoleNameValidation =
  | { ok: true }
  | { ok: false; reason: "empty" | "too_long" | "invalid_chars" | "reserved" }

export function validateRoleName(name: string): RoleNameValidation {
  const trimmed = name.trim()
  if (trimmed.length < ROLE_NAME_MIN) return { ok: false, reason: "empty" }
  if (trimmed.length > ROLE_NAME_MAX) return { ok: false, reason: "too_long" }
  if (!ROLE_NAME_RE.test(trimmed)) return { ok: false, reason: "invalid_chars" }
  if ((RESERVED_ROLE_NAMES as readonly string[]).includes(trimmed.toLowerCase())) return { ok: false, reason: "reserved" }
  return { ok: true }
}
```

**Test (`role-validation.test.ts`):** Plain unit test — no React, no DOM. Cases: empty / too-long (51 chars) / invalid chars (`@`) / reserved (`Admin`) / Latin (`Tasarımcı`) / TR (`Müşteri`) / valid mixed case → `{ok:true}`.

---

### 18. vitest mock extension (TIDY-04)

#### `Frontend2/test/setup.ts` OR per-test `vi.mock` (Plan 15-01)

**Per CONTEXT D-4.1 + RESEARCH Pattern 6 + Pitfall 3:** the actual config setup file is `Frontend2/test/setup.ts` (per `vitest.config.ts:14`) — NOT `vitest.setup.ts` (which doesn't exist).

**Existing test/setup.ts (lines 1-58 already shown):** localStorage + sessionStorage shims. Add `@xyflow/react` global mock here OR per-test in failing files. Recommendation per RESEARCH: per-test mock extension (avoids breaking tests that DO want real Provider).

**Existing per-test mock at `Frontend2/components/workflow-editor/editor-page.test.tsx:83-111` (verbatim):**
```typescript
vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children, onNodesChange, onNodeDragStart, onNodeDrag, onNodeDragStop }) => {
    capturedHandlers.onNodesChange = onNodesChange
    capturedHandlers.onNodeDragStart = onNodeDragStart
    capturedHandlers.onNodeDrag = onNodeDrag
    capturedHandlers.onNodeDragStop = onNodeDragStop
    return <div data-testid="reactflow">{children}</div>
  },
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

**TIDY-04 patch — add 2 missing keys (verbatim per RESEARCH Pattern 6):**
```typescript
vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children, ...handlers }) => {
    // ... existing capture logic ...
    return <div data-testid="reactflow">{children}</div>
  },
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="rf-provider">{children}</div>            // NEW — passes through
  ),
  useReactFlow: () => ({                                       // NEW — useReactFlow stub
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

**Affected files (per VALIDATION row TIDY-04):**
- `Frontend2/components/workflow-editor/editor-page.test.tsx` (16 tests)
- `Frontend2/components/workflow-editor/selection-panel.test.tsx` (Test 5)
- `Frontend2/components/workflow-editor/workflow-canvas.test.tsx` (2 readOnly tests)
- `Frontend2/components/workflow-editor/phase-edge.test.tsx` (Position type drift)
- `Frontend2/components/workflow-editor/use-transition-authority.test.tsx` (UseQueryResult v5 cast — see §19)
- `Frontend2/components/lifecycle/milestones-subtab.test.tsx` (spread-arg)
- `Frontend2/lib/api-client.test.ts` (TS error)

---

### 19. UseQueryResult v5 cast (`use-transition-authority.test.tsx`)

**Analog:** `Frontend2/hooks/use-transition-authority.ts` (full file lines 1-46 — uses `useLedTeams()` returning `{data: ledTeams}`). The test file mocks this hook; v5 changed `UseQueryResult` shape (removed `isIdle`; renamed `isLoading` → `isPending` for new queries).

**Fix (test fixture):** Cast to v5 shape. Replace any `isLoading: false` field on the mocked return with `isPending: false` (and add `isError: false, isSuccess: true, error: null` if exhaustive type satisfies). Reference: TanStack v5 `useQuery` docs.

---

### 20. SemanticEventType union extension pattern (Phase 14 14-10 precedent)

#### `Frontend2/lib/audit-event-mapper.ts:30-55` (extend in place)

**Existing union (lines 30-55 already shown — Phase 13 10 + Phase 14 13 = 23 members):**
```typescript
export type SemanticEventType =
  // Existing 10 (Phase 13 D-B1)
  | "task_created"
  // ... 9 more
  // NEW Phase 14 (D-D3) — 13 additions
  | "task_field_updated"
  // ... 12 more
```

**Plan 15-09 D-1.9 — add 5 rbac.* members (Phase 15 cross-cutting):**
```typescript
export type SemanticEventType =
  // ... existing 23 members ...
  // NEW Phase 15 (D-1.9) — 5 RBAC additions
  | "rbac.permission_granted"
  | "rbac.permission_revoked"
  | "rbac.role_created"
  | "rbac.role_updated"
  | "rbac.role_deleted"
```

**Plus: extend `mapAuditToSemantic` (lines 76-...):** add a new family branch before the catch-all `return null`:
```typescript
// Phase 15 D-1.9 — RBAC family
if (item.entity_type === "role") {
  if (item.action === "created") return "rbac.role_created"
  if (item.action === "updated") return "rbac.role_updated"
  if (item.action === "deleted") return "rbac.role_deleted"
  if (item.action === "permission_granted") return "rbac.permission_granted"
  if (item.action === "permission_revoked") return "rbac.permission_revoked"
}
```

**Plus: extend `semanticToFilterChip`** (Phase 14 added the `"admin"` chip — these 5 likely also map to `"admin"` since they're admin-only events):
```typescript
// Add to the if-chain that resolves chips:
if (semantic.startsWith("rbac.")) return "admin"
```

**Critical (Pitfall 19):** TS Literal-union exhaustiveness only fails when a `switch(x)` on `SemanticEventType` lacks a `default`. The existing if/else chain with `return "all"` fallback at the end is safe. Test file `audit-event-mapper.test.ts` extension: add 5 test cases per new event mapping to the `"admin"` chip + the 5 family branches in `mapAuditToSemantic`.

#### `Frontend2/components/activity/activity-row.tsx` (5 NEW render branches)

**Analog:** Existing render branches in `activity-row.tsx` for the 23 existing types (Phase 14 14-10 added 13 — same precedent). Each branch returns a JSX block with icon + label + actor + timestamp. Plan 15-09 adds 5 branches. Specific JSX shape MUST mirror Phase 14 14-10 admin-table variant render branches (filename open in editor; planner re-reads at plan time).

#### `Frontend2/lib/activity/event-meta.ts` (verb formatter labels)

**Analog:** Existing labels in this file. Plan 15-09 appends 5 entries:
- `rbac.role_created` → `"rol oluşturdu"` / `"created role"`
- `rbac.role_updated` → `"rolü güncelledi"` / `"updated role"`
- `rbac.role_deleted` → `"rolü sildi"` / `"deleted role"`
- `rbac.permission_granted` → `"yetki verdi"` / `"granted permission"`
- `rbac.permission_revoked` → `"yetki kaldırdı"` / `"revoked permission"`

---

### 21. Atomic 7-Layer Commit Invariant (D-2.7 / RBAC-07)

**Analog:** No prior atomic-removal commit in this codebase — this is the first time 7 layers must come down at once. The closest pattern is Phase 14 14-10 cross-cut audit-event-mapper extension (4 files in 1 commit) — Phase 15-10 is 7+4 files (7 prod + 4+ tests).

**Expectation per VALIDATION.md row "7-layer atomic deploy state":**
```
$ git diff HEAD~1 --stat   # after Plan 15-10 merge
 Frontend2/components/admin/permissions/permission-row.tsx          | XX +-
 Frontend2/components/admin/permissions/permission-matrix-card.tsx  | XX +-
 Frontend2/app/(shell)/admin/permissions/page.tsx                   | XX +-
 Frontend2/app/(shell)/admin/roles/page.tsx                         | XX +-
 Frontend2/components/admin/roles/role-card.tsx                     | XX +-
 Frontend2/components/admin/roles/new-role-modal-trigger.tsx        | XX +-  (renamed from new-role-placeholder-card.tsx)
 Frontend2/components/admin/permissions/permission-row.test.tsx     | XX +-
 Frontend2/components/admin/permissions/permission-matrix-card.test.tsx | XX +-
 Frontend2/components/admin/roles/role-card.test.tsx                | XX +-
 Frontend2/components/admin/roles/new-role-modal-trigger.test.tsx   | XX +-  (renamed)
```

**No "v3.0" string survives** in any of `permission-matrix-card.tsx` (line 107-109 Badge — REMOVE), `permission-row.tsx` (line 17-18 tooltip — REMOVE), `app/(shell)/admin/permissions/page.tsx` (AlertBanner content — FLIP), `app/(shell)/admin/roles/page.tsx` (line 134 AlertBanner content — FLIP), `role-card.tsx` (lines 93-105 v3 Badge — REMOVE on Guest).

**Verification command (manual):** `git grep -n "v3.0" Frontend2/components/admin/ Frontend2/app/(shell)/admin/` should return ZERO matches after Plan 15-10. CI would lint this if the planner adds a guard test (Plan 15-10 Task 8?).

---

## Shared Patterns

### Authentication / Authorization

**Source:** `Backend/app/api/deps/auth.py:45-60` (existing `_is_admin` + `require_admin`) — Plan 15-06 extends this file with `_has_permission` + `require_permission` factory.
**Apply to:** All Phase 15 mutation endpoints + all 14+ existing `require_admin` callsites (Plan 15-07 migrates them).
**Yan yana 2-tier (D-1.13):** mutation endpoints stack `require_permission(...)` + `get_project_member` / `require_project_transition_authority`:
```python
@router.post("/projects/{project_id}/milestones")
async def create_milestone(
    ...,
    _perm: User = Depends(require_permission("milestone.create")),       # tier 1 (Phase 15 NEW)
    _auth: User = Depends(require_project_transition_authority),         # tier 2 (Phase 9 D-15)
    repo: IMilestoneRepository = Depends(get_milestone_repo),
):
    ...
```

### Error Handling Taxonomy

**Source:** `Backend/app/domain/exceptions.py:14-30, 56-67, 130-152` (existing pattern) + Phase 9 D-09 error_code envelope.
**Apply to:** Every Phase 15 use case raising domain exceptions.
**Pattern:** `raise HTTPException(status_code=4xx, detail={"error_code": "<TAXONOMY_KEY>", "missing_permission": "...", "message": "..."})`. Match existing `PROJECT_ACCESS_DENIED`, `INVALID_METHODOLOGY`, etc.

### Audit Emission

**Source:** `Backend/app/application/use_cases/manage_milestones.py:96-105` (Phase 14 14-09 D-D2 enriched metadata pattern); `Backend/app/application/use_cases/change_user_role.py:48-59` (cross-aggregate audit from a use case).
**Apply to:** Every RBAC mutation use case (`CreateRoleUseCase`, `UpdateRoleUseCase`, `DeleteRoleUseCase`, `UpdatePermissionMatrixUseCase`).
**Pattern:** `await audit_repo.create_with_metadata(entity_type=..., entity_id=..., action=..., user_id=admin_id, metadata={...})`. metadata MUST include role_id, role_name, perm_key (when applicable), granted (when applicable). Phase 13 audit-event-mapper consumes via entity_type+action match.

### Optimistic Mutation (D-1.12 — matrix only)

**Source:** `Frontend2/hooks/use-approve-join-request.ts` (full file 1-64) — TanStack v5 `onMutate` / `onError` / `onSettled` lifecycle.
**Apply to:** ONLY `useUpdatePermissionCell` (Plan 15-09). Other RBAC mutations use the simpler `use-change-role.ts` shape (no snapshot/revert).

### Validation (Pydantic v2 ↔ TypeScript regex single source of truth)

**Source:** `Backend/app/application/dtos/admin_user_dtos.py:16-22` (server Pydantic) + `Frontend2/components/admin/users/add-user-modal.tsx:35` (client EMAIL_RE).
**Apply to:** Role name (D-2.6) — backend in `role_dtos.py::RoleCreateDTO.name` regex `Field(pattern=ROLE_NAME_RE)`; client in `Frontend2/lib/admin/role-validation.ts` (NEW). Pitfall 5 (csv-parse.ts pattern) — server Pydantic wins on the wire; client copy is a UX accelerator.

### Cross-Cutting Test Updates (Atomic Commit Discipline)

**Source:** Phase 14 14-10 (4-file cross-cutting); Phase 14 14-04 (7-layer placeholder defense set).
**Apply to:** Plan 15-10 (7 prod + ≥4 tests in single commit per CONTEXT D-2.7 / VALIDATION RBAC-07); Plan 15-09 (4-file SemanticEventType extension); Plan 15-11 (avatar-dropdown contract migration — also updates `avatar-dropdown.test.tsx` Test 14 in same commit per Cross-File Dependency Rule line 425).

---

## No Analog Found (Structural Deltas Required)

The following NEW files have NO close codebase analog. The planner must specify the structural shape:

| File | Role | Closest non-perfect analog | Structural delta planner must specify |
|------|------|---------------------------|---------------------------------------|
| `Frontend2/components/admin/roles/role-icon-picker.tsx` | inline picker | `Frontend2/components/shell/avatar-dropdown.tsx:40-48` (lucide-react import block) | 4×2 grid of 32 px buttons; 8 fixed lucide icons; `aria-pressed` on selected; `role="radiogroup"`; controlled `{value, onChange}` props |
| `Frontend2/components/admin/roles/role-color-swatch.tsx` | inline swatch | `Frontend2/app/(shell)/admin/roles/page.tsx:170-178` (color-mix token usage) | 6 round chips inline-flex; `background: var(--{token})`; selected ring via `boxShadow: 0 0 0 2px var(--accent)`; `role="radiogroup"`; controlled `{value, onChange}` props |
| `Frontend2/lib/admin/role-validation.ts` | validator lib | `Frontend2/components/admin/users/add-user-modal.tsx:35` (single EMAIL_RE) | NEW module-level pattern: exported regex constant + `validateRoleName(name) → {ok, reason}` discriminated union; reserved-name set + length bounds; mirror of backend Pydantic regex |
| `Backend/app/application/use_cases/delete_role.py` (Member fallback) | use case (multi-aggregate transaction) | `Backend/app/application/use_cases/change_user_role.py` (cross-aggregate write+audit) | NEW pattern: 4 repos injected (role + role_permission + user + audit); single `execute()` performs guard → bulk_update_role_id → delete junction → delete role → emit N+1 audit rows; Member-role-existence defensive check |
| `Backend/tests/conftest.py::pytest_collection_modifyitems` | pytest hook | NO existing hook — first instance | NEW pattern: `pytest_configure` to register marker + `pytest_collection_modifyitems` with `asyncio.run(probe())` DB connectivity check; copy verbatim from RESEARCH Pattern 7 |
| `Frontend2/e2e/admin-rbac-*.spec.ts` (5 specs) | E2E Playwright spec | Existing skip-guarded E2E specs (Phase 11 D-50 / Phase 13 13-10 / Phase 14 14-12) | Mirror existing skip-guard pattern; planner re-reads existing E2E for skip-guard wrapper; CONTEXT D-Discretion accepts skip-guarded for v2.0 |

---

## Metadata

**Analog search scope:**
- `Backend/app/domain/` (entities + repository ABCs + exceptions)
- `Backend/app/infrastructure/database/` (models + repositories)
- `Backend/app/application/` (use cases + DTOs)
- `Backend/app/api/v1/` (routers) + `Backend/app/api/deps/` (DI factories)
- `Backend/alembic/versions/` (migrations 001-006)
- `Backend/tests/conftest.py` (fixtures)
- `Frontend2/services/` (API service layer)
- `Frontend2/hooks/` (TanStack Query hooks)
- `Frontend2/components/` (admin/, shell/, projects/, workflow-editor/, auth/)
- `Frontend2/context/` (auth-context)
- `Frontend2/lib/` (audit-event-mapper, admin/, activity/)
- `Frontend2/test/setup.ts`
- `Frontend2/vitest.config.ts`

**Files scanned:** ~60 production + ~10 test infrastructure files
**Pattern extraction date:** 2026-04-29
**Phase dependencies referenced:** Phase 9 (deps split, audit, D-15), Phase 13 (audit-event-mapper, avatar-dropdown), Phase 14 (admin panel infra, 14-04 7-layer defense, 14-10 SemanticEventType extension, 14-01 fat-infra Wave 0)

## PATTERN MAPPING COMPLETE
