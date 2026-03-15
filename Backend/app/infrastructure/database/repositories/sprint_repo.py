from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import joinedload

from app.domain.entities.sprint import Sprint
from app.domain.repositories.sprint_repository import ISprintRepository
from app.infrastructure.database.models.sprint import SprintModel
from app.infrastructure.database.models.task import TaskModel
from app.infrastructure.database.models.board_column import BoardColumnModel


class SqlAlchemySprintRepository(ISprintRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: SprintModel) -> Sprint:
        return Sprint.model_validate(model)

    async def get_by_id(self, sprint_id: int) -> Optional[Sprint]:
        stmt = (
            select(SprintModel)
            .where(SprintModel.id == sprint_id)
            .options(joinedload(SprintModel.project))
        )
        result = await self.session.execute(stmt)
        model = result.unique().scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_project(self, project_id: int) -> List[Sprint]:
        stmt = (
            select(SprintModel)
            .where(SprintModel.project_id == project_id)
            .order_by(SprintModel.start_date)
        )
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def create(self, sprint: Sprint) -> Sprint:
        model = SprintModel(
            project_id=sprint.project_id,
            name=sprint.name,
            goal=sprint.goal,
            start_date=sprint.start_date,
            end_date=sprint.end_date,
            is_active=sprint.is_active,
        )
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()

        # Re-fetch to get all columns populated
        stmt = select(SprintModel).where(SprintModel.id == model.id)
        result = await self.session.execute(stmt)
        refreshed = result.scalar_one()
        return self._to_entity(refreshed)

    async def update(self, sprint_id: int, fields: dict) -> Optional[Sprint]:
        stmt = select(SprintModel).where(SprintModel.id == sprint_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        updatable_fields = ["name", "goal", "start_date", "end_date", "is_active"]
        for field in updatable_fields:
            if field in fields:
                setattr(model, field, fields[field])

        await self.session.flush()
        await self.session.commit()

        # Re-fetch to return fresh entity
        stmt2 = select(SprintModel).where(SprintModel.id == sprint_id)
        result2 = await self.session.execute(stmt2)
        refreshed = result2.scalar_one()
        return self._to_entity(refreshed)

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
        # Base filter: tasks in the source sprint that are not soft-deleted
        base_conditions = [
            TaskModel.sprint_id == from_sprint_id,
            TaskModel.is_deleted == False,
        ]

        if incomplete_only:
            # Find the project_id from the sprint
            sprint_stmt = select(SprintModel).where(SprintModel.id == from_sprint_id)
            sprint_result = await self.session.execute(sprint_stmt)
            sprint_model = sprint_result.scalar_one_or_none()

            if sprint_model is not None:
                # Find done column ids for this project (case-insensitive 'done' match)
                done_cols_stmt = select(BoardColumnModel.id).where(
                    BoardColumnModel.project_id == sprint_model.project_id,
                    BoardColumnModel.name.ilike("%done%"),
                )
                done_cols_result = await self.session.execute(done_cols_stmt)
                done_column_ids = list(done_cols_result.scalars().all())

                if done_column_ids:
                    base_conditions.append(TaskModel.column_id.notin_(done_column_ids))

        # Count tasks to be moved
        count_stmt = (
            select(TaskModel.id)
            .where(*base_conditions)
        )
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
