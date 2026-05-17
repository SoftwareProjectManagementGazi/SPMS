from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Optional


# Phase 17 — workflow engine field enums (mirror domain entity Literals).
# We re-declare them here so the DTO layer does not import from Domain — keeps
# the Application layer's surface API self-describing.
ColumnCategory = Literal["todo", "in_progress", "done"]
EntryPolicy = Literal["any", "edges_only", "initial_only"]
ExitPolicy = Literal["any", "edges_only", "terminal_lock"]


class BoardColumnDTO(BaseModel):
    id: int
    project_id: int
    name: str
    order_index: int
    wip_limit: int = 0
    task_count: int = 0  # computed from repo.count_tasks

    # Phase 17 — workflow engine fields (defaults match BoardColumn entity).
    category: ColumnCategory = "todo"
    is_initial: bool = False
    is_terminal: bool = False
    max_duration_days: Optional[int] = None
    entry_policy: EntryPolicy = "any"
    exit_policy: ExitPolicy = "any"

    model_config = ConfigDict(from_attributes=True)


class CreateColumnDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    order_index: int = Field(ge=0)

    # Phase 17 — all optional so existing FE clients keep working unchanged.
    # When omitted, CreateColumnUseCase falls back to entity defaults.
    category: Optional[ColumnCategory] = None
    is_initial: Optional[bool] = None
    is_terminal: Optional[bool] = None
    max_duration_days: Optional[int] = Field(None, ge=1)
    entry_policy: Optional[EntryPolicy] = None
    exit_policy: Optional[ExitPolicy] = None


class UpdateColumnDTO(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    order_index: Optional[int] = Field(None, ge=0)
    # Phase 11 Plan 04: Settings > Kolonlar sub-tab edits wip_limit inline.
    # wip_limit=0 in this column schema means "no limit" (see seeder + migration 005).
    # ge=0 allows 0 (no limit) and any positive cap.
    wip_limit: Optional[int] = Field(None, ge=0)

    # Phase 17 — workflow engine PATCH fields. None means "leave unchanged"
    # per the existing UpdateColumnUseCase patch semantics. max_duration_days
    # accepts 0 / negative? No — staleness less-than-a-day is nonsensical, so
    # ge=1 enforces a sane lower bound (use null to clear, set in use case).
    category: Optional[ColumnCategory] = None
    is_initial: Optional[bool] = None
    is_terminal: Optional[bool] = None
    max_duration_days: Optional[int] = Field(None, ge=1)
    entry_policy: Optional[EntryPolicy] = None
    exit_policy: Optional[ExitPolicy] = None


class DeleteColumnRequestDTO(BaseModel):
    move_tasks_to_column_id: int  # required — tasks must be reassigned
