"""Artifact DI per D-31 / BACK-07."""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database.database import get_db_session
from app.domain.repositories.artifact_repository import IArtifactRepository
from app.infrastructure.database.repositories.artifact_repo import SqlAlchemyArtifactRepository


def get_artifact_repo(session: AsyncSession = Depends(get_db_session)) -> IArtifactRepository:
    return SqlAlchemyArtifactRepository(session)


__all__ = ["get_artifact_repo"]
