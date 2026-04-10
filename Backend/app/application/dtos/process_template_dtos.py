from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProcessTemplateCreateDTO(BaseModel):
    name: str
    columns: List[Dict[str, Any]] = []
    recurring_tasks: List[Dict[str, Any]] = []
    behavioral_flags: Dict[str, Any] = {}
    description: Optional[str] = None


class ProcessTemplateUpdateDTO(BaseModel):
    name: Optional[str] = None
    columns: Optional[List[Dict[str, Any]]] = None
    recurring_tasks: Optional[List[Dict[str, Any]]] = None
    behavioral_flags: Optional[Dict[str, Any]] = None
    description: Optional[str] = None


class ProcessTemplateResponseDTO(BaseModel):
    id: int
    name: str
    is_builtin: bool
    columns: List[Dict[str, Any]] = []
    recurring_tasks: List[Dict[str, Any]] = []
    behavioral_flags: Dict[str, Any] = {}
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
