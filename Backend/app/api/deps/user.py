"""User repository DI factory.

Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session
from app.domain.repositories.user_repository import IUserRepository
from app.infrastructure.database.repositories.user_repo import SqlAlchemyUserRepository


def get_user_repo(session: AsyncSession = Depends(get_db_session)) -> IUserRepository:
    return SqlAlchemyUserRepository(session)


__all__ = ["get_user_repo"]
