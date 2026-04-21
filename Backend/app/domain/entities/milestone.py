"""Phase 9 BACK-04: Milestone domain entity.

JSON linked_phase_ids is an array of workflow node IDs (D-24). Empty list valid.
Phase ID format regex matches Task.phase_id (D-22). Cross-entity reference to
project.process_config.workflow.nodes; validated in use case, not entity.
"""
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class MilestoneStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DELAYED = "delayed"


class Milestone(BaseModel):
    id: Optional[int] = None
    project_id: int
    name: str
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    status: MilestoneStatus = MilestoneStatus.PENDING
    linked_phase_ids: List[str] = Field(default_factory=list)  # D-24
    version: int = 1
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_deleted: bool = False

    model_config = ConfigDict(from_attributes=True)
