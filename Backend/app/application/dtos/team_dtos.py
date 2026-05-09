from pydantic import BaseModel, ConfigDict, Field
from typing import Any, Dict, List, Optional
from datetime import datetime
from app.application.dtos.auth_dtos import UserListDTO


class TeamCreateDTO(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = Field(default="#3b82f6", pattern=r"^#[0-9a-fA-F]{6}$")
    department: Optional[str] = None
    leader_id: Optional[int] = None
    member_ids: List[int] = Field(default_factory=list)


class TeamUpdateDTO(BaseModel):
    """PATCH /teams/{id} — partial update of team fields."""
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    department: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class TeamMemberDTO(BaseModel):
    user_id: int


class TeamResponseDTO(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    owner_id: int
    leader_id: Optional[int] = None
    color: str = "#3b82f6"
    department: Optional[str] = None
    created_at: Optional[datetime] = None
    members: List[UserListDTO] = []
    # Aggregate counts (populated for list/detail endpoints):
    project_count: Optional[int] = None
    active_task_count: Optional[int] = None
    completion_rate: Optional[float] = None  # 0..1
    model_config = ConfigDict(from_attributes=True)


class TeamLeaderUpdateDTO(BaseModel):
    leader_id: Optional[int] = None
    model_config = ConfigDict(extra="forbid")


class LedTeamDTO(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class LedTeamsResponseDTO(BaseModel):
    teams: List[Dict[str, Any]]
    project_ids: List[int]


# ---- Yeni DTO'lar (stats / projects / activity) ----

class TeamsStatsDTO(BaseModel):
    """GET /teams/stats — sayfa üst stats stripi için tek seferde toplu sayım."""
    total_teams: int
    total_members: int
    active_tasks: int
    completion_rate: float  # 0..1


class TeamProjectDTO(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[float] = None  # 0..1
    member_count: int = 0
    model_config = ConfigDict(from_attributes=True)


class TeamActivityItemDTO(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    action: str          # "member_added" | "member_removed" | "project_assigned" | "task_completed" | ...
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    target_label: Optional[str] = None
    created_at: datetime