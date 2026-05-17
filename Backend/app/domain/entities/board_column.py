from pydantic import BaseModel, ConfigDict
from typing import Literal, Optional


# Phase 17 — workflow engine field enums.
# Using Literal[...] keeps the Domain layer pure (no extra deps) while still
# giving Pydantic runtime validation. The engine (C5+) reads these to decide
# which transitions are allowed and which columns are 'start' / 'done' states.
ColumnCategory = Literal["todo", "in_progress", "done"]
EntryPolicy = Literal["any", "edges_only", "initial_only"]
ExitPolicy = Literal["any", "edges_only", "terminal_lock"]


class BoardColumn(BaseModel):
    id: Optional[int] = None
    project_id: Optional[int] = None
    name: str
    order_index: int
    wip_limit: int = 0

    # Phase 17 — workflow engine fields (migration 013, C4 commit).
    # Defaults match the DB-level server_default in 013_board_column_extended,
    # so an entity built without these fields lands in the same state the
    # backfill UPDATE would produce.
    category: ColumnCategory = "todo"
    is_initial: bool = False
    is_terminal: bool = False
    max_duration_days: Optional[int] = None
    entry_policy: EntryPolicy = "any"
    exit_policy: ExitPolicy = "any"

    model_config = ConfigDict(from_attributes=True)
