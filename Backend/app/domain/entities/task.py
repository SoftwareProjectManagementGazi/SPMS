from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
# Importlar
from app.domain.entities.board_column import BoardColumn 
from app.domain.entities.project import Project
# User entity'sini import ediyoruz (Assignee için)
from app.domain.entities.user import User

class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class TaskStatus(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    REVIEW = "REVIEW"

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
    
    # --- İLİŞKİSEL ALANLAR ---
    parent: Optional['Task'] = None 
    
    # EKSİK ALAN 1: Subtasks (Alt Görevler)
    # Repository'de manuel mapping ile dolduruyoruz, burada tanımlı olmalı.
    subtasks: List['Task'] = Field(default_factory=list)

    column: Optional[BoardColumn] = None 
    project: Optional[Project] = None
    
    # EKSİK ALAN 2: Assignee (Atanan Kişi)
    # Repository'de "assignee": model.assignee ile gönderiyoruz.
    assignee: Optional[User] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Döngüsel referansları çöz
Task.model_rebuild()