from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class PasswordResetToken(BaseModel):
    id: Optional[int] = None
    token_hash: str
    user_id: int
    expires_at: datetime
    used_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
