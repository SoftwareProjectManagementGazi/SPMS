"""BACK-05 Artifact domain entity.

D-26: linked_phase_id is nullable (project-scoped artifact allowed).
D-41: file_id reuses v1.0 files table — one file per artifact in v2.0.
"""
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum
from app.domain.entities.task import NODE_ID_REGEX  # D-22 regex reuse


class ArtifactStatus(str, Enum):
    NOT_CREATED = "not_created"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    APPROVED = "approved"


class Artifact(BaseModel):
    id: Optional[int] = None
    project_id: int
    name: str
    status: ArtifactStatus = ArtifactStatus.NOT_CREATED
    assignee_id: Optional[int] = None
    linked_phase_id: Optional[str] = None  # D-26: nullable
    note: Optional[str] = None
    file_id: Optional[int] = None  # D-41: FK files(id), nullable
    version: int = 1
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_deleted: bool = False

    @field_validator("linked_phase_id")
    @classmethod
    def validate_phase_id_format(cls, v):
        if v is None:
            return v
        if not NODE_ID_REGEX.match(v):
            raise ValueError(f"Invalid linked_phase_id format: {v!r}")
        return v

    model_config = ConfigDict(from_attributes=True)
