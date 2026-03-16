from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime


class NotificationPreference(BaseModel):
    id: Optional[int] = None
    user_id: int
    preferences: Dict[str, Any] = {}
    # Shape: {"TASK_ASSIGNED": {"in_app": true, "email": true}, ...}
    email_enabled: bool = True
    deadline_days: int = 1  # 1, 2, 3, or 7
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
