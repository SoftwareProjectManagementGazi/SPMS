from pydantic import BaseModel, ConfigDict
from typing import Optional , List
from datetime import datetime
from app.domain.entities.project import Methodology
from app.domain.entities.board_column import BoardColumn

class ProjectCreateDTO(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    methodology: Methodology

class ProjectUpdateDTO(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    methodology: Optional[Methodology] = None

class ProjectResponseDTO(BaseModel):
    id: int
    name: str
    description: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    methodology: Methodology
    manager_id: int
    created_at: datetime
    
    columns: List[BoardColumn] = []

    model_config = ConfigDict(from_attributes=True)
