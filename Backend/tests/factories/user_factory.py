"""User entity factory."""
from datetime import datetime
from typing import Any, Optional
from app.domain.entities.user import User

_counter = {"value": 0}


def make_user(
    email: Optional[str] = None,
    full_name: str = "Test User",
    password_hash: str = "$2b$12$testhashtesthashtesthashtesthashtesthashtesthashtesthash",
    is_active: bool = True,
    role_id: Optional[int] = None,
    id: Optional[int] = None,
    **extra: Any,
) -> User:
    _counter["value"] += 1
    n = _counter["value"]
    return User(
        id=id,
        email=email or f"user{n}@testexample.com",
        full_name=full_name,
        password_hash=password_hash,
        is_active=is_active,
        role_id=role_id,
        created_at=extra.get("created_at", datetime.utcnow()),
    )
