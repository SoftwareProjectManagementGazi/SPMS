from typing import Optional
from app.domain.entities.notification import Notification, NotificationType
from app.domain.entities.notification_preference import NotificationPreference
from app.domain.repositories.notification_repository import INotificationRepository
from app.domain.repositories.notification_preference_repository import INotificationPreferenceRepository
from app.application.dtos.notification_dtos import (
    NotificationListResponseDTO,
    NotificationPreferenceUpdateDTO,
)


class CreateNotificationUseCase:
    def __init__(self, notification_repo: INotificationRepository):
        self.notification_repo = notification_repo

    async def execute(
        self,
        user_id: int,
        type: NotificationType,
        message: str,
        related_entity_id: Optional[int] = None,
        related_entity_type: Optional[str] = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            type=type,
            message=message,
            related_entity_id=related_entity_id,
            related_entity_type=related_entity_type,
        )
        return await self.notification_repo.create(notification)


class ListUserNotificationsUseCase:
    def __init__(self, notification_repo: INotificationRepository):
        self.notification_repo = notification_repo

    async def execute(
        self,
        user_id: int,
        unread_only: bool = False,
        limit: int = 20,
        offset: int = 0,
    ) -> NotificationListResponseDTO:
        notifications = await self.notification_repo.get_by_user(
            user_id=user_id,
            unread_only=unread_only,
            limit=limit,
            offset=offset,
        )
        unread_count = await self.notification_repo.get_unread_count(user_id)
        return NotificationListResponseDTO(
            notifications=notifications,
            unread_count=unread_count,
            total=len(notifications),
        )


class MarkNotificationReadUseCase:
    def __init__(self, notification_repo: INotificationRepository):
        self.notification_repo = notification_repo

    async def execute(self, notification_id: int, user_id: int) -> bool:
        result = await self.notification_repo.mark_read(notification_id, user_id)
        if not result:
            raise ValueError("Bildirim bulunamadı")
        return result


class MarkAllReadUseCase:
    def __init__(self, notification_repo: INotificationRepository):
        self.notification_repo = notification_repo

    async def execute(self, user_id: int) -> None:
        await self.notification_repo.mark_all_read(user_id)


class DeleteNotificationUseCase:
    def __init__(self, notification_repo: INotificationRepository):
        self.notification_repo = notification_repo

    async def execute(self, notification_id: int, user_id: int) -> bool:
        result = await self.notification_repo.delete(notification_id, user_id)
        if not result:
            raise ValueError("Bildirim bulunamadı")
        return result


class ClearReadNotificationsUseCase:
    def __init__(self, notification_repo: INotificationRepository):
        self.notification_repo = notification_repo

    async def execute(self, user_id: int) -> None:
        await self.notification_repo.clear_read(user_id)


class GetNotificationPreferencesUseCase:
    def __init__(self, pref_repo: INotificationPreferenceRepository):
        self.pref_repo = pref_repo

    async def execute(self, user_id: int) -> NotificationPreference:
        pref = await self.pref_repo.get_by_user(user_id)
        if pref is None:
            return NotificationPreference(user_id=user_id)
        return pref


class UpdateNotificationPreferencesUseCase:
    def __init__(self, pref_repo: INotificationPreferenceRepository):
        self.pref_repo = pref_repo

    async def execute(
        self,
        user_id: int,
        dto: NotificationPreferenceUpdateDTO,
    ) -> NotificationPreference:
        pref = await self.pref_repo.get_by_user(user_id)
        if pref is None:
            pref = NotificationPreference(user_id=user_id)
        # Merge fields from DTO (skip None values)
        if dto.preferences is not None:
            pref = pref.model_copy(update={"preferences": dto.preferences})
        if dto.email_enabled is not None:
            pref = pref.model_copy(update={"email_enabled": dto.email_enabled})
        if dto.deadline_days is not None:
            pref = pref.model_copy(update={"deadline_days": dto.deadline_days})
        return await self.pref_repo.upsert(pref)
