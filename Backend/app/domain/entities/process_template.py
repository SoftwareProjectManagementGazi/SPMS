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
    # Wave 2 W2-C9 — engine-aware default column specs (category, is_initial,
    # is_terminal, max_duration_days, entry_policy, exit_policy). Read by
    # CreateProjectUseCase (W2-C10) when seeding columns for new projects;
    # legacy ``columns`` field above stays as a read fallback.
    default_columns: Optional[List[Dict[str, Any]]] = None  # W2-C9

    model_config = ConfigDict(from_attributes=True)
