"""DeleteColumnUseCase — target-column vs backlog relocation contract."""
from __future__ import annotations

from typing import Optional

import pytest

from app.application.use_cases.manage_board_columns import DeleteColumnUseCase
from app.domain.entities.board_column import BoardColumn


class _FakeColumnRepo:
    """Non-SQLAlchemy repo: the task UPDATE branch is skipped by design;
    these tests pin the validation + delete dispatch behavior."""

    def __init__(self, columns: dict[int, BoardColumn]) -> None:
        self._columns = columns
        self.deleted_id: Optional[int] = None

    async def get_by_id(self, column_id: int) -> Optional[BoardColumn]:
        return self._columns.get(column_id)

    async def delete(self, column_id: int) -> None:
        self.deleted_id = column_id


def _col(cid: int) -> BoardColumn:
    return BoardColumn(id=cid, project_id=1, name=f"K{cid}", order_index=0)


@pytest.mark.asyncio
async def test_delete_with_target_column_validates_and_deletes():
    repo = _FakeColumnRepo({1: _col(1), 2: _col(2)})
    await DeleteColumnUseCase(repo).execute(1, 2)
    assert repo.deleted_id == 1


@pytest.mark.asyncio
async def test_delete_with_missing_target_raises():
    repo = _FakeColumnRepo({1: _col(1)})
    with pytest.raises(ValueError):
        await DeleteColumnUseCase(repo).execute(1, 999)
    assert repo.deleted_id is None


@pytest.mark.asyncio
async def test_delete_to_backlog_skips_target_validation():
    repo = _FakeColumnRepo({1: _col(1)})
    await DeleteColumnUseCase(repo).execute(1, None, move_to_backlog=True)
    assert repo.deleted_id == 1


@pytest.mark.asyncio
async def test_delete_without_target_or_backlog_raises():
    repo = _FakeColumnRepo({1: _col(1)})
    with pytest.raises(ValueError):
        await DeleteColumnUseCase(repo).execute(1, None)
    assert repo.deleted_id is None
