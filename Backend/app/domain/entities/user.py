from __future__ import annotations 
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from app.domain.entities.role import Role

class User(BaseModel):
    id: Optional[int] = None
    email: EmailStr
    password_hash: str
    full_name: str
    avatar: Optional[str] = None
    is_active: bool = True
    role_id: Optional[int] = None

    role: Optional[Role] = None

    # Phase 15 RBAC-01 (Pitfall 18): JWT permissions[] claim. Claim-only field;
    # populated by get_current_user from JWT (Plan 15-06). DO NOT persist to DB.
    # Default empty list defends against None.
    permissions: list[str] = []

    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)