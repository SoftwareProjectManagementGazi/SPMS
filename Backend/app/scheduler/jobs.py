import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.infrastructure.database.database import AsyncSessionLocal
from app.domain.entities.notification import NotificationType
from app.infrastructure.database.repositories.notification_repo import SqlAlchemyNotificationRepository
from app.infrastructure.database.repositories.notification_preference_repo import SqlAlchemyNotificationPreferenceRepository
from app.infrastructure.database.repositories.user_repo import SqlAlchemyUserRepository
from app.application.use_cases.manage_notifications import CreateNotificationUseCase

scheduler = AsyncIOScheduler(timezone="Europe/Istanbul")


async def deadline_alert_job() -> None:
    """Daily job: fire deadline-approaching notifications for tasks due in N days.
    Each user's preference determines N (1, 2, 3, or 7). 1-day always fires."""
    async with AsyncSessionLocal() as session:
        notif_repo = SqlAlchemyNotificationRepository(session)
        pref_repo = SqlAlchemyNotificationPreferenceRepository(session)
        create_uc = CreateNotificationUseCase(notif_repo)
        for days_ahead in [1, 2, 3, 7]:
            tasks_due = await notif_repo.get_tasks_approaching_deadline(days_ahead)
            for t in tasks_due:
                user_id = t["assignee_id"]
                pref = await pref_repo.get_by_user(user_id)
                deadline_days = pref.deadline_days if pref else 1
                # Fire if days_ahead == 1 (always) OR days_ahead <= user preference
                if days_ahead == 1 or days_ahead <= deadline_days:
                    await create_uc.execute(
                        user_id=user_id,
                        type=NotificationType.DEADLINE_APPROACHING,
                        message=f"'{t['task_title']}' görevinin son tarihi {days_ahead} gün sonra.",
                        related_entity_id=t["task_id"],
                        related_entity_type="task",
                    )


async def purge_notifications_job() -> None:
    """Daily job: purge read notifications older than 90 days."""
    async with AsyncSessionLocal() as session:
        notif_repo = SqlAlchemyNotificationRepository(session)
        deleted = await notif_repo.purge_old_read(days=90)
