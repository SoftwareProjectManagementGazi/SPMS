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
    key: str
    name: str
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    methodology: Methodology
    manager_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
