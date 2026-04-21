"""BACK-06 PhaseReport DTOs.

Note: revision is NOT a client-editable field — auto-increments on PATCH (D-25).
cycle_number accepts explicit value (admin override) else auto-calculated (D-25).
"""
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Dict, Optional
from datetime import datetime
from app.domain.entities.task import NODE_ID_REGEX


def _v_phase_id(v):
    if not NODE_ID_REGEX.match(v):
        raise ValueError(f"Invalid phase_id format: {v!r}")
    return v


class PhaseReportCreateDTO(BaseModel):
    project_id: int
    phase_id: str
    cycle_number: Optional[int] = None  # None → auto-calc (D-25)
    summary_task_count: Optional[int] = None
    summary_done_count: Optional[int] = None
    summary_moved_count: Optional[int] = None
    summary_duration_days: Optional[int] = None
    completed_tasks_notes: Dict[str, str] = {}
    issues: Optional[str] = None
    lessons: Optional[str] = None
    recommendations: Optional[str] = None

    @field_validator("phase_id")
    @classmethod
    def v(cls, x):
        return _v_phase_id(x)


class PhaseReportUpdateDTO(BaseModel):
    """PATCH fields. revision is auto-incremented by use case. cycle_number and
    phase_id are immutable (for analytics consistency)."""
    summary_task_count: Optional[int] = None
    summary_done_count: Optional[int] = None
    summary_moved_count: Optional[int] = None
    summary_duration_days: Optional[int] = None
    completed_tasks_notes: Optional[Dict[str, str]] = None
    issues: Optional[str] = None
    lessons: Optional[str] = None
    recommendations: Optional[str] = None


class PhaseReportResponseDTO(BaseModel):
    id: int
    project_id: int
    phase_id: str
    cycle_number: int
    revision: int
    summary_task_count: Optional[int] = None
    summary_done_count: Optional[int] = None
    summary_moved_count: Optional[int] = None
    summary_duration_days: Optional[int] = None
    completed_tasks_notes: Dict[str, str]
    issues: Optional[str] = None
    lessons: Optional[str] = None
    recommendations: Optional[str] = None
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
