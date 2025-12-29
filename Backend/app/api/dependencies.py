# Dependency Injection Container
# This file will map interfaces to implementations
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database.database import get_db_session
from app.domain.repositories.user_repository import IUserRepository
from app.infrastructure.database.repositories.user_repo import SqlAlchemyUserRepository
from app.application.ports.security_port import ISecurityService
from app.infrastructure.adapters.security_adapter import SecurityAdapter

# Re-export the database dependency
get_db = get_db_session

def get_user_repo(session: AsyncSession = Depends(get_db)) -> IUserRepository:
    return SqlAlchemyUserRepository(session)

def get_security_service() -> ISecurityService:
    return SecurityAdapter()
