"""Authentication DI: oauth2_scheme, get_current_user, role checks.

Split from app.api.dependencies per D-31 (BACK-07).
Legacy import path `from app.api.dependencies import X` still works via shim.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from app.infrastructure.database.database import get_db_session
from app.infrastructure.config import settings
from app.domain.entities.user import User
from app.domain.repositories.user_repository import IUserRepository
from app.api.deps.user import get_user_repo  # cross-sub-module: auth needs user repo

# Re-export get_db for backward compat (used by tasks.py via get_db)
get_db = get_db_session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: IUserRepository = Depends(get_user_repo),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await user_repo.get_by_email(email)
    if user is None:
        raise credentials_exception
    return user


def _is_admin(user: User) -> bool:
    """Return True when the user holds the admin role."""
    return (
        user.role is not None
        and user.role.name.lower() == "admin"
    )


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Raises HTTP 403 if the current user is not an admin."""
    if not _is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


__all__ = ["oauth2_scheme", "get_db", "get_current_user", "_is_admin", "require_admin"]
