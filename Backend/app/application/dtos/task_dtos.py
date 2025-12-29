from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.domain.entities.task import TaskStatus, TaskPriority

class TaskCreateDTO(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    project_id: int
    assignee_id: Optional[int] = None

class TaskUpdateDTO(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    assignee_id: Optional[int] = None

class TaskResponseDTO(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[datetime]
    project_id: int
    assignee_id: Optional[int]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
