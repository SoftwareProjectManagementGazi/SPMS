from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class Team(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    owner_id: int
    leader_id: Optional[int] = None
    color: str = "#3b82f6"
    department: Optional[str] = None
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
