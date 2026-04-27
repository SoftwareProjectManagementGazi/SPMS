"""Phase 14 Plan 14-01 — Admin audit DTOs (D-A8 / D-Z2 / Pitfall 6).

Reuses ActivityItemDTO shape (12 fields ending with metadata: Optional[Dict]).
Wrapper AdminAuditResponseDTO adds the truncated flag (Pitfall 6) so the
frontend can render an AlertBanner above the table when the actual audit_log
count exceeded the 50k visible-row hard cap.

Backward compat (D-D6): metadata field stays nullable; frontend gracefully
degrades for old audit rows pre-Plan 14-09 enrichment.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class AdminAuditItemDTO(BaseModel):
    id: int
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    entity_label: Optional[str] = None
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    timestamp: Optional[datetime] = None
    # Pitfall 8: backend uses extra_metadata Python attr but ships it as
    # `metadata` in the JSON wire shape (matches Phase 9 D-09 + activity_dtos.py).
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class AdminAuditResponseDTO(BaseModel):
    """Response wrapper carrying the Pitfall 6 truncated flag."""
    items: List[AdminAuditItemDTO]
    total: int
    truncated: bool

    model_config = ConfigDict(from_attributes=True)
