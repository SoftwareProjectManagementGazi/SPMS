from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

class Methodology(str, Enum):
    SCRUM = "SCRUM"
    KANBAN = "KANBAN"
    WATERFALL = "WATERFALL"

class Project(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    methodology: Methodology
    owner_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
