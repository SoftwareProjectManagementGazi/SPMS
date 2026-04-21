"""BACK-04 Milestone DTOs."""
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Optional
from datetime import datetime
from app.domain.entities.milestone import MilestoneStatus
from app.domain.entities.task import NODE_ID_REGEX  # D-22 regex reused


def _validate_phase_id_list(v: List[str]) -> List[str]:
    """Format-validate each phase_id; raise ValueError on bad format. Existence vs workflow nodes is in use case."""
    for pid in v:
        if not NODE_ID_REGEX.match(pid):
            raise ValueError(f"Invalid phase_id format: {pid!r} (expected 'nd_' followed by 10 URL-safe chars)")
    return v


class MilestoneCreateDTO(BaseModel):
    project_id: int
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    status: MilestoneStatus = MilestoneStatus.PENDING
    linked_phase_ids: List[str] = Field(default_factory=list)

    @field_validator("linked_phase_ids")
    @classmethod
    def validate_phase_ids_format(cls, v):
        return _validate_phase_id_list(v)


class MilestoneUpdateDTO(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    status: Optional[MilestoneStatus] = None
    linked_phase_ids: Optional[List[str]] = None

    @field_validator("linked_phase_ids")
    @classmethod
    def validate_phase_ids_format(cls, v):
        if v is None:
            return v
        return _validate_phase_id_list(v)


class MilestoneResponseDTO(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    status: MilestoneStatus
    linked_phase_ids: List[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
