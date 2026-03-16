from typing import List, Optional
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, text

from app.domain.entities.notification import Notification
from app.domain.repositories.notification_repository import INotificationRepository
from app.infrastructure.database.models.notification import NotificationModel


class SqlAlchemyNotificationRepository(INotificationRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, notification: Notification) -> Notification:
        data = notification.model_dump(exclude={"id"})
        db_obj = NotificationModel(**data)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return Notification.model_validate(db_obj)

    async def get_by_user(
        self,
        user_id: int,
        unread_only: bool = False,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Notification]:
        stmt = (
            select(NotificationModel)
            .where(NotificationModel.user_id == user_id)
        )
        if unread_only:
            stmt = stmt.where(NotificationModel.is_read == False)
        stmt = stmt.order_by(NotificationModel.created_at.desc()).limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        rows = result.scalars().all()
        return [Notification.model_validate(r) for r in rows]

    async def get_unread_count(self, user_id: int) -> int:
        stmt = select(func.count()).where(
            NotificationModel.user_id == user_id,
            NotificationModel.is_read == False,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def mark_read(self, notification_id: int, user_id: int) -> bool:
        stmt = (
            update(NotificationModel)
            .where(
                NotificationModel.id == notification_id,
                NotificationModel.user_id == user_id,
            )
            .values(is_read=True)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    async def mark_all_read(self, user_id: int) -> None:
        stmt = (
            update(NotificationModel)
            .where(
                NotificationModel.user_id == user_id,
                NotificationModel.is_read == False,
            )
            .values(is_read=True)
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def delete(self, notification_id: int, user_id: int) -> bool:
        stmt = (
            delete(NotificationModel)
            .where(
                NotificationModel.id == notification_id,
                NotificationModel.user_id == user_id,
            )
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    async def clear_read(self, user_id: int) -> None:
        stmt = (
            delete(NotificationModel)
            .where(
                NotificationModel.user_id == user_id,
                NotificationModel.is_read == True,
            )
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def purge_old_read(self, days: int = 90) -> int:
        cutoff = datetime.utcnow() - timedelta(days=days)
        stmt = (
            delete(NotificationModel)
            .where(
                NotificationModel.is_read == True,
                NotificationModel.created_at < cutoff,
            )
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount

    async def get_tasks_approaching_deadline(self, days_ahead: int) -> List[dict]:
        sql = text(
            """
            SELECT
                tasks.id        AS task_id,
                tasks.title     AS task_title,
                tasks.assignee_id,
                tasks.due_date
            FROM tasks
            WHERE tasks.due_date IS NOT NULL
              AND tasks.assignee_id IS NOT NULL
              AND tasks.deleted_at IS NULL
              AND tasks.due_date::date = (NOW() + :interval)::date
            """
        )
        result = await self.session.execute(
            sql, {"interval": f"{days_ahead} days"}
        )
        rows = result.mappings().all()
        return [dict(r) for r in rows]
