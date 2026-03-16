from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.domain.entities.notification import NotificationType


class NotificationResponseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    message: str
    type: NotificationType
    is_read: bool
    related_entity_id: Optional[int] = None
    related_entity_type: Optional[str] = None
    created_at: datetime


class NotificationListResponseDTO(BaseModel):
    notifications: List[NotificationResponseDTO]
    unread_count: int
    total: int


class NotificationPreferenceDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    # per-type prefs: {"TASK_ASSIGNED": {"in_app": true, "email": true}, ...}
    preferences: Dict[str, Any] = {}
    email_enabled: bool = True
    deadline_days: int = 1  # 1, 2, 3, or 7


class NotificationPreferenceUpdateDTO(BaseModel):
    preferences: Optional[Dict[str, Any]] = None
    email_enabled: Optional[bool] = None
    deadline_days: Optional[int] = None  # must be 1, 2, 3, or 7
