"""API-01 / D-04 Phase Gate request and response DTOs."""
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Literal, Optional
from app.domain.entities.task import NODE_ID_REGEX


OpenTasksAction = Literal["move_to_next", "move_to_backlog", "keep_in_source"]


class TaskException(BaseModel):
    task_id: int
    action: OpenTasksAction


class PhaseTransitionRequestDTO(BaseModel):
    source_phase_id: str
    target_phase_id: str
    open_tasks_action: OpenTasksAction = "move_to_next"
    exceptions: List[TaskException] = Field(default_factory=list)
    note: Optional[str] = None
    allow_override: bool = False

    @field_validator("source_phase_id", "target_phase_id")
    @classmethod
    def v(cls, v):
        if not NODE_ID_REGEX.match(v):
            raise ValueError(f"Invalid phase id format: {v!r}")
        return v


class CriterionResult(BaseModel):
    check: str
    passed: bool
    detail: Optional[str] = None


class PhaseTransitionResponseDTO(BaseModel):
    moved_count: int
    override_used: bool
    unmet_criteria: List[CriterionResult] = []
    source_phase_id: str
    target_phase_id: str

    model_config = ConfigDict(from_attributes=True)
