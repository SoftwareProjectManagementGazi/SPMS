from pydantic import BaseModel, ConfigDict, model_validator
from typing import Optional, Any
from datetime import datetime
from app.domain.entities.task import TaskPriority

# 1. YENİ: Proje Özet DTO'su (İsim taşımak için)
class ProjectSummaryDTO(BaseModel):
    id: int
    name: str
    key: str
    model_config = ConfigDict(from_attributes=True)

class ParentTaskSummaryDTO(BaseModel):
    id: int
    title: str
    key: str
    status: str
    project_id: int
    model_config = ConfigDict(from_attributes=True)

# ... (Create ve Update DTO'ları aynı kalsın) ...
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
    status: str = "todo" 
    due_date: Optional[datetime] = None
    points: Optional[int] = None
    is_recurring: bool
    
    project_id: int
    # 2. YENİ: Proje detaylarını taşıyacak alan
    project: Optional[ProjectSummaryDTO] = None
    
    sprint_id: Optional[int] = None
    column_id: Optional[int] = None
    assignee_id: Optional[int] = None
    reporter_id: Optional[int] = None
    parent_task_id: Optional[int] = None

    parent_task_summary: Optional[ParentTaskSummaryDTO] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode='before')
    @classmethod
    def compute_data(cls, data: Any) -> Any:
        data_dict = {}
        if hasattr(data, 'model_dump'):
            data_dict = data.model_dump()
        elif isinstance(data, dict):
            data_dict = data
        else:
            return data

        # Status Hesapla
        status_slug = "todo"
        if hasattr(data, 'column') and data.column:
             if hasattr(data.column, 'name'):
                 status_slug = data.column.name.lower().replace(" ", "-")
             elif isinstance(data.column, dict):
                 status_slug = data.column.get('name', 'todo').lower().replace(" ", "-")
        data_dict['status'] = status_slug

        # 3. YENİ: Proje Verisini Doldur
        if hasattr(data, 'project') and data.project:
            # Pydantic otomatik çevirecek ama explicit olmakta fayda var
            data_dict['project'] = data.project

        # Parent Summary Hesapla
        summary = None
        if hasattr(data, 'parent') and data.parent:
            project_key = "TASK"
            if hasattr(data.parent, 'project') and data.parent.project:
                project_key = data.parent.project.key
            
            task_key = f"{project_key}-{data.parent.id}"
            
            parent_status = "todo"
            if hasattr(data.parent, 'column') and data.parent.column:
                parent_status = data.parent.column.name.lower().replace(" ", "-")

            summary = ParentTaskSummaryDTO(
                id=data.parent.id,
                title=data.parent.title,
                key=task_key,
                status=parent_status,
                project_id=data.parent.project_id
            )
            
        data_dict['parent_task_summary'] = summary
        
        return data_dict