"""API-03 User summary DTOs."""
from pydantic import BaseModel, ConfigDict
from typing import Any, Dict, List, Optional


class UserSummaryStatsDTO(BaseModel):
    active_tasks: int = 0
    completed_last_30d: int = 0
    project_count: int = 0


class UserSummaryProjectDTO(BaseModel):
    id: int
    key: str
    name: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class UserSummaryResponseDTO(BaseModel):
    stats: UserSummaryStatsDTO
    projects: List[UserSummaryProjectDTO]
    recent_activity: List[Dict[str, Any]]

    model_config = ConfigDict(from_attributes=True)
