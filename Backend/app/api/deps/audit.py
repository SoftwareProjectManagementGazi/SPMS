"""Audit log repository DI factory.

Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session
from app.domain.repositories.audit_repository import IAuditRepository
from app.infrastructure.database.repositories.audit_repo import SqlAlchemyAuditRepository


def get_audit_repo(session: AsyncSession = Depends(get_db_session)) -> IAuditRepository:
    return SqlAlchemyAuditRepository(session)


__all__ = ["get_audit_repo"]
