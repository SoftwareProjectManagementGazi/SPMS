from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from app.domain.entities.board_column import BoardColumn 
from app.domain.entities.project import Project

class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Task(BaseModel):
    id: Optional[int] = None
    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    points: Optional[int] = None
    is_recurring: bool = False
    
    project_id: int
    sprint_id: Optional[int] = None
    column_id: Optional[int] = None
    assignee_id: Optional[int] = None
    reporter_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    
    # İlişkisel Alanlar
    parent: Optional['Task'] = None 
    # YENİ: Alt görevler listesi (Default boş liste)
    subtasks: List['Task'] = Field(default_factory=list)
    
    column: Optional[BoardColumn] = None 
    project: Optional[Project] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

Task.model_rebuild()