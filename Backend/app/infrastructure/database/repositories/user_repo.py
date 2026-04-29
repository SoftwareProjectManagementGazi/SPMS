from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, update
from sqlalchemy.orm import joinedload
from fastapi import HTTPException

from app.domain.entities.user import User
from app.domain.repositories.user_repository import IUserRepository
from app.infrastructure.database.models.user import UserModel
from app.infrastructure.database.models.role import RoleModel


class SqlAlchemyUserRepository(IUserRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: UserModel) -> User:
        return User.model_validate(model)

    def _to_model(self, entity: User) -> UserModel:
        # Phase 15 Plan 15-04 added User.permissions: list[str] = [] as a
        # JWT-claim-only field (Pitfall 18; NOT persisted to DB). Excluding
        # it here keeps SqlAlchemyUserRepository.create from passing an
        # invalid kwarg to UserModel (which has no `permissions` column).
        data = entity.model_dump(
            exclude={"id", "created_at", "updated_at", "role", "permissions"}
        )
        return UserModel(**data)

    def _get_base_query(self):
        """Return base select with is_deleted filter and eager-loaded role."""
        return (
            select(UserModel)
            .where(UserModel.is_deleted == False)
            .options(joinedload(UserModel.role))
        )

    async def create(self, user: User) -> User:
        model = self._to_model(user)
        self.session.add(model)
        await self.session.flush()
        return await self.get_by_id(model.id)  # type: ignore

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = self._get_base_query().where(UserModel.email == email)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_id(self, user_id: int) -> Optional[User]:
        stmt = self._get_base_query().where(UserModel.id == user_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_all(self) -> List[User]:
        stmt = self._get_base_query()
        result = await self.session.execute(stmt)
        # unique() prevents row duplication from joinedload on collections
        return [self._to_entity(m) for m in result.unique().scalars().all()]

    async def search_by_email_or_name(self, query: str) -> List[User]:
        """Search users by case-insensitive match on email or full_name."""
        pattern = f"%{query.lower()}%"
        stmt = (
            self._get_base_query()
            .where(
                or_(
                    UserModel.email.ilike(pattern),
                    UserModel.full_name.ilike(pattern),
                )
            )
            .limit(20)
        )
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.unique().scalars().all()]

    async def delete(self, user_id: int) -> bool:
        """Soft-delete: set is_deleted=True and deleted_at; do NOT issue SQL DELETE."""
        stmt = select(UserModel).where(UserModel.id == user_id, UserModel.is_deleted == False)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model:
            model.is_deleted = True
            model.deleted_at = datetime.utcnow()  # Set explicitly — NOT via onupdate
            await self.session.commit()
            return True
        return False

    async def update(self, user_id: int, fields: dict) -> None:
        """Update arbitrary user fields. Only allows: full_name, email, avatar."""
        allowed = {"full_name", "email", "avatar"}
        safe_fields = {k: v for k, v in fields.items() if k in allowed}
        if not safe_fields:
            return
        stmt = select(UserModel).where(UserModel.id == user_id, UserModel.is_deleted == False)
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        for k, v in safe_fields.items():
            setattr(user, k, v)
        await self.session.commit()

    async def update_avatar(self, user_id: int, relative_path: str) -> None:
        """Store relative avatar path (e.g. 'uploads/avatars/uuid.jpg') in DB."""
        await self.update(user_id, {"avatar": relative_path})

    async def update_password(self, user_id: int, password_hash: str) -> None:
        """Update the user's password hash directly (used by password reset flow)."""
        stmt = select(UserModel).where(UserModel.id == user_id, UserModel.is_deleted == False)
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        user.password_hash = password_hash
        await self.session.commit()

    async def get_all_by_role(self, role_name: str) -> List[User]:
        """Return all active users whose role name matches (case-insensitive)."""
        stmt = (
            select(UserModel)
            .join(RoleModel, UserModel.role_id == RoleModel.id)
            .where(
                RoleModel.name.ilike(role_name),
                UserModel.is_deleted == False,
            )
            .options(joinedload(UserModel.role))
        )
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.unique().scalars().all()]

    # ------------------------------------------------------------------
    # Phase 15 RBAC-03 / D-1.17 (Plan 15-05)
    # ------------------------------------------------------------------

    async def update_role(self, user_id: int, role_id: int) -> None:
        """Phase 15 D-1.17 — set users.role_id directly.

        Replaces the Phase 14 14-01 `_make_update_role` closure pattern. The
        session.flush() (rather than commit()) keeps this play nicely inside the
        outer get_db_session() transaction — DeleteRoleUseCase composes this
        with bulk_update_role_id + role_perm_repo.delete_by_role + role_repo.delete
        in one atomic txn (Member-fallback-01 mitigation).
        """
        await self.session.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(role_id=role_id)
        )
        await self.session.flush()

    async def bulk_update_role_id(self, from_role_id: int, to_role_id: int) -> List[int]:
        """Phase 15 D-2.2 — DeleteRoleUseCase Member fallback.

        Returns affected user IDs (for per-user audit emission). Single transaction;
        caller (DeleteRoleUseCase) composes with role_perm_repo.delete_by_role +
        role_repo.delete inside the same get_db_session() scope.
        """
        affected = await self.session.execute(
            select(UserModel.id).where(UserModel.role_id == from_role_id)
        )
        user_ids = [row[0] for row in affected.all()]
        if user_ids:
            await self.session.execute(
                update(UserModel)
                .where(UserModel.role_id == from_role_id)
                .values(role_id=to_role_id)
            )
            await self.session.flush()
        return user_ids
