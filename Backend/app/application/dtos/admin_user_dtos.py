"""Phase 14 Plan 14-01 — Admin user-management DTOs (D-A6 / D-B2 / D-B4 / D-B7).

DIP — pure Pydantic; no infrastructure imports. Server-side caps via
`Field(max_length=...)` (Pydantic v2 replaced max_items with max_length for lists).
"""
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# D-A6 role enum — system-wide flat role (NOT per-project; per-project PM-ness
# is managed via Team.leader_id, Phase 9). RBAC integration deferred to v3.0.
AdminRole = Literal["Admin", "Project Manager", "Member"]


class InviteUserRequestDTO(BaseModel):
    email: EmailStr
    role: AdminRole
    name: Optional[str] = Field(default=None, max_length=100)
    team_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class InviteUserResponseDTO(BaseModel):
    user_id: int
    email: str
    invite_token_expires_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BulkInviteRowDTO(BaseModel):
    """Single row in a bulk-invite CSV upload. Mirrors client-side csv-parse.ts
    BulkInviteRow interface — Pitfall 5 single-source-of-truth (Pydantic wins
    in case of divergence)."""
    email: EmailStr
    name: Optional[str] = Field(default=None, max_length=100)
    role: AdminRole

    model_config = ConfigDict(from_attributes=True)


class BulkInviteRequestDTO(BaseModel):
    """D-B4: 500-row server-side hard cap (DoS guard). Even if the frontend
    enforces it client-side, the backend MUST validate (defense in depth)."""
    rows: List[BulkInviteRowDTO] = Field(default_factory=list, max_length=500)

    model_config = ConfigDict(from_attributes=True)


class BulkInviteRowFailureDTO(BaseModel):
    row_number: int
    email: Optional[str] = None
    errors: List[str]

    model_config = ConfigDict(from_attributes=True)


class BulkInviteResponseDTO(BaseModel):
    """{successful: [...], failed: [...]} pattern from D-B4."""
    successful: List[InviteUserResponseDTO]
    failed: List[BulkInviteRowFailureDTO]

    model_config = ConfigDict(from_attributes=True)


class RoleChangeRequestDTO(BaseModel):
    """PATCH /admin/users/{id}/role body."""
    role: AdminRole

    model_config = ConfigDict(from_attributes=True)


class BulkActionRequestDTO(BaseModel):
    """POST /admin/users/bulk-action body — D-B7. Per-user transaction; audit
    row written per user (NOT per batch)."""
    user_ids: List[int] = Field(default_factory=list, max_length=500)
    action: Literal["deactivate", "activate", "role_change"]
    payload: Optional[Dict[str, Any]] = None  # e.g., {"role": "Member"} for role_change

    model_config = ConfigDict(from_attributes=True)


class BulkActionResultDTO(BaseModel):
    """Per-user outcome for the bulk-action response."""
    user_id: int
    status: Literal["success", "failed"]
    error: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BulkActionResponseDTO(BaseModel):
    results: List[BulkActionResultDTO]
    success_count: int
    failed_count: int

    model_config = ConfigDict(from_attributes=True)


class AdminUserListItemDTO(BaseModel):
    """Phase 14 Plan 14-03 — admin-scoped user list row.

    Richer than UserListDTO (which lacks role + is_active) — surfaces the
    role name and active state directly so the Frontend2 admin Users tab
    can render role badges and status dots without a second lookup.
    """
    id: int
    email: str
    full_name: str
    avatar: Optional[str] = None
    is_active: bool = True
    role: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AdminUserListResponseDTO(BaseModel):
    """{items, total} paged shape — Plan 14-03 frontend consumes this."""
    items: List[AdminUserListItemDTO]
    total: int

    model_config = ConfigDict(from_attributes=True)
