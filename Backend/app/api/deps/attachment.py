"""Attachment repository DI factory.

Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session
from app.domain.repositories.attachment_repository import IAttachmentRepository
from app.infrastructure.database.repositories.attachment_repo import SqlAlchemyAttachmentRepository


def get_attachment_repo(session: AsyncSession = Depends(get_db_session)) -> IAttachmentRepository:
    return SqlAlchemyAttachmentRepository(session)


__all__ = ["get_attachment_repo"]
