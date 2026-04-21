"""BACK-06 PhaseReport domain entity.

D-25: cycle_number auto-calc from audit_log, revision auto-increment on PATCH.
D-40: completed_tasks_notes is a dict {"task_123": "note", ...}.
"""
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Dict, Optional
from datetime import datetime
from app.domain.entities.task import NODE_ID_REGEX


class PhaseReport(BaseModel):
    id: Optional[int] = None
    project_id: int
    phase_id: str
    cycle_number: int = 1  # D-25: may be auto-calculated by use case
    revision: int = 1  # D-25: increments on PATCH
    summary_task_count: Optional[int] = None
    summary_done_count: Optional[int] = None
    summary_moved_count: Optional[int] = None
    summary_duration_days: Optional[int] = None
    completed_tasks_notes: Dict[str, str] = Field(default_factory=dict)  # D-40
    issues: Optional[str] = None
    lessons: Optional[str] = None
    recommendations: Optional[str] = None
    created_by: Optional[int] = None
    version: int = 1
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_deleted: bool = False

    @field_validator("phase_id")
    @classmethod
    def validate_phase_id_format(cls, v):
        if not NODE_ID_REGEX.match(v):
            raise ValueError(f"Invalid phase_id format: {v!r}")
        return v

    model_config = ConfigDict(from_attributes=True)
