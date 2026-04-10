from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProcessTemplate(BaseModel):
    id: Optional[int] = None
    name: str
    is_builtin: bool = False
    columns: List[Dict[str, Any]] = []
    recurring_tasks: List[Dict[str, Any]] = []
    behavioral_flags: Dict[str, Any] = {}
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
