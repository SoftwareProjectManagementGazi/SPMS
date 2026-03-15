from pydantic import BaseModel, ConfigDict
from typing import Optional , List, Dict, Any
from datetime import datetime
from app.domain.entities.project import Methodology
from app.domain.entities.board_column import BoardColumn


class ProjectMemberDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    avatar_path: Optional[str] = None
    role_name: str
    is_current_member: bool = True

class ProjectCreateDTO(BaseModel):
    key: str
    name: str
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    methodology: Methodology
    columns: List[str] = ["Backlog", "Todo", "In Progress", "In Review", "Done"]
    custom_fields: Optional[Dict[str, Any]] = None

class ProjectUpdateDTO(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    methodology: Optional[Methodology] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ProjectResponseDTO(BaseModel):
    id: int
    key: str
    name: str
    description: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    methodology: Methodology
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    manager_avatar: Optional[str] = None
    created_at: datetime

    columns: List[BoardColumn] = []
    custom_fields: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)
