from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime

class User(BaseModel):
    id: Optional[int] = None
    email: EmailStr
    password_hash: str
    full_name: str
    avatar: Optional[str] = None
    is_active: bool = True
    role_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
