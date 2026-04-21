"""Process template repository DI factory.

Lazy import inside function to avoid circular deps at module load time.
Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.database import get_db_session


def get_process_template_repo(session: AsyncSession = Depends(get_db_session)):
    from app.infrastructure.database.repositories.process_template_repo import SqlAlchemyProcessTemplateRepository
    return SqlAlchemyProcessTemplateRepository(session)


__all__ = ["get_process_template_repo"]
