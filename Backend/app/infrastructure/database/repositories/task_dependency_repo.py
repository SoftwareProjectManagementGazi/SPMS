from typing import Dict, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.domain.entities.task_dependency import TaskDependency
from app.infrastructure.database.models.task_dependency import TaskDependencyModel
from app.domain.exceptions import DependencyAlreadyExistsError


class SqlAlchemyTaskDependencyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: TaskDependencyModel) -> TaskDependency:
        return TaskDependency(
            id=model.id,
            task_id=model.task_id,
            depends_on_id=model.depends_on_id,
            dependency_type=model.dependency_type,
        )

    async def add(self, task_id: int, depends_on_id: int, dep_type: str = "blocks") -> TaskDependency:
        # Prevent self-dependency
        if depends_on_id == task_id:
            raise ValueError("Self-dependency not allowed")

        # Prevent direct circular dependency
        existing_stmt = select(TaskDependencyModel).where(
            TaskDependencyModel.task_id == depends_on_id,
            TaskDependencyModel.depends_on_id == task_id,
        )
        result = await self.session.execute(existing_stmt)
        if result.scalar_one_or_none():
            raise ValueError("Circular dependency: reverse dependency already exists")

        model = TaskDependencyModel(
            task_id=task_id,
            depends_on_id=depends_on_id,
            dependency_type=dep_type,
        )
        self.session.add(model)
        try:
            await self.session.flush()
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise DependencyAlreadyExistsError(task_id, depends_on_id)

        return self._to_entity(model)

    async def remove(self, dependency_id: int) -> bool:
        stmt = select(TaskDependencyModel).where(TaskDependencyModel.id == dependency_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model:
            await self.session.delete(model)
            await self.session.commit()
            return True
        return False

    async def list_for_task(self, task_id: int) -> Dict[str, List[TaskDependency]]:
        # blocks: this task blocks other tasks (task_id = task_id)
        blocks_stmt = select(TaskDependencyModel).where(TaskDependencyModel.task_id == task_id)
        blocks_result = await self.session.execute(blocks_stmt)
        blocks = [self._to_entity(m) for m in blocks_result.scalars().all()]

        # blocked_by: other tasks block this task (depends_on_id = task_id)
        blocked_by_stmt = select(TaskDependencyModel).where(TaskDependencyModel.depends_on_id == task_id)
        blocked_by_result = await self.session.execute(blocked_by_stmt)
        blocked_by = [self._to_entity(m) for m in blocked_by_result.scalars().all()]

        return {"blocks": blocks, "blocked_by": blocked_by}
