from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.domain.entities.task import TaskPriority

class TaskCreateDTO(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    points: Optional[int] = None
    is_recurring: bool = False
    
    project_id: int
    sprint_id: Optional[int] = None
    column_id: Optional[int] = None
    assignee_id: Optional[int] = None
    reporter_id: Optional[int] = None
    parent_task_id: Optional[int] = None

class TaskUpdateDTO(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    points: Optional[int] = None
    is_recurring: Optional[bool] = None
    
    sprint_id: Optional[int] = None
    column_id: Optional[int] = None
    assignee_id: Optional[int] = None
    reporter_id: Optional[int] = None
    parent_task_id: Optional[int] = None

class TaskResponseDTO(BaseModel):
    id: int
    title: str
    description: Optional[str]
    priority: TaskPriority
    due_date: Optional[datetime]
    points: Optional[int]
    is_recurring: bool
    
    project_id: int
    sprint_id: Optional[int]
    column_id: Optional[int]
    assignee_id: Optional[int]
    reporter_id: Optional[int]
    parent_task_id: Optional[int]
    
    created_at: datetime
    updated_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)
