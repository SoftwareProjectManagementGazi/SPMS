from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, case, func, and_
from sqlalchemy.orm import joinedload

from app.domain.entities.sprint import Sprint, SprintStatus
from app.domain.repositories.sprint_repository import ISprintRepository
from app.infrastructure.database.models.sprint import SprintModel
from app.infrastructure.database.models.sprint_snapshot import SprintSnapshotModel
from app.infrastructure.database.models.task import TaskModel
from app.infrastructure.database.models.board_column import BoardColumnModel


class SqlAlchemySprintRepository(ISprintRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _get_done_column_ids(self, project_id: int) -> List[int]:
        stmt = select(BoardColumnModel.id).where(
            BoardColumnModel.project_id == project_id,
            BoardColumnModel.name.ilike("%done%"),
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    def _row_to_entity(self, model: SprintModel, task_count: int = 0, completed_count: int = 0, total_points: int = 0) -> Sprint:
        """Convert ORM model + aggregate stats to domain entity."""
        raw_status = getattr(model, "status", None) or "PLANNED"
        try:
            status = SprintStatus(raw_status)
        except ValueError:
            status = SprintStatus.PLANNED

        return Sprint(
            id=model.id,
            project_id=model.project_id,
            name=model.name,
            goal=model.goal,
            start_date=model.start_date,
            end_date=model.end_date,
            is_active=model.is_active,
            status=status,
            created_at=model.created_at,
            task_count=task_count,
            completed_count=completed_count,
            total_points=total_points,
        )

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    async def get_by_id(self, sprint_id: int) -> Optional[Sprint]:
        stmt = (
            select(SprintModel)
            .where(SprintModel.id == sprint_id)
            .options(joinedload(SprintModel.project))
        )
        result = await self.session.execute(stmt)
        model = result.unique().scalar_one_or_none()
        if model is None:
            return None

        # Fetch stats for this single sprint
        project_id = model.project_id
        done_ids = await self._get_done_column_ids(project_id) if project_id else []

        base_cond = [TaskModel.sprint_id == sprint_id, TaskModel.is_deleted == False]
        total_stmt = select(func.count(TaskModel.id)).where(*base_cond)
        total_res = await self.session.execute(total_stmt)
        task_count = total_res.scalar() or 0

        completed_count = 0
        total_points = 0
        if done_ids:
            comp_stmt = select(func.count(TaskModel.id)).where(
                *base_cond, TaskModel.column_id.in_(done_ids)
            )
            comp_res = await self.session.execute(comp_stmt)
            completed_count = comp_res.scalar() or 0

        pts_stmt = select(func.coalesce(func.sum(TaskModel.points), 0)).where(*base_cond)
        pts_res = await self.session.execute(pts_stmt)
        total_points = pts_res.scalar() or 0

        return self._row_to_entity(model, task_count, completed_count, total_points)

    async def get_by_project(self, project_id: int) -> List[Sprint]:
        """Return all sprints for a project with aggregate task stats in one query."""
        done_ids = await self._get_done_column_ids(project_id)

        # Build completed_count expression — case() needs a list of (condition, value) tuples
        if done_ids:
            completed_expr = func.count(
                case((TaskModel.column_id.in_(done_ids), TaskModel.id))
            )
        else:
            completed_expr = func.cast(0, type_=func.count(TaskModel.id).type)

        stmt = (
            select(
                SprintModel,
                func.count(TaskModel.id).label("task_count"),
                completed_expr.label("completed_count"),
                func.coalesce(func.sum(TaskModel.points), 0).label("total_points"),
            )
            .outerjoin(
                TaskModel,
                and_(
                    TaskModel.sprint_id == SprintModel.id,
                    TaskModel.is_deleted == False,
                ),
            )
            .where(SprintModel.project_id == project_id)
            .group_by(SprintModel.id)
            .order_by(SprintModel.start_date)
        )

        result = await self.session.execute(stmt)
        rows = result.all()
        return [
            self._row_to_entity(row[0], row[1] or 0, row[2] or 0, row[3] or 0)
            for row in rows
        ]

    async def get_active_sprint(self, project_id: int) -> Optional[Sprint]:
        """Return the ACTIVE sprint for a project, or None."""
        stmt = (
            select(SprintModel)
            .where(
                SprintModel.project_id == project_id,
                SprintModel.status == SprintStatus.ACTIVE.value,
            )
            .limit(1)
        )
        result = await self.session.execute(stmt)
        model = result.scalars().first()
        return self._row_to_entity(model) if model else None

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------

    async def create(self, sprint: Sprint) -> Sprint:
        model = SprintModel(
            project_id=sprint.project_id,
            name=sprint.name,
            goal=sprint.goal,
            start_date=sprint.start_date,
            end_date=sprint.end_date,
            is_active=sprint.is_active,
            status=sprint.status.value,
        )
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()

        stmt = select(SprintModel).where(SprintModel.id == model.id)
        result = await self.session.execute(stmt)
        refreshed = result.scalar_one()
        return self._row_to_entity(refreshed)

    async def update(self, sprint_id: int, fields: dict) -> Optional[Sprint]:
        stmt = select(SprintModel).where(SprintModel.id == sprint_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        updatable_fields = ["name", "goal", "start_date", "end_date", "is_active", "status"]
        for field in updatable_fields:
            if field in fields:
                value = fields[field]
                # Coerce SprintStatus enum to its string value for the DB column
                if field == "status" and isinstance(value, SprintStatus):
                    value = value.value
                setattr(model, field, value)

        await self.session.flush()
        await self.session.commit()

        stmt2 = select(SprintModel).where(SprintModel.id == sprint_id)
        result2 = await self.session.execute(stmt2)
        refreshed = result2.scalar_one()
        return self._row_to_entity(refreshed)

    async def delete(self, sprint_id: int) -> bool:
        stmt = select(SprintModel).where(SprintModel.id == sprint_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            return False
        await self.session.delete(model)
        await self.session.commit()
        return True

    async def move_tasks_to_sprint(
        self,
        from_sprint_id: int,
        to_sprint_id: Optional[int],
        incomplete_only: bool = False,
    ) -> int:
        """Move tasks from one sprint to another (or backlog if to_sprint_id is None).
        Returns the count of tasks moved.
        If incomplete_only is True, only moves tasks not in a 'Done' column.
        """
        base_conditions = [
            TaskModel.sprint_id == from_sprint_id,
            TaskModel.is_deleted == False,
        ]

        if incomplete_only:
            sprint_stmt = select(SprintModel).where(SprintModel.id == from_sprint_id)
            sprint_result = await self.session.execute(sprint_stmt)
            sprint_model = sprint_result.scalar_one_or_none()

            if sprint_model is not None:
                done_cols_stmt = select(BoardColumnModel.id).where(
                    BoardColumnModel.project_id == sprint_model.project_id,
                    BoardColumnModel.name.ilike("%done%"),
                )
                done_cols_result = await self.session.execute(done_cols_stmt)
                done_column_ids = list(done_cols_result.scalars().all())

                if done_column_ids:
                    base_conditions.append(TaskModel.column_id.notin_(done_column_ids))

        count_stmt = select(TaskModel.id).where(*base_conditions)
        count_result = await self.session.execute(count_stmt)
        task_ids = list(count_result.scalars().all())

        if task_ids:
            update_stmt = (
                update(TaskModel)
                .where(TaskModel.id.in_(task_ids))
                .values(sprint_id=to_sprint_id)
            )
            await self.session.execute(update_stmt)
            await self.session.commit()

        return len(task_ids)

    async def create_snapshot(
        self,
        sprint_id: int,
        project_id: int,
        task_count: int,
        completed_count: int,
        total_points: int,
    ) -> None:
        """Persist a point-in-time snapshot of sprint stats at close time.
        Idempotent — if a snapshot already exists for this sprint, it is a no-op.
        """
        existing = await self.session.execute(
            select(SprintSnapshotModel).where(SprintSnapshotModel.sprint_id == sprint_id)
        )
        if existing.scalar_one_or_none() is not None:
            return  # Already snapshotted

        snapshot = SprintSnapshotModel(
            sprint_id=sprint_id,
            project_id=project_id,
            task_count=task_count,
            completed_count=completed_count,
            total_points=total_points,
        )
        self.session.add(snapshot)
        await self.session.flush()
        await self.session.commit()
