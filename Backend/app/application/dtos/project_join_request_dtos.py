"""Phase 14 Plan 14-01 — ProjectJoinRequest DTOs (D-A1).

Inline submodels (project / user nested objects) per PATTERNS.md
recommendation — tight coupling with the join-request response shape rather
than reusing UserListDTO.

Snake_case field names throughout — matches the audit_log convention so the
frontend mapper can apply the standard snake → camel transform without
special-casing the join-request payload (Pitfall 2 caveat for audit metadata
does NOT apply to top-level DTO fields; only to extra_metadata).
"""
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict


class JoinRequestProjectDTO(BaseModel):
    """Inline project info embedded in join-request response."""
    id: int
    key: str
    name: str

    model_config = ConfigDict(from_attributes=True)


class JoinRequestUserDTO(BaseModel):
    """Inline user info — full_name and avatar_url are nullable to handle
    the FK ON DELETE SET NULL case (target user was deleted after the
    request was filed)."""
    id: int
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CreateJoinRequestDTO(BaseModel):
    """Body of POST /api/v1/projects/{project_id}/join-requests (PM-side create)."""
    project_id: int
    target_user_id: int
    note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class JoinRequestResponseDTO(BaseModel):
    """Response shape for create / approve / reject / list-pending endpoints."""
    id: int
    project: Optional[JoinRequestProjectDTO] = None
    requested_by: Optional[JoinRequestUserDTO] = None
    target_user: Optional[JoinRequestUserDTO] = None
    status: Literal["pending", "approved", "rejected", "cancelled"]
    note: Optional[str] = None
    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class JoinRequestListDTO(BaseModel):
    """Paginated wrapper for GET /api/v1/admin/join-requests."""
    items: List[JoinRequestResponseDTO]
    total: int

    model_config = ConfigDict(from_attributes=True)
