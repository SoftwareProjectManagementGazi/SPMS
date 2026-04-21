"""Notification repository and service DI factories.

Lazy imports kept inside functions to avoid circular import at module load time.
Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session
from app.domain.repositories.notification_repository import INotificationRepository
from app.domain.repositories.notification_preference_repository import INotificationPreferenceRepository


def get_notification_repo(session: AsyncSession = Depends(get_db_session)) -> INotificationRepository:
    from app.infrastructure.database.repositories.notification_repo import SqlAlchemyNotificationRepository
    return SqlAlchemyNotificationRepository(session)


def get_notification_preference_repo(session: AsyncSession = Depends(get_db_session)) -> INotificationPreferenceRepository:
    from app.infrastructure.database.repositories.notification_preference_repo import SqlAlchemyNotificationPreferenceRepository
    return SqlAlchemyNotificationPreferenceRepository(session)


def get_notification_service(
    notification_repo: INotificationRepository = Depends(get_notification_repo),
    pref_repo: INotificationPreferenceRepository = Depends(get_notification_preference_repo),
):
    from app.application.services.notification_service import PollingNotificationService
    return PollingNotificationService(notification_repo, pref_repo)


__all__ = ["get_notification_repo", "get_notification_preference_repo", "get_notification_service"]
