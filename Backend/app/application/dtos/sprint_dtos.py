from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date
from app.domain.entities.sprint import SprintStatus


class SprintCreateDTO(BaseModel):
    project_id: int
    name: str
    goal: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SprintUpdateDTO(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    # is_active kept for backward compat but status is the canonical field now
    is_active: Optional[bool] = None


class SprintResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    goal: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool
    status: SprintStatus

    # Aggregate stats (populated from DB join)
    task_count: int = 0
    completed_count: int = 0
    total_points: int = 0
