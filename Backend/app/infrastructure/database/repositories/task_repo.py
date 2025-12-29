from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.domain.entities.task import Task
from app.domain.repositories.task_repository import ITaskRepository
from app.infrastructure.database.models.task import TaskModel

class SqlAlchemyTaskRepository(ITaskRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: TaskModel) -> Task:
        return Task.model_validate(model)

    def _to_model(self, entity: Task) -> TaskModel:
        data = entity.model_dump(exclude={"id", "created_at"})
        return TaskModel(**data)

    async def create(self, task: Task) -> Task:
        model = self._to_model(task)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return self._to_entity(model)

    async def get_by_id(self, task_id: int) -> Optional[Task]:
        stmt = select(TaskModel).where(TaskModel.id == task_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_all_by_project(self, project_id: int) -> List[Task]:
        stmt = select(TaskModel).where(TaskModel.project_id == project_id)
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]
    
    async def get_all_by_assignee(self, assignee_id: int) -> List[Task]:
        stmt = select(TaskModel).where(TaskModel.assignee_id == assignee_id)
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def update(self, task: Task) -> Task:
        stmt = select(TaskModel).where(TaskModel.id == task.id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        
        if model:
            model.title = task.title
            model.description = task.description
            model.status = task.status
            model.priority = task.priority
            model.due_date = task.due_date
            model.assignee_id = task.assignee_id
            # Project ID usually doesn't change, but can be added if needed
            
            await self.session.flush()
            await self.session.refresh(model)
            return self._to_entity(model)
        return task

    async def delete(self, task_id: int) -> bool:
        stmt = delete(TaskModel).where(TaskModel.id == task_id)
        result = await self.session.execute(stmt)
        return result.rowcount > 0
