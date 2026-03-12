from pydantic import BaseModel, ConfigDict
from typing import Optional, List
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
