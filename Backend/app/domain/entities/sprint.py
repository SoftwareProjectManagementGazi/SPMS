from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime
from enum import Enum


class SprintStatus(str, Enum):
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"


class Sprint(BaseModel):
    id: Optional[int] = None
    project_id: Optional[int] = None
    name: str
    goal: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = False
    status: SprintStatus = SprintStatus.PLANNED
    created_at: Optional[datetime] = None

    # Stats — populated by repository aggregate query (None when not requested)
    task_count: int = 0
    completed_count: int = 0
    total_points: int = 0

    model_config = ConfigDict(from_attributes=True)
