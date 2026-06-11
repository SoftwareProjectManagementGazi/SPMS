from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProcessTemplateCreateDTO(BaseModel):
    name: str
    columns: List[Dict[str, Any]] = []
    recurring_tasks: List[Dict[str, Any]] = []
    behavioral_flags: Dict[str, Any] = {}
    description: Optional[str] = None
    # Workflow graph + template defaults — needed so clones are full copies.
    default_workflow: Optional[Dict[str, Any]] = None
    default_columns: Optional[List[Dict[str, Any]]] = None
    default_phase_criteria: Optional[Dict[str, Any]] = None
    default_artifacts: Optional[List[Dict[str, Any]]] = None
    cycle_label_tr: Optional[str] = None
    cycle_label_en: Optional[str] = None


class ProcessTemplateUpdateDTO(BaseModel):
    name: Optional[str] = None
    columns: Optional[List[Dict[str, Any]]] = None
    recurring_tasks: Optional[List[Dict[str, Any]]] = None
    behavioral_flags: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    # Lifecycle graph from the admin editor; shape-validated in the use case.
    default_workflow: Optional[Dict[str, Any]] = None


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
    # {mode, nodes, edges, groups[, capabilities]} graph + template defaults.
    default_workflow: Optional[Dict[str, Any]] = None
    default_columns: Optional[List[Dict[str, Any]]] = None
    default_phase_criteria: Optional[Dict[str, Any]] = None
    default_artifacts: Optional[List[Dict[str, Any]]] = None
    cycle_label_tr: Optional[str] = None
    cycle_label_en: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
