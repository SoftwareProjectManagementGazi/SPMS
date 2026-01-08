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
    
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)