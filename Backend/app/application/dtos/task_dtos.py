from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.domain.entities.task import TaskPriority

class ProjectSummaryDTO(BaseModel):
    id: int
    name: str
    key: str
    model_config = ConfigDict(from_attributes=True)


class UserSummaryDTO(BaseModel):
    id: int
    email: str
    username: str 
    avatar_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)    

class ParentTaskSummaryDTO(BaseModel):
    id: int
    title: str
    key: str
    status: str
    project_id: int
    model_config = ConfigDict(from_attributes=True)

# YENİ: Alt görev özeti için DTO
class SubTaskSummaryDTO(BaseModel):
    id: int
    title: str
    key: str
    status: str
    priority: TaskPriority
    model_config = ConfigDict(from_attributes=True)

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
    description: Optional[str] = None
    priority: TaskPriority
    status: str  # Artık UseCase tarafından hesaplanıp buraya string olarak konacak
    due_date: Optional[datetime] = None
    points: Optional[int] = None
    is_recurring: bool
    
    project_id: int
    project: Optional[ProjectSummaryDTO] = None
    
    sprint_id: Optional[int] = None
    column_id: Optional[int] = None
    assignee_id: Optional[int] = None
    assignee: Optional[UserSummaryDTO] = None
    reporter_id: Optional[int] = None
    parent_task_id: Optional[int] = None

    parent_task_summary: Optional[ParentTaskSummaryDTO] = None
    # YENİ: Alt görevler listesi
    sub_tasks: List[SubTaskSummaryDTO] = []

    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    # compute_data validatörü TAMAMEN SİLİNDİ.