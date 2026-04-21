from pydantic import BaseModel, ConfigDict
from typing import Any, Dict, List, Optional
from app.application.dtos.auth_dtos import UserListDTO


class TeamCreateDTO(BaseModel):
    name: str
    description: Optional[str] = None


class TeamMemberDTO(BaseModel):
    user_id: int


class TeamResponseDTO(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    owner_id: int
    members: List[UserListDTO] = []
    model_config = ConfigDict(from_attributes=True)


class TeamLeaderUpdateDTO(BaseModel):
    """D-17: PATCH /teams/{id}/leader leader_id only, Admin-only."""
    leader_id: Optional[int] = None  # nullable = allow clearing

    model_config = ConfigDict(extra="forbid")  # reject extra keys (T-09-09-06 mitigation)


class LedTeamDTO(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class LedTeamsResponseDTO(BaseModel):
    teams: List[Dict[str, Any]]
    project_ids: List[int]
