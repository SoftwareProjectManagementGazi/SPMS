"""Board column repository DI factory.

Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session
from app.domain.repositories.board_column_repository import IBoardColumnRepository
from app.infrastructure.database.repositories.board_column_repo import SqlAlchemyBoardColumnRepository


def get_board_column_repo(session: AsyncSession = Depends(get_db_session)) -> IBoardColumnRepository:
    return SqlAlchemyBoardColumnRepository(session)


__all__ = ["get_board_column_repo"]
