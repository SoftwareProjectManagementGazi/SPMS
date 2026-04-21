"""API-02 Activity feed DTOs."""
from pydantic import BaseModel, ConfigDict
from typing import Any, Dict, List, Optional
from datetime import datetime


class ActivityItemDTO(BaseModel):
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
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class ActivityResponseDTO(BaseModel):
    items: List[ActivityItemDTO]
    total: int

    model_config = ConfigDict(from_attributes=True)
