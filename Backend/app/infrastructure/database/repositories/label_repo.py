"""SQLAlchemy implementation of ILabelRepository — Phase 11 D-51.

Analog: app.infrastructure.database.repositories.board_column_repo.SqlAlchemyBoardColumnRepository.
The list_by_project method joins the task_labels association table to compute
usage_count via a subquery so the frontend tag chip input (Plan 11-02) can
show usage counts without a second round-trip.
"""
from typing import List, Optional

from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.label import Label
from app.domain.repositories.label_repository import ILabelRepository
from app.infrastructure.database.models.label import LabelModel, task_labels


class SqlAlchemyLabelRepository(ILabelRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _model_to_entity(self, model: LabelModel, usage_count: int = 0) -> Label:
        """Map a LabelModel row into the Label domain entity."""
        return Label(
            id=model.id,
            project_id=model.project_id,
            name=model.name,
            color=model.color,
            usage_count=int(usage_count or 0),
        )

    async def list_by_project(self, project_id: int) -> List[Label]:
        # Subquery: count tasks per label
        usage = (
            select(
                task_labels.c.label_id,
                sqlfunc.count(task_labels.c.task_id).label("cnt"),
            )
            .group_by(task_labels.c.label_id)
            .subquery()
        )
        stmt = (
            select(LabelModel, sqlfunc.coalesce(usage.c.cnt, 0).label("usage_count"))
            .join(usage, usage.c.label_id == LabelModel.id, isouter=True)
            .where(LabelModel.project_id == project_id)
            .order_by(LabelModel.name.asc())
        )
        result = await self.session.execute(stmt)
        rows = result.all()
        return [self._model_to_entity(model, cnt) for model, cnt in rows]

    async def get_by_name_in_project(
        self, project_id: int, name: str
    ) -> Optional[Label]:
        stmt = select(LabelModel).where(
            LabelModel.project_id == project_id,
            LabelModel.name == name,
        )
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            return None
        return self._model_to_entity(model, 0)

    async def create(self, project_id: int, name: str, color: str) -> Label:
        model = LabelModel(project_id=project_id, name=name, color=color)
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()
        # Re-fetch to ensure all columns populated (mirrors board_column repo pattern)
        stmt = select(LabelModel).where(LabelModel.id == model.id)
        result = await self.session.execute(stmt)
        refreshed = result.scalar_one()
        return self._model_to_entity(refreshed, 0)
