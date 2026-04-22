"""Label repository DI factory — Phase 11 D-51.

Follows the same pattern as app.api.deps.board_column (Phase 9 BACK-07 split).
Legacy import path `from app.api.dependencies import get_label_repo` works via
the shim re-export in app/api/dependencies.py.
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session
from app.domain.repositories.label_repository import ILabelRepository
from app.infrastructure.database.repositories.label_repo import SqlAlchemyLabelRepository


def get_label_repo(session: AsyncSession = Depends(get_db_session)) -> ILabelRepository:
    return SqlAlchemyLabelRepository(session)


__all__ = ["get_label_repo"]
