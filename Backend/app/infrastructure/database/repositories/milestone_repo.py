"""BACK-04 / D-38: SqlAlchemy impl of IMilestoneRepository with GIN-backed JSONB queries."""
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.milestone import Milestone
from app.domain.repositories.milestone_repository import IMilestoneRepository
from app.infrastructure.database.models.milestone import MilestoneModel


class SqlAlchemyMilestoneRepository(IMilestoneRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: MilestoneModel) -> Milestone:
        return Milestone.model_validate(model)

    def _to_model(self, entity: Milestone) -> MilestoneModel:
        # D-24: dedupe linked_phase_ids on write, preserve order
        entity.linked_phase_ids = list(dict.fromkeys(entity.linked_phase_ids))
        data = entity.model_dump(exclude={"id", "created_at", "updated_at"})
        return MilestoneModel(**data)

    def _base_query(self):
        return select(MilestoneModel).where(MilestoneModel.is_deleted == False)  # noqa: E712

    async def create(self, milestone: Milestone) -> Milestone:
        model = self._to_model(milestone)
        self.session.add(model)
        await self.session.flush()
        refreshed = await self.get_by_id(model.id)
        if refreshed is None:
            raise RuntimeError(f"Milestone {model.id} disappeared after flush")
        return refreshed

    async def get_by_id(self, milestone_id: int) -> Optional[Milestone]:
        stmt = self._base_query().where(MilestoneModel.id == milestone_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_project(self, project_id: int) -> List[Milestone]:
        stmt = self._base_query().where(MilestoneModel.project_id == project_id)
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def list_by_phase(self, project_id: int, phase_id: str) -> List[Milestone]:
        """D-38 / Pitfall 6: use JSONB `@>` containment (GIN-indexed) NOT equality.
        SQLAlchemy `.contains([phase_id])` translates to Postgres `@> '["nd_abc"]'`."""
        stmt = (
            self._base_query()
            .where(MilestoneModel.project_id == project_id)
            .where(MilestoneModel.linked_phase_ids.contains([phase_id]))
        )
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def update(self, milestone: Milestone) -> Milestone:
        stmt = self._base_query().where(MilestoneModel.id == milestone.id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            raise ValueError(f"Milestone {milestone.id} not found for update")
        # D-24 dedupe
        milestone.linked_phase_ids = list(dict.fromkeys(milestone.linked_phase_ids))
        model.name = milestone.name
        model.description = milestone.description
        model.target_date = milestone.target_date
        model.status = milestone.status.value
        model.linked_phase_ids = milestone.linked_phase_ids
        model.updated_at = datetime.utcnow()
        await self.session.flush()
        return self._to_entity(model)

    async def delete(self, milestone_id: int) -> bool:
        stmt = self._base_query().where(MilestoneModel.id == milestone_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            return False
        model.is_deleted = True
        model.deleted_at = datetime.utcnow()
        await self.session.flush()
        return True
