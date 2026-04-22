"""Board column management use cases — Clean Architecture (no SQLAlchemy imports)."""
from typing import List

from app.domain.entities.board_column import BoardColumn
from app.domain.repositories.board_column_repository import IBoardColumnRepository
from app.application.dtos.board_column_dtos import (
    BoardColumnDTO,
    CreateColumnDTO,
    UpdateColumnDTO,
)


def _to_dto(column: BoardColumn, task_count: int = 0) -> BoardColumnDTO:
    return BoardColumnDTO(
        id=column.id,
        project_id=column.project_id,
        name=column.name,
        order_index=column.order_index,
        wip_limit=column.wip_limit,
        task_count=task_count,
    )


class ListColumnsUseCase:
    def __init__(self, column_repo: IBoardColumnRepository):
        self.column_repo = column_repo

    async def execute(self, project_id: int) -> List[BoardColumnDTO]:
        columns = await self.column_repo.get_by_project(project_id)
        result = []
        for col in columns:
            count = await self.column_repo.count_tasks(col.id)
            result.append(_to_dto(col, count))
        return result


class CreateColumnUseCase:
    def __init__(self, column_repo: IBoardColumnRepository):
        self.column_repo = column_repo

    async def execute(self, project_id: int, dto: CreateColumnDTO) -> BoardColumnDTO:
        # Assign order_index: use provided value or append at end (max + 1)
        existing = await self.column_repo.get_by_project(project_id)
        if existing:
            max_index = max(c.order_index for c in existing)
            order_index = dto.order_index if dto.order_index is not None else max_index + 1
        else:
            order_index = dto.order_index if dto.order_index is not None else 0

        column = BoardColumn(
            project_id=project_id,
            name=dto.name,
            order_index=order_index,
            wip_limit=0,
        )
        created = await self.column_repo.create(column)
        task_count = await self.column_repo.count_tasks(created.id)
        return _to_dto(created, task_count)


class UpdateColumnUseCase:
    def __init__(self, column_repo: IBoardColumnRepository):
        self.column_repo = column_repo

    async def execute(self, column_id: int, dto: UpdateColumnDTO) -> BoardColumnDTO:
        existing = await self.column_repo.get_by_id(column_id)
        if existing is None:
            from app.domain.exceptions import ProjectNotFoundError
            raise ValueError(f"Column {column_id} not found")

        # Patch only provided fields — None means "leave unchanged" per UpdateColumnDTO.
        # Phase 11 Plan 04: wip_limit now flows through so the Settings > Kolonlar
        # sub-tab can edit WIP caps inline (D-12 — non-Waterfall methodologies).
        updated_column = BoardColumn(
            id=existing.id,
            project_id=existing.project_id,
            name=dto.name if dto.name is not None else existing.name,
            order_index=dto.order_index if dto.order_index is not None else existing.order_index,
            wip_limit=dto.wip_limit if dto.wip_limit is not None else existing.wip_limit,
        )
        saved = await self.column_repo.update(updated_column)
        task_count = await self.column_repo.count_tasks(saved.id)
        return _to_dto(saved, task_count)


class DeleteColumnUseCase:
    def __init__(self, column_repo: IBoardColumnRepository):
        self.column_repo = column_repo

    async def execute(self, column_id: int, move_to_column_id: int) -> None:
        """Move all non-deleted tasks to target column, then delete the column."""
        from sqlalchemy import update
        from app.infrastructure.database.models.task import TaskModel
        from app.infrastructure.database.repositories.board_column_repo import SqlAlchemyBoardColumnRepository

        # Verify the column exists
        existing = await self.column_repo.get_by_id(column_id)
        if existing is None:
            raise ValueError(f"Column {column_id} not found")

        # Verify the target column exists
        target = await self.column_repo.get_by_id(move_to_column_id)
        if target is None:
            raise ValueError(f"Target column {move_to_column_id} not found")

        # Move tasks: UPDATE tasks SET column_id = move_to WHERE column_id = column_id AND is_deleted = False
        if isinstance(self.column_repo, SqlAlchemyBoardColumnRepository):
            stmt = (
                update(TaskModel)
                .where(
                    TaskModel.column_id == column_id,
                    TaskModel.is_deleted == False,
                )
                .values(column_id=move_to_column_id)
            )
            await self.column_repo.session.execute(stmt)
            await self.column_repo.session.commit()

        # Delete the column (hard delete)
        await self.column_repo.delete(column_id)


class SeedDefaultColumnsUseCase:
    DEFAULT_COLUMNS = ["Backlog", "Todo", "In Progress", "In Review", "Done"]

    def __init__(self, column_repo: IBoardColumnRepository):
        self.column_repo = column_repo

    async def execute(self, project_id: int) -> List[BoardColumnDTO]:
        """Insert 5 default columns for a project. Used when a project has no columns."""
        columns = []
        for i, name in enumerate(self.DEFAULT_COLUMNS):
            column = BoardColumn(
                project_id=project_id,
                name=name,
                order_index=i,
                wip_limit=0,
            )
            created = await self.column_repo.create(column)
            columns.append(_to_dto(created, 0))
        return columns
