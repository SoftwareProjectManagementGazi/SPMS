from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.domain.entities.sprint import Sprint
from app.domain.repositories.sprint_repository import ISprintRepository
from app.infrastructure.database.models.sprint import SprintModel


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
