"""BACK-05 Artifact DTOs."""
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime
from app.domain.entities.artifact import ArtifactStatus
from app.domain.entities.task import NODE_ID_REGEX


def _validate_phase_id(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    if not NODE_ID_REGEX.match(v):
        raise ValueError(f"Invalid linked_phase_id format: {v!r}")
    return v


class ArtifactCreateDTO(BaseModel):
    project_id: int
    name: str = Field(min_length=1, max_length=200)
    status: ArtifactStatus = ArtifactStatus.NOT_CREATED
    assignee_id: Optional[int] = None
    linked_phase_id: Optional[str] = None
    note: Optional[str] = None
    file_id: Optional[int] = None

    @field_validator("linked_phase_id")
    @classmethod
    def v(cls, x):
        return _validate_phase_id(x)


class ArtifactUpdateByAssigneeDTO(BaseModel):
    """D-36: Assignee can update ONLY these fields on their own artifact."""
    status: Optional[ArtifactStatus] = None
    note: Optional[str] = None
    file_id: Optional[int] = None
    # NOTE: assignee_id INTENTIONALLY omitted -- assignee cannot reassign


class ArtifactUpdateByManagerDTO(BaseModel):
    """D-36: Admin/PM/TL can update any field including assignee_id."""
    name: Optional[str] = None
    status: Optional[ArtifactStatus] = None
    assignee_id: Optional[int] = None
    linked_phase_id: Optional[str] = None
    note: Optional[str] = None
    file_id: Optional[int] = None

    @field_validator("linked_phase_id")
    @classmethod
    def v(cls, x):
        return _validate_phase_id(x)


class ArtifactResponseDTO(BaseModel):
    id: int
    project_id: int
    name: str
    status: ArtifactStatus
    assignee_id: Optional[int] = None
    linked_phase_id: Optional[str] = None
    note: Optional[str] = None
    file_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
