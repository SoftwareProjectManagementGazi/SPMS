from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Generic, TypeVar
from datetime import datetime
from app.domain.entities.task import TaskPriority

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int

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
    priority: TaskPriority # Added priority
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
    recurrence_interval: Optional[str] = None
    recurrence_end_date: Optional[datetime] = None
    recurrence_count: Optional[int] = None
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
    status: str = "todo"  # Computed by UseCase from column name; default avoids validation errors when model_validate is called directly on Task entities
    due_date: Optional[datetime] = None
    points: Optional[int] = None
    is_recurring: bool
    task_key: Optional[str] = None
    
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


# Phase 3: Task dependency DTOs

class TaskDependencyCreateDTO(BaseModel):
    task_id: int
    depends_on_id: int
    dependency_type: str = "blocks"


class TaskDependencySummaryDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    depends_on_id: int
    dependency_type: str
    # resolved task info for display
    depends_on_key: Optional[str] = None
    depends_on_title: Optional[str] = None