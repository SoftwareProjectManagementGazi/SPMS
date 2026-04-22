"""Label domain entity — Phase 11 D-51 (project-scoped labels).

CLAUDE.md §2: Domain layer — pure Pydantic, zero framework dependencies.
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional


class Label(BaseModel):
    """Project-scoped task label.

    usage_count is denormalized: populated by the repository when returning
    list results (COUNT of task_labels rows referencing this label). It is
    not a persisted column on the LabelModel — Phase 11 D-51 reads it via
    a subquery join with the task_labels association table.
    """
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    project_id: int
    name: str
    color: str
    usage_count: int = 0
