"""Phase 14 Plan 14-01 — ProjectJoinRequest domain entity (D-A1).

Pure Pydantic — ZERO infrastructure imports. The status enum is a Pydantic
Literal (NOT a Python Enum) per RESEARCH §Code Example 2 to keep the entity
free of Python-Enum import overhead and to match the projects.status precedent
(Phase 9 BACK-01 stores ProjectStatus as VARCHAR(20)).

State machine: pending → approved | rejected | cancelled. Approval triggers
the team_repo.add_member side-effect; the use case orchestrates the transition.
Rejected and cancelled rows remain in the table for audit purposes — FK ON DELETE
SET NULL on the user columns preserves the historical record after user deletion.
"""
from __future__ import annotations
from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from datetime import datetime

JoinRequestStatus = Literal["pending", "approved", "rejected", "cancelled"]


class ProjectJoinRequest(BaseModel):
    id: Optional[int] = None
    project_id: int
    requested_by_user_id: int
    target_user_id: int
    status: JoinRequestStatus = "pending"
    note: Optional[str] = None
    reviewed_by_admin_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
