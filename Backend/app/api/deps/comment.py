"""Comment repository DI factory.

Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session
from app.domain.repositories.comment_repository import ICommentRepository
from app.infrastructure.database.repositories.comment_repo import SqlAlchemyCommentRepository


def get_comment_repo(session: AsyncSession = Depends(get_db_session)) -> ICommentRepository:
    return SqlAlchemyCommentRepository(session)


__all__ = ["get_comment_repo"]
