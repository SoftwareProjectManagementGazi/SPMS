from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class Comment(BaseModel):
    id: Optional[int] = None
    task_id: int
    user_id: int
    content: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
