from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    TASK_ASSIGNED = "TASK_ASSIGNED"
    COMMENT_ADDED = "COMMENT_ADDED"
    DEADLINE_APPROACHING = "DEADLINE_APPROACHING"
    PROJECT_UPDATE = "PROJECT_UPDATE"

class Notification(BaseModel):
    id: Optional[int] = None
    user_id: int
    message: str
    type: NotificationType
    is_read: bool = False
    related_entity_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
