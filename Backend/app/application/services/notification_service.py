from abc import ABC, abstractmethod
from typing import Optional
from app.domain.entities.notification import NotificationType
from app.domain.repositories.notification_repository import INotificationRepository
from app.domain.repositories.notification_preference_repository import INotificationPreferenceRepository
from app.application.use_cases.manage_notifications import CreateNotificationUseCase


class INotificationService(ABC):
    """Abstraction layer — allows future migration to WebSocket/GraphQL delivery
    without changing the API layer. The API layer calls notify(); delivery mechanism
    is determined by the concrete implementation."""

    @abstractmethod
    async def notify(
        self,
        user_id: int,
        type: NotificationType,
        message: str,
        related_entity_id: Optional[int] = None,
        related_entity_type: Optional[str] = None,
        actor_id: Optional[int] = None,  # if set, suppresses self-notification
    ) -> None: ...


class PollingNotificationService(INotificationService):
    """Polling-based implementation: persists notification to DB.
    Frontend polling picks up new rows. Replace this class (not callers)
    to switch to WebSocket or GraphQL subscriptions."""

    def __init__(
        self,
        notification_repo: INotificationRepository,
        pref_repo: INotificationPreferenceRepository,
    ):
        self._notification_repo = notification_repo
        self._pref_repo = pref_repo

    async def notify(
        self,
        user_id: int,
        type: NotificationType,
        message: str,
        related_entity_id: Optional[int] = None,
        related_entity_type: Optional[str] = None,
        actor_id: Optional[int] = None,
    ) -> None:
        # Self-suppression: skip if actor is the same as recipient
        if actor_id is not None and actor_id == user_id:
            return
        # Check user preference: is in_app enabled for this type?
        pref = await self._pref_repo.get_by_user(user_id)
        if pref is not None:
            type_prefs = pref.preferences.get(type.value, {})
            if not type_prefs.get("in_app", True):  # default True if not set
                return
        use_case = CreateNotificationUseCase(self._notification_repo)
        await use_case.execute(
            user_id=user_id,
            type=type,
            message=message,
            related_entity_id=related_entity_id,
            related_entity_type=related_entity_type,
        )
