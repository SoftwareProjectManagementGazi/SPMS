from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum
from app.domain.entities.board_column import BoardColumn

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
    columns: List[BoardColumn] = []

    model_config = ConfigDict(from_attributes=True)
