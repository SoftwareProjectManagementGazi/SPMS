from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum
# BoardColumn entity'sini import ediyoruz (Dosya yoluna dikkat edin)
from app.domain.entities.board_column import BoardColumn 
from app.domain.entities.project import Project

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
    
    # --- İLİŞKİSEL ALANLAR (DB'den join ile gelen veriler) ---
    # Self-referencing (Kendini referans alan) alan için string 'Task' kullanılır
    parent: Optional['Task'] = None 
    
    # İŞTE CEVAP: column_id sadece ID'yi tutar (örn: 5).
    # column alanı ise o ID'nin detaylarını (örn: Adı="Done") tutar.
    column: Optional[BoardColumn] = None 
    
    project: Optional[Project] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Döngüsel referansı çöz
Task.model_rebuild()