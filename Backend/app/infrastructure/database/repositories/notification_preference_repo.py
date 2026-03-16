from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domain.entities.notification_preference import NotificationPreference
from app.domain.repositories.notification_preference_repository import INotificationPreferenceRepository
from app.infrastructure.database.models.notification_preference import NotificationPreferenceModel


class SqlAlchemyNotificationPreferenceRepository(INotificationPreferenceRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_user(self, user_id: int) -> Optional[NotificationPreference]:
        stmt = select(NotificationPreferenceModel).where(
            NotificationPreferenceModel.user_id == user_id
        )
        result = await self.session.execute(stmt)
        row = result.scalar_one_or_none()
        return NotificationPreference.model_validate(row) if row else None

    async def upsert(self, pref: NotificationPreference) -> NotificationPreference:
        stmt = select(NotificationPreferenceModel).where(
            NotificationPreferenceModel.user_id == pref.user_id
        )
        result = await self.session.execute(stmt)
        row = result.scalar_one_or_none()

        if row is None:
            row = NotificationPreferenceModel(
                user_id=pref.user_id,
                preferences=pref.preferences,
                email_enabled=pref.email_enabled,
                deadline_days=pref.deadline_days,
            )
            self.session.add(row)
        else:
            row.preferences = pref.preferences
            row.email_enabled = pref.email_enabled
            row.deadline_days = pref.deadline_days

        await self.session.commit()
        await self.session.refresh(row)
        return NotificationPreference.model_validate(row)
