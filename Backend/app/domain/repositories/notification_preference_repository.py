from abc import ABC, abstractmethod
from typing import Optional
from app.domain.entities.notification_preference import NotificationPreference


class INotificationPreferenceRepository(ABC):
    @abstractmethod
    async def get_by_user(self, user_id: int) -> Optional[NotificationPreference]: ...

    @abstractmethod
    async def upsert(self, pref: NotificationPreference) -> NotificationPreference: ...
    # Creates if not exists, updates if exists (uses user_id unique constraint)
