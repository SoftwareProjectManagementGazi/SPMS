from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.domain.entities.project import Methodology

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
    
    model_config = ConfigDict(from_attributes=True)
