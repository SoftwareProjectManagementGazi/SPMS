from typing import List, Optional
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct

from app.domain.repositories.report_repository import IReportRepository
from app.application.dtos.report_dtos import (
    SummaryDTO,
    BurndownDTO,
    BurndownPointDTO,
    VelocityDTO,
    VelocityPointDTO,
    DistributionDTO,
    DistributionItemDTO,
    MemberPerformanceDTO,
    PerformanceDTO,
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
        """Get IDs of 'done' board columns for a project."""
        stmt = select(BoardColumnModel.id).where(
            BoardColumnModel.project_id == project_id,
            BoardColumnModel.name.ilike("%done%"),
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_summary(
        self,
        project_id: int,
        assignee_ids: Optional[List[int]],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> SummaryDTO:
        done_col_ids = await self._get_done_column_ids(project_id)

        # Base filter conditions
        base_conditions = [
            TaskModel.project_id == project_id,
            TaskModel.deleted_at.is_(None),
        ]
        if assignee_ids:
            base_conditions.append(TaskModel.assignee_id.in_(assignee_ids))
        if date_from:
            base_conditions.append(TaskModel.created_at >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            base_conditions.append(TaskModel.created_at <= datetime.combine(date_to, datetime.max.time()))

        # Total count
        total_stmt = select(func.count(TaskModel.id)).where(*base_conditions)
        total_result = await self.session.execute(total_stmt)
        total = total_result.scalar() or 0

        # Completed (done) count
        completed = 0
        if done_col_ids:
            completed_conditions = base_conditions + [TaskModel.column_id.in_(done_col_ids)]
            completed_stmt = select(func.count(TaskModel.id)).where(*completed_conditions)
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
        sprint = None

        if sprint_id is not None:
            stmt = select(SprintModel).where(
                SprintModel.id == sprint_id,
                SprintModel.project_id == project_id,
            )
            result = await self.session.execute(stmt)
            sprint = result.scalar_one_or_none()
        else:
            # Try active sprint first
            stmt = select(SprintModel).where(
                SprintModel.project_id == project_id,
                SprintModel.is_active.is_(True),
            ).limit(1)
            result = await self.session.execute(stmt)
            sprint = result.scalar_one_or_none()

            if sprint is None:
                # Fall back to most recent sprint by end_date
                stmt = select(SprintModel).where(
                    SprintModel.project_id == project_id,
                ).order_by(SprintModel.end_date.desc()).limit(1)
                result = await self.session.execute(stmt)
                sprint = result.scalar_one_or_none()

        if sprint is None or sprint.start_date is None or sprint.end_date is None:
            return BurndownDTO(sprint_name="", sprint_id=0, series=[])

        done_col_ids = await self._get_done_column_ids(project_id)

        # Total tasks for the sprint
        total_stmt = select(func.count(TaskModel.id)).where(
            TaskModel.sprint_id == sprint.id,
            TaskModel.deleted_at.is_(None),
        )
        total_result = await self.session.execute(total_stmt)
        total = total_result.scalar() or 0

        series: List[BurndownPointDTO] = []
        current_day = sprint.start_date
        end_day = min(sprint.end_date, date.today())

        done_col_id_strs = [str(cid) for cid in done_col_ids]

        while current_day <= end_day:
            # Count distinct tasks moved to done by (or before) current_day
            done_by_day = 0
            if done_col_id_strs:
                done_stmt = select(
                    func.count(distinct(AuditLogModel.entity_id))
                ).where(
                    AuditLogModel.entity_type == "task",
                    AuditLogModel.field_name == "column_id",
                    AuditLogModel.new_value.in_(done_col_id_strs),
                    func.date(AuditLogModel.timestamp) <= current_day,
                )
                done_result = await self.session.execute(done_stmt)
                done_by_day = done_result.scalar() or 0

            remaining = max(0, total - done_by_day)
            series.append(BurndownPointDTO(
                date=current_day.isoformat(),
                remaining=remaining,
                total=total,
            ))
            current_day += timedelta(days=1)

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
        done_col_ids = await self._get_done_column_ids(project_id)

        # Get all sprints for the project ordered by start_date
        sprints_stmt = select(SprintModel).where(
            SprintModel.project_id == project_id,
        ).order_by(SprintModel.start_date)
        sprints_result = await self.session.execute(sprints_stmt)
        sprints = sprints_result.scalars().all()

        series: List[VelocityPointDTO] = []

        if sprints:
            for sprint in sprints:
                completed_count = 0
                completed_points = 0
                if done_col_ids:
                    stmt = select(
                        func.count(TaskModel.id),
                        func.coalesce(func.sum(TaskModel.points), 0),
                    ).where(
                        TaskModel.sprint_id == sprint.id,
                        TaskModel.column_id.in_(done_col_ids),
                        TaskModel.deleted_at.is_(None),
                    )
                    result = await self.session.execute(stmt)
                    row = result.one()
                    completed_count = row[0] or 0
                    completed_points = row[1] or 0

                series.append(VelocityPointDTO(
                    label=sprint.name[:12],
                    completed_count=completed_count,
                    completed_points=completed_points,
                ))
        else:
            # No sprints — group by calendar week
            conditions = [
                TaskModel.project_id == project_id,
                TaskModel.deleted_at.is_(None),
            ]
            if done_col_ids:
                conditions.append(TaskModel.column_id.in_(done_col_ids))
            if date_from:
                conditions.append(TaskModel.updated_at >= datetime.combine(date_from, datetime.min.time()))
            if date_to:
                conditions.append(TaskModel.updated_at <= datetime.combine(date_to, datetime.max.time()))

            week_stmt = select(
                func.extract("week", TaskModel.updated_at).label("week_num"),
                func.count(TaskModel.id).label("completed_count"),
                func.coalesce(func.sum(TaskModel.points), 0).label("completed_points"),
            ).where(*conditions).group_by(
                func.extract("week", TaskModel.updated_at)
            ).order_by(func.extract("week", TaskModel.updated_at))

            result = await self.session.execute(week_stmt)
            rows = result.all()

            for row in rows:
                week_num = int(row.week_num) if row.week_num is not None else 0
                series.append(VelocityPointDTO(
                    label=f"W{week_num}",
                    completed_count=row.completed_count or 0,
                    completed_points=row.completed_points or 0,
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
        base_conditions = [
            TaskModel.project_id == project_id,
            TaskModel.deleted_at.is_(None),
        ]
        if assignee_ids:
            base_conditions.append(TaskModel.assignee_id.in_(assignee_ids))
        if date_from:
            base_conditions.append(TaskModel.created_at >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            base_conditions.append(TaskModel.created_at <= datetime.combine(date_to, datetime.max.time()))

        items: List[DistributionItemDTO] = []

        if group_by == "status":
            stmt = select(
                BoardColumnModel.name,
                func.count(TaskModel.id),
            ).join(
                BoardColumnModel, TaskModel.column_id == BoardColumnModel.id
            ).where(*base_conditions).group_by(BoardColumnModel.name)

            result = await self.session.execute(stmt)
            rows = result.all()

            for col_name, count in rows:
                name_lower = col_name.lower()
                if "done" in name_lower:
                    color = "--status-done"
                elif "progress" in name_lower or "in_progress" in name_lower:
                    color = "--status-progress"
                else:
                    color = "--status-todo"
                items.append(DistributionItemDTO(label=col_name, count=count, color=color))

        else:  # group_by == "priority"
            stmt = select(
                TaskModel.priority,
                func.count(TaskModel.id),
            ).where(*base_conditions).group_by(TaskModel.priority)

            result = await self.session.execute(stmt)
            rows = result.all()

            priority_colors = {
                "CRITICAL": "--priority-critical",
                "HIGH": "--priority-high",
                "MEDIUM": "--priority-medium",
                "LOW": "--priority-low",
            }

            for priority_val, count in rows:
                label = str(priority_val).upper() if priority_val else "UNKNOWN"
                # Handle enum string like "TaskPriority.HIGH" or just "HIGH"
                if "." in label:
                    label = label.split(".")[-1]
                color = priority_colors.get(label)
                items.append(DistributionItemDTO(label=label, count=count, color=color))

        return DistributionDTO(group_by=group_by, items=items)

    async def get_performance(
        self,
        project_id: int,
        assignee_ids: Optional[List[int]],
        date_from: Optional[date],
        date_to: Optional[date],
    ) -> PerformanceDTO:
        done_col_ids = await self._get_done_column_ids(project_id)

        # Get all assignees with tasks in this project
        assignee_stmt = select(distinct(TaskModel.assignee_id)).where(
            TaskModel.project_id == project_id,
            TaskModel.assignee_id.is_not(None),
            TaskModel.deleted_at.is_(None),
        )
        if assignee_ids:
            assignee_stmt = assignee_stmt.where(TaskModel.assignee_id.in_(assignee_ids))

        assignee_result = await self.session.execute(assignee_stmt)
        member_ids = [row[0] for row in assignee_result.all()]

        members: List[MemberPerformanceDTO] = []

        for member_id in member_ids:
            # Get user info
            user_stmt = select(UserModel).where(UserModel.id == member_id)
            user_result = await self.session.execute(user_stmt)
            user = user_result.scalar_one_or_none()
            if not user:
                continue

            # Assigned count
            assigned_stmt = select(func.count(TaskModel.id)).where(
                TaskModel.project_id == project_id,
                TaskModel.assignee_id == member_id,
                TaskModel.deleted_at.is_(None),
            )
            assigned_result = await self.session.execute(assigned_stmt)
            assigned = assigned_result.scalar() or 0

            # Completed count (in done columns)
            completed = 0
            if done_col_ids:
                completed_conditions = [
                    TaskModel.project_id == project_id,
                    TaskModel.assignee_id == member_id,
                    TaskModel.column_id.in_(done_col_ids),
                    TaskModel.deleted_at.is_(None),
                ]
                if date_from:
                    completed_conditions.append(
                        TaskModel.updated_at >= datetime.combine(date_from, datetime.min.time())
                    )
                if date_to:
                    completed_conditions.append(
                        TaskModel.updated_at <= datetime.combine(date_to, datetime.max.time())
                    )
                completed_stmt = select(func.count(TaskModel.id)).where(*completed_conditions)
                completed_result = await self.session.execute(completed_stmt)
                completed = completed_result.scalar() or 0

            # In-progress count (not done, not deleted)
            in_progress = 0
            if done_col_ids:
                in_progress_stmt = select(func.count(TaskModel.id)).where(
                    TaskModel.project_id == project_id,
                    TaskModel.assignee_id == member_id,
                    TaskModel.column_id.not_in(done_col_ids),
                    TaskModel.deleted_at.is_(None),
                )
            else:
                in_progress_stmt = select(func.count(TaskModel.id)).where(
                    TaskModel.project_id == project_id,
                    TaskModel.assignee_id == member_id,
                    TaskModel.deleted_at.is_(None),
                )
            in_progress_result = await self.session.execute(in_progress_stmt)
            in_progress = in_progress_result.scalar() or 0

            # On-time calculation: fetch completed tasks and evaluate due dates
            on_time_count = 0
            evaluated_count = 0

            if done_col_ids and completed > 0:
                # Fetch completed tasks with due_date or sprint info
                tasks_stmt = select(
                    TaskModel.id,
                    TaskModel.due_date,
                    TaskModel.updated_at,
                    TaskModel.sprint_id,
                ).where(
                    TaskModel.project_id == project_id,
                    TaskModel.assignee_id == member_id,
                    TaskModel.column_id.in_(done_col_ids),
                    TaskModel.deleted_at.is_(None),
                )
                tasks_result = await self.session.execute(tasks_stmt)
                task_rows = tasks_result.all()

                for task_row in task_rows:
                    task_id, due_date, updated_at, sprint_id = task_row
                    if updated_at is None:
                        continue

                    if due_date is not None:
                        # Check if completed on or before due_date
                        completed_date = updated_at.date() if hasattr(updated_at, 'date') else updated_at
                        due = due_date.date() if hasattr(due_date, 'date') else due_date
                        evaluated_count += 1
                        if completed_date <= due:
                            on_time_count += 1
                    elif sprint_id is not None:
                        # Check against sprint end_date
                        sprint_stmt = select(SprintModel.end_date).where(SprintModel.id == sprint_id)
                        sprint_result = await self.session.execute(sprint_stmt)
                        sprint_end = sprint_result.scalar_one_or_none()
                        if sprint_end is not None:
                            completed_date = updated_at.date() if hasattr(updated_at, 'date') else updated_at
                            evaluated_count += 1
                            if completed_date <= sprint_end:
                                on_time_count += 1

            on_time_pct = round((on_time_count / evaluated_count) * 100, 1) if evaluated_count > 0 else 0.0

            members.append(MemberPerformanceDTO(
                user_id=member_id,
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
        # Aliases for joining users twice (assignee and reporter)
        AssigneeModel = UserModel
        from sqlalchemy.orm import aliased
        ReporterModel = aliased(UserModel)
        AssigneeModelAlias = aliased(UserModel)

        stmt = select(
            TaskModel.task_key,
            TaskModel.title,
            BoardColumnModel.name.label("status"),
            AssigneeModelAlias.full_name.label("assignee"),
            TaskModel.priority,
            SprintModel.name.label("sprint"),
            TaskModel.points,
            TaskModel.created_at,
            TaskModel.due_date,
            TaskModel.updated_at,
            ReporterModel.full_name.label("reporter"),
        ).outerjoin(
            BoardColumnModel, TaskModel.column_id == BoardColumnModel.id
        ).outerjoin(
            AssigneeModelAlias, TaskModel.assignee_id == AssigneeModelAlias.id
        ).outerjoin(
            SprintModel, TaskModel.sprint_id == SprintModel.id
        ).outerjoin(
            ReporterModel, TaskModel.reporter_id == ReporterModel.id
        ).where(
            TaskModel.project_id == project_id,
            TaskModel.deleted_at.is_(None),
        )

        if assignee_ids:
            stmt = stmt.where(TaskModel.assignee_id.in_(assignee_ids))
        if date_from:
            stmt = stmt.where(TaskModel.created_at >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            stmt = stmt.where(TaskModel.created_at <= datetime.combine(date_to, datetime.max.time()))

        result = await self.session.execute(stmt)
        rows = result.all()

        export_rows: List[TaskExportRowDTO] = []
        for row in rows:
            priority_str = None
            if row.priority is not None:
                p = str(row.priority)
                priority_str = p.split(".")[-1] if "." in p else p

            export_rows.append(TaskExportRowDTO(
                task_key=row.task_key,
                title=row.title,
                status=row.status,
                assignee=row.assignee,
                priority=priority_str,
                sprint=row.sprint,
                points=row.points,
                created_at=row.created_at,
                due_date=row.due_date,
                updated_at=row.updated_at,
                reporter=row.reporter,
            ))

        return export_rows
