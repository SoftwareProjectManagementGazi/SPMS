from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class Sprint(BaseModel):
    id: Optional[int] = None
    project_id: Optional[int] = None
    name: str
    goal: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = False
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
