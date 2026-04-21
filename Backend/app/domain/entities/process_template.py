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
    # Phase 9 additions:
    default_artifacts: Optional[List[Dict[str, Any]]] = None  # D-27
    default_phase_criteria: Optional[Dict[str, Any]] = None  # D-27
    default_workflow: Optional[Dict[str, Any]] = None  # D-27
    cycle_label_tr: Optional[str] = None  # D-43
    cycle_label_en: Optional[str] = None  # D-43

    model_config = ConfigDict(from_attributes=True)
