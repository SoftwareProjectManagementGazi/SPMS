from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.domain.entities.board_column import BoardColumn
from app.domain.repositories.board_column_repository import IBoardColumnRepository
from app.infrastructure.database.models.board_column import BoardColumnModel
from app.infrastructure.database.models.task import TaskModel


class SqlAlchemyBoardColumnRepository(IBoardColumnRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: BoardColumnModel) -> BoardColumn:
        return BoardColumn.model_validate(model)

    async def get_by_project(self, project_id: int) -> List[BoardColumn]:
        stmt = (
            select(BoardColumnModel)
            .where(BoardColumnModel.project_id == project_id)
            .order_by(BoardColumnModel.order_index.asc())
        )
        result = await self.session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def get_by_id(self, column_id: int) -> Optional[BoardColumn]:
        stmt = select(BoardColumnModel).where(BoardColumnModel.id == column_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def create(self, column: BoardColumn) -> BoardColumn:
        model = BoardColumnModel(
            project_id=column.project_id,
            name=column.name,
            order_index=column.order_index,
            wip_limit=column.wip_limit,
        )
        self.session.add(model)
        await self.session.flush()
        await self.session.commit()

        # Re-fetch to get all columns populated
        stmt = select(BoardColumnModel).where(BoardColumnModel.id == model.id)
        result = await self.session.execute(stmt)
        refreshed = result.scalar_one()
        return self._to_entity(refreshed)

    async def update(self, column: BoardColumn) -> BoardColumn:
        stmt = select(BoardColumnModel).where(BoardColumnModel.id == column.id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            raise ValueError(f"BoardColumn {column.id} not found")

        if column.name is not None:
            model.name = column.name
        if column.order_index is not None:
            model.order_index = column.order_index
        if column.wip_limit is not None:
            model.wip_limit = column.wip_limit

        await self.session.flush()
        await self.session.commit()

        # Re-fetch to return fresh entity
        stmt2 = select(BoardColumnModel).where(BoardColumnModel.id == column.id)
        result2 = await self.session.execute(stmt2)
        refreshed = result2.scalar_one()
        return self._to_entity(refreshed)

    async def delete(self, column_id: int) -> None:
        stmt = select(BoardColumnModel).where(BoardColumnModel.id == column_id)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is not None:
            await self.session.delete(model)
            await self.session.commit()

    async def count_tasks(self, column_id: int) -> int:
        """Count non-deleted tasks assigned to the given column."""
        stmt = (
            select(func.count())
            .select_from(TaskModel)
            .where(
                TaskModel.column_id == column_id,
                TaskModel.is_deleted == False,
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()
