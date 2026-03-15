from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.board_column import BoardColumn


class IBoardColumnRepository(ABC):
    @abstractmethod
    async def get_by_project(self, project_id: int) -> List[BoardColumn]:
        """Return columns for the project ordered by order_index ASC."""
        ...

    @abstractmethod
    async def get_by_id(self, column_id: int) -> Optional[BoardColumn]:
        ...

    @abstractmethod
    async def create(self, column: BoardColumn) -> BoardColumn:
        ...

    @abstractmethod
    async def update(self, column: BoardColumn) -> BoardColumn:
        ...

    @abstractmethod
    async def delete(self, column_id: int) -> None:
        ...

    @abstractmethod
    async def count_tasks(self, column_id: int) -> int:
        """Count non-deleted tasks with column_id = column_id."""
        ...
