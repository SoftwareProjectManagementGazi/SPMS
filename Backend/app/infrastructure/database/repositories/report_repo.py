from typing import List, Optional
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct, and_, or_, union

from app.domain.repositories.report_repository import IReportRepository
from app.application.dtos.report_dtos import (
    SummaryDTO,
    BurndownDTO,
    BurndownPointDTO,
    VelocityDTO,
    VelocityPointDTO,
    DistributionDTO,
    DistributionItemDTO,
    PerformanceDTO,
    MemberPerformanceDTO,
    TaskExportRowDTO,
)
from app.infrastructure.database.models.task import TaskModel
from app.infrastructure.database.models.sprint import SprintModel
from app.infrastructure.database.models.board_column import BoardColumnModel
from app.infrastructure.database.models.audit_log import AuditLogModel
from app.infrastructure.database.models.user import UserModel


class SqlAlchemyReportRepository(IReportRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get_done_column_ids(self, project_id: int) -> List[int]:
        """Return IDs of columns whose name contains 'done' (case-insensitive)."""
        stmt = select(BoardColumnModel.id).where(
            BoardColumnModel.project_id == project_id,
            BoardColumnModel.name.ilike("%done%"),
        )
        result = await self.session.execute(stmt)
        return [row[0] for row in result.all()]

    async def get_summary(
        self,
        project_id: int,
        assignee_ids: Optional[List[int]],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> SummaryDTO:
        done_ids = await self._get_done_column_ids(project_id)

        # Base filters
        filters = [
            TaskModel.project_id == project_id,
            TaskModel.deleted_at.is_(None),
        ]
        if assignee_ids:
            filters.append(TaskModel.assignee_id.in_(assignee_ids))
        if date_from:
            filters.append(TaskModel.created_at >= date_from)
        if date_to:
            filters.append(TaskModel.created_at <= date_to)

        total_stmt = select(func.count(TaskModel.id)).where(and_(*filters))
        total_result = await self.session.execute(total_stmt)
        total = total_result.scalar() or 0

        if done_ids:
            completed_filters = list(filters) + [TaskModel.column_id.in_(done_ids)]
        else:
            completed_filters = list(filters) + [TaskModel.column_id.is_(None)]  # no done cols → 0

        completed_stmt = select(func.count(TaskModel.id)).where(and_(*completed_filters))
        completed_result = await self.session.execute(completed_stmt)
        completed = completed_result.scalar() or 0

        active = total - completed
        rate = round((completed / total) * 100, 1) if total > 0 else 0.0

        return SummaryDTO(
            active_tasks=active,
            completed_tasks=completed,
            total_tasks=total,
            completion_rate=rate,
        )

    async def get_burndown(
        self,
        project_id: int,
        sprint_id: Optional[int],
    ) -> BurndownDTO:
        # Resolve sprint
        if sprint_id is not None:
            sprint_stmt = select(SprintModel).where(SprintModel.id == sprint_id)
        else:
            # Active sprint first
            sprint_stmt = (
                select(SprintModel)
                .where(
                    SprintModel.project_id == project_id,
                    SprintModel.is_active == True,
                )
                .limit(1)
            )
        sprint_result = await self.session.execute(sprint_stmt)
        sprint = sprint_result.scalars().first()

        if sprint is None and sprint_id is None:
            # Fall back to most recent sprint by end_date
            fallback_stmt = (
                select(SprintModel)
                .where(SprintModel.project_id == project_id)
                .order_by(SprintModel.end_date.desc())
                .limit(1)
            )
            fb_result = await self.session.execute(fallback_stmt)
            sprint = fb_result.scalars().first()

        if sprint is None:
            return BurndownDTO(sprint_name="", sprint_id=0, series=[])

        done_ids = await self._get_done_column_ids(project_id)

        # Total tasks in this sprint
        total_stmt = select(func.count(TaskModel.id)).where(
            TaskModel.sprint_id == sprint.id,
            TaskModel.deleted_at.is_(None),
        )
        total_result = await self.session.execute(total_stmt)
        total = total_result.scalar() or 0

        series: List[BurndownPointDTO] = []
        if sprint.start_date and sprint.end_date:
            today = date.today()
            end = min(sprint.end_date, today)
            current = sprint.start_date
            while current <= end:
                if done_ids:
                    # Hybrid: audit log entries OR current column status by updated_at.
                    # Audit log is accurate for tasks moved via the API; updated_at
                    # fallback handles seeded/imported tasks that have no audit history.
                    via_audit = select(AuditLogModel.entity_id.label("tid")).where(
                        AuditLogModel.entity_type == "task",
                        AuditLogModel.field_name == "column_id",
                        AuditLogModel.new_value.in_([str(c) for c in done_ids]),
                        func.date(AuditLogModel.timestamp) <= current,
                    )
                    via_column = select(TaskModel.id.label("tid")).where(
                        TaskModel.sprint_id == sprint.id,
                        TaskModel.column_id.in_(done_ids),
                        TaskModel.deleted_at.is_(None),
                        func.date(TaskModel.updated_at) <= current,
                    )
                    combined = union(via_audit, via_column).subquery()
                    done_result = await self.session.execute(
                        select(func.count()).select_from(combined)
                    )
                    done_by_day = done_result.scalar() or 0
                else:
                    done_by_day = 0

                series.append(BurndownPointDTO(
                    date=current.isoformat(),
                    remaining=max(0, total - done_by_day),
                    total=total,
                ))
                current += timedelta(days=1)

        return BurndownDTO(
            sprint_name=sprint.name,
            sprint_id=sprint.id,
            series=series,
        )

    async def get_velocity(
        self,
        project_id: int,
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> VelocityDTO:
        done_ids = await self._get_done_column_ids(project_id)

        # Check if project has sprints
        sprints_stmt = (
            select(SprintModel)
            .where(SprintModel.project_id == project_id)
            .order_by(SprintModel.start_date)
        )
        sprints_result = await self.session.execute(sprints_stmt)
        sprints = sprints_result.scalars().all()

        series: List[VelocityPointDTO] = []

        if sprints:
            for sprint in sprints:
                sprint_filters = [
                    TaskModel.sprint_id == sprint.id,
                    TaskModel.deleted_at.is_(None),
                ]
                if done_ids:
                    sprint_filters.append(TaskModel.column_id.in_(done_ids))

                count_stmt = select(func.count(TaskModel.id)).where(and_(*sprint_filters))
                points_stmt = select(func.coalesce(func.sum(TaskModel.points), 0)).where(and_(*sprint_filters))

                count_result = await self.session.execute(count_stmt)
                points_result = await self.session.execute(points_stmt)

                series.append(VelocityPointDTO(
                    label=sprint.name[:12],
                    completed_count=count_result.scalar() or 0,
                    completed_points=points_result.scalar() or 0,
                ))
        else:
            # No sprints — group by calendar week
            week_filters = [
                TaskModel.project_id == project_id,
                TaskModel.deleted_at.is_(None),
            ]
            if done_ids:
                week_filters.append(TaskModel.column_id.in_(done_ids))
            if date_from:
                week_filters.append(TaskModel.updated_at >= date_from)
            if date_to:
                week_filters.append(TaskModel.updated_at <= date_to)

            week_stmt = (
                select(
                    func.extract("week", TaskModel.updated_at).label("week"),
                    func.count(TaskModel.id).label("cnt"),
                    func.coalesce(func.sum(TaskModel.points), 0).label("pts"),
                )
                .where(and_(*week_filters))
                .group_by(func.extract("week", TaskModel.updated_at))
                .order_by(func.extract("week", TaskModel.updated_at))
            )
            week_result = await self.session.execute(week_stmt)
            for row in week_result.all():
                series.append(VelocityPointDTO(
                    label=f"W{int(row.week)}",
                    completed_count=row.cnt,
                    completed_points=row.pts,
                ))

        return VelocityDTO(series=series)

    async def get_distribution(
        self,
        project_id: int,
        group_by: str,
        assignee_ids: Optional[List[int]],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> DistributionDTO:
        base_filters = [
            TaskModel.project_id == project_id,
            TaskModel.deleted_at.is_(None),
        ]
        if assignee_ids:
            base_filters.append(TaskModel.assignee_id.in_(assignee_ids))
        if date_from:
            base_filters.append(TaskModel.created_at >= date_from)
        if date_to:
            base_filters.append(TaskModel.created_at <= date_to)

        items: List[DistributionItemDTO] = []

        if group_by == "status":
            stmt = (
                select(
                    BoardColumnModel.name.label("col_name"),
                    func.count(TaskModel.id).label("cnt"),
                )
                .join(BoardColumnModel, TaskModel.column_id == BoardColumnModel.id)
                .where(and_(*base_filters))
                .group_by(BoardColumnModel.name)
                .order_by(func.count(TaskModel.id).desc())
            )
            result = await self.session.execute(stmt)
            for row in result.all():
                col_lower = row.col_name.lower()
                if "done" in col_lower:
                    color = "--status-done"
                elif "progress" in col_lower or "doing" in col_lower:
                    color = "--status-progress"
                else:
                    color = "--status-todo"
                items.append(DistributionItemDTO(label=row.col_name, count=row.cnt, color=color))
        else:
            # group_by == "priority"
            stmt = (
                select(
                    TaskModel.priority.label("prio"),
                    func.count(TaskModel.id).label("cnt"),
                )
                .where(and_(*base_filters))
                .group_by(TaskModel.priority)
                .order_by(func.count(TaskModel.id).desc())
            )
            result = await self.session.execute(stmt)
            priority_color_map = {
                "critical": "--priority-critical",
                "high": "--priority-high",
                "medium": "--priority-medium",
                "low": "--priority-low",
            }
            for row in result.all():
                # row.prio may be a Python enum (TaskPriority.MEDIUM) or a plain string
                raw = row.prio.value if hasattr(row.prio, "value") else str(row.prio)
                prio_val = raw.upper() if raw else "MEDIUM"
                color = priority_color_map.get(prio_val.lower(), "--priority-medium")
                items.append(DistributionItemDTO(label=prio_val, count=row.cnt, color=color))

        return DistributionDTO(group_by=group_by, items=items)

    async def get_performance(
        self,
        project_id: int,
        assignee_ids: Optional[List[int]],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> PerformanceDTO:
        done_ids = await self._get_done_column_ids(project_id)

        # Get all unique assignees for this project
        assignee_stmt = (
            select(TaskModel.assignee_id)
            .where(
                TaskModel.project_id == project_id,
                TaskModel.deleted_at.is_(None),
                TaskModel.assignee_id.isnot(None),
            )
            .distinct()
        )
        if assignee_ids:
            assignee_stmt = assignee_stmt.where(TaskModel.assignee_id.in_(assignee_ids))
        assignee_result = await self.session.execute(assignee_stmt)
        member_ids = [row[0] for row in assignee_result.all()]

        members: List[MemberPerformanceDTO] = []
        for uid in member_ids:
            # Fetch user info
            user_stmt = select(UserModel).where(UserModel.id == uid)
            user_result = await self.session.execute(user_stmt)
            user = user_result.scalars().first()
            if not user:
                continue

            # assigned count
            assigned_stmt = select(func.count(TaskModel.id)).where(
                TaskModel.project_id == project_id,
                TaskModel.assignee_id == uid,
                TaskModel.deleted_at.is_(None),
            )
            assigned_result = await self.session.execute(assigned_stmt)
            assigned = assigned_result.scalar() or 0

            # completed count (in done columns within date range)
            comp_filters = [
                TaskModel.project_id == project_id,
                TaskModel.assignee_id == uid,
                TaskModel.deleted_at.is_(None),
            ]
            if done_ids:
                comp_filters.append(TaskModel.column_id.in_(done_ids))
            if date_from:
                comp_filters.append(TaskModel.updated_at >= date_from)
            if date_to:
                comp_filters.append(TaskModel.updated_at <= date_to)

            comp_stmt = select(func.count(TaskModel.id)).where(and_(*comp_filters))
            comp_result = await self.session.execute(comp_stmt)
            completed = comp_result.scalar() or 0

            # in_progress (not done, not deleted)
            ip_filters = [
                TaskModel.project_id == project_id,
                TaskModel.assignee_id == uid,
                TaskModel.deleted_at.is_(None),
            ]
            if done_ids:
                ip_filters.append(TaskModel.column_id.not_in(done_ids))
            in_progress_stmt = select(func.count(TaskModel.id)).where(and_(*ip_filters))
            ip_result = await self.session.execute(in_progress_stmt)
            in_progress = ip_result.scalar() or 0

            # on-time calculation: fetch completed tasks and check due_date vs updated_at
            on_time = 0
            eligible = 0
            if completed > 0:
                tasks_stmt = (
                    select(TaskModel)
                    .where(and_(*comp_filters))
                )
                tasks_result = await self.session.execute(tasks_stmt)
                task_rows = tasks_result.scalars().all()

                for t in task_rows:
                    deadline = None
                    if t.due_date:
                        deadline = t.due_date.date() if hasattr(t.due_date, 'date') else t.due_date
                    elif t.sprint_id:
                        sprint_stmt = select(SprintModel.end_date).where(SprintModel.id == t.sprint_id)
                        sprint_result = await self.session.execute(sprint_stmt)
                        sprint_end = sprint_result.scalar()
                        if sprint_end:
                            deadline = sprint_end

                    if deadline is not None and t.updated_at is not None:
                        eligible += 1
                        updated_date = t.updated_at.date() if hasattr(t.updated_at, 'date') else t.updated_at
                        if updated_date <= deadline:
                            on_time += 1

            on_time_pct = round((on_time / eligible) * 100, 1) if eligible > 0 else 0.0

            members.append(MemberPerformanceDTO(
                user_id=uid,
                full_name=user.full_name,
                avatar_path=user.avatar,
                assigned=assigned,
                completed=completed,
                in_progress=in_progress,
                on_time_pct=on_time_pct,
            ))

        return PerformanceDTO(members=members)

    async def get_tasks_for_export(
        self,
        project_id: int,
        assignee_ids: Optional[List[int]],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> List[TaskExportRowDTO]:
        assignee_alias = UserModel.__table__.alias("assignee_user")
        reporter_alias = UserModel.__table__.alias("reporter_user")

        stmt = (
            select(
                TaskModel.task_key,
                TaskModel.title,
                BoardColumnModel.name.label("status"),
                assignee_alias.c.full_name.label("assignee"),
                TaskModel.priority,
                SprintModel.name.label("sprint"),
                TaskModel.points,
                TaskModel.created_at,
                TaskModel.due_date,
                TaskModel.updated_at,
                reporter_alias.c.full_name.label("reporter"),
            )
            .outerjoin(BoardColumnModel, TaskModel.column_id == BoardColumnModel.id)
            .outerjoin(assignee_alias, TaskModel.assignee_id == assignee_alias.c.id)
            .outerjoin(SprintModel, TaskModel.sprint_id == SprintModel.id)
            .outerjoin(reporter_alias, TaskModel.reporter_id == reporter_alias.c.id)
            .where(
                TaskModel.project_id == project_id,
                TaskModel.deleted_at.is_(None),
            )
            .order_by(TaskModel.created_at.desc())
        )

        if assignee_ids:
            stmt = stmt.where(TaskModel.assignee_id.in_(assignee_ids))
        if date_from:
            stmt = stmt.where(TaskModel.created_at >= date_from)
        if date_to:
            stmt = stmt.where(TaskModel.created_at <= date_to)

        result = await self.session.execute(stmt)
        rows = result.all()

        return [
            TaskExportRowDTO(
                task_key=row.task_key,
                title=row.title,
                status=row.status,
                assignee=row.assignee,
                priority=str(row.priority.value) if row.priority else None,
                sprint=row.sprint,
                points=row.points,
                created_at=row.created_at,
                due_date=row.due_date,
                updated_at=row.updated_at,
                reporter=row.reporter,
            )
            for row in rows
        ]
