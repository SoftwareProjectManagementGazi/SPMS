"""Label DTOs — Phase 11 D-51.

Analog: app.application.dtos.board_column_dtos.

No Update DTO in Phase 11 (no PATCH /labels endpoint per CONTEXT scope).
"""
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class LabelCreateDTO(BaseModel):
    project_id: int
    name: str = Field(min_length=1, max_length=50)
    # null → use case applies default "#94a3b8"; frontend may hash-derive and pass explicit value.
    color: Optional[str] = Field(default=None, max_length=12)


class LabelResponseDTO(BaseModel):
    id: int
    project_id: int
    name: str
    color: str
    usage_count: int = 0

    model_config = ConfigDict(from_attributes=True)
