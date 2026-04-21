import re
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
# Importlar
from app.domain.entities.board_column import BoardColumn
from app.domain.entities.project import Project
# User entity'sini import ediyoruz (Assignee için)
from app.domain.entities.user import User

# D-22: `nd_` + 10 URL-safe chars (A-Z, a-z, 0-9, _, -). Nanoid(10) alphabet match.
NODE_ID_REGEX = re.compile(r"^nd_[A-Za-z0-9_-]{10}$")

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
    recurrence_interval: Optional[str] = None
    recurrence_end_date: Optional[datetime] = None
    recurrence_count: Optional[int] = None
    task_key: Optional[str] = None
    series_id: Optional[str] = None

    project_id: int
    sprint_id: Optional[int] = None
    column_id: Optional[int] = None
    phase_id: Optional[str] = None  # D-22 / BACK-02; format-validated below
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

    @field_validator("phase_id")
    @classmethod
    def validate_phase_id_format(cls, v):
        if v is None:
            return v
        if not NODE_ID_REGEX.match(v):
            raise ValueError(
                f"Invalid phase_id format: expected 'nd_' followed by 10 URL-safe chars, got {v!r}"
            )
        return v

    model_config = ConfigDict(from_attributes=True)

# Döngüsel referansları çöz
Task.model_rebuild()