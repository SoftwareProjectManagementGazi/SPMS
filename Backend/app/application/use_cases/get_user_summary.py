"""API-03 / D-48 User summary with asyncio.gather."""
import asyncio
from datetime import datetime, timedelta
from app.domain.repositories.user_repository import IUserRepository
from app.domain.repositories.project_repository import IProjectRepository
from app.domain.repositories.audit_repository import IAuditRepository
from app.domain.repositories.task_repository import ITaskRepository
from app.application.dtos.user_summary_dtos import (
    UserSummaryResponseDTO, UserSummaryStatsDTO, UserSummaryProjectDTO,
)


class GetUserSummaryUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        project_repo: IProjectRepository,
        audit_repo: IAuditRepository,
        task_repo: ITaskRepository,
    ):
        self.user_repo = user_repo
        self.project_repo = project_repo
        self.audit_repo = audit_repo
        self.task_repo = task_repo

    async def execute(self, user_id: int, include_archived: bool = False) -> UserSummaryResponseDTO:
        statuses = ["ACTIVE", "COMPLETED", "ON_HOLD"]
        if include_archived:
            statuses.append("ARCHIVED")

        # D-48: run 3 independent queries in parallel via asyncio.gather
        stats_task = self._get_stats(user_id)
        projects_task = self.project_repo.list_by_member_and_status(user_id, statuses)
        activity_task = self.audit_repo.get_recent_by_user(user_id, limit=5)

        stats, projects, recent_activity = await asyncio.gather(
            stats_task, projects_task, activity_task
        )

        return UserSummaryResponseDTO(
            stats=UserSummaryStatsDTO(**stats),
            projects=[
                UserSummaryProjectDTO(
                    id=p.id,
                    key=p.key,
                    name=p.name,
                    status=p.status.value if hasattr(p.status, "value") else str(p.status),
                )
                for p in projects
            ],
            recent_activity=recent_activity,
        )

    async def _get_stats(self, user_id: int) -> dict:
        # Sub-queries also run in parallel
        active, completed, project_count = await asyncio.gather(
            self.task_repo.count_active_by_assignee(user_id),
            self.task_repo.count_completed_since(user_id, datetime.utcnow() - timedelta(days=30)),
            self.project_repo.count_by_member(user_id),
        )
        return {
            "active_tasks": active,
            "completed_last_30d": completed,
            "project_count": project_count,
        }
