from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class BoardColumnDTO(BaseModel):
    id: int
    project_id: int
    name: str
    order_index: int
    wip_limit: int = 0
    task_count: int = 0  # computed from repo.count_tasks
    model_config = ConfigDict(from_attributes=True)


class CreateColumnDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    order_index: int = Field(ge=0)


class UpdateColumnDTO(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    order_index: Optional[int] = Field(None, ge=0)
    # Phase 11 Plan 04: Settings > Kolonlar sub-tab edits wip_limit inline.
    # wip_limit=0 in this column schema means "no limit" (see seeder + migration 005).
    # ge=0 allows 0 (no limit) and any positive cap.
    wip_limit: Optional[int] = Field(None, ge=0)


class DeleteColumnRequestDTO(BaseModel):
    move_tasks_to_column_id: int  # required — tasks must be reassigned
