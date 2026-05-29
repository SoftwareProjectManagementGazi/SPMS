from typing import List, Optional
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.domain.entities.comment import Comment
from app.domain.repositories.comment_repository import ICommentRepository
from app.infrastructure.database.models.comment import CommentModel
from app.infrastructure.database.models.user import UserModel
from app.infrastructure.database.models.role import RoleModel


class SqlAlchemyCommentRepository(ICommentRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _get_base_query(self):
        """Always filters out soft-deleted comments and joinloads author info."""
        return (
            select(CommentModel)
            .where(CommentModel.is_deleted == False)
            .options(
                joinedload(CommentModel.user).joinedload(UserModel.role)
            )
        )

    def _to_entity(self, model: CommentModel) -> Comment:
        return Comment(
            id=model.id,
            task_id=model.task_id,
            user_id=model.user_id,
            content=model.content,
            created_at=model.created_at,
            updated_at=model.updated_at,
            is_deleted=model.is_deleted,
            user=model.user,
        )

    async def get_by_id(self, comment_id: int) -> Optional[Comment]:
        stmt = self._get_base_query().where(CommentModel.id == comment_id)
        result = await self.session.execute(stmt)
        model = result.unique().scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_task(self, task_id: int) -> List[Comment]:
        stmt = (
            self._get_base_query()
            .where(CommentModel.task_id == task_id)
            # created_at uses Postgres now() = transaction-start time, which is
            # constant within a transaction; two comments created in the same
            # transaction share an identical created_at, making a sort on it alone
            # non-deterministic. Tiebreak on the monotonic PK (insertion order).
            .order_by(CommentModel.created_at, CommentModel.id)
        )
        result = await self.session.execute(stmt)
        models = result.unique().scalars().all()
        return [self._to_entity(m) for m in models]

    async def create(self, comment: Comment) -> Comment:
        model = CommentModel(
            task_id=comment.task_id,
            user_id=comment.user_id,
            content=comment.content,
        )
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()

        # Re-fetch with user loaded
        stmt = (
            select(CommentModel)
            .where(CommentModel.id == model.id)
            .options(joinedload(CommentModel.user).joinedload(UserModel.role))
        )
        result = await self.session.execute(stmt)
        refreshed = result.unique().scalar_one()
        return self._to_entity(refreshed)

    async def update(self, comment_id: int, content: str) -> Optional[Comment]:
        stmt = select(CommentModel).where(CommentModel.id == comment_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None or model.is_deleted:
            return None

        model.content = content
        # updated_at column is DateTime(timezone=True); created_at is tz-aware too.
        # Using naive datetime.utcnow() here made _map_to_response crash comparing
        # offset-naive vs offset-aware datetimes (comment edit -> 500). Use a
        # tz-aware UTC timestamp so both timestamps are comparable.
        model.updated_at = datetime.now(timezone.utc)

        await self.session.flush()
        await self.session.commit()

        # Re-fetch with user loaded
        stmt2 = (
            select(CommentModel)
            .where(CommentModel.id == comment_id)
            .options(joinedload(CommentModel.user).joinedload(UserModel.role))
        )
        result2 = await self.session.execute(stmt2)
        refreshed = result2.unique().scalar_one()
        return self._to_entity(refreshed)

    async def soft_delete(self, comment_id: int) -> bool:
        stmt = select(CommentModel).where(CommentModel.id == comment_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return False

        model.is_deleted = True
        # updated_at column is DateTime(timezone=True); created_at is tz-aware too.
        # Using naive datetime.utcnow() here made _map_to_response crash comparing
        # offset-naive vs offset-aware datetimes (comment edit -> 500). Use a
        # tz-aware UTC timestamp so both timestamps are comparable.
        model.updated_at = datetime.now(timezone.utc)
        await self.session.flush()
        await self.session.commit()
        return True
