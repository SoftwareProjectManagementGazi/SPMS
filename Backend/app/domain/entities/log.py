from pydantic import BaseModel, ConfigDict, Json
from typing import Optional, Any, Dict
from datetime import datetime

class Log(BaseModel):
    id: Optional[int] = None
    project_id: int
    user_id: Optional[int] = None
    action: str
    changes: Optional[Dict[str, Any]] = None # Using Dict instead of Json for Pydantic model usage
    timestamp: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
